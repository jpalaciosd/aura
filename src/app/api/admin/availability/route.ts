import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;
  const db = supabaseAdmin();
  const [{ data: availability }, { data: blocks }] = await Promise.all([
    db.from("availability").select("*").order("day_of_week"),
    db.from("blocked_slots").select("*").order("starts_at"),
  ]);
  return NextResponse.json({ availability: availability ?? [], blocks: blocks ?? [] });
}

// PATCH availability row
export async function PATCH(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;
  const { id, ...patch } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const { error } = await supabaseAdmin().from("availability").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST add block
export async function POST(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;
  const { starts_at, ends_at, reason } = await req.json();
  if (!starts_at || !ends_at) return NextResponse.json({ error: "Faltan fechas" }, { status: 400 });
  const { error } = await supabaseAdmin().from("blocked_slots").insert({ starts_at, ends_at, reason });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}

// DELETE block
export async function DELETE(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;
  const { searchParams } = new URL(req.url);
  const blockId = searchParams.get("block_id");
  if (!blockId) return NextResponse.json({ error: "Falta block_id" }, { status: 400 });
  const { error } = await supabaseAdmin().from("blocked_slots").delete().eq("id", blockId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
