/**
 * Provider fallback config helpers. See PRD/08-module-fallbacks.md.
 * STT/TTS = single fallback model; LLM = cost-ordered list tried in sequence.
 */
import type { FallbackService } from "@/lib/types";
import { LLM_MODEL_KEYS, STT_MODEL_KEYS, TTS_MODEL_KEYS, LLM_RATES } from "./pricing";

/** Current platform-default ("primary") model per service — read-only in the UI. */
export const FALLBACK_PRIMARY: Record<FallbackService, string> = {
  stt: "deepgram-nova",
  tts: "elevenlabs",
  llm: "gpt-4o",
};

export const FALLBACK_OPTIONS: Record<FallbackService, string[]> = {
  stt: STT_MODEL_KEYS,
  tts: TTS_MODEL_KEYS,
  llm: LLM_MODEL_KEYS,
};

export const FALLBACK_SERVICE_LABEL: Record<FallbackService, string> = {
  stt: "Speech-to-Text",
  tts: "Text-to-Speech",
  llm: "LLM",
};

/** Informational cost string for an LLM model ("$X / $Y per 1M in/out"). */
export function llmCostLabel(model: string): string {
  const r = LLM_RATES[model];
  return r ? `$${r.inputPer1M} / $${r.outputPer1M} per 1M` : "—";
}
