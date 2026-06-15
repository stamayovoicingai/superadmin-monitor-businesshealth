# [QA] Performance · QA · Latency & error metric scenarios

- **ID:** `PERF-QA1`
- **Type:** QA
- **Epic:** Performance
- **Feature:** F3 — QA
- **Priority:** P1
- **Blocked by:** `PERF-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `observability`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/05` §1, `PerformanceResult` in `src/lib/data/source.ts`, `src/lib/engine/aggregate.ts` (latency/error aggregation)

## What / Why
Validate latency/error metrics correctness, percentiles, scoping and performance.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/aggregate.ts` where applicable) for the same scope+period.
- Validate the response against the `DataSource` shape `PerformanceResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Avg + per-service latency and error rate match fixtures across scopes.
- [ ] p50/p90/p99 are computed correctly (verified against a known dataset).
- [ ] Date range/scope changes update all widgets consistently.
- [ ] Empty/error states correct; dashboard p95 < 300 ms.
