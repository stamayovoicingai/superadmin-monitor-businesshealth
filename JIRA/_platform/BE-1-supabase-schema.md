# [BE] Platform · Schema · Supabase project, schema & migrations

- **ID:** `PLAT-BE1`
- **Type:** Backend
- **Epic:** Platform Foundation
- **Feature:** F1 — Supabase project, schema & migrations
- **Priority:** P0
- **Blocked by:** —
- **Blocks:** every backend task (esp. `PLAT-BE2`, `COST-BE*`, `THRESH-BE*`, `HEALTH-BE*`, all `*-BE-api`)
- **Components/Labels:** `backend` `postgres` `database` `foundation`
- **Estimate:** 8
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `PRD/12-data-model.md`, `src/lib/types.ts`, `src/lib/seed/index.ts`

## What
Create the Supabase (Postgres) project and the base schema with migrations: `organization`, `project`,
`agent`, `call` (+ `call_cost`, `conversation_details`, `chat_message`, `call_error_log`), `org_contract`,
`pricing_*`, `period_rollup`, `issue_category`, `threshold`, `issue`, `call_flag` (+ comments),
`fallback_config`/`fallback_event`, `ip_rule`/`ip_policy`, `health_service`/`incident`/`notify_*`,
`subagent_usage`, `app_user`. Plus a deterministic seed for staging.

## Why
This is the data backbone. The MVP mirrors these exact names from the real call DB so the swap is a
connection change, not a remodel — schema must match so adapters and the UI stay unchanged.

## How (building on the MVP)
- Mirror the names/columns in `PRD/12` and `src/lib/types.ts` (e.g. `call.host_id`, `closed_reason`
  incl. `PIPELINE_TTL_TRIGGERED`, `hasData`, `tool_calls`, `tool_failures`; money as integer micro-USD).
- Migrations under `supabase/migrations/`; effective-dated `pricing_*` (`valid_from`/`valid_to`).
- Add indexes for scope+time queries (`org_id`, `project_id`, `start_time`).
- Provide a staging seed (reuse `src/lib/seed` logic ported to a Python/SQL seeder).
- Enable Row Level Security scaffolding (policies detailed in `PLAT-BE3`).

## Acceptance Criteria
- [ ] All tables from `PRD/12` exist via migrations; names/types match `src/lib/types.ts`.
- [ ] Money columns are integer micro-USD; enums match (incl. new `PIPELINE_TTL_TRIGGERED`).
- [ ] Indexes support scope + time-range filtering; explain plans avoid full scans for common queries.
- [ ] Staging is seeded with a realistic dataset (≈ the MVP's 3 orgs / 12 projects scale).
- [ ] Migrations are reversible and run clean from empty.
