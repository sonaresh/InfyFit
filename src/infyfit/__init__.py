"""InfyFit reference implementation.

This package exposes a lightweight simulation of the agent-based
architecture described in :mod:`AGENTS.md`.  The goal is to provide
runnable contracts that mirror the behaviour of the production system
without relying on mobile hardware features.  The FastAPI application in
:mod:`infyfit.api` wires the agents together so that the flows can be
exercised end-to-end in automated tests.
"""

from .api import create_app

__all__ = ["create_app"]
