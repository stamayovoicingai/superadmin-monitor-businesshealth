# [BE] Live Operations · API · Live ops endpoint + realtime source

- **ID:** `LIVE-BE1`
- **Type:** Backend
- **Epic:** Live Operations
- **Feature:** F1 — Live ops API + realtime source
- **Priority:** P1
- **Blocked by:** `PLAT-BE2`
- **Blocks:** `LIVE-FE1`, `LIVE-QA1`
- **Components/Labels:** `backend` `python` `postgres` `api` `realtime`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/source.ts` (`LiveOpsResult`), `src/lib/data/mock.ts` (`liveOps`), `PRD/07`, `PRD/04` S1

## What
Endpoint returning `LiveOpsResult`: current concurrency, active pods, active-calls-per-pod table,
calls status counts, call end-reason counts, active calls list, and recent error count — reflecting
**live** state. Provide a low-latency refresh (polling and/or streaming).

## Why
Real-time visibility into what's happening on calls right now (load per pod, why calls end) is the ops
heartbeat.

## How (building on the MVP)
- Honor `LiveOpsResult`. Query live `chat_conversations` (`status='ACTIVE'`, `host_id`,
  `closed_reason`) per `PRD/04` S1 SQL.
- The MVP polls every 20s; in production support **Postgres CDC / SSE (e.g. Supabase Realtime or equivalent)** for active-calls + status,
  falling back to short polling. Keep a stable `LiveSource` seam.
- Scope by org/project; near-real-time freshness (≤30s).

## Acceptance Criteria
- [ ] Returns `LiveOpsResult`; active-calls/pods/status/end-reason reflect live DB state within ≤30s.
- [ ] Streaming (or efficient polling) updates the active set without full reloads.
- [ ] Scope honored; handles 0-active gracefully.
- [ ] Load-tested at expected concurrency.
