import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, makeKey } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "REMOVE_BG_API_KEY no configurada." },
        { status: 500 }
      );
    }

    const inForm = await req.formData();
    const file = inForm.get("image_file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Falta el archivo 'image_file' en el FormData." },
        { status: 400 }
      );
    }

    // 1) Llamada a remove.bg
    const arrayBuf = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuf);

    const outForm = new FormData();
    outForm.append(
      "image_file",
      new Blob([imageBuffer], { type: file.type || "image/png" }),
      file.name || "image.png"
    );
    outForm.append("size", "auto");
    outForm.append("format", "png"); // PNG para preservar transparencia

    const removeBgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: outForm,
    });

    if (!removeBgRes.ok) {
      const errText = await removeBgRes.text();
      console.error("[remove-bg] error:", removeBgRes.status, errText);
      return NextResponse.json(
        {
          error: "remove.bg falló.",
          status: removeBgRes.status,
          detail: errText,
        },
        { status: 502 }
      );
    }

    // 2) Subir a R2
    const resultBuf = Buffer.from(await removeBgRes.arrayBuffer());
    const key = makeKey("artist", "png");
    const uploaded = await uploadToR2(resultBuf, key, "image/png");

    return NextResponse.json({
      url: uploaded.url,
      key: uploaded.key,
    });
  } catch (err) {
    console.error("[/api/remove-bg] error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo procesar la imagen.", detail: message },
      { status: 500 }
    );
  }
}
