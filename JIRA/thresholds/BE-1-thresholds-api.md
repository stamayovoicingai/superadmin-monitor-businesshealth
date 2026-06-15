# [BE] Thresholds · API · Thresholds & categories CRUD

- **ID:** `THRESH-BE1`
- **Type:** Backend
- **Epic:** Thresholds
- **Feature:** F1 — Thresholds & categories CRUD API
- **Priority:** P1
- **Blocked by:** `PLAT-BE1`, `PLAT-BE3`
- **Blocks:** `ISSUE-BE1`, `THRESH-FE1`
- **Components/Labels:** `backend` `python` `postgres` `api` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/api/thresholds/route.ts`, `src/lib/data/source.ts` (`CreateThresholdInput`, `UpdateThresholdPatch`),
  `src/lib/engine/issues.ts`, `PRD/05` §5

## What
CRUD for thresholds (metric, scope, warning, critical, category, enabled, and `reasons[]` for
abandonment) and for issue categories. SuperAdmin-only, persisted to Postgres (Supabase or equivalent).

## Why
Thresholds are the rules that define what counts as a problem; Issues depends entirely on this config.

## How (building on the MVP)
- Honor the MVP shapes (`CreateThresholdInput`/`UpdateThresholdPatch`) and the metric catalog in
  `issues.ts` (7 metrics; per-call vs aggregate; comparator gt/lt).
- Persist `threshold` + `issue_category` (see `PLAT-BE1`); `reasons[]` stored on abandonment thresholds.
- SuperAdmin-only (server-side via `PLAT-BE3`).

## Acceptance Criteria
- [ ] Create/update/delete thresholds and create categories; persisted; SuperAdmin-only enforced server-side.
- [ ] Abandonment threshold stores/returns the selected `closed_reason` set.
- [ ] Validation: warning/critical consistent with comparator; unknown metric/category rejected.
- [ ] Shapes match the MVP so `ISSUE-BE1` and the UI consume them unchanged.
