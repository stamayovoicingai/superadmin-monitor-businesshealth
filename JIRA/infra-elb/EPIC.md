# EPIC — Infra: AWS ELB (`ELB`)

**Route:** `/infra/elb` · **Roles:** SuperAdmin · **Priority:** P2 (Wave 2)
**Blocked by:** `_platform` (`PLAT-BE1`) + a CloudWatch source

## Goal
Replicate the real Grafana "AWS ELB Application Load Balancer" dashboard (CloudWatch
`AWS/ApplicationELB`): RequestCount/TargetResponseTime, HTTPCode_Target, HTTPCode_ELB, ConnectionCount,
ConsumedLCUs/ProcessedBytes, TLS errors, IPv6, RuleEvaluations, Auth — with a per-tab date range.

## MVP reference
Repo: https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
- UI: `src/app/(dashboard)/infra/elb/page.tsx` · shapes `source.ts` (`ElbResult`)
- Metrics mapped in `PRD/04-data-sources.md` §5 (CloudWatch) + `PRD/06`

## Features
- F1 — CloudWatch integration & metrics API · F2 — ELB UI · F3 — QA

## Tasks
- `BE-1-elb-metrics-api.md` (`ELB-BE1`)
- `FE-1-elb-ui.md` (`ELB-FE1`)
- `QA-1-elb-tests.md` (`ELB-QA1`)
