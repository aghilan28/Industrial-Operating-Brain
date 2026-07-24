"""Circuit breaker state machine for downstream AI service resilience.

Implements a three-state machine (CLOSED → OPEN → HALF-OPEN → CLOSED) with
asynchronous locking to prevent cascading failures across AI platform outages.
"""

from __future__ import annotations

import time
import asyncio
import logging
from typing import Any, Callable, TypeVar

logger = logging.getLogger("iob.circuit_breaker")

F = TypeVar("F", bound=Callable[..., Any])


class CircuitBreakerOpenException(Exception):
    """Raised when the circuit is OPEN and requests are blocked."""

    def __init__(self, name: str, recovery_time: float) -> None:
        self.circuit_name = name
        self.recovery_time = recovery_time
        super().__init__(
            f"Circuit '{name}' is OPEN. Requests blocked for "
            f"{recovery_time:.1f}s to allow downstream recovery."
        )


class CircuitBreaker:
    """State machine that manages resilience of calls to a downstream service.

    States
    ------
    CLOSED
        Normal operation — all calls are forwarded.
    OPEN
        Failure threshold exceeded — calls are fast-failed with
        ``CircuitBreakerOpenException``.
    HALF-OPEN
        Recovery timer has expired — a single probe call is allowed.
        Success transitions to CLOSED; failure re-opens the circuit.

    Thread safety
    -------------
    All state mutations are protected by an ``asyncio.Lock`` so the breaker
    is safe to share across concurrent request handlers.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_time: float = 30.0,
        name: str = "CircuitBreaker",
    ) -> None:
        self.failure_threshold = failure_threshold
        self.recovery_time = recovery_time
        self.name = name

        self.state: str = "CLOSED"
        self.failure_count: int = 0
        self.last_state_change: float = time.time()
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def call(self, func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """Execute *func* under circuit breaker protection.

        Raises
        ------
        CircuitBreakerOpenException
            When the circuit is OPEN and the recovery window has not elapsed.
        """
        await self._check_and_transition()

        try:
            result = await func(*args, **kwargs)
        except Exception as exc:
            await self._record_failure()
            raise exc

        await self._record_success()
        return result

    @property
    def is_available(self) -> bool:
        """Synchronous, non-blocking health check for monitoring / health pages."""
        if self.state == "CLOSED":
            return True
        if self.state == "HALF_OPEN":
            return True
        # OPEN — check if recovery window has elapsed
        return (time.time() - self.last_state_change) > self.recovery_time

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    async def _check_and_transition(self) -> None:
        async with self._lock:
            now = time.time()
            if self.state == "OPEN":
                if now - self.last_state_change > self.recovery_time:
                    logger.info(
                        "Circuit '%s' transitioning OPEN → HALF_OPEN "
                        "(recovery window elapsed)",
                        self.name,
                    )
                    self.state = "HALF_OPEN"
                    self.last_state_change = now
                else:
                    raise CircuitBreakerOpenException(self.name, self.recovery_time)

    async def _record_failure(self) -> None:
        async with self._lock:
            self.failure_count += 1
            logger.warning(
                "Circuit '%s' failure %d/%d",
                self.name,
                self.failure_count,
                self.failure_threshold,
            )
            if self.failure_count >= self.failure_threshold:
                logger.error(
                    "Circuit '%s' transitioning to OPEN (threshold=%d reached)",
                    self.name,
                    self.failure_threshold,
                )
                self.state = "OPEN"
                self.last_state_change = time.time()

    async def _record_success(self) -> None:
        async with self._lock:
            if self.state == "HALF_OPEN":
                logger.info(
                    "Circuit '%s' probe succeeded — resetting to CLOSED",
                    self.name,
                )
                self.state = "CLOSED"
                self.failure_count = 0
                self.last_state_change = time.time()


# Pre-built singleton for the AI platform circuit breaker used across the
# application.  Import this instance to avoid accidental duplications.
ai_platform_circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_time=30.0,
    name="AIPlatformCircuitBreaker",
)

__all__ = [
    "CircuitBreaker",
    "CircuitBreakerOpenException",
    "ai_platform_circuit_breaker",
]
