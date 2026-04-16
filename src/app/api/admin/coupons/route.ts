import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";

const CODE_RE = /^[A-Z0-9_-]{3,24}$/;

export async function GET(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;
  const { data } = await supabaseAdmin().from("coupons").select("*").order("created_at", { ascending: false });
  return NextResponse.json({ coupons: data ?? [] });
}

export async function POST(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;

  const body = await req.json();
  const code = String(body.code ?? "").trim().toUpperCase();
  const description = String(body.description ?? "").trim() || null;
  const discountPercent = Number(body.discount_percent);
  const validFrom = body.valid_from ? new Date(body.valid_from).toISOString() : new Date().toISOString();
  const validUntil = body.valid_until ? new Date(body.valid_until).toISOString() : null;
  const maxUses = body.max_uses !== null && body.max_uses !== undefined && body.max_uses !== "" ? Number(body.max_uses) : null;
  const onePerUser = !!body.one_per_user;

  if (!CODE_RE.test(code)) return NextResponse.json({ error: "Código inválido (3-24 chars A-Z, 0-9, -, _)" }, { status: 400 });
  if (!Number.isFinite(discountPercent) || discountPercent < 1 || discountPercent > 99) {
    return NextResponse.json({ error: "Porcentaje debe estar entre 1 y 99" }, { status: 400 });
  }
  if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) {
    return NextResponse.json({ error: "Cupo inválido" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: existing } = await db.from("coupons").select("code").eq("code", code).maybeSingle();
  if (existing) return NextResponse.json({ error: "Ese código ya existe" }, { status: 409 });

  const { data, error } = await db
    .from("coupons")
    .insert({
      code,
      description,
      discount_percent: discountPercent,
      valid_from: validFrom,
      valid_until: validUntil,
      max_uses: maxUses,
      one_per_user: onePerUser,
      active: true,
      created_by: who.id,
    })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data }, { status: 201 });
}
