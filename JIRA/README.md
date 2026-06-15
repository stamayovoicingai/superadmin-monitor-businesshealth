# Jira Backlog — Voicing AI SuperAdmin Platform

Production backlog to take the **SuperAdmin MVP** to a real, backend-connected product. One folder
per **tab/module** (= one **Epic**). Each Epic folder contains an `EPIC.md` and one file per **task**
(one Jira issue), split by discipline: **Backend (BE)**, **Frontend/UI-UX (FE)**, **QA**.

> **MVP reference repo:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
> Every task links to the exact MVP files so devs can see the working prototype before building.

Read **[`CONVENTIONS.md`](./CONVENTIONS.md)** first (issue template, types, labels, estimation, IDs,
priority scale, and the MVP→production framing) and **[`ROADMAP.md`](./ROADMAP.md)** for the global
**priority tiers, dependency graph, and delivery waves** (what to build first, what blocks what).

## Epics (one per tab)

| # | Epic (tab) | Folder | App route |
|---|------------|--------|-----------|
| E1 | Overview | [`overview/`](./overview/) | `/overview` |
| E2 | Cost & Margin ⭐ | [`cost-margin/`](./cost-margin/) | `/cost` |
| E3 | Performance | [`performance/`](./performance/) | `/performance` |
| E4 | Call Logs & Call Detail | [`call-logs/`](./call-logs/) | `/calls`, `/calls/[id]` |
| E5 | Live Operations | [`live-operations/`](./live-operations/) | `/live` |
| E6 | Issues | [`issues/`](./issues/) | `/issues` |
| E7 | Thresholds | [`thresholds/`](./thresholds/) | `/controls/thresholds` |
| E8 | Call Flagging | [`call-flagging/`](./call-flagging/) | `/controls/flags` |
| E9 | Fallback Controls | [`fallbacks/`](./fallbacks/) | `/controls/fallbacks` |
| E10 | IP Access Control | [`ip-access/`](./ip-access/) | `/controls/access` |
| E11 | Service Health | [`service-health/`](./service-health/) | `/health` |
| E12 | Infra — Kubernetes | [`infra-kubernetes/`](./infra-kubernetes/) | `/infra/kubernetes` |
| E13 | Infra — AWS ELB | [`infra-elb/`](./infra-elb/) | `/infra/elb` |
| E14 | Assistant Usage (subagents) | [`assistant-usage/`](./assistant-usage/) | `/assistant` |
| E15 | Business Health | [`business-health/`](./business-health/) | `/business` |
| E16 | QA Bench / Evals (Phase 2) | [`qa-bench/`](./qa-bench/) | `/qa-bench` |
| — | Platform foundation (auth, data layer, deploy) | [`_platform/`](./_platform/) | cross-cutting |

## Issue naming

Each task title follows: **`<Epic> · <Feature> · <Task>`** with a discipline prefix, e.g.
`[BE] Cost & Margin · Cost ingestion · Provider usage→cost pipeline`.

## How to import to Jira

**Fastest: use the generated CSV — [`jira-import.csv`](./jira-import.csv)** (79 rows: 17 epics + 62 tasks).
Regenerate anytime with `node JIRA/generate-csv.mjs`.

Columns: `Issue Type, Summary, Epic Name, Epic Link, Priority, Story Points, Labels, External ID,
Blocked By (IDs), Blocks (IDs), Description`.

In Jira → **System / Project settings → Import → CSV**:
1. Map `Issue Type`, `Summary`, `Description`, `Priority`, `Story Points`, `Labels`.
2. Map `Epic Name` (on Epic rows) and `Epic Link` (on task rows) — they match by name, so tasks attach
   to their epic automatically.
3. Map `External ID` to **External issue ID** (lets you re-import idempotently and wire links by ID).
4. **Dependencies:** `Blocked By (IDs)` / `Blocks (IDs)` reference other rows' `External ID`. Jira's CSV
   importer can create "is blocked by" links from an issue-link column mapped to External ID; if your
   instance doesn't, the IDs are also in each Description so links can be added in a quick pass.
5. Priority maps `P0→Highest … P4→Lowest`.

Prefer manual? Each task file is a self-contained issue — copy its What/Why/How/Acceptance Criteria
into the Jira description and set Type/Labels/Estimate/Priority from the header.

## Status of the MVP

Every tab below already exists as a working UI on mock data (see the repo). These tasks are about
**productionizing**: real backend (Python services + Supabase), wiring the UI to real APIs, RBAC,
hardening, and QA — not rebuilding the prototype. See each task's **How** for the MVP delta.
