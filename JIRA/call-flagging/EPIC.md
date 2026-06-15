# EPIC — Call Flagging (`FLAG`)

**Route:** `/controls/flags` (queue, SuperAdmin) + flag action on Call Detail (all roles)
**Priority:** P1 (Wave 1) · **Blocked by:** `_platform` (`PLAT-BE2`), `ISSUE-BE1` (auto-flags)

## Goal
A unified review queue for **manual** flags (any user, from Call Detail) and **auto** flags (critical
Issues), with status triage and comments. Each flag records the affected project.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/controls/flags/page.tsx`, flag action in `calls/[callId]/page.tsx`
- shapes: `source.ts` (`CallFlag`, `CreateFlagInput`), `src/app/api/flags/route.ts`, `PRD/10`

## Features
- F1 — Flags store & API · F2 — Flag Queue UI + manual flag · F3 — QA

## Tasks
- `BE-1-flags-api.md` (`FLAG-BE1`)
- `FE-1-flag-queue-ui.md` (`FLAG-FE1`)
- `QA-1-flagging-tests.md` (`FLAG-QA1`)
