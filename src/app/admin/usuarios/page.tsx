"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { DbUser } from "@/lib/types";

interface Row extends DbUser { appointments_count: number }

export default function AdminUsuariosPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: users } = await supabase.from("users").select("*").order("created_at", { ascending: false }).limit(200);
      const { data: counts } = await supabase.from("appointments").select("customer_id");
      const countMap = new Map<string, number>();
      for (const a of (counts as { customer_id: string }[] | null) ?? []) {
        countMap.set(a.customer_id, (countMap.get(a.customer_id) ?? 0) + 1);
      }
      setRows((users as DbUser[] ?? []).map((u) => ({ ...u, appointments_count: countMap.get(u.id) ?? 0 })));
    })();
  }, []);

  const filtered = rows.filter((u) =>
    !q || u.email.toLowerCase().includes(q.toLowerCase()) || (u.name ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <h1 className="text-3xl font-display font-bold text-emerald-800 mb-4">Clientas</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o email"
        className="w-full border border-cream-300 rounded-xl px-4 py-2.5 text-sm mb-4" />

      <div className="bg-white border border-cream-300 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-emerald-800/70 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Teléfono</th>
              <th className="text-left px-4 py-2">Citas</th>
              <th className="text-left px-4 py-2">Rol</th>
              <th className="text-left px-4 py-2">Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-cream-200">
                <td className="px-4 py-2.5 font-medium text-emerald-800">{u.name ?? "—"}</td>
                <td className="px-4 py-2.5 text-xs">{u.email}</td>
                <td className="px-4 py-2.5 text-xs">{u.phone ?? "—"}</td>
                <td className="px-4 py-2.5">{u.appointments_count}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.role === "admin" ? "bg-gold-100 text-gold-800" : "bg-emerald-50 text-emerald-700"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-emerald-800/60">{new Date(u.created_at).toLocaleDateString("es-CO")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
