// ════════════════════════════════════════════════════════════════════════════
//  FEATURE FLAGS
//
//  Sistema simple de flags estaticos para ocultar funcionalidad sin borrarla.
//  Util para esconder features del MVP que estan implementadas pero generan
//  fricción cognitiva (e.g. panel de capas, brand kit, favorites).
//
//  Filosofia: borrar codigo cuando una feature deja de aportar tras 6+ meses.
//  Hasta entonces, feature flag para poder revivir si llega usuario power.
//
//  Activacion alternativa: URL param `?advanced=1` o role admin pueden
//  habilitar features hidden — esto se decide en cada componente consumidor.
//
//  No hay UI para cambiar flags — son constantes. Si necesitas A/B, usa
//  PostHog/GrowthBook con variantes.
// ════════════════════════════════════════════════════════════════════════════

export const FEATURES = {
  /**
   * Panel de capas (LayersPanel) en el editor.
   * Hidden en MVP porque confunde a no-tecnicos. Z-order accesible desde
   * floating toolbar contextual ya cubre el 99% de casos.
   * Reactivar si: telemetria muestra >5% usuarios buscando "ordenar capas"
   * o feedback explicito de power users.
   */
  layersPanel: false,

  /**
   * Tab "Mi marca" en sidebar — guardar logos, colores, fuentes corporativas.
   * Hidden porque requiere flujo de carga previo (sin valor sin assets).
   * Reactivar tras: tabla brand_assets en DB + UI de subida.
   */
  brandKit: false,

  /**
   * Tab "Favoritos" en sidebar — plantillas guardadas por el usuario.
   * Hidden porque requiere tabla favorites en Supabase (no creada).
   * Reactivar tras: migrar tabla + add boton corazon funcional.
   */
  favorites: false,

  /**
   * Panel "Elementos" separado en sidebar (shapes sueltas).
   * Hidden porque solapa con "Imagenes" — el usuario no distingue entre
   * "elemento" (forma) e "imagen" (foto). Unificamos en Imagenes.
   */
  elementsTab: false,

  /**
   * Tab "Fondo" separado en sidebar.
   * Hidden porque ya se puede editar via click directo en el fondo del
   * canvas (floating toolbar contextual lo detecta como type=background).
   */
  backgroundTab: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/** Helper conveniente: useFeature("layersPanel") devuelve boolean. */
export function useFeature(flag: FeatureFlag): boolean {
  return FEATURES[flag];
}
