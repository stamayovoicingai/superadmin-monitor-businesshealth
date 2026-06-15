/**
 * platform.voicing.ai assistant — composed of specialized subagents, each on its own LLM model.
 * Usage/cost is tracked per project and per subagent. See PRD/17-assistant-subagent-usage.md.
 */
import type { SubagentKey } from "@/lib/types";

export interface SubagentDef {
  key: SubagentKey;
  label: string;
  model: string; // default LLM model for this subagent
}

export const SUBAGENTS: SubagentDef[] = [
  { key: "prompt_writer", label: "Prompt Writer", model: "gpt-4o" },
  { key: "architecture", label: "Architecture", model: "claude-sonnet" },
  { key: "debugging", label: "Debugging", model: "gpt-4.1" },
  { key: "planning", label: "Planning", model: "gemini-1.5-pro" },
  { key: "general", label: "General Assistant", model: "gpt-4o-mini" },
];

export const SUBAGENT_LABEL: Record<SubagentKey, string> = Object.fromEntries(
  SUBAGENTS.map((s) => [s.key, s.label]),
) as Record<SubagentKey, string>;
