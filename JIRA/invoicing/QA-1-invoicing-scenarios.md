# [QA] Invoicing · QA · Scoping, timezone, and exclusion scenarios

- **ID:** `INVOICE-QA1`
- **Type:** QA
- **Epic:** Invoicing (Automated Client Invoice Export)
- **Feature:** F7 — QA
- **Priority:** P2
- **Blocked by:** `INVOICE-FE1`, `INVOICE-FE2`
- **Blocks:** —
- **Components/Labels:** `qa` `billing`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/21` (full spec), the seeded `invcfg-1/2/3` fixtures (org-level, org-level in a different
  timezone, project-level override) are the golden fixtures for this task

## What / Why
Getting a client's bill wrong — including calls that should've been excluded, or missing calls due
to a timezone boundary error — is exactly the kind of error this module exists to prevent. This is
the highest-stakes QA task in the epic.

## How (building on the MVP)
- Timezone tests: for a `monthly` config in a non-UTC zone (e.g. `America/Bogota`, UTC-5), assert
  the computed period boundary is midnight *in that zone*, not midnight UTC — a naive
  implementation will be off by the zone's offset and either include/exclude a day's worth of calls
  at the edge.
- Scoping tests: assert an org-level config is correctly inherited by a project with no override,
  and a project-level override correctly takes precedence — using the MVP's exact fixture shape
  (org-level `org-tp-latam`/`org-tp-ph`, project-level `prj-telmex` override) as golden cases.
- Exclusion tests: a call matching an excluded caller ID or call ID is dropped and counted in
  `excludedTestCalls`; a call whose `start_time` falls inside a downtime window is dropped and
  counted in `excludedDowntimeCalls`, **and** its duration doesn't contribute to `total_minutes`.
- Consistency test: `/preview`'s totals must exactly match what `/export`'s CSV row count/sum
  produces for the same scope+period — no drift between what's shown and what's downloaded.
- RBAC test: a Dev-role request to any `/invoicing` endpoint is rejected (this module is
  Financial-adjacent, not ops); a PM/Financial identity without a grant for the requested
  org/project is rejected.
- Automate in CI: pytest for the engine (period math, filtering) and API; Playwright/RTL for the
  config/exclusions/preview/send UI flow.

## Acceptance Criteria (scenarios)
- [ ] Monthly period boundary is correct in at least 2 different non-UTC timezones, verified against
      known dates (including a date near a DST transition, to document — not necessarily fix — any
      edge-case behavior).
- [ ] Org-level inheritance and project-level override both resolve correctly.
- [ ] Test-caller/call-ID exclusion and downtime exclusion each work independently and together,
      with correct separate counts.
- [ ] `/preview` and `/export` never disagree on totals for the same request.
- [ ] Dev role is blocked from all `/invoicing` surfaces; PM/Financial scope enforcement matches
      `ACCESS-BE3`.
