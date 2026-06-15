# EPIC — Call Logs & Call Detail (`CALLS`)

**Routes:** `/calls`, `/calls/[id]` · **Roles:** both (User: no revenue/margin) · **Priority:** P1 (Wave 1)
**Blocked by:** `_platform` (`PLAT-BE1`, `PLAT-BE2`)

## Goal
A filterable call history and a rich per-call detail view (transcript, recording, latency waterfall,
per-service cost, error logs, flagging) — the drill-down hub the whole app links into.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/calls/page.tsx`, `src/app/(dashboard)/calls/[callId]/page.tsx`
- Shapes: `src/lib/data/source.ts` (`CallPage`, `CallDetail`, `CallFilter`), mock `src/lib/data/mock.ts`
- PRD: `PRD/05-module-observability.md` §2-3

## Features
- F1 — Call logs query API · F2 — Call detail API (transcript/recording/cost/logs)
- F3 — Call Logs UI · F4 — Call Detail UI · F5 — QA

## Tasks
- `BE-1-call-logs-api.md` (`CALLS-BE1`)
- `BE-2-call-detail-api.md` (`CALLS-BE2`)
- `FE-1-call-logs-ui.md` (`CALLS-FE1`)
- `FE-2-call-detail-ui.md` (`CALLS-FE2`)
- `QA-1-calls-tests.md` (`CALLS-QA1`)
