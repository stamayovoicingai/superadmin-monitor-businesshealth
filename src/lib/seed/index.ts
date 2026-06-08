/**
 * Deterministic demo dataset — 3 orgs, 6 projects, agents, contracts, ~30 days of calls.
 * Values are reproducible (seeded RNG); call timestamps are anchored to "now" so the demo
 * always looks recent. See PRD/13 §3 and PRD/15 (small curated seed).
 */
import type {
  Agent,
  Call,
  CallEndReason,
  CallStatus,
  Disposition,
  Organization,
  OrgContract,
  Project,
} from "@/lib/types";
import { usdToMicros } from "@/lib/money";
import { computeCallCost } from "@/lib/engine/cost";
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

const END_REASONS: { value: CallEndReason; weight: number }[] = [
  { value: "USER_DISCONNECTED", weight: 0.34 },
  { value: "CALL_END_PHRASE_TRIGGERED", weight: 0.3 },
  { value: "USER_IDLE", weight: 0.15 },
  { value: "CALL_TRANSFERRED", weight: 0.13 },
  { value: "OTHER", weight: 0.08 },
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
    default:
      return "completed";
  }
}

export interface Dataset {
  generatedAt: string;
  orgs: Organization[];
  projects: Project[];
  agents: Agent[];
  contracts: OrgContract[];
  calls: Call[];
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
