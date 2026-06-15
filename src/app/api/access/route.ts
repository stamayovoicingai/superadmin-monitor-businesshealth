import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import { isValidIpOrCidr } from "@/lib/engine/ip";
import type { AddIpRuleInput, SetIpPolicyInput } from "@/lib/data/source";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const data = await getDataSource().listIpRules({
    orgId: sp.get("orgId") || undefined,
    projectId: sp.get("projectId") || undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<AddIpRuleInput>;
  if (!body.scopeType || !body.scopeId || !body.listType || !body.value) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!isValidIpOrCidr(body.value)) {
    return NextResponse.json({ error: "invalid_ip_or_cidr" }, { status: 400 });
  }
  const rule = await getDataSource().addIpRule({
    scopeType: body.scopeType,
    scopeId: body.scopeId,
    listType: body.listType,
    value: body.value,
    label: body.label ?? "",
  });
  return NextResponse.json(rule, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await getDataSource().deleteIpRule(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Partial<SetIpPolicyInput>;
  if (!body.scopeType || !body.scopeId || !body.defaultPolicy) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  await getDataSource().setIpPolicy({
    scopeType: body.scopeType,
    scopeId: body.scopeId,
    defaultPolicy: body.defaultPolicy,
  });
  return NextResponse.json({ ok: true });
}
