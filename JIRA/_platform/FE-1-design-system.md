# [FE] Platform · Design system · Tokens, fonts & reusable component library

- **ID:** `PLAT-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Platform Foundation
- **Feature:** F6 — Design system & component library
- **Priority:** P0
- **Blocked by:** —
- **Blocks:** every Frontend task (all `*-FE*`)
- **Components/Labels:** `frontend` `nextjs` `design-system` `ui-ux` `foundation`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/globals.css` (tokens), `src/app/(dashboard)/design/page.tsx` (live showcase),
  `src/components/*` (reusable components), `PRD/14-design-system.md`

## What
The shared design system every screen is built from: design tokens (colors, typography, radius,
spacing), fonts, and a reusable component library — with a **live showcase at `/design`** that renders
all tokens + components as the single source of truth for frontend.

## Why
The system was **extracted from the live site voicing.ai** (warm cream + vivid orange, Inter + Instrument
Serif). Every FE task must build on it — reusing tokens/components and never hardcoding colors/fonts — so
the product stays consistent and FE work is fast.

## How (building on the MVP)
- Tokens already exist in `src/app/globals.css` (light + dark, voicing.ai-derived): `--primary` orange,
  cream `--background`, ink `--foreground`, dark sidebar, semantic `success/warning/critical`, and a
  chart palette (`--chart-1…5`). Fonts: Inter (UI, `font-sans`) + Instrument Serif (display,
  `font-display`, used on page titles + KPI numbers) + Geist Mono.
- Productionize: finalize tokens, verify AA contrast (esp. amber `--warning` vs orange `--primary`,
  dark mode), and keep the `/design` showcase current. Consider Storybook for component docs later.
- Reusable components to standardize on: `Button`, `Badge`/chips (`StatusChip`, `SeverityBadge`,
  `EndReasonChip`, `DispositionBadge`, `LiveDot`), `Card`, `KpiCard`, `PageHeader`, charts
  (`CostByServiceChart`, `MultiLineChart`, `GaugeChart`, donuts, `HBarChart`), `DateRangeControl`,
  `DataTable` patterns, form controls.

## Acceptance Criteria
- [ ] Tokens finalized in `globals.css`; no hardcoded colors/fonts anywhere in app code.
- [ ] `/design` showcase renders every token + reusable component and stays in sync.
- [ ] Light + dark pass AA contrast on key text/surfaces; brand fonts load (Inter + Instrument Serif).
- [ ] FE tasks consume these primitives (enforced in review); a short "how to use the design system" note exists.
