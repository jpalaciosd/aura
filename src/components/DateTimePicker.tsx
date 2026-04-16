"use client";
import { useEffect, useState } from "react";

interface Slot { iso: string; label: string; }

function formatYmd(d: Date) {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

export default function DateTimePicker({
  serviceId,
  value,
  onChange,
}: {
  serviceId: string;
  value: string | null;
  onChange: (iso: string) => void;
}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const [selectedDate, setSelectedDate] = useState<string>(formatYmd(days[0]));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    fetch(`/api/booking/slots?service_id=${serviceId}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoading(false));
  }, [serviceId, selectedDate]);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-emerald-700 mb-2">Elige un día</label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const ymd = formatYmd(d);
            const active = selectedDate === ymd;
            return (
              <button
                key={ymd}
                onClick={() => setSelectedDate(ymd)}
                className={`flex-shrink-0 w-16 rounded-xl border-2 py-2 text-center transition ${
                  active ? "border-gold-400 bg-gold-50" : "border-cream-300 bg-white hover:border-gold-200"
                }`}
              >
                <div className="text-[10px] text-emerald-800/60 uppercase">
                  {d.toLocaleDateString("es-CO", { weekday: "short" })}
                </div>
                <div className="text-lg font-bold text-emerald-800">{d.getDate()}</div>
                <div className="text-[10px] text-emerald-800/60">
                  {d.toLocaleDateString("es-CO", { month: "short" })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-emerald-700 mb-2">Horarios disponibles</label>
        {loading ? (
          <div className="text-sm text-emerald-800/50">Cargando…</div>
        ) : slots.length === 0 ? (
          <div className="text-sm text-emerald-800/60 bg-cream-100 rounded-xl px-4 py-3">
            No hay horarios disponibles ese día. Prueba otra fecha.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((s) => {
              const active = value === s.iso;
              return (
                <button
                  key={s.iso}
                  onClick={() => onChange(s.iso)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition ${
                    active ? "border-gold-400 bg-gold-50 text-gold-800" : "border-cream-300 bg-white text-emerald-800 hover:border-gold-200"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
