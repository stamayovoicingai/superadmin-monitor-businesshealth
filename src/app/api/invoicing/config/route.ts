import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import type { SaveInvoiceConfigInput } from "@/lib/data/source";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getDataSource().getInvoiceScopeState({
    orgId: sp.get("orgId") || undefined,
    projectId: sp.get("projectId") || undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<SaveInvoiceConfigInput>;
  if (!body.scopeType || !body.scopeId || !body.recipients?.length || !body.frequency || !body.timezone || !body.columns?.length) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const config = await getDataSource().saveInvoiceConfig({
    scopeType: body.scopeType,
    scopeId: body.scopeId,
    recipients: body.recipients,
    frequency: body.frequency,
    frequencyDays: body.frequencyDays,
    timezone: body.timezone,
    emailSubject: body.emailSubject ?? "",
    emailBody: body.emailBody ?? "",
    columns: body.columns,
    excludeCallerIds: body.excludeCallerIds ?? [],
    excludeCallIds: body.excludeCallIds ?? [],
    active: body.active ?? true,
  });
  return NextResponse.json(config, { status: 201 });
}
