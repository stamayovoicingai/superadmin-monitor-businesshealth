# [BE] Invoicing · Production · Real email delivery + scheduling

- **ID:** `INVOICE-BE4`
- **Type:** Backend
- **Epic:** Invoicing (Automated Client Invoice Export)
- **Feature:** F4 — Real email delivery + scheduling (production-only)
- **Priority:** P3 (do after `INVOICE-BE1..3` prove the config/data model out; this is where "automate"
  becomes literally true)
- **Blocked by:** `INVOICE-BE3`
- **Blocks:** —
- **Components/Labels:** `backend` `python` `email` `scheduler` `billing` `production-only`
- **Estimate:** 8
- **MVP reference:** No MVP code — this is deliberately unbuilt in the MVP (`PRD/21` §6–7 flags it
  explicitly, not a gap found late). `send`/`preview` in `INVOICE-BE3` are what this wires up to.

## What
Two things the MVP intentionally simulates instead of building: (1) an actual email provider
integration (SES/SendGrid/Postmark — pick one) that sends the real email with the real CSV
attached, replacing the `simulated` status with `sent`/`failed`; (2) a real scheduler (cron job or a
Supabase Edge Function on a timer) that calls the same preview→build→send path **on its own**, on
each config's computed `next_run`, instead of requiring a human to click "Send now."

## Why
Without this, "automate" is still a person remembering to open the page and click a button — it
removes the manual Grafana pull, but not the manual trigger. This task is what makes the schedule
configured in `INVOICE-BE1` actually fire.

## How (building on the MVP)
- Provider choice and sender domain/DKIM setup: open question, `PRD/21` §10 — needs a decision before
  this task can start for real (flag to the team).
- Scheduler: iterate all `active=true` configs whose `next_run <= now`, run the same
  filter→build→merge logic as `INVOICE-BE3`'s `send`, attach the CSV, send via the provider, write
  the `InvoiceRun` with real `status` (`sent` or `failed` with an error reason).
- Failure handling: decide (per `PRD/21` §10) whether a failed send auto-retries or just surfaces in
  the history table for a human to re-trigger — don't silently drop it either way.
- Keep `INVOICE-BE3`'s manual "Send now" working as a manual override/testing path even once this
  ships — useful for ad-hoc sends outside the schedule (e.g., a client requests an early invoice).

## Acceptance Criteria
- [ ] A config's scheduled run fires automatically at its computed `next_run`, no human action
      required.
- [ ] The recipient actually receives an email with the correct CSV attached, matching what
      `INVOICE-BE3`'s `/export` would produce for the same period.
- [ ] A failed send is visible in the history table with a clear reason, not silently lost.
- [ ] Manual "Send now" (`INVOICE-BE3`) still works unchanged.
