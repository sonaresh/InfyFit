"""Workout planner agent."""

from __future__ import annotations

from typing import List

from ..data_models import WorkoutPlanOption, WorkoutPlanRequest, WorkoutPlanResult


INTENSITY_FACTORS = {
    "weight_loss": {"short": 0.8, "standard": 1.0, "recovery": 0.6},
    "muscle_gain": {"short": 0.9, "standard": 1.1, "recovery": 0.7},
    "maintenance": {"short": 0.7, "standard": 0.9, "recovery": 0.6},
}

BASE_DURATION = {"short": 20.0, "standard": 40.0, "recovery": 25.0}


class WorkoutPlannerAgent:
    """Generate short, standard, and recovery plans based on user context."""

    def build_plan(self, request: WorkoutPlanRequest) -> WorkoutPlanResult:
        goal = request.goal.lower()
        goal = goal if goal in INTENSITY_FACTORS else "maintenance"
        intensity_map = INTENSITY_FACTORS[goal]

        sleep_penalty = 0.8 if request.sleep_quality.lower() in {"poor", "fair"} else 1.0
        activity_bonus = 0.9 if request.steps_today > 10000 else 1.0
        caloric_delta = max(request.recent_intake - 2000, 0) / 500.0

        options: List[WorkoutPlanOption] = []
        for label in ("short", "standard", "recovery"):
            factor = intensity_map[label] * sleep_penalty * activity_bonus
            duration = BASE_DURATION[label] * (1 + caloric_delta * 0.1 if label != "recovery" else 1)
            burn = 6.0 * duration * factor
            options.append(
                WorkoutPlanOption(
                    label=label.capitalize(),
                    duration_minutes=round(duration, 1),
                    intensity=self._intensity_label(factor),
                    estimated_burn_calories=round(burn, 1),
                )
            )

        return WorkoutPlanResult(options=options)

    @staticmethod
    def _intensity_label(factor: float) -> str:
        if factor >= 1.0:
            return "High"
        if factor >= 0.8:
            return "Moderate"
        return "Low"
