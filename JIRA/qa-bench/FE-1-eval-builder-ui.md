# [FE] QA Bench · UI · Eval builder, schedules & results

- **ID:** `QABENCH-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** QA Bench / Evals
- **Feature:** F2 — Eval builder & results UI
- **Priority:** P4
- **Blocked by:** `PLAT-FE1`, `QABENCH-BE1`
- **Blocks:** `QABENCH-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `evals`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/qa-bench/page.tsx` (stub), `PRD/11`

## What
Build the QA Bench UI: evaluator builder (templated / LLM-judge / rule), schedules list (cron, window,
last/next run), run history + results (scores vs thresholds, breaches, linked calls), per-project
threshold editor, and pause-on-critical toggle.

## Why
Replaces the stub with the real Phase-2 surface for authoring and reviewing evals.

## How (building on the MVP)
**Design system:** build on the `/design` tokens + reusable components (voicing.ai system — cream/orange, Inter + Instrument Serif). Reuse `Button`/`Badge`/chips/`Card`/`KpiCard`/`PageHeader`/chart wrappers/`DateRangeControl`; never hardcode colors, fonts, or radii. See `PLAT-FE1`.

- Net-new screens consuming `QABENCH-BE1`. Reuse design system (cards/tables/charts), date range, and
  the threshold/flag UX patterns from `THRESH`/`FLAG`.
- Test an evaluator against a sample of past calls before scheduling.

## Acceptance Criteria
- [ ] Create/version evaluators; configure schedules + per-evaluator thresholds.
- [ ] Run history + results render with scores/breaches and links to affected calls.
- [ ] Pause-on-critical toggle (config-gated by role); empty/error states; responsive; a11y.
