"""Shared data models for the InfyFit reference backend.

The original implementation depended on Pydantic, which cannot be
installed in the offline execution environment used for these exercises.
To keep the contracts explicit and serialisable we replace those models
with lightweight dataclasses that provide ``from_dict`` and ``to_dict``
helpers.  This retains type clarity without external dependencies.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class ConfidenceLevel(str, Enum):
    """Confidence expressed as a string enum for JSON compatibility."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class MealItemEstimate:
    name: str
    portion_grams: float
    calories: float
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "portion_grams": float(self.portion_grams),
            "calories": float(self.calories),
            "confidence": self.confidence.value,
        }


@dataclass
class MealScanRequest:
    locale: str = "en_US"
    preferences: List[str] = field(default_factory=list)
    hints: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "MealScanRequest":
        data = data or {}
        return cls(
            locale=str(data.get("locale", "en_US")),
            preferences=list(data.get("preferences", [])),
            hints=list(data.get("hints", [])),
        )


@dataclass
class MealScanResult:
    items: List[MealItemEstimate]
    total_calories: float
    confidence_message: str
    clarification: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "items": [item.to_dict() for item in self.items],
            "total_calories": float(self.total_calories),
            "confidence_message": self.confidence_message,
            "clarification": self.clarification,
        }


@dataclass
class ProductScanRequest:
    barcode: Optional[str] = None
    label_text: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "ProductScanRequest":
        data = data or {}
        barcode = data.get("barcode")
        label_text = data.get("label_text")
        return cls(barcode=barcode, label_text=label_text)

    def one_of_required(self) -> None:
        if not (self.barcode or self.label_text):
            raise ValueError("Either barcode or label_text must be provided")


@dataclass
class ProductCandidate:
    name: str
    brand: Optional[str] = None
    barcode: Optional[str] = None
    ingredients: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "brand": self.brand,
            "barcode": self.barcode,
            "ingredients": list(self.ingredients),
        }


@dataclass
class ProductScanResult:
    candidate: ProductCandidate
    confidence: ConfidenceLevel
    lookup_strategy: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidate": self.candidate.to_dict(),
            "confidence": self.confidence.value,
            "lookup_strategy": self.lookup_strategy,
        }


@dataclass
class NutritionResolverRequest:
    barcode: Optional[str] = None
    ocr_text: Optional[str] = None
    locale: str = "en_US"
    dietary_flags: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "NutritionResolverRequest":
        data = data or {}
        return cls(
            barcode=data.get("barcode"),
            ocr_text=data.get("ocr_text"),
            locale=str(data.get("locale", "en_US")),
            dietary_flags=list(data.get("dietary_flags", [])),
        )


@dataclass
class NutrientInfo:
    calories: float
    protein: float
    fat: float
    carbs: float
    serving_size_g: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "calories": float(self.calories),
            "protein": float(self.protein),
            "fat": float(self.fat),
            "carbs": float(self.carbs),
            "serving_size_g": float(self.serving_size_g),
        }


@dataclass
class ProductScore:
    name: str
    brand: Optional[str]
    health_score: int
    reason: str
    better_alternatives: List[str]
    nutrients: NutrientInfo

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "brand": self.brand,
            "health_score": int(self.health_score),
            "reason": self.reason,
            "better_alternatives": list(self.better_alternatives),
            "nutrients": self.nutrients.to_dict(),
        }


@dataclass
class HealthAggregate:
    date: date
    steps: int
    sleep_quality: str
    activity_minutes: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "date": self.date.isoformat(),
            "steps": int(self.steps),
            "sleep_quality": self.sleep_quality,
            "activity_minutes": int(self.activity_minutes),
        }


@dataclass
class HealthSyncRequest:
    aggregates: List[HealthAggregate]

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "HealthSyncRequest":
        data = data or {}
        aggregates = [
            HealthAggregate(
                date=date.fromisoformat(item["date"]),
                steps=int(item["steps"]),
                sleep_quality=str(item["sleep_quality"]),
                activity_minutes=int(item["activity_minutes"]),
            )
            for item in data.get("aggregates", [])
        ]
        return cls(aggregates=aggregates)


@dataclass
class WorkoutPlanOption:
    label: str
    duration_minutes: float
    intensity: str
    estimated_burn_calories: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "label": self.label,
            "duration_minutes": float(self.duration_minutes),
            "intensity": self.intensity,
            "estimated_burn_calories": float(self.estimated_burn_calories),
        }


@dataclass
class WorkoutPlanRequest:
    goal: str
    recent_intake: float
    steps_today: int
    sleep_quality: str

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "WorkoutPlanRequest":
        data = data or {}
        return cls(
            goal=str(data.get("goal", "maintenance")),
            recent_intake=float(data.get("recent_intake", 0.0)),
            steps_today=int(data.get("steps_today", 0)),
            sleep_quality=str(data.get("sleep_quality", "unknown")),
        )


@dataclass
class WorkoutPlanResult:
    options: List[WorkoutPlanOption]

    def to_dict(self) -> Dict[str, Any]:
        return {"options": [option.to_dict() for option in self.options]}


@dataclass
class CoachCard:
    title: str
    body: str
    category: str
    generated_for: date

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "body": self.body,
            "category": self.category,
            "generated_for": self.generated_for.isoformat(),
        }


@dataclass
class CoachRequest:
    day: date
    total_calories: float
    steps: int
    sleep_quality: str
    streak_days: int = 0

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "CoachRequest":
        data = data or {}
        return cls(
            day=date.fromisoformat(data.get("day", date.today().isoformat())),
            total_calories=float(data.get("total_calories", 0.0)),
            steps=int(data.get("steps", 0)),
            sleep_quality=str(data.get("sleep_quality", "unknown")),
            streak_days=int(data.get("streak_days", 0)),
        )


@dataclass
class ReportRequest:
    from_date: date
    to_date: date
    include_meals: bool = True
    include_workouts: bool = True

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "ReportRequest":
        data = data or {}
        return cls(
            from_date=date.fromisoformat(data["from_date"]),
            to_date=date.fromisoformat(data["to_date"]),
            include_meals=bool(data.get("include_meals", True)),
            include_workouts=bool(data.get("include_workouts", True)),
        )


@dataclass
class ReportLink:
    url: str
    expires_at: datetime

    def to_dict(self) -> Dict[str, Any]:
        return {"url": self.url, "expires_at": self.expires_at.isoformat()}


class PrivacyIntent(str, Enum):
    EXPORT = "export"
    DELETE = "delete"


@dataclass
class PrivacyRequest:
    user_id: str
    intent: PrivacyIntent

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "PrivacyRequest":
        data = data or {}
        intent_value = data.get("intent", PrivacyIntent.EXPORT.value)
        intent = PrivacyIntent(intent_value)
        return cls(user_id=str(data.get("user_id", "")), intent=intent)


@dataclass
class PrivacyResponse:
    message: str
    expires_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "message": self.message,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


@dataclass
class OfflineSyncRequest:
    queue_size: int
    latency_budget_ms: int = 1000

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "OfflineSyncRequest":
        data = data or {}
        return cls(
            queue_size=int(data.get("queue_size", 0)),
            latency_budget_ms=int(data.get("latency_budget_ms", 1000)),
        )


@dataclass
class OfflineSyncResult:
    flushed: bool
    batches_uploaded: int
    next_retry_s: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "flushed": bool(self.flushed),
            "batches_uploaded": int(self.batches_uploaded),
            "next_retry_s": self.next_retry_s,
        }


@dataclass
class TelemetryEvent:
    event_name: str
    duration_ms: float
    success: bool = True
    metadata: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "TelemetryEvent":
        data = data or {}
        return cls(
            event_name=str(data.get("event_name", "")),
            duration_ms=float(data.get("duration_ms", 0.0)),
            success=bool(data.get("success", True)),
            metadata=dict(data.get("metadata", {})),
        )


@dataclass
class TelemetryResponse:
    accepted: bool

    def to_dict(self) -> Dict[str, Any]:
        return {"accepted": bool(self.accepted)}
