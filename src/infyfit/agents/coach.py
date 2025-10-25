"""Daily coach and insights agent."""

from __future__ import annotations

from datetime import date

from ..data_models import CoachCard, CoachRequest


class CoachInsightsAgent:
    """Generate one actionable card per day."""

    def generate(self, request: CoachRequest) -> CoachCard:
        body = self._select_body(request)
        category = self._determine_category(request)
        return CoachCard(
            title=self._title_for_category(category),
            body=body,
            category=category,
            generated_for=request.day,
        )

    @staticmethod
    def _determine_category(request: CoachRequest) -> str:
        if request.total_calories > 2400:
            return "nutrition"
        if request.steps < 5000:
            return "activity"
        if request.sleep_quality.lower() in {"poor", "fair"}:
            return "recovery"
        if request.streak_days and request.streak_days % 7 == 0:
            return "celebration"
        return "maintenance"

    @staticmethod
    def _title_for_category(category: str) -> str:
        return {
            "nutrition": "Fuel Check",
            "activity": "Move Boost",
            "recovery": "Rest Reset",
            "celebration": "Streak High-Five",
        }.get(category, "Daily Focus")

    @staticmethod
    def _select_body(request: CoachRequest) -> str:
        suggestions = []
        if request.total_calories > 2400:
            suggestions.append("Swap one dinner carb for greens to stay on target.")
        if request.steps < 5000:
            suggestions.append("Add a 10-minute walk after lunch to boost steps.")
        if request.sleep_quality.lower() in {"poor", "fair"}:
            suggestions.append("Try winding down 30 minutes earlier tonight.")
        if request.streak_days and request.streak_days % 7 == 0:
            suggestions.append("Seven-day streak! Lock it in with a quick reflection.")
        if not suggestions:
            suggestions.append("Keep the momentum—log meals within 15 minutes for accuracy.")
        return " ".join(suggestions)


def default_daily_card(day: date) -> CoachCard:
    agent = CoachInsightsAgent()
    return agent.generate(
        CoachRequest(day=day, total_calories=2000, steps=8000, sleep_quality="good", streak_days=0)
    )
