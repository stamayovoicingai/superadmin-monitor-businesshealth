# [QA] IP Access · QA · Rules, policy & enforcement scenarios

- **ID:** `IPACC-QA1`
- **Type:** QA
- **Epic:** IP Access Control
- **Feature:** F4 — QA
- **Priority:** P3
- **Blocked by:** `IPACC-BE2`, `IPACC-FE1`
- **Blocks:** —
- **Components/Labels:** `qa` `security`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/16`,
  `src/lib/engine/ip.ts`, `src/lib/data/source.ts` (`IpRulesResult`, `AddIpRuleInput`, `SetIpPolicyInput`)

## What / Why
Validate evaluation correctness, inheritance, default policy, and real ingress enforcement.

## How (building on the MVP)
- Treat the MVP mock/engine outputs as **golden fixtures**: assert the production API returns the same shapes/values as `src/lib/data/mock.ts` (and `src/lib/engine/ip.ts` where applicable) for the same scope+period.
- Validate the response against the `DataSource` shape `IpRulesResult` in `src/lib/data/source.ts`.
- Cover RBAC (SuperAdmin vs User — financial/SuperAdmin-only data must never reach User), loading/empty/error states, and scope/period correctness.
- Automate in CI: pytest for backend/engine logic, Playwright or RTL for the UI flows.

## Acceptance Criteria (scenarios)
- [ ] Block wins over allow; allowlist mode denies non-listed; blacklist mode allows by default.
- [ ] CIDR ranges match correctly; single IPs match; invalid input rejected.
- [ ] Project inherits org rules; per-scope default policy applied.
- [ ] Ingress actually blocks/allows real traffic; changes propagate within SLA; decisions audited.
- [ ] SuperAdmin-only management.
