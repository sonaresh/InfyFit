"""Privacy operations agent."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from ..data_models import PrivacyIntent, PrivacyRequest, PrivacyResponse


class PrivacyOpsAgent:
    """Handle export and delete flows with clear messaging."""

    def handle(self, request: PrivacyRequest) -> PrivacyResponse:
        if request.intent is PrivacyIntent.EXPORT:
            expires = datetime.now(timezone.utc) + timedelta(hours=24)
            return PrivacyResponse(
                message=f"Export for {request.user_id} scheduled. We'll email you when it's ready.",
                expires_at=expires,
            )
        if request.intent is PrivacyIntent.DELETE:
            expires = datetime.now(timezone.utc) + timedelta(days=30)
            return PrivacyResponse(
                message="Account deletion window started. Sign in within 30 days to cancel.",
                expires_at=expires,
            )
        return PrivacyResponse(message="Unsupported request")
