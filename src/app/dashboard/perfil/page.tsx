"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/AuthContext";

export default function PerfilPage() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "");
      setPhone(profile.phone ?? "");
      setMedicalNotes(profile.medical_notes ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    const { error } = await supabase
      .from("users")
      .update({ name, phone, medical_notes: medicalNotes })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      setMessage("No se pudo guardar. Intenta de nuevo.");
    } else {
      setMessage("Datos guardados ✓");
      await refreshProfile();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-2">Mi perfil</h1>
      <p className="text-emerald-800/60 mb-8">Mantén tus datos al día para confirmar citas y contactarte.</p>

      <div className="bg-white border border-cream-300 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Nombre completo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-cream-300 rounded-xl px-4 py-2.5 focus:border-gold-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Email</label>
          <input value={profile?.email ?? ""} disabled className="w-full border border-cream-300 rounded-xl px-4 py-2.5 bg-cream-50 text-emerald-800/50" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Teléfono (WhatsApp)</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+57 ..."
            className="w-full border border-cream-300 rounded-xl px-4 py-2.5 focus:border-gold-400 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-emerald-700 mb-1.5">Notas médicas (opcional)</label>
          <textarea
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            placeholder="Alergias, condiciones, medicamentos relevantes para tu tratamiento…"
            rows={4}
            className="w-full border border-cream-300 rounded-xl px-4 py-2.5 focus:border-gold-400 outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="btn-gold px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          {message && <span className="text-sm text-emerald-700">{message}</span>}
        </div>
      </div>
    </div>
  );
}
