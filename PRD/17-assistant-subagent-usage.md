# 17 · Module: Assistant / Platform Usage (Subagents)

Tracks usage and cost of the **platform.voicing.ai assistant** — the in-platform helper that builds
and manages agents. The assistant is composed of specialized **subagents**, each running on its own
LLM model. We track cost **per project** and **per subagent**. Route: `/assistant`.

> This is **platform usage**, not call traffic. Per the cost decision, it is tracked **separately from
> call COGS/margin**, but its total **is surfaced in the Overview** so it's never invisible.

---

## 1. Subagents

| Subagent | Default model | Typical use |
|----------|---------------|-------------|
| Prompt Writer | gpt-4o | drafting/editing prompts |
| Architecture | claude-sonnet | bot/flow architecture |
| Debugging | gpt-4.1 | diagnosing issues |
| Planning | gemini-1.5-pro | planning changes |
| General Assistant | gpt-4o-mini | general chat/help |

Each subagent can use a different model, so cost per subagent differs. Catalog: `lib/engine/subagents.ts`.

## 2. Metrics

- **Per project**: assistant cost, invocations, input/output tokens.
- **Per subagent**: cost, invocations, model.
- **Over time**: daily assistant cost.
- Cost is computed with the same LLM rate catalog as calls (`llmCostMicros`), so a subagent's cost =
  `inputTokens × inputRate + outputTokens × outputRate` for its model.

## 3. UI (`/assistant`)

- KPI strip: assistant cost (period), invocations, input tokens, output tokens.
- Daily assistant-cost trend.
- **Cost by subagent** table (subagent · model · invocations · cost).
- **Cost by project** bar chart.
- Visible to both roles (it's cost-to-serve, no revenue/margin involved). Scoped by the global
  Org/Project/range filter.

## 4. Overview integration

Overview includes an **"Assistant Cost"** KPI (`OverviewResult.assistantCostMicros`) for the active
scope, alongside call cost — so platform-assistant spend is tracked next to operational cost without
mixing into call margin.

## 5. Data & engine

- `SubagentUsageRow` (PRD/12 to extend): `projectId, subagent, model, date, invocations, inputTokens,
  outputTokens, costMicros`.
- `DataSource.assistantUsage(scope)` → totals + bySubagent + byProject + daily series.
- API `/api/assistant`. Seed generates ~30 days per project × subagent.

## 6. Open questions
- [ ] Real source of subagent token usage in production (platform LLM gateway / logs).
- [ ] Should heavy assistant usage roll into project margin as an internal cost-to-serve later?
  (Currently excluded by decision; revisit.)
- [ ] Per-subagent model overrides per project/org.
