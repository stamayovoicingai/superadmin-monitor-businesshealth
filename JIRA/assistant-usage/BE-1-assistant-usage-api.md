# [BE] Assistant Usage · API · Subagent usage ingestion & endpoint

- **ID:** `ASST-BE1`
- **Type:** Backend
- **Epic:** Assistant Usage
- **Feature:** F1 — Subagent usage ingestion & API
- **Priority:** P2
- **Blocked by:** `PLAT-BE1`, `COST-BE2` (LLM pricing)
- **Blocks:** `ASST-FE1`, `ASST-QA1`, `OVW-BE1` (assistant cost KPI)
- **Components/Labels:** `backend` `python` `postgres` `api` `cost`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/engine/subagents.ts`, `source.ts` (`AssistantUsageResult`), `src/lib/data/mock.ts` (`assistantUsage`), `PRD/17`

## What
Ingest platform-assistant subagent usage (invocations + input/output tokens per project, per subagent,
per day) and serve `AssistantUsageResult`: totals, by-subagent (with model), by-project, and a daily
cost series. Cost via the LLM pricing catalog.

## Why
Track assistant cost/usage per project and per subagent; surface platform-assistant spend (separate
from call COGS) including in Overview.

## How (building on the MVP)
- Honor `AssistantUsageResult`. Source real subagent usage from the platform LLM gateway/logs; map each
  subagent to its model (`subagents.ts`).
- Cost = tokens × LLM rates (reuse `COST-BE2` pricing / the shared `llmCostMicros` logic ported to Python).
- Persist `subagent_usage` (`PRD/12`); aggregate by scope + date.

## Acceptance Criteria
- [ ] Real per-project, per-subagent usage + cost; shape matches `AssistantUsageResult`.
- [ ] Cost uses effective LLM pricing; by-subagent shows model.
- [ ] Scope + date range honored; totals reconcile with by-subagent and by-project.
- [ ] Provides the assistant-cost figure consumed by `OVW-BE1`.
