/**
 * Cost / revenue / margin engine — pure functions shared by the seed generator and
 * (future) production ETL. See PRD/03-cost-revenue-margin.md.
 */
import type { CallCost, CallUsage, OrgContract } from "@/lib/types";
import { MICROS_PER_USD } from "@/lib/money";
import {
  CLOUD_RATE_PER_MIN,
  LLM_RATES,
  STT_RATES,
  TELEPHONY_RATE_PER_MIN,
  TTS_RATES,
} from "./pricing";

const round = Math.round;

/** LLM cost in micro-USD for given token counts and model (shared by calls and subagents). */
export function llmCostMicros(model: string, inputTokens: number, outputTokens: number): number {
  const r = LLM_RATES[model];
  return r ? round(inputTokens * r.inputPer1M + outputTokens * r.outputPer1M) : 0;
}

/** Per-call cost in micro-USD, decomposed by service. */
export function computeCallCost(
  usage: CallUsage,
  durationSecs: number,
  contract: OrgContract,
): CallCost {
  const llm = LLM_RATES[usage.llmModel];
  const stt = STT_RATES[usage.sttModel];
  const tts = TTS_RATES[usage.ttsModel];

  const llmMicros = llm
    ? round(usage.llmInputTokens * llm.inputPer1M + usage.llmOutputTokens * llm.outputPer1M)
    : 0;
  const sttMicros = stt ? round(usage.sttMinutes * stt.perMinute * MICROS_PER_USD) : 0;
  const ttsMicros = tts ? round((usage.ttsChars / 1000) * tts.per1kChars * MICROS_PER_USD) : 0;
  const telephonyMicros = round(usage.telephonyMinutes * TELEPHONY_RATE_PER_MIN * MICROS_PER_USD);

  const durationMin = durationSecs / 60;
  const cloudMicros = round(durationMin * CLOUD_RATE_PER_MIN * MICROS_PER_USD);

  const totalMicros = llmMicros + sttMicros + ttsMicros + telephonyMicros + cloudMicros;

  // Per-call revenue uses the marginal per-minute rate (org-level MGF floor handled separately).
  const revenueMicros = round(durationMin * contract.ratePerMinMicros);
  const marginMicros = revenueMicros - totalMicros;

  return {
    llmMicros,
    sttMicros,
    ttsMicros,
    telephonyMicros,
    cloudMicros,
    totalMicros,
    revenueMicros,
    marginMicros,
  };
}

/**
 * Org revenue for a monthly period (micro-USD). PRD §3.2 reading B1:
 * MGF includes a volume; overage billed only on minutes above the included volume.
 */
export function computeOrgMonthlyRevenue(contract: OrgContract, minutes: number): number {
  if (contract.contractType === "pure_usage") {
    return round(minutes * contract.ratePerMinMicros);
  }
  const overageMinutes = Math.max(0, minutes - contract.includedMinutes);
  return contract.mgfAmountMicros + round(overageMinutes * contract.overageRatePerMinMicros);
}

/** MRR contribution (micro-USD): MGF floor for mgf orgs; run-rate for usage orgs. */
export function computeMrr(contract: OrgContract, monthlyRevenueMicros: number): number {
  return contract.contractType === "mgf" ? contract.mgfAmountMicros : monthlyRevenueMicros;
}

export function marginPct(revenueMicros: number, costMicros: number): number {
  if (revenueMicros <= 0) return 0;
  return (revenueMicros - costMicros) / revenueMicros;
}
