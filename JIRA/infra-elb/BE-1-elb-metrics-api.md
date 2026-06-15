# [BE] Infra AWS ELB · API · CloudWatch metrics endpoint

- **ID:** `ELB-BE1`
- **Type:** Backend
- **Epic:** Infra: AWS ELB
- **Feature:** F1 — CloudWatch integration & metrics API
- **Priority:** P2
- **Blocked by:** `PLAT-BE1`
- **Blocks:** `ELB-FE1`, `ELB-QA1`
- **Components/Labels:** `backend` `python` `aws` `cloudwatch` `infra` `api`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/source.ts` (`ElbResult`), `src/lib/data/mock.ts` (`infraElb`), `PRD/04` §5, `PRD/06`

## What
Back the ELB view with real CloudWatch (`AWS/ApplicationELB`) data, returning `ElbResult` for all
panels: RequestCount/TargetResponseTime, HTTPCode_Target (2/3/4/5xx), HTTPCode_ELB, ConnectionCount
(active/new/rejected/target-error), ConsumedLCUs/ProcessedBytes, TLS errors, IPv6, RuleEvaluations, Auth.

## Why
Load-balancer health is key infra signal; surfacing it in-platform avoids context switching to Grafana.

## How (building on the MVP)
- Honor `ElbResult`. Query CloudWatch via a Python service for the metrics/statistics mapped in
  `PRD/04` §5 (the MVP mocks these). Region + loadbalancer selectors; time window from `from`/`to`.
- Cache/throttle to respect CloudWatch API limits.

## Acceptance Criteria
- [ ] All panels return real CloudWatch data; values/statistics match Grafana for the same window.
- [ ] Region + load balancer + time-window selection works.
- [ ] CloudWatch rate limits respected (caching/batching); shape matches `ElbResult`.
