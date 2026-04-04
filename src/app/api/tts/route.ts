import { NextRequest, NextResponse } from "next/server";

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY || "";
const VOICE_ID = "cgSgspJ2msm6clMCkdW9"; // Jessica - multilingual
const MODEL = "eleven_multilingual_v2";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || !ELEVENLABS_KEY) return NextResponse.json({ error: "Missing config" }, { status: 400 });

    const clean = text.replace(/\*\*/g, "").replace(/[🪵💆‍♀️🧘‍♀️💉🏥✨🌟👁️💬🎯😊😏💪🚀📱🤔💇‍♀️🌿🧖‍♀️]/g, "").replace(/\n+/g, ". ").replace(/•/g, ",").trim().slice(0, 500);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: clean,
        model_id: MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
      }),
    });

    if (!response.ok) return NextResponse.json({ error: "TTS failed" }, { status: response.status });

    return new NextResponse(await response.arrayBuffer(), {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
