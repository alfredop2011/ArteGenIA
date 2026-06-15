import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { consumeCredits, CREDIT_COST, type CreditModule } from "@/lib/credits";

/**
 * POST /api/credits/consume — descuenta créditos del balance.
 *
 * Body: { module: "download_png" | "quitar_fondo" | ..., meta?: object }
 *
 * Response 200: { success: true, balance: 22, consumed: 1 }
 * Response 402: { success: false, balance: 0, required: 1, error: "insufficient_credits" }
 * Response 400: { error: "módulo desconocido" }
 *
 * Usado por el cliente ANTES de ejecutar acciones que consumen (ej. descargas).
 * Las acciones IA NO usan este endpoint — consumen directamente desde su
 * propio endpoint (más eficiente, evita 2 round-trips). Este es solo para
 * acciones client-side puras (descarga local de un archivo).
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({})) as { module?: string; meta?: Record<string, unknown> };
    const moduleKey = body.module as CreditModule | undefined;
    if (!moduleKey || !(moduleKey in CREDIT_COST)) {
      return NextResponse.json(
        { error: `módulo inválido: ${moduleKey}` },
        { status: 400 },
      );
    }
    const result = await consumeCredits(supabase, user.id, moduleKey, body.meta ?? {});
    if (!result.success) {
      return NextResponse.json(result, { status: 402 }); // 402 Payment Required
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[credits/consume POST]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
