# Sprint Plan

Calibrated to Voicing's squad. **Cadence: 2-week sprints.**

> **QA Bench (`QABENCH`) is out of scope for now** — its tickets remain in `qa-bench/` (designed) for a
> later, separate effort and are **excluded from this plan and the totals below**.

## Team & capacity

Squad (**6**): **3 Backend (Python) · 2 Frontend · 1 QA**.
Planning velocity ≈ **10 SP / person / 2-week sprint**:

| Discipline | People | Capacity / sprint |
|------------|--------|-------------------|
| Backend | 3 | ~30 SP |
| Frontend | 2 | ~20 SP |
| QA | 1 | ~10 SP |

## Workload by discipline (excl. QA Bench)

| Discipline | Total SP | Sprints of work |
|------------|----------|-----------------|
| **Backend** | **156** | **~5–6 (critical path)** |
| Frontend | 58 | ~3 (incl. `PLAT-FE1` design system, 5) |
| QA | 43 | ~4–5 (1 person → watch the tail) |
| **Total** | **257** | |

**Backend is the critical path** (foundation + every data pipeline/engine/API is Python). FE and QA
trail BE by ~1 sprint. **v1 (all tabs, no QA Bench) ≈ 6–7 sprints ≈ ~12–14 weeks.**

## Sprint sequence (3 BE · 2 FE · 1 QA, 2-week sprints)

Lanes run in parallel; FE/QA for an epic start the sprint after its BE API lands.

| Sprint | Backend (~30) | Frontend (~20) | QA (~10) |
|--------|---------------|----------------|----------|
| **S1** Foundation | PLAT-BE1, BE2, BE3, BE4 (29) | **PLAT-FE1** design system (5) + shared components / adapter scaffold | — |
| **S2** Cost engine | COST-BE2, BE1, BE3, BE4, CALLS-BE1 (31) | *(prep cost/calls components)* | PLAT-QA1 (5) |
| **S3** Calls/Obs APIs | CALLS-BE2, PERF-BE1, LIVE-BE1, THRESH-BE1, ISSUE-BE1 (26) | COST-FE1, FE2, CALLS-FE1 (11) | COST-QA1 (5) |
| **S4** Health/Infra APIs | FLAG-BE1, HEALTH-BE1, BE2, K8S-BE1, ELB-BE1 (31) | CALLS-FE2, PERF-FE1, LIVE-FE1, THRESH-FE1, ISSUE-FE1 (17) | CALLS-QA1, PERF-QA1, LIVE-QA1, THRESH-QA1 (9) |
| **S5** Biz/Assistant/Controls APIs | ASST-BE1, BIZ-BE1, OVW-BE1, FALLB-BE1, FALLB-BE2 (29) | FLAG-FE1, HEALTH-FE1, K8S-FE1, ELB-FE1 (11) | ISSUE-QA1, FLAG-QA1, HEALTH-QA1, K8S-QA1 (10) |
| **S6** Finish APIs + hardening | IPACC-BE1, BE2 (10) + perf/bugfix/ingress | ASST-FE1, BIZ-FE1, OVW-FE1, FALLB-FE1 (11) | ELB-QA1, ASST-QA1, BIZ-QA1, OVW-QA1, FALLB-QA1 (11) |
| **S7** Controls UI + stabilization | *(BE done — hardening, perf, IPACC ingress checks)* | IPACC-FE1 (3) + a11y/polish pass | IPACC-QA1 (3) + regression |

- **Backend finishes ~S6** (S6 BE is light → those devs pivot to hardening/ingress/perf and unblock FE).
- **FE ~S7; QA tail ~S7.** Net **~6–7 sprints (~12–14 weeks)**.

## Notes & risks

- **QA is the tail risk** (1 person, 43 SP ≈ 4–5 sprints). Mitigate with **shift-left**: devs write
  unit/integration tests (already in each epic's AC); QA focuses on RBAC, adapter parity, e2e, and
  exploratory testing.
- **Backend is the gate.** To go faster: add a 4th BE (~40 SP/sprint → ~4–5 sprints) or run 2 squads.
- Sprints 1–2 are mostly Python/data (foundation + engines); the 2 FE engineers build shared components,
  the design-system polish, and the SupabaseAdapter scaffolding in parallel so they're ready when APIs land.

## Compression with parallel squads (optional)

Because **backend is the gate** (156 SP), calendar is driven by **BE capacity** (BE/FE/QA aren't
interchangeable):

| Squads (each 3BE+2FE+1QA) | Backend devs | BE SP / sprint | Calendar (BE-gated, ~156 SP) |
|---------------------------|--------------|----------------|------------------------------|
| 1 (this plan) | 3 | ~30 | ~6 sprints (~12–14 wks incl. FE/QA tail) |
| 2 | 6 | ~60 | ~3 sprints (~6 wks) |
| 3 | 9 | ~90 | ~2 sprints (~4 wks) |

> Respect the dependency graph in `ROADMAP.md`: `_platform` (P0) lands first; per epic the chain is
> BE → FE → QA. Estimates are the per-task story points in each ticket; re-point in planning.
