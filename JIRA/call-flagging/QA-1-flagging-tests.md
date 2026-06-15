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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/10`,
  `src/lib/data/source.ts` (`CallFlag`, `CreateFlagInput`)

## What / Why
Validate manual + auto flagging, triage, comments, scoping and RBAC.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/issues.ts` where applicable, for auto-flags) for the same scope+period.
- Validate the response against the `DataSource` shape `CallFlag` (and `CreateFlagInput`) in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Manual flag from Call Detail creates a queue item (source=manual) with project + note.
- [ ] Critical issues create auto-flags (source=auto) in the same queue, deduped.
- [ ] Status transitions (open→in_review→resolved/dismissed) persist; comments persist.
- [ ] Filters (status/source) and scope work; KPIs correct.
- [ ] Queue is SuperAdmin-only; manual create allowed only for accessible calls.
