# 20 · Module: Access Management (User Provisioning)

SuperAdmin controls **who can use the platform, as what role, and scoped to which orgs/projects**.
Route: `/controls/access-management`. **SuperAdmin only.** Introduced alongside the v2 role model
(doc 01): `PM`, `Dev`, and `Financial` are no longer generic previewable roles — each real person
holding one of them must be explicitly provisioned with a scope, or they see nothing.

---

## 1. Model

- **`AppUser`** — one row per provisioned person: `email`, `role` (`pm` \| `dev` \| `financial`;
  SuperAdmin identities aren't provisioned here, see §5), `grants[]`, `createdAt`.
- **`AccessGrant`** — same scoping shape as IP Access Control (doc 16), for consistency:
  `scopeType` (`org` \| `project`), `scopeId`. A user can hold multiple grants (e.g. all of Org A +
  one specific project in Org B).
- **Inheritance:** an **org-level** grant covers all current and future projects under that org
  (same semantics as doc 16 §3). A **project-level** grant covers only that project — the user does
  **not** get "all projects" for that project's org.
- Every `PM` / `Dev` / `Financial` user must have **at least one grant** to see any data. Zero grants
  = the platform shows them an empty/no-access state, not an error.

## 2. UI (`/controls/access-management`)

- **Provisioned users table**: email, role badge, granted scope (chips — org names in one color,
  individual project names in another, so org-level vs project-level grants are visually distinct),
  created date, edit/remove actions.
- **Add user** form: email (free text, validated as an email shape — no real auth/SSO in this demo),
  role select (PM/Dev/Financial), and a scope picker: multi-select **organizations** (grants org-level
  access) plus, independently, a multi-select of **individual projects** (grants project-level access
  to projects not already covered by a selected org).
- **Edit** reopens the same form pre-filled; **Remove** revokes all access immediately (client-side —
  see §4).
- A short empty-state / help card explains the model (org grant = whole org, inherited by its
  projects; project grant = just that project) so this isn't a mystery to whoever's provisioning.

## 3. Scope-picker UX implication (ties into doc 02 top bar)

When "View as" (doc 01 §2.1) previews a provisioned PM/Dev/Financial identity, the top-bar
Org/Project filters must reflect *that identity's* grants, not the global list:
- Org dropdown: only orgs the identity can see (via org grant, or via having ≥1 project grant in
  that org). No "All orgs" option — a scoped identity always operates within one of their orgs.
- Project dropdown (once an org is picked): if the identity has an **org-level** grant for that org,
  all its projects are selectable, **including "All projects."** If the identity has only
  **project-level** grants in that org, "All projects" is **not offered** — they must pick one of
  their specific granted projects.

## 4. Data & engine

- `AppUser` / `AccessGrant` (extends PRD/12): `id, email, role, grants: {scopeType, scopeId}[],
  createdAt`.
- `lib/auth/scope.ts` (new, pure): `effectiveOrgIds(user, projects)`, `effectiveProjectIds(user,
  projects)`, `canAccessOrg(user, orgId)`, `canAccessProject(user, projectId)`,
  `orgRequiresProjectPick(user, orgId)` (true when the user's access to that org is project-level
  only — drives the §3 "All projects" hide/show rule).
- API `/api/access-management` — `GET` (list provisioned users), `POST` (create), `PATCH` (update
  role/grants), `DELETE?id` (remove). Demo persists in-process (same posture as IP Access Control,
  doc 16 §5) — production needs a real `app_user` table plus actual authentication (SSO/magic-link),
  since today "provisioning an email" doesn't grant that email a real login, only a **preview**
  identity the SuperAdmin can switch into via "View as."
- Every module's data-fetching hook, when previewing a scoped identity, passes that identity's
  effective org/project constraint the same way the global Org/Project filter already scopes
  queries today (doc 13) — no new API contract per-module, just tighter input.

## 5. What this module does *not* do (yet)

- **No real authentication.** There's no login flow — "provisioning" a `PM`/`Dev`/`Financial` email
  here only makes that identity previewable via "View as" (doc 01 §2.1). Wiring this to real
  SSO/magic-link auth (so that email actually logs in as themselves, seeing only their scope, without
  a SuperAdmin manually switching) is production work, tracked as an open question below.
- **No SuperAdmin provisioning UI.** SuperAdmin access isn't grant-based — it's assumed to be a small,
  manually-managed list (e.g. an env var or a hardcoded allowlist) outside this screen's scope.

## 6. Open questions

- [ ] Real auth integration (SSO/magic-link) so provisioned users log in as themselves instead of
  being previewed — what identity provider does Voicing use internally?
- [ ] Should IP Access Control (doc 16) become delegable to PM for their own orgs/projects, or stay
  SuperAdmin-only permanently?
- [ ] Audit log for grant changes (who provisioned/revoked whom, when) — same retention question as
  doc 16 §6.
- [ ] Can one email hold grants under more than one role simultaneously (e.g. PM for Org A, Dev for
  Org B)? v1 assumes **one role per email** — revisit if that's too restrictive.
