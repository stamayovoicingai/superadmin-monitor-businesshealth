# [BE] Invoicing · API · Config & downtime-exclusion CRUD

- **ID:** `INVOICE-BE2`
- **Type:** Backend
- **Epic:** Invoicing (Automated Client Invoice Export)
- **Feature:** F2 — Config & downtime-exclusion API
- **Priority:** P2
- **Blocked by:** `INVOICE-BE1`
- **Blocks:** `INVOICE-FE1`
- **Components/Labels:** `backend` `python` `postgres` `api` `billing`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/api/invoicing/config/route.ts`, `src/app/api/invoicing/downtime/route.ts`, `PRD/21` §4–5

## What
`GET/POST /api/invoicing/config` (fetch own+inherited config+downtime for the current scope, upsert
a config for an exact org/project scope) and `POST/DELETE /api/invoicing/downtime` (add/remove a
downtime exclusion window, scoped org or project).

## Why
This is the read/write path behind the config screen (`INVOICE-FE1`) — everything else (preview,
export, send) reads the config this produces.

## How (building on the MVP)
- `GET config` returns `{own, inherited, downtimeOwn, downtimeInherited}` — `inherited` populated
  only when the scope is a project without its own override (org config bubbles down).
- `POST config` upserts by exact `(scopeType, scopeId)` — matches the MVP's "save = create if none
  exists at this exact scope, else update" behavior (no separate create/update endpoints).
- Validate: ≥1 recipient, ≥1 column selected, `to > from` for downtime windows.
- Enforce role/scope: only SuperAdmin/PM/Financial, and PM/Financial only within their granted
  scope (`ACCESS-BE3`'s enforcement layer applies here too — this endpoint isn't exempt).

## Acceptance Criteria
- [ ] `GET` correctly resolves own vs inherited per `PRD/21` §3.
- [ ] `POST config` upserts (not duplicates) when called again for the same scope.
- [ ] Downtime `POST`/`DELETE` work; invalid ranges (`to <= from`) rejected.
- [ ] A Financial/PM identity without a grant for the requested org/project is rejected server-side.
