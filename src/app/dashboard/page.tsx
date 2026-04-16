"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/AuthContext";
import type { DbAppointment, DbService } from "@/lib/types";

type Upcoming = DbAppointment & { service: DbService | null };

export default function DashboardHome() {
  const { profile } = useAuth();
  const [upcoming, setUpcoming] = useState<Upcoming[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, service:services(*)")
        .eq("customer_id", profile.id)
        .in("status", ["pending_payment", "confirmed"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(3);
      setUpcoming((data as Upcoming[]) ?? []);
      setLoading(false);
    })();
  }, [profile]);

  const nombre = profile?.name?.split(" ")[0] ?? "";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-emerald-800">
          Hola{nombre ? `, ${nombre}` : ""} 🌿
        </h1>
        <p className="text-emerald-800/60 mt-1">Tu espacio para agendar y seguir tus tratamientos.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <Link href="/dashboard/agendar" className="card-service rounded-2xl p-6 block">
          <div className="text-3xl mb-2">📅</div>
          <h3 className="font-bold text-emerald-800">Agendar cita</h3>
          <p className="text-sm text-emerald-800/60 mt-1">Elige servicio, fecha y paga con Nequi.</p>
        </Link>
        <Link href="/dashboard/citas" className="card-service rounded-2xl p-6 block">
          <div className="text-3xl mb-2">🗂</div>
          <h3 className="font-bold text-emerald-800">Mis citas</h3>
          <p className="text-sm text-emerald-800/60 mt-1">Próximas y pasadas.</p>
        </Link>
        <Link href="/dashboard/perfil" className="card-service rounded-2xl p-6 block">
          <div className="text-3xl mb-2">👤</div>
          <h3 className="font-bold text-emerald-800">Mi perfil</h3>
          <p className="text-sm text-emerald-800/60 mt-1">Actualiza datos y notas médicas.</p>
        </Link>
      </div>

      <section>
        <h2 className="text-xl font-display font-bold text-emerald-800 mb-4">Próximas citas</h2>
        {loading ? (
          <div className="text-sm text-emerald-800/50">Cargando…</div>
        ) : upcoming.length === 0 ? (
          <div className="bg-white border border-cream-300 rounded-2xl p-8 text-center">
            <p className="text-emerald-800/60">No tienes citas próximas.</p>
            <Link href="/dashboard/agendar" className="btn-gold inline-block mt-4 px-6 py-2.5 rounded-full text-sm font-semibold">
              Agendar ahora
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <div key={a.id} className="bg-white border border-cream-300 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{a.service?.icon ?? "✨"}</span>
                    <h3 className="font-bold text-emerald-800">{a.service?.name ?? "Servicio"}</h3>
                  </div>
                  <p className="text-sm text-emerald-800/60 mt-1">
                    {new Date(a.scheduled_at).toLocaleString("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                  a.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-gold-50 text-gold-700"
                }`}>
                  {a.status === "confirmed" ? "Confirmada" : "Pago pendiente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
