# Build Status & Handoff — Voicing AI SuperAdmin Platform

> Snapshot to resume the build cleanly. Last updated: Phase 0 core UI complete + build green.
> Language: all code/docs in **English**. Conversation may be Spanish.

## TL;DR — where we are

PRD is **complete** (`PRD/` 00–15). The app is scaffolded, the **data/engine backbone + API layer +
client plumbing** is written, the **app shell + 5 core pages are built and rendering**, and
**`npm run build` passes** (23 routes). `npm run dev` → all routes return 200 with mock data.

**Verified working:** role switch (View-as) hides financials, org/project/range filters, cost &
margin reconcile (headline = sum of org margins; MGF floors applied), Live Ops, call detail.

What remains: the **non-core module UIs** (Issues, Infra k8s/ELB, Fallbacks, Business Health, Flag
queue — currently stubs), the **Supabase wiring**, and **housekeeping** (README, .env.example).

> ⚠️ shadcn was initialized with the **`base-nova` preset → Base UI** (`@base-ui/react`), NOT Radix.
> Components use the **`render` prop** (e.g. `render={<Link/>}`), NOT `asChild`. Tooltip uses
> `delay` not `delayDuration`. Keep this in mind when adding/altering UI.

## ⚠️ Environment gotchas

- **`npx` is rewritten by the RTK hook** → it behaves like `npm` and fails. Always run npx via
  `rtk proxy npx <...>` (e.g. `rtk proxy npx shadcn@latest add ...`). Plain `npm install` is fine.
- No **Docker** and no **Supabase CLI** installed → local Supabase is out. "Connect Supabase" means a
  **Supabase Cloud** project. Need credentials (see Pending §Supabase).
- Project folder name has a space ("SuperAdmin Platform") → npm package name is `superadmin-platform`
  (app was scaffolded in a temp subfolder then moved to root; git repo initialized at root).

## Stack (installed)

Next.js 16.2.7 (App Router) · React 19 · TypeScript · Tailwind v4 (CSS `@theme`, no JS config) ·
shadcn/ui (radix base) · Recharts · TanStack Query + Table · Supabase JS + SSR · next-themes · zod ·
date-fns · lucide-react · sonner.

Decisions locked: **light default + dark toggle**, **cloud alloc = talk-minutes**, **revenue = minutes/MGF only (no markups)**, **MGF = B1**, **User sees cost-to-serve but not revenue/margin**, **Supabase from Phase 0**, seed **3 orgs / 6 projects**.

---

## ✅ DONE

### PRD
- `PRD/00`–`PRD/15` complete + `PRD/README.md` index.

### Design system
- `src/app/globals.css` — Voicing Platform brand tokens (light + dark), chart palette, brand extras
  (`success`/`warning`/`critical`/`brand-blue`/`brand-violet`). Radius 10px.
- Fonts wired in `src/app/layout.tsx` (Plus Jakarta Sans + Inter + Instrument Serif + Geist Mono).

### shadcn components added
button, card, table, badge, dropdown-menu, select, input, tabs, separator, sheet, tooltip, avatar,
skeleton, switch, label, dialog, scroll-area, breadcrumb, sonner, chart, sidebar, popover.

### Domain + engine (`src/lib`)
- `types.ts` — all domain types (aligned to PRD/12). Money = integer micro-USD.
- `money.ts` — micro-USD helpers + formatters.
- `engine/pricing.ts` — provider rate catalog (LLM/STT/TTS/telephony/cloud), illustrative.
- `engine/cost.ts` — `computeCallCost`, `computeOrgMonthlyRevenue` (MGF B1), `computeMrr`, `marginPct`.
- `engine/aggregate.ts` — `filterCalls`, `computeTotals`, `projectRollups`, `orgRollups`,
  `dailySeries`, `podLoads`, `endReasonCounts`, `statusCounts`.
- `seed/rng.ts` — deterministic PRNG (mulberry32).
- `seed/index.ts` — `buildDataset()`/`getDataset()`: 3 orgs (TP Latam pure-usage, Telmex mgf,
  Sampras Health mgf), 6 projects w/ namespaces + per-project model mix, agents, 30 days of calls,
  some ACTIVE calls today for Live Ops.

### Data layer + API
- `lib/data/source.ts` — `DataSource` interface + result types + `Scope`.
- `lib/data/mock.ts` — `MockAdapter` (full implementation from seed).
- `lib/data/index.ts` — `getDataSource()` selector (env `DATA_SOURCE`, defaults mock; supabase case stubbed).
- `lib/period.ts` — range presets. `lib/scope.ts` — parse search params → Scope.
- API routes (`src/app/api/`): `meta`, `overview`, `cost`, `performance`, `calls`, `calls/[callId]`, `live`.

### Auth + nav
- `lib/auth/policy.ts` — `canSeeFinancials`, `canSeeCost`, `canSeeSuperAdminOnly`, role labels.
- `lib/nav.ts` — sidebar config + `visibleNav(role)`.

### Client plumbing
- `components/view-context.tsx` — role + org/project/range state, localStorage-persisted, builds API query string.
- `components/providers.tsx` — QueryClient + ThemeProvider + Tooltip + Toaster + ViewProvider.
- `lib/hooks.ts` — React Query hooks: `useMeta/useOverview/useCost/usePerformance/useCalls/useCall/useLiveOps`.
- `app/layout.tsx` (fonts+providers), `app/page.tsx` (redirect → /overview).
- `components/brand-logo.tsx` (waveform mark + lockup), `app-sidebar.tsx`, `theme-toggle.tsx`,
  `role-switcher.tsx`, `scope-filters.tsx`.

---

## ✅ DONE since last snapshot (Phase 0 core UI)

- **App shell** — `components/top-bar.tsx` + `src/app/(dashboard)/layout.tsx` (SidebarProvider +
  AppSidebar + SidebarInset + TopBar). All pages live under the `(dashboard)` route group; routes match `lib/nav.ts`.
- **Shared UI** — `kpi-card.tsx`, `chips.tsx` (status/end-reason/disposition/live), `charts.tsx`
  (CostByService area, CostRevenue, LatencyTrend, ServiceDonut, SimpleDonut, HBarChart),
  `financial-gate.tsx` (+ `useFinancials`), `page-header.tsx`, `coming-soon.tsx`, `brand-logo.tsx`.
  (No generic `data-table.tsx` yet — pages use shadcn `Table` directly; build one if reuse grows.)
- **Core pages built & rendering (200):** `/overview`, `/cost`, `/performance`, `/calls`,
  `/calls/[callId]` (transcript generated client-side, recording player, latency waterfall, per-service
  cost, error logs, flag toast), `/live` (20s refetch).
- **Stubs (ComingSoon):** `/issues`, `/infra/kubernetes`, `/infra/elb`, `/controls/fallbacks`,
  `/controls/thresholds`, `/controls/flags`, `/business`, `/qa-bench`.
- **Build:** `npm run build` green; `next.config.ts` sets `turbopack.root` (multiple-lockfile warning fixed).
- **Engine reconciliation:** headline revenue/margin = contract-based (MGF floor) at org/global scope,
  per-call (usage) at project scope — so KPIs match the per-org chart. (`lib/data/mock.ts`)

## 🚧 NOT DONE — resume here

### 4. Modules to flesh out after the core (map to PRD)
- [ ] Issues + Thresholds (PRD/05 §4-5) — derive issues from thresholds vs calls; add `threshold`/`issue` to seed.
- [ ] Infra k8s + ELB (PRD/06) — declarative panel specs from Grafana metrics; mock timeseries generators keyed to template vars.
- [ ] Fallbacks STT/TTS/LLM (PRD/08) — config UI + `fallback_config`/`fallback_event` mock state + drag-drop LLM list.
- [ ] Business Health (PRD/09) — usage timeseries + MRR/churn/growth/expansion (superadmin only).
- [ ] Call Flagging (PRD/10) — flag action + review queue; add `call_flag` state.
- [ ] QA Bench (PRD/11) — Phase 2, design only.

### 5. Supabase (decision: connect from Phase 0)
- [ ] Create a **Supabase Cloud** project (via Supabase MCP auth OR user provides URL + anon key + service-role key).
- [ ] `supabase/migrations/0001_init.sql` — schema from PRD/12 (organization, project, agent, call,
  call_cost, conversation_details, chat_message, call_error_log, pricing_*, org_contract, period_rollup,
  issue_category, threshold, issue, issue_affected_call, call_flag(+comment), fallback_config(+event), app_user).
- [ ] `supabase/seed.sql` (or a TS seed script) — emit the deterministic dataset into Postgres.
- [ ] `lib/data/supabase.ts` — `SupabaseAdapter implements DataSource` (same shapes as mock).
- [ ] `.env.local` / `.env.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `DATA_SOURCE=supabase`. Enable the `case "supabase"` in `lib/data/index.ts`.
- [ ] RLS policies mirroring `lib/auth/policy.ts` (org_id / project_ids scoping). Optional for demo.

### 6. Housekeeping
- [ ] Replace default root `README.md` (still create-next-app) with a real project README (link PRD + run steps).
- [ ] `.env.example`.
- [ ] **Run `npm run build` / `npm run lint`** — NOT done yet; expect type fixes. Watch for:
  shadcn `Select` `size` prop on `SelectTrigger`, `Toaster` from sonner wrapper, `chart.tsx` usage,
  lucide icon names, server/client boundaries on API route imports.
- [ ] Optional: client live ticker for `/live` (mutate active set every 15–30s) behind a `LiveSource`.

---

## How to resume

1. Read this file + `PRD/README.md`.
2. `npm install` (already done; re-run if fresh clone).
3. Build the shell (§1), then shared UI (§2), then pages (§3) in priority order.
4. First milestone to verify visually: `npm run dev` → `/overview` and `/cost` render with mock data,
   role switch hides financials, dark toggle works.
5. Then Supabase (§5), then remaining modules (§4).

## Useful commands
- Dev: `npm run dev`
- Build/typecheck: `npm run build`
- Add shadcn component: `rtk proxy npx shadcn@latest add <name> --yes`
