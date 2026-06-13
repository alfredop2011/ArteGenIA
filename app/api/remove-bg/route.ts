import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { uploadToR2, makeKey } from "@/lib/r2";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;

if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
}

/**
 * /api/remove-bg — Elimina el fondo de una imagen.
 *
 * MOTOR PRINCIPAL: BiRefNet vía Fal.ai (~$0.025/llamada, MIT license,
 * calidad ~85-95% vs remove.bg).
 *
 * FALLBACK: remove.bg ($0.18/llamada) si BiRefNet falla por cualquier
 * motivo (cuota Fal, modelo down, error inesperado). Solo se activa si
 * REMOVE_BG_API_KEY está configurada como red de seguridad.
 *
 * Migración por Decisión de junio 2026 tras research: BiRefNet es 4-7×
 * más barato con calidad equivalente para el caso de uso de flyers
 * (personas, productos, objetos con bordes claros).
 *
 * Mantiene el signature de entrada/salida del endpoint original para
 * cero cambios en el frontend.
 *   Input:  FormData { image_file: File }
 *   Output: { url: string, key: string }
 */
export async function POST(req: NextRequest) {
  try {
    // ─── AUTH + RATE LIMIT ──────────────────────────────────────────────
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion para usar esta funcion" }, { status: 401 });
    }
    const limitRes = await checkRateLimit(supabase, user.id, "remove-bg");
    if (limitRes) return limitRes;

    // ─── PARSE + VALIDAR ────────────────────────────────────────────────
    const inForm = await req.formData();
    const file = inForm.get("image_file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Falta el archivo 'image_file' en el FormData." },
        { status: 400 },
      );
    }
    const { validateImageFile } = await import("@/lib/inputValidation");
    const fileErr = await validateImageFile(file);
    if (fileErr) {
      return NextResponse.json({ error: fileErr }, { status: 400 });
    }

    // ─── MOTOR PRINCIPAL: BiRefNet vía Fal.ai ───────────────────────────
    // Buffer común para BiRefNet y fallback
    const arrayBuf = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuf);

    let resultBuf: Buffer | null = null;
    let motorUsado: "birefnet" | "remove-bg" = "birefnet";

    if (process.env.FAL_KEY) {
      try {
        // 1. Subir imagen al storage de Fal para obtener URL pública temporal
        const falFile = new File(
          [imageBuffer],
          file.name || "input.png",
          { type: file.type || "image/png" },
        );
        const uploadUrl = await fal.storage.upload(falFile);

        // 2. Llamar BiRefNet. El endpoint v2 acepta variants: General (default)
        //    es el más rápido y compatible con la mayoría de casos.
        const result = await fal.subscribe("fal-ai/birefnet/v2", {
          input: {
            image_url: uploadUrl,
            // Modelo "General" para flyers/personas/objetos genéricos.
            // Alternativas: "Portrait" (más fino con personas) — más lento.
            model: "General Use (Light)",
            output_format: "png",
            output_mask: false,
          },
          logs: false,
        });

        // 3. Descargar resultado
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (result as any)?.data;
        const outUrl = data?.image?.url ?? data?.output_image?.url;
        if (typeof outUrl !== "string") {
          throw new Error("BiRefNet no devolvió URL de imagen");
        }
        const dlRes = await fetch(outUrl);
        if (!dlRes.ok) {
          throw new Error(`No se pudo descargar resultado BiRefNet: ${dlRes.status}`);
        }
        resultBuf = Buffer.from(await dlRes.arrayBuffer());
      } catch (e) {
        console.warn("[remove-bg] BiRefNet falló, intentando fallback remove.bg:", e instanceof Error ? e.message : e);
        // Caer al fallback abajo
      }
    } else {
      console.warn("[remove-bg] FAL_KEY no configurada, usando remove.bg directo");
    }

    // ─── FALLBACK: remove.bg ────────────────────────────────────────────
    if (!resultBuf && process.env.REMOVE_BG_API_KEY) {
      motorUsado = "remove-bg";
      const outForm = new FormData();
      outForm.append(
        "image_file",
        new Blob([imageBuffer], { type: file.type || "image/png" }),
        file.name || "image.png",
      );
      outForm.append("size", "auto");
      outForm.append("format", "png");

      const removeBgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY },
        body: outForm,
      });
      if (!removeBgRes.ok) {
        const errText = await removeBgRes.text();
        console.error("[remove-bg] fallback remove.bg también falló:", removeBgRes.status, errText);
        return NextResponse.json(
          { error: "No se pudo procesar la imagen (motor IA no disponible)", detail: errText },
          { status: 502 },
        );
      }
      resultBuf = Buffer.from(await removeBgRes.arrayBuffer());
    }

    if (!resultBuf) {
      return NextResponse.json(
        { error: "No hay motor de IA configurado (FAL_KEY o REMOVE_BG_API_KEY)" },
        { status: 503 },
      );
    }

    // ─── SUBIR A R2 ─────────────────────────────────────────────────────
    const key = makeKey("artist", "png");
    const r2 = await uploadToR2(resultBuf, key, "image/png");

    return NextResponse.json({
      url: r2.url,
      key: r2.key,
      // Telemetría útil para debugging — el frontend lo ignora
      _engine: motorUsado,
    });
  } catch (err) {
    console.error("[/api/remove-bg] error:", err);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo procesar la imagen.", detail: message },
      { status: 500 },
    );
  }
}
