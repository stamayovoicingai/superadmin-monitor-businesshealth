# EPIC — Assistant Usage (subagents) (`ASST`)

**Route:** `/assistant` · **Roles:** both · **Priority:** P2 (Wave 2)
**Blocked by:** `_platform` (`PLAT-BE1`) + the platform-assistant usage source

## Goal
Track usage & cost of the platform.voicing.ai assistant **per project and per subagent** (Prompt
Writer, Architecture, Debugging, Planning, General — each on its own LLM model). Tracked separately
from call COGS but surfaced as a KPI in Overview.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/assistant/page.tsx` · engine `src/lib/engine/subagents.ts` · shape `source.ts` (`AssistantUsageResult`)
- `src/app/api/assistant/route.ts`, `PRD/17`

## Features
- F1 — Subagent usage ingestion & API · F2 — Assistant Usage UI · F3 — QA

## Tasks
- `BE-1-assistant-usage-api.md` (`ASST-BE1`)
- `FE-1-assistant-ui.md` (`ASST-FE1`)
- `QA-1-assistant-tests.md` (`ASST-QA1`)
