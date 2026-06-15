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

    // SAM-2 segmentación con point prompt. "label: 1" significa positive point
    // → segmenta el objeto que CONTIENE este punto. Devuelve combined_mask
    // (PNG blanco/negro) + individual_masks (uno por objeto, aquí solo 1).
    const result = await fal.subscribe("fal-ai/sam2/image", {
      input: {
        image_url: uploadUrl,
        prompts: [{ x: Math.round(x), y: Math.round(y), label: "1" }],
      },
      logs: false,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (result as any)?.data;
    const maskUrl =
      data?.combined_mask?.url ??
      data?.individual_masks?.[0]?.url ??
      data?.mask?.url ??
      data?.masks?.[0]?.url;

    if (!maskUrl) {
      console.error("[magic-erase] respuesta inesperada de SAM:", JSON.stringify(data).slice(0, 500));
      throw new Error("SAM-2 no devolvió máscara");
    }

    return NextResponse.json({ maskUrl });
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
    return NextResponse.json({ error: "No se pudo aplicar el borrador mágico", detail: msg }, { status: 500 });
  }
}
