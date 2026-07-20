/**
 * Deterministic demo dataset — 3 orgs, 6 projects, agents, contracts, ~30 days of calls.
 * Values are reproducible (seeded RNG); call timestamps are anchored to "now" so the demo
 * always looks recent. See PRD/13 §3 and PRD/15 (small curated seed).
 */
import type {
  Agent,
  AppUser,
  Call,
  CallEndReason,
  CallStatus,
  Disposition,
  FallbackConfig,
  FallbackEvent,
  HealthIncident,
  HealthService,
  IpRule,
  IpScopePolicy,
  IssueCategory,
  Threshold,
  NotifyRecipients,
  Organization,
  OrgContract,
  Project,
  ServiceNotifyOverride,
  ServiceStatus,
  SubagentUsageRow,
} from "@/lib/types";
import { usdToMicros } from "@/lib/money";
import { computeCallCost, llmCostMicros } from "@/lib/engine/cost";
import { SUBAGENTS } from "@/lib/engine/subagents";
import { LLM_RATES, STT_RATES, TTS_RATES } from "@/lib/engine/pricing";
import { Rng } from "./rng";

const SEED = 0x5a17c0de;
const DAYS = 30;

interface ProjectSeed {
  id: string;
  orgId: string;
  name: string;
  namespace: string;
  llmModel: string;
  sttModel: string;
  ttsModel: string;
  dailyBase: number;
  durMeanSecs: number;
  pods: number;
}

const ORGS: Organization[] = [
  { id: "org-tp-latam", name: "TP Latam", status: "active", onboardedAt: iso(daysAgo(420)) },
  { id: "org-tp-ph", name: "TP PH", status: "active", onboardedAt: iso(daysAgo(300)) },
  { id: "org-ltm", name: "LTM", status: "active", onboardedAt: iso(daysAgo(180)) },
];

const CONTRACTS: OrgContract[] = [
  {
    // TP Latam — Pure Usage (billed per consumed minute)
    orgId: "org-tp-latam",
    contractType: "pure_usage",
    ratePerMinMicros: usdToMicros(0.12),
    mgfAmountMicros: 0,
    overageRatePerMinMicros: 0,
    includedMinutes: 0,
    billingCycleDay: 1,
    currency: "USD",
  },
  {
    // TP PH — Minimum Guarantee Fee (B1: MGF includes a volume, overage on excess)
    orgId: "org-tp-ph",
    contractType: "mgf",
    ratePerMinMicros: usdToMicros(0.1),
    mgfAmountMicros: usdToMicros(6000),
    overageRatePerMinMicros: usdToMicros(0.11),
    includedMinutes: 7000, // MGF covers 7k min; overage billed beyond (drives expansion)
    billingCycleDay: 1,
    currency: "USD",
  },
  {
    // LTM — Minimum Guarantee Fee
    orgId: "org-ltm",
    contractType: "mgf",
    ratePerMinMicros: usdToMicros(0.14),
    mgfAmountMicros: usdToMicros(5000),
    overageRatePerMinMicros: usdToMicros(0.15),
    includedMinutes: 6000, // MGF covers 6k min; overage billed beyond (drives expansion)
    billingCycleDay: 1,
    currency: "USD",
  },
];

const PROJECTS: ProjectSeed[] = [
  // ----- TP Latam -----
  { id: "prj-telmex", orgId: "org-tp-latam", name: "Telmex", namespace: "telmex-bot-orchestration", llmModel: "gemini-flash", sttModel: "deepgram-nova", ttsModel: "cartesia", dailyBase: 70, durMeanSecs: 160, pods: 6 },
  { id: "prj-metlife", orgId: "org-tp-latam", name: "Metlife", namespace: "metlife-bot-orchestration", llmModel: "claude-sonnet", sttModel: "deepgram-nova", ttsModel: "elevenlabs", dailyBase: 40, durMeanSecs: 230, pods: 4 },
  { id: "prj-sura-eps", orgId: "org-tp-latam", name: "Sura EPS", namespace: "sura-eps-bot-orchestration", llmModel: "gpt-4o-mini", sttModel: "deepgram-nova", ttsModel: "cartesia", dailyBase: 55, durMeanSecs: 150, pods: 5 },
  { id: "prj-sura-sac", orgId: "org-tp-latam", name: "Sura SAC", namespace: "sura-sac-bot-orchestration", llmModel: "gpt-4o", sttModel: "assemblyai", ttsModel: "openai-tts", dailyBase: 35, durMeanSecs: 200, pods: 3 },
  { id: "prj-bridgeway", orgId: "org-tp-latam", name: "Bridgeway", namespace: "bridgeway-bot-orchestration", llmModel: "claude-haiku", sttModel: "whisper", ttsModel: "openai-tts", dailyBase: 30, durMeanSecs: 180, pods: 3 },
  { id: "prj-colsubsidio", orgId: "org-tp-latam", name: "Colsubsidio", namespace: "colsubsidio-bot-orchestration", llmModel: "gpt-4.1", sttModel: "deepgram-nova", ttsModel: "elevenlabs", dailyBase: 45, durMeanSecs: 210, pods: 4 },
  // ----- TP PH (fictitious clients) -----
  { id: "prj-pacifica-bank", orgId: "org-tp-ph", name: "Pacifica Bank", namespace: "pacifica-bank-bot-orchestration", llmModel: "gpt-4o", sttModel: "deepgram-nova", ttsModel: "openai-tts", dailyBase: 40, durMeanSecs: 190, pods: 4 },
  { id: "prj-islatel", orgId: "org-tp-ph", name: "IslaTel", namespace: "islatel-bot-orchestration", llmModel: "gemini-flash", sttModel: "deepgram-nova", ttsModel: "cartesia", dailyBase: 60, durMeanSecs: 150, pods: 5 },
  { id: "prj-medicare-ph", orgId: "org-tp-ph", name: "MediCare PH", namespace: "medicare-ph-bot-orchestration", llmModel: "claude-sonnet", sttModel: "assemblyai", ttsModel: "elevenlabs", dailyBase: 30, durMeanSecs: 240, pods: 3 },
  // ----- LTM -----
  { id: "prj-allegiant", orgId: "org-ltm", name: "Allegiant", namespace: "allegiant-bot-orchestration", llmModel: "gpt-4.1", sttModel: "whisper", ttsModel: "openai-tts", dailyBase: 50, durMeanSecs: 200, pods: 4 },
  { id: "prj-lla", orgId: "org-ltm", name: "LLA", namespace: "lla-bot-orchestration", llmModel: "claude-sonnet", sttModel: "deepgram-nova", ttsModel: "elevenlabs", dailyBase: 45, durMeanSecs: 220, pods: 4 },
  { id: "prj-vega-air", orgId: "org-ltm", name: "Vega Air", namespace: "vega-air-bot-orchestration", llmModel: "gpt-4o-mini", sttModel: "deepgram-nova", ttsModel: "cartesia", dailyBase: 35, durMeanSecs: 170, pods: 3 },
];

const IP_RULES_SEED: IpRule[] = [
  { id: "ip-1", scopeType: "org", scopeId: "org-tp-latam", listType: "block", value: "203.0.113.0/24", label: "TP request — fraud range", addedBy: "ops@voicing.ai", createdAt: iso(daysAgo(20)) },
  { id: "ip-2", scopeType: "org", scopeId: "org-tp-latam", listType: "block", value: "198.51.100.23", label: "Abuse report", addedBy: "ops@voicing.ai", createdAt: iso(daysAgo(12)) },
  { id: "ip-3", scopeType: "project", scopeId: "prj-telmex", listType: "allow", value: "190.85.0.0/16", label: "Telmex corporate egress only", addedBy: "ops@voicing.ai", createdAt: iso(daysAgo(9)) },
  { id: "ip-4", scopeType: "project", scopeId: "prj-telmex", listType: "allow", value: "181.49.10.5", label: "QA tester", addedBy: "qa@voicing.ai", createdAt: iso(daysAgo(4)) },
  { id: "ip-5", scopeType: "org", scopeId: "org-ltm", listType: "block", value: "45.146.0.0/16", label: "Geo block per LTM", addedBy: "ops@voicing.ai", createdAt: iso(daysAgo(7)) },
  { id: "ip-6", scopeType: "project", scopeId: "prj-allegiant", listType: "block", value: "102.129.0.0/16", label: "Bot traffic", addedBy: "ops@voicing.ai", createdAt: iso(daysAgo(3)) },
];

/** Provisioned PM/Dev/Financial identities (PRD/20). SuperAdmin isn't provisioned here (unscoped). */
const APP_USERS_SEED: AppUser[] = [
  {
    id: "appuser-1",
    email: "maria.pm@voicing.ai",
    role: "pm",
    grants: [{ id: "grant-1", scopeType: "org", scopeId: "org-tp-latam" }],
    createdAt: iso(daysAgo(60)),
  },
  {
    id: "appuser-2",
    email: "carlos.pm@voicing.ai",
    role: "pm",
    grants: [
      { id: "grant-2", scopeType: "project", scopeId: "prj-allegiant" },
      { id: "grant-3", scopeType: "project", scopeId: "prj-vega-air" },
    ],
    createdAt: iso(daysAgo(45)),
  },
  {
    id: "appuser-3",
    email: "ana.dev@voicing.ai",
    role: "dev",
    grants: [{ id: "grant-4", scopeType: "org", scopeId: "org-tp-ph" }],
    createdAt: iso(daysAgo(90)),
  },
  {
    id: "appuser-4",
    email: "luis.dev@voicing.ai",
    role: "dev",
    grants: [
      { id: "grant-5", scopeType: "project", scopeId: "prj-telmex" },
      { id: "grant-6", scopeType: "project", scopeId: "prj-sura-eps" },
    ],
    createdAt: iso(daysAgo(30)),
  },
  {
    id: "appuser-5",
    email: "jorge.financial@voicing.ai",
    role: "financial",
    grants: [
      { id: "grant-7", scopeType: "org", scopeId: "org-tp-latam" },
      { id: "grant-8", scopeType: "org", scopeId: "org-ltm" },
    ],
    createdAt: iso(daysAgo(75)),
  },
];

const IP_POLICIES_SEED: IpScopePolicy[] = [
  // Telmex restricts platform access to its corporate egress → whitelist (block by default).
  { scopeType: "project", scopeId: "prj-telmex", defaultPolicy: "block" },
  // Orgs default to blacklist mode (allow by default).
  { scopeType: "org", scopeId: "org-tp-latam", defaultPolicy: "allow" },
  { scopeType: "org", scopeId: "org-ltm", defaultPolicy: "allow" },
];

const FALLBACK_CONFIGS_SEED: FallbackConfig[] = [
  { service: "stt", scopeType: "global", scopeId: null, enabled: true, fallbackModel: "whisper", updatedBy: "ops@voicing.ai", updatedAt: iso(daysAgo(15)) },
  { service: "tts", scopeType: "global", scopeId: null, enabled: true, fallbackModel: "cartesia", updatedBy: "ops@voicing.ai", updatedAt: iso(daysAgo(15)) },
  { service: "llm", scopeType: "global", scopeId: null, enabled: true, orderedModels: ["gpt-4o", "claude-sonnet", "gemini-flash", "gpt-4o-mini"], updatedBy: "ops@voicing.ai", updatedAt: iso(daysAgo(10)) },
];

const FALLBACK_EVENTS_SEED: FallbackEvent[] = [
  { id: "fb-1", timestamp: iso(daysAgo(2)), service: "llm", scopeLabel: "All orgs", fromModel: "gpt-4o", toModel: "claude-sonnet", reason: "OpenAI 5xx spike (per-call)" },
  { id: "fb-2", timestamp: iso(daysAgo(1)), service: "tts", scopeLabel: "All orgs", fromModel: "elevenlabs", toModel: "cartesia", reason: "ElevenLabs latency > timeout" },
  { id: "fb-3", timestamp: iso(daysAgo(1)), service: "stt", scopeLabel: "Telmex", fromModel: "deepgram-nova", toModel: "whisper", reason: "Deepgram degraded" },
  { id: "fb-4", timestamp: iso(daysAgo(4)), service: "llm", scopeLabel: "All orgs", fromModel: "gpt-4o", toModel: "claude-sonnet", reason: "Rate limit (429)" },
];

const EXTERNAL_SERVICES: { provider: string; name: string; category: string; status: ServiceStatus }[] = [
  { provider: "openai", name: "OpenAI API", category: "LLM", status: "operational" },
  { provider: "anthropic", name: "Anthropic API", category: "LLM", status: "operational" },
  { provider: "google", name: "Google Gemini", category: "LLM", status: "operational" },
  { provider: "deepgram", name: "Deepgram STT", category: "STT", status: "degraded" },
  { provider: "assemblyai", name: "AssemblyAI STT", category: "STT", status: "operational" },
  { provider: "elevenlabs", name: "ElevenLabs TTS", category: "TTS", status: "operational" },
  { provider: "cartesia", name: "Cartesia TTS", category: "TTS", status: "down" },
  { provider: "twilio", name: "Twilio Telephony", category: "Telephony", status: "operational" },
  { provider: "aws", name: "AWS", category: "Cloud", status: "operational" },
  { provider: "gcp", name: "GCP", category: "Cloud", status: "operational" },
];

const INTERNAL_TEMPLATES = ["Call Orchestrator", "STT Pipeline", "TTS Pipeline", "LLM Router", "Webhooks", "Recordings Storage"];

const NOTIFY_SEED: NotifyRecipients[] = [
  { scopeId: "prj-telmex", emails: ["ops-telmex@tp.com", "oncall@voicing.ai"] },
  { scopeId: "prj-allegiant", emails: ["sre@ltm.com"] },
];

const SERVICE_OVERRIDE_SEED: ServiceNotifyOverride[] = [
  { serviceId: "svc-ext-deepgram", emails: ["stt-oncall@voicing.ai"] },
];

const SUBAGENT_WEIGHT: Record<string, number> = {
  prompt_writer: 1.4,
  general: 1.3,
  debugging: 1.1,
  architecture: 0.9,
  planning: 0.8,
};

const END_REASONS: { value: CallEndReason; weight: number }[] = [
  { value: "CALL_END_PHRASE_TRIGGERED", weight: 0.52 }, // bot ended normally
  { value: "USER_DISCONNECTED", weight: 0.18 },
  { value: "CALL_TRANSFERRED", weight: 0.12 },
  { value: "USER_IDLE", weight: 0.08 },
  { value: "PIPELINE_TTL_TRIGGERED", weight: 0.04 }, // max duration reached
  { value: "OTHER", weight: 0.06 },
];

function dispositionFor(reason: CallEndReason, failed: boolean): Disposition {
  if (failed) return "failed";
  switch (reason) {
    case "CALL_TRANSFERRED":
      return "transferred";
    case "CALL_END_PHRASE_TRIGGERED":
      return "completed";
    case "USER_IDLE":
      return "voicemail";
    case "USER_DISCONNECTED":
      return "no_answer";
    case "PIPELINE_TTL_TRIGGERED":
      return "failed";
    default:
      return "completed";
  }
}

const ISSUE_CATEGORIES_SEED: IssueCategory[] = [
  { id: "cat-infra", name: "Infra", isDefault: true },
  { id: "cat-compliance", name: "Compliance", isDefault: true },
  { id: "cat-technical", name: "Technical", isDefault: true },
  { id: "cat-effectiveness", name: "Effectiveness", isDefault: true },
];

const THRESHOLDS_SEED: Threshold[] = [
  { id: "th-latency", metric: "latency_ms", scopeType: "global", scopeId: null, warning: 1800, critical: 2600, categoryId: "cat-technical", enabled: true },
  { id: "th-cost", metric: "cost_per_call_usd", scopeType: "global", scopeId: null, warning: 0.5, critical: 0.9, categoryId: "cat-technical", enabled: true },
  { id: "th-duration", metric: "call_duration_secs", scopeType: "global", scopeId: null, warning: 420, critical: 600, categoryId: "cat-effectiveness", enabled: true },
  { id: "th-error", metric: "error_rate", scopeType: "global", scopeId: null, warning: 5, critical: 10, categoryId: "cat-technical", enabled: true },
  { id: "th-abandon", metric: "abandonment_rate", scopeType: "global", scopeId: null, warning: 20, critical: 30, categoryId: "cat-effectiveness", enabled: true, reasons: ["USER_DISCONNECTED", "USER_IDLE"] },
  { id: "th-nodata", metric: "no_data_rate", scopeType: "global", scopeId: null, warning: 10, critical: 18, categoryId: "cat-effectiveness", enabled: true },
  { id: "th-tool", metric: "tool_success_rate", scopeType: "global", scopeId: null, warning: 90, critical: 80, categoryId: "cat-technical", enabled: true },
];

export interface Dataset {
  generatedAt: string;
  orgs: Organization[];
  projects: Project[];
  agents: Agent[];
  contracts: OrgContract[];
  calls: Call[];
  ipRules: IpRule[];
  ipPolicies: IpScopePolicy[];
  subagentUsage: SubagentUsageRow[];
  fallbackConfigs: FallbackConfig[];
  fallbackEvents: FallbackEvent[];
  healthServices: HealthService[];
  healthIncidents: HealthIncident[];
  notifyRecipients: NotifyRecipients[];
  serviceNotifyOverrides: ServiceNotifyOverride[];
  issueCategories: IssueCategory[];
  thresholds: Threshold[];
  appUsers: AppUser[];
}

export function buildDataset(): Dataset {
  const rng = new Rng(SEED);
  const now = new Date();
  const projects: Project[] = [];
  const agents: Agent[] = [];
  const calls: Call[] = [];

  for (const ps of PROJECTS) {
    projects.push({
      id: ps.id,
      orgId: ps.orgId,
      name: ps.name,
      namespace: ps.namespace,
      status: "active",
      createdAt: iso(daysAgo(150)),
    });

    const agentCount = rng.int(1, 2);
    const projAgents: Agent[] = [];
    for (let a = 0; a < agentCount; a++) {
      const ag: Agent = {
        id: `${ps.id}-agent-${a + 1}`,
        projectId: ps.id,
        name: `${ps.name} Agent v${a + 1}`,
        status: rng.bool(0.85) ? "live" : "paused",
        createdAt: iso(daysAgo(120)),
      };
      agents.push(ag);
      projAgents.push(ag);
    }

    const pods = Array.from({ length: ps.pods }, (_, i) => `${shortNs(ps.namespace)}-pod-${i + 1}`);
    // Bounded caller pool so "new vs returning" callers is meaningful (~repeat rate).
    const callerPool = Math.max(50, ps.dailyBase * 8);

    for (let d = DAYS - 1; d >= 0; d--) {
      const day = new Date(now.getTime() - d * 86400000);
      const dow = day.getDay();
      const weekendFactor = dow === 0 || dow === 6 ? 0.45 : 1;
      const noise = rng.float(0.8, 1.2);
      const count = Math.max(1, Math.round(ps.dailyBase * weekendFactor * noise));

      for (let c = 0; c < count; c++) {
        const isToday = d === 0;
        const active = isToday && rng.bool(0.06);
        const failed = !active && rng.bool(0.03);

        const startMins = rng.gaussian(13 * 60, 3 * 60, 6 * 60, 22 * 60); // business hours
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        start.setMinutes(Math.round(startMins));

        const duration = Math.round(rng.gaussian(ps.durMeanSecs, ps.durMeanSecs * 0.4, 12, ps.durMeanSecs * 3));
        const status: CallStatus = active ? "ACTIVE" : failed ? "FAILED" : "COMPLETED";
        const reason: CallEndReason | null = active ? null : failed ? "OTHER" : rng.weighted(END_REASONS);

        const durMin = duration / 60;
        const llmInputTokens = Math.round(durMin * rng.float(700, 1300));
        const llmOutputTokens = Math.round(durMin * rng.float(250, 600));
        const ttsChars = Math.round(durMin * rng.float(450, 900));
        const sttMinutes = +(durMin * rng.float(0.55, 0.75)).toFixed(3); // caller speech portion
        const telephonyMinutes = +Math.ceil(durMin).toFixed(0);

        const usage = {
          llmModel: ps.llmModel,
          llmInputTokens,
          llmOutputTokens,
          sttModel: ps.sttModel,
          sttMinutes,
          ttsModel: ps.ttsModel,
          ttsChars,
          telephonyMinutes,
        };
        const contract = CONTRACTS.find((k) => k.orgId === ps.orgId)!;
        const cost = computeCallCost(usage, duration, contract);

        const latency = {
          llmMs: Math.round(rng.gaussian(620, 220, 180, 2600)),
          sttMs: Math.round(rng.gaussian(180, 70, 60, 900)),
          ttsMs: Math.round(rng.gaussian(240, 90, 80, 1200)),
          toolMs: rng.bool(0.4) ? Math.round(rng.gaussian(320, 200, 0, 1800)) : 0,
          telephonyMs: Math.round(rng.gaussian(90, 40, 20, 500)),
          totalMs: 0,
        };
        latency.totalMs = latency.llmMs + latency.sttMs + latency.ttsMs + latency.toolMs + latency.telephonyMs;

        const errorCount = failed ? rng.int(1, 4) : rng.bool(0.05) ? rng.int(1, 2) : 0;
        const hasData = active ? true : rng.bool(0.88);
        const toolCalls = latency.toolMs > 0 ? rng.int(1, 4) : 0;
        const toolFailures = toolCalls > 0 && rng.bool(0.18) ? rng.int(1, toolCalls) : 0;
        const agent = projAgents[rng.int(0, projAgents.length - 1)];
        const idx = calls.length + 1;

        calls.push({
          id: `call-${idx}`,
          callId: `CALL-${ps.id.slice(4, 9).toUpperCase()}-${idx}`,
          sessionId: `sess-${idx}-${rng.int(1000, 9999)}`,
          orgId: ps.orgId,
          projectId: ps.id,
          agentId: agent.id,
          hostId: pods[rng.int(0, pods.length - 1)],
          startTime: iso(start),
          endTime: active ? null : iso(new Date(start.getTime() + duration * 1000)),
          durationSecs: duration,
          status,
          closedReason: reason,
          disposition: dispositionFor(reason ?? "OTHER", failed),
          callerHash: `clr_${shortNs(ps.namespace)}_${rng.int(1, callerPool)}`,
          usage,
          latency,
          cost,
          recordingUrl: active ? null : `/recordings/call-${idx}.mp3`,
          flagged: !active && rng.bool(0.02),
          errorCount,
          hasData,
          toolCalls,
          toolFailures,
        });
      }
    }
  }

  // Platform assistant subagent usage (per project, per subagent, daily).
  const subagentUsage: SubagentUsageRow[] = [];
  for (const ps of PROJECTS) {
    for (const sa of SUBAGENTS) {
      const weight = SUBAGENT_WEIGHT[sa.key] ?? 1;
      const base = Math.max(1, (ps.dailyBase / 12) * weight); // invocations/day baseline
      for (let d = DAYS - 1; d >= 0; d--) {
        const day = new Date(now.getTime() - d * 86400000);
        const dow = day.getDay();
        const weekend = dow === 0 || dow === 6 ? 0.3 : 1;
        const invocations = Math.max(0, Math.round(rng.gaussian(base * weekend, base * 0.5, 0, base * 3)));
        if (invocations === 0) continue;
        const inputTokens = invocations * Math.round(rng.float(1800, 4200));
        const outputTokens = invocations * Math.round(rng.float(500, 1600));
        subagentUsage.push({
          projectId: ps.id,
          subagent: sa.key,
          model: sa.model,
          date: day.toISOString().slice(0, 10),
          invocations,
          inputTokens,
          outputTokens,
          costMicros: llmCostMicros(sa.model, inputTokens, outputTokens),
        });
      }
    }
  }

  // Service health (Uptime-Kuma style) — external dependencies + internal per-project services.
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const projectsUsingProvider = (provider: string): string[] => {
    if (provider === "twilio" || provider === "aws" || provider === "gcp") return PROJECTS.map((p) => p.name);
    return PROJECTS.filter((p) =>
      [LLM_RATES[p.llmModel]?.provider, STT_RATES[p.sttModel]?.provider, TTS_RATES[p.ttsModel]?.provider].includes(provider),
    ).map((p) => p.name);
  };
  const heartbeats = (status: ServiceStatus, n = 30): ServiceStatus[] => {
    const hb: ServiceStatus[] = [];
    for (let i = 0; i < n; i++) {
      const recent = i >= n - 4;
      if (status === "operational") hb.push(rng.bool(0.04) ? "degraded" : "operational");
      else if (status === "degraded") hb.push(recent ? (rng.bool(0.6) ? "degraded" : "operational") : rng.bool(0.12) ? "degraded" : "operational");
      else if (status === "down") hb.push(recent ? (rng.bool(0.7) ? "down" : "degraded") : rng.bool(0.08) ? "down" : "operational");
      else hb.push("maintenance");
    }
    return hb;
  };
  const uptimeFor = (status: ServiceStatus): number => {
    if (status === "operational") return +rng.float(99.5, 99.99).toFixed(2);
    if (status === "degraded") return +rng.float(98.0, 99.4).toFixed(2);
    if (status === "down") return +rng.float(95.0, 98.5).toFixed(2);
    return 99.9;
  };

  const healthServices: HealthService[] = [];
  const healthIncidents: HealthIncident[] = [];

  for (const ext of EXTERNAL_SERVICES) {
    const id = `svc-ext-${ext.provider}`;
    healthServices.push({
      id,
      name: ext.name,
      kind: "external",
      category: ext.category,
      provider: ext.provider,
      scopeType: "global",
      scopeId: null,
      status: ext.status,
      uptimePct: uptimeFor(ext.status),
      responseMs: Math.round(rng.gaussian(ext.status === "operational" ? 220 : 700, 200, 60, 2500)),
      lastCheck: iso(new Date(now.getTime() - rng.int(5, 90) * 1000)),
      heartbeats: heartbeats(ext.status),
    });
    if (ext.status !== "operational") {
      healthIncidents.push({
        id: `inc-ext-${ext.provider}`,
        serviceId: id,
        serviceName: ext.name,
        status: ext.status === "down" ? "down" : "degraded",
        startedAt: iso(new Date(now.getTime() - rng.int(30, 240) * 60000)),
        resolvedAt: null,
        affectedProjects: projectsUsingProvider(ext.provider),
      });
    }
  }

  for (const ps of PROJECTS) {
    for (const tmpl of INTERNAL_TEMPLATES) {
      const roll = rng.float(0, 1);
      const status: ServiceStatus = roll < 0.04 ? "down" : roll < 0.12 ? "degraded" : "operational";
      const id = `svc-${ps.id}-${slug(tmpl)}`;
      healthServices.push({
        id,
        name: tmpl,
        kind: "internal",
        category: "Internal",
        scopeType: "project",
        scopeId: ps.id,
        status,
        uptimePct: uptimeFor(status),
        responseMs: Math.round(rng.gaussian(120, 80, 20, 1200)),
        lastCheck: iso(new Date(now.getTime() - rng.int(5, 90) * 1000)),
        heartbeats: heartbeats(status),
      });
      if (status !== "operational") {
        healthIncidents.push({
          id: `inc-${id}`,
          serviceId: id,
          serviceName: `${ps.name} · ${tmpl}`,
          status: status === "down" ? "down" : "degraded",
          startedAt: iso(new Date(now.getTime() - rng.int(15, 180) * 60000)),
          resolvedAt: null,
          affectedProjects: [ps.name],
        });
      }
    }
  }

  return {
    generatedAt: iso(now),
    orgs: ORGS,
    projects,
    agents,
    contracts: CONTRACTS,
    calls,
    ipRules: IP_RULES_SEED,
    ipPolicies: IP_POLICIES_SEED,
    subagentUsage,
    fallbackConfigs: FALLBACK_CONFIGS_SEED,
    fallbackEvents: FALLBACK_EVENTS_SEED,
    healthServices,
    healthIncidents,
    notifyRecipients: NOTIFY_SEED,
    serviceNotifyOverrides: SERVICE_OVERRIDE_SEED,
    issueCategories: ISSUE_CATEGORIES_SEED,
    thresholds: THRESHOLDS_SEED,
    appUsers: APP_USERS_SEED,
  };
}

/* ---- helpers ---- */
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}
function iso(d: Date): string {
  return d.toISOString();
}
function shortNs(ns: string): string {
  return ns.replace("-bot-orchestration", "");
}

/* ---- singleton (memoized per server process) ---- */
let _dataset: Dataset | null = null;
export function getDataset(): Dataset {
  if (!_dataset) _dataset = buildDataset();
  return _dataset;
}
