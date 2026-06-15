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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/04` §5, `PRD/06`,
  `src/lib/data/source.ts` (`ElbResult`), `src/lib/data/mock.ts` (`infraElb`)

## What / Why
Validate parity with Grafana/CloudWatch, region/LB and time scoping.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (`infraElb`) for the same scope+period.
- Validate the response against the `DataSource` shape `ElbResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Each panel matches CloudWatch/Grafana for the same metric/statistic/window.
- [ ] Region + load balancer + date-range selection changes data correctly.
- [ ] SuperAdmin-only; loading/empty/error states; no refetch loop.
