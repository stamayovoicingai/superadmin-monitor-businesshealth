# EPIC — QA Bench / Evals (`QABENCH`)

**Route:** `/qa-bench` · **Roles:** both (config per assigned project) · **Priority:** P4 (Wave 4, Phase 2)
**Blocked by:** `CALLS` (call data + recordings), `ISSUE`/`FLAG` (auto-flag + thresholds patterns)

## Goal
Scheduled evaluation of **real recorded calls**: evaluators (completion, sentiment, compliance,
tool-success, etc.), per-project thresholds (Critical/Warning), auto-flag + notify + optional agent
pause on breach, and an eval builder. **Design-only in the MVP** (route is a stub) — this epic builds it.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- Stub: `src/app/(dashboard)/qa-bench/page.tsx` · spec: `PRD/11-module-qa-bench-evals.md`
- Reuse patterns: auto-flag (`ISSUE`/`FLAG`), thresholds (`THRESH`).

## Features
- F1 — Evaluators, schedules & runs (engine + API) · F2 — Eval builder & results UI · F3 — QA

## Tasks
- `BE-1-evals-engine-api.md` (`QABENCH-BE1`)
- `FE-1-eval-builder-ui.md` (`QABENCH-FE1`)
- `QA-1-evals-tests.md` (`QABENCH-QA1`)

## Open product decisions (from PRD/11)
- Which ~2 external eval libraries; Evals revenue model (credits vs included); who may trigger agent pause.
