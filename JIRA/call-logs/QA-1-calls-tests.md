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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/05`,
  `src/lib/engine/aggregate.ts`, `src/lib/data/source.ts` (`CallPage`, `CallFilter`, `CallDetail`)

## What / Why
Validate filtering, pagination, drill-down, detail rendering, recordings, and RBAC for the call surfaces.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/aggregate.ts` where applicable) for the same scope+period.
- Validate the response against the `DataSource` shapes `CallPage` (and `CallDetail`) in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Each filter (status, end_reason incl. `PIPELINE_TTL_TRIGGERED`, flagged, date range, search) returns correct subsets.
- [ ] Pagination + sorting are correct and stable; deep-linked scope works.
- [ ] Row → Call Detail loads the right call; transcript/recording/cost/logs correct.
- [ ] Recording signed URL expires; expired URL handled gracefully.
- [ ] RBAC: `User` never sees revenue/margin in list or detail.
- [ ] Flagging from detail creates a queue item; performance p95 < 300 ms.
