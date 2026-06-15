# Sprint Plan

Calibrated to Voicing's real squad. **Cadence: 2-week sprints.**

## Team & capacity

Primary squad (**6**): **3 Backend (Python) · 2 Frontend · 1 QA**.
Alternative: **3 Backend · 1 Frontend · 1 QA · 1 LLM/AI**.

Planning velocity ≈ **10 SP / person / 2-week sprint** → per-discipline capacity per sprint:

| Discipline | People | Capacity / sprint |
|------------|--------|-------------------|
| Backend | 3 | ~30 SP |
| Frontend | 2 | ~20 SP |
| QA | 1 | ~10 SP |

## Workload by discipline (the bottleneck)

| Discipline | Total SP | Sprints of work |
|------------|----------|-----------------|
| **Backend** | **169** | **~6 (critical path)** |
| Frontend | 61 | ~3 (comfortable) |
| QA | 48 | ~5 (1 person → watch the tail) |
| **Total** | **278** | |

**Backend is the critical path** (foundation + every data pipeline/engine/API is Python). FE and QA
trail BE by ~1 sprint and have slack — except QA, which with one person is near-saturated and stretches
the tail. **v1 (all tabs, excl. QA Bench) ≈ 6–7 sprints (~12–14 weeks); incl. QA Bench (Phase 2) ≈ 8 sprints (~16 weeks).**

## Sprint sequence (3 BE · 2 FE · 1 QA, 2-week sprints)

Lanes run in parallel; FE/QA for an epic start the sprint after its BE API lands.

| Sprint | Backend (~30) | Frontend (~20) | QA (~10) |
|--------|---------------|----------------|----------|
| **S1** Foundation | PLAT-BE1, BE2, BE3, BE4 (29) | *(shared components, SupabaseAdapter scaffold, design polish)* | — |
| **S2** Cost engine | COST-BE2, BE1, BE3, BE4, CALLS-BE1 (31) | *(prep cost/calls components)* | PLAT-QA1 (5) |
| **S3** Calls/Obs APIs | CALLS-BE2, PERF-BE1, LIVE-BE1, THRESH-BE1, ISSUE-BE1 (26) | COST-FE1, FE2, CALLS-FE1 (11) | COST-QA1 (5) |
| **S4** Health/Infra APIs | FLAG-BE1, HEALTH-BE1, BE2, K8S-BE1, ELB-BE1 (31) | CALLS-FE2, PERF-FE1, LIVE-FE1, THRESH-FE1, ISSUE-FE1 (17) | CALLS-QA1, PERF-QA1, LIVE-QA1, THRESH-QA1 (9) |
| **S5** Biz/Assistant/Controls APIs | ASST-BE1, BIZ-BE1, OVW-BE1, FALLB-BE1, FALLB-BE2 (29) | FLAG-FE1, HEALTH-FE1, K8S-FE1, ELB-FE1 (11) | ISSUE-QA1, FLAG-QA1, HEALTH-QA1, K8S-QA1 (10) |
| **S6** Finish APIs + QA Bench BE | IPACC-BE1, BE2, QABENCH-BE1 (23) | ASST-FE1, BIZ-FE1, OVW-FE1, FALLB-FE1 (11) | ELB-QA1, ASST-QA1, BIZ-QA1, OVW-QA1, FALLB-QA1 (11) |
| **S7** Controls UI + QA Bench UI | *(BE done — hardening/perf/bugfix, ingress for IPACC-BE2)* | IPACC-FE1, QABENCH-FE1 (11) | IPACC-QA1 (3) |
| **S8** QA Bench QA + stabilization | *(buffer / tech debt)* | *(polish/a11y pass)* | QABENCH-QA1 (5) + regression |

- **Backend finishes ~S6**; FE ~S7; QA tail ~S8 (QA Bench).
- **Drop QA Bench (Phase 2)** → v1 done by **~S6–S7 (~12–14 weeks)**.

## Notes & risks

- **QA is the tail risk** (1 person, 48 SP). Mitigate with **shift-left** (devs write unit/integration
  tests; QA focuses on RBAC, parity, e2e, exploratory) — already implied by each epic's BE/FE AC.
- **Backend is the gate.** If you need to go faster, add a 4th BE (→ ~40 SP/sprint → ~5 sprints) or
  split into 2 squads (see multi-squad table below).
- **Alternative team (1 FE + 1 LLM/AI):** FE capacity halves (~10 SP/sprint) → FE becomes co-critical;
  stretch FE-heavy sprints (S4) by one. Put the **LLM/AI engineer** on: QA Bench LLM-judge evaluators
  (`QABENCH-BE1`), and the LLM-shaped backend logic (cost/issues engines, `FALLB-BE2` LLM ordering,
  `ASST-BE1`). Net: similar calendar, with QA Bench better staffed.

## Compression with parallel squads (optional)

If you staff more than one squad to make each *wave* land in ~1–2 weeks. Because **backend is the
gate** (169 SP), the calendar is driven by **BE capacity**, not the headcount sum (BE/FE/QA aren't
interchangeable):

| Squads (each 3BE+2FE+1QA) | Backend devs | BE SP / sprint | Calendar (BE-gated, ~169 SP) |
|---------------------------|--------------|----------------|------------------------------|
| 1 (this plan) | 3 | ~30 | ~6 sprints core / ~8 with QA Bench (~12–16 wks) |
| 2 | 6 | ~60 | ~3 sprints (~6 wks) |
| 3 | 9 | ~90 | ~2 sprints (~4 wks) |

> Respect the dependency graph in `ROADMAP.md`: `_platform` (P0) must land first; per epic the chain is
> BE → FE → QA. Estimates are the per-task story points in each ticket; re-point in planning.
