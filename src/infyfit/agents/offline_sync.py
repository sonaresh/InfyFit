"""Offline sync agent simulation."""

from __future__ import annotations

from ..data_models import OfflineSyncRequest, OfflineSyncResult


class OfflineSyncAgent:
    """Flush queued operations respecting latency guardrails."""

    def flush(self, request: OfflineSyncRequest) -> OfflineSyncResult:
        if request.queue_size == 0:
            return OfflineSyncResult(flushed=True, batches_uploaded=0, next_retry_s=None)
        batches = min(max(request.queue_size // 5, 1), 5)
        meets_budget = batches * 150 <= request.latency_budget_ms
        return OfflineSyncResult(
            flushed=meets_budget,
            batches_uploaded=batches if meets_budget else 0,
            next_retry_s=None if meets_budget else 30,
        )
