# [FE] Access Management · UI · Provision/edit/revoke screen

- **ID:** `ACCESS-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Access Management & RBAC v2
- **Feature:** F4 — Access Management UI
- **Priority:** P1
- **Blocked by:** `PLAT-FE1`, `ACCESS-BE2`
- **Blocks:** `ACCESS-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `rbac` `admin`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/controls/access-management/page.tsx`, `PRD/20` §2

## What
`/controls/access-management` (SuperAdmin-only, nav under "Admin"): a table of provisioned
PM/Dev/Financial users (email, role badge, granted-scope chips, edit/remove), and an add/edit form
(email, role select, an org/project scope picker — checking a whole org, or individual projects
within it).

## How (building on the MVP)
**Design system:** build on `/design` tokens + reusable components; never hardcode colors, fonts, or
radii. See `PLAT-FE1`.

- Port the MVP page structure: provisioned-users list + inline `UserForm` (email/role/scope picker).
  The scope picker renders one row per org with a checkbox ("whole org"), and — only when that org's
  checkbox is unchecked — a row of per-project checkboxes underneath (this hide/show is what
  communicates "org grant supersedes project grants" without extra copy).
- Grant chips distinguish org-level vs project-level visually (the MVP uses two badge colors) so
  admins can scan a user's access at a glance.
- Client-side guard mirrors the MVP: non-SuperAdmin sees a "SuperAdmin only" locked state, not the
  form (defense in depth alongside `ACCESS-BE2`'s server check).

## Why
This is the only place access gets granted — it needs to be legible enough that a SuperAdmin doesn't
accidentally over- or under-scope someone.

## Acceptance Criteria
- [ ] List, add, edit, and remove all work against the real API (`ACCESS-BE2`).
- [ ] Org-level vs project-level grants are visually distinguishable in both the table and the form.
- [ ] Selecting "whole org" hides that org's individual project checkboxes (and clears any that were
      set, to avoid a confusing mixed state).
- [ ] Non-SuperAdmin roles see a locked state, not the form; empty/loading/error states covered.
