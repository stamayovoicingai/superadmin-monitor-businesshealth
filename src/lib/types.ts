/**
 * Domain types — aligned with PRD/12-data-model.md.
 * Money is stored as integer micro-USD (1e-6 USD) to avoid float drift.
 */

export type Role = "superadmin" | "user";

export type ContractType = "pure_usage" | "mgf";

export type CallStatus = "ACTIVE" | "COMPLETED" | "FAILED";

export type CallEndReason =
  | "USER_IDLE"
  | "USER_DISCONNECTED"
  | "CALL_TRANSFERRED"
  | "CALL_END_PHRASE_TRIGGERED"
  | "OTHER";

export type Disposition =
  | "completed"
  | "transferred"
  | "voicemail"
  | "no_answer"
  | "failed";

export type Severity = "critical" | "warning";

export type ServiceKey = "llm" | "stt" | "tts" | "telephony" | "cloud";

export type Provider =
  | "openai"
  | "anthropic"
  | "google"
  | "deepgram"
  | "assemblyai"
  | "elevenlabs"
  | "cartesia"
  | "twilio"
  | "aws"
  | "gcp"
  | "azure";

export interface Organization {
  id: string;
  name: string;
  status: "active" | "churned";
  onboardedAt: string; // ISO
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  namespace: string; // k8s namespace, e.g. telmex-bot-orchestration
  status: "active" | "paused";
  createdAt: string;
}

export interface Agent {
  id: string;
  projectId: string;
  name: string;
  status: "live" | "paused" | "online";
  createdAt: string;
}

/** Per-call usage measured per service. */
export interface CallUsage {
  llmModel: string;
  llmInputTokens: number;
  llmOutputTokens: number;
  sttModel: string;
  sttMinutes: number;
  ttsModel: string;
  ttsChars: number;
  telephonyMinutes: number;
}

/** Per-service cost breakdown in micro-USD. */
export interface CallCost {
  llmMicros: number;
  sttMicros: number;
  ttsMicros: number;
  telephonyMicros: number;
  cloudMicros: number;
  totalMicros: number;
  revenueMicros: number;
  marginMicros: number;
}

export interface CallLatency {
  totalMs: number;
  llmMs: number;
  sttMs: number;
  ttsMs: number;
  toolMs: number;
  telephonyMs: number;
}

export interface Call {
  id: string;
  callId: string; // external id
  sessionId: string;
  orgId: string;
  projectId: string;
  agentId: string;
  hostId: string; // pod
  startTime: string; // ISO
  endTime: string | null;
  durationSecs: number;
  status: CallStatus;
  closedReason: CallEndReason | null;
  disposition: Disposition;
  callerHash: string;
  usage: CallUsage;
  latency: CallLatency;
  cost: CallCost;
  recordingUrl: string | null;
  flagged: boolean;
  errorCount: number;
}

export interface OrgContract {
  orgId: string;
  contractType: ContractType;
  ratePerMinMicros: number;
  mgfAmountMicros: number; // monthly floor (mgf only)
  overageRatePerMinMicros: number; // mgf only
  includedMinutes: number; // derived for mgf
  billingCycleDay: number;
  currency: "USD";
}

/* ----- Aggregations ----- */

export interface ServiceCostBreakdown {
  llmMicros: number;
  sttMicros: number;
  ttsMicros: number;
  telephonyMicros: number;
  cloudMicros: number;
}

export interface RollupTotals {
  calls: number;
  minutes: number;
  costMicros: number;
  revenueMicros: number;
  marginMicros: number;
  service: ServiceCostBreakdown;
}

export interface ProjectRollup extends RollupTotals {
  projectId: string;
  orgId: string;
  avgLatencyMs: number;
  errorRate: number; // 0..1
}

export interface OrgRollup extends RollupTotals {
  orgId: string;
  mrrMicros: number;
}

export interface TimePoint {
  /** ISO date (day grain). */
  date: string;
  costMicros: number;
  revenueMicros: number;
  marginMicros: number;
  minutes: number;
  calls: number;
  service: ServiceCostBreakdown;
}

/* ----- IP Access Control (whitelist / blacklist) ----- */

export type IpListType = "allow" | "block";
export type IpScopeType = "org" | "project";
/** Default action for IPs that match no rule: "allow" = blacklist mode, "block" = whitelist mode. */
export type IpDefaultPolicy = "allow" | "block";

export interface IpScopePolicy {
  scopeType: IpScopeType;
  scopeId: string;
  defaultPolicy: IpDefaultPolicy;
}

export interface IpRule {
  id: string;
  scopeType: IpScopeType;
  scopeId: string; // orgId or projectId
  listType: IpListType;
  value: string; // single IP (e.g. 198.51.100.23) or CIDR (e.g. 203.0.113.0/24)
  label: string; // reason / note
  addedBy: string;
  createdAt: string; // ISO
}

/* ----- Platform assistant subagents (platform.voicing.ai) ----- */

export type SubagentKey = "prompt_writer" | "architecture" | "debugging" | "planning" | "general";

export interface SubagentUsageRow {
  projectId: string;
  subagent: SubagentKey;
  model: string;
  date: string; // YYYY-MM-DD
  invocations: number;
  inputTokens: number;
  outputTokens: number;
  costMicros: number;
}

export interface PodLoad {
  hostId: string;
  activeCalls: number;
}

export interface EndReasonCount {
  reason: CallEndReason;
  count: number;
}

export interface StatusCount {
  status: CallStatus;
  count: number;
}
