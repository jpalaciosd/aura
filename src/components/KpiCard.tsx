export default function KpiCard({
  label,
  value,
  hint,
  accent = "emerald",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "emerald" | "gold" | "red";
}) {
  const color = accent === "gold" ? "text-gold-700" : accent === "red" ? "text-red-600" : "text-emerald-700";
  return (
    <div className="bg-white border border-cream-300 rounded-2xl p-5">
      <div className="text-xs text-emerald-800/60 uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-display font-bold mt-1 ${color}`}>{value}</div>
      {hint && <div className="text-xs text-emerald-800/50 mt-1">{hint}</div>}
    </div>
  );
}
