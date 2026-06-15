# [FE] Infra AWS ELB · UI · Dashboard wire + date range

- **ID:** `ELB-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Infra: AWS ELB
- **Feature:** F2 — ELB UI
- **Priority:** P2
- **Blocked by:** `PLAT-FE1`, `ELB-BE1`
- **Blocks:** `ELB-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `charts` `infra`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/infra/elb/page.tsx`, `src/lib/hooks.ts` (`useInfraElb`), `src/components/date-range-control.tsx`

## What
Wire the ELB page (all CloudWatch panels) to the real API, keeping the **per-tab date range** and
region/load-balancer badges.

## How (building on the MVP)
**Design system:** build on the `/design` tokens + reusable components (voicing.ai system — cream/orange, Inter + Instrument Serif). Reuse `Button`/`Badge`/chips/`Card`/`KpiCard`/`PageHeader`/chart wrappers/`DateRangeControl`; never hardcode colors, fonts, or radii. See `PLAT-FE1`.

- Page exists with `useInfraElb(range)` + `DateRangeControl`. Point at `ELB-BE1`; keep memoized range
  (no refetch loop). Empty/error states; responsive.

## Why
ELB health in-platform with quick time scoping.

## Acceptance Criteria
- [ ] All panels render real data; date range scopes correctly; no refetch loop.
- [ ] Region/LB shown; loading/empty/error states; responsive.
