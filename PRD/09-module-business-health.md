# 09 · Module: Business Health Metrics

Feature 1D. **SuperAdmin only** — fully hidden from `User`. Covers both **platform usage metrics**
and **Voicing AI business metrics**. Route: `/business`.

---

## 1. Platform usage metrics (timeseries)

Aggregations by org and by day/week/month (period selector).

| Metric | Definition | Source |
|--------|------------|--------|
| Total minutes spoken | Σ call talk-minutes, by org | S1 (`call_duration_secs`) |
| Total calls | count of calls, by org / project | S1 |
| New unique callers | distinct callers first seen in period | S1 (caller id) |
| Returning callers | callers seen before & again in period | S1 |
| Active agents | production agents with ≥1 call in period | S1 |
| New organizations | orgs onboarded in period | S6 |
| Active organizations | orgs with ≥1 call in period | S1/S6 |

**Charts**: minutes-spoken trend (stacked by org), calls trend, new vs returning callers,
active orgs/agents counters with period-over-period Δ.

---

## 2. Voicing AI business metrics

| Metric | Definition | Notes |
|--------|------------|-------|
| **MRR** | Σ recurring revenue: MGF floors + normalized usage run-rate | from contracts (doc 03 §3) |
| **Churn rate** | orgs that stopped using the platform in period | usage-based + contract status |
| **Org growth** | net new active orgs over time | trend |
| **Expansion revenue** | orgs increasing usage/concurrency (revenue uplift) | from period rollups |

**MRR composition** (per doc 03):
- MGF orgs → committed `mgf_amount` as MRR floor; overage shown separately as variable revenue.
- Pure-usage orgs → trailing run-rate (e.g., last 30d normalized to monthly).

**Charts**: MRR over time (stacked: committed vs usage vs expansion), churn trend, logo/revenue
retention, top orgs by revenue & by margin (links to Cost & Margin, doc 03).

---

## 3. Layout

1. **KPI strip:** MRR · MoM growth % · Churn % · Active orgs · Total minutes (period).
2. **Revenue section:** MRR composition + expansion + (optional) blended margin % (from doc 03).
3. **Usage section:** minutes, calls, callers, active agents/orgs.
4. **Org leaderboard:** revenue, margin %, minutes, growth — sortable.

---

## 4. Feasibility note (from discovery)

Business metrics depend on **billing/finance data integration** (S6). For the demo these are
computed from seeded contracts + simulated usage. Flag in-UI as "modeled from contracts" so it's
clear which numbers are integration-dependent in production.

## 5. Role behavior
- **SuperAdmin only.** Entire `/business` route + sidebar entry hidden for `User`.

## 6. Data sources
S1 (usage), S6 (contracts/finance), doc 03 engine (revenue/margin rollups).

## 7. Open questions
- [ ] Caller identity definition for "unique/returning" — phone number hash? (assume hashed MSISDN.)
- [ ] Churn definition window (e.g., no calls for 30d, or contract terminated) — confirm.
- [ ] Is real billing integrated for the demo, or all modeled from seeds? (assume modeled.)
