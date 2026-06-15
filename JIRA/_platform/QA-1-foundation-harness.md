# [QA] Platform · Foundation · RBAC matrix + parity & e2e harness

- **ID:** `PLAT-QA1`
- **Type:** QA
- **Epic:** Platform Foundation
- **Feature:** F5 — QA / foundation harness
- **Priority:** P0
- **Blocked by:** `PLAT-BE3`, `PLAT-BE4`
- **Blocks:** —
- **Components/Labels:** `qa` `rbac` `e2e` `foundation`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/01-roles-permissions.md`, `src/lib/data/mock.ts`

## What
Establish the cross-cutting test harness: an end-to-end smoke suite, the RBAC role/scope matrix, and a
**parity harness** that asserts the PostgresAdapter returns the same shapes/values as the mock on a
shared dataset.

## Why
Foundation correctness underpins every tab. RBAC and adapter parity must be guaranteed before tabs go
live on real data.

## How (building on the MVP)
- Parity: run the same queries against mock and Postgres adapters; diff results (shapes + values).
- RBAC: drive the `PRD/01` permission matrix as automated checks (SuperAdmin vs User, per endpoint).
- E2E: auth → navigate each tab → assert it loads with real data and gating applies.

## Acceptance Criteria
- [ ] E2E smoke passes for all tabs against a staging Postgres.
- [ ] RBAC matrix from `PRD/01` is fully automated and green.
- [ ] Adapter parity suite passes (mock vs Postgres) on the shared dataset.
- [ ] Suite runs in CI and gates deploys.
