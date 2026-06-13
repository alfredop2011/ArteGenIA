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
    photo_to_template: 3,
  },
  pro: {
    segment_person: -1,
    segment_person_hd: -1,
    photo_to_template: 20,
  },
  enterprise: {
    segment_person: -1,
    segment_person_hd: -1,
    photo_to_template: 100,
  },
};

/** Coste estimado en USD por llamada — solo para auditoría/analytics.
 *  No se cobra al usuario, sirve para monitorizar el gasto real. */
export const COST_PER_ACTION_USD: Record<AIAction, number> = {
  segment_person: 0.04,
  segment_person_hd: 0.08,
  photo_to_template: 0.02,
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
