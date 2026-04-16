import { supabaseAdmin } from "./supabase-server";

export interface SlotOption {
  iso: string;
  label: string;
}

function pad(n: number) { return n.toString().padStart(2, "0"); }

function combineDateTime(dateYmd: string, hm: string): Date {
  // Construye una fecha local (America/Bogota = UTC-5, sin DST). Pragmático y suficiente
  // para una agenda local: el servidor de Vercel está en UTC pero la hora del cliente
  // coincide con la hora local porque se guarda como timestamptz con offset -05:00.
  return new Date(`${dateYmd}T${hm}:00-05:00`);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function getAvailableSlots(serviceId: string, dateYmd: string): Promise<SlotOption[]> {
  const db = supabaseAdmin();

  const [{ data: svc }, { data: avail }, { data: blocks }, { data: appts }] = await Promise.all([
    db.from("services").select("id, duration_minutes, active").eq("id", serviceId).maybeSingle(),
    db.from("availability").select("*").eq("active", true),
    db.from("blocked_slots").select("starts_at, ends_at"),
    db
      .from("appointments")
      .select("scheduled_at, duration_minutes, status")
      .in("status", ["pending_payment", "confirmed"]),
  ]);

  if (!svc || !svc.active) return [];
  const duration = svc.duration_minutes as number;

  type AvailRow = { day_of_week: number; start_time: string; end_time: string; slot_duration_minutes: number };
  type ApptRow = { scheduled_at: string; duration_minutes: number };
  type BlockRow = { starts_at: string; ends_at: string };

  const day = new Date(`${dateYmd}T12:00:00-05:00`);
  const dow = day.getDay();
  const dayWindows = ((avail as AvailRow[] | null) ?? []).filter((a) => a.day_of_week === dow);
  if (dayWindows.length === 0) return [];

  const dayStart = new Date(`${dateYmd}T00:00:00-05:00`);
  const dayEnd = new Date(`${dateYmd}T23:59:59-05:00`);

  const activeAppts = ((appts as ApptRow[] | null) ?? [])
    .map((a) => ({ start: new Date(a.scheduled_at), dur: a.duration_minutes }))
    .filter((a) => a.start >= dayStart && a.start <= dayEnd)
    .map((a) => ({ start: a.start, end: new Date(a.start.getTime() + a.dur * 60_000) }));

  const blockRanges = ((blocks as BlockRow[] | null) ?? [])
    .map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) }))
    .filter((b) => b.end > dayStart && b.start < dayEnd);

  const slots: SlotOption[] = [];
  const now = new Date();

  for (const w of dayWindows) {
    const step = w.slot_duration_minutes;
    const [sh, sm] = w.start_time.split(":").map(Number);
    const [eh, em] = w.end_time.split(":").map(Number);

    let cursor = combineDateTime(dateYmd, `${pad(sh)}:${pad(sm)}`);
    const windowEnd = combineDateTime(dateYmd, `${pad(eh)}:${pad(em)}`);

    while (cursor.getTime() + duration * 60_000 <= windowEnd.getTime()) {
      const start = new Date(cursor);
      const end = new Date(start.getTime() + duration * 60_000);

      if (start > now) {
        const collides =
          activeAppts.some((a) => overlaps(start, end, a.start, a.end)) ||
          blockRanges.some((b) => overlaps(start, end, b.start, b.end));

        if (!collides) {
          slots.push({
            iso: start.toISOString(),
            label: start.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
          });
        }
      }

      cursor = new Date(cursor.getTime() + step * 60_000);
    }
  }

  return slots;
}
