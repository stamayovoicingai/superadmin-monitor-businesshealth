# [BE] Fallbacks · API · Fallback config store & endpoint

- **ID:** `FALLB-BE1`
- **Type:** Backend
- **Epic:** Fallback Controls
- **Feature:** F1 — Fallback config API
- **Priority:** P3
- **Blocked by:** `PLAT-BE1`, `PLAT-BE3`
- **Blocks:** `FALLB-BE2`, `FALLB-FE1`
- **Components/Labels:** `backend` `python` `postgres` `api` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `source.ts` (`FallbacksResult`, `UpdateFallbackInput`, `ServiceFallback`), `src/app/api/fallbacks/route.ts`, `PRD/08`

## What
Persist and serve fallback configs per service (STT/TTS single fallback; LLM ordered list) and scope
(global/org/project), plus the fallback-activity log. SuperAdmin-only.

## How (building on the MVP)
- Honor `FallbacksResult`/`UpdateFallbackInput`. Persist `fallback_config` + `fallback_event` (`PRD/12`).
- Scope override resolution (project/org over global) like the MVP `getFallbacks`.
- SuperAdmin-only (server-side).

## Why
Centralized, scoped fallback configuration is the source of truth the pipeline reads.

## Acceptance Criteria
- [ ] Get/update configs per service+scope; LLM ordered list reorder/add/remove persists.
- [ ] Scope override resolution matches the MVP; activity log queryable.
- [ ] SuperAdmin-only enforced; shapes match the UI.
