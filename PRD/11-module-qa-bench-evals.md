# 11 · Module: QA Bench / Evals (Phase 2 — design only)

Feature 1C. QA Bench and Evals are the **same system**. It evaluates **real recorded calls**
(transcripts + call data) on a schedule, compares results to thresholds, and auto-flags/notifies/
pauses on breach. **Designed here, not built in v1.** Route (when built): `/qa-bench`.

> Built by Voicing using ~2 external eval libraries. Runs only on calls that already happened — no
> synthetic call generation.

---

## 1. Concepts

| Concept | Meaning |
|---------|---------|
| **Evaluator** | A check run over a call (or batch), producing a metric/score (e.g., completion_rate, sentiment, adherence, containment). |
| **Eval run** | A scheduled execution of selected evaluators over a window of real calls for a project. |
| **Threshold** | Per-evaluator rule at the **project** level → Critical / Warning. |
| **Action** | What happens on breach: auto-flag, notify, optionally pause agent. |

---

## 2. Scheduling (cronjob, per project)

- Minimum frequency: **1 day** (can be more frequent).
- User defines: schedule (cron), which evaluators to run, the call window, and thresholds.
- Runs on real recorded calls in the window.

---

## 3. Thresholds (project level)

- Per evaluator/metric, e.g., *"if completion_rate < 80% for this project → Warning."*
- Two severities: **Critical** | **Warning**.

### Auto-flag behavior on breach
1. Affected call(s) **auto-flagged** → unified flag queue (doc 10), tagged `source=auto (QA Bench)`.
2. User/admin **notified** — in-platform notification + **optional email**.
3. Optional (user-configurable): **agent auto-paused** if a **Critical** threshold is breached.

---

## 4. Evaluator creation (eval builder)

Users build their own evaluators inside the platform via a UI builder. Design directions:
- **Templated evaluators:** pick a metric (completion, containment, sentiment, compliance phrase
  presence, tool-success, latency adherence) + parameters.
- **LLM-judge evaluators:** prompt + rubric + pass criteria, run over transcript.
- **Rule evaluators:** deterministic checks (regex/keyword/field conditions).
- Versioned; testable against a sample of past calls before scheduling.

---

## 5. UI surfaces (when built)
- Evaluators list + builder.
- Schedules list (cron, evaluators, window, last run, next run).
- Run history + results (scores vs thresholds, breaches, affected calls).
- Per-project thresholds editor.
- Pause-on-critical toggle + pause audit.

## 6. Data (preview)
- `evaluator`, `eval_schedule`, `eval_run`, `eval_result` (call_id, evaluator_id, score, breached, severity),
  `eval_threshold` (project_id, evaluator_id, critical, warning, action_flags).

## 7. Role behavior
- **SuperAdmin & User (assigned project):** create evaluators/schedules/thresholds for their project.
- Agent pause action: confirm whether `User` may trigger pause or SuperAdmin-only (open question).

## 8. Open questions
- [ ] Which 2 external eval libraries? (affects evaluator types & builder fields.)
- [ ] Revenue model for Evals — credits vs included in plan (**TBD, no decision yet**).
- [ ] Can `User` enable agent auto-pause, or SuperAdmin-only? (default: SuperAdmin-only.)
- [ ] Default evaluator catalog to seed.
