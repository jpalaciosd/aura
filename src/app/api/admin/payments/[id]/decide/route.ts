import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";
import { generarCodigoCanje } from "@/lib/codigo-canje";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;

  const { decision, reason } = await req.json();
  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "Decisión inválida" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: payment } = await db.from("payments").select("*").eq("id", params.id).maybeSingle();
  if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  if (payment.status !== "manual_review") {
    return NextResponse.json({ error: "Este pago ya fue procesado" }, { status: 400 });
  }

  if (decision === "approve") {
    const code = generarCodigoCanje();
    await db
      .from("payments")
      .update({
        status: "manual_approved",
        decision_reason: reason || null,
        reviewer_id: who.id,
        redemption_code: code,
      })
      .eq("id", params.id);

    await db
      .from("appointments")
      .update({
        status: "confirmed",
        discount_amount: payment.discount_applied,
        coupon_code: payment.coupon_code,
      })
      .eq("id", payment.appointment_id);

    if (payment.coupon_code) {
      await db.from("coupon_uses").insert({
        code: payment.coupon_code,
        customer_id: payment.customer_id,
        payment_id: payment.id,
        discount_amount: payment.discount_applied,
      });
      const { data: cur } = await db.from("coupons").select("current_uses").eq("code", payment.coupon_code).maybeSingle();
      await db.from("coupons").update({ current_uses: (cur?.current_uses ?? 0) + 1 }).eq("code", payment.coupon_code);
    }

    return NextResponse.json({ ok: true, redemption_code: code });
  }

  await db
    .from("payments")
    .update({
      status: "rejected",
      decision_reason: reason || "Sin motivo",
      reviewer_id: who.id,
    })
    .eq("id", params.id);

  return NextResponse.json({ ok: true });
}
