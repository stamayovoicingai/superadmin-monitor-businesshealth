# [BE] Service Health · Notifications · Recipients, overrides & alerting

- **ID:** `HEALTH-BE2`
- **Type:** Backend
- **Epic:** Service Health
- **Feature:** F2 — Notifications
- **Priority:** P2
- **Blocked by:** `HEALTH-BE1`
- **Blocks:** `HEALTH-QA1`
- **Components/Labels:** `backend` `python` `postgres` `notifications` `email`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `source.ts` (`SetRecipientsInput`, `SetServiceOverrideInput`), `src/app/api/health/route.ts` (PUT), `PRD/18` §3

## What
Per-project notification recipient lists + per-service recipient overrides, and the **alerting engine**
that emails on status transitions (**degraded / down / recovery**), including which projects were
affected.

## Why
Teams must be alerted automatically when a dependency/service degrades, scoped to the impacted projects.

## How (building on the MVP)
- Persist recipients/overrides (the MVP stores them in-memory via `setRecipients`/`setServiceOverride`).
- On a status transition from `HEALTH-BE1`, resolve recipients (per-service override → else project list),
  and send via the email provider; include affected projects + service + status + timestamp.
- Debounce/flap-protection; recovery notifications; idempotent per transition.

## Acceptance Criteria
- [ ] Recipients + per-service overrides persist and are editable.
- [ ] Email fires on degraded, down, and recovery; includes affected projects.
- [ ] Flapping doesn't spam (debounce); each transition notifies once.
- [ ] Per-service override takes precedence over the project list.
