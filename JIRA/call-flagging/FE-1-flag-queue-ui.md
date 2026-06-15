# [FE] Call Flagging · UI · Flag Queue + manual flag action

- **ID:** `FLAG-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Call Flagging
- **Feature:** F2 — Flag Queue UI + manual flag
- **Priority:** P1
- **Blocked by:** `FLAG-BE1`
- **Blocks:** `FLAG-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/controls/flags/page.tsx`, `calls/[callId]/page.tsx`, `src/lib/hooks.ts` (`useFlags`, `useCreateFlag`, `useUpdateFlag`)

## What
Wire the Flag Queue (filters by status/source, KPIs, per-row status change, comments popover, project
shown) and the manual flag action on Call Detail to the real API.

## How (building on the MVP)
- Both surfaces exist. Point hooks at `FLAG-BE1`. Queue is SuperAdmin-only (hidden + server-enforced).
- Manual flag popover on Call Detail creates a real flag and surfaces it in the queue.
- Loading/empty/error; responsive; a11y.

## Why
Centralized triage of flagged calls (manual + auto) is the operational close-the-loop surface.

## Acceptance Criteria
- [ ] Queue lists manual + auto flags with source, severity, project; filters + status change work.
- [ ] Comments add/view works; KPIs reflect counts.
- [ ] Manual flag from Call Detail appears in the queue immediately.
- [ ] SuperAdmin-only queue; responsive; a11y clean.
