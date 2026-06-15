# [BE] Call Flagging · API · Flags store & endpoints

- **ID:** `FLAG-BE1`
- **Type:** Backend
- **Epic:** Call Flagging
- **Feature:** F1 — Flags store & API
- **Priority:** P1
- **Blocked by:** `PLAT-BE2`, `ISSUE-BE1`
- **Blocks:** `FLAG-FE1`, `FLAG-QA1`
- **Components/Labels:** `backend` `python` `supabase` `api`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/source.ts` (`CallFlag`, `CreateFlagInput`), `src/app/api/flags/route.ts`, `PRD/10`, `PRD/12` §5

## What
Persisted flags with: list (scoped), create (manual), status change, and comments. Supports both
`source=manual` (from Call Detail) and `source=auto` (from Issues). Each flag carries org/project,
reason, optional metric/severity, status, and a comment thread.

## Why
A real review queue is needed to triage problematic calls; auto-flags from Issues must land here too.

## How (building on the MVP)
- Honor `CallFlag`/`CreateFlagInput`. Persist `call_flag` (+ `call_flag_comment`) per `PRD/12` §5.
- `createFlag` is idempotent per call for manual (append a comment if it exists); auto-flags upserted by
  `ISSUE-BE1` share the same store/table.
- Endpoints: `GET /flags?scope`, `POST /flags` (manual), `PATCH /flags` (status / add comment). RBAC:
  queue is SuperAdmin; any authenticated user can create a manual flag on a call they can access.

## Acceptance Criteria
- [ ] List/create/status/comment persist; manual + auto flags coexist with correct `source`.
- [ ] Each flag records the affected project; scope filtering works.
- [ ] Idempotent manual flag per call; auto-flag dedupe by `flag-auto-<call>-<metric>`.
- [ ] RBAC: queue read/triage is SuperAdmin; manual create allowed for accessible calls.
