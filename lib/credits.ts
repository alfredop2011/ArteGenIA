/**
 * Sistema de créditos unificado (Fase Z.1).
 *
 * Reemplaza el modelo de cuotas individuales por acción (10/mes de X, 50/mes
 * de Y) por un balance ÚNICO de créditos que cada acción IA o descarga consume.
 *
 * Por plan:
 *   Free       =  30 créditos/mes
 *   Pro        = 250 créditos/mes (rollover hasta 50)
 *   Enterprise = 2000 créditos/mes (fair use)
 *
 * Reset: día 1 cada mes UTC (cron).
 *
 * Mapeo módulo → créditos: ver CREDIT_COST abajo. Es la SINGLE SOURCE OF
 * TRUTH para todos los componentes y endpoints.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Catálogo de costes por módulo ─────────────────────────────────────
// Lo que cuesta cada acción. Si añades un módulo IA, AÑÁDELO AQUÍ y
// el badge + modal + balance se ajustan solos.
export const CREDIT_COST = {
  // IA — generación / segmentación
  quitar_fondo: 1,
  quitar_fondo_hd: 3,
  asistente_ia: 1,            // por mensaje
  generar_imagen_ia: 2,       // Flux
  capas_magicas: 2,
  cambiar_fondo: 2,
  quitar_objeto: 2,
  mejorar_resolucion: 2,
  variaciones_ia: 6,          // 4 variantes Flux
  // Descargas (Fase Z.1 — política "todas las descargas consumen")
  download_png: 1,
  download_jpg: 1,
  download_png_4k: 2,
  download_pdf: 3,
  download_svg: 3,
} as const;

export type CreditModule = keyof typeof CREDIT_COST;

// ─── Granted credits por plan ──────────────────────────────────────────
// Cuántos créditos se otorgan al inicio de cada mes según plan.
// SINGLE SOURCE OF TRUTH del producto. Para cambiar política, edita
// aquí + corre migration de UPDATE en producción.
//
// Política de margen (Z.4 — decisión user):
//   "Precio crédito = 4× coste real (1 IA + 1 mantenimiento + 2 ganancia)"
//
// Matemática (1 crédito = $0.025 coste interno):
//   Pro 9,99€   → $10.46 neto Stripe → 4× coste = $0.025 × 4 = $0.10/cr
//                 $10.46 / $0.10 = 105 → redondear a 100 (precio cr $0.105)
//   Enterprise 34,99€ → $36.65 neto → $36.65 / $0.10 = 366 → 350 créditos
//   Free → gratis, sin margen aplicable
//
// Margen efectivo Pro (con 100 créditos):
//   - Peor caso (variaciones IA 6cr = $0.16): 100/6 = 16 paquetes ×
//     $0.16 = $2.56 coste vs $10.46 = 75% margen
//   - Caso promedio (mix de uso): ~$1.50 coste = 86% margen
//
// Free = 10 créditos = 5 fotos sin fondo (decisión user previa Z.2).
export const MONTHLY_GRANT: Record<string, number> = {
  free: 10,
  pro: 100,
  enterprise: 350,
};

// Rollover cap: cuántos créditos sin usar se mantienen al pasar al mes
// siguiente. Free = 0 (use it or lose it). Pro/Enterprise = 50.
export const ROLLOVER_CAP: Record<string, number> = {
  free: 0,
  pro: 50,
  enterprise: 50,
};

// ─── Shape de respuesta de las funciones SQL ───────────────────────────

export type ConsumeResult =
  | { success: true; balance: number; consumed: number }
  | { success: false; balance: number; required: number; error: "insufficient_credits" };

export type CreditsBalance = {
  balance: number;
  monthlyGrant: number;
  resetAt: string;
};

// ─── Funciones públicas ────────────────────────────────────────────────

/** Consume créditos atómicamente. Devuelve success=false si no hay suficientes
 *  (no falla — el caller decide cómo mostrar el error al usuario).
 *
 *  Uso típico:
 *    const result = await consumeCredits(supabase, user.id, "quitar_fondo");
 *    if (!result.success) return { error: "Sin créditos", balance: result.balance };
 *    // ... ejecuta la acción IA
 */
export async function consumeCredits(
  supabase: SupabaseClient,
  userId: string,
  module: CreditModule,
  meta: Record<string, unknown> = {},
): Promise<ConsumeResult> {
  const amount = CREDIT_COST[module];
  if (typeof amount !== "number") {
    throw new Error(`Módulo desconocido: ${module}`);
  }
  const { data, error } = await supabase.rpc("consume_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_module: module,
    p_meta: meta,
  });
  if (error) {
    console.error("[credits.consume] RPC error:", error);
    throw new Error(`consume_credits failed: ${error.message}`);
  }
  return data as ConsumeResult;
}

/** Devuelve el balance actual del usuario. Si no tiene row aún, devuelve
 *  los valores Free por defecto (la trigger debería haber creado la row,
 *  esto es un fallback seguro). */
export async function getCreditsBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<CreditsBalance> {
  const { data, error } = await supabase
    .from("user_credits")
    .select("balance, monthly_grant, reset_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error("[credits.balance] SELECT error:", error);
    throw new Error(`getCreditsBalance failed: ${error.message}`);
  }
  if (!data) {
    return {
      balance: MONTHLY_GRANT.free,
      monthlyGrant: MONTHLY_GRANT.free,
      resetAt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)).toISOString(),
    };
  }
  return {
    balance: data.balance,
    monthlyGrant: data.monthly_grant,
    resetAt: data.reset_at,
  };
}

/** Añade créditos (refund por acción fallida, topup, ajuste manual). */
export async function addCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  reason: string,
  meta: Record<string, unknown> = {},
): Promise<{ success: boolean; balance: number }> {
  const { data, error } = await supabase.rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_meta: meta,
  });
  if (error) {
    console.error("[credits.add] RPC error:", error);
    throw new Error(`add_credits failed: ${error.message}`);
  }
  return data as { success: boolean; balance: number };
}

/** Calcula días hasta el próximo reset. Útil para UI: "Te quedan 12 días". */
export function daysUntilReset(resetAt: string): number {
  const ms = new Date(resetAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
