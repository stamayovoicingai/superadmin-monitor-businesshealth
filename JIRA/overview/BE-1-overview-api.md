# [BE] Overview · API · Aggregated landing metrics

- **ID:** `OVW-BE1`
- **Type:** Backend
- **Epic:** Overview
- **Feature:** F1 — Overview aggregation API
- **Priority:** P2
- **Blocked by:** `COST-BE4`, `ASST-BE1`, `PLAT-BE2`
- **Blocks:** `OVW-FE1`, `OVW-QA1`
- **Components/Labels:** `backend` `python` `postgres` `api` `rbac`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `source.ts` (`OverviewResult`), `src/lib/data/mock.ts` (`overview`), `PRD/02` §3

## What
Endpoint returning `OverviewResult`: totals (cost, revenue, margin, avg latency, error rate),
active concurrency, **assistant cost**, per-project and per-org rollups, and a cost-by-service series —
honoring the same scope reconciliation as Cost & Margin.

## Why
The landing page must summarize the whole platform at a glance for the active scope/role.

## How (building on the MVP)
- Honor `OverviewResult`. Aggregate from `period_rollup`/`call_cost` (cost/margin), calls (latency/
  active), and assistant usage (`ASST-BE1`).
- Reuse the org/global vs project reconciliation rule from `COST-BE3`.
- **RBAC:** omit revenue/margin for `User`.

## Acceptance Criteria
- [ ] Returns `OverviewResult`; numbers match the source tabs for the same scope (no drift).
- [ ] Assistant cost KPI matches the Assistant tab; margin reconciles with Cost & Margin.
- [ ] `User` response omits revenue/margin; scope/date honored; p95 < 300 ms (rollup-backed).
