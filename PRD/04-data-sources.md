# 04 · Data Sources (Infra)

This document maps **every data source** the platform reads from, derived from the real Grafana
dashboards provided (k8s, AWS ELB, and the per-project "Sampras-Telmex" call dashboard) plus the
provider/billing sources needed for the cost engine.

For the demo, each source is replaced by a **mock adapter** producing the same shape; the contracts
below are what the future backend will implement.

---

## 1. Source inventory

| # | Source | Tech | Feeds | Demo strategy |
|---|--------|------|-------|---------------|
| S1 | **Call/Conversation DB** | PostgreSQL | Call logs, status, end reasons, active calls, transcripts, chat messages | Mock Postgres-shaped tables (Supabase) |
| S2 | **Application logs** | Loki | Per-call error logs, deployment logs | Mock log lines per namespace |
| S3 | **Cluster metrics** | Prometheus | k8s cluster/pod/container usage, requests/limits, restarts | Mock timeseries series |
| S4 | **AWS CloudWatch** | CloudWatch (`AWS/ApplicationELB`) | ELB request/latency/error/connection metrics | Mock timeseries series |
| S5 | **Provider billing/usage** | Provider APIs/exports | Real per-service cost (LLM/STT/TTS/telephony/cloud) | Pricing tables × usage (doc 03) |
| S6 | **Finance/Contracts** | Internal (sheet/DB) | Org contracts, MGF, rates → revenue/MRR | Seed `org_contract` table (doc 03) |
| S7 | **Recordings store** | Object storage (S3/GCS) | Call audio recordings | Mock/sample audio + signed-URL pattern |
| S8 | **SIP capture (HEP)** | Homer-style HEP feed from Asterisk/SBC (+ RTCP quality) | SIP messages, call flow, PCAP export, jitter/MOS | Mock multi-hop SIP dialog + quality generator (doc 19) |

---

## 2. S1 — Call / Conversation Database (PostgreSQL)

Derived directly from the **Sampras-Telmex** Grafana dashboard SQL. These are the canonical tables.

### Tables & key columns (observed)

**`chat_conversations`** — one row per call.
| Column | Notes |
|--------|-------|
| `call_id` | external call identifier |
| `session_id` | session identifier |
| `host_id` | **pod** handling the call → "active calls per pod" |
| `start_time` | used by every `$__timeFilter(start_time)` query |
| `status` | `ACTIVE` \| (closed states) → "Calls Status" gauge |
| `closed_reason` | call end reason → enum below |
| `call_duration_secs` | duration |
| (+ org/project/agent FKs to add for scoping) | |

**`conversation_details`** — detailed per-call record (joined by `session_id` / `call_id`).
**`chat_messages`** — per-message transcript rows (`timestamp`, role, content).

### Enum — `closed_reason` (call end reason)
Aligns with discovery list:
`USER_IDLE` · `USER_DISCONNECTED` · `CALL_TRANSFERRED` · `CALL_END_PHRASE_TRIGGERED` · `OTHER`

### Canonical queries (from the dashboard, to replicate as adapter methods)

```sql
-- Active calls per pod
SELECT host_id, COUNT(*) FROM chat_conversations
WHERE $timeFilter(start_time) AND status = 'ACTIVE' GROUP BY host_id;

-- Calls status (active vs closed breakdown)
SELECT COUNT(*), status FROM chat_conversations
WHERE $timeFilter(start_time) GROUP BY status;

-- Call end reason breakdown
SELECT COUNT(*), closed_reason FROM chat_conversations
WHERE $timeFilter(start_time) GROUP BY closed_reason;

-- Active calls (full rows)
SELECT * FROM chat_conversations WHERE $timeFilter(start_time) AND status='ACTIVE';

-- Calls table
SELECT * FROM chat_conversations WHERE $timeFilter(start_time);

-- Call detail lookup by session/call id
SELECT * FROM conversation_details
WHERE $timeFilter(start_time) AND session_id ILIKE '%:sessionid%' AND call_id ILIKE '%:callid%';

-- Transcript / chat messages
SELECT * FROM chat_messages WHERE $timeFilter("timestamp");
```

These directly power **Live Operations** (doc 07) and **Call Logs / Call Detail** (doc 05).

---

## 3. S2 — Application Logs (Loki)

Per-namespace log streams (one namespace ≈ one bot deployment, e.g.
`telmex-bot-orchestration`). Used for **per-call error logs** and **deployment logs**.

Observed log filters:
```
{namespace="<bot>-orchestration"} |= "| ERROR    |"  or  '{"icon": "❌", "name": "ERROR",'
   (excluding benign websocket disconnects)
{namespace="<bot>-orchestration"} |= "VAD confidence"
```

Demo adapter: generate realistic ERROR/WARN/INFO log lines per project, filterable by call_id and
by level, surfaced in **Call Detail** and an **Error Logs** panel.

---

## 4. S3 — Kubernetes Cluster Metrics (Prometheus)

Replicates the **"Kubernetes Cluster Monitoring"** dashboard exactly.

### Template variables
`node` (Node) · `namespace` (Namespace) · `deployment` (Service) · `filter` (Logs Filter, textbox).

### Panels to replicate (doc 06)

| Row | Panel | Type | Metric basis (PromQL) |
|-----|-------|------|------------------------|
| Cluster Usage | CPU (1m avg) | gauge | `node_cpu_seconds_total` (non-idle / total cores) |
| Cluster Usage | Memory | gauge | `node_memory_MemTotal_bytes − node_memory_MemAvailable_bytes` |
| Cluster Usage | Storage | gauge | `container_fs_usage_bytes / container_fs_limit_bytes` |
| Cluster Usage | Used / Total (CPU, Mem, Storage) | stat ×6 | `machine_cpu_cores`, `machine_memory_bytes`, fs bytes |
| Cluster Usage | `${deployment}` Replica Count | stat | `count(kube_pod_labels{...})` |
| Cluster Usage | Overall Usage | timeseries | combined CPU/mem |
| Pods Usage | Pods CPU Usage (1m avg) | timeseries | `rate(container_cpu_usage_seconds_total[1m]) by (pod)` |
| Pods Usage | Pods Memory Usage | timeseries | `container_memory_working_set_bytes by (pod)` |
| Containers Usage | Containers CPU Usage (1m avg) | timeseries | `... by (container, pod)` |
| Containers Usage | Containers Memory Usage | timeseries | `container_memory_working_set_bytes by (container, pod)` |
| Container Requests & Limits | Containers CPU Request & Limit | bargauge | `kube_pod_container_resource_requests/limits{resource="cpu"}` |
| Container Requests & Limits | Containers Memory Request & Limit | bargauge | `..._requests/limits{resource="memory"}` |
| Container Restarts | Total Container Restarts | stat | `kube_pod_container_status_restarts_total` |
| Container Restarts | Container Restarts | timeseries | same, over time |
| Logs | Deployment Logs | logs | Loki by namespace/deployment |

---

## 5. S4 — AWS ELB (CloudWatch `AWS/ApplicationELB`)

Replicates the **"AWS ELB Application Load Balancer"** dashboard exactly.

### Template variables
`datasource` · `region` · `loadbalancername`.

### Panels & CloudWatch metrics (doc 06)

| Panel | Metrics (stat) |
|-------|----------------|
| RequestCount / TargetResponseTime | `RequestCount` (Sum), `TargetResponseTime` (Avg) |
| HTTPCode_Target | `HTTPCode_Target_2XX/3XX/4XX/5XX_Count` (Sum) |
| HTTPCode_ELB | `HTTPCode_ELB_3XX/4XX/5XX_Count` (Sum) |
| ConnectionCount | `ActiveConnectionCount` (Avg), `NewConnectionCount` (Avg), `RejectedConnectionCount` (Avg), `TargetConnectionErrorCount` (Avg) |
| Capacity / Bytes | `ConsumedLBCapacityUnits` (Avg), `ConsumedLCUs` (Avg), `ProcessedBytes` (Avg) |
| TLS Negotiation Errors | `ClientTLSNegotiationErrorCount` (Sum), `TargetTLSNegotiationErrorCount` (Sum) |
| IPv6 | `IPv6RequestCount` (Sum), `IPv6ProcessedBytes` (Sum) |
| RuleEvaluations | `RuleEvaluations` (Sum) |
| Auth | `ELBAuthError/Failure/Success/RefreshTokenSuccess` (Sum), `ELBAuthLatency` (Avg), `ELBAuthUserClaimsSizeExceeded` (Sum) |
| Documentation | text panel |

---

## 6. S5 — Provider Billing / Usage (cost engine)

Real per-service cost. In production this reconciles provider billing exports with measured
per-call usage. In the demo it is computed via pricing tables × usage (see **doc 03**). Providers:
**LLM** (OpenAI/Anthropic/Google), **STT** (Deepgram/Whisper/AssemblyAI), **TTS**
(ElevenLabs/Cartesia/OpenAI), **Telephony** (Twilio), **Cloud** (AWS/GCP/Azure).

---

## 7. S6 — Finance / Contracts (revenue & MRR)

Org contracts (`pure_usage` / `mgf`, rates, MGF amount, billing cycle) → revenue, MRR, churn,
expansion. See **doc 03 §3** and **doc 09**. Demo: seed `org_contract` table.

---

## 8. S7 — Recordings

Per-call audio in object storage, accessed via short-lived signed URLs. Demo: a few sample audio
files + a player in Call Detail; the access pattern (signed URL) mirrors production.

---

## 8b. S8 — SIP Capture (HEP) + RTP Quality

SIP signaling captured via **HEP** from Asterisk (and any SBC, e.g. OpenSIPS/Kamailio, placed in
front of it); RTP/RTCP call-quality samples (jitter, packet loss, MOS) from Asterisk AMI/ARI and/or
LiveKit's media stats. Powers the new **Telephony Observability** module (doc 19): SIP message
sequence, call-flow ladder, PCAP export, and quality tab. Demo: a deterministic mock generator
produces realistic multi-hop SIP dialogs and matching quality samples, tied to the same seeded calls
as S1 so `Call-ID` correlates across modules. See doc 19 for full architecture and open questions on
capture topology.

---

## 9. Mapping sources → modules

| Module | Sources |
|--------|---------|
| Cost & Margin (03/05) | S5, S6, S1 (usage), S3 (cloud alloc) |
| Performance / Latency (05) | S1, S2 |
| Call Logs / Detail (05) | S1, S2, S7 |
| Issues (05) | derived from S1/S2/S5 vs thresholds |
| Live Operations (07) | S1 (`status`, `host_id`, `closed_reason`) |
| Kubernetes (06) | S3, S2 |
| AWS ELB (06) | S4 |
| Business Health (09) | S1, S6 |
| Fallbacks (08) | config store (S1-adjacent) |
| Telephony Observability (19) | S8, correlated to S1 by `Call-ID` |

## 10. Notes for engineering

- The call DB schema (`chat_conversations` / `conversation_details` / `chat_messages`) is the
  **single richest source** — it already encodes pod (`host_id`), status, end reason, duration,
  and transcript. The demo's Supabase schema should mirror these names so the future swap is a
  connection-string change.
- k8s + ELB are **timeseries-only** (Prometheus/CloudWatch) — model as series generators keyed by
  the same template variables (node/namespace/deployment, region/loadbalancername).
- Open: obtain real **pricing rates** and **contract terms** to replace illustrative seed values.
