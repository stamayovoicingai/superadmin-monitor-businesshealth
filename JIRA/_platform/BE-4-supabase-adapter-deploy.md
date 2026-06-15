# [BE] Platform · Adapter & Deploy · SupabaseAdapter, envs & CI/CD

- **ID:** `PLAT-BE4`
- **Type:** Backend
- **Epic:** Platform Foundation
- **Feature:** F4 — Data adapter, environments & deploy/CI
- **Priority:** P0
- **Blocked by:** `PLAT-BE1`, `PLAT-BE3`
- **Blocks:** every FE "wire to real API" task
- **Components/Labels:** `backend` `supabase` `nextjs` `devops` `foundation`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/data/index.ts` (`getDataSource`, `DATA_SOURCE`), `src/lib/data/source.ts`, `DOCUMENTATION.md` §20

## What
Implement `SupabaseAdapter` (implements the `DataSource` interface), flip `DATA_SOURCE=supabase`, wire
environments/secrets, and set up CI/CD (Vercel for the app; Python services deploy). The UI then reads
real data with no component changes.

## Why
This is the seam that turns the prototype into a live product. The MVP was built so this is a config +
adapter change, not a refactor.

## How (building on the MVP)
- Create `src/lib/data/supabase.ts` implementing each `DataSource` method by calling Supabase
  (views/RPC) or the Python API; return the **same result shapes** as the mock.
- Enable the `case "supabase"` in `src/lib/data/index.ts`; set env: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATA_SOURCE=supabase`.
- CI: typecheck/build/lint on PR; deploy app to Vercel; deploy Python services; run migrations on deploy.
- Keep mock adapter available for local/dev and tests.

## Acceptance Criteria
- [ ] With `DATA_SOURCE=supabase`, every screen renders real data, no component code changes.
- [ ] Secrets are server-side only; none reach the client bundle.
- [ ] CI blocks merges on failing typecheck/build/lint; deploys are automated; migrations run on deploy.
- [ ] A documented switch lets devs run locally against mock or Supabase.
