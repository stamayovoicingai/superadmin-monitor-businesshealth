/** Parse request search params into a DataSource Scope. */
import type { Scope } from "@/lib/data/source";
import { parsePreset, resolveRange } from "@/lib/period";

export function scopeFromSearch(sp: URLSearchParams): Scope & { range: string } {
  const orgId = sp.get("orgId") || undefined;
  const projectId = sp.get("projectId") || undefined;
  const fromParam = sp.get("from");
  const toParam = sp.get("to");
  if (fromParam && toParam) {
    return { orgId, projectId, from: fromParam, to: toParam, range: "custom" };
  }
  const preset = parsePreset(sp.get("range"));
  const { from, to } = resolveRange(preset === "live" ? "24h" : preset);
  return { orgId, projectId, from, to, range: preset };
}
