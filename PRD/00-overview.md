# 00 · Overview & Vision

## 1. Product summary

The **Voicing AI SuperAdmin Platform** is an internal control tower for the Voicing AI voice-agent
business. It gives the Voicing team a single place to observe **what is running**, **how well it
performs**, **what it costs**, and **how much margin it generates** — across every organization,
project, and agent on the platform.

This repository builds a **navigable demo** of that platform: high-fidelity UI driven by realistic
simulated data, architected so the same frontend can later read from a real backend (Supabase +
provider/billing integrations) with no rewrite.

## 2. Problem statement

Today, the data needed to run the Voicing business is fragmented across:
- Provider billing portals (OpenAI, Anthropic, Deepgram, ElevenLabs, Twilio, AWS/GCP/Azure…).
- Observability tooling (Grafana / Prometheus for k8s and AWS ELB).
- Call records, transcripts, recordings, and error logs.
- Contracts / finance spreadsheets (MGF, usage rates, MRR).

There is no unified view that answers, per project: *"Is it healthy, is it fast, what does it cost
us to run, what do we charge, and what is our margin?"* — and no operator surface to act
(configure thresholds, set provider fallbacks, flag bad calls, pause agents).

## 3. Goals (what success looks like for the demo)

| Goal | Why it matters |
|------|----------------|
| G1 — Make **cost & margin per project/service** unmistakably clear | Priority #1. The team must see real cost (LLM/STT/TTS/telephony/cloud), revenue, and margin at a glance. |
| G2 — Surface **operational health** (latency, errors, call outcomes) per project | Catch problems before customers do. |
| G3 — Show **infra monitoring** (k8s + ELB) inside the same pane | Correlate infra load/cost with call activity. |
| G4 — Demonstrate **SuperAdmin controls** (provider fallbacks, thresholds, flagging) | Prove the platform is operable, not just observable. |
| G5 — Prove **multi-tier scoping** (SuperAdmin vs User) | Show that financial data is gated from non-finance users. |
| G6 — Feel like a real product | Live Operations animates; tables filter; data is internally consistent. |

## 4. Non-goals (explicitly out of scope for v1 demo)

- External customer / org-admin login (all users are internal Voicing staff).
- Real provider/billing API integration (modeled with realistic pricing tables instead).
- Real Kubernetes/AWS connections (charts replicate Grafana dashboards with simulated series).
- Writing back to production (fallback configs, thresholds, agent pause are simulated state).
- QA Bench / Evals is **Phase 2** (designed in the PRD, not built in v1).

## 5. Primary users

| Persona | Role | Needs |
|---------|------|-------|
| **Ops / Platform Engineer (Voicing)** | SuperAdmin | Infra health, live calls, error logs, provider fallbacks, thresholds. |
| **Finance / Founder (Voicing)** | SuperAdmin | Cost, revenue, margin, MRR, churn, growth. |
| **Project / Delivery owner (Voicing)** | User | Performance of the project(s) they own — *without* company financials. |

See [01 · Roles & Permissions](./01-roles-permissions.md) for the full matrix.

## 6. Scope of v1 modules

**In v1 (build now):**
1. Observability Dashboard (cost, latency, call logs, active issues, issues by category).
2. Infra Monitoring (k8s cluster/pods/containers + AWS ELB).
3. Live Operations (active calls per pod, concurrency, call end reasons — live).
4. Cost / Revenue / Margin engine (cross-cutting, priority #1).
5. Fallback Controls (STT / TTS / LLM).
6. Business Health Metrics (usage + MRR/churn/growth/expansion).
7. Call Flagging with comments + review queue.

**Phase 2 (design only):**
8. QA Bench / Evals (evaluators, cronjobs, thresholds, auto-flag, agent pause).

## 7. Guiding principles

- **Modular, low-custom.** (Per Abhran: *"very modular and easy to build without a lot of custom
  development."*) Reuse shadcn/ui primitives + Recharts. Each module is a self-contained route
  with its own data adapter.
- **Cost first.** Every screen that shows activity should be one click from "what did this cost / earn us".
- **Data integrity over volume.** A small, curated, internally-consistent dataset beats large noisy data.
- **Backend-ready.** All data flows through a typed data-access layer (adapters) so `mock` →
  `supabase` is a config swap, not a refactor.

## 8. Glossary

| Term | Meaning |
|------|---------|
| **Org** | A Voicing customer organization (e.g., "TP Latam"). |
| **Project** | A deployment unit within an org (an agent or set of agents serving a use case). |
| **Agent** | A configured voice bot. A project may contain several. |
| **Call** | A single telephony session handled by an agent. |
| **Service** | A billable component of a call: LLM, STT, TTS, telephony, cloud/infra. |
| **Cost** | Voicing's real cost to operate (COGS), summed per service. |
| **Revenue** | What Voicing charges the org (usage and/or MGF). |
| **Margin** | Revenue − Cost, per call / project / org. |
| **MGF** | Minimum Guarantee Fee — contractual revenue floor (see doc 03). |
| **Disposition** | Outcome label of a call. |
| **Call end reason** | `USER_IDLE`, `USER_DISCONNECTED`, `CALL_TRANSFERRED`, `CALL_END_PHRASE_TRIGGERED`, `OTHER`. |
| **Pod** | Kubernetes pod running agent workloads; "active calls per pod" is a live metric. |
