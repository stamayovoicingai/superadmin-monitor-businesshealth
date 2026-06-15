# [BE] Cost & Margin · API · Cost & Margin endpoint (Supabase-backed)

- **ID:** `COST-BE4`
- **Type:** Backend
- **Epic:** Cost & Margin
- **Feature:** F3 — Cost & Margin API
- **Priority:** P1
- **Blocked by:** `COST-BE3`, `PLAT-BE3`, `PLAT-BE4`
- **Blocks:** `COST-FE1`, `COST-FE2`
- **Components/Labels:** `backend` `python` `supabase` `api` `rbac`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/source.ts` (`CostResult`, `Scope`), `src/app/api/cost/route.ts`, `src/lib/data/mock.ts` (`cost()`)

## What
A production endpoint that returns the **`CostResult`** shape (totals, daily series, per-project and
per-org rollups with cost/revenue/margin) for a given **scope** (org/project) and **time range**
(`from`/`to`). It reads from `period_rollup`/`call_cost`, not raw scans.

## Why
The dashboard must read real numbers through the exact contract the UI already expects, so the
frontend swap is config-only. Range + scope filtering must be honored server-side.

## How (building on the MVP)
- Honor the existing contract in `source.ts` (`CostResult`) so the UI needs no shape changes.
- Implement as a Python (FastAPI) endpoint or Supabase RPC/view that the Next.js route handler calls;
  flip `DATA_SOURCE=supabase` and add a `SupabaseAdapter` (`src/lib/data/supabase.ts`) implementing
  `DataSource.cost(scope)`.
- Parse `from`/`to` (explicit window) per the MVP `scopeFromSearch` behavior; default presets if absent.
- **RBAC server-side:** for `User`, return cost-to-serve only — **omit revenue/margin fields** (don't
  rely on the client to hide them).
- Pull from `period_rollup` for series/rollups; reconciliation rule from BE-3.

## Acceptance Criteria
- [ ] `GET cost?orgId&projectId&from&to` returns the `CostResult` shape; UI renders unchanged.
- [ ] Response time p95 < 300 ms at production data volumes (rollup-backed).
- [ ] `User` responses contain no revenue/margin fields (verified by test).
- [ ] Custom date ranges and org/project scoping return correct subsets.
- [ ] Integration test asserts parity with MVP mock outputs on a shared dataset.
