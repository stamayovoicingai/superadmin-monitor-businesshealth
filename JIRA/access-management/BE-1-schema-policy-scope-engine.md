# [BE] Access Management · Schema · app_user/access_grant + policy/scope engine

- **ID:** `ACCESS-BE1`
- **Type:** Backend
- **Epic:** Access Management & RBAC v2
- **Feature:** F1 — `app_user`/`access_grant` schema + policy/scope engine
- **Priority:** P1
- **Blocked by:** `PLAT-BE1`
- **Blocks:** `ACCESS-BE2`, `ACCESS-BE3`, `ACCESS-FE2`
- **Components/Labels:** `backend` `python` `postgres` `rbac` `auth` `foundation`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/types.ts` (`Role`, `ScopedRole`, `AppUser`, `AccessGrant`), `src/lib/auth/policy.ts`,
  `src/lib/auth/scope.ts`, `PRD/01-roles-permissions.md` v2, `PRD/20`, `PRD/12` §7

## What
Port the MVP's 4-role model to production: `app_user` (`role`: `superadmin`/`pm`/`dev`/`financial`)
and `access_grant` (`scope_type`: `org`/`project`, `scope_id`) tables, plus the two policy modules the
MVP already ships as the reference implementation: `policy.ts` (`isSuperAdmin`, `canSeeFinancials`,
`canSeeOpsModules` — module-category predicates) and `scope.ts` (`effectiveOrgIds`,
`effectiveProjectIds`, `canAccessOrg`, `canAccessProject`, `orgRequiresProjectPick` — org→project
inheritance, same semantics as `IpRule`/doc 16).

## Why
Every other module's RBAC (client-side today) and this epic's server-side enforcement (`ACCESS-BE3`)
both read through these two modules — get the scope math right once, here, instead of re-deriving it
per module. The MVP's `lib/auth/scope.ts` is already the reference: it correctly resolves both
org-level grants (inherit all projects) and project-level-only grants (no "all projects" for that
org) — verified against the seeded fixtures during MVP development.

## How (building on the MVP)
- Tables per `PRD/12` §7: `app_user(id, email, role, created_at)`,
  `access_grant(id, app_user_id fk, scope_type, scope_id, created_at)`. SuperAdmin rows carry no
  grants (implicit unrestricted).
- Port `canSeeFinancials`/`canSeeOpsModules`/`isSuperAdmin` verbatim (pure functions, trivial port).
- Port `effectiveOrgIds`/`effectiveProjectIds`/`orgRequiresProjectPick` verbatim — these are pure
  functions over `(app_user, projects)`, no framework dependency, straightforward Python port.
- Real auth: this task does **not** build login — it's the data model + pure policy functions only.
  Wiring real identity (SSO/magic-link) to an `app_user` row is a separate, currently-unscoped effort
  (`PRD/20` §6 open question) — flag if prioritized.

## Acceptance Criteria
- [ ] `app_user`/`access_grant` tables exist, matching `PRD/12` §7.
- [ ] Policy predicates match the MVP's role→capability table (`PRD/01` §3) exactly.
- [ ] Scope functions produce identical output to the MVP for the seeded fixtures (org-level grant →
      all projects inherited; project-level-only grant → that org's "all projects" is NOT implied).
- [ ] Unit tests cover: SuperAdmin (unrestricted), org-level grant, project-level grant, mixed grants
      across multiple orgs, zero grants (sees nothing).
