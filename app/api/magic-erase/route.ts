import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";
import { consumeCredits, addCredits, CREDIT_COST } from "@/lib/credits";

export const runtime = "nodejs";
export const maxDuration = 30;

if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
}

/**
 * /api/magic-erase — Borrador mágico (Fase Z.17).
 *
 * Recibe una imagen + 1 punto (x, y). Llama a SAM-2 con point prompt para
 * segmentar el objeto bajo el punto y devuelve la URL de la MÁSCARA (PNG
 * negro/blanco). El cliente aplica esa máscara como "destination-out" sobre
 * el canvas para borrar el objeto.
 *
 *   Input: FormData { image_file: File, point_x: number, point_y: number }
 *   Output: { maskUrl: string }
 *
 * Coste IA: $0.005 (SAM-2 image). Cargamos 1 crédito (4× margin).
 * Refund automático Z.13 si SAM falla post-consume.
 */
export async function POST(req: Request) {
  let supabaseForRefund: Awaited<ReturnType<typeof createSupabaseServerClient>> | null = null;
  let userIdForRefund: string | null = null;
  let creditConsumed = false;

  try {
    const supabase = await createSupabaseServerClient();
    supabaseForRefund = supabase;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión para usar esta función" }, { status: 401 });
    }
    userIdForRefund = user.id;

    const limitRes = await checkRateLimit(supabase, user.id, "magic-erase");
    if (limitRes) return limitRes;

    const form = await req.formData();
    const file = form.get("image_file");
    const x = Number(form.get("point_x"));
    const y = Number(form.get("point_y"));
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Falta image_file" }, { status: 400 });
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return NextResponse.json({ error: "Falta point_x / point_y" }, { status: 400 });
    }
    const { validateImageFile } = await import("@/lib/inputValidation");
    const fileErr = await validateImageFile(file);
    if (fileErr) return NextResponse.json({ error: fileErr }, { status: 400 });

    // Consume crédito ANTES de llamar a SAM (refund automático si falla)
    const creditResult = await consumeCredits(supabase, user.id, "borrador_magico");
    if (!creditResult.success) {
      return NextResponse.json(
        {
          error: "Sin créditos suficientes para Borrador mágico",
          code: "INSUFFICIENT_CREDITS",
          balance: creditResult.balance,
          required: creditResult.required,
        },
        { status: 402 },
      );
    }
    creditConsumed = true;

    // Subir imagen al storage de Fal (URL temporal)
    const buffer = Buffer.from(await file.arrayBuffer());
    const falFile = new File([buffer], file.name || "input.png", { type: file.type || "image/png" });
    const uploadUrl = await fal.storage.upload(falFile);

    // Z.19.2 — SAM-2 image con apply_mask=true. SAM-3 image devolvió todo
    // null con point_prompts (parece requerir text prompt obligatorio).
    // SAM-2 es el modelo ORIGINAL diseñado para click-to-segment puro:
    // acepta `prompts: [{x, y, label}]` y devuelve la imagen con la mask
    // aplicada en `data.image`.
    let samResult;
    try {
      samResult = await fal.subscribe("fal-ai/sam2/image", {
        input: {
          image_url: uploadUrl,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prompts: [{ x: Math.round(x), y: Math.round(y), label: 1 } as any],
          apply_mask: true,
          output_format: "png",
        },
        logs: false,
      });
    } catch (falErr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = falErr as any;
      const detail = e?.body?.detail ?? e?.body?.message ?? e?.body ?? e?.message ?? String(falErr);
      console.error("[magic-erase] Fal.ai SAM-2 falló:", JSON.stringify({
        status: e?.status,
        body: e?.body,
        message: e?.message,
        x: Math.round(x), y: Math.round(y),
      }, null, 2));
      throw new Error(`Fal.ai SAM-2: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
    }

    // SAM-3 output: el SDK Fal a veces wrappea en .data, otras devuelve
    // directo. Probamos ambos. Y dumpeamos el JSON entero si falla.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const root: any = samResult;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = root?.data ?? root;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m0: any = data?.masks?.[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const img: any = data?.image;
    const maskUrl =
      (typeof img === "string" ? img : null) ??
      img?.url ??
      img?.image?.url ??
      (typeof m0 === "string" ? m0 : null) ??
      m0?.url ??
      m0?.image?.url ??
      (typeof data?.url === "string" ? data.url : null);

    console.log("[magic-erase] SAM-3 raw result:", JSON.stringify(samResult).slice(0, 1000));

    if (!maskUrl) {
      // Dump del JSON entero al cliente para ver el shape real
      const dump = JSON.stringify(samResult).slice(0, 800);
      throw new Error(`SAM-3 sin maskUrl. dump=${dump}`);
    }

    // Z.18 — Descargar mask de Fal y devolverla como BINARY response.
    // Same-origin (cliente.vercel.app → cliente.vercel.app/api/magic-erase),
    // sin CORS issues, sin dependencia del CORS policy de R2, sin storage
    // acumulado. El cliente hace blob() y URL.createObjectURL.
    const maskRes = await fetch(maskUrl);
    if (!maskRes.ok) {
      throw new Error(`No se pudo descargar mask de Fal: HTTP ${maskRes.status}`);
    }
    const maskArrayBuffer = await maskRes.arrayBuffer();
    return new Response(maskArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[magic-erase] error:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (creditConsumed && supabaseForRefund && userIdForRefund) {
      try {
        await addCredits(
          supabaseForRefund, userIdForRefund, CREDIT_COST.borrador_magico,
          "refund:magic-erase_error",
          { detail: msg.slice(0, 200) },
        );
        console.log(`[magic-erase] refund automático para user ${userIdForRefund}`);
      } catch (refundErr) {
        console.error("[magic-erase] refund FALLÓ — revisar manual:", refundErr);
      }
    }
    // Devolver el detail al cliente para que pueda mostrarlo en lugar de 500 genérico
    return NextResponse.json({ error: msg, detail: msg }, { status: 500 });
  }
}
