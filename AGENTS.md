
# AGENTS.md

This document defines the agents that power the app: what each one does, when it runs, what it needs, what it returns, and the guardrails that keep everything fast, private, and reliable. No code here—just contracts, SLOs, and responsibilities.

---

## 0) Big picture

Here’s the thing: we hit sub‑2s feedback by doing a **client‑heavy, server‑assisted** flow. The client gives an instant first result; the backend refines it and pushes an update if needed. Barcode and OCR happen on device whenever possible. Health data is pulled from the phone’s native stores with user consent. Push is used only for useful, actionable nudges.

- Android camera, barcode, and text: **ML Kit** (on‑device; limit formats for speed). citeturn1search0turn1search2
- iOS camera, barcode, and text: **Vision** framework (VNDetectBarcodesRequest). citeturn1search1turn1search3
- Android health: **Health Connect** (single on‑device hub for steps, activity, sleep). citeturn0search2turn0search6turn0search23
- iOS health: **HealthKit** (granular, per‑type permissions; sleep categories). citeturn0search3turn0search20turn0search7
- On‑device ML acceleration: **TFLite delegates** on Android; **Core ML + ANE** on iOS; both prefer quantized models. citeturn2search0turn2search2turn2search6turn2search1turn2search17
- Product data sources: **Open Food Facts** + **USDA FoodData Central** (global + US nutrients). citeturn0search0turn0search4turn0search18turn0search1turn0search9turn0search13
- Push: **APNs** token‑based HTTP/2 and **FCM HTTP v1**. citeturn4search0turn4search2turn4search3turn4search1
- Observability: **OpenTelemetry** traces, metrics, logs with Collector best practices. citeturn5search0turn5search11
- Accessibility: follow **WCAG 2.2 AA**; larger targets, reflow, focus visible. citeturn3search1turn3search3
- Security & privacy: align with **OWASP MASVS** including MASVS‑PRIVACY. citeturn3search0turn3search6

---

## 1) Client agents (on‑device)

### 1.1 Meal Scan First‑Pass Agent
**Goal**: Detect dish components and rough portions from 1–2 photos and return an immediate calorie estimate.

- **Triggers**: User taps Scan Meal → camera → shutter.
- **Inputs**: Image frames; device locale (to bias labels); last known preferences.
- **Process**: Lightweight, quantized model runs on GPU/NN/ANE when available. Targets **≤500 ms** inference on mid‑range phones. citeturn2search0turn2search2
- **Outputs**: Items with estimated portions and confidence, total kcal, quick clarifier if confidence is low.
- **SLOs**: First visible result ≤ 2 s p95; UI remain interactive.
- **Failure handling**: If blur/low light, prompt one‑tap retake; always allow manual tweak.
- **Privacy**: If “auto‑delete images” is on, purge original after logging.
- **Observability**: Emits anonymous timing metrics only (no images).

### 1.2 Product Scanner Agent (Barcode/Label)
**Goal**: Identify packaged foods fast. Prefer barcode; fall back to label OCR.

- **Triggers**: Scan Product → camera; or user switches to “Scan Label.”
- **Inputs**: Camera frames.
- **Process**: On‑device barcode detection (limit to EAN‑13/UPC‑A/UPC‑E to speed up); if none, run on‑device text recognition for nutrition panel and ingredients. citeturn1search0
- **Outputs**: Barcode payload or OCR text blocks for server enrichment.
- **SLOs**: Barcode decode ≤ 300 ms p95 in good light; OCR ≤ 1.2 s p95.
- **Failure handling**: Auto‑zoom hint, angle guidance, manual search fallback.
- **Notes**: iOS uses Vision barcode/recognition requests. citeturn1search1

### 1.3 Health Sync Agent (Steps/Sleep/Activity)
**Goal**: Read steps, activity minutes, and sleep quality to adapt calorie targets and workouts.

- **Triggers**: User connects HealthKit/Health Connect; scheduled background reads with quiet‑hours.
- **Inputs**: Consent‑gated health types; time windows.
- **Process**: On‑device permission checks; no raw data leaves device without consent. citeturn0search2turn0search3
- **Outputs**: Daily aggregates used by Personalization and Workout Planner.
- **SLOs**: Sync window ≤ 3 s p95 when app is foregrounded.

### 1.4 Offline Sync Agent
**Goal**: Queue and sync logs and assets without blocking the user.

- **Triggers**: Network regain, app foreground, or periodic background fetch.
- **Inputs**: Local write‑ahead queue.
- **Outputs**: Batched uploads; dedup tokens for idempotency.
- **SLOs**: Flush ≤ 1 s per batch; exponential backoff on failures.

### 1.5 Smart Reminder Agent
**Goal**: Respectful nudges for meals, workouts, and “refined result” updates.

- **Triggers**: User‑scheduled times, quiet hours, “Travel Mode,” or server push.
- **Outputs**: Local notifications when possible; push for server‑initiated updates via APNs/FCM. citeturn4search2turn4search3

---

## 2) Server agents (stateless where possible, event‑driven everywhere)

### 2.1 Nutrition Resolver & Health Score Agent
**Goal**: Convert a barcode or label OCR into a normalized product with nutrients and a clear **1–10** Health Score + “why.”

- **Triggers**: Product Scanner emits barcode or OCR text.
- **Inputs**: Barcode; or OCR blocks; user locale; dietary flags.
- **Process**:
  - Lookup chain: Open Food Facts → USDA FoodData Central → vendor fallbacks; cache results. citeturn0search0turn0search1
  - Normalize to per‑100g/100ml; compute 1–10 score; always include a one‑line reason and 1–3 better alternatives.
  - Optionally align heuristics with public systems like **Nutri‑Score** while keeping our own 1–10 scale. citeturn6search0
- **Outputs**: Product facts, score, reason, alternatives.
- **SLOs**: p95 ≤ 400 ms from cache; ≤ 900 ms cold.
- **Failure handling**: If data incomplete, return conservative score with “data limited” flag and suggest label scan.

### 2.2 Label OCR Parser Agent
**Goal**: Turn raw text blocks into nutrients and ingredient flags.

- **Inputs**: OCR text; region; language.
- **Process**: Pattern extract nutrition table fields, unit normalization, allergen detection.
- **Outputs**: Structured nutrients, warnings, confidence.

### 2.3 Meal Refine Worker
**Goal**: Improve the on‑device estimate using heavier models and multi‑image fusion without blocking the user.

- **Triggers**: Meal Scan First‑Pass drops a refine job.
- **Inputs**: Low‑res images or features; first‑pass breakdown; user locale.
- **Process**: Batch inference on GPU/CPU; retry with backoff; A/B models; only push an update if delta is meaningful.
- **Outputs**: Refined items and kcal; “accept update” signal to client.
- **SLOs**: p95 ≤ 1.5 s when online; queue‑driven when offline.

### 2.4 Workout Planner Agent
**Goal**: Build the day’s plan based on goal, intake, steps, and sleep; always offer Short, Standard, and Recovery options.

- **Inputs**: Goal, recent intake, steps/sleep aggregates.
- **Process**: Size sessions via METs; lower intensity on poor sleep; user can override with one tap. citeturn6search1
- **Outputs**: Three variants with time and intensity; burn estimate.
- **SLOs**: ≤ 250 ms.

### 2.5 Alternatives Recommender
**Goal**: If a product scores low, suggest higher‑scoring lookalikes users can actually find.

- **Inputs**: Product category, constraints (veg/vegan/halal/Jain), allergens, disliked foods.
- **Process**: Similarity search over normalized nutrition + tags; rank by availability and score bump.
- **Outputs**: 1–3 swaps with short why‑statements.

### 2.6 Coach & Insights Agent
**Goal**: One card per day, short and specific. Weekly and monthly recaps that show small wins.

- **Inputs**: Meal and product logs, workouts, streaks.
- **Process**: Rule engine + small models; rate‑limit tips to one per day to avoid nagging.
- **Outputs**: Daily coach card; weekly summary; monthly report notes.

### 2.7 Reports Agent
**Goal**: Generate neat PDFs/CSVs for doctors or trainers.

- **Inputs**: Time range; filters (meals only, snacks only).
- **Outputs**: Download link with expiring URL.
- **SLOs**: ≤ 10 s; stream if larger.

### 2.8 Privacy Ops Agent (Export/Delete)
**Goal**: Make export and account deletion two taps, as promised.

- **Inputs**: Authenticated user intent.
- **Outputs**: Full export bundle; hard delete with grace window and revocation of tokens.
- **Notes**: Aligns to MASVS privacy guidance. citeturn3search6

### 2.9 Notification Orchestrator
**Goal**: Send only useful push: refined results, reminders, and plan updates.

- **Channels**: APNs with HTTP/2 token auth; FCM HTTP v1 with OAuth2. citeturn4search0turn4search2turn4search3
- **SLOs**: Provider API ack ≤ 200 ms p95 (not delivery time). Track end‑to‑end where platforms support it.

### 2.10 Telemetry & Anomaly Agent
**Goal**: Bake in OpenTelemetry for traces, metrics, and logs. Watch p95 latency and error budgets; alert when refine queue backs up.

- **Inputs**: SDK spans and metrics from app and services.
- **Process**: OTel Collector distribution with only needed processors/exporters; scrub PII; TLS and auth to backends. citeturn5search0turn5search11
- **Outputs**: SLO dashboards, alert routes.

### 2.11 Model Rollout Governor
**Goal**: Safe model updates. Feature flags, staged rollout, kill‑switch.

- **Process**: Canary cohorts; roll forward only if latency and correction‑tap count stay within bounds.
- **Outputs**: Version pins per device cohort.

---

## 3) Shared contracts (no code, just fields)

- **Identity**: pseudonymous user ID; region; language; units.
- **Diet profile**: goal, dietary prefs (veg/vegan/Jain/halal/keto), allergies, disliked foods.
- **Privacy flags**: image auto‑delete on/off; health links on/off.
- **Health aggregates**: steps, activity minutes, sleep quality; timestamps and sources.
- **Meal log**: items, portions, kcal, confidence, corrections count.
- **Product log**: barcode or OCR source; serving; 1–10 score; reason; alternatives.
- **Workout plan**: variant, duration, intensity, burn estimate; completed?

---

## 4) Queues, topics, and SLOs

- **Topics**: meal.refine.request → meal.refine.result; product.lookup.request → product.scored; coach.compute.request → coach.card.ready.
- **Idempotency**: every event carries a dedup token; consumers are replay‑tolerant.
- **SLOs**: first result ≤ 2 s; refine ≤ 1.5 s when online; product scoring ≤ 0.9 s cold; plan generation ≤ 0.25 s; push enqueue ≤ 0.2 s.

---

## 5) Privacy, security, and accessibility guardrails

- **Permissions**: show exactly what health data is read or written; let users disconnect with one toggle. citeturn0search2turn0search3
- **Storage**: keys in Keychain/Keystore; never store tokens or images in plaintext.
- **Transport**: HTTPS everywhere; APNs over HTTP/2; FCM HTTP v1 with OAuth2. citeturn4search2turn4search3
- **App hardening & privacy**: follow OWASP MASVS and MASVS‑PRIVACY. citeturn3search0turn3search6
- **Accessibility**: WCAG 2.2 AA—large text mode, high contrast, focus visible, reflow; voice guidance on camera steps. citeturn3search1turn3search3

---

## 6) Why we’ll stay fast

- On‑device barcode/OCR and a compact vision model for the **first pass** keep the app snappy. citeturn1search0
- Quantized models and device accelerators handle most phones well; bigger models live server‑side. citeturn2search0turn2search1
- Product lookups hit warm caches backed by Open Food Facts and FoodData Central. citeturn0search0turn0search1
- We never block on refine; we push the update when it’s ready via APNs/FCM. citeturn4search2turn4search3

---

## 7) References

- Open Food Facts API and data. citeturn0search0turn0search4turn0search18
- USDA FoodData Central API and datasets. citeturn0search1turn0search9turn0search13
- Android Health Connect. citeturn0search2turn0search6
- Apple HealthKit. citeturn0search3turn0search20
- ML Kit barcode scanning and iOS Vision. citeturn1search0turn1search1
- TFLite delegates and Core ML performance/quantization. citeturn2search0turn2search2turn2search1
- APNs and FCM HTTP v1. citeturn4search0turn4search2turn4search3
- OpenTelemetry overview and deployment patterns. citeturn5search0turn5search11
- WCAG 2.2 AA. citeturn3search1
- OWASP MASVS + MASVS‑PRIVACY. citeturn3search0
