import { NextRequest, NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const who = await requireUser(req);
  if (isResponse(who)) return who;

  const db = supabaseAdmin();
  const { data: payment } = await db
    .from("payments")
    .select("*, appointment:appointments(*, service:services(*))")
    .eq("id", params.id)
    .maybeSingle();

  if (!payment || (payment.customer_id !== who.id && who.role !== "admin")) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json({ payment });
}
