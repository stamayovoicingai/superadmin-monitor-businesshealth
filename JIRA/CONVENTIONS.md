# Conventions — Jira Backlog

Read this before creating tickets. It defines the structure, the MVP→production framing, and the
fields every task carries so the board is consistent and devs have enough to build.

## MVP reference

- **Repo:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- The MVP is **Next.js 16 + React 19 + TypeScript** with a **mock data layer** (deterministic seed)
  behind a typed `DataSource` interface. Every screen works on mock data today.
- **Team language note:** Voicing AI codes in **Python**. TypeScript in the repo is **UI-only**
  (the Next.js app + thin API route handlers + the mock adapter). **Production backend work belongs
  in Python** (FastAPI services / jobs) feeding **Supabase/Postgres**; the Next.js app calls those.
  See the repo's `DOCUMENTATION.md` §5 and §20.
- Key MVP seams every task should know:
  - `src/lib/data/source.ts` — the `DataSource` interface + result shapes (the API contract to honor).
  - `src/lib/data/mock.ts` — the mock implementation (reference behavior).
  - `src/lib/engine/*` — pure cost/revenue/margin/issues logic (the spec to port to Python).
  - `src/app/api/*` — route handlers (the HTTP seam the UI fetches through).
  - `PRD/` — full product requirements per module.

## The MVP → production framing

The UI for each tab already exists. Tasks generally fall into:
- **Backend (BE):** build the **real data pipeline** — ingestion (Python), Supabase schema/migrations,
  rollups, and the API that returns the **same shapes** as the MVP `DataSource`. Replace the mock.
- **Frontend / UI-UX (FE):** wire the existing screen to the real API; enforce **RBAC**; add real
  loading/empty/error states, responsiveness, accessibility, i18n-readiness; polish to brand.
- **QA:** test scenarios (functional, RBAC, data correctness, performance, regression).

So **How** in each task says: *"the MVP does X with mock; in production do Y"*.

## Issue template (copy into Jira description)

```
## What
<Product-level description: what this delivers and the user-visible behavior. Enough product
context that a dev understands the goal, not just the mechanics.>

## Why
<The business/user reason. What decision or workflow it enables; cost of not doing it.>

## How (building on the MVP)
<Concrete technical approach referencing the MVP: which files/shapes to honor, what to port to
Python/Supabase, endpoints, data model, libraries. Call out the delta from the mock.>

## Acceptance Criteria
- [ ] <Testable, specific outcomes>
- [ ] ...
```

## Fields on every task

- **Type:** `Backend` | `Frontend/UI-UX` | `QA` (Jira issue type: Story or Task).
- **Epic:** the tab (folder).
- **Feature:** the sub-area within the epic.
- **Components/Labels:** e.g. `backend`, `python`, `supabase`, `frontend`, `nextjs`, `rbac`,
  `observability`, `infra`, `qa`. Add the epic key as a label too.
- **Estimate:** story points (Fibonacci 1/2/3/5/8/13).
- **MVP reference (repo):** link + the exact files to study.

## Roles & RBAC (applies across tabs)

Two roles (PRD/01): **SuperAdmin** (everything incl. financials) and **User** (project performance +
cost-to-serve, but never revenue/margin/business). Financial gating and SuperAdmin-only sections must
be enforced **server-side** in production (the MVP gates client-side via a policy module + a
"View-as" switcher). See `src/lib/auth/policy.ts`.

## Definition of Done (global)

- Real data (Supabase/Python), not mock; API matches the `DataSource` shape.
- RBAC enforced server-side; financial data never reaches unauthorized roles.
- Loading/empty/error states; responsive; keyboard-accessible; brand-compliant.
- Unit tests for engine/logic; integration tests for the endpoint; QA scenarios pass.
- Observability: logs/metrics on the new endpoints; no secrets in client.
