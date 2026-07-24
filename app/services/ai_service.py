"""AI Service Layer — orchestrates AI predictions, GraphRAG, and graceful degradation.

All REST endpoints interact with AI inference engines, GraphRAG, and LLM chat
through this single typed service layer, guaranteeing unified response schemas
regardless of downstream status.
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any, Dict, Optional

from apps.core.ai_client import ResilientAIClient, ai_client
from apps.core.circuit_breaker import CircuitBreakerOpenException
from shared.schemas.ai import AIRequestEnvelope, AIResponseEnvelope

logger = logging.getLogger("iob.ai.service")


class AIService:
    """Orchestrates AI operations with structured envelopes and fallback logic.

    Every public method returns an ``AIResponseEnvelope`` — even when the
    downstream AI platform is unreachable — so API callers always receive a
    consistent response contract.
    """

    def __init__(self, client: Optional[ResilientAIClient] = None) -> None:
        self.client = client or ai_client

    # ------------------------------------------------------------------
    # Prediction
    # ------------------------------------------------------------------

    async def predict_telemetry_anomaly(
        self,
        asset_id: str,
        metrics: Dict[str, float],
        correlation_id: Optional[str] = None,
    ) -> AIResponseEnvelope:
        """Predict anomaly scores for telemetry metrics.

        Falls back to a rule-based ``degraded=True`` response when the AI
        platform is unavailable.
        """
        correlation_id = correlation_id or str(uuid.uuid4())
        start_time = time.perf_counter()

        request_envelope = AIRequestEnvelope(
            correlation_id=correlation_id,
            asset_id=asset_id,
            payload={"metrics": metrics},
        )

        try:
            raw_response = await self.client.post(
                "/api/v1/predict",
                payload=request_envelope.model_dump(mode="json"),
                correlation_id=correlation_id,
            )
            latency_ms = (time.perf_counter() - start_time) * 1000

            return AIResponseEnvelope(
                success=True,
                message="Prediction completed successfully.",
                model_name=raw_response.get("model", "AnomalyDetector-v2"),
                model_version=raw_response.get("version", "2.1.0"),
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data=raw_response.get("data", raw_response),
            )

        except CircuitBreakerOpenException as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Circuit breaker open for anomaly prediction (asset=%s): %s",
                asset_id,
                exc,
            )
            return self._degraded_fallback(
                correlation_id=correlation_id,
                asset_id=asset_id,
                latency_ms=latency_ms,
                message="AI Platform circuit open. Degraded response issued.",
            )

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Anomaly prediction failed for asset %s: %s",
                asset_id,
                exc,
                exc_info=True,
            )
            return self._degraded_fallback(
                correlation_id=correlation_id,
                asset_id=asset_id,
                latency_ms=latency_ms,
                message=f"AI Platform error: {exc}",
            )

    async def predict_rul(
        self,
        asset_id: str,
        telemetry: Dict[str, Any],
        correlation_id: Optional[str] = None,
    ) -> AIResponseEnvelope:
        """Predict Remaining Useful Life (RUL) for an asset."""
        correlation_id = correlation_id or str(uuid.uuid4())
        start_time = time.perf_counter()

        request_envelope = AIRequestEnvelope(
            correlation_id=correlation_id,
            asset_id=asset_id,
            payload={"telemetry": telemetry},
        )

        try:
            raw_response = await self.client.post(
                "/api/v1/predict/rul",
                payload=request_envelope.model_dump(mode="json"),
                correlation_id=correlation_id,
            )
            latency_ms = (time.perf_counter() - start_time) * 1000

            return AIResponseEnvelope(
                success=True,
                message="RUL prediction completed.",
                model_name=raw_response.get("model", "RULPredictor-v1"),
                model_version=raw_response.get("version", "1.2.0"),
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data=raw_response.get("data", raw_response),
            )

        except CircuitBreakerOpenException as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Circuit breaker open for RUL prediction (asset=%s): %s",
                asset_id,
                exc,
            )
            return self._degraded_fallback(
                correlation_id=correlation_id,
                asset_id=asset_id,
                latency_ms=latency_ms,
                message="AI Platform circuit open. Degraded RUL response.",
            )

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "RUL prediction failed for asset %s: %s",
                asset_id,
                exc,
                exc_info=True,
            )
            return self._degraded_fallback(
                correlation_id=correlation_id,
                asset_id=asset_id,
                latency_ms=latency_ms,
                message=f"RUL service error: {exc}",
            )

    # ------------------------------------------------------------------
    # GraphRAG
    # ------------------------------------------------------------------

    async def query_graph_rag(
        self,
        asset_id: str,
        query: str,
        correlation_id: Optional[str] = None,
    ) -> AIResponseEnvelope:
        """Execute a GraphRAG query against the knowledge graph."""
        correlation_id = correlation_id or str(uuid.uuid4())
        start_time = time.perf_counter()

        request_envelope = AIRequestEnvelope(
            correlation_id=correlation_id,
            asset_id=asset_id,
            payload={"query": query},
        )

        try:
            raw_response = await self.client.post(
                "/api/v1/graphrag/query",
                payload=request_envelope.model_dump(mode="json"),
                correlation_id=correlation_id,
            )
            latency_ms = (time.perf_counter() - start_time) * 1000

            return AIResponseEnvelope(
                success=True,
                message="GraphRAG query executed.",
                model_name=raw_response.get("model", "GraphRAG-Enterprise"),
                model_version=raw_response.get("version", "3.0.0"),
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data=raw_response.get("data", raw_response),
            )

        except CircuitBreakerOpenException as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Circuit breaker open for GraphRAG (asset=%s): %s",
                asset_id,
                exc,
            )
            return AIResponseEnvelope(
                success=False,
                message="GraphRAG service currently offline (circuit open). "
                         "Knowledge graph queries unavailable.",
                model_name="GraphRAG-Fallback",
                model_version="0.0.0",
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data={"summary": "Knowledge graph offline.", "nodes": []},
            )

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "GraphRAG query failed for asset %s: %s",
                asset_id,
                exc,
                exc_info=True,
            )
            return AIResponseEnvelope(
                success=False,
                message=f"GraphRAG service error: {exc}",
                model_name="GraphRAG-Fallback",
                model_version="0.0.0",
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data={"summary": "Knowledge graph query failed.", "nodes": []},
            )

    # ------------------------------------------------------------------
    # LLM Chat
    # ------------------------------------------------------------------

    async def chat(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ) -> AIResponseEnvelope:
        """Send a chat message to the LLM backend."""
        correlation_id = correlation_id or str(uuid.uuid4())
        start_time = time.perf_counter()

        payload = {"message": message}
        if context:
            payload["context"] = context

        request_envelope = AIRequestEnvelope(
            correlation_id=correlation_id,
            payload=payload,
        )

        try:
            raw_response = await self.client.post(
                "/api/v1/chat",
                payload=request_envelope.model_dump(mode="json"),
                correlation_id=correlation_id,
            )
            latency_ms = (time.perf_counter() - start_time) * 1000

            return AIResponseEnvelope(
                success=True,
                message="Chat response generated.",
                model_name=raw_response.get("model", "LLM-Chat-v1"),
                model_version=raw_response.get("version", "1.0.0"),
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data=raw_response.get("data", raw_response),
            )

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Chat request failed: %s", exc, exc_info=True
            )
            return AIResponseEnvelope(
                success=False,
                message=f"Chat service error: {exc}",
                model_name="Chat-Fallback",
                model_version="0.0.0",
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data={"reply": "AI chat is currently unavailable."},
            )

    # ------------------------------------------------------------------
    # Knowledge search
    # ------------------------------------------------------------------

    async def search_knowledge(
        self,
        query: str,
        correlation_id: Optional[str] = None,
    ) -> AIResponseEnvelope:
        """Search the knowledge base."""
        correlation_id = correlation_id or str(uuid.uuid4())
        start_time = time.perf_counter()

        try:
            raw_response = await self.client.get(
                "/api/v1/knowledge/search",
                params={"q": query},
                correlation_id=correlation_id,
            )
            latency_ms = (time.perf_counter() - start_time) * 1000

            return AIResponseEnvelope(
                success=True,
                message="Knowledge search completed.",
                model_name="KnowledgeSearch-v1",
                model_version="1.0.0",
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data=raw_response.get("data", raw_response),
            )

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Knowledge search failed: %s", exc, exc_info=True
            )
            return AIResponseEnvelope(
                success=False,
                message=f"Knowledge search error: {exc}",
                model_name="KnowledgeSearch-Fallback",
                model_version="0.0.0",
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data={"results": []},
            )

    # ------------------------------------------------------------------
    # Decision recommendation
    # ------------------------------------------------------------------

    async def get_decision_recommendation(
        self,
        asset_id: str,
        correlation_id: Optional[str] = None,
    ) -> AIResponseEnvelope:
        """Retrieve a decision recommendation for a given asset."""
        correlation_id = correlation_id or str(uuid.uuid4())
        start_time = time.perf_counter()

        try:
            raw_response = await self.client.get(
                f"/api/v1/decision/{asset_id}/recommendation",
                correlation_id=correlation_id,
            )
            latency_ms = (time.perf_counter() - start_time) * 1000

            return AIResponseEnvelope(
                success=True,
                message="Decision recommendation retrieved.",
                model_name="DecisionEngine-v1",
                model_version="1.0.0",
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data=raw_response.get("data", raw_response),
            )

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Decision recommendation failed for asset %s: %s",
                asset_id,
                exc,
                exc_info=True,
            )
            return AIResponseEnvelope(
                success=False,
                message=f"Decision engine error: {exc}",
                model_name="DecisionEngine-Fallback",
                model_version="0.0.0",
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data={"recommendation": None, "degraded": True},
            )

    # ------------------------------------------------------------------
    # XAI explainability
    # ------------------------------------------------------------------

    async def explain_prediction(
        self,
        asset_id: str,
        correlation_id: Optional[str] = None,
    ) -> AIResponseEnvelope:
        """Retrieve explainability (SHAP/LIME) for a prior prediction."""
        correlation_id = correlation_id or str(uuid.uuid4())
        start_time = time.perf_counter()

        try:
            raw_response = await self.client.get(
                f"/api/v1/xai/explain",
                params={"asset_id": asset_id},
                correlation_id=correlation_id,
            )
            latency_ms = (time.perf_counter() - start_time) * 1000

            return AIResponseEnvelope(
                success=True,
                message="Explanation retrieved.",
                model_name="XAIExplainer-v1",
                model_version="1.0.0",
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data=raw_response.get("data", raw_response),
            )

        except Exception as exc:
            latency_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Explanation request failed for asset %s: %s",
                asset_id,
                exc,
                exc_info=True,
            )
            return AIResponseEnvelope(
                success=False,
                message=f"Explanation service error: {exc}",
                model_name="XAI-Fallback",
                model_version="0.0.0",
                latency_ms=round(latency_ms, 2),
                correlation_id=correlation_id,
                data={"explanations": [], "degraded": True},
            )

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    async def check_ai_platform_health(self) -> bool:
        """Ping the AI platform health endpoint (bypasses circuit breaker)."""
        return await self.client.check_health()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _degraded_fallback(
        correlation_id: str,
        asset_id: str,
        latency_ms: float,
        message: str,
    ) -> AIResponseEnvelope:
        """Return a standard degraded-response envelope."""
        return AIResponseEnvelope(
            success=False,
            message=message,
            model_name="RuleBasedFallback",
            model_version="1.0.0",
            latency_ms=round(latency_ms, 2),
            correlation_id=correlation_id,
            data={
                "anomaly_detected": False,
                "confidence": 0.0,
                "degraded": True,
                "asset_id": asset_id,
            },
        )


# Module-level singleton
ai_service = AIService()

__all__ = [
    "AIService",
    "ai_service",
]
