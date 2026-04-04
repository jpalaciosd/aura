"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  text: string;
}

/* ───── AI ───── */
async function getAIResponse(messages: Message[]): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    return data.text;
  } catch {
    return "Disculpa, tuve un problema técnico. 😅 Escríbenos por WhatsApp al +57 312 820 0996 y te atendemos de inmediato.";
  }
}

/* ───── TTS ───── */
let currentAudio: HTMLAudioElement | null = null;

async function speak(text: string, onEnd: () => void) {
  if (typeof window === "undefined") { onEnd(); return; }
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (window.speechSynthesis) window.speechSynthesis.cancel();

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;
      audio.onended = () => { URL.revokeObjectURL(url); currentAudio = null; onEnd(); };
      audio.onerror = () => { URL.revokeObjectURL(url); currentAudio = null; onEnd(); };
      audio.play().catch(() => onEnd());
      return;
    }
  } catch { /* fall through */ }

  // Fallback browser TTS
  if (!window.speechSynthesis) { onEnd(); return; }
  const clean = text.replace(/\*\*/g, "").replace(/[^\w\sáéíóúñ¿¡.,;:!?()-]/g, "");
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "es-CO"; u.rate = 1.05; u.pitch = 1.1;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang.startsWith("es") && v.name.toLowerCase().includes("female")) || voices.find(v => v.lang.startsWith("es-"));
  if (v) u.voice = v;
  u.onend = onEnd; u.onerror = onEnd;
  window.speechSynthesis.speak(u);
}

/* ───── Quick Actions ───── */
const QUICK = [
  "¿Qué servicios tienen?",
  "Maderoterapia",
  "Quiero agendar",
  "Precios",
];

/* ───── Component ───── */
export default function AuraChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "¡Hola! 🌿 Soy Aura, tu asistente de bienestar. Cuéntame, ¿qué tratamiento te interesa o en qué puedo ayudarte?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const send = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || typing) return;
    setInput("");
    const newMsgs: Message[] = [...messages, { role: "user", text: msg }];
    setMessages(newMsgs);
    setTyping(true);

    const reply = await getAIResponse(newMsgs);
    setMessages(m => [...m, { role: "assistant", text: reply }]);
    setTyping(false);

    if (voiceOn) {
      setSpeaking(true);
      speak(reply, () => setSpeaking(false));
    }
  }, [input, typing, messages, voiceOn]);

  const stopSpeaking = () => {
    if (typeof window !== "undefined") {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    }
    setSpeaking(false);
  };

  return (
    <>
      {/* Bubble — replaces WhatsApp button position */}
      <motion.button
        onClick={() => { setOpen(!open); if (speaking) stopSpeaking(); }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all"
        style={{
          background: "linear-gradient(135deg, #065f46, #047857)",
          boxShadow: "0 0 30px rgba(4,120,87,0.4)",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? (
          <span className="text-2xl text-white">✕</span>
        ) : (
          <div className="relative">
            <span className="text-3xl">🌿</span>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold-400 rounded-full border-2 border-emerald-700 animate-pulse" />
          </div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] rounded-2xl shadow-2xl overflow-hidden border border-emerald-200/30"
            style={{ background: "#faf8f2" }}
          >
            {/* Header */}
            <div className="px-5 py-3 flex items-center gap-3 border-b border-emerald-100" style={{ background: "linear-gradient(135deg, #065f46, #047857)" }}>
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-xl border-2 border-gold-300/50">
                🌿
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-white">Aura</div>
                <div className="text-[11px] text-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  {speaking ? "Hablando..." : typing ? "Escribiendo..." : "En línea"}
                </div>
              </div>
              <button
                onClick={() => { setVoiceOn(!voiceOn); if (speaking) stopSpeaking(); }}
                className={`text-sm p-1.5 rounded-lg transition ${voiceOn ? "text-gold-300 bg-white/10" : "text-emerald-300/50"}`}
                title={voiceOn ? "Silenciar voz" : "Activar voz"}
              >
                {voiceOn ? "🔊" : "🔇"}
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 mr-2 mt-1 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-xs">🌿</div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-emerald-700 text-white rounded-br-md"
                        : "bg-white text-emerald-900 rounded-bl-md border border-emerald-100 shadow-sm"
                    }`}
                  >
                    {msg.text.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                      j % 2 === 1 ? <strong key={j} className="text-emerald-700">{part}</strong> : part
                    )}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 mr-2 mt-1 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center text-xs">🌿</div>
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-emerald-100 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-[11px] px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/50 hover:bg-emerald-100 transition"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-emerald-100 flex gap-2 bg-white/50">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder="Escribe tu pregunta..."
                className="flex-1 bg-white border border-emerald-200/50 rounded-xl px-4 py-2.5 text-sm text-emerald-900 placeholder-emerald-400/50 focus:border-emerald-400 focus:outline-none transition"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40 text-white"
                style={{ background: "linear-gradient(135deg, #065f46, #047857)" }}
              >
                →
              </button>
            </div>

            {/* WhatsApp link */}
            <div className="px-4 pb-3 text-center">
              <a
                href="https://wa.me/573128200996?text=Hola%20AURA%2C%20quiero%20agendar%20una%20cita"
                target="_blank"
                rel="noopener"
                className="text-[11px] text-emerald-600 hover:text-emerald-700 transition"
              >
                📱 ¿Prefieres WhatsApp? Escríbenos directo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
