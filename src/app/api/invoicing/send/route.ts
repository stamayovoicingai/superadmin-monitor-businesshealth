import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { orgId?: string; projectId?: string; from?: string; to?: string };
  const run = await getDataSource().sendInvoiceNow({ orgId: body.orgId, projectId: body.projectId }, body.from, body.to);
  if (!run) return NextResponse.json({ error: "no_config_for_scope" }, { status: 404 });
  return NextResponse.json(run, { status: 201 });
}
