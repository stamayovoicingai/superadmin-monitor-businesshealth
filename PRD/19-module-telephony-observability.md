# 19 · Module: Telephony Observability (SIP / RTP)

Gives ops a **server-level view of the SIP trunk** (Asterisk, and any SBC in front of it) — every
call as a sequence of SIP messages, per-message timing, RTP/RTCP call quality, and a downloadable
PCAP — independent of and complementary to the existing **Call Logs** (doc 05, application-level:
transcript, agent behavior, cost). This module answers *"is our SIP signaling healthy?"*, not
*"did the bot answer well?"*.

Modeled after a reference platform the team reviewed (screenshots on file): a searchable
communications list keyed by SIP trunk/SBC hop, and a call-detail drawer with **Resumen / Flujo /
Mensajes / Calidad / Exportar** tabs.

---

## 1. Why a separate module from Call Logs

| | Call Logs (doc 05) | Telephony Observability (this doc) |
|---|---|---|
| Layer | Application (`chat_conversations`) | Signaling (SIP) + media transport (RTP/RTCP) |
| Keyed by | `call_id` (Voicing's own) | SIP `Call-ID` header — **same value**, different lens |
| Shows | transcript, agent latency/cost, end reason | INVITE/100/180/200/ACK/BYE sequence, per-hop deltas, jitter/MOS, PCAP |
| Diagnoses | "the bot hung up wrong" / "cost spike" | "the SBC retransmitted", "one-way audio", "no early media", "403 from carrier" |

Both share the same `Call-ID` / `call_id`, so **Call Detail (doc 05) gets a new "SIP Trace" link**
into this module, and this module's call detail links back to the app-level Call Detail. They are
cross-referenced, not merged — the audiences and troubleshooting workflows differ (NOC/telephony
engineer vs. ops/product).

---

## 2. Architecture — capture strategy

**Decision: HEP/Homer.** Asterisk (and any SBC placed in front of it, e.g. OpenSIPS/Kamailio) sends
a **copy of every SIP packet** via the HEP (Homer Encapsulation Protocol) to a capture server. This
is the industry-standard approach (used by sngrep/Homer/HEPIC) — no inline tap on live media, no
per-host tcpdump/PCAP files to babysit, and HEP already tags each packet with the **Call-ID**,
timestamps, and 5-tuple, so correlation into a full call flow is native rather than something we
have to reconstruct from raw pcap ourselves.

```
Asterisk / SBC (OpenSIPS or Kamailio, optional)
        │  HEP (duplicated SIP packets, UDP)
        ▼
  HEP capture agent  (e.g. Homer's heplify-server, or a lightweight custom HEP listener)
        │  writes
        ▼
  sip_message store (Postgres/Supabase — see §6)  +  optional raw-PCAP archive (object storage)
        │
        ▼
  Telephony Observability module (reads via typed adapter, same pattern as every other module)
```

- **RTP/RTCP quality** (jitter, packet loss, MOS) is *not* carried over HEP for signaling — it comes
  from **RTCP Sender/Receiver Reports**, which Asterisk exposes via AMI/ARI (`RTCPReceived`/`RTCPSent`
  events) or via `rtp set stats`. LiveKit (if/where it terminates media, e.g. WebRTC leg) exposes
  equivalent stats via its server SDK/webhooks. Both are ingested as periodic quality samples keyed
  by `call_id`.
- If an SBC (OpenSIPS/Kamailio) sits in front of Asterisk, it becomes the **best single HEP source**
  (captures the WAN-facing leg + the internal leg to Asterisk in one place, matching the "SBC
  OpenSIPS WAN" hops shown in the reference screenshots) — but the module works with Asterisk-only
  HEP if no SBC is deployed.
- **Multi-hop is expected and desirable**: a single `Call-ID` may show 2+ INVITE legs (carrier →
  SBC → Asterisk) — the Flujo/Mensajes views must render every hop, not just one leg.

### 2.1 Demo strategy (mock, always available as a fallback)

A **mock adapter** generates realistic multi-hop SIP dialogs (INVITE → 100 → 18x → 200 → ACK → ... →
BYE → 200, with occasional 4xx/5xx/timeout failure paths) plus matching RTCP quality samples and a
**synthetic but valid PCAP** (real SIP/SDP bytes, replayable in Wireshark) per call — deterministic,
tied to the same seeded calls used elsewhere (doc 12), so a call's app-level row and its SIP trace
are consistent. This remains the default and the automatic fallback when the real integration (§2.2)
isn't configured.

### 2.2 Real integration — Homer Next-Gen (v4) API ✅ built (Jul 2026)

Voicing already runs **Homer** (github.com/sipcapture/homer) as the HEP capture server, so §2's HEP
pipeline is Homer's own ingestion — this module doesn't run its own HEP listener; it reads from
Homer's REST API (`homer-core` 4.0.2-draft OpenAPI spec) instead of reimplementing capture/storage.

- **Auth:** a long-lived **Auth-Token** (`Homer UI → Settings → Auth Tokens`, or `POST
  /auth-tokens`), sent as the `Auth-Token` header — no session/JWT refresh to manage for a
  server-to-server integration.
- **Env vars:** `TELEPHONY_DATA_SOURCE=homer` (default `mock`), `HOMER_BASE_URL` (e.g.
  `https://homer.voicing.ai/api/v4`), `HOMER_AUTH_TOKEN`. Missing either while `homer` is selected
  logs a warning and **falls back to mock** rather than failing the module — `src/lib/telephony-source.ts`.
- **Endpoint mapping** (`src/lib/homer/adapter.ts`):

  | Our need | Homer endpoint |
  |---|---|
  | Communications list | `POST /transactions/search` (`filter.event_type=call`, `filter.proto_type=1`, `filter.from_user`/`ruri_user`/`call_id`, `timestamp.from/to`) |
  | List enrichment (status, duration, codec, from/ruri party) | `POST /transactions/callinfo` (batched, up to 50 `session_ids`) — **best-effort**: this endpoint's response shape is described in the spec's prose, not a formal schema; read defensively, never a hard dependency |
  | Call detail — Mensajes/Flujo | `POST /transactions/messages` (`session_id`) → raw SIP text per message, parsed with the same `parseSipHeaders`/`extractSdpBody` helpers the mock uses |
  | Call detail — Calidad | `POST /transactions/qos` → RTP/RTCP rows; jitter/loss/MOS/RTT fields aren't in the formal draft schema either — extracted defensively (`jitter`/`jitter_ms`, `packet_loss`/`packet_loss_pct`/`fraction_lost`, `mos`/`mos_lq`/`mos_cq`, `rtt`/`rtt_ms`), silently dropped if absent |
  | Call detail — Exportar | `POST /exports` (`type: pcap\|text`) → poll `GET /exports/{id}` until `download_url` present → `GET /exports/{id}/download` — a **real** capture, not a reconstruction. The route polls up to 15s server-side so the FE's single "Download" click is unchanged. |

- **Verified (not just written):** since this session had no network path to a real Homer server, the
  adapter was exercised against a throwaway local server returning fixtures shaped exactly like the
  documented schemas (multi-hop INVITE/100/200/BYE dialog, `callinfo`, `qos`, async export) —
  confirmed correct request bodies, correct field mapping into `SipCallSummary`/`SipMessage`/
  `SipQualitySample`, and correct fallback-to-mock when unconfigured. **Not** verified against
  Voicing's actual Homer instance or real captured traffic — do that before relying on it operationally.

**Known gaps, by design, not oversight:**
- **No org/project attribution.** Homer has no concept of Voicing orgs/projects — `orgId`/
  `projectId`/`projectName`/`orgName` come back empty in Homer mode, so the Communications list is
  effectively **platform-wide** regardless of the top-bar Org/Project filter. A real fix needs a
  node↔project mapping (Homer's `db/nodes`/capture-node concept could carry this) — not built yet.
- **`linkedCall` is always `null`** in Homer mode — there's no confirmed shared identifier between
  our `Call.callId` and Homer's `sid` (the real SIP Call-ID). Fixing this needs the telephony layer
  (Asterisk/LiveKit) to record the actual SIP Call-ID on our `Call` row at setup time; until then,
  the "View app call →" link doesn't appear for Homer-sourced calls.
- **List pagination is approximate beyond the first few pages** — Homer's search is cursor-based;
  we approximate numeric "page N" by fetching `page × pageSize` items and slicing, which is correct
  for shallow pagination but not efficient/exact for deep pages (Homer's 1000-row cap applies too).

---

## 3. Information architecture ✅ rebuilt (Jul 2026) to match Homer's real UI

New sidebar entry under **Infra**: `Telephony` → `/infra/telephony`. 🔒-gated like Kubernetes/ELB.

**Revision (Jul 2026):** after the user shared screenshots/exports of Voicing's actual Homer
instance, the IA was rebuilt to faithfully replicate Homer's real interaction model — rebuilt with
the platform's own design system (shadcn/ui, brand tokens), not a visual clone of Homer's CSS. Two
decisions drove the rebuild:

- **List granularity is message-level, not call-level.** The list is the raw SIP **Results Table**
  (one row per SIP message: `timestamp, method, caller, callee, src_ip:port, dst_ip:port,
  session_id, cid, ...`), matching Homer exactly, instead of a call-summary rollup.
- **Interaction is via floating modals, not full-page navigation.** Clicking a row's Method opens a
  **Message** modal (single raw message + Decode). Clicking a row's session_id / the "Tx" action
  opens a **Transaction** modal (tabbed: Messages | Call Flow | QoS | Call Info | Export) — mirroring
  Homer's own modal-driven UX. The `/infra/telephony/[callId]` route is retained as a secondary
  deep-link surface that renders the same shared `TransactionPanel` content full-page.

| Route | Purpose |
|---|---|
| `/infra/telephony` | Message-level Results Table (search/filter across raw SIP messages) |
| `/infra/telephony/[callId]` | Deep-link detail page — reuses `TransactionPanel` (Messages / Call Flow / QoS / Call Info / Export) |

Also: **Call Detail (doc 05)** gains a "View SIP Trace →" link when a `Call-ID` is resolvable, and
this module's call detail gains a "View app call →" link back.

### Role behavior
Per doc 01 §3: **SuperAdmin/PM/Dev** (ops roles) can see this module; **Financial** cannot.
SuperAdmin sees all trunks/SBC hops and all orgs/projects; PM/Dev are scoped to their granted
orgs/projects (doc 01 §6) — **in mock mode**. In Homer mode (§2.2), org/project scoping doesn't
apply yet (known gap, §8), so the Communications list is effectively unscoped platform-wide for
whichever role can reach it.

---

## 4. Results Table (`/infra/telephony`) ✅ rebuilt (Jul 2026, message-level)

Message-level list — one row per raw SIP message, matching Homer's Results Table exactly.

**Filters:** Session ID · Caller · Callee · Method (select) · Response code · Src IP · Dst IP ·
User-Agent · Node · Live toggle (15s poll when on).

**Columns:** Timestamp · Method (color-coded badge: provisional/success/failure) · Caller · Callee ·
Src (IP or resolved alias : port) · Dst (IP or resolved alias : port) · Actions (Msg / Tx icon
buttons). Rows are visually tinted per `session_id` group so a full dialog reads as one visual block
even though each row is a separate message.

Clicking the Method badge, or the **Msg** action, opens the **Message** modal for that single raw
message (UUID/timestamp/method/5-tuple/session/cid + Raw↔Decode payload toggle). Clicking the **Tx**
action opens the **Transaction** modal, scoped to that message's `session_id`.

*(Superseded: the previous call-summary list with a separate "Estadísticas" tab — aggregate
volume/failure-rate/setup-time stats — was dropped in the rebuild to match Homer's flat message-table
model. Aggregate stats may return later as a dedicated dashboard, not blocking this rebuild.)*

---

## 5. Transaction modal / detail page (`/infra/telephony/[callId]` or floating)

Shared `TransactionPanel` component, opened either as a floating **Transaction** modal (from the
Results Table's Tx action) or as the full-page `/infra/telephony/[callId]` deep link — same content
either way. Header: session/Call-ID (monospace) + status badge (Fallida/Activa/Finalizada). Tabs,
renamed to match Homer's own tab set:

### 5.1 Messages
Flat, sortable table of every SIP message in the dialog, matching the reference screenshot:

| # | Hora | Delta | Método | Tamaño | Origen → Destino | Proto |
|---|------|-------|--------|--------|-------------------|-------|
| 1 | 18:20:33.015 | +0ms | `INVITE` | 1.8 KB | 10.35.13.68:5061 → 10.124.193.33:5061 | UDP |
| 2 | 18:20:33.017 | +2ms | `100` | 320 B | 10.124.193.33:5061 → 10.35.13.68:5061 | UDP |
| … | | | | | | |

Clicking a row opens the same **Message** modal used from the Results Table (consistent
interaction — same component, same `uuid`-keyed lookup, whether reached from the flat list or from
inside a transaction).

### 5.2 Call Flow
Visual SIP **ladder/sequence diagram** (caller ↔ SBC ↔ Asterisk ↔ callee lanes), each message as an
arrow labeled with its method/code and timestamp offset — the classic sngrep/Wireshark call-flow
view. Failure points (4xx/5xx, timeout, no-ACK) highlighted in red on the ladder.

### 5.3 QoS
RTP/RTCP-derived call quality, sampled periodically through the media session:
- **Jitter** (ms) — timeseries, both directions.
- **Packet loss** (%) — timeseries.
- **MOS** (estimated, e.g. via E-model from jitter+loss+delay) — headline stat + trend.
- **Round-trip / one-way delay** (ms).
- Codec + payload type actually used (from SDP negotiation + RTP payload).
- A pass/fail badge against configurable quality thresholds (reuses the **Thresholds** control,
  doc 05, extended with a `telephony_quality` category — jitter/MOS/loss bands).

### 5.4 Call Info
Structured summary equivalent to the old "Resumen" tab: caller/callee, trunk/SBC hop(s) involved,
start/end time, total duration, final SIP status code + reason, retransmission count, negotiated
codec (from SDP), linked Voicing `call_id`/project/org (when resolvable), and a "View app call →"
link into doc 05's Call Detail.

### 5.5 Export
Two downloads, matching the reference screenshot exactly:
- **Captura PCAP** — "Archivo de captura de paquetes compatible con Wireshark." Reconstructed from
  the stored SIP messages (+ RTP headers if captured) into a valid `.pcap`/`.pcapng`.
- **Texto plano** — "Mensajes SIP exportados en formato de texto legible" (the Mensajes tab content
  as flat text, grep-friendly).

Both are audit-logged (who exported, when, which call) — SIP/PCAP exports can contain sensitive
call metadata (ANI/DNIS), so this follows the same access-control posture as recordings (doc 05 S7).

---

## 6. Data model additions

New entities (Supabase/Postgres), scoped like everything else by `org_id`/`project_id` where
resolvable (a SIP dialog may arrive before app-level correlation is possible, e.g. pre-answer
failures — those rows stay org/project-`null` until/unless correlated):

- **sip_call** — one row per SIP dialog (by Call-ID): call_id (SIP), linked `call_id` (app, nullable),
  origin/destination (ANI/DNIS), start/end time, final status code + reason, trunk/hop labels
  involved, duration, direction (inbound/outbound), retransmission count.
- **sip_message** — one row per captured SIP packet: `sip_call_id` FK, seq `#`, timestamp, delta_ms,
  method_or_code, size_bytes, src_ip:port, dst_ip:port, transport (UDP/TCP/TLS), raw_message (text),
  parsed_headers (jsonb), sdp_body (text, nullable).
- **rtp_quality_sample** — periodic quality point: `sip_call_id` FK, timestamp, direction, jitter_ms,
  packet_loss_pct, mos, rtt_ms, codec.
- **pcap_export_log** — audit trail: `sip_call_id`, exported_by (app_user), exported_at, format
  (pcap/text).
- **telephony_quality_threshold** — extends the existing threshold model (doc 05) with
  jitter/MOS/loss bands per severity.

`sip_call.call_id` is the join key back to `chat_conversations.call_id` (doc 12) — enables the
bidirectional link between this module and Call Detail.

---

## 7. Backend-ready adapter

Follows the platform-wide pattern (doc 13): a `TelephonySource` typed adapter (`listSipCalls`,
`getSipCallDetail`, `exportPcap`, `exportText` — `src/lib/telephony-source.ts`) implemented as
`MockTelephonySource` (default) and `HomerTelephonySource` (`src/lib/homer/adapter.ts`, §2.2),
selected via `TELEPHONY_DATA_SOURCE=mock|homer` — **no UI rewrite required**, confirmed: the FE
(`/infra/telephony`, `/infra/telephony/[callId]`) is unchanged between modes.

---

## 8. Open questions

**Resolved (Jul 2026):** capture topology and agent — **Homer**, already running, integrated via its
v4 REST API rather than us running a separate HEP listener (§2.2). MOS/jitter/loss come from
whatever Homer's RTCP capture already computes (read defensively, not recalculated by us).

- [ ] **Org/project attribution** — needs a Homer node↔Voicing-project mapping to scope the
  Communications list; today it's platform-wide in Homer mode (§2.2).
- [ ] **`linkedCall` correlation** — needs the telephony layer to record the real SIP Call-ID on our
  `Call` row; today Homer-sourced calls never link back to app-level Call Detail (§2.2).
- [ ] **Verify against the real Homer instance** — this integration was built and exercised against
  fixtures matching the documented schema, not Voicing's live server (§2.2) or real captured traffic.
  Priority: confirm `/transactions/callinfo`'s actual response shape and the real RTP/RTCP QoS field
  names (jitter/loss/MOS), since both are read defensively against an undocumented/draft shape.
- [ ] LiveKit's role: does it terminate a WebRTC leg with its own RTCP stats feed, and is that leg
  captured by the same Homer pipeline or does it need a separate ingestion path?
- [ ] Retention policy for raw SIP messages and PCAP exports on the Homer side (storage cost +
  compliance, ANI/DNIS is PII-adjacent) — this module reads Homer's data, doesn't set its retention.
- [ ] Real-time refresh cadence for the Communications list (mirrors the Live Ops question in doc 15).
- [ ] Deep pagination beyond the first several pages (§2.2) — worth fixing if NOC usage needs it.
