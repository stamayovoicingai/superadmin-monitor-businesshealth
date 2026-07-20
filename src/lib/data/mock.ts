/** MockAdapter — implements DataSource from the deterministic seed dataset. */
import type {
  Call,
  CallFlag,
  FlagStatus,
  FallbackConfig,
  FallbackScopeType,
  FallbackService,
  HealthIncident,
  HealthService,
  IpDefaultPolicy,
  IpRule,
  IpScopePolicy,
  IpScopeType,
  Issue,
  IssueCategory,
  NotifyRecipients,
  ServiceNotifyOverride,
  ServiceStatus,
  SubagentKey,
  SubagentUsageRow,
  Threshold,
} from "@/lib/types";
import { getDataset } from "@/lib/seed";
import { buildSipCallDetail, buildSipSummary } from "@/lib/telephony";
import { SUBAGENTS, SUBAGENT_LABEL } from "@/lib/engine/subagents";
import { evaluateIssues, formatMetric } from "@/lib/engine/issues";
import { Rng } from "@/lib/seed/rng";
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
  K8sResult,
  K8sPoint,
  ElbResult,
  ElbPoint,
  IssuesResult,
  CreateThresholdInput,
  UpdateThresholdPatch,
  CreateFlagInput,
  SipCallFilter,
  SipCallPage,
} from "./source";
import type { SipCallDetail } from "@/lib/types";

/* ----- Infra mock generators (deterministic per scope) ----- */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function timePoints(from: string | undefined, to: string | undefined, n: number): string[] {
  const b = to ? new Date(to).getTime() : Date.now();
  const a = from ? new Date(from).getTime() : b - 24 * 3600_000;
  const step = (b - a) / (n - 1);
  return Array.from({ length: n }, (_, i) => new Date(a + step * i).toISOString());
}
function wave(rng: Rng, n: number, base: number, amp: number, noise: number, spikeChance = 0): number[] {
  const phase = rng.float(0, Math.PI * 2);
  return Array.from({ length: n }, (_, i) => {
    let v = base + amp * Math.sin(phase + i / 6) + rng.float(-noise, noise);
    if (spikeChance && rng.bool(spikeChance)) v += amp * rng.float(2, 4);
    return Math.max(0, v);
  });
}
const r1 = (x: number) => Math.round(x * 10) / 10;

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

/** Mutable stores for thresholds, issue categories and call flags. */
let _thresholds: Threshold[] | null = null;
function thresholdStore(): Threshold[] {
  if (!_thresholds) _thresholds = getDataset().thresholds.map((t) => ({ ...t, reasons: t.reasons ? [...t.reasons] : undefined }));
  return _thresholds;
}
let _categories: IssueCategory[] | null = null;
function categoryStore(): IssueCategory[] {
  if (!_categories) _categories = getDataset().issueCategories.map((c) => ({ ...c }));
  return _categories;
}
let _flags: CallFlag[] | null = null;
function flagStore(): CallFlag[] {
  if (!_flags) {
    const { calls, projects } = getDataset();
    const projName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
    _flags = calls
      .filter((c) => c.flagged)
      .map((c) => ({
        id: `flag-manual-${c.id}`,
        callId: c.callId,
        orgId: c.orgId,
        projectId: c.projectId,
        projectName: projName(c.projectId),
        source: "manual" as const,
        reason: "Flagged by user",
        status: "open" as const,
        createdAt: c.startTime,
        comments: [],
      }));
  }
  return _flags;
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

  async infraK8s(scope: Scope): Promise<K8sResult> {
    const { projects } = getDataset();
    const namespaces = projects.map((p) => p.namespace);
    const nodes = ["ip-10-0-1-21", "ip-10-0-2-44", "ip-10-0-3-9"];
    const proj = scope.projectId ? projects.find((p) => p.id === scope.projectId) : null;
    const ns = proj?.namespace ?? null;
    const nsShort = (ns ?? "cluster").replace("-bot-orchestration", "");
    const rng = new Rng(hashSeed(`k8s:${ns ?? "cluster"}`));
    const ts = timePoints(scope.from, scope.to, 48);
    const N = ts.length;

    const cpuPct = r1(rng.float(35, 72));
    const memPct = r1(rng.float(42, 78));
    const storagePct = r1(rng.float(24, 58));
    const cpuTotalCores = ns ? 16 : 48;
    const memTotalGiB = ns ? 64 : 192;
    const storageTotalGiB = ns ? 300 : 1000;

    const cpuW = wave(rng, N, cpuPct, 10, 4);
    const memW = wave(rng, N, memPct, 8, 3);
    const overall: K8sPoint[] = ts.map((t, i) => ({ t, cpu: r1(cpuW[i]), mem: r1(memW[i]) }));

    const podKeys = Array.from({ length: 4 }, (_, i) => `${nsShort}-${(7 + i).toString(36)}${i}f-${i}`);
    const podCpuW = podKeys.map(() => wave(rng, N, rng.float(0.3, 1.1), 0.4, 0.15));
    const podMemW = podKeys.map(() => wave(rng, N, rng.float(0.5, 1.8), 0.5, 0.2));
    const podCpu: K8sPoint[] = ts.map((t, i) => Object.fromEntries([["t", t], ...podKeys.map((k, j) => [k, r1(podCpuW[j][i])])]) as K8sPoint);
    const podMem: K8sPoint[] = ts.map((t, i) => Object.fromEntries([["t", t], ...podKeys.map((k, j) => [k, r1(podMemW[j][i])])]) as K8sPoint);

    const containerKeys = ["orchestrator", "stt-worker", "tts-worker", "llm-router"];
    const cCpuW = containerKeys.map(() => wave(rng, N, rng.float(0.15, 0.8), 0.3, 0.1));
    const cMemW = containerKeys.map(() => wave(rng, N, rng.float(0.3, 1.2), 0.4, 0.15));
    const containerCpu: K8sPoint[] = ts.map((t, i) => Object.fromEntries([["t", t], ...containerKeys.map((k, j) => [k, r1(cCpuW[j][i])])]) as K8sPoint);
    const containerMem: K8sPoint[] = ts.map((t, i) => Object.fromEntries([["t", t], ...containerKeys.map((k, j) => [k, r1(cMemW[j][i])])]) as K8sPoint);

    const requestsLimits = containerKeys.map((c) => {
      const cpuRequest = r1(rng.float(0.25, 0.5));
      const memRequestGiB = r1(rng.float(0.5, 1));
      return { container: c, cpuRequest, cpuLimit: r1(cpuRequest * rng.float(1.8, 3)), memRequestGiB, memLimitGiB: r1(memRequestGiB * rng.float(1.8, 2.5)) };
    });

    const restartsTotal = rng.int(0, ns ? 6 : 18);
    const restarts: K8sPoint[] = ts.map((t) => ({ t, restarts: rng.bool(0.1) ? rng.int(1, 2) : 0 }));

    const levels = ["INFO", "INFO", "INFO", "INFO", "WARN", "WARN", "ERROR"] as const;
    const samples = [
      "request handled in 142ms",
      "VAD confidence 0.82 — speech detected",
      "websocket stream connected",
      "call CALL-XYZ session started",
      "STT partial transcript received",
      "TTS synthesis 980 chars in 240ms",
      "high latency on STT provider, retrying",
      "rate limit approaching on LLM router (429 risk)",
      "| ERROR | provider timeout, switched to fallback model",
      "| ERROR | websocket disconnect, reconnecting",
      "pod memory pressure: working set 1.8GiB",
      "deployment scaled: replicas 4 -> 5",
    ];
    const winStart = new Date(ts[0]).getTime();
    const winEnd = new Date(ts[N - 1]).getTime();
    const logCount = 80;
    const logs = Array.from({ length: logCount }, (_, i) => {
      const lvlIdx = rng.int(0, levels.length - 1);
      const msg = samples[rng.int(0, samples.length - 1)];
      const tms = winStart + ((winEnd - winStart) * i) / (logCount - 1) + rng.float(-30000, 30000);
      return {
        ts: new Date(Math.max(winStart, Math.min(winEnd, tms))).toISOString(),
        level: levels[lvlIdx],
        line: `{namespace="${ns ?? "*"}"} ${msg}`,
      };
    }).sort((a, b) => b.ts.localeCompare(a.ts));

    return {
      namespaces,
      nodes,
      selectedNamespace: ns,
      cluster: {
        cpuPct,
        memPct,
        storagePct,
        cpuUsedCores: r1((cpuTotalCores * cpuPct) / 100),
        cpuTotalCores,
        memUsedGiB: r1((memTotalGiB * memPct) / 100),
        memTotalGiB,
        storageUsedGiB: r1((storageTotalGiB * storagePct) / 100),
        storageTotalGiB,
        replicaCount: ns ? rng.int(2, 8) : rng.int(20, 38),
      },
      overall,
      podKeys,
      podCpu,
      podMem,
      containerKeys,
      containerCpu,
      containerMem,
      requestsLimits,
      restartsTotal,
      restarts,
      logs,
    };
  }

  async infraElb(scope: Scope): Promise<ElbResult> {
    const loadBalancers = ["voicing-alb-prod", "voicing-alb-staging"];
    const rng = new Rng(hashSeed(`elb:${loadBalancers[0]}`));
    const ts = timePoints(scope.from, scope.to, 48);
    const N = ts.length;
    const reqW = wave(rng, N, 1200, 380, 120);
    const respW = wave(rng, N, 120, 50, 25, 0.05);
    const c2 = wave(rng, N, 1100, 350, 110);
    const c3 = wave(rng, N, 28, 12, 6);
    const c4 = wave(rng, N, 42, 18, 10, 0.05);
    const c5 = wave(rng, N, 9, 6, 4, 0.08);
    const e3 = wave(rng, N, 14, 6, 3);
    const e4 = wave(rng, N, 20, 9, 5);
    const e5 = wave(rng, N, 5, 4, 3, 0.06);
    const active = wave(rng, N, 320, 90, 30);
    const newc = wave(rng, N, 140, 50, 20);
    const rejected = wave(rng, N, 2, 2, 1, 0.04);
    const targetErr = wave(rng, N, 3, 3, 2, 0.05);
    const lcu = wave(rng, N, 12, 5, 2);
    const processed = wave(rng, N, 240, 80, 30);
    const tlsClient = wave(rng, N, 4, 3, 2);
    const tlsTarget = wave(rng, N, 2, 2, 1);
    const ipv6Req = wave(rng, N, 180, 70, 25);
    const ipv6Proc = wave(rng, N, 40, 18, 8);
    const evals = wave(rng, N, 1300, 400, 130);
    const authSuccess = wave(rng, N, 90, 30, 12);
    const authError = wave(rng, N, 3, 3, 2, 0.05);
    const authFailure = wave(rng, N, 2, 2, 1, 0.04);
    const round = Math.round;

    return {
      regions: ["us-east-1", "us-west-2"],
      loadBalancers,
      selectedLb: loadBalancers[0],
      requests: ts.map((t, i) => ({ t, requestCount: round(reqW[i]), responseMs: round(respW[i]) })),
      httpTarget: ts.map((t, i) => ({ t, code2xx: round(c2[i]), code3xx: round(c3[i]), code4xx: round(c4[i]), code5xx: round(c5[i]) })),
      httpElb: ts.map((t, i) => ({ t, elb3xx: round(e3[i]), elb4xx: round(e4[i]), elb5xx: round(e5[i]) })),
      connections: ts.map((t, i) => ({ t, active: round(active[i]), new: round(newc[i]), rejected: round(rejected[i]), targetErr: round(targetErr[i]) })),
      capacity: ts.map((t, i) => ({ t, lcu: r1(lcu[i]), processedMB: round(processed[i]) })),
      tls: ts.map((t, i) => ({ t, client: round(tlsClient[i]), target: round(tlsTarget[i]) })),
      ipv6: ts.map((t, i) => ({ t, requests: round(ipv6Req[i]), processedMB: round(ipv6Proc[i]) })),
      ruleEvals: ts.map((t, i) => ({ t, evals: round(evals[i]) })),
      auth: ts.map((t, i) => ({ t, success: round(authSuccess[i]), error: round(authError[i]), failure: round(authFailure[i]) })),
    };
  }

  async getIssues(scope: Scope): Promise<IssuesResult> {
    const ds = getDataset();
    const calls = scopedCalls(scope);
    const orgName = (id: string) => ds.orgs.find((o) => o.id === id)?.name ?? id;
    const projName = (id: string) => ds.projects.find((p) => p.id === id)?.name ?? id;
    const agentName = (id: string) => ds.agents.find((a) => a.id === id)?.name ?? id;
    const catName = (id: string) => categoryStore().find((c) => c.id === id)?.name ?? id;
    const scopeLabel = (type: Threshold["scopeType"], id: string | null) =>
      type === "global" ? "All orgs" : type === "org" ? orgName(id!) : type === "project" ? projName(id!) : agentName(id!);

    const issues = evaluateIssues(calls, thresholdStore(), categoryStore(), {
      categoryName: catName,
      scopeLabel,
      projectName: projName,
    });

    // Auto-flag affected calls of CRITICAL issues into the review queue (idempotent).
    // affectedCalls is capped for the UI, so count auto-flagged from the full issue counts.
    const store = flagStore();
    let autoFlagged = 0;
    for (const iss of issues) {
      if (iss.severity !== "critical") continue;
      autoFlagged += iss.count;
      for (const ac of iss.affectedCalls) {
        const id = `flag-auto-${ac.callId}-${iss.metric}`;
        if (!store.some((f) => f.id === id)) {
          store.push({
            id,
            callId: ac.callId,
            orgId: ds.projects.find((p) => p.id === ac.projectId)?.orgId ?? "",
            projectId: ac.projectId,
            projectName: ac.projectName,
            source: "auto",
            reason: `${iss.metricLabel} ${iss.comparator === "gt" ? ">" : "<"} ${formatMetric(iss.metric, iss.thresholdValue)} (Critical)`,
            metric: iss.metric,
            severity: "critical",
            status: "open",
            createdAt: ac.timestamp,
            comments: [],
          });
        }
      }
    }

    // Per-category rollup across all categories.
    const byCategory = categoryStore().map((cat) => {
      const catIssues = issues.filter((i) => i.categoryId === cat.id);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        critical: catIssues.filter((i) => i.severity === "critical").length,
        warning: catIssues.filter((i) => i.severity === "warning").length,
        affectedCalls: catIssues.reduce((s, i) => s + i.count, 0),
      };
    });

    const affected = new Set<string>();
    issues.forEach((i) => i.affectedCalls.forEach((ac) => affected.add(ac.callId)));

    return {
      issues,
      byCategory,
      summary: {
        critical: issues.filter((i) => i.severity === "critical").length,
        warning: issues.filter((i) => i.severity === "warning").length,
        affectedCalls: affected.size,
        autoFlagged,
      },
    };
  }

  async listThresholds(): Promise<Threshold[]> {
    return thresholdStore();
  }

  async listIssueCategories(): Promise<IssueCategory[]> {
    return categoryStore();
  }

  async createThreshold(input: CreateThresholdInput): Promise<Threshold> {
    const t: Threshold = { id: `th-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, ...input };
    thresholdStore().push(t);
    return t;
  }

  async updateThreshold(patch: UpdateThresholdPatch): Promise<void> {
    const t = thresholdStore().find((x) => x.id === patch.id);
    if (!t) return;
    if (patch.warning !== undefined) t.warning = patch.warning;
    if (patch.critical !== undefined) t.critical = patch.critical;
    if (patch.enabled !== undefined) t.enabled = patch.enabled;
    if (patch.categoryId !== undefined) t.categoryId = patch.categoryId;
    if (patch.reasons !== undefined) t.reasons = patch.reasons;
  }

  async deleteThreshold(id: string): Promise<void> {
    _thresholds = thresholdStore().filter((t) => t.id !== id);
  }

  async createIssueCategory(name: string): Promise<IssueCategory> {
    const cat: IssueCategory = { id: `cat-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, name, isDefault: false };
    categoryStore().push(cat);
    return cat;
  }

  async listFlags(scope: Scope): Promise<CallFlag[]> {
    return flagStore()
      .filter((f) => (!scope.orgId || f.orgId === scope.orgId) && (!scope.projectId || f.projectId === scope.projectId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createFlag(input: CreateFlagInput): Promise<CallFlag> {
    const { calls, projects } = getDataset();
    const call = calls.find((c) => c.callId === input.callId || c.id === input.callId);
    const store = flagStore();
    const now = new Date().toISOString();
    const comment = input.comment.trim();

    // One manual flag per call — append a comment if it already exists.
    const existing = store.find((f) => f.callId === (call?.callId ?? input.callId) && f.source === "manual");
    if (existing) {
      if (comment) existing.comments.push({ author: "you@voicing.ai", body: comment, createdAt: now });
      existing.status = "open";
      return existing;
    }

    const projectName = call ? projects.find((p) => p.id === call.projectId)?.name ?? call.projectId : "—";
    const flag: CallFlag = {
      id: `flag-manual-${call?.callId ?? input.callId}-${Date.now()}`,
      callId: call?.callId ?? input.callId,
      orgId: call?.orgId ?? "",
      projectId: call?.projectId ?? "",
      projectName,
      source: "manual",
      reason: comment || "Flagged by user",
      status: "open",
      createdAt: now,
      comments: comment ? [{ author: "you@voicing.ai", body: comment, createdAt: now }] : [],
    };
    store.push(flag);
    return flag;
  }

  async updateFlagStatus(id: string, status: FlagStatus): Promise<void> {
    const f = flagStore().find((x) => x.id === id);
    if (f) f.status = status;
  }

  async addFlagComment(id: string, body: string): Promise<void> {
    const f = flagStore().find((x) => x.id === id);
    if (f && body.trim()) f.comments.push({ author: "you@voicing.ai", body: body.trim(), createdAt: new Date().toISOString() });
  }

  async listSipCalls(scope: Scope, filter: SipCallFilter, page: number, pageSize: number): Promise<SipCallPage> {
    const { projects, orgs } = getDataset();
    const projName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
    const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? id;

    let rows = scopedCalls(scope).map((c) => ({
      call: c,
      summary: buildSipSummary(c, projects.find((p) => p.id === c.projectId)!),
    }));

    if (filter.origin) rows = rows.filter((r) => r.summary.origin.includes(filter.origin!));
    if (filter.destination) rows = rows.filter((r) => r.summary.destination.includes(filter.destination!));
    if (filter.sipCallId) {
      const q = filter.sipCallId.toLowerCase();
      rows = rows.filter((r) => r.summary.sipCallId.toLowerCase().includes(q) || (r.summary.linkedCallId ?? "").toLowerCase().includes(q));
    }
    if (filter.status) rows = rows.filter((r) => r.summary.status === filter.status);
    rows.sort((a, b) => b.summary.startTime.localeCompare(a.summary.startTime));

    const total = rows.length;
    const failed = rows.filter((r) => r.summary.status === "fallida" || r.summary.status === "no_contesto");
    const answered = rows.filter((r) => r.summary.status === "finalizada" || r.summary.status === "activa");
    const failureRate = total > 0 ? +((failed.length / total) * 100).toFixed(1) : 0;
    const avgSetupMs = answered.length > 0 ? Math.round(answered.reduce((sum, r) => sum + r.call.latency.telephonyMs, 0) / answered.length) : 0;
    const codeCounts = new Map<number, number>();
    for (const r of failed) {
      if (r.summary.finalStatusCode != null) codeCounts.set(r.summary.finalStatusCode, (codeCounts.get(r.summary.finalStatusCode) ?? 0) + 1);
    }
    const topFailureCodes = Array.from(codeCounts.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const start = (page - 1) * pageSize;
    const slice = rows.slice(start, start + pageSize);

    return {
      rows: slice.map((r) => ({ ...r.summary, projectName: projName(r.summary.projectId), orgName: orgName(r.summary.orgId) })),
      total,
      page,
      pageSize,
      stats: { totalCalls: total, failureRate, avgSetupMs, topFailureCodes },
    };
  }

  async getSipCallDetail(sipCallId: string): Promise<SipCallDetail | null> {
    const { calls, projects, orgs } = getDataset();
    const call = calls.find((c) => c.callId === sipCallId || c.id === sipCallId || `sip-${c.id}` === sipCallId);
    if (!call) return null;
    const project = projects.find((p) => p.id === call.projectId)!;
    const summary = buildSipSummary(call, project);
    const linkedCall = {
      callId: call.callId,
      projectName: project.name,
      orgName: orgs.find((o) => o.id === call.orgId)?.name ?? call.orgId,
    };
    return buildSipCallDetail(call, summary, linkedCall);
  }
}
