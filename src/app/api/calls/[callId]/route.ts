import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";

export async function GET(_req: Request, ctx: { params: Promise<{ callId: string }> }) {
  const { callId } = await ctx.params;
  const data = await getDataSource().getCall(callId);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data);
}
