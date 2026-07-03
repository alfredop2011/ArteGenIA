// ═════════════════════════════════════════════════════════════════════
// CATÁLOGO DE MODELOS R2 — DANZA
//
// Cada modelo documenta:
//   - src          ruta relativa dentro del bucket R2
//   - crop         tipo de encuadre de la FOTO original (no del uso)
//   - orientation  solo / pareja / grupo
//   - slots        escala + Y recomendadas por rol en el layout
//
// Regla clave: fotos "half-body" (Profe-*) NO admiten scales ≥1.6 sin
// verse cortadas. Fotos "3/4-body" (perfiles _perfil) sí.
//
// Uso desde una plantilla:
//   { id: "artist", type: "image", ...model("damian-reyes", "hero", { x: 540 }) }
//
// Roles:
//   hero  → protagonista centrado grande (masterclass 1 solo, pareja centrada)
//   duo   → protagonista de pareja (2 personas)
//   mid   → 1 de 3-4 en composición coral
//   small → 1 de 5-6 en composición coral (estilo #15)
//   card  → dentro de un card en grid 2×2
// ═════════════════════════════════════════════════════════════════════

export type DanceModelCrop = "3/4-body" | "half-body" | "full-body" | "group";
export type DanceModelOrientation = "solo" | "couple" | "group";
export type DanceModelSlot = "hero" | "duo" | "mid" | "small" | "card";

type SlotConfig = { scaleX: number; scaleY: number; y: number };

export type DanceModel = {
  src: string;
  crop: DanceModelCrop;
  orientation: DanceModelOrientation;
  slots: Record<DanceModelSlot, SlotConfig>;
};

const R2_BASE = "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/";

// Perfiles 3/4-body (cabeza + torso + parte de las piernas) — soportan hero grande
const PROFILE_34: Record<DanceModelSlot, SlotConfig> = {
  hero:  { scaleX: 1.55, scaleY: 1.55, y: 90  },
  duo:   { scaleX: 1.20, scaleY: 1.20, y: 140 },
  mid:   { scaleX: 0.85, scaleY: 0.85, y: 220 },
  small: { scaleX: 0.42, scaleY: 0.42, y: 320 },
  card:  { scaleX: 0.50, scaleY: 0.50, y: 30  },
};

// Fotos half-body (Profe-*) — foto ya cortada al torso, hero debe ser MÁS pequeño
const HALF_BODY: Record<DanceModelSlot, SlotConfig> = {
  hero:  { scaleX: 1.30, scaleY: 1.30, y: 100 },
  duo:   { scaleX: 1.00, scaleY: 1.00, y: 160 },
  mid:   { scaleX: 0.70, scaleY: 0.70, y: 240 },
  small: { scaleX: 0.38, scaleY: 0.38, y: 340 },
  card:  { scaleX: 0.42, scaleY: 0.42, y: 40  },
};

// Parejas grandes (2MB, alta res) — soportan hero pero con Y más alto para respirar
const COUPLE_HIRES: Record<DanceModelSlot, SlotConfig> = {
  hero:  { scaleX: 1.20, scaleY: 1.20, y: 170 },
  duo:   { scaleX: 1.00, scaleY: 1.00, y: 200 },
  mid:   { scaleX: 0.72, scaleY: 0.72, y: 260 },
  small: { scaleX: 0.42, scaleY: 0.42, y: 480 },
  card:  { scaleX: 0.55, scaleY: 0.55, y: 30  },
};

// Pareja 07 (300KB, menor resolución) — usar más pequeño para no pixelar
const COUPLE_LORES: Record<DanceModelSlot, SlotConfig> = {
  hero:  { scaleX: 1.10, scaleY: 1.10, y: 180 },
  duo:   { scaleX: 0.90, scaleY: 0.90, y: 220 },
  mid:   { scaleX: 0.65, scaleY: 0.65, y: 270 },
  small: { scaleX: 0.40, scaleY: 0.40, y: 480 },
  card:  { scaleX: 0.50, scaleY: 0.50, y: 30  },
};

// Grupos completos (5+ personas) — solo se usan como sticker central
const GROUP: Record<DanceModelSlot, SlotConfig> = {
  hero:  { scaleX: 0.90, scaleY: 0.90, y: 250 },
  duo:   { scaleX: 0.80, scaleY: 0.80, y: 280 },
  mid:   { scaleX: 0.70, scaleY: 0.70, y: 300 },
  small: { scaleX: 0.55, scaleY: 0.55, y: 380 },
  card:  { scaleX: 0.55, scaleY: 0.55, y: 40  },
};

export const DANCE_MODELS: Record<string, DanceModel> = {
  "damian-reyes":  { src: "models/Dance/02_damian_reyes_perfil.png",  crop: "3/4-body",  orientation: "solo",   slots: PROFILE_34 },
  "nia-batista":   { src: "models/Dance/03_nia_batista_perfil.png",   crop: "3/4-body",  orientation: "solo",   slots: PROFILE_34 },
  "malik-santos":  { src: "models/Dance/04_malik_santos_perfil.png",  crop: "3/4-body",  orientation: "solo",   slots: PROFILE_34 },
  "valentina-damian": { src: "models/Dance/05_valentina_damian_pareja.png", crop: "3/4-body", orientation: "couple", slots: COUPLE_HIRES },
  "isabela-alejandro": { src: "models/Dance/06_isabela_alejandro_pareja.png", crop: "3/4-body", orientation: "couple", slots: COUPLE_HIRES },
  "lucia-mateo":   { src: "models/Dance/07_lucia_mateo_pareja.png",   crop: "3/4-body",  orientation: "couple", slots: COUPLE_LORES },
  "profe-anamaria": { src: "models/Dance/Profe-baileAnamaria.png",    crop: "half-body", orientation: "solo",   slots: HALF_BODY },
  "profe-jean":    { src: "models/Dance/Profe-jean.png",              crop: "half-body", orientation: "solo",   slots: HALF_BODY },
  "grupo-elena":   { src: "models/Dance/Profesores_Baile_Urbano_Latino_Elena-grupales.png", crop: "group", orientation: "group", slots: GROUP },
  "grupo-marco":   { src: "models/Dance/Profesores_Baile_Urbano_Latino_Marco_grupales.png", crop: "group", orientation: "group", slots: GROUP },
};

/**
 * Devuelve el bloque de campos comunes (src, scaleX, scaleY, y) para insertar
 * en un layer type:"image", con overrides opcionales de x/originX/etc.
 *
 * Uso:
 *   { id: "artist", type: "image", ...danceModel("damian-reyes", "hero", { x: 540, originX: "center", originY: "top" }) }
 */
export function danceModel(
  modelId: keyof typeof DANCE_MODELS,
  slot: DanceModelSlot,
  overrides: Record<string, unknown> = {},
) {
  const model = DANCE_MODELS[modelId];
  if (!model) throw new Error(`danceModel(): id "${modelId}" no existe en DANCE_MODELS`);
  const { scaleX, scaleY, y } = model.slots[slot];
  return {
    src: `${R2_BASE}${model.src}`,
    scaleX,
    scaleY,
    y,
    ...overrides,
  };
}
