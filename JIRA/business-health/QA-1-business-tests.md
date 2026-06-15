# [QA] Business Health · QA · Business metrics scenarios

- **ID:** `BIZ-QA1`
- **Type:** QA
- **Epic:** Business Health
- **Feature:** F3 — QA
- **Priority:** P2
- **Blocked by:** `BIZ-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `finance` `rbac`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/09`,
  `src/lib/data/source.ts` (`BusinessHealthResult`), `src/lib/data/mock.ts` (`businessHealth`)

## What / Why
Validate MRR/composition/churn/growth/usage correctness and SuperAdmin-only access.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/cost.ts` where applicable) for the same scope+period.
- Validate the response against the `DataSource` shape `BusinessHealthResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] MRR + composition reconcile with contracts/cost engine; MoM delta correct.
- [ ] New vs returning callers and org growth correct against a known dataset.
- [ ] Churn matches the agreed definition.
- [ ] `User` cannot access (API + UI); SuperAdmin sees all; date range honored.
