/**
 * Cuotas centralizadas de uso de IA por plan.
 *
 * Cada acción AI tiene un nombre canónico (string que también se guarda en
 * la columna `action` de la tabla `ai_usage`). Las cuotas son por mes
 * natural (UTC). -1 significa ilimitado.
 *
 * Cuando añadas una nueva acción IA:
 *  1. Añade la entry aquí en los 3 planes.
 *  2. En el endpoint usa `assertWithinQuota(supabase, userId, action)`
 *     antes de llamar al modelo.
 *  3. Tras la llamada exitosa, `recordUsage(supabase, userId, action, cost)`
 *     para que el counter del header refleje el uso.
 *
 * NO bloquees usuarios Enterprise por error humano — siempre fallback a
 * límites generosos si el plan no se reconoce.
 */

export type AIAction =
  // Quitar fondo (Fal SAM-2 segmentación)
  | "segment_person"
  // Quitar fondo HD (Fal SAM-2 + refine)
  | "segment_person_hd"
  // Convertir foto en flyer editable (Claude Haiku visión + Florence-2 detection)
  | "photo_to_template";

export type PlanName = "free" | "pro" | "enterprise";

/** Cuotas mensuales por plan. -1 = ilimitado. */
export const QUOTA_PER_PLAN: Record<PlanName, Record<AIAction, number>> = {
  free: {
    segment_person: 10,
    segment_person_hd: 3,
    // Capas Mágicas: ajustado para calidad alta (Sonnet 4.6 + color sampling
    // + overlap validation ≈ $0.18/uso). Free es zanahoria de conversión.
    photo_to_template: 2,
  },
  pro: {
    segment_person: -1,
    segment_person_hd: -1,
    photo_to_template: 15,
  },
  enterprise: {
    segment_person: -1,
    segment_person_hd: -1,
    photo_to_template: 60,
  },
};

/** Coste estimado en USD por llamada — solo para auditoría/analytics.
 *  No se cobra al usuario, sirve para monitorizar el gasto real. */
export const COST_PER_ACTION_USD: Record<AIAction, number> = {
  // BiRefNet vía Fal.ai (reemplaza remove.bg $0.18, 7× más barato)
  segment_person: 0.025,
  // BiRefNet + Bria refinement HD
  segment_person_hd: 0.06,
  // Sonnet 4.6 visión ($0.036 medido) + Florence-2 ($0.005) + sharp local
  // Sonnet 4.6 visión ($0.036) + Florence-2 ($0.005) + Flux Fill inpainting ($0.04)
  photo_to_template: 0.09,
};

/** Devuelve la cuota mensual de un (plan, action). Si el plan no se
 *  reconoce, cae a 'free' para evitar accidentes. */
export function getQuota(plan: string | null | undefined, action: AIAction): number {
  const p = (plan as PlanName) ?? "free";
  return QUOTA_PER_PLAN[p]?.[action] ?? QUOTA_PER_PLAN.free[action];
}

/** ¿Esta acción es ilimitada para este plan? */
export function isUnlimited(plan: string | null | undefined, action: AIAction): boolean {
  return getQuota(plan, action) === -1;
}
