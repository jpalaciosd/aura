import { supabaseAdmin } from "./supabase-server";
import type { DbCoupon } from "./types";

export interface CouponValidation {
  valid: boolean;
  reason?: string;
  coupon?: DbCoupon;
  discountAmount?: number;
  finalPrice?: number;
}

export async function validateCoupon(
  codeRaw: string,
  customerId: string,
  basePrice: number
): Promise<CouponValidation> {
  const code = codeRaw.trim().toUpperCase();
  if (!code) return { valid: false, reason: "Código vacío" };

  const db = supabaseAdmin();
  const { data: coupon } = await db.from("coupons").select("*").eq("code", code).maybeSingle();
  if (!coupon) return { valid: false, reason: "Código no encontrado" };

  const c = coupon as DbCoupon;
  if (!c.active) return { valid: false, reason: "Código desactivado" };

  const now = Date.now();
  if (Date.parse(c.valid_from) > now) return { valid: false, reason: "Aún no está vigente" };
  if (c.valid_until && Date.parse(c.valid_until) < now) return { valid: false, reason: "Código expirado" };

  if (c.max_uses !== null && c.current_uses >= c.max_uses) {
    return { valid: false, reason: "Código agotado" };
  }

  if (c.one_per_user) {
    const { data: prev } = await db
      .from("coupon_uses")
      .select("id")
      .eq("code", code)
      .eq("customer_id", customerId)
      .maybeSingle();
    if (prev) return { valid: false, reason: "Ya usaste este código antes" };
  }

  const pct = Math.max(1, Math.min(99, Math.round(c.discount_percent)));
  const discount = Math.round((basePrice * pct) / 100);
  const finalPrice = Math.max(0, basePrice - discount);

  return { valid: true, coupon: c, discountAmount: discount, finalPrice };
}
