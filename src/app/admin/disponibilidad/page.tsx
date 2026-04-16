"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { DbAvailability, DbBlockedSlot } from "@/lib/types";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function AdminDisponibilidadPage() {
  const { session } = useAuth();
  const [av, setAv] = useState<DbAvailability[]>([]);
  const [blocks, setBlocks] = useState<DbBlockedSlot[]>([]);
  const [newBlock, setNewBlock] = useState({ starts_at: "", ends_at: "", reason: "" });

  const load = async () => {
    if (!session?.access_token) return;
    const res = await fetch("/api/admin/availability", { headers: { Authorization: `Bearer ${session.access_token}` } });
    const d = await res.json();
    setAv(d.availability ?? []);
    setBlocks(d.blocks ?? []);
  };
  useEffect(() => { load(); }, [session]);

  const patchAv = async (id: string, p: Partial<DbAvailability>) => {
    await fetch("/api/admin/availability", {
      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
      body: JSON.stringify({ id, ...p }),
    });
    await load();
  };

  const addBlock = async () => {
    if (!newBlock.starts_at || !newBlock.ends_at) return;
    await fetch("/api/admin/availability", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session!.access_token}` },
      body: JSON.stringify({
        starts_at: new Date(newBlock.starts_at).toISOString(),
        ends_at: new Date(newBlock.ends_at).toISOString(),
        reason: newBlock.reason || null,
      }),
    });
    setNewBlock({ starts_at: "", ends_at: "", reason: "" });
    await load();
  };

  const removeBlock = async (id: string) => {
    await fetch(`/api/admin/availability?block_id=${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${session!.access_token}` },
    });
    await load();
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-6">Disponibilidad</h1>

      <section className="bg-white border border-cream-300 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-emerald-800 mb-4">Horario semanal</h2>
        <div className="space-y-2">
          {av.map((a) => (
            <div key={a.id} className="grid grid-cols-12 items-center gap-3 text-sm">
              <div className="col-span-3 font-medium text-emerald-800">{DAYS[a.day_of_week]}</div>
              <input type="time" defaultValue={a.start_time.slice(0, 5)}
                onBlur={(e) => e.target.value !== a.start_time.slice(0, 5) && patchAv(a.id, { start_time: e.target.value })}
                className="col-span-3 border border-cream-300 rounded-lg px-3 py-1.5" />
              <input type="time" defaultValue={a.end_time.slice(0, 5)}
                onBlur={(e) => e.target.value !== a.end_time.slice(0, 5) && patchAv(a.id, { end_time: e.target.value })}
                className="col-span-3 border border-cream-300 rounded-lg px-3 py-1.5" />
              <label className="col-span-3 flex items-center gap-2 text-xs">
                <input type="checkbox" checked={a.active} onChange={(e) => patchAv(a.id, { active: e.target.checked })} />
                Atiende
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-cream-300 rounded-2xl p-6">
        <h2 className="font-semibold text-emerald-800 mb-4">Bloqueos puntuales</h2>
        <div className="grid md:grid-cols-4 gap-2 mb-4">
          <input type="datetime-local" value={newBlock.starts_at} onChange={(e) => setNewBlock({ ...newBlock, starts_at: e.target.value })}
            className="border border-cream-300 rounded-lg px-3 py-2 text-sm" />
          <input type="datetime-local" value={newBlock.ends_at} onChange={(e) => setNewBlock({ ...newBlock, ends_at: e.target.value })}
            className="border border-cream-300 rounded-lg px-3 py-2 text-sm" />
          <input value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
            placeholder="Motivo (opcional)" className="border border-cream-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={addBlock} className="btn-gold rounded-full text-sm font-semibold">+ Bloquear</button>
        </div>

        <div className="space-y-2">
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center justify-between bg-cream-50 rounded-xl px-4 py-2 text-sm">
              <div>
                <span className="font-medium text-emerald-800">
                  {new Date(b.starts_at).toLocaleString("es-CO")} → {new Date(b.ends_at).toLocaleString("es-CO")}
                </span>
                {b.reason && <span className="text-emerald-800/60 ml-2">· {b.reason}</span>}
              </div>
              <button onClick={() => removeBlock(b.id)} className="text-xs text-red-600">Quitar</button>
            </div>
          ))}
          {blocks.length === 0 && <p className="text-sm text-emerald-800/50">No hay bloqueos.</p>}
        </div>
      </section>
    </div>
  );
}
