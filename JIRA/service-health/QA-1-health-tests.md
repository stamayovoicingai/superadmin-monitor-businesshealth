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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/18`

## What / Why
Validate health computation, incident affected-projects, scoping, and alerting.

## Acceptance Criteria (scenarios)
- [ ] Status/uptime/heartbeats reflect real checks; incidents created on non-operational.
- [ ] Incident affected-projects correct for provider outages (mapping) and internal services.
- [ ] Email fires on degraded/down/recovery with affected projects; debounce prevents spam.
- [ ] Per-service override beats project recipients; recipients persist.
- [ ] Scope filters internal services; externals always present.
