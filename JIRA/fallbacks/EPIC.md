# EPIC — Fallback Controls (`FALLB`)

**Route:** `/controls/fallbacks` · **Roles:** SuperAdmin · **Priority:** P3 (Wave 3)
**Blocked by:** `_platform` (`PLAT-BE1`, `PLAT-BE3`)

## Goal
SuperAdmin controls for provider fallback: STT/TTS single fallback model and **LLM cost-ordered list**
(tried in order on failure), scoped globally or per org/project, with a fallback-activity log. **These
configs must actually drive routing in the call pipeline** (the MVP only stores config/state).

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/controls/fallbacks/page.tsx` · engine `src/lib/engine/fallbacks.ts` · shapes `source.ts` (`FallbacksResult`, `UpdateFallbackInput`)
- `src/app/api/fallbacks/route.ts`, `PRD/08`

## Features
- F1 — Fallback config API · F2 — Pipeline integration (enforcement) · F3 — Fallback UI · F4 — QA

## Tasks
- `BE-1-fallback-config-api.md` (`FALLB-BE1`)
- `BE-2-pipeline-integration.md` (`FALLB-BE2`)
- `FE-1-fallback-ui.md` (`FALLB-FE1`)
- `QA-1-fallback-tests.md` (`FALLB-QA1`)
