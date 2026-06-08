<div align="center">

# Voicing AI — SuperAdmin Platform

**Internal control tower for the Voicing AI voice-agent business.**
Observability · **Cost & Margin** · Infrastructure monitoring · Operator controls — across every
organization, project and agent on the platform.

`Next.js 16` · `React 19` · `TypeScript` · `Tailwind v4` · `shadcn/ui` · `Recharts` · `TanStack Query`

</div>

---

## What is this?

The SuperAdmin Platform answers, for any organization / project / agent / time-range:

> **Is it healthy? Is it fast? What does it cost us to run? What do we charge? What's our margin?**

Today that data is fragmented across provider billing portals (OpenAI, Anthropic, Deepgram,
ElevenLabs, Twilio, AWS/GCP/Azure…), observability tooling (Grafana/Prometheus for k8s & AWS ELB),
the call/transcript database, and finance spreadsheets (MGF, usage rates, MRR). There is no single
pane that unifies **health + performance + cost + margin** and lets an operator *act* (set
thresholds, configure provider fallbacks, flag bad calls).

This repository is a **high-fidelity, navigable demo** of that platform: a complete UI driven by a
realistic, internally-consistent simulated dataset, **architected so the same frontend can later
read from a real backend (Supabase + provider/billing integrations) without a rewrite.**

> 🔒 Confidential — internal Voicing AI use only.

## Who it's for

All users are **internal Voicing staff**. Two roles:

| Role | Sees |
|------|------|
| **SuperAdmin** | Everything: all orgs/projects, **cost, revenue, margin, MRR**, infra, and all controls. |
| **User** | Project performance + **cost-to-serve** (USD). **Never** revenue, margin, or business financials. |

Use the **"View as"** switcher (top bar) to preview how scoping changes the UI.

## Features

- **Overview** — role-aware KPI strip, cost-by-service over time, margin by org, projects table.
- **Cost & Margin** *(priority #1)* — real per-service cost (LLM / STT / TTS / telephony / cloud),
  revenue and margin per call / project / org, with a cost-only variant for the `User` role.
- **Performance** — latency (overall + per service) and error rate, with trends.
- **Call Logs & Call Detail** — filterable history; per-call transcript, recording player,
  latency waterfall, per-service cost breakdown, error logs and flagging.
- **Live Operations** — active calls per pod, concurrency, status & end-reason breakdowns
  (auto-refreshes every 20s).
- **Designed & stubbed** (next up): Issues/Thresholds, Infra monitoring (Kubernetes + AWS ELB),
  Provider Fallbacks (STT/TTS/LLM), Business Health (MRR/churn/growth), Flag Queue, QA Bench.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** |
| Styling | **Tailwind CSS v4** (CSS `@theme`) with Voicing brand tokens |
| Components | **shadcn/ui** on **Base UI** (`@base-ui/react`) |
| Charts | **Recharts** (via shadcn `chart` wrapper) |
| Tables | **TanStack Table** |
| Data fetching | **TanStack Query** over a typed data-access layer |
| Backend (planned) | **Supabase** (Postgres + Auth + RLS + Storage), fed by **Python** services/jobs |
| Theming | **next-themes** (light default + dark) |

> **Language note:** Voicing AI normally codes in **Python**. This repo is TypeScript only because it's
> a frontend-heavy navigable demo. Production backend work (ETL, billing reconciliation, data access)
> belongs in Python — the architecture keeps TS at the UI edge so the backend language stays a free
> choice. See [`DOCUMENTATION.md` §5](./DOCUMENTATION.md#5-tech-stack--rationale).

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000  → redirects to /overview
```

```bash
npm run build    # production build + full TypeScript typecheck
npm run start    # serve the production build
npm run lint     # ESLint
```

No environment variables are required — the app runs on a deterministic in-memory mock dataset
(`DATA_SOURCE=mock`, the default). A Supabase adapter can be enabled later (see
[`DOCUMENTATION.md`](./DOCUMENTATION.md)).

## Project structure (high level)

```
PRD/                     Product requirements (00–15): the source of truth for scope
src/
  app/
    (dashboard)/         Authenticated shell + pages (overview, cost, calls, live, …)
    api/                 Route handlers (the seam the UI fetches through)
  components/            App shell, charts, KPI cards, chips, shadcn ui/
  lib/
    engine/              Cost / revenue / margin engine (pure functions)
    seed/                Deterministic demo dataset generator
    data/                DataSource interface + mock adapter (+ supabase later)
    auth/                Role policy (financial gating)
DOCUMENTATION.md         Architecture & contributor guide (read this before contributing)
BUILD-STATUS.md          Current build state and what's pending
```

## Documentation

- **[`DOCUMENTATION.md`](./DOCUMENTATION.md)** — exhaustive architecture & contributor guide:
  how it's built, every technical decision, data flow, the cost engine, how to add a page/module,
  and how to wire Supabase. **Read this before contributing.**
- **[`PRD/`](./PRD/)** — full product requirements (00–15): vision, roles, information architecture,
  cost/revenue/margin engine, data sources (mapped from the real Grafana dashboards), per-module
  specs, data model, technical architecture, design system, roadmap & open questions.
- **[`BUILD-STATUS.md`](./BUILD-STATUS.md)** — what's done vs pending and project conventions.

## Deployment

Optimized for **Vercel**: import the repo at [vercel.com/new](https://vercel.com/new) → it
auto-detects Next.js → Deploy (no env vars needed for the mock dataset). Every push to `main`
auto-deploys.

## Status

Phase 0 (core UI on mock data) is complete and building green. Supabase wiring and the remaining
module UIs are the next milestones — see [`BUILD-STATUS.md`](./BUILD-STATUS.md).
