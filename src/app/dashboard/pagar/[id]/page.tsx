"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/AuthContext";
import CouponInput from "@/components/CouponInput";
import ReceiptUploader from "@/components/ReceiptUploader";
import type { DbAppointment, DbService } from "@/lib/types";

const NEQUI_DISPLAY = process.env.NEXT_PUBLIC_NEQUI_NUMERO_DISPLAY ?? "0093128200996";
const NEQUI_TITULAR = process.env.NEXT_PUBLIC_NEQUI_TITULAR ?? "AURA Bienestar Estético";

type Appt = DbAppointment & { service: DbService | null };
interface Applied { code: string; discount: number; finalPrice: number; percent: number }

export default function PagarPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, session } = useAuth();

  const [appt, setAppt] = useState<Appt | null>(null);
  const [applied, setApplied] = useState<Applied | null>(null);
  const [result, setResult] = useState<{ payment_id: string; status: string; redemption_code: string | null } | null>(null);

  useEffect(() => {
    if (!profile || !id) return;
    (async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, service:services(*)")
        .eq("id", id)
        .eq("customer_id", profile.id)
        .maybeSingle();
      setAppt((data as Appt) ?? null);
    })();
  }, [profile, id]);

  if (!appt) return <div className="p-10 text-emerald-800/50">Cargando cita…</div>;

  if (appt.status !== "pending_payment" && !result) {
    return (
      <div className="max-w-xl mx-auto px-6 py-12 text-center">
        <h1 className="text-2xl font-display font-bold text-emerald-800">Esta cita ya no está en cobro</h1>
        <p className="text-emerald-800/60 mt-2">Revisa el estado en tus citas.</p>
        <Link href="/dashboard/citas" className="btn-gold inline-block mt-6 px-6 py-2.5 rounded-full text-sm font-semibold">
          Ver mis citas
        </Link>
      </div>
    );
  }

  if (result) {
    const approved = result.status === "auto_approved";
    return (
      <div className="max-w-xl mx-auto px-6 py-12 text-center">
        <div className="text-6xl mb-4">{approved ? "✅" : "⏳"}</div>
        <h1 className="text-2xl font-display font-bold text-emerald-800">
          {approved ? "¡Cita confirmada!" : "Comprobante recibido"}
        </h1>
        <p className="text-emerald-800/60 mt-2">
          {approved
            ? "Tu pago fue validado automáticamente. Te esperamos."
            : "Lo estamos revisando manualmente. Te avisaremos pronto."}
        </p>
        {result.redemption_code && (
          <div className="mt-6 inline-block bg-emerald-50 border-2 border-emerald-200 rounded-xl px-5 py-3">
            <div className="text-xs text-emerald-700/70 mb-1">Tu código de confirmación</div>
            <div className="text-xl font-bold font-mono text-emerald-800">{result.redemption_code}</div>
          </div>
        )}
        <div className="mt-8 flex gap-3 justify-center">
          <Link href="/dashboard/citas" className="btn-gold px-6 py-2.5 rounded-full text-sm font-semibold">
            Ver mis citas
          </Link>
          <button onClick={() => router.push("/dashboard")} className="px-6 py-2.5 text-sm border-2 border-cream-300 rounded-full text-emerald-800">
            Ir al dashboard
          </button>
        </div>
      </div>
    );
  }

  const basePrice = appt.total_price;
  const finalPrice = applied?.finalPrice ?? basePrice;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-2">Completar pago</h1>
      <p className="text-emerald-800/60 mb-6">Paga con Nequi y sube tu comprobante para confirmar.</p>

      <div className="bg-white border border-cream-300 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{appt.service?.icon}</span>
          <div>
            <h3 className="font-bold text-emerald-800">{appt.service?.name}</h3>
            <p className="text-xs text-emerald-800/60">
              {new Date(appt.scheduled_at).toLocaleString("es-CO", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        <div className="space-y-1.5 text-sm pt-3 border-t border-cream-200">
          <div className="flex justify-between">
            <span className="text-emerald-800/60">Precio base</span>
            <span className="text-emerald-800">${basePrice.toLocaleString("es-CO")}</span>
          </div>
          {applied && (
            <div className="flex justify-between text-emerald-700">
              <span>Descuento {applied.percent}%</span>
              <span>− ${applied.discount.toLocaleString("es-CO")}</span>
            </div>
          )}
          <div className="flex justify-between pt-1.5 border-t border-cream-200 mt-1.5 font-bold text-base">
            <span className="text-emerald-800">Total a pagar</span>
            <span className="text-gold-700">${finalPrice.toLocaleString("es-CO")}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-cream-300 rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-emerald-700 mb-3">¿Tienes un cupón?</h2>
        <CouponInput
          appointmentId={appt.id}
          token={session?.access_token}
          onApplied={setApplied}
          onCleared={() => setApplied(null)}
          applied={applied}
        />
      </div>

      <div className="bg-emerald-700 text-white rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gold-300 uppercase tracking-wide mb-3">Paga por Nequi</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-emerald-200">Número / Llave</span>
            <span className="font-mono font-bold">{NEQUI_DISPLAY}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-200">Titular</span>
            <span className="font-semibold">{NEQUI_TITULAR}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-200">Monto exacto</span>
            <span className="font-bold text-gold-300">${finalPrice.toLocaleString("es-CO")}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-cream-300 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-emerald-700 mb-3">Sube el comprobante</h2>
        <ReceiptUploader
          appointmentId={appt.id}
          token={session?.access_token}
          couponCode={applied?.code ?? null}
          onSuccess={setResult}
        />
      </div>
    </div>
  );
}
