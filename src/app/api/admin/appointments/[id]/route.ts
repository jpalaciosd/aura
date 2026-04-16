import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { AppointmentStatus } from "@/lib/types";

const VALID: AppointmentStatus[] = ["pending_payment", "confirmed", "completed", "cancelled", "no_show"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;

  const { status, notes } = await req.json();
  const update: Record<string, unknown> = {};
  if (status) {
    if (!VALID.includes(status)) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    update.status = status;
  }
  if (typeof notes === "string") update.notes = notes;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

  const { error } = await supabaseAdmin().from("appointments").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
