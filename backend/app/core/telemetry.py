import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional


class TelemetryRecorder:
    """Structured telemetry and event logger for production observability."""

    def __init__(self, logger_name: str = "app.telemetry") -> None:
        self.logger = logging.getLogger(logger_name)

    def record_event(
        self,
        event_name: str,
        category: str,
        properties: Optional[Dict[str, Any]] = None,
        duration_ms: Optional[float] = None,
    ) -> Dict[str, Any]:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event_name,
            "category": category,
            "duration_ms": duration_ms,
            "properties": properties or {},
        }
        self.logger.info(json.dumps(payload))
        return payload

    def record_error(
        self,
        error_name: str,
        message: str,
        trace_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": "error",
            "error_name": error_name,
            "message": message,
            "context": trace_context or {},
        }
        self.logger.error(json.dumps(payload))
        return payload
