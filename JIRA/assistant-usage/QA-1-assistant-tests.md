# [QA] Assistant Usage · QA · Subagent usage/cost scenarios

- **ID:** `ASST-QA1`
- **Type:** QA
- **Epic:** Assistant Usage
- **Feature:** F3 — QA
- **Priority:** P2
- **Blocked by:** `ASST-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `cost`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/17`

## What / Why
Validate per-project/per-subagent usage and cost correctness, and the Overview KPI.

## Acceptance Criteria (scenarios)
- [ ] By-subagent and by-project totals reconcile with the grand total.
- [ ] Cost uses correct LLM pricing per subagent model.
- [ ] Scope/date filters change results; Overview "Assistant Cost" matches this tab for the same scope.
