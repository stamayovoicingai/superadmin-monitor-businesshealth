# [QA] Call Flagging · QA · Queue & flagging scenarios

- **ID:** `FLAG-QA1`
- **Type:** QA
- **Epic:** Call Flagging
- **Feature:** F3 — QA
- **Priority:** P1
- **Blocked by:** `FLAG-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `rbac`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/10`

## What / Why
Validate manual + auto flagging, triage, comments, scoping and RBAC.

## Acceptance Criteria (scenarios)
- [ ] Manual flag from Call Detail creates a queue item (source=manual) with project + note.
- [ ] Critical issues create auto-flags (source=auto) in the same queue, deduped.
- [ ] Status transitions (open→in_review→resolved/dismissed) persist; comments persist.
- [ ] Filters (status/source) and scope work; KPIs correct.
- [ ] Queue is SuperAdmin-only; manual create allowed only for accessible calls.
