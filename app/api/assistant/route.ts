import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/assistant — Asistente IA chat → flyer.
 *
 * Recibe un prompt en lenguaje natural ("clase bachata sábado 22 nov, 70€,
 * Studio Kiz, Madrid") + la lista de bloques editables del template y
 * devuelve un map { blockId → texto sugerido } generado por Claude Haiku.
 *
 * Pensado para el botón "Asistente IA" del editor mobile. Reduce
 * tiempo-a-primer-flyer de minutos a segundos.
 */

type BlockHint = {
  id: string;
  label: string;
  /** Texto actual o placeholder — el LLM lo respeta como ejemplo de formato */
  current?: string;
};

type Body = {
  prompt: string;
  blocks: BlockHint[];
  category?: string;
};

type AnthropicMessage = {
  content: Array<{ type: string; text: string }>;
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion" }, { status: 401 });
    }
    const limitRes = await checkRateLimit(supabase, user.id, "assistant-ai");
    if (limitRes) return limitRes;

    const body = (await req.json()) as Body;
    const prompt = (body.prompt ?? "").trim().slice(0, 2000);
    const blocks = Array.isArray(body.blocks) ? body.blocks.slice(0, 30) : [];
    const category = (body.category ?? "evento").slice(0, 50);

    if (!prompt || blocks.length === 0) {
      return NextResponse.json({ error: "Falta prompt o bloques" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(getFallback(blocks), { status: 200 });
    }

    const blocksList = blocks.map(b =>
      `  - "${b.id}" (${b.label})${b.current ? ` — ejemplo: "${b.current}"` : ""}`
    ).join("\n");

    const systemPrompt = `Eres un asistente que rellena los campos de un flyer profesional.
El usuario te describe un evento en lenguaje natural. Tu tarea: extraer los datos y mapearlos a los campos disponibles del template.

Responde ÚNICAMENTE con JSON válido, sin texto adicional, sin markdown, sin backticks.

Estructura de respuesta:
{
  "values": { "block_id_1": "texto rellenado", "block_id_2": "otro texto", ... },
  "missing": ["block_id_x", "block_id_y"]
}

Reglas:
- "values": incluye TODOS los blockIds proporcionados.
- Respeta el FORMATO del ejemplo cuando exista (MAYÚSCULAS si el ejemplo está en mayúsculas, "22 NOV" para fechas, "70€" para precios, etc.)
- CLAVE — no inventes datos reales: si el usuario NO menciona un campo (precio, fecha, hora, lugar, contacto...), NO te inventes un valor falso. En "values" deja el ejemplo/placeholder original de ese campo, y añade su blockId a "missing".
- "missing": lista de los blockIds para los que el usuario NO dio información real (los que quedaron con placeholder). Sirve para que la app se los pida al usuario. Si el usuario lo dio todo, devuelve "missing": [].
- Mantén los textos CORTOS y para flyer (sin frases largas).
- Si hay campos como "footer-cta", "footer-where" — pon info de contacto/reserva SOLO si la tienes; si no, déjala como placeholder y márcala en "missing".
- Para fechas separadas en día/mes/año/horario, REPARTE bien la info.
- Si el evento es "clase de baile", el "título" debe ser el estilo (ej: "Salsa", "Bachata").`;

    const userPrompt = `Bloques disponibles del template (categoría: ${category}):
${blocksList}

Descripción del evento:
"${prompt}"

Recuerda: SOLO el JSON con "values" y "missing". No inventes datos que el usuario no te dio.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.warn("[assistant] Anthropic error:", response.status);
      return NextResponse.json(getFallback(blocks), { status: 200 });
    }

    const data = await response.json() as AnthropicMessage;
    const text = data.content?.[0]?.text?.trim() ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn("[assistant] JSON parse error, raw:", text);
      return NextResponse.json(getFallback(blocks), { status: 200 });
    }

    // Compat: acepta el formato nuevo { values, missing } o el legacy
    // (mapa plano blockId → texto, sin missing).
    const rawValues: Record<string, unknown> =
      parsed && typeof parsed.values === "object" && parsed.values
        ? parsed.values
        : parsed;
    const rawMissing: unknown[] = Array.isArray(parsed?.missing) ? parsed.missing : [];

    // Sanitizar: solo blockIds válidos, strings de máx 200 chars
    const valid: Record<string, string> = {};
    const validIds = new Set(blocks.map(b => b.id));
    for (const [k, v] of Object.entries(rawValues)) {
      if (!validIds.has(k)) continue;
      if (typeof v !== "string") continue;
      valid[k] = v.slice(0, 200);
    }
    // Campos que el usuario no proporcionó → la app se los pedirá.
    const missing = rawMissing
      .filter((id): id is string => typeof id === "string" && validIds.has(id))
      .slice(0, 30);

    return NextResponse.json({ values: valid, missing });
  } catch (err) {
    console.error("[assistant] error:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Fallback si Anthropic no responde — devuelve placeholders genéricos. */
function getFallback(blocks: BlockHint[]) {
  const values: Record<string, string> = {};
  blocks.forEach(b => { values[b.id] = b.current ?? ""; });
  return { values };
}
