import { NextRequest, NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";
import { extractReceipt } from "@/lib/ocr-receipt";
import { validateCoupon } from "@/lib/coupons";
import { generarCodigoCanje, titularContenido, hashReferencia } from "@/lib/codigo-canje";
import { rateLimit, clientKey } from "@/lib/rate-limit";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const NEQUI_LAST4 = process.env.NEQUI_NUMERO_LAST4 ?? "";
const NEQUI_TITULAR = process.env.NEQUI_TITULAR ?? "";
const VENTANA_H = Number(process.env.PAGOS_VENTANA_VALIDEZ_HORAS ?? 24);

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rl = rateLimit(`payup:${clientKey(req)}`, 10, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Muchos intentos, espera unos minutos." }, { status: 429 });

  const who = await requireUser(req);
  if (isResponse(who)) return who;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const appointmentId = String(form.get("appointment_id") ?? "");
  const couponCode = String(form.get("coupon_code") ?? "").trim().toUpperCase() || null;

  if (!file || !appointmentId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Formato no soportado. Usa JPG/PNG/WebP." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Archivo demasiado grande (máx 2 MB)." }, { status: 400 });
  }

  const db = supabaseAdmin();

  // 1. Verificar cita
  const { data: appt } = await db
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt || appt.customer_id !== who.id) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }
  if (appt.status !== "pending_payment") {
    return NextResponse.json({ error: "Esta cita ya no está pendiente de pago" }, { status: 400 });
  }

  // 2. Re-validar cupón server-side
  const basePrice = appt.total_price as number;
  let discount = 0;
  let finalPrice = basePrice;
  let couponApplied: string | null = null;

  if (couponCode) {
    const v = await validateCoupon(couponCode, who.id, basePrice);
    if (!v.valid) {
      return NextResponse.json({ error: `Cupón: ${v.reason}` }, { status: 400 });
    }
    discount = v.discountAmount!;
    finalPrice = v.finalPrice!;
    couponApplied = couponCode;
  }

  // 3. Subir comprobante a Storage
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${who.id}/${appointmentId}-${Date.now()}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await db.storage.from("receipts").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) {
    console.error("storage upload:", upErr);
    return NextResponse.json({ error: "No se pudo subir el comprobante" }, { status: 500 });
  }
  const { data: signed } = await db.storage.from("receipts").createSignedUrl(path, 60 * 60);
  const receiptUrl = signed?.signedUrl ?? null;

  // 4. OCR
  let ai;
  try {
    ai = receiptUrl ? await extractReceipt(receiptUrl) : { confianza: 0, motivos_duda: ["Sin URL firmada"] };
  } catch (e) {
    console.error("ocr:", e);
    ai = { confianza: 0, motivos_duda: ["Error OCR"] };
  }

  // 5. Validaciones
  const motivos: string[] = [];
  if (typeof ai.monto === "number" && Math.abs(ai.monto - finalPrice) > 100) {
    motivos.push(`Monto no coincide (detectado ${ai.monto}, esperado ${finalPrice})`);
  }
  if (NEQUI_LAST4 && ai.last4 && ai.last4 !== NEQUI_LAST4) {
    motivos.push(`Número Nequi distinto (${ai.last4} vs ${NEQUI_LAST4})`);
  }
  if (NEQUI_TITULAR && ai.titular && !titularContenido(ai.titular, NEQUI_TITULAR)) {
    motivos.push(`Titular no coincide (${ai.titular})`);
  }
  if (ai.fecha) {
    const diffH = (Date.now() - Date.parse(ai.fecha)) / 3_600_000;
    if (Number.isFinite(diffH) && diffH > VENTANA_H) motivos.push(`Comprobante con más de ${VENTANA_H}h`);
    if (diffH < -1) motivos.push("Fecha futura");
  }

  // 6. Duplicado por referencia
  let refHash: string | null = null;
  if (ai.referencia) {
    refHash = hashReferencia(ai.referencia);
    const { data: dup } = await db.from("payment_refs").select("payment_id").eq("reference_hash", refHash).maybeSingle();
    if (dup) motivos.push("Comprobante ya usado anteriormente");
  }

  const confidence = ai.confianza ?? 0;
  const autoApprove = motivos.length === 0 && confidence >= 0.85 &&
    typeof ai.monto === "number" && ai.last4 && ai.titular && ai.referencia;

  const status = autoApprove ? "auto_approved" : "manual_review";
  const redemptionCode = autoApprove ? generarCodigoCanje() : null;

  // 7. Insertar pago
  const { data: payment, error: payErr } = await db
    .from("payments")
    .insert({
      appointment_id: appointmentId,
      customer_id: who.id,
      amount_expected: finalPrice,
      receipt_url: receiptUrl,
      ai_data: { ...ai, motivos_duda: [...(ai.motivos_duda ?? []), ...motivos] },
      status,
      decision_reason: motivos.length ? motivos.join("; ") : null,
      redemption_code: redemptionCode,
      coupon_code: couponApplied,
      discount_applied: discount,
      original_price: basePrice,
    })
    .select()
    .maybeSingle();

  if (payErr || !payment) {
    console.error("insert payment:", payErr);
    return NextResponse.json({ error: "No se pudo registrar el pago" }, { status: 500 });
  }

  // 8. Registrar ref hash
  if (refHash) {
    await db.from("payment_refs").insert({ reference_hash: refHash, payment_id: payment.id });
  }

  // 9. Si auto-aprobado: confirmar cita, consumir cupón
  if (autoApprove) {
    await db
      .from("appointments")
      .update({ status: "confirmed", discount_amount: discount, coupon_code: couponApplied })
      .eq("id", appointmentId);

    if (couponApplied) {
      await db.from("coupon_uses").insert({
        code: couponApplied,
        customer_id: who.id,
        payment_id: payment.id,
        discount_amount: discount,
      });
      const { data: cur } = await db.from("coupons").select("current_uses").eq("code", couponApplied).maybeSingle();
      await db
        .from("coupons")
        .update({ current_uses: (cur?.current_uses ?? 0) + 1 })
        .eq("code", couponApplied);
    }
  }

  return NextResponse.json({ payment_id: payment.id, status, redemption_code: redemptionCode });
}
