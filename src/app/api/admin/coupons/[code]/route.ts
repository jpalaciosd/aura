import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest, { params }: { params: { code: string } }) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (typeof body.active === "boolean") update.active = body.active;
  if (typeof body.description === "string") update.description = body.description;
  if (typeof body.max_uses === "number" || body.max_uses === null) update.max_uses = body.max_uses;
  if (body.valid_until !== undefined) update.valid_until = body.valid_until ? new Date(body.valid_until).toISOString() : null;

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("coupons")
    .update(update)
    .eq("code", params.code.toUpperCase())
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { code: string } }) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;

  const { error } = await supabaseAdmin().from("coupons").delete().eq("code", params.code.toUpperCase());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
