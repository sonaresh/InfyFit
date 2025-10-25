"""Application wiring that mimics a subset of FastAPI's interface.

The real project uses FastAPI, but to keep the tests runnable without
third-party packages we expose the same contract through a tiny
framework-compatible surface.  Routes receive dictionaries from the test
client and return serialisable payloads.
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException

from .data_models import (
    CoachRequest,
    MealScanRequest,
    NutritionResolverRequest,
    OfflineSyncRequest,
    PrivacyRequest,
    ProductScanRequest,
    TelemetryEvent,
    WorkoutPlanRequest,
)
from .services import ServiceContainer


def _ensure_payload(data: dict | None) -> dict:
    return dict(data or {})


def create_app(container: ServiceContainer | None = None) -> FastAPI:
    container = container or ServiceContainer.default()
    app = FastAPI(title="InfyFit Reference Backend", version="0.2.0")

    @app.post("/scan/meal")
    def scan_meal(payload: dict | None = None):
        request = MealScanRequest.from_dict(_ensure_payload(payload))
        result = container.estimate_meal(request)
        return result.to_dict()

    @app.post("/scan/product")
    def scan_product(payload: dict | None = None):
        request = ProductScanRequest.from_dict(_ensure_payload(payload))
        try:
            result = container.scan_product(request)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return result.to_dict()

    @app.post("/product/resolve")
    def resolve_product(payload: dict | None = None):
        request = NutritionResolverRequest.from_dict(_ensure_payload(payload))
        result = container.resolve_product(request)
        return result.to_dict()

    @app.post("/workout/plan")
    def workout_plan(payload: dict | None = None):
        request = WorkoutPlanRequest.from_dict(_ensure_payload(payload))
        result = container.build_workout_plan(request)
        return result.to_dict()

    @app.post("/coach/card")
    def coach_card(payload: dict | None = None):
        request = CoachRequest.from_dict(_ensure_payload(payload))
        result = container.generate_coach_card(request)
        return result.to_dict()

    @app.post("/sync/offline")
    def offline_sync(payload: dict | None = None):
        request = OfflineSyncRequest.from_dict(_ensure_payload(payload))
        result = container.flush_offline_queue(request)
        return result.to_dict()

    @app.post("/privacy")
    def privacy(payload: dict | None = None):
        request = PrivacyRequest.from_dict(_ensure_payload(payload))
        result = container.handle_privacy(request)
        return result.to_dict()

    @app.post("/telemetry")
    def telemetry(payload: dict | None = None):
        event = TelemetryEvent.from_dict(_ensure_payload(payload))
        result = container.ingest_telemetry(event)
        return result.to_dict()

    return app


app = create_app()
