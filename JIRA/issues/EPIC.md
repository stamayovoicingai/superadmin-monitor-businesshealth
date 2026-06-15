# EPIC — Issues (`ISSUE`)

**Route:** `/issues` · **Roles:** both (config SuperAdmin) · **Priority:** P1 (Wave 1)
**Blocked by:** `THRESH-BE1`, `_platform` (`PLAT-BE2`), `COST-BE1` (cost_per_call metric)

## Goal
Auto-detect problems by evaluating calls against thresholds: Active Issues + Issues-by-Category, with
7 metrics (per-call: latency, cost/call, duration; aggregate: error rate, abandonment, no-data,
tool-success). Critical breaches auto-flag affected calls (with project) into the Flag Queue.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/issues/page.tsx` · engine `src/lib/engine/issues.ts` · shape `source.ts` (`IssuesResult`)
- `src/app/api/issues/route.ts`, `PRD/05` §4

## Features
- F1 — Issue evaluation engine & API · F2 — Issues UI · F3 — QA

## Tasks
- `BE-1-issue-engine-api.md` (`ISSUE-BE1`)
- `FE-1-issues-ui.md` (`ISSUE-FE1`)
- `QA-1-issues-tests.md` (`ISSUE-QA1`)
