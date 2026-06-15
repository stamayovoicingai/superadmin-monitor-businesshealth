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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/08`,
  `src/lib/engine/fallbacks.ts`, `src/lib/data/source.ts` (`FallbacksResult`, `UpdateFallbackInput`, `ServiceFallback`)

## What / Why
Validate config CRUD/scoping and, crucially, real fallback enforcement in the pipeline.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/fallbacks.ts` where applicable) for the same scope+period.
- Validate the response against the `DataSource` shape `FallbacksResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] STT/TTS primary failure → configured fallback used; call recovers.
- [ ] LLM failure → next model in the ordered list (order respected, not cheapest-live).
- [ ] Platform-wide outage switches in-scope traffic; reverts on recovery.
- [ ] Scope override (project/org/global) honored; `fallback_event`s recorded and shown.
- [ ] SuperAdmin-only config; `User` blocked.
