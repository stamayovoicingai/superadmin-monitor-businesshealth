# Build Status & Handoff — Voicing AI SuperAdmin Platform

> Snapshot to resume the build cleanly. **Last updated: Business Health module shipped.**
> Language: all code/docs in **English**. Conversation may be Spanish.
> Companion docs: [`README.md`](./README.md), [`DOCUMENTATION.md`](./DOCUMENTATION.md), [`PRD/`](./PRD/).

## TL;DR — where we are

PRD is **complete** (`PRD/` 00–15). The app is built and running: **data/engine backbone + API layer +
client plumbing + app shell + 6 pages** (Overview, Cost & Margin, Performance, Call Logs + Call Detail,
Live Operations, **Business Health**). `npm run build` passes (**24 routes**); `npm run dev` → all routes
200 with mock data. The whole project is **pushed to GitHub** (`origin/main`).

What remains: 4 module UIs (Issues/Thresholds, Infra k8s+ELB, Fallbacks, Call Flagging), QA Bench
(Phase 2 design only), the **Supabase wiring**, and minor housekeeping (`.env.example`, tests).

## Repo & deploy

- Remote: `git@github.com:stamayovoicingai/superadmin-monitor-businesshealth.git` (branch `main`).
  Push via the SSH alias **`github-nuevo`** (key `~/.ssh/stamayoVoicingAI`), e.g. the remote URL is
  `git@github-nuevo:stamayovoicingai/…`.
- Deploy target: **Vercel** (import repo → auto-detect Next.js → deploy; no env vars for mock mode).

## ⚠️ Environment & framework gotchas (read before coding)

1. **shadcn = Base UI, NOT Radix** (`base-nova` preset, `@base-ui/react`). Use the **`render` prop**
   (`render={<Link/>}`) not `asChild`; Tooltip uses `delay` not `delayDuration`; `Select.onValueChange`
   can yield `null` → coerce `(v) => set(v && v !== ALL ? v : undefined)`. See DOCUMENTATION §15.
2. **`npx` is rewritten by the RTK shell hook** and fails → run npx via **`rtk proxy npx <…>`**
   (e.g. `rtk proxy npx shadcn@latest add <name> --yes`). Plain `npm install` / `npm run …` are fine.
3. No **Docker** / **Supabase CLI** → use **Supabase Cloud** (needs credentials) when wiring the backend.
4. Large `curl` outputs get summarized to a schema by RTK → `curl … -o file.json` then read the file.
5. **Voicing codes in Python.** TS here is demo/UI-only; real backend logic belongs in Python (see
   DOCUMENTATION §5 & §20).

## Stack

Next.js 16.2.7 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 (CSS `@theme`) ·
shadcn/ui on **Base UI** · Recharts · TanStack Query (+ Table available) · Supabase JS/SSR (installed,
not yet wired) · next-themes · zod · date-fns · lucide-react · sonner.

**Locked decisions:** light default + dark toggle · cloud alloc = talk-minutes · revenue = minutes/MGF,
no markups · MGF = B1 · User sees cost-to-serve but not revenue/margin · Supabase from Phase 0 ·
2 roles (SuperAdmin/User).

**Demo dataset:** 3 orgs — **TP Latam** (pure usage), **TP PH** (MGF), **LTM** (MGF); **12 projects** —
TP Latam: Telmex, Metlife, Sura EPS, Sura SAC, Bridgeway, Colsubsidio · TP PH: Pacifica Bank, IslaTel,
MediCare PH · LTM: Allegiant, LLA, Vega Air. ~30 days of calls, anchored to "now".

---

## ✅ DONE

### Docs
- `PRD/00`–`15` (+ index), `README.md` (full), `DOCUMENTATION.md` (architecture & contributor guide).

### Foundation
- **Design tokens** — `src/app/globals.css` (Voicing Platform palette, light + dark, chart hues,
  `success/warning/critical` extras, radius 10px). Fonts in `layout.tsx` (Jakarta/Inter/Instrument Serif/Geist Mono).
- **shadcn components** — button, card, table, badge, dropdown-menu, select, input, tabs, separator,
  sheet, tooltip, avatar, skeleton, switch, label, dialog, scroll-area, breadcrumb, sonner, chart,
  sidebar, popover. (`hooks/use-mobile.ts` from shadcn.)

### Domain + engine (`src/lib`)
- `types.ts`, `money.ts` (micro-USD), `period.ts`, `scope.ts`, `nav.ts`, `auth/policy.ts`.
- `engine/pricing.ts` (provider rates), `engine/cost.ts` (`computeCallCost`, `computeOrgMonthlyRevenue`
  MGF-B1, `computeMrr`, `marginPct`), `engine/aggregate.ts` (`filterCalls`, `computeTotals`,
  `projectRollups`, `orgRollups`, `dailySeries`, `podLoads`, `endReasonCounts`, `statusCounts`,
  **`callerSeries`**, **`activeAgentsCount`**).
- `seed/rng.ts` (mulberry32), `seed/index.ts` (`buildDataset`/`getDataset`; bounded caller pool;
  MGF `includedMinutes` tuned so MGF orgs show overage→expansion).

### Data layer + API
- `data/source.ts` (DataSource interface + result types incl. `BusinessHealthResult`), `data/mock.ts`
  (MockAdapter — full), `data/index.ts` (env selector; `supabase` case stubbed).
- API routes: `meta`, `overview`, `cost`, `performance`, `calls`, `calls/[callId]`, `live`, **`business`**.

### Client + UI
- `view-context.tsx` (role/org/project/range, localStorage, query string), `providers.tsx`,
  `lib/hooks.ts` (`useMeta/useOverview/useCost/usePerformance/useCalls/useCall/useLiveOps/useBusiness`).
- Shell: `app/(dashboard)/layout.tsx`, `app-sidebar.tsx`, `top-bar.tsx`, `scope-filters.tsx`,
  `role-switcher.tsx`, `theme-toggle.tsx`, `brand-logo.tsx`.
- Shared: `kpi-card.tsx`, `chips.tsx`, `financial-gate.tsx`, `page-header.tsx`, `coming-soon.tsx`,
  `charts.tsx` (CostByService, CostRevenue, LatencyTrend, ServiceDonut, SimpleDonut, HBarChart,
  **MrrChart, CallersChart, VBarChart**).

### Pages built & rendering (HTTP 200)
`/overview` (incl. Assistant Cost KPI) · `/cost` · `/performance` · `/calls` · `/calls/[callId]` ·
`/live` (20s refetch) · **`/business`** (SuperAdmin-gated) · **`/assistant`** (platform assistant
subagent usage — cost by subagent/project/day) · **`/controls/access`** (IP whitelist/blacklist,
allow+block lists, org→project inheritance, add/delete, IP tester; SuperAdmin-gated).

### IP Access Control (PRD/16) & Assistant Usage (PRD/17) — DONE
- `lib/engine/ip.ts` (IPv4+CIDR matching, `evaluateIp`), `lib/engine/subagents.ts` (catalog),
  `lib/engine/cost.ts#llmCostMicros`. Seed: `ipRules` + `subagentUsage`.
- `DataSource`: `listIpRules/addIpRule/deleteIpRule` (in-process mutable store) + `assistantUsage`;
  `OverviewResult.assistantCostMicros`. API: `/api/access` (GET/POST/DELETE), `/api/assistant` (GET).
- Hooks: `useIpRules/useAddIpRule/useDeleteIpRule/useAssistant`. Nav: "Assistant Usage" (Observe, both
  roles), "IP Access" (Controls, SuperAdmin).
- Note: subagent cost is tracked SEPARATELY from call COGS/margin (per decision) but shown in Overview.

### Verified behaviors
- Role switch (View-as) hides revenue/margin/business for `User`.
- Org/project/range filters drive every page via the data seam.
- Cost/revenue/margin reconcile: headline = contract-based (MGF floors) at org/global scope; per-call
  (usage) at project scope. Business Health: MRR $13.5K, +6.8% MoM, expansion $1.08K, churn 0%.

---

## 🚧 NOT DONE — resume here (priority order)

> For the exact recipe see **DOCUMENTATION.md §19 "How to add a new page or module"**. Each module
> = extend `DataSource` + `MockAdapter` (+ `types`/`seed` if new fields) → API route → hook → page →
> nav. Replacing a `ComingSoon` stub reuses the existing route.

1. **Issues + Thresholds** (PRD/05 §4–5) — add `threshold` + `issue` shapes; derive active issues by
   comparing calls/rollups to thresholds; Active Issues + Issues-by-Category views; threshold config UI
   (SuperAdmin). Routes already stubbed: `/issues`, `/controls/thresholds`.
2. **Infra: Kubernetes + AWS ELB** (PRD/06) — replicate the real Grafana panels (mapped in
   `PRD/04-data-sources.md`): k8s gauges/timeseries (Prometheus metrics) + ELB CloudWatch panels.
   Build reusable declarative panel components + mock timeseries generators keyed to template vars.
   Routes: `/infra/kubernetes`, `/infra/elb`.
3. **Fallbacks STT/TTS/LLM** (PRD/08) — config UI + `fallback_config`/`fallback_event` mock state;
   LLM = drag-and-drop ordered list with cost badges. Route: `/controls/fallbacks`.
4. **Call Flagging** (PRD/10) — flag action (already a toast on Call Detail) → real `call_flag` state +
   review queue. Route: `/controls/flags`.
5. **QA Bench / Evals** (PRD/11) — **Phase 2, design only**. Route `/qa-bench` stays a stub.

### Supabase wiring (decision: connect from Phase 0)
- [ ] Create a Supabase Cloud project (Supabase MCP auth OR user provides URL + anon + service-role keys).
- [ ] `supabase/migrations/0001_init.sql` — schema from `PRD/12-data-model.md` (mirror call-DB names:
  `chat_conversations`/`conversation_details`/`chat_messages`, `host_id`, `closed_reason`, …).
- [ ] Seed Postgres — reuse `lib/seed` + `lib/engine` (same code path). **Per team convention this
  belongs in Python** (a Python job/FastAPI service), see DOCUMENTATION §20.
- [ ] `lib/data/supabase.ts` — `SupabaseAdapter implements DataSource` (same return shapes as mock).
- [ ] `.env.local`/`.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `DATA_SOURCE=supabase`) + enable the `case "supabase"` in `data/index.ts`.
- [ ] RLS mirroring `lib/auth/policy.ts` (org/project scoping + financial gating).

### Housekeeping / quality
- [ ] `.env.example`.
- [ ] Unit tests for the pure engine (`lib/engine/*`) — Vitest recommended (formulas in DOCUMENTATION §9).
- [ ] Optional: true streaming `LiveSource` for `/live` (SSE/WebSocket) instead of 20s polling.
- [ ] Optional: generic `data-table.tsx` (TanStack) if table reuse grows.

---

## How to resume

1. Read this file + `DOCUMENTATION.md` (esp. §6 layout, §7 data layer, §15 Base UI, §19 add-a-module).
2. `npm install` (if fresh clone) → `npm run dev` → http://localhost:3000.
3. Pick the next module (suggested order above). Follow DOCUMENTATION §19.
4. `npm run build` must stay green; click through with **both roles** and a couple of scopes.
5. Commit + push to `origin/main` (deploys via Vercel if connected).

## Useful commands
- Dev: `npm run dev`  ·  Build/typecheck: `npm run build`  ·  Lint: `npm run lint`
- Add shadcn component: `rtk proxy npx shadcn@latest add <name> --yes`
- Inspect an API JSON without RTK summarizing it: `curl -s "http://localhost:3000/api/<x>" -o /tmp/x.json`
