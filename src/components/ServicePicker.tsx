"use client";
import type { DbService } from "@/lib/types";

export default function ServicePicker({
  services,
  value,
  onChange,
}: {
  services: DbService[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {services.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`text-left rounded-2xl border-2 p-4 transition ${
              active
                ? "border-gold-400 bg-gold-50/50"
                : "border-cream-300 bg-white hover:border-gold-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{s.icon ?? "✨"}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-emerald-800">{s.name}</h3>
                <p className="text-xs text-emerald-800/60 mt-1 line-clamp-2">{s.description}</p>
                <div className="flex items-center justify-between mt-3 text-xs">
                  <span className="text-emerald-700/70">{s.duration_minutes} min</span>
                  {s.base_price > 0 && (
                    <span className="font-semibold text-gold-700">
                      Desde ${s.base_price.toLocaleString("es-CO")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
