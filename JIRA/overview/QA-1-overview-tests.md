# [QA] Overview · QA · Landing aggregation & RBAC scenarios

- **ID:** `OVW-QA1`
- **Type:** QA
- **Epic:** Overview
- **Feature:** F3 — QA
- **Priority:** P2
- **Blocked by:** `OVW-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `rbac`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/02` §3, `OverviewResult` in `src/lib/data/source.ts`, `src/lib/engine/aggregate.ts` (rollups) + `src/lib/engine/cost.ts` (org/global vs project reconciliation)

## What / Why
Validate that Overview aggregates match source tabs and respects role.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/aggregate.ts` / `src/lib/engine/cost.ts` where applicable) for the same scope+period.
- Validate the response against the `DataSource` shape `OverviewResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] KPIs (cost, revenue, margin, assistant cost, latency, active calls) match source tabs for the same scope.
- [ ] SuperAdmin sees financials; User sees performance/cost-only variant (no revenue/margin).
- [ ] Scope/date changes propagate consistently; loading/empty/error states correct.
