// ════════════════════════════════════════════════════════════════════════════
//  TEMPLATE PALETTES
//
//  Paletas de colores curadas por CATEGORIA de evento. El editor Tab Estilo
//  las muestra como grid de cards y al tap aplica los colores a:
//   - layers tipo "shape" (rectangulos, lineas, marcos) → cambia fill
//   - layers tipo "text" que tengan rol "title"/"subtitle" → cambia color
//
//  Cada paleta tiene 4 roles:
//   - primary:    color principal del flyer (titulo, acento dominante)
//   - secondary:  color complementario (subtitulo, segundo acento)
//   - accent:     pop de color (CTAs, precios, badges)
//   - dark:       fondo o color de texto sobre claro
//
//  No es exhaustivo — empezamos con 4-6 paletas por categoria.
// ════════════════════════════════════════════════════════════════════════════

export type Palette = {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
};

/** Paletas universales (fallback si la categoria no tiene custom). */
export const UNIVERSAL_PALETTES: Palette[] = [
  { id: "midnight", name: "Midnight",  primary: "#a855f7", secondary: "#ec4899", accent: "#facc15", dark: "#0a0a14" },
  { id: "sunset",   name: "Sunset",    primary: "#f97316", secondary: "#ef4444", accent: "#facc15", dark: "#1a0a1a" },
  { id: "ocean",    name: "Ocean",     primary: "#06b6d4", secondary: "#3b82f6", accent: "#22c55e", dark: "#0c1e2e" },
  { id: "mono",     name: "Mono Bold", primary: "#ffffff", secondary: "#a1a1aa", accent: "#facc15", dark: "#000000" },
];

/** Paletas especificas por categoria. */
export const PALETTES_BY_CATEGORY: Record<string, Palette[]> = {
  "Concierto": [
    { id: "live-neon",  name: "Live Neón",   primary: "#facc15", secondary: "#a855f7", accent: "#ec4899", dark: "#0a0a14" },
    { id: "stage-red",  name: "Stage Red",   primary: "#ef4444", secondary: "#000000", accent: "#facc15", dark: "#1a0505" },
    { id: "vinyl",      name: "Vinyl",       primary: "#06b6d4", secondary: "#ec4899", accent: "#fafafa", dark: "#1e293b" },
    { id: "violet-bold",name: "Violet Bold", primary: "#a855f7", secondary: "#ffffff", accent: "#000000", dark: "#1a0a1f" },
  ],
  "Conciertos": [], // mismo que Concierto — se rellena en runtime
  "Fiesta": [
    { id: "neon-party", name: "Neon Party",  primary: "#ec4899", secondary: "#a855f7", accent: "#22d3ee", dark: "#0a0014" },
    { id: "tropical",   name: "Tropical",    primary: "#fb923c", secondary: "#22c55e", accent: "#facc15", dark: "#1a0a14" },
    { id: "club-pink",  name: "Club Pink",   primary: "#f472b6", secondary: "#fbcfe8", accent: "#a855f7", dark: "#0a000a" },
    { id: "rave",       name: "Rave",        primary: "#22d3ee", secondary: "#a855f7", accent: "#facc15", dark: "#000a0a" },
  ],
  "Festival": [
    { id: "summer-fest",name: "Summer Fest", primary: "#facc15", secondary: "#fb923c", accent: "#ec4899", dark: "#1a1505" },
    { id: "deep-night", name: "Deep Night",  primary: "#a855f7", secondary: "#06b6d4", accent: "#facc15", dark: "#0a0014" },
    { id: "outdoor",    name: "Outdoor",     primary: "#22c55e", secondary: "#facc15", accent: "#ef4444", dark: "#0a140a" },
    { id: "psychedelic",name: "Psychedelic", primary: "#ec4899", secondary: "#22d3ee", accent: "#facc15", dark: "#1a0a1a" },
  ],
  "Club / Discoteca": [
    { id: "underground",name: "Underground", primary: "#a855f7", secondary: "#000000", accent: "#ffffff", dark: "#0a0014" },
    { id: "laser",      name: "Laser",       primary: "#22d3ee", secondary: "#ec4899", accent: "#facc15", dark: "#000a14" },
    { id: "vegas",      name: "Vegas",       primary: "#facc15", secondary: "#ef4444", accent: "#ffffff", dark: "#1a0505" },
    { id: "deep-house", name: "Deep House",  primary: "#3b82f6", secondary: "#a855f7", accent: "#06b6d4", dark: "#0a0a1a" },
  ],
  "Gala": [
    { id: "gold-black", name: "Gold & Black",primary: "#facc15", secondary: "#fafafa", accent: "#d4a058", dark: "#0a0a0a" },
    { id: "champagne",  name: "Champagne",   primary: "#fde047", secondary: "#fafafa", accent: "#a16207", dark: "#1a1505" },
    { id: "noir",       name: "Noir",        primary: "#ffffff", secondary: "#a1a1aa", accent: "#facc15", dark: "#000000" },
    { id: "burgundy",   name: "Burgundy",    primary: "#7c1d2c", secondary: "#fde047", accent: "#fafafa", dark: "#0a0505" },
  ],
  "Corporativo": [
    { id: "office",     name: "Office",      primary: "#3b82f6", secondary: "#fafafa", accent: "#22c55e", dark: "#0a0a14" },
    { id: "executive",  name: "Executive",   primary: "#1e293b", secondary: "#facc15", accent: "#a1a1aa", dark: "#0a0a0a" },
    { id: "fresh",      name: "Fresh",       primary: "#06b6d4", secondary: "#22c55e", accent: "#3b82f6", dark: "#0a141a" },
    { id: "premium",    name: "Premium",     primary: "#000000", secondary: "#facc15", accent: "#a855f7", dark: "#0a0a0a" },
  ],
  "Clases": [
    { id: "neon-urban", name: "Neon Urban",  primary: "#facc15", secondary: "#ec4899", accent: "#a855f7", dark: "#0a0a14" },
    { id: "academy",    name: "Academy",     primary: "#7c1d2c", secondary: "#fafafa", accent: "#facc15", dark: "#0a0505" },
    { id: "studio",     name: "Studio",      primary: "#a855f7", secondary: "#06b6d4", accent: "#facc15", dark: "#0a0014" },
    { id: "rhythm",     name: "Rhythm",      primary: "#ec4899", secondary: "#facc15", accent: "#22d3ee", dark: "#1a0a14" },
  ],
};

// Alias: Conciertos comparte con Concierto
PALETTES_BY_CATEGORY["Conciertos"] = PALETTES_BY_CATEGORY["Concierto"];

/** Devuelve las paletas para una categoria, con fallback a universales. */
export function getPalettesForCategory(category: string | undefined): Palette[] {
  if (!category) return UNIVERSAL_PALETTES;
  return PALETTES_BY_CATEGORY[category] ?? UNIVERSAL_PALETTES;
}
