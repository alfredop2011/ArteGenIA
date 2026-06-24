import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { consumeCredits } from "@/lib/credits";

/**
 * POST /api/auto-fill-template
 *
 * Recibe el texto libre del usuario (típicamente copiado de ChatGPT con
 * la info del evento) + el ID del proyecto. Lee las capas de texto del
 * fabric_json, pide a Claude Sonnet 4.6 que mapee cada dato a su capa
 * correspondiente, y devuelve un mapping { customId: nuevo_texto }.
 *
 * El frontend itera el mapping y aplica .set('text', ...) a cada layer.
 * El estilo (color, fuente, tamaño, posición) NO se toca — solo el texto.
 *
 * Body: { project_id: string, user_text: string }
 * Response: { mapping: Record<string, string>, used_credits: number }
 *
 * Coste: 2 créditos (CREDIT_COST.rellenar_plantilla). Cobra ANTES de
 * llamar a Claude. Si Claude falla, hace refund automático.
 */

const MODEL = "claude-sonnet-4-6";
const MAX_INPUT_CHARS = 8000;

type TextLayer = {
    customId: string;
    text: string;
    role?: string;
    fontSize?: number;
};

/**
 * Construye un prompt compacto que le da a Claude:
 *  1. La lista de capas de texto de la plantilla (id + texto actual + tamaño)
 *  2. El texto del usuario
 *  3. Instrucciones para mapear
 *
 * El fontSize sirve para inferir jerarquía: 80px = título, 14px = body.
 */
function buildPrompt(layers: TextLayer[], userText: string): string {
    const layersDescr = layers
        .map(l => `- customId="${l.customId}" (${l.fontSize ?? "?"}px): "${l.text}"`)
        .join("\n");

    return `Eres un asistente que rellena plantillas de flyers. Te paso:

1) LAS CAPAS DE TEXTO DE LA PLANTILLA (con su id, tamaño y texto actual):
${layersDescr}

2) EL TEXTO DEL USUARIO con la info de su evento (puede venir en cualquier formato — bullets, párrafo, lista, etc.):
"""
${userText}
"""

TAREA: Para cada capa, decide qué texto del usuario debería ir ahí, MANTENIENDO el formato/longitud aproximado del texto original (si la capa decía "BOOTCAMP" en mayúsculas, devuelve el reemplazo en mayúsculas; si decía "del 25 al 26 de octubre", mantén formato fecha similar).

REGLAS ESTRICTAS:
- Capas con fontSize ≥ 60 son TÍTULOS (palabras cortas, mayúsculas)
- Capas con fontSize 30-60 son SUBTÍTULOS o destacados
- Capas con fontSize ≤ 25 son detalles (fechas, lugares, precios, programa)
- Si una capa NO tiene equivalente claro en el texto del usuario, DEVUELVE EL TEXTO ORIGINAL sin cambio (no inventes datos)
- Si el texto del usuario tiene info que cabe en varias capas relacionadas (ej. programa con varios horarios), distribúyela mejor posible
- NO cambies emojis ni símbolos decorativos que ya estaban (ej. "•", "·", "→")

DEVUELVE SOLO JSON VÁLIDO con este shape exacto:
{
  "mapping": {
    "customId-1": "nuevo texto",
    "customId-2": "nuevo texto",
    ...
  }
}

No expliques nada, solo el JSON. Incluye TODAS las capas (las que no cambien, mismo texto que el actual).`;
}

export async function POST(req: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json().catch(() => null) as {
        project_id?: string;
        user_text?: string;
    } | null;

    if (!body || typeof body.project_id !== "string" || typeof body.user_text !== "string") {
        return NextResponse.json({ error: "Falta project_id o user_text" }, { status: 400 });
    }
    const userText = body.user_text.trim();
    if (userText.length === 0) {
        return NextResponse.json({ error: "El texto está vacío" }, { status: 400 });
    }
    if (userText.length > MAX_INPUT_CHARS) {
        return NextResponse.json(
            { error: `Texto demasiado largo (max ${MAX_INPUT_CHARS} caracteres)` },
            { status: 400 },
        );
    }

    // Validar ownership + leer fabric_json
    const { data: proj } = await supabase
        .from("projects")
        .select("id, user_id, fabric_json")
        .eq("id", body.project_id)
        .maybeSingle();
    if (!proj || proj.user_id !== user.id) {
        return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Extraer capas de texto (Textbox, IText, i-text) con customId
    const fj = proj.fabric_json as { objects?: Array<Record<string, unknown>> };
    if (!Array.isArray(fj?.objects)) {
        return NextResponse.json({ error: "Proyecto sin contenido editable" }, { status: 400 });
    }
    const textLayers: TextLayer[] = [];
    for (const obj of fj.objects) {
        const type = obj.type as string;
        const isText = type === "textbox" || type === "Textbox" || type === "i-text" || type === "IText";
        const customId = obj.customId as string | undefined;
        const text = obj.text as string | undefined;
        if (isText && customId && typeof text === "string" && text.length > 0) {
            textLayers.push({
                customId,
                text,
                fontSize: typeof obj.fontSize === "number" ? obj.fontSize : undefined,
            });
        }
    }
    if (textLayers.length === 0) {
        return NextResponse.json({ error: "El flyer no tiene capas de texto editables" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
        console.error("[auto-fill] ANTHROPIC_API_KEY no definida");
        return NextResponse.json({ error: "Servicio no disponible (config faltante)" }, { status: 503 });
    }

    // ─── Cobrar créditos ANTES de llamar a Claude ────────────────────────
    const consumeResult = await consumeCredits(supabase, user.id, "rellenar_plantilla", {
        project_id: body.project_id,
        layer_count: textLayers.length,
        text_length: userText.length,
    });
    if (consumeResult.success === false) {
        return NextResponse.json(
            { error: "Sin créditos suficientes", balance: consumeResult.balance, required: consumeResult.required },
            { status: 402 },
        );
    }

    // ─── Llamada a Claude Sonnet 4.6 ────────────────────────────────────
    let mapping: Record<string, string> = {};
    try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": process.env.ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 4000,
                messages: [
                    { role: "user", content: buildPrompt(textLayers, userText) },
                ],
            }),
        });
        if (!res.ok) {
            const t = await res.text().catch(() => "");
            console.error("[auto-fill] Claude error:", res.status, t);
            throw new Error(`Claude returned ${res.status}`);
        }
        const data = (await res.json()) as { content?: Array<{ text?: string }> };
        const raw = data.content?.[0]?.text?.trim() ?? "";
        // Claude puede envolver el JSON en ``` o añadir prefijo — extraer
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Claude no devolvió JSON válido");
        const parsed = JSON.parse(jsonMatch[0]) as { mapping?: Record<string, string> };
        if (!parsed.mapping || typeof parsed.mapping !== "object") {
            throw new Error("Claude no devolvió un mapping válido");
        }
        // Filtramos: solo customIds que realmente existían en la plantilla
        // (anti-hallucination). Y solo strings.
        const validIds = new Set(textLayers.map(l => l.customId));
        for (const [k, v] of Object.entries(parsed.mapping)) {
            if (validIds.has(k) && typeof v === "string") {
                mapping[k] = v;
            }
        }
    } catch (e) {
        // Refund: la operación falló, devolver los créditos cobrados
        console.error("[auto-fill] error en Claude, hacemos refund:", e);
        try {
            await supabaseAdmin.rpc("add_credits", {
                p_user_id: user.id,
                p_amount: 2, // CREDIT_COST.rellenar_plantilla
                p_reason: "refund:auto_fill_failed",
            });
        } catch (refundErr) {
            console.error("[auto-fill] refund failed", refundErr);
        }
        return NextResponse.json(
            { error: "La IA no pudo procesar el texto. Crédito devuelto." },
            { status: 502 },
        );
    }

    if (Object.keys(mapping).length === 0) {
        // No se mapeó nada — refund también
        try {
            await supabaseAdmin.rpc("add_credits", {
                p_user_id: user.id,
                p_amount: 2,
                p_reason: "refund:auto_fill_no_match",
            });
        } catch { /* silent */ }
        return NextResponse.json(
            { error: "No pudimos encontrar coincidencias entre tu texto y la plantilla. Crédito devuelto." },
            { status: 422 },
        );
    }

    return NextResponse.json({
        mapping,
        used_credits: 2,
        layer_count: textLayers.length,
        matched_count: Object.keys(mapping).length,
    });
}
