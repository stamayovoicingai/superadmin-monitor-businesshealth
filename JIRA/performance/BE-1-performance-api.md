# [BE] Performance · API · Latency & error metrics endpoint

- **ID:** `PERF-BE1`
- **Type:** Backend
- **Epic:** Performance
- **Feature:** F1 — Performance metrics API
- **Priority:** P1
- **Blocked by:** `PLAT-BE2`
- **Blocks:** `PERF-FE1`, `PERF-QA1`
- **Components/Labels:** `backend` `python` `supabase` `api` `observability`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/source.ts` (`PerformanceResult`), `src/lib/data/mock.ts` (`performance`), `PRD/05` §1

## What
Endpoint returning `PerformanceResult`: avg latency/call, error rate, per-service latency
(LLM/STT/TTS/tool/telephony), daily latency series, and distribution percentiles (p50/p90/p99).

## Why
Catching latency/error regressions before customers do is core observability.

## How (building on the MVP)
- Honor `PerformanceResult`. Compute from per-call latency fields (`PLAT-BE2`) via aggregates/rollups.
- Add p50/p90/p99 (the MVP shows avg + per-service; extend with percentiles).
- Respect org/project scope + `from`/`to`; rollup-backed for speed.

## Acceptance Criteria
- [ ] Returns `PerformanceResult` (+ percentiles); UI renders.
- [ ] Per-service averages and error rate match fixtures; percentiles correct.
- [ ] Scope + date range honored; p95 < 300 ms on production volumes.
