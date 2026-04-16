"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/AuthContext";
import type { DbPayment, DbAppointment, DbService, DbUser, PaymentStatus } from "@/lib/types";

type Row = DbPayment & { customer: DbUser | null; appointment: (DbAppointment & { service: DbService | null }) | null };

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending_ai: "Procesando",
  auto_approved: "Auto-aprobado",
  manual_review: "En revisión",
  manual_approved: "Aprobado manual",
  rejected: "Rechazado",
};
const STATUS_CLASS: Record<PaymentStatus, string> = {
  pending_ai: "bg-gold-50 text-gold-700",
  auto_approved: "bg-emerald-50 text-emerald-700",
  manual_review: "bg-gold-100 text-gold-800",
  manual_approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
};

export default function AdminPagosPage() {
  const { session } = useAuth();
  const [filter, setFilter] = useState<PaymentStatus | "all">("manual_review");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const q = supabase
      .from("payments")
      .select("*, customer:users(*), appointment:appointments(*, service:services(*))")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data } = filter === "all" ? await q : await q.eq("status", filter);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const decide = async (id: string, decision: "approve" | "reject", reason?: string) => {
    if (!session?.access_token) return;
    const res = await fetch(`/api/admin/payments/${id}/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ decision, reason }),
    });
    if (!res.ok) { alert((await res.json()).error ?? "Error"); return; }
    setActive(null);
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-2">Pagos</h1>
      <p className="text-emerald-800/60 mb-6">Revisa y aprueba comprobantes.</p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(["manual_review", "auto_approved", "manual_approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              filter === f ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-emerald-700 border-cream-300"
            }`}
          >
            {f === "all" ? "Todos" : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-sm text-emerald-800/50">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-cream-300 rounded-2xl p-8 text-center text-emerald-800/60">
          Nada por aquí.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((p) => (
            <button key={p.id} onClick={() => setActive(p)} className="text-left bg-white border border-cream-300 rounded-2xl p-4 hover:border-gold-400 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-emerald-800">{p.customer?.name ?? p.customer?.email}</div>
                  <div className="text-xs text-emerald-800/60">{p.appointment?.service?.name}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-800/60">${p.amount_expected.toLocaleString("es-CO")}</span>
                <span className="text-xs text-emerald-800/50">
                  {new Date(p.created_at).toLocaleDateString("es-CO")}
                </span>
              </div>
              {p.decision_reason && <p className="text-xs text-red-600 mt-2 line-clamp-2">⚠ {p.decision_reason}</p>}
            </button>
          ))}
        </div>
      )}

      {active && <PaymentModal row={active} onClose={() => setActive(null)} onDecide={decide} />}
    </div>
  );
}

function PaymentModal({ row, onClose, onDecide }: {
  row: Row; onClose: () => void; onDecide: (id: string, d: "approve" | "reject", reason?: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-emerald-800">{row.customer?.name}</h2>
            <p className="text-sm text-emerald-800/60">{row.customer?.email} · {row.customer?.phone ?? "sin tel."}</p>
          </div>
          <button onClick={onClose} className="text-emerald-800/50 hover:text-emerald-800">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><div className="text-xs text-emerald-800/60">Servicio</div><div className="font-semibold">{row.appointment?.service?.name}</div></div>
          <div><div className="text-xs text-emerald-800/60">Fecha cita</div><div className="font-semibold">{row.appointment ? new Date(row.appointment.scheduled_at).toLocaleString("es-CO") : "—"}</div></div>
          <div><div className="text-xs text-emerald-800/60">Monto esperado</div><div className="font-bold text-gold-700">${row.amount_expected.toLocaleString("es-CO")}</div></div>
          {row.coupon_code && <div><div className="text-xs text-emerald-800/60">Cupón</div><div className="font-semibold">{row.coupon_code}</div></div>}
        </div>

        {row.receipt_url && (
          <a href={row.receipt_url} target="_blank" rel="noopener">
            <img src={row.receipt_url} alt="comprobante" className="w-full rounded-xl border border-cream-300 mb-4" />
          </a>
        )}

        {row.ai_data && (
          <div className="bg-cream-50 border border-cream-200 rounded-xl p-3 text-xs space-y-1 mb-4">
            <div><span className="text-emerald-800/60">IA:</span> monto <b>{row.ai_data.monto ?? "?"}</b>, last4 <b>{row.ai_data.last4 ?? "?"}</b>, titular <b>{row.ai_data.titular ?? "?"}</b></div>
            <div><span className="text-emerald-800/60">Referencia:</span> {row.ai_data.referencia ?? "—"} · <span className="text-emerald-800/60">confianza:</span> {Math.round((row.ai_data.confianza ?? 0) * 100)}%</div>
            {row.decision_reason && <div className="text-red-600">⚠ {row.decision_reason}</div>}
          </div>
        )}

        {row.status === "manual_review" && (
          <div className="space-y-3">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo (obligatorio si rechazas)"
              className="w-full border border-cream-300 rounded-xl px-4 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => onDecide(row.id, "approve", reason || undefined)}
                className="flex-1 py-2.5 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800"
              >
                ✓ Aprobar
              </button>
              <button
                onClick={() => reason.trim() && onDecide(row.id, "reject", reason)}
                disabled={!reason.trim()}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50"
              >
                ✕ Rechazar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
