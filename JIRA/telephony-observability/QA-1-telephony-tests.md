# [QA] Telephony Observability · QA · Comms list, call detail, export scenarios

- **ID:** `TEL-QA1`
- **Type:** QA
- **Epic:** Infra: Telephony Observability
- **Feature:** F6 — QA
- **Priority:** P2
- **Blocked by:** `TEL-FE1`, `TEL-FE2`
- **Blocks:** —
- **Components/Labels:** `qa` `infra` `telephony`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/19-module-telephony-observability.md` (full spec; no existing MVP fixtures — this task's
  scenarios are the first golden fixtures for this module)

## What / Why
Validate the Communications list, call detail (all 5 tabs), export, and RBAC scoping — including the
cross-links to/from the existing Call Logs/Detail module.

## How (building on the MVP)
- Since there's no pre-existing mock to diff against, define this task's own **golden fixtures**:
  a happy-path call, a multi-hop call, a 4xx/5xx failure, a timeout/no-ACK failure, and a call with
  degraded quality (high jitter/loss) — assert list + detail + export are internally consistent for
  each.
- Validate responses against the `TelephonySource` shapes from `TEL-BE1`/`TEL-BE2`.
- Cover RBAC (SuperAdmin sees everything; User scoped to own project(s), no trunk aggregates, cannot
  export out-of-scope calls) — per `PRD/19` §3.
- Automate in CI: pytest for backend/adapter logic, Playwright or RTL for the UI flows (list filters,
  ladder rendering for multi-hop/failure calls, export download).

## Acceptance Criteria (scenarios)
- [ ] List filters (origen/destino/Call-ID/time window/estado) return correct results for each
      fixture call.
- [ ] Call detail Resumen/Flujo/Mensajes/Calidad render correctly for happy-path, multi-hop, and
      failure fixtures; Flujo highlights failure points.
- [ ] Exportar downloads a valid PCAP and matching plain text for at least one fixture; export is
      logged in `pcap_export_log`.
- [ ] `Call-ID` cross-link works both ways (Call Detail → SIP Trace, SIP call → app Call Detail) when
      correlatable.
- [ ] RBAC: User cannot see/export calls outside their project(s); no trunk-level stats visible to User.
- [ ] Loading/empty/error states correct across both screens.
