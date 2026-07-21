# [BE] Invoicing · Schema · Config/downtime/run tables + engine port

- **ID:** `INVOICE-BE1`
- **Type:** Backend
- **Epic:** Invoicing (Automated Client Invoice Export)
- **Feature:** F1 — `invoice_config`/`invoice_downtime_exclusion`/`invoice_run` schema + engine port
- **Priority:** P2
- **Blocked by:** `PLAT-BE1`, `ACCESS-BE1`
- **Blocks:** `INVOICE-BE2`, `INVOICE-BE3`
- **Components/Labels:** `backend` `python` `postgres` `billing` `foundation`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/invoicing.ts`, `src/lib/types.ts` (`InvoiceConfig`/`InvoiceDowntimeExclusion`/
  `InvoiceRun`), `PRD/21-module-invoicing.md`, `PRD/12` §6b

## What
`invoice_config`, `invoice_downtime_exclusion`, `invoice_run` tables (PRD/12 §6b), plus a Python
port of `lib/invoicing.ts`'s pure functions: `defaultPeriodFor` (timezone-aware calendar period
boundaries), `computeNextRun`, `filterInvoiceCalls` (period + test-exclusion + downtime-exclusion),
`buildInvoiceCsv`, `mergeTemplate`.

## Why
Every other Invoicing task reads through this schema and engine. The MVP's `lib/invoicing.ts` is
already the reference implementation, verified against the seeded fixtures (org-level vs
project-level config resolution, calendar-month boundaries in `America/Bogota`/`Asia/Manila`,
downtime windows correctly dropping both row count and minutes).

## How (building on the MVP)
- Tables per `PRD/12` §6b. `invoice_config`/`invoice_downtime_exclusion` scope by `org` or
  `project` with org→project inheritance (identical resolution logic to `access_grant`/`IpRule` —
  reuse that pattern's implementation if `ACCESS-BE1` already built a shared scope-resolution
  helper).
- Timezone math: use a real Python tz library (`zoneinfo`/`pytz`) rather than porting the MVP's
  `Intl.DateTimeFormat`-offset trick verbatim — the *behavior* to match is "calendar period
  boundaries computed in the config's IANA timezone," not the specific JS technique.
- `filterInvoiceCalls` must apply test-caller/call-ID exclusion and downtime-window exclusion
  independently, both against the same period-filtered call set, matching the MVP's
  `excludedTestCalls`/`excludedDowntimeCalls` counters (these appear in the UI and matter for
  audit — don't collapse them into one "excluded" count).
- `invoice_run` does **not** store a CSV blob — it stores period bounds + a snapshot of recipients;
  the CSV is regenerated on demand from the stored period + the (possibly since-changed) config,
  matching the MVP's approach. Flag if the team wants immutable historical exports instead
  (would require snapshotting rows/config at send time — a real tradeoff, not just an oversight).

## Acceptance Criteria
- [ ] Schema matches `PRD/12` §6b.
- [ ] `defaultPeriodFor("monthly", tz, now)` returns the correct previous calendar month boundary
      for at least one non-UTC timezone (e.g. `America/Bogota`), verified against a known date.
- [ ] Org-level config inherited correctly by a project with no override; project-level override
      takes precedence when present.
- [ ] `filterInvoiceCalls` correctly separates test-exclusion count from downtime-exclusion count.
- [ ] Unit tests port the MVP's verified scenarios (own vs inherited resolution, period math,
      downtime drop).
