import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

export type ParsedEvent = {
  eventName: string | null;
  date: string | null;
  venue: string | null;
  price: string | null;
  city: string | null;
  artistCount: number | null;
  hasArtistPhoto: boolean;
  mode: "normal" | "logos_only" | "no_photo";
  missingFields: Array<"eventName" | "date" | "venue" | "price">;
};

type AnthropicMessage = {
  content: Array<{ type: string; text: string }>;
};

export async function POST(req: NextRequest) {
  try {
    // ─── AUTH + RATE LIMIT (V8) ─────────────────────────────────────────
    // Llama a Anthropic Claude → coste por tokens. Protegemos contra abuso.
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion" }, { status: 401 });
    }
    const limitRes = await checkRateLimit(supabase, user.id, "parse-prompt");
    if (limitRes) return limitRes;

    const { prompt } = await req.json() as { prompt: string };
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Falta el prompt" }, { status: 400 });
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(getFallback());
    }
    const systemPrompt = `Eres un extractor de información de eventos para un generador de flyers.
Analiza el texto del usuario y extrae información sobre el evento.
Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin backticks.

El JSON debe tener exactamente esta estructura:
{
  "eventName": "nombre del evento o null",
  "date": "fecha/hora o null",
  "venue": "lugar/sala o null",
  "price": "precio/entrada o null",
  "city": "ciudad o null",
  "artistCount": número de artistas mencionados o null,
  "mode": "normal" | "logos_only" | "no_photo"
}

Reglas:
- mode="logos_only" si menciona "solo logos", "sin foto", "sin artista", "solo marcas"
- mode="no_photo" si menciona "sin foto del artista" pero quiere imagen de fondo
- mode="normal" en cualquier otro caso
- artistCount: si dice "2 artistas" devuelve 2, "5 djs" devuelve 5, un artista devuelve 1
- Si no puedes extraer un campo con certeza, usa null`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.warn("[parse-prompt] Anthropic error:", response.status);
      return NextResponse.json(getFallback());
    }

    const data = await response.json() as AnthropicMessage;
    const text = data.content?.[0]?.text?.trim() ?? "";

    let parsed: Partial<ParsedEvent> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("[parse-prompt] JSON parse error, raw:", text);
      return NextResponse.json(getFallback());
    }

    const missingFields: ParsedEvent["missingFields"] = [];
    if (!parsed.eventName) missingFields.push("eventName");
    if (!parsed.date) missingFields.push("date");
    if (!parsed.venue) missingFields.push("venue");
    if (!parsed.price) missingFields.push("price");

    const result: ParsedEvent = {
      eventName: parsed.eventName ?? null,
      date: parsed.date ?? null,
      venue: parsed.venue ?? null,
      price: parsed.price ?? null,
      city: parsed.city ?? null,
      artistCount: parsed.artistCount ?? null,
      hasArtistPhoto: false,
      mode: parsed.mode ?? "normal",
      missingFields,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[parse-prompt] error:", err);
    return NextResponse.json(getFallback());
  }
}

function getFallback(): ParsedEvent {
  return {
    eventName: null,
    date: null,
    venue: null,
    price: null,
    city: null,
    artistCount: null,
    hasArtistPhoto: false,
    mode: "normal",
    missingFields: ["eventName", "date", "venue", "price"],
  };
}
