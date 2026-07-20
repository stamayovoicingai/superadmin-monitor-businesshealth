# Sprint Plan

Calibrated to the real team. **Cadence: 2-week sprints.**

> **QA Bench (`QABENCH`) is out of scope for now** — its tickets stay in `qa-bench/` (designed) for a
> later, separate effort and are **excluded from this plan and the totals**.

## Team & capacity (the real constraint)

**3 engineers, all backend-first.** No dedicated frontend or QA:
- **Frontend** is handled by **one of the backend devs using Claude Code** — the UI already exists in the
  MVP and the design system (`PLAT-FE1` + `/design`) makes wiring fast, so FE work is mostly accelerated
  "port mock → real API + harden".
- **QA is shift-left**: the devs own tests (each ticket's AC already includes unit/integration); the QA
  tickets are real work the team absorbs, plus one stabilization pass at the end.

So plan as a **single generalist squad**, not three lanes.

| Input | Value |
|-------|-------|
| Engineers | 3 (backend-capable; 1 doubles as FE w/ Claude Code) |
| Baseline velocity | ~10 SP / person / 2-wk sprint → **~30 SP / sprint** |
| Claude Code uplift | mainly FE + boilerplate (adapters, CRUD APIs, components) → plan **~33 SP / sprint effective** |

## Workload (excl. QA Bench)

| Bucket | SP | Notes |
|--------|----|-------|
| Backend | 198 | the critical path (incl. `TEL-BE1..3`, 18; `ACCESS-BE1..3`, 24) |
| Frontend | 79 | one dev + Claude Code (incl. `PLAT-FE1` design system, 5; `TEL-FE1/2`, 8; `ACCESS-FE1/2`, 13) |
| QA | 51 | shift-left, absorbed by the 3 devs (incl. `TEL-QA1`, 3; `ACCESS-QA1`, 5) |
| **Total** | **328** | |

**~328 SP ÷ ~33 SP/sprint ≈ 9.9 sprints.** Realistic **v1 ≈ 10–11 two-week sprints (~20–22 weeks)**.
Backend remains the gate; the FE dev rides alongside (Claude Code keeps FE off the critical path).

## Sprint sequence (single squad, ~30–33 SP/sprint)

Dependency-ordered; each sprint mixes BE + FE + QA for the epics in play.

| Sprint | Focus | Tasks (SP) |
|--------|-------|------------|
| **S1** | Foundation | PLAT-BE1, BE2, BE3, BE4 (29) |
| **S2** | Access Management & RBAC v2 | ACCESS-BE1, BE2, BE3, FE1, FE2, QA1 (42) — **42 (heavier sprint, may spill into S3)** |
| **S3** | Foundation finish + Cost engine | PLAT-FE1 (5), PLAT-QA1 (5), COST-BE2, BE1, BE3 (21) — **31** |
| **S4** | Cost finish + Call Logs | COST-BE4, FE1, FE2, QA1 (18) · CALLS-BE1, BE2, FE1 (13) — **31** |
| **S5** | Calls finish + Performance + Live + Thresholds | CALLS-FE2, QA1 (8) · PERF (10) · LIVE-BE1, FE1 (8) · THRESH-BE1, FE1 (6) — **32** |
| **S6** | Issues + Flagging | LIVE-QA1, THRESH-QA1 (4) · ISSUE-BE1, FE1, QA1 (14) · FLAG-BE1, FE1, QA1 (10) — **28** |
| **S7** | Service Health + Kubernetes | HEALTH (19) · K8S (13) — **32** |
| **S8** | Telephony (SIP/RTP) | TEL-BE1, BE2, BE3, FE1, FE2, QA1 (29) — **29** |
| **S9** | ELB + Assistant + Business | ELB (9) · ASST (9) · BIZ (13) — **31** |
| **S10** | Overview + Fallbacks | OVW (10) · FALLB (17) — **27** |
| **S11** | IP Access + stabilization | IPACC (16) + regression/hardening/perf pass — **~16+** |

- **v1 lands ~S10–S11 (~20–22 weeks).** S11 doubles as the **stabilization sprint** (the "QA pass"
  you'd otherwise give a dedicated tester).
- `ACCESS` (S2) is sequenced right after foundation on purpose: `COST`'s financial gating, `CALLS`'s
  cost-hidden-for-Dev, and every later epic's role checks all read through it — building it after
  those epics would mean reworking their RBAC twice.
- `TEL` (S8) is the one epic gated on an **external decision** (capture topology, `PRD/19` §8) as much
  as on engineering time — if that decision slips, resequence `TEL` later without blocking S9+.
- Want it sooner? The only real lever with 3 people is **more backend hands** or **descoping** (e.g.,
  defer Infra k8s/ELB or Fallbacks/IP-Access to a fast-follow).

## Notes & risks

- **Backend is the gate** (198 SP). With ~2.5 effective BE FTE (one dev split to FE), it sets the ~10-sprint pace.
- **FE bus factor**: one person + Claude Code. Mitigated by the tight design system (`PLAT-FE1`, `/design`)
  and the fact the UI already exists — keep FE tickets small and component-driven.
- **No dedicated QA**: enforce **shift-left** (devs write the tests in each ticket's AC) and reserve **S9
  for stabilization/regression**. If quality risk grows, borrow QA support for the last 2 sprints.
- Estimates are the per-task story points in each ticket; re-point in planning. Claude Code's uplift is
  real but uneven — track actual velocity over S1–S2 and re-forecast.
