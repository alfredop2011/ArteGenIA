export type TemplateLayer =
    | {
    id: string;
    type: "text";
    text: string;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight?: "normal" | "bold" | "black" | string;
    fontStyle?: "normal" | "italic" | "oblique";
    textAlign?: "left" | "center" | "right";
    originX?: "left" | "center" | "right";
    originY?: "top" | "center" | "bottom";
    angle?: number;
    charSpacing?: number;
    lineHeight?: number;
    underline?: boolean;
    stroke?: string;
    strokeWidth?: number;
}
    | {
    id: string;
    type: "shape";
    shape: "rect" | "circle";
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    opacity?: number;
    radius?: number;
    selectable?: boolean;
    originX?: "left" | "center" | "right";
    originY?: "top" | "center" | "bottom";
    angle?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDashArray?: number[];
}
    | {
    id: string;
    type: "shape-pattern";
    shape: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    fill: string;
    count: number;
    offsetX?: number;
    offsetY?: number;
    angle?: number;
    opacity?: number;
}
    | {
    id: string;
    type: "image";
    src: string;
    x?: number;
    y?: number;
    scaleX?: number;
    scaleY?: number;
    opacity?: number;
    angle?: number;
    originX?: "left" | "center" | "right";
    originY?: "top" | "center" | "bottom";
    cropX?: number;
    cropY?: number;
    cropWidth?: number;
    cropHeight?: number;
    /**
     * Sombra/glow alrededor de la imagen (útil para "stickers" de artistas
     * recortados sin fondo). Si se define, Fabric.js aplica la sombra.
     */
    shadow?: {
        color: string;
        blur: number;
        offsetX?: number;
        offsetY?: number;
    };
};

import type { FormatId } from "./formats";

export type TemplateVariant = {
    format: FormatId;
    width: number;
    height: number;
    layers: TemplateLayer[];
};

export type AudienceId =
    | "academias"
    | "productoras"
    | "freelance"
    | "instituciones"
    | "agencias"
    | "colegios";

/**
 * Tags internos del catálogo de plantillas. NO se muestran al usuario final;
 * solo aparecen en /admin/templates para mantenimiento del catálogo.
 *
 * - wip:          Trabajo en progreso, todavía editándose
 * - revision:     Pendiente de revisión visual / QA
 * - premium-only: Reservada para plan Premium (cuando se monte el sistema)
 * - beta:         Funcional pero todavía no se publica en el listado abierto
 * - deprecated:   No se debe usar, candidata a eliminar
 * - hero:         Plantilla destacada del catálogo (carrusel home, etc)
 * - complete:     Marcada como terminada y testeada
 */
export type InternalTag =
    | "wip"
    | "revision"
    | "premium-only"
    | "beta"
    | "deprecated"
    | "hero"
    | "complete";

export const INTERNAL_TAGS: InternalTag[] = [
    "wip",
    "revision",
    "premium-only",
    "beta",
    "deprecated",
    "hero",
    "complete",
];

export const INTERNAL_TAG_LABELS: Record<InternalTag, string> = {
    "wip":          "Work in progress",
    "revision":     "Revisión pendiente",
    "premium-only": "Solo premium",
    "beta":         "Beta",
    "deprecated":   "Deprecated",
    "hero":         "Destacada",
    "complete":     "Completa",
};

export const INTERNAL_TAG_COLORS: Record<InternalTag, string> = {
    "wip":          "bg-amber-500/15 text-amber-300 border-amber-500/40",
    "revision":     "bg-purple-500/15 text-purple-300 border-purple-500/40",
    "premium-only": "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40",
    "beta":         "bg-blue-500/15 text-blue-300 border-blue-500/40",
    "deprecated":   "bg-red-500/15 text-red-300 border-red-500/40",
    "hero":         "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    "complete":     "bg-gray-500/15 text-gray-300 border-gray-500/40",
};

export type Template = {
    id: number;
    title: string;
    category: string;
    image: string;
    premium: boolean;
    /** Audiencias objetivo (multi-select AND en /templates) */
    audience: AudienceId[];
    /**
     * Tags internos del catálogo. NO visibles al usuario final.
     * Editables desde /admin/templates con generación de diff pegable.
     */
    internalTags?: InternalTag[];
    variants: TemplateVariant[];
};

/**
 * Devuelve la variante solicitada por formatId. Si no se pasa formatId
 * (o no existe en la plantilla) devuelve la primera variante.
 */
export function getVariant(template: Template, formatId?: FormatId): TemplateVariant {
    if (formatId) {
        const v = template.variants.find((x) => x.format === formatId);
        if (v) return v;
    }
    return template.variants[0];
}

export const templates: Template[] = [
// 1 — Don Filosofín Live
    {
        id: 1,
        title: "Don Filosofín Live",
        category: "Concierto",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800",
        premium: true,
        audience: ["productoras", "freelance"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0800", selectable: false },
            { id: "artist-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/Filosofin-.png", x: 0, y: 0, scaleX: 1.201, scaleY: 1.201, opacity: 1 },
            { id: "overlay-bottom", type: "shape", shape: "rect", x: 0, y: 675, width: 1080, height: 675, fill: "rgba(5,4,0,0.88)", selectable: false },
            { id: "overlay-top", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 150, fill: "rgba(5,4,0,0.5)", selectable: false },
            { id: "line-gold", type: "shape", shape: "rect", x: 151, y: 695, width: 779, height: 2, fill: "#b8860b", opacity: 0.7, selectable: false },
            { id: "label", type: "text", text: "LIVE SHOW", x: 0, y: 50, width: 1080, fontSize: 33, fontFamily: "Arial", color: "#b8860b", fontWeight: "bold", textAlign: "center" },
            { id: "title-1", type: "text", text: "DON", x: 0, y: 738, width: 1080, fontSize: 226, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "title-2", type: "text", text: "FILOSOFÍN", x: 0, y: 938, width: 1080, fontSize: 181, fontFamily: "Arial", color: "#b8860b", fontWeight: "bold", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Una noche de conversación y música", x: 50, y: 1112, width: 980, fontSize: 33, fontFamily: "Arial", color: "#e0d0b0", textAlign: "center" },
            { id: "date", type: "text", text: "VIERNES 20 JUNIO · 21:00 HRS", x: 0, y: 1170, width: 1080, fontSize: 30, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "venue", type: "text", text: "SALA APOLO · BARCELONA", x: 0, y: 1225, width: 1080, fontSize: 28, fontFamily: "Arial", color: "#b8860b", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA LIBRE · AFORO LIMITADO", x: 0, y: 1285, width: 1080, fontSize: 25, fontFamily: "Arial", color: "#888888", textAlign: "center" },
        ] },
        ],
    },

// 2 — Evento Premium
    {
        id: 2,
        title: "Evento Premium",
        category: "Gala",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
        premium: false,
        audience: ["productoras", "instituciones", "agencias"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#111827", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800", x: 0, y: 0, scaleX: 1.201, scaleY: 1.201, opacity: 0.35 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(17,24,39,0.82)", selectable: false },
            { id: "gold-card", type: "shape", shape: "rect", x: 113, y: 175, width: 854, height: 1000, fill: "rgba(250,204,21,0.06)", radius: 30, selectable: false },
            { id: "gold-line-t", type: "shape", shape: "rect", x: 163, y: 250, width: 753, height: 2, fill: "#facc15", opacity: 0.6, selectable: false },
            { id: "gold-line-b", type: "shape", shape: "rect", x: 163, y: 1100, width: 753, height: 2, fill: "#facc15", opacity: 0.6, selectable: false },
            { id: "label", type: "text", text: "GALA ESPECIAL", x: 0, y: 295, width: 1080, fontSize: 30, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "EVENTO PREMIUM", x: 0, y: 388, width: 1080, fontSize: 105, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Una noche inolvidable", x: 0, y: 555, width: 1080, fontSize: 50, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "artists", type: "text", text: "ARTISTA 1 · ARTISTA 2", x: 0, y: 650, width: 1080, fontSize: 40, fontFamily: "Arial", color: "#fbbf24", fontWeight: "bold", textAlign: "center" },
            { id: "date", type: "text", text: "SÁBADO 5 JULIO · 21:00 HRS", x: 0, y: 775, width: 1080, fontSize: 43, fontFamily: "Arial", color: "#e5e7eb", fontWeight: "bold", textAlign: "center" },
            { id: "venue", type: "text", text: "Gran Salón · Hotel Palace", x: 0, y: 862, width: 1080, fontSize: 35, fontFamily: "Arial", color: "#9ca3af", textAlign: "center" },
            { id: "footer", type: "text", text: "ArteGenIA", x: 0, y: 1138, width: 1080, fontSize: 45, fontFamily: "Arial", color: "#facc15", textAlign: "center" },
        ] },
            // ── Variant: Portada de Facebook (1920×1005, banner horizontal) ──
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                // Fondo base
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#111827", selectable: false },
                // Foto a la derecha (banner side)
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600", x: 960, y: 0, scaleX: 1.0, scaleY: 1.0, opacity: 0.65 },
                // Gradient fade de derecha a izquierda (overlay oscuro sobre foto)
                { id: "overlay-right", type: "shape", shape: "rect", x: 960, y: 0, width: 960, height: 1005, fill: "rgba(17,24,39,0.45)", selectable: false },
                // Bloque oscuro sólido a la izquierda
                { id: "overlay-left", type: "shape", shape: "rect", x: 0, y: 0, width: 1100, height: 1005, fill: "rgba(17,24,39,0.93)", selectable: false },
                // Línea dorada vertical separadora
                { id: "gold-divider", type: "shape", shape: "rect", x: 1100, y: 250, width: 2, height: 505, fill: "#facc15", opacity: 0.5, selectable: false },
                // Línea dorada horizontal superior (decoración)
                { id: "gold-line-t", type: "shape", shape: "rect", x: 110, y: 180, width: 460, height: 2, fill: "#facc15", opacity: 0.6, selectable: false },
                // Línea dorada horizontal inferior (decoración)
                { id: "gold-line-b", type: "shape", shape: "rect", x: 110, y: 820, width: 460, height: 2, fill: "#facc15", opacity: 0.6, selectable: false },
                // Label arriba
                { id: "label", type: "text", text: "GALA ESPECIAL", x: 110, y: 130, width: 880, fontSize: 28, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "left", charSpacing: 200 },
                // Titulo gigante
                { id: "title", type: "text", text: "EVENTO PREMIUM", x: 110, y: 220, width: 880, fontSize: 100, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "left", lineHeight: 0.95 },
                // Subtítulo
                { id: "subtitle", type: "text", text: "Una noche inolvidable", x: 110, y: 470, width: 880, fontSize: 44, fontFamily: "Arial", color: "#ffffff", textAlign: "left" },
                // Artistas
                { id: "artists", type: "text", text: "ARTISTA 1 · ARTISTA 2", x: 110, y: 555, width: 880, fontSize: 32, fontFamily: "Arial", color: "#fbbf24", fontWeight: "bold", textAlign: "left" },
                // Fecha (debajo de la línea dorada inferior)
                { id: "date", type: "text", text: "SÁBADO 5 JULIO · 21:00 HRS", x: 110, y: 850, width: 880, fontSize: 36, fontFamily: "Arial", color: "#e5e7eb", fontWeight: "bold", textAlign: "left" },
                // Venue
                { id: "venue", type: "text", text: "Gran Salón · Hotel Palace", x: 110, y: 915, width: 880, fontSize: 28, fontFamily: "Arial", color: "#9ca3af", textAlign: "left" },
                // Footer pequeño (esquina inferior derecha)
                { id: "footer", type: "text", text: "ArteGenIA", x: 1150, y: 940, width: 750, fontSize: 22, fontFamily: "Arial", color: "#facc15", textAlign: "right" },
            ] },
        ],
    },

// 3 — Bachata Nights
    {
        id: 3,
        title: "Bachata Nights",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800",
        premium: false,
        audience: ["productoras", "academias"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0d0005", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800", x: 0, y: 0, scaleX: 1.201, scaleY: 1.201, opacity: 0.45 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(13,0,5,0.8)", selectable: false },
            { id: "glow-pink", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(219,39,119,0.1)", selectable: false },
            { id: "label", type: "text", text: "UNA NOCHE DE", x: 0, y: 225, width: 1080, fontSize: 35, fontFamily: "Arial", color: "#f9a8d4", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "BACHATA", x: 0, y: 295, width: 1080, fontSize: 181, fontFamily: "Arial", color: "#fce7f3", fontWeight: "bold", textAlign: "center" },
            { id: "title2", type: "text", text: "NIGHTS", x: 0, y: 480, width: 1080, fontSize: 181, fontFamily: "Arial", color: "#ec4899", fontWeight: "bold", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 201, y: 695, width: 678, height: 2, fill: "#ec4899", opacity: 0.5, selectable: false },
            { id: "artists", type: "text", text: "CORA & NIKO", x: 0, y: 738, width: 1080, fontSize: 65, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "genre", type: "text", text: "BACHATA · AMOR · CONEXIÓN", x: 0, y: 830, width: 1080, fontSize: 30, fontFamily: "Arial", color: "#f9a8d4", textAlign: "center" },
            { id: "date", type: "text", text: "DOMINGO 29 JUNIO", x: 0, y: 930, width: 1080, fontSize: 55, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "time", type: "text", text: "20:00 HRS · La Terraza", x: 0, y: 1012, width: 1080, fontSize: 38, fontFamily: "Arial", color: "#f9a8d4", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA 18€", x: 0, y: 1150, width: 1080, fontSize: 55, fontFamily: "Arial", color: "#fce7f3", fontWeight: "bold", textAlign: "center" },
        ] },
            // ── Variant: Historia de Instagram (1080×1920, vertical narrativo) ──
            { format: "story", width: 1080, height: 1920, layers: [
                // Fondo base
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0d0005", selectable: false },
                // Foto cubriendo más altura, con opacidad para que el texto destaque
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=1080", x: 0, y: 0, scaleX: 1.4, scaleY: 1.4, opacity: 0.55 },
                // Overlay general
                { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "rgba(13,0,5,0.75)", selectable: false },
                // Glow rosado sobre toda la composición
                { id: "glow-pink", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "rgba(219,39,119,0.08)", selectable: false },
                // Safe area visual: en stories de Instagram el header/footer del usuario tapa los primeros y últimos ~250px.
                // Por eso colocamos el contenido principal entre y=280 y y=1700.

                // Label superior
                { id: "label", type: "text", text: "UNA NOCHE DE", x: 0, y: 320, width: 1080, fontSize: 42, fontFamily: "Arial", color: "#f9a8d4", fontWeight: "bold", textAlign: "center", charSpacing: 200 },
                // Título "BACHATA" — más grande aprovechando el alto
                { id: "title", type: "text", text: "BACHATA", x: 0, y: 410, width: 1080, fontSize: 200, fontFamily: "Arial", color: "#fce7f3", fontWeight: "bold", textAlign: "center" },
                // Título "NIGHTS"
                { id: "title2", type: "text", text: "NIGHTS", x: 0, y: 615, width: 1080, fontSize: 200, fontFamily: "Arial", color: "#ec4899", fontWeight: "bold", textAlign: "center" },
                // Línea decorativa rosa
                { id: "line", type: "shape", shape: "rect", x: 240, y: 850, width: 600, height: 3, fill: "#ec4899", opacity: 0.55, selectable: false },
                // Artistas (centro vertical, más prominentes que en portrait)
                { id: "artists", type: "text", text: "CORA & NIKO", x: 0, y: 905, width: 1080, fontSize: 78, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                // Genre
                { id: "genre", type: "text", text: "BACHATA · AMOR · CONEXIÓN", x: 0, y: 1020, width: 1080, fontSize: 34, fontFamily: "Arial", color: "#f9a8d4", textAlign: "center", charSpacing: 100 },
                // Bloque inferior con fecha (más respiro entre elementos)
                { id: "line-2", type: "shape", shape: "rect", x: 240, y: 1180, width: 600, height: 3, fill: "#ec4899", opacity: 0.55, selectable: false },
                // Fecha (más grande para destacar — es el dato más importante en story)
                { id: "date", type: "text", text: "DOMINGO 29 JUNIO", x: 0, y: 1240, width: 1080, fontSize: 70, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                // Hora y venue
                { id: "time", type: "text", text: "20:00 HRS · La Terraza", x: 0, y: 1345, width: 1080, fontSize: 44, fontFamily: "Arial", color: "#f9a8d4", textAlign: "center" },
                // CTA inferior — entrada / precio destacado
                { id: "price-bg", type: "shape", shape: "rect", x: 290, y: 1500, width: 500, height: 110, fill: "rgba(236,72,153,0.15)", radius: 55, stroke: "#ec4899", strokeWidth: 2, opacity: 0.9, selectable: false },
                { id: "price", type: "text", text: "ENTRADA 18€", x: 0, y: 1530, width: 1080, fontSize: 50, fontFamily: "Arial", color: "#fce7f3", fontWeight: "bold", textAlign: "center" },
                // Footer (zona "swipe up" en story)
                { id: "footer", type: "text", text: "DESLIZA PARA RESERVAR", x: 0, y: 1700, width: 1080, fontSize: 26, fontFamily: "Arial", color: "#f9a8d4", textAlign: "center", charSpacing: 300 },
            ] },
        ],
    },

// 4 — Vibra Fest
    {
        id: 4,
        title: "Vibra Fest",
        category: "Festival",
        image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=800",
        premium: true,
        audience: ["productoras", "agencias"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#050014", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=800", x: 0, y: 0, scaleX: 1.201, scaleY: 1.201, opacity: 0.4 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(5,0,20,0.82)", selectable: false },
            { id: "glow-v", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(124,58,237,0.12)", selectable: false },
            { id: "dates", type: "text", text: "25 · 26 · 27 JULIO", x: 0, y: 180, width: 1080, fontSize: 40, fontFamily: "Arial", color: "#c4b5fd", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "VIBRA", x: 0, y: 262, width: 1080, fontSize: 226, fontFamily: "Arial", color: "#a855f7", fontWeight: "bold", textAlign: "center" },
            { id: "title2", type: "text", text: "FEST 2025", x: 0, y: 488, width: 1080, fontSize: 105, fontFamily: "Arial", color: "#06b6d4", fontWeight: "bold", textAlign: "center" },
            { id: "subtitle", type: "text", text: "MÚSICA · ARTE · CULTURA · DIVERSIÓN", x: 0, y: 625, width: 1080, fontSize: 28, fontFamily: "Arial", color: "#e0e7ff", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 201, y: 680, width: 678, height: 2, fill: "#a855f7", opacity: 0.6, selectable: false },
            { id: "artists", type: "text", text: "+30 ARTISTAS", x: 0, y: 720, width: 1080, fontSize: 60, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "genres", type: "text", text: "REGGAETON · TRAP · AFROBEAT · ELECTRO", x: 0, y: 805, width: 1080, fontSize: 28, fontFamily: "Arial", color: "#c4b5fd", textAlign: "center" },
            { id: "venue", type: "text", text: "Arena Metrópolis · Valencia", x: 0, y: 905, width: 1080, fontSize: 38, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA GENERAL DESDE 35€", x: 0, y: 1150, width: 1080, fontSize: 43, fontFamily: "Arial", color: "#c4b5fd", fontWeight: "bold", textAlign: "center" },
        ] },
        ],
    },

// 5 — Clases de Baile (Neón Amarillo) — semanal
    {
        id: 5,
        title: "Clases de Baile — Neón",
        category: "Clases",
        image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?q=80&w=800",
        premium: false,
        audience: ["academias"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 2713, height: 3375, fill: "#FFE600", selectable: false },
            { id: "deco-purple", type: "shape", shape: "rect", x: 1492, y: -200, width: 1055, height: 1300, fill: "#7B2FBE", opacity: 0.95, angle: 12 },
            { id: "top-band", type: "shape", shape: "rect", x: 0, y: 0, width: 2713, height: 550, fill: "#0D0D0D", selectable: false },
            { id: "title-line1", type: "text", text: "CLASES DE", x: 1356, y: 120, width: 2713, fontSize: 281, fontFamily: "Anton, Impact, sans-serif", color: "#FFFFFF", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: -10 },
            { id: "title-line2", type: "text", text: "BAILE", x: 1356, y: 370, width: 2713, fontSize: 281, fontFamily: "Anton, Impact, sans-serif", color: "#FFE600", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: -10 },
            { id: "artist-photo-9", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/ChatGPT%20Image%2012%20abr%202026%2C%2014_10_17.png", x: 1356, y: 1675, scaleX: 1.633, scaleY: 1.633, originX: "center", originY: "center" },
            { id: "bottom-band", type: "shape", shape: "rect", x: 0, y: 2725, width: 2713, height: 650, fill: "#0D0D0D", selectable: false },
            { id: "date", type: "text", text: "00.00.2024", x: 1356, y: 2775, width: 2713, fontSize: 241, fontFamily: "Anton, Impact, sans-serif", color: "#FFE600", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 5 },
            { id: "venue", type: "text", text: "DESDE LAS 17:00 | CALLE CUALQUIERA 123", x: 1356, y: 3055, width: 2713, fontSize: 70, fontFamily: "Montserrat, sans-serif", color: "#FFFFFF", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 30 },
        ] },
        ],
    },

// 6 — Dance Class (Negro & Amarillo) — workshop
    {
        id: 6,
        title: "Dance Class — Workshop",
        category: "Clases",
        image: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800",
        premium: true,
        audience: ["academias", "colegios"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 2713, height: 3375, fill: "#0D0D0D", selectable: false },
            { id: "stripes", type: "shape-pattern", shape: "rect", x: 1683, y: -150, width: 55, height: 850, fill: "#F5C518", count: 6, offsetX: 38, angle: -15 },
            { id: "studio-bg", type: "shape", shape: "rect", x: 121, y: 130, width: 1306, height: 140, fill: "#F5C518", selectable: false },
            { id: "studio-name", type: "text", text: "NOMBRE DEL ESTUDIO", x: 201, y: 150, width: 1206, fontSize: 70, fontFamily: "Montserrat, sans-serif", color: "#0D0D0D", fontWeight: "800", textAlign: "left", charSpacing: 20 },
            { id: "title1", type: "text", text: "DANCE", x: 121, y: 370, width: 2461, fontSize: 502, fontFamily: "Anton, Impact, sans-serif", color: "#FFFFFF", fontWeight: "900", textAlign: "left", charSpacing: -8 },
            { id: "title2", type: "text", text: "CLASS", x: 121, y: 850, width: 2461, fontSize: 502, fontFamily: "Anton, Impact, sans-serif", color: "transparent", stroke: "#F5C518", strokeWidth: 10, fontWeight: "900", textAlign: "left", charSpacing: -8 },
            { id: "description", type: "text", text: "Encuentra la libertad en el movimiento.\nÚnete a nuestra clase de baile.", x: 121, y: 1450, width: 1206, fontSize: 75, fontFamily: "Montserrat, sans-serif", color: "#FFFFFF", fontWeight: "400", textAlign: "left", lineHeight: 1.4 },
            { id: "price-bg", type: "shape", shape: "rect", x: 121, y: 1800, width: 553, height: 250, fill: "#F5C518", selectable: false },
            { id: "price", type: "text", text: "$75", x: 201, y: 1825, width: 502, fontSize: 131, fontFamily: "Anton, Impact, sans-serif", color: "#0D0D0D", fontWeight: "900", textAlign: "left" },
            { id: "price-label", type: "text", text: "/ PERSONA", x: 201, y: 1975, width: 502, fontSize: 45, fontFamily: "Montserrat, sans-serif", color: "#0D0D0D", fontWeight: "600", textAlign: "left" },
            { id: "schedule-bg", type: "shape", shape: "rect", x: 723, y: 1800, width: 854, height: 250, fill: "#F5C518", selectable: false },
            { id: "schedule", type: "text", text: "TODOS LOS DOMINGOS", x: 774, y: 1820, width: 804, fontSize: 55, fontFamily: "Montserrat, sans-serif", color: "#0D0D0D", fontWeight: "700", textAlign: "left" },
            { id: "time", type: "text", text: "9:00 AM", x: 774, y: 1905, width: 804, fontSize: 111, fontFamily: "Anton, Impact, sans-serif", color: "#0D0D0D", fontWeight: "900", textAlign: "left" },
            { id: "separator", type: "shape", shape: "rect", x: 0, y: 2125, width: 2713, height: 20, fill: "#F5C518", selectable: false },
            { id: "website", type: "text", text: "www.tusitio.com", x: 1356, y: 2225, width: 2713, fontSize: 75, fontFamily: "Montserrat, sans-serif", color: "#F5C518", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", underline: true },
            { id: "arrow", type: "text", text: "<<<", x: 1356, y: 3175, width: 502, fontSize: 121, fontFamily: "Montserrat, sans-serif", color: "#F5C518", fontWeight: "900", textAlign: "center", originX: "center", originY: "top" },
        ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
    // 7 — NEON NIGHT (Club electrónico, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
        {
        id: 7,
        title: "Neon Night",
        category: "Club / Discoteca",
        image: "https://images.unsplash.com/photo-1571266028243-d220c6a82b8d?q=80&w=800",
        premium: true,
        audience: ["productoras", "freelance"],
        variants: [
            // ── Post de Instagram (cuadrado 1080×1080)
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#05050f", selectable: false },
                { id: "glow-1", type: "shape", shape: "circle", x: 80, y: 100, width: 600, height: 600, radius: 300, fill: "#7c3aed", opacity: 0.20, selectable: false },
                { id: "glow-2", type: "shape", shape: "circle", x: 600, y: 500, width: 500, height: 500, radius: 250, fill: "#ec4899", opacity: 0.18, selectable: false },
                { id: "top-line", type: "shape", shape: "rect", x: 60, y: 80, width: 60, height: 2, fill: "#06b6d4", selectable: false },
                { id: "category", type: "text", text: "DJ SET · LIVE", x: 140, y: 68, width: 600, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "600", charSpacing: 400 },
                { id: "title", type: "text", text: "NEON", x: 540, y: 360, width: 1080, fontSize: 280, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
                { id: "title2", type: "text", text: "NIGHT", x: 540, y: 540, width: 1080, fontSize: 280, fontFamily: "Anton, Impact, sans-serif", color: "#06b6d4", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
                { id: "genres", type: "text", text: "TECHNO · HOUSE · BASS", x: 540, y: 700, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#e2e8f0", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 500 },
                { id: "diag-band", type: "shape", shape: "rect", x: -100, y: 770, width: 1300, height: 3, fill: "#ec4899", angle: -2, selectable: false },
                { id: "date-day", type: "text", text: "VIERNES 28 · JUNIO", x: 540, y: 850, width: 900, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
                { id: "date-time", type: "text", text: "23:00 — 06:00 HRS · CLUB ESPACIO MADRID", x: 540, y: 920, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#94a3b8", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
                { id: "price", type: "text", text: "ENTRADA 20€", x: 540, y: 990, width: 900, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
            ] },
            // ── Post vertical (1080×1350)
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#05050f", selectable: false },
                { id: "glow-1", type: "shape", shape: "circle", x: 200, y: 200, width: 700, height: 700, radius: 350, fill: "#7c3aed", opacity: 0.18, selectable: false },
                { id: "glow-2", type: "shape", shape: "circle", x: 600, y: 800, width: 600, height: 600, radius: 300, fill: "#ec4899", opacity: 0.16, selectable: false },
                { id: "glow-3", type: "shape", shape: "circle", x: -100, y: 1000, width: 500, height: 500, radius: 250, fill: "#06b6d4", opacity: 0.14, selectable: false },
                { id: "top-line", type: "shape", shape: "rect", x: 70, y: 110, width: 80, height: 2, fill: "#06b6d4", selectable: false },
                { id: "category", type: "text", text: "DJ SET · LIVE", x: 170, y: 95, width: 600, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "600", charSpacing: 400 },
                { id: "title", type: "text", text: "NEON", x: 540, y: 320, width: 1080, fontSize: 320, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
                { id: "title2", type: "text", text: "NIGHT", x: 540, y: 540, width: 1080, fontSize: 320, fontFamily: "Anton, Impact, sans-serif", color: "#06b6d4", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
                { id: "genres", type: "text", text: "TECHNO · HOUSE · BASS", x: 540, y: 740, width: 900, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#e2e8f0", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
                { id: "diag-band", type: "shape", shape: "rect", x: -100, y: 850, width: 1300, height: 4, fill: "#ec4899", angle: -2, selectable: false },
                { id: "date-box", type: "shape", shape: "rect", x: 90, y: 920, width: 900, height: 220, fill: "rgba(124, 58, 237, 0.15)", stroke: "#7c3aed", strokeWidth: 2, selectable: false },
                { id: "date-day", type: "text", text: "VIERNES 28", x: 540, y: 950, width: 900, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top" },
                { id: "date-month", type: "text", text: "JUNIO 2026", x: 540, y: 1020, width: 900, fontSize: 36, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
                { id: "date-time", type: "text", text: "23:00 — 06:00 HRS", x: 540, y: 1080, width: 900, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "#e2e8f0", fontWeight: "400", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "venue", type: "text", text: "CLUB ESPACIO · MADRID", x: 540, y: 1210, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
                { id: "price", type: "text", text: "ENTRADA 20€ · LISTA HASTA 01:00", x: 540, y: 1255, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#94a3b8", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            ] },
            // ── Historia de Instagram (1080×1920)
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#05050f", selectable: false },
                { id: "glow-1", type: "shape", shape: "circle", x: 100, y: 300, width: 700, height: 700, radius: 350, fill: "#7c3aed", opacity: 0.20, selectable: false },
                { id: "glow-2", type: "shape", shape: "circle", x: 600, y: 1100, width: 700, height: 700, radius: 350, fill: "#ec4899", opacity: 0.18, selectable: false },
                { id: "glow-3", type: "shape", shape: "circle", x: -150, y: 1500, width: 600, height: 600, radius: 300, fill: "#06b6d4", opacity: 0.14, selectable: false },
                { id: "top-line", type: "shape", shape: "rect", x: 80, y: 240, width: 100, height: 3, fill: "#06b6d4", selectable: false },
                { id: "category", type: "text", text: "DJ SET · LIVE", x: 200, y: 220, width: 700, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "600", charSpacing: 500 },
                { id: "title", type: "text", text: "NEON", x: 540, y: 600, width: 1080, fontSize: 380, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
                { id: "title2", type: "text", text: "NIGHT", x: 540, y: 870, width: 1080, fontSize: 380, fontFamily: "Anton, Impact, sans-serif", color: "#06b6d4", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
                { id: "genres", type: "text", text: "TECHNO · HOUSE · BASS", x: 540, y: 1110, width: 900, fontSize: 32, fontFamily: "Montserrat, sans-serif", color: "#e2e8f0", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 700 },
                { id: "diag-band", type: "shape", shape: "rect", x: -100, y: 1240, width: 1300, height: 4, fill: "#ec4899", angle: -2, selectable: false },
                { id: "date-box", type: "shape", shape: "rect", x: 90, y: 1330, width: 900, height: 280, fill: "rgba(124, 58, 237, 0.15)", stroke: "#7c3aed", strokeWidth: 2, selectable: false },
                { id: "date-day", type: "text", text: "VIERNES 28", x: 540, y: 1380, width: 900, fontSize: 64, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top" },
                { id: "date-month", type: "text", text: "JUNIO 2026", x: 540, y: 1465, width: 900, fontSize: 40, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
                { id: "date-time", type: "text", text: "23:00 — 06:00 HRS", x: 540, y: 1530, width: 900, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#e2e8f0", fontWeight: "400", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "venue", type: "text", text: "CLUB ESPACIO · MADRID", x: 540, y: 1720, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
                { id: "price", type: "text", text: "ENTRADA 20€ · LISTA HASTA 01:00", x: 540, y: 1780, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#94a3b8", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
    // 8 — LATIN HEAT (Salsa / Bachata, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
        {
        id: 8,
        title: "Latin Heat",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1545959570-a94084071b5d?q=80&w=800",
        premium: true,
        audience: ["productoras", "academias"],
        variants: [
            // ── Post de Instagram (1080×1080)
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#7c1d1d", selectable: false },
                { id: "warm-glow-1", type: "shape", shape: "circle", x: 200, y: 100, width: 700, height: 700, radius: 350, fill: "#f97316", opacity: 0.22, selectable: false },
                { id: "warm-glow-2", type: "shape", shape: "circle", x: 700, y: 500, width: 600, height: 600, radius: 300, fill: "#facc15", opacity: 0.14, selectable: false },
                { id: "vip-circle", type: "shape", shape: "circle", x: 900, y: 100, width: 130, height: 130, radius: 65, fill: "#facc15", selectable: false },
                { id: "vip-text", type: "text", text: "VIP", x: 965, y: 165, width: 200, fontSize: 36, fontFamily: "Cormorant Garamond, serif", color: "#7c1d1d", fontWeight: "700", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
                { id: "label", type: "text", text: "— NOCHE LATINA —", x: 540, y: 180, width: 800, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
                { id: "title-latin", type: "text", text: "Latin", x: 540, y: 380, width: 1080, fontSize: 180, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
                { id: "title-heat", type: "text", text: "HEAT", x: 540, y: 560, width: 1080, fontSize: 220, fontFamily: "Anton, Impact, sans-serif", color: "#fb923c", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
                { id: "divider", type: "shape", shape: "rect", x: 290, y: 700, width: 500, height: 1, fill: "#fde68a", opacity: 0.6, selectable: false },
                { id: "genres", type: "text", text: "SALSA · BACHATA · MERENGUE", x: 540, y: 740, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
                { id: "info-box", type: "shape", shape: "rect", x: 90, y: 820, width: 900, height: 190, fill: "rgba(0,0,0,0.5)", selectable: false },
                { id: "date", type: "text", text: "SÁBADO 12 JULIO", x: 540, y: 860, width: 900, fontSize: 38, fontFamily: "Cormorant Garamond, serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "center", originY: "top" },
                { id: "time", type: "text", text: "22:00 HRS · OPEN BAR", x: 540, y: 920, width: 900, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
                { id: "venue", type: "text", text: "SALA TROPICANA · BARCELONA", x: 540, y: 970, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#fde68a", fontWeight: "400", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
            ] },
            // ── Post vertical (1080×1350)
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#7c1d1d", selectable: false },
                { id: "warm-glow-1", type: "shape", shape: "circle", x: 200, y: 100, width: 800, height: 800, radius: 400, fill: "#f97316", opacity: 0.22, selectable: false },
                { id: "warm-glow-2", type: "shape", shape: "circle", x: 700, y: 700, width: 700, height: 700, radius: 350, fill: "#facc15", opacity: 0.14, selectable: false },
                { id: "warm-glow-3", type: "shape", shape: "circle", x: -100, y: 1100, width: 500, height: 500, radius: 250, fill: "#dc2626", opacity: 0.20, selectable: false },
                { id: "vip-circle", type: "shape", shape: "circle", x: 900, y: 130, width: 130, height: 130, radius: 65, fill: "#facc15", selectable: false },
                { id: "vip-text", type: "text", text: "VIP", x: 965, y: 195, width: 200, fontSize: 38, fontFamily: "Cormorant Garamond, serif", color: "#7c1d1d", fontWeight: "700", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
                { id: "label", type: "text", text: "— NOCHE LATINA —", x: 540, y: 220, width: 800, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
                { id: "title-latin", type: "text", text: "Latin", x: 540, y: 450, width: 1080, fontSize: 220, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
                { id: "title-heat", type: "text", text: "HEAT", x: 540, y: 650, width: 1080, fontSize: 280, fontFamily: "Anton, Impact, sans-serif", color: "#fb923c", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
                { id: "divider", type: "shape", shape: "rect", x: 290, y: 820, width: 500, height: 1, fill: "#fde68a", opacity: 0.6, selectable: false },
                { id: "genres", type: "text", text: "SALSA · BACHATA · MERENGUE", x: 540, y: 870, width: 900, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 500 },
                { id: "info-box", type: "shape", shape: "rect", x: 90, y: 970, width: 900, height: 280, fill: "rgba(0,0,0,0.5)", selectable: false },
                { id: "date", type: "text", text: "SÁBADO 12 JULIO", x: 540, y: 1020, width: 900, fontSize: 50, fontFamily: "Cormorant Garamond, serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "center", originY: "top" },
                { id: "time", type: "text", text: "22:00 HRS · OPEN BAR", x: 540, y: 1100, width: 900, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
                { id: "venue", type: "text", text: "SALA TROPICANA · BARCELONA", x: 540, y: 1170, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fde68a", fontWeight: "400", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
                { id: "footer", type: "text", text: "ENTRADA 15€ ANTICIPADA · 20€ EN PUERTA", x: 540, y: 1300, width: 900, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#fde68a", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
            ] },
            // ── Historia de Instagram (1080×1920)
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#7c1d1d", selectable: false },
                { id: "warm-glow-1", type: "shape", shape: "circle", x: 200, y: 300, width: 900, height: 900, radius: 450, fill: "#f97316", opacity: 0.22, selectable: false },
                { id: "warm-glow-2", type: "shape", shape: "circle", x: 700, y: 1100, width: 800, height: 800, radius: 400, fill: "#facc15", opacity: 0.14, selectable: false },
                { id: "warm-glow-3", type: "shape", shape: "circle", x: -100, y: 1500, width: 600, height: 600, radius: 300, fill: "#dc2626", opacity: 0.20, selectable: false },
                { id: "vip-circle", type: "shape", shape: "circle", x: 900, y: 280, width: 140, height: 140, radius: 70, fill: "#facc15", selectable: false },
                { id: "vip-text", type: "text", text: "VIP", x: 970, y: 350, width: 200, fontSize: 42, fontFamily: "Cormorant Garamond, serif", color: "#7c1d1d", fontWeight: "700", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
                { id: "label", type: "text", text: "— NOCHE LATINA —", x: 540, y: 380, width: 800, fontSize: 28, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 700 },
                { id: "title-latin", type: "text", text: "Latin", x: 540, y: 700, width: 1080, fontSize: 280, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
                { id: "title-heat", type: "text", text: "HEAT", x: 540, y: 970, width: 1080, fontSize: 340, fontFamily: "Anton, Impact, sans-serif", color: "#fb923c", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
                { id: "divider", type: "shape", shape: "rect", x: 290, y: 1190, width: 500, height: 1, fill: "#fde68a", opacity: 0.6, selectable: false },
                { id: "genres", type: "text", text: "SALSA · BACHATA · MERENGUE", x: 540, y: 1250, width: 900, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
                { id: "info-box", type: "shape", shape: "rect", x: 90, y: 1380, width: 900, height: 340, fill: "rgba(0,0,0,0.5)", selectable: false },
                { id: "date", type: "text", text: "SÁBADO 12 JULIO", x: 540, y: 1430, width: 900, fontSize: 60, fontFamily: "Cormorant Garamond, serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "center", originY: "top" },
                { id: "time", type: "text", text: "22:00 HRS · OPEN BAR", x: 540, y: 1520, width: 900, fontSize: 34, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
                { id: "venue", type: "text", text: "SALA TROPICANA · BARCELONA", x: 540, y: 1600, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#fde68a", fontWeight: "400", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
                { id: "footer", type: "text", text: "ENTRADA 15€ ANTICIPADA · 20€ EN PUERTA", x: 540, y: 1800, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fde68a", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
    // 9 — FESTIVAL POP (Festival, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 9,
        title: "Festival Pop",
        category: "Festival",
        image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800",
        premium: true,
        audience: ["productoras", "agencias"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
            // Fondo magenta-cyan gradiente con bloques
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a1f", selectable: false },
            // Bloques de color para simular gradiente
            { id: "grad-1", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 450, fill: "#ec4899", opacity: 0.85, selectable: false },
            { id: "grad-2", type: "shape", shape: "rect", x: 0, y: 450, width: 1080, height: 450, fill: "#8b5cf6", opacity: 0.85, selectable: false },
            { id: "grad-3", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 450, fill: "#06b6d4", opacity: 0.85, selectable: false },
            // Forma circular decorativa
            { id: "sun", type: "shape", shape: "circle", x: 540, y: 540, width: 280, height: 280, radius: 140, fill: "#fef08a", opacity: 0.95, selectable: false },
            // Etiqueta arriba
            { id: "label", type: "text", text: "FESTIVAL · 2026", x: 540, y: 130, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "700", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            // Fechas grandes protagonistas (cada número diferente color)
            { id: "date-18", type: "text", text: "18", x: 270, y: 280, width: 250, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#fef08a", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            { id: "date-dot1", type: "text", text: "·", x: 460, y: 280, width: 80, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            { id: "date-19", type: "text", text: "19", x: 540, y: 280, width: 250, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            { id: "date-dot2", type: "text", text: "·", x: 730, y: 280, width: 80, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            { id: "date-20", type: "text", text: "20", x: 810, y: 280, width: 250, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#fef08a", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            { id: "month", type: "text", text: "JULIO 2026", x: 540, y: 420, width: 900, fontSize: 36, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
            // Título central
            { id: "title", type: "text", text: "AURORA", x: 540, y: 700, width: 1080, fontSize: 140, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a1f", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            { id: "subtitle", type: "text", text: "MUSIC FESTIVAL", x: 540, y: 800, width: 1080, fontSize: 32, fontFamily: "Montserrat, sans-serif", color: "#0a0a1f", fontWeight: "700", textAlign: "center", originX: "center", originY: "center", charSpacing: 1200 },
            // Lista de artistas en bloque cyan
            { id: "artists-label", type: "text", text: "— LINE UP —", x: 540, y: 970, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#0a0a1f", fontWeight: "600", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            { id: "artist-1", type: "text", text: "DJ ARTIST · BANDA NORTE · GRUPO SUR", x: 540, y: 1030, width: 1000, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "700", textAlign: "center", originX: "center", originY: "center" },
            { id: "artist-2", type: "text", text: "LOS ESTRELLAS · MC SOUND · ELÉCTRICA", x: 540, y: 1080, width: 1000, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fef08a", fontWeight: "500", textAlign: "center", originX: "center", originY: "center" },
            { id: "artist-3", type: "text", text: "+ 20 ARTISTAS · 4 ESCENARIOS", x: 540, y: 1130, width: 1000, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            // Footer info
            { id: "venue", type: "text", text: "RECINTO FERIAL · MADRID", x: 540, y: 1230, width: 1000, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#0a0a1f", fontWeight: "700", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
            { id: "tickets", type: "text", text: "ENTRADAS DESDE 35€ · WWW.AURORAFEST.COM", x: 540, y: 1280, width: 1000, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#0a0a1f", fontWeight: "500", textAlign: "center", originX: "center", originY: "center" },
        ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
    // 10 — BLACK TIE (Gala corporativa, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
        {
        id: 10,
        title: "Black Tie",
        category: "Corporativo",
        image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=800",
        premium: true,
        audience: ["instituciones", "agencias"],
        variants: [
            // ── Post de Instagram (1080×1080)
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#0a0a0a", selectable: false },
                { id: "vignette-1", type: "shape", shape: "circle", x: 540, y: 540, width: 1400, height: 1400, radius: 700, fill: "#1a1410", opacity: 0.6, selectable: false },
                { id: "frame-t", type: "shape", shape: "rect", x: 80, y: 80, width: 920, height: 1, fill: "#d4a373", selectable: false },
                { id: "frame-b", type: "shape", shape: "rect", x: 80, y: 999, width: 920, height: 1, fill: "#d4a373", selectable: false },
                { id: "frame-l", type: "shape", shape: "rect", x: 80, y: 80, width: 1, height: 920, fill: "#d4a373", selectable: false },
                { id: "frame-r", type: "shape", shape: "rect", x: 999, y: 80, width: 1, height: 920, fill: "#d4a373", selectable: false },
                { id: "label", type: "text", text: "— GALA 2026 —", x: 540, y: 200, width: 800, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#d4a373", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 800 },
                { id: "title-1", type: "text", text: "Black", x: 540, y: 400, width: 1080, fontSize: 150, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
                { id: "amp", type: "text", text: "&", x: 540, y: 520, width: 1080, fontSize: 90, fontFamily: "Cormorant Garamond, serif", color: "#d4a373", fontWeight: "300", textAlign: "center", originX: "center", originY: "center" },
                { id: "title-2", type: "text", text: "Tie", x: 540, y: 640, width: 1080, fontSize: 150, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
                { id: "subtitle", type: "text", text: "Una noche de elegancia y distinción", x: 540, y: 770, width: 900, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "300", textAlign: "center", originX: "center", originY: "center" },
                { id: "info-divider", type: "shape", shape: "rect", x: 440, y: 830, width: 200, height: 1, fill: "#d4a373", opacity: 0.4, selectable: false },
                { id: "date", type: "text", text: "SÁBADO  5  DE  JULIO", x: 540, y: 870, width: 900, fontSize: 26, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "21:00 H  —  HOTEL PALACE", x: 540, y: 920, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#d4a373", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
            ] },
            // ── Post vertical (1080×1350)
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a0a", selectable: false },
                { id: "vignette-1", type: "shape", shape: "circle", x: 540, y: 675, width: 1500, height: 1500, radius: 750, fill: "#1a1410", opacity: 0.6, selectable: false },
                { id: "frame-t", type: "shape", shape: "rect", x: 80, y: 80, width: 920, height: 1, fill: "#d4a373", selectable: false },
                { id: "frame-b", type: "shape", shape: "rect", x: 80, y: 1269, width: 920, height: 1, fill: "#d4a373", selectable: false },
                { id: "frame-l", type: "shape", shape: "rect", x: 80, y: 80, width: 1, height: 1190, fill: "#d4a373", selectable: false },
                { id: "frame-r", type: "shape", shape: "rect", x: 999, y: 80, width: 1, height: 1190, fill: "#d4a373", selectable: false },
                { id: "label", type: "text", text: "— GALA 2026 —", x: 540, y: 230, width: 800, fontSize: 24, fontFamily: "Cormorant Garamond, serif", color: "#d4a373", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 800 },
                { id: "title-1", type: "text", text: "Black", x: 540, y: 480, width: 1080, fontSize: 180, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
                { id: "amp", type: "text", text: "&", x: 540, y: 620, width: 1080, fontSize: 110, fontFamily: "Cormorant Garamond, serif", color: "#d4a373", fontWeight: "300", textAlign: "center", originX: "center", originY: "center" },
                { id: "title-2", type: "text", text: "Tie", x: 540, y: 770, width: 1080, fontSize: 180, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
                { id: "subtitle", type: "text", text: "Una noche de elegancia y distinción", x: 540, y: 940, width: 900, fontSize: 24, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "300", textAlign: "center", originX: "center", originY: "center" },
                { id: "info-divider", type: "shape", shape: "rect", x: 440, y: 1010, width: 200, height: 1, fill: "#d4a373", opacity: 0.4, selectable: false },
                { id: "date", type: "text", text: "SÁBADO  5  DE  JULIO", x: 540, y: 1060, width: 900, fontSize: 32, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
                { id: "venue", type: "text", text: "21:00 H  —  HOTEL PALACE", x: 540, y: 1120, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#d4a373", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 500 },
                { id: "rsvp", type: "text", text: "RSVP  ·  +34 600 000 000", x: 540, y: 1180, width: 900, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "#fde68a", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
            ] },
            // ── Historia de Instagram (1080×1920)
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0a0a", selectable: false },
                { id: "vignette-1", type: "shape", shape: "circle", x: 540, y: 960, width: 1700, height: 1700, radius: 850, fill: "#1a1410", opacity: 0.6, selectable: false },
                { id: "frame-t", type: "shape", shape: "rect", x: 80, y: 80, width: 920, height: 1, fill: "#d4a373", selectable: false },
                { id: "frame-b", type: "shape", shape: "rect", x: 80, y: 1839, width: 920, height: 1, fill: "#d4a373", selectable: false },
                { id: "frame-l", type: "shape", shape: "rect", x: 80, y: 80, width: 1, height: 1760, fill: "#d4a373", selectable: false },
                { id: "frame-r", type: "shape", shape: "rect", x: 999, y: 80, width: 1, height: 1760, fill: "#d4a373", selectable: false },
                { id: "label", type: "text", text: "— GALA 2026 —", x: 540, y: 320, width: 800, fontSize: 28, fontFamily: "Cormorant Garamond, serif", color: "#d4a373", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 900 },
                { id: "title-1", type: "text", text: "Black", x: 540, y: 720, width: 1080, fontSize: 230, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
                { id: "amp", type: "text", text: "&", x: 540, y: 900, width: 1080, fontSize: 140, fontFamily: "Cormorant Garamond, serif", color: "#d4a373", fontWeight: "300", textAlign: "center", originX: "center", originY: "center" },
                { id: "title-2", type: "text", text: "Tie", x: 540, y: 1090, width: 1080, fontSize: 230, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
                { id: "subtitle", type: "text", text: "Una noche de elegancia y distinción", x: 540, y: 1330, width: 900, fontSize: 28, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "300", textAlign: "center", originX: "center", originY: "center" },
                { id: "info-divider", type: "shape", shape: "rect", x: 440, y: 1430, width: 200, height: 1, fill: "#d4a373", opacity: 0.4, selectable: false },
                { id: "date", type: "text", text: "SÁBADO  5  DE  JULIO", x: 540, y: 1500, width: 900, fontSize: 40, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
                { id: "venue", type: "text", text: "21:00 H  —  HOTEL PALACE", x: 540, y: 1580, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#d4a373", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 500 },
                { id: "rsvp", type: "text", text: "RSVP  ·  +34 600 000 000", x: 540, y: 1720, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fde68a", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
    // 11 — STREET WAVE (Reggaeton / Trap Urbano, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 11,
        title: "Street Wave",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800",
        premium: true,
        audience: ["productoras", "freelance"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
            // Fondo negro
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a0a", selectable: false },
            // Bloques de color cortados como graffiti
            { id: "block-lime", type: "shape", shape: "rect", x: 0, y: 200, width: 700, height: 280, fill: "#84cc16", angle: -3, selectable: false },
            { id: "block-magenta", type: "shape", shape: "rect", x: 400, y: 700, width: 800, height: 200, fill: "#d946ef", angle: 2, selectable: false },
            // Líneas de glitch horizontales
            { id: "glitch-1", type: "shape", shape: "rect", x: 0, y: 580, width: 1080, height: 6, fill: "#84cc16", selectable: false },
            { id: "glitch-2", type: "shape", shape: "rect", x: 0, y: 595, width: 700, height: 2, fill: "#d946ef", selectable: false },
            { id: "glitch-3", type: "shape", shape: "rect", x: 200, y: 1180, width: 880, height: 4, fill: "#d946ef", selectable: false },
            // Etiqueta superior tipo tag
            { id: "tag-bg", type: "shape", shape: "rect", x: 80, y: 100, width: 200, height: 38, fill: "#84cc16", selectable: false },
            { id: "tag-text", type: "text", text: "/// URBANO", x: 100, y: 110, width: 200, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", fontWeight: "900" },
            // Numero grande decorativo
            { id: "n-bg", type: "text", text: "01", x: 880, y: 130, width: 200, fontSize: 100, fontFamily: "Anton, Impact, sans-serif", color: "rgba(132, 204, 22, 0.25)", fontWeight: "900", textAlign: "right", originX: "right", originY: "top" },
            // Título principal - vertical/rota
            { id: "title", type: "text", text: "STREET", x: 540, y: 320, width: 1080, fontSize: 180, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", angle: -3 },
            { id: "title2", type: "text", text: "WAVE", x: 540, y: 470, width: 1080, fontSize: 220, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", angle: -3, stroke: "#84cc16", strokeWidth: 0 },
            // Subtítulo géneros tipo lista
            { id: "genres", type: "text", text: "REGGAETON  /  TRAP  /  DEMBOW", x: 540, y: 660, width: 1000, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#84cc16", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
            // Bloque magenta con info principal
            { id: "feat-label", type: "text", text: "FEAT", x: 540, y: 760, width: 1000, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", charSpacing: 800 },
            { id: "artists", type: "text", text: "MC FLOW · DJ HOSTILE · TRAP KIDS", x: 540, y: 820, width: 1000, fontSize: 34, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            // Bloque fecha grande
            { id: "date-bg", type: "shape", shape: "rect", x: 90, y: 970, width: 900, height: 160, fill: "rgba(132, 204, 22, 0.12)", stroke: "#84cc16", strokeWidth: 2, selectable: false },
            { id: "date", type: "text", text: "SÁBADO 22 AGOSTO", x: 540, y: 1010, width: 900, fontSize: 48, fontFamily: "Anton, Impact, sans-serif", color: "#84cc16", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
            { id: "time", type: "text", text: "23:00 / OPEN BAR HASTA 01:00", x: 540, y: 1075, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "500", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
            // Footer
            { id: "venue", type: "text", text: "WAREHOUSE 47 · MADRID", x: 540, y: 1220, width: 1000, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#d946ef", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            { id: "price", type: "text", text: "ENTRADA 12€ · NO DRESS CODE", x: 540, y: 1265, width: 1000, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
        ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 12 — Crossover Salsa (3 artistas) — estilo flyer baile social
//      Slots de artistas con glow blanco automático
// ─────────────────────────────────────────────────────────────────────
    {
        id: 12,
        title: "Crossover 3 Artistas",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1561489413-985b06da5bee?q=80&w=800",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // ── FONDO ──────────────────────────────────────────────────
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1a0000", selectable: false },
                // Fondo ciudad/ambiente con tinte rojo
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1200", x: 0, y: 0, scaleX: 0.9, scaleY: 0.9, opacity: 0.35 },
                // Overlay rojo general para cohesión
                { id: "overlay-red", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(180,30,30,0.35)", selectable: false },

                // ── DECORACIONES SUPERIORES (esquinas de flores rojas — placeholders) ──
                // Pueden reemplazarse por PNGs de flores reales en sesiones futuras
                { id: "deco-top-left", type: "shape", shape: "circle", x: 0, y: 0, width: 280, height: 280, fill: "rgba(220,38,38,0.4)", opacity: 0.65, selectable: false },
                { id: "deco-top-right", type: "shape", shape: "circle", x: 800, y: 0, width: 280, height: 280, fill: "rgba(220,38,38,0.4)", opacity: 0.65, selectable: false },

                // ── SLOTS DE ARTISTAS (3 en triángulo: 2 arriba, 1 grande abajo centrado) ──
                // Cada slot usa una foto placeholder + shadow blanca difusa (glow)
                // El usuario sustituye estas fotos por sus colaboradores (con remove-bg)
                { id: "artist-1", type: "image", src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600", x: 240, y: 250, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 35, offsetX: 0, offsetY: 0 } },
                { id: "artist-2", type: "image", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600", x: 840, y: 250, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 35, offsetX: 0, offsetY: 0 } },
                // Artista 3 (centro, más prominente — el "headliner")
                { id: "artist-3", type: "image", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600", x: 540, y: 380, scaleX: 0.75, scaleY: 0.75, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 45, offsetX: 0, offsetY: 0 } },

                // ── BLOQUE DE TÍTULO/INFO PRINCIPAL ────────────────────────
                { id: "title-bg", type: "shape", shape: "rect", x: 80, y: 880, width: 920, height: 320, fill: "rgba(13,0,0,0.7)", radius: 12, selectable: false },
                // Fecha
                { id: "date", type: "text", text: "SÁBADO 16 DE MAYO  |  18:00 A 23:00", x: 0, y: 900, width: 1080, fontSize: 30, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                // Título del evento
                { id: "title", type: "text", text: "TARDEO CROSSOVER", x: 0, y: 945, width: 1080, fontSize: 75, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                // Estilos / géneros
                { id: "genres", type: "text", text: "BACHATA · SALSA · PERREO", x: 0, y: 1035, width: 1080, fontSize: 32, fontFamily: "Arial", color: "#fca5a5", textAlign: "center", charSpacing: 200 },
                // DJ
                { id: "dj", type: "text", text: "DJ MAURO", x: 0, y: 1095, width: 1080, fontSize: 42, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },

                // ── BANDA HORARIOS (franja blanca) ─────────────────────────
                { id: "schedule-bg", type: "shape", shape: "rect", x: 60, y: 1180, width: 960, height: 70, fill: "rgba(255,255,255,0.95)", selectable: false },
                { id: "schedule-1", type: "text", text: "18:00 TALLER DE BACHATA · 18:45 A 23:00 SOCIAL", x: 0, y: 1198, width: 1080, fontSize: 24, fontFamily: "Arial", color: "#7f1d1d", fontWeight: "bold", textAlign: "center" },

                // ── INFO INFERIOR ──────────────────────────────────────────
                { id: "price", type: "text", text: "ENTRADA: 15€ EN PUERTA (1 COPA / 2 REFRESCOS)", x: 0, y: 1265, width: 1080, fontSize: 20, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "venue", type: "text", text: "C/ VICTORIA 6 · DISCOTECA EL SON · METRO SOL", x: 0, y: 1300, width: 1080, fontSize: 18, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
                { id: "phone", type: "text", text: "RESERVAS: +34 600 000 000", x: 0, y: 1325, width: 1080, fontSize: 16, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 13 — Crossover Salsa (5 artistas) — composición diamante
//      Headliner central grande + 2 a los lados arriba + 2 a los lados abajo
// ─────────────────────────────────────────────────────────────────────
    {
        id: 13,
        title: "Crossover 5 Artistas",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1574391884720-bbc049ec09ad?q=80&w=800",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // ── FONDO ──────────────────────────────────────────────────
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1a0000", selectable: false },
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1200", x: 0, y: 0, scaleX: 0.9, scaleY: 0.9, opacity: 0.35 },
                { id: "overlay-red", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(180,30,30,0.35)", selectable: false },

                // ── DECORACIONES SUPERIORES ────────────────────────────────
                { id: "deco-top-left", type: "shape", shape: "circle", x: 0, y: 0, width: 280, height: 280, fill: "rgba(220,38,38,0.4)", opacity: 0.65, selectable: false },
                { id: "deco-top-right", type: "shape", shape: "circle", x: 800, y: 0, width: 280, height: 280, fill: "rgba(220,38,38,0.4)", opacity: 0.65, selectable: false },

                // ── SLOTS DE ARTISTAS (5 en composición diamante) ──────────
                // Los 2 de arriba a los lados (más pequeños)
                { id: "artist-1", type: "image", src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600", x: 200, y: 200, scaleX: 0.48, scaleY: 0.48, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 32, offsetX: 0, offsetY: 0 } },
                { id: "artist-2", type: "image", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600", x: 880, y: 200, scaleX: 0.48, scaleY: 0.48, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 32, offsetX: 0, offsetY: 0 } },
                // Los 2 de abajo a los lados (un poco más bajos)
                { id: "artist-3", type: "image", src: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=600", x: 180, y: 500, scaleX: 0.48, scaleY: 0.48, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 32, offsetX: 0, offsetY: 0 } },
                { id: "artist-4", type: "image", src: "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=600", x: 900, y: 500, scaleX: 0.48, scaleY: 0.48, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 32, offsetX: 0, offsetY: 0 } },
                // Artista headliner en centro (más grande)
                { id: "artist-5", type: "image", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600", x: 540, y: 320, scaleX: 0.72, scaleY: 0.72, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 45, offsetX: 0, offsetY: 0 } },

                // ── BLOQUE DE TÍTULO/INFO ──────────────────────────────────
                { id: "title-bg", type: "shape", shape: "rect", x: 80, y: 880, width: 920, height: 320, fill: "rgba(13,0,0,0.7)", radius: 12, selectable: false },
                { id: "date", type: "text", text: "SÁBADO 16 DE MAYO  |  18:00 A 23:00", x: 0, y: 900, width: 1080, fontSize: 30, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "title", type: "text", text: "TARDEO CROSSOVER", x: 0, y: 945, width: 1080, fontSize: 75, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "genres", type: "text", text: "BACHATA · SALSA · PERREO", x: 0, y: 1035, width: 1080, fontSize: 32, fontFamily: "Arial", color: "#fca5a5", textAlign: "center", charSpacing: 200 },
                { id: "dj", type: "text", text: "DJ MAURO", x: 0, y: 1095, width: 1080, fontSize: 42, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },

                // ── BANDA HORARIOS ─────────────────────────────────────────
                { id: "schedule-bg", type: "shape", shape: "rect", x: 60, y: 1180, width: 960, height: 70, fill: "rgba(255,255,255,0.95)", selectable: false },
                { id: "schedule-1", type: "text", text: "18:00 TALLER DE BACHATA · 18:45 A 23:00 SOCIAL", x: 0, y: 1198, width: 1080, fontSize: 24, fontFamily: "Arial", color: "#7f1d1d", fontWeight: "bold", textAlign: "center" },

                // ── INFO INFERIOR ──────────────────────────────────────────
                { id: "price", type: "text", text: "ENTRADA: 15€ EN PUERTA (1 COPA / 2 REFRESCOS)", x: 0, y: 1265, width: 1080, fontSize: 20, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "venue", type: "text", text: "C/ VICTORIA 6 · DISCOTECA EL SON · METRO SOL", x: 0, y: 1300, width: 1080, fontSize: 18, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
                { id: "phone", type: "text", text: "RESERVAS: +34 600 000 000", x: 0, y: 1325, width: 1080, fontSize: 16, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 14 — Crossover 7 Artistas — replica del flyer estilo "Puro Disfrute"
//      3 artistas arriba (centro mas alto) + 4 artistas abajo
//      Todos los placeholders usan la misma foto del CRM (Peligroficial)
//      Tu sustituyes cada slot por el artista real al editar.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 14,
        title: "Crossover 7 Artistas",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1574391884720-bbc049ec09ad?q=80&w=800",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // ── FONDO ──────────────────────────────────────────────────
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1a0000", selectable: false },
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1200", x: 0, y: 0, scaleX: 0.9, scaleY: 0.9, opacity: 0.35 },
                { id: "overlay-red", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(180,30,30,0.35)", selectable: false },

                // ── DECORACIONES SUPERIORES ────────────────────────────────
                { id: "deco-top-left", type: "shape", shape: "circle", x: 0, y: 0, width: 280, height: 280, fill: "rgba(220,38,38,0.4)", opacity: 0.65, selectable: false },
                { id: "deco-top-right", type: "shape", shape: "circle", x: 800, y: 0, width: 280, height: 280, fill: "rgba(220,38,38,0.4)", opacity: 0.65, selectable: false },

                // ── FILA SUPERIOR (3 artistas) ─────────────────────────────
                // El del centro arriba ligeramente m\u00e1s alto y grande (headliner top)
                { id: "artist-top-left", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/collaborators/6668d125-f5a6-488d-89c1-5b87bd5add11/mpfjmi50-ecugligq-peligroficial.jpg", x: 200, y: 200, scaleX: 0.42, scaleY: 0.42, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "artist-top-center", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/collaborators/6668d125-f5a6-488d-89c1-5b87bd5add11/mpfjmi50-ecugligq-peligroficial.jpg", x: 540, y: 170, scaleX: 0.50, scaleY: 0.50, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 38, offsetX: 0, offsetY: 0 } },
                { id: "artist-top-right", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/collaborators/6668d125-f5a6-488d-89c1-5b87bd5add11/mpfjmi50-ecugligq-peligroficial.jpg", x: 880, y: 200, scaleX: 0.42, scaleY: 0.42, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 30, offsetX: 0, offsetY: 0 } },

                // ── FILA INFERIOR (4 artistas, m\u00e1s peque\u00f1os) ────────────────
                { id: "artist-bot-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/collaborators/6668d125-f5a6-488d-89c1-5b87bd5add11/mpfjmi50-ecugligq-peligroficial.jpg", x: 150, y: 510, scaleX: 0.38, scaleY: 0.38, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 28, offsetX: 0, offsetY: 0 } },
                { id: "artist-bot-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/collaborators/6668d125-f5a6-488d-89c1-5b87bd5add11/mpfjmi50-ecugligq-peligroficial.jpg", x: 410, y: 540, scaleX: 0.38, scaleY: 0.38, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 28, offsetX: 0, offsetY: 0 } },
                { id: "artist-bot-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/collaborators/6668d125-f5a6-488d-89c1-5b87bd5add11/mpfjmi50-ecugligq-peligroficial.jpg", x: 670, y: 540, scaleX: 0.38, scaleY: 0.38, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 28, offsetX: 0, offsetY: 0 } },
                { id: "artist-bot-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/collaborators/6668d125-f5a6-488d-89c1-5b87bd5add11/mpfjmi50-ecugligq-peligroficial.jpg", x: 930, y: 510, scaleX: 0.38, scaleY: 0.38, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 28, offsetX: 0, offsetY: 0 } },

                // ── BLOQUE DE T\u00cdTULO/INFO ──────────────────────────────────
                { id: "title-bg", type: "shape", shape: "rect", x: 80, y: 880, width: 920, height: 320, fill: "rgba(13,0,0,0.7)", radius: 12, selectable: false },
                { id: "date", type: "text", text: "S\u00c1BADO 16 DE MAYO  |  18:00 A 23:00", x: 0, y: 900, width: 1080, fontSize: 30, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "title", type: "text", text: "TARDEO CROSSOVER", x: 0, y: 945, width: 1080, fontSize: 75, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "genres", type: "text", text: "BACHATA \u00b7 SALSA \u00b7 PERREO", x: 0, y: 1035, width: 1080, fontSize: 32, fontFamily: "Arial", color: "#fca5a5", textAlign: "center", charSpacing: 200 },
                { id: "dj", type: "text", text: "DJ MAURO", x: 0, y: 1095, width: 1080, fontSize: 42, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },

                // ── BANDA HORARIOS ─────────────────────────────────────────
                { id: "schedule-bg", type: "shape", shape: "rect", x: 60, y: 1180, width: 960, height: 70, fill: "rgba(255,255,255,0.95)", selectable: false },
                { id: "schedule-1", type: "text", text: "18:00 TALLER DE BACHATA \u00b7 18:45 A 23:00 SOCIAL", x: 0, y: 1198, width: 1080, fontSize: 24, fontFamily: "Arial", color: "#7f1d1d", fontWeight: "bold", textAlign: "center" },

                // ── INFO INFERIOR ──────────────────────────────────────────
                { id: "price", type: "text", text: "ENTRADA: 15\u20ac EN PUERTA (1 COPA / 2 REFRESCOS)", x: 0, y: 1265, width: 1080, fontSize: 20, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "venue", type: "text", text: "C/ VICTORIA 6 \u00b7 DISCOTECA EL SON \u00b7 METRO SOL", x: 0, y: 1300, width: 1080, fontSize: 18, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
                { id: "phone", type: "text", text: "RESERVAS: +34 600 000 000", x: 0, y: 1325, width: 1080, fontSize: 16, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 15 — Crossover 5 Artistas Demo — con fotos REALES sin fondo en R2
//      Layout diamante (igual que #13) pero con fotos de modelos demo
//      en lugar de placeholders Unsplash. Las fotos estan en
//      pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/
// ─────────────────────────────────────────────────────────────────────
    {
        id: 15,
        title: "Crossover 5 Artistas Demo",
        category: "Fiesta",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // ── FONDO ──────────────────────────────────────────────────
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1a0000", selectable: false },
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1200", x: 0, y: 0, scaleX: 0.9, scaleY: 0.9, opacity: 0.35 },
                { id: "overlay-red", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(180,30,30,0.35)", selectable: false },

                // ── DECORACIONES SUPERIORES ────────────────────────────────
                { id: "deco-top-left", type: "shape", shape: "circle", x: 0, y: 0, width: 280, height: 280, fill: "rgba(220,38,38,0.4)", opacity: 0.65, selectable: false },
                { id: "deco-top-right", type: "shape", shape: "circle", x: 800, y: 0, width: 280, height: 280, fill: "rgba(220,38,38,0.4)", opacity: 0.65, selectable: false },

                // ── SLOTS DE ARTISTAS (5 en composición diamante con fotos reales) ──
                // 2 arriba a los lados (individuales Nia y Malik)
                { id: "artist-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 200, y: 200, scaleX: 0.48, scaleY: 0.48, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 32, offsetX: 0, offsetY: 0 } },
                { id: "artist-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 880, y: 200, scaleX: 0.48, scaleY: 0.48, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 32, offsetX: 0, offsetY: 0 } },
                // 2 abajo a los lados (PAREJAS)
                { id: "artist-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 180, y: 500, scaleX: 0.48, scaleY: 0.48, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 32, offsetX: 0, offsetY: 0 } },
                { id: "artist-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 900, y: 500, scaleX: 0.48, scaleY: 0.48, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 32, offsetX: 0, offsetY: 0 } },
                // Headliner en centro (Damian, foto individual mas prominente)
                { id: "artist-5", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 540, y: 320, scaleX: 0.72, scaleY: 0.72, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 45, offsetX: 0, offsetY: 0 } },

                // ── BLOQUE DE TÍTULO/INFO ──────────────────────────────────
                { id: "title-bg", type: "shape", shape: "rect", x: 80, y: 880, width: 920, height: 320, fill: "rgba(13,0,0,0.7)", radius: 12, selectable: false },
                { id: "date", type: "text", text: "S\u00c1BADO 16 DE MAYO  |  18:00 A 23:00", x: 0, y: 900, width: 1080, fontSize: 30, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "title", type: "text", text: "TARDEO CROSSOVER", x: 0, y: 945, width: 1080, fontSize: 75, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "genres", type: "text", text: "BACHATA \u00b7 SALSA \u00b7 PERREO", x: 0, y: 1035, width: 1080, fontSize: 32, fontFamily: "Arial", color: "#fca5a5", textAlign: "center", charSpacing: 200 },
                { id: "dj", type: "text", text: "DJ MAURO", x: 0, y: 1095, width: 1080, fontSize: 42, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },

                // ── BANDA HORARIOS ─────────────────────────────────────────
                { id: "schedule-bg", type: "shape", shape: "rect", x: 60, y: 1180, width: 960, height: 70, fill: "rgba(255,255,255,0.95)", selectable: false },
                { id: "schedule-1", type: "text", text: "18:00 TALLER DE BACHATA \u00b7 18:45 A 23:00 SOCIAL", x: 0, y: 1198, width: 1080, fontSize: 24, fontFamily: "Arial", color: "#7f1d1d", fontWeight: "bold", textAlign: "center" },

                // ── INFO INFERIOR ──────────────────────────────────────────
                { id: "price", type: "text", text: "ENTRADA: 15\u20ac EN PUERTA (1 COPA / 2 REFRESCOS)", x: 0, y: 1265, width: 1080, fontSize: 20, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
                { id: "venue", type: "text", text: "C/ VICTORIA 6 \u00b7 DISCOTECA EL SON \u00b7 METRO SOL", x: 0, y: 1300, width: 1080, fontSize: 18, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
                { id: "phone", type: "text", text: "RESERVAS: +34 600 000 000", x: 0, y: 1325, width: 1080, fontSize: 16, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
            ] },
        ],
    },

// ═════════════════════════════════════════════════════════════════════
// FAMILIA CONCIERTOS — 6 plantillas para musica en vivo
// ═════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// 16 — Concierto Rock — solista, escenario rojo cinematografico
//      Receta validada: foto ambiente Unsplash + tinte rojo + foco en artista
// ─────────────────────────────────────────────────────────────────────
    {
        id: 16,
        title: "Concierto Rock",
        category: "Conciertos",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(10).png",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // ── FONDO base negro ──────────────────────────────────────
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#080404", selectable: false },
                // FOTO ambiente: concierto rock con luces (Unsplash, libre comercial)
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1400", x: 0, y: 0, scaleX: 0.9, scaleY: 0.9, opacity: 0.45 },
                // Tinte rojo sobre toda la composicion (color grading)
                { id: "tint-red", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(139,0,15,0.55)", selectable: false },

                // ── FOCOS DE ESCENARIO (4 luces puntuales detras del artista) ──
                { id: "spot-back-1", type: "shape", shape: "circle", x: 280, y: 100, width: 240, height: 240, fill: "rgba(255,80,80,0.40)", opacity: 0.8, selectable: false },
                { id: "spot-back-2", type: "shape", shape: "circle", x: 560, y: 80, width: 280, height: 280, fill: "rgba(220,38,38,0.45)", opacity: 0.85, selectable: false },
                // Halo amplio detras del artista (efecto rim light)
                { id: "halo-artist", type: "shape", shape: "circle", x: 240, y: 200, width: 600, height: 600, fill: "rgba(255,255,255,0.08)", opacity: 0.7, selectable: false },

                // ── ETIQUETA SUPERIOR (chip "EN VIVO") ────────────────────
                { id: "chip-bg", type: "shape", shape: "rect", x: 460, y: 60, width: 160, height: 38, fill: "#dc2626", radius: 4, selectable: false },
                { id: "chip-label", type: "text", text: "EN VIVO", x: 0, y: 67, width: 1080, fontSize: 22, fontFamily: "Bebas Neue, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 400 },

                // ── ARTISTA (escala validada 0.72, posicion centrada) ─────
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(10).png", x: 540, y: 150, scaleX: 0.72, scaleY: 0.72, originX: "center", originY: "top", shadow: { color: "rgba(255,40,40,0.65)", blur: 70, offsetX: 0, offsetY: 0 } },

                // ── VINETA inferior para legibilidad de textos ────────────
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 870, width: 1080, height: 480, fill: "rgba(8,4,4,0.78)", selectable: false },

                // ── TITULO principal con sub y dividers ───────────────────
                // Linea decorativa arriba del titulo
                { id: "title-deco-l", type: "shape", shape: "rect", x: 240, y: 935, width: 180, height: 1, fill: "#dc2626", selectable: false },
                { id: "title-deco-star", type: "text", text: "\u2605", x: 0, y: 918, width: 1080, fontSize: 22, fontFamily: "Arial", color: "#dc2626", textAlign: "center" },
                { id: "title-deco-r", type: "shape", shape: "rect", x: 660, y: 935, width: 180, height: 1, fill: "#dc2626", selectable: false },

                { id: "title", type: "text", text: "ROCK STAR", x: 0, y: 960, width: 1080, fontSize: 156, fontFamily: "Bebas Neue, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 120, stroke: "#dc2626", strokeWidth: 0 },
                { id: "subtitle", type: "text", text: "WORLD TOUR 2026", x: 0, y: 1130, width: 1080, fontSize: 30, fontFamily: "Bebas Neue, Impact, sans-serif", color: "#fca5a5", textAlign: "center", charSpacing: 900 },

                // ── DIVIDER + BLOQUE INFO ────────────────────────────────
                { id: "divider", type: "shape", shape: "rect", x: 440, y: 1190, width: 200, height: 2, fill: "#dc2626", selectable: false },
                { id: "date", type: "text", text: "S\u00c1BADO 12 DE JULIO  \u00b7  21:00 H", x: 0, y: 1210, width: 1080, fontSize: 26, fontFamily: "Bebas Neue, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 350 },
                { id: "venue", type: "text", text: "PALACIO VISTALEGRE  \u00b7  MADRID", x: 0, y: 1250, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fca5a5", fontWeight: "500", textAlign: "center", charSpacing: 250 },

                // ── CTA pie ──────────────────────────────────────────────
                { id: "ticket-cta", type: "text", text: "ENTRADAS EN  WWW.TICKETMASTER.ES", x: 0, y: 1300, width: 1080, fontSize: 16, fontFamily: "Bebas Neue, Impact, sans-serif", color: "#dc2626", textAlign: "center", charSpacing: 500 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 17 — Concierto Urban — DJ, club nocturno, neon morado/rosa/cyan
//      Foto ambiente discoteca + tinte morado + barras neon diagonales
// ─────────────────────────────────────────────────────────────────────
    {
        id: 17,
        title: "Concierto Urban",
        category: "Conciertos",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // ── FONDO base morado profundo ────────────────────────────
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0418", selectable: false },
                // FOTO ambiente: discoteca nocturna con luces (Unsplash)
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1571266028243-d220c6a82b8d?q=80&w=1400", x: 0, y: 0, scaleX: 0.9, scaleY: 0.9, opacity: 0.38 },
                // Tinte morado para color grading uniforme
                { id: "tint-purple", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(76,29,149,0.55)", selectable: false },

                // ── BARRAS NEON DIAGONALES (simulan luces de club) ────────
                // Barra magenta diagonal arriba-izquierda
                { id: "neon-bar-1", type: "shape", shape: "rect", x: -100, y: 280, width: 700, height: 6, fill: "#ec4899", opacity: 0.9, angle: -25, selectable: false },
                // Barra cyan diagonal arriba-derecha
                { id: "neon-bar-2", type: "shape", shape: "rect", x: 380, y: 200, width: 800, height: 6, fill: "#22d3ee", opacity: 0.85, angle: 28, selectable: false },
                // Barra morada vertical-diagonal a la izquierda
                { id: "neon-bar-3", type: "shape", shape: "rect", x: 100, y: 100, width: 4, height: 500, fill: "#a855f7", opacity: 0.7, angle: 15, selectable: false },
                // Barra magenta vertical-diagonal a la derecha
                { id: "neon-bar-4", type: "shape", shape: "rect", x: 960, y: 130, width: 4, height: 480, fill: "#ec4899", opacity: 0.7, angle: -12, selectable: false },

                // ── HALO DETRAS DEL DJ (focos) ────────────────────────────
                { id: "spot-back-1", type: "shape", shape: "circle", x: 340, y: 220, width: 200, height: 200, fill: "rgba(168,85,247,0.55)", opacity: 0.9, selectable: false },
                { id: "spot-back-2", type: "shape", shape: "circle", x: 540, y: 180, width: 220, height: 220, fill: "rgba(236,72,153,0.50)", opacity: 0.9, selectable: false },
                { id: "halo-rim", type: "shape", shape: "circle", x: 280, y: 220, width: 520, height: 520, fill: "rgba(34,211,238,0.10)", opacity: 0.85, selectable: false },

                // ── ETIQUETA SUPERIOR (chip "SHOW UNICO") ─────────────────
                { id: "chip-bg", type: "shape", shape: "rect", x: 420, y: 60, width: 240, height: 40, fill: "transparent", radius: 20, stroke: "#22d3ee", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "\u2022 SHOW \u00daNICO \u2022", x: 0, y: 70, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 500 },

                // ── DJ (escala validada 0.75) ─────────────────────────────
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 540, y: 160, scaleX: 0.75, scaleY: 0.75, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.85)", blur: 80, offsetX: 0, offsetY: 0 } },

                // ── VINETA inferior para legibilidad ──────────────────────
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 880, width: 1080, height: 470, fill: "rgba(10,4,24,0.78)", selectable: false },

                // ── TITULO con dividers neon ─────────────────────────────
                { id: "title-deco-l", type: "shape", shape: "rect", x: 220, y: 945, width: 180, height: 2, fill: "#22d3ee", selectable: false },
                { id: "title-deco-r", type: "shape", shape: "rect", x: 680, y: 945, width: 180, height: 2, fill: "#ec4899", selectable: false },

                { id: "title", type: "text", text: "URBAN NIGHT", x: 0, y: 965, width: 1080, fontSize: 132, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "subtitle", type: "text", text: "REGGAETON  \u00b7  TRAP  \u00b7  LATIN HITS", x: 0, y: 1115, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "700", textAlign: "center", charSpacing: 350 },

                // ── INFO BOX rounded con borde neon ──────────────────────
                { id: "info-box", type: "shape", shape: "rect", x: 110, y: 1170, width: 860, height: 130, fill: "rgba(0,0,0,0.55)", radius: 18, stroke: "rgba(168,85,247,0.4)", strokeWidth: 1, selectable: false },
                { id: "date", type: "text", text: "VIERNES 18 JULIO  \u00b7  22:30 H", x: 0, y: 1192, width: 1080, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 200 },
                { id: "venue", type: "text", text: "SALA RIVIERA  \u00b7  MADRID", x: 0, y: 1238, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "600", textAlign: "center", charSpacing: 300 },
                { id: "price", type: "text", text: "ENTRADAS DESDE 25\u20ac  \u00b7  ENTRADIUM.COM", x: 0, y: 1268, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 18 — Concierto Premium — solista, paleta oro/burdeos elegante
//      Estilo evento privado/gala. Tipografia Playfair Display serifa.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 18,
        title: "Concierto Premium",
        category: "Conciertos",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(14).png",
        premium: true,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO burdeos profundo
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1a0508", selectable: false },
                // Halos calidos burdeos/oro
                { id: "halo-warm", type: "shape", shape: "circle", x: -100, y: 100, width: 750, height: 750, fill: "rgba(127,29,29,0.45)", opacity: 0.7, selectable: false },
                { id: "halo-gold", type: "shape", shape: "circle", x: 500, y: 200, width: 700, height: 700, fill: "rgba(180,135,68,0.25)", opacity: 0.65, selectable: false },
                // Overlay sutil
                { id: "overlay-bottom", type: "shape", shape: "rect", x: 0, y: 850, width: 1080, height: 500, fill: "rgba(10,3,5,0.7)", selectable: false },

                // ARTISTA principal (cantante 6)
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(14).png", x: 540, y: 170, scaleX: 0.70, scaleY: 0.70, originX: "center", originY: "top", shadow: { color: "rgba(217,165,89,0.5)", blur: 50, offsetX: 0, offsetY: 0 } },

                // Decoracion oro - lineas finas arriba y abajo del titulo
                { id: "ornament-top", type: "shape", shape: "rect", x: 340, y: 905, width: 400, height: 1, fill: "#d4a058", selectable: false },
                // SUPRATITULO oro
                { id: "supratitle", type: "text", text: "U N A   V E L A D A   D E   M \u00da S I C A", x: 0, y: 925, width: 1080, fontSize: 18, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "500", textAlign: "center", charSpacing: 600 },

                // TITULO Playfair serifa elegante
                { id: "title", type: "text", text: "Gala Privada", x: 0, y: 965, width: 1080, fontSize: 95, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "ornament-bottom", type: "shape", shape: "rect", x: 340, y: 1100, width: 400, height: 1, fill: "#d4a058", selectable: false },

                // BLOQUE INFO - todo con Cormorant
                { id: "date", type: "text", text: "S\u00c1BADO  \u00b7  4 DE OCTUBRE  \u00b7  21:00 H", x: 0, y: 1135, width: 1080, fontSize: 26, fontFamily: "Cormorant Garamond, serif", color: "#ffffff", fontWeight: "500", textAlign: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "HOTEL RITZ \u00b7 SAL\u00d3N REAL \u00b7 MADRID", x: 0, y: 1190, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "400", textAlign: "center", fontStyle: "italic", charSpacing: 300 },
                { id: "dresscode", type: "text", text: "ETIQUETA RIGUROSA  \u00b7  PLAZAS LIMITADAS", x: 0, y: 1235, width: 1080, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.65)", fontWeight: "500", textAlign: "center", charSpacing: 400 },
                { id: "rsvp", type: "text", text: "RSVP  \u00b7  reservas@galaprivada.es", x: 0, y: 1290, width: 1080, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "rgba(212,160,88,0.85)", fontWeight: "500", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 19 — Festival Grupos — multi-banda jerarquia, fondo nocturno energetico
//      Cartelera con varios nombres en distintos tamanos. Anton chunky.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 19,
        title: "Festival Multi-Banda",
        category: "Conciertos",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(3).png",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO degradado simulado con capas
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a1a", selectable: false },
                // Halos neon multicolor para sensacion festival
                { id: "halo-orange", type: "shape", shape: "circle", x: -100, y: 0, width: 600, height: 600, fill: "rgba(251,146,60,0.30)", opacity: 0.65, selectable: false },
                { id: "halo-pink", type: "shape", shape: "circle", x: 580, y: 100, width: 700, height: 700, fill: "rgba(236,72,153,0.30)", opacity: 0.6, selectable: false },
                { id: "halo-blue", type: "shape", shape: "circle", x: 200, y: 600, width: 700, height: 700, fill: "rgba(59,130,246,0.30)", opacity: 0.55, selectable: false },
                // Bandera superior con nombre del festival
                { id: "top-banner", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 110, fill: "rgba(0,0,0,0.7)", selectable: false },
                { id: "fest-name", type: "text", text: "S U M M E R   M U S I C   F E S T", x: 0, y: 40, width: 1080, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 800 },

                // GRUPO principal centrado (grupo 7)
                { id: "band", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(3).png", x: 540, y: 200, scaleX: 0.68, scaleY: 0.68, originX: "center", originY: "top", shadow: { color: "rgba(251,191,36,0.5)", blur: 50, offsetX: 0, offsetY: 0 } },

                // FECHA grande
                { id: "date-big", type: "text", text: "26 \u00b7 27 \u00b7 28", x: 0, y: 770, width: 1080, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 200 },
                { id: "month", type: "text", text: "JULIO 2026", x: 0, y: 895, width: 1080, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 600 },

                // CARTELERA - 3 niveles jerarquia
                { id: "tier-divider-1", type: "shape", shape: "rect", x: 90, y: 955, width: 900, height: 1, fill: "rgba(255,255,255,0.3)", selectable: false },
                { id: "headliners", type: "text", text: "HEADLINERS", x: 0, y: 975, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "tier1-names", type: "text", text: "QUANTUM  \u00b7  ECHO RIVALS  \u00b7  STARLINE", x: 0, y: 1005, width: 1080, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },

                { id: "tier2-names", type: "text", text: "Nebula  \u00b7  Vinyl Riot  \u00b7  Aurora Live  \u00b7  Kiosko 9", x: 0, y: 1060, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", charSpacing: 100 },
                { id: "tier3-names", type: "text", text: "DJ Atlas \u00b7 Mirena \u00b7 Lila Sound \u00b7 Outlier \u00b7 Pulse Co.", x: 0, y: 1100, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "400", textAlign: "center" },

                // INFO pie - venue + entradas
                { id: "venue-bar", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 80, fill: "rgba(251,191,36,0.9)", selectable: false },
                { id: "venue", type: "text", text: "RECINTO FERIAL IFEMA \u00b7 MADRID", x: 0, y: 1200, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a1a", textAlign: "center", charSpacing: 300 },
                { id: "ticket", type: "text", text: "ABONO 3 D\u00cdAS DESDE 75\u20ac  \u00b7  TICKETMASTER", x: 0, y: 1232, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#0a0a1a", fontWeight: "700", textAlign: "center", charSpacing: 200 },
                { id: "web", type: "text", text: "WWW.SUMMERMUSICFEST.ES", x: 0, y: 1295, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 400 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 20 — Gira Tour — un grupo, lista de fechas (tour dates) abajo
//      Estilo cartel de banda con cities. Mix Anton + Montserrat.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 20,
        title: "Gira Nacional",
        category: "Conciertos",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(8).png",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO casi negro con tinte azul medianoche
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#070914", selectable: false },
                // Halos azul/blanco simulando escenario
                { id: "stage-light-left", type: "shape", shape: "circle", x: -150, y: -100, width: 700, height: 700, fill: "rgba(59,130,246,0.35)", opacity: 0.6, selectable: false },
                { id: "stage-light-right", type: "shape", shape: "circle", x: 530, y: -50, width: 700, height: 700, fill: "rgba(96,165,250,0.30)", opacity: 0.6, selectable: false },
                { id: "stage-light-center", type: "shape", shape: "circle", x: 240, y: 200, width: 600, height: 600, fill: "rgba(255,255,255,0.15)", opacity: 0.5, selectable: false },

                // GRUPO (grupo 8)
                { id: "band", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(8).png", x: 540, y: 170, scaleX: 0.72, scaleY: 0.72, originX: "center", originY: "top", shadow: { color: "rgba(96,165,250,0.5)", blur: 55, offsetX: 0, offsetY: 0 } },

                // TITULO banda (mock)
                { id: "band-name", type: "text", text: "LOS DEL VIEJO TREN", x: 0, y: 745, width: 1080, fontSize: 65, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                // Divider
                { id: "divider", type: "shape", shape: "rect", x: 390, y: 825, width: 300, height: 1, fill: "rgba(96,165,250,0.8)", selectable: false },
                // Subtitulo tour
                { id: "tour-name", type: "text", text: "GIRA NACIONAL 2026", x: 0, y: 850, width: 1080, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#60a5fa", fontWeight: "700", textAlign: "center", charSpacing: 500 },

                // LISTA DE FECHAS - 6 ciudades en 2 columnas
                { id: "dates-header", type: "text", text: "TOUR DATES", x: 0, y: 905, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.5)", fontWeight: "600", textAlign: "center", charSpacing: 600 },

                // Columna izquierda
                { id: "date-1", type: "text", text: "15 ABR \u2014 MADRID", x: 100, y: 950, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-1", type: "text", text: "Sala La Riviera", x: 100, y: 985, width: 440, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                { id: "date-2", type: "text", text: "22 ABR \u2014 BARCELONA", x: 100, y: 1030, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-2", type: "text", text: "Sala Apolo", x: 100, y: 1065, width: 440, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                { id: "date-3", type: "text", text: "29 ABR \u2014 VALENCIA", x: 100, y: 1110, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-3", type: "text", text: "Roxy Club", x: 100, y: 1145, width: 440, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                // Columna derecha
                { id: "date-4", type: "text", text: "6 MAY \u2014 SEVILLA", x: 540, y: 950, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-4", type: "text", text: "Custom", x: 540, y: 985, width: 440, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                { id: "date-5", type: "text", text: "13 MAY \u2014 BILBAO", x: 540, y: 1030, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-5", type: "text", text: "Kafe Antzokia", x: 540, y: 1065, width: 440, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                { id: "date-6", type: "text", text: "20 MAY \u2014 M\u00c1LAGA", x: 540, y: 1110, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-6", type: "text", text: "Sala Paris 15", x: 540, y: 1145, width: 440, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                // CTA pie
                { id: "cta-line", type: "shape", shape: "rect", x: 90, y: 1220, width: 900, height: 1, fill: "rgba(255,255,255,0.2)", selectable: false },
                { id: "cta", type: "text", text: "ENTRADAS EN  WWW.LOSDELVIEJOTREN.COM", x: 0, y: 1250, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 300 },
                { id: "price", type: "text", text: "Desde 18\u20ac \u00b7 Aforo limitado", x: 0, y: 1295, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "500", textAlign: "center" },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 21 — Concierto Único Premium — un solo evento, formato lujo
//      Estilo album cover/teatro. Serifa Playfair + sans elegante.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 21,
        title: "Concierto \u00danico",
        category: "Conciertos",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(7).png",
        premium: true,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO crema oscuro elegante
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#16110a", selectable: false },
                // Halo dorado central muy sutil
                { id: "halo-center", type: "shape", shape: "circle", x: 240, y: 150, width: 600, height: 600, fill: "rgba(217,165,89,0.30)", opacity: 0.55, selectable: false },
                { id: "halo-warm-bottom", type: "shape", shape: "circle", x: 200, y: 750, width: 680, height: 680, fill: "rgba(127,29,29,0.25)", opacity: 0.55, selectable: false },

                // Texto vertical lateral izquierdo - sello premium
                { id: "side-label", type: "text", text: "AN EXCLUSIVE EVENING  \u00b7  ONE NIGHT ONLY", x: 30, y: 670, width: 50, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "600", textAlign: "left", angle: -90, charSpacing: 400 },

                // GRUPO (grupo 3) - centrado mas alto
                { id: "band", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(7).png", x: 540, y: 180, scaleX: 0.68, scaleY: 0.68, originX: "center", originY: "top", shadow: { color: "rgba(217,165,89,0.45)", blur: 45, offsetX: 0, offsetY: 0 } },

                // Ornamento sup
                { id: "orn-top-left", type: "shape", shape: "rect", x: 270, y: 800, width: 220, height: 1, fill: "#d4a058", selectable: false },
                { id: "orn-top-right", type: "shape", shape: "rect", x: 590, y: 800, width: 220, height: 1, fill: "#d4a058", selectable: false },
                { id: "orn-diamond", type: "shape", shape: "circle", x: 525, y: 791, width: 18, height: 18, fill: "transparent", stroke: "#d4a058", strokeWidth: 1, selectable: false },

                // SUPRATITULO
                { id: "supratitle", type: "text", text: "presenta", x: 0, y: 830, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "400", fontStyle: "italic", textAlign: "center", charSpacing: 400 },

                // TITULO principal serifa
                { id: "title-1", type: "text", text: "Sinfon\u00eda", x: 0, y: 870, width: 1080, fontSize: 80, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "de Otoño", x: 0, y: 955, width: 1080, fontSize: 80, fontFamily: "Playfair Display, serif", color: "#d4a058", textAlign: "center", fontStyle: "italic" },

                // Ornamento inf
                { id: "orn-bot-left", type: "shape", shape: "rect", x: 270, y: 1060, width: 220, height: 1, fill: "#d4a058", selectable: false },
                { id: "orn-bot-right", type: "shape", shape: "rect", x: 590, y: 1060, width: 220, height: 1, fill: "#d4a058", selectable: false },

                // BLOQUE INFO
                { id: "date", type: "text", text: "S\u00c1BADO 24 DE OCTUBRE \u00b7 21:00 H", x: 0, y: 1090, width: 1080, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#ffffff", fontWeight: "500", textAlign: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "TEATRO REAL  \u00b7  MADRID", x: 0, y: 1135, width: 1080, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 200 },

                // Detalle pie
                { id: "detail-1", type: "text", text: "Programa: cl\u00e1sicos contempor\u00e1neos y obra in\u00e9dita", x: 0, y: 1190, width: 1080, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "rgba(212,160,88,0.85)", fontStyle: "italic", textAlign: "center", charSpacing: 100 },
                { id: "detail-2", type: "text", text: "DURACI\u00d3N 90 MINUTOS  \u00b7  SIN DESCANSO", x: 0, y: 1230, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "500", textAlign: "center", charSpacing: 400 },
                { id: "rsvp", type: "text", text: "ENTRADAS DESDE 45\u20ac  \u00b7  TEATRO-REAL.COM", x: 0, y: 1295, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "700", textAlign: "center", charSpacing: 300 },
            ] },
        ],
    },
];
