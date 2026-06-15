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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/09`

## What / Why
Validate MRR/composition/churn/growth/usage correctness and SuperAdmin-only access.

## Acceptance Criteria (scenarios)
- [ ] MRR + composition reconcile with contracts/cost engine; MoM delta correct.
- [ ] New vs returning callers and org growth correct against a known dataset.
- [ ] Churn matches the agreed definition.
- [ ] `User` cannot access (API + UI); SuperAdmin sees all; date range honored.
