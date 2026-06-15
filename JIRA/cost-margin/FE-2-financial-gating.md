# [FE] Cost & Margin · RBAC · Financial gating (cost-only User variant)

- **Type:** Frontend/UI-UX
- **Epic:** Cost & Margin
- **Feature:** F5 — Financial gating / RBAC
- **Components/Labels:** `frontend` `nextjs` `rbac` `security` `cost`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/components/financial-gate.tsx`, `src/lib/auth/policy.ts`, `src/app/(dashboard)/cost/page.tsx`

## What
Ensure the `User` role sees a **cost-only** Cost & Margin page (cost KPIs, cost-by-service, cost/call,
cost outliers) and **never** revenue, margin, or MRR. SuperAdmin sees everything.

## How (building on the MVP)
- The MVP gates client-side via `useFinancials()`/`<FinancialGate>` reading the role from
  `ViewContext`. Keep this for UX, but the **real protection is server-side** (BE-4 omits the fields
  for `User`) — the FE must not assume the fields exist.
- Replace the demo "View-as" switcher with the **real authenticated role** (from the platform auth/
  session). See the cross-cutting auth task in `_platform/`.
- Render the cost-only layout when `!canSeeFinancials(role)`; hide revenue/margin columns, charts, KPIs.

## Why
Financial data (revenue/margin) is restricted to SuperAdmin. Leaking it to project users is a
confidentiality issue.

## Acceptance Criteria
- [ ] As `User`: no revenue/margin/MRR anywhere on the page; cost-to-serve is visible.
- [ ] As `SuperAdmin`: full view.
- [ ] FE handles responses that omit revenue/margin without errors (defensive rendering).
- [ ] Role comes from the real session, not a client toggle, in production.
