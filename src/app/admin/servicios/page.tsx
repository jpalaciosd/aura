"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { DbService } from "@/lib/types";

export default function AdminServiciosPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<DbService[]>([]);

  const load = async () => {
    if (!session?.access_token) return;
    const res = await fetch("/api/admin/services", { headers: { Authorization: `Bearer ${session.access_token}` } });
    const data = await res.json();
    setRows(data.services ?? []);
  };
  useEffect(() => { load(); }, [session]);

  const patch = async (id: string, p: Partial<DbService>) => {
    await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
      body: JSON.stringify({ id, ...p }),
    });
    await load();
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-6">Servicios</h1>
      <div className="space-y-3">
        {rows.map((s) => (
          <div key={s.id} className="bg-white border border-cream-300 rounded-2xl p-4 grid md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-4 flex items-center gap-2">
              <span className="text-2xl">{s.icon}</span>
              <input defaultValue={s.name} onBlur={(e) => e.target.value !== s.name && patch(s.id, { name: e.target.value })}
                className="flex-1 font-semibold text-emerald-800 bg-transparent outline-none border-b border-transparent focus:border-gold-400" />
            </div>
            <label className="md:col-span-2 flex items-center gap-2 text-xs">
              <span className="text-emerald-800/60">Duración</span>
              <input type="number" defaultValue={s.duration_minutes}
                onBlur={(e) => Number(e.target.value) !== s.duration_minutes && patch(s.id, { duration_minutes: Number(e.target.value) })}
                className="w-16 border border-cream-300 rounded px-2 py-1 text-right" /> min
            </label>
            <label className="md:col-span-3 flex items-center gap-2 text-xs">
              <span className="text-emerald-800/60">Precio</span>
              <input type="number" defaultValue={s.base_price}
                onBlur={(e) => Number(e.target.value) !== s.base_price && patch(s.id, { base_price: Number(e.target.value) })}
                className="flex-1 border border-cream-300 rounded px-2 py-1 text-right" />
            </label>
            <label className="md:col-span-2 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={s.active} onChange={(e) => patch(s.id, { active: e.target.checked })} />
              Activo
            </label>
            <div className="md:col-span-1 text-right text-[10px] text-emerald-800/50">{s.slug}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
