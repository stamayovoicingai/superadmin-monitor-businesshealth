# 21 · Module: Invoicing (Automated Client Invoice Export)

Replaces the current manual process (a monthly Grafana table exported by hand, per client, often
across LatAm/India time zones) with a configured, repeatable export: per org **or** per project,
define who receives it, how often, what the email says, which columns go in the attachment, and
which calls/periods are excluded. Route: `/invoicing`. Visible to **SuperAdmin / PM / Financial**
(not Dev — this is money-adjacent, same split as Cost & Margin/Business Health, doc 01 §3).

---

## 1. Why this exists

Today: someone pulls a Grafana table (`session_id, call_id, start_time, end_time,
call_duration_secs, user_id`) for a date range, by hand, per client, then manually strips test
traffic and downtime before sending it. That's the "tormento" this module removes — the data (§2)
already lives in `Call` (doc 12), so this is a configuration + export layer, not a new data source.

## 2. Column source — already in the data model

Every Grafana column maps directly onto an existing `Call` field — **no new call-level data
needed**:

| Grafana column | `Call` field |
|---|---|
| `session_id` | `sessionId` |
| `call_id` | `callId` |
| `start_time` | `startTime` |
| `end_time` | `endTime` |
| `call_duration_secs` | `durationSecs` |
| `user_id` | `callerHash` (confirmed: the caller identifier, not a client-supplied external id) |

The invoice attachment column list is exactly these six — the admin picks a subset per config, not
an open-ended field list (keeps the attachment purely usage-fact, no cost/revenue/margin ever
included, so a client-facing export can never leak Voicing's internal financials).

## 3. Scope model — org **or** project, with inheritance

Same shape as IP Access Control (doc 16) and Access Management (doc 20) — reused deliberately for
consistency, not reinvented:

- **`InvoiceConfig`** is defined at **org** scope or **project** scope.
- An **org-level** config is the default for all its projects; a **project-level** config
  **overrides** the org default for that one project only (own vs inherited, same as IP rules).
- This directly answers the confirmed requirement: LatAm and India clients, and even different
  projects under the same org, can each have their own recipients/schedule/template/columns.
- **`InvoiceDowntimeExclusion`** (§5) uses the same org/project scope — an outage affecting one
  client's project doesn't need to exclude everyone else's invoice period.

## 4. Config fields (`InvoiceConfig`)

- **Recipients** — one or more emails.
- **Frequency** — weekly / biweekly / monthly / custom (every N days). Combined with **Timezone**
  (IANA, e.g. `America/Bogota`, `Asia/Kolkata`) to compute period boundaries — this is the "timezone
  button on the date range" ask, scoped to this module's period picker (§6), not the app-wide
  dashboard time-range control (doc 02 §5), which stays UTC-normalized and isn't invoice-specific.
- **Email subject + body template** — free text with merge variables: `{{org_name}}`,
  `{{project_name}}`, `{{period_start}}`, `{{period_end}}`, `{{call_count}}`, `{{total_minutes}}`.
- **Columns** — subset of the six in §2.
- **Test-traffic exclusion** — two independent lists: caller IDs (`callerHash`) and specific
  `call_id`s to always exclude, regardless of period. (Confirmed: `user_id` = caller identifier;
  Voicing's known test callers are excluded this way.)
- **Active** toggle — a config can be saved but paused without deleting it.

## 5. Downtime exclusion windows

A separate, explicit list per scope: `{from, to, reason, createdBy}`. Any call whose `startTime`
falls inside an exclusion window (own scope + inherited from org, if project-scoped) is dropped from
that invoice run **and** from the total-minutes figure — the client is never billed for it. This is
distinct from test-caller exclusion: downtime is a **time window**, test exclusion is a **caller/call
identity**. Both are applied together when building a run.

## 6. Preview & Send

Because this MVP has no real email-sending infrastructure (no SES/SendGrid integration — confirmed
acceptable for this round), "automate" means: **compute the schedule and the filtered dataset for
real, simulate the actual send.** Concretely:

- The config screen shows a computed **"Next invoice: <date>"** based on frequency + timezone +
  `lastSentAt` (or `createdAt` if never sent).
- **Preview** — pick a period (defaults to the last completed period per frequency, e.g. previous
  calendar month; overridable via explicit from/to, satisfying "poder elegir un rango de fechas").
  Shows: merged email subject/body, a table preview of the filtered rows (post test + downtime
  exclusion), and totals (call count, total minutes, excluded-test count, excluded-downtime count).
- **Download CSV** — the real attachment file, generated from the same filtered dataset (same
  mechanism as the Telephony PCAP/text export, doc 19 §5.5 — a real file, not a mock).
- **Send Now** — writes an `InvoiceRun` record (status `simulated`) and shows a confirmation; no
  email actually leaves the system. This is the honest boundary of this round's scope.
- **Invoice history** — a table of past `InvoiceRun`s (period, recipients, call/minute totals,
  status, timestamp) per scope, each re-downloadable (CSV regenerated on demand from the stored
  period bounds + config — the run doesn't persist a blob, avoiding storage bloat).

## 7. What's explicitly out of scope for this round (flagged, not silently dropped)

- **Real email delivery.** Needs an actual provider (SES/SendGrid/Postmark) and a background job to
  fire on schedule — tracked as an open question below, not built here.
- **Real scheduling/cron.** "Next invoice" is computed and displayed; nothing fires automatically
  yet. Production needs a scheduler (e.g., a cron job or Supabase Edge Function on a timer) that
  calls the same preview→build→send path this UI exposes manually.
- **Timezone edge cases (DST transitions).** Period boundaries are computed via `Intl.DateTimeFormat`
  wall-clock conversion per IANA zone — correct for the common case, not exhaustively DST-audited.

## 8. Data & engine

- `InvoiceConfig`, `InvoiceDowntimeExclusion`, `InvoiceRun` (extends PRD/12).
- `lib/invoicing.ts` (pure): `computeNextRun`, `defaultPeriodFor(frequency, timezone, now)`,
  `filterInvoiceCalls(calls, config, downtimeExclusions, from, to)`, `buildCsv(rows, columns)`,
  `mergeTemplate(subject|body, vars)`.
- API `/api/invoicing/configs` (+ `/downtime`, `/runs`) — CRUD for config/exclusions, list runs.
  `/api/invoicing/[configId]/preview` and `/export` (CSV download, same pattern as
  `/api/infra/telephony/[callId]/export`).
- Demo persists in-process (same posture as every other config module in this MVP).

## 9. UI (`/invoicing`)

Follows the IP Access Control interaction pattern (doc 16 §4) — scope banner from the top-bar
Org/Project filter, own vs inherited config:

1. **Config card** — recipients, frequency + timezone, email subject/body (with variable hints),
   column checkboxes, active toggle.
2. **Exclusions card** — test caller-ID/call-ID lists (add/remove) and downtime windows (add/remove,
   with reason).
3. **Preview & Send card** — period picker (default = last completed period), "Generate Preview"
   (merged email + row table + totals), "Download CSV," "Send Now."
4. **History table** — past `InvoiceRun`s for the current scope, each re-downloadable.

## 10. Open questions

- [ ] Real email provider choice (SES/SendGrid/Postmark) and sender domain/DKIM setup.
- [ ] Real scheduling mechanism (cron service, Supabase Edge Function timer, or external scheduler)
  and who owns triggering/monitoring it in production.
- [ ] Should a failed real send retry automatically, or just surface in the history table for a
  human to re-trigger?
- [ ] Is a PDF invoice (vs. CSV data attachment) ever needed, or is this purely a usage-data export
  attached to a manually-composed-looking email?
