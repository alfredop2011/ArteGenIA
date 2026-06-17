import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthorizedCron } from "@/lib/cronAuth";

export const runtime = "nodejs";
// Cron jobs no deben cachearse
export const dynamic = "force-dynamic";

/**
 * /api/cron/reset-credits — Reset mensual de créditos (Fase Z.6).
 *
 * Ejecuta la función SQL `reset_monthly_credits()` que:
 *   - Para cada user_credits con reset_at <= now():
 *     balance = LEAST(balance, 50) + monthly_grant  (rollover cap 50)
 *     reset_at = primer día del mes SIGUIENTE UTC
 *     last_reset_at = now()
 *
 * Schedule: día 1 de cada mes a las 03:00 UTC (`0 3 1 * *` en vercel.json).
 * Hora elegida para evitar pico de tráfico humano y dar margen si la
 * función tarda.
 *
 * SEGURIDAD:
 *   1. Vercel cron añade automáticamente el header `Authorization: Bearer
 *      <CRON_SECRET>` cuando configuras CRON_SECRET en env vars de Vercel.
 *   2. Verificamos ese secret (timing-safe). Sin él, cualquiera podría
 *      triggerear resets gratis a usuarios desde Internet.
 *   3. Sin fallback: exigimos siempre CRON_SECRET. El antiguo fallback al
 *      header `x-vercel-cron` se eliminó por ser trivialmente falsificable.
 *
 * IDEMPOTENTE: la función SQL solo afecta a usuarios con reset_at <= now().
 * Si por error el cron se ejecuta 2 veces el mismo día, la 2ª no hace nada
 * (porque el reset_at ya está actualizado al mes siguiente).
 *
 * MONITOREO: el endpoint devuelve { reset_users, reset_at } para que el
 * cron logger de Vercel registre cuántos usuarios se resetearon. Si el
 * número es 0 (y deberían haber sido N), revisar.
 */

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    console.warn("[cron/reset-credits] unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = adminClient();
    const { data, error } = await sb.rpc("reset_monthly_credits");

    if (error) {
      console.error("[cron/reset-credits] RPC error:", error);
      return NextResponse.json(
        { error: "Reset RPC failed", details: error.message },
        { status: 500 },
      );
    }

    console.log("[cron/reset-credits] success:", data);
    return NextResponse.json({
      ok: true,
      result: data,
      executed_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[cron/reset-credits] unhandled:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

/** POST handler para invocación manual desde el admin (testing en producción
 *  sin esperar al cron). Mismo gate de autorización. */
export async function POST(req: Request) {
  return GET(req);
}
