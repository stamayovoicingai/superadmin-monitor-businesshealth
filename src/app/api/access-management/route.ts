import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/data";
import type { CreateAppUserInput, UpdateAppUserInput } from "@/lib/data/source";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["pm", "dev", "financial"]);

export async function GET() {
  const data = await getDataSource().listAppUsers();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<CreateAppUserInput>;
  if (!body.email || !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  if (!body.role || !VALID_ROLES.has(body.role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }
  if (!body.grants || body.grants.length === 0) {
    return NextResponse.json({ error: "at_least_one_grant_required" }, { status: 400 });
  }
  const user = await getDataSource().createAppUser({
    email: body.email,
    role: body.role,
    grants: body.grants,
  });
  return NextResponse.json(user, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Partial<UpdateAppUserInput>;
  if (!body.id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  if (body.role && !VALID_ROLES.has(body.role)) {
    return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  }
  await getDataSource().updateAppUser({ id: body.id, role: body.role, grants: body.grants });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await getDataSource().deleteAppUser(id);
  return NextResponse.json({ ok: true });
}
