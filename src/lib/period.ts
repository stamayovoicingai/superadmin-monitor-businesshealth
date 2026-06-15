/** Time-range presets → {from, to} ISO. See PRD/02 §5. */

export type RangePreset = "24h" | "7d" | "30d" | "live";

export const RANGE_LABELS: Record<RangePreset, string> = {
  live: "Live",
  "24h": "Last 24h",
  "7d": "Last 7d",
  "30d": "Last 30d",
};

export const RANGE_PRESETS: RangePreset[] = ["24h", "7d", "30d"];

export function resolveRange(preset: RangePreset, now = new Date()): { from: string; to: string } {
  const to = now.toISOString();
  const ms =
    preset === "24h" ? 86400000 : preset === "7d" ? 7 * 86400000 : 30 * 86400000;
  return { from: new Date(now.getTime() - ms).toISOString(), to };
}

export function parsePreset(value: string | undefined | null): RangePreset {
  if (value === "24h" || value === "7d" || value === "30d" || value === "live") return value;
  return "30d";
}

/** A range is either a preset or an explicit custom window. */
export interface RangeState {
  preset: RangePreset | "custom";
  from?: string; // ISO (custom)
  to?: string; // ISO (custom)
}

export function resolveRangeState(s: RangeState, now = new Date()): { from: string; to: string } {
  if (s.preset === "custom" && s.from && s.to) return { from: s.from, to: s.to };
  return resolveRange(s.preset === "custom" || s.preset === "live" ? "24h" : s.preset, now);
}

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function rangeLabel(s: RangeState): string {
  if (s.preset === "custom" && s.from && s.to) return `${fmtShort(s.from)} – ${fmtShort(s.to)}`;
  return RANGE_LABELS[s.preset as RangePreset] ?? "Custom";
}
