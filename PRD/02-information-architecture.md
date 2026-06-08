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
│ ─ CONTROLS    │                                                        │
│ • Fallbacks   │                                                        │
│ • Thresholds  │                                                        │
│ • Flag Queue  │                                                        │
│ ─ BUSINESS 🔒 │                                                        │
│ • Health/MRR  │                                                        │
│ ─ QA Bench(P2)│                                                        │
└───────────────┴──────────────────────────────────────────────────────┘
```

- 🔒 = SuperAdmin-only sections (hidden entirely for `User`).
- **Global filters** (Org / Project / Time-range) live in the top bar and apply across modules.
  `User` sees only their assigned project(s) and no Org switcher.
- **View-as** switcher (SuperAdmin only) toggles the SuperAdmin/User experience for the demo.
- **◐** = light/dark theme toggle. **⚙︎** = settings.

## 2. Sitemap & routes

| Section | Route | Module doc | Role |
|---------|-------|-----------|------|
| Overview | `/` | 05 | both |
| **Observe** | | | |
| Cost & Margin | `/cost` | 03, 05 | SuperAdmin (User: see 01 §4) |
| Performance | `/performance` | 05 | both |
| Call Logs | `/calls` | 05 | both |
| Call detail | `/calls/[callId]` | 05, 06 | both |
| Issues | `/issues` | 05 | both (config: SuperAdmin) |
| **Infra** | | | |
| Live Operations | `/live` | 07 | both (scoped) |
| Kubernetes | `/infra/kubernetes` | 06 | SuperAdmin |
| AWS ELB | `/infra/elb` | 06 | SuperAdmin |
| **Controls** | | | |
| Fallbacks | `/controls/fallbacks` | 08 | SuperAdmin |
| Thresholds | `/controls/thresholds` | 05 | SuperAdmin |
| Flag Queue | `/controls/flags` | 10 | SuperAdmin |
| **Business** | | | |
| Business Health | `/business` | 09 | SuperAdmin |
| **QA Bench** | | | |
| Evals | `/qa-bench` | 11 | both (Phase 2) |

## 3. The "Overview" landing page

Role-aware home that answers the most important question first.

**SuperAdmin Overview** (cost-first, per principle G1):
1. **KPI strip:** Total Cost (period) · Total Revenue · **Blended Margin %** · Active Calls (now) · Active Issues.
2. **Margin by org** (bar) + **Cost by service** (stacked area: LLM/STT/TTS/telephony/cloud).
3. **Projects table:** project · org · calls · avg latency · cost · revenue · **margin %** · health.
4. **Active issues** (critical first) + **Flag queue** count.
5. **Live snippet:** concurrent calls + a link into Live Operations.

**User Overview** (performance-first, financials removed):
1. KPI strip: Calls (period) · Avg latency · Error rate · Active calls (now).
2. Performance trend + call end reason donut.
3. Their projects' call logs + recent error logs.

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
