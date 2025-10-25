# InfyFit

This repository provides a runnable reference implementation of the
InfyFit agent contracts defined in `AGENTS.md`.  The goal is to simulate
how the mobile and server agents collaborate without depending on camera
hardware or proprietary datasets.

## Features

- FastAPI application that exposes endpoints for every agent contract.
- Lightweight heuristics for the meal scanner, product lookup, and
  nutrition resolver so that flows remain deterministic in tests.
- Workout planner, coach card generator, offline sync, privacy, and
  telemetry agents aligned with the architectural guardrails.
- Simple service container that makes it trivial to swap the stubs with
  production-ready components.

## Getting started

```bash
pip install -e .[dev]
uvicorn infyfit.api:app --reload
```

Visit `http://localhost:8000/docs` for interactive API documentation.

## Tests

```bash
pytest
```
