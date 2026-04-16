"use client";
import { useState } from "react";

interface Props {
  appointmentId: string;
  token: string | undefined;
  onApplied: (data: { code: string; discount: number; finalPrice: number; percent: number }) => void;
  onCleared: () => void;
  applied: { code: string; discount: number; finalPrice: number; percent: number } | null;
}

export default function CouponInput({ appointmentId, token, onApplied, onCleared, applied }: Props) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    if (!code.trim() || !token) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code, appointment_id: appointmentId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok || !data.valid) {
      setError(data.reason || data.error || "Código inválido");
      return;
    }
    onApplied({
      code: code.trim().toUpperCase(),
      discount: data.discount_amount,
      finalPrice: data.final_price,
      percent: data.discount_percent,
    });
    setCode("");
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-emerald-800">
            ✓ {applied.code} aplicado ({applied.percent}% off)
          </div>
          <div className="text-xs text-emerald-700/70">
            Ahorras ${applied.discount.toLocaleString("es-CO")}
          </div>
        </div>
        <button onClick={onCleared} className="text-xs text-emerald-700 hover:text-emerald-800 underline">
          Quitar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Código promocional"
          className="flex-1 border border-cream-300 rounded-xl px-4 py-2.5 text-sm focus:border-gold-400 outline-none uppercase"
        />
        <button
          onClick={apply}
          disabled={loading || !code.trim()}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-700 text-white disabled:opacity-40"
        >
          {loading ? "…" : "Aplicar"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
