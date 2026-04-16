"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { DbCoupon } from "@/lib/types";

export default function AdminCuponesPage() {
  const { session } = useAuth();
  const [list, setList] = useState<DbCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "", description: "", discount_percent: 20,
    valid_until: "", max_uses: "", one_per_user: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!session?.access_token) return;
    setLoading(true);
    const res = await fetch("/api/admin/coupons", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setList(data.coupons ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [session]);

  const create = async () => {
    if (!session?.access_token) return;
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        ...form,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        valid_until: form.valid_until || null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setForm({ code: "", description: "", discount_percent: 20, valid_until: "", max_uses: "", one_per_user: true });
    await load();
  };

  const toggle = async (code: string, active: boolean) => {
    await fetch(`/api/admin/coupons/${code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
      body: JSON.stringify({ active }),
    });
    await load();
  };

  const remove = async (code: string) => {
    if (!confirm(`¿Borrar ${code}?`)) return;
    await fetch(`/api/admin/coupons/${code}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session!.access_token}` },
    });
    await load();
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-6">Cupones</h1>

      <div className="bg-white border border-cream-300 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-emerald-800 mb-4">Crear cupón</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="CÓDIGO (ej: VERANO30)" className="border border-cream-300 rounded-xl px-4 py-2.5 text-sm uppercase" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descripción (opcional)" className="border border-cream-300 rounded-xl px-4 py-2.5 text-sm" />
          <label className="flex items-center gap-3 border border-cream-300 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-emerald-700">% descuento</span>
            <input type="number" min={1} max={99} value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
              className="flex-1 text-right outline-none" />
          </label>
          <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
            className="border border-cream-300 rounded-xl px-4 py-2.5 text-sm" placeholder="Válido hasta" />
          <input type="number" min={1} value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
            placeholder="Máx usos (vacío = ilimitado)" className="border border-cream-300 rounded-xl px-4 py-2.5 text-sm" />
          <label className="flex items-center gap-2 border border-cream-300 rounded-xl px-4 py-2.5 text-sm">
            <input type="checkbox" checked={form.one_per_user} onChange={(e) => setForm({ ...form, one_per_user: e.target.checked })} />
            Uno por usuario
          </label>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <button onClick={create} disabled={saving || !form.code} className="btn-gold mt-4 px-6 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50">
          {saving ? "Creando…" : "Crear cupón"}
        </button>
      </div>

      <h2 className="font-semibold text-emerald-800 mb-3">Cupones existentes</h2>
      {loading ? <div className="text-sm text-emerald-800/50">Cargando…</div> : (
        <div className="bg-white border border-cream-300 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 text-emerald-800/70 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Código</th>
                <th className="text-left px-4 py-2">% off</th>
                <th className="text-left px-4 py-2">Usos</th>
                <th className="text-left px-4 py-2">Vigencia</th>
                <th className="text-left px-4 py-2">Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.code} className="border-t border-cream-200">
                  <td className="px-4 py-2.5 font-mono font-bold text-emerald-800">{c.code}</td>
                  <td className="px-4 py-2.5 text-gold-700 font-semibold">{c.discount_percent}%</td>
                  <td className="px-4 py-2.5">{c.current_uses}/{c.max_uses ?? "∞"}</td>
                  <td className="px-4 py-2.5 text-xs text-emerald-800/60">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString("es-CO") : "Sin vencimiento"}
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => toggle(c.code, !c.active)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.active ? "bg-emerald-50 text-emerald-700" : "bg-cream-100 text-emerald-800/50"}`}>
                      {c.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => remove(c.code)} className="text-xs text-red-600 hover:text-red-700">Borrar</button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="text-center text-emerald-800/50 py-6 text-sm">Aún no hay cupones.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
