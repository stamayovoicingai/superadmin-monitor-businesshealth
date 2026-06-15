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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/05` §5, `CreateThresholdInput` / `UpdateThresholdPatch` in `src/lib/data/source.ts`, `src/lib/engine/issues.ts` (metric catalog / comparator semantics)

## What / Why
Validate threshold CRUD, scoping, abandonment reasons, and that changes drive Issues correctly.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/issues.ts` for the metric catalog/comparator semantics) for the same scope+period.
- Validate the request/response against the `DataSource` shapes `CreateThresholdInput` / `UpdateThresholdPatch` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — thresholds are SuperAdmin-only and must never be writable by User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Create/edit/delete thresholds and categories persist and survive reload.
- [ ] Changing warning/critical changes which calls/issues fire on next evaluation.
- [ ] Abandonment reason set changes the computed rate accordingly.
- [ ] SuperAdmin-only enforced (User blocked at API + UI).
