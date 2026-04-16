import OpenAI from "openai";
import type { ReceiptAiData } from "./types";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Eres un sistema OCR especializado en comprobantes de pago colombianos: Nequi, Bre-B (llaves), Nequi Negocios, Bancolombia, Daviplata, transferencias PSE.
Extrae con precisión los siguientes campos del comprobante en la imagen y devuélvelos como JSON válido:

- monto: número entero en pesos colombianos (sin separadores ni símbolo, ej: 80000).
- titular: nombre completo del RECEPTOR del pago. Si aparece combinado con el nombre del negocio, devuélvelo completo.
- last4: últimos 4 dígitos del identificador del receptor (llave Bre-B, celular Nequi, cuenta). Solo dígitos. No uses el del emisor.
- fecha: fecha y hora del pago en ISO-8601 con zona -05:00 (ej: "2026-04-16T12:32:00-05:00"). Si solo hay fecha: "T00:00:00-05:00".
- referencia: número de comprobante / referencia / ID de la transacción.
- confianza: 0 a 1 según qué tan claro y legible es el comprobante.
- motivos_duda: array de strings con cualquier ambigüedad.

REGLAS:
- Si un campo no es determinable, omítelo. NUNCA inventes.
- Si la imagen no es un comprobante de pago, devuelve confianza 0 y explica en motivos_duda.

Responde SOLO con el JSON, sin texto adicional.`;

export async function extractReceipt(imageUrl: string): Promise<ReceiptAiData> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Extrae los datos del comprobante:" },
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
        ],
      },
    ],
    max_tokens: 500,
    temperature: 0,
  });

  const raw = response.choices[0]?.message?.content || "{}";
  let parsed: Partial<ReceiptAiData> & { motivosDuda?: string[] } = {};
  try { parsed = JSON.parse(raw); } catch {
    return { confianza: 0, motivos_duda: ["No se pudo parsear respuesta de IA"] };
  }

  return {
    monto: typeof parsed.monto === "number" ? parsed.monto : undefined,
    titular: typeof parsed.titular === "string" ? parsed.titular : undefined,
    last4: typeof parsed.last4 === "string" ? parsed.last4.replace(/\D/g, "").slice(-4) : undefined,
    fecha: typeof parsed.fecha === "string" ? parsed.fecha : undefined,
    referencia: typeof parsed.referencia === "string" ? parsed.referencia : undefined,
    confianza: typeof parsed.confianza === "number" ? Math.max(0, Math.min(1, parsed.confianza)) : 0,
    motivos_duda: Array.isArray(parsed.motivos_duda) ? parsed.motivos_duda : (Array.isArray(parsed.motivosDuda) ? parsed.motivosDuda : undefined),
  };
}
