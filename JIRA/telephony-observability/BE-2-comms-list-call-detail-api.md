# [BE] Telephony Observability · API · Communications list & call detail

- **ID:** `TEL-BE2`
- **Type:** Backend
- **Epic:** Infra: Telephony Observability
- **Feature:** F2 — Communications list & call detail query API
- **Priority:** P2
- **Blocked by:** `TEL-BE1`, `CALLS-BE1`
- **Blocks:** `TEL-FE1`, `TEL-FE2`
- **Components/Labels:** `backend` `python` `postgres` `api` `sip` `infra` `telephony` `rbac`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/19-module-telephony-observability.md` §4, §5.1–5.4, §6

## What
Query endpoints backing the Communications list and Call Detail screens: `listSipCalls` (filterable
by origin/destination/Call-ID/time window/status, paginated, List + Statistics aggregate mode),
`getSipCallDetail` (Resumen tab data incl. linked app `call_id`/project/org), `getSipMessages`
(ordered message table + parsed SIP/SDP for the row-expand inspector), `getQualitySamples`
(jitter/packet-loss/MOS/RTT series + threshold pass/fail).

## Why
This is the read path for both Telephony screens — list and detail — and the join point back to
Call Detail (`CALLS`) via `Call-ID`.

## How (building on the MVP)
- Implement against the `TelephonySource` interface from `TEL-BE1`.
- `listSipCalls`: filters per `PRD/19` §4 (origen, destino, Call-ID, time window presets
  `5m…2d`, estado); Statistics mode aggregates by trunk/hop and time bucket (volume, failure rate,
  avg setup time, top failure codes).
- `getSipCallDetail`: resolve and return the linked app `call_id`/`project_id`/`org_id` when
  correlatable (nullable otherwise); include trunk/hop labels, final status, retransmission count,
  negotiated codec.
- `getQualitySamples`: evaluate against `telephony_quality_threshold` bands (extend the existing
  Thresholds engine, `PRD/05`) and return a pass/fail badge.
- Enforce **RBAC server-side**: SuperAdmin sees all trunks/orgs/projects; `User` sees only SIP
  dialogs whose correlated `call_id` belongs to their assigned project(s) — never trunk/SBC-level
  aggregates (`PRD/19` §3).

## Acceptance Criteria
- [ ] `listSipCalls` supports all documented filters + both List and Statistics response shapes.
- [ ] `getSipCallDetail` / `getSipMessages` / `getQualitySamples` return shapes the FE tasks can
      render without transformation.
- [ ] RBAC enforced server-side: `User` requests for out-of-scope calls return empty/403, not raw data.
- [ ] Quality samples correctly flagged pass/fail against `telephony_quality_threshold`.
