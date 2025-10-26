# InfyFit Reference Architecture

This repository contains a lightweight implementation of the agent
contracts described in `AGENTS.md`.  Instead of real mobile computer
vision or server infrastructure, the backend mimics the contracts with
predictable heuristics so that flows can be tested end-to-end.

## Components

- **FastAPI backend** (`infyfit.api`) exposes REST endpoints for every
  agent contract.
- **Service container** (`infyfit.services.ServiceContainer`) wires the
  individual agents together and makes it easy to swap stubs with real
  implementations.
- **Agents** live under `infyfit.agents` and mirror the responsibilities
  from `AGENTS.md`:
  - `MealScanFirstPassAgent` produces an instant calorie estimate from
    textual hints.
  - `ProductScannerAgent` recognises packaged goods via barcode or OCR
    text.
  - `NutritionResolverAgent` normalises nutrition data and assigns a
    health score with suggested alternatives.
  - `WorkoutPlannerAgent` generates short, standard, and recovery plans
    that react to intake, sleep, and activity context.
  - `CoachInsightsAgent` emits one actionable card per day.
  - `OfflineSyncAgent` simulates queue flushing guardrails.
  - `PrivacyOpsAgent` returns clear messaging for export and deletion
    flows.
  - `TelemetryAgent` validates incoming spans before accepting them.

## Running locally

```bash
pip install -e .[dev]
uvicorn infyfit.api:app --reload
```

## Testing

```bash
pytest
```
