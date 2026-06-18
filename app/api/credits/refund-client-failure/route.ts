/**
 * /api/credits/refund-client-failure — Refund cuando el cliente NO pudo
 * renderizar el resultado de una IA aunque el server cobró el crédito.
 *
 * Caso de uso típico (UX#21 follow-up del re-audit panel 2026-06-18):
 *
 *   Quitar fondo desktop → /api/remove-bg cobra 1 crédito y devuelve URL R2
 *   → cliente hace Fabric `setSrc(url, { crossOrigin: "anonymous" })`
 *   → si CORS de R2 está mal (problema documentado en AGENTS.md),
 *     setSrc lanza y el usuario nunca ve el fondo quitado, pero pagó.
 *
 * El refund automático en /api/remove-bg solo cubre fallos server-side.
 * Para fallos client-side post-200 necesitamos este endpoint dedicado.
 *
 * SEGURIDAD: rate limit estricto (3/min) + log siempre. Si un user
 * malicioso intenta abusar, lo detectamos en credit_transactions
 * filtrando por reason='refund:client_*' y user_id concreto.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { addCredits, CREDIT_COST, type CreditModule } from "@/lib/credits";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Rate limit anti-abuso: max 3 refunds/min por user.
    // Suficiente para casos legítimos en ráfaga (user reintenta CORS varias veces)
    // pero detecta el abuso obvio.
    const rl = await checkRateLimit(supabase, user.id, "refund-client-failure");
    if (rl) return rl;

    const body = await req.json().catch(() => ({}));
    const creditModule = body.module as CreditModule | undefined;
    const reason = String(body.reason || "client-render-failure").slice(0, 200);

    if (!creditModule || !(creditModule in CREDIT_COST)) {
      return NextResponse.json(
        { error: "module inválido", got: creditModule, allowed: Object.keys(CREDIT_COST) },
        { status: 400 },
      );
    }

    const cost = CREDIT_COST[creditModule];
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    await addCredits(
      supabaseAdmin,
      user.id,
      cost,
      `refund:client_${creditModule}`,
      { reason, ts: new Date().toISOString() },
    );

    console.log(
      `[refund-client-failure] user=${user.id} module=${creditModule} cost=${cost} reason="${reason}"`,
    );

    return NextResponse.json({ refunded: cost, module: creditModule });
  } catch (err) {
    console.error("[refund-client-failure] error inesperado:", err);
    return NextResponse.json(
      { error: "Error procesando refund", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
