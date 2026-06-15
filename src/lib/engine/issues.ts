/**
 * Issues engine — evaluate calls against thresholds. See PRD/05 §4-5.
 * Two kinds of metric:
 *  - per_call: each breaching call is an affected call (latency, cost, duration).
 *  - aggregate: a rate computed over the scoped calls (error/abandonment/no-data/tool-success).
 */
import type {
  Call,
  CallEndReason,
  Comparator,
  Issue,
  IssueCategory,
  Severity,
  Threshold,
  ThresholdKind,
  ThresholdMetric,
} from "@/lib/types";
import { microsToUsd } from "@/lib/money";

export interface MetricMeta {
  label: string;
  kind: ThresholdKind;
  comparator: Comparator;
  unit: string;
  /** sensible default thresholds (warning, critical) */
  defaults: { warning: number; critical: number };
}

export const ISSUE_METRICS: Record<ThresholdMetric, MetricMeta> = {
  latency_ms: { label: "Call latency", kind: "per_call", comparator: "gt", unit: "ms", defaults: { warning: 1800, critical: 2600 } },
  cost_per_call_usd: { label: "Cost per call", kind: "per_call", comparator: "gt", unit: "USD", defaults: { warning: 0.5, critical: 0.9 } },
  call_duration_secs: { label: "Call duration", kind: "per_call", comparator: "gt", unit: "s", defaults: { warning: 420, critical: 600 } },
  error_rate: { label: "Error rate", kind: "aggregate", comparator: "gt", unit: "%", defaults: { warning: 5, critical: 10 } },
  abandonment_rate: { label: "Abandonment rate", kind: "aggregate", comparator: "gt", unit: "%", defaults: { warning: 12, critical: 20 } },
  no_data_rate: { label: "Calls without data", kind: "aggregate", comparator: "gt", unit: "%", defaults: { warning: 10, critical: 18 } },
  tool_success_rate: { label: "Tool-call success rate", kind: "aggregate", comparator: "lt", unit: "%", defaults: { warning: 90, critical: 80 } },
};

export const ABANDONMENT_REASONS: { value: CallEndReason; label: string }[] = [
  { value: "USER_DISCONNECTED", label: "User disconnected the call" },
  { value: "USER_IDLE", label: "Customer silence" },
  { value: "CALL_END_PHRASE_TRIGGERED", label: "Bot hung up" },
  { value: "PIPELINE_TTL_TRIGGERED", label: "Max duration reached" },
];

const DEFAULT_ABANDON_REASONS: CallEndReason[] = ["USER_DISCONNECTED", "USER_IDLE"];

export function formatMetric(metric: ThresholdMetric, value: number): string {
  const m = ISSUE_METRICS[metric];
  if (m.unit === "%") return `${value.toFixed(1)}%`;
  if (m.unit === "ms") return `${Math.round(value)} ms`;
  if (m.unit === "s") return `${Math.round(value)} s`;
  if (m.unit === "USD") return `$${value.toFixed(3)}`;
  return String(value);
}

/** Per-call value for a per_call metric. */
function perCallValue(metric: ThresholdMetric, c: Call): number {
  switch (metric) {
    case "latency_ms":
      return c.latency.totalMs;
    case "cost_per_call_usd":
      return microsToUsd(c.cost.totalMicros);
    case "call_duration_secs":
      return c.durationSecs;
    default:
      return 0;
  }
}

const breaches = (cmp: Comparator, value: number, threshold: number) =>
  cmp === "gt" ? value > threshold : value < threshold;

export interface EvalContext {
  categoryName: (id: string) => string;
  scopeLabel: (scopeType: Threshold["scopeType"], scopeId: string | null) => string;
  projectName: (projectId: string) => string;
}

/** Filter calls to a threshold's own scope. */
function callsInThresholdScope(calls: Call[], t: Threshold): Call[] {
  if (t.scopeType === "global" || !t.scopeId) return calls;
  if (t.scopeType === "org") return calls.filter((c) => c.orgId === t.scopeId);
  if (t.scopeType === "project") return calls.filter((c) => c.projectId === t.scopeId);
  if (t.scopeType === "agent") return calls.filter((c) => c.agentId === t.scopeId);
  return calls;
}

export function evaluateIssues(calls: Call[], thresholds: Threshold[], categories: IssueCategory[], ctx: EvalContext): Issue[] {
  void categories;
  const issues: Issue[] = [];

  for (const t of thresholds) {
    if (!t.enabled) continue;
    const meta = ISSUE_METRICS[t.metric];
    const scoped = callsInThresholdScope(calls, t);
    if (scoped.length === 0) continue;

    const base = {
      metric: t.metric,
      metricLabel: meta.label,
      kind: meta.kind,
      categoryId: t.categoryId,
      categoryName: ctx.categoryName(t.categoryId),
      scopeType: t.scopeType,
      scopeId: t.scopeId,
      scopeLabel: ctx.scopeLabel(t.scopeType, t.scopeId),
      comparator: meta.comparator,
      unit: meta.unit,
      status: "open" as const,
    };

    if (meta.kind === "per_call") {
      const evaluate = (sev: Severity, threshold: number, exclude: Set<string>) => {
        const hits = scoped.filter((c) => !exclude.has(c.id) && breaches(meta.comparator, perCallValue(t.metric, c), threshold));
        if (hits.length === 0) return;
        hits.forEach((c) => exclude.add(c.id));
        const times = hits.map((c) => c.startTime).sort();
        const worst = hits.reduce((m, c) => Math.max(m, perCallValue(t.metric, c)), 0);
        issues.push({
          ...base,
          id: `issue-${t.id}-${sev}`,
          severity: sev,
          value: worst,
          thresholdValue: threshold,
          count: hits.length,
          affectedProjects: [...new Set(hits.map((c) => ctx.projectName(c.projectId)))],
          affectedCalls: hits.slice(0, 50).map((c) => ({
            callId: c.callId,
            projectId: c.projectId,
            projectName: ctx.projectName(c.projectId),
            timestamp: c.startTime,
            value: perCallValue(t.metric, c),
          })),
          firstSeen: times[0],
          lastSeen: times[times.length - 1],
        });
      };
      const seen = new Set<string>();
      evaluate("critical", t.critical, seen);
      evaluate("warning", t.warning, seen);
    } else {
      // aggregate
      const n = scoped.length;
      let rate = 0;
      let contributing: Call[] = [];
      if (t.metric === "error_rate") {
        contributing = scoped.filter((c) => c.errorCount > 0);
        rate = (100 * contributing.length) / n;
      } else if (t.metric === "abandonment_rate") {
        const reasons = new Set(t.reasons ?? DEFAULT_ABANDON_REASONS);
        contributing = scoped.filter((c) => c.closedReason && reasons.has(c.closedReason));
        rate = (100 * contributing.length) / n;
      } else if (t.metric === "no_data_rate") {
        contributing = scoped.filter((c) => !c.hasData);
        rate = (100 * contributing.length) / n;
      } else if (t.metric === "tool_success_rate") {
        const totalTool = scoped.reduce((s, c) => s + c.toolCalls, 0);
        const totalFail = scoped.reduce((s, c) => s + c.toolFailures, 0);
        rate = totalTool > 0 ? (100 * (totalTool - totalFail)) / totalTool : 100;
        contributing = scoped.filter((c) => c.toolFailures > 0);
      }

      const sev: Severity | null = breaches(meta.comparator, rate, t.critical)
        ? "critical"
        : breaches(meta.comparator, rate, t.warning)
          ? "warning"
          : null;
      if (!sev) continue;

      const times = contributing.map((c) => c.startTime).sort();
      issues.push({
        ...base,
        id: `issue-${t.id}`,
        severity: sev,
        value: rate,
        thresholdValue: sev === "critical" ? t.critical : t.warning,
        count: contributing.length,
        affectedProjects: [...new Set(contributing.map((c) => ctx.projectName(c.projectId)))],
        affectedCalls: contributing.slice(0, 50).map((c) => ({
          callId: c.callId,
          projectId: c.projectId,
          projectName: ctx.projectName(c.projectId),
          timestamp: c.startTime,
          value: perCallValue(t.metric, c),
        })),
        firstSeen: times[0] ?? scoped[0].startTime,
        lastSeen: times[times.length - 1] ?? scoped[scoped.length - 1].startTime,
      });
    }
  }

  // critical first, then by count
  return issues.sort((a, b) => (a.severity === b.severity ? b.count - a.count : a.severity === "critical" ? -1 : 1));
}
