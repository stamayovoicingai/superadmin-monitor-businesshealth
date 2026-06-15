# EPIC — Performance (`PERF`)

**Route:** `/performance` · **Roles:** both · **Priority:** P1 (Wave 1) · **Blocked by:** `_platform` (`PLAT-BE2`)

## Goal
Latency and reliability per project/service: overall + per-service latency (LLM/STT/TTS/tool/telephony),
p50/p90/p99, error rate, with trends.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/performance/page.tsx` · shape: `source.ts` (`PerformanceResult`) · `PRD/05` §1

## Features
- F1 — Performance metrics API · F2 — Performance UI · F3 — QA

## Tasks
- `BE-1-performance-api.md` (`PERF-BE1`)
- `FE-1-performance-ui.md` (`PERF-FE1`)
- `QA-1-performance-tests.md` (`PERF-QA1`)
