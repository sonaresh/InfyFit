"""Telemetry agent used to accept OpenTelemetry-like spans."""

from __future__ import annotations

from ..data_models import TelemetryEvent, TelemetryResponse


class TelemetryAgent:
    """Accepts spans and enforces minimal validation to mimic collector guardrails."""

    MAX_DURATION_MS = 5_000.0

    def ingest(self, event: TelemetryEvent) -> TelemetryResponse:
        if event.duration_ms > self.MAX_DURATION_MS:
            return TelemetryResponse(accepted=False)
        if not event.event_name.startswith("infyfit"):
            return TelemetryResponse(accepted=False)
        return TelemetryResponse(accepted=True)
