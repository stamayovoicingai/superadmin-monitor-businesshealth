# [FE] Invoicing · UI · Preview, send, and history

- **ID:** `INVOICE-FE2`
- **Type:** Frontend/UI-UX
- **Epic:** Invoicing (Automated Client Invoice Export)
- **Feature:** F6 — Preview/send & history UI
- **Priority:** P2
- **Blocked by:** `INVOICE-FE1`, `INVOICE-BE3`
- **Blocks:** `INVOICE-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `billing`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/invoicing/page.tsx` (`PreviewSendCard`, `HistoryCard`), `PRD/21` §6

## What
A period picker (defaults to the last completed period for the config's schedule, overridable),
computed totals (calls/minutes/excluded-test/excluded-downtime), a merged email preview (subject +
body), a row preview table, "Download CSV," "Send now" (simulated — see `INVOICE-BE4` for the real
version), and a history table of past runs each re-downloadable.

## How (building on the MVP)
**Design system:** build on `/design` tokens + reusable components. See `PLAT-FE1`.

- Port `PreviewSendCard`: date-range override resets to the computed default when cleared; row table
  caps its on-screen preview (MVP shows 10) with a note pointing at the CSV for the full set.
- "Send now" success toast must be honest about the simulation boundary (the MVP's copy: "Invoice
  sent (simulated — no real email provider wired up yet)") — don't let this read as a real send
  until `INVOICE-BE4` ships; update the copy at that point.
- Port `HistoryCard`: each row's download re-hits `/export` with that run's stored period + the
  current scope — regenerates from live data, not a stored blob (matches `INVOICE-BE1`'s schema
  decision).

## Why
This is the actual replacement for the manual Grafana pull — a NOC/finance person should be able to
get the exact same file they used to build by hand, in a few clicks, with the exclusions already
applied.

## Acceptance Criteria
- [ ] Default period matches the config's frequency (e.g. previous calendar month for `monthly`);
      manual override works and resets cleanly.
- [ ] Preview totals match what `/export`'s CSV actually contains (no drift).
- [ ] "Send now" creates a history row visible immediately without a page reload.
- [ ] History rows are re-downloadable and reflect the *current* config's columns, not a frozen
      snapshot (documented behavior, not a bug — see `INVOICE-BE1`).
- [ ] Empty/loading/error states; responsive.
