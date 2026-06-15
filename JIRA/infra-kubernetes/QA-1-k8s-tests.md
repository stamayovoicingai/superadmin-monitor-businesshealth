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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/04` §4, `PRD/06`

## What / Why
Validate parity with Grafana, scoping (namespace/node/time), and log search.

## Acceptance Criteria (scenarios)
- [ ] Panel values match Grafana for the same query/window (spot-checked per panel).
- [ ] Namespace (project)/node/date-range filters change data correctly.
- [ ] Fuzzy log search returns expected lines within the window; no refetch loop.
- [ ] SuperAdmin-only; loading/empty/error states correct.
