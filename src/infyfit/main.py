"""Entry point for running the reference app with an ASGI server."""

from __future__ import annotations

from .api import create_app


def main() -> None:
    """Launch the app via uvicorn if the package is available."""

    try:
        import uvicorn  # type: ignore
    except ModuleNotFoundError as exc:  # pragma: no cover - convenience only
        raise SystemExit(
            "uvicorn is not installed. Install uvicorn to run the development server."
        ) from exc

    uvicorn.run(create_app(), host="0.0.0.0", port=8000)


if __name__ == "__main__":  # pragma: no cover - manual execution only
    main()
