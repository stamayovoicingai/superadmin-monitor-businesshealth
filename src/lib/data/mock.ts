/** MockAdapter — implements DataSource from the deterministic seed dataset. */
import type {
  Call,
  FallbackConfig,
  FallbackScopeType,
  FallbackService,
  HealthIncident,
  HealthService,
  IpDefaultPolicy,
  IpRule,
  IpScopePolicy,
  IpScopeType,
  NotifyRecipients,
  ServiceNotifyOverride,
  ServiceStatus,
  SubagentKey,
  SubagentUsageRow,
} from "@/lib/types";
import { getDataset } from "@/lib/seed";
import { SUBAGENTS, SUBAGENT_LABEL } from "@/lib/engine/subagents";
import {
  activeAgentsCount,
  callerSeries,
  computeTotals,
  dailySeries,
  endReasonCounts,
  filterCalls,
  orgRollups,
  podLoads,
  projectRollups,
  statusCounts,
  type CallFilter,
} from "@/lib/engine/aggregate";
import type {
  AddIpRuleInput,
  AssistantUsageResult,
  BusinessHealthResult,
  CallDetail,
  CallPage,
  CostResult,
  DataSource,
  IpRulesResult,
  LiveOpsResult,
  OverviewResult,
  PerformanceResult,
  Scope,
  SetIpPolicyInput,
  FallbacksResult,
  UpdateFallbackInput,
  HealthResult,
  SetRecipientsInput,
  SetServiceOverrideInput,
} from "./source";

/** Mutable IP-rule store (seeded copy) so add/delete persist within a server process. */
let _ipRules: IpRule[] | null = null;
function ipStore(): IpRule[] {
  if (!_ipRules) _ipRules = [...getDataset().ipRules];
  return _ipRules;
}

/** Mutable default-policy store (seeded copy). */
let _ipPolicies: IpScopePolicy[] | null = null;
function policyStore(): IpScopePolicy[] {
  if (!_ipPolicies) _ipPolicies = [...getDataset().ipPolicies];
  return _ipPolicies;
}
function getPolicy(scopeType: IpScopeType, scopeId: string): IpDefaultPolicy {
  return policyStore().find((p) => p.scopeType === scopeType && p.scopeId === scopeId)?.defaultPolicy ?? "allow";
}

/** Mutable stores for fallbacks + health notifications. */
let _fallbacks: FallbackConfig[] | null = null;
function fallbackStore(): FallbackConfig[] {
  if (!_fallbacks) _fallbacks = getDataset().fallbackConfigs.map((c) => ({ ...c }));
  return _fallbacks;
}
let _notify: NotifyRecipients[] | null = null;
function notifyStore(): NotifyRecipients[] {
  if (!_notify) _notify = getDataset().notifyRecipients.map((n) => ({ ...n, emails: [...n.emails] }));
  return _notify;
}
let _overrides: ServiceNotifyOverride[] | null = null;
function overrideStore(): ServiceNotifyOverride[] {
  if (!_overrides) _overrides = getDataset().serviceNotifyOverrides.map((o) => ({ ...o, emails: [...o.emails] }));
  return _overrides;
}

/** Subagent usage rows filtered by scope (org/project) and date range. */
function scopedSubagentUsage(scope: Scope): SubagentUsageRow[] {
  const { subagentUsage, projects } = getDataset();
  const fromDay = scope.from?.slice(0, 10);
  const toDay = scope.to?.slice(0, 10);
  const orgOf = (pid: string) => projects.find((p) => p.id === pid)?.orgId;
  return subagentUsage.filter((u) => {
    if (scope.projectId && u.projectId !== scope.projectId) return false;
    if (scope.orgId && orgOf(u.projectId) !== scope.orgId) return false;
    if (fromDay && u.date < fromDay) return false;
    if (toDay && u.date > toDay) return false;
    return true;
  });
}

function assistantCostInScope(scope: Scope): number {
  return scopedSubagentUsage(scope).reduce((s, u) => s + u.costMicros, 0);
}

/** Last N calendar months as "YYYY-MM" (oldest → newest, ending current month). */
function lastMonths(n: number): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
/** ISO cutoff = first day of the month AFTER the given "YYYY-MM" (i.e. that month's end). */
function monthEndIso(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 1).toISOString();
}

function scopedCalls(scope: Scope): Call[] {
  const { calls } = getDataset();
  return filterCalls(calls, {
    orgId: scope.orgId,
    projectId: scope.projectId,
    from: scope.from,
    to: scope.to,
  });
}

function projectIdsInScope(scope: Scope): string[] {
  const { projects } = getDataset();
  return projects
    .filter((p) => (!scope.orgId || p.orgId === scope.orgId) && (!scope.projectId || p.id === scope.projectId))
    .map((p) => p.id);
}

export class MockAdapter implements DataSource {
  async listOrgs() {
    return getDataset().orgs;
  }
  async listProjects(orgId?: string) {
    const { projects } = getDataset();
    return orgId ? projects.filter((p) => p.orgId === orgId) : projects;
  }
  async listAgents(projectId?: string) {
    const { agents } = getDataset();
    return projectId ? agents.filter((a) => a.projectId === projectId) : agents;
  }
  async getContract(orgId: string) {
    return getDataset().contracts.find((c) => c.orgId === orgId) ?? null;
  }

  async overview(scope: Scope): Promise<OverviewResult> {
    const { orgs, projects, contracts } = getDataset();
    const calls = scopedCalls(scope);
    const t = computeTotals(calls);
    const pids = projectIdsInScope(scope);
    const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? id;
    const projName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

    const projRoll = projectRollups(calls, pids)
      .map((r) => ({ ...r, name: projName(r.projectId), orgName: orgName(r.orgId) }))
      .sort((a, b) => b.costMicros - a.costMicros);

    const scopedContracts = scope.orgId ? contracts.filter((c) => c.orgId === scope.orgId) : contracts;
    const orgRoll = orgRollups(calls, scopedContracts).map((r) => ({ ...r, name: orgName(r.orgId) }));

    // Headline revenue: contract-based (incl. MGF floor) at org/global scope; per-call (usage) at project scope.
    const revenueMicros = scope.projectId ? t.revenueMicros : orgRoll.reduce((s, o) => s + o.revenueMicros, 0);
    const marginMicros = revenueMicros - t.costMicros;

    return {
      totals: {
        calls: t.calls,
        minutes: t.minutes,
        costMicros: t.costMicros,
        revenueMicros,
        marginMicros,
        service: t.service,
        avgLatencyMs: t.avgLatencyMs,
        errorRate: t.errorRate,
      },
      activeConcurrency: calls.filter((c) => c.status === "ACTIVE").length,
      assistantCostMicros: assistantCostInScope(scope),
      projects: projRoll,
      orgs: orgRoll,
      costSeries: dailySeries(calls),
    };
  }

  async cost(scope: Scope): Promise<CostResult> {
    const { orgs, projects, contracts } = getDataset();
    const calls = scopedCalls(scope);
    const t = computeTotals(calls);
    const pids = projectIdsInScope(scope);
    const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? id;
    const projName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
    const scopedContracts = scope.orgId ? contracts.filter((c) => c.orgId === scope.orgId) : contracts;
    const orgRoll = orgRollups(calls, scopedContracts);
    const revenueMicros = scope.projectId ? t.revenueMicros : orgRoll.reduce((s, o) => s + o.revenueMicros, 0);
    return {
      totals: {
        calls: t.calls,
        minutes: t.minutes,
        costMicros: t.costMicros,
        revenueMicros,
        marginMicros: revenueMicros - t.costMicros,
        service: t.service,
      },
      series: dailySeries(calls),
      projects: projectRollups(calls, pids)
        .map((r) => ({ ...r, name: projName(r.projectId), orgName: orgName(r.orgId) }))
        .sort((a, b) => b.costMicros - a.costMicros),
      orgs: orgRollups(calls, scopedContracts).map((r) => ({ ...r, name: orgName(r.orgId) })),
    };
  }

  async performance(scope: Scope): Promise<PerformanceResult> {
    const calls = scopedCalls(scope);
    const t = computeTotals(calls);
    const n = calls.length || 1;
    const sum = calls.reduce(
      (acc, c) => {
        acc.llm += c.latency.llmMs;
        acc.stt += c.latency.sttMs;
        acc.tts += c.latency.ttsMs;
        acc.tool += c.latency.toolMs;
        acc.tel += c.latency.telephonyMs;
        return acc;
      },
      { llm: 0, stt: 0, tts: 0, tool: 0, tel: 0 },
    );

    // latency series by day (avg)
    const byDay = new Map<string, { n: number; total: number; llm: number; stt: number; tts: number }>();
    for (const c of calls) {
      const d = c.startTime.slice(0, 10);
      const e = byDay.get(d) ?? { n: 0, total: 0, llm: 0, stt: 0, tts: 0 };
      e.n++;
      e.total += c.latency.totalMs;
      e.llm += c.latency.llmMs;
      e.stt += c.latency.sttMs;
      e.tts += c.latency.ttsMs;
      byDay.set(d, e);
    }
    const latencySeries = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, e]) => ({
        date,
        totalMs: Math.round(e.total / e.n),
        llmMs: Math.round(e.llm / e.n),
        sttMs: Math.round(e.stt / e.n),
        ttsMs: Math.round(e.tts / e.n),
      }));

    return {
      avgLatencyMs: t.avgLatencyMs,
      errorRate: t.errorRate,
      perService: {
        llmMs: Math.round(sum.llm / n),
        sttMs: Math.round(sum.stt / n),
        ttsMs: Math.round(sum.tts / n),
        toolMs: Math.round(sum.tool / n),
        telephonyMs: Math.round(sum.tel / n),
      },
      latencySeries,
    };
  }

  async listCalls(filter: CallFilter, page: number, pageSize: number): Promise<CallPage> {
    const { calls, projects, orgs, agents } = getDataset();
    const filtered = filterCalls(calls, filter).sort((a, b) => b.startTime.localeCompare(a.startTime));
    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);
    const projName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
    const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? id;
    const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? id;
    return {
      rows: slice.map((c) => ({
        ...c,
        projectName: projName(c.projectId),
        orgName: orgName(c.orgId),
        agentName: agentName(c.agentId),
      })),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  async getCall(callId: string): Promise<CallDetail | null> {
    const { calls, projects, orgs, agents } = getDataset();
    const call = calls.find((c) => c.callId === callId || c.id === callId);
    if (!call) return null;
    return {
      call,
      projectName: projects.find((p) => p.id === call.projectId)?.name ?? call.projectId,
      orgName: orgs.find((o) => o.id === call.orgId)?.name ?? call.orgId,
      agentName: agents.find((a) => a.id === call.agentId)?.name ?? call.agentId,
    };
  }

  async liveOps(scope: Scope): Promise<LiveOpsResult> {
    const { projects } = getDataset();
    const calls = scopedCalls({ ...scope, from: undefined, to: undefined });
    const active = calls.filter((c) => c.status === "ACTIVE");
    const projName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
    const loads = podLoads(active);
    return {
      concurrency: active.length,
      activePods: loads.length,
      closedInPeriod: calls.filter((c) => c.status !== "ACTIVE").length,
      errorsInPeriod: calls.reduce((s, c) => s + c.errorCount, 0),
      podLoads: loads,
      statusCounts: statusCounts(calls),
      endReasonCounts: endReasonCounts(calls),
      activeCalls: active.map((c) => ({ ...c, projectName: projName(c.projectId) })),
    };
  }

  async businessHealth(scope: Scope): Promise<BusinessHealthResult> {
    const { orgs, contracts } = getDataset();
    const calls = scopedCalls(scope);
    const t = computeTotals(calls);
    const scopedContracts = scope.orgId ? contracts.filter((c) => c.orgId === scope.orgId) : contracts;
    const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? id;
    const orgRoll = orgRollups(calls, scopedContracts);

    // MRR composition (now): committed = MGF floors; usage = pay-as-you-go run-rate; expansion = MGF overage.
    let committedNow = 0;
    let usageNow = 0;
    let expansionNow = 0;
    for (const c of scopedContracts) {
      const roll = orgRoll.find((r) => r.orgId === c.orgId);
      if (!roll) continue;
      if (c.contractType === "mgf") {
        committedNow += c.mgfAmountMicros;
        expansionNow += Math.max(0, roll.revenueMicros - c.mgfAmountMicros);
      } else {
        usageNow += roll.mrrMicros;
      }
    }
    const mrrMicros = orgRoll.reduce((s, r) => s + r.mrrMicros, 0);

    // 12-month MRR ramp — synthesized deterministically (business history isn't in the 30d call data).
    const months = lastMonths(12);
    const mrrSeries = months.map((month, i) => {
      const factor = 0.55 + (0.45 * i) / (months.length - 1);
      const jitter = 1 + 0.025 * Math.sin(i * 1.7);
      return {
        month,
        committedMicros: Math.round(committedNow * factor * jitter),
        usageMicros: Math.round(usageNow * factor * jitter),
        expansionMicros: Math.round(expansionNow * factor),
      };
    });
    const prevPoint = mrrSeries[mrrSeries.length - 2];
    const prev = prevPoint ? prevPoint.committedMicros + prevPoint.usageMicros + prevPoint.expansionMicros : 0;
    const mrrDeltaPct = prev > 0 ? (mrrMicros - prev) / prev : 0;

    // Org growth — cumulative active orgs by month-end (from onboardedAt).
    const scopedOrgs = scope.orgId ? orgs.filter((o) => o.id === scope.orgId) : orgs;
    const orgGrowthSeries = months.map((month) => {
      const end = monthEndIso(month);
      return {
        month,
        activeOrgs: scopedOrgs.filter((o) => o.onboardedAt <= end).length,
      };
    });

    const newOrgs = scope.from ? scopedOrgs.filter((o) => o.onboardedAt >= scope.from!).length : 0;
    const churned = scopedOrgs.filter((o) => o.status === "churned").length;
    const churnRatePct = scopedOrgs.length ? churned / scopedOrgs.length : 0;
    const callers = callerSeries(calls);

    return {
      mrrMicros,
      mrrDeltaPct,
      churnRatePct,
      expansionMicros: expansionNow,
      activeOrgs: scopedOrgs.filter((o) => o.status === "active").length,
      newOrgs,
      activeAgents: activeAgentsCount(calls),
      totalMinutes: t.minutes,
      totalCalls: t.calls,
      newCallers: callers.newTotal,
      returningCallers: callers.returningTotal,
      mrrSeries,
      orgGrowthSeries,
      usageSeries: dailySeries(calls).map((p) => ({ date: p.date, minutes: p.minutes, calls: p.calls })),
      callersSeries: callers.series,
      orgs: orgRoll
        .map((r) => ({ name: orgName(r.orgId), mrrMicros: r.mrrMicros, marginMicros: r.marginMicros, minutes: r.minutes }))
        .sort((a, b) => b.mrrMicros - a.mrrMicros),
    };
  }

  async assistantUsage(scope: Scope): Promise<AssistantUsageResult> {
    const { projects } = getDataset();
    const rows = scopedSubagentUsage(scope);
    const projName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

    let costMicros = 0;
    let invocations = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    const bySub = new Map<SubagentKey, { costMicros: number; invocations: number }>();
    const byProj = new Map<string, { costMicros: number; invocations: number }>();
    const byDay = new Map<string, { costMicros: number; invocations: number }>();

    for (const u of rows) {
      costMicros += u.costMicros;
      invocations += u.invocations;
      inputTokens += u.inputTokens;
      outputTokens += u.outputTokens;
      const s = bySub.get(u.subagent) ?? { costMicros: 0, invocations: 0 };
      s.costMicros += u.costMicros;
      s.invocations += u.invocations;
      bySub.set(u.subagent, s);
      const p = byProj.get(u.projectId) ?? { costMicros: 0, invocations: 0 };
      p.costMicros += u.costMicros;
      p.invocations += u.invocations;
      byProj.set(u.projectId, p);
      const d = byDay.get(u.date) ?? { costMicros: 0, invocations: 0 };
      d.costMicros += u.costMicros;
      d.invocations += u.invocations;
      byDay.set(u.date, d);
    }

    return {
      totals: { costMicros, invocations, inputTokens, outputTokens },
      bySubagent: SUBAGENTS.map((sa) => ({
        subagent: sa.key,
        label: sa.label,
        model: sa.model,
        costMicros: bySub.get(sa.key)?.costMicros ?? 0,
        invocations: bySub.get(sa.key)?.invocations ?? 0,
      })).sort((a, b) => b.costMicros - a.costMicros),
      byProject: Array.from(byProj.entries())
        .map(([projectId, v]) => ({ projectId, projectName: projName(projectId), ...v }))
        .sort((a, b) => b.costMicros - a.costMicros),
      series: Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, v]) => ({ date, ...v })),
    };
  }

  async listIpRules(scope: Scope): Promise<IpRulesResult> {
    const { projects } = getDataset();
    const rules = ipStore();
    if (scope.projectId) {
      const orgId = projects.find((p) => p.id === scope.projectId)?.orgId;
      return {
        own: rules.filter((r) => r.scopeType === "project" && r.scopeId === scope.projectId),
        inherited: rules.filter((r) => r.scopeType === "org" && r.scopeId === orgId),
        defaultPolicy: getPolicy("project", scope.projectId),
      };
    }
    if (scope.orgId) {
      return {
        own: rules.filter((r) => r.scopeType === "org" && r.scopeId === scope.orgId),
        inherited: [],
        defaultPolicy: getPolicy("org", scope.orgId),
      };
    }
    // No scope selected → return everything (read-only overview).
    return { own: [...rules], inherited: [], defaultPolicy: "allow" };
  }

  async addIpRule(input: AddIpRuleInput): Promise<IpRule> {
    const rule: IpRule = {
      id: `ip-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
      scopeType: input.scopeType,
      scopeId: input.scopeId,
      listType: input.listType,
      value: input.value.trim(),
      label: input.label.trim(),
      addedBy: "you@voicing.ai",
      createdAt: new Date().toISOString(),
    };
    ipStore().push(rule);
    return rule;
  }

  async deleteIpRule(id: string): Promise<void> {
    _ipRules = ipStore().filter((r) => r.id !== id);
  }

  async setIpPolicy(input: SetIpPolicyInput): Promise<void> {
    const store = policyStore();
    const existing = store.find((p) => p.scopeType === input.scopeType && p.scopeId === input.scopeId);
    if (existing) existing.defaultPolicy = input.defaultPolicy;
    else store.push({ scopeType: input.scopeType, scopeId: input.scopeId, defaultPolicy: input.defaultPolicy });
  }

  async getFallbacks(scope: Scope): Promise<FallbacksResult> {
    const { orgs, projects, fallbackEvents } = getDataset();
    const store = fallbackStore();
    const scopeType: FallbackScopeType = scope.projectId ? "project" : scope.orgId ? "org" : "global";
    const scopeId = scope.projectId ?? scope.orgId ?? null;
    const scopeLabel = scope.projectId
      ? projects.find((p) => p.id === scope.projectId)?.name ?? "Project"
      : scope.orgId
        ? orgs.find((o) => o.id === scope.orgId)?.name ?? "Organization"
        : "All orgs";

    const services = (["stt", "tts", "llm"] as FallbackService[]).map((service) => {
      const own = store.find((c) => c.service === service && c.scopeType === scopeType && c.scopeId === scopeId);
      const global = store.find((c) => c.service === service && c.scopeType === "global");
      const config = own ?? global!;
      return { service, config, isOverride: !!own && scopeType !== "global" };
    });

    return {
      scopeLabel,
      services,
      events: [...fallbackEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    };
  }

  async updateFallback(input: UpdateFallbackInput): Promise<void> {
    const store = fallbackStore();
    let cfg = store.find((c) => c.service === input.service && c.scopeType === input.scopeType && c.scopeId === input.scopeId);
    if (!cfg) {
      const global = store.find((c) => c.service === input.service && c.scopeType === "global");
      cfg = {
        service: input.service,
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        enabled: global?.enabled ?? true,
        fallbackModel: global?.fallbackModel,
        orderedModels: global?.orderedModels ? [...global.orderedModels] : undefined,
        updatedBy: "you@voicing.ai",
        updatedAt: new Date().toISOString(),
      };
      store.push(cfg);
    }
    if (input.enabled !== undefined) cfg.enabled = input.enabled;
    if (input.fallbackModel !== undefined) cfg.fallbackModel = input.fallbackModel;
    if (input.orderedModels !== undefined) cfg.orderedModels = input.orderedModels;
    cfg.updatedBy = "you@voicing.ai";
    cfg.updatedAt = new Date().toISOString();
  }

  async health(scope: Scope): Promise<HealthResult> {
    const { healthServices, healthIncidents, projects } = getDataset();
    const orgProjectIds = scope.orgId ? projects.filter((p) => p.orgId === scope.orgId).map((p) => p.id) : null;

    const services = healthServices.filter((s) => {
      if (s.kind === "external") return true; // dependencies always shown
      if (scope.projectId) return s.scopeId === scope.projectId;
      if (orgProjectIds) return s.scopeId !== null && orgProjectIds.includes(s.scopeId);
      return true;
    });

    const ids = new Set(services.map((s) => s.id));
    const incidents = healthIncidents
      .filter((i) => ids.has(i.serviceId))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

    const summary: Record<ServiceStatus, number> = { operational: 0, degraded: 0, down: 0, maintenance: 0 };
    for (const s of services) summary[s.status]++;

    const recipients = scope.projectId
      ? notifyStore().find((n) => n.scopeId === scope.projectId)?.emails ?? []
      : [];
    const overrides = overrideStore().filter((o) => ids.has(o.serviceId));

    return { services, incidents, summary, recipients, overrides };
  }

  async setRecipients(input: SetRecipientsInput): Promise<void> {
    const store = notifyStore();
    const existing = store.find((n) => n.scopeId === input.scopeId);
    if (existing) existing.emails = input.emails;
    else store.push({ scopeId: input.scopeId, emails: input.emails });
  }

  async setServiceOverride(input: SetServiceOverrideInput): Promise<void> {
    const store = overrideStore();
    if (input.emails.length === 0) {
      _overrides = store.filter((o) => o.serviceId !== input.serviceId);
      return;
    }
    const existing = store.find((o) => o.serviceId === input.serviceId);
    if (existing) existing.emails = input.emails;
    else store.push({ serviceId: input.serviceId, emails: input.emails });
  }
}
