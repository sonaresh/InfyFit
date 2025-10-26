"""Agent constructors for the InfyFit reference stack."""

from .coach import CoachInsightsAgent, default_daily_card
from .meal_scan import MealScanFirstPassAgent
from .nutrition_resolver import NutritionResolverAgent
from .offline_sync import OfflineSyncAgent
from .privacy import PrivacyOpsAgent
from .product_scanner import ProductScannerAgent
from .telemetry import TelemetryAgent
from .workout_planner import WorkoutPlannerAgent

__all__ = [
    "CoachInsightsAgent",
    "MealScanFirstPassAgent",
    "NutritionResolverAgent",
    "OfflineSyncAgent",
    "PrivacyOpsAgent",
    "ProductScannerAgent",
    "TelemetryAgent",
    "WorkoutPlannerAgent",
    "default_daily_card",
]
