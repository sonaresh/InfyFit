"""Server-side nutrition resolver and scoring agent."""

from __future__ import annotations

from datetime import timedelta
from typing import Dict, List, Tuple

from ..data_models import NutrientInfo, NutritionResolverRequest, ProductScore


class IncompleteDataError(RuntimeError):
    """Raised when the simulated data source cannot produce a full answer."""


ProductData = Dict[str, Tuple[str, Dict[str, float], List[str]]]

PRODUCT_DATA: ProductData = {
    "012345678905": (
        "InfyFit Protein Bar",
        {
            "calories": 210.0,
            "protein": 20.0,
            "fat": 8.0,
            "carbs": 18.0,
            "serving_size_g": 60.0,
        },
        ["InfyFit Crunch Bar", "InfyFit Nutri Square", "Greek Yogurt"],
    ),
    "5012345678900": (
        "Whole Grain Pita",
        {
            "calories": 170.0,
            "protein": 6.0,
            "fat": 2.0,
            "carbs": 32.0,
            "serving_size_g": 64.0,
        },
        ["Sprouted Wheat Wrap", "InfyFit Protein Bar"],
    ),
}

DEFAULT_PRODUCT = (
    "Unresolved Product",
    {
        "calories": 250.0,
        "protein": 5.0,
        "fat": 10.0,
        "carbs": 30.0,
        "serving_size_g": 100.0,
    },
    ["Fresh Fruit", "Greek Yogurt"],
)


def _score_from_macros(calories: float, protein: float, fat: float, carbs: float) -> int:
    density = calories / (protein + fat + carbs)
    if protein >= 15 and fat <= 10 and density <= 12:
        return 9
    if protein >= 10 and fat <= 15:
        return 7
    if fat >= 20:
        return 4
    return 6


class NutritionResolverAgent:
    """Resolve a barcode or OCR text into product facts and a health score."""

    def __init__(self, product_data: ProductData | None = None) -> None:
        self._product_data = product_data or PRODUCT_DATA

    def resolve(self, request: NutritionResolverRequest) -> ProductScore:
        key = request.barcode or self._infer_from_ocr(request.ocr_text)
        try:
            name, nutrients_raw, alternatives = self._lookup_product(key)
        except IncompleteDataError:
            name, nutrients_raw, alternatives = DEFAULT_PRODUCT
        score = _score_from_macros(
            calories=nutrients_raw["calories"],
            protein=nutrients_raw["protein"],
            fat=nutrients_raw["fat"],
            carbs=nutrients_raw["carbs"],
        )
        reason = self._build_reason(score, nutrients_raw, request.dietary_flags)
        nutrients = NutrientInfo(**nutrients_raw)
        return ProductScore(
            name=name,
            brand="InfyFit Labs" if "InfyFit" in name else None,
            health_score=score,
            reason=reason,
            better_alternatives=alternatives[:3],
            nutrients=nutrients,
        )

    def _lookup_product(self, key: str) -> Tuple[str, Dict[str, float], List[str]]:
        if key in self._product_data:
            return self._product_data[key]
        if key == "missing" or not key:
            raise IncompleteDataError("Missing product data")
        return DEFAULT_PRODUCT

    @staticmethod
    def _infer_from_ocr(ocr_text: str | None) -> str:
        if not ocr_text:
            return ""
        if "protein bar" in ocr_text.lower():
            return "012345678905"
        return ""

    @staticmethod
    def _build_reason(score: int, nutrients: Dict[str, float], dietary_flags: List[str]) -> str:
        high_protein = nutrients["protein"] >= 15
        low_sugar = nutrients["carbs"] <= 15
        reasons: List[str] = []
        if score >= 8:
            reasons.append("Rich in protein for muscle recovery")
        if high_protein and "vegan" in dietary_flags:
            reasons.append("Contains dairy protein sources")
        if low_sugar:
            reasons.append("Low sugar compared to similar products")
        if not reasons:
            reasons.append("Balanced macros with moderate calories")
        return ". ".join(reasons)

    @staticmethod
    def cache_ttl(score: ProductScore) -> timedelta:
        return timedelta(minutes=30 if score.health_score >= 8 else 10)
