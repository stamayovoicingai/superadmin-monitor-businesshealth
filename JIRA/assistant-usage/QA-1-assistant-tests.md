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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/17`,
  `src/lib/engine/subagents.ts`, `src/lib/data/source.ts` (`AssistantUsageResult`)

## What / Why
Validate per-project/per-subagent usage and cost correctness, and the Overview KPI.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/subagents.ts` where applicable) for the same scope+period.
- Validate the response against the `DataSource` shape `AssistantUsageResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] By-subagent and by-project totals reconcile with the grand total.
- [ ] Cost uses correct LLM pricing per subagent model.
- [ ] Scope/date filters change results; Overview "Assistant Cost" matches this tab for the same scope.
