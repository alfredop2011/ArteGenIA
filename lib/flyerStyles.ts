/**
 * Estilos visuales pre-curados para Generador IA editable (Fase X.1).
 *
 * Cada estilo define:
 *  - bgPrompt: prompt para Flux que genera SOLO el fondo (sin texto),
 *    pidiendo explícitamente espacio libre para overlays.
 *  - defaultFonts: qué fuentes del catálogo Google Fonts usar por rol.
 *  - paletteHints: colores dominantes para los layers de texto.
 *  - textShadow: si los textos deben tener sombra para legibilidad sobre
 *    fondos cargados (true para estilos festivos/oscuros, false para
 *    minimalista).
 *
 * IMPORTANTE: el bgPrompt SIEMPRE termina con "no text in the image,
 * leave space for text overlays at top and bottom" para que Flux no
 * genere texto inventado.
 */

export type FlyerStyleId =
  | "urban-neon"
  | "elegant-gold"
  | "festive-tropical"
  | "minimal-modern"
  | "vintage-retro"
  | "futurist-cyber";

export type FlyerStyle = {
  id: FlyerStyleId;
  name: string;
  /** Descripción corta visible al user en la card */
  tagline: string;
  /** Emoji que representa el estilo (placeholder hasta tener thumbnails) */
  icon: string;
  /** Prompt completo para Flux Schnell — incluye anti-texto */
  bgPrompt: string;
  defaultFonts: {
    title: string;
    subtitle: string;
    info: string;
  };
  /** Color principal del título (sobre fondo del estilo) */
  titleColor: string;
  subtitleColor: string;
  infoColor: string;
  /** Si los textos llevan sombra para legibilidad en fondos cargados */
  textShadow: boolean;
};

export const FLYER_STYLES: FlyerStyle[] = [
  {
    id: "urban-neon",
    name: "Urbano Neón",
    tagline: "Oscuro, eléctrico, fiestero",
    icon: "🌃",
    bgPrompt:
      "Dark urban concert background, electric neon purple and pink lights, grungy graffiti texture, blurred bokeh lights, smoke and atmosphere, hip-hop reggaeton vibe, professional flyer design, vertical 1080x1350, no text in the image, leave top 25% and bottom 30% darker for text overlays",
    defaultFonts: {
      title: "Bebas Neue",
      subtitle: "Anton",
      info: "Inter",
    },
    titleColor: "#ff00ff",
    subtitleColor: "#00ffff",
    infoColor: "#ffffff",
    textShadow: true,
  },
  {
    id: "elegant-gold",
    name: "Elegante Dorado",
    tagline: "Sofisticado, premium, formal",
    icon: "✨",
    bgPrompt:
      "Luxury black background with subtle gold particles and bokeh, art deco patterns at edges, sophisticated minimal composition, premium event flyer, marble or velvet texture, deep blacks with gold accents, vertical 1080x1350, no text in the image, leave large empty space in center and bottom for text overlays",
    defaultFonts: {
      title: "Playfair Display",
      subtitle: "Cormorant Garamond",
      info: "Montserrat",
    },
    titleColor: "#d4af37",
    subtitleColor: "#f0e6d2",
    infoColor: "#ffffff",
    textShadow: false,
  },
  {
    id: "festive-tropical",
    name: "Tropical Festivo",
    tagline: "Salsa, latino, vibrante, cálido",
    icon: "🌴",
    bgPrompt:
      "Vibrant tropical Latin party background, sunset orange and pink sky, palm tree silhouettes, warm bokeh lights, festive Cuban Caribbean vibe, salsa and reggaeton aesthetic, golden hour, vertical 1080x1350, no text in the image, leave top and bottom areas slightly darker for text overlays",
    defaultFonts: {
      title: "Anton",
      subtitle: "Bebas Neue",
      info: "Montserrat",
    },
    titleColor: "#ffd700",
    subtitleColor: "#ffffff",
    infoColor: "#ffe4b5",
    textShadow: true,
  },
  {
    id: "minimal-modern",
    name: "Minimalista",
    tagline: "Limpio, moderno, editorial",
    icon: "◻",
    bgPrompt:
      "Clean minimalist design background, off-white cream with subtle abstract geometric shapes in pastel colors, lots of negative space, editorial magazine aesthetic, premium minimal poster, vertical 1080x1350, no text in the image, leave 70% of the canvas empty for text overlays",
    defaultFonts: {
      title: "Playfair Display",
      subtitle: "Inter",
      info: "Inter",
    },
    titleColor: "#1a1a1a",
    subtitleColor: "#4a4a4a",
    infoColor: "#666666",
    textShadow: false,
  },
  {
    id: "vintage-retro",
    name: "Retro 80s",
    tagline: "Nostálgico, sintwave, neón",
    icon: "📼",
    bgPrompt:
      "Retro 80s synthwave background, neon grid horizon, purple and pink gradient sky, vaporwave aesthetic, sun setting over neon mountains, vintage VHS texture, vertical 1080x1350, no text in the image, leave top and middle areas clear for text overlays",
    defaultFonts: {
      title: "Bebas Neue",
      subtitle: "Oswald",
      info: "Montserrat",
    },
    titleColor: "#ff006e",
    subtitleColor: "#fb5607",
    infoColor: "#ffffff",
    textShadow: true,
  },
  {
    id: "futurist-cyber",
    name: "Cyber Futurista",
    tagline: "Tecno, futuro, holográfico",
    icon: "🤖",
    bgPrompt:
      "Futuristic cyberpunk background, holographic glitch effects, digital data visualization, deep blue and cyan tones with hot pink accents, neon city lights, abstract tech patterns, vertical 1080x1350, no text in the image, leave clear zones at top and center for text overlays",
    defaultFonts: {
      title: "Anton",
      subtitle: "Bebas Neue",
      info: "Inter",
    },
    titleColor: "#00ffff",
    subtitleColor: "#ff00aa",
    infoColor: "#ffffff",
    textShadow: true,
  },
];

export function getStyleById(id: string): FlyerStyle | null {
  return FLYER_STYLES.find((s) => s.id === id) ?? null;
}
