"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/AuthContext";
import ServicePicker from "@/components/ServicePicker";
import DateTimePicker from "@/components/DateTimePicker";
import type { DbService } from "@/lib/types";

function AgendarInner() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const preSlug = params.get("service");

  const [services, setServices] = useState<DbService[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      const list = (data as DbService[]) ?? [];
      setServices(list);
      if (preSlug) {
        const pre = list.find((s) => s.slug === preSlug);
        if (pre) setServiceId(pre.id);
      }
    })();
  }, [preSlug]);

  const selected = services.find((s) => s.id === serviceId);

  const confirm = async () => {
    if (!serviceId || !slot || !session?.access_token) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ service_id: serviceId, scheduled_at: slot, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo agendar");
      router.push(`/dashboard/pagar/${data.appointment.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-2">Agendar cita</h1>
      <p className="text-emerald-800/60 mb-8">Tres pasos y listo. Al final subes tu comprobante Nequi y confirmas.</p>

      <section className="bg-white border border-cream-300 rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-emerald-700 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-700 text-white text-xs mr-2">1</span>
          Elige el servicio
        </h2>
        <ServicePicker services={services} value={serviceId} onChange={setServiceId} />
      </section>

      {serviceId && (
        <section className="bg-white border border-cream-300 rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-semibold text-emerald-700 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-700 text-white text-xs mr-2">2</span>
            Fecha y hora
          </h2>
          <DateTimePicker serviceId={serviceId} value={slot} onChange={setSlot} />
        </section>
      )}

      {slot && selected && (
        <section className="bg-white border border-cream-300 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-emerald-700 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-700 text-white text-xs mr-2">3</span>
            Confirma
          </h2>

          <div className="bg-cream-50 border border-cream-200 rounded-xl p-4 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-emerald-800/60">Servicio</span>
              <span className="font-semibold text-emerald-800">{selected.icon} {selected.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-800/60">Fecha y hora</span>
              <span className="font-semibold text-emerald-800">
                {new Date(slot).toLocaleString("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-800/60">Duración</span>
              <span className="font-semibold text-emerald-800">{selected.duration_minutes} min</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-cream-200 mt-1.5">
              <span className="text-emerald-800/60">Precio base</span>
              <span className="font-bold text-gold-700">${selected.base_price.toLocaleString("es-CO")}</span>
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas para la profesional (opcional)"
            rows={3}
            className="w-full mt-4 border border-cream-300 rounded-xl px-4 py-2.5 text-sm focus:border-gold-400 outline-none resize-none"
          />

          {error && <div className="text-sm text-red-600 mt-3">{error}</div>}

          <button
            onClick={confirm}
            disabled={submitting}
            className="btn-gold w-full mt-4 py-3 rounded-xl font-semibold disabled:opacity-50"
          >
            {submitting ? "Reservando…" : "Continuar al pago →"}
          </button>
          <p className="text-xs text-emerald-800/50 text-center mt-2">
            Reservamos el horario durante 30 minutos mientras subes el comprobante.
          </p>
        </section>
      )}
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={<div className="p-10 text-emerald-800/50">Cargando…</div>}>
      <AgendarInner />
    </Suspense>
  );
}
