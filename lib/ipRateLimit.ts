import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Rate limit por IP para endpoints PÚBLICOS (sin auth): waitlist, feedback.
 *
 * Usa la tabla ip_rate_limit + RPC count_ip_rate_limit (service_role). Best-
 * effort anti-spam: registra cada hit y cuenta los recientes.
 *
 * FAIL-OPEN: si la migración no está aplicada o la RPC falla, NO bloqueamos
 * (preferimos no romper el formulario público). Igual criterio que rateLimit.ts.
 */

/** Extrae la IP del cliente de los headers de proxy (Vercel pone x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Devuelve true si la petición está PERMITIDA (y registra el hit), false si
 * excede el límite. `supabaseAdmin` debe ser un cliente service_role.
 */
export async function checkIpRateLimit(
  supabaseAdmin: SupabaseClient,
  ip: string,
  action: string,
  max: number,
  windowMinutes: number,
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.rpc("count_ip_rate_limit", {
      p_ip: ip,
      p_action: action,
      p_minutes: windowMinutes,
    });
    if (error) {
      console.warn(`[ipRateLimit] RPC error for ${action}:`, error.message);
      return true; // fail-open
    }
    const used = typeof data === "number" ? data : 0;
    if (used >= max) return false;

    // Registrar el hit (no await crítico, pero lo esperamos para que cuente).
    await supabaseAdmin.from("ip_rate_limit").insert({ ip, action });
    return true;
  } catch (e) {
    console.warn(`[ipRateLimit] excepción para ${action}:`, e instanceof Error ? e.message : e);
    return true; // fail-open
  }
}
