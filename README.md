# Voicing AI — SuperAdmin Platform

Internal control tower for the Voicing AI voice-agent business: observability, **cost & margin**,
infrastructure monitoring and operator controls — across every organization, project and agent.

This is a **navigable demo** (high-fidelity UI on realistic simulated data) architected to plug into
a real backend (Supabase + provider/billing integrations) without a frontend rewrite.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui (Base UI) · Recharts ·
TanStack Query/Table · Supabase (planned) · next-themes.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000  → /overview
npm run build    # production build + typecheck
```

By default the app reads from a deterministic in-memory mock dataset (`DATA_SOURCE=mock`). A Supabase
adapter can be enabled later via env (see `BUILD-STATUS.md`).

## What's inside

- **Overview** — role-aware KPIs, cost-by-service, margin by org, projects table.
- **Cost & Margin** — real per-service cost (LLM/STT/TTS/telephony/cloud), revenue and margin (priority #1).
- **Performance** — latency (overall + per service) and error rate.
- **Call Logs / Call Detail** — filterable history, transcript, recording, latency waterfall, per-service cost.
- **Live Operations** — active calls per pod, status & end-reason breakdowns (auto-refresh).
- Modules designed and stubbed: Issues/Thresholds, Infra (k8s + AWS ELB), Fallbacks, Business Health,
  Flag Queue, QA Bench.

Two roles: **SuperAdmin** (full access incl. financials) and **User** (project performance +
cost-to-serve, no revenue/margin). Use the **"View as"** switcher to preview scoping.

## Documentation

- **`PRD/`** — full product requirements (00–15): vision, roles, IA, cost/revenue/margin engine,
  data sources (mapped from real Grafana dashboards), module specs, data model, architecture, design system.
- **`BUILD-STATUS.md`** — current build state, conventions, and what's pending.

> Confidential — internal Voicing AI use only.
