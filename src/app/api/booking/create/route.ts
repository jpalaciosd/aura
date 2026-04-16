import { NextRequest, NextResponse } from "next/server";
import { requireUser, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const who = await requireUser(req);
  if (isResponse(who)) return who;

  const { service_id, scheduled_at, notes } = await req.json();
  if (!service_id || !scheduled_at) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const db = supabaseAdmin();

  const { data: svc } = await db
    .from("services")
    .select("id, duration_minutes, base_price, active")
    .eq("id", service_id)
    .maybeSingle();

  if (!svc || !svc.active) {
    return NextResponse.json({ error: "Service not available" }, { status: 400 });
  }

  const when = new Date(scheduled_at);
  if (Number.isNaN(when.getTime()) || when <= new Date()) {
    return NextResponse.json({ error: "Invalid datetime" }, { status: 400 });
  }

  const { data: appt, error } = await db
    .from("appointments")
    .insert({
      customer_id: who.id,
      service_id: svc.id,
      scheduled_at: when.toISOString(),
      duration_minutes: svc.duration_minutes,
      status: "pending_payment",
      notes: notes ?? null,
      total_price: svc.base_price,
    })
    .select()
    .maybeSingle();

  if (error || !appt) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Ese horario ya no está disponible" }, { status: 409 });
    }
    console.error("create appointment error:", error);
    return NextResponse.json({ error: "No se pudo crear la cita" }, { status: 500 });
  }

  return NextResponse.json({ appointment: appt });
}
