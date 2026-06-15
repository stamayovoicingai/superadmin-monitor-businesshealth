import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import type { SetRecipientsInput, SetServiceOverrideInput } from "@/lib/data/source";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getDataSource().health({
    orgId: sp.get("orgId") || undefined,
    projectId: sp.get("projectId") || undefined,
  });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as
    | ({ kind: "recipients" } & SetRecipientsInput)
    | ({ kind: "override" } & SetServiceOverrideInput);
  const ds = getDataSource();
  if (body.kind === "recipients") {
    if (!body.scopeId) return NextResponse.json({ error: "missing_scope" }, { status: 400 });
    await ds.setRecipients({ scopeId: body.scopeId, emails: body.emails ?? [] });
  } else if (body.kind === "override") {
    if (!body.serviceId) return NextResponse.json({ error: "missing_service" }, { status: 400 });
    await ds.setServiceOverride({ serviceId: body.serviceId, emails: body.emails ?? [] });
  } else {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
