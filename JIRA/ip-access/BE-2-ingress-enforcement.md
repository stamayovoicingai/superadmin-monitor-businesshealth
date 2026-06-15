# [BE] IP Access · Enforcement · Apply rules at platform ingress

- **ID:** `IPACC-BE2`
- **Type:** Backend
- **Epic:** IP Access Control
- **Feature:** F2 — Ingress enforcement
- **Priority:** P3
- **Blocked by:** `IPACC-BE1`
- **Blocks:** `IPACC-QA1`
- **Components/Labels:** `backend` `security` `infra` `edge`
- **Estimate:** 5
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth — `PRD/16` §5

## What
Enforce the IP rules/default policy at the real ingress for platform.voicing.ai (edge/WAF/gateway or
app middleware), so disallowed IPs are actually blocked and allowlist mode restricts access.

## Why
The MVP stores rules and simulates evaluation; protection is only real when traffic is actually
filtered at ingress.

## How (building on the MVP)
- Resolve the effective ruleset/policy per request scope (org/project) using `IPACC-BE1`.
- Apply at the chosen enforcement point (AWS WAF/ALB rules, gateway, or middleware); cache rules with
  fast invalidation on change.
- Log decisions for audit; fail safe (define behavior on rule-store unavailability).

## Acceptance Criteria
- [ ] Blocked IPs/CIDRs are denied at ingress; allowlist mode denies non-listed IPs.
- [ ] Rule changes take effect within a bounded propagation time.
- [ ] Decisions are logged/auditable; defined fail-safe behavior.
- [ ] Inheritance + default policy applied correctly at runtime.
