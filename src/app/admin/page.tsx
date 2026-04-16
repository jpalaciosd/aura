"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import KpiCard from "@/components/KpiCard";

interface Kpis {
  appointmentsToday: number;
  pendingReview: number;
  monthRevenue: number;
  activeClients: number;
}

export default function AdminHome() {
  const [kpis, setKpis] = useState<Kpis | null>(null);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [apptsToday, pending, monthPays, users] = await Promise.all([
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .gte("scheduled_at", dayStart.toISOString()).lte("scheduled_at", dayEnd.toISOString())
          .in("status", ["confirmed", "pending_payment"]),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "manual_review"),
        supabase.from("payments").select("amount_expected").in("status", ["auto_approved", "manual_approved"])
          .gte("created_at", monthStart.toISOString()),
        supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "client"),
      ]);

      const revenue = (monthPays.data ?? []).reduce((s: number, p: { amount_expected: number | null }) => s + (p.amount_expected ?? 0), 0);

      setKpis({
        appointmentsToday: apptsToday.count ?? 0,
        pendingReview: pending.count ?? 0,
        monthRevenue: revenue,
        activeClients: users.count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-2">Panel de control</h1>
      <p className="text-emerald-800/60 mb-8">Vista rápida del día y del mes.</p>

      {!kpis ? (
        <div className="text-sm text-emerald-800/50">Cargando métricas…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <KpiCard label="Citas hoy" value={kpis.appointmentsToday} hint="confirmadas + pendientes" />
          <KpiCard label="Pagos por revisar" value={kpis.pendingReview} hint="revisión manual" accent={kpis.pendingReview > 0 ? "gold" : "emerald"} />
          <KpiCard label="Ingresos del mes" value={`$${kpis.monthRevenue.toLocaleString("es-CO")}`} hint="pagos aprobados" accent="gold" />
          <KpiCard label="Clientas registradas" value={kpis.activeClients} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/pagos" className="card-service rounded-2xl p-6 block">
          <div className="text-3xl mb-2">💳</div>
          <h3 className="font-bold text-emerald-800">Revisar pagos</h3>
          <p className="text-sm text-emerald-800/60 mt-1">Aprobar o rechazar comprobantes pendientes.</p>
        </Link>
        <Link href="/admin/citas" className="card-service rounded-2xl p-6 block">
          <div className="text-3xl mb-2">📅</div>
          <h3 className="font-bold text-emerald-800">Agenda de hoy</h3>
          <p className="text-sm text-emerald-800/60 mt-1">Marca como completadas, no-show, o reagenda.</p>
        </Link>
        <Link href="/admin/cupones" className="card-service rounded-2xl p-6 block">
          <div className="text-3xl mb-2">🎟</div>
          <h3 className="font-bold text-emerald-800">Gestionar cupones</h3>
          <p className="text-sm text-emerald-800/60 mt-1">Crea y desactiva códigos promocionales.</p>
        </Link>
        <Link href="/admin/galeria" className="card-service rounded-2xl p-6 block">
          <div className="text-3xl mb-2">🖼</div>
          <h3 className="font-bold text-emerald-800">Galería antes/después</h3>
          <p className="text-sm text-emerald-800/60 mt-1">Sube resultados reales que se muestran en la landing.</p>
        </Link>
      </div>
    </div>
  );
}
