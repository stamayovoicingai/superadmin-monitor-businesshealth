# [BE] QA Bench · Engine & API · Evaluators, schedules, runs & actions

- **ID:** `QABENCH-BE1`
- **Type:** Backend
- **Epic:** QA Bench / Evals
- **Feature:** F1 — Evaluators, schedules & runs
- **Priority:** P4
- **Blocked by:** `CALLS-BE2`, `THRESH-BE1`, `FLAG-BE1`
- **Blocks:** `QABENCH-FE1`, `QABENCH-QA1`
- **Components/Labels:** `backend` `python` `postgres` `evals` `api`
- **Estimate:** 13
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/11`

## What
An evaluation system that runs **evaluators** over real recorded calls on a **schedule** (per project,
min daily), compares results to **per-project thresholds** (Critical/Warning), and on breach: auto-flags
the call (→ Flag Queue), notifies, and optionally pauses the agent (config-gated). Includes evaluator
definitions, schedules, runs, and results storage.

## Why
Continuous, automated quality monitoring of conversations without manual review — Phase 2 capability.

## How (building on the MVP)
- New build (design-only in MVP). Model `evaluator`, `eval_schedule`, `eval_run`, `eval_result`,
  `eval_threshold` (`PRD/11` §6).
- Evaluators: templated metrics (completion/containment/sentiment/compliance/tool-success/latency),
  LLM-judge (prompt+rubric), and rule-based; run only over **already-recorded** calls.
- Reuse: auto-flag into `FLAG-BE1`; threshold semantics from `THRESH`.
- Integrate the chosen ~2 external eval libraries; cron scheduling; idempotent runs.

## Acceptance Criteria
- [ ] Define/version evaluators; schedule per project (≥ daily); runs execute over the call window.
- [ ] Per-evaluator thresholds produce Critical/Warning; breach → auto-flag (+ notify, optional pause).
- [ ] Results stored with scores + breaches + linked calls; reproducible.
- [ ] Runs only on recorded calls; no synthetic call generation.
