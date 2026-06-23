import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, makeKey } from "@/lib/r2";
import { extractEventFromImage } from "@/lib/extractEvent";
import { publicSubmitKeyOk } from "@/lib/eventSubmit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/eventos/public-extract — PÚBLICO (sin login). Lo usa la página /subir
 * (link que el admin comparte con organizadores amigos). Sube el flyer a R2 y
 * devuelve la URL + key + datos extraídos por visión para autocompletar.
 *
 * Protección: si existe EVENT_SUBMIT_KEY, exige ?k= que coincida (link privado).
 * Si no está configurada, queda abierto (se recomienda configurarla).
 */

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const SNIFF: { ext: string; type: string; test: (b: Buffer) => boolean }[] = [
  { ext: "png", type: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "webp", type: "image/webp", test: (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
];

export async function POST(req: NextRequest) {
  try {
    if (!publicSubmitKeyOk(req)) return NextResponse.json({ error: "Enlace no válido" }, { status: 403 });

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.byteLength === 0) return NextResponse.json({ error: "Archivo vacío" }, { status: 400 });
    if (buffer.byteLength > MAX_BYTES) return NextResponse.json({ error: "Imagen demasiado grande (máx 8 MB)" }, { status: 413 });
    const kind = SNIFF.find((s) => s.test(buffer));
    if (!kind) return NextResponse.json({ error: "Formato no soportado. Usa PNG, JPG o WebP." }, { status: 400 });

    const key = makeKey("eventos", kind.ext);
    const [{ url }, extracted] = await Promise.all([
      uploadToR2(buffer, key, kind.type),
      extractEventFromImage(buffer.toString("base64"), kind.type),
    ]);
    return NextResponse.json({ url, key, data: extracted });
  } catch (err) {
    console.error("[eventos/public-extract]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
