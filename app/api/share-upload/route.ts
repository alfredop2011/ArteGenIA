import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";
import { uploadToR2, makeKey } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/share-upload — sube un PNG (dataURL) generado en el cliente a R2,
 * lo convierte a JPG (más ligero, mejor para compartir por WhatsApp/
 * Telegram donde el receptor ve la imagen full en el chat y puede
 * guardar/reenviar como foto sin pasar por landing).
 *
 * Devuelve:
 *   - `imageUrl` (R2 directa .jpg) → para compartir por DM (WA, TG)
 *   - `publicUrl` (/flyer/<id>) → landing HTML con OG tags, para Facebook
 *      crawler y para previews al copiar link en otras redes
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
    const b64 = match[2];
    const inputBuffer = Buffer.from(b64, "base64");
    if (inputBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "Imagen demasiado grande (max 8 MB)" }, { status: 413 });
    }
    // Validar magic-numbers del contenido real (no confiar en el prefijo
    // data: declarado por el cliente — podría subir HTML/SVG como "image/png").
    const isPng = inputBuffer[0] === 0x89 && inputBuffer[1] === 0x50 && inputBuffer[2] === 0x4e && inputBuffer[3] === 0x47;
    const isJpeg = inputBuffer[0] === 0xff && inputBuffer[1] === 0xd8 && inputBuffer[2] === 0xff;
    if (!isPng && !isJpeg) {
      return NextResponse.json({ error: "El contenido no es un PNG/JPEG válido" }, { status: 400 });
    }

    // Convertir SIEMPRE a JPG (calidad 88, mozjpeg) — peso 3-5× menor que
    // PNG, y WhatsApp/Telegram comprimen igualmente al recibir PNG, así
    // que servir JPG nativo evita doble compresión y mejora la velocidad
    // del preview en móviles. Si la imagen ya viene como JPG, sharp la
    // re-encodea pero el coste es mínimo (~50ms).
    // Aplanamos transparencia sobre blanco — el flyer típico tiene fondo,
    // pero si es PNG con alpha y lo dejásemos sin background, sharp
    // pondría negro por defecto y los flyers blancos quedarían raros.
    let buffer: Buffer;
    try {
      buffer = await sharp(inputBuffer)
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer();
    } catch (e) {
      console.error("[share-upload] sharp JPG conversion failed:", e);
      return NextResponse.json({ error: "No se pudo procesar la imagen" }, { status: 500 });
    }
    const contentType = "image/jpeg";
    const key = makeKey("share", "jpg");
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
    // solo la URL R2 directa sin shareId. El frontend la usa como fallback.
    if (shareErr) {
      console.warn("[share-upload] shared_flyers insert failed:", shareErr.message);
      // Backward compat: mantenemos `url` además de `imageUrl` por si algún
      // caller antiguo (MobileEditorV3 ShareModal) sigue leyendo `url`.
      return NextResponse.json({ url: r2Url, imageUrl: r2Url, key });
    }

    // URL publica HTML con OG tags (mejor preview en Facebook)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artegenia.vercel.app";
    const publicUrl = `${baseUrl}/flyer/${shared.id}`;

    return NextResponse.json({
      // URL DIRECTA del JPG en R2 — para compartir por WhatsApp/Telegram
      // donde el receptor ve la imagen full y puede guardar/reenviar.
      imageUrl: r2Url,
      // Landing HTML con OG tags — para Facebook crawler y previews ricos.
      publicUrl,
      // Backward compat para callers que aún leen `url`.
      url: r2Url,
      key,
      shareId: shared.id,
    });
  } catch (err) {
    console.error("[share-upload]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
