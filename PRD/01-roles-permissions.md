# 01 · Roles & Permissions (RBAC)

## 1. Roles in v1

All users are **internal Voicing AI staff** — there are no external customer logins in the demo.

| Role | Description | Scope |
|------|-------------|-------|
| **SuperAdmin** | Full access to everything: all orgs, projects, costs, **revenue & margin**, business health, infra, and all controls (fallbacks, thresholds, flagging review, agent pause). | Global |
| **User** | Internal Voicing staff scoped to **project performance only**. Sees operational health and activity for assigned project(s). **Does NOT see company financials** (revenue, margin, MRR, churn, expansion). | Assigned project(s) |

> Note: The original discovery doc described a 3-tier model (SuperAdmin / Org Admin / User) for the
> eventual product. For this internal demo we collapse to **2 roles**, both internal. The data model
> still carries `org_id` scoping so the Org-Admin tier can be reintroduced later without rework.

## 2. Demo role-switching

To demonstrate scoping without building separate apps, the SuperAdmin UI includes a
**"View as" switcher** (SuperAdmin ↔ User → pick project). Switching to `User`:
- Hides all financial surfaces (Revenue, Margin, Business Health, MRR/churn).
- Restricts data to the selected project(s).
- Keeps performance, call logs, recordings, error logs, and call end reasons visible.

## 3. Permission matrix

| Capability | SuperAdmin | User |
|------------|:---------:|:----:|
| **Observability** | | |
| View all orgs/projects | ✅ | ❌ (assigned only) |
| Latency metrics (overall + per-service) | ✅ | ✅ |
| Call logs (id, agent, date, duration, disposition, latency) | ✅ | ✅ |
| Call **cost** in USD (cost-to-serve) | ✅ | ✅ |
| **Revenue** per call/project/org | ✅ | ❌ |
| **Margin** per call/project/org | ✅ | ❌ |
| Active issues + thresholds (view) | ✅ | ✅ |
| Configure thresholds | ✅ | ❌ |
| Configure issue categories | ✅ | ❌ |
| **Infra Monitoring** | | |
| k8s cluster/pods/containers dashboards | ✅ | ⚠️ project-scoped pods only |
| AWS ELB dashboards | ✅ | ❌ |
| Error logs (calls) | ✅ | ✅ (assigned project) |
| Recordings playback | ✅ | ✅ (assigned project) |
| **Live Operations** | | |
| Active calls per pod / concurrency | ✅ | ✅ (assigned project) |
| Call end reason breakdown | ✅ | ✅ (assigned project) |
| **Controls** | | |
| STT / TTS / LLM fallback config | ✅ | ❌ |
| Pause / resume agent | ✅ | ❌ (Phase 2: maybe view-only) |
| **Call Flagging** | | |
| Flag a call + comment | ✅ | ✅ |
| Flag review queue (triage) | ✅ | ❌ |
| **Business Health** | | |
| Usage timeseries (minutes, calls, callers) | ✅ | ❌ |
| MRR / churn / growth / expansion | ✅ | ❌ |
| **QA Bench (Phase 2)** | | |
| Create evaluators, schedules, thresholds | ✅ | ✅ (assigned project) |

## 4. User visibility of per-call cost — ✅ resolved

**Confirmed (Jun 2026):** `User` **sees cost-to-serve (USD)** — i.e. the per-call / per-project
operating cost broken down by service (LLM/STT/TTS/telephony/cloud) — but **never sees revenue,
margin, MRR, churn, or any business-health financials.**

Implication for the UI:
- The **Cost & Margin** module renders in a *cost-only* variant for `User`: cost KPIs, cost-by-service,
  cost/call, cost outliers — with **all revenue & margin columns/charts hidden**.
- Business Health (`/business`) remains fully SuperAdmin-only.

## 5. Future-proofing

- The auth model uses `role` + `org_id` + `project_ids[]` claims. Reintroducing **Org Admin**
  later = add a role whose `org_id` is fixed and whose financial visibility is limited to its own org.
- Permission checks live in a single `can(user, action, resource)` policy module so the UI and
  (future) backend share one source of truth.
