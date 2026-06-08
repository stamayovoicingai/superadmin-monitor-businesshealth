/**
 * Provider pricing catalog — illustrative seed rates (USD). CONFIRM real rates before
 * any external use. See PRD/03-cost-revenue-margin.md §2.2.
 *
 * All rates are in USD; the cost engine converts to micro-USD.
 */
import type { ServiceKey } from "@/lib/types";

export interface LlmRate {
  provider: string;
  model: string;
  /** USD per 1M input tokens. */
  inputPer1M: number;
  /** USD per 1M output tokens. */
  outputPer1M: number;
}

export interface PerMinuteRate {
  provider: string;
  model: string;
  perMinute: number; // USD/min
}

export interface PerKCharRate {
  provider: string;
  model: string;
  per1kChars: number; // USD per 1k characters
}

export const LLM_RATES: Record<string, LlmRate> = {
  "gpt-4.1": { provider: "openai", model: "gpt-4.1", inputPer1M: 2.0, outputPer1M: 8.0 },
  "gpt-4o": { provider: "openai", model: "gpt-4o", inputPer1M: 2.5, outputPer1M: 10.0 },
  "gpt-4o-mini": { provider: "openai", model: "gpt-4o-mini", inputPer1M: 0.15, outputPer1M: 0.6 },
  "claude-sonnet": { provider: "anthropic", model: "claude-sonnet", inputPer1M: 3.0, outputPer1M: 15.0 },
  "claude-haiku": { provider: "anthropic", model: "claude-haiku", inputPer1M: 0.8, outputPer1M: 4.0 },
  "gemini-1.5-pro": { provider: "google", model: "gemini-1.5-pro", inputPer1M: 1.25, outputPer1M: 5.0 },
  "gemini-flash": { provider: "google", model: "gemini-flash", inputPer1M: 0.075, outputPer1M: 0.3 },
};

export const STT_RATES: Record<string, PerMinuteRate> = {
  "deepgram-nova": { provider: "deepgram", model: "deepgram-nova", perMinute: 0.0059 },
  whisper: { provider: "openai", model: "whisper", perMinute: 0.006 },
  assemblyai: { provider: "assemblyai", model: "assemblyai", perMinute: 0.0065 },
};

export const TTS_RATES: Record<string, PerKCharRate> = {
  elevenlabs: { provider: "elevenlabs", model: "elevenlabs", per1kChars: 0.18 },
  cartesia: { provider: "cartesia", model: "cartesia", per1kChars: 0.05 },
  "openai-tts": { provider: "openai", model: "openai-tts", per1kChars: 0.015 },
};

export const TELEPHONY_RATE_PER_MIN = 0.013; // Twilio, USD/min (illustrative)

/** Amortized cloud/infra cost per talk-minute (compute+storage+egress). Allocation = talk-minutes. */
export const CLOUD_RATE_PER_MIN = 0.004;

export const SERVICE_LABELS: Record<ServiceKey, string> = {
  llm: "LLM",
  stt: "STT",
  tts: "TTS",
  telephony: "Telephony",
  cloud: "Cloud / Infra",
};

export const SERVICE_KEYS: ServiceKey[] = ["llm", "stt", "tts", "telephony", "cloud"];

export const LLM_MODEL_KEYS = Object.keys(LLM_RATES);
export const STT_MODEL_KEYS = Object.keys(STT_RATES);
export const TTS_MODEL_KEYS = Object.keys(TTS_RATES);
