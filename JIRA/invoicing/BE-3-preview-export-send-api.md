# [BE] Invoicing · API · Preview, CSV export, simulated send

- **ID:** `INVOICE-BE3`
- **Type:** Backend
- **Epic:** Invoicing (Automated Client Invoice Export)
- **Feature:** F3 — Preview/export/send API
- **Priority:** P2
- **Blocked by:** `INVOICE-BE1`
- **Blocks:** `INVOICE-FE2`
- **Components/Labels:** `backend` `python` `api` `billing` `csv`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/api/invoicing/preview/route.ts`, `.../export/route.ts`, `.../send/route.ts`,
  `.../runs/route.ts`, `PRD/21` §6

## What
`GET /preview` (period defaults to last-completed per the config's frequency, overridable), `GET
/export` (real CSV download, same headers/attachment pattern as the Telephony PCAP export), `POST
/send` (writes an `InvoiceRun` row, status `simulated` — **no real email sent**, see `INVOICE-BE4`),
`GET /runs` (history for the current scope).

## Why
This is the actual value of the module: turning a config into a real filtered dataset, a real
downloadable file, and an auditable run record — replacing the manual Grafana pull.

## How (building on the MVP)
- `preview` returns merged email subject/body (template vars: `org_name`, `project_name`,
  `period_start`, `period_end`, `call_count`, `total_minutes`), a row preview (MVP caps at 200 rows
  in the JSON response — export is uncapped), and totals including both exclusion counts.
- `export` regenerates the full CSV from `(scope, period)` — no row cap, matches what a real send
  would attach.
- `send` is explicitly a **simulation** in this task's scope: it computes the same preview data,
  persists an `InvoiceRun`, and returns it — it does not call any email provider. That's
  `INVOICE-BE4`.
- `runs` returns history for the scope, newest first.

## Acceptance Criteria
- [ ] `preview` and `export` agree on totals/row content for the same scope+period (no drift
      between what's shown and what's downloaded).
- [ ] `export` CSV opens cleanly and matches the config's selected columns exactly.
- [ ] `send` persists a correct `InvoiceRun` (period, recipients snapshot, totals, exclusion
      counts) and updates the config's `last_sent_at`.
- [ ] `runs` is scope-correct (a project's history doesn't leak sibling projects' runs).
