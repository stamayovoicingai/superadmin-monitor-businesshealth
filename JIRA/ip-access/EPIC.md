# EPIC — IP Access Control (`IPACC`)

**Route:** `/controls/access` · **Roles:** SuperAdmin · **Priority:** P3 (Wave 3)
**Blocked by:** `_platform` (`PLAT-BE1`, `PLAT-BE3`)

## Goal
Whitelist/blacklist IPs for platform.voicing.ai, per org or project: two lists (allow/block) + an
explicit **default policy** (allow=blacklist mode / block=whitelist mode), IPv4 + CIDR, org→project
inheritance, and an IP tester. **Rules must be enforced at the real ingress** (the MVP only stores +
simulates evaluation).

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/controls/access/page.tsx` · engine `src/lib/engine/ip.ts` (`evaluateIp`, CIDR)
- shapes `source.ts` (`IpRulesResult`, `AddIpRuleInput`, `SetIpPolicyInput`), `src/app/api/access/route.ts`, `PRD/16`

## Features
- F1 — IP rules & policy API · F2 — Ingress enforcement · F3 — IP Access UI · F4 — QA

## Tasks
- `BE-1-ip-rules-api.md` (`IPACC-BE1`)
- `BE-2-ingress-enforcement.md` (`IPACC-BE2`)
- `FE-1-ip-access-ui.md` (`IPACC-FE1`)
- `QA-1-ip-access-tests.md` (`IPACC-QA1`)
