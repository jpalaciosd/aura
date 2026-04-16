"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/AuthContext";
import type { DbService, DbBeforeAfter, DbTestimonial } from "@/lib/types";

export default function AdminGaleriaPage() {
  const { session } = useAuth();
  const [services, setServices] = useState<DbService[]>([]);
  const [ba, setBa] = useState<DbBeforeAfter[]>([]);
  const [tt, setTt] = useState<DbTestimonial[]>([]);

  const load = async () => {
    if (!session?.access_token) return;
    const [svc, gal] = await Promise.all([
      supabase.from("services").select("*").order("sort_order"),
      fetch("/api/admin/gallery", { headers: { Authorization: `Bearer ${session.access_token}` } }).then((r) => r.json()),
    ]);
    setServices((svc.data as DbService[]) ?? []);
    setBa(gal.before_after ?? []);
    setTt(gal.testimonials ?? []);
  };
  useEffect(() => { load(); }, [session]);

  const removeItem = async (kind: "before_after" | "testimonial", id: string) => {
    if (!confirm("¿Borrar?")) return;
    await fetch(`/api/admin/gallery?kind=${kind}&id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session!.access_token}` },
    });
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-display font-bold text-emerald-800 mb-2">Galería</h1>
        <p className="text-emerald-800/60">Lo que subas aquí aparece en la landing automáticamente.</p>
      </div>

      <BeforeAfterSection services={services} items={ba} token={session?.access_token} onChange={load} onDelete={(id) => removeItem("before_after", id)} />
      <TestimonialsSection services={services} items={tt} token={session?.access_token} onChange={load} onDelete={(id) => removeItem("testimonial", id)} />
    </div>
  );
}

function BeforeAfterSection({ services, items, token, onChange, onDelete }: {
  services: DbService[]; items: DbBeforeAfter[]; token: string | undefined; onChange: () => void; onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [sessions, setSessions] = useState("");
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!before || !after || !title || !token) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("kind", "before_after");
    fd.append("title", title);
    fd.append("description", description);
    if (serviceId) fd.append("service_id", serviceId);
    if (sessions) fd.append("sessions_count", sessions);
    fd.append("before", before);
    fd.append("after", after);
    await fetch("/api/admin/gallery", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
    setTitle(""); setDescription(""); setServiceId(""); setSessions(""); setBefore(null); setAfter(null);
    setSaving(false);
    onChange();
  };

  return (
    <section>
      <h2 className="text-xl font-display font-bold text-emerald-800 mb-4">Antes / Después</h2>

      <div className="bg-white border border-cream-300 rounded-2xl p-6 mb-4 grid md:grid-cols-2 gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título"
          className="border border-cream-300 rounded-xl px-4 py-2.5 text-sm" />
        <input value={sessions} type="number" onChange={(e) => setSessions(e.target.value)} placeholder="Nº de sesiones"
          className="border border-cream-300 rounded-xl px-4 py-2.5 text-sm" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción"
          className="md:col-span-2 border border-cream-300 rounded-xl px-4 py-2.5 text-sm" />
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
          className="md:col-span-2 border border-cream-300 rounded-xl px-4 py-2.5 text-sm">
          <option value="">Sin servicio específico</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
        </select>
        <label className="border border-dashed border-cream-300 rounded-xl p-4 text-sm text-emerald-800/70 cursor-pointer text-center">
          <input type="file" accept="image/*" onChange={(e) => setBefore(e.target.files?.[0] ?? null)} className="hidden" />
          {before ? `✓ ${before.name}` : "📎 Foto ANTES"}
        </label>
        <label className="border border-dashed border-cream-300 rounded-xl p-4 text-sm text-emerald-800/70 cursor-pointer text-center">
          <input type="file" accept="image/*" onChange={(e) => setAfter(e.target.files?.[0] ?? null)} className="hidden" />
          {after ? `✓ ${after.name}` : "📎 Foto DESPUÉS"}
        </label>
        <button onClick={submit} disabled={saving || !title || !before || !after}
          className="btn-gold md:col-span-2 py-2.5 rounded-full font-semibold disabled:opacity-50">
          {saving ? "Subiendo…" : "Publicar"}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => (
          <div key={i.id} className="bg-white border border-cream-300 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2">
              <img src={i.before_url} alt="antes" className="aspect-square object-cover" />
              <img src={i.after_url} alt="después" className="aspect-square object-cover" />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-emerald-800">{i.title}</h3>
              {i.sessions_count && <p className="text-xs text-gold-700 mt-0.5">{i.sessions_count} sesiones</p>}
              {i.description && <p className="text-sm text-emerald-800/60 mt-1 line-clamp-2">{i.description}</p>}
              <button onClick={() => onDelete(i.id)} className="text-xs text-red-600 mt-2">Borrar</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-emerald-800/50 text-sm">Aún no has publicado resultados.</p>}
      </div>
    </section>
  );
}

function TestimonialsSection({ services, items, token, onChange, onDelete }: {
  services: DbService[]; items: DbTestimonial[]; token: string | undefined; onChange: () => void; onDelete: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [serviceId, setServiceId] = useState("");
  const [featured, setFeatured] = useState(true);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name || !text || !token) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("kind", "testimonial");
    fd.append("customer_name", name);
    fd.append("text", text);
    fd.append("rating", String(rating));
    if (serviceId) fd.append("service_id", serviceId);
    fd.append("featured", String(featured));
    if (avatar) fd.append("avatar", avatar);
    if (photo) fd.append("photo", photo);
    await fetch("/api/admin/gallery", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
    setName(""); setText(""); setRating(5); setServiceId(""); setAvatar(null); setPhoto(null);
    setSaving(false);
    onChange();
  };

  return (
    <section>
      <h2 className="text-xl font-display font-bold text-emerald-800 mb-4">Testimonios</h2>

      <div className="bg-white border border-cream-300 rounded-2xl p-6 mb-4 grid md:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la clienta"
          className="border border-cream-300 rounded-xl px-4 py-2.5 text-sm" />
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}
          className="border border-cream-300 rounded-xl px-4 py-2.5 text-sm">
          {[5, 4, 3].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
        </select>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Testimonio" rows={3}
          className="md:col-span-2 border border-cream-300 rounded-xl px-4 py-2.5 text-sm resize-none" />
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}
          className="border border-cream-300 rounded-xl px-4 py-2.5 text-sm">
          <option value="">Sin servicio</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
        </select>
        <label className="flex items-center gap-2 border border-cream-300 rounded-xl px-4 py-2.5 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Destacado en landing
        </label>
        <label className="border border-dashed border-cream-300 rounded-xl p-4 text-sm text-emerald-800/70 cursor-pointer text-center">
          <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} className="hidden" />
          {avatar ? `✓ ${avatar.name}` : "📎 Avatar (opcional)"}
        </label>
        <label className="border border-dashed border-cream-300 rounded-xl p-4 text-sm text-emerald-800/70 cursor-pointer text-center">
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="hidden" />
          {photo ? `✓ ${photo.name}` : "📎 Foto resultado (opcional)"}
        </label>
        <button onClick={submit} disabled={saving || !name || !text}
          className="btn-gold md:col-span-2 py-2.5 rounded-full font-semibold disabled:opacity-50">
          {saving ? "Subiendo…" : "Publicar testimonio"}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((t) => (
          <div key={t.id} className="bg-white border border-cream-300 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              {t.customer_avatar_url ? (
                <img src={t.customer_avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm">{t.customer_name[0]}</div>
              )}
              <div>
                <div className="font-bold text-emerald-800 text-sm">{t.customer_name}</div>
                <div className="text-xs text-gold-600">{"★".repeat(t.rating)}</div>
              </div>
            </div>
            <p className="text-sm text-emerald-800/70 italic line-clamp-3">&ldquo;{t.text}&rdquo;</p>
            {t.photo_url && <img src={t.photo_url} alt="" className="mt-3 rounded-xl aspect-video w-full object-cover" />}
            <button onClick={() => onDelete(t.id)} className="text-xs text-red-600 mt-2">Borrar</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-emerald-800/50 text-sm">Aún no hay testimonios.</p>}
      </div>
    </section>
  );
}
