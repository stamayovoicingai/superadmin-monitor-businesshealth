# [BE] Issues · Engine & API · Threshold evaluation + auto-flag

- **ID:** `ISSUE-BE1`
- **Type:** Backend
- **Epic:** Issues
- **Feature:** F1 — Issue evaluation engine & API
- **Priority:** P1
- **Blocked by:** `THRESH-BE1`, `PLAT-BE2`, `COST-BE1`
- **Blocks:** `ISSUE-FE1`, `FLAG-BE1` (auto-flags), `ISSUE-QA1`
- **Components/Labels:** `backend` `python` `supabase` `api` `observability`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/engine/issues.ts` (`evaluateIssues`, `ISSUE_METRICS`), `source.ts` (`IssuesResult`), `src/app/api/issues/route.ts`, `PRD/05` §4

## What
Evaluate calls in scope against enabled thresholds and return `IssuesResult` (active issues +
by-category rollup + summary). Implement all 7 metrics — per-call (latency, cost/call, duration) and
aggregate (error rate, abandonment with reason set, no-data, tool-success). On **Critical** breaches,
auto-flag affected calls (recording the project) into the flag store.

## Why
This turns raw calls + thresholds into actionable problems and routes the worst to review automatically.

## How (building on the MVP)
- Port `evaluateIssues` + `ISSUE_METRICS` (the spec) to Python; same per-call vs aggregate logic,
  comparator semantics, severity selection, and affected-call sampling.
- Read calls (`PLAT-BE2`), thresholds (`THRESH-BE1`), and per-call cost (`COST-BE1`).
- Auto-flag: upsert `flag-auto-*` records (idempotent) into the flags store with the affected project
  (`FLAG` epic owns the store/API).
- Scope by org/project + `from`/`to`. Consider precomputing on a schedule for large windows.

## Acceptance Criteria
- [ ] All 7 metrics evaluated; outputs match the MVP engine on shared fixtures.
- [ ] Abandonment honors the threshold's `reasons[]`; tool-success uses tool calls/failures; no-data uses `hasData`.
- [ ] Critical breaches create idempotent auto-flags carrying the project.
- [ ] `IssuesResult` (issues + byCategory + summary incl. autoFlagged) matches the shape; scope/date honored.
- [ ] Performance acceptable on production windows (precompute/rollup where needed).
