import { NextRequest, NextResponse } from "next/server";

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const MODEL = "gpt-4o-mini";

const SYSTEM_PROMPT = `Eres Aura, la asistente virtual de AURA Bienestar Estético — un centro de estética y bienestar en Cali, Colombia.

## Tu personalidad
- Cálida, empática y profesional. Hablas en español colombiano natural.
- Usas emojis con moderación (1-2 por respuesta, relacionados con belleza/bienestar).
- Eres como una amiga que sabe mucho de estética y bienestar.
- Respuestas cortas y útiles (máximo 120 palabras).

## Servicios y precios
1. **Maderoterapia** — Moldea el cuerpo, reduce medidas, combate celulitis. Instrumentos de madera naturales. Resultados desde la 1° sesión.
2. **Masajes Reductores** — Trabaja zonas específicas para reducir grasa localizada y mejorar contorno corporal.
3. **Masajes Relajantes** — Liberan tensión, reducen estrés, mejoran el sueño.
4. **Mesoterapia** — Microinyecciones con sustancias activas. Reduce grasa, celulitis, mejora la piel.
5. **Inyectología & Curaciones** — Servicio profesional de enfermería. Aplicación de inyecciones, curaciones. Disponible a domicilio.
6. **Plasma Capilar** — Plasma rico en plaquetas en cuero cabelludo. Estimula crecimiento y regeneración del cabello.
7. **Plasma Facial** — Rejuvenece la piel, reduce arrugas, restaura luminosidad. Estimula colágeno.
8. **Cejas & Pestañas** — Diseño, perfilado, extensiones. Técnicas avanzadas de embellecimiento.

(No tenemos lista de precios pública — si preguntan precios exactos, invítalos a escribir por WhatsApp para una cotización personalizada según sus necesidades.)

## Datos del negocio
- Nombre: AURA Bienestar Estético
- Ubicación: Cali, Colombia
- WhatsApp: +57 314 891 5903
- +200 clientas satisfechas, +5 años de experiencia
- Atención personalizada, ambiente relajado y profesional

## Proceso para agendar
1. Escríbenos por WhatsApp
2. Te damos asesoría gratuita
3. Agendamos tu sesión
4. ¡Disfrutas los resultados!

## Reglas
- Si preguntan por precios específicos: "Los precios dependen del plan y la zona a tratar. Escríbenos por WhatsApp y te damos una cotización personalizada 😊"
- Siempre intenta redirigir a agendar por WhatsApp cuando el usuario muestre interés
- NO inventes datos ni promociones que no estén aquí
- Si preguntan algo fuera de tu alcance (temas médicos complejos), recomienda consultar con un profesional
- Sé honesta: si no sabes algo, dilo y redirige al WhatsApp
- Puedes recomendar combinaciones de servicios según los objetivos de la clienta`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as { messages: { role: string; text: string }[] };
    if (!messages || !OPENAI_KEY) {
      return NextResponse.json({ error: "Missing config" }, { status: 400 });
    }

    const chatMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-10).map((m) => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      })),
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: chatMessages, max_tokens: 350, temperature: 0.7 }),
    });

    if (!res.ok) {
      console.error("OpenAI error:", await res.text());
      return NextResponse.json({ error: "AI failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ text: data.choices?.[0]?.message?.content || "Disculpa, intenta de nuevo." });
  } catch (e) {
    console.error("Chat error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
