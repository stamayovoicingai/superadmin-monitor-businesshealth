# [BE] Platform · Ingestion · Call/conversation data pipeline

- **ID:** `PLAT-BE2`
- **Type:** Backend
- **Epic:** Platform Foundation
- **Feature:** F2 — Call/conversation data ingestion
- **Priority:** P0
- **Blocked by:** `PLAT-BE1`
- **Blocks:** `CALLS-*`, `PERF-*`, `LIVE-*`, `ISSUE-*`, `COST-BE1`, `BIZ-*`, `FLAG-*`
- **Components/Labels:** `backend` `python` `postgres` `etl` `foundation`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/04-data-sources.md` (S1/S2), `src/lib/types.ts` (`Call`), `src/lib/seed/index.ts`

## What
Ingest production call/conversation data into Supabase: per-call rows with `host_id` (pod), `status`,
`closed_reason`, `start_time`/`end_time`/`duration`, per-service usage (LLM tokens, STT minutes, TTS
chars, telephony minutes), per-service latency, `hasData`, tool calls/failures, transcript
(`chat_message`) and error logs (`call_error_log`). Near-real-time (≤15–30 min) + backfill.

## Why
Calls are the richest source feeding Call Logs, Performance, Live Ops, Issues, Cost (usage) and
Business Health. Everything call-related is blocked until this exists.

## How (building on the MVP)
- Source from the real call DB (`chat_conversations`/`conversation_details`/`chat_messages`, see
  `PRD/04` S1) and app logs (Loki, S2). Normalize into the `call` schema from `PLAT-BE1`.
- Python ingestion job/stream; idempotent upserts keyed by `call_id`/`session_id`.
- Capture the fields the MVP seed models (`src/lib/seed/index.ts`) so downstream logic is unchanged:
  usage, latency breakdown, `hasData`, `tool_calls`/`tool_failures`, `closed_reason` (incl. `PIPELINE_TTL_TRIGGERED`).
- Mark `ACTIVE` calls for Live Ops; keep `host_id` for per-pod views.

## Acceptance Criteria
- [ ] Calls land in Supabase within the refresh SLA; ACTIVE calls reflect live state.
- [ ] All fields required by downstream tabs are populated (usage, latency, hasData, tools, reasons).
- [ ] Ingestion is idempotent; backfill for a date range works and doesn't duplicate.
- [ ] Transcript + error logs are linked to their call and queryable by `call_id`/`session_id`.
- [ ] Volume/perf validated at production scale.
