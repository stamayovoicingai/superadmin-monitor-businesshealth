import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import type { UpdateFallbackInput } from "@/lib/data/source";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getDataSource().getFallbacks({
    orgId: sp.get("orgId") || undefined,
    projectId: sp.get("projectId") || undefined,
  });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Partial<UpdateFallbackInput>;
  if (!body.service || !body.scopeType || body.scopeId === undefined) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  await getDataSource().updateFallback({
    service: body.service,
    scopeType: body.scopeType,
    scopeId: body.scopeId,
    enabled: body.enabled,
    fallbackModel: body.fallbackModel,
    orderedModels: body.orderedModels,
  });
  return NextResponse.json({ ok: true });
}
