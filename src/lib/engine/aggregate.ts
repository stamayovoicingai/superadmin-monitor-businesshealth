/** Aggregation helpers — derive rollups/series from raw calls. */
import type {
  Call,
  CallEndReason,
  CallStatus,
  EndReasonCount,
  OrgContract,
  OrgRollup,
  PodLoad,
  ProjectRollup,
  ServiceCostBreakdown,
  StatusCount,
  TimePoint,
} from "@/lib/types";
import { computeMrr, computeOrgMonthlyRevenue } from "./cost";

export const emptyService = (): ServiceCostBreakdown => ({
  llmMicros: 0,
  sttMicros: 0,
  ttsMicros: 0,
  telephonyMicros: 0,
  cloudMicros: 0,
});

function addCallToService(s: ServiceCostBreakdown, c: Call) {
  s.llmMicros += c.cost.llmMicros;
  s.sttMicros += c.cost.sttMicros;
  s.ttsMicros += c.cost.ttsMicros;
  s.telephonyMicros += c.cost.telephonyMicros;
  s.cloudMicros += c.cost.cloudMicros;
}

export interface CallFilter {
  orgId?: string;
  projectId?: string;
  agentId?: string;
  from?: string; // ISO inclusive
  to?: string; // ISO inclusive
  status?: CallStatus;
  closedReason?: CallEndReason;
  flagged?: boolean;
  minCostMicros?: number;
  search?: string;
}

export function filterCalls(calls: Call[], f: CallFilter = {}): Call[] {
  return calls.filter((c) => {
    if (f.orgId && c.orgId !== f.orgId) return false;
    if (f.projectId && c.projectId !== f.projectId) return false;
    if (f.agentId && c.agentId !== f.agentId) return false;
    if (f.status && c.status !== f.status) return false;
    if (f.closedReason && c.closedReason !== f.closedReason) return false;
    if (f.flagged !== undefined && c.flagged !== f.flagged) return false;
    if (f.minCostMicros !== undefined && c.cost.totalMicros < f.minCostMicros) return false;
    if (f.from && c.startTime < f.from) return false;
    if (f.to && c.startTime > f.to) return false;
    if (f.search) {
      const q = f.search.toLowerCase();
      if (
        !c.callId.toLowerCase().includes(q) &&
        !c.sessionId.toLowerCase().includes(q) &&
        !c.hostId.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
}

export function computeTotals(calls: Call[]) {
  const service = emptyService();
  let minutes = 0;
  let costMicros = 0;
  let revenueMicros = 0;
  let latencySum = 0;
  let errorCalls = 0;
  for (const c of calls) {
    addCallToService(service, c);
    minutes += c.durationSecs / 60;
    costMicros += c.cost.totalMicros;
    revenueMicros += c.cost.revenueMicros;
    latencySum += c.latency.totalMs;
    if (c.errorCount > 0) errorCalls++;
  }
  return {
    calls: calls.length,
    minutes,
    costMicros,
    revenueMicros,
    marginMicros: revenueMicros - costMicros,
    service,
    avgLatencyMs: calls.length ? Math.round(latencySum / calls.length) : 0,
    errorRate: calls.length ? errorCalls / calls.length : 0,
  };
}

export function projectRollups(calls: Call[], projectIds: string[]): ProjectRollup[] {
  return projectIds.map((projectId) => {
    const subset = calls.filter((c) => c.projectId === projectId);
    const t = computeTotals(subset);
    return {
      projectId,
      orgId: subset[0]?.orgId ?? "",
      calls: t.calls,
      minutes: t.minutes,
      costMicros: t.costMicros,
      revenueMicros: t.revenueMicros,
      marginMicros: t.marginMicros,
      service: t.service,
      avgLatencyMs: t.avgLatencyMs,
      errorRate: t.errorRate,
    };
  });
}

export function orgRollups(calls: Call[], contracts: OrgContract[]): OrgRollup[] {
  return contracts.map((contract) => {
    const subset = calls.filter((c) => c.orgId === contract.orgId);
    const t = computeTotals(subset);
    // Org revenue follows the contract formula (MGF B1); MRR per PRD §3.
    const monthlyRevenueMicros = computeOrgMonthlyRevenue(contract, t.minutes);
    const mrrMicros = computeMrr(contract, monthlyRevenueMicros);
    return {
      orgId: contract.orgId,
      calls: t.calls,
      minutes: t.minutes,
      costMicros: t.costMicros,
      revenueMicros: monthlyRevenueMicros,
      marginMicros: monthlyRevenueMicros - t.costMicros,
      service: t.service,
      mrrMicros,
    };
  });
}

/** Daily timeseries over the calls' range. */
export function dailySeries(calls: Call[]): TimePoint[] {
  const byDay = new Map<string, TimePoint>();
  for (const c of calls) {
    const date = c.startTime.slice(0, 10);
    let p = byDay.get(date);
    if (!p) {
      p = {
        date,
        costMicros: 0,
        revenueMicros: 0,
        marginMicros: 0,
        minutes: 0,
        calls: 0,
        service: emptyService(),
      };
      byDay.set(date, p);
    }
    p.costMicros += c.cost.totalMicros;
    p.revenueMicros += c.cost.revenueMicros;
    p.marginMicros += c.cost.revenueMicros - c.cost.totalMicros;
    p.minutes += c.durationSecs / 60;
    p.calls += 1;
    addCallToService(p.service, c);
  }
  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function podLoads(activeCalls: Call[]): PodLoad[] {
  const m = new Map<string, number>();
  for (const c of activeCalls) m.set(c.hostId, (m.get(c.hostId) ?? 0) + 1);
  return Array.from(m.entries())
    .map(([hostId, activeCalls]) => ({ hostId, activeCalls }))
    .sort((a, b) => b.activeCalls - a.activeCalls);
}

export function endReasonCounts(calls: Call[]): EndReasonCount[] {
  const order: CallEndReason[] = [
    "USER_DISCONNECTED",
    "CALL_END_PHRASE_TRIGGERED",
    "USER_IDLE",
    "CALL_TRANSFERRED",
    "OTHER",
  ];
  const m = new Map<CallEndReason, number>();
  for (const c of calls) if (c.closedReason) m.set(c.closedReason, (m.get(c.closedReason) ?? 0) + 1);
  return order.map((reason) => ({ reason, count: m.get(reason) ?? 0 }));
}

/** New vs returning callers per day (first-seen across the given calls = "new"). */
export function callerSeries(calls: Call[]): {
  series: { date: string; newCallers: number; returningCallers: number }[];
  newTotal: number;
  returningTotal: number;
} {
  const sorted = [...calls].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const seen = new Set<string>();
  const byDay = new Map<string, { n: number; r: number }>();
  let newTotal = 0;
  let returningTotal = 0;
  for (const c of sorted) {
    const d = c.startTime.slice(0, 10);
    const e = byDay.get(d) ?? { n: 0, r: 0 };
    if (seen.has(c.callerHash)) {
      e.r++;
      returningTotal++;
    } else {
      seen.add(c.callerHash);
      e.n++;
      newTotal++;
    }
    byDay.set(d, e);
  }
  const series = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, e]) => ({ date, newCallers: e.n, returningCallers: e.r }));
  return { series, newTotal, returningTotal };
}

/** Count of distinct agents that handled at least one call. */
export function activeAgentsCount(calls: Call[]): number {
  return new Set(calls.map((c) => c.agentId)).size;
}

export function statusCounts(calls: Call[]): StatusCount[] {
  const order: CallStatus[] = ["ACTIVE", "COMPLETED", "FAILED"];
  const m = new Map<CallStatus, number>();
  for (const c of calls) m.set(c.status, (m.get(c.status) ?? 0) + 1);
  return order.map((status) => ({ status, count: m.get(status) ?? 0 }));
}
