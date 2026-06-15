# Sprint Plan

## Assessment (read this)

The **waves** in [`ROADMAP.md`](./ROADMAP.md) are **dependency tiers, not sprints**. By story points
they're too big to each fit a single 1–2 week sprint with one squad:

| Wave | Scope | Story points |
|------|-------|--------------|
| 0 — Foundation (`PLAT`) | platform | ~34 |
| 1 — Core | COST, CALLS, PERF, LIVE, THRESH, ISSUE, FLAG | ~112 |
| 2 — High-value | HEALTH, K8S, ELB, BIZ, ASST, OVW | ~73 |
| 3 — Controls | FALLB, IPACC | ~33 |
| 4 — Phase 2 | QABENCH | ~26 |
| **Total** | | **~278** |

So a wave ≠ a sprint. Two ways to honor "~1–2 week sprints":
1. **One squad** (recommended baseline): keep the dependency order but slice into **~2-week sprints of
   ~30 SP**. That's **~10 sprints ≈ ~20 weeks (~4.5 months)**.
2. **Compress with parallel squads** (to make each *wave* ≈ 1–2 weeks): run BE/FE/QA streams across
   2–3 squads. Wave 1 (~112 SP) ≈ 2 sprints with ~3 squads → whole program in **~8–10 weeks**.

### Capacity assumptions (tune to your team)
- 1 cross-functional squad ≈ **2 BE (Python) + 1–2 FE + 1 QA**, velocity **~30 SP / 2-week sprint**.
- 1-week sprints are possible but a single squad realistically does ~15 SP/week → ~18 sprints. We
  therefore recommend a **2-week cadence at ~30 SP** (the upper end of your 1–2 week ask).

| Squads | SP / 2-wk sprint | Calendar to finish (~278 SP) |
|--------|------------------|------------------------------|
| 1 | ~30 | ~10 sprints (~20 wks) |
| 2 | ~60 | ~5 sprints (~10 wks) |
| 3 | ~90 | ~3–4 sprints (~7–8 wks) |

> Within a sprint, BE/FE/QA run in parallel; FE/QA for an epic start once its BE API lands (often the
> next sprint), which is why epics span sprint boundaries below.

## Recommended sprint sequence (1 squad, ~30 SP, 2-week sprints)

Dependency-respecting. Each line is `ID (SP)`.

**Sprint 1 — Foundation** (~29): `PLAT-BE1 (8)` · `PLAT-BE2 (8)` · `PLAT-BE3 (8)` · `PLAT-BE4 (5)`

**Sprint 2 — Foundation QA + Cost engine** (~26): `PLAT-QA1 (5)` · `COST-BE2 (5)` · `COST-BE1 (8)` · `COST-BE3 (8)`

**Sprint 3 — Cost finish + Calls API** (~28): `COST-BE4 (5)` · `COST-FE1 (5)` · `COST-FE2 (3)` · `COST-QA1 (5)` · `CALLS-BE1 (5)` · `CALLS-BE2 (5)`

**Sprint 4 — Calls UI + Performance + Live API** (~26): `CALLS-FE1 (3)` · `CALLS-FE2 (5)` · `CALLS-QA1 (3)` · `PERF-BE1 (5)` · `PERF-FE1 (3)` · `PERF-QA1 (2)` · `LIVE-BE1 (5)`

**Sprint 5 — Live + Thresholds + Issues** (~27): `LIVE-FE1 (3)` · `LIVE-QA1 (2)` · `THRESH-BE1 (3)` · `THRESH-FE1 (3)` · `THRESH-QA1 (2)` · `ISSUE-BE1 (8)` · `ISSUE-FE1 (3)` · `ISSUE-QA1 (3)`

**Sprint 6 — Flagging + Service Health** (~29): `FLAG-BE1 (5)` · `FLAG-FE1 (3)` · `FLAG-QA1 (2)` · `HEALTH-BE1 (8)` · `HEALTH-BE2 (5)` · `HEALTH-FE1 (3)` · `HEALTH-QA1 (3)`

**Sprint 7 — Infra (k8s + ELB) + Assistant API** (~27): `K8S-BE1 (8)` · `K8S-FE1 (3)` · `K8S-QA1 (2)` · `ELB-BE1 (5)` · `ELB-FE1 (2)` · `ELB-QA1 (2)` · `ASST-BE1 (5)`

**Sprint 8 — Assistant + Business + Overview** (~27): `ASST-FE1 (2)` · `ASST-QA1 (2)` · `BIZ-BE1 (8)` · `BIZ-FE1 (3)` · `BIZ-QA1 (2)` · `OVW-BE1 (5)` · `OVW-FE1 (3)` · `OVW-QA1 (2)`

**Sprint 9 — Controls (Fallbacks + IP Access)** (~30): `FALLB-BE1 (3)` · `FALLB-BE2 (8)` · `FALLB-FE1 (3)` · `FALLB-QA1 (3)` · `IPACC-BE1 (5)` · `IPACC-BE2 (5)` · `IPACC-FE1 (3)`

**Sprint 10 — IP Access QA + QA Bench (Phase 2)** (~29): `IPACC-QA1 (3)` · `QABENCH-BE1 (13)` · `QABENCH-FE1 (8)` · `QABENCH-QA1 (5)`

## Notes
- Estimates are the per-task story points in each ticket header; re-point in your planning poker.
- Sprints 1–2 are mostly Python/data (foundation + engines); FE engineers can prep components and the
  SupabaseAdapter scaffolding in parallel.
- If you want **each wave to land in ~1–2 weeks**, staff 2–3 squads and run the per-epic BE→FE→QA chains
  concurrently (see compression table). The dependency graph in `ROADMAP.md` is the constraint to respect.
- QA Bench (Phase 2) can be dropped from the initial program and scheduled later without affecting v1.
