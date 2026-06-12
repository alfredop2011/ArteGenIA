import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";
import { uploadToR2, makeKey } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/share-upload — sube un PNG (dataURL) generado en el cliente a R2
 * y devuelve la URL pública.
 *
 * Pensado para el modal de "Compartir tras descargar" del editor mobile.
 * El usuario descarga el PNG localmente Y queremos darle un link público
 * para WhatsApp/Facebook/Twitter sin necesidad de subir él mismo.
 *
 * Auth + rate limit aplicados — R2 cuesta storage y el bucket es público.
 */

type Body = {
  /** Data URL PNG/JPEG generado por toDataURL del canvas */
  imageDataUrl: string;
  /** Título del flyer (para OG title) */
  title?: string;
};

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB max — flyers grandes pero no abusar

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion" }, { status: 401 });
    }
    const limitRes = await checkRateLimit(supabase, user.id, "share-upload");
    if (limitRes) return limitRes;

    const { imageDataUrl, title } = (await req.json()) as Body;
    if (!imageDataUrl?.startsWith("data:")) {
      return NextResponse.json({ error: "imageDataUrl invalido" }, { status: 400 });
    }
    const match = imageDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Formato no soportado (PNG/JPG)" }, { status: 400 });
    }
    const ext = match[1] === "jpeg" ? "jpg" : match[1];
    const b64 = match[2];
    const buffer = Buffer.from(b64, "base64");
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Imagen demasiado grande (max 8 MB)" }, { status: 413 });
    }
    const contentType = ext === "jpg" ? "image/jpeg" : "image/png";
    const key = makeKey("share", ext);
    const { url: r2Url } = await uploadToR2(buffer, key, contentType);

    // Crear entrada en shared_flyers para tener URL publica /flyer/<uuid>
    // con OG tags (mejor preview en FB/Twitter/WhatsApp).
    const cleanTitle = (title ?? "").trim().slice(0, 80) || "Mi flyer";
    const { data: shared, error: shareErr } = await supabase
      .from("shared_flyers")
      .insert({
        user_id: user.id,
        r2_url: r2Url,
        r2_key: key,
        title: cleanTitle,
      })
      .select("id")
      .single();

    // Si la tabla no existe aun (migracion pendiente en prod), devolvemos
    // solo la URL R2 sin shareId. El frontend cae al comportamiento anterior.
    if (shareErr) {
      console.warn("[share-upload] shared_flyers insert failed:", shareErr.message);
      return NextResponse.json({ url: r2Url, key });
    }

    // URL publica que pondremos en redes sociales
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artegenia.vercel.app";
    const publicUrl = `${baseUrl}/flyer/${shared.id}`;

    return NextResponse.json({
      url: r2Url,
      key,
      shareId: shared.id,
      publicUrl,
    });
  } catch (err) {
    console.error("[share-upload]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
