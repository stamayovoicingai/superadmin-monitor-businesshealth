# EPIC — Infra: Kubernetes (`K8S`)

**Route:** `/infra/kubernetes` · **Roles:** SuperAdmin · **Priority:** P2 (Wave 2)
**Blocked by:** `_platform` (`PLAT-BE1`) + a Prometheus/Loki source

## Goal
Replicate the real Grafana "Kubernetes Cluster Monitoring" dashboard: cluster CPU/Mem/Storage gauges +
used/total + replicas, overall usage, pods & containers CPU/Mem, requests & limits, restarts, and
deployment logs — with a per-tab date range and **fuzzy log search**.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/infra/kubernetes/page.tsx` · shapes `source.ts` (`K8sResult`)
- Real metrics mapped in `PRD/04-data-sources.md` §4 (PromQL) + `PRD/06`

## Features
- F1 — Prometheus/Loki integration & metrics API · F2 — Kubernetes UI · F3 — QA

## Tasks
- `BE-1-k8s-metrics-api.md` (`K8S-BE1`)
- `FE-1-k8s-ui.md` (`K8S-FE1`)
- `QA-1-k8s-tests.md` (`K8S-QA1`)
