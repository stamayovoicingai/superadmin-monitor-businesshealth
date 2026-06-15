# [FE] Overview · UI · Role-aware landing wire

- **ID:** `OVW-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Overview
- **Feature:** F2 — Overview UI
- **Priority:** P2
- **Blocked by:** `OVW-BE1`, `PLAT-BE3`
- **Blocks:** `OVW-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `charts` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/overview/page.tsx`, `src/lib/hooks.ts` (`useOverview`)

## What
Wire the role-aware Overview (KPI strip incl. assistant cost, cost-by-service, margin/cost-by-org,
projects table, live snippet) to the real API. SuperAdmin sees financials; User sees performance/cost.

## How (building on the MVP)
- Page exists with `useOverview` + financial gating. Point at `OVW-BE1`. Keep role-aware KPI strip and
  charts. Empty/error states; responsive.

## Why
First screen users land on; must be fast, accurate, and role-appropriate.

## Acceptance Criteria
- [ ] All widgets render from the real API; SuperAdmin vs User variants correct.
- [ ] Assistant cost + margin KPIs match their source tabs; scope/date honored.
- [ ] Loading/empty/error states; responsive; a11y clean.
