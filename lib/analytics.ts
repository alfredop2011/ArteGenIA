/**
 * Analytics events helper (Fase Z.9).
 *
 * Wrapper tipado encima de trackEvent (PostHog) con los 6 eventos clave del
 * roadmap. Si añades un evento nuevo, AÑÁDELO AQUÍ con su tipo de payload
 * para mantener consistencia y evitar drift en property keys.
 *
 * Eventos implementados:
 *   1. module_opened       — usuario abre un módulo IA
 *   2. module_completed    — módulo terminó OK (creditos consumidos, duración)
 *   3. module_abandoned    — usuario salió a mitad del flujo
 *   4. export_completed    — descarga finalizada (formato, créditos)
 *   5. credits_exhausted   — balance llegó a 0 tras intento de consume
 *   6. upgrade_clicked     — click en CTA upgrade (banner, modal, badge)
 *
 * Patrón: estos eventos son la fuente para el dashboard semanal de PostHog
 * (top módulos, conversion funnel free→pro, etc). Mantenerlos consistentes
 * con sus propiedades es CRÍTICO para que los insights se compongan bien.
 */

import { trackEvent } from "@/components/analytics/PostHogProvider";

/** Módulos trackeados (debe coincidir con CREDIT_COST modules). */
export type AnalyticsModule =
  | "quitar_fondo"
  | "quitar_fondo_hd"
  | "asistente_ia"
  | "generar_imagen_ia"
  | "capas_magicas"
  | "cambiar_fondo"
  | "quitar_objeto"
  | "mejorar_resolucion"
  | "variaciones_ia"
  | "editor"          // editor base (sin IA, gratis)
  | "plantillas"      // catálogo de templates
  | "asistente_chat"; // chat IA → flyer

/** De dónde se abrió el módulo (atribución de descubrimiento). */
export type ModuleSource =
  | "menu_nav"          // link en header/sidebar
  | "editor_sub_tool"   // tab dentro del editor
  | "homepage_cta"      // botón landing
  | "post_completion"   // tras terminar otra acción
  | "deep_link"         // URL directa (compartida)
  | "unknown";

/** Plan del usuario en el momento del evento. */
export type UserPlan = "free" | "pro" | "enterprise" | "anonymous";

// ─── 1. MODULE_OPENED ─────────────────────────────────────────────────
export function trackModuleOpened(payload: {
  module: AnalyticsModule;
  source: ModuleSource;
  plan: UserPlan;
  credits_remaining: number;
}) {
  trackEvent("module_opened", payload);
}

// ─── 2. MODULE_COMPLETED ──────────────────────────────────────────────
export function trackModuleCompleted(payload: {
  module: AnalyticsModule;
  credits_consumed: number;
  duration_seconds: number;
  result_size_mb?: number;
  plan: UserPlan;
}) {
  trackEvent("module_completed", payload);
}

// ─── 3. MODULE_ABANDONED ──────────────────────────────────────────────
export function trackModuleAbandoned(payload: {
  module: AnalyticsModule;
  step_reached: string;  // "upload" | "processing" | "preview" | "confirm_credit"
  seconds_before_leaving: number;
  plan: UserPlan;
}) {
  trackEvent("module_abandoned", payload);
}

// ─── 4. EXPORT_COMPLETED ──────────────────────────────────────────────
export function trackExportCompleted(payload: {
  format: "png" | "jpg" | "pdf" | "svg";
  credits_consumed: number;
  resolution?: "standard" | "4k";
  has_ai_layers: boolean;
  plan: UserPlan;
  source: "editor_desktop" | "editor_mobile" | "quitar_fondo";
}) {
  trackEvent("export_completed", payload);
}

// ─── 5. CREDITS_EXHAUSTED ─────────────────────────────────────────────
export function trackCreditsExhausted(payload: {
  attempted_module: AnalyticsModule | "download_png" | "download_pdf" | "download_svg";
  attempted_amount: number;
  current_balance: number;
  days_until_reset: number;
  plan: UserPlan;
}) {
  trackEvent("credits_exhausted", payload);
}

// ─── 6. UPGRADE_CLICKED ───────────────────────────────────────────────
export function trackUpgradeClicked(payload: {
  source:
    | "credits_exhausted_modal"
    | "credits_low_banner"
    | "header_badge"
    | "pricing_page"
    | "feature_gate"
    | "upgrade_cta_editor";
  current_plan: UserPlan;
  current_balance?: number;
  feature_attempted?: string;
}) {
  trackEvent("upgrade_clicked", payload);
}
