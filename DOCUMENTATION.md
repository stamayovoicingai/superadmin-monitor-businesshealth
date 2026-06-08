# Voicing AI SuperAdmin Platform — Architecture & Contributor Guide

This document is the technical companion to the [`README`](./README.md) and the [`PRD/`](./PRD/).
It explains **why** the project exists, **how** it's built, every significant **technical decision**,
and exactly **how to contribute** — add a page, a module, or wire the real backend.

> All code and documentation in this repository are written in **English**.

---

## Table of contents

1. [Purpose & context](#1-purpose--context)
2. [What it solves](#2-what-it-solves)
3. [Product scope & roles](#3-product-scope--roles)
4. [Architecture overview](#4-architecture-overview)
5. [Tech stack & rationale](#5-tech-stack--rationale)
6. [Repository layout](#6-repository-layout)
7. [The data-access layer](#7-the-data-access-layer)
8. [API routes](#8-api-routes)
9. [Cost / Revenue / Margin engine](#9-cost--revenue--margin-engine)
10. [The seed dataset](#10-the-seed-dataset)
11. [Domain model](#11-domain-model)
12. [Auth, roles & financial gating](#12-auth-roles--financial-gating)
13. [Client state & data fetching](#13-client-state--data-fetching)
14. [Routing & the app shell](#14-routing--the-app-shell)
15. [Design system](#15-design-system)
16. [Conventions & coding standards](#16-conventions--coding-standards)
17. [Local development](#17-local-development)
18. [Build & deployment](#18-build--deployment)
19. [How to add a new page or module](#19-how-to-add-a-new-page-or-module)
20. [Wiring the real Supabase backend](#20-wiring-the-real-supabase-backend)
21. [Known limitations & modeling caveats](#21-known-limitations--modeling-caveats)
22. [Roadmap](#22-roadmap)
23. [Glossary](#23-glossary)

---

## 1. Purpose & context

Voicing AI runs production voice agents for organizations (e.g. TP Latam, TP PH, LTM). Each org has
projects (an agent or set of agents serving a use case — Telmex, Metlife, Allegiant, …), each project
handles **calls**, and each call consumes billable **services**: an LLM, speech-to-text (STT),
text-to-speech (TTS), telephony, and cloud/infra.

The **SuperAdmin Platform** is the internal control tower for that business. It was built through the
combined lens of Product Manager, Software Architect, Backend, Frontend and UX/UI Designer (see the
[`PRD/`](./PRD/) for the full product thinking).

This repository is a **navigable demo**: the complete UI on a realistic simulated dataset. The single
most important architectural goal is that the demo is **backend-ready** — the same frontend can be
pointed at a real Supabase + provider/billing backend by swapping one adapter, with no UI rewrite.

## 2. What it solves

The operational data needed to run the business is **fragmented**:

- Provider billing portals (OpenAI, Anthropic, Google, Deepgram, AssemblyAI, ElevenLabs, Cartesia,
  Twilio, AWS/GCP/Azure).
- Observability tooling — Grafana/Prometheus for Kubernetes, CloudWatch for AWS ELB.
- The call/conversation database (transcripts, durations, statuses, end reasons, pods).
- Finance/contract data (Minimum Guarantee Fees, per-minute rates, MRR).

No single surface answers *"for this project: is it healthy, is it fast, what does it cost us, what do
we charge, what's the margin?"* — and there's no operator surface to act (thresholds, provider
fallbacks, call flagging, agent pause). This platform unifies **observe + cost + act**, with
**cost & margin as the #1 priority**.

## 3. Product scope & roles

**Modules (v1).** Overview, Cost & Margin, Performance, Call Logs + Call Detail, Live Operations are
**built**. Issues/Thresholds, Infra (k8s + ELB), Fallbacks, Business Health, Flag Queue are
**designed in the PRD and stubbed in the UI**. QA Bench / Evals is **Phase 2 (design only)**.

**Roles (both internal Voicing staff):**

- **SuperAdmin** — full access including revenue, margin, MRR, business health, infra and all controls.
- **User** — project performance + **cost-to-serve in USD**, but **never** revenue, margin, MRR or
  business financials.

A demo **"View as"** switcher lets a SuperAdmin preview the `User` experience. The data model carries
`org_id` scoping throughout so an **Org Admin** tier can be reintroduced later without rework.

See [`PRD/01-roles-permissions.md`](./PRD/01-roles-permissions.md) for the full permission matrix.

## 4. Architecture overview

The defining pattern is a **typed data-access seam**. Every screen reads through React Query hooks that
call **API route handlers**, which read through a **`DataSource` interface**. Today the interface is
implemented by a `MockAdapter` (deterministic seed + pure engine); tomorrow by a `SupabaseAdapter`
with the *same return shapes*.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Client (React, "use client")                                            │
│   pages  ──>  hooks (lib/hooks.ts, TanStack Query)                       │
│                │  read scope from ViewContext (role, org, project, range)│
│                ▼                                                          │
│            fetch(`/api/<resource>?<scope>`)                              │
└──────────────────────────────────┬──────────────────────────────────────┘
                                    ▼  (HTTP, server boundary)
┌─────────────────────────────────────────────────────────────────────────┐
│ Server                                                                   │
│   app/api/*/route.ts  ──>  getDataSource()  ──>  DataSource              │
│                                                  ├── MockAdapter (now)   │
│                                                  └── SupabaseAdapter(soon)│
│   MockAdapter:  getDataset() ──> lib/engine/* (cost/revenue/margin)      │
└─────────────────────────────────────────────────────────────────────────┘
```

Why route handlers instead of fetching the data layer directly in Server Components? Because filters
(org/project/range/role) are **client-driven** and reactive. Keeping a thin HTTP seam means: (a)
TanStack Query handles caching/refetch/loading/error uniformly, (b) the exact same endpoints back the
future real backend, and (c) the data layer (seed + engine) never ships to the client bundle.

## 5. Tech stack & rationale

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Next.js 16** (App Router, Turbopack) | RSC + route handlers + easy deploy; backend-ready. |
| UI runtime | **React 19** + **TypeScript** | Modern, typed. |
| Styling | **Tailwind CSS v4** (`@theme` in CSS, no JS config) | Fast, token-driven; brand palette as CSS variables. |
| Components | **shadcn/ui** on **Base UI** (`@base-ui/react`) | Accessible primitives, low custom code. **See §15 — this is NOT Radix.** |
| Charts | **Recharts** via shadcn `chart` wrapper | Declarative; covers areas/lines/bars/donuts. |
| Tables | **TanStack Table** (available) | Sorting/filtering/pagination when needed. |
| Data fetching | **TanStack Query** | Caching, refetch intervals (Live Ops), states. |
| State | React Context (`ViewContext`) + `localStorage` | Tiny scope/role store; no heavyweight state lib. |
| Theming | **next-themes** | Light default + dark, class strategy. |
| Backend (planned) | **Supabase** | Postgres mirrors the real call DB; RLS matches roles. |
| Money | integer **micro-USD** | Avoids floating-point drift in cost math. |

Guiding principle (from product discovery): *modular, easy to build, little custom development.*

### A note on language (Python vs TypeScript)

**Voicing AI normally writes code in Python**, not JavaScript/TypeScript. This repository is in
TypeScript **only because it is a frontend-heavy navigable demo** built on Next.js/React, where TS is
the native, lowest-friction choice for the UI and the in-process mock.

This does **not** change the team's backend convention. The architecture is deliberately split so
Python remains the language for real backend work:

- **TypeScript stays at the edge** — the React UI, the API route handlers (a thin HTTP seam), and the
  `MockAdapter`. None of this is business backend; it's the presentation layer plus demo data.
- **Python is the natural home for the real backend** — the cost/billing reconciliation ETL, provider
  usage ingestion, the call-DB access, and analytics. When we move off the mock, the recommended
  pattern is a **Python service / API (e.g. FastAPI) that the Next.js app calls** (the route handlers
  already are that call site), or Python jobs that populate Supabase/Postgres which a thin adapter
  reads. Either way, the heavy logic lives in Python.
- **The pure engine** (`lib/engine/*`: cost/revenue/margin formulas) is intentionally framework-free
  and small; if/when it must live server-side for real, it is straightforward to **port to Python** —
  the formulas in §9 are the spec. The TS version exists so the demo is self-contained.

In short: TS here is a demo/UI implementation detail; **production logic should be Python**, and the
data seam (§7) is designed so the backend language is a free choice.

## 6. Repository layout

```
PRD/                          Product requirements 00–15 (+ README index)
DOCUMENTATION.md              ← you are here
BUILD-STATUS.md               Build state, conventions, what's pending
components.json               shadcn config (style, aliases, Base UI base)
next.config.ts                turbopack.root pinned to this dir
src/
  app/
    layout.tsx                Root: fonts (Jakarta/Inter/Instrument Serif), <Providers>
    page.tsx                  redirect("/overview")
    globals.css               Tailwind v4 + brand design tokens (light + dark)
    (dashboard)/              Route group sharing the app shell
      layout.tsx              SidebarProvider + AppSidebar + TopBar + <main>
      overview/page.tsx
      cost/page.tsx
      performance/page.tsx
      calls/page.tsx
      calls/[callId]/page.tsx
      live/page.tsx
      issues, infra/kubernetes, infra/elb,
      controls/{fallbacks,thresholds,flags},
      business, qa-bench       ← ComingSoon stubs (designed in PRD)
    api/
      meta/route.ts            orgs + projects + agents
      overview/route.ts
      cost/route.ts
      performance/route.ts
      calls/route.ts
      calls/[callId]/route.ts
      live/route.ts
  components/
    providers.tsx             QueryClient + Theme + Tooltip + Toaster + ViewProvider
    view-context.tsx          role / org / project / range  (client store)
    app-sidebar.tsx           nav (role-aware) using lib/nav.ts
    top-bar.tsx               sidebar trigger + scope filters + role switch + theme toggle
    scope-filters.tsx         org / project / range selects
    role-switcher.tsx         "View as" SuperAdmin/User
    theme-toggle.tsx          light/dark
    financial-gate.tsx        <FinancialGate> + useFinancials() (hide $ for User)
    kpi-card.tsx, chips.tsx, charts.tsx, page-header.tsx,
    coming-soon.tsx, brand-logo.tsx
    ui/                       shadcn/ui (Base UI) primitives
  hooks/
    use-mobile.ts             (shadcn) — used by the sidebar
  lib/
    types.ts                  domain types (PRD/12)
    money.ts                  micro-USD helpers + formatters
    nav.ts                    sidebar config + visibleNav(role)
    period.ts                 time-range presets → {from,to}
    scope.ts                  parse search params → Scope
    utils.ts                  cn() (shadcn)
    auth/policy.ts            canSeeFinancials / canSeeCost / canSeeSuperAdminOnly
    engine/
      pricing.ts              provider rate catalog (illustrative)
      cost.ts                 computeCallCost / org revenue (MGF) / MRR / marginPct
      aggregate.ts            filter + rollups + series + pods + counts
    seed/
      rng.ts                  deterministic PRNG (mulberry32)
      index.ts                buildDataset() / getDataset() singleton
    data/
      source.ts               DataSource interface + result types + Scope
      mock.ts                 MockAdapter
      index.ts                getDataSource() selector (env DATA_SOURCE)
    hooks.ts                  React Query hooks (client)
```

## 7. The data-access layer

**`src/lib/data/source.ts`** defines the `DataSource` interface and every result shape (validated by
TypeScript). Methods:

```ts
listOrgs() · listProjects(orgId?) · listAgents(projectId?) · getContract(orgId)
overview(scope) · cost(scope) · performance(scope)
listCalls(filter, page, pageSize) · getCall(callId) · liveOps(scope)
```

`Scope = { orgId?, projectId?, from?, to? }`.

**`src/lib/data/mock.ts`** — `MockAdapter` implements the interface using `getDataset()` (the seed) and
`lib/engine/aggregate.ts`. All methods are `async` (returning Promises) even though the mock is
synchronous, so the contract matches a real network/DB adapter.

**`src/lib/data/index.ts`** — `getDataSource()` chooses the adapter from `process.env.DATA_SOURCE`
(`"mock"` default; `"supabase"` case is stubbed, ready to enable). It memoizes the instance.

> **Rule:** UI and API code depend only on `DataSource` and its result types — never import `seed/` or
> `engine/` directly from client code. This keeps the swap to Supabase a one-line config change.

## 8. API routes

All under `src/app/api/`. They parse scope from the query string (`scope.ts` / `period.ts`) and call
`getDataSource()`.

| Route | Method | Query params | Returns |
|-------|--------|--------------|---------|
| `/api/meta` | GET | — | `{ orgs, projects, agents }` |
| `/api/overview` | GET | `orgId?` `projectId?` `range?` | KPIs, project & org rollups, cost series |
| `/api/cost` | GET | `orgId?` `projectId?` `range?` | totals, series, project/org margin |
| `/api/performance` | GET | `orgId?` `projectId?` `range?` | latency + per-service + error rate |
| `/api/calls` | GET | `+ page,pageSize,status,closedReason,flagged,search` | paginated rows |
| `/api/calls/[callId]` | GET | — | call detail (+ project/org/agent names) |
| `/api/live` | GET | `orgId?` `projectId?` | concurrency, pods, status & end-reason counts, active calls |

`range` ∈ `24h | 7d | 30d` (resolved to `{from,to}`). `live` is treated as `24h`/`30d` where relevant.

## 9. Cost / Revenue / Margin engine

The heart of the platform. See [`PRD/03-cost-revenue-margin.md`](./PRD/03-cost-revenue-margin.md).

### Money
All money is **integer micro-USD** (`1 USD = 1_000_000 micros`) to avoid float drift. Helpers in
`lib/money.ts`: `usdToMicros`, `microsToUsd`, `formatMicros`, `formatMicrosCompact`,
`formatMicrosPrecise`, `formatPct`, `formatNumber`.

### Pricing catalog — `lib/engine/pricing.ts`
Illustrative provider rates (USD): LLM (per 1M input/output tokens) for OpenAI/Anthropic/Google; STT
(per minute) for Deepgram/Whisper/AssemblyAI; TTS (per 1k chars) for ElevenLabs/Cartesia/OpenAI;
telephony per minute (Twilio); cloud per talk-minute (amortized). **Replace with real rates before any
external use.**

### Per-call cost — `computeCallCost(usage, durationSecs, contract)`
```
llm   = inputTokens × inputPer1M + outputTokens × outputPer1M     (micros)
stt   = sttMinutes × perMinute × 1e6
tts   = (ttsChars / 1000) × per1kChars × 1e6
tel   = telephonyMinutes × telephonyPerMin × 1e6
cloud = durationMin × cloudPerMin × 1e6        ← talk-minutes allocation (PRD §4)
total = llm + stt + tts + tel + cloud
revenue (per call) = durationMin × contract.ratePerMin   (marginal rate)
margin  = revenue − total
```

### Org revenue & MRR — `computeOrgMonthlyRevenue`, `computeMrr`
Per-org contract-driven (PRD §3):
- **Pure Usage** (e.g. TP Latam): `revenue = minutes × ratePerMin`. MRR = run-rate.
- **MGF** (e.g. TP PH, LTM), reading **B1**: the MGF includes a volume; overage is billed only on
  minutes **above** the included volume → `revenue = mgfAmount + max(0, minutes − includedMinutes) × overageRate`,
  floored at `mgfAmount`. MRR = `mgfAmount`.

### Reconciliation (important)
Per-call revenue uses a **marginal** per-minute rate, while org/period revenue uses the **contract**
formula (which adds the MGF floor). To keep headline KPIs consistent with the per-org chart, the
adapter computes headline revenue/margin as:
- **org / global scope** → sum of contract-based org revenue (includes MGF floors);
- **single-project scope** → per-call (usage-based) sum.

This is intentional and documented; see `MockAdapter.overview`/`cost` and PRD §5.

### Aggregation — `lib/engine/aggregate.ts`
`filterCalls`, `computeTotals`, `projectRollups`, `orgRollups`, `dailySeries`, `podLoads`,
`endReasonCounts`, `statusCounts`. These are pure and shared by the mock adapter (and will back the
future ETL).

## 10. The seed dataset

**`src/lib/seed/index.ts`** — `buildDataset()` returns `{ orgs, projects, agents, contracts, calls }`;
`getDataset()` memoizes it per server process.

- **Deterministic**: a fixed RNG seed (`mulberry32` in `rng.ts`) → reproducible volumes/values. Call
  **timestamps are anchored to "now"** (last 30 days) so the demo always looks recent.
- **Orgs (3)**: `TP Latam` (pure usage), `TP PH` (MGF), `LTM` (MGF).
- **Projects (12)**: TP Latam → Telmex, Metlife, Sura EPS, Sura SAC, Bridgeway, Colsubsidio;
  TP PH → Pacifica Bank, IslaTel, MediCare PH (fictitious); LTM → Allegiant, LLA, Vega Air.
  Each project pins a model mix (LLM/STT/TTS), pod count, daily volume and mean duration so cost
  profiles differ. Namespaces follow `…-bot-orchestration` (Telmex matches the real Grafana namespace).
- **Calls**: ~30 days of calls per project with realistic usage, latency, end-reason distribution and
  a few `ACTIVE` calls "now" for Live Operations. Cost is computed through the engine at seed time.

To change the demo data, edit the `ORGS`, `CONTRACTS`, `PROJECTS` arrays — everything downstream
(filters, charts, tables, rollups) derives automatically.

## 11. Domain model

`src/lib/types.ts` mirrors the future DB schema ([`PRD/12-data-model.md`](./PRD/12-data-model.md)) so a
Supabase swap is a connection change, not a remodel. Key entities: `Organization`, `Project`, `Agent`,
`Call` (with `CallUsage`, `CallLatency`, `CallCost`), `OrgContract`, plus aggregation shapes
(`ProjectRollup`, `OrgRollup`, `TimePoint`, `PodLoad`, `EndReasonCount`, `StatusCount`). Enums:
`CallStatus` (`ACTIVE|COMPLETED|FAILED`), `CallEndReason`
(`USER_IDLE|USER_DISCONNECTED|CALL_TRANSFERRED|CALL_END_PHRASE_TRIGGERED|OTHER`), `ContractType`,
`Severity`, `ServiceKey`, `Role`. Column names (e.g. `hostId`, `closedReason`, `callDurationSecs`) echo
the real call DB observed in the Grafana dashboards (see [`PRD/04-data-sources.md`](./PRD/04-data-sources.md)).

## 12. Auth, roles & financial gating

`src/lib/auth/policy.ts` is the single source of truth:

```ts
canSeeFinancials(role)      // revenue, margin, MRR, business health — superadmin only
canSeeCost()               // cost-to-serve USD — both roles (confirmed)
canSeeSuperAdminOnly(role) // fallbacks, thresholds config, flag queue, infra
```

On the client, **`<FinancialGate>`** and **`useFinancials()`** (`components/financial-gate.tsx`) read
the current role from `ViewContext` and hide revenue/margin UI for `User`. Navigation is filtered by
`visibleNav(role)` in `lib/nav.ts` (SuperAdmin-only items disappear entirely).

In production this maps cleanly to Supabase RLS: scope by `org_id` / `project_ids`, and gate financial
columns by role — the same `policy.ts` predicates inform both UI and RLS.

## 13. Client state & data fetching

- **`ViewContext`** (`components/view-context.tsx`) holds `{ role, orgId, projectId, range }`, persists
  to `localStorage` (key `voicing-superadmin-view`), and exposes a derived **`query`** string used by
  every hook. Changing the org clears the project (scoping).
- **Hooks** (`lib/hooks.ts`): `useMeta`, `useOverview`, `useCost`, `usePerformance`, `useCalls`,
  `useCall`, `useLiveOps`. They build the request URL from `ViewContext.query`, so any filter change
  re-keys the query and refetches. `useLiveOps` sets `refetchInterval: 20s` (the only live surface).
- **Providers** (`components/providers.tsx`): `ThemeProvider` (light default) → `QueryClientProvider`
  (30s staleTime) → `ViewProvider` → `TooltipProvider` + `Toaster`.

## 14. Routing & the app shell

All authenticated pages live in the **`(dashboard)`** route group, which provides the shell
(`SidebarProvider` + `AppSidebar` + `TopBar` + `<main>`). The route group is invisible in the URL, so
paths are clean (`/overview`, `/cost`, …) and **match the `href`s in `lib/nav.ts`**. `/` redirects to
`/overview`.

## 15. Design system

Based on the official Voicing AI Brand Kit (Platform brand). See
[`PRD/14-design-system.md`](./PRD/14-design-system.md).

- **Palette** (CSS variables in `globals.css`): Primary Blue `#3B5BDB`, Accent Violet `#7C3AED`, app
  bg `#F4F5FA`, card `#FFFFFF`, text `#1E2060`, muted `#667099`, border `#CDD0E0`, success `#22C55E`,
  warning `#DA5326`, critical `#DC2626`. Light is the default; a full dark theme is defined.
- **Chart palette**: blue → violet → green → orange → muted (fixed hues per service for consistency).
- **Typography**: Plus Jakarta Sans (UI) + Inter (fallback) + Instrument Serif (editorial) + Geist Mono,
  loaded via `next/font` in `layout.tsx`.
- **Radius**: cards 10px, buttons pill, inputs 8px, badges 6px.

### ⚠️ Base UI, not Radix (critical for contributors)
shadcn was initialized with the **`base-nova` preset → Base UI (`@base-ui/react`)**, not Radix.
Practical consequences when writing/altering UI:

- **Composition uses the `render` prop, not `asChild`.**
  ```tsx
  // ❌ Radix style (won't compile)
  <SidebarMenuButton asChild><Link href="/x">…</Link></SidebarMenuButton>
  // ✅ Base UI style
  <SidebarMenuButton render={<Link href="/x" />}>…children…</SidebarMenuButton>
  ```
- **Tooltip** uses `delay`, not `delayDuration`.
- **Select** `onValueChange` may yield `null` — coerce: `(v) => set(v && v !== ALL ? v : undefined)`.
- Add components with `rtk proxy npx shadcn@latest add <name> --yes` (see §17 on the `npx` gotcha).

## 16. Conventions & coding standards

- **TypeScript strict**; no `any` in app code. Prefer explicit result types from `data/source.ts`.
- **Money is always micro-USD** end-to-end; convert/format only at the display edge via `money.ts`.
- **Pure logic** (cost/revenue/margin/aggregation) lives in `lib/engine/*` and must stay free of React,
  Next, or I/O so it can be reused by the future ETL and unit-tested.
- **Client/server boundary**: never import `lib/seed/*` or `lib/data/mock.ts` from client components.
  Client reads via hooks → API routes. Type-only imports from `data/source.ts` are fine.
- **Components**: shadcn primitives in `components/ui/`; app components compose them. Keep pages thin —
  push data shaping into the adapter/engine.
- **Styling**: Tailwind utility classes + brand tokens (`bg-primary`, `text-muted-foreground`,
  `text-success`, etc.). Don't hardcode hex in components.
- **Imports**: use the `@/` alias (maps to `src/`).
- **Naming**: files kebab-case; types/Components PascalCase; functions camelCase.

## 17. Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + typecheck (run before pushing)
npm run lint
```

### Environment gotchas (this machine / harness)
- **`npx` is rewritten by an RTK shell hook** and fails. Run npx via **`rtk proxy npx <…>`**
  (e.g. adding shadcn components). Plain `npm install` works.
- No **Docker** / **Supabase CLI** installed → local Supabase isn't available; use **Supabase Cloud**.
- Large `curl` responses may be summarized to a schema by the RTK hook — write to a file
  (`curl … -o out.json`) to inspect raw JSON.

## 18. Build & deployment

- `npm run build` runs Next's production build **and full TypeScript typecheck** — keep it green.
- `next.config.ts` pins `turbopack.root` to this directory (a parent lockfile would otherwise confuse
  workspace-root inference).
- **Deploy: Vercel.** Import the repo at vercel.com/new → Next.js auto-detected → Deploy. No env vars
  needed for the mock dataset; pushes to `main` auto-deploy. (Once Supabase is wired, add
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `DATA_SOURCE=supabase`.)

## 19. How to add a new page or module

1. **Spec**: confirm scope against the relevant `PRD/0x-…md`.
2. **Data**: add a method to the `DataSource` interface (`lib/data/source.ts`) + its result type;
   implement it in `MockAdapter` (`lib/data/mock.ts`) using `lib/engine/aggregate.ts`. If you need new
   fields, extend `lib/types.ts` and the seed (`lib/seed/index.ts`).
3. **API**: add `src/app/api/<resource>/route.ts` that parses scope (`lib/scope.ts`) and calls the
   adapter.
4. **Hook**: add a `use<Resource>()` in `lib/hooks.ts` (keyed by `ViewContext.query`).
5. **Page**: create `src/app/(dashboard)/<route>/page.tsx` (a `"use client"` component) using the hook,
   `KpiCard`, `charts.tsx`, chips, and `useFinancials()` for gating.
6. **Nav**: add an entry to `lib/nav.ts` (set `superAdminOnly` if needed). Keep the `href` in sync with
   the route.
7. **Verify**: `npm run build` green; click through with both roles and a couple of scopes.

Replacing a `ComingSoon` stub follows the same steps (the route already exists).

## 20. Wiring the real Supabase backend

The data layer is built for this. Steps:

1. Create a **Supabase Cloud** project.
2. Add migrations under `supabase/migrations/` implementing the schema in
   [`PRD/12-data-model.md`](./PRD/12-data-model.md) (mirror the call DB names:
   `chat_conversations`/`conversation_details`/`chat_messages`, `host_id`, `closed_reason`, …).
3. Seed the DB — reuse `lib/seed` + `lib/engine` to emit SQL/insert rows (same code path as the mock).
4. Implement `src/lib/data/supabase.ts` — `class SupabaseAdapter implements DataSource`, returning the
   **same shapes** as the mock (push aggregation into SQL views / `period_rollup` for speed).
5. Enable the `case "supabase"` in `lib/data/index.ts` and set env
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `DATA_SOURCE=supabase`).
6. Add **RLS** policies mirroring `lib/auth/policy.ts` (org/project scoping + financial gating).

No page or hook should need changes — that's the whole point of the seam.

> **Language note:** steps 3–4 (seeding and the data backend) are where **Python** belongs at Voicing.
> Two equivalent shapes: (a) the Next.js route handlers call a **Python service (e.g. FastAPI)** that
> owns DB access + the cost/billing ETL, and `SupabaseAdapter` becomes a thin HTTP client; or (b)
> **Python jobs** populate Supabase/Postgres (rollups, reconciled costs) and `SupabaseAdapter` just
> reads. The cost/revenue/margin formulas in §9 are the port target for the Python side.

## 21. Known limitations & modeling caveats

- **Illustrative pricing & contracts** — rates in `pricing.ts` and contract terms in the seed are
  placeholders; replace with real figures.
- **Per-call vs contract revenue** — per-call revenue is marginal (minutes × rate); org revenue adds
  the MGF floor. Headline KPIs reconcile to the org/contract figure at org/global scope (see §9).
- **Cloud allocation** = talk-minutes (simple, fair for voice); pod-ownership allocation is possible
  later via namespace→project mapping.
- **Transcripts, recordings, error logs** in Call Detail are generated for the demo (no real audio/Loki).
- **Live Operations** refreshes via polling (20s); a true streaming `LiveSource` (SSE/WebSocket) is a
  later enhancement.
- **No automated tests yet** — the engine (`lib/engine/*`) is pure and is the first thing to unit-test
  (Vitest recommended).

## 22. Roadmap

See [`PRD/15-roadmap-open-questions.md`](./PRD/15-roadmap-open-questions.md) and
[`BUILD-STATUS.md`](./BUILD-STATUS.md). Near-term: build the stubbed module UIs (Issues/Thresholds,
Infra k8s+ELB from the Grafana specs, Fallbacks, Business Health, Flag Queue), then wire Supabase.

## 23. Glossary

| Term | Meaning |
|------|---------|
| **Org** | A Voicing customer organization (TP Latam, TP PH, LTM). |
| **Project** | A deployment unit within an org (Telmex, Allegiant, …). |
| **Agent** | A configured voice bot inside a project. |
| **Call** | A single telephony session. |
| **Service** | A billable component of a call: LLM, STT, TTS, telephony, cloud. |
| **Cost (COGS)** | Voicing's real cost to operate, per service. |
| **Revenue** | What Voicing charges the org (usage and/or MGF). |
| **Margin** | Revenue − Cost. |
| **MGF** | Minimum Guarantee Fee — contractual monthly revenue floor (reading B1). |
| **MRR** | Monthly Recurring Revenue (MGF floor for MGF orgs; run-rate for usage orgs). |
| **Pod / `host_id`** | Kubernetes pod handling a call; basis of "active calls per pod". |
| **Disposition / end reason** | Outcome labels of a call. |
| **Scope** | The active org/project/time-range filter applied across the UI. |
