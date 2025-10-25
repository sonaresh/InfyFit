from datetime import date

from fastapi.testclient import TestClient

from infyfit import create_app


client = TestClient(create_app())


def test_meal_scan_returns_items():
    response = client.post("/scan/meal", json={"hints": ["Grilled Chicken", "Mixed Greens"]})
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"][0]["name"] == "Grilled Chicken"
    assert payload["total_calories"] > 0


def test_product_scan_barcode():
    response = client.post("/scan/product", json={"barcode": "012345678905"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["candidate"]["name"] == "InfyFit Protein Bar"
    assert payload["confidence"] == "high"


def test_product_resolver_returns_score():
    response = client.post("/product/resolve", json={"barcode": "012345678905"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["health_score"] >= 1
    assert payload["better_alternatives"]


def test_workout_plan_shapes_output():
    response = client.post(
        "/workout/plan",
        json={
            "goal": "weight_loss",
            "recent_intake": 2200,
            "steps_today": 6000,
            "sleep_quality": "good",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["options"]) == 3
    assert {opt["label"] for opt in payload["options"]} == {"Short", "Standard", "Recovery"}


def test_coach_card_is_actionable():
    response = client.post(
        "/coach/card",
        json={
            "day": date.today().isoformat(),
            "total_calories": 2500,
            "steps": 3000,
            "sleep_quality": "fair",
            "streak_days": 6,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert "Swap" in payload["body"] or "Add" in payload["body"]


def test_privacy_delete_sets_future_expiry():
    response = client.post(
        "/privacy",
        json={"user_id": "user-123", "intent": "delete"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["expires_at"] is not None


def test_telemetry_rejects_invalid_event():
    response = client.post(
        "/telemetry",
        json={"event_name": "other", "duration_ms": 10.0, "success": True},
    )
    assert response.status_code == 200
    assert response.json()["accepted"] is False
