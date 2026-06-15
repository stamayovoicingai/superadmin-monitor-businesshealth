# EPIC — Cost & Margin

**Route:** `/cost` · **Roles:** SuperAdmin (full), User (cost-to-serve only) · **Priority:** #1

## Goal
Give the Voicing team an accurate, real-time view of **what each call/project/org costs us**, **what
we charge**, and **the margin** — broken down by service (LLM / STT / TTS / telephony / cloud). This
is the platform's most important capability.

## Outcome
- Per-call cost computed from real provider usage × effective-dated pricing.
- Revenue from per-org contracts (Pure Usage and MGF, reading B1) → margin and MRR.
- Dashboard with KPIs, cost-by-service over time, cost vs revenue, and a per-project margin table.
- Strict financial gating: `User` sees cost-to-serve only; revenue/margin are SuperAdmin-only.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/cost/page.tsx`
- Engine (port to Python): `src/lib/engine/cost.ts`, `src/lib/engine/pricing.ts`, `src/lib/engine/aggregate.ts`
- Contract/API shapes: `src/lib/data/source.ts` (`CostResult`), mock: `src/lib/data/mock.ts` (`cost()`)
- PRD: `PRD/03-cost-revenue-margin.md`

## Features
- F1 — Cost ingestion & pricing engine (BE)
- F2 — Revenue, margin & MRR engine (BE)
- F3 — Cost & Margin API (BE)
- F4 — Cost & Margin dashboard (FE)
- F5 — Financial gating / RBAC (FE+BE)
- F6 — QA

## Tasks
- `BE-1-cost-ingestion-pipeline.md`
- `BE-2-pricing-catalog.md`
- `BE-3-revenue-margin-mrr-engine.md`
- `BE-4-cost-margin-api.md`
- `FE-1-cost-margin-dashboard.md`
- `FE-2-financial-gating.md`
- `QA-1-cost-margin-tests.md`
