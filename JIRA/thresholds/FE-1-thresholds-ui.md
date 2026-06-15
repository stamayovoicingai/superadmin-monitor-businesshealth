# [FE] Thresholds · UI · Thresholds config page wire

- **ID:** `THRESH-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Thresholds
- **Feature:** F2 — Thresholds config UI
- **Priority:** P1
- **Blocked by:** `THRESH-BE1`
- **Blocks:** `THRESH-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/controls/thresholds/page.tsx`, `src/lib/hooks.ts` (`useThresholds`, `use*Threshold`, `useCreateCategory`)

## What
Wire the thresholds config page to the real API: editable warning/critical per row, category select,
enable toggle, delete, add-threshold, category management, and the abandonment **reason multiselect**.

## How (building on the MVP)
- Page exists; point hooks at `THRESH-BE1`. Keep inline edit (commit on blur), switches, reason popover.
- SuperAdmin-only route (hidden + server-enforced). Loading/error states; responsive.

## Why
SuperAdmins must tune detection rules without code changes.

## Acceptance Criteria
- [ ] All CRUD works against the real API; changes reflect in Issues on next eval.
- [ ] Abandonment reason multiselect persists; per-metric units/comparators shown correctly.
- [ ] SuperAdmin-only; `User` cannot reach the page or mutate; responsive; a11y clean.
