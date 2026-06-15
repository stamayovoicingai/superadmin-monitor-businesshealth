# [FE] Performance · UI · Performance dashboard wire + harden

- **ID:** `PERF-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Performance
- **Feature:** F2 — Performance UI
- **Priority:** P1
- **Blocked by:** `PERF-BE1`
- **Blocks:** `PERF-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `charts`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/performance/page.tsx`, `src/lib/hooks.ts` (`usePerformance`)

## What
Wire the Performance page (latency KPIs, per-service bars, latency trend, error rate) to the real API;
add a p50/p90/p99 distribution view; harden states/responsive/a11y.

## How (building on the MVP)
- Page exists with `usePerformance`. Point at `PERF-BE1`; add a percentiles chart.
- Real empty/error states; responsive; accessible charts/tooltips.

## Why
Operators need a quick read on whether the platform is fast and reliable per service.

## Acceptance Criteria
- [ ] KPIs, per-service latency, trend, error rate, and percentiles render from the real API.
- [ ] Scope + date range honored; loading/empty/error states; responsive; a11y clean.
