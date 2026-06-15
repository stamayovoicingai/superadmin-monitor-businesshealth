# [FE] Issues · UI · Issues page wire + harden

- **ID:** `ISSUE-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Issues
- **Feature:** F2 — Issues UI
- **Priority:** P1
- **Blocked by:** `ISSUE-BE1`
- **Blocks:** `ISSUE-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `observability`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/issues/page.tsx`, `src/lib/hooks.ts` (`useIssues`)

## What
Wire the Issues page (KPIs: critical/warning/affected/auto-flagged; Issues-by-Category; active issues
list with affected projects + call links + auto-flagged badge) to the real API.

## How (building on the MVP)
- Page exists with `useIssues`. Point at `ISSUE-BE1`; keep severity/category rendering and call links.
- Empty state ("all within range"); loading/error; responsive; a11y.
- (Optional) issue status actions (ack/resolve) if added to the API.

## Why
Operators need a single, prioritized view of what's wrong and where, with one click to the calls.

## Acceptance Criteria
- [ ] KPIs, by-category, and active issues render from the real API across scopes/date ranges.
- [ ] Critical issues show "auto-flagged" and affected projects; call links open Call Detail.
- [ ] Empty/error/loading states; responsive; a11y clean.
