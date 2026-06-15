# [QA] Thresholds · QA · Threshold config scenarios

- **ID:** `THRESH-QA1`
- **Type:** QA
- **Epic:** Thresholds
- **Feature:** F3 — QA
- **Priority:** P1
- **Blocked by:** `THRESH-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `rbac`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/05` §5

## What / Why
Validate threshold CRUD, scoping, abandonment reasons, and that changes drive Issues correctly.

## Acceptance Criteria (scenarios)
- [ ] Create/edit/delete thresholds and categories persist and survive reload.
- [ ] Changing warning/critical changes which calls/issues fire on next evaluation.
- [ ] Abandonment reason set changes the computed rate accordingly.
- [ ] SuperAdmin-only enforced (User blocked at API + UI).
