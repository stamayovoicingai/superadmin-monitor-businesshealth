# EPIC — Service Health (`HEALTH`)

**Route:** `/health` · **Roles:** both · **Priority:** P2 (Wave 2) · **Blocked by:** `_platform` (`PLAT-BE1`)

## Goal
Uptime-Kuma-style health of external dependencies (providers) + internal per-project services: status,
uptime %, response time, heartbeats, incidents that list **affected projects**, and email notifications
on degraded/down/recovery (per-project recipients + per-service overrides).

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/health/page.tsx` · shapes `source.ts` (`HealthResult`, `SetRecipientsInput`, `SetServiceOverrideInput`)
- `src/app/api/health/route.ts`, `PRD/18`

## Features
- F1 — Health checks & incidents API · F2 — Notifications (recipients/overrides + alerting) · F3 — Health UI · F4 — QA

## Tasks
- `BE-1-health-api.md` (`HEALTH-BE1`)
- `BE-2-notifications.md` (`HEALTH-BE2`)
- `FE-1-health-ui.md` (`HEALTH-FE1`)
- `QA-1-health-tests.md` (`HEALTH-QA1`)
