"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/AuthContext";
import type { DbAppointment, DbService, DbUser, AppointmentStatus } from "@/lib/types";

type Row = DbAppointment & { service: DbService | null; customer: DbUser | null };

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

export default function AdminCitasPage() {
  const { session } = useAuth();
  const [filter, setFilter] = useState<"today" | "upcoming" | "all">("upcoming");
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    let q = supabase
      .from("appointments")
      .select("*, service:services(*), customer:users(*)")
      .order("scheduled_at", { ascending: true });

    if (filter === "today") {
      const s = new Date(); s.setHours(0, 0, 0, 0);
      const e = new Date(); e.setHours(23, 59, 59, 999);
      q = q.gte("scheduled_at", s.toISOString()).lte("scheduled_at", e.toISOString());
    } else if (filter === "upcoming") {
      q = q.gte("scheduled_at", new Date().toISOString());
    }

    const { data } = await q.limit(200);
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, [filter]);

  const setStatus = async (id: string, status: AppointmentStatus) => {
    await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-4">Citas</h1>

      <div className="flex gap-2 mb-4">
        {(["today", "upcoming", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              filter === f ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-emerald-700 border-cream-300"
            }`}>
            {f === "today" ? "Hoy" : f === "upcoming" ? "Próximas" : "Todas"}
          </button>
        ))}
      </div>

      <div className="bg-white border border-cream-300 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-emerald-800/70 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Fecha</th>
              <th className="text-left px-4 py-2">Clienta</th>
              <th className="text-left px-4 py-2">Servicio</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-cream-200">
                <td className="px-4 py-2.5 text-emerald-800">
                  {new Date(a.scheduled_at).toLocaleString("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-emerald-800">{a.customer?.name ?? a.customer?.email}</div>
                  <div className="text-xs text-emerald-800/50">{a.customer?.phone ?? ""}</div>
                </td>
                <td className="px-4 py-2.5">{a.service?.icon} {a.service?.name}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold">${a.total_price.toLocaleString("es-CO")}</td>
                <td className="px-4 py-2.5 text-right">
                  <select
                    value={a.status}
                    onChange={(e) => setStatus(a.id, e.target.value as AppointmentStatus)}
                    className="text-xs border border-cream-300 rounded-lg px-2 py-1"
                  >
                    {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-emerald-800/50">Sin citas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
