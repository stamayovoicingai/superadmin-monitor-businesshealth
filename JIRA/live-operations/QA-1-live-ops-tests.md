# [QA] Live Operations · QA · Live ops scenarios

- **ID:** `LIVE-QA1`
- **Type:** QA
- **Epic:** Live Operations
- **Feature:** F3 — QA
- **Priority:** P1
- **Blocked by:** `LIVE-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `realtime` `observability`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/07`

## What / Why
Validate live freshness, correctness of counts, scoping and resilience.

## Acceptance Criteria (scenarios)
- [ ] Active-calls-per-pod, status and end-reason counts match the DB at a point in time.
- [ ] Updates appear within the freshness SLA (≤30s) when calls start/end.
- [ ] Scope (org/project) filters live data correctly; 0-active handled.
- [ ] Stream reconnect / polling fallback works; no memory leak over long sessions.
