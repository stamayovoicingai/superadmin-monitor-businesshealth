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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/05` §1

## What / Why
Validate latency/error metrics correctness, percentiles, scoping and performance.

## Acceptance Criteria (scenarios)
- [ ] Avg + per-service latency and error rate match fixtures across scopes.
- [ ] p50/p90/p99 are computed correctly (verified against a known dataset).
- [ ] Date range/scope changes update all widgets consistently.
- [ ] Empty/error states correct; dashboard p95 < 300 ms.
