import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isResponse } from "@/lib/auth-guard";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function GET(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;
  const db = supabaseAdmin();
  const [{ data: ba }, { data: tt }] = await Promise.all([
    db.from("before_after").select("*, service:services(name, icon)").order("sort_order"),
    db.from("testimonials").select("*, service:services(name, icon)").order("sort_order"),
  ]);
  return NextResponse.json({ before_after: ba ?? [], testimonials: tt ?? [] });
}

async function uploadToGallery(file: File, prefix: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Formato no soportado");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());
  const db = supabaseAdmin();
  const { error } = await db.storage.from("gallery").upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data } = db.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;

  const form = await req.formData();
  const kind = form.get("kind"); // "before_after" | "testimonial"
  const db = supabaseAdmin();

  try {
    if (kind === "before_after") {
      const before = form.get("before") as File | null;
      const after = form.get("after") as File | null;
      if (!before || !after) return NextResponse.json({ error: "Faltan imágenes" }, { status: 400 });
      const beforeUrl = await uploadToGallery(before, "before-after");
      const afterUrl = await uploadToGallery(after, "before-after");
      const sessions = form.get("sessions_count");
      const { data, error } = await db.from("before_after").insert({
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? "") || null,
        service_id: String(form.get("service_id") ?? "") || null,
        before_url: beforeUrl,
        after_url: afterUrl,
        sessions_count: sessions ? Number(sessions) : null,
        active: true,
      }).select().maybeSingle();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (kind === "testimonial") {
      const photo = form.get("photo") as File | null;
      const avatar = form.get("avatar") as File | null;
      const photoUrl = photo ? await uploadToGallery(photo, "testimonials") : null;
      const avatarUrl = avatar ? await uploadToGallery(avatar, "testimonials") : null;
      const { data, error } = await db.from("testimonials").insert({
        customer_name: String(form.get("customer_name") ?? ""),
        text: String(form.get("text") ?? ""),
        rating: Number(form.get("rating") ?? 5),
        service_id: String(form.get("service_id") ?? "") || null,
        photo_url: photoUrl,
        customer_avatar_url: avatarUrl,
        featured: form.get("featured") === "true",
      }).select().maybeSingle();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    return NextResponse.json({ error: "kind inválido" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const who = await requireAdmin(req);
  if (isResponse(who)) return who;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const kind = searchParams.get("kind");
  if (!id || !kind) return NextResponse.json({ error: "Faltan params" }, { status: 400 });
  const table = kind === "before_after" ? "before_after" : "testimonials";
  const { error } = await supabaseAdmin().from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
