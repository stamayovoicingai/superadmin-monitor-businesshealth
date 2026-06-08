/** Parse request search params into a DataSource Scope. */
import type { Scope } from "@/lib/data/source";
import { parsePreset, resolveRange } from "@/lib/period";

export function scopeFromSearch(sp: URLSearchParams): Scope & { range: string } {
  const orgId = sp.get("orgId") || undefined;
  const projectId = sp.get("projectId") || undefined;
  const range = parsePreset(sp.get("range"));
  const { from, to } = resolveRange(range === "live" ? "24h" : range);
  return { orgId, projectId, from, to, range };
}
