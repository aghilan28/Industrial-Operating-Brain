"""Compatibility shim — ``apps.mqtt_bridge``.

Historical modules and the smoke-test suite import the bridge from
``apps.mqtt_bridge`` while the implementation lives in
``apps.services.mqtt_bridge``. This module re-exports the canonical objects so
both import paths resolve to the *same* singleton and queue instances.
"""

from __future__ import annotations

from apps.services.mqtt_bridge import (  # noqa: F401
    AsyncMQTTBridge,
    DEFAULT_TOPIC_FILTER,
    MQTTBridge,
    mqtt_bridge,
    sensor_queue,
)

__all__ = [
    "AsyncMQTTBridge",
    "DEFAULT_TOPIC_FILTER",
    "MQTTBridge",
    "mqtt_bridge",
    "sensor_queue",
]
