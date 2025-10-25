"""Simple synchronous test client compatible with our FastAPI façade."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from . import FastAPI, HTTPException


@dataclass
class _Response:
    status_code: int
    _payload: Any

    def json(self) -> Any:
        return self._payload


class TestClient:
    """Invoke registered handlers directly without HTTP transport."""

    def __init__(self, app: FastAPI) -> None:
        self._app = app

    def post(self, path: str, json: Optional[Dict[str, Any]] = None) -> _Response:
        try:
            payload = self._app.handle_request("POST", path, json or {})
            return _Response(status_code=200, _payload=payload)
        except HTTPException as exc:  # pragma: no cover - exercised in tests
            body: Dict[str, Any] = {"detail": exc.detail}
            return _Response(status_code=exc.status_code, _payload=body)


# Prevent pytest from treating the helper as a test container.
TestClient.__test__ = False
