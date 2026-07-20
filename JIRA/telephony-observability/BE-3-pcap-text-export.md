# [BE] Telephony Observability · Export · PCAP & plain-text generation

- **ID:** `TEL-BE3`
- **Type:** Backend
- **Epic:** Infra: Telephony Observability
- **Feature:** F3 — PCAP & plain-text export generation
- **Priority:** P2
- **Blocked by:** `TEL-BE1`
- **Blocks:** `TEL-FE2`
- **Components/Labels:** `backend` `python` `pcap` `sip` `infra` `telephony` `audit`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/19-module-telephony-observability.md` §5.5, §6 (`pcap_export_log`)

## What
`exportPcap` and `exportText` endpoints for a given `sip_call`: PCAP reconstructs the stored
`sip_message` rows (+ RTP headers if captured) into a valid `.pcap`/`.pcapng` file, openable in
Wireshark; text export renders the Mensajes tab content as flat, grep-friendly text. Every export is
written to `pcap_export_log` (who/when/format) — matches the reference platform's "Exportar" tab
exactly (Captura PCAP / Texto plano).

## Why
NOC/telephony engineers need to pull a call into Wireshark for deep analysis, and SIP/PCAP exports
carry ANI/DNIS (PII-adjacent) so they must be audited like recordings (`PRD/05` S7).

## How (building on the MVP)
- PCAP generation: reconstruct valid Ethernet/IP/UDP + SIP payload frames from `sip_message` rows
  (timestamps, src/dst 5-tuple already stored); a standard PCAP-writing library is sufficient — no
  need to round-trip through a real capture tool.
- Text export: ordered plain-text rendering of every `sip_message.raw_message` in the dialog.
- Write a `pcap_export_log` row on every export (`sip_call_id`, `exported_by`, `exported_at`,
  `format`); this is an **audit log**, not a cache — always log, even on repeated exports of the
  same call.
- Enforce the same RBAC as `TEL-BE2`: a `User` can only export calls within their assigned project(s).

## Acceptance Criteria
- [ ] Downloaded PCAP opens cleanly in Wireshark and shows the correct SIP dialog (correct Call-ID,
      method sequence, timing).
- [ ] Text export matches the Mensajes tab content 1:1, in order.
- [ ] Every export writes a `pcap_export_log` row; log is queryable for audit.
- [ ] RBAC enforced: `User` cannot export calls outside their project scope.
