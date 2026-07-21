# 01 · Roles & Permissions (RBAC)

> **v2 (Jul 2026):** expanded from 2 roles to 4, and from "SuperAdmin sees everything /
> everyone else is fixed" to a **provisioned, scoped-access model**: SuperAdmin grants each
> non-SuperAdmin email a role **and** the specific orgs/projects they may see. See doc 20 for the
> Access Management screen that manages these grants.

All users are **internal Voicing AI staff** — there are no external customer logins in the demo.

## 1. Roles in v2

| Role | Description | Scope |
|------|-------------|-------|
| **SuperAdmin** | Full access to everything: all orgs, projects, costs, revenue & margin, business health, infra, and all controls. The only role that can provision access for everyone else. | Global, unrestricted |
| **PM** | Project/delivery owner. Sees **everything** SuperAdmin sees — operations *and* financials (cost, revenue, margin) — but only for the orgs/projects a SuperAdmin explicitly granted them. | Assigned org(s)/project(s) only |
| **Dev** | Engineer/operator focused on **service health**. Sees performance, call logs (no cost), live operations, issues, infra monitoring (k8s/ELB/Telephony), service health, and operator controls (fallbacks, thresholds, flag queue). **Never sees any cost, revenue, margin, or business-health figure — not even cost-to-serve.** | Assigned org(s)/project(s) only |
| **Financial** | Finance/founder tracking the business. Sees **only** money: Cost & Margin and Business Health (MRR/churn/growth). No operational modules (no call logs, no infra, no live ops, no controls). | Assigned org(s)/project(s) only |

> Renames `User` → `Dev` and splits its old "sees cost-to-serve, not revenue/margin" middle ground:
> that ambiguous tier no longer exists. In v2 you either see **all** money for your scope (SuperAdmin,
> PM, Financial) or **none** (Dev) — simpler to reason about and to enforce.

**Non-goal (still true in v2):** no external customer/org-admin login. All 4 roles are internal
Voicing staff; scoping is about *which orgs/projects an internal employee may see*, not multi-tenant
customer access.

## 2. Access provisioning (new in v2)

Previously the demo only had a role-preview switcher. Now access is **explicitly provisioned**:

- **SuperAdmin maintains a list of provisioned users**: `email → role → access grants` (see doc 20,
  `/controls/access-management`). A grant is either **org-level** (the whole org, all its projects) or
  **project-level** (one specific project) — same scoping shape already used by IP Access Control
  (doc 16), for consistency.
- **PM, Dev, and Financial are always scoped** — a provisioned user of any of these 3 roles must have
  at least one grant, or they see nothing.
- **SuperAdmin is never scoped** — no grants needed, always sees everything. (SuperAdmin identities
  aren't stored as grant rows; they're implicitly unrestricted.)
- If a user's grants are **org-level**, all current and future projects under that org are visible
  (inheritance, same semantics as IP Access Control's org→project inheritance).
- If a user's grants are **project-level only** for an org, they see just those specific projects —
  the "all projects" option is unavailable to them for that org (see doc 20 §3 for the UI
  implication).

### 2.1 Demo role/identity switching

The **"View as" switcher** now works in two steps: pick a **role**, then — for PM/Dev/Financial —
pick **which provisioned identity** to preview (their exact grants differ per person). SuperAdmin has
no second step. Switching identity:
- Applies that identity's module visibility (per §3 below).
- Constrains the Org/Project top-bar filters to that identity's granted orgs/projects (can't select
  outside their scope; "All orgs" is unavailable — a scoped identity must always operate within an
  org they're granted).

## 3. Module → role visibility

| Module | SuperAdmin | PM | Dev | Financial |
|---|:---:|:---:|:---:|:---:|
| Overview | ✅ (financial view) | ✅ (financial view, scoped) | ✅ (ops-only view, scoped) | ✅ (financial view, scoped) |
| Cost & Margin | ✅ | ✅ scoped | ❌ | ✅ scoped |
| Business Health | ✅ | ✅ scoped | ❌ | ✅ scoped |
| Performance | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Call Logs / Call Detail | ✅ (with cost) | ✅ scoped (with cost) | ✅ scoped (**no cost**) | ❌ |
| Live Operations | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Issues | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Infra: Kubernetes / AWS ELB | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Infra: Telephony (SIP/RTP) | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Service Health | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Fallback Controls | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Thresholds | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Flag Queue / Call Flagging | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Assistant Usage (subagent cost) | ✅ | ✅ scoped | ❌ | ✅ scoped |
| Invoicing (doc 21) | ✅ | ✅ scoped | ❌ | ✅ scoped |
| IP Access Control | ✅ | ❌ | ❌ | ❌ |
| Access Management (doc 20) | ✅ | ❌ | ❌ | ❌ |
| QA Bench (Phase 2) | ✅ | ✅ scoped | ✅ scoped | ❌ |
| Design System (`/design`) | ✅ | ✅ | ✅ | ✅ |

Notes:
- **IP Access Control stays SuperAdmin-only**, even for PM — it's a network/security control, not a
  project-performance or financial concern, and delegating it risks fragmenting a security policy
  across many people. *(Open question — revisit if the team wants PM to self-serve IP rules for
  their own projects.)*
- **Assistant Usage** (subagent cost, doc 17) is cost data, so it follows the money split, not the
  ops split — Dev doesn't get it even though it's technically "platform usage."
- A module marked "❌" is hidden from the sidebar **and** blocked if navigated to directly (existing
  MVP pattern — an in-page guard, not just nav-hiding; see doc 13).

## 4. Overview page, per role

- **SuperAdmin / PM / Financial** (financial view): KPI strip (Total Cost, Revenue, Margin %,
  Assistant Cost, Active Calls) → cost-by-service + margin/cost-by-org charts → projects table with
  cost/revenue/margin. PM/Financial: pre-filtered to their granted scope.
- **Dev** (ops-only view): KPI strip (Total Calls, Avg Latency, Error Rate, Active Calls) → a
  calls-by-project chart → projects table with calls/avg latency/error rate (**no cost column**).
  Scoped to their granted projects.

## 5. Permission matrix (capability detail)

| Capability | SuperAdmin | PM | Dev | Financial |
|---|:---:|:---:|:---:|:---:|
| View all orgs/projects | ✅ | ❌ (granted only) | ❌ (granted only) | ❌ (granted only) |
| Latency metrics, call logs | ✅ | ✅ | ✅ | ❌ |
| Call cost (USD, cost-to-serve) | ✅ | ✅ | ❌ | ✅ |
| Revenue / margin (call, project, org) | ✅ | ✅ | ❌ | ✅ |
| MRR / churn / growth / expansion | ✅ | ✅ | ❌ | ✅ |
| Configure thresholds / issue categories | ✅ | ✅ | ✅ | ❌ |
| k8s / AWS ELB / Telephony dashboards | ✅ | ✅ | ✅ | ❌ |
| Error logs, recordings, live calls | ✅ | ✅ | ✅ | ❌ |
| STT/TTS/LLM fallback config | ✅ | ✅ | ✅ | ❌ |
| Flag a call + comment | ✅ | ✅ | ✅ | ❌ |
| Flag review queue (triage) | ✅ | ✅ | ✅ | ❌ |
| Provision users (role + org/project grants) | ✅ | ❌ | ❌ | ❌ |
| IP allow/blocklist | ✅ | ❌ | ❌ | ❌ |

## 6. Auth model

- Claims: `role` (`superadmin` \| `pm` \| `dev` \| `financial`) + `grants[]` (each `{scopeType: "org"
  \| "project", scopeId}`). SuperAdmin carries no grants (implicit `*`).
- Permission checks live in a single `src/lib/auth/policy.ts` — the UI's (and future backend's)
  single source of truth. Category predicates (`canSeeFinancials`, `canSeeOpsModules`,
  `isSuperAdmin`) replace the old binary `canSeeSuperAdminOnly`.
- Effective org/project scope for a non-SuperAdmin identity is resolved from their grants (with
  org→project inheritance) by a shared helper, used both to filter API results and to constrain the
  Org/Project pickers in the UI — same posture as everywhere else in this MVP: **enforced
  client-side today, must be enforced server-side (RLS/API middleware) in production.**

## 7. Migration notes from v1

- `User` role is renamed `Dev`; anywhere the old docs say "User sees cost-to-serve," that's now
  false — Dev sees **zero** cost. If any historical Dev/PM workflow genuinely needs cost-to-serve
  without full financials, that's a new "partial" tier we deliberately did **not** build — flag if
  it turns out to be needed.
- The 3-tier "SuperAdmin / Org Admin / User" idea from the original discovery doc is superseded by
  this 4-role + grants model — Org Admin's intent (an admin scoped to one org) is now just "PM
  granted every project in one org."
