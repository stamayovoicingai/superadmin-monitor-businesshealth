# 07 · Module: Live Operations

The only **live-updating** surface in the platform (per the "mixed real-time" decision). Mirrors the
real **"Sampras-Telmex"** call dashboard, generalized across projects. Answers: *what is happening
on calls right now?*

Route: `/live`. Available to both roles (scoped). Auto-refreshes every **15–30s** (simulated
streaming in the demo); shows a "● Live" indicator and last-tick time.

---

## 1. Panels (from the real dashboard)

### 1.1 Active Calls Per Pod — table
`host_id` → count of `status='ACTIVE'` calls.
```sql
SELECT host_id, COUNT(*) FROM chat_conversations
WHERE timeFilter(start_time) AND status='ACTIVE' GROUP BY host_id;
```
- Shows load distribution across pods; highlights hot/cold pods.
- Links each pod into the k8s page (doc 06) filtered to that pod.

### 1.2 Calls Status — gauge / donut
Breakdown of calls by `status` (ACTIVE vs closed states) over the range.
- KPIs: **concurrent active now** · closed in period.

### 1.3 Call End Reason — gauge / donut
Breakdown by `closed_reason`:
`USER_IDLE` · `USER_DISCONNECTED` · `CALL_TRANSFERRED` · `CALL_END_PHRASE_TRIGGERED` · `OTHER`.
- Drives the "why are calls ending" narrative; abnormal spikes can raise an Issue (doc 05).

### 1.4 Active Calls — table
Full rows where `status='ACTIVE'`: call_id, session_id, agent, host_id, start_time, elapsed,
caller, current state. Row → live Call Detail.

### 1.5 Calls — table
Recent calls in range (from `chat_conversations`), with quick filters; row → Call Detail.

### 1.6 Error Logs — log viewer
Loki stream scoped to the project namespace (e.g. `{namespace="<bot>-orchestration"} |= "ERROR"`),
excluding benign websocket noise (per real dashboard filters). Also a "VAD confidence" stream toggle.

### 1.7 Chat Messages — table (optional drill)
Latest `chat_messages` for live inspection of an in-flight conversation.

---

## 2. Layout

```
┌────────────────────────────── Live Operations  ● Live · tick 12:03:41 ──┐
│ [ Concurrent: 37 ]  [ Active pods: 6 ]  [ Closed (1h): 412 ]  [ Errors(1h): 5 ] │
├───────────────────────────────┬─────────────────────────────────────────┤
│ Active Calls Per Pod (table)  │ Calls Status (donut) | End Reason (donut) │
├───────────────────────────────┴─────────────────────────────────────────┤
│ Active Calls (table, auto-refresh)                                        │
├───────────────────────────────────────────────────────────────────────────┤
│ Error Logs (live tail)                                                    │
└───────────────────────────────────────────────────────────────────────────┘
```

## 3. Live simulation (demo)
- A client-side ticker mutates the active-call set every 15–30s: starts new calls, advances
  elapsed time, closes some with a weighted `closed_reason` distribution, redistributes across pods.
- Deterministic seed so the demo is reproducible; "pause stream" toggle for screenshots.
- Architected as a `LiveSource` interface → swap to WebSocket/SSE-from-Postgres later.

## 4. Role behavior
- **SuperAdmin:** all projects; org/project filter.
- **User:** only assigned project(s); same panels, scoped data; error logs limited to their namespace.

## 5. Data sources
S1 (`chat_conversations`, `chat_messages`) + S2 (Loki). See doc 04.

## 6. Open questions
- [ ] Full `status` enum (besides ACTIVE) — e.g., COMPLETED/CLOSED/FAILED? (confirm from DB.)
- [ ] Acceptable refresh cadence for the real backend (15s vs 30s) given DB load.
