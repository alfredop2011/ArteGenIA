import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Rate limit anti-burst usando la tabla ai_usage de Supabase.
 *
 * Por que reusamos ai_usage:
 *  - Ya existe y se inserta despues de cada operacion IA exitosa
 *  - Tiene user_id, action, created_at → suficiente para contar bursts
 *  - No requiere Redis ni servicio externo (un menos servicio que mantener)
 *
 * Tradeoff: la cuenta se hace via Postgres → ~10-20ms de latencia extra
 * por request. Aceptable para endpoints de IA (que tardan 2-30s de todos
 * modos). Si en el futuro tenemos endpoints HTTP simples que necesiten
 * rate limit, mover a Upstash Redis.
 */

export type RateLimitConfig = {
  /** Numero maximo de llamadas en la ventana */
  max: number;
  /** Ventana en minutos */
  windowMinutes: number;
};

/** Limites por defecto por accion. Ajustar segun cuanto cuesta cada IA. */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Recortar persona — caro ($0.005-0.015), max 5 por minuto
  "segment-person":     { max: 5,  windowMinutes: 1 },
  "segment-person-hd":  { max: 3,  windowMinutes: 1 },
  // Generar fondo — moderado, max 10 por minuto
  "generate-bg":        { max: 10, windowMinutes: 1 },
  // Eliminar fondo — barato pero limita scraping
  "remove-bg":          { max: 15, windowMinutes: 1 },
  // Refinement HD — caro
  "refine-hd":          { max: 5,  windowMinutes: 1 },
  // Chat wizard (parse prompt) — texto, mas barato
  "chat-wizard":        { max: 30, windowMinutes: 1 },
  "parse-prompt":       { max: 30, windowMinutes: 1 },
  // Remix IA — Haiku, barato, generoso
  "remix-ai":           { max: 20, windowMinutes: 1 },
  // Compartir: sube PNG a R2 — protege storage
  "share-upload":       { max: 15, windowMinutes: 1 },
  // Subir flyer de evento (organizador) a R2 — protege storage
  "event-flyer-upload": { max: 20, windowMinutes: 1 },
  // Asistente IA — Claude Haiku, barato
  "assistant-ai":       { max: 10, windowMinutes: 1 },
  // Generar flyer — Flux schnell ($0.003), pero limita scraping/abuso
  "generate-flyer":     { max: 10, windowMinutes: 1 },
  // Capas mágicas — Claude Sonnet + SAM-3, caro ($0.04+)
  "photo-to-template":  { max: 5,  windowMinutes: 1 },
};

/**
 * Chequea rate limit. Si excede, devuelve NextResponse 429 (caller debe
 * retornarla). Si pasa, devuelve null.
 *
 * Uso:
 *   const limitRes = await checkRateLimit(supabase, user.id, "segment-person");
 *   if (limitRes) return limitRes;
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  action: string,
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[action];
  if (!config) {
    // Accion no configurada → no aplicar limite (fail-open).
    // Si quieres fail-close (mas seguro pero rompe llamadas a acciones nuevas),
    // descomenta: return NextResponse.json({ error: "Rate limit no configurado" }, { status: 503 });
    return null;
  }

  const { data, error } = await supabase.rpc("count_ai_usage_last_minutes", {
    p_user_id: userId,
    p_action: action,
    p_minutes: config.windowMinutes,
  });

  if (error) {
    // Si la RPC falla (ej. migration aun no aplicada), NO bloqueamos al
    // usuario — preferimos fail-open a romper el producto. Log para detectar.
    console.warn(`[rateLimit] RPC error for ${action}:`, error.message);
    return null;
  }

  const used = typeof data === "number" ? data : 0;
  if (used >= config.max) {
    return NextResponse.json(
      {
        error: "rate_limit_exceeded",
        message: `Has hecho demasiadas peticiones. Espera ${config.windowMinutes} ${config.windowMinutes === 1 ? "minuto" : "minutos"} antes de volver a intentar.`,
        retryAfter: config.windowMinutes * 60,
        limit: config.max,
        windowMinutes: config.windowMinutes,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(config.windowMinutes * 60),
          "X-RateLimit-Limit": String(config.max),
          "X-RateLimit-Window": `${config.windowMinutes}m`,
        },
      },
    );
  }

  return null;
}
