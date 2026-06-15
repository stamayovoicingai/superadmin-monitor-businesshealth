# [QA] Live Operations · QA · Live ops scenarios

- **ID:** `LIVE-QA1`
- **Type:** QA
- **Epic:** Live Operations
- **Feature:** F3 — QA
- **Priority:** P1
- **Blocked by:** `LIVE-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `realtime` `observability`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/07`, `LiveOpsResult` in `src/lib/data/source.ts`, `src/lib/engine/aggregate.ts` (status/end-reason/pod aggregation)

## What / Why
Validate live freshness, correctness of counts, scoping and resilience.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/aggregate.ts` where applicable) for the same scope+period.
- Validate the response against the `DataSource` shape `LiveOpsResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Active-calls-per-pod, status and end-reason counts match the DB at a point in time.
- [ ] Updates appear within the freshness SLA (≤30s) when calls start/end.
- [ ] Scope (org/project) filters live data correctly; 0-active handled.
- [ ] Stream reconnect / polling fallback works; no memory leak over long sessions.
