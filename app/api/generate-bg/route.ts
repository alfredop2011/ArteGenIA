import { NextRequest, NextResponse } from "next/server";
import { generateBackground, type FlyerFormat } from "@/lib/falai";
import { uploadToR2, makeKey } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

type RequestBody = {
  prompt?: string;
  style?: string;
  palette?: { id?: string; name?: string; colors?: string[] };
  format?: FlyerFormat;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RequestBody;

    const userPrompt = (body.prompt ?? "").trim();
    if (!userPrompt) {
      return NextResponse.json(
        { error: "Falta el campo 'prompt'." },
        { status: 400 }
      );
    }

    const format = (body.format ?? "instagram") as FlyerFormat;
    const style = body.style ?? "moderno";
    const paletteColors = body.palette?.colors ?? [];

    // 1) Genera la imagen con Fal.ai
    const generated = await generateBackground({
      userPrompt,
      style,
      paletteColors,
      format,
    });

    // 2) Descarga el resultado de la URL temporal de Fal
    const imgRes = await fetch(generated.imageUrl);
    if (!imgRes.ok) {
      throw new Error(`No se pudo descargar la imagen de Fal.ai: ${imgRes.status}`);
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3) Sube a R2 (deduce extensión por content-type, por defecto png)
    const contentType = imgRes.headers.get("content-type") ?? "image/png";
    const ext = contentType.includes("jpeg")
      ? "jpg"
      : contentType.includes("webp")
      ? "webp"
      : "png";

    const key = makeKey("bg", ext);
    const uploaded = await uploadToR2(buffer, key, contentType);

    return NextResponse.json({
      url: uploaded.url,
      key: uploaded.key,
      width: generated.width,
      height: generated.height,
      prompt: generated.prompt,
    });
  } catch (err) {
    console.error("[/api/generate-bg] error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo generar el fondo.", detail: message },
      { status: 500 }
    );
  }
}
