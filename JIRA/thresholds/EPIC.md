# EPIC — Thresholds (`THRESH`)

**Route:** `/controls/thresholds` · **Roles:** SuperAdmin · **Priority:** P1 (Wave 1)
**Blocked by:** `_platform` (`PLAT-BE1`, `PLAT-BE3`)

## Goal
Configure Critical/Warning thresholds (per metric, scope, category) that drive Issues. Includes the
abandonment metric's **closed-reason multiselect** and issue-category management.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/controls/thresholds/page.tsx` · engine `src/lib/engine/issues.ts` (`ISSUE_METRICS`, `ABANDONMENT_REASONS`)
- shapes: `source.ts` (`CreateThresholdInput`, `UpdateThresholdPatch`), `src/app/api/thresholds/route.ts`, `PRD/05` §5

## Features
- F1 — Thresholds & categories CRUD API · F2 — Thresholds config UI · F3 — QA

## Tasks
- `BE-1-thresholds-api.md` (`THRESH-BE1`)
- `FE-1-thresholds-ui.md` (`THRESH-FE1`)
- `QA-1-thresholds-tests.md` (`THRESH-QA1`)
