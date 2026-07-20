# [BE] Access Management · API · Provision/edit/revoke users

- **ID:** `ACCESS-BE2`
- **Type:** Backend
- **Epic:** Access Management & RBAC v2
- **Feature:** F2 — Access Management API
- **Priority:** P1
- **Blocked by:** `ACCESS-BE1`
- **Blocks:** `ACCESS-FE1`, `ACCESS-BE3`
- **Components/Labels:** `backend` `python` `postgres` `api` `rbac` `auth`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/api/access-management/route.ts`, `src/lib/data/mock.ts`
  (`listAppUsers`/`createAppUser`/`updateAppUser`/`deleteAppUser`), `PRD/20` §4

## What
CRUD endpoints for provisioned users: list, create (email + role + grants, ≥1 grant required),
update (role and/or grants), delete (revoke all access). Matches the MVP's
`listAppUsers`/`createAppUser`/`updateAppUser`/`deleteAppUser` shapes.

## Why
This is the read/write path behind the Access Management screen (`ACCESS-FE1`) and the source of
truth `ACCESS-BE3` reads to enforce scope on every other module's API.

## How (building on the MVP)
- Validate email shape and role (`pm`/`dev`/`financial` only — SuperAdmin isn't provisioned here).
- Require ≥1 grant on create (matches MVP's `at_least_one_grant_required` validation).
- Update replaces the full `grants` array when provided (not a partial patch) — matches MVP behavior.
- **SuperAdmin-only endpoint** — enforce server-side, not just via the FE guard.

## Acceptance Criteria
- [ ] `GET/POST/PATCH/DELETE` match the MVP's request/response shapes.
- [ ] Invalid email / invalid role / zero grants on create are rejected with clear error codes.
- [ ] Only SuperAdmin callers can reach this endpoint (401/403 otherwise).
- [ ] Deleting a user immediately revokes their effective scope for subsequent requests.
