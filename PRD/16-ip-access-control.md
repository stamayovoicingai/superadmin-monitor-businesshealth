# 16 · Module: IP Access Control (Whitelist / Blacklist)

SuperAdmin controls who can reach **platform.voicing.ai**, per organization or project. Clients (e.g.
TP) may ask Voicing to **block** specific people/ranges or to **restrict** access to an allowlist.
Route: `/controls/access`. **SuperAdmin only.**

---

## 1. Model

Each scope (org **or** project) has **two independent lists**:

- **Allowlist** — if it has any entries, only matching IPs are permitted (default-deny gate).
- **Blocklist** — listed IPs are always denied.

**Resolution order (block wins):**
1. If the IP matches any **block** rule → **BLOCKED**.
2. Else if an **allowlist exists** → permitted only if it matches an allow rule; otherwise **BLOCKED**
   (not in allowlist).
3. Else (no allowlist) → **ALLOWED** (default).

## 2. Entries

- `value` accepts a single **IPv4** address (e.g. `198.51.100.23`) or a **CIDR** range
  (e.g. `203.0.113.0/24`). (IPv6 is a later enhancement.)
- Each rule carries a `label`/reason, `addedBy`, `createdAt`.

## 3. Scope & inheritance

- Rules are defined at **org** or **project** scope.
- **Org rules inherit to all its projects.** A project's **effective** rule set = its own rules +
  its org's rules. Project rules are managed at the project; inherited org rules show **read-only**.
- Managing scope follows the global Org/Project filter (top bar). With none selected, all rules are
  shown read-only.

## 4. UI (`/controls/access`)

- **Allowlist** and **Blocklist** cards for the current scope — list entries, add (IP/CIDR + label),
  delete. Invalid input is rejected.
- **Inherited from organization** panel (read-only) when a project is selected.
- **Test an IP** widget — evaluate an address against the effective rules and show ALLOWED/BLOCKED +
  the matching rule/reason.

## 5. Data & engine

- `IpRule` (PRD/12 to extend): `id, scopeType (org|project), scopeId, listType (allow|block), value,
  label, addedBy, createdAt`.
- `lib/engine/ip.ts` — pure: `ipToLong`, `ipMatches` (IPv4 + CIDR), `isValidIpOrCidr`, `evaluateIp`.
- API `/api/access` — `GET` (own + inherited for scope), `POST` (add, validates IP/CIDR),
  `DELETE?id` (remove). Demo persists in-process; production → table + enforcement at the edge/gateway.

## 6. Open questions
- [ ] IPv6 support.
- [ ] Enforcement point in production (edge/WAF/gateway vs app middleware).
- [ ] Audit log retention for rule changes (who/when already captured).
