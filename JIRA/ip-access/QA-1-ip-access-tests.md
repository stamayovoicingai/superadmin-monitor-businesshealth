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
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/16`

## What / Why
Validate evaluation correctness, inheritance, default policy, and real ingress enforcement.

## Acceptance Criteria (scenarios)
- [ ] Block wins over allow; allowlist mode denies non-listed; blacklist mode allows by default.
- [ ] CIDR ranges match correctly; single IPs match; invalid input rejected.
- [ ] Project inherits org rules; per-scope default policy applied.
- [ ] Ingress actually blocks/allows real traffic; changes propagate within SLA; decisions audited.
- [ ] SuperAdmin-only management.
