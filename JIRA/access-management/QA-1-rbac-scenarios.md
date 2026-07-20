# [QA] Access Management · QA · Role × module × scope matrix

- **ID:** `ACCESS-QA1`
- **Type:** QA
- **Epic:** Access Management & RBAC v2
- **Feature:** F6 — QA
- **Priority:** P1
- **Blocked by:** `ACCESS-BE3`, `ACCESS-FE1`, `ACCESS-FE2`
- **Blocks:** —
- **Components/Labels:** `qa` `rbac` `security`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/01` §3, §5 (module and capability matrices — the golden fixture for this task)

## What / Why
This is the highest-leverage QA task in the backlog: a wrong RBAC boundary here means real financial
or operational data reaching the wrong role. Validate the full **role × module** visibility matrix
(`PRD/01` §3) and the **scope** boundary (a PM/Dev/Financial identity never sees data outside their
grants) — both client-side (nav/guards) and server-side (`ACCESS-BE3`).

## How (building on the MVP)
- Treat `PRD/01` §3's module→role table as the golden fixture: for each of the 4 roles × ~18 modules,
  assert visible/hidden matches the table exactly (nav entry present/absent AND direct-URL navigation
  blocked/allowed).
- Scope tests: using the seeded `AppUser` fixtures (org-level grant, project-level-only grant,
  multi-org grant), assert data returned is limited to the granted scope — especially the
  project-level-only case, where "All projects" must not silently include ungranted projects in that
  org.
- Cost-leak tests: for Dev-role requests, assert `cost`/`revenue`/`margin` fields are **absent** from
  API responses (Call Logs, Call Detail, Overview) — not just hidden in the UI.
- Automate in CI: pytest for the server-side enforcement (`ACCESS-BE3`), Playwright/RTL for nav
  visibility + scope-filter constraints + the role-switcher's two-step flow.

## Acceptance Criteria (scenarios)
- [ ] Each of the 4 roles sees exactly the nav items `PRD/01` §3 says, no more/no less.
- [ ] Direct URL navigation to a role-inaccessible module is blocked (not just hidden from nav).
- [ ] An org-level-grant identity sees all of that org's projects; a project-level-only identity does
      not get "All projects" for that org and cannot see ungranted projects in it.
- [ ] Dev-role API responses never contain cost/revenue/margin fields, in any module.
- [ ] Financial-role API responses never contain operational-only data (call transcripts, error
      logs, infra metrics) outside Cost & Margin / Business Health.
- [ ] Access Management CRUD (provision/edit/revoke) correctly changes what the affected identity can
      see on the next request.
