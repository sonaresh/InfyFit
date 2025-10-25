"""FastAPI application exposing the InfyFit agent contracts."""

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


def create_app(container: ServiceContainer | None = None) -> FastAPI:
    container = container or ServiceContainer.default()
    app = FastAPI(title="InfyFit Reference Backend", version="0.1.0")

    @app.post("/scan/meal")
    def scan_meal(request: MealScanRequest):
        return container.estimate_meal(request)

    @app.post("/scan/product")
    def scan_product(request: ProductScanRequest):
        try:
            return container.scan_product(request)
        except ValueError as exc:  # from one_of_required
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.post("/product/resolve")
    def resolve_product(request: NutritionResolverRequest):
        return container.resolve_product(request)

    @app.post("/workout/plan")
    def workout_plan(request: WorkoutPlanRequest):
        return container.build_workout_plan(request)

    @app.post("/coach/card")
    def coach_card(request: CoachRequest):
        return container.generate_coach_card(request)

    @app.post("/sync/offline")
    def offline_sync(request: OfflineSyncRequest):
        return container.flush_offline_queue(request)

    @app.post("/privacy")
    def privacy(request: PrivacyRequest):
        return container.handle_privacy(request)

    @app.post("/telemetry")
    def telemetry(event: TelemetryEvent):
        return container.ingest_telemetry(event)

    return app


app = create_app()
