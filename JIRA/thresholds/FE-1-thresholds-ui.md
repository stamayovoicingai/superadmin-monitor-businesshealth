# [FE] Thresholds · UI · Thresholds config page wire

- **ID:** `THRESH-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Thresholds
- **Feature:** F2 — Thresholds config UI
- **Priority:** P1
- **Blocked by:** `PLAT-FE1`, `THRESH-BE1`
- **Blocks:** `THRESH-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/controls/thresholds/page.tsx`, `src/lib/hooks.ts` (`useThresholds`, `use*Threshold`, `useCreateCategory`)

## What
Wire the thresholds config page to the real API: editable warning/critical per row, category select,
enable toggle, delete, add-threshold, category management, and the abandonment **reason multiselect**.

## How (building on the MVP)
**Design system:** build on the `/design` tokens + reusable components (voicing.ai system — cream/orange, Inter + Instrument Serif). Reuse `Button`/`Badge`/chips/`Card`/`KpiCard`/`PageHeader`/chart wrappers/`DateRangeControl`; never hardcode colors, fonts, or radii. See `PLAT-FE1`.

- Page exists; point hooks at `THRESH-BE1`. Keep inline edit (commit on blur), switches, reason popover.
- SuperAdmin-only route (hidden + server-enforced). Loading/error states; responsive.

## Why
SuperAdmins must tune detection rules without code changes.

## Acceptance Criteria
- [ ] All CRUD works against the real API; changes reflect in Issues on next eval.
- [ ] Abandonment reason multiselect persists; per-metric units/comparators shown correctly.
- [ ] SuperAdmin-only; `User` cannot reach the page or mutate; responsive; a11y clean.
- [ ] All form `Select`s are controlled from first render (default to a defined value/`""` while data loads) — no Base UI uncontrolled→controlled console warnings, especially the Category select before categories load.
