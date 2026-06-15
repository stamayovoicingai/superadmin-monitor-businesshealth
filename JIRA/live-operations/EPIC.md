# EPIC — Live Operations (`LIVE`)

**Route:** `/live` · **Roles:** both (scoped) · **Priority:** P1 (Wave 1) · **Blocked by:** `_platform` (`PLAT-BE2`)

## Goal
The only live-updating surface: active calls per pod, concurrency, calls status and call end-reason
breakdowns, active calls table, error log tail.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/live/page.tsx` · shape: `source.ts` (`LiveOpsResult`) · `PRD/07`
- Mirrors the real "Sampras-Telmex" Grafana dashboard (see `PRD/04` S1).

## Features
- F1 — Live ops API + realtime source · F2 — Live Ops UI · F3 — QA

## Tasks
- `BE-1-live-ops-api.md` (`LIVE-BE1`)
- `FE-1-live-ops-ui.md` (`LIVE-FE1`)
- `QA-1-live-ops-tests.md` (`LIVE-QA1`)
