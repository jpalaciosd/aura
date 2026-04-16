import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { DbUser } from "./types";

function readBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  return null;
}

async function resolveUser(req: NextRequest): Promise<DbUser | null> {
  const token = readBearerToken(req);
  if (!token) return null;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: userRes, error } = await sb.auth.getUser(token);
  if (error || !userRes.user) return null;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("google_id", userRes.user.id)
    .maybeSingle();
  return (profile as DbUser) ?? null;
}

export async function requireUser(req: NextRequest): Promise<DbUser | NextResponse> {
  const user = await resolveUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<DbUser | NextResponse> {
  const user = await resolveUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return user;
}

export function isResponse(v: DbUser | NextResponse): v is NextResponse {
  return v instanceof NextResponse;
}
