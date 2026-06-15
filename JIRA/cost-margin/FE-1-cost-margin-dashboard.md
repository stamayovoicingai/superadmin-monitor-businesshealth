# [FE] Cost & Margin · Dashboard · Wire UI to real API + harden

- **ID:** `COST-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Cost & Margin
- **Feature:** F4 — Cost & Margin dashboard
- **Priority:** P1
- **Blocked by:** `COST-BE4`
- **Blocks:** `COST-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `charts` `cost`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/cost/page.tsx`, `src/components/charts.tsx`, `src/components/kpi-card.tsx`,
  `src/lib/hooks.ts` (`useCost`)

## What
Productionize the Cost & Margin dashboard: KPI strip (Total Cost, Cost/call, Revenue, Margin %),
cost-by-service stacked area, cost mix donut, cost-vs-revenue chart, and the per-project margin table —
all reading from the real API, with proper loading/empty/error states, responsiveness and a11y.

## Why
The dashboard is the primary surface for the #1 priority. The MVP UI is built; it must run on real
data, behave well on all states/devices, and be accessible and on-brand.

## How (building on the MVP)
- The page exists (`cost/page.tsx`) using `useCost()` → `/api/cost`. Keep the components
  (`CostByServiceChart`, `CostRevenueChart`, `ServiceDonut`, KPI cards, margin table).
- Point `useCost` at the real endpoint (BE-4); no shape change required.
- Add real **empty** (no calls in range) and **error** (retry) states; keep skeletons.
- Make charts/table responsive (stack on mobile); ensure table is keyboard-navigable and has proper
  headers; chart tooltips accessible.
- Respect the global Org/Project + date-range filters (already wired via `ViewContext`).
- Brand tokens already applied; verify dark mode.

## Acceptance Criteria
- [ ] All cost widgets render from the real API across scopes and custom date ranges.
- [ ] Loading, empty, and error states are implemented and visually correct.
- [ ] Layout is responsive (≥320px) and passes basic a11y (axe: no critical issues; keyboard nav).
- [ ] Margin % cells color by polarity; low-margin rows are visually flagged.
- [ ] No revenue/margin widgets render for the `User` role (see FE-2).
