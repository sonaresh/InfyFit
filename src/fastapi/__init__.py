"""Tiny FastAPI-compatible façade used for offline testing.

Only the pieces required by the tests are implemented: route
registration via ``@app.post`` and an ``HTTPException`` type.  The
:class:`fastapi.testclient.TestClient` defined in this repository calls
:func:`FastAPI.handle_request` directly, so no ASGI machinery is needed.
"""

from __future__ import annotations

from typing import Any, Callable, Dict


class HTTPException(Exception):
    """Lightweight stand-in for :class:`fastapi.HTTPException`."""

    def __init__(self, status_code: int, detail: str | None = None) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


class FastAPI:
    """Minimal route registry that mimics FastAPI's decorator style."""

    def __init__(self, title: str | None = None, version: str | None = None) -> None:
        self.title = title or "FastAPI"
        self.version = version or "0.0"
        self._routes: Dict[str, Dict[str, Callable[..., Any]]] = {}

    def post(self, path: str) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
        """Register a handler for ``POST`` requests at ``path``."""

        def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
            methods = self._routes.setdefault(path, {})
            methods["POST"] = func
            return func

        return decorator

    def handle_request(self, method: str, path: str, payload: Any = None) -> Any:
        method = method.upper()
        route = self._routes.get(path)
        if not route or method not in route:
            raise HTTPException(status_code=404, detail="Not Found")
        handler = route[method]
        # Our handlers expect at most a single payload argument.
        return handler(payload) if handler.__code__.co_argcount else handler()


__all__ = ["FastAPI", "HTTPException"]
