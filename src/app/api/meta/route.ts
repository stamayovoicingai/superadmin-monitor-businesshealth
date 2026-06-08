import { NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";

export async function GET() {
  const ds = getDataSource();
  const [orgs, projects, agents] = await Promise.all([
    ds.listOrgs(),
    ds.listProjects(),
    ds.listAgents(),
  ]);
  return NextResponse.json({ orgs, projects, agents });
}
