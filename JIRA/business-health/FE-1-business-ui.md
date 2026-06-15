# [FE] Business Health · UI · Dashboard wire + gating

- **ID:** `BIZ-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Business Health
- **Feature:** F2 — Business Health UI
- **Priority:** P2
- **Blocked by:** `BIZ-BE1`, `PLAT-BE3`
- **Blocks:** `BIZ-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `charts` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/business/page.tsx`, `src/lib/hooks.ts` (`useBusiness`)

## What
Wire the Business Health page (MRR composition, org growth, new/returning callers, usage KPIs, org
leaderboard) to the real API; enforce SuperAdmin-only (access-denied for User).

## How (building on the MVP)
- Page exists with `useBusiness` + SuperAdmin guard. Point at `BIZ-BE1`. Keep MRR/callers/growth charts.
- Server-enforced gating (don't rely on client). Loading/empty/error; responsive.

## Why
The exec view of recurring revenue and platform usage.

## Acceptance Criteria
- [ ] All widgets render from the real API; date range/scope honored.
- [ ] `User` is denied (server + UI); `SuperAdmin` sees all.
- [ ] Loading/empty/error states; responsive; a11y clean.
