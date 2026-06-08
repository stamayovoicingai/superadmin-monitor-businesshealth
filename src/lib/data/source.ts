/**
 * DataSource — the single typed contract every screen reads through.
 * Adapters: MockAdapter (now) and SupabaseAdapter (later). Swap via env DATA_SOURCE.
 * See PRD/13-technical-architecture.md §2.
 */
import type {
  Agent,
  Call,
  EndReasonCount,
  Organization,
  OrgContract,
  OrgRollup,
  PodLoad,
  Project,
  ProjectRollup,
  RollupTotals,
  StatusCount,
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
}
