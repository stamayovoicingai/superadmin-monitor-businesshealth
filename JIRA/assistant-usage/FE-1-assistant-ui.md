# [FE] Assistant Usage · UI · Page wire + harden

- **ID:** `ASST-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Assistant Usage
- **Feature:** F2 — Assistant Usage UI
- **Priority:** P2
- **Blocked by:** `PLAT-FE1`, `ASST-BE1`
- **Blocks:** `ASST-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `charts`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/assistant/page.tsx`, `src/lib/hooks.ts` (`useAssistant`)

## What
Wire the Assistant Usage page (KPIs, daily cost trend, cost-by-subagent table with model, cost-by-project
bar) to the real API.

## How (building on the MVP)
**Design system:** build on the `/design` tokens + reusable components (voicing.ai system — cream/orange, Inter + Instrument Serif). Reuse `Button`/`Badge`/chips/`Card`/`KpiCard`/`PageHeader`/chart wrappers/`DateRangeControl`; never hardcode colors, fonts, or radii. See `PLAT-FE1`.

- Page exists with `useAssistant`. Point at `ASST-BE1`. Empty/error states; responsive; a11y.

## Why
Visibility into platform-assistant spend per project/subagent.

## Acceptance Criteria
- [ ] KPIs, trend, by-subagent, by-project render from the real API; scope/date honored.
- [ ] Loading/empty/error states; responsive; a11y clean.
