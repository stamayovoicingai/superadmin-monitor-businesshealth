import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import { parsePreset, resolveRange } from "@/lib/period";
import type { CallFilter } from "@/lib/engine/aggregate";
import type { CallEndReason, CallStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const fromParam = sp.get("from");
  const toParam = sp.get("to");
  let from: string;
  let to: string;
  if (fromParam && toParam) {
    from = fromParam;
    to = toParam;
  } else {
    const range = parsePreset(sp.get("range"));
    ({ from, to } = resolveRange(range === "live" ? "30d" : range));
  }
  const filter: CallFilter = {
    orgId: sp.get("orgId") || undefined,
    projectId: sp.get("projectId") || undefined,
    status: (sp.get("status") as CallStatus) || undefined,
    closedReason: (sp.get("closedReason") as CallEndReason) || undefined,
    flagged: sp.get("flagged") === "true" ? true : undefined,
    search: sp.get("search") || undefined,
    from,
    to,
  };
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? "25")));
  const data = await getDataSource().listCalls(filter, page, pageSize);
  return NextResponse.json(data);
}
