"""Shared data models for the InfyFit reference backend."""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl, PositiveFloat, conint


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MealItemEstimate(BaseModel):
    name: str
    portion_grams: PositiveFloat = Field(..., description="Estimated portion in grams")
    calories: PositiveFloat = Field(..., description="Estimated calories for the portion")
    confidence: ConfidenceLevel = Field(
        ConfidenceLevel.MEDIUM, description="How confident the model is about the estimate"
    )


class MealScanRequest(BaseModel):
    locale: str = "en_US"
    preferences: List[str] = []
    # We use textual hints instead of real images so the contract remains testable.
    hints: List[str] = Field(
        default_factory=list,
        description="Lightweight textual hints derived from the on-device first pass",
    )


class MealScanResult(BaseModel):
    items: List[MealItemEstimate]
    total_calories: PositiveFloat
    confidence_message: str
    clarification: Optional[str] = None


class ProductScanRequest(BaseModel):
    barcode: Optional[str] = None
    label_text: Optional[str] = None

    def one_of_required(self) -> None:
        if not (self.barcode or self.label_text):
            raise ValueError("Either barcode or label_text must be provided")


class ProductCandidate(BaseModel):
    name: str
    brand: Optional[str] = None
    barcode: Optional[str] = None
    ingredients: List[str] = []


class ProductScanResult(BaseModel):
    candidate: ProductCandidate
    confidence: ConfidenceLevel
    lookup_strategy: str


class NutritionResolverRequest(BaseModel):
    barcode: Optional[str] = None
    ocr_text: Optional[str] = None
    locale: str = "en_US"
    dietary_flags: List[str] = []


class NutrientInfo(BaseModel):
    calories: PositiveFloat
    protein_g: PositiveFloat = Field(..., alias="protein")
    fat_g: PositiveFloat = Field(..., alias="fat")
    carbs_g: PositiveFloat = Field(..., alias="carbs")
    serving_size_g: PositiveFloat

    class Config:
        populate_by_name = True


class ProductScore(BaseModel):
    name: str
    brand: Optional[str] = None
    health_score: conint(ge=1, le=10)
    reason: str
    better_alternatives: List[str]
    nutrients: NutrientInfo


class HealthAggregate(BaseModel):
    date: date
    steps: int
    sleep_quality: str
    activity_minutes: int


class HealthSyncRequest(BaseModel):
    aggregates: List[HealthAggregate]


class WorkoutPlanOption(BaseModel):
    label: str
    duration_minutes: PositiveFloat
    intensity: str
    estimated_burn_calories: PositiveFloat


class WorkoutPlanRequest(BaseModel):
    goal: str
    recent_intake: PositiveFloat
    steps_today: int
    sleep_quality: str


class WorkoutPlanResult(BaseModel):
    options: List[WorkoutPlanOption]


class CoachCard(BaseModel):
    title: str
    body: str
    category: str
    generated_for: date


class CoachRequest(BaseModel):
    day: date
    total_calories: PositiveFloat
    steps: int
    sleep_quality: str
    streak_days: int = 0


class ReportRequest(BaseModel):
    from_date: date
    to_date: date
    include_meals: bool = True
    include_workouts: bool = True


class ReportLink(BaseModel):
    url: HttpUrl
    expires_at: datetime


class PrivacyIntent(str, Enum):
    EXPORT = "export"
    DELETE = "delete"


class PrivacyRequest(BaseModel):
    user_id: str
    intent: PrivacyIntent


class PrivacyResponse(BaseModel):
    message: str
    expires_at: Optional[datetime] = None


class OfflineSyncRequest(BaseModel):
    queue_size: int
    latency_budget_ms: int = 1000


class OfflineSyncResult(BaseModel):
    flushed: bool
    batches_uploaded: int
    next_retry_s: Optional[int] = None


class TelemetryEvent(BaseModel):
    event_name: str
    duration_ms: PositiveFloat
    success: bool = True
    metadata: dict = Field(default_factory=dict)


class TelemetryResponse(BaseModel):
    accepted: bool
