"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/AuthContext";
import type { DbAppointment, DbService, AppointmentStatus } from "@/lib/types";

type Row = DbAppointment & { service: DbService | null };

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending_payment: "Pago pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  pending_payment: "bg-gold-50 text-gold-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-cream-100 text-emerald-800/60",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-red-50 text-red-700",
};

export default function CitasPage() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*, service:services(*)")
      .eq("customer_id", profile.id)
      .order("scheduled_at", { ascending: false });
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [profile]);

  const cancel = async (id: string, scheduledAt: string) => {
    const hoursAhead = (new Date(scheduledAt).getTime() - Date.now()) / 3_600_000;
    if (hoursAhead < 24) {
      alert("Sólo puedes cancelar con al menos 24 horas de anticipación. Escríbenos por WhatsApp.");
      return;
    }
    if (!confirm("¿Seguro que deseas cancelar esta cita?")) return;
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    await load();
  };

  const now = Date.now();
  const upcoming = rows.filter((r) => new Date(r.scheduled_at).getTime() >= now && r.status !== "cancelled");
  const past = rows.filter((r) => !upcoming.includes(r));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-emerald-800">Mis citas</h1>
          <p className="text-emerald-800/60 mt-1">Próximas y pasadas.</p>
        </div>
        <Link href="/dashboard/agendar" className="btn-gold px-5 py-2.5 rounded-full text-sm font-semibold">
          + Nueva cita
        </Link>
      </div>

      {loading ? (
        <div className="text-emerald-800/50 text-sm">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-cream-300 rounded-2xl p-8 text-center">
          <p className="text-emerald-800/60">Aún no tienes citas. ¡Agenda tu primera sesión!</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-3">Próximas</h2>
              <div className="space-y-3 mb-8">
                {upcoming.map((a) => (
                  <AppointmentRow key={a.id} a={a} onCancel={cancel} />
                ))}
              </div>
            </>
          )}

          {past.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-3">Historial</h2>
              <div className="space-y-3">
                {past.map((a) => (
                  <AppointmentRow key={a.id} a={a} onCancel={cancel} past />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function AppointmentRow({ a, onCancel, past }: { a: Row; onCancel: (id: string, iso: string) => void; past?: boolean }) {
  return (
    <div className="bg-white border border-cream-300 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl">{a.service?.icon ?? "✨"}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-emerald-800">{a.service?.name ?? "Servicio"}</h3>
            <p className="text-sm text-emerald-800/60 mt-0.5">
              {new Date(a.scheduled_at).toLocaleString("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            </p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_CLASS[a.status]}`}>
                {STATUS_LABEL[a.status]}
              </span>
              <span className="text-xs text-emerald-800/50">${a.total_price.toLocaleString("es-CO")}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-right">
          {a.status === "pending_payment" && (
            <Link href={`/dashboard/pagar/${a.id}`} className="text-xs text-gold-700 font-semibold underline">
              Completar pago
            </Link>
          )}
          {!past && a.status !== "cancelled" && a.status !== "completed" && (
            <button
              onClick={() => onCancel(a.id, a.scheduled_at)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
