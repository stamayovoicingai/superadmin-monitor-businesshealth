# EPIC — Access Management & RBAC v2 (`ACCESS`)

**Route:** `/controls/access-management` (+ cross-cutting role gating everywhere) · **Roles:** SuperAdmin
(provisions), PM/Dev/Financial (provisioned identities)
**Backlog priority:** P1 (Wave 1 — every other epic's RBAC references this model) · **Blocked by:**
`_platform` (`PLAT-BE1`, `PLAT-BE3`)

## Goal
Replace the old 2-role model (`SuperAdmin`/`User`) with **4 roles** — `SuperAdmin` (unscoped, full),
`PM` (full, scoped to granted orgs/projects), `Dev` (ops-only, zero cost, scoped), `Financial`
(money-only, scoped) — and let SuperAdmin **explicitly provision** which orgs/projects each
non-SuperAdmin email may see. See `PRD/01-roles-permissions.md` (v2) and
`PRD/20-module-access-management.md` for the full model.

## Outcome (already built in the MVP, client-side — this epic productionizes it)
- `AppUser`/`AccessGrant` schema: org-level or project-level grants, with org→project inheritance
  (same shape as IP Access Control).
- Access Management screen: provision/edit/revoke PM/Dev/Financial identities.
- `lib/auth/policy.ts` (`isSuperAdmin`, `canSeeFinancials`, `canSeeOpsModules`) and
  `lib/auth/scope.ts` (`effectiveOrgIds`, `effectiveProjectIds`, `orgRequiresProjectPick`) as the
  single source of truth, consumed by every module's nav visibility, in-page guard, and
  Org/Project picker constraint.
- "View as" now picks a role **and** which provisioned identity to preview.
- Overview has two variants: financial (SuperAdmin/PM/Financial) and ops-only (Dev, zero cost).
- Call Logs/Call Detail: cost now hidden for Dev (previously all non-SuperAdmin saw cost-to-serve —
  that middle tier no longer exists, see PRD/01 §1).

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- Types: `src/lib/types.ts` (`Role`, `ScopedRole`, `AppUser`, `AccessGrant`)
- Policy/scope: `src/lib/auth/policy.ts`, `src/lib/auth/scope.ts`
- Seed: `src/lib/seed/index.ts` (`APP_USERS_SEED`) · Mock: `src/lib/data/mock.ts` (`appUserStore`,
  `listAppUsers`/`createAppUser`/`updateAppUser`/`deleteAppUser`)
- API: `src/app/api/access-management/route.ts`
- FE: `src/app/(dashboard)/controls/access-management/page.tsx`,
  `src/components/role-switcher.tsx`, `src/components/scope-filters.tsx`,
  `src/app/(dashboard)/overview/page.tsx` (dual variant), `src/lib/nav.ts` (roles-based visibility)
- PRD: `PRD/01-roles-permissions.md`, `PRD/20-module-access-management.md`, `PRD/12` §7

## Features
- F1 — `app_user`/`access_grant` schema + policy/scope engine (BE)
- F2 — Access Management API (BE)
- F3 — Server-side scope enforcement across module APIs (BE)
- F4 — Access Management UI (FE)
- F5 — Role-switcher, scope-filters, nav, Overview dual-view (FE)
- F6 — QA

## Tasks
- `BE-1-schema-policy-scope-engine.md` (`ACCESS-BE1`)
- `BE-2-access-management-api.md` (`ACCESS-BE2`)
- `BE-3-server-side-scope-enforcement.md` (`ACCESS-BE3`)
- `FE-1-access-management-ui.md` (`ACCESS-FE1`)
- `FE-2-role-switcher-scope-filters-overview.md` (`ACCESS-FE2`)
- `QA-1-rbac-scenarios.md` (`ACCESS-QA1`)

## Ripple effect on other epics — read this
Every other epic's tasks were written against the **old 2-role model**; their "RBAC" bullets
(`"User sees cost-to-serve"`, `"SuperAdmin-only"`, etc.) are **superseded** by `PRD/01` v2 — read
`SuperAdmin-only` as "gated per the module→role table in `PRD/01` §3" and `User` as whichever of
`PM`/`Dev`/`Financial` actually applies to that module. This epic does **not** rewrite every other
ticket's text; `ACCESS-BE3` and each epic's own FE/BE work should reconcile against `PRD/01` §3 at
build time, not against the stale wording in older tickets.
