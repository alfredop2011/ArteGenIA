import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { COST_PER_ACTION_USD, getQuota, isUnlimited } from "@/lib/quotas";
import { FONT_CATALOG, matchFont } from "@/lib/fontCatalog";
import { detectTextLinesWithSurya, refineSonnetBboxesWithSurya } from "@/lib/suryaOcr";

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

// Florence-2 reemplazado por SAM-3 (Fase V.6) — ver detectAndSegmentPeople.

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
        /** Categoría tipográfica detectada (Fase W.3 — font matching) */
        fontCategory?: "display" | "serif" | "sans" | "script" | "mono";
        /** Nombre exacto Google Font elegido por Sonnet del catálogo de 30
         *  fuentes (preferido frente a fontDescription si está presente y es
         *  válido en FONT_CATALOG). */
        fontFamily?: string;
        /** Descripción visual de la tipografía (ej. "bold geometric sans") —
         *  legacy/fallback para matching heurístico. */
        fontDescription?: string;
      }
    | { type: "image-region"; label: string; x: number; y: number; w: number; h: number }
    | { type: "shape"; color: string; x: number; y: number; w: number; h: number }
  >;
};

/** Genera una máscara PNG (blanco donde hay texto, negro donde no) lista
 *  para enviar a Flux Fill inpainting. Margen 10% en cada lado para cubrir
 *  descenders, ascenders y antialias del texto original. */
async function buildTextMask(
  imageW: number,
  imageH: number,
  textBboxesPct: Array<{ x: number; y: number; w: number; h: number }>,
): Promise<Buffer> {
  // SVG con rectángulos blancos donde hay texto, fondo negro.
  // sharp lo convierte a PNG raster del tamaño exacto.
  const rects = textBboxesPct
    .map((b) => {
      const x = Math.max(0, ((b.x - b.w * 0.04) / 100) * imageW);
      const y = Math.max(0, ((b.y - b.h * 0.12) / 100) * imageH);
      const w = Math.min(imageW - x, ((b.w * 1.08) / 100) * imageW);
      const h = Math.min(imageH - y, ((b.h * 1.24) / 100) * imageH);
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>`;
    })
    .join("");
  const svg = `<svg width="${imageW}" height="${imageH}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="black"/>${rects}</svg>`;
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/** Inpainting con LaMa: borra los textos del fondo SIN inventar contenido
 *  nuevo. LaMa (Resolution-robust Large Mask Inpainting, Samsung Research)
 *  está específicamente diseñado para object removal, a diferencia de Flux
 *  Fill que tiende a generar texto inventado cuando se le pide borrar texto.
 *
 *  Cascade de modelos: intenta LaMa primero, si falla cae a Flux Fill con
 *  prompt anti-texto reforzado. Si los dos fallan, devuelve null (cover
 *  rectangles entran como fallback final).
 */
async function inpaintTextRegions(
  imageBuf: Buffer,
  maskBuf: Buffer,
  mediaType: string,
): Promise<string | null> {
  let imageUrl: string;
  let maskUrl: string;
  try {
    // 1. Subir imagen y máscara a Fal storage
    const imageFile = new File(
      [imageBuf as unknown as BlobPart],
      "input.jpg",
      { type: mediaType },
    );
    const maskFile = new File(
      [maskBuf as unknown as BlobPart],
      "mask.png",
      { type: "image/png" },
    );
    [imageUrl, maskUrl] = await Promise.all([
      fal.storage.upload(imageFile),
      fal.storage.upload(maskFile),
    ]);
  } catch (e) {
    console.warn("[photo-to-template] fal upload failed:", e);
    return null;
  }

  // ─── INTENTO 1: LaMa (object removal sin generar) ─────────────────────
  // Endpoint: fal-ai/lama (Samsung LaMa, ideal para borrar texto/objetos)
  try {
    const result = await fal.subscribe("fal-ai/lama", {
      input: {
        image_url: imageUrl,
        mask_url: maskUrl,
      },
      logs: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (result as any)?.data;
    const outUrl = data?.image?.url ?? data?.images?.[0]?.url ?? data?.output_image?.url;
    if (typeof outUrl === "string") return outUrl;
    console.warn("[photo-to-template] LaMa no devolvió URL:", result);
  } catch (e) {
    console.warn("[photo-to-template] LaMa failed, trying Flux Fill:", e instanceof Error ? e.message : e);
  }

  // ─── INTENTO 2 (fallback): Flux Fill con prompt anti-texto reforzado ──
  try {
    const result = await fal.subscribe("fal-ai/flux-pro/v1/fill", {
      input: {
        image_url: imageUrl,
        mask_url: maskUrl,
        // Prompt MUY explícito anti-generación de texto
        prompt:
          "Plain empty smooth background continuation, completely textless, no letters, no words, no characters, no typography, no logos, no symbols, no writing, no signage. " +
          "Continue the surrounding texture, lighting, gradient, sky, fabric, skin, walls or whatever the surrounding area is, naturally and seamlessly without any markings.",
      },
      logs: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (result as any)?.data;
    const outUrl = data?.images?.[0]?.url ?? data?.image?.url;
    if (typeof outUrl === "string") return outUrl;
    console.warn("[photo-to-template] Flux Fill no devolvió URL:", result);
  } catch (e) {
    console.warn("[photo-to-template] Flux Fill also failed:", e instanceof Error ? e.message : e);
  }

  return null;
}

/** Samplea el color del FONDO alrededor del bbox del texto (NO del texto
 *  mismo). Útil para construir rectángulos "cover" que oculten el texto
 *  original del flyer y dejen visible solo el texto editable encima.
 *  Estrategia: sample 4 esquinas exteriores al bbox + promedio robusto. */
async function sampleBackgroundAround(
  imageBuf: Buffer,
  imageWidth: number,
  imageHeight: number,
  xPct: number, yPct: number, wPct: number, hPct: number,
  fallback: string,
): Promise<string> {
  try {
    const x = (xPct / 100) * imageWidth;
    const y = (yPct / 100) * imageHeight;
    const w = (wPct / 100) * imageWidth;
    const h = (hPct / 100) * imageHeight;
    // Margen exterior: 1.5% del lado menor para evitar caer en el texto si
    // el bbox de Claude está apretado
    const margin = Math.max(8, Math.round(Math.min(imageWidth, imageHeight) * 0.015));

    // 4 puntos: justo encima, debajo, izquierda y derecha del CENTRO del bbox
    // (no en las esquinas, que pueden caer en otros elementos visuales).
    const cx = x + w / 2;
    const cy = y + h / 2;
    const candidates: Array<{ x: number; y: number }> = [
      { x: cx, y: y - margin },              // arriba centro
      { x: cx, y: y + h + margin },          // abajo centro
      { x: x - margin, y: cy },              // izquierda centro
      { x: x + w + margin, y: cy },          // derecha centro
    ].filter((p) => p.x >= 0 && p.x < imageWidth && p.y >= 0 && p.y < imageHeight);

    if (candidates.length === 0) return fallback;

    const colors: Array<[number, number, number]> = [];
    const SAMPLE = 3;
    for (const p of candidates) {
      const left = Math.max(0, Math.round(p.x - SAMPLE / 2));
      const top = Math.max(0, Math.round(p.y - SAMPLE / 2));
      const cw = Math.min(SAMPLE, imageWidth - left);
      const ch = Math.min(SAMPLE, imageHeight - top);
      if (cw <= 0 || ch <= 0) continue;
      const { data } = await sharp(imageBuf)
        .extract({ left, top, width: cw, height: ch })
        .raw()
        .toBuffer({ resolveWithObject: true });
      const channels = data.length / (cw * ch);
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += channels) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      if (n > 0) {
        colors.push([Math.round(r / n), Math.round(g / n), Math.round(b / n)]);
      }
    }
    if (colors.length === 0) return fallback;
    // Promedio de los 4 puntos (robusto si algunos caen sobre elementos)
    const avgR = Math.round(colors.reduce((s, c) => s + c[0], 0) / colors.length);
    const avgG = Math.round(colors.reduce((s, c) => s + c[1], 0) / colors.length);
    const avgB = Math.round(colors.reduce((s, c) => s + c[2], 0) / colors.length);
    return `#${avgR.toString(16).padStart(2, "0")}${avgG.toString(16).padStart(2, "0")}${avgB.toString(16).padStart(2, "0")}`;
  } catch (e) {
    console.warn("[photo-to-template] sampleBackgroundAround fail:", e);
    return fallback;
  }
}

/** Extrae el color del TEXTO en sí (no del fondo) usando el bbox + el
 *  color del fondo ya muestreado. Estrategia: sampleamos una grilla densa
 *  dentro del bbox, calculamos distancia euclidiana de cada píxel al
 *  bgColor, y promediamos el top 15% más distante (esos son los píxeles
 *  del texto por contraste). Si nada destaca, fallback al color de Claude.
 */
async function sampleTextColorByContrast(
  imageBuf: Buffer,
  imageWidth: number,
  imageHeight: number,
  xPct: number, yPct: number, wPct: number, hPct: number,
  bgColorHex: string,
  fallback: string,
): Promise<string> {
  try {
    const x = Math.round((xPct / 100) * imageWidth);
    const y = Math.round((yPct / 100) * imageHeight);
    const w = Math.round((wPct / 100) * imageWidth);
    const h = Math.round((hPct / 100) * imageHeight);
    if (w <= 0 || h <= 0) return fallback;

    // Recortar la región del bbox y obtener raw RGB
    const { data, info } = await sharp(imageBuf)
      .extract({
        left: Math.max(0, x),
        top: Math.max(0, y),
        width: Math.min(w, imageWidth - x),
        height: Math.min(h, imageHeight - y),
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    const totalPixels = info.width * info.height;
    if (totalPixels === 0) return fallback;

    // Parsear bgColor a RGB
    const bgR = parseInt(bgColorHex.slice(1, 3), 16);
    const bgG = parseInt(bgColorHex.slice(3, 5), 16);
    const bgB = parseInt(bgColorHex.slice(5, 7), 16);

    // Para cada píxel, calcular distancia al bgColor + guardar
    const pixels: Array<{ r: number; g: number; b: number; dist: number }> = [];
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      pixels.push({ r, g, b, dist });
    }

    // Top 15% más distantes del fondo = píxeles del texto
    pixels.sort((a, b) => b.dist - a.dist);
    const topN = Math.max(10, Math.round(pixels.length * 0.15));
    const top = pixels.slice(0, topN);

    // Verificar que el contraste es significativo (>40 = colores claramente
    // distintos). Si no, el bbox no contiene texto contrastado y el fallback
    // de Claude es más fiable.
    const avgTopDist = top.reduce((s, p) => s + p.dist, 0) / top.length;
    if (avgTopDist < 40) return fallback;

    // Promedio del top → color del texto
    const r = Math.round(top.reduce((s, p) => s + p.r, 0) / top.length);
    const g = Math.round(top.reduce((s, p) => s + p.g, 0) / top.length);
    const b = Math.round(top.reduce((s, p) => s + p.b, 0) / top.length);
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch (e) {
    console.warn("[photo-to-template] sampleTextColorByContrast fail:", e);
    return fallback;
  }
}

/** Color sampling real con sharp: extrae el color exacto del píxel en el
 *  centroide del bbox del texto. Más preciso que el color "adivinado" por
 *  Claude. Si falla por cualquier motivo, retorna el fallback.
 *  NOTA: legacy — usar sampleTextColorByContrast cuando se tiene bgColor. */
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
    }
  | {
      id: string;
      type: "shape";
      shape: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      fill: string;
      opacity?: number;
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
9. fontFamily: elige la Google Font que MEJOR aproxime la fuente del texto.
   IMPORTANTE: el editor SOLO tiene cargadas estas 30 fuentes. Devuelve el
   nombre EXACTO de UNA de esta lista (no inventes, no "Arial", no "Helvetica"):

   DISPLAY (títulos impacto):
   - "Anton" → condensada negrita extrema, uppercase
   - "Bebas Neue" → condensada limpia uppercase clásica
   - "Oswald" → condensada moderna versátil
   - "Bungee" → bold blocky urbano/neon/tropical
   - "Black Ops One" → stencil militar urbano
   - "Russo One" → bold geométrica futurista racing
   - "Bowlby One" → fat round chunky fun
   - "Permanent Marker" → rotulador street graffiti

   SANS (texto info limpio):
   - "Montserrat" → geométrica moderna versátil round
   - "Inter" → UI neutra clean moderna
   - "Poppins" → geométrica round friendly playful
   - "Roboto Condensed" → condensada compacta para listas
   - "Raleway" → thin elegante minimal sofisticada
   - "Work Sans" → industrial clean neutral
   - "Outfit" → geométrica moderna rounded fresh
   - "Roboto" → neutral clásica universal Android
   - "Open Sans" → humanista warm readable
   - "Lato" → humanista warm corporate friendly
   - "DM Sans" → geométrica moderna minimal tech
   - "Manrope" → geométrica premium sophisticated luxury
   - "Space Grotesk" → display geometric futurista quirky tech
   - "Karla" → grotesque humanist editorial warm
   - "Nunito" → rounded warm friendly soft
   - "Quicksand" → rounded geometric playful soft amigable

   SERIF (elegante/clásica):
   - "Playfair Display" → high contrast modern serif editorial
   - "Cormorant Garamond" → thin elegante old style literaria
   - "Lora" → cálida readable calligraphic clásica
   - "EB Garamond" → renaissance vintage literaria
   - "DM Serif Display" → high contrast luxury fashion
   - "Cinzel" → roman classical monumental stone uppercase
   - "Merriweather" → readable warm literary newspaper editorial
   - "Fraunces" → modern expressive warm italian high-contrast soft
   - "Crimson Text" → classic book readable old-style literaria
   - "Libre Baskerville" → transitional elegant british editorial
   - "Bitter" → slab modern readable warm robust
   - "Spectral" → modern warm editorial screen humanist

   SCRIPT (manuscrita/cursiva):
   - "Great Vibes" → elegante calligraphy wedding formal
   - "Pacifico" → casual retro surf 70s tropical warm
   - "Lobster" → bold vintage retro neon italic 60s
   - "Dancing Script" → handwritten warm wedding casual
   - "Allura" → thin elegant feminine delicada
   - "Sacramento" → modern script monoline thin
   - "Kaushan Script" → brush bold energético sports
   - "Satisfy" → relaxed cálida casual
   - "Caveat" → marker informal doodle nota
   - "Indie Flower" → childlike doodle friendly

   Mira BIEN la fuente del texto: ¿es condensada o ancha? ¿bold o thin?
   ¿uppercase? ¿tiene remates (serif) o no (sans)? ¿es manuscrita?
   ¿geométrica o orgánica? Elige la fuente del catálogo más parecida.
10. fontCategory: "display" | "serif" | "sans" | "script" | "mono".
    Debe coincidir con la categoría de la fontFamily que elegiste.

11. COLOR DEL TEXTO — CRÍTICO, sé MUY PRECISO:
    Devuelve el color hex EXACTO del glyph (la letra), NO del fondo.
    - Texto BLANCO puro: #FFFFFF (sin "blanquecino" ni "marfil")
    - Texto NEGRO puro: #000000
    - Amarillo dorado típico de "ENTRADA LIBRE" o destacados: #F4B400, #FFC107, #FFD700
    - Si el texto tiene degradado, devuelve el color PREDOMINANTE
      (el que cubre más del 60% del glyph). NO promedies con el fondo.
    - Si el texto tiene outline/sombra, devuelve el color del RELLENO interior
      (lo que ve el ojo como "el color del texto").
    - Si dudas entre blanco y un blanco muy sutil amarillento → usa #FFFFFF.
    - Si dudas entre amarillo intenso (#F4B400) y naranja (#F97316) → mira
      la luminosidad: amarillos son MÁS claros, naranjas más cálidos/oscuros.
    - NUNCA devuelvas marrones (#8B4513, #A0522D) ni grises tierra (#736357)
      a no ser que el texto sea LITERALMENTE marrón o tierra — esos colores
      suelen ser confusión con el fondo del flyer.

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
      "textAlign": "center",
      "fontFamily": "Bebas Neue",
      "fontCategory": "display"
    }
  ]
}

Solo TEXTOS PLANOS editables. Sé exhaustivo CON UNA EXCEPCIÓN crítica:

NO detectes textos que están DENTRO de logos, iconos circulares, o
elementos gráficos integrados al diseño. Si ves un círculo decorativo
con "MUNDO SALSA" dentro, eso es un LOGO, no un texto editable —
ignóralo. El usuario no va a editarlo y crear una capa encima rompe
el diseño visual del logo.

REGLA para distinguir TEXTO vs LOGO:
- TEXTO PLANO: tipografía limpia sobre fondo plano (titulares, listas,
  fechas, créditos al pie, URLs, etc.) → SÍ detectar.
- TEXTO EN LOGO: dentro de un círculo de color, badge, sello, ícono,
  monograma, o cualquier forma decorativa → NO detectar.

PRECISIÓN MÁXIMA DE BBOX (especialmente en flyers densos con muchos
textos juntos verticalmente, tipo tracklist o setlist):
- La altura h debe ser AJUSTADA al glyph real, sin padding extra
  arriba o abajo. Si te equivocas, equivócate por DEFECTO (h más
  pequeño), no por exceso. Tapamos los textos con cover rectangles
  del color del fondo — si tu h es demasiado grande, el cover tapa
  texto de la línea siguiente.
- En textos de lista (1., 2., 3., ... canciones), cada línea es un
  layer SEPARADO. NUNCA juntes dos canciones en un bbox.
- Si dos trozos de texto están en la MISMA LÍNEA HORIZONTAL (ej.
  "Comenta 'PLAYLIST' y te la mando al DM"), trátalos como UN SOLO
  layer con todo el contenido, no como 3 layers separados.`;

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

type SegmentedPerson = {
  /** URL del PNG transparente (recorte de la persona con fondo eliminado) */
  pngUrl: string;
  /** Bbox en coordenadas píxel originales de la imagen subida */
  bbox: { x: number; y: number; w: number; h: number };
  /** Score de confianza 0..1 que devuelve SAM-3 */
  score: number;
};

/** Detecta + segmenta TODAS las personas del flyer en UNA sola llamada.
 *
 *  Reemplaza el pipeline anterior (Florence-2 detección $0.005 + N llamadas a
 *  SAM-2 segment $0.04 cada una). SAM-3 hace detección open-vocab +
 *  multi-instance segmentation en un solo $0.005 — para 10 personas baja
 *  de $0.40 a $0.005 (80× más barato) Y produce máscaras de mayor calidad.
 *
 *  Notas:
 *  - `prompt: "person"` activa open-vocabulary detection.
 *  - `max_masks: 20` cubre flyers densos (rave, conciertos grupales). Cap
 *    duro del modelo es 32; si tienes un grupo > 20 personas, sube esto.
 *  - `apply_mask: true` devuelve cada mask como PNG con fondo transparente
 *    ya recortado al bbox — listo para usar como capa en el editor sin
 *    procesamiento extra.
 *  - Filtramos score >= 0.5 — bajo eso son falsos positivos (sombras,
 *    siluetas en el fondo, etc.).
 *  - Dedup por IoU > 0.7: SAM-3 a veces devuelve body+face como dos
 *    instancias separadas — nos quedamos con la de mayor score. */
type SamDebug = {
  responseKeys: string[];
  masksCount: number;
  boxesCount: number;
  scoresCount: number;
  metadataCount: number;
  scoresSample: number[];
  boxesSample: number[][];
  imageW: number;
  imageH: number;
  boxFormat: "xyxy-px" | "xyxy-norm" | "xywh-px" | "xywh-norm" | "unknown";
  error: string | null;
  finalCount: number;
};

async function detectAndSegmentPeople(imageUrl: string): Promise<{
  persons: SegmentedPerson[];
  debug: SamDebug;
}> {
  const debug: SamDebug = {
    responseKeys: [],
    masksCount: 0,
    boxesCount: 0,
    scoresCount: 0,
    metadataCount: 0,
    scoresSample: [],
    boxesSample: [],
    imageW: 0,
    imageH: 0,
    boxFormat: "unknown",
    error: null,
    finalCount: 0,
  };
  try {
    const res = await fal.subscribe("fal-ai/sam-3/image", {
      input: {
        image_url: imageUrl,
        prompt: "person",
        return_multiple_masks: true,
        max_masks: 20,
        include_scores: true,
        include_boxes: true,
        apply_mask: true,
        output_format: "png",
      },
      logs: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (res as any)?.data ?? {};
    debug.responseKeys = Object.keys(data);
    debug.masksCount = (data.masks ?? []).length;
    debug.boxesCount = (data.boxes ?? []).length;
    debug.scoresCount = (data.scores ?? []).length;
    debug.metadataCount = (data.metadata ?? []).length;
    debug.scoresSample = ((data.scores ?? []) as number[]).slice(0, 10);
    debug.boxesSample = ((data.boxes ?? []) as number[][]).slice(0, 4);
    debug.imageW = (data.image?.width as number) ?? 0;
    debug.imageH = (data.image?.height as number) ?? 0;
    console.log("[sam-3] debug:", JSON.stringify(debug));

    const masks = (data.masks ?? []) as Array<{ url: string }>;
    const metadata = (data.metadata ?? []) as Array<{
      index?: number; score?: number; box?: number[];
    }>;
    const boxesFlat = (data.boxes ?? []) as Array<[number, number, number, number]>;
    const scoresFlat = (data.scores ?? []) as Array<number>;

    // ── Detección del formato de los boxes ──────────────────────────────
    // SAM-3 devuelve boxes en uno de 4 formatos según despliegue:
    //   - [x_min, y_min, x_max, y_max] píxeles (xyxy-px)
    //   - [x_min, y_min, x_max, y_max] normalizadas 0..1 (xyxy-norm)
    //   - [x_min, y_min, width, height] píxeles (xywh-px)
    //   - [x_min, y_min, width, height] normalizadas 0..1 (xywh-norm)
    // Heurísticas:
    //   - Normalización: max value de TODOS los boxes <= 1.5
    //   - Formato xywh: si AL MENOS UN box tiene b[2] < b[0] (en xyxy esto
    //     sería x_max < x_min, geométricamente imposible). Esto evita el
    //     bug donde el primer box era ambiguo (b[2] > b[0]) pero los demás
    //     claramente xywh — caso real reportado por el usuario.
    const allBoxes = boxesFlat.length > 0
      ? boxesFlat
      : (metadata.map((m) => m.box).filter((b) => Array.isArray(b) && b.length === 4) as number[][]);
    let isNormalized = false;
    let isXywh = false;
    if (allBoxes.length > 0) {
      const globalMax = Math.max(...allBoxes.flat());
      isNormalized = globalMax <= 1.5;
      isXywh = allBoxes.some((b) => b[2] < b[0] || b[3] < b[1]);
    }
    debug.boxFormat = isXywh
      ? (isNormalized ? "xywh-norm" : "xywh-px")
      : (isNormalized ? "xyxy-norm" : "xyxy-px");

    // Multiplicadores para denormalizar. Si imagen tiene dims, las usamos;
    // si no, asumimos 1 (deja los valores como están — solo funciona si ya
    // están en píxeles).
    const sx = isNormalized && debug.imageW > 0 ? debug.imageW : 1;
    const sy = isNormalized && debug.imageH > 0 ? debug.imageH : 1;

    const persons: SegmentedPerson[] = masks
      .map((m, i) => {
        const meta = metadata[i];
        const box = (meta?.box && meta.box.length === 4 ? meta.box : boxesFlat[i]) as
          | [number, number, number, number] | undefined;
        const score = meta?.score ?? scoresFlat[i] ?? 0;
        const b = box ?? [0, 0, 0, 0];
        // Aplicar formato detectado: convertir a xyxy-px siempre
        const x = b[0] * sx;
        const y = b[1] * sy;
        const w = isXywh ? b[2] * sx : (b[2] - b[0]) * sx;
        const h = isXywh ? b[3] * sy : (b[3] - b[1]) * sy;
        return {
          pngUrl: m.url,
          bbox: { x, y, w, h },
          score,
        };
      })
      // Threshold permisivo: 0.3 (era 0.5). En flyers densos / con poca luz
      // SAM-3 suele dar scores entre 0.3-0.6 incluso para personas obvias.
      .filter((p) => p.score >= 0.3 && p.bbox.w > 5 && p.bbox.h > 5);

    // Dedup por IoU: SAM-3 a veces solapa body+face. Nos quedamos con la
    // máscara de mayor área (= persona completa, no solo cara).
    const deduped: SegmentedPerson[] = [];
    const sortedByArea = [...persons].sort(
      (a, b) => b.bbox.w * b.bbox.h - a.bbox.w * a.bbox.h,
    );
    for (const cand of sortedByArea) {
      const overlaps = deduped.some((kept) => iou(cand.bbox, kept.bbox) > 0.7);
      if (!overlaps) deduped.push(cand);
    }
    debug.finalCount = deduped.length;
    return { persons: deduped, debug };
  } catch (e) {
    debug.error = e instanceof Error ? e.message : String(e);
    console.error("[photo-to-template] SAM-3 failed:", e);
    return { persons: [], debug };
  }
}

/** Intersection-over-Union para dedup de bboxes. */
function iou(
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
    // SAM-3 reemplaza al pipeline Florence-2 + N llamadas SAM-2 segment.
    // En paralelo con Claude: extrae TODAS las personas como PNG transparente
    // en una sola llamada $0.005 (vs $0.04 × N personas con SAM-2).
    const [claudeOut, samResult] = await Promise.all([
      callClaude(imgBase64, mediaType),
      detectAndSegmentPeople(body.imageUrl),
    ]);
    const persons = samResult.persons;
    const samDebug = samResult.debug;
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

    // ─── Mejoras de calidad ─────────────────────────────────────────────
    // 1. Filtrar solo layers de texto válidos y deduplicar overlaps
    //    (lo movemos arriba del push de bg-magic porque necesitamos los
    //    bboxes para construir la mask de inpainting).
    const rawTextLayers = (claudeOut.layers ?? []).filter(
      (l): l is Extract<typeof l, { type: "text" }> => l.type === "text"
    );
    let dedupedTextLayers = mergeOverlappingTextLayers(rawTextLayers);

    // ─── REFINAMIENTO BBOX CON SURYA (Fase V.8, opt-in) ────────────────
    // Si OCR_PROVIDER=surya, llamamos a Surya OCR (Replicate) para obtener
    // bboxes más precisos. Para cada layer de Sonnet, buscamos la línea
    // Surya con texto más parecido (Levenshtein <= 0.3) y reemplazamos
    // sus coords. Layers sin match en Surya conservan bbox de Sonnet.
    //
    // El caller decide activar via env var en Vercel:
    //   OCR_PROVIDER=surya + REPLICATE_API_TOKEN=r8_...
    // Sin esas vars, el flujo es idéntico al pre-V.8 (Sonnet-only).
    let surya_used = false;
    let surya_refined_count = 0;
    let surya_lines_count = 0;
    let surya_error: string | null = null;
    if (process.env.OCR_PROVIDER === "surya" && dedupedTextLayers.length > 0) {
      try {
        const t0 = Date.now();
        const suryaLines = await detectTextLinesWithSurya(body.imageUrl);
        const elapsedSurya = Date.now() - t0;
        surya_lines_count = suryaLines.length;
        console.log(`[surya] ${suryaLines.length} líneas en ${elapsedSurya}ms`);

        const refined = refineSonnetBboxesWithSurya(
          dedupedTextLayers.map((l) => ({
            content: l.content, x: l.x, y: l.y, w: l.w, h: l.h,
          })),
          suryaLines,
          W,
          H,
        );
        // Aplicar refinamientos solo donde hubo match (refined: true)
        dedupedTextLayers = dedupedTextLayers.map((layer, i) => {
          if (refined[i].refined) {
            surya_refined_count++;
            return { ...layer, x: refined[i].x, y: refined[i].y, w: refined[i].w, h: refined[i].h };
          }
          return layer;
        });
        surya_used = true;
        console.log(`[surya] refinó ${surya_refined_count}/${dedupedTextLayers.length} bboxes`);
      } catch (e) {
        // No bloqueamos: si Surya falla, seguimos con bboxes de Sonnet.
        surya_error = e instanceof Error ? e.message : String(e);
        console.warn("[surya] error, fallback a Sonnet:", surya_error);
      }
    }

    // 2a. Color del FONDO alrededor de cada bbox — solo necesario para
    //     los cover rectangles (fallback cuando inpainting falla).
    const sampledBgColors = await Promise.all(
      dedupedTextLayers.map((layer) =>
        sampleBackgroundAround(imgBuf, W, H, layer.x, layer.y, layer.w, layer.h, "#000000")
      )
    );

    // 2b. Color del TEXTO: Claude 4.6 con visión ve el flyer entero y entiende
    //     contexto semántico (sabe que "ENTRADA LIBRE" es amarillo dorado por
    //     diseño, no por análisis pixel-by-pixel). El sampling pixel-based
    //     fallaba en backgrounds densos (luces concierto, gente bailando) —
    //     promedio de bgColor era ruido y el contraste capturaba luces, no texto.
    //     Confiamos en lo que devuelve Claude. Si se equivoca, usuario edita
    //     color con picker en editor (1 click).
    const sampledColors = dedupedTextLayers.map((l) => l.color ?? "#ffffff");

    // INPAINTING desactivado temporalmente. LaMa producía artefactos visibles
    // (texto distorsionado tipo "SUPOSTREE" en lugar de fondo limpio) y Flux
    // Fill inventaba textos nuevos. Además sumaba 3-8s al pipeline causando
    // timeouts 504 en Vercel. Usamos cover rectangles del bgColor sampleado:
    // menos elegante que un fondo perfectamente reconstruido, pero MÁS FIABLE
    // (parche sólido del color correcto = no se notará si el bgColor es bueno).
    // Cuando tengamos un modelo de inpainting con calidad consistente
    // (ej. SAM-3 + Flux Inpaint con prompt vacío, o LaMa fine-tuned), volver.
    const backgroundUrl = body.imageUrl;

    // ─── Layer 0: imagen como fondo (inpaintada si Flux Fill funcionó) ─
    // id "bg-magic" para que applyTemplateLayers NO aplique scale-to-fill
    // forzado (mantiene scaleX/scaleY=1 que coinciden con el canvas).
    generatedLayers.push({
      id: "bg-magic",
      type: "image",
      src: backgroundUrl,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    });

    // 3. Conversión final a TemplateLayer[] con font matching real
    let textIdx = 0;
    let coverIdx = 0;
    for (let i = 0; i < dedupedTextLayers.length; i++) {
      const layer = dedupedTextLayers[i];
      const sampledColor = sampledColors[i];
      const bgColor = sampledBgColors[i];
      // Convertir porcentajes 0-100 a píxeles absolutos
      const xPx = Math.round((layer.x / 100) * W);
      const yPx = Math.round((layer.y / 100) * H);
      const wPx = Math.round((layer.w / 100) * W);
      const hPx = Math.round((layer.h / 100) * H);

      // 3a. Rectángulo COVER del color del fondo sampleado, ENCIMA del bg
      //     original y DEBAJO del texto editable. Tapa el texto original
      //     del flyer para evitar duplicidad visual.
      //
      //     Márgenes MUY ajustados (2% Y, 1% X) para evitar solapamiento
      //     entre textos verticales adyacentes en flyers densos tipo
      //     tracklist/setlist. Antes (15% Y) los rects de líneas seguidas
      //     se invadían unas a otras tapando texto de líneas vecinas.
      //     Trade-off: si el OCR de Sonnet subestima la altura del bbox,
      //     puede asomar 1-2px del texto original — visible pero menos
      //     malo que la duplicidad masiva del problema anterior.
      const coverMarginX = Math.max(2, Math.round(wPx * 0.01));
      const coverMarginY = Math.max(2, Math.round(hPx * 0.02));
      generatedLayers.push({
        id: `cover-${coverIdx++}`,
        type: "shape",
        shape: "rect",
        x: Math.max(0, xPx - coverMarginX),
        y: Math.max(0, yPx - coverMarginY),
        width: wPx + coverMarginX * 2,
        height: hPx + coverMarginY * 2,
        fill: bgColor,
        opacity: 1,
      });

      // 3b. Font matching: prefiere fontFamily que Sonnet eligió DIRECTAMENTE
      //     del catálogo (si vino y es válido — más preciso que heurística).
      //     Fallback a matchFont por categoría+descripción si no.
      const claudeFont = (layer.fontFamily ?? "").trim();
      const validClaudeFont = claudeFont && FONT_CATALOG.some((f) => f.family === claudeFont);
      const matchedFont = validClaudeFont
        ? claudeFont
        : matchFont({
            category: layer.fontCategory,
            description: layer.fontDescription,
            weight: layer.weight,
          });
      generatedLayers.push({
        id: `text-${textIdx++}`,
        type: "text",
        text: layer.content,
        x: xPx,
        y: yPx,
        width: Math.max(wPx, 80),
        fontSize: fontSizeToPx(layer.fontSize, H),
        fontFamily: matchedFont, // ← Bebas Neue / Playfair / Montserrat etc.
        color: sampledColor, // ← color real del píxel, no el adivinado
        fontWeight: layer.weight === "bold" ? "bold" : "normal",
        textAlign: layer.textAlign ?? "left", // ← respeta alineación detectada
      });
    }

    // Personas extraídas con SAM-3 (PNG transparente listos). Las añadimos
    // ENCIMA del fondo inpaintado para que el usuario pueda moverlas, borrar
    // las que no le interesen, o reordenarlas. Filtramos personas demasiado
    // pequeñas (< 2% del área total): suelen ser fondo o ruido.
    const minPersonArea = (W * H) * 0.02;
    const visiblePersons = persons.filter((p) => p.bbox.w * p.bbox.h >= minPersonArea);
    for (const [i, p] of visiblePersons.entries()) {
      generatedLayers.push({
        id: `person-${i}`,
        type: "image",
        src: p.pngUrl, // PNG con fondo transparente ya recortado al bbox
        x: p.bbox.x,
        y: p.bbox.y,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      });
    }

    // ─── 8. REGISTRAR USO ────────────────────────────────────────────────
    const textsDetected = dedupedTextLayers.length;
    const textsRaw = rawTextLayers.length;
    void supabaseAdmin.from("ai_usage").insert({
      user_id: user.id,
      action: ACTION,
      // Coste real: Sonnet $0.036 + SAM-3 $0.005 = $0.041/uso.
      cost_usd: COST_PER_ACTION_USD[ACTION],
      meta: {
        elapsed_ms: elapsed,
        model: MODEL,
        text_layers_raw: textsRaw,
        text_layers_kept: textsDetected,
        text_layers_merged: textsRaw - textsDetected,
        persons_segmented: visiblePersons.length,
        image_size: imgBuf.length,
        segmentation_model: "sam-3",
      },
    });

    // Personas detectadas — la UI las muestra como thumbnails con opción de
    // "quitar" si alguna salió mal. Ya están dentro de generatedLayers como
    // `person-{i}`, esto es solo metadata para el preview de capas mágicas.
    const detectedPersons = visiblePersons.map((p, i) => ({
      id: `person-${i}`,
      pngUrl: p.pngUrl,
      x: p.bbox.x,
      y: p.bbox.y,
      w: p.bbox.w,
      h: p.bbox.h,
      score: p.score,
    }));

    return NextResponse.json({
      layers: generatedLayers,
      meta: {
        width: W,
        height: H,
        dominantColors: claudeOut.dominantColors ?? [],
        textsDetected,
        textsMerged: textsRaw - textsDetected,
        personsDetected: visiblePersons.length,
        elapsedMs: elapsed,
        model: MODEL,
        // Imagen original — el cliente la usa para mostrar preview comparativo
        originalUrl: body.imageUrl,
        // Personas ya extraídas como PNG transparente — listas para mostrar
        // como thumbnails en el preview (Fase V.6 con SAM-3).
        detectedPersons,
        // Debug info de SAM-3 para diagnosticar "0 personas" en flyers obvios.
        // Si el usuario nos pasa esto, sabemos exactamente qué shape devolvió.
        samDebug,
        // Fase V.8 — métricas del refinamiento con Surya (si está activado)
        suryaDebug: process.env.OCR_PROVIDER === "surya" ? {
          used: surya_used,
          linesDetected: surya_lines_count,
          bboxesRefined: surya_refined_count,
          totalBboxes: dedupedTextLayers.length,
          error: surya_error,
        } : null,
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
// Claude (~30s) + Florence (~5s) + Flux Fill inpainting (~15-20s) = ~50-55s.
// Margen de seguridad para casos lentos.
export const maxDuration = 90;
