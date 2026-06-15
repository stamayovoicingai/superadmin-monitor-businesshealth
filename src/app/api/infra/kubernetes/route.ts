import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import { scopeFromSearch } from "@/lib/scope";

export async function GET(req: NextRequest) {
  const scope = scopeFromSearch(req.nextUrl.searchParams);
  const data = await getDataSource().infraK8s(scope);
  return NextResponse.json(data);
}
