# EPIC — Invoicing (Automated Client Invoice Export) (`INVOICE`)

**Route:** `/invoicing` · **Roles:** SuperAdmin / PM / Financial (scoped for PM/Financial, doc 01 §3)
**Backlog priority:** P2 (Wave 2) · **Blocked by:** `_platform` (`PLAT-BE1/BE2`), `ACCESS-BE1`
(role/scope model), `COST-BE1` (`org_contract`/billing-cycle concepts this is adjacent to)

## Goal
Replace the manual, per-client, per-month Grafana export (`session_id, call_id, start_time,
end_time, call_duration_secs, user_id`, pulled by hand across LatAm/India time zones, then
hand-stripped of test traffic and downtime) with a configured, repeatable invoicing module. See
`PRD/21-module-invoicing.md` for the full spec.

## Outcome (already built in the MVP)
- `InvoiceConfig` scoped **org or project**, with org→project inheritance (same shape as IP Access
  Control/Access Management — reused deliberately, not reinvented).
- Timezone-aware period computation (IANA zones, `Intl.DateTimeFormat`-based, no external tz lib)
  for weekly/biweekly/monthly/custom-day schedules — verified in the MVP against real calendar-month
  boundaries in `America/Bogota` and `Asia/Manila`.
- Two independent exclusion mechanisms: test caller-ID/call-ID lists, and scoped downtime windows
  (dropped from both the row set and the minutes total).
- Preview & Send: real CSV generation from the existing `Call` fields (no new call-level data
  needed — the six Grafana columns already map 1:1) + a merged email template preview.
- **"Send" is simulated** (writes an `InvoiceRun` history record, no email leaves the system) —
  this is a deliberate, documented boundary (`PRD/21` §6–7), not a gap discovered late. Real
  delivery + real scheduling are separate tasks below.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- Engine: `src/lib/invoicing.ts` (period math, filtering, CSV/template building — pure, unit-testable)
- Types: `src/lib/types.ts` (`InvoiceConfig`, `InvoiceDowntimeExclusion`, `InvoiceRun`)
- Mock/API: `src/lib/data/mock.ts`, `src/app/api/invoicing/*`
- FE: `src/app/(dashboard)/invoicing/page.tsx`
- PRD: `PRD/21-module-invoicing.md`, `PRD/12` §6b

## Features
- F1 — `invoice_config`/`invoice_downtime_exclusion`/`invoice_run` schema + engine port (BE)
- F2 — Config & downtime-exclusion API (BE)
- F3 — Preview/export/send API (BE)
- F4 — Real email delivery + scheduling (BE, production-only — flagged, not built in MVP)
- F5 — Config & exclusions UI (FE)
- F6 — Preview/send & history UI (FE)
- F7 — QA

## Tasks
- `BE-1-schema-engine.md` (`INVOICE-BE1`)
- `BE-2-config-downtime-api.md` (`INVOICE-BE2`)
- `BE-3-preview-export-send-api.md` (`INVOICE-BE3`)
- `BE-4-real-email-scheduling.md` (`INVOICE-BE4`)
- `FE-1-config-exclusions-ui.md` (`INVOICE-FE1`)
- `FE-2-preview-send-history-ui.md` (`INVOICE-FE2`)
- `QA-1-invoicing-scenarios.md` (`INVOICE-QA1`)
