# [FE] Service Health · UI · Health page wire + harden

- **ID:** `HEALTH-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Service Health
- **Feature:** F3 — Health UI
- **Priority:** P2
- **Blocked by:** `PLAT-FE1`, `HEALTH-BE1`, `HEALTH-BE2`
- **Blocks:** `HEALTH-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `observability`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/health/page.tsx`, `src/lib/hooks.ts` (`useHealth`, `useSetRecipients`, `useSetServiceOverride`)

## What
Wire the Service Health page (status summary KPIs, incidents with affected projects, external + internal
service rows with heartbeat bars/uptime/response, per-service notify override, per-project recipients
editor) to the real API.

## How (building on the MVP)
**Design system:** build on the `/design` tokens + reusable components (voicing.ai system — cream/orange, Inter + Instrument Serif). Reuse `Button`/`Badge`/chips/`Card`/`KpiCard`/`PageHeader`/chart wrappers/`DateRangeControl`; never hardcode colors, fonts, or radii. See `PLAT-FE1`.

- Page exists; point hooks at `HEALTH-BE1/BE2`. Keep heartbeat bars, incident cards (affected projects),
  recipients editor, and per-service override popover. 30s refresh.
- Empty/error states; responsive; a11y.

## Why
The single pane to watch platform health and manage who gets alerted.

## Acceptance Criteria
- [ ] Services, status, uptime, heartbeats, and incidents render from the real API.
- [ ] Recipients + per-service overrides editable and persisted.
- [ ] Scope (project/org) filters internal services; externals always shown; responsive; a11y clean.
