// ════════════════════════════════════════════════════════════════════════════
//  TEMPLATE REMIX STYLES
//
//  Variantes de estilo "remix" pre-definidas que se muestran en el Tab Remix.
//  Cada remix es un PRESET que combina paleta + tipografia + efectos.
//  Aplicar = swap visual del flyer manteniendo el CONTENIDO del usuario.
//
//  Esto es lo que diferencia ArteGenIA de Canva: en lugar de "elige otra
//  plantilla y rellena todo de nuevo", el usuario puede ver SU contenido
//  con 4 estilos distintos al instante y elegir.
//
//  Cada estilo tiene un "spirit" — el feeling general:
//   - urbano:  paleta cruda, fuentes condensed, alta saturacion
//   - minimal: paleta monocroma o claros, fuentes thin, mucho aire
//   - neon:    paleta saturada (cyan/pink), glows
//   - pro:     paleta sobria (negro/blanco/dorado), serif elegante
// ════════════════════════════════════════════════════════════════════════════

import type { Palette } from "@/data/templatePalettes";

export type RemixStyle = {
  id: "urbano" | "minimal" | "neon" | "pro";
  name: string;
  /** Palette overrides (sobrescribe los colores actuales del flyer). */
  palette: Palette;
  /** Fuente principal (titulos). */
  primaryFont?: string;
  /** Fuente secundaria (cuerpo). */
  secondaryFont?: string;
  /** Aplicar sombra/glow al titulo (visual neon). */
  titleGlow?: { color: string; blur: number };
};

export const REMIX_STYLES: RemixStyle[] = [
  {
    id: "urbano",
    name: "Urbano",
    palette: {
      id: "urbano",
      name: "Urbano",
      primary: "#facc15",   // yellow
      secondary: "#ec4899", // pink
      accent: "#a855f7",    // purple
      dark: "#0a0a14",
    },
    primaryFont: "Anton",
  },
  {
    id: "minimal",
    name: "Minimal",
    palette: {
      id: "minimal",
      name: "Minimal",
      primary: "#000000",
      secondary: "#a1a1aa",
      accent: "#facc15",
      dark: "#fafafa",
    },
    primaryFont: "Inter",
  },
  {
    id: "neon",
    name: "Neón",
    palette: {
      id: "neon",
      name: "Neón",
      primary: "#22d3ee",   // cyan
      secondary: "#ec4899", // pink
      accent: "#facc15",    // yellow pop
      dark: "#0a0014",
    },
    primaryFont: "Bebas Neue",
    titleGlow: { color: "rgba(34,211,238,0.8)", blur: 20 },
  },
  {
    id: "pro",
    name: "Pro",
    palette: {
      id: "pro",
      name: "Pro",
      primary: "#facc15",   // gold
      secondary: "#fafafa",
      accent: "#d4a058",
      dark: "#0a0a0a",
    },
    primaryFont: "Playfair Display",
  },
];
