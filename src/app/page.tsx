"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AuraChat from "@/components/AuraChat";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { supabase } from "@/lib/supabase-browser";
import type { DbService, DbBeforeAfter, DbTestimonial } from "@/lib/types";

const WHATSAPP = "https://wa.me/573128200996?text=Hola%20AURA%2C%20quiero%20agendar%20una%20cita";
const AGENDAR = "/login?redirect=/dashboard/agendar";

/* ───── Placeholders (sólo si la BD está vacía) ───── */
const FALLBACK_BA: DbBeforeAfter[] = [
  {
    id: "ph-1", service_id: null, title: "Maderoterapia · Abdomen",
    description: "5 sesiones",
    before_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&h=1125&fit=crop",
    after_url:  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&h=1125&fit=crop",
    sessions_count: 5, sort_order: 0, active: true, created_at: "",
  },
  {
    id: "ph-2", service_id: null, title: "Plasma Facial",
    description: "2 sesiones",
    before_url: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=900&h=1125&fit=crop",
    after_url:  "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&h=1125&fit=crop",
    sessions_count: 2, sort_order: 1, active: true, created_at: "",
  },
  {
    id: "ph-3", service_id: null, title: "Mesoterapia · Contorno",
    description: "4 sesiones",
    before_url: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=900&h=1125&fit=crop",
    after_url:  "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&h=1125&fit=crop",
    sessions_count: 4, sort_order: 2, active: true, created_at: "",
  },
];

const FALLBACK_SERVICES: DbService[] = [
  { id: "fs-1", slug: "maderoterapia",      name: "Maderoterapia",        description: "Técnica con instrumentos de madera que moldea tu cuerpo, reduce medidas y combate la celulitis de forma natural.", duration_minutes: 60, base_price: 80000,  icon: "🪵", active: true, sort_order: 1, created_at: "" },
  { id: "fs-2", slug: "plasma-facial",      name: "Plasma Facial",         description: "Plasma rico en plaquetas que rejuvenece la piel, reduce arrugas y restaura la luminosidad del rostro.", duration_minutes: 60, base_price: 250000, icon: "🌟", active: true, sort_order: 2, created_at: "" },
  { id: "fs-3", slug: "masajes-relajantes", name: "Masajes Relajantes",    description: "Libera tensión y recupera energía.", duration_minutes: 60, base_price: 70000, icon: "🧘‍♀️", active: true, sort_order: 3, created_at: "" },
  { id: "fs-4", slug: "plasma-capilar",     name: "Plasma Capilar",        description: "Plasma rico en plaquetas en cuero cabelludo. Estimula crecimiento y regeneración del cabello.", duration_minutes: 60, base_price: 250000, icon: "✨", active: true, sort_order: 4, created_at: "" },
  { id: "fs-5", slug: "mesoterapia",        name: "Mesoterapia",           description: "Reduce grasa, celulitis y mejora la piel.", duration_minutes: 45, base_price: 120000, icon: "💉", active: true, sort_order: 5, created_at: "" },
  { id: "fs-6", slug: "masajes-reductores", name: "Masajes Reductores",    description: "Contorno corporal y reducción de grasa localizada.", duration_minutes: 60, base_price: 70000, icon: "💆‍♀️", active: true, sort_order: 6, created_at: "" },
  { id: "fs-7", slug: "inyectologia",       name: "Inyectología",          description: "Aplicación de inyecciones y curaciones con enfermería profesional. Disponible a domicilio.", duration_minutes: 30, base_price: 30000, icon: "🏥", active: true, sort_order: 7, created_at: "" },
  { id: "fs-8", slug: "cejas-pestanas",     name: "Cejas & Pestañas",      description: "Diseño, perfilado y extensiones.", duration_minutes: 60, base_price: 60000, icon: "👁️", active: true, sort_order: 8, created_at: "" },
];

const FALLBACK_TESTIMONIOS: DbTestimonial[] = [
  {
    id: "pt-1", customer_name: "María Clara", customer_avatar_url: null, service_id: null,
    text: "Buscaba un resultado que no se viera artificial. En AURA entendieron mi cuerpo y me brindaron la confianza que necesitaba. La atención es de otro nivel.",
    rating: 5, photo_url: null, sort_order: 0, featured: true, created_at: "",
  },
  {
    id: "pt-2", customer_name: "Laura G.", customer_avatar_url: null, service_id: null,
    text: "Tres sesiones de plasma facial y mi piel cambió. Se ve luminosa, las líneas finas casi desaparecieron. 100% recomendado.",
    rating: 5, photo_url: null, sort_order: 1, featured: true, created_at: "",
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [services, setServices] = useState<DbService[]>([]);
  const [beforeAfter, setBeforeAfter] = useState<DbBeforeAfter[]>([]);
  const [testimonios, setTestimonios] = useState<DbTestimonial[]>([]);
  const [ttIndex, setTtIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const [svc, ba, tt] = await Promise.all([
        supabase.from("services").select("*").eq("active", true).order("sort_order"),
        supabase.from("before_after").select("*").eq("active", true).order("sort_order").limit(6),
        supabase.from("testimonials").select("*").eq("featured", true).order("sort_order").limit(6),
      ]);
      setServices((svc.data as DbService[]) ?? []);
      setBeforeAfter((ba.data as DbBeforeAfter[]) ?? []);
      setTestimonios((tt.data as DbTestimonial[]) ?? []);
    })();
  }, []);

  const svcShow = services.length ? services : FALLBACK_SERVICES;
  const baShow = beforeAfter.length ? beforeAfter : FALLBACK_BA;
  const ttShow = testimonios.length ? testimonios : FALLBACK_TESTIMONIOS;
  const testimonio = ttShow[ttIndex % ttShow.length];

  return (
    <div className="bg-surface text-on-surface font-body overflow-x-hidden">
      <AuraChat />

      {/* ───────────────────────────── NAV ───────────────────────────── */}
      <nav className="fixed top-0 w-full z-40 bg-surface/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center px-6 md:px-12 py-5 max-w-[1920px] mx-auto">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="AURA" width={40} height={40} className="rounded-full border border-primary-amber/30" priority />
            <div className="leading-none">
              <span className="font-headline font-bold text-2xl tracking-tight text-primary-amber">AURA</span>
              <span className="block font-label text-[9px] tracking-[0.3em] text-white/50 mt-0.5">BIENESTAR ESTÉTICO</span>
            </div>
          </Link>

          <div className="hidden md:flex gap-8 lg:gap-12">
            <a href="#resultados" className="font-headline italic text-lg lg:text-xl tracking-tight text-white/70 hover:text-primary-amber transition-colors">Resultados</a>
            <a href="#servicios"  className="font-headline italic text-lg lg:text-xl tracking-tight text-white/70 hover:text-primary-amber transition-colors">Servicios</a>
            <a href="#proceso"    className="font-headline italic text-lg lg:text-xl tracking-tight text-white/70 hover:text-primary-amber transition-colors">Proceso</a>
            <a href="#testimonio" className="font-headline italic text-lg lg:text-xl tracking-tight text-white/70 hover:text-primary-amber transition-colors">Voces</a>
          </div>

          <Link href={AGENDAR} className="hidden md:inline-flex btn-amber px-6 py-2.5 rounded-full font-label text-[10px] tracking-[0.25em] uppercase shadow-[0_10px_30px_rgba(239,189,138,0.08)]">
            Reservar cita
          </Link>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-primary-amber text-2xl" aria-label="Menú">☰</button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-surface/95 border-t border-white/5 px-6 py-4 space-y-3">
            <a href="#resultados" onClick={() => setMenuOpen(false)} className="block font-headline italic text-white/80">Resultados</a>
            <a href="#servicios"  onClick={() => setMenuOpen(false)} className="block font-headline italic text-white/80">Servicios</a>
            <a href="#proceso"    onClick={() => setMenuOpen(false)} className="block font-headline italic text-white/80">Proceso</a>
            <a href="#testimonio" onClick={() => setMenuOpen(false)} className="block font-headline italic text-white/80">Voces</a>
            <Link href={AGENDAR} onClick={() => setMenuOpen(false)} className="block font-label text-xs tracking-widest text-primary-amber">RESERVAR CITA →</Link>
          </div>
        )}
      </nav>

      {/* ───────────────────────────── HERO ───────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 pt-24 pb-32 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary-amber/20 glow-blob rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary-rose/10 glow-blob rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-[1400px] mx-auto w-full"
        >
          <span className="font-label text-[10px] md:text-xs tracking-[0.3em] text-primary-amber mb-6 block">
            [ BIENESTAR ESTÉTICO · PASTO, COLOMBIA ]
          </span>

          <h1 className="font-headline font-extrabold leading-[0.85] text-[clamp(3rem,10vw,130px)] flex flex-col items-start gap-2 md:gap-4">
            <span className="text-primary-amber italic">TRANSFORMA</span>
            <span className="text-white">TU CUERPO</span>
            <span className="text-stroke italic tracking-widest">&amp; BELLEZA</span>
          </h1>

          <p className="font-body text-base md:text-lg text-white/60 max-w-xl mt-8 leading-relaxed">
            Maderoterapia, plasma, mesoterapia, masajes. Agenda online, paga con Nequi y recibe confirmación al instante.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-10">
            <Link href={AGENDAR} className="btn-amber px-8 py-4 rounded-full font-label text-[11px] tracking-[0.25em] uppercase shadow-[0_20px_40px_rgba(212,165,116,0.15)] text-center">
              ✦ Agendar online
            </Link>
            <a href={WHATSAPP} target="_blank" rel="noopener"
              className="px-8 py-4 rounded-full border border-white/15 hover:border-primary-amber/60 hover:text-primary-amber text-white/80 font-label text-[11px] tracking-[0.25em] uppercase transition-colors text-center">
              WhatsApp directo
            </a>
          </div>
        </motion.div>

        {/* Bottom-right social proof */}
        <div className="absolute bottom-24 right-6 md:right-12 z-20 hidden md:flex flex-col items-end gap-2 max-w-xs text-right">
          <div className="flex -space-x-3 mb-2">
            {[
              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop",
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
              "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop",
            ].map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt="clienta" className="w-10 h-10 rounded-full border-2 border-surface object-cover grayscale" />
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-surface bg-primary-amber flex items-center justify-center font-label text-[10px] text-on-primary-amber">+200</div>
          </div>
          <p className="font-label text-[10px] uppercase tracking-[0.25em] text-white/50 italic">Resultados reales, sin artificios.</p>
        </div>

        {/* Marquee ticker */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden py-4 bg-white/5 backdrop-blur-sm border-y border-white/5 z-10">
          <div className="flex whitespace-nowrap gap-12 animate-marquee font-headline italic text-xl md:text-2xl text-white/40 uppercase">
            {Array.from({ length: 2 }).map((_, k) => (
              <span key={k} className="flex gap-12 flex-shrink-0 pr-12">
                <span>✦ Agenda online</span>
                <span>✦ Pago Nequi</span>
                <span>✦ Confirmación al instante</span>
                <span>✦ +5 años de experiencia</span>
                <span>✦ Resultados reales</span>
                <span>✦ Pasto, Colombia</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── STATS BAND ───────────────────────────── */}
      <section className="bg-surface-container-low py-20 md:py-24 px-6 md:px-12 border-y border-white/5">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { n: "+200", l: "Clientas felices" },
            { n: String(services.length || 8), l: "Servicios élite" },
            { n: "+5",   l: "Años de maestría" },
            { n: "100%", l: "Satisfacción" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col gap-2">
              <span className="font-headline text-5xl md:text-6xl text-primary-amber font-bold">{s.n}</span>
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-white/50">{s.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────── RESULTADOS REALES ───────────────────────────── */}
      <section id="resultados" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
            <div>
              <span className="font-label text-[10px] md:text-xs tracking-[0.3em] text-secondary-rose block mb-4">{"// EVIDENCIA REAL"}</span>
              <h2 className="font-headline text-5xl md:text-7xl font-bold italic text-stroke leading-[0.9]">RESULTADOS<br/>REALES</h2>
            </div>
            <p className="max-w-md font-body text-sm text-white/60 md:text-right">
              Arrastra cada imagen para revelar el antes y el después. Fotos reales de nuestras clientas, con su consentimiento.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {baShow.slice(0, 3).map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className={i === 1 ? "md:translate-y-12" : ""}
              >
                <BeforeAfterSlider
                  beforeUrl={b.before_url}
                  afterUrl={b.after_url}
                  title={b.title}
                  badge={b.sessions_count ? `${b.sessions_count} SES.` : undefined}
                  subtitle={b.description ?? undefined}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── SERVICIOS BENTO ───────────────────────────── */}
      <section id="servicios" className="py-24 md:py-32 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col mb-12 md:mb-16 max-w-2xl">
            <span className="font-label text-[10px] md:text-xs tracking-[0.3em] text-primary-amber mb-4">CATÁLOGO DE SERVICIOS // 002</span>
            <h2 className="font-headline text-4xl md:text-5xl italic leading-tight">
              Tratamientos de bienestar estético diseñados para tu mejor versión.
            </h2>
          </div>

          <BentoGrid services={svcShow.slice(0, 5)} />

          {svcShow.length > 5 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6">
              {svcShow.slice(5).map((s) => (
                <Link
                  key={s.id}
                  href={`${AGENDAR}?service=${s.slug}`}
                  className="group relative bg-surface-container p-6 rounded-lg hover:bg-surface-container-high transition-colors border border-white/5"
                >
                  <span className="text-3xl block mb-3">{s.icon}</span>
                  <h3 className="font-headline text-xl font-bold text-white">{s.name}</h3>
                  {s.base_price > 0 && (
                    <span className="font-label text-[10px] tracking-widest text-primary-amber block mt-2">
                      DESDE ${s.base_price.toLocaleString("es-CO")}
                    </span>
                  )}
                  <span className="absolute top-5 right-5 text-white/30 group-hover:text-primary-amber transition-colors">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────────────────────────── PROCESO HORIZONTAL ───────────────────────────── */}
      <section id="proceso" className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col items-center text-center mb-16 md:mb-24">
            <span className="font-label text-[10px] md:text-xs tracking-[0.3em] text-primary-amber mb-4">EL PROCESO // STEP-BY-STEP</span>
            <h2 className="font-headline text-5xl md:text-6xl font-bold italic">Tu viaje hacia la <span className="text-primary-amber">transformación</span></h2>
          </div>

          <div className="flex md:grid md:grid-cols-4 overflow-x-auto md:overflow-visible gap-5 md:gap-6 pb-6 md:pb-0 snap-x snap-mandatory hide-scrollbar -mx-6 md:mx-0 px-6 md:px-0">
            {[
              { n: 1, label: "INGRESO",        title: "Entra con Google",      desc: "5 segundos y estás adentro. Elige el tratamiento que te interesa.", pct: 25 },
              { n: 2, label: "ASESORÍA",       title: "Chatea con Aura",       desc: "Nuestra IA te orienta. Si prefieres humano, tienes WhatsApp.",     pct: 50 },
              { n: 3, label: "RESERVA Y PAGO", title: "Reserva y paga",        desc: "Horario, cupón y pago por Nequi desde tu celular.",                pct: 75 },
              { n: 4, label: "TRANSFORMACIÓN", title: "Confirmación al instante", desc: "Recibe tu código y disfruta los resultados desde la primera sesión.", pct: 100 },
            ].map((p) => (
              <div key={p.n} className="flex-shrink-0 w-[85vw] sm:w-[340px] md:w-auto aspect-[4/5] md:aspect-auto md:min-h-[460px] bg-surface-container-low p-8 rounded-lg flex flex-col justify-between snap-center relative overflow-hidden border border-white/5">
                <span className="absolute top-0 right-0 font-headline text-[14rem] text-white/[0.03] -translate-y-16 translate-x-8 leading-none select-none">{p.n}</span>
                <div className="relative z-10">
                  <span className="font-label text-[10px] tracking-[0.3em] text-primary-amber mb-4 block">{p.label}</span>
                  <h3 className="font-headline text-2xl lg:text-3xl italic leading-tight mb-3">{p.title}</h3>
                  <p className="font-body text-sm text-white/60 leading-relaxed">{p.desc}</p>
                </div>
                <div className="w-full h-[2px] bg-white/10 rounded-full relative mt-8">
                  <div className="absolute h-full bg-primary-amber rounded-full" style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── CONFIANZA ───────────────────────────── */}
      <section className="py-20 md:py-24 px-6 md:px-12 bg-surface-container-lowest border-y border-white/5">
        <div className="max-w-[1400px] mx-auto">
          <span className="font-label text-[10px] md:text-xs tracking-[0.3em] text-primary-amber mb-8 block">{"// LO QUE NOS DISTINGUE"}</span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: "🔒", title: "Pago seguro", desc: "Comprobante Nequi validado por IA con revisión humana de respaldo." },
              { icon: "⚡", title: "Confirmación instantánea", desc: "Recibes tu código de canje al instante, sin esperas." },
              { icon: "🌿", title: "Atención personalizada", desc: "Cada tratamiento es diseñado a tu anatomía y objetivos." },
              { icon: "✦", title: "Resultados visibles", desc: "Desde la primera sesión. +200 clientas lo confirman." },
            ].map((c) => (
              <div key={c.title} className="bg-surface-container p-6 md:p-8 rounded-lg border border-white/5">
                <span className="text-3xl block mb-4">{c.icon}</span>
                <h3 className="font-headline text-xl font-bold text-white mb-2">{c.title}</h3>
                <p className="font-body text-sm text-white/60 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── TESTIMONIO ───────────────────────────── */}
      <section id="testimonio" className="py-24 md:py-32 px-6 md:px-12 bg-surface-container-lowest">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="relative aspect-square max-w-md md:max-w-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={testimonio.photo_url ?? "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=900&h=900&fit=crop"}
              alt="testimonio"
              className="w-full h-full object-cover rounded-lg grayscale"
            />
            <div className="absolute -bottom-6 -right-6 md:-bottom-10 md:-right-10 w-40 h-40 md:w-56 md:h-56 bg-primary-amber rounded-lg flex items-center justify-center p-6 md:p-8 text-on-primary-amber font-headline italic text-lg md:text-2xl leading-tight shadow-2xl">
              &ldquo;{testimonio.customer_name} cambió su historia con AURA&rdquo;
            </div>
          </div>

          <div className="flex flex-col gap-8 md:gap-12">
            <span className="font-headline text-primary-amber text-6xl md:text-7xl leading-none">&ldquo;</span>
            <p className="font-headline text-2xl md:text-4xl italic leading-relaxed text-white">
              {testimonio.text}
            </p>
            <div>
              <h4 className="font-label text-sm uppercase tracking-[0.25em] text-primary-amber">{testimonio.customer_name}</h4>
              <p className="font-label text-[10px] opacity-40 uppercase tracking-[0.25em] mt-1">
                Rating: {"★".repeat(testimonio.rating)}
              </p>
            </div>

            {ttShow.length > 1 && (
              <div className="flex gap-3 items-center">
                {ttShow.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTtIndex(i)}
                    aria-label={`Testimonio ${i + 1}`}
                    className={`h-[3px] transition-all rounded-full ${
                      i === ttIndex % ttShow.length ? "w-8 bg-primary-amber" : "w-3 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── FINAL CTA ───────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-12 overflow-hidden bg-surface py-24">
        <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px] bg-primary-amber/10 glow-blob rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-10 md:gap-12 max-w-4xl">
          <span className="font-label text-[10px] tracking-[0.3em] text-primary-amber">{"// TU MOMENTO"}</span>
          <h2 className="font-headline text-[clamp(2.5rem,9vw,110px)] font-bold leading-none italic">
            TU TRANSFORMACIÓN<br/>EMPIEZA <span className="text-primary-amber">HOY</span>
          </h2>
          <p className="font-body text-white/60 text-base md:text-lg max-w-xl">
            Agenda en minutos desde tu celular. Sin llamadas, sin esperas. Recibe tu código de confirmación al instante.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Link href={AGENDAR} className="btn-amber px-10 py-5 rounded-full font-label text-[11px] tracking-[0.3em] uppercase shadow-[0_20px_60px_rgba(239,189,138,0.2)]">
              ✦ Reservar mi cita
            </Link>
            <a href={WHATSAPP} target="_blank" rel="noopener"
              className="px-10 py-5 rounded-full border border-white/15 hover:border-primary-amber/60 hover:text-primary-amber text-white/80 font-label text-[11px] tracking-[0.3em] uppercase transition-colors">
              Hablar por WhatsApp
            </a>
          </div>
          <p className="font-label text-[10px] uppercase tracking-[0.5em] text-white/30 mt-6">PASTO · COLOMBIA · {new Date().getFullYear()}</p>
        </div>
      </section>

      {/* ───────────────────────────── FOOTER ───────────────────────────── */}
      <footer className="bg-surface px-6 md:px-12 py-16 md:py-24 relative overflow-hidden flex flex-col gap-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 pb-16 md:pb-24 border-b border-white/5">
          <div className="flex flex-col gap-6 max-w-sm">
            <div className="flex items-center gap-3">
              <Image src="/logo.jpg" alt="AURA" width={44} height={44} className="rounded-full border border-primary-amber/30" />
              <div>
                <span className="font-headline font-bold text-2xl text-primary-amber">AURA</span>
                <span className="block font-label text-[9px] tracking-[0.3em] text-white/50">BIENESTAR ESTÉTICO</span>
              </div>
            </div>
            <p className="font-headline text-xl italic text-white/60">
              Maderoterapia, plasma y tratamientos de bienestar estético de alto impacto. Pasto, Colombia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 md:gap-24">
            <div className="flex flex-col gap-4">
              <span className="font-label text-[10px] uppercase tracking-[0.25em] text-white/40">SERVICIOS</span>
              <div className="flex flex-col gap-2.5 font-body text-sm">
                <a href="#servicios" className="text-white/70 hover:text-primary-amber transition-colors">Corporal</a>
                <a href="#servicios" className="text-white/70 hover:text-primary-amber transition-colors">Facial</a>
                <a href="#servicios" className="text-white/70 hover:text-primary-amber transition-colors">Plasma</a>
                <a href="#servicios" className="text-white/70 hover:text-primary-amber transition-colors">Masajes</a>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-label text-[10px] uppercase tracking-[0.25em] text-white/40">CUENTA</span>
              <div className="flex flex-col gap-2.5 font-body text-sm">
                <Link href="/login" className="text-white/70 hover:text-primary-amber transition-colors">Mi cuenta</Link>
                <Link href={AGENDAR} className="text-white/70 hover:text-primary-amber transition-colors">Agendar</Link>
                <a href={WHATSAPP} target="_blank" rel="noopener" className="text-white/70 hover:text-primary-amber transition-colors">WhatsApp</a>
                <a href="#" className="text-white/70 hover:text-primary-amber transition-colors">Instagram</a>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <h2 className="text-[clamp(5rem,22vw,25rem)] font-black text-white/[0.03] leading-none uppercase select-none tracking-tighter font-headline">AURA</h2>
          <div className="absolute bottom-0 left-0 w-full flex justify-between items-end pb-2">
            <p className="font-label text-[10px] uppercase tracking-[0.25em] text-white/40 italic">
              © {new Date().getFullYear()} AURA BIENESTAR ESTÉTICO // PASTO, COLOMBIA
            </p>
            <p className="hidden md:block font-label text-[10px] uppercase tracking-[0.25em] text-white/30">
              Powered by <a href="https://ainovax.vercel.app" target="_blank" rel="noopener" className="text-primary-amber hover:underline">AINovaX</a>
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky bottom bar mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-white/10 p-3 flex gap-2 z-30">
        <Link href={AGENDAR} className="btn-amber flex-1 py-3 rounded-full font-label text-[10px] tracking-widest uppercase text-center">
          ✦ Agendar
        </Link>
        <a href={WHATSAPP} target="_blank" rel="noopener"
          className="flex-1 py-3 border border-white/15 rounded-full font-label text-[10px] tracking-widest uppercase text-white/80 text-center">
          WhatsApp
        </a>
      </div>
    </div>
  );
}

/* ───────────────────────────── BENTO GRID ───────────────────────────── */

function BentoGrid({ services }: { services: DbService[] }) {
  const [s1, s2, s3, s4, s5] = services;
  const fmtPrice = (p: number) => p > 0 ? `DESDE $${p.toLocaleString("es-CO")}` : "CONSÚLTANOS";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-2 gap-5 md:gap-6 md:h-[900px]">
      {/* Slot 1: main big (col-span-2) */}
      {s1 && (
        <Link
          href={`${AGENDAR}?service=${s1.slug}`}
          className="md:col-span-2 md:row-span-1 bg-surface-container p-8 md:p-12 rounded-lg flex flex-col justify-between group hover:border-primary-amber/30 transition-all border border-white/5 min-h-[280px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-stroke font-headline text-5xl md:text-6xl opacity-20">01</span>
            <span className="text-4xl">{s1.icon}</span>
          </div>
          <div>
            <h3 className="font-headline text-2xl md:text-3xl font-bold mb-3">{s1.name}</h3>
            <p className="font-body text-sm text-white/60 max-w-sm mb-4 line-clamp-3">{s1.description}</p>
            <span className="font-label text-[10px] tracking-[0.25em] text-primary-amber">{fmtPrice(s1.base_price)} →</span>
          </div>
        </Link>
      )}

      {/* Slot 2: tall featured cream */}
      {s2 && (
        <Link
          href={`${AGENDAR}?service=${s2.slug}`}
          className="md:col-span-1 md:row-span-2 bg-[#f5f5f0] text-surface p-8 md:p-12 rounded-lg flex flex-col justify-between group hover:shadow-2xl transition-all min-h-[280px]"
        >
          <div className="flex flex-col gap-6">
            <span className="text-4xl">{s2.icon}</span>
            <h3 className="font-headline text-3xl md:text-4xl font-bold leading-tight">{s2.name}</h3>
            <p className="font-body text-sm opacity-80 leading-relaxed">{s2.description}</p>
            <span className="font-label text-[10px] tracking-[0.25em] opacity-70 mt-2">{fmtPrice(s2.base_price)} →</span>
          </div>
        </Link>
      )}

      {/* Slot 3: square hover-primary */}
      {s3 && (
        <Link
          href={`${AGENDAR}?service=${s3.slug}`}
          className="md:col-span-1 md:row-span-1 bg-surface-container-highest p-8 md:p-12 rounded-lg flex flex-col items-center justify-center text-center group hover:bg-primary-amber transition-colors cursor-pointer min-h-[240px]"
        >
          <span className="text-5xl mb-4 transition-transform group-hover:scale-110">{s3.icon}</span>
          <h3 className="font-headline text-xl md:text-2xl italic group-hover:text-on-primary-amber transition-colors">{s3.name}</h3>
          <span className="font-label text-[9px] tracking-widest text-white/50 group-hover:text-on-primary-amber/80 mt-3 transition-colors">{fmtPrice(s3.base_price)}</span>
        </Link>
      )}

      {/* Slot 4: banner noise (col-span-2) */}
      {s4 && (
        <Link
          href={`${AGENDAR}?service=${s4.slug}`}
          className="md:col-span-2 md:row-span-1 bg-surface p-8 md:p-12 border border-white/5 rounded-lg relative overflow-hidden flex flex-col justify-end group hover:border-primary-amber/30 transition-colors min-h-[240px]"
        >
          <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
          <div className="relative z-10">
            <span className="text-stroke font-headline text-5xl md:text-6xl opacity-20 block mb-4">03</span>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="font-headline text-2xl md:text-3xl font-bold mb-2">{s4.name}</h3>
                <p className="font-label text-[10px] tracking-[0.25em] text-primary-amber">{fmtPrice(s4.base_price)}</p>
              </div>
              <span className="text-4xl">{s4.icon}</span>
            </div>
          </div>
        </Link>
      )}

      {/* Slot 5: small CTA */}
      {s5 && (
        <Link
          href={`${AGENDAR}?service=${s5.slug}`}
          className="md:col-span-1 md:row-span-1 bg-primary-amber/[0.08] p-8 md:p-12 rounded-lg border border-primary-amber/20 flex flex-col justify-center hover:bg-primary-amber/[0.15] transition-colors min-h-[240px]"
        >
          <span className="text-3xl mb-3">{s5.icon}</span>
          <h3 className="font-label text-[10px] tracking-[0.25em] text-primary-amber mb-2">{s5.name.toUpperCase()}</h3>
          <div className="w-10 h-px bg-primary-amber mb-4" />
          <p className="font-headline text-xl italic text-white/80">{s5.description}</p>
        </Link>
      )}
    </div>
  );
}
