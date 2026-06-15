# [FE] Fallbacks · UI · Config page wire

- **ID:** `FALLB-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Fallback Controls
- **Feature:** F3 — Fallback UI
- **Priority:** P3
- **Blocked by:** `PLAT-FE1`, `FALLB-BE1`
- **Blocks:** `FALLB-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/controls/fallbacks/page.tsx`, `src/lib/hooks.ts` (`useFallbacks`, `useUpdateFallback`)

## What
Wire the Fallbacks page (STT/TTS tabs with enable + fallback select; LLM ordered list with reorder/add/
remove + cost labels; scope via Org/Project filter; activity log) to the real API.

## How (building on the MVP)
**Design system:** build on the `/design` tokens + reusable components (voicing.ai system — cream/orange, Inter + Instrument Serif). Reuse `Button`/`Badge`/chips/`Card`/`KpiCard`/`PageHeader`/chart wrappers/`DateRangeControl`; never hardcode colors, fonts, or radii. See `PLAT-FE1`.

- Page exists; point hooks at `FALLB-BE1`. Keep reorder (consider real drag-and-drop vs the MVP's
  up/down buttons). SuperAdmin-only. Loading/error states; responsive.

## Why
SuperAdmins configure resilience without code.

## Acceptance Criteria
- [ ] Config CRUD persists; LLM ordering editable; scope override clear.
- [ ] Activity log shows real fallback events.
- [ ] SuperAdmin-only; responsive; a11y clean.
