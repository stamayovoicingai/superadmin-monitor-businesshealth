# [FE] Call Logs · UI · Call Detail page (transcript, recording, cost, flag)

- **ID:** `CALLS-FE2`
- **Type:** Frontend/UI-UX
- **Epic:** Call Logs & Call Detail
- **Feature:** F4 — Call Detail UI
- **Priority:** P1
- **Blocked by:** `PLAT-FE1`, `CALLS-BE2`
- **Blocks:** `CALLS-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `audio` `observability`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/calls/[callId]/page.tsx`, `src/lib/hooks.ts` (`useCall`, `useCreateFlag`)

## What
Productionize Call Detail: header (ids/agent/status/end-reason), transcript, recording player, latency
waterfall, per-service cost breakdown (+ margin for SuperAdmin), error logs, and the **flag** action
(create a manual flag with a note → Flag Queue).

## How (building on the MVP)
**Design system:** build on the `/design` tokens + reusable components (voicing.ai system — cream/orange, Inter + Instrument Serif). Reuse `Button`/`Badge`/chips/`Card`/`KpiCard`/`PageHeader`/chart wrappers/`DateRangeControl`; never hardcode colors, fonts, or radii. See `PLAT-FE1`.

- Page exists; wire `useCall` to `CALLS-BE2`. Render real transcript (turns) + audio via signed URL.
- Keep the flag popover (`useCreateFlag`) — it already creates a real `CallFlag`; ensure it targets the
  production flags API (`FLAG` epic).
- RBAC: hide revenue/margin for `User`. Loading/empty/error states; responsive.

## Why
This is where flagged/issue calls are investigated end-to-end.

## Acceptance Criteria
- [ ] Transcript, recording, waterfall, per-service cost, and error logs render from the real API.
- [ ] Flagging creates a manual flag that appears in the Flag Queue.
- [ ] `User` sees cost but not revenue/margin; SuperAdmin sees all.
- [ ] Audio uses an expiring signed URL; graceful state when no recording.
