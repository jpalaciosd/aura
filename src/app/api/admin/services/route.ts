import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;
  const { data } = await supabaseAdmin().from("services").select("*").order("sort_order");
  return NextResponse.json({ services: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;

  const { id, ...patch } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const allowed = ["name", "description", "duration_minutes", "base_price", "active", "sort_order", "icon"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) if (k in patch) update[k] = patch[k];

  const { data, error } = await supabaseAdmin()
    .from("services").update(update).eq("id", id).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: data });
}
