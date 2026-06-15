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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/02` §3

## What / Why
Validate that Overview aggregates match source tabs and respects role.

## Acceptance Criteria (scenarios)
- [ ] KPIs (cost, revenue, margin, assistant cost, latency, active calls) match source tabs for the same scope.
- [ ] SuperAdmin sees financials; User sees performance/cost-only variant (no revenue/margin).
- [ ] Scope/date changes propagate consistently; loading/empty/error states correct.
