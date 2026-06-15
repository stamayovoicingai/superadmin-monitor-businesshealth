# [BE] Infra Kubernetes · API · Prometheus/Loki metrics & logs

- **ID:** `K8S-BE1`
- **Type:** Backend
- **Epic:** Infra: Kubernetes
- **Feature:** F1 — Prometheus/Loki integration & metrics API
- **Priority:** P2
- **Blocked by:** `PLAT-BE1`
- **Blocks:** `K8S-FE1`, `K8S-QA1`
- **Components/Labels:** `backend` `python` `prometheus` `loki` `infra` `api`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/source.ts` (`K8sResult`), `src/lib/data/mock.ts` (`infraK8s`), `PRD/04` §4, `PRD/06`

## What
Back the Kubernetes view with real Prometheus (and Loki for logs) data, returning `K8sResult`: cluster
CPU/Mem/Storage + used/total + replicas, overall usage series, pods & containers CPU/Mem, requests &
limits, restarts, and deployment logs — filterable by namespace/node and time window.

## Why
Real infra monitoring inside the SuperAdmin pane, correlated with call activity and cost allocation.

## How (building on the MVP)
- Honor `K8sResult`. Implement the PromQL queries documented in `PRD/04` §4 (the MVP mocks these series);
  proxy Prometheus via a Python service. Logs via Loki by namespace/deployment.
- Honor the time window (`from`/`to`) and template vars (namespace from project, node).
- Return enough log volume to support the FE fuzzy search within the window.

## Acceptance Criteria
- [ ] All panels return real Prometheus data; values match Grafana for the same query/window.
- [ ] Namespace (project) + node + time-window filtering works; logs scoped via Loki.
- [ ] Response sizes/latency acceptable; caching where sensible.
- [ ] Shape matches `K8sResult` so the UI renders unchanged.
