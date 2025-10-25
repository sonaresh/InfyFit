"""Application service layer wiring multiple agents together."""

from __future__ import annotations

from dataclasses import dataclass

from .agents import (
    CoachInsightsAgent,
    MealScanFirstPassAgent,
    NutritionResolverAgent,
    OfflineSyncAgent,
    PrivacyOpsAgent,
    ProductScannerAgent,
    TelemetryAgent,
    WorkoutPlannerAgent,
)
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


@dataclass
class ServiceContainer:
    meal_scan: MealScanFirstPassAgent
    product_scanner: ProductScannerAgent
    nutrition_resolver: NutritionResolverAgent
    workout_planner: WorkoutPlannerAgent
    coach: CoachInsightsAgent
    offline_sync: OfflineSyncAgent
    privacy_ops: PrivacyOpsAgent
    telemetry: TelemetryAgent

    @classmethod
    def default(cls) -> "ServiceContainer":
        return cls(
            meal_scan=MealScanFirstPassAgent(),
            product_scanner=ProductScannerAgent(),
            nutrition_resolver=NutritionResolverAgent(),
            workout_planner=WorkoutPlannerAgent(),
            coach=CoachInsightsAgent(),
            offline_sync=OfflineSyncAgent(),
            privacy_ops=PrivacyOpsAgent(),
            telemetry=TelemetryAgent(),
        )

    def estimate_meal(self, request: MealScanRequest):
        return self.meal_scan.estimate(request)

    def scan_product(self, request: ProductScanRequest):
        return self.product_scanner.scan(request)

    def resolve_product(self, request: NutritionResolverRequest):
        return self.nutrition_resolver.resolve(request)

    def build_workout_plan(self, request: WorkoutPlanRequest):
        return self.workout_planner.build_plan(request)

    def generate_coach_card(self, request: CoachRequest):
        return self.coach.generate(request)

    def flush_offline_queue(self, request: OfflineSyncRequest):
        return self.offline_sync.flush(request)

    def handle_privacy(self, request: PrivacyRequest):
        return self.privacy_ops.handle(request)

    def ingest_telemetry(self, event: TelemetryEvent):
        return self.telemetry.ingest(event)
