# [BE] Call Logs · API · Filterable, paginated call logs endpoint

- **ID:** `CALLS-BE1`
- **Type:** Backend
- **Epic:** Call Logs & Call Detail
- **Feature:** F1 — Call logs query API
- **Priority:** P1
- **Blocked by:** `PLAT-BE1`, `PLAT-BE2`
- **Blocks:** `CALLS-FE1`, `CALLS-QA1`
- **Components/Labels:** `backend` `python` `supabase` `api` `observability`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/source.ts` (`CallPage`, `CallFilter`), `src/app/api/calls/route.ts`, `src/lib/data/mock.ts` (`listCalls`)

## What
An endpoint returning a **paginated, filterable** call list (`CallPage`): fields call_id, agent,
org/project, start, duration, status, end reason, disposition, latency, cost (+ revenue/margin for
SuperAdmin), flagged. Filters: org/project/agent, date range, status, closed_reason, flagged,
cost/latency ranges, free-text (call_id/session_id/host_id).

## Why
The call log is the operational backbone and the entry point for drill-downs across the app.

## How (building on the MVP)
- Honor the `CallPage`/`CallFilter` shapes so the UI is unchanged.
- Implement against Supabase (indexed on org_id/project_id/start_time/status); server-side pagination
  + sorting; explicit `from`/`to` window (match `scopeFromSearch`).
- **RBAC:** omit revenue/margin for `User`.
- Free-text search across `call_id`/`session_id`/`host_id`.

## Acceptance Criteria
- [ ] Returns `CallPage`; UI renders unchanged; sort/filter/paginate work server-side.
- [ ] p95 < 300 ms at production volumes with all filters applied.
- [ ] `User` rows contain no revenue/margin.
- [ ] CSV export endpoint for SuperAdmin (bulk), respecting filters.
- [ ] Parity test vs MVP mock on shared dataset.
