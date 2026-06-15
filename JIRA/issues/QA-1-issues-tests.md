# [QA] Issues · QA · Detection & auto-flag scenarios

- **ID:** `ISSUE-QA1`
- **Type:** QA
- **Epic:** Issues
- **Feature:** F3 — QA
- **Priority:** P1
- **Blocked by:** `ISSUE-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `observability`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `src/lib/engine/issues.ts`, `PRD/05` §4

## What / Why
Validate each metric's detection, severity, by-category rollup, scoping, and auto-flag behavior.

## Acceptance Criteria (scenarios)
- [ ] Per-call metrics (latency, cost/call, duration) flag the right calls at warning vs critical.
- [ ] Aggregate metrics (error, abandonment by reason set, no-data, tool-success) compute correct rates and severity.
- [ ] By-category counts and summary (critical/warning/affected/auto-flagged) are correct.
- [ ] Critical breaches produce auto-flags (idempotent) with the correct project, visible in Flag Queue.
- [ ] Scope/date filters change results consistently; parity vs MVP engine on fixtures.
