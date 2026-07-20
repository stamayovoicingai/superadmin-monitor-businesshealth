# [FE] Telephony Observability · UI · Communications list

- **ID:** `TEL-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Infra: Telephony Observability
- **Feature:** F4 — Communications list UI
- **Priority:** P2
- **Blocked by:** `PLAT-FE1`, `TEL-BE2`
- **Blocks:** `TEL-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `infra` `telephony` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/19-module-telephony-observability.md` §3, §4 (no existing MVP page; build net-new at
  `/infra/telephony`)

## What
Build the **Communications list** page (`/infra/telephony`, new sidebar entry under Infra, 🔒-gated
like Kubernetes/ELB): filters (Origen, Destino, Call-ID, time-window presets `5m…2d`, Todas toggle,
Pausado/Live toggle), a `Lista` table (Hora/Tipo/Origen/Destino/Duración/Estado/Métodos chips/
Acciones) and an `Estadísticas` aggregate view, per `PRD/19` §4.

## How (building on the MVP)
**Design system:** build on `/design` tokens + reusable components (voicing.ai system). Reuse
`Button`/`Badge`/chips/`Card`/`PageHeader`/`DateRangeControl`/`DataTable`; never hardcode colors,
fonts, or radii. See `PLAT-FE1`.

- New sidebar entry `Telephony` under **Infra**, gated per `TEL-BE2`'s RBAC response (SuperAdmin
  full; User sees only own-project calls, no trunk aggregates).
- Live-leaning refresh (auto-refresh, pausable via the Pausado toggle) — this list is closer to Live
  Operations (`LIVE`) than the snapshot+manual-refresh pattern used elsewhere; reuse whatever polling
  primitive `LIVE-FE1` established if available.
- Método chips render the compact SIP sequence (e.g. `100 INVITE 200 ACK`) per row.
- Row action → navigate to `TEL-FE2`'s call detail route.

## Why
The primary NOC entry point into SIP trunk health — search/filter across all dialogs before drilling
into one.

## Acceptance Criteria
- [ ] All documented filters work; List and Statistics views both render real data from `TEL-BE2`.
- [ ] Live/Pausado toggle works; time-window presets change scope correctly.
- [ ] RBAC: `User` sees only their project(s)' calls, no trunk-level stats section.
- [ ] Empty/loading/error states; responsive; keyboard-accessible.
