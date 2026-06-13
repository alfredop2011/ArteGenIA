import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { COST_PER_ACTION_USD, getQuota, isUnlimited } from "@/lib/quotas";

/**
 * POST /api/photo-to-template
 *
 * "Capas Mágicas": convierte una imagen subida en plantilla editable.
 *
 * Combina 2 modelos en paralelo:
 *  - Florence-2 detection ($0.005): detecta TODOS los bboxes de objetos
 *    visuales (personas, logos, fotos). Devuelve crops rectangulares del
 *    original, movibles individualmente.
 *  - Claude Haiku 4.5 con visión ($0.014): OCR + detección de textos +
 *    paleta de colores + dimensiones aproximadas.
 *
 * Coste total: ~$0.02/uso. Cuota: Free 3/mes · Pro 20/mes · Enterprise 100/mes.
 *
 * Output: TemplateLayer[] que el cliente añade al canvas del editor:
 *  - Layer 0 (background): imagen original a tamaño completo, lockeada
 *  - Layers 1..N: textos detectados con OCR (editables individualmente)
 *  - Layers N+1..M: crops de objetos visuales como ImageBlocks (movibles)
 *
 * Pitch comercial:
 *   "¿Hiciste tu flyer con ChatGPT? Es solo imagen plana. Súbelo aquí y lo
 *    convertimos en plantilla editable sin perder el diseño."
 */

if (!process.env.FAL_KEY) {
  console.warn("[photo-to-template] FAL_KEY no definida");
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("[photo-to-template] ANTHROPIC_API_KEY no definida");
}
fal.config({ credentials: process.env.FAL_KEY });

const ACTION = "photo_to_template" as const;
// Sonnet 4.6 mejora precisión espacial y OCR vs Haiku (clave para que el
// resultado quede creíble al primer uso). Coste ~7× más alto pero
// compensado con cuotas ajustadas (Free 2, Pro 15, Enterprise 60).
const MODEL = "claude-sonnet-4-6";

type Body = {
  /** URL pública de la imagen subida (R2 o Fal storage). */
  imageUrl: string;
};

type FlorenceBox = { x: number; y: number; w: number; h: number; label: string };

type ClaudeOutput = {
  imageWidth: number;
  imageHeight: number;
  dominantColors?: string[];
  layers: Array<
    | {
        type: "text";
        content: string;
        x: number; // porcentajes 0-100
        y: number;
        w: number;
        h: number;
        fontSize: "large" | "medium" | "small";
        color: string;
        weight: "bold" | "regular";
        textAlign?: "left" | "center" | "right";
      }
    | { type: "image-region"; label: string; x: number; y: number; w: number; h: number }
    | { type: "shape"; color: string; x: number; y: number; w: number; h: number }
  >;
};

/** Color sampling real con sharp: extrae el color exacto del píxel en el
 *  centroide del bbox del texto. Más preciso que el color "adivinado" por
 *  Claude. Si falla por cualquier motivo, retorna el fallback. */
async function sampleColorAt(
  imageBuf: Buffer,
  imageWidth: number,
  imageHeight: number,
  xPct: number, yPct: number, wPct: number, hPct: number,
  fallback: string,
): Promise<string> {
  try {
    // Centro del bbox en píxeles
    const cx = Math.round(((xPct + wPct / 2) / 100) * imageWidth);
    const cy = Math.round(((yPct + hPct / 2) / 100) * imageHeight);
    // Sampleamos un área 5×5 para promediar y resistir anti-aliasing
    const SAMPLE = 5;
    const left = Math.max(0, cx - Math.floor(SAMPLE / 2));
    const top = Math.max(0, cy - Math.floor(SAMPLE / 2));
    // Ajustar para no salirnos del borde
    const w = Math.min(SAMPLE, imageWidth - left);
    const h = Math.min(SAMPLE, imageHeight - top);
    if (w <= 0 || h <= 0) return fallback;

    const { data } = await sharp(imageBuf)
      .extract({ left, top, width: w, height: h })
      .raw()
      .toBuffer({ resolveWithObject: true });
    // data es array RGB(A) plano. Promediar.
    let r = 0, g = 0, b = 0, n = 0;
    const channels = data.length / (w * h);
    for (let i = 0; i < data.length; i += channels) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    if (n === 0) return fallback;
    const rh = Math.round(r / n).toString(16).padStart(2, "0");
    const gh = Math.round(g / n).toString(16).padStart(2, "0");
    const bh = Math.round(b / n).toString(16).padStart(2, "0");
    return `#${rh}${gh}${bh}`;
  } catch (e) {
    console.warn("[photo-to-template] sample fail:", e);
    return fallback;
  }
}

/** Detecta y fusiona text layers que se solapan más del threshold (50%
 *  por defecto). Devuelve la lista limpia. Ordenado por área desc para
 *  preservar el bbox mayor cuando hay solape. */
function mergeOverlappingTextLayers<T extends { x: number; y: number; w: number; h: number; content: string }>(
  layers: T[],
  threshold = 0.5,
): T[] {
  const sorted = [...layers].sort((a, b) => b.w * b.h - a.w * a.h);
  const kept: T[] = [];
  for (const layer of sorted) {
    const overlaps = kept.find((k) => intersectionOverUnion(k, layer) > threshold);
    if (!overlaps) {
      kept.push(layer);
    }
    // Si solapa, descartamos el menor (ya está dentro del mayor) sin
    // perder texto crítico — el OCR del mayor casi siempre incluye el menor.
  }
  return kept;
}

function intersectionOverUnion(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return 0;
  const inter = (x2 - x1) * (y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return inter / union;
}

/** Genérica TemplateLayer compatible con `data/templates.ts`. Duplicada aquí
 *  para no acoplar este endpoint al import path; el cliente la valida. */
type GeneratedLayer =
  | {
      id: string;
      type: "text";
      text: string;
      x: number;
      y: number;
      width: number;
      fontSize: number;
      fontFamily: string;
      color: string;
      fontWeight?: string;
      textAlign?: "left" | "center" | "right";
    }
  | {
      id: string;
      type: "image";
      src: string;
      x?: number;
      y?: number;
      scaleX?: number;
      scaleY?: number;
      opacity?: number;
      cropX?: number;
      cropY?: number;
      cropWidth?: number;
      cropHeight?: number;
    };

/** Mapea fontSize cualitativo de Claude → píxeles. Asume canvas 1080px wide. */
function fontSizeToPx(size: "large" | "medium" | "small", canvasHeight: number): number {
  const base = canvasHeight / 1350; // referencia portrait estándar
  if (size === "large") return Math.round(64 * base);
  if (size === "medium") return Math.round(36 * base);
  return Math.round(22 * base);
}

const CLAUDE_PROMPT = `Analiza este flyer/poster con MÁXIMA precisión. Detecta CADA texto
visible y devuelve sus coordenadas exactas como porcentajes 0-100 del
ancho/alto de la imagen (NO píxeles).

REGLAS DE PRECISIÓN (críticas):
1. OCR EXACTO: el "content" debe ser el texto EXACTO que se ve, respetando
   mayúsculas, acentos, símbolos (€, &, ·, º, ª) y números. NO parafrasees.
2. POSICIÓN: x,y = esquina TOP-LEFT del bbox del texto, NO del centro.
3. ANCHO: w debe cubrir TODO el ancho real del texto, incluyendo el
   último carácter. Si dudas, redondea HACIA ARRIBA.
4. ALTURA: h = altura visual del glyph, no incluir descenders ni padding.
5. LÍNEAS SEPARADAS: si un texto tiene varias líneas con saltos visuales
   claros, devuélvelas como layers SEPARADOS (no junto con \\n).
6. fontSize cualitativo basado en h:
   - "large" si h > 8 (títulos, nombres grandes)
   - "medium" si 3 < h <= 8 (subtítulos, info media)
   - "small" si h <= 3 (URLs, créditos, listas finas)
7. weight: "bold" si el texto es claramente negrita o más grueso que cuerpo.
8. textAlign: "left", "center" o "right" según la alineación visual.

Devuelve SOLO JSON, sin markdown, sin explicación:
{
  "imageWidth": ancho aproximado original en píxeles,
  "imageHeight": alto aproximado original en píxeles,
  "dominantColors": ["#hex1", "#hex2", "#hex3"],
  "layers": [
    {
      "type": "text",
      "content": "TEXTO EXACTO OCR",
      "x": 12.5, "y": 8.3, "w": 35, "h": 6.2,
      "fontSize": "large",
      "color": "#RRGGBB",
      "weight": "bold",
      "textAlign": "center"
    }
  ]
}

Solo TEXTOS. NO detectes personas ni gráficos. Sé exhaustivo: detecta
TODOS los textos, incluso los pequeños (URLs, créditos al pie, listas).`;

async function callClaude(imageBase64: string, mediaType: string): Promise<ClaudeOutput | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: imageBase64 },
            },
            { type: "text", text: CLAUDE_PROMPT },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("[photo-to-template] Claude error:", res.status, t);
    return null;
  }
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "";

  // Parsear JSON robusto a markdown wrappers / texto extra.
  try {
    let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
    return JSON.parse(cleaned) as ClaudeOutput;
  } catch (e) {
    console.error("[photo-to-template] JSON parse fail:", e);
    return null;
  }
}

async function detectObjects(imageUrl: string): Promise<FlorenceBox[]> {
  try {
    const res = await fal.subscribe("fal-ai/florence-2-large/open-vocabulary-detection", {
      input: { image_url: imageUrl, text_input: "person, face, logo, photo" },
      logs: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bboxes = ((res as any)?.data?.results?.bboxes ?? []) as FlorenceBox[];
    return bboxes;
  } catch (e) {
    console.warn("[photo-to-template] Florence detection failed:", e);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    // ─── 1. AUTH ─────────────────────────────────────────────────────────
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion para usar esta funcion" }, { status: 401 });
    }

    // ─── 2. PARSE + VALIDAR ──────────────────────────────────────────────
    const body = (await req.json()) as Body;
    if (!body?.imageUrl) {
      return NextResponse.json({ error: "imageUrl es obligatorio" }, { status: 400 });
    }
    if (!body.imageUrl.startsWith("http")) {
      return NextResponse.json({ error: "imageUrl debe ser URL HTTP pública" }, { status: 400 });
    }
    // Anti-SSRF: solo aceptar URLs de nuestro storage (R2/Supabase) o de Fal.ai.
    const { validateImageUrl } = await import("@/lib/inputValidation");
    const ssrfErr = validateImageUrl(body.imageUrl);
    if (ssrfErr) {
      return NextResponse.json({ error: `URL no permitida: ${ssrfErr}` }, { status: 400 });
    }

    // ─── 3. CUOTA ────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("id", user.id).maybeSingle();
    const plan = (profile?.plan as string) ?? "free";
    const limit = getQuota(plan, ACTION);

    let used = 0;
    if (!isUnlimited(plan, ACTION)) {
      const { data: count } = await supabase.rpc("count_ai_usage_this_month", {
        p_user_id: user.id,
        p_action: ACTION,
      });
      used = typeof count === "number" ? count : 0;
      if (used >= limit) {
        return NextResponse.json(
          {
            error: "Has alcanzado tu cuota mensual de Capas Mágicas",
            feature: "magic-layers",
            used, limit, plan,
            resetAt: nextMonthIso(),
          },
          { status: 402 },
        );
      }
    }

    // ─── 4. RATE LIMIT anti-burst ────────────────────────────────────────
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const rl = await checkRateLimit(supabase, user.id, "photo-to-template");
    if (rl) return rl;

    // ─── 5. DESCARGAR IMAGEN (la necesitamos en base64 para Claude) ──────
    const imgRes = await fetch(body.imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "No se pudo descargar la imagen" }, { status: 400 });
    }
    const imgBuf = Buffer.from(await imgRes.arrayBuffer());
    const mediaType = (imgRes.headers.get("content-type") ?? "image/jpeg").split(";")[0];
    if (!mediaType.startsWith("image/")) {
      return NextResponse.json({ error: "El archivo no es una imagen válida" }, { status: 400 });
    }
    const imgBase64 = imgBuf.toString("base64");

    // ─── 6. PARALELO: Claude (textos) + Florence (objetos) ───────────────
    const t0 = Date.now();
    const [claudeOut, objects] = await Promise.all([
      callClaude(imgBase64, mediaType),
      detectObjects(body.imageUrl),
    ]);
    const elapsed = Date.now() - t0;

    if (!claudeOut) {
      return NextResponse.json(
        { error: "El analizador IA no respondió correctamente. Inténtalo de nuevo." },
        { status: 502 },
      );
    }

    // ─── 7. ARMAR TemplateLayer[] ────────────────────────────────────────
    // Usar el tamaño REAL de la imagen (no lo que reporta Claude — puede
    // tener offset). sharp metadata es la fuente de verdad.
    let realW = claudeOut.imageWidth || 1080;
    let realH = claudeOut.imageHeight || 1350;
    try {
      const meta = await sharp(imgBuf).metadata();
      if (meta.width && meta.height) {
        realW = meta.width;
        realH = meta.height;
      }
    } catch (e) {
      console.warn("[photo-to-template] sharp metadata failed:", e);
    }
    const W = realW;
    const H = realH;
    const generatedLayers: GeneratedLayer[] = [];

    // Layer 0: imagen original como fondo.
    // IMPORTANTE: el id debe ser "bg-photo" para que applyTemplateLayers
    // detecte que es background y aplique scaleToFill = canvas.width / img.width.
    // Si usamos otro id, Fabric renderiza la imagen a su tamaño natural y
    // queda descolocada respecto al canvas.
    generatedLayers.push({
      id: "bg-photo",
      type: "image",
      src: body.imageUrl,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    });

    // ─── Mejoras de calidad ─────────────────────────────────────────────
    // 1. Filtrar solo layers de texto válidos y deduplicar overlaps
    const rawTextLayers = (claudeOut.layers ?? []).filter(
      (l): l is Extract<typeof l, { type: "text" }> => l.type === "text"
    );
    const dedupedTextLayers = mergeOverlappingTextLayers(rawTextLayers);

    // 2. Color sampling REAL con sharp sobre cada bbox (precisión 100% vs
    //    la aproximación que devuelve Claude). Paralelizado.
    const sampledColors = await Promise.all(
      dedupedTextLayers.map((layer) =>
        sampleColorAt(imgBuf, W, H, layer.x, layer.y, layer.w, layer.h, layer.color ?? "#ffffff")
      )
    );

    // 3. Conversión final a TemplateLayer[]
    let textIdx = 0;
    for (let i = 0; i < dedupedTextLayers.length; i++) {
      const layer = dedupedTextLayers[i];
      const sampledColor = sampledColors[i];
      // Convertir porcentajes 0-100 a píxeles absolutos
      const xPx = Math.round((layer.x / 100) * W);
      const yPx = Math.round((layer.y / 100) * H);
      const wPx = Math.round((layer.w / 100) * W);
      generatedLayers.push({
        id: `text-${textIdx++}`,
        type: "text",
        text: layer.content,
        x: xPx,
        y: yPx,
        width: Math.max(wPx, 80),
        fontSize: fontSizeToPx(layer.fontSize, H),
        fontFamily: "Arial",
        color: sampledColor, // ← color real del píxel, no el adivinado
        fontWeight: layer.weight === "bold" ? "bold" : "normal",
        textAlign: layer.textAlign ?? "left", // ← respeta alineación detectada
      });
    }

    // Layers de objetos visuales detectados por Florence (crops del original).
    // Limitar a top-5 más grandes — más allá de eso, los crops pequeños se
    // amontonan sobre los textos y confunden al usuario. Si Florence detecta
    // un grupo masivo (DJs juntos) lo trata como UN solo elemento; intentar
    // separarlo en N personas individuales requiere SAM-2 ($1+/uso, descartado).
    const topObjects = objects
      .filter((o) => o.w * o.h > (W * H) * 0.01) // mínimo 1% del área total
      .sort((a, b) => b.w * b.h - a.w * a.h)
      .slice(0, 5);
    for (const [i, box] of topObjects.entries()) {
      generatedLayers.push({
        id: `obj-${i}`,
        type: "image",
        src: body.imageUrl,
        x: box.x,
        y: box.y,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        cropX: box.x,
        cropY: box.y,
        cropWidth: box.w,
        cropHeight: box.h,
      });
    }

    // ─── 8. REGISTRAR USO ────────────────────────────────────────────────
    const textsDetected = dedupedTextLayers.length;
    const textsRaw = rawTextLayers.length;
    void supabaseAdmin.from("ai_usage").insert({
      user_id: user.id,
      action: ACTION,
      cost_usd: COST_PER_ACTION_USD[ACTION],
      meta: {
        elapsed_ms: elapsed,
        model: MODEL,
        text_layers_raw: textsRaw,
        text_layers_kept: textsDetected,
        text_layers_merged: textsRaw - textsDetected,
        object_layers: topObjects.length,
        image_size: imgBuf.length,
      },
    });

    return NextResponse.json({
      layers: generatedLayers,
      meta: {
        width: W,
        height: H,
        dominantColors: claudeOut.dominantColors ?? [],
        textsDetected,
        textsMerged: textsRaw - textsDetected,
        objectsDetected: topObjects.length,
        elapsedMs: elapsed,
        model: MODEL,
        // Imagen original — el cliente la usa para mostrar preview comparativo
        originalUrl: body.imageUrl,
        // Cuota actualizada (used+1 porque acabamos de consumir uno)
        quota: { used: used + 1, limit, plan, unlimited: limit === -1 },
      },
    });
  } catch (e) {
    console.error("[photo-to-template] unhandled:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

/** ISO timestamp del primer día del mes siguiente (UTC). Para mostrar al
 *  usuario "Tu cuota se reinicia el 1 jul." en el modal upgrade. */
function nextMonthIso(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return next.toISOString();
}

/** GET /api/photo-to-template — devuelve la cuota disponible para que la
 *  UI del editor muestre "X/3 este mes" en el badge del botón. */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        used: 0, limit: 0, plan: null, unlimited: false,
      });
    }
    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("id", user.id).maybeSingle();
    const plan = (profile?.plan as string) ?? "free";
    const limit = getQuota(plan, ACTION);
    const unlimited = isUnlimited(plan, ACTION);
    let used = 0;
    if (!unlimited) {
      const { data: count } = await supabase.rpc("count_ai_usage_this_month", {
        p_user_id: user.id,
        p_action: ACTION,
      });
      used = typeof count === "number" ? count : 0;
    }
    return NextResponse.json({
      authenticated: true,
      plan,
      used,
      limit,
      unlimited,
      remaining: unlimited ? Infinity : Math.max(0, limit - used),
    });
  } catch (e) {
    console.error("[photo-to-template GET]", e);
    return NextResponse.json({ error: "Error consultando cuota" }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60; // Claude + Florence pueden tardar 15-30s
