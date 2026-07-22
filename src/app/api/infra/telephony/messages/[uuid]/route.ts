import { NextResponse } from "next/server";
import { getTelephonySource } from "@/lib/telephony-source";

export async function GET(_req: Request, ctx: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await ctx.params;
  const data = await getTelephonySource().getSipMessagePayload(uuid);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(data);
}
