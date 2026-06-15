# [QA] Infra AWS ELB · QA · CloudWatch panel scenarios

- **ID:** `ELB-QA1`
- **Type:** QA
- **Epic:** Infra: AWS ELB
- **Feature:** F3 — QA
- **Priority:** P2
- **Blocked by:** `ELB-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `infra`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/04` §5, `PRD/06`

## What / Why
Validate parity with Grafana/CloudWatch, region/LB and time scoping.

## Acceptance Criteria (scenarios)
- [ ] Each panel matches CloudWatch/Grafana for the same metric/statistic/window.
- [ ] Region + load balancer + date-range selection changes data correctly.
- [ ] SuperAdmin-only; loading/empty/error states; no refetch loop.
