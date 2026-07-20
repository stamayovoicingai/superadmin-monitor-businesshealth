# [FE] Access Management · UI · Role switcher, scope filters, nav, Overview dual-view

- **ID:** `ACCESS-FE2`
- **Type:** Frontend/UI-UX
- **Epic:** Access Management & RBAC v2
- **Feature:** F5 — Role-switcher, scope-filters, nav, Overview dual-view
- **Priority:** P1
- **Blocked by:** `ACCESS-BE1`, `ACCESS-FE1`
- **Blocks:** `ACCESS-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `rbac` `cross-cutting`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/components/role-switcher.tsx`, `src/components/scope-filters.tsx`, `src/lib/nav.ts`,
  `src/app/(dashboard)/overview/page.tsx`, `src/lib/hooks.ts` (`useCurrentIdentity`), `PRD/01` §2–4

## What
The cross-cutting pieces every other module leans on: a two-step "View as" (role → provisioned
identity, since PM/Dev/Financial grants differ per person), Org/Project top-bar pickers constrained
to the active identity's granted scope, a `roles`-based nav config (replacing the old boolean
`superAdminOnly` flag), and the Overview page's two variants (financial vs ops-only).

## How (building on the MVP)
**Design system:** build on `/design` tokens + reusable components. See `PLAT-FE1`.

- **Role switcher:** dropdown lists all 4 roles; picking PM/Dev/Financial reveals a second list of
  that role's provisioned identities (email) to preview. Auto-selects the first provisioned identity
  of a role when none is chosen yet.
- **Scope filters:** Org dropdown lists only the active identity's granted orgs (no "All orgs" when
  scoped); Project dropdown additionally hides "All projects" for an org where the identity's grant
  is project-level only (`orgRequiresProjectPick`). Auto-corrects the selection via effect when
  switching identity to something no longer valid for the new scope.
- **Nav:** `NavItem.roles?: Role[]` allow-list (undefined = every role) replaces `superAdminOnly`;
  reassign every existing item per `PRD/01` §3's module→role table.
- **Overview:** branch on `canSeeFinancials(role)` — financial variant (cost/revenue/margin KPIs +
  charts + table columns, same as the old SuperAdmin view) vs ops variant (calls/latency/error-rate
  KPIs, calls-by-org chart, no cost column). Both scoped automatically since they read through the
  same Org/Project-filtered query.
- **`useCurrentIdentity()`** hook resolves `{user, orgIds, projectIds}` from the active role +
  simulated identity — the one place this resolution happens, consumed by scope-filters and any
  page needing to know "am I scoped, and to what."

## Why
Every module's RBAC ultimately routes through these four pieces — get them right once here instead
of every module re-deriving "what can I show, and to whom."

## Acceptance Criteria
- [ ] Switching role updates nav, Overview variant, and available Org/Project options correctly.
- [ ] Switching identity within a scoped role updates the effective scope and resets an
      out-of-scope Org/Project selection.
- [ ] A project-level-only grant correctly hides "All projects" for that org; an org-level grant
      correctly shows it.
- [ ] SuperAdmin is unaffected (unrestricted Org/Project pickers, no identity step).
- [ ] Every existing nav item is correctly reassigned per `PRD/01` §3 (spot-check each role sees
      exactly the modules the table says).
