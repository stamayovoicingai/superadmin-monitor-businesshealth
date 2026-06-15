# [BE] Platform · Auth · Authentication & server-side RBAC

- **ID:** `PLAT-BE3`
- **Type:** Backend
- **Epic:** Platform Foundation
- **Feature:** F3 — Authentication & RBAC
- **Priority:** P0
- **Blocked by:** `PLAT-BE1`
- **Blocks:** all secured endpoints + all FE gating (esp. `COST-FE2`, `BIZ-*`, every SuperAdmin-only tab)
- **Components/Labels:** `backend` `supabase` `auth` `rbac` `security` `foundation`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/auth/policy.ts`, `src/components/financial-gate.tsx`, `PRD/01-roles-permissions.md`

## What
Real authentication (internal Voicing staff) and **server-side RBAC** with two roles: **SuperAdmin**
(everything incl. financials) and **User** (project performance + cost-to-serve; never revenue/margin/
business). Roles carry `org_id`/`project_ids` scoping. Replace the MVP's client-side "View-as" demo.

## Why
Financial data and SuperAdmin-only controls must be protected at the API/DB layer — client gating is
not security. This is required before any real financial endpoint ships.

## How (building on the MVP)
- Use Supabase Auth (or the platform's SSO) for sessions; map users to `app_user` (`role`, `org_id`,
  `project_ids`).
- Encode the MVP policy (`policy.ts`: `canSeeFinancials`, `canSeeCost`, `canSeeSuperAdminOnly`) as the
  single source of truth shared by API authorization and **Supabase RLS**.
- Enforce on every endpoint: scope by `org_id`/`project_ids`; **omit** revenue/margin fields for `User`.
- Keep `policy.ts` predicates in the FE for UX (hide/disable), but never rely on them for protection.
- Provide a way to impersonate/test roles in non-prod (replacing the demo switcher).

## Acceptance Criteria
- [ ] Authenticated sessions resolve a role + scope; unauthenticated requests are rejected.
- [ ] `User` cannot retrieve revenue/margin/business data from any endpoint (verified by tests).
- [ ] SuperAdmin-only routes/endpoints (fallbacks, thresholds config, flag queue, infra, business,
  IP access) are denied to `User` server-side.
- [ ] RLS policies mirror `policy.ts`; scope leakage across orgs/projects is impossible.
- [ ] Security tests cover role/scope matrix from `PRD/01`.
