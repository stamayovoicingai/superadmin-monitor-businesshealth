# [QA] Fallbacks · QA · Config + enforcement scenarios

- **ID:** `FALLB-QA1`
- **Type:** QA
- **Epic:** Fallback Controls
- **Feature:** F4 — QA
- **Priority:** P3
- **Blocked by:** `FALLB-BE2`, `FALLB-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `reliability` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/08`

## What / Why
Validate config CRUD/scoping and, crucially, real fallback enforcement in the pipeline.

## Acceptance Criteria (scenarios)
- [ ] STT/TTS primary failure → configured fallback used; call recovers.
- [ ] LLM failure → next model in the ordered list (order respected, not cheapest-live).
- [ ] Platform-wide outage switches in-scope traffic; reverts on recovery.
- [ ] Scope override (project/org/global) honored; `fallback_event`s recorded and shown.
- [ ] SuperAdmin-only config; `User` blocked.
