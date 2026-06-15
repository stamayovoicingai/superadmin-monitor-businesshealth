# [QA] Cost & Margin · QA · Cost/margin/MGF correctness + RBAC scenarios

- **ID:** `COST-QA1`
- **Type:** QA
- **Epic:** Cost & Margin
- **Feature:** F6 — QA
- **Priority:** P1
- **Blocked by:** `COST-FE1`, `COST-FE2`
- **Blocks:** —
- **Components/Labels:** `qa` `cost` `rbac` `regression`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/03-cost-revenue-margin.md`, `src/lib/engine/cost.ts`, `src/app/(dashboard)/cost/page.tsx`

## What
Test plan validating cost accuracy, revenue/margin/MGF logic, scope/date filtering, and RBAC for the
Cost & Margin tab.

## Why
This is the #1 priority surface and feeds financial decisions; correctness and access control must be
verified end-to-end.

## How (building on the MVP)
- Use the MVP engine outputs as golden references for the Python port (shared fixtures).
- Cover both contract types and the org/global vs project reconciliation rule.

## Acceptance Criteria (scenarios)
- [ ] **Per-service cost**: addends sum to total; values in micro-USD; matches fixtures.
- [ ] **Pure Usage org**: revenue = minutes × rate; margin = revenue − cost.
- [ ] **MGF org, under included volume**: revenue = MGF floor; no overage.
- [ ] **MGF org, over included volume (B1)**: revenue = MGF + overage on excess only.
- [ ] **MRR**: MGF floor for MGF orgs; run-rate for usage orgs.
- [ ] **Reconciliation**: headline margin (org/global) = sum of per-org margins; project scope uses usage.
- [ ] **Date range**: 24h/7d/30d and custom windows return correct, consistent subsets.
- [ ] **RBAC**: `User` API response and UI contain no revenue/margin; `SuperAdmin` sees all.
- [ ] **Performance**: dashboard p95 < 300 ms on production-scale data.
- [ ] **Regression**: parity check between Postgres (Supabase or equivalent) adapter and MVP mock on a shared dataset.
