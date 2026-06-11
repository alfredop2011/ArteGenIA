import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/remix — Genera un "estilo Remix" usando Claude Haiku.
 *
 * Devuelve una paleta + fuente + nombre/mood para aplicar al flyer.
 * Pensado para el botón "Sorpréndeme con IA" del sheet Remix.
 *
 * El modelo recibe categoría + título + estilo opcional pedido por el
 * usuario y devuelve JSON estrictamente formado para reducir errores.
 *
 * Auth + rate-limit aplicados — Anthropic se paga por tokens.
 */

export type AIRemix = {
  name: string;
  mood: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
  };
  primaryFont: string;
};

type AnthropicMessage = {
  content: Array<{ type: string; text: string }>;
};

// Fuentes disponibles en el editor — el modelo DEBE elegir una de estas
const ALLOWED_FONTS = [
  "Anton",
  "Bebas Neue",
  "Playfair Display",
  "Cormorant Garamond",
  "Montserrat",
  "Inter",
  "Oswald",
  "Roboto Condensed",
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion" }, { status: 401 });
    }
    const limitRes = await checkRateLimit(supabase, user.id, "remix-ai");
    if (limitRes) return limitRes;

    const body = await req.json() as {
      category?: string;
      title?: string;
      mood?: string;
    };
    const category = (body.category ?? "evento").slice(0, 50);
    const title = (body.title ?? "").slice(0, 80);
    const mood = (body.mood ?? "").slice(0, 50);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(getFallback(), { status: 200 });
    }

    const systemPrompt = `Eres un director de arte experto en diseño de flyers para eventos.
Tu tarea: generar UN estilo visual completo (paleta + tipografía + mood) para un flyer.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown, sin backticks.

Estructura EXACTA:
{
  "name": "nombre del estilo (max 18 chars, ej: 'Neón Tropical', 'Brutal Oscuro')",
  "mood": "descripción del mood (max 60 chars)",
  "palette": {
    "primary":   "#hex (color principal - títulos)",
    "secondary": "#hex (color secundario - subtítulos)",
    "accent":    "#hex (color acento - precio/CTA/destacados)",
    "dark":      "#hex (color de fondo - oscuro o claro)"
  },
  "primaryFont": "una fuente EXACTA de esta lista: ${ALLOWED_FONTS.join(", ")}"
}

Reglas:
- Los 4 colores deben combinar BIEN entre sí (contraste, armonía)
- primary debe contrastar con dark (legibilidad de títulos)
- accent debe ser un color que destaque visualmente (más saturado)
- Para eventos nocturnos/club/electrónica usa colores neón vibrantes sobre dark
- Para eventos elegantes/gala usa paletas sobrias con dorados o joya
- Para eventos diurnos/festivales usa colores cálidos y luminosos
- NO repitas las paletas obvias (no siempre morado+fucsia)
- Sé CREATIVO pero coherente con el contexto`;

    const userPrompt = `Genera un estilo para un flyer:
- Categoría: ${category}
- Título: ${title || "(sin título)"}
${mood ? `- Mood deseado: ${mood}` : "- Mood: sorpréndeme, algo original"}

Recuerda: solo el JSON.`;

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
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.warn("[remix] Anthropic error:", response.status);
      return NextResponse.json(getFallback(), { status: 200 });
    }

    const data = await response.json() as AnthropicMessage;
    const text = data.content?.[0]?.text?.trim() ?? "";

    let parsed: Partial<AIRemix> = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("[remix] JSON parse error, raw:", text);
      return NextResponse.json(getFallback(), { status: 200 });
    }

    // Validación + normalizado
    const hex = (s: unknown, fb: string): string => {
      const v = typeof s === "string" ? s.trim() : "";
      return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fb;
    };
    const font = ALLOWED_FONTS.includes(parsed.primaryFont ?? "")
      ? (parsed.primaryFont as string)
      : "Anton";

    const result: AIRemix = {
      name: (parsed.name ?? "Estilo IA").toString().slice(0, 18),
      mood: (parsed.mood ?? "").toString().slice(0, 60),
      palette: {
        primary:   hex(parsed.palette?.primary,   "#a855f7"),
        secondary: hex(parsed.palette?.secondary, "#ec4899"),
        accent:    hex(parsed.palette?.accent,    "#facc15"),
        dark:      hex(parsed.palette?.dark,      "#0a0a14"),
      },
      primaryFont: font,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[remix] error:", err);
    return NextResponse.json(getFallback(), { status: 200 });
  }
}

/** Fallback si Anthropic no responde — paleta neutra para no romper UX. */
function getFallback(): AIRemix {
  return {
    name: "Sorpresa",
    mood: "Vibrante y contemporáneo",
    palette: {
      primary: "#fbbf24",
      secondary: "#f472b6",
      accent: "#22d3ee",
      dark: "#1e0a26",
    },
    primaryFont: "Bebas Neue",
  };
}
