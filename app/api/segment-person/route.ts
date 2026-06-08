import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import sharp from "sharp";

if (!process.env.FAL_KEY) {
  console.warn("[segment-person] FAL_KEY no definida en .env.local");
}

// Configuracion global del cliente Fal.ai (idempotente, no pasa nada si se
// llama varias veces).
fal.config({ credentials: process.env.FAL_KEY });

// Cuota mensual por plan y modo. Pro = ilimitado (sentinel -1).
// HD usa SAM-2 + BRIA refinement, mucho mas caro → cuota menor.
const QUOTA_PER_PLAN: Record<string, { normal: number; hd: number }> = {
  free: { normal: 10, hd: 3 },
  pro:  { normal: -1, hd: -1 },
};

const ACTION_NORMAL = "segment_person";
const ACTION_HD     = "segment_person_hd";
const COST_NORMAL   = 0.005;   // SAM-2 image
const COST_HD       = 0.015;   // SAM-2 + BRIA bg remove

type Body = {
  /** URL publica o dataURL de la imagen original */
  imageUrl: string;
  /** Puntos que el usuario marco sobre la persona. Si solo hay 1 punto,
   *  el backend lo usa para encontrar la persona via Florence-2 y luego
   *  llama a SAM-2 con BOX (mas preciso). Si hay varios, modo legacy:
   *  multi-point a SAM-2 directamente. */
  points: Array<{ x: number; y: number }>;
  /** Si true, tras SAM-2 aplica BRIA RMBG 2.0 para refinar bordes finos
   *  (pelo, telas). Coste 3x mayor y cuota separada. */
  hd?: boolean;
};

/** Bounding box devuelta por Florence-2. */
type DetectedBox = { x: number; y: number; w: number; h: number; label: string };

/**
 * Llama Florence-2 open-vocabulary-detection para encontrar TODAS las personas
 * en la imagen. Devuelve sus bounding boxes con etiquetas.
 */
async function detectPersons(publicUrl: string): Promise<DetectedBox[]> {
  const res = await fal.subscribe("fal-ai/florence-2-large/open-vocabulary-detection", {
    input: { image_url: publicUrl, text_input: "person" },
    logs: false,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bboxes = ((res as any)?.data?.results?.bboxes ?? []) as Array<{ x: number; y: number; w: number; h: number; label: string }>;
  return bboxes;
}

/** Encuentra el bbox que contiene el punto (x,y). Si varios, elige el mas pequeno
 *  (mas especifico). Devuelve null si ninguno lo contiene. */
function pickBoxContainingPoint(boxes: DetectedBox[], x: number, y: number): DetectedBox | null {
  const containing = boxes.filter(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
  if (containing.length === 0) return null;
  containing.sort((a, b) => (a.w * a.h) - (b.w * b.h));
  return containing[0];
}

/**
 * Descarga la imagen, la recorta al bbox (con margen) y la sube a Fal storage.
 * Devuelve la URL del crop + las dimensiones del crop en coords de la imagen
 * original (para que el cliente pueda posicionar el resultado en el lugar
 * correcto del canvas).
 */
async function cropAndUpload(
  imageUrl: string,
  box: DetectedBox,
  padding = 0.05,
): Promise<{ croppedUrl: string; cropBounds: { x: number; y: number; w: number; h: number } }> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`No se pudo descargar la imagen original (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const img = sharp(buffer);
  const { width: imgW, height: imgH } = await img.metadata();
  if (!imgW || !imgH) throw new Error("Imagen sin dimensiones validas");

  // Padding alrededor del bbox para que BRIA tenga contexto de fondo
  const padX = box.w * padding;
  const padY = box.h * padding;
  const x = Math.max(0, Math.floor(box.x - padX));
  const y = Math.max(0, Math.floor(box.y - padY));
  const w = Math.min(imgW - x, Math.ceil(box.w + 2 * padX));
  const h = Math.min(imgH - y, Math.ceil(box.h + 2 * padY));

  const croppedBuffer = await img
    .extract({ left: x, top: y, width: w, height: h })
    .png()
    .toBuffer();

  // Subir a Fal storage para que BRIA pueda accederla
  const file = new File([new Uint8Array(croppedBuffer)], "crop.png", { type: "image/png" });
  const croppedUrl = await fal.storage.upload(file);

  return { croppedUrl, cropBounds: { x, y, w, h } };
}

/**
 * Convierte dataURL a Blob para subir a Fal storage. Si ya es URL HTTP la
 * devuelve tal cual (Fal acepta URLs publicas directamente).
 */
async function ensurePublicUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith("http")) return imageUrl;
  if (!imageUrl.startsWith("data:")) {
    throw new Error("imageUrl debe ser dataURL o URL HTTP");
  }
  // dataURL → Blob → upload a Fal storage (URL temporal accesible)
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  // El SDK Fal.ai acepta File. En Node usamos Blob como File-like.
  const file = new File([blob], "input.png", { type: blob.type || "image/png" });
  return await fal.storage.upload(file);
}

/**
 * POST /api/segment-person
 *
 * Recibe una imagen y un punto. Llama a Fal.ai SAM-2 con point prompt para
 * segmentar la persona/objeto que esta en ese punto, y devuelve la URL de la
 * mask resultante. El cliente compone (imagen original + mask) localmente
 * para obtener el PNG transparente con solo esa persona — asi se evita
 * dependencias de procesado de imagen en backend (sharp/canvas-node).
 *
 * Coste estimado: ~$0.003 por llamada.
 */
/**
 * GET /api/segment-person — devuelve cuota disponible al cliente.
 * Devuelve uso/limit tanto de normal como HD para que el modal pueda
 * mostrar "X/10 normal · Y/3 HD".
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({
        authenticated: false,
        plan: null,
        normal: { used: 0, limit: 0 },
        hd:     { used: 0, limit: 0 },
      }, { status: 200 });
    }
    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("id", user.id).maybeSingle();
    const plan = (profile?.plan as string) ?? "free";
    const quotas = QUOTA_PER_PLAN[plan] ?? QUOTA_PER_PLAN.free;
    // Contar uso de ambos en paralelo
    const [normalUsed, hdUsed] = await Promise.all([
      supabase.rpc("count_ai_usage_this_month", { p_user_id: user.id, p_action: ACTION_NORMAL }),
      supabase.rpc("count_ai_usage_this_month", { p_user_id: user.id, p_action: ACTION_HD }),
    ]);
    return NextResponse.json({
      authenticated: true,
      plan,
      normal: { used: (typeof normalUsed.data === "number" ? normalUsed.data : 0), limit: quotas.normal },
      hd:     { used: (typeof hdUsed.data === "number" ? hdUsed.data : 0),     limit: quotas.hd },
    });
  } catch (e) {
    console.error("[segment-person GET] error:", e);
    return NextResponse.json({ error: "Error consultando cuota" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // ─── 1. AUTH: requiere sesion Supabase ───────────────────────────────
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion para usar esta funcion" }, { status: 401 });
    }

    // ─── 2. PARSE INPUT (para saber si es HD antes de chequear cuota) ────
    const body = (await req.json()) as Body;
    if (!body?.imageUrl || !Array.isArray(body?.points) || body.points.length === 0) {
      return NextResponse.json({ error: "imageUrl y al menos 1 punto son obligatorios" }, { status: 400 });
    }
    for (const p of body.points) {
      if (typeof p?.x !== "number" || typeof p?.y !== "number") {
        return NextResponse.json({ error: "Cada punto debe tener {x,y} numericos" }, { status: 400 });
      }
    }
    const useHd = body.hd === true;
    const action = useHd ? ACTION_HD : ACTION_NORMAL;

    // ─── 3. CUOTA: leer plan + contar uso del mes (segun normal/HD) ──────
    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("id", user.id).maybeSingle();
    const plan = (profile?.plan as string) ?? "free";
    const quotas = QUOTA_PER_PLAN[plan] ?? QUOTA_PER_PLAN.free;
    const limit = useHd ? quotas.hd : quotas.normal;

    if (limit !== -1) {
      const { data: countData, error: countErr } = await supabase
        .rpc("count_ai_usage_this_month", { p_user_id: user.id, p_action: action });
      const used = (typeof countData === "number" ? countData : 0);
      if (countErr) {
        console.warn("[segment-person] count_ai_usage error:", countErr.message);
      }
      if (used >= limit) {
        return NextResponse.json(
          {
            error: useHd
              ? `Has alcanzado el limite de ${limit} recortes HD este mes. Hazte Pro para ilimitado.`
              : `Has alcanzado el limite de ${limit} recortes este mes. Hazte Pro para ilimitado.`,
            code: "QUOTA_EXCEEDED",
            used,
            limit,
            plan,
            mode: useHd ? "hd" : "normal",
          },
          { status: 402 },
        );
      }
    }

    const publicUrl = await ensurePublicUrl(body.imageUrl);

    // ── FLOW: Florence-2 detecta personas + crop + BRIA quita fondo ─────
    // 1. Florence-2 detecta TODAS las personas con bounding boxes
    // 2. Elegimos el bbox que contiene el tap del usuario
    // 3. Recortamos la imagen original al bbox (sharp, server-side)
    // 4. Enviamos el crop a BRIA → quita fondo del sujeto principal
    //    (que ahora es solo la persona objetivo, las otras quedan fuera del crop)
    // 5. Devolvemos URL del PNG transparente + las coords del crop para
    //    que el cliente posicione la capa nueva en el mismo lugar.
    //
    // VENTAJA vs SAM-2: BRIA da bordes muy precisos (pelo, telas). Y al
    // recortar primero, BRIA no se confunde con personas abrazadas.
    const tap = body.points[0];
    let detectedBox: DetectedBox | null = null;

    if (body.points.length >= 1) {
      try {
        const persons = await detectPersons(publicUrl);
        detectedBox = pickBoxContainingPoint(persons, tap.x, tap.y);
      } catch (florErr) {
        console.warn("[segment-person] Florence detection fallo:", florErr);
      }
    }

    if (!detectedBox) {
      return NextResponse.json({
        error: "No se detecto ninguna persona en el punto que tocaste. Prueba a tocar mas centrado sobre el cuerpo de la persona.",
      }, { status: 422 });
    }

    // Si el bbox cubre casi toda la imagen, significa que Florence detecto
    // las personas abrazadas como UNA sola — no las puede separar. Avisamos
    // al usuario para que sepa que con esta foto especifica el AI no llega.
    const imgRes = await fetch(publicUrl, { method: "HEAD" }).catch(() => null);
    let totalArea: number | null = null;
    if (imgRes?.ok) {
      // Como no tenemos las dimensiones aqui, las leemos del crop subsiguiente.
      // Por ahora detectamos si el bbox > 80% de su propia imagen (proxy).
    }
    // Proxy simple: si bbox area > 70% del bbox cuadrado total comun, alertar.
    // Mejor heuristica: si w o h > 95% del bbox detectado mas grande, alertar.
    // Simplificamos: si w*h > algun umbral grande, devolver advertencia.
    const detectedArea = detectedBox.w * detectedBox.h;
    // Sin metadata de la imagen, usamos un proxy: si bbox > 1000x1000 sin
    // separar persona (probablemente cubre todo el frame de un grupo abrazado).
    // Como las imagenes tipicas son 1080-1500 px, area > 1M significa
    // probablemente foto entera.
    if (detectedArea > 1_200_000) {
      return NextResponse.json({
        error: "El AI detecto las personas como una sola (estan muy juntas/abrazadas). En esta foto no se pueden separar automaticamente. Prueba con una foto donde las personas esten algo separadas, o recorta manualmente.",
        code: "PERSONS_TOO_CLOSE",
      }, { status: 422 });
    }

    // ── 2. CROP del bbox con margen ──────────────────────────────────────
    let croppedUrl: string;
    let cropBounds: { x: number; y: number; w: number; h: number };
    try {
      const result = await cropAndUpload(publicUrl, detectedBox);
      croppedUrl = result.croppedUrl;
      cropBounds = result.cropBounds;
    } catch (cropErr) {
      console.error("[segment-person] crop error:", cropErr);
      return NextResponse.json({ error: "Error recortando la imagen" }, { status: 500 });
    }

    // ── 3. BRIA quita fondo del crop → PNG transparente ─────────────────
    let result;
    try {
      result = await fal.subscribe("fal-ai/bria/background/remove", {
        input: { image_url: croppedUrl },
        logs: false,
      });
    } catch (falErr) {
      // Imprimimos el detalle exacto que devuelve Fal.ai para diagnosticar 422
      // u otros errores de validacion del input.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = falErr as any;
      console.error("[segment-person] Fal.ai error full:", JSON.stringify({
        status: e?.status,
        body: e?.body,
        message: e?.message,
      }, null, 2));
      // Aplanar a string para que el cliente reciba algo legible (nunca [object Object])
      const stringify = (v: unknown): string => {
        if (v === null || v === undefined) return "";
        if (typeof v === "string") return v;
        try { return JSON.stringify(v); } catch { return String(v); }
      };
      const detail =
        stringify(e?.body?.detail) ||
        stringify(e?.body?.message) ||
        stringify(e?.body?.errors) ||
        stringify(e?.body) ||
        stringify(e?.message) ||
        "Fal.ai rechazo la peticion";
      return NextResponse.json({ error: `Fal.ai: ${detail}` }, { status: 502 });
    }

    // BRIA bg remove devuelve { image: { url } } con PNG transparente real
    type BriaRes = { data?: { image?: { url?: string } } };
    const segmentedUrl = (result as BriaRes)?.data?.image?.url;

    if (!segmentedUrl) {
      console.error("[segment-person] respuesta inesperada de BRIA:", result);
      return NextResponse.json({ error: "BRIA no devolvio imagen" }, { status: 502 });
    }

    // ─── 4. REGISTRAR uso (fire-and-forget) ──────────────────────────────
    const cost = 0.003 + 0.005; // Florence + BRIA (no HD upgrade en este flow)
    void supabaseAdmin.from("ai_usage").insert({
      user_id: user.id,
      action,
      cost_usd: cost,
      meta: {
        model: [
          "fal-ai/florence-2/open-vocab-detection",
          "fal-ai/bria/background/remove",
        ].filter(Boolean).join(" + "),
        points_count: body.points.length,
        used_florence: true,
        detected_persons: 1,
        hd: useHd,
        crop_bounds: cropBounds,
      },
    }).then(({ error }) => {
      if (error) console.warn("[segment-person] no se pudo registrar uso:", error.message);
    });

    // ─── 5. DEVOLVER al cliente: PNG transparente + bbox para posicionar ─
    // El cliente añade una nueva capa con la imagen recortada en las coords
    // (cropBounds.x, cropBounds.y) escalada a cropBounds.w x cropBounds.h
    // del canvas — asi la persona queda EXACTAMENTE encima de su posicion
    // original en la foto (no en offset).
    return NextResponse.json({
      segmentedUrl,
      cropBounds,
      hd: useHd,
      usedFlorence: true,
    });
  } catch (err) {
    console.error("[segment-person] error:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
