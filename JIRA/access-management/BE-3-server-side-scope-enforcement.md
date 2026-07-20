# [BE] Access Management · Enforcement · Server-side scope on every module API

- **ID:** `ACCESS-BE3`
- **Type:** Backend
- **Epic:** Access Management & RBAC v2
- **Feature:** F3 — Server-side scope enforcement across module APIs
- **Priority:** P1
- **Blocked by:** `ACCESS-BE1`, `ACCESS-BE2`, `PLAT-BE3`
- **Blocks:** `ACCESS-QA1`
- **Components/Labels:** `backend` `python` `rbac` `auth` `security` `cross-cutting`
- **Estimate:** 13
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/01` §6 ("enforced client-side today, must be enforced server-side in production"),
  `PRD/01` §3 (module→role table), `PRD/20` §4

## What
The MVP enforces the 4-role model **client-side only**: `nav.ts` hides sections, each page has an
in-page guard (`canSeeFinancials`/`canSeeOpsModules`/`isSuperAdmin`), and `scope-filters.tsx`
constrains which org/project can be selected — but nothing stops a authenticated-but-out-of-scope
request from hitting an API route directly. This task adds the real gate: every module endpoint
must resolve the caller's `app_user` (once real auth exists, `PLAT-BE3`) and (a) reject requests for
modules their role can't see, (b) filter/reject results outside their effective org/project scope.

## Why
Client-side gating is a UX nicety, not security. Financial data reaching a Dev browser tab (even if
the UI never renders it) is the exact leak `PRD/01`'s role split exists to prevent — this task is
where that actually gets enforced.

## How (building on the MVP)
- Every module API handler: resolve caller → `app_user` (or SuperAdmin) → apply the same
  `canSeeFinancials`/`canSeeOpsModules` predicate (`ACCESS-BE1`) the module's nav entry uses
  (`PRD/01` §3) — reject (403) if the role can't see this module at all.
- For allowed-but-scoped roles: intersect the request's `org_id`/`project_id` filters against
  `effectiveOrgIds`/`effectiveProjectIds` (`ACCESS-BE1`) — reject or silently narrow (pick one
  consistently and document it) if the caller asks for something outside their grant.
- This is the same shape as Supabase RLS policies would enforce — if RLS is used, this task may
  largely become "write the RLS policies" instead of per-endpoint checks; pick whichever the team's
  Supabase setup makes more maintainable, but the *outcome* (no cross-scope leakage) is what's graded.
- Financial-only fields (cost/revenue/margin/MRR) must never appear in a Dev-role response body, not
  just be hidden by the FE — this is the concrete leak this task closes.

## Acceptance Criteria
- [ ] A Dev-role request to `/cost` (or any Financial-only endpoint) is rejected server-side.
- [ ] A Financial-role request to `/calls` (or any ops-only endpoint) is rejected server-side.
- [ ] A PM/Dev/Financial request with an out-of-scope `org_id`/`project_id` is rejected or narrowed
      (not silently ignored in a way that leaks other orgs' data).
- [ ] Call Logs/Call Detail responses omit `cost`/`revenue`/`margin` fields entirely for Dev callers
      (not just null — omitted, so no shape hints leak).
- [ ] SuperAdmin is unaffected (no regression).
