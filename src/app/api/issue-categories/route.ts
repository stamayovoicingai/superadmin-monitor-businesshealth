import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { name?: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "missing_name" }, { status: 400 });
  const cat = await getDataSource().createIssueCategory(body.name.trim());
  return NextResponse.json(cat, { status: 201 });
}
