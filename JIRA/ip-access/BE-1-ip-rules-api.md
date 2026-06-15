# [BE] IP Access · API · Rules, default policy & evaluation

- **ID:** `IPACC-BE1`
- **Type:** Backend
- **Epic:** IP Access Control
- **Feature:** F1 — IP rules & policy API
- **Priority:** P3
- **Blocked by:** `PLAT-BE1`, `PLAT-BE3`
- **Blocks:** `IPACC-BE2`, `IPACC-FE1`
- **Components/Labels:** `backend` `python` `postgres` `api` `security` `rbac`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/lib/engine/ip.ts`, `source.ts` (`IpRulesResult`, `AddIpRuleInput`, `SetIpPolicyInput`), `src/app/api/access/route.ts`, `PRD/16`

## What
CRUD for IP rules (allow/block, IPv4 or CIDR, per org/project), a per-scope **default policy**
(allow/block), org→project inheritance, and a server-side IP **evaluation** API. SuperAdmin-only.

## Why
Clients (e.g. TP) request blocking/allowlisting; the platform needs a managed, scoped engine — and a
correct evaluator shared by config (tester) and enforcement.

## How (building on the MVP)
- Port `evaluateIp` (block → allow → default policy; IPv4+CIDR) to the shared backend (the spec).
- Persist `ip_rule` + `ip_policy` (`PRD/12`); resolve a project's effective set = own + inherited org
  rules; default policy per scope.
- Endpoints: list (own+inherited+policy), add/delete rule, set policy, and evaluate(ip, scope).
- SuperAdmin-only.

## Acceptance Criteria
- [ ] CRUD + policy persist; inheritance (org→project) correct; CIDR matching correct.
- [ ] Evaluation matches `evaluateIp` semantics (block wins; allowlist gate; default policy).
- [ ] Shapes match the UI; SuperAdmin-only enforced.
