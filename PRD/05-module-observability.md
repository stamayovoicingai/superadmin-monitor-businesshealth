# 05 · Module: Observability (Dashboard)

The day-to-day pane: cost, performance, call logs, and issues. Feature 1A + Feature 1B's surfacing.
Sub-pages: **Cost & Margin** (see doc 03), **Performance**, **Call Logs / Call Detail**, **Issues**,
**Thresholds**.

---

## 1. Performance (`/performance`)

Near-real-time latency & reliability per project/org (snapshot + refresh, "last updated" chip).

### KPIs
- Avg latency / call (overall) · Error rate · Calls (period) · Active calls (now).

### Per-service latency breakdown (avg)
Stacked/grouped over time **and** as a summary table:

| Service | Metric |
|---------|--------|
| LLM | avg generation latency |
| STT | avg transcription latency |
| TTS | avg synthesis latency |
| Tool execution | avg tool/function-call latency |
| Telephony | avg connect/transport latency |

> Latency comes from per-call instrumentation (doc 04 S1/S2). The waterfall (LLM→STT→TTS→tool→telephony)
> also appears per call in **Call Detail**.

### Charts
- Latency over time (overall + per-service toggle).
- Latency distribution (p50 / p90 / p99) — bar or histogram.
- Error rate over time.

---

## 2. Call Logs (`/calls`)

Filterable table of calls per project/org (Feature 1A: Call Logs).

### Columns
`call_id` · agent · org/project · date/time · duration · disposition · **cost** · **revenue\*** ·
**margin\*** · latency · end reason · status · flagged?

\* revenue/margin columns hidden for `User` (doc 01).

### Filters
Org · project · agent · date-range · disposition · end reason (`USER_IDLE`, `USER_DISCONNECTED`,
`CALL_TRANSFERRED`, `CALL_END_PHRASE_TRIGGERED`, `OTHER`) · status (ACTIVE/closed) · flagged ·
cost range · latency range · free-text (call_id / session_id).

### Behaviors
- Server-style pagination + column sort (backend-ready query params in URL).
- Row click → **Call Detail**.
- Bulk export (CSV) — SuperAdmin.

---

## 3. Call Detail (`/calls/[callId]`)

The drill-down hub. Everything about one call.

### Layout
- **Header:** call_id, session_id, agent, org/project, date, duration, status, end reason, flag button.
- **Transcript** (from `chat_messages`) — turn-by-turn, role-colored, timestamps; search within.
- **Recording** — audio player with waveform (signed-URL pattern, doc 04 S7).
- **Latency waterfall** — per-turn / per-service timing.
- **Cost breakdown** — per-service cost table (LLM in/out tokens, STT min, TTS chars, telephony min,
  cloud alloc) → total cost; revenue contribution + margin (**SuperAdmin only**).
- **Error logs** — Loki lines scoped to this call/session (doc 04 S2).
- **Flag panel** — flag/unflag + comment thread (doc 10).

---

## 4. Issues (`/issues`)

Two views: **Active Issues** and **Issues by Category** (Feature 1A).

### 4.1 Active Issues
Computed by evaluating live metrics against **configurable thresholds** (§5).

- Severity: **Critical** | **Warning**.
- Each issue: title, severity, metric & breached value vs threshold, scope (org/project/agent),
  **affected calls** (call_id + timestamp list), first/last occurrence, status (open/ack/resolved).
- Actions: acknowledge, assign category, jump to affected calls, (SuperAdmin) snooze.

### 4.2 Issues by Category
Categories are **user-configurable by SuperAdmin** from the UI.

- **Pre-seeded categories:** `Infra` · `Compliance` · `Technical (APIs, tools)` ·
  `Effectiveness (conversation flow)`.
- SuperAdmin can create custom categories and assign issue types to them.
- Table columns: **category · severity · count · affected calls · last occurrence**.
- Drill: category → issue type → affected calls.

---

## 5. Thresholds (`/controls/thresholds`, SuperAdmin)

Configurable thresholds that drive Active Issues (Feature 1A). **Not hardcoded.**

| Threshold | Critical example | Warning example |
|-----------|------------------|-----------------|
| Latency (ms) | > X ms | > A ms |
| Error rate (%) | > Y% | > B% |
| Cost per call (USD) | > Z USD | > C USD |

- Scope: global / per-org / per-project / per-agent (most specific wins).
- Each threshold maps to a **category** (so breaches auto-file under Infra/Technical/etc.).
- Optional action hook (Phase-2 link): notify + (QA Bench) pause agent on Critical.
- Editing is simulated state in the demo (persisted to the mock store / Supabase).

---

## 6. Role variants
- **SuperAdmin:** all of the above, all scopes, financial columns visible, threshold config.
- **User:** Performance, Call Logs (no revenue/margin; **cost-to-serve visible** per doc 01 §4),
  Call Detail (no margin), Issues (view-only, no threshold config), scoped to assigned projects.

## 7. Data sources
S1 (calls/transcript/usage), S2 (error logs), S5 (cost), S6 (revenue) — see doc 04.
Issues are **derived** by comparing rollups/calls to thresholds.

## 8. Open questions
- [ ] Exact default threshold values (X/Y/Z/A/B/C) — seed sensible defaults, confirm later.
- [ ] Disposition taxonomy — is there a fixed list beyond end-reason? (assume: completed, transferred,
  voicemail, no-answer, failed — confirm.)
