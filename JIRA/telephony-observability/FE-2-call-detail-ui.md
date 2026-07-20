# [FE] Telephony Observability · UI · Call detail (5 tabs + flow ladder)

- **ID:** `TEL-FE2`
- **Type:** Frontend/UI-UX
- **Epic:** Infra: Telephony Observability
- **Feature:** F5 — Call detail UI: 5 tabs incl. call-flow ladder
- **Priority:** P2
- **Blocked by:** `TEL-FE1`, `TEL-BE3`
- **Blocks:** `TEL-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `infra` `telephony` `charts`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/19-module-telephony-observability.md` §5 (no existing MVP page; build net-new at
  `/infra/telephony/[callId]`)

## What
Build the call-detail view (`/infra/telephony/[callId]`) with the five tabs specified in `PRD/19`
§5: **Resumen** (at-a-glance summary + link to app Call Detail), **Flujo** (SIP ladder/sequence
diagram, failure points highlighted red), **Mensajes** (sortable `# / Hora / Delta / Método / Tamaño
/ Origen→Destino / Proto` table with a row-expand Mensaje/SIP/SDP/Detalles inspector), **Calidad**
(jitter/packet-loss/MOS/RTT timeseries + pass/fail badge), **Exportar** (Captura PCAP + Texto plano
downloads, per `TEL-BE3`).

## How (building on the MVP)
**Design system:** build on `/design` tokens + reusable components; never hardcode colors, fonts, or
radii. See `PLAT-FE1`.

- Header: monospace `Call-ID` + status badge (Fallida/Activa/Finalizada).
- **Flujo** is the highest-risk piece of this task: a caller↔SBC↔Asterisk↔callee lane diagram with
  timestamped arrows per message. Scope it as a purpose-built SVG/canvas component (no off-the-shelf
  sequence-diagram lib assumed) — keep it declarative from the same `sip_message` array the Mensajes
  tab renders, so both tabs stay in sync.
- **Mensajes** row-expand inspector reuses a code/syntax-highlight component for the raw SIP text and
  a key-value/table renderer for parsed SIP headers and SDP media lines.
- **Calidad** reuses the platform's Timeseries chart wrapper; threshold pass/fail badge reads
  `telephony_quality_threshold` evaluation from `TEL-BE2`.
- **Exportar** matches the reference screenshot layout exactly: two rows (Captura PCAP / Texto plano)
  each with a short description and a Descargar button hitting `TEL-BE3`.
- Add the reciprocal link: "View SIP Trace →" on the existing app-level Call Detail (`CALLS`,
  `PRD/05`) pointing here when a `Call-ID` is resolvable — coordinate with `CALLS-FE2` if that task
  hasn't shipped the link yet (small addition, flag as a follow-up if out of this task's scope).

## Why
This is where telephony engineers actually diagnose a failed/degraded call — the ladder + raw
message inspector + quality + PCAP export together replace needing separate sngrep/Wireshark access.

## Acceptance Criteria
- [ ] All 5 tabs render real data from `TEL-BE2`/`TEL-BE3` for both healthy and failed calls.
- [ ] Flujo ladder correctly shows multi-hop dialogs and highlights 4xx/5xx/timeout/no-ACK failures.
- [ ] Mensajes row-expand inspector shows accurate Mensaje/SIP/SDP/Detalles for at least one call with
      an SDP body.
- [ ] Exportar downloads a real PCAP (openable in Wireshark) and matching plain text.
- [ ] Empty/loading/error states; responsive; keyboard-accessible.
