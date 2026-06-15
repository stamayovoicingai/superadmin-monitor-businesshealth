# [BE] Call Logs · API · Call detail (transcript, recording, cost, logs)

- **ID:** `CALLS-BE2`
- **Type:** Backend
- **Epic:** Call Logs & Call Detail
- **Feature:** F2 — Call detail API
- **Priority:** P1
- **Blocked by:** `PLAT-BE2`, `COST-BE1` (per-service cost)
- **Blocks:** `CALLS-FE2`, `CALLS-QA1`
- **Components/Labels:** `backend` `python` `postgres` `api` `storage`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/source.ts` (`CallDetail`), `src/app/(dashboard)/calls/[callId]/page.tsx`, `PRD/05` §3, `PRD/04` S7

## What
An endpoint returning a single call's full detail: transcript (`chat_message`), **recording** via a
short-lived signed URL, per-turn/per-service latency, per-service cost breakdown (+ revenue/margin for
SuperAdmin), and error logs scoped to the call.

## Why
Call Detail is the investigation surface for flagged/issue calls; it must show real transcript, audio,
cost and errors.

## How (building on the MVP)
- Honor the `CallDetail` shape. The MVP generates transcript/logs client-side — replace with real
  `chat_message`/`call_error_log` from ingestion (`PLAT-BE2`).
- Recordings: object storage (S3/GCS) with **signed URLs** (mirror MVP `recordingUrl` pattern); never
  expose permanent URLs.
- Per-service cost from `call_cost` (`COST-BE1`); RBAC omits revenue/margin for `User`.

## Acceptance Criteria
- [ ] Returns real transcript, latency waterfall, per-service cost, and error logs for a call.
- [ ] Recording plays via a signed URL that expires; no public URLs.
- [ ] `User` sees cost-to-serve but no revenue/margin.
- [ ] 404 for unknown call; authorized scope enforced.
