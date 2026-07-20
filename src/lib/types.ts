/**
 * Domain types — aligned with PRD/12-data-model.md.
 * Money is stored as integer micro-USD (1e-6 USD) to avoid float drift.
 */

export type Role = "superadmin" | "pm" | "dev" | "financial";
/** Roles that must be provisioned with access grants (everything except SuperAdmin). */
export type ScopedRole = "pm" | "dev" | "financial";

export type ContractType = "pure_usage" | "mgf";

export type CallStatus = "ACTIVE" | "COMPLETED" | "FAILED";

export type CallEndReason =
  | "USER_IDLE"
  | "USER_DISCONNECTED"
  | "CALL_TRANSFERRED"
  | "CALL_END_PHRASE_TRIGGERED"
  | "PIPELINE_TTL_TRIGGERED"
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
  /** Whether the bot captured the expected business data. */
  hasData: boolean;
  /** Tool/function calls made during the call and how many failed. */
  toolCalls: number;
  toolFailures: number;
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

/* ----- Issues & Thresholds ----- */

export type ThresholdMetric =
  | "latency_ms"
  | "cost_per_call_usd"
  | "call_duration_secs"
  | "error_rate"
  | "abandonment_rate"
  | "no_data_rate"
  | "tool_success_rate";

export type ThresholdKind = "per_call" | "aggregate";
export type Comparator = "gt" | "lt";
export type ThresholdScopeType = "global" | "org" | "project" | "agent";

export interface IssueCategory {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Threshold {
  id: string;
  metric: ThresholdMetric;
  scopeType: ThresholdScopeType;
  scopeId: string | null;
  warning: number;
  critical: number;
  categoryId: string;
  enabled: boolean;
  /** For abandonment_rate: which closed reasons count as abandonment. */
  reasons?: CallEndReason[];
}

export interface IssueAffectedCall {
  callId: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  value: number; // the per-call value (for per-call metrics)
}

export interface Issue {
  id: string;
  metric: ThresholdMetric;
  metricLabel: string;
  kind: ThresholdKind;
  severity: Severity;
  categoryId: string;
  categoryName: string;
  scopeType: ThresholdScopeType;
  scopeId: string | null;
  scopeLabel: string;
  comparator: Comparator;
  value: number; // breaching value (rate %, or worst per-call value, or count)
  thresholdValue: number;
  unit: string;
  count: number; // affected calls
  affectedProjects: string[];
  affectedCalls: IssueAffectedCall[];
  firstSeen: string;
  lastSeen: string;
  status: "open" | "acknowledged" | "resolved";
}

/* ----- Call flags (manual + auto from Issues / QA Bench) ----- */

export type FlagStatus = "open" | "in_review" | "resolved" | "dismissed";

export interface FlagComment {
  author: string;
  body: string;
  createdAt: string;
}

export interface CallFlag {
  id: string;
  callId: string;
  orgId: string;
  projectId: string;
  projectName: string;
  source: "manual" | "auto";
  reason: string;
  metric?: ThresholdMetric;
  severity?: Severity;
  status: FlagStatus;
  createdAt: string;
  comments: FlagComment[];
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

/* ----- Provider Fallbacks (STT / TTS / LLM) ----- */

export type FallbackService = "stt" | "tts" | "llm";
export type FallbackScopeType = "global" | "org" | "project";

export interface FallbackConfig {
  service: FallbackService;
  scopeType: FallbackScopeType;
  scopeId: string | null; // null for global
  enabled: boolean;
  fallbackModel?: string; // stt / tts (single fallback)
  orderedModels?: string[]; // llm (cost-ordered list)
  updatedBy: string;
  updatedAt: string;
}

export interface FallbackEvent {
  id: string;
  timestamp: string;
  service: FallbackService;
  scopeLabel: string;
  fromModel: string;
  toModel: string;
  reason: string;
}

/* ----- Service Health (Uptime-Kuma style) ----- */

export type ServiceStatus = "operational" | "degraded" | "down" | "maintenance";
export type ServiceKind = "external" | "internal";

export interface HealthService {
  id: string;
  name: string;
  kind: ServiceKind;
  category: string; // LLM | STT | TTS | Telephony | Cloud | Platform | Internal
  provider?: string; // for external dependency mapping (openai, deepgram, twilio, aws…)
  scopeType: "global" | "project";
  scopeId: string | null; // project id for internal services
  status: ServiceStatus;
  uptimePct: number; // last 30d
  responseMs: number;
  lastCheck: string; // ISO
  heartbeats: ServiceStatus[]; // recent checks (oldest → newest) for the heartbeat bar
}

export interface HealthIncident {
  id: string;
  serviceId: string;
  serviceName: string;
  status: "degraded" | "down";
  startedAt: string;
  resolvedAt: string | null;
  affectedProjects: string[]; // project names impacted by this outage
}

/** Per-project default notification recipients. */
export interface NotifyRecipients {
  scopeId: string; // project id
  emails: string[];
}

/** Per-service recipient override (for critical services). */
export interface ServiceNotifyOverride {
  serviceId: string;
  emails: string[];
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

/* ----- Telephony Observability (SIP/RTP) — PRD/19 ----- */

export type SipCallStatus = "activa" | "finalizada" | "fallida" | "no_contesto";
export type SipDirection = "inbound" | "outbound";
export type SipTransport = "UDP" | "TCP" | "TLS";

export interface SipCallSummary {
  id: string; // internal id, e.g. sip-<call.id>
  sipCallId: string; // SIP "Call-ID" header value
  linkedCallId: string | null; // app-level Call.callId when correlatable
  orgId: string;
  projectId: string;
  direction: SipDirection;
  origin: string; // ANI
  destination: string; // DNIS
  startTime: string; // ISO
  endTime: string | null;
  durationSecs: number;
  status: SipCallStatus;
  finalStatusCode: number | null;
  finalReason: string | null;
  trunkHops: string[];
  methodsSequence: string[]; // compact chip sequence, e.g. ["100","INVITE","200","ACK"]
  retransmissions: number;
  codec: string;
}

export interface SipMessage {
  seq: number;
  ts: string; // ISO
  deltaMs: number; // offset from message #1
  method: string; // INVITE | 100 | 180 | 200 | ACK | BYE | 486 | ...
  sizeBytes: number;
  src: string; // ip:port
  dst: string; // ip:port
  transport: SipTransport;
  raw: string; // full raw SIP text (headers + body)
  headers: Record<string, string>;
  sdp: string | null;
}

export interface SipQualitySample {
  ts: string; // ISO
  direction: "caller" | "callee";
  jitterMs: number;
  packetLossPct: number;
  mos: number;
  rttMs: number;
  codec: string;
}

export type SipQualityVerdict = "pass" | "warn" | "fail";

export interface SipCallDetail {
  summary: SipCallSummary;
  linkedCall: { callId: string; projectName: string; orgName: string } | null;
  messages: SipMessage[];
  quality: SipQualitySample[];
  qualityVerdict: SipQualityVerdict;
}

/* ----- Access Management (User Provisioning) — PRD/20 ----- */

export type AccessScopeType = "org" | "project";

export interface AccessGrant {
  id: string;
  scopeType: AccessScopeType;
  scopeId: string; // orgId or projectId
}

/** A provisioned non-SuperAdmin identity: role + the orgs/projects they may see. */
export interface AppUser {
  id: string;
  email: string;
  role: ScopedRole;
  grants: AccessGrant[];
  createdAt: string;
}
