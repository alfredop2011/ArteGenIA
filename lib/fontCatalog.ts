/**
 * Catálogo expandido de Google Fonts disponibles en ArteGenIA + font
 * matching heurístico desde la descripción que devuelve Claude Sonnet 4.6.
 *
 * 30+ fuentes representativas que cubren los estilos típicos de flyers:
 *  - DISPLAY: títulos de impacto (Anton, Bebas Neue, Bungee, Russo One...)
 *  - SANS: cuerpo limpio (Montserrat, Inter, Poppins, Raleway...)
 *  - SERIF: elegantes/formales (Playfair, Cormorant, EB Garamond, DM Serif Display)
 *  - SCRIPT: manuscritas (Great Vibes, Pacifico, Lobster, Allura...)
 *  - DECORATIVE: casuales (Caveat, Permanent Marker, Indie Flower)
 *
 * IMPORTANTE: cuando añadas una fuente aquí, AÑÁDELA TAMBIÉN al
 * <link href="...family=..."> de app/layout.tsx — si no, el navegador
 * cargará Arial como fallback y se pierde el match.
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

/** Catálogo curado de ~30 fuentes representativas. Cubre el 95% de los
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
  {
    family: "Bungee",
    category: "display",
    weights: [400],
    tags: ["bold", "uppercase", "thick", "blocky", "urban", "street", "neon", "vintage", "retro", "tropical"],
    useFor: ["fiestas urbanas", "neon", "tropical bold"],
  },
  {
    family: "Black Ops One",
    category: "display",
    weights: [400],
    tags: ["bold", "military", "stencil", "tactical", "urban", "strong", "uppercase"],
    useFor: ["urbano", "deportes", "gym", "boxing"],
  },
  {
    family: "Russo One",
    category: "display",
    weights: [400],
    tags: ["bold", "geometric", "modern", "strong", "italic", "racing", "futuristic"],
    useFor: ["deportes", "tecno", "racing"],
  },
  {
    family: "Bowlby One",
    category: "display",
    weights: [400],
    tags: ["bold", "round", "chunky", "fat", "uppercase", "fun", "playful", "thick"],
    useFor: ["fiestas casuales", "infantil", "fun"],
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
  {
    family: "Raleway",
    category: "sans",
    weights: [400, 600, 700],
    tags: ["thin", "elegant", "modern", "sophisticated", "minimal", "uppercase"],
    useFor: ["elegante minimalista", "moda", "boutique"],
  },
  {
    family: "Work Sans",
    category: "sans",
    weights: [400, 600, 700],
    tags: ["modern", "clean", "industrial", "neutral", "versatile"],
    useFor: ["corporativo", "info técnica"],
  },
  {
    family: "Outfit",
    category: "sans",
    weights: [400, 600, 700, 800],
    tags: ["geometric", "modern", "rounded", "playful", "fresh"],
    useFor: ["startups", "moderno fresco"],
  },
  // ─── SANS añadidas desde fontpair.co (curado profesional) ────────────
  {
    family: "Roboto",
    category: "sans",
    weights: [400, 500, 700, 900],
    tags: ["neutral", "modern", "clean", "ui", "versatile", "classic", "android"],
    useFor: ["cuerpo texto", "UI", "neutral universal"],
  },
  {
    family: "Open Sans",
    category: "sans",
    weights: [400, 600, 700, 800],
    tags: ["humanist", "neutral", "clean", "readable", "modern", "warm", "popular"],
    useFor: ["cuerpo largo", "warm neutral"],
  },
  {
    family: "Lato",
    category: "sans",
    weights: [400, 700, 900],
    tags: ["humanist", "warm", "friendly", "modern", "corporate"],
    useFor: ["corporate friendly"],
  },
  {
    family: "DM Sans",
    category: "sans",
    weights: [400, 500, 700],
    tags: ["geometric", "modern", "minimal", "low-contrast", "tech", "premium"],
    useFor: ["tech startup", "modern minimal"],
  },
  {
    family: "Manrope",
    category: "sans",
    weights: [400, 600, 700, 800],
    tags: ["geometric", "modern", "premium", "low-contrast", "sophisticated"],
    useFor: ["premium tech", "luxury minimal"],
  },
  {
    family: "Space Grotesk",
    category: "sans",
    weights: [400, 500, 700],
    tags: ["display", "geometric", "modern", "tech", "futuristic", "quirky"],
    useFor: ["tech display", "futurista"],
  },
  {
    family: "Karla",
    category: "sans",
    weights: [400, 600, 700],
    tags: ["grotesque", "modern", "humanist", "warm", "editorial"],
    useFor: ["editorial modern"],
  },
  {
    family: "Nunito",
    category: "sans",
    weights: [400, 600, 700, 800],
    tags: ["rounded", "warm", "friendly", "soft", "humanist"],
    useFor: ["infantil", "warm friendly"],
  },
  {
    family: "Quicksand",
    category: "sans",
    weights: [400, 500, 700],
    tags: ["rounded", "geometric", "friendly", "playful", "soft"],
    useFor: ["amigable", "infantil"],
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
  {
    family: "Lora",
    category: "serif",
    weights: [400, 600, 700],
    tags: ["calligraphic", "readable", "warm", "classic", "literary"],
    useFor: ["lectura", "blogs", "warm classic"],
  },
  {
    family: "EB Garamond",
    category: "serif",
    weights: [400, 700],
    tags: ["classic", "elegant", "old style", "renaissance", "literary", "vintage"],
    useFor: ["vintage", "classic", "books"],
  },
  {
    family: "DM Serif Display",
    category: "serif",
    weights: [400],
    tags: ["display", "high contrast", "elegant", "luxury", "thin", "modern serif", "fashion"],
    useFor: ["luxury", "fashion magazines", "premium"],
  },
  {
    family: "Cinzel",
    category: "serif",
    weights: [400, 700, 900],
    tags: ["uppercase", "elegant", "roman", "classical", "monumental", "stone", "vintage"],
    useFor: ["clásico", "boda", "lujo monumental"],
  },
  // ─── SERIF añadidas desde fontpair.co ────────────────────────────────
  {
    family: "Merriweather",
    category: "serif",
    weights: [400, 700, 900],
    tags: ["readable", "warm", "literary", "screen", "classic", "newspaper"],
    useFor: ["cuerpo largo", "blog", "editorial"],
  },
  {
    family: "Fraunces",
    category: "serif",
    weights: [400, 600, 700, 900],
    tags: ["modern", "expressive", "warm", "italian", "high-contrast", "soft", "variable"],
    useFor: ["editorial moderno", "premium warm"],
  },
  {
    family: "Crimson Text",
    category: "serif",
    weights: [400, 600, 700],
    tags: ["classic", "book", "readable", "old style", "literary"],
    useFor: ["libros", "literatura"],
  },
  {
    family: "Libre Baskerville",
    category: "serif",
    weights: [400, 700],
    tags: ["transitional", "elegant", "classic", "british", "editorial"],
    useFor: ["editorial elegante", "british classic"],
  },
  {
    family: "Bitter",
    category: "serif",
    weights: [400, 600, 700],
    tags: ["slab", "modern", "readable", "warm", "robust"],
    useFor: ["slab moderno", "robusto cálido"],
  },
  {
    family: "Spectral",
    category: "serif",
    weights: [400, 600, 700],
    tags: ["modern", "warm", "editorial", "screen", "humanist"],
    useFor: ["editorial moderno"],
  },

  // ─── SCRIPT / HANDWRITTEN (festivo, casual, manuscrito) ──────────────
  {
    family: "Great Vibes",
    category: "script",
    weights: [400],
    tags: ["script", "handwritten", "elegant", "calligraphy", "formal", "wedding", "flowing", "cursive"],
    useFor: ["nombres elegantes", "eventos románticos", "invitaciones"],
  },
  {
    family: "Pacifico",
    category: "script",
    weights: [400],
    tags: ["script", "casual", "retro", "surf", "playful", "70s", "warm", "tropical", "fun"],
    useFor: ["surf", "playa", "tropical casual"],
  },
  {
    family: "Lobster",
    category: "script",
    weights: [400],
    tags: ["script", "bold", "retro", "vintage", "fun", "casual", "italic", "60s", "neon"],
    useFor: ["nostalgia vintage", "fiestas retro", "bar"],
  },
  {
    family: "Dancing Script",
    category: "script",
    weights: [400, 700],
    tags: ["script", "handwritten", "casual", "warm", "friendly", "wedding", "flowing"],
    useFor: ["bodas casuales", "infantil", "amistoso"],
  },
  {
    family: "Allura",
    category: "script",
    weights: [400],
    tags: ["script", "elegant", "calligraphy", "thin", "wedding", "feminine", "delicate"],
    useFor: ["bodas elegantes", "spa", "feminine"],
  },
  {
    family: "Sacramento",
    category: "script",
    weights: [400],
    tags: ["script", "casual", "handwritten", "monoline", "modern script", "thin"],
    useFor: ["modern wedding", "boutique"],
  },
  {
    family: "Kaushan Script",
    category: "script",
    weights: [400],
    tags: ["script", "brush", "casual", "energetic", "hand-painted", "bold", "splash"],
    useFor: ["energético", "sports", "casual brush"],
  },
  {
    family: "Satisfy",
    category: "script",
    weights: [400],
    tags: ["script", "casual", "handwritten", "relaxed", "friendly", "warm"],
    useFor: ["casual cálido", "cafés"],
  },

  // ─── DECORATIVE / CASUAL (notas, infantil, marcador) ─────────────────
  {
    family: "Caveat",
    category: "script",
    weights: [400, 700],
    tags: ["handwritten", "casual", "note", "marker", "informal", "doodle"],
    useFor: ["notas", "doodles", "informal"],
  },
  {
    family: "Permanent Marker",
    category: "display",
    weights: [400],
    tags: ["marker", "handwritten", "bold", "urban", "street", "graffiti", "thick"],
    useFor: ["street art", "garage", "underground"],
  },
  {
    family: "Indie Flower",
    category: "script",
    weights: [400],
    tags: ["handwritten", "casual", "childlike", "doodle", "friendly", "warm"],
    useFor: ["infantil", "informal", "fresh"],
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
