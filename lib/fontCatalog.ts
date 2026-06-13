/**
 * Catálogo de Google Fonts disponibles en ArteGenIA + font matching
 * heurístico desde la descripción que devuelve Claude Sonnet 4.6 visión.
 *
 * Estas fuentes están precargadas en app/layout.tsx vía Google Fonts CDN
 * (font-display: swap). Cuando añadas una fuente aquí, AÑÁDELA TAMBIÉN
 * al <link href="...family=..."> del layout.tsx — si no, el navegador
 * cargará Arial como fallback y se pierde el match.
 *
 * Uso desde /api/photo-to-template:
 *   const fontFamily = matchFont({
 *     category: layer.fontCategory,    // "display" | "serif" | "sans" | "script" | "mono"
 *     description: layer.fontDescription, // "bold geometric sans-serif"
 *     weight: layer.weight,             // "bold" | "regular"
 *   });
 */

export type FontCategory = "display" | "serif" | "sans" | "script" | "mono";

export type FontEntry = {
  family: string;
  category: FontCategory;
  /** Pesos disponibles (cargados via Google Fonts) */
  weights: number[];
  /** Tags semánticos para matching: tono visual de la fuente */
  tags: string[];
  /** Casos de uso típicos */
  useFor: string[];
};

/** Catálogo curado de ~15 fuentes representativas. Cubre el 90% de los
 *  casos de flyers de eventos. Si necesitas más, añadir aquí Y en layout.tsx. */
export const FONT_CATALOG: FontEntry[] = [
  // ─── DISPLAY (títulos grandes, impacto visual) ────────────────────────
  {
    family: "Anton",
    category: "display",
    weights: [400],
    tags: ["bold", "condensed", "compressed", "narrow", "tall", "uppercase", "modern", "strong", "impact", "thick"],
    useFor: ["títulos grandes", "nombres de eventos", "DJ names", "headlines"],
  },
  {
    family: "Bebas Neue",
    category: "display",
    weights: [400],
    tags: ["bold", "condensed", "narrow", "tall", "uppercase", "modern", "clean", "iconic"],
    useFor: ["títulos", "fechas", "venues", "anuncios"],
  },
  {
    family: "Oswald",
    category: "display",
    weights: [400, 600, 700],
    tags: ["condensed", "narrow", "bold", "modern", "clean", "versatile"],
    useFor: ["subtítulos grandes", "secciones"],
  },

  // ─── SANS-SERIF (cuerpo, info, sub-headlines limpios) ─────────────────
  {
    family: "Montserrat",
    category: "sans",
    weights: [400, 500, 600, 700, 900],
    tags: ["geometric", "modern", "round", "friendly", "versatile", "clean", "neutral"],
    useFor: ["info general", "subtítulos", "descripciones"],
  },
  {
    family: "Inter",
    category: "sans",
    weights: [400, 500, 600, 700],
    tags: ["modern", "clean", "neutral", "ui", "readable", "minimal"],
    useFor: ["info clara", "texto largo", "instrucciones"],
  },
  {
    family: "Poppins",
    category: "sans",
    weights: [400, 500, 600, 700, 800],
    tags: ["geometric", "round", "modern", "friendly", "playful"],
    useFor: ["títulos amigables", "subtítulos juveniles"],
  },
  {
    family: "Roboto Condensed",
    category: "sans",
    weights: [400, 700],
    tags: ["condensed", "narrow", "clean", "neutral", "compact"],
    useFor: ["lineups", "listas de DJs", "info comprimida"],
  },

  // ─── SERIF (elegancia, clásico, formal) ──────────────────────────────
  {
    family: "Playfair Display",
    category: "serif",
    weights: [400, 700, 900],
    tags: ["elegant", "modern serif", "high contrast", "sophisticated", "editorial", "classy"],
    useFor: ["títulos elegantes", "eventos formales", "boutique"],
  },
  {
    family: "Cormorant Garamond",
    category: "serif",
    weights: [300, 400, 500, 700],
    tags: ["classic", "elegant", "thin", "sophisticated", "literary", "old style", "garalde"],
    useFor: ["citas", "fechas formales", "eventos clásicos"],
  },

  // ─── SCRIPT / HANDWRITTEN (festivo, casual, manuscrito) ──────────────
  {
    family: "Great Vibes",
    category: "script",
    weights: [400],
    tags: ["script", "handwritten", "elegant", "calligraphy", "formal", "wedding", "flowing", "cursive"],
    useFor: ["nombres elegantes", "eventos románticos", "invitaciones"],
  },
];

/** Categorías ordenadas por preferencia cuando no hay match exacto.
 *  Si Sonnet dice "no sé qué categoría", caemos a sans-serif. */
const DEFAULT_FONT_PER_CATEGORY: Record<FontCategory, string> = {
  display: "Bebas Neue",
  sans: "Montserrat",
  serif: "Playfair Display",
  script: "Great Vibes",
  mono: "Inter", // no tenemos mono real cargada; sans neutral
};

type MatchInput = {
  /** Categoría general que devuelve Sonnet */
  category?: string;
  /** Descripción visual: "bold geometric sans-serif", "elegant thin serif", etc. */
  description?: string;
  /** Peso aproximado */
  weight?: "bold" | "regular" | string;
};

/** Heurística: cuenta cuántos tags de la fuente aparecen en la descripción
 *  + bonus si la categoría coincide + bonus si tiene el peso pedido.
 *  Devuelve la fuente con mayor score. Fallback al default de la categoría. */
export function matchFont(input: MatchInput): string {
  const description = (input.description ?? "").toLowerCase();
  const rawCategory = (input.category ?? "").toLowerCase();
  const wantBold = input.weight === "bold";

  // Normalizar categoría: Sonnet puede decir "sans-serif" "sans serif" "sans" etc.
  const category: FontCategory | null =
    rawCategory.includes("display") || rawCategory.includes("impact") ? "display"
    : rawCategory.includes("script") || rawCategory.includes("hand") || rawCategory.includes("cursive") ? "script"
    : rawCategory.includes("serif") && !rawCategory.includes("sans") ? "serif"
    : rawCategory.includes("sans") ? "sans"
    : rawCategory.includes("mono") ? "mono"
    : null;

  // Si no hay descripción ni categoría útil, default sensato
  if (!description && !category) return "Montserrat";

  // Pool de candidatos: si hay categoría, restringir a esa; si no, todas
  const pool = category
    ? FONT_CATALOG.filter((f) => f.category === category)
    : FONT_CATALOG;

  if (pool.length === 0) {
    return DEFAULT_FONT_PER_CATEGORY[category ?? "sans"];
  }

  // Scoring
  let bestFont = pool[0];
  let bestScore = -1;
  for (const font of pool) {
    let score = 0;
    // Tag matches en la descripción (lo más importante)
    for (const tag of font.tags) {
      if (description.includes(tag)) score += 2;
    }
    // Bonus si soporta el peso pedido
    if (wantBold && font.weights.some((w) => w >= 700)) score += 1;
    if (!wantBold && font.weights.includes(400)) score += 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestFont = font;
    }
  }

  // Si nadie tiene match >0 (descripción muy genérica), default categoría
  if (bestScore <= 0 && category) {
    return DEFAULT_FONT_PER_CATEGORY[category];
  }
  return bestFont.family;
}

/** Devuelve un peso CSS válido (300/400/500/600/700/900) cercano al pedido,
 *  considerando los pesos realmente cargados de la fuente. Si la fuente solo
 *  tiene 400 pero pides 700, devuelve 400 (Google Font no cargará 700 si no
 *  está en el <link>). */
export function pickWeight(family: string, requestedWeight: "bold" | "regular" | string): string {
  const font = FONT_CATALOG.find((f) => f.family === family);
  if (!font) return requestedWeight === "bold" ? "700" : "400";
  const want = requestedWeight === "bold" ? 700 : 400;
  // Buscar el peso más cercano
  const sorted = [...font.weights].sort((a, b) => Math.abs(a - want) - Math.abs(b - want));
  return String(sorted[0]);
}
