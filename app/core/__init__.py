"""Stable public surface for core configuration, security, and AI integration."""

from apps.core.security import hash_password, verify_password
from apps.core.config import settings
from apps.core.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerOpenException,
    ai_platform_circuit_breaker,
)
from apps.core.ai_client import ResilientAIClient, ai_client

__all__ = [
    "hash_password",
    "verify_password",
    "settings",
    "CircuitBreaker",
    "CircuitBreakerOpenException",
    "ai_platform_circuit_breaker",
    "ResilientAIClient",
    "ai_client",
]
