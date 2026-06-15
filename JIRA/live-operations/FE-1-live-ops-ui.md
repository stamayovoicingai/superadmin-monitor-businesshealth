# [FE] Live Operations · UI · Live Ops page wire + realtime

- **ID:** `LIVE-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Live Operations
- **Feature:** F2 — Live Ops UI
- **Priority:** P1
- **Blocked by:** `LIVE-BE1`
- **Blocks:** `LIVE-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `realtime`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/live/page.tsx`, `src/lib/hooks.ts` (`useLiveOps`)

## What
Wire the Live Ops page (concurrency/pods KPIs, pods table, status & end-reason donuts, active calls
table, live indicator + tick) to the real live source, upgrading from polling to streaming where available.

## How (building on the MVP)
- Page exists with `useLiveOps` (20s refetch). Point at `LIVE-BE1`; subscribe to streaming if present,
  else keep interval. Show "● Live" + last-tick.
- Empty state (no active calls); responsive; accessible.

## Why
Operators watch live load and outcomes; the surface must feel live and reliable.

## Acceptance Criteria
- [ ] Active calls/pods/status/end-reason update live (stream or ≤30s poll) without flicker.
- [ ] Live indicator + last-updated shown; empty state handled; responsive; a11y clean.
- [ ] Scoped by org/project; pod links cross-reference Kubernetes view where relevant.
