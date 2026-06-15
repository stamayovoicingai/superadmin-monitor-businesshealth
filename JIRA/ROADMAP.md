# Roadmap — priority & dependencies

How to sequence the backlog: what must be built first and what blocks what. Priorities use the scale
in [`CONVENTIONS.md`](./CONVENTIONS.md). Task IDs are `<EPIC-KEY>-<DISC><n>`.

## The root blocker: `_platform` (P0)

Almost every backend task depends on the platform foundation. Build this first.

- `PLAT-BE1` — **Supabase project + base schema/migrations** (organization, project, agent, call,
  org_contract, pricing_*, period_rollup, …). **Blocks:** every BE task.
- `PLAT-BE2` — **Call/conversation data ingestion** (`chat_conversations`/`conversation_details`/
  `chat_messages`, statuses, closed reasons, durations, usage fields). **Blocks:** every tab that
  reads call data (CALLS, PERF, LIVE, ISSUE, COST usage, BIZ, FLAG).
- `PLAT-BE3` — **AuthN + RBAC** (real roles/session; server-side financial & SuperAdmin gating).
  **Blocks:** all FE wiring + every secured endpoint.
- `PLAT-BE4` — **DataSource→SupabaseAdapter + env + deploy/CI**. **Blocks:** all FE "wire to real API".
- `PLAT-QA1` — foundation/RBAC/e2e harness.

## Dependency graph (high level)

```
PLAT-BE1 (Supabase schema) ─┬─> PLAT-BE2 (call ingestion) ─┬─> CALLS, PERF, LIVE
                            │                              ├─> COST (usage) ─> BIZ
                            │                              └─> ISSUE ─> FLAG
                            ├─> COST pricing/revenue ─> BIZ (MRR/contracts)
                            └─> HEALTH, K8S, ELB, ASST (own series/ingestion)
PLAT-BE3 (auth/RBAC) ──────> every FE wiring + secured API (esp. COST, BIZ financial gating)
PLAT-BE4 (adapter+deploy) ─> every FE "wire to real API"
THRESH (config) ──────────> ISSUE (evaluates thresholds) ──auto-flag──> FLAG
COST engine (cost_per_call) ─> ISSUE (cost_per_call metric)
```

## Delivery waves

**Wave 0 — Foundation (P0):** `PLAT-BE1..BE4`, `PLAT-QA1`.

**Wave 1 — Core value (P1):**
- `COST` (Cost & Margin) — #1.
- `CALLS` (Call Logs & Detail) — needed by drill-downs everywhere.
- `PERF` (Performance), `LIVE` (Live Operations).
- `THRESH` then `ISSUE` (Issues evaluates thresholds), then `FLAG` (auto-flags from Issues).

**Wave 2 — High-value (P2):**
- `HEALTH` (Service Health), `K8S` + `ELB` (Infra), `BIZ` (Business Health), `ASST` (Assistant Usage),
  `OVW` (Overview — aggregates the others, so it lands after them).

**Wave 3 — Controls (P3):** `FALLB` (Fallbacks), `IPACC` (IP Access). (Config surfaces; lower urgency.)

**Wave 4 — Phase 2 (P4) — DEFERRED (out of scope for now):** `QABENCH` (QA Bench / Evals). Tickets
remain in `qa-bench/` (designed) for a later, separate effort; excluded from the current `SPRINT-PLAN.md`.

## Epic priority & key blockers

| Epic | Priority | Blocked by (key) |
|------|----------|------------------|
| PLAT — Platform | P0 | — |
| COST — Cost & Margin | P1 | PLAT-BE1/BE2/BE3 |
| CALLS — Call Logs & Detail | P1 | PLAT-BE1/BE2 |
| PERF — Performance | P1 | PLAT-BE2 |
| LIVE — Live Operations | P1 | PLAT-BE2 |
| THRESH — Thresholds | P1 | PLAT-BE1/BE3 |
| ISSUE — Issues | P1 | THRESH, PLAT-BE2, COST (cost_per_call) |
| FLAG — Call Flagging | P1 | ISSUE, PLAT-BE2 |
| HEALTH — Service Health | P2 | PLAT-BE1 |
| K8S — Infra Kubernetes | P2 | PLAT-BE1 (+ Prometheus source) |
| ELB — Infra AWS ELB | P2 | PLAT-BE1 (+ CloudWatch source) |
| BIZ — Business Health | P2 | COST (contracts/MRR), PLAT-BE2 |
| ASST — Assistant Usage | P2 | PLAT-BE1 (+ assistant usage source) |
| OVW — Overview | P2 | COST, PERF, LIVE, ASST, ISSUE |
| FALLB — Fallbacks | P3 | PLAT-BE1/BE3 |
| IPACC — IP Access | P3 | PLAT-BE1/BE3 |
| QABENCH — QA Bench | P4 | CALLS, ISSUE, FLAG |

> Each task file repeats its own **Priority / Blocked by / Blocks** in the header so the board is
> self-describing when imported.
