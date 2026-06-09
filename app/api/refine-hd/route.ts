import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

if (!process.env.FAL_KEY) {
  console.warn("[refine-hd] FAL_KEY no definida");
}

fal.config({ credentials: process.env.FAL_KEY });

/**
 * Convierte dataURL a File para subir a Fal storage. Si ya es URL la
 * devuelve. BRIA acepta tanto URL como upload.
 */
async function ensurePublicUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith("http")) return imageUrl;
  if (!imageUrl.startsWith("data:")) {
    throw new Error("imageUrl debe ser dataURL o URL HTTP");
  }
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  const file = new File([blob], "input.png", { type: blob.type || "image/png" });
  return await fal.storage.upload(file);
}

type Body = {
  /** PNG transparente (dataURL) generado por el cliente tras componer
   *  mask de SAM-2 + imagen original. BRIA lo refina con bordes precisos. */
  imageUrl: string;
};

/**
 * POST /api/refine-hd
 *
 * Recibe un PNG con persona ya segmentada (alpha transparente) y lo pasa por
 * BRIA RMBG 2.0 para refinar bordes finos: pelo rizado, telas sueltas, etc.
 *
 * NOTA: la cuota y el registro de uso se hace en /api/segment-person, este
 * endpoint solo refina (sin coste duplicado, sin chequeo de cuota — pero
 * SI requiere auth para evitar abuso).
 *
 * Coste interno: ~$0.01 BRIA.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Rate limit anti-burst (proteccion presupuesto BRIA: $0.01/call)
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const limitRes = await checkRateLimit(supabase, user.id, "refine-hd");
    if (limitRes) return limitRes;

    const body = (await req.json()) as Body;
    if (!body?.imageUrl) {
      return NextResponse.json({ error: "imageUrl obligatorio" }, { status: 400 });
    }

    const publicUrl = await ensurePublicUrl(body.imageUrl);

    let result;
    try {
      result = await fal.subscribe("fal-ai/bria/background/remove", {
        input: { image_url: publicUrl },
        logs: false,
      });
    } catch (briaErr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = briaErr as any;
      console.error("[refine-hd] BRIA error:", { status: e?.status, body: e?.body, message: e?.message });
      return NextResponse.json({ error: "BRIA fallo refinando" }, { status: 502 });
    }

    type Res = { data?: { image?: { url?: string } } };
    const refinedUrl = (result as Res)?.data?.image?.url;
    if (!refinedUrl) {
      return NextResponse.json({ error: "BRIA no devolvio imagen" }, { status: 502 });
    }

    return NextResponse.json({ refinedUrl });
  } catch (err) {
    console.error("[refine-hd] error:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
