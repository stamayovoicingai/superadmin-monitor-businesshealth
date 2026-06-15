# [BE] Cost & Margin · Revenue & margin · Contract revenue, margin & MRR engine

- **ID:** `COST-BE3`
- **Type:** Backend
- **Epic:** Cost & Margin
- **Feature:** F2 — Revenue, margin & MRR engine
- **Priority:** P1
- **Blocked by:** `PLAT-BE1`, `COST-BE1`
- **Blocks:** `COST-BE4`, `BIZ-BE1` (MRR/contracts)
- **Components/Labels:** `backend` `python` `supabase` `revenue` `finance`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/engine/cost.ts` (`computeOrgMonthlyRevenue`, `computeMrr`, `marginPct`),
  `src/lib/engine/aggregate.ts` (`orgRollups`, `projectRollups`), `PRD/03-cost-revenue-margin.md` §3, §5

## What
Compute **revenue**, **margin**, and **MRR** per org/project/period from per-org contracts. Supports
two contract types: **Pure Usage** (minutes × rate) and **MGF** (Minimum Guarantee Fee, **reading
B1**: MGF includes a volume; overage billed only on minutes above the included volume; floored at the
MGF). Produces `period_rollup` records for fast charts.

## Why
Margin = Revenue − Cost is the headline business metric. Revenue depends on real contracts (e.g. TP
Latam = pure usage; others = MGF). Without this, the platform shows cost but not profitability or MRR.

## How (building on the MVP)
- Port the MVP formulas (the spec): `computeOrgMonthlyRevenue` (Pure Usage and MGF-B1), `computeMrr`
  (MGF floor for MGF orgs; trailing run-rate for usage orgs), `marginPct`.
- Source contracts from an `org_contract` table (`contract_type`, `rate_per_min`, `mgf_amount`,
  `overage_rate_per_min`, `included_minutes`, `billing_cycle_day`) — see `PRD/12` §3. Seed from real
  finance data (MVP uses illustrative values).
- **Reconciliation rule (match the MVP):** headline revenue/margin is **contract-based** at org/global
  scope (includes the MGF floor) and **per-call/usage-based** at single-project scope. Implement
  identically so the dashboard's KPIs match the per-org chart.
- Persist daily/monthly `period_rollup` (cost, revenue, margin, per-service, minutes, calls) per
  org/project for fast reads.

## Acceptance Criteria
- [ ] Pure Usage and MGF-B1 revenue match the MVP outputs on a shared fixture (incl. under- and
  over-included-volume cases).
- [ ] MRR = MGF floor for MGF orgs; run-rate for usage orgs.
- [ ] Headline margin at org/global scope equals the sum of per-org contract margins (reconciliation).
- [ ] `period_rollup` is refreshed within SLA and powers charts without scanning raw calls.
- [ ] Unit tests cover both contract types and the scope-based reconciliation.
