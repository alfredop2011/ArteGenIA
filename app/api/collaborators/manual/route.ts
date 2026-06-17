import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";

/**
 * POST /api/collaborators/manual
 *
 * Guarda directamente un colaborador desde el organizador (sin token público).
 * SOLO PERMITE MARCAS (`kind=brand`). Para personas se requiere consentimiento
 * RGPD vía /api/collaborator-invites + /upload/[token].
 *
 * Body: FormData con
 *   - kind ("brand" obligatorio, se rechaza "person")
 *   - artist_name (string)
 *   - role (string, opcional)
 *   - photo (File, hasta 15MB)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const formData = await req.formData();
    const kind = formData.get("kind") as string | null;
    const artistName = (formData.get("artist_name") as string | null)?.trim();
    const role = (formData.get("role") as string | null)?.trim() || null;
    const photo = formData.get("photo") as File | null;

    if (kind !== "brand") {
      return NextResponse.json(
        { error: "Solo marcas. Las personas requieren consentimiento RGPD via link de invitación." },
        { status: 400 }
      );
    }
    if (!artistName) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
    if (!photo)      return NextResponse.json({ error: "Falta logo" }, { status: 400 });
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo imágenes" }, { status: 400 });
    }
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Máximo 5MB" }, { status: 400 });
    }

    // Compresión defensiva server-side (logos: PNG 800px)
    const safeName = artistName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    const ts = Date.now().toString(36);
    const inputBytes = Buffer.from(await photo.arrayBuffer());

    let outBytes: Buffer;
    let outMime: string;
    let outExt: string;

    try {
      outBytes = await sharp(inputBytes)
        .rotate()
        .resize(800, 800, { fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();
      outMime = "image/png";
      outExt = "png";
    } catch (sharpErr) {
      console.warn("[manual POST] sharp failed, using original:", sharpErr);
      outBytes = inputBytes;
      outMime = photo.type;
      outExt = photo.name.split(".").pop()?.toLowerCase() || "png";
    }

    const key = `brands/${user.id}/manual-${ts}-${safeName}.${outExt}`;
    const { url: photoUrl } = await uploadToR2(outBytes, key, outMime);

    const { data, error } = await supabase
      .from("collaborators")
      .insert({
        owner_id: user.id,
        kind: "brand",
        artist_name: artistName,
        role,
        photo_url: photoUrl,
        // Sin consentimiento (no aplica RGPD a marcas)
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[manual POST]", error);
      // Limpiar el archivo R2 que acabamos de subir — el INSERT falló y
      // nadie va a referenciarlo. Best-effort: si el DELETE falla, log
      // y seguimos (el cron de cleanup lo pescará luego).
      try { await deleteFromR2(key); } catch (e) {
        console.warn("[manual POST] huérfano R2 sin borrar:", key, e);
      }
      return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, collaboratorId: data.id });
  } catch (e) {
    console.error("[manual POST]", e);
    return NextResponse.json({ error: "Error procesando la solicitud" }, { status: 500 });
  }
}
