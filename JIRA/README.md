# Jira Backlog — Voicing AI SuperAdmin Platform

Production backlog to take the **SuperAdmin MVP** to a real, backend-connected product. One folder
per **tab/module** (= one **Epic**). Each Epic folder contains an `EPIC.md` and one file per **task**
(one Jira issue), split by discipline: **Backend (BE)**, **Frontend/UI-UX (FE)**, **QA**.

> **MVP reference repo:** https://github.com/stamayovoicingai/superadmin-monitor-businesshealth
> Every task links to the exact MVP files so devs can see the working prototype before building.

Read **[`CONVENTIONS.md`](./CONVENTIONS.md)** first — it defines the issue template, types, labels,
estimation, and the MVP→production framing used by every task.

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

Each task file is a self-contained issue. To load a new board:
1. Create the **Epics** (one per folder, from `EPIC.md`).
2. Create each task as a **Story/Task**, linked to its Epic. Copy the file's Description block
   (What / Why / How / Acceptance Criteria) into the Jira description.
3. Apply the **Type**, **Components/Labels**, and **Estimate** from the task header.
4. (Optional) Use the Jira CSV/Forge import — a CSV can be generated from these files later; the
   structure (Epic, Summary, Description, Labels, Story Points) maps 1:1.

## Status of the MVP

Every tab below already exists as a working UI on mock data (see the repo). These tasks are about
**productionizing**: real backend (Python services + Supabase), wiring the UI to real APIs, RBAC,
hardening, and QA — not rebuilding the prototype. See each task's **How** for the MVP delta.
