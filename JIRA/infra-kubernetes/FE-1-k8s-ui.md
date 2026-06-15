# [FE] Infra Kubernetes · UI · Dashboard wire + date range + log search

- **ID:** `K8S-FE1`
- **Type:** Frontend/UI-UX
- **Epic:** Infra: Kubernetes
- **Feature:** F2 — Kubernetes UI
- **Priority:** P2
- **Blocked by:** `K8S-BE1`
- **Blocks:** `K8S-QA1`
- **Components/Labels:** `frontend` `nextjs` `ui-ux` `charts` `infra`
- **Estimate:** 3
- **MVP reference:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth —
  `src/app/(dashboard)/infra/kubernetes/page.tsx`, `src/lib/hooks.ts` (`useInfraK8s`), `src/components/date-range-control.tsx`, `src/lib/fuzzy.ts`

## What
Wire the Kubernetes page (gauges, used/total stats, overall usage, pods/containers CPU&Mem, requests &
limits, restarts, deployment logs) to the real API, keeping the **per-tab date range** and **fuzzy log
search**.

## How (building on the MVP)
- Page exists with `useInfraK8s(range)` + `DateRangeControl` + fuzzy log filter. Point at `K8S-BE1`.
- Keep the memoized range query (avoid the infinite-refetch pitfall noted in the repo). Namespace from
  the project filter. Empty/error states; responsive.

## Why
Engineers need the familiar Grafana panels inside the platform with quick time scoping and log search.

## Acceptance Criteria
- [ ] All panels render real data; namespace + date range scope correctly.
- [ ] Fuzzy log search filters within the selected window; logs paginate/scroll.
- [ ] No refetch loop; loading/empty/error states; responsive.
