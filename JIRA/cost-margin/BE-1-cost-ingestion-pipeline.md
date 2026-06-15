# [BE] Cost & Margin · Cost ingestion · Provider usage→cost pipeline

- **ID:** `COST-BE1`
- **Type:** Backend
- **Epic:** Cost & Margin
- **Feature:** F1 — Cost ingestion & pricing engine
- **Priority:** P1
- **Blocked by:** `PLAT-BE1`, `PLAT-BE2`, `COST-BE2`
- **Blocks:** `COST-BE3`, `COST-BE4`, `ISSUE-BE1` (cost_per_call metric)
- **Components/Labels:** `backend` `python` `supabase` `cost` `etl`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/engine/cost.ts` (`computeCallCost`), `src/lib/types.ts` (`CallUsage`, `CallCost`),
  `PRD/03-cost-revenue-margin.md` §2, `PRD/04-data-sources.md` (S1, S5)

## What
A pipeline that, for every call, captures per-service **usage** (LLM input/output tokens, STT
minutes, TTS characters, telephony minutes, cloud allocation) and computes the **real cost per call**
broken down by service, persisted to a `call_cost` table. This is the source of truth for all cost
figures in the app.

## Why
Cost per project/service is the platform's #1 priority. Today figures are modeled from a mock seed;
the business needs **real, auditable** cost derived from actual provider usage and pricing so margin
decisions are trustworthy.

## How (building on the MVP)
- The MVP computes cost in `computeCallCost(usage, durationSecs, contract)` (pure TS) from a pricing
  catalog × per-call usage. **Port this formula to Python** (it is the spec) and run it in an
  ingestion job/service.
- Read per-call usage from the call DB (`chat_conversations`/`conversation_details`, see
  `PRD/04` S1) and provider usage signals; reconcile against provider billing exports where available
  (OpenAI/Anthropic/Google/Deepgram/AssemblyAI/ElevenLabs/Cartesia/Twilio/AWS/GCP/Azure).
- Cloud allocation = **talk-minutes** (confirmed): `cloud_cost(project,period) × call_minutes/project_minutes`.
- Write `call_cost` rows (micro-USD integers): `llm/stt/tts/telephony/cloud` addends + `total`,
  plus `pricing_asof`. Keep money as integer micro-USD to avoid float drift.
- Idempotent + backfillable; run as a scheduled Python job (and/or stream) populating Supabase.

## Acceptance Criteria
- [ ] `call_cost` is produced for ≥99% of completed calls within the refresh SLA (≤15–30 min).
- [ ] Per-service breakdown sums to `total` for every row; values are integer micro-USD.
- [ ] Cloud cost is allocated by talk-minutes and reconciles to the period's total cloud cost (±1%).
- [ ] Re-running the job is idempotent (no double counting); backfill for a date range works.
- [ ] The Python cost function matches the MVP `computeCallCost` outputs on a shared fixture set.
- [ ] Unit tests for the cost formula + an integration test that ingests a sample batch.
