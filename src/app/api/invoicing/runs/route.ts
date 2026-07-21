import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getDataSource().listInvoiceRuns({
    orgId: sp.get("orgId") || undefined,
    projectId: sp.get("projectId") || undefined,
  });
  return NextResponse.json(data);
}
