# EPIC — Business Health (`BIZ`)

**Route:** `/business` · **Roles:** SuperAdmin only · **Priority:** P2 (Wave 2)
**Blocked by:** `COST-BE3` (contracts/MRR), `_platform` (`PLAT-BE2`)

## Goal
Voicing business + platform-usage metrics: MRR composition (committed/usage/expansion), churn, org
growth, new vs returning callers, minutes/calls, active agents/orgs — SuperAdmin only.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/business/page.tsx` · shape `source.ts` (`BusinessHealthResult`)
- `src/app/api/business/route.ts`, `PRD/09`

## Features
- F1 — Business metrics API · F2 — Business Health UI · F3 — QA

## Tasks
- `BE-1-business-api.md` (`BIZ-BE1`)
- `FE-1-business-ui.md` (`BIZ-FE1`)
- `QA-1-business-tests.md` (`BIZ-QA1`)
