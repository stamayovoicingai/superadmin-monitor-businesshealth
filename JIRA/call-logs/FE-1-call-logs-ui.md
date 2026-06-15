# [FE] Call Logs · UI · Call Logs page (filters, pagination, RBAC)

- **ID:** `CALLS-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Call Logs & Call Detail
- **Feature:** F3 — Call Logs UI
- **Priority:** P1
- **Blocked by:** `PLAT-FE1`, `CALLS-BE1`
- **Blocks:** `CALLS-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `table` `observability`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/calls/page.tsx`, `src/lib/hooks.ts` (`useCalls`), `src/components/chips.tsx`

## What
Productionize the Call Logs table: search + status/end-reason filters, server-side pagination, row →
Call Detail, status/end-reason/disposition chips, cost (and margin for SuperAdmin) columns.

## How (building on the MVP)
**Design system:** build on the `/design` tokens + reusable components (voicing.ai system — cream/orange, Inter + Instrument Serif). Reuse `Button`/`Badge`/chips/`Card`/`KpiCard`/`PageHeader`/chart wrappers/`DateRangeControl`; never hardcode colors, fonts, or radii. See `PLAT-FE1`.

- Page exists with `useCalls`. Wire to `CALLS-BE1`; keep debounced search + filters + pagination.
- Real empty/error states; responsive (horizontal scroll/stacked on mobile); accessible table.
- Hide revenue/margin columns for `User`.

## Why
Operators need fast, filterable access to call history with clean drill-down.

## Acceptance Criteria
- [ ] Filters/search/pagination work against the real API; URL-shareable scope.
- [ ] Row click opens Call Detail; chips render correct states (incl. `PIPELINE_TTL_TRIGGERED`).
- [ ] Empty/error/loading states present; responsive; a11y (keyboard + headers).
- [ ] `User` sees no revenue/margin columns.
