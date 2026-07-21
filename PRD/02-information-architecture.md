# 02 · Information Architecture & Navigation

## 1. Navigation model

A persistent **left sidebar** + a **global top bar**.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Voicing] Org ▾  Project ▾  Time-range ▾        🔍   View-as ▾   ◐  ⚙︎ │  ← Top bar (global filters)
├───────────────┬──────────────────────────────────────────────────────┤
│ SIDEBAR       │                                                        │
│ ◎ Overview    │                                                        │
│ ─ OBSERVE     │            < main content area >                       │
│ • Cost & Margin│                                                       │
│ • Performance │                                                        │
│ • Call Logs   │                                                        │
│ • Issues      │                                                        │
│ ─ INFRA       │                                                        │
│ • Live Ops    │                                                        │
│ • Kubernetes  │                                                        │
│ • AWS ELB     │                                                        │
│ • Telephony   │                                                        │
│ ─ CONTROLS    │                                                        │
│ • Fallbacks   │                                                        │
│ • Thresholds  │                                                        │
│ • Flag Queue  │                                                        │
│ ─ BUSINESS 💰 │                                                        │
│ • Health/MRR  │                                                        │
│ ─ QA Bench(P2)│                                                        │
│ ─ ADMIN 🔒    │                                                        │
│ • IP Access   │                                                        │
│ • Access Mgmt │                                                        │
└───────────────┴──────────────────────────────────────────────────────┘
```

- 🔒 = SuperAdmin-only. 💰 = money-visibility gated (SuperAdmin/PM/Financial). Everything else is
  gated per-module by role (doc 01 §3) — sections are hidden entirely for roles that can't see them.
- **Global filters** (Org / Project / Time-range) live in the top bar. For `PM`/`Dev`/`Financial`,
  Org/Project are **constrained to that identity's provisioned grants** (doc 20 §3) — no "All orgs."
- **View-as** switcher (SuperAdmin only) picks a role, then — for PM/Dev/Financial — which
  **provisioned identity** to preview (doc 01 §2.1).
- **◐** = light/dark theme toggle. **⚙︎** = settings.

## 2. Sitemap & routes

| Section | Route | Module doc | Role |
|---------|-------|-----------|------|
| Overview | `/` | 05 | all 4 (financial view: SuperAdmin/PM/Financial · ops view: Dev) |
| **Observe** | | | |
| Cost & Margin | `/cost` | 03, 05 | SuperAdmin / PM / Financial (scoped for PM/Financial) |
| Performance | `/performance` | 05 | SuperAdmin / PM / Dev (scoped for PM/Dev) |
| Call Logs | `/calls` | 05 | SuperAdmin / PM / Dev (scoped; cost hidden for Dev) |
| Call detail | `/calls/[callId]` | 05, 06 | SuperAdmin / PM / Dev (scoped; cost hidden for Dev) |
| Issues | `/issues` | 05 | SuperAdmin / PM / Dev (scoped) |
| **Infra** | | | |
| Live Operations | `/live` | 07 | SuperAdmin / PM / Dev (scoped) |
| Kubernetes | `/infra/kubernetes` | 06 | SuperAdmin / PM / Dev (scoped) |
| AWS ELB | `/infra/elb` | 06 | SuperAdmin / PM / Dev (scoped) |
| Telephony (SIP/RTP) | `/infra/telephony` | 19 | SuperAdmin / PM / Dev (scoped) |
| Telephony call detail | `/infra/telephony/[callId]` | 19 | SuperAdmin / PM / Dev (scoped) |
| Service Health | `/health` | 18 | SuperAdmin / PM / Dev (scoped) |
| **Controls** | | | |
| Fallbacks | `/controls/fallbacks` | 08 | SuperAdmin / PM / Dev (scoped) |
| Thresholds | `/controls/thresholds` | 05 | SuperAdmin / PM / Dev (scoped) |
| Flag Queue | `/controls/flags` | 10 | SuperAdmin / PM / Dev (scoped) |
| **Business** | | | |
| Business Health | `/business` | 09 | SuperAdmin / PM / Financial (scoped for PM/Financial) |
| Assistant Usage | `/assistant` | 17 | SuperAdmin / PM / Financial (scoped for PM/Financial) |
| Invoicing | `/invoicing` | 21 | SuperAdmin / PM / Financial (scoped for PM/Financial) |
| **QA Bench** | | | |
| Evals | `/qa-bench` | 11 | SuperAdmin / PM / Dev (scoped, Phase 2) |
| **Admin** | | | |
| IP Access Control | `/controls/access` | 16 | SuperAdmin only |
| Access Management | `/controls/access-management` | 20 | SuperAdmin only |

## 3. The "Overview" landing page

Role-aware home that answers the most important question first (doc 01 §4).

**Financial view** (SuperAdmin / PM / Financial — cost-first, per principle G1):
1. **KPI strip:** Total Cost (period) · Total Revenue · **Blended Margin %** · Assistant Cost · Active Calls (now).
2. **Margin by org** (bar) + **Cost by service** (stacked area: LLM/STT/TTS/telephony/cloud).
3. **Projects table:** project · org · calls · avg latency · cost · revenue · **margin %**.
4. PM/Financial: pre-filtered to their granted orgs/projects; SuperAdmin: everything.

**Ops-only view** (Dev — performance-first, zero cost):
1. KPI strip: Total Calls (period) · Avg latency · Error rate · Active calls (now).
2. Calls-by-project chart.
3. Projects table: project · org · calls · avg latency · error rate — **no cost/revenue/margin column**.
4. Scoped to Dev's granted projects.

## 4. Cross-module interaction patterns

- **Drill-down is consistent:** every aggregate (chart point, table row) drills to a filtered
  list and ultimately to a **Call Detail** page (transcript + recording + per-service cost &
  latency + error logs + flag action).
- **Filter persistence:** Org/Project/Time-range persist in the URL query string (shareable,
  deep-linkable, backend-ready).
- **Empty/loading/error states** are first-class for every data surface.

## 5. Time-range control

Presets: `Live` · `Last 1h` · `Last 24h` · `Last 7d` · `Last 30d` · `Custom`.
- `Live` only meaningful in Live Operations.
- Default: `Last 24h`.
- Every snapshot view shows a **"Last updated HH:MM"** chip + manual **Refresh**.
