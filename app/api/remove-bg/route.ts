import { NextRequest, NextResponse } from "next/server";
import { uploadToR2, makeKey } from "@/lib/r2";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // ─── AUTH + RATE LIMIT ──────────────────────────────────────────────
    // V8: este endpoint NO tenia auth → cualquiera podia llamarlo y vaciar
    // remove.bg ($0.18/call). Ahora exige sesion + rate limit (15/min).
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion para usar esta funcion" }, { status: 401 });
    }
    const limitRes = await checkRateLimit(supabase, user.id, "remove-bg");
    if (limitRes) return limitRes;

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

    // Validar que es una imagen real (magic number) + tamaño max 10MB
    // Anti: subir .exe disfrazado de .png para abusar de remove.bg
    const { validateImageFile } = await import("@/lib/inputValidation");
    const fileErr = await validateImageFile(file);
    if (fileErr) {
      return NextResponse.json({ error: fileErr }, { status: 400 });
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
    const r2 = await uploadToR2(resultBuf, key, "image/png");
    return NextResponse.json({
      url: r2.url,
      key: r2.key,
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
