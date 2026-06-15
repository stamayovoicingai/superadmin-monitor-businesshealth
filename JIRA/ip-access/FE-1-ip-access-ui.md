# [FE] IP Access · UI · Access control page wire

- **ID:** `IPACC-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** IP Access Control
- **Feature:** F3 — IP Access UI
- **Priority:** P3
- **Blocked by:** `IPACC-BE1`
- **Blocks:** `IPACC-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `security` `rbac`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/controls/access/page.tsx`, `src/lib/hooks.ts` (`useIpRules`, `useAddIpRule`, `useDeleteIpRule`, `useSetIpPolicy`)

## What
Wire the IP Access page (Allow/Block lists, default-policy toggle, add/delete with IPv4/CIDR validation,
inherited org rules read-only, IP tester) to the real API.

## How (building on the MVP)
- Page exists; point hooks at `IPACC-BE1`. Keep default-policy cards, validation, inherited section,
  and tester (tester should call the server evaluate for parity). SuperAdmin-only.

## Why
SuperAdmins manage access per scope with immediate feedback.

## Acceptance Criteria
- [ ] CRUD + default policy persist; inheritance shown; CIDR/IP validation enforced.
- [ ] IP tester returns the same verdict as the server evaluator.
- [ ] SuperAdmin-only; responsive; a11y clean.
