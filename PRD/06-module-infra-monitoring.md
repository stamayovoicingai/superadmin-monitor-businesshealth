# 06 · Module: Infra Monitoring (Kubernetes + AWS ELB)

Replicates the two real Grafana dashboards (doc 04 S3/S4) inside the platform. SuperAdmin-only
(User sees only project-scoped pods, see doc 01). Snapshot + refresh model; series are simulated
in the demo but keyed by the same template variables as the real dashboards so the future swap to
Prometheus/CloudWatch is a datasource change.

---

## 1. Kubernetes (`/infra/kubernetes`)

Mirror of **"Kubernetes Cluster Monitoring"**.

### 1.1 Filters (template variables)
`Node` · `Namespace` · `Service` (deployment) · `Logs Filter` (textbox).

### 1.2 Sections & panels

**Cluster Usage**
- CPU (1m avg) — gauge
- Memory — gauge
- Storage — gauge
- Used / Total — 6 stats (CPU cores, memory bytes, storage bytes)
- `${deployment}` Replica Count — stat
- Overall Usage — timeseries

**Pods Usage**
- Pods CPU Usage (1m avg) — timeseries (by pod)
- Pods Memory Usage — timeseries (by pod)

**Containers Usage**
- Containers CPU Usage (1m avg) — timeseries (by container, pod)
- Containers Memory Usage — timeseries (by container, pod)

**Container Requests & Limits**
- Containers CPU Request & Limit — bargauge
- Containers Memory Request & Limit — bargauge

**Container Restarts**
- Total Container Restarts — stat
- Container Restarts — timeseries

**Logs**
- Deployment Logs — log viewer (Loki, by namespace/deployment) with a **fuzzy search bar** and a
  **per-tab date range** (the Kubernetes date range scopes the whole tab, logs included).

> Metric basis (PromQL) documented in doc 04 §4. Demo generates plausible series per node/namespace/
> deployment that respond to the filter selection.

### 1.3 Cost linkage
This page is where **cloud cost allocation** (doc 03 §4) is grounded: namespace/deployment →
project mapping enables the "by pod ownership" allocation method. Add a small **"Est. cloud cost
(period)"** stat per deployment that links into Cost & Margin.

---

## 2. AWS ELB (`/infra/elb`)

Mirror of **"AWS ELB Application Load Balancer"** (CloudWatch `AWS/ApplicationELB`).

### 2.1 Filters
`Datasource` · `Region` · `LoadBalancerName`.

### 2.2 Panels (all timeseries unless noted)

| Panel | Metrics (statistic) |
|-------|---------------------|
| RequestCount / TargetResponseTime | RequestCount (Sum) · TargetResponseTime (Avg) |
| HTTPCode_Target | 2XX / 3XX / 4XX / 5XX (Sum) |
| HTTPCode_ELB | 3XX / 4XX / 5XX (Sum) |
| ConnectionCount | Active (Avg) · New (Avg) · Rejected (Avg) · TargetConnectionError (Avg) |
| Capacity / Bytes | ConsumedLBCapacityUnits (Avg) · ConsumedLCUs (Avg) · ProcessedBytes (Avg) |
| TLSNegotiationErrorCount | Client (Sum) · Target (Sum) |
| IPv6 | IPv6RequestCount (Sum) · IPv6ProcessedBytes (Sum) |
| RuleEvaluations | RuleEvaluations (Sum) |
| Auth | Error / Failure / Success / RefreshTokenSuccess (Sum) · Latency (Avg) · UserClaimsSizeExceeded (Sum) |
| Documentation | text panel (links / notes) |

---

## 3. Component reuse (low-custom principle)

A small set of reusable chart wrappers covers both dashboards:
- `<GaugePanel>`, `<StatPanel>`, `<TimeseriesPanel>`, `<BarGaugePanel>`, `<LogPanel>`.
- Each takes a **series spec** `{ title, unit, queries[], thresholds? }`. The k8s & ELB pages are
  largely declarative arrays of these specs → minimal bespoke code, easy to extend when more
  Grafana panels arrive.

## 4. Role behavior
- **SuperAdmin:** full k8s + ELB.
- **User:** k8s limited to pods/namespaces of assigned project(s); **no ELB**; deployment logs
  scoped to their namespace.

## 5. Data sources
S3 (Prometheus, k8s), S4 (CloudWatch, ELB), S2 (Loki logs). See doc 04.

## 6. Open questions
- [ ] Confirm namespace → project mapping convention (e.g., `telmex-bot-orchestration` → Telmex project).
- [ ] Any additional Grafana dashboards to mirror (DB, message queue, GPU)? Provide JSON if so.
