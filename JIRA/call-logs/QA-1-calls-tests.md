# [QA] Call Logs · QA · Call logs & detail test scenarios

- **ID:** `CALLS-QA1`
- **Type:** QA
- **Epic:** Call Logs & Call Detail
- **Feature:** F5 — QA
- **Priority:** P1
- **Blocked by:** `CALLS-FE1`, `CALLS-FE2`
- **Blocks:** —
- **Components/Labels:** `qa` `observability` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/05`

## What / Why
Validate filtering, pagination, drill-down, detail rendering, recordings, and RBAC for the call surfaces.

## Acceptance Criteria (scenarios)
- [ ] Each filter (status, end_reason incl. `PIPELINE_TTL_TRIGGERED`, flagged, date range, search) returns correct subsets.
- [ ] Pagination + sorting are correct and stable; deep-linked scope works.
- [ ] Row → Call Detail loads the right call; transcript/recording/cost/logs correct.
- [ ] Recording signed URL expires; expired URL handled gracefully.
- [ ] RBAC: `User` never sees revenue/margin in list or detail.
- [ ] Flagging from detail creates a queue item; performance p95 < 300 ms.
