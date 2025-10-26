"""InfyFit reference implementation.

This package exposes a lightweight simulation of the agent-based
architecture described in :mod:`AGENTS.md`.  The goal is to provide
runnable contracts that mirror the behaviour of the production system
without relying on mobile hardware features.  The application wiring in
:mod:`infyfit.api` uses a small FastAPI-compatible façade so that the
same routes can be exercised in automated tests without third-party
dependencies.
"""

from .api import create_app

__all__ = ["create_app"]
