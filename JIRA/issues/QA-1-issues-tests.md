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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/05` §4, `src/lib/engine/issues.ts` (`evaluateIssues`, `ISSUE_METRICS`), `IssuesResult` in `src/lib/data/source.ts`

## What / Why
Validate each metric's detection, severity, by-category rollup, scoping, and auto-flag behavior.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/issues.ts` where applicable) for the same scope+period.
- Validate the response against the `DataSource` shape `IssuesResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Per-call metrics (latency, cost/call, duration) flag the right calls at warning vs critical.
- [ ] Aggregate metrics (error, abandonment by reason set, no-data, tool-success) compute correct rates and severity.
- [ ] By-category counts and summary (critical/warning/affected/auto-flagged) are correct.
- [ ] Critical breaches produce auto-flags (idempotent) with the correct project, visible in Flag Queue.
- [ ] Scope/date filters change results consistently; parity vs MVP engine on fixtures.
