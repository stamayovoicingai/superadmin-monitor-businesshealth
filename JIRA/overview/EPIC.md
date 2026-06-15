# EPIC — Overview (`OVW`)

**Route:** `/overview` (landing) · **Roles:** both (role-aware) · **Priority:** P2 (Wave 2 — lands after the tabs it aggregates)
**Blocked by:** `COST`, `PERF`, `LIVE`, `ASST`, `ISSUE`

## Goal
Role-aware landing page that answers the most important question first: KPI strip (cost, revenue,
margin %, assistant cost, latency, active calls), cost-by-service, margin/cost by org, projects table,
active issues + live snippet. `User` sees a performance/cost-first variant without financials.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/overview/page.tsx` · shape `source.ts` (`OverviewResult`) · `src/app/api/overview/route.ts` · `PRD/02` §3

## Features
- F1 — Overview aggregation API · F2 — Overview UI (role-aware) · F3 — QA

## Tasks
- `BE-1-overview-api.md` (`OVW-BE1`)
- `FE-1-overview-ui.md` (`OVW-FE1`)
- `QA-1-overview-tests.md` (`OVW-QA1`)
