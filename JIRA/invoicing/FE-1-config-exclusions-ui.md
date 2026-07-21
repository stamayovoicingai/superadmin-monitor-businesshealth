# [FE] Invoicing · UI · Config & exclusions

- **ID:** `INVOICE-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Invoicing (Automated Client Invoice Export)
- **Feature:** F5 — Config & exclusions UI
- **Priority:** P2
- **Blocked by:** `PLAT-FE1`, `INVOICE-BE2`
- **Blocks:** `INVOICE-FE2`, `INVOICE-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `billing`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/invoicing/page.tsx` (`ConfigCard`, `ExclusionsCard`), `PRD/21` §9

## What
`/invoicing` (SuperAdmin/PM/Financial, nav under Business): scope banner (reuses the Org/Project top
bar + IP-Access-Control-style own/inherited messaging), a config form (recipients, frequency +
timezone, email subject/body with variable hints, attachment column checkboxes, active toggle), and
an exclusions panel (test caller-ID/call-ID lists, downtime windows with reason).

## How (building on the MVP)
**Design system:** build on `/design` tokens + reusable components. See `PLAT-FE1`.

- Port `ConfigCard`: when the scope is a project with no own config, pre-fill the form from the
  inherited org config and label the save action "Override the organization's default" (matches the
  MVP's exact copy — this distinction matters, don't let it read as "editing the org's config").
- Port `ExclusionsCard`: only usable once an own config exists for the exact scope (matches the MVP —
  you can't attach test/downtime exclusions to an inherited config without first creating your own
  override, since exclusions are stored per config row).
- Downtime list shows inherited (org-level, read-only, dashed border) separately from own
  (project-level, deletable) — same visual distinction as IP Access Control's inherited rules panel.

## Why
This is where a SuperAdmin/PM/Financial actually sets up a client's invoicing — needs to make the
org-vs-project override behavior legible, since getting it wrong means the wrong people get billed
data.

## Acceptance Criteria
- [ ] Save/load round-trips correctly for both org- and project-scoped configs.
- [ ] Project scope with no override clearly shows it's using the inherited org config, and saving
      creates a project-level override (doesn't silently edit the org's own config).
- [ ] Test caller-ID/call-ID add/remove and downtime window add/remove all work against the real
      API.
- [ ] Empty/loading/error states; responsive.
