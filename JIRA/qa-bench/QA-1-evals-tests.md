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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/11` (§6 planned models `evaluator` / `eval_schedule` / `eval_run` / `eval_result` / `eval_threshold`). Note: QA Bench is **design-only** in the MVP — no `DataSource` shape or `src/lib/engine/*` file exists yet; threshold/auto-flag semantics reuse `src/lib/engine/issues.ts` and the `FLAG` store.

## What / Why
Validate evaluators, scheduling, threshold breaches and breach actions (flag/notify/pause).

## How (building on the MVP)
- Because QA Bench is new (design-only in the MVP), there is no mock/engine golden fixture for the result shape itself; instead pin **reproducible run fixtures** (fixed call set + evaluator + thresholds → expected scores/breaches) and assert runs are deterministic against them.
- Validate the planned shapes from `PRD/11` §6 (`eval_result`/`eval_run` and the per-project `eval_threshold` config); for the reused breach path, assert auto-flags match the `FLAG` store and threshold semantics in `src/lib/engine/issues.ts`.
- Cover RBAC (SuperAdmin vs User — SuperAdmin-only actions like agent pause must never be triggerable by User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Evaluators score recorded calls correctly (templated / LLM-judge / rule).
- [ ] Schedules run on cadence over the configured window; runs are idempotent/reproducible.
- [ ] Breach → auto-flag appears in Flag Queue; notification sent; optional agent pause works and is role-gated.
- [ ] Per-project thresholds drive Critical/Warning correctly; results link to calls.
- [ ] No synthetic calls generated — only recorded calls evaluated.
