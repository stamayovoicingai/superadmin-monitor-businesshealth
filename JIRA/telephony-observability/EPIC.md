# EPIC — Infra: Telephony Observability (`TEL`)

**Route:** `/infra/telephony`, `/infra/telephony/[callId]` · **Roles:** SuperAdmin (full), User (own-project trace only)
**Backlog priority:** P2 (Wave 2) · **Blocked by:** `_platform` (`PLAT-BE1`), `CALLS` (`CALLS-BE1`, for `Call-ID` correlation)

## Goal
Give telephony/NOC engineers a server-level view of the SIP trunk (Asterisk, optionally an SBC in
front of it) independent of application-level Call Logs: every call as a searchable SIP dialog, a
full message-by-message flow (INVITE/1xx/2xx/4xx/ACK/BYE...), a visual call-flow ladder, RTP/RTCP
call quality (jitter/packet loss/MOS), and a Wireshark-compatible PCAP export.

**Note — no existing MVP screen:** unlike other epics, this module has **no prototype UI yet**. The
spec is `PRD/19-module-telephony-observability.md` (informed by a reference platform's screenshots).
Build v1 as a **mock-first demo** (deterministic multi-hop SIP dialogs + synthetic-but-valid PCAP,
same pattern as every other module) behind a typed `TelephonySource` adapter, swappable later to a
real HEP/Homer feed — do not wait on real Asterisk/SBC capture access to ship the UI.

## Outcome
- `sip_call` / `sip_message` / `rtp_quality_sample` schema, correlated to `chat_conversations` by
  `Call-ID` so this module and Call Detail (`CALLS`) cross-link both ways.
- Communications list (`/infra/telephony`): filter by origin/destination/Call-ID/time window, live
  auto-refresh (pausable), List + Statistics views.
- Call detail (`/infra/telephony/[callId]`): Resumen · Flujo (ladder diagram) · Mensajes (message
  table + Mensaje/SIP/SDP/Detalles inspector) · Calidad (jitter/loss/MOS) · Exportar (PCAP + plain
  text), audit-logged.
- `TelephonySource` adapter: `MockAdapter` today, `HomerAdapter` (real HEP feed) later — config swap.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth (module not yet present)
- PRD: `PRD/19-module-telephony-observability.md` (architecture, UI spec, data model, open questions)
- Cross-refs: `PRD/05-module-observability.md` (Call Detail link), `PRD/12-data-model.md`,
  `PRD/04-data-sources.md` §8b (S8)
- Pattern to follow for the adapter/mock split: `src/lib/data/source.ts`, `src/lib/data/mock.ts`

## Features
- F1 — SIP capture schema & adapter (mock + Homer stub) (BE)
- F2 — Communications list & call detail query API (BE)
- F3 — PCAP & plain-text export generation (BE)
- F4 — Communications list UI (FE)
- F5 — Call detail UI: 5 tabs incl. call-flow ladder (FE)
- F6 — QA

## Tasks
- `BE-1-sip-capture-schema-adapter.md` (`TEL-BE1`)
- `BE-2-comms-list-call-detail-api.md` (`TEL-BE2`)
- `BE-3-pcap-text-export.md` (`TEL-BE3`)
- `FE-1-comms-list-ui.md` (`TEL-FE1`)
- `FE-2-call-detail-ui.md` (`TEL-FE2`)
- `QA-1-telephony-tests.md` (`TEL-QA1`)

## Open questions (from PRD/19 §8)
- Capture topology (Asterisk-only vs SBC in front), HEP capture agent/store choice, LiveKit's role
  in scope, MOS calculation method, PCAP/SIP retention policy, live refresh cadence.
