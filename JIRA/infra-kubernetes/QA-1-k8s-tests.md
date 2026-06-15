# [QA] Infra Kubernetes · QA · Metrics & logs scenarios

- **ID:** `K8S-QA1`
- **Type:** QA
- **Epic:** Infra: Kubernetes
- **Feature:** F3 — QA
- **Priority:** P2
- **Blocked by:** `K8S-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `infra`
- **Estimate:** 2
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/04` §4, `PRD/06`,
  `src/lib/data/source.ts` (`K8sResult`), `src/lib/data/mock.ts` (`infraK8s`)

## What / Why
Validate parity with Grafana, scoping (namespace/node/time), and log search.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (`infraK8s`) for the same scope+period.
- Validate the response against the `DataSource` shape `K8sResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Panel values match Grafana for the same query/window (spot-checked per panel).
- [ ] Namespace (project)/node/date-range filters change data correctly.
- [ ] Fuzzy log search returns expected lines within the window; no refetch loop.
- [ ] SuperAdmin-only; loading/empty/error states correct.
