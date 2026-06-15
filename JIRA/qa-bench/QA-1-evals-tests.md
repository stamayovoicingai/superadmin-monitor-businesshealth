# [QA] QA Bench · QA · Evaluation, scheduling & action scenarios

- **ID:** `QABENCH-QA1`
- **Type:** QA
- **Epic:** QA Bench / Evals
- **Feature:** F3 — QA
- **Priority:** P4
- **Blocked by:** `QABENCH-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `evals`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/11`

## What / Why
Validate evaluators, scheduling, threshold breaches and breach actions (flag/notify/pause).

## Acceptance Criteria (scenarios)
- [ ] Evaluators score recorded calls correctly (templated / LLM-judge / rule).
- [ ] Schedules run on cadence over the configured window; runs are idempotent/reproducible.
- [ ] Breach → auto-flag appears in Flag Queue; notification sent; optional agent pause works and is role-gated.
- [ ] Per-project thresholds drive Critical/Warning correctly; results link to calls.
- [ ] No synthetic calls generated — only recorded calls evaluated.
