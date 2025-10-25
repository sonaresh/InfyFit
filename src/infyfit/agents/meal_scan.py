"""On-device meal scan first-pass agent (simulated)."""

from __future__ import annotations

from typing import Dict, Iterable, List

from ..data_models import ConfidenceLevel, MealItemEstimate, MealScanRequest, MealScanResult

# Simplified calorie lookup per 100 g. Values based on common foods.
CALORIE_TABLE: Dict[str, float] = {
    "grilled chicken": 165.0,
    "brown rice": 111.0,
    "steamed broccoli": 55.0,
    "avocado": 160.0,
    "salmon": 208.0,
    "sweet potato": 86.0,
    "quinoa": 120.0,
    "mixed greens": 20.0,
    "fried chicken": 260.0,
    "pasta": 131.0,
    "marinara sauce": 74.0,
}

DEFAULT_CALORIES_PER_100G = 150.0


class MealScanFirstPassAgent:
    """Estimate meal items and calories using lightweight heuristics."""

    def __init__(self, calorie_table: Dict[str, float] | None = None) -> None:
        self._calorie_table = calorie_table or CALORIE_TABLE

    def estimate(self, request: MealScanRequest) -> MealScanResult:
        """Return a calorie estimate based on the provided hints."""
        if not request.hints:
            clarification = (
                "No hints were provided. Please capture another angle or add a manual item."
            )
            default_item = MealItemEstimate(
                name="unrecognised item",
                portion_grams=120.0,
                calories=(DEFAULT_CALORIES_PER_100G / 100.0) * 120.0,
                confidence=ConfidenceLevel.LOW,
            )
            return MealScanResult(
                items=[default_item],
                total_calories=default_item.calories,
                confidence_message="Unable to confidently recognise the meal",
                clarification=clarification,
            )

        estimates: List[MealItemEstimate] = []
        for hint in request.hints:
            item = self._estimate_for_hint(hint)
            estimates.append(item)

        total = sum(item.calories for item in estimates) or 1.0
        average_confidence = self._average_confidence(estimates)
        message = self._confidence_message(average_confidence)

        return MealScanResult(items=estimates, total_calories=total, confidence_message=message)

    def _estimate_for_hint(self, hint: str) -> MealItemEstimate:
        key = hint.lower().strip()
        portion = self._portion_for_hint(key)
        calories_per_100g = self._calorie_table.get(key, DEFAULT_CALORIES_PER_100G)
        calories = (calories_per_100g / 100.0) * portion
        confidence = ConfidenceLevel.HIGH if key in self._calorie_table else ConfidenceLevel.MEDIUM
        if "fried" in key or "dessert" in key:
            confidence = ConfidenceLevel.MEDIUM
        return MealItemEstimate(
            name=hint,
            portion_grams=portion,
            calories=round(calories, 2),
            confidence=confidence,
        )

    @staticmethod
    def _portion_for_hint(hint: str) -> float:
        if "bowl" in hint:
            return 250.0
        if "salad" in hint or "greens" in hint:
            return 180.0
        if "snack" in hint or "dessert" in hint:
            return 90.0
        return 150.0

    @staticmethod
    def _average_confidence(estimates: Iterable[MealItemEstimate]) -> ConfidenceLevel:
        score_map = {ConfidenceLevel.LOW: 0, ConfidenceLevel.MEDIUM: 1, ConfidenceLevel.HIGH: 2}
        reverse_map = {0: ConfidenceLevel.LOW, 1: ConfidenceLevel.MEDIUM, 2: ConfidenceLevel.HIGH}
        estimates_list = list(estimates)
        if not estimates_list:
            return ConfidenceLevel.LOW
        avg = sum(score_map[item.confidence] for item in estimates_list) / len(estimates_list)
        return reverse_map[round(avg)]

    @staticmethod
    def _confidence_message(level: ConfidenceLevel) -> str:
        if level is ConfidenceLevel.HIGH:
            return "Looks good! Tap to adjust if anything seems off."
        if level is ConfidenceLevel.MEDIUM:
            return "We recognised most items. Double-check portions before saving."
        return "Low confidence. Consider adding items manually."
