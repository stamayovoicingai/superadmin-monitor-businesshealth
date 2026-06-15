/**
 * DataSource — the single typed contract every screen reads through.
 * Adapters: MockAdapter (now) and SupabaseAdapter (later). Swap via env DATA_SOURCE.
 * See PRD/13-technical-architecture.md §2.
 */
import type {
  Agent,
  Call,
  EndReasonCount,
  FallbackConfig,
  FallbackEvent,
  FallbackScopeType,
  FallbackService,
  HealthIncident,
  HealthService,
  IpDefaultPolicy,
  IpListType,
  IpRule,
  IpScopeType,
  Organization,
  OrgContract,
  OrgRollup,
  PodLoad,
  Project,
  ProjectRollup,
  RollupTotals,
  ServiceNotifyOverride,
  ServiceStatus,
  StatusCount,
  SubagentKey,
  TimePoint,
} from "@/lib/types";
import type { CallFilter } from "@/lib/engine/aggregate";

export interface Scope {
  orgId?: string;
  projectId?: string;
  from?: string; // ISO
  to?: string; // ISO
}

export interface OverviewResult {
  totals: RollupTotals & { avgLatencyMs: number; errorRate: number };
  activeConcurrency: number;
  /** Platform assistant (subagent) cost in scope — separate from call COGS/margin. */
  assistantCostMicros: number;
  projects: (ProjectRollup & { name: string; orgName: string })[];
  orgs: (OrgRollup & { name: string })[];
  costSeries: TimePoint[];
}

export interface CostResult {
  totals: RollupTotals;
  series: TimePoint[];
  projects: (ProjectRollup & { name: string; orgName: string })[];
  orgs: (OrgRollup & { name: string })[];
}

export interface PerformanceResult {
  avgLatencyMs: number;
  errorRate: number;
  perService: { llmMs: number; sttMs: number; ttsMs: number; toolMs: number; telephonyMs: number };
  latencySeries: { date: string; totalMs: number; llmMs: number; sttMs: number; ttsMs: number }[];
}

export interface CallPage {
  rows: (Call & { projectName: string; orgName: string; agentName: string })[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CallDetail {
  call: Call;
  projectName: string;
  orgName: string;
  agentName: string;
}

export interface LiveOpsResult {
  concurrency: number;
  activePods: number;
  closedInPeriod: number;
  errorsInPeriod: number;
  podLoads: PodLoad[];
  statusCounts: StatusCount[];
  endReasonCounts: EndReasonCount[];
  activeCalls: (Call & { projectName: string })[];
}

export interface BusinessHealthResult {
  // Voicing business KPIs
  mrrMicros: number;
  mrrDeltaPct: number; // MoM
  churnRatePct: number;
  expansionMicros: number;
  // Platform usage KPIs (period)
  activeOrgs: number;
  newOrgs: number;
  activeAgents: number;
  totalMinutes: number;
  totalCalls: number;
  newCallers: number;
  returningCallers: number;
  // Series
  mrrSeries: { month: string; committedMicros: number; usageMicros: number; expansionMicros: number }[];
  orgGrowthSeries: { month: string; activeOrgs: number }[];
  usageSeries: { date: string; minutes: number; calls: number }[];
  callersSeries: { date: string; newCallers: number; returningCallers: number }[];
  orgs: { name: string; mrrMicros: number; marginMicros: number; minutes: number }[];
}

export interface IpRulesResult {
  /** Rules defined exactly at the requested scope (editable). */
  own: IpRule[];
  /** Org rules inherited by a project scope (read-only at project level). */
  inherited: IpRule[];
  /** Default action for the managed scope when no rule matches. */
  defaultPolicy: IpDefaultPolicy;
}

export interface SetIpPolicyInput {
  scopeType: IpScopeType;
  scopeId: string;
  defaultPolicy: IpDefaultPolicy;
}

export interface AddIpRuleInput {
  scopeType: IpScopeType;
  scopeId: string;
  listType: IpListType;
  value: string;
  label: string;
}

export interface AssistantUsageResult {
  totals: { costMicros: number; invocations: number; inputTokens: number; outputTokens: number };
  bySubagent: { subagent: SubagentKey; label: string; model: string; costMicros: number; invocations: number }[];
  byProject: { projectId: string; projectName: string; costMicros: number; invocations: number }[];
  series: { date: string; costMicros: number; invocations: number }[];
}

export interface ServiceFallback {
  service: FallbackService;
  config: FallbackConfig;
  isOverride: boolean; // true if a scope-specific override (not the global default)
}

export interface FallbacksResult {
  scopeLabel: string;
  services: ServiceFallback[];
  events: FallbackEvent[];
}

export interface UpdateFallbackInput {
  service: FallbackService;
  scopeType: FallbackScopeType;
  scopeId: string | null;
  enabled?: boolean;
  fallbackModel?: string;
  orderedModels?: string[];
}

export interface HealthResult {
  services: HealthService[];
  incidents: HealthIncident[];
  summary: Record<ServiceStatus, number>;
  recipients: string[]; // per-project recipients (when a project is in scope)
  overrides: ServiceNotifyOverride[]; // overrides for services in scope
}

export interface SetRecipientsInput {
  scopeId: string; // project id
  emails: string[];
}

export interface SetServiceOverrideInput {
  serviceId: string;
  emails: string[];
}

export interface DataSource {
  listOrgs(): Promise<Organization[]>;
  listProjects(orgId?: string): Promise<Project[]>;
  listAgents(projectId?: string): Promise<Agent[]>;
  getContract(orgId: string): Promise<OrgContract | null>;

  overview(scope: Scope): Promise<OverviewResult>;
  cost(scope: Scope): Promise<CostResult>;
  performance(scope: Scope): Promise<PerformanceResult>;
  listCalls(filter: CallFilter, page: number, pageSize: number): Promise<CallPage>;
  getCall(callId: string): Promise<CallDetail | null>;
  liveOps(scope: Scope): Promise<LiveOpsResult>;
  businessHealth(scope: Scope): Promise<BusinessHealthResult>;
  assistantUsage(scope: Scope): Promise<AssistantUsageResult>;

  listIpRules(scope: Scope): Promise<IpRulesResult>;
  addIpRule(input: AddIpRuleInput): Promise<IpRule>;
  deleteIpRule(id: string): Promise<void>;
  setIpPolicy(input: SetIpPolicyInput): Promise<void>;

  getFallbacks(scope: Scope): Promise<FallbacksResult>;
  updateFallback(input: UpdateFallbackInput): Promise<void>;

  health(scope: Scope): Promise<HealthResult>;
  setRecipients(input: SetRecipientsInput): Promise<void>;
  setServiceOverride(input: SetServiceOverrideInput): Promise<void>;
}
