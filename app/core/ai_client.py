"""Resilient asynchronous HTTP client for AI platform interactions.

Encapsulates ``httpx.AsyncClient`` with:
* Connection pooling across requests.
* Strict configurable timeouts (connect, read, write, pool).
* Exponential-backoff retries on transient failures.
* Correlation-tracing header injection (``X-Correlation-ID``, ``X-Request-ID``).
* Circuit-breaker protection through ``CircuitBreaker``.

Usage
-----
    from apps.core.ai_client import ai_client

    response = await ai_client.post("/api/v1/predict", request_envelope)
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from typing import Any, Dict, Optional

import httpx

from apps.core.config import settings
from apps.core.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerOpenException,
    ai_platform_circuit_breaker,
)

logger = logging.getLogger("iob.ai.client")


class ResilientAIClient:
    """Centralised resilient HTTP client for AI microservice interactions.

    Parameters
    ----------
    base_url
        Root URL of the AI platform.  Defaults to ``settings.AI_PLATFORM_URL``.
    timeout
        Total request timeout in seconds.  Defaults to
        ``settings.AI_CLIENT_TIMEOUT``.
    circuit_breaker
        Shared ``CircuitBreaker`` instance.  A module-level singleton is
        provided as the default.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
        circuit_breaker: Optional[CircuitBreaker] = None,
    ) -> None:
        self.base_url = (base_url or settings.AI_PLATFORM_URL).rstrip("/")
        self.timeout = httpx.Timeout(
            timeout or settings.AI_CLIENT_TIMEOUT,
            connect=5.0,
            pool=5.0,
        )
        self.circuit_breaker = circuit_breaker or ai_platform_circuit_breaker

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def post(
        self,
        endpoint: str,
        payload: Dict[str, Any],
        correlation_id: Optional[str] = None,
        retries: int = 3,
    ) -> Dict[str, Any]:
        """POST *payload* to *endpoint* with resilience guarantees.

        Parameters
        ----------
        endpoint
            Path relative to ``base_url`` (e.g. ``/api/v1/predict``).
        payload
            JSON-serialisable request body.
        correlation_id
            Distributed tracing identifier.  Auto-generated if omitted.
        retries
            Maximum number of HTTP attempts before giving up (default 3).

        Returns
        -------
        dict
            The JSON response body.

        Raises
        ------
        CircuitBreakerOpenException
            Circuit is OPEN and recovery window has not elapsed.
        httpx.HTTPStatusError
            All retries exhausted with non-2xx status.
        httpx.RequestError
            All retries exhausted with a network-level error.
        """
        correlation_id = correlation_id or str(uuid.uuid4())
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        async def _execute() -> Dict[str, Any]:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = self._build_headers(correlation_id)

                for attempt in range(1, retries + 1):
                    try:
                        response = await client.post(
                            url, json=payload, headers=headers
                        )
                        response.raise_for_status()
                        return response.json()
                    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
                        logger.warning(
                            "AI Platform request failed (attempt %d/%d) "
                            "on %s: %s",
                            attempt,
                            retries,
                            url,
                            exc,
                        )
                        if attempt == retries:
                            raise
                        await asyncio.sleep(0.5 * (2 ** (attempt - 1)))

        try:
            return await self.circuit_breaker.call(_execute)
        except CircuitBreakerOpenException:
            logger.error("Circuit breaker OPEN — blocking request to %s", url)
            raise

    async def get(
        self,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
        retries: int = 2,
    ) -> Dict[str, Any]:
        """GET *endpoint* with resilience guarantees.

        Same contract as :meth:`post` but uses GET verb and query parameters.
        """
        correlation_id = correlation_id or str(uuid.uuid4())
        url = f"{self.base_url}/{endpoint.lstrip('/')}"

        async def _execute() -> Dict[str, Any]:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = self._build_headers(correlation_id)

                for attempt in range(1, retries + 1):
                    try:
                        response = await client.get(
                            url, params=params, headers=headers
                        )
                        response.raise_for_status()
                        return response.json()
                    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
                        logger.warning(
                            "AI Platform GET failed (attempt %d/%d) "
                            "on %s: %s",
                            attempt,
                            retries,
                            url,
                            exc,
                        )
                        if attempt == retries:
                            raise
                        await asyncio.sleep(0.5 * (2 ** (attempt - 1)))

        try:
            return await self.circuit_breaker.call(_execute)
        except CircuitBreakerOpenException:
            logger.error("Circuit breaker OPEN — blocking GET %s", url)
            raise

    async def check_health(self) -> bool:
        """Ping the AI platform health endpoint.

        Returns ``True`` when the platform responds with HTTP 200.
        This method is *not* circuit-breaker protected — it is designed
        for health checks and startup probes where we want to know the
        actual live status regardless of circuit state.
        """
        url = f"{self.base_url}/health"
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(3.0)) as client:
                response = await client.get(url)
                return response.status_code == 200
        except Exception:
            return False

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_headers(correlation_id: str) -> Dict[str, str]:
        return {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Correlation-ID": correlation_id,
            "X-Request-ID": str(uuid.uuid4()),
            "User-Agent": "IOB-ResilientAIClient/1.0",
        }


# Module-level singleton — import this where you need the AI client.
ai_client = ResilientAIClient()

__all__ = [
    "ResilientAIClient",
    "ai_client",
]
