# [QA] Service Health · QA · Health & alerting scenarios

- **ID:** `HEALTH-QA1`
- **Type:** QA
- **Epic:** Service Health
- **Feature:** F4 — QA
- **Priority:** P2
- **Blocked by:** `HEALTH-FE1`, `HEALTH-BE2`
- **Blocks:** —
- **Components/Labels:** `qa` `observability` `notifications`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/18`, `HealthResult` (+ `SetRecipientsInput`, `SetServiceOverrideInput`) in `src/lib/data/source.ts`, `health` impl in `src/lib/data/mock.ts`

## What / Why
Validate health computation, incident affected-projects, scoping, and alerting.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (the `health` impl, incl. the `projectsUsingProvider` mapping) for the same scope+period.
- Validate the response against the `DataSource` shape `HealthResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Status/uptime/heartbeats reflect real checks; incidents created on non-operational.
- [ ] Incident affected-projects correct for provider outages (mapping) and internal services.
- [ ] Email fires on degraded/down/recovery with affected projects; debounce prevents spam.
- [ ] Per-service override beats project recipients; recipients persist.
- [ ] Scope filters internal services; externals always present.
