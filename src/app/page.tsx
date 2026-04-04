"use client";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";

const WHATSAPP = "https://wa.me/573148915903?text=Hola%20AURA%2C%20quiero%20agendar%20una%20cita";

/* ───── Services ───── */
const SERVICIOS = [
  {
    icon: "🪵",
    name: "Maderoterapia",
    desc: "Técnica con instrumentos de madera que moldea tu cuerpo, reduce medidas y combate la celulitis de forma natural.",
    benefits: ["Reduce medidas", "Moldea la figura", "Elimina celulitis", "Activa circulación"],
  },
  {
    icon: "💆‍♀️",
    name: "Masajes Reductores",
    desc: "Masajes especializados que trabajan zonas específicas para reducir grasa localizada y mejorar el contorno corporal.",
    benefits: ["Reduce grasa localizada", "Mejora contorno", "Desintoxica", "Tonifica"],
  },
  {
    icon: "🧘‍♀️",
    name: "Masajes Relajantes",
    desc: "Sesiones terapéuticas que liberan tensión, reducen el estrés y te devuelven la energía para el día a día.",
    benefits: ["Elimina estrés", "Alivia tensión", "Mejora el sueño", "Bienestar total"],
  },
  {
    icon: "💉",
    name: "Mesoterapia",
    desc: "Microinyecciones con sustancias activas que reducen grasa, celulitis y mejoran la calidad de la piel.",
    benefits: ["Reduce grasa", "Mejora la piel", "Combate celulitis", "Resultados visibles"],
  },
  {
    icon: "🏥",
    name: "Inyectología & Curaciones",
    desc: "Servicio profesional de enfermería: aplicación de inyecciones, curaciones y procedimientos ambulatorios.",
    benefits: ["Personal calificado", "Atención profesional", "A domicilio", "Seguro y confiable"],
  },
  {
    icon: "✨",
    name: "Plasma Capilar",
    desc: "Inyección de plasma rico en plaquetas en el cuero cabelludo para estimular el crecimiento y regeneración del cabello.",
    benefits: ["Regenera cabello", "Detiene caída", "Natural y seguro", "Resultados duraderos"],
  },
  {
    icon: "🌟",
    name: "Plasma Facial",
    desc: "Tratamiento con plasma rico en plaquetas que rejuvenece la piel, reduce arrugas y restaura la luminosidad del rostro.",
    benefits: ["Reduce arrugas", "Rejuvenece la piel", "Estimula colágeno", "Aspecto natural"],
  },
  {
    icon: "👁️",
    name: "Cejas & Pestañas",
    desc: "Diseño y perfilado de cejas, extensiones de pestañas y técnicas de embellecimiento para resaltar tu mirada.",
    benefits: ["Mirada impactante", "Diseño personalizado", "Larga duración", "Técnicas avanzadas"],
  },
];

const TESTIMONIOS = [
  { name: "María C.", text: "Llevo 3 sesiones de maderoterapia y ya se notan los resultados. El trato es increíble, muy profesional.", stars: 5 },
  { name: "Laura G.", text: "Me hice el plasma facial y mi piel cambió completamente. Se ve más luminosa y las arrugas disminuyeron mucho.", stars: 5 },
  { name: "Andrea P.", text: "Los masajes relajantes son lo mejor después de una semana pesada. Siempre salgo renovada. 100% recomendado.", stars: 5 },
  { name: "Carolina M.", text: "Excelente servicio de inyectología a domicilio. Muy puntual y profesional. Mi mamá quedó encantada.", stars: 5 },
];

const PASOS = [
  { num: "1", title: "Escríbenos", desc: "Cuéntanos qué necesitas por WhatsApp o agenda en línea", icon: "💬" },
  { num: "2", title: "Asesoría gratis", desc: "Te orientamos sobre el mejor tratamiento para tus objetivos", icon: "🎯" },
  { num: "3", title: "Tu sesión", desc: "Disfruta tu sesión en un ambiente relajado y profesional", icon: "✨" },
  { num: "4", title: "Resultados", desc: "Ve los cambios y continúa tu plan de bienestar personalizado", icon: "🌟" },
];

/* ───── Component ───── */
export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-pattern">
      {/* WhatsApp floating */}
      <a href={WHATSAPP} target="_blank" rel="noopener"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110"
        style={{ boxShadow: "0 4px 20px rgba(37,211,102,0.4)" }}>
        <svg viewBox="0 0 32 32" width="32" height="32" fill="white">
          <path d="M16 3C8.832 3 3 8.832 3 16c0 2.295.6 4.508 1.738 6.465L3 29l6.727-1.707A12.94 12.94 0 0016 29c7.168 0 13-5.832 13-13S23.168 3 16 3zm0 23.5c-2.07 0-4.047-.547-5.785-1.578l-.414-.246-4.293 1.09 1.113-4.18-.27-.427A10.46 10.46 0 014.5 16C4.5 9.66 9.66 4.5 16 4.5S27.5 9.66 27.5 16 22.34 26.5 16 26.5zm5.793-7.883c-.316-.16-1.871-.926-2.16-1.031-.29-.106-.5-.16-.711.16-.211.316-.816 1.031-.996 1.242-.184.21-.367.237-.683.078-.316-.16-1.332-.492-2.54-1.566-.937-.836-1.57-1.867-1.754-2.184-.184-.316-.02-.488.137-.645.14-.14.316-.368.473-.551.16-.184.211-.316.316-.527.106-.211.054-.395-.027-.551-.078-.16-.71-1.715-.973-2.348-.258-.617-.519-.535-.71-.543-.184-.008-.395-.01-.606-.01s-.551.078-.84.394c-.289.317-1.102 1.078-1.102 2.633s1.13 3.055 1.289 3.266c.16.21 2.219 3.39 5.379 4.754.75.324 1.336.519 1.793.664.754.238 1.44.207 1.98.125.605-.09 1.872-.766 2.137-1.504.266-.739.266-1.371.184-1.504-.078-.133-.29-.211-.605-.371z"/>
        </svg>
      </a>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-40 bg-cream-50/90 backdrop-blur-xl border-b border-gold-200/30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="AURA" width={44} height={44} className="rounded-full" />
            <div>
              <span className="text-lg font-display font-bold text-emerald-700">AURA</span>
              <span className="hidden sm:block text-[10px] text-gold-600 -mt-1 tracking-wider">BIENESTAR ESTÉTICO</span>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-sm text-emerald-800/70 hover:text-emerald-700 transition font-medium">Servicios</a>
            <a href="#proceso" className="text-sm text-emerald-800/70 hover:text-emerald-700 transition font-medium">Cómo funciona</a>
            <a href="#testimonios" className="text-sm text-emerald-800/70 hover:text-emerald-700 transition font-medium">Testimonios</a>
            <a href={WHATSAPP} target="_blank" rel="noopener" className="btn-gold px-5 py-2 rounded-full text-sm font-semibold">
              Agendar Cita
            </a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-emerald-700 text-2xl">☰</button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-cream-50/95 border-t border-gold-200/30 px-6 py-4 space-y-3">
            <a href="#servicios" onClick={() => setMenuOpen(false)} className="block text-emerald-800">Servicios</a>
            <a href="#proceso" onClick={() => setMenuOpen(false)} className="block text-emerald-800">Cómo funciona</a>
            <a href="#testimonios" onClick={() => setMenuOpen(false)} className="block text-emerald-800">Testimonios</a>
            <a href={WHATSAPP} onClick={() => setMenuOpen(false)} className="block text-gold-600 font-semibold">Agendar Cita</a>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-0 w-96 h-96 bg-gold-300/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-0 w-80 h-80 bg-emerald-400/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-6 border border-emerald-200/50">
              ✨ Tu bienestar, nuestra pasión
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-tight mb-6">
              Transforma tu
              <br />
              <span className="text-gradient">cuerpo y belleza</span>
            </h1>
            <p className="text-lg text-emerald-800/60 max-w-lg mb-8 leading-relaxed">
              Maderoterapia, masajes, mesoterapia, plasma y más. 
              Servicios profesionales de bienestar estético con resultados reales y atención personalizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={WHATSAPP} target="_blank" rel="noopener"
                className="btn-gold px-8 py-4 rounded-full font-bold text-lg text-center inline-flex items-center justify-center gap-2">
                📱 Agendar por WhatsApp
              </a>
              <a href="#servicios"
                className="px-8 py-4 border-2 border-emerald-200 hover:border-gold-400 rounded-full font-bold text-lg text-emerald-700 hover:text-gold-600 transition text-center">
                Ver servicios →
              </a>
            </div>

            <div className="flex items-center gap-6 mt-10">
              <div className="flex -space-x-2">
                {["😊", "🥰", "😍", "🤩"].map((e, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-cream-200 border-2 border-white flex items-center justify-center text-lg">{e}</div>
                ))}
              </div>
              <div>
                <div className="flex text-gold-500 text-sm">★★★★★</div>
                <p className="text-sm text-emerald-800/50">+200 clientas satisfechas</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden md:flex justify-center"
          >
            <div className="relative">
              <div className="w-80 h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-4 border-gold-200/50 shadow-2xl">
                <Image src="/logo.jpg" alt="AURA Bienestar Estético" width={400} height={400} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-5 py-3 shadow-lg border border-cream-300">
                <span className="text-2xl">🪵</span>
                <p className="text-sm font-semibold text-emerald-700">Maderoterapia</p>
                <p className="text-xs text-gold-600">Resultados desde la 1° sesión</p>
              </div>
              <div className="absolute -top-2 -right-2 bg-white rounded-2xl px-5 py-3 shadow-lg border border-cream-300">
                <span className="text-2xl">✨</span>
                <p className="text-sm font-semibold text-emerald-700">Plasma</p>
                <p className="text-xs text-gold-600">Rejuvenece naturalmente</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 px-6 bg-emerald-700">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { num: "+200", label: "Clientas felices" },
            { num: "8", label: "Servicios especializados" },
            { num: "+5", label: "Años de experiencia" },
            { num: "100%", label: "Satisfacción" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-display font-bold text-gold-300">{s.num}</div>
              <div className="text-sm text-emerald-100 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Servicios ── */}
      <section id="servicios" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-gold-600 text-sm font-semibold tracking-widest uppercase">Nuestros servicios</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-emerald-800">
              Todo para tu <span className="text-gradient">bienestar</span>
            </h2>
            <p className="text-emerald-800/50 mt-4 max-w-xl mx-auto">Cada tratamiento está diseñado para darte resultados reales con un trato personalizado y profesional.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICIOS.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card-service rounded-2xl p-6 cursor-pointer"
                onClick={() => setActiveService(activeService === i ? null : i)}
              >
                <span className="text-4xl block mb-3">{s.icon}</span>
                <h3 className="text-lg font-bold text-emerald-800 mb-2">{s.name}</h3>
                <p className="text-sm text-emerald-800/50 leading-relaxed mb-4">{s.desc}</p>
                
                {activeService === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <div className="border-t border-cream-300 pt-3 mb-4">
                      <p className="text-xs font-semibold text-gold-600 mb-2">Beneficios:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {s.benefits.map((b) => (
                          <span key={b} className="text-[11px] px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">{b}</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <a href={WHATSAPP} target="_blank" rel="noopener"
                  className="inline-block text-sm font-semibold text-gold-600 hover:text-gold-700 transition">
                  Agendar →
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="proceso" className="py-24 px-6 bg-emerald-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-gold-600 text-sm font-semibold tracking-widest uppercase">Proceso</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-emerald-800">
              Así de <span className="text-gradient">fácil</span> es
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {PASOS.map((p, i) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gold-100 border-2 border-gold-300/50 flex items-center justify-center text-2xl mb-4">
                  {p.icon}
                </div>
                <div className="text-xs text-gold-600 font-bold mb-1">PASO {p.num}</div>
                <h3 className="font-bold text-emerald-800 text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-emerald-800/50">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonios ── */}
      <section id="testimonios" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-gold-600 text-sm font-semibold tracking-widest uppercase">Testimonios</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 text-emerald-800">
              Lo que dicen nuestras <span className="text-gradient">clientas</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIOS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-cream-300 shadow-sm"
              >
                <div className="flex text-gold-500 text-sm mb-3">{"★".repeat(t.stars)}</div>
                <p className="text-sm text-emerald-800/70 leading-relaxed mb-4 italic">"{t.text}"</p>
                <p className="text-sm font-bold text-emerald-700">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Tu transformación empieza <span className="text-gold-300">hoy</span>
          </h2>
          <p className="text-emerald-100 text-lg mb-10 max-w-xl mx-auto">
            Agenda tu primera cita y descubre por qué más de 200 clientas confían en AURA para su bienestar.
          </p>
          <a href={WHATSAPP} target="_blank" rel="noopener"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white hover:bg-cream-100 rounded-full font-bold text-lg text-emerald-700 transition shadow-xl">
            📱 Agendar por WhatsApp
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 bg-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="AURA" width={36} height={36} className="rounded-full" />
            <div>
              <span className="font-display font-bold text-white">AURA</span>
              <span className="block text-[10px] text-emerald-300 tracking-wider">BIENESTAR ESTÉTICO</span>
            </div>
          </div>
          <p className="text-emerald-300 text-sm text-center">
            Maderoterapia · Masajes · Mesoterapia · Inyectología · Plasma · Cejas & Pestañas
          </p>
          <div className="flex gap-4">
            <a href={WHATSAPP} target="_blank" rel="noopener" className="text-emerald-300 hover:text-gold-300 text-sm transition">WhatsApp</a>
            <a href="#servicios" className="text-emerald-300 hover:text-gold-300 text-sm transition">Servicios</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-emerald-700 text-center">
          <p className="text-emerald-400 text-xs">© {new Date().getFullYear()} AURA Bienestar Estético. Todos los derechos reservados.</p>
          <p className="text-emerald-500 text-[10px] mt-1">Powered by <a href="https://ainovax.vercel.app" target="_blank" rel="noopener" className="text-gold-400 hover:text-gold-300">AINovaX</a></p>
        </div>
      </footer>
    </div>
  );
}
