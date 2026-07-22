# [BE] Telephony Observability · SIP capture · Schema + mock/Homer adapter

> **Update (Jul 2026):** the "stub" `HomerAdapter` described below has been superseded by a real
> implementation — `src/lib/homer/` integrates against Voicing's actual Homer Next-Gen (v4) REST API
> (not a placeholder), selected via `TELEPHONY_DATA_SOURCE=homer`. Exercised against fixtures shaped
> like Homer's documented schemas; **not yet verified against the live Homer server**. See
> `PRD/19-module-telephony-observability.md` §2.2 for the full endpoint mapping and known gaps
> (no org/project attribution from Homer, no confirmed `linkedCall` correlation, approximate deep
> pagination). The `sip_call`/`sip_message`/`rtp_quality_sample` Postgres tables below are still
> pending — the current adapter reads Homer live and maps in-memory, no local persistence yet.

- **ID:** `TEL-BE1`
- **Type:** Backend
- **Epic:** Infra: Telephony Observability
- **Feature:** F1 — SIP capture schema & adapter (mock + Homer stub)
- **Priority:** P2
- **Blocked by:** `PLAT-BE1`
- **Blocks:** `TEL-BE2`, `TEL-BE3`, `TEL-FE1`
- **Components/Labels:** `backend` `python` `postgres` `hep` `sip` `infra` `telephony`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/19-module-telephony-observability.md` §2, §6, §7 (no existing MVP code for this module;
  follow `src/lib/data/source.ts` / `src/lib/data/mock.ts` as the adapter pattern to replicate)

## What
Stand up the foundational schema and the `TelephonySource` typed adapter that every other Telephony
task builds on: `sip_call` (one row per SIP dialog), `sip_message` (one row per captured SIP
packet — method/code, timestamp, delta, size, src/dst, transport, raw text, parsed headers, SDP
body), and `rtp_quality_sample` (periodic jitter/packet-loss/MOS/RTT points). This module has **no
existing prototype** — this task delivers the v1 **mock** implementation (deterministic multi-hop
SIP dialog generator, tied to the same seeded calls as `chat_conversations` so `Call-ID` correlates)
and stubs the production **`HomerAdapter`** interface for later.

## Why
Every other Telephony feature (list, detail, quality, export) reads through this adapter and schema.
Getting the shapes right up front — and correlating by `Call-ID` to the existing call data — is what
lets Call Detail (`CALLS`) and this module cross-link, per PRD/19 §1.

## How (building on the MVP)
- Implement `sip_call` / `sip_message` / `rtp_quality_sample` tables per `PRD/19` §6. `sip_call.call_id`
  joins to `chat_conversations.call_id`; allow it to be `null` for pre-answer/unresolvable dialogs.
- Build `TelephonySource` with methods `listSipCalls`, `getSipCallDetail`, `getSipMessages`,
  `getQualitySamples` (query methods land fully in `TEL-BE2`; this task defines the interface +
  the `MockAdapter` implementation).
- Mock generator: realistic multi-hop dialogs (carrier → SBC → Asterisk when applicable) —
  INVITE→100→18x→200→ACK...BYE→200 happy path plus 4xx/5xx/timeout failure paths — with matching
  RTCP quality samples, deterministic per seeded call (same seed as `chat_conversations`).
- Stub `HomerAdapter`: same interface, reading from a HEP capture store (Homer `heplify-server`/
  `homer-app` or an equivalent listener) — implementation deferred, but the seam (`DATA_SOURCE=
  mock|homer`) must exist so swapping is config-only, per platform convention.
- Document (in code comments / a short ADR) the open capture-topology questions from `PRD/19` §8 —
  this task does not resolve them, just doesn't block on them.

## Acceptance Criteria
- [ ] `sip_call` / `sip_message` / `rtp_quality_sample` tables exist and match `PRD/19` §6.
- [ ] `TelephonySource` interface defined; `MockAdapter` implementation returns deterministic,
      internally-consistent multi-hop dialogs + quality samples correlated by `Call-ID`.
- [ ] `HomerAdapter` stub exists behind the same interface; `DATA_SOURCE` config swap works (returns
      "not implemented" gracefully, does not crash the app).
- [ ] Failure-path dialogs (4xx/5xx/timeout/no-ACK) are represented in the mock, not just happy path.
