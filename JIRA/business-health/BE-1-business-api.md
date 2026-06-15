# [BE] Business Health · API · MRR/churn/growth + usage metrics

- **ID:** `BIZ-BE1`
- **Type:** Backend
- **Epic:** Business Health
- **Feature:** F1 — Business metrics API
- **Priority:** P2
- **Blocked by:** `COST-BE3`, `PLAT-BE2`
- **Blocks:** `BIZ-FE1`, `BIZ-QA1`
- **Components/Labels:** `backend` `python` `postgres` `api` `finance` `rbac`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `source.ts` (`BusinessHealthResult`), `src/lib/data/mock.ts` (`businessHealth`), `PRD/09`

## What
Endpoint returning `BusinessHealthResult`: MRR + MoM delta + composition (committed MGF / usage /
expansion), churn rate, org growth series, new vs returning callers, total minutes/calls, active
agents, active/new orgs, and an org leaderboard (MRR/margin/minutes). SuperAdmin only.

## Why
Leadership needs recurring-revenue and platform-usage health in one place to steer the business.

## How (building on the MVP)
- Honor `BusinessHealthResult`. MRR/contracts from `COST-BE3`; usage (minutes/calls/callers/agents)
  from calls (`PLAT-BE2`).
- **New vs returning callers** via a bounded caller identity (hashed MSISDN) and first-seen logic
  (mirror the MVP's `callerSeries`).
- MRR composition: committed = MGF floors, usage = pay-as-you-go run-rate, expansion = MGF overage.
- Churn from contract status / inactivity window (confirm definition with finance).
- Real history for trend series (MVP synthesizes 12-month MRR; production uses actuals).
- SuperAdmin-only server-side.

## Acceptance Criteria
- [ ] Returns `BusinessHealthResult`; MRR composition and totals match `COST-BE3` + usage.
- [ ] New/returning callers correct; org growth from onboarding/active history.
- [ ] Churn computed per the agreed definition; documented.
- [ ] SuperAdmin-only enforced (User blocked at API).
