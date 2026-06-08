import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

if (!process.env.FAL_KEY) {
  console.warn("[segment-person] FAL_KEY no definida en .env.local");
}

// Configuracion global del cliente Fal.ai (idempotente, no pasa nada si se
// llama varias veces).
fal.config({ credentials: process.env.FAL_KEY });

// Cuota mensual segmentaciones por plan. Pro = ilimitado (sentinel -1).
const QUOTA_PER_PLAN: Record<string, number> = {
  free: 10,
  pro: -1,
};

const ACTION = "segment_person";
const COST_USD = 0.005; // estimado SAM-2 image

type Body = {
  /** URL publica o dataURL de la imagen original */
  imageUrl: string;
  /** Puntos que el usuario marco sobre la persona (multi-tap).
   *  Coordenadas de la imagen ORIGINAL (no del canvas). Todos los puntos
   *  se envian con el mismo object_id para que SAM2 entienda que son
   *  partes de la misma persona. */
  points: Array<{ x: number; y: number }>;
};

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
 * Util para el editor mostrar "X/10 recortes este mes" antes de pulsar.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, used: 0, limit: 0, plan: null }, { status: 200 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    const plan = (profile?.plan as string) ?? "free";
    const limit = QUOTA_PER_PLAN[plan] ?? QUOTA_PER_PLAN.free;
    if (limit === -1) {
      return NextResponse.json({ authenticated: true, used: 0, limit: -1, plan });
    }
    const { data: countData } = await supabase
      .rpc("count_ai_usage_this_month", { p_user_id: user.id, p_action: ACTION });
    const used = (typeof countData === "number" ? countData : 0);
    return NextResponse.json({ authenticated: true, used, limit, plan });
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

    // ─── 2. CUOTA: leer plan + contar uso del mes ────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .maybeSingle();
    const plan = (profile?.plan as string) ?? "free";
    const limit = QUOTA_PER_PLAN[plan] ?? QUOTA_PER_PLAN.free;

    if (limit !== -1) {
      // Funcion SQL contar uso del mes natural actual (ver migration)
      const { data: countData, error: countErr } = await supabase
        .rpc("count_ai_usage_this_month", { p_user_id: user.id, p_action: ACTION });
      const used = (typeof countData === "number" ? countData : 0);
      if (countErr) {
        console.warn("[segment-person] count_ai_usage error:", countErr.message);
      }
      if (used >= limit) {
        return NextResponse.json(
          {
            error: `Has alcanzado el limite de ${limit} recortes este mes. Hazte Pro para ilimitado.`,
            code: "QUOTA_EXCEEDED",
            used,
            limit,
            plan,
          },
          { status: 402 }, // 402 Payment Required
        );
      }
    }

    // ─── 3. VALIDAR input ────────────────────────────────────────────────
    const body = (await req.json()) as Body;
    if (!body?.imageUrl || !Array.isArray(body?.points) || body.points.length === 0) {
      return NextResponse.json({ error: "imageUrl y al menos 1 punto son obligatorios" }, { status: 400 });
    }
    for (const p of body.points) {
      if (typeof p?.x !== "number" || typeof p?.y !== "number") {
        return NextResponse.json({ error: "Cada punto debe tener {x,y} numericos" }, { status: 400 });
      }
    }

    const publicUrl = await ensurePublicUrl(body.imageUrl);

    // Fal.ai SAM2 image: segmentacion interactiva con multi-point prompt.
    // Todos los puntos llevan el MISMO object_id=1 para que SAM2 entienda
    // que pertenecen a la misma persona. apply_mask=true devuelve la
    // imagen recortada con fondo transparente directamente.
    const prompts = body.points.map(p => ({
      x: p.x,
      y: p.y,
      label: 1,        // 1 = positivo (parte de la persona). NUMBER aunque SDK diga string.
      object_id: 1,    // mismo objeto para todos
    }));

    let result;
    try {
      result = await fal.subscribe("fal-ai/sam2/image", {
        input: {
          image_url: publicUrl,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prompts: prompts as any,
          apply_mask: true,
          output_format: "png", // PNG conserva alpha
        },
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

    // Output: { image: { url } } con la imagen ya recortada (alpha transparente).
    type SamRes = { data?: { image?: { url?: string } } };
    const segmentedUrl = (result as SamRes)?.data?.image?.url;

    if (!segmentedUrl) {
      console.error("[segment-person] respuesta inesperada de SAM2:", result);
      return NextResponse.json({ error: "Fal.ai no devolvio imagen segmentada" }, { status: 502 });
    }

    // ─── 4. REGISTRAR uso (fire-and-forget, no bloquea respuesta) ────────
    // Usamos supabaseAdmin (service_role) porque no hay policy de INSERT
    // publica en ai_usage por seguridad — solo el server puede registrar.
    void supabaseAdmin.from("ai_usage").insert({
      user_id: user.id,
      action: ACTION,
      cost_usd: COST_USD,
      meta: { model: "fal-ai/sam2/image", points_count: body.points.length },
    }).then(({ error }) => {
      if (error) console.warn("[segment-person] no se pudo registrar uso:", error.message);
    });

    return NextResponse.json({
      segmentedUrl,
    });
  } catch (err) {
    console.error("[segment-person] error:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
