/** MockAdapter — implements DataSource from the deterministic seed dataset. */
import type { Call } from "@/lib/types";
import { getDataset } from "@/lib/seed";
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
  BusinessHealthResult,
  CallDetail,
  CallPage,
  CostResult,
  DataSource,
  LiveOpsResult,
  OverviewResult,
  PerformanceResult,
  Scope,
} from "./source";

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
}
