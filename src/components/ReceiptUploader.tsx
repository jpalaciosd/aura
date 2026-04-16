"use client";
import { useState } from "react";

interface Props {
  appointmentId: string;
  token: string | undefined;
  couponCode: string | null;
  onSuccess: (res: { payment_id: string; status: string; redemption_code: string | null }) => void;
}

export default function ReceiptUploader({ appointmentId, token, couponCode, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async () => {
    if (!file || !token) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("appointment_id", appointmentId);
    if (couponCode) fd.append("coupon_code", couponCode);
    const res = await fetch("/api/payments/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { setError(data.error || "Error al subir"); return; }
    onSuccess(data);
  };

  return (
    <div className="space-y-3">
      <label className="block border-2 border-dashed border-cream-300 hover:border-gold-400 rounded-xl p-6 text-center cursor-pointer transition">
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} className="hidden" />
        {preview ? (
          <img src={preview} alt="" className="max-h-60 mx-auto rounded-lg" />
        ) : (
          <>
            <div className="text-3xl mb-2">📎</div>
            <p className="text-sm font-medium text-emerald-800">Subir captura del comprobante Nequi</p>
            <p className="text-xs text-emerald-800/50 mt-1">JPG / PNG / WebP · máx 2 MB</p>
          </>
        )}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={!file || uploading}
        className="btn-gold w-full py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {uploading ? "Validando comprobante…" : "Confirmar pago"}
      </button>
      <p className="text-xs text-emerald-800/50 text-center">
        Nuestra IA valida el comprobante al instante. Si no queda claro, lo revisa manualmente una persona.
      </p>
    </div>
  );
}
