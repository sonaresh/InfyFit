"""Entry point for running the FastAPI app with Uvicorn."""

from __future__ import annotations

import uvicorn

from .api import create_app


def main() -> None:
    uvicorn.run(create_app(), host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
