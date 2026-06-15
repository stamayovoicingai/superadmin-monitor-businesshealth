# EPIC — Platform Foundation (`PLAT`)

**Priority:** P0 (root blocker) · **Cross-cutting** (not a tab)

## Goal
Stand up the real backend foundation the whole product sits on: Supabase project + schema, call-data
ingestion, authentication + RBAC, and the adapter/deploy wiring that lets the existing Next.js UI read
real data instead of the mock.

## Why
Every tab's backend and most frontend tasks depend on this. Without it nothing can leave the mock.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- Contract to honor: `src/lib/data/source.ts` (`DataSource`), selector `src/lib/data/index.ts`.
- Mock reference: `src/lib/data/mock.ts`, seed `src/lib/seed/`.
- Auth policy: `src/lib/auth/policy.ts`. Schema spec: `PRD/12-data-model.md`. Arch: `DOCUMENTATION.md` §13/§20.
- **Team note:** backend in **Python** (FastAPI/jobs) feeding Supabase; TS stays UI-only.

## Features
- F1 — Supabase project, schema & migrations
- F2 — Call/conversation data ingestion
- F3 — Authentication & RBAC (server-side)
- F4 — Data adapter, environments & deploy/CI
- F5 — QA / foundation harness

## Tasks
- `BE-1-supabase-schema.md` (`PLAT-BE1`)
- `BE-2-call-data-ingestion.md` (`PLAT-BE2`)
- `BE-3-auth-rbac.md` (`PLAT-BE3`)
- `BE-4-supabase-adapter-deploy.md` (`PLAT-BE4`)
- `QA-1-foundation-harness.md` (`PLAT-QA1`)
