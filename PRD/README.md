# Voicing AI — SuperAdmin Platform · PRD

> Internal demo/mockup of the Voicing AI SuperAdmin platform.
> Authored through the combined lens of Product Manager + Software Architect + Backend + Frontend + UX/UI Designer.

## How this PRD is organized

| # | Document | Status |
|---|----------|--------|
| 00 | [Overview & Vision](./00-overview.md) | ✅ v1 |
| 01 | [Roles & Permissions (RBAC)](./01-roles-permissions.md) | ✅ v1 |
| 02 | [Information Architecture & Navigation](./02-information-architecture.md) | ✅ v1 |
| 03 | [⭐ Cost / Revenue / Margin Engine](./03-cost-revenue-margin.md) | ✅ v1 (priority #1) |
| 04 | [Data Sources (Infra)](./04-data-sources.md) | ✅ v1 |
| 05 | [Module: Observability (Dashboard)](./05-module-observability.md) | ✅ v1 |
| 06 | [Module: Infra Monitoring (k8s + ELB)](./06-module-infra-monitoring.md) | ✅ v1 |
| 07 | [Module: Live Operations](./07-module-live-operations.md) | ✅ v1 |
| 08 | [Module: Fallback Controls (STT/TTS/LLM)](./08-module-fallbacks.md) | ✅ v1 |
| 09 | [Module: Business Health Metrics](./09-module-business-health.md) | ✅ v1 |
| 10 | [Module: Call Flagging](./10-module-call-flagging.md) | ✅ v1 |
| 11 | [Module: QA Bench / Evals (Phase 2)](./11-module-qa-bench-evals.md) | ✅ design |
| 12 | [Data Model (entities / Supabase)](./12-data-model.md) | ✅ v1 |
| 13 | [Technical Architecture & mock→backend strategy](./13-technical-architecture.md) | ✅ v1 |
| 14 | [Design System (Voicing brand)](./14-design-system.md) | ✅ v1 |
| 15 | [Roadmap & Open Questions](./15-roadmap-open-questions.md) | ✅ v1 |
| 16 | [Module: IP Access Control (whitelist/blacklist)](./16-ip-access-control.md) | ✅ built |
| 17 | [Module: Assistant / Subagent Usage](./17-assistant-subagent-usage.md) | ✅ built |
| 18 | [Module: Service Health (Uptime-Kuma style)](./18-service-health.md) | ✅ built |
| 19 | [Module: Telephony Observability (SIP/RTP)](./19-module-telephony-observability.md) | 🔵 design |
| 20 | [Module: Access Management (User Provisioning)](./20-module-access-management.md) | 🔵 design |
| 21 | [Module: Invoicing (Automated Client Invoice Export)](./21-module-invoicing.md) | 🔵 design |

## Key decisions (discovery session, Jun 2026)

- **Type:** Hybrid — navigable prototype with realistic simulated data, **architected** to plug into a real backend (Supabase) without rewriting the frontend.
- **Audience:** Internal Voicing team (ops / infra / finance). No external customers.
- **Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Recharts + Supabase.
- **Roles v2 (Jul 2026):** `SuperAdmin` (full, unscoped) · `PM` (full, scoped to granted orgs/projects) ·
  `Dev` (ops-only, zero cost, scoped) · `Financial` (money-only, scoped). All internal; SuperAdmin
  provisions everyone else's scope via Access Management (doc 20). See doc 01 for the full model.
- **Priority #1:** Real per-service cost (LLM/STT/TTS/telephony/cloud) → Revenue → **Margin** per project/org.
- **Real-time:** Mixed. Only "Live Operations" updates live (simulated); everything else is snapshot + manual refresh with a "last updated" timestamp.
- **Seed scale:** Small and curated — ~3 orgs, ~6 projects.

## Pending from the user (partial blockers)

- [x] ~~**Brand kit**~~ → received; Platform palette adopted in doc 14.
- [x] ~~**Grafana JSON** (k8s + AWS ELB)~~ → received & mapped in doc 04.
- [x] ~~Confirm exact **MGF** mechanics~~ → confirmed B1 (doc 03 §3.2).
- [x] ~~`User` cost visibility~~ → confirmed: sees cost-to-serve, not revenue/margin (doc 01 §4).

## Language

All PRD artifacts and the product UI are authored in **English**.
