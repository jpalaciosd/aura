import { NextRequest, NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";
import { validateCoupon } from "@/lib/coupons";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`coupon:${clientKey(req)}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Rate limit" }, { status: 429 });

  const who = await requireUser(req);
  if (isResponse(who)) return who;

  const { code, appointment_id } = await req.json();
  if (!code || !appointment_id) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = supabaseAdmin();
  const { data: appt } = await db
    .from("appointments")
    .select("id, customer_id, total_price, status")
    .eq("id", appointment_id)
    .maybeSingle();

  if (!appt || appt.customer_id !== who.id) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }
  if (appt.status !== "pending_payment") {
    return NextResponse.json({ error: "La cita ya no está pendiente de pago" }, { status: 400 });
  }

  const result = await validateCoupon(code, who.id, appt.total_price);
  return NextResponse.json({
    valid: result.valid,
    reason: result.reason,
    discount_amount: result.discountAmount,
    final_price: result.finalPrice,
    discount_percent: result.coupon?.discount_percent,
  });
}
