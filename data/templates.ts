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
    /**
     * Recorte de la imagen a una forma (Fabric clipPath). Sirve para hacer
     * avatares circulares o cards con esquinas redondeadas SIN mostrar las
     * partes de la foto que sobran (pies, torso completo, etc.).
     * Se centra en el centro de la imagen (originX/Y "center" implícito).
     */
    clipPath?:
        | { type: "circle"; radius: number; offsetX?: number; offsetY?: number }
        | { type: "rect"; width: number; height: number; rx?: number; ry?: number; offsetX?: number; offsetY?: number };
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
 * Casos de uso de una plantilla. Sirve para el filtro "¿Para qué lo necesitas?"
 * en /templates. Una plantilla puede servir a varios casos.
 *
 * - promote:         Promocionar/anunciar un evento (uso mas general)
 * - sellTickets:     Vender entradas (eventos pagados, conciertos, fiestas)
 * - launch:          Lanzamiento de algo nuevo (apertura, estreno, nueva temporada)
 * - attractStudents: Captar alumnos (clases, workshops, academias)
 * - announceArtist:  Anunciar artista/profesor (cartel con foto de persona)
 *
 * Si una plantilla NO declara useCases explicito, se INFIEREN por categoria
 * y titulo via `inferUseCases()` en lib/useCases.ts. Esto evita tener que
 * editar 48 plantillas; solo añades useCases cuando quieres OVERRIDE manual.
 */
export type UseCase =
    | "promote"
    | "sellTickets"
    | "launch"
    | "attractStudents"
    | "announceArtist";

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
    /**
     * Casos de uso. OPCIONAL — si no se declara, se infieren automaticamente
     * por categoria + titulo en `inferUseCases()` (ver lib/useCases.ts).
     * Solo declararlo cuando quieras OVERRIDE manual de la inferencia.
     */
    useCases?: UseCase[];
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
            // FONDO negro base
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0D0D0D", selectable: false },
            // BLOQUE amarillo central (no full canvas para dejar respirar)
            { id: "yellow-block", type: "shape", shape: "rect", x: 60, y: 320, width: 960, height: 760, fill: "#FFE600", selectable: false },
            // FORMAS moradas decorativas (visibles, no escondidas en esquinas)
            { id: "deco-purple-1", type: "shape", shape: "rect", x: 780, y: 280, width: 280, height: 200, fill: "#7B2FBE", opacity: 0.95, angle: 18, selectable: false },
            { id: "deco-purple-2", type: "shape", shape: "rect", x: 20, y: 920, width: 260, height: 180, fill: "#7B2FBE", opacity: 0.90, angle: -15, selectable: false },
            { id: "deco-purple-3", type: "shape", shape: "circle", x: 880, y: 950, width: 120, height: 120, radius: 60, fill: "#7B2FBE", opacity: 0.80, selectable: false },
            // PUNTOS decorativos en bloque amarillo (textura)
            { id: "dot-1", type: "shape", shape: "circle", x: 120, y: 380, width: 16, height: 16, radius: 8, fill: "#0D0D0D", opacity: 0.6, selectable: false },
            { id: "dot-2", type: "shape", shape: "circle", x: 150, y: 410, width: 10, height: 10, radius: 5, fill: "#0D0D0D", opacity: 0.4, selectable: false },
            { id: "dot-3", type: "shape", shape: "circle", x: 920, y: 1020, width: 12, height: 12, radius: 6, fill: "#0D0D0D", opacity: 0.5, selectable: false },
            // KICKER pequeño arriba (sobre negro)
            { id: "kicker", type: "text", text: "ACADEMIA · TEMPORADA 2026", x: 540, y: 60, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#FFE600", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
            // TÍTULO hero línea 1 (blanco, sobre negro)
            { id: "title-line1", type: "text", text: "CLASES DE", x: 540, y: 110, width: 1080, fontSize: 108, fontFamily: "Anton, Impact, sans-serif", color: "#FFFFFF", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: -10 },
            // TÍTULO hero línea 2 (amarillo, sobre negro)
            { id: "title-line2", type: "text", text: "BAILE", x: 540, y: 210, width: 1080, fontSize: 108, fontFamily: "Anton, Impact, sans-serif", color: "#FFE600", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: -10 },
            // PAREJA: imagen real es 500x500 PNG transparente.
            // scale 1.5 → render 750×750, encaja en el bloque amarillo (760 alto).
            // Sin crop (la imagen ya es cuadrada y cabe entera).
            // Shadow más suave para no crear halo cuadrado visible.
            { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 540, y: 310, scaleX: 1.4, scaleY: 1.4, originX: "center", originY: "top", shadow: { color: "rgba(124,47,190,0.35)", blur: 30, offsetX: 0, offsetY: 0 } },
            // FRANJA decorativa negra inferior del bloque amarillo (disimula corte)
            { id: "yellow-bottom-band", type: "shape", shape: "rect", x: 60, y: 1010, width: 960, height: 70, fill: "#0D0D0D", selectable: false },
            // TEXTO sobre franja: tagline emocional
            { id: "tagline", type: "text", text: "MUÉVETE · CONECTA · DISFRUTA", x: 540, y: 1032, width: 960, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#FFE600", fontWeight: "800", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
            // BADGE 'NUEVA' redondo arriba derecha del bloque amarillo
            { id: "badge-bg", type: "shape", shape: "circle", x: 920, y: 380, width: 120, height: 120, radius: 60, fill: "#0D0D0D", selectable: false },
            { id: "badge-text-1", type: "text", text: "NUEVA", x: 920, y: 410, width: 120, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#FFE600", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 50 },
            { id: "badge-text-2", type: "text", text: "TEMPORADA", x: 920, y: 442, width: 120, fontSize: 11, fontFamily: "Montserrat, sans-serif", color: "#FFFFFF", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 100 },
            // BOTTOM SECTION negra (la zona de info)
            { id: "bottom-bg", type: "shape", shape: "rect", x: 0, y: 1080, width: 1080, height: 270, fill: "#0D0D0D", selectable: false },
            // LÍNEA divisora amarilla
            { id: "div-line", type: "shape", shape: "rect", x: 420, y: 1108, width: 240, height: 4, fill: "#FFE600", selectable: false },
            // FECHA
            { id: "date", type: "text", text: "SÁBADO 15 · NOVIEMBRE", x: 540, y: 1130, width: 1080, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#FFE600", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 120 },
            // HORARIO grande
            { id: "time", type: "text", text: "17:00 — 21:00 H", x: 540, y: 1178, width: 1080, fontSize: 60, fontFamily: "Anton, Impact, sans-serif", color: "#FFFFFF", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 40 },
            // VENUE info
            { id: "venue", type: "text", text: "ESTUDIO DEL SOL · C/ TENERIFE 5 · MADRID", x: 540, y: 1262, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#FFFFFF", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
            // PRECIO + WHATSAPP en chip amarillo ancho
            { id: "cta-chip", type: "shape", shape: "rect", x: 320, y: 1298, width: 440, height: 38, fill: "#FFE600", radius: 19, selectable: false },
            { id: "cta-text", type: "text", text: "15€ · RESERVA WHATSAPP 600 222 333", x: 540, y: 1308, width: 440, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#0D0D0D", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 100 },
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
            // FONDO negro base
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0D0D0D", selectable: false },
            // Rayas amarillas decorativas esquina superior derecha
            { id: "stripes", type: "shape-pattern", shape: "rect", x: 850, y: -60, width: 22, height: 340, fill: "#F5C518", count: 6, offsetX: 15, angle: -15 },

            // STUDIO BAND amarilla arriba
            { id: "studio-bg", type: "shape", shape: "rect", x: 60, y: 60, width: 700, height: 56, fill: "#F5C518", selectable: false },
            { id: "studio-name", type: "text", text: "NOMBRE DEL ESTUDIO", x: 75, y: 76, width: 680, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#0D0D0D", fontWeight: "800", textAlign: "left", charSpacing: 150 },

            // TÍTULO hero 2 líneas
            { id: "title1", type: "text", text: "CLASES DE", x: 60, y: 150, width: 1000, fontSize: 80, fontFamily: "Anton, Impact, sans-serif", color: "#FFFFFF", fontWeight: "900", textAlign: "left", charSpacing: -8 },
            { id: "title2", type: "text", text: "BAILE", x: 60, y: 222, width: 1000, fontSize: 80, fontFamily: "Anton, Impact, sans-serif", color: "transparent", stroke: "#F5C518", strokeWidth: 3, fontWeight: "900", textAlign: "left", charSpacing: -8 },

            // Descripción corta
            { id: "description", type: "text", text: "Encuentra la libertad en el movimiento.", x: 60, y: 312, width: 1000, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "400", textAlign: "left", lineHeight: 1.3 },

            // Divider amarillo
            { id: "div-top", type: "shape", shape: "rect", x: 60, y: 360, width: 80, height: 3, fill: "#F5C518", selectable: false },

            // ─── 3 PROFES en grid horizontal ───
            // Cabecera "TUS PROFES"
            { id: "profes-kicker", type: "text", text: "TUS PROFES · LIVE", x: 60, y: 400, width: 1000, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#F5C518", fontWeight: "700", textAlign: "left", charSpacing: 400 },

            // PROFE 1 — Damián (izquierda)
            { id: "profe1-card", type: "shape", shape: "rect", x: 60, y: 450, width: 300, height: 380, fill: "#1a1a1a", radius: 8, selectable: false },
            { id: "profe1-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 210, y: 460, scaleX: 0.23, scaleY: 0.23, originX: "center", originY: "top", shadow: { color: "rgba(245,197,24,0.4)", blur: 25, offsetX: 0, offsetY: 0 } },
            { id: "profe1-name-band", type: "shape", shape: "rect", x: 60, y: 770, width: 300, height: 60, fill: "#F5C518", selectable: false },
            { id: "profe1-name", type: "text", text: "DAMIÁN", x: 60, y: 783, width: 300, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0D0D0D", fontWeight: "900", textAlign: "center", charSpacing: 150 },
            { id: "profe1-role", type: "text", text: "Bachata", x: 60, y: 808, width: 300, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "rgba(13,13,13,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 100 },

            // PROFE 2 — Nia (centro)
            { id: "profe2-card", type: "shape", shape: "rect", x: 390, y: 450, width: 300, height: 380, fill: "#1a1a1a", radius: 8, selectable: false },
            { id: "profe2-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 540, y: 460, scaleX: 0.23, scaleY: 0.23, originX: "center", originY: "top", shadow: { color: "rgba(245,197,24,0.4)", blur: 25, offsetX: 0, offsetY: 0 } },
            { id: "profe2-name-band", type: "shape", shape: "rect", x: 390, y: 770, width: 300, height: 60, fill: "#F5C518", selectable: false },
            { id: "profe2-name", type: "text", text: "NIA", x: 390, y: 783, width: 300, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0D0D0D", fontWeight: "900", textAlign: "center", charSpacing: 150 },
            { id: "profe2-role", type: "text", text: "Salsa Cubana", x: 390, y: 808, width: 300, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "rgba(13,13,13,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 100 },

            // PROFE 3 — Malik (derecha)
            { id: "profe3-card", type: "shape", shape: "rect", x: 720, y: 450, width: 300, height: 380, fill: "#1a1a1a", radius: 8, selectable: false },
            { id: "profe3-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 870, y: 460, scaleX: 0.23, scaleY: 0.23, originX: "center", originY: "top", shadow: { color: "rgba(245,197,24,0.4)", blur: 25, offsetX: 0, offsetY: 0 } },
            { id: "profe3-name-band", type: "shape", shape: "rect", x: 720, y: 770, width: 300, height: 60, fill: "#F5C518", selectable: false },
            { id: "profe3-name", type: "text", text: "MALIK", x: 720, y: 783, width: 300, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0D0D0D", fontWeight: "900", textAlign: "center", charSpacing: 150 },
            { id: "profe3-role", type: "text", text: "Hip-Hop", x: 720, y: 808, width: 300, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "rgba(13,13,13,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 100 },

            // ─── BOTTOM INFO ───
            // Separador
            { id: "separator", type: "shape", shape: "rect", x: 0, y: 880, width: 1080, height: 4, fill: "#F5C518", selectable: false },

            // PRECIO chip izquierdo
            { id: "price-bg", type: "shape", shape: "rect", x: 0, y: 920, width: 280, height: 90, fill: "#F5C518", selectable: false },
            { id: "price", type: "text", text: "75€", x: 0, y: 935, width: 280, fontSize: 44, fontFamily: "Anton, Impact, sans-serif", color: "#0D0D0D", fontWeight: "900", textAlign: "center" },
            { id: "price-label", type: "text", text: "/ PERSONA", x: 0, y: 985, width: 280, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "#0D0D0D", fontWeight: "700", textAlign: "center", charSpacing: 200 },

            // FECHA y HORA derecha
            { id: "schedule", type: "text", text: "TODOS LOS DOMINGOS", x: 320, y: 928, width: 740, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "700", textAlign: "left", charSpacing: 200 },
            { id: "time", type: "text", text: "9:00 AM", x: 320, y: 955, width: 740, fontSize: 48, fontFamily: "Anton, Impact, sans-serif", color: "#F5C518", fontWeight: "900", textAlign: "left" },

            // BOTTOM section venue + web
            { id: "bottom-bg", type: "shape", shape: "rect", x: 0, y: 1050, width: 1080, height: 300, fill: "#1a1a1a", selectable: false },
            { id: "venue-label", type: "text", text: "DÓNDE", x: 60, y: 1080, width: 600, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "#F5C518", fontWeight: "700", textAlign: "left", charSpacing: 400 },
            { id: "venue", type: "text", text: "Estudio del Movimiento · C/ Goya 22 · Madrid", x: 60, y: 1105, width: 960, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#FFFFFF", fontWeight: "600", textAlign: "left" },

            { id: "reserva-label", type: "text", text: "RESERVA", x: 60, y: 1160, width: 600, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "#F5C518", fontWeight: "700", textAlign: "left", charSpacing: 400 },
            { id: "reserva", type: "text", text: "+34 600 222 333 · WhatsApp", x: 60, y: 1185, width: 600, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#FFFFFF", fontWeight: "600", textAlign: "left" },

            { id: "web-divider", type: "shape", shape: "rect", x: 60, y: 1245, width: 80, height: 2, fill: "#F5C518", selectable: false },
            { id: "website", type: "text", text: "www.tusitio.com", x: 60, y: 1265, width: 960, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#F5C518", fontWeight: "700", textAlign: "left", underline: true, charSpacing: 50 },
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
                { id: "date-time", type: "text", text: "23:00 — 06:00 HRS · CLUB ESPACIO MADRID", x: 540, y: 920, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#94a3b8", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
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
                { id: "price", type: "text", text: "ENTRADA 20€ · LISTA HASTA 01:00", x: 540, y: 1255, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#94a3b8", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
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
                { id: "footer", type: "text", text: "ENTRADA 15€ ANTICIPADA · 20€ EN PUERTA", x: 540, y: 1300, width: 900, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#fde68a", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
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
            { id: "tickets", type: "text", text: "ENTRADAS DESDE 35€ · WWW.AURORAFEST.COM", x: 540, y: 1280, width: 1000, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#0a0a1f", fontWeight: "500", textAlign: "center", originX: "center", originY: "center" },
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
                { id: "venue", type: "text", text: "21:00 H  —  HOTEL PALACE", x: 540, y: 920, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a373", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
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
                { id: "rsvp", type: "text", text: "RSVP  ·  +34 600 000 000", x: 540, y: 1180, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fde68a", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
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
            { id: "price", type: "text", text: "ENTRADA 12€ · NO DRESS CODE", x: 540, y: 1265, width: 1000, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 200 },
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
                { id: "venue", type: "text", text: "C/ VICTORIA 6 \u00b7 DISCOTECA EL SON \u00b7 METRO SOL", x: 0, y: 1300, width: 1080, fontSize: 20, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
                { id: "phone", type: "text", text: "RESERVAS: +34 600 000 000", x: 0, y: 1325, width: 1080, fontSize: 19, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
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
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1400", x: 0, y: 10, scaleX: 1.90, scaleY: 1.90, opacity: 0.45 },
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
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(10).png", x: 540, y: 20, scaleX: 1.72, scaleY: 1.72, originX: "center", originY: "top", shadow: { color: "rgba(255,40,40,0.65)", blur: 70, offsetX: 0, offsetY: 0 } },

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
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1571266028243-d220c6a82b8d?q=80&w=1400", x: 0, y: 0, scaleX: 1.90, scaleY: 1.90, opacity: 0.38 },
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
                { id: "chip-label", type: "text", text: "\u2022 SHOW \u00daNICO \u2022", x: 0, y: 70, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 500 },

                // ── DJ (escala validada 0.75) ─────────────────────────────
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 540, y: 160, scaleX: 1.7, scaleY: 1.7, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.85)", blur: 80, offsetX: 0, offsetY: 0 } },

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
                { id: "venue", type: "text", text: "SALA RIVIERA  \u00b7  MADRID", x: 0, y: 1238, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "600", textAlign: "center", charSpacing: 300 },
                { id: "price", type: "text", text: "ENTRADAS DESDE 25\u20ac  \u00b7  ENTRADIUM.COM", x: 0, y: 1268, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", charSpacing: 200 },
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
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(14).png", x: 540, y: 0, scaleX: 1.70, scaleY: 1.70, originX: "center", originY: "top", shadow: { color: "rgba(217,165,89,0.5)", blur: 50, offsetX: 0, offsetY: 0 } },

                // Decoracion oro - lineas finas arriba y abajo del titulo
                { id: "ornament-top", type: "shape", shape: "rect", x: 340, y: 905, width: 400, height: 1, fill: "#d4a058", selectable: false },
                // SUPRATITULO oro
                { id: "supratitle", type: "text", text: "U N A   V E L A D A   D E   M \u00da S I C A", x: 0, y: 925, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "500", textAlign: "center", charSpacing: 600 },

                // TITULO Playfair serifa elegante
                { id: "title", type: "text", text: "Gala Privada", x: 0, y: 965, width: 1080, fontSize: 95, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "ornament-bottom", type: "shape", shape: "rect", x: 340, y: 1100, width: 400, height: 1, fill: "#d4a058", selectable: false },

                // BLOQUE INFO - todo con Cormorant
                { id: "date", type: "text", text: "S\u00c1BADO  \u00b7  4 DE OCTUBRE  \u00b7  21:00 H", x: 0, y: 1135, width: 1080, fontSize: 26, fontFamily: "Cormorant Garamond, serif", color: "#ffffff", fontWeight: "500", textAlign: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "HOTEL RITZ \u00b7 SAL\u00d3N REAL \u00b7 MADRID", x: 0, y: 1190, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "400", textAlign: "center", fontStyle: "italic", charSpacing: 300 },
                { id: "dresscode", type: "text", text: "ETIQUETA RIGUROSA  \u00b7  PLAZAS LIMITADAS", x: 0, y: 1235, width: 1080, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.65)", fontWeight: "500", textAlign: "center", charSpacing: 400 },
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
                { id: "band", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(3).png", x: 540, y: 200, scaleX: 1.68, scaleY: 1.68, originX: "center", originY: "top", shadow: { color: "rgba(251,191,36,0.5)", blur: 50, offsetX: 0, offsetY: 0 } },

                // FECHA grande
                { id: "date-big", type: "text", text: "26 \u00b7 27 \u00b7 28", x: 0, y: 770, width: 1080, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 200 },
                { id: "month", type: "text", text: "JULIO 2026", x: 0, y: 895, width: 1080, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 600 },

                // CARTELERA - 3 niveles jerarquia
                { id: "tier-divider-1", type: "shape", shape: "rect", x: 90, y: 955, width: 900, height: 1, fill: "rgba(255,255,255,0.3)", selectable: false },
                { id: "headliners", type: "text", text: "HEADLINERS", x: 0, y: 975, width: 1080, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "tier1-names", type: "text", text: "QUANTUM  \u00b7  ECHO RIVALS  \u00b7  STARLINE", x: 0, y: 1005, width: 1080, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },

                { id: "tier2-names", type: "text", text: "Nebula  \u00b7  Vinyl Riot  \u00b7  Aurora Live  \u00b7  Kiosko 9", x: 0, y: 1060, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", charSpacing: 100 },
                { id: "tier3-names", type: "text", text: "DJ Atlas \u00b7 Mirena \u00b7 Lila Sound \u00b7 Outlier \u00b7 Pulse Co.", x: 0, y: 1100, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "400", textAlign: "center" },

                // INFO pie - venue + entradas
                { id: "venue-bar", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 80, fill: "rgba(251,191,36,0.9)", selectable: false },
                { id: "venue", type: "text", text: "RECINTO FERIAL IFEMA \u00b7 MADRID", x: 0, y: 1200, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a1a", textAlign: "center", charSpacing: 300 },
                { id: "ticket", type: "text", text: "ABONO 3 D\u00cdAS DESDE 75\u20ac  \u00b7  TICKETMASTER", x: 0, y: 1232, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#0a0a1a", fontWeight: "700", textAlign: "center", charSpacing: 200 },
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
                { id: "band", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(8).png", x: 540, y: 170, scaleX: 1.72, scaleY: 1.72, originX: "center", originY: "top", shadow: { color: "rgba(96,165,250,0.5)", blur: 55, offsetX: 0, offsetY: 0 } },

                // TITULO banda (mock)
                { id: "band-name", type: "text", text: "LOS DEL VIEJO TREN", x: 0, y: 745, width: 1080, fontSize: 65, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                // Divider
                { id: "divider", type: "shape", shape: "rect", x: 390, y: 825, width: 300, height: 1, fill: "rgba(96,165,250,0.8)", selectable: false },
                // Subtitulo tour
                { id: "tour-name", type: "text", text: "GIRA NACIONAL 2026", x: 0, y: 850, width: 1080, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#60a5fa", fontWeight: "700", textAlign: "center", charSpacing: 500 },

                // LISTA DE FECHAS - 6 ciudades en 2 columnas
                { id: "dates-header", type: "text", text: "TOUR DATES", x: 0, y: 905, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.5)", fontWeight: "600", textAlign: "center", charSpacing: 600 },

                // Columna izquierda
                { id: "date-1", type: "text", text: "15 ABR \u2014 MADRID", x: 100, y: 950, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-1", type: "text", text: "Sala La Riviera", x: 100, y: 985, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                { id: "date-2", type: "text", text: "22 ABR \u2014 BARCELONA", x: 100, y: 1030, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-2", type: "text", text: "Sala Apolo", x: 100, y: 1065, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                { id: "date-3", type: "text", text: "29 ABR \u2014 VALENCIA", x: 100, y: 1110, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-3", type: "text", text: "Roxy Club", x: 100, y: 1145, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                // Columna derecha
                { id: "date-4", type: "text", text: "6 MAY \u2014 SEVILLA", x: 540, y: 950, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-4", type: "text", text: "Custom", x: 540, y: 985, width: 440, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                { id: "date-5", type: "text", text: "13 MAY \u2014 BILBAO", x: 540, y: 1030, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-5", type: "text", text: "Kafe Antzokia", x: 540, y: 1065, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                { id: "date-6", type: "text", text: "20 MAY \u2014 M\u00c1LAGA", x: 540, y: 1110, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "venue-6", type: "text", text: "Sala Paris 15", x: 540, y: 1145, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(96,165,250,0.85)", fontWeight: "500", textAlign: "left" },

                // CTA pie
                { id: "cta-line", type: "shape", shape: "rect", x: 90, y: 1220, width: 900, height: 1, fill: "rgba(255,255,255,0.2)", selectable: false },
                { id: "cta", type: "text", text: "ENTRADAS EN  WWW.LOSDELVIEJOTREN.COM", x: 0, y: 1250, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 300 },
                { id: "price", type: "text", text: "Desde 18\u20ac \u00b7 Aforo limitado", x: 0, y: 1295, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "500", textAlign: "center" },
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
                { id: "side-label", type: "text", text: "AN EXCLUSIVE EVENING  \u00b7  ONE NIGHT ONLY", x: 30, y: 670, width: 50, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "600", textAlign: "left", angle: -90, charSpacing: 400 },

                // GRUPO (grupo 3) - centrado mas alto
                { id: "band", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(7).png", x: 540, y: 180, scaleX: 2.0, scaleY: 2.0, originX: "center", originY: "top", shadow: { color: "rgba(217,165,89,0.45)", blur: 45, offsetX: 0, offsetY: 0 } },

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
                { id: "detail-1", type: "text", text: "Programa: cl\u00e1sicos contempor\u00e1neos y obra in\u00e9dita", x: 0, y: 1190, width: 1080, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "rgba(212,160,88,0.85)", fontStyle: "italic", textAlign: "center", charSpacing: 100 },
                { id: "detail-2", type: "text", text: "DURACI\u00d3N 90 MINUTOS  \u00b7  SIN DESCANSO", x: 0, y: 1230, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "500", textAlign: "center", charSpacing: 400 },
                { id: "rsvp", type: "text", text: "ENTRADAS DESDE 45\u20ac  \u00b7  TEATRO-REAL.COM", x: 0, y: 1295, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "700", textAlign: "center", charSpacing: 300 },
            ] },
        ],
    },

// ═════════════════════════════════════════════════════════════════════
// PILOTO REPLICA HOME — Plantillas que replican EXACTO el carrusel 3D
// del home (TemplateCarousel3D.tsx). Look simple: foto + overlay + chip
// + bloque inferior con nombre/fecha/venue. Si esta gusta, se replican
// las otras 6 con el mismo patron.
// ═════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// 22 — Noche Latina (replica home id #1)
// ─────────────────────────────────────────────────────────────────────
    {
        id: 22,
        title: "Noche Latina",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=600",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // ── FONDO: foto unica que cubre todo (igual que home) ────
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=1400", x: 0, y: 0, scaleX: 1.4, scaleY: 1.4, opacity: 1.0 },

                // ── OVERLAY degradado oscuro de abajo a arriba ────────────
                // Replica el linear-gradient del home (rgba(0,0,0,0.90) bottom -> transparente top)
                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 600, width: 1080, height: 200, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 800, width: 1080, height: 200, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1000, width: 1080, height: 350, fill: "rgba(0,0,0,0.90)", selectable: false },

                // ── CHIP SUPERIOR "FIESTA" con accent color ───────────────
                // Replica el chip del home: rounded-full, border accent, fondo negro semi
                { id: "chip-bg", type: "shape", shape: "rect", x: 460, y: 80, width: 160, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(192,132,252,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FIESTA", x: 0, y: 95, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#c084fc", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                // ── BLOQUE INFERIOR (igual que home: linea accent + textos) ──
                // Linea pequena del color accent (igual que el w-8 h-0.5 del home)
                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1080, width: 90, height: 6, fill: "#c084fc", radius: 3, selectable: false },

                // Nombre del evento - grande, blanco (sin shadow para text)
                { id: "title", type: "text", text: "NOCHE LATINA", x: 90, y: 1110, width: 900, fontSize: 82, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },

                // Fecha en color accent
                { id: "date", type: "text", text: "S\u00c1B 25 MAY  \u00b7  23:00 H", x: 90, y: 1205, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#c084fc", fontWeight: "700", textAlign: "left", charSpacing: 150 },

                // Venue en gris
                { id: "venue", type: "text", text: "DISCOTECA ELEGANCE  \u00b7  MADRID", x: 90, y: 1245, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },

                // CTA pie
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1290, width: 900, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },

            // ═════════════════════════════════════════════════════════════
            // STORY 1080x1920 (Instagram/TikTok stories)
            // Adaptacion: ancho igual, alto +570, foto escala 1.55,
            // overlays reposicionados, bloque inferior desplazado +570,
            // titulo crecido a 110px aprovechando el aire extra.
            // ═════════════════════════════════════════════════════════════
            { format: "story", width: 1080, height: 1920, layers: [
                // ── FONDO ────────────────────────────────────────────────
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=1400", x: 0, y: 0, scaleX: 1.55, scaleY: 1.55, opacity: 1.0 },

                // ── OVERLAY degradado oscuro (3 rect re-distribuidos) ────
                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 280, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 280, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1460, width: 1080, height: 460, fill: "rgba(0,0,0,0.92)", selectable: false },

                // ── CHIP SUPERIOR ─────────────────────────────────────────
                { id: "chip-bg", type: "shape", shape: "rect", x: 460, y: 140, width: 160, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(192,132,252,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FIESTA", x: 0, y: 155, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#c084fc", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                // ── BLOQUE INFERIOR (mismo X 90, Y desplazado +570) ──────
                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1550, width: 110, height: 8, fill: "#c084fc", radius: 4, selectable: false },

                // Titulo crece a 110px (mas aire vertical disponible)
                { id: "title", type: "text", text: "NOCHE LATINA", x: 90, y: 1590, width: 900, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },

                { id: "date", type: "text", text: "S\u00c1B 25 MAY  \u00b7  23:00 H", x: 90, y: 1720, width: 900, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#c084fc", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "DISCOTECA ELEGANCE  \u00b7  MADRID", x: 90, y: 1770, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1830, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 23 — Neon Night (replica home id #2) - accent #a855f7
// ─────────────────────────────────────────────────────────────────────
    {
        id: 23,
        title: "Neon Night",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1400", x: 0, y: 0, scaleX: 1.4, scaleY: 1.4, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 600, width: 1080, height: 200, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 800, width: 1080, height: 200, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1000, width: 1080, height: 350, fill: "rgba(0,0,0,0.90)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 460, y: 80, width: 160, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(168,85,247,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FIESTA", x: 0, y: 95, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#a855f7", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1080, width: 90, height: 6, fill: "#a855f7", radius: 3, selectable: false },
                { id: "title", type: "text", text: "NEON NIGHT", x: 90, y: 1110, width: 900, fontSize: 82, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "VIE 31 MAYO  \u00b7  23:00 H", x: 90, y: 1205, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#a855f7", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "CLUB KINGS  \u00b7  MADRID", x: 90, y: 1245, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1290, width: 900, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },

            // STORY 1080x1920
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1400", x: 0, y: 0, scaleX: 1.55, scaleY: 1.55, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 280, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 280, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1460, width: 1080, height: 460, fill: "rgba(0,0,0,0.92)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 460, y: 140, width: 160, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(168,85,247,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FIESTA", x: 0, y: 155, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#a855f7", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1550, width: 110, height: 8, fill: "#a855f7", radius: 4, selectable: false },
                { id: "title", type: "text", text: "NEON NIGHT", x: 90, y: 1590, width: 900, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "VIE 31 MAYO  \u00b7  23:00 H", x: 90, y: 1720, width: 900, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#a855f7", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "CLUB KINGS  \u00b7  MADRID", x: 90, y: 1770, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1830, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 24 — Festival Summer (replica home id #3) - accent #fb923c
// ─────────────────────────────────────────────────────────────────────
    {
        id: 24,
        title: "Festival Summer",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1400", x: 0, y: 0, scaleX: 1.4, scaleY: 1.4, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 600, width: 1080, height: 200, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 800, width: 1080, height: 200, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1000, width: 1080, height: 350, fill: "rgba(0,0,0,0.90)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 440, y: 80, width: 200, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(251,146,60,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FESTIVAL", x: 0, y: 95, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1080, width: 90, height: 6, fill: "#fb923c", radius: 3, selectable: false },
                { id: "title", type: "text", text: "FESTIVAL SUMMER", x: 90, y: 1110, width: 900, fontSize: 72, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "15 JUNIO 2026  \u00b7  17:00 H", x: 90, y: 1205, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "PARQUE FUNDIDORA  \u00b7  MONTERREY", x: 90, y: 1245, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1290, width: 900, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },

            // STORY 1080x1920
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1400", x: 0, y: 0, scaleX: 1.55, scaleY: 1.55, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 280, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 280, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1460, width: 1080, height: 460, fill: "rgba(0,0,0,0.92)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 440, y: 140, width: 200, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(251,146,60,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FESTIVAL", x: 0, y: 155, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1550, width: 110, height: 8, fill: "#fb923c", radius: 4, selectable: false },
                { id: "title", type: "text", text: "FESTIVAL SUMMER", x: 90, y: 1590, width: 900, fontSize: 96, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "15 JUNIO 2026  \u00b7  17:00 H", x: 90, y: 1720, width: 900, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "PARQUE FUNDIDORA  \u00b7  MONTERREY", x: 90, y: 1770, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1830, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 25 — Noche en Vivo (replica home id #4) - accent #facc15
// ─────────────────────────────────────────────────────────────────────
    {
        id: 25,
        title: "Noche en Vivo",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1545959570-a94084071b5d?q=80&w=600",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1545959570-a94084071b5d?q=80&w=1400", x: 0, y: 0, scaleX: 1.4, scaleY: 1.4, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 600, width: 1080, height: 200, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 800, width: 1080, height: 200, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1000, width: 1080, height: 350, fill: "rgba(0,0,0,0.90)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 460, y: 80, width: 160, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(250,204,21,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FIESTA", x: 0, y: 95, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1080, width: 90, height: 6, fill: "#facc15", radius: 3, selectable: false },
                { id: "title", type: "text", text: "NOCHE EN VIVO", x: 90, y: 1110, width: 900, fontSize: 78, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "VIE 24 MAYO  \u00b7  23:00 H", x: 90, y: 1205, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "CLUB LATINO  \u00b7  MADRID", x: 90, y: 1245, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1290, width: 900, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },

            // STORY 1080x1920
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1545959570-a94084071b5d?q=80&w=1400", x: 0, y: 0, scaleX: 1.55, scaleY: 1.55, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 280, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 280, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1460, width: 1080, height: 460, fill: "rgba(0,0,0,0.92)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 460, y: 140, width: 160, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(250,204,21,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FIESTA", x: 0, y: 155, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1550, width: 110, height: 8, fill: "#facc15", radius: 4, selectable: false },
                { id: "title", type: "text", text: "NOCHE EN VIVO", x: 90, y: 1590, width: 900, fontSize: 104, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "VIE 24 MAYO  \u00b7  23:00 H", x: 90, y: 1720, width: 900, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "CLUB LATINO  \u00b7  MADRID", x: 90, y: 1770, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1830, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 26 — Concierto Acústico (replica home id #5) - accent #22d3ee
// ─────────────────────────────────────────────────────────────────────
    {
        id: 26,
        title: "Concierto Ac\u00fastico",
        category: "Conciertos",
        image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=600",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1400", x: 0, y: 0, scaleX: 1.4, scaleY: 1.4, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 600, width: 1080, height: 200, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 800, width: 1080, height: 200, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1000, width: 1080, height: 350, fill: "rgba(0,0,0,0.90)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 420, y: 80, width: 240, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(34,211,238,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "CONCIERTO", x: 0, y: 95, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1080, width: 90, height: 6, fill: "#22d3ee", radius: 3, selectable: false },
                { id: "title", type: "text", text: "CONCIERTO AC\u00daSTICO", x: 90, y: 1110, width: 900, fontSize: 64, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "JUE 13 JUNIO  \u00b7  21:00 H", x: 90, y: 1205, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "TEATRO METROPOLITAN  \u00b7  CDMX", x: 90, y: 1245, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1290, width: 900, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },

            // STORY 1080x1920
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1400", x: 0, y: 0, scaleX: 1.55, scaleY: 1.55, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 280, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 280, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1460, width: 1080, height: 460, fill: "rgba(0,0,0,0.92)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 420, y: 140, width: 240, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(34,211,238,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "CONCIERTO", x: 0, y: 155, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1550, width: 110, height: 8, fill: "#22d3ee", radius: 4, selectable: false },
                { id: "title", type: "text", text: "CONCIERTO AC\u00daSTICO", x: 90, y: 1590, width: 900, fontSize: 84, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "JUE 13 JUNIO  \u00b7  21:00 H", x: 90, y: 1720, width: 900, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "TEATRO METROPOLITAN  \u00b7  CDMX", x: 90, y: 1770, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1830, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 27 — Clase Abierta (replica home id #6) - accent #c084fc
// ─────────────────────────────────────────────────────────────────────
    {
        id: 27,
        title: "Clase Abierta",
        category: "Clases",
        image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=600",
        premium: false,
        audience: ["academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1400", x: 0, y: 0, scaleX: 1.4, scaleY: 1.4, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 600, width: 1080, height: 200, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 800, width: 1080, height: 200, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1000, width: 1080, height: 350, fill: "rgba(0,0,0,0.90)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 460, y: 80, width: 160, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(192,132,252,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "CLASES", x: 0, y: 95, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#c084fc", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1080, width: 90, height: 6, fill: "#c084fc", radius: 3, selectable: false },
                { id: "title", type: "text", text: "CLASE ABIERTA", x: 90, y: 1110, width: 900, fontSize: 78, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "S\u00c1B 08 JUNIO  \u00b7  11:00 H", x: 90, y: 1205, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#c084fc", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "ESTUDIO MOVIMIENTO  \u00b7  MADRID", x: 90, y: 1245, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "RESERVA EN ARTEGENIA.COM", x: 90, y: 1290, width: 900, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },

            // STORY 1080x1920
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1400", x: 0, y: 0, scaleX: 1.55, scaleY: 1.55, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 280, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 280, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1460, width: 1080, height: 460, fill: "rgba(0,0,0,0.92)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 460, y: 140, width: 160, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(192,132,252,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "CLASES", x: 0, y: 155, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#c084fc", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1550, width: 110, height: 8, fill: "#c084fc", radius: 4, selectable: false },
                { id: "title", type: "text", text: "CLASE ABIERTA", x: 90, y: 1590, width: 900, fontSize: 104, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "S\u00c1B 08 JUNIO  \u00b7  11:00 H", x: 90, y: 1720, width: 900, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#c084fc", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "ESTUDIO MOVIMIENTO  \u00b7  MADRID", x: 90, y: 1770, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "RESERVA EN ARTEGENIA.COM", x: 90, y: 1830, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 28 — Gran Gala (replica home id #7) - accent #fb923c
// ─────────────────────────────────────────────────────────────────────
    {
        id: 28,
        title: "Gran Gala",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600",
        premium: true,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1400", x: 0, y: 0, scaleX: 1.4, scaleY: 1.4, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 600, width: 1080, height: 200, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 800, width: 1080, height: 200, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1000, width: 1080, height: 350, fill: "rgba(0,0,0,0.90)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 440, y: 80, width: 200, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(251,146,60,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FESTIVAL", x: 0, y: 95, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1080, width: 90, height: 6, fill: "#fb923c", radius: 3, selectable: false },
                { id: "title", type: "text", text: "GRAN GALA", x: 90, y: 1110, width: 900, fontSize: 96, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "S\u00c1B 01 JUNIO  \u00b7  21:00 H", x: 90, y: 1205, width: 900, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "ARENA MONTERREY  \u00b7  MX", x: 90, y: 1245, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1290, width: 900, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },

            // STORY 1080x1920
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0010", selectable: false },
                { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1400", x: 0, y: 0, scaleX: 1.55, scaleY: 1.55, opacity: 1.0 },

                { id: "overlay-1", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 280, fill: "rgba(0,0,0,0.20)", selectable: false },
                { id: "overlay-2", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 280, fill: "rgba(0,0,0,0.45)", selectable: false },
                { id: "overlay-3", type: "shape", shape: "rect", x: 0, y: 1460, width: 1080, height: 460, fill: "rgba(0,0,0,0.92)", selectable: false },

                { id: "chip-bg", type: "shape", shape: "rect", x: 440, y: 140, width: 200, height: 44, fill: "rgba(0,0,0,0.55)", radius: 22, stroke: "rgba(251,146,60,0.55)", strokeWidth: 1, selectable: false },
                { id: "chip-label", type: "text", text: "FESTIVAL", x: 0, y: 155, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                { id: "accent-line", type: "shape", shape: "rect", x: 90, y: 1550, width: 110, height: 8, fill: "#fb923c", radius: 4, selectable: false },
                { id: "title", type: "text", text: "GRAN GALA", x: 90, y: 1590, width: 900, fontSize: 128, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "date", type: "text", text: "S\u00c1B 01 JUNIO  \u00b7  21:00 H", x: 90, y: 1740, width: 900, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "700", textAlign: "left", charSpacing: 150 },
                { id: "venue", type: "text", text: "ARENA MONTERREY  \u00b7  MX", x: 90, y: 1790, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#9ca3af", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "cta", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 90, y: 1850, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#6b7280", fontWeight: "600", textAlign: "left", charSpacing: 300 },
            ] },
        ],
    },

// ═════════════════════════════════════════════════════════════════════
// FAMILIA PROFESIONAL — 6 nuevas inspiradas en #1, #5, #15, #17, #18
// Todas portrait 1080x1350. Tag beta hasta validar visual.
// ═════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// 29 — Cartel Vintage Cantante — poster cine retro 70s (NUEVO LAYOUT)
//      Fondo crema-sepia con textura, marcos ornamentales dobles,
//      sello LIVE circular, titulo serif con sombra dura tipo letterpress.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 29,
        title: "Cartel Vintage",
        category: "Conciertos",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(10).png",
        premium: true,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO crema base
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#e8dcc1", selectable: false },
                // Sobrecapa sepia con opacidad
                { id: "tint-sepia", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(120,80,40,0.18)", selectable: false },
                // Vinetas en esquinas tipo papel envejecido
                { id: "vignette-tl", type: "shape", shape: "circle", x: -200, y: -200, width: 600, height: 600, fill: "rgba(74,42,15,0.25)", opacity: 0.7, selectable: false },
                { id: "vignette-br", type: "shape", shape: "circle", x: 680, y: 950, width: 600, height: 600, fill: "rgba(74,42,15,0.25)", opacity: 0.7, selectable: false },

                // MARCO doble ornamental exterior
                { id: "frame-outer", type: "shape", shape: "rect", x: 40, y: 40, width: 1000, height: 1270, fill: "transparent", stroke: "#5c2a0a", strokeWidth: 4, selectable: false },
                { id: "frame-inner", type: "shape", shape: "rect", x: 65, y: 65, width: 950, height: 1220, fill: "transparent", stroke: "#5c2a0a", strokeWidth: 1, selectable: false },

                // CABECERA superior dentro del marco
                { id: "header-line-l", type: "shape", shape: "rect", x: 130, y: 130, width: 280, height: 1, fill: "#5c2a0a", selectable: false },
                { id: "header-line-r", type: "shape", shape: "rect", x: 670, y: 130, width: 280, height: 1, fill: "#5c2a0a", selectable: false },
                { id: "header-text", type: "text", text: "TEATRO  ·  ANNO 2026  ·  N° 14", x: 0, y: 118, width: 1080, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#5c2a0a", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                // SELLO circular rojo "LIVE" arriba-derecha (efecto sello)
                { id: "stamp-bg", type: "shape", shape: "circle", x: 800, y: 165, width: 165, height: 165, fill: "rgba(140,30,30,0.92)", stroke: "#5c1010", strokeWidth: 3, selectable: false },
                { id: "stamp-text-1", type: "text", text: "LIVE", x: 740, y: 215, width: 280, fontSize: 38, fontFamily: "Anton, Impact, sans-serif", color: "#f5e6c8", fontWeight: "900", textAlign: "center", charSpacing: 80 },
                { id: "stamp-text-2", type: "text", text: "ONE NIGHT", x: 740, y: 258, width: 280, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#f5e6c8", textAlign: "center", charSpacing: 200 },

                // ARTISTA (cantante 10) recortada al centro
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(10).png", x: 540, y: 200, scaleX: 1.4, scaleY: 1.4, originX: "center", originY: "top", shadow: { color: "rgba(74,42,15,0.65)", blur: 35, offsetX: 8, offsetY: 8 } },

                // SUPRATITULO con tracking estilo vintage
                { id: "supra", type: "text", text: "PRESENTA EN UNA SOLA NOCHE", x: 0, y: 880, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#5c2a0a", fontWeight: "700", textAlign: "center", charSpacing: 500 },

                // TITULO serifa MASIVA con sombra dura letterpress
                // sombra dura simulada con un texto identico desplazado
                { id: "title-shadow", type: "text", text: "MARA SOLÍS", x: 8, y: 928, width: 1080, fontSize: 130, fontFamily: "Playfair Display, serif", color: "#a85a20", fontWeight: "900", textAlign: "center" },
                { id: "title", type: "text", text: "MARA SOLÍS", x: 0, y: 920, width: 1080, fontSize: 130, fontFamily: "Playfair Display, serif", color: "#3d1a05", fontWeight: "900", textAlign: "center" },

                // Subtitulo italica
                { id: "subtitle", type: "text", text: "Una velada de copla y bolero", x: 0, y: 1060, width: 1080, fontSize: 28, fontFamily: "Cormorant Garamond, serif", color: "#5c2a0a", fontStyle: "italic", textAlign: "center" },

                // Divider doble decorativo
                { id: "div-1", type: "shape", shape: "rect", x: 280, y: 1110, width: 520, height: 2, fill: "#5c2a0a", selectable: false },
                { id: "div-2", type: "shape", shape: "rect", x: 380, y: 1118, width: 320, height: 1, fill: "#5c2a0a", selectable: false },

                // CREDITOS estilo pelicula al pie en grid 3 columnas
                { id: "credits-1-label", type: "text", text: "DIRIGE", x: 130, y: 1145, width: 240, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(92,42,10,0.6)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "credits-1-value", type: "text", text: "L. Vega", x: 130, y: 1165, width: 240, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#3d1a05", textAlign: "center", fontStyle: "italic" },

                { id: "credits-2-label", type: "text", text: "MÚSICA", x: 420, y: 1145, width: 240, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(92,42,10,0.6)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "credits-2-value", type: "text", text: "El Sexteto", x: 420, y: 1165, width: 240, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#3d1a05", textAlign: "center", fontStyle: "italic" },

                { id: "credits-3-label", type: "text", text: "PRODUCE", x: 710, y: 1145, width: 240, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(92,42,10,0.6)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "credits-3-value", type: "text", text: "Casa Real", x: 710, y: 1165, width: 240, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#3d1a05", textAlign: "center", fontStyle: "italic" },

                // PIE: fecha y venue tipo billete
                { id: "footer-line", type: "shape", shape: "rect", x: 130, y: 1225, width: 820, height: 1, fill: "#5c2a0a", selectable: false },
                { id: "footer-date", type: "text", text: "12 SEPTIEMBRE  ·  TEATRO CIRCO PRICE  ·  MADRID", x: 0, y: 1240, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#3d1a05", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "footer-price", type: "text", text: "ENTRADA 30 PESETAS  ·  AFORO RESERVADO", x: 0, y: 1268, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(92,42,10,0.7)", fontStyle: "italic", textAlign: "center", charSpacing: 350 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 30 — Vinyl Cover DJ — disco de vinilo grande (NUEVO LAYOUT)
//      Fondo color saturado liso, vinilo XXL parcial abajo,
//      DJ emerge del disco, info como tracklist Side A/B.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 30,
        title: "Vinyl Cover",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
        premium: false,
        audience: ["productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO color saturado naranja cobre liso
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#d97706", selectable: false },
                // Banda superior delgada con grano negro
                { id: "grain-top", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 80, fill: "rgba(0,0,0,0.25)", selectable: false },

                // CABECERA tipo album cover
                { id: "label-top-l", type: "text", text: "33 ⅓ RPM", x: 50, y: 30, width: 300, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "left", charSpacing: 400 },
                { id: "label-top-r", type: "text", text: "STEREO  ·  LP-2026", x: 730, y: 30, width: 300, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "right", charSpacing: 400 },

                // TITULO album cover izquierda
                { id: "label-album", type: "text", text: "ALBUM", x: 50, y: 140, width: 600, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(254,243,199,0.7)", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "album-name-1", type: "text", text: "NIGHT", x: 50, y: 165, width: 600, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "left", charSpacing: -5 },
                { id: "album-name-2", type: "text", text: "TRANSMISSION", x: 50, y: 270, width: 1000, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "left", charSpacing: 20 },

                // Linea horizontal divisor
                { id: "div-h", type: "shape", shape: "rect", x: 50, y: 360, width: 980, height: 2, fill: "rgba(254,243,199,0.5)", selectable: false },

                // ─── VINILO XXL semioculto abajo ───
                // Disco principal negro
                { id: "vinyl-disc", type: "shape", shape: "circle", x: 540, y: 600, width: 1100, height: 1100, fill: "#0a0a0a", originX: "center", originY: "top", selectable: false },
                // Anillos finos del disco (groove)
                { id: "vinyl-ring-1", type: "shape", shape: "circle", x: 540, y: 640, width: 1020, height: 1020, fill: "transparent", stroke: "rgba(60,60,60,0.6)", strokeWidth: 1, originX: "center", originY: "top", selectable: false },
                { id: "vinyl-ring-2", type: "shape", shape: "circle", x: 540, y: 730, width: 840, height: 840, fill: "transparent", stroke: "rgba(60,60,60,0.5)", strokeWidth: 1, originX: "center", originY: "top", selectable: false },
                { id: "vinyl-ring-3", type: "shape", shape: "circle", x: 540, y: 820, width: 660, height: 660, fill: "transparent", stroke: "rgba(60,60,60,0.4)", strokeWidth: 1, originX: "center", originY: "top", selectable: false },
                // Label central del disco (rojo)
                { id: "vinyl-label", type: "shape", shape: "circle", x: 540, y: 950, width: 400, height: 400, fill: "#dc2626", originX: "center", originY: "top", selectable: false },
                // Hole central del disco
                { id: "vinyl-hole", type: "shape", shape: "circle", x: 540, y: 1140, width: 20, height: 20, fill: "#0a0a0a", originX: "center", originY: "top", selectable: false },

                // DJ emerge del disco (escala reducida para no tapar info y label rojo)
                // Imagen real: 447×558, scale 1.05 → render 469×586 — cabe entre y:330 y y:916
                // Deja libre la zona del vinyl-label (y:950-1350) para los textos release
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 540, y: 330, scaleX: 1.05, scaleY: 1.05, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.55)", blur: 30, offsetX: 0, offsetY: 10 } },

                // SIDE A label
                { id: "side-a-label", type: "text", text: "SIDE A", x: 80, y: 410, width: 200, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "left", charSpacing: 600 },
                { id: "side-a-line", type: "shape", shape: "rect", x: 80, y: 432, width: 220, height: 2, fill: "#fef3c7", selectable: false },
                { id: "side-a-1", type: "text", text: "01. PULSAR (Intro)", x: 80, y: 445, width: 300, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "left" },
                { id: "side-a-2", type: "text", text: "02. Open Air", x: 80, y: 470, width: 300, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "left" },
                { id: "side-a-3", type: "text", text: "03. Melodic Drop", x: 80, y: 495, width: 300, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "left" },

                // SIDE B label
                { id: "side-b-label", type: "text", text: "SIDE B", x: 780, y: 410, width: 220, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "right", charSpacing: 600 },
                { id: "side-b-line", type: "shape", shape: "rect", x: 780, y: 432, width: 220, height: 2, fill: "#fef3c7", selectable: false },
                { id: "side-b-1", type: "text", text: "04. House 4AM", x: 700, y: 445, width: 300, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "right" },
                { id: "side-b-2", type: "text", text: "05. Closing Set", x: 700, y: 470, width: 300, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "right" },
                { id: "side-b-3", type: "text", text: "06. Sunrise Reprise", x: 700, y: 495, width: 300, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "right" },

                // INFO en el label central del disco — fuentes más legibles
                { id: "release-by", type: "text", text: "A SET BY", x: 0, y: 1010, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(254,243,199,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "release-name", type: "text", text: "DJ MAVEN", x: 0, y: 1045, width: 1080, fontSize: 64, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "center", charSpacing: 60 },
                { id: "release-date", type: "text", text: "22 . AGO . 2026", x: 0, y: 1130, width: 1080, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "800", textAlign: "center", charSpacing: 250 },
                { id: "release-venue", type: "text", text: "AZOTEA · BARCELONA", x: 0, y: 1170, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(254,243,199,0.95)", fontWeight: "600", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 31 — Cartelera Bandera 5 Artistas — lineup horizontal (NUEVO LAYOUT)
//      Headliner GRANDE arriba ocupando casi mitad,
//      4 secundarios en fila horizontal con casillas color,
//      info pie tipo billete metro.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 31,
        title: "Cartelera 5",
        category: "Fiesta",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
        premium: false,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO crema claro
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#f5e9d3", selectable: false },

                // BANDA NEGRA superior con titulo masivo
                { id: "top-band", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 140, fill: "#0a0a0a", selectable: false },
                { id: "top-title", type: "text", text: "CARTELERA", x: 0, y: 25, width: 1080, fontSize: 70, fontFamily: "Anton, Impact, sans-serif", color: "#f5e9d3", textAlign: "center", charSpacing: 80 },
                { id: "top-subtitle", type: "text", text: "5 ARTISTAS  ·  1 NOCHE  ·  ENTRADA LIBRE", x: 0, y: 105, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                // HEADLINER bloque arriba
                // Caja headliner crema oscuro
                { id: "head-bg", type: "shape", shape: "rect", x: 40, y: 170, width: 1000, height: 540, fill: "#7c2d12", selectable: false },
                // Headliner foto - Damian centrado en la caja
                { id: "headliner", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 540, y: 175, scaleX: 0.95, scaleY: 0.95, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.5)", blur: 35, offsetX: 0, offsetY: 10 } },
                // Tag HEADLINER vertical lado izq caja
                { id: "head-tag", type: "text", text: "HEADLINER", x: 70, y: 480, width: 200, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "left", angle: -90, charSpacing: 600 },
                // Nombre headliner abajo de la caja
                { id: "head-name", type: "text", text: "DAMIÁN REYES", x: 40, y: 640, width: 1000, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 60 },

                // BANDA DIVISOR amarilla
                { id: "div-band", type: "shape", shape: "rect", x: 0, y: 730, width: 1080, height: 38, fill: "#fbbf24", selectable: false },
                { id: "div-band-text", type: "text", text: "·  TAMBIÉN EN ESCENA  ·", x: 0, y: 740, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 500 },

                // ─── 4 ARTISTAS SECUNDARIOS EN FILA HORIZONTAL ───
                // Cada casilla: 240 ancho * 290 alto, separadas 20px
                // Casilla 1 (verde teal)
                { id: "slot-1-bg", type: "shape", shape: "rect", x: 40, y: 790, width: 240, height: 290, fill: "#0f766e", selectable: false },
                { id: "artist-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 160, y: 800, scaleX: 0.35, scaleY: 0.35, originX: "center", originY: "top" },
                { id: "name-1", type: "text", text: "NIA", x: 40, y: 1035, width: 240, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "center", charSpacing: 80 },

                // Casilla 2 (rosa)
                { id: "slot-2-bg", type: "shape", shape: "rect", x: 300, y: 790, width: 240, height: 290, fill: "#be185d", selectable: false },
                { id: "artist-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 420, y: 800, scaleX: 0.35, scaleY: 0.35, originX: "center", originY: "top" },
                { id: "name-2", type: "text", text: "MALIK", x: 300, y: 1035, width: 240, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "center", charSpacing: 80 },

                // Casilla 3 (azul)
                { id: "slot-3-bg", type: "shape", shape: "rect", x: 560, y: 790, width: 240, height: 290, fill: "#1d4ed8", selectable: false },
                { id: "artist-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 680, y: 800, scaleX: 0.35, scaleY: 0.35, originX: "center", originY: "top" },
                { id: "name-3", type: "text", text: "VAL & DAMI", x: 560, y: 1035, width: 240, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "center", charSpacing: 80 },

                // Casilla 4 (morado)
                { id: "slot-4-bg", type: "shape", shape: "rect", x: 820, y: 790, width: 220, height: 290, fill: "#6b21a8", selectable: false },
                { id: "artist-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 930, y: 800, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "top" },
                { id: "name-4", type: "text", text: "ISA & ALE", x: 820, y: 1035, width: 220, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "center", charSpacing: 80 },

                // PIE tipo billete/ticket
                { id: "ticket-bg", type: "shape", shape: "rect", x: 0, y: 1110, width: 1080, height: 240, fill: "#0a0a0a", selectable: false },
                // Linea de "perforacion" decorativa
                { id: "perf-line", type: "shape", shape: "rect", x: 0, y: 1110, width: 1080, height: 4, fill: "#fbbf24", selectable: false },

                // INFO 3 columnas tipo ticket
                { id: "tk-col1-label", type: "text", text: "FECHA", x: 60, y: 1140, width: 280, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "left", charSpacing: 300 },
                { id: "tk-col1-value", type: "text", text: "VIE  ·  3 OCT", x: 60, y: 1158, width: 280, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "left", charSpacing: 80 },
                { id: "tk-col1-extra", type: "text", text: "21:00 — 03:00", x: 60, y: 1198, width: 280, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "600", textAlign: "left" },

                { id: "tk-col2-label", type: "text", text: "LUGAR", x: 380, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "left", charSpacing: 300 },
                { id: "tk-col2-value", type: "text", text: "SALA TROPICAL", x: 380, y: 1158, width: 320, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "left", charSpacing: 80 },
                { id: "tk-col2-extra", type: "text", text: "C/ Libertad 8  ·  Metro Chueca", x: 380, y: 1198, width: 320, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "500", textAlign: "left" },

                { id: "tk-col3-label", type: "text", text: "PRECIO", x: 740, y: 1140, width: 280, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "left", charSpacing: 300 },
                { id: "tk-col3-value", type: "text", text: "12€ / 18€", x: 740, y: 1158, width: 280, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#fef3c7", textAlign: "left", charSpacing: 80 },
                { id: "tk-col3-extra", type: "text", text: "Anticipada / Puerta", x: 740, y: 1198, width: 280, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "500", textAlign: "left" },

                // CTA pie
                { id: "cta", type: "text", text: "RESERVAS  ·  +34 600 111 222  ·  WHATSAPP", x: 0, y: 1260, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "rgba(254,243,199,0.7)", textAlign: "center", charSpacing: 350 },

                // CODIGO ticket
                { id: "ticket-code", type: "text", text: "N° 003 · CARTELERA · 2026", x: 0, y: 1300, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.5)", fontWeight: "500", textAlign: "center", charSpacing: 500 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 32 — Postal Polaroid Banda — postal vintage manuscrita (NUEVO LAYOUT)
//      Fondo papel sepia, polaroid girada ligeramente con foto banda,
//      sello correo arriba-der, texto manuscrito italica abajo,
//      bordes rayados tipo correo aereo.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 32,
        title: "Postal Banda",
        category: "Conciertos",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(7).png",
        premium: true,
        audience: ["productoras", "academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO papel crema con manchas calidas
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#f0e3c8", selectable: false },
                // Manchas tipo papel envejecido
                { id: "stain-1", type: "shape", shape: "circle", x: 80, y: 950, width: 400, height: 400, fill: "rgba(184,134,11,0.10)", opacity: 0.8, selectable: false },
                { id: "stain-2", type: "shape", shape: "circle", x: 600, y: 60, width: 500, height: 500, fill: "rgba(184,134,11,0.10)", opacity: 0.8, selectable: false },

                // BORDE rayado tipo correo aereo (rayas rojas/azules alrededor)
                // Borde superior - rayas alternas
                { id: "air-top-1", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 12, fill: "#dc2626", selectable: false },
                { id: "air-top-2", type: "shape", shape: "rect", x: 0, y: 12, width: 1080, height: 12, fill: "#1d4ed8", selectable: false },
                { id: "air-top-3", type: "shape", shape: "rect", x: 0, y: 24, width: 1080, height: 12, fill: "#dc2626", selectable: false },
                // Borde inferior
                { id: "air-bot-1", type: "shape", shape: "rect", x: 0, y: 1314, width: 1080, height: 12, fill: "#dc2626", selectable: false },
                { id: "air-bot-2", type: "shape", shape: "rect", x: 0, y: 1326, width: 1080, height: 12, fill: "#1d4ed8", selectable: false },
                { id: "air-bot-3", type: "shape", shape: "rect", x: 0, y: 1338, width: 1080, height: 12, fill: "#dc2626", selectable: false },

                // CABECERA tipo postal
                { id: "header-text", type: "text", text: "·  POST CARD  ·  DESDE MADRID  ·", x: 0, y: 70, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#7c2d12", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "header-line", type: "shape", shape: "rect", x: 280, y: 100, width: 520, height: 1, fill: "#7c2d12", selectable: false },

                // SELLO postal arriba-derecha
                { id: "stamp-bg", type: "shape", shape: "rect", x: 850, y: 140, width: 180, height: 220, fill: "#fef3c7", stroke: "#7c2d12", strokeWidth: 3, strokeDashArray: [6, 4], selectable: false },
                { id: "stamp-inner", type: "shape", shape: "rect", x: 866, y: 156, width: 148, height: 188, fill: "transparent", stroke: "#7c2d12", strokeWidth: 1, selectable: false },
                { id: "stamp-value", type: "text", text: "25€", x: 850, y: 180, width: 180, fontSize: 40, fontFamily: "Playfair Display, serif", color: "#7c2d12", fontWeight: "900", textAlign: "center", fontStyle: "italic" },
                { id: "stamp-text", type: "text", text: "ESPAÑA", x: 850, y: 240, width: 180, fontSize: 24, fontFamily: "Cormorant Garamond, serif", color: "#7c2d12", fontWeight: "700", textAlign: "center", charSpacing: 300 },
                { id: "stamp-mini", type: "text", text: "POSTA CULTURAL", x: 850, y: 270, width: 180, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#7c2d12", textAlign: "center", charSpacing: 200 },
                // "Matasellos" sobre el sello (circulo con stroke)
                { id: "postmark", type: "shape", shape: "circle", x: 760, y: 200, width: 130, height: 130, fill: "transparent", stroke: "rgba(124,45,18,0.45)", strokeWidth: 2, selectable: false },
                { id: "postmark-2", type: "shape", shape: "circle", x: 778, y: 218, width: 94, height: 94, fill: "transparent", stroke: "rgba(124,45,18,0.45)", strokeWidth: 1, selectable: false },
                { id: "postmark-text", type: "text", text: "MADRID  ·  17.X.26", x: 700, y: 257, width: 250, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "rgba(124,45,18,0.65)", fontWeight: "700", textAlign: "center", charSpacing: 200 },

                // POLAROID girada con foto banda
                // Marco blanco rotado ~-4 grados, centrado en x=380 y=560
                { id: "polaroid-frame", type: "shape", shape: "rect", x: 380, y: 560, width: 540, height: 620, fill: "#fafafa", originX: "center", originY: "center", angle: -4, stroke: "rgba(0,0,0,0.08)", strokeWidth: 1 },
                // Polaroid inner background area for photo (offset matching angle aprox)
                { id: "polaroid-photo-bg", type: "shape", shape: "rect", x: 380, y: 502, width: 480, height: 480, fill: "#1a0d05", originX: "center", originY: "center", angle: -4, selectable: false },
                // Foto banda dentro de polaroid (misma rotacion)
                { id: "band", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(7).png", x: 380, y: 502, scaleX: 1.05, scaleY: 1.05, originX: "center", originY: "center", angle: -4 },
                // Caption manuscrita debajo (dentro del marco polaroid)
                { id: "polaroid-caption", type: "text", text: "El Cuarteto del Café · Verano '26", x: 200, y: 800, width: 380, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#1a0d05", fontStyle: "italic", textAlign: "center", angle: -4 },

                // TEXTO MANUSCRITO simulado lateral derecho (como nota a mano)
                { id: "note-line-1", type: "text", text: "Querido amigo,", x: 720, y: 480, width: 320, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#1a0d05", fontStyle: "italic", textAlign: "left" },
                { id: "note-line-2", type: "text", text: "Esta noche tocan en", x: 720, y: 520, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#1a0d05", textAlign: "left" },
                { id: "note-line-3", type: "text", text: "el Café Central, no te", x: 720, y: 548, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#1a0d05", textAlign: "left" },
                { id: "note-line-4", type: "text", text: "lo pierdas. Cuerdas", x: 720, y: 576, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#1a0d05", textAlign: "left" },
                { id: "note-line-5", type: "text", text: "y silencio.", x: 720, y: 604, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#1a0d05", textAlign: "left" },
                { id: "note-line-sig", type: "text", text: "— M.", x: 720, y: 645, width: 320, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#7c2d12", fontStyle: "italic", textAlign: "left" },

                // BLOQUE PIE con info estructurada estilo "remitente"
                { id: "block-bg", type: "shape", shape: "rect", x: 80, y: 1010, width: 920, height: 270, fill: "rgba(255,255,255,0.45)", stroke: "#7c2d12", strokeWidth: 1, selectable: false },

                // Pie: titulo grande Playfair italica
                { id: "title-1", type: "text", text: "Cuerdas", x: 0, y: 1030, width: 1080, fontSize: 80, fontFamily: "Playfair Display, serif", color: "#1a0d05", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "& Silencio", x: 0, y: 1115, width: 1080, fontSize: 60, fontFamily: "Playfair Display, serif", color: "#7c2d12", textAlign: "center", fontStyle: "italic" },

                // Info pie
                { id: "info-line", type: "shape", shape: "rect", x: 280, y: 1195, width: 520, height: 1, fill: "#7c2d12", selectable: false },
                { id: "info-date", type: "text", text: "17 DE OCTUBRE  ·  20:30 H  ·  CAFÉ CENTRAL", x: 0, y: 1210, width: 1080, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#1a0d05", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "info-extra", type: "text", text: "AFORO 80  ·  RESERVA: reservas@cafecentral.es", x: 0, y: 1245, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(124,45,18,0.75)", fontStyle: "italic", textAlign: "center", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 33 — Solista Editorial — Gala estilo magazine cover (NUEVO)
//      Foto artista grande + masthead arriba + bloque editorial abajo.
//      Mix Playfair + Montserrat. Detalles tipo revista.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 33,
        title: "Solista Editorial",
        category: "Gala",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(14).png",
        premium: true,
        audience: ["productoras", "agencias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO marron oscuro casi negro
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0e0a06", selectable: false },
                // Halo central calido
                { id: "halo", type: "shape", shape: "circle", x: 180, y: 200, width: 720, height: 720, fill: "rgba(180,135,68,0.30)", opacity: 0.6, selectable: false },

                // ARTISTA centrado
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(14).png", x: 540, y: 70, scaleX: 1.88, scaleY: 1.88, originX: "center", originY: "top", shadow: { color: "rgba(180,135,68,0.5)", blur: 55, offsetX: 0, offsetY: 0 } },

                // SELLO vertical lado izquierdo tipo magazine spine
                { id: "spine-label", type: "text", text: "ISSUE  ·  N°  04   ·   OCT  2026", x: 35, y: 670, width: 60, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.55)", fontWeight: "600", textAlign: "left", angle: -90, charSpacing: 600 },

                // CABECERA tipo masthead
                { id: "masthead-line", type: "shape", shape: "rect", x: 60, y: 60, width: 960, height: 1, fill: "rgba(180,135,68,0.7)", selectable: false },
                { id: "masthead-1", type: "text", text: "VOICES", x: 60, y: 30, width: 480, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#b48744", textAlign: "left", fontStyle: "italic" },
                { id: "masthead-2", type: "text", text: "EDITORIAL  ·  MÚSICA EN VIVO", x: 540, y: 35, width: 480, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.55)", fontWeight: "600", textAlign: "right", charSpacing: 400 },

                // BLOQUE EDITORIAL inferior
                { id: "block-bg", type: "shape", shape: "rect", x: 0, y: 920, width: 1080, height: 430, fill: "rgba(8,5,3,0.92)", selectable: false },
                { id: "block-line", type: "shape", shape: "rect", x: 60, y: 920, width: 960, height: 2, fill: "#b48744", selectable: false },

                // KICKER
                { id: "kicker", type: "text", text: "GALA BENÉFICA  ·  EDICIÓN ESPECIAL", x: 60, y: 950, width: 960, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#b48744", fontWeight: "700", textAlign: "left", charSpacing: 350 },

                // TITULO grande italica desplazado a izquierda
                { id: "title-1", type: "text", text: "Voz", x: 60, y: 985, width: 960, fontSize: 130, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "de Cristal", x: 60, y: 1110, width: 960, fontSize: 96, fontFamily: "Playfair Display, serif", color: "#b48744", textAlign: "left", fontStyle: "italic" },

                // GRID INFO 2x2 (label tiny + value)
                { id: "info-label-1", type: "text", text: "FECHA", x: 60, y: 1230, width: 200, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 300 },
                { id: "info-value-1", type: "text", text: "28 NOV  ·  21:00 H", x: 60, y: 1250, width: 320, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left" },

                { id: "info-label-2", type: "text", text: "LUGAR", x: 60, y: 1290, width: 200, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 300 },
                { id: "info-value-2", type: "text", text: "Hotel Mandarín  ·  Madrid", x: 60, y: 1310, width: 360, fontSize: 18, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left", fontStyle: "italic" },

                { id: "info-label-3", type: "text", text: "PRECIO", x: 600, y: 1230, width: 200, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 300 },
                { id: "info-value-3", type: "text", text: "Donativo desde 80€", x: 600, y: 1250, width: 380, fontSize: 18, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left" },

                { id: "info-label-4", type: "text", text: "RSVP", x: 600, y: 1290, width: 200, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 300 },
                { id: "info-value-4", type: "text", text: "gala@voices.es", x: 600, y: 1310, width: 380, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#b48744", textAlign: "left", fontStyle: "italic" },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 34 — Ruido Fest Bold Yellow — festival pop (inspirada en #5)
//      Amarillo masivo + formas angulares morada/rosa + Anton chunky.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 34,
        title: "Ruido Fest",
        category: "Festival",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(3).png",
        premium: false,
        audience: ["productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO amarillo masivo
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#FFE600", selectable: false },
                // Forma morada angular grande arriba-derecha
                { id: "deco-purple", type: "shape", shape: "rect", x: 540, y: -100, width: 700, height: 1100, fill: "#5b21b6", opacity: 0.95, angle: 14 },
                // Forma rosa angular abajo-izquierda
                { id: "deco-pink", type: "shape", shape: "rect", x: -200, y: 870, width: 700, height: 500, fill: "#ec4899", opacity: 0.92, angle: -8 },

                // BANDA superior negra para titulo
                { id: "top-band", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 220, fill: "#0d0d0d", selectable: false },
                // TITULO masivo linea 1 blanco
                { id: "title-1", type: "text", text: "RUIDO", x: 0, y: 45, width: 1080, fontSize: 140, fontFamily: "Anton, Impact, sans-serif", color: "#FFFFFF", fontWeight: "900", textAlign: "center", charSpacing: -8 },
                // Linea 2 amarillo
                { id: "title-2", type: "text", text: "FEST", x: 0, y: 175, width: 1080, fontSize: 64, fontFamily: "Anton, Impact, sans-serif", color: "#FFE600", fontWeight: "900", textAlign: "center", charSpacing: 30 },

                // GRUPO centrado
                { id: "band", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(3).png", x: 540, y: 290, scaleX: 1.65, scaleY: 1.65, originX: "center", originY: "top", shadow: { color: "rgba(13,13,13,0.55)", blur: 35, offsetX: 0, offsetY: 0 } },

                // BANDA inferior negra
                { id: "bot-band", type: "shape", shape: "rect", x: 0, y: 1080, width: 1080, height: 270, fill: "#0d0d0d", selectable: false },
                // FECHA gigante amarillo
                { id: "date", type: "text", text: "12.13.14", x: 0, y: 1110, width: 1080, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#FFE600", fontWeight: "900", textAlign: "center", charSpacing: 5 },
                { id: "month", type: "text", text: "JULIO 2026", x: 0, y: 1235, width: 1080, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#FFFFFF", textAlign: "center", charSpacing: 600 },
                { id: "venue", type: "text", text: "PARQUE TIERRA  ·  MADRID  ·  5 ESCENARIOS", x: 0, y: 1295, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,230,0,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 250 },

                // Etiqueta lateral vertical
                { id: "side-label", type: "text", text: "5 ESCENARIOS  ·  +30 ARTISTAS  ·  3 DÍAS", x: 1030, y: 670, width: 60, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "left", angle: 90, charSpacing: 300 },
            ] },
        ],
    },

// ═════════════════════════════════════════════════════════════════════
// FAMILIA CLASES & WORKSHOPS DE BAILE — 6 plantillas
// Foto profe + concepto distinto por plantilla. Tag beta.
// ═════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// 35 — Workshop Bachata Sensual — pareja Lucia & Mateo
//      Latin rojo/burdeos rico, foto pareja con halo, cajas info esquinas
// ─────────────────────────────────────────────────────────────────────
    {
        id: 35,
        title: "Workshop Bachata Sensual",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png",
        premium: true,
        audience: ["academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO burdeos profundo
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#3f0a14", selectable: false },
                // Gradiente simulado con circulos halo
                { id: "halo-1", type: "shape", shape: "circle", x: -100, y: -50, width: 700, height: 700, fill: "rgba(220,38,38,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 580, y: 100, width: 650, height: 650, fill: "rgba(127,29,29,0.55)", opacity: 0.7, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: 200, y: 750, width: 700, height: 700, fill: "rgba(248,113,113,0.20)", opacity: 0.7, selectable: false },

                // CHIP top "ÚNICA SESIÓN"
                { id: "chip-bg", type: "shape", shape: "rect", x: 380, y: 55, width: 320, height: 42, fill: "transparent", radius: 21, stroke: "#fca5a5", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  ÚNICA SESIÓN  ·", x: 0, y: 65, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#fca5a5", textAlign: "center", charSpacing: 600 },

                // SUPRATITULO arriba con tracking
                { id: "supra", type: "text", text: "M A S T E R   W O R K S H O P", x: 0, y: 130, width: 1080, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "#fbbf24", fontWeight: "500", textAlign: "center", charSpacing: 700 },

                // TITULO Playfair MASIVO con linea 2 italica
                { id: "title-1", type: "text", text: "BACHATA", x: 0, y: 170, width: 1080, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40 },
                { id: "title-2", type: "text", text: "Sensual", x: 0, y: 280, width: 1080, fontSize: 76, fontFamily: "Playfair Display, serif", color: "#fbbf24", textAlign: "center", fontStyle: "italic" },

                // FOTO PAREJA centrada con halo blanco intenso
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 540, y: 380, scaleX: 0.78, scaleY: 0.78, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 60, offsetX: 0, offsetY: 0 } },

                // NOMBRE pareja debajo de la foto
                { id: "by-label", type: "text", text: "IMPARTEN", x: 0, y: 900, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 500 },
                { id: "names", type: "text", text: "Lucía  &  Mateo", x: 0, y: 925, width: 1080, fontSize: 42, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },

                // Divider ornamental
                { id: "div-l", type: "shape", shape: "rect", x: 320, y: 1000, width: 200, height: 1, fill: "#fbbf24", selectable: false },
                { id: "div-r", type: "shape", shape: "rect", x: 560, y: 1000, width: 200, height: 1, fill: "#fbbf24", selectable: false },
                { id: "div-dot", type: "shape", shape: "circle", x: 533, y: 992, width: 14, height: 14, fill: "transparent", stroke: "#fbbf24", strokeWidth: 1, selectable: false },

                // ─── BLOQUE INFO 3 CAJAS GEOMETRICAS ───
                // Caja 1 - FECHA
                { id: "card-1", type: "shape", shape: "rect", x: 40, y: 1030, width: 320, height: 200, fill: "rgba(15,3,8,0.65)", radius: 8, stroke: "rgba(251,191,36,0.35)", strokeWidth: 1, selectable: false },
                { id: "c1-label", type: "text", text: "FECHA", x: 40, y: 1055, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "c1-day", type: "text", text: "11", x: 40, y: 1080, width: 320, fontSize: 80, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "c1-month", type: "text", text: "OCT · SÁB", x: 40, y: 1190, width: 320, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 250 },

                // Caja 2 - PRECIO
                { id: "card-2", type: "shape", shape: "rect", x: 380, y: 1030, width: 320, height: 200, fill: "rgba(15,3,8,0.65)", radius: 8, stroke: "rgba(251,191,36,0.35)", strokeWidth: 1, selectable: false },
                { id: "c2-label", type: "text", text: "PRECIO", x: 380, y: 1055, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "c2-day", type: "text", text: "45€", x: 380, y: 1080, width: 320, fontSize: 76, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "c2-month", type: "text", text: "2H · PLAZAS LIMITADAS", x: 380, y: 1190, width: 320, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },

                // Caja 3 - HORA
                { id: "card-3", type: "shape", shape: "rect", x: 720, y: 1030, width: 320, height: 200, fill: "rgba(15,3,8,0.65)", radius: 8, stroke: "rgba(251,191,36,0.35)", strokeWidth: 1, selectable: false },
                { id: "c3-label", type: "text", text: "HORA", x: 720, y: 1055, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "c3-day", type: "text", text: "18 H", x: 720, y: 1080, width: 320, fontSize: 76, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "c3-month", type: "text", text: "DURACIÓN 2 HORAS", x: 720, y: 1190, width: 320, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },

                // PIE: venue + cta
                { id: "venue", type: "text", text: "SALA TROPICAL  ·  C/ LIBERTAD 8  ·  MADRID", x: 0, y: 1260, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", charSpacing: 300 },
                { id: "cta", type: "text", text: "RESERVA EN  ·  bachata@saltatropical.es", x: 0, y: 1295, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#fbbf24", fontStyle: "italic", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── SQUARE 1080x1080 — Instagram post ───
            { format: "square", width: 1080, height: 1080, layers: [
                // FONDO + halos comprimidos verticalmente
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#3f0a14", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -100, y: -100, width: 700, height: 700, fill: "rgba(220,38,38,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 580, y: 0, width: 650, height: 650, fill: "rgba(127,29,29,0.55)", opacity: 0.7, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: 200, y: 500, width: 700, height: 700, fill: "rgba(248,113,113,0.20)", opacity: 0.7, selectable: false },

                // CHIP top
                { id: "chip-bg", type: "shape", shape: "rect", x: 380, y: 30, width: 320, height: 38, fill: "transparent", radius: 19, stroke: "#fca5a5", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  ÚNICA SESIÓN  ·", x: 0, y: 38, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#fca5a5", textAlign: "center", charSpacing: 600 },

                // SUPRA + TITULOS
                { id: "supra", type: "text", text: "M A S T E R   W O R K S H O P", x: 0, y: 95, width: 1080, fontSize: 24, fontFamily: "Cormorant Garamond, serif", color: "#fbbf24", fontWeight: "500", textAlign: "center", charSpacing: 700 },
                { id: "title-1", type: "text", text: "BACHATA", x: 0, y: 125, width: 1080, fontSize: 88, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40 },
                { id: "title-2", type: "text", text: "Sensual", x: 0, y: 215, width: 1080, fontSize: 60, fontFamily: "Playfair Display, serif", color: "#fbbf24", textAlign: "center", fontStyle: "italic" },

                // FOTO PAREJA mas pequena para que entre
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 540, y: 290, scaleX: 0.58, scaleY: 0.58, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 50, offsetX: 0, offsetY: 0 } },

                // NOMBRES (linea unica para ahorrar altura)
                { id: "by-label", type: "text", text: "IMPARTEN  ·  LUCÍA  &  MATEO", x: 0, y: 740, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },

                // Divider
                { id: "div-l", type: "shape", shape: "rect", x: 340, y: 780, width: 180, height: 1, fill: "#fbbf24", selectable: false },
                { id: "div-r", type: "shape", shape: "rect", x: 560, y: 780, width: 180, height: 1, fill: "#fbbf24", selectable: false },
                { id: "div-dot", type: "shape", shape: "circle", x: 533, y: 772, width: 14, height: 14, fill: "transparent", stroke: "#fbbf24", strokeWidth: 1, selectable: false },

                // 3 CAJAS info compactas
                { id: "card-1", type: "shape", shape: "rect", x: 40, y: 810, width: 320, height: 200, fill: "rgba(15,3,8,0.65)", radius: 8, stroke: "rgba(251,191,36,0.35)", strokeWidth: 1, selectable: false },
                { id: "c1-label", type: "text", text: "FECHA", x: 40, y: 832, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "c1-day", type: "text", text: "11", x: 40, y: 850, width: 320, fontSize: 80, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "c1-month", type: "text", text: "OCT · SÁB", x: 40, y: 970, width: 320, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 250 },

                { id: "card-2", type: "shape", shape: "rect", x: 380, y: 810, width: 320, height: 200, fill: "rgba(15,3,8,0.65)", radius: 8, stroke: "rgba(251,191,36,0.35)", strokeWidth: 1, selectable: false },
                { id: "c2-label", type: "text", text: "PRECIO", x: 380, y: 832, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "c2-day", type: "text", text: "45€", x: 380, y: 850, width: 320, fontSize: 76, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "c2-month", type: "text", text: "PLAZAS LIMITADAS", x: 380, y: 970, width: 320, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },

                { id: "card-3", type: "shape", shape: "rect", x: 720, y: 810, width: 320, height: 200, fill: "rgba(15,3,8,0.65)", radius: 8, stroke: "rgba(251,191,36,0.35)", strokeWidth: 1, selectable: false },
                { id: "c3-label", type: "text", text: "HORA", x: 720, y: 832, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "c3-day", type: "text", text: "18H", x: 720, y: 850, width: 320, fontSize: 76, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "c3-month", type: "text", text: "DURACIÓN 2H", x: 720, y: 970, width: 320, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },

                // PIE compacto (todo en una linea)
                { id: "cta", type: "text", text: "SALA TROPICAL  ·  MADRID  ·  bachata@saltatropical.es", x: 0, y: 1042, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#fbbf24", fontStyle: "italic", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── STORY 1080x1920 — Instagram Story / Reels ───
            { format: "story", width: 1080, height: 1920, layers: [
                // FONDO + halos mas amplios
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#3f0a14", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -200, y: 100, width: 900, height: 900, fill: "rgba(220,38,38,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 500, y: 300, width: 850, height: 850, fill: "rgba(127,29,29,0.55)", opacity: 0.7, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: 100, y: 1200, width: 900, height: 900, fill: "rgba(248,113,113,0.20)", opacity: 0.7, selectable: false },

                // CHIP top (safe area 250px arriba en Instagram)
                { id: "chip-bg", type: "shape", shape: "rect", x: 380, y: 120, width: 320, height: 48, fill: "transparent", radius: 24, stroke: "#fca5a5", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  ÚNICA SESIÓN  ·", x: 0, y: 132, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fca5a5", textAlign: "center", charSpacing: 600 },

                // SUPRA + TITULOS mas grandes
                { id: "supra", type: "text", text: "M A S T E R   W O R K S H O P", x: 0, y: 215, width: 1080, fontSize: 26, fontFamily: "Cormorant Garamond, serif", color: "#fbbf24", fontWeight: "500", textAlign: "center", charSpacing: 700 },
                { id: "title-1", type: "text", text: "BACHATA", x: 0, y: 260, width: 1080, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40 },
                { id: "title-2", type: "text", text: "Sensual", x: 0, y: 390, width: 1080, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#fbbf24", textAlign: "center", fontStyle: "italic" },

                // FOTO pareja mas grande aprovechando espacio
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 540, y: 540, scaleX: 0.95, scaleY: 0.95, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 70, offsetX: 0, offsetY: 0 } },

                // NOMBRE pareja
                { id: "by-label", type: "text", text: "IMPARTEN", x: 0, y: 1180, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 500 },
                { id: "names", type: "text", text: "Lucía  &  Mateo", x: 0, y: 1210, width: 1080, fontSize: 56, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },

                // Divider
                { id: "div-l", type: "shape", shape: "rect", x: 320, y: 1310, width: 200, height: 1, fill: "#fbbf24", selectable: false },
                { id: "div-r", type: "shape", shape: "rect", x: 560, y: 1310, width: 200, height: 1, fill: "#fbbf24", selectable: false },
                { id: "div-dot", type: "shape", shape: "circle", x: 533, y: 1302, width: 14, height: 14, fill: "transparent", stroke: "#fbbf24", strokeWidth: 1, selectable: false },

                // 3 CAJAS info mas grandes
                { id: "card-1", type: "shape", shape: "rect", x: 40, y: 1370, width: 320, height: 250, fill: "rgba(15,3,8,0.65)", radius: 8, stroke: "rgba(251,191,36,0.35)", strokeWidth: 1, selectable: false },
                { id: "c1-label", type: "text", text: "FECHA", x: 40, y: 1400, width: 320, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "c1-day", type: "text", text: "11", x: 40, y: 1430, width: 320, fontSize: 105, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "c1-month", type: "text", text: "OCT · SÁB", x: 40, y: 1580, width: 320, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 250 },

                { id: "card-2", type: "shape", shape: "rect", x: 380, y: 1370, width: 320, height: 250, fill: "rgba(15,3,8,0.65)", radius: 8, stroke: "rgba(251,191,36,0.35)", strokeWidth: 1, selectable: false },
                { id: "c2-label", type: "text", text: "PRECIO", x: 380, y: 1400, width: 320, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "c2-day", type: "text", text: "45€", x: 380, y: 1430, width: 320, fontSize: 100, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "c2-month", type: "text", text: "2H · PLAZAS LIMITADAS", x: 380, y: 1580, width: 320, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },

                { id: "card-3", type: "shape", shape: "rect", x: 720, y: 1370, width: 320, height: 250, fill: "rgba(15,3,8,0.65)", radius: 8, stroke: "rgba(251,191,36,0.35)", strokeWidth: 1, selectable: false },
                { id: "c3-label", type: "text", text: "HORA", x: 720, y: 1400, width: 320, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "c3-day", type: "text", text: "18 H", x: 720, y: 1430, width: 320, fontSize: 100, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "c3-month", type: "text", text: "DURACIÓN 2 HORAS", x: 720, y: 1580, width: 320, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },

                // PIE: venue + cta + telefono (safe area 250px abajo en Instagram)
                { id: "venue", type: "text", text: "SALA TROPICAL  ·  C/ LIBERTAD 8  ·  MADRID", x: 0, y: 1720, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", charSpacing: 300 },
                { id: "cta", type: "text", text: "RESERVA EN  ·  bachata@saltatropical.es", x: 0, y: 1780, width: 1080, fontSize: 18, fontFamily: "Cormorant Garamond, serif", color: "#fbbf24", fontStyle: "italic", textAlign: "center", charSpacing: 250 },
                { id: "phone", type: "text", text: "+34 600 333 444", x: 0, y: 1830, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── FB-COVER 1920x1005 — Portada Facebook (split horizontal) ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                // FONDO
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#3f0a14", selectable: false },
                // Halos distribuidos horizontalmente
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: -100, width: 800, height: 800, fill: "rgba(220,38,38,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 1150, y: -50, width: 850, height: 850, fill: "rgba(127,29,29,0.55)", opacity: 0.7, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: 600, y: 500, width: 850, height: 850, fill: "rgba(248,113,113,0.20)", opacity: 0.7, selectable: false },

                // ── LADO IZQUIERDO: INFO (x 80-900) ──
                { id: "chip-bg", type: "shape", shape: "rect", x: 80, y: 80, width: 280, height: 38, fill: "transparent", radius: 19, stroke: "#fca5a5", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  ÚNICA SESIÓN  ·", x: 80, y: 88, width: 280, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#fca5a5", textAlign: "center", charSpacing: 500 },

                { id: "supra", type: "text", text: "M A S T E R   W O R K S H O P", x: 80, y: 145, width: 800, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "#fbbf24", fontWeight: "500", textAlign: "left", charSpacing: 600 },
                { id: "title-1", type: "text", text: "BACHATA", x: 80, y: 180, width: 800, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "title-2", type: "text", text: "Sensual", x: 80, y: 320, width: 800, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#fbbf24", textAlign: "left", fontStyle: "italic" },

                { id: "by-label", type: "text", text: "IMPARTEN", x: 80, y: 440, width: 800, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "names", type: "text", text: "Lucía  &  Mateo", x: 80, y: 465, width: 800, fontSize: 42, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left", fontStyle: "italic" },

                { id: "div", type: "shape", shape: "rect", x: 80, y: 540, width: 180, height: 2, fill: "#fbbf24", selectable: false },

                // INFO 3 LINEAS HORIZONTALES
                { id: "info-line-1", type: "text", text: "11 OCT · SÁBADO  ·  18:00 H · 2H DURACIÓN", x: 80, y: 575, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "left", charSpacing: 150 },
                { id: "info-line-2", type: "text", text: "SALA TROPICAL  ·  C/ LIBERTAD 8  ·  MADRID", x: 80, y: 615, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.75)", fontWeight: "500", textAlign: "left", charSpacing: 200 },
                { id: "info-line-3", type: "text", text: "45€  ·  PLAZAS LIMITADAS", x: 80, y: 650, width: 900, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "left", charSpacing: 250 },

                // CTA
                { id: "cta-line", type: "shape", shape: "rect", x: 80, y: 720, width: 360, height: 2, fill: "#fbbf24", selectable: false },
                { id: "cta", type: "text", text: "RESERVA EN  ·  bachata@saltatropical.es", x: 80, y: 740, width: 900, fontSize: 18, fontFamily: "Cormorant Garamond, serif", color: "#fbbf24", fontStyle: "italic", textAlign: "left", charSpacing: 200 },
                { id: "phone", type: "text", text: "+34 600 333 444", x: 80, y: 775, width: 900, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "left", charSpacing: 200 },

                // ── LADO DERECHO: FOTO PAREJA ──
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 1380, y: 50, scaleX: 0.85, scaleY: 0.85, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 60, offsetX: 0, offsetY: 0 } },

                // Etiqueta lateral vertical der
                { id: "vert-label", type: "text", text: "WORKSHOP · 2026 · ÚNICA SESIÓN", x: 1845, y: 280, width: 60, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "rgba(251,191,36,0.85)", textAlign: "left", angle: 90, charSpacing: 500 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 36 — Clases Semanales con Jean — modern minimalista (NUEVO LAYOUT)
//      Foto profe LATERAL izquierda + info derecha estructurada
//      Mucho aire, sans-serif, paleta gris + acento granate
// ─────────────────────────────────────────────────────────────────────
    {
        id: 36,
        title: "Clases Semanales",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png",
        premium: false,
        audience: ["academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO crema casi blanco
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#f5f1ec", selectable: false },
                // Banda lateral izquierda granate (donde va la foto)
                { id: "left-band", type: "shape", shape: "rect", x: 0, y: 0, width: 540, height: 1350, fill: "#7c1d2c", selectable: false },

                // PROFE foto centrada en banda izquierda
                // Imagen real: 447×558. Scale 1.1 → render 491×614 (cabe en banda 540 ancho)
                // y:170 → termina en y:784. Franja decorativa solapa últimos ~70px (y:720-790)
                // → el corte queda DENTRO de la franja, no se ve abrupto
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 270, y: 170, scaleX: 1.1, scaleY: 1.1, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.55)", blur: 35, offsetX: 5, offsetY: 8 } },

                // FRANJA gradiente simulado (3 rects con opacidad creciente) — enmascara corte del profe
                { id: "profe-fade-1", type: "shape", shape: "rect", x: 0, y: 700, width: 540, height: 30, fill: "rgba(124,29,44,0.4)", selectable: false },
                { id: "profe-fade-2", type: "shape", shape: "rect", x: 0, y: 730, width: 540, height: 30, fill: "rgba(124,29,44,0.7)", selectable: false },
                { id: "profe-fade-3", type: "shape", shape: "rect", x: 0, y: 760, width: 540, height: 30, fill: "#7c1d2c", selectable: false },
                // FRANJA negra decorativa donde termina la imagen
                { id: "profe-band", type: "shape", shape: "rect", x: 0, y: 790, width: 540, height: 6, fill: "#fbbf24", selectable: false },

                // Sello vertical en banda izq lateral (lateral izquierdo)
                { id: "side-vert", type: "text", text: "ACADEMIA  ·  TEMPORADA 2026 / 27", x: 40, y: 880, width: 50, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.45)", fontWeight: "600", textAlign: "left", angle: -90, charSpacing: 400 },

                // Nombre del profe DEBAJO de la franja decorativa
                { id: "profe-name-l", type: "text", text: "JEAN MARC", x: 0, y: 840, width: 540, fontSize: 44, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "profe-role", type: "text", text: "Director artístico", x: 0, y: 895, width: 540, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "500", textAlign: "center", fontStyle: "italic", charSpacing: 150 },

                // LADO DERECHO - info
                // Kicker arriba
                { id: "kicker", type: "text", text: "TEMPORADA  ·  OCTUBRE  ·  MAYO", x: 600, y: 100, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#7c1d2c", fontWeight: "700", textAlign: "left", charSpacing: 350 },

                // TITULO grande sans-serif
                { id: "title-1", type: "text", text: "Clases", x: 600, y: 130, width: 440, fontSize: 72, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "Semanales", x: 600, y: 215, width: 460, fontSize: 72, fontFamily: "Playfair Display, serif", color: "#7c1d2c", textAlign: "left", fontStyle: "italic" },

                // Divider fino
                { id: "div", type: "shape", shape: "rect", x: 600, y: 330, width: 80, height: 3, fill: "#7c1d2c", selectable: false },

                // Descripcion corta
                { id: "desc", type: "text", text: "Formación regular en grupo. Nivel principiante e intermedio. Plazas limitadas a 12 alumnos por clase.", x: 600, y: 360, width: 440, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.75)", fontWeight: "500", textAlign: "left", lineHeight: 1.4 },

                // ─── HORARIOS lista limpia ───
                { id: "sched-title", type: "text", text: "HORARIOS", x: 600, y: 480, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "sched-line", type: "shape", shape: "rect", x: 600, y: 502, width: 80, height: 2, fill: "#7c1d2c", selectable: false },

                // Fila 1 LUN
                { id: "sched-d1", type: "text", text: "LUN", x: 600, y: 525, width: 80, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#7c1d2c", textAlign: "left", charSpacing: 150 },
                { id: "sched-t1", type: "text", text: "Iniciación bachata", x: 720, y: 525, width: 240, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-h1", type: "text", text: "19:00", x: 970, y: 525, width: 80, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "sched-sep1", type: "shape", shape: "rect", x: 600, y: 555, width: 440, height: 1, fill: "rgba(31,16,16,0.12)", selectable: false },

                // Fila 2 MAR
                { id: "sched-d2", type: "text", text: "MAR", x: 600, y: 570, width: 80, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#7c1d2c", textAlign: "left", charSpacing: 150 },
                { id: "sched-t2", type: "text", text: "Salsa cubana", x: 720, y: 570, width: 240, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-h2", type: "text", text: "20:00", x: 970, y: 570, width: 80, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "sched-sep2", type: "shape", shape: "rect", x: 600, y: 600, width: 440, height: 1, fill: "rgba(31,16,16,0.12)", selectable: false },

                // Fila 3 MIE
                { id: "sched-d3", type: "text", text: "MIÉ", x: 600, y: 615, width: 80, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#7c1d2c", textAlign: "left", charSpacing: 150 },
                { id: "sched-t3", type: "text", text: "Bachata intermedio", x: 720, y: 615, width: 240, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-h3", type: "text", text: "19:30", x: 970, y: 615, width: 80, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "sched-sep3", type: "shape", shape: "rect", x: 600, y: 645, width: 440, height: 1, fill: "rgba(31,16,16,0.12)", selectable: false },

                // Fila 4 JUE
                { id: "sched-d4", type: "text", text: "JUE", x: 600, y: 660, width: 80, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#7c1d2c", textAlign: "left", charSpacing: 150 },
                { id: "sched-t4", type: "text", text: "Estilo en pareja", x: 720, y: 660, width: 240, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-h4", type: "text", text: "21:00", x: 970, y: 660, width: 80, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "sched-sep4", type: "shape", shape: "rect", x: 600, y: 690, width: 440, height: 1, fill: "rgba(31,16,16,0.12)", selectable: false },

                // PRECIO bloque destacado abajo
                { id: "price-bg", type: "shape", shape: "rect", x: 600, y: 760, width: 440, height: 140, fill: "#7c1d2c", radius: 6, selectable: false },
                { id: "price-label", type: "text", text: "BONO MENSUAL", x: 600, y: 785, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.65)", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "price-value", type: "text", text: "60€", x: 600, y: 810, width: 440, fontSize: 64, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "price-extra", type: "text", text: "4 clases / mes  ·  clase suelta 18€", x: 600, y: 880, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "500", textAlign: "center", charSpacing: 150 },

                // FOOTER info
                { id: "addr-label", type: "text", text: "DÓNDE", x: 600, y: 945, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "addr-value", type: "text", text: "Estudio Jean · C/ Goya 22", x: 600, y: 965, width: 440, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "left", fontStyle: "italic" },

                { id: "tel-label", type: "text", text: "RESERVA", x: 600, y: 1010, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "tel-value", type: "text", text: "+34 600 222 333  ·  WhatsApp", x: 600, y: 1030, width: 440, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "left", fontStyle: "italic" },

                { id: "web-label", type: "text", text: "WEB", x: 600, y: 1075, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "web-value", type: "text", text: "estudiojean.es", x: 600, y: 1095, width: 440, fontSize: 17, fontFamily: "Playfair Display, serif", color: "#7c1d2c", textAlign: "left", fontStyle: "italic" },
            ] },

            // ─── SQUARE 1080x1080 ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#f5f1ec", selectable: false },
                { id: "left-band", type: "shape", shape: "rect", x: 0, y: 0, width: 540, height: 1080, fill: "#7c1d2c", selectable: false },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 270, y: 80, scaleX: 0.62, scaleY: 0.62, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.45)", blur: 30, offsetX: 5, offsetY: 5 } },
                { id: "profe-name-l", type: "text", text: "JEAN MARC", x: 0, y: 960, width: 540, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "profe-role", type: "text", text: "Director artístico", x: 0, y: 1005, width: 540, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", fontStyle: "italic", charSpacing: 150 },
                { id: "kicker", type: "text", text: "TEMPORADA · OCTUBRE / MAYO", x: 600, y: 80, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#7c1d2c", fontWeight: "700", textAlign: "left", charSpacing: 350 },
                { id: "title-1", type: "text", text: "Clases", x: 600, y: 110, width: 440, fontSize: 56, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "Semanales", x: 600, y: 175, width: 460, fontSize: 56, fontFamily: "Playfair Display, serif", color: "#7c1d2c", textAlign: "left", fontStyle: "italic" },
                { id: "div", type: "shape", shape: "rect", x: 600, y: 260, width: 80, height: 3, fill: "#7c1d2c", selectable: false },
                { id: "sched-title", type: "text", text: "HORARIOS", x: 600, y: 280, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "sched-d1", type: "text", text: "LUN", x: 600, y: 305, width: 80, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#7c1d2c", textAlign: "left", charSpacing: 150 },
                { id: "sched-t1", type: "text", text: "Iniciación bachata", x: 700, y: 305, width: 280, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-h1", type: "text", text: "19:00", x: 970, y: 305, width: 80, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "sched-sep1", type: "shape", shape: "rect", x: 600, y: 335, width: 440, height: 1, fill: "rgba(31,16,16,0.12)", selectable: false },
                { id: "sched-d2", type: "text", text: "MIÉ", x: 600, y: 350, width: 80, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#7c1d2c", textAlign: "left", charSpacing: 150 },
                { id: "sched-t2", type: "text", text: "Bachata intermedio", x: 700, y: 350, width: 280, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-h2", type: "text", text: "19:30", x: 970, y: 350, width: 80, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "sched-sep2", type: "shape", shape: "rect", x: 600, y: 380, width: 440, height: 1, fill: "rgba(31,16,16,0.12)", selectable: false },
                { id: "sched-d3", type: "text", text: "JUE", x: 600, y: 395, width: 80, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#7c1d2c", textAlign: "left", charSpacing: 150 },
                { id: "sched-t3", type: "text", text: "Estilo en pareja", x: 700, y: 395, width: 280, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-h3", type: "text", text: "21:00", x: 970, y: 395, width: 80, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "price-bg", type: "shape", shape: "rect", x: 600, y: 450, width: 440, height: 130, fill: "#7c1d2c", radius: 6, selectable: false },
                { id: "price-label", type: "text", text: "BONO MENSUAL", x: 600, y: 470, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.65)", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "price-value", type: "text", text: "60€", x: 600, y: 490, width: 440, fontSize: 56, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "price-extra", type: "text", text: "4 clases / mes · suelta 18€", x: 600, y: 555, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "500", textAlign: "center", charSpacing: 150 },
                { id: "addr-value", type: "text", text: "Estudio Jean · C/ Goya 22 · Madrid", x: 600, y: 615, width: 440, fontSize: 18, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "left", fontStyle: "italic" },
                { id: "tel-value", type: "text", text: "+34 600 222 333 · WhatsApp", x: 600, y: 645, width: 440, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.7)", fontWeight: "500", textAlign: "left" },
                { id: "web-value", type: "text", text: "estudiojean.es", x: 600, y: 670, width: 440, fontSize: 24, fontFamily: "Playfair Display, serif", color: "#7c1d2c", textAlign: "left", fontStyle: "italic" },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#f5f1ec", selectable: false },
                { id: "top-band", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1000, fill: "#7c1d2c", selectable: false },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 540, y: 180, scaleX: 1.05, scaleY: 1.05, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.45)", blur: 35, offsetX: 5, offsetY: 5 } },
                { id: "kicker", type: "text", text: "ACADEMIA · TEMPORADA 2026/27", x: 0, y: 100, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.55)", fontWeight: "700", textAlign: "center", charSpacing: 500 },
                { id: "profe-name", type: "text", text: "JEAN MARC", x: 0, y: 880, width: 1080, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "profe-role", type: "text", text: "Director artístico", x: 0, y: 945, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", fontStyle: "italic", charSpacing: 200 },
                { id: "title-1", type: "text", text: "Clases", x: 0, y: 1050, width: 1080, fontSize: 92, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "Semanales", x: 0, y: 1145, width: 1080, fontSize: 92, fontFamily: "Playfair Display, serif", color: "#7c1d2c", textAlign: "center", fontStyle: "italic" },
                { id: "div", type: "shape", shape: "rect", x: 460, y: 1265, width: 160, height: 3, fill: "#7c1d2c", selectable: false },
                { id: "sched-title", type: "text", text: "HORARIOS · OCTUBRE — MAYO", x: 0, y: 1290, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.55)", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "sched-d1", type: "text", text: "LUN  ·  Iniciación bachata  ·  19:00", x: 80, y: 1330, width: 920, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "center" },
                { id: "sched-sep1", type: "shape", shape: "rect", x: 200, y: 1365, width: 680, height: 1, fill: "rgba(31,16,16,0.12)", selectable: false },
                { id: "sched-d2", type: "text", text: "MAR  ·  Salsa cubana  ·  20:00", x: 80, y: 1380, width: 920, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "center" },
                { id: "sched-sep2", type: "shape", shape: "rect", x: 200, y: 1415, width: 680, height: 1, fill: "rgba(31,16,16,0.12)", selectable: false },
                { id: "sched-d3", type: "text", text: "MIÉ  ·  Bachata intermedio  ·  19:30", x: 80, y: 1430, width: 920, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "center" },
                { id: "sched-sep3", type: "shape", shape: "rect", x: 200, y: 1465, width: 680, height: 1, fill: "rgba(31,16,16,0.12)", selectable: false },
                { id: "sched-d4", type: "text", text: "JUE  ·  Estilo en pareja  ·  21:00", x: 80, y: 1480, width: 920, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "center" },
                { id: "price-bg", type: "shape", shape: "rect", x: 200, y: 1560, width: 680, height: 180, fill: "#7c1d2c", radius: 8, selectable: false },
                { id: "price-label", type: "text", text: "BONO MENSUAL", x: 200, y: 1585, width: 680, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.65)", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "price-value", type: "text", text: "60€", x: 200, y: 1610, width: 680, fontSize: 86, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "price-extra", type: "text", text: "4 clases / mes  ·  clase suelta 18€", x: 200, y: 1705, width: 680, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "500", textAlign: "center", charSpacing: 150 },
                { id: "addr", type: "text", text: "Estudio Jean  ·  C/ Goya 22  ·  Madrid", x: 0, y: 1780, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "center", fontStyle: "italic" },
                { id: "tel", type: "text", text: "+34 600 222 333  ·  estudiojean.es", x: 0, y: 1830, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "600", textAlign: "center", charSpacing: 200 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#f5f1ec", selectable: false },
                { id: "left-band", type: "shape", shape: "rect", x: 0, y: 0, width: 760, height: 1005, fill: "#7c1d2c", selectable: false },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 380, y: 80, scaleX: 0.78, scaleY: 0.78, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.45)", blur: 30, offsetX: 5, offsetY: 5 } },
                { id: "profe-name", type: "text", text: "JEAN MARC", x: 0, y: 860, width: 760, fontSize: 42, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "profe-role", type: "text", text: "Director artístico  ·  Estudio Jean", x: 0, y: 910, width: 760, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", fontStyle: "italic", charSpacing: 200 },
                { id: "kicker", type: "text", text: "TEMPORADA · OCTUBRE — MAYO", x: 820, y: 100, width: 1050, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#7c1d2c", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "title-1", type: "text", text: "Clases", x: 820, y: 130, width: 1050, fontSize: 88, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "Semanales", x: 820, y: 230, width: 1050, fontSize: 88, fontFamily: "Playfair Display, serif", color: "#7c1d2c", textAlign: "left", fontStyle: "italic" },
                { id: "div", type: "shape", shape: "rect", x: 820, y: 355, width: 100, height: 3, fill: "#7c1d2c", selectable: false },
                { id: "sched-title", type: "text", text: "HORARIOS", x: 820, y: 380, width: 1050, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.5)", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                // 2 columnas de horarios
                { id: "sched-c1-1", type: "text", text: "LUN  Iniciación bachata", x: 820, y: 410, width: 480, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-c1-1h", type: "text", text: "19:00", x: 1280, y: 410, width: 80, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "sched-c1-2", type: "text", text: "MAR  Salsa cubana", x: 820, y: 450, width: 480, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-c1-2h", type: "text", text: "20:00", x: 1280, y: 450, width: 80, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "sched-c2-1", type: "text", text: "MIÉ  Bachata intermedio", x: 1400, y: 410, width: 480, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-c2-1h", type: "text", text: "19:30", x: 1840, y: 410, width: 80, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "sched-c2-2", type: "text", text: "JUE  Estilo en pareja", x: 1400, y: 450, width: 480, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#1f1010", fontWeight: "600", textAlign: "left" },
                { id: "sched-c2-2h", type: "text", text: "21:00", x: 1840, y: 450, width: 80, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(31,16,16,0.6)", fontWeight: "500", textAlign: "right" },
                { id: "price-bg", type: "shape", shape: "rect", x: 820, y: 530, width: 540, height: 150, fill: "#7c1d2c", radius: 6, selectable: false },
                { id: "price-label", type: "text", text: "BONO MENSUAL", x: 820, y: 555, width: 540, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.65)", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "price-value", type: "text", text: "60€", x: 820, y: 580, width: 540, fontSize: 70, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "price-extra", type: "text", text: "4 clases / mes  ·  suelta 18€", x: 820, y: 655, width: 540, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "500", textAlign: "center", charSpacing: 150 },
                { id: "addr", type: "text", text: "Estudio Jean · C/ Goya 22 · Madrid", x: 1400, y: 540, width: 480, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "left", fontStyle: "italic" },
                { id: "tel", type: "text", text: "+34 600 222 333", x: 1400, y: 580, width: 480, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#1f1010", textAlign: "left", fontStyle: "italic" },
                { id: "web", type: "text", text: "estudiojean.es", x: 1400, y: 620, width: 480, fontSize: 17, fontFamily: "Playfair Display, serif", color: "#7c1d2c", textAlign: "left", fontStyle: "italic" },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 37 — Taller Flamenco Ana María — negro/rojo flamenco editorial (NUEVO)
//      Tipografia serifa pasional, lineas rojas tipo abanico, foto con halo
//      Look poster flamenco moderno premium
// ─────────────────────────────────────────────────────────────────────
    {
        id: 37,
        title: "Taller Flamenco",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png",
        premium: true,
        audience: ["academias", "instituciones"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO negro profundo
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0102", selectable: false },
                // Halo rojo central detras del titulo
                { id: "halo-red-1", type: "shape", shape: "circle", x: 100, y: 0, width: 900, height: 900, fill: "rgba(190,18,18,0.40)", opacity: 0.55, selectable: false },
                { id: "halo-red-2", type: "shape", shape: "circle", x: 300, y: 350, width: 600, height: 600, fill: "rgba(220,38,38,0.55)", opacity: 0.65, selectable: false },

                // LINEAS ROJAS RADIALES tipo abanico flamenco (varias rect rotadas desde centro inferior)
                { id: "ray-1", type: "shape", shape: "rect", x: 540, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.45)", opacity: 0.8, angle: -42, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-2", type: "shape", shape: "rect", x: 540, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.45)", opacity: 0.8, angle: -28, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-3", type: "shape", shape: "rect", x: 540, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.55)", opacity: 0.85, angle: -14, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-4", type: "shape", shape: "rect", x: 540, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.65)", opacity: 0.9, angle: 0, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-5", type: "shape", shape: "rect", x: 540, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.55)", opacity: 0.85, angle: 14, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-6", type: "shape", shape: "rect", x: 540, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.45)", opacity: 0.8, angle: 28, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-7", type: "shape", shape: "rect", x: 540, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.45)", opacity: 0.8, angle: 42, originX: "center", originY: "bottom", selectable: false },

                // CABECERA tipo programa teatro
                { id: "header-line-t", type: "shape", shape: "rect", x: 80, y: 65, width: 920, height: 1, fill: "rgba(255,255,255,0.4)", selectable: false },
                { id: "header-line-b", type: "shape", shape: "rect", x: 80, y: 115, width: 920, height: 1, fill: "rgba(255,255,255,0.4)", selectable: false },
                { id: "header-text", type: "text", text: "ESTUDIO  ·  ANA  MARÍA  ·  TEMPORADA 2026", x: 0, y: 80, width: 1080, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#ffffff", fontWeight: "500", textAlign: "center", charSpacing: 500 },

                // ANA MARIA con halo intenso rojo
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 540, y: 160, scaleX: 1.55, scaleY: 1.55, originX: "center", originY: "top", shadow: { color: "rgba(220,38,38,0.85)", blur: 75, offsetX: 0, offsetY: 0 } },

                // BLOQUE titulo abajo
                // Overlay negro denso
                { id: "overlay-bottom", type: "shape", shape: "rect", x: 0, y: 880, width: 1080, height: 470, fill: "rgba(10,1,2,0.92)", selectable: false },
                // Linea roja arriba del bloque
                { id: "block-top-line", type: "shape", shape: "rect", x: 0, y: 880, width: 1080, height: 3, fill: "#dc2626", selectable: false },

                // SUPRA
                { id: "supra", type: "text", text: "T A L L E R   M O N O G R Á F I C O", x: 0, y: 905, width: 1080, fontSize: 15, fontFamily: "Cormorant Garamond, serif", color: "#dc2626", fontWeight: "700", textAlign: "center", charSpacing: 700 },

                // TITULO grande Playfair italica
                { id: "title-1", type: "text", text: "Flamenco", x: 0, y: 940, width: 1080, fontSize: 100, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "& Compás", x: 0, y: 1050, width: 1080, fontSize: 70, fontFamily: "Playfair Display, serif", color: "#dc2626", textAlign: "center", fontStyle: "italic" },

                // Nombre profe
                { id: "by-label", type: "text", text: "I M P A R T E", x: 0, y: 1145, width: 1080, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.55)", fontWeight: "600", textAlign: "center", charSpacing: 600 },
                { id: "profe-name", type: "text", text: "Ana María Rodríguez", x: 0, y: 1170, width: 1080, fontSize: 30, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },

                // Divider
                { id: "div", type: "shape", shape: "rect", x: 420, y: 1215, width: 240, height: 1, fill: "#dc2626", selectable: false },

                // INFO pie 3 columnas
                { id: "i-1-l", type: "text", text: "FECHA", x: 60, y: 1235, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(220,38,38,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "i-1-v", type: "text", text: "DOM 18 OCT", x: 60, y: 1255, width: 320, fontSize: 18, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center" },
                { id: "i-1-x", type: "text", text: "11:00 — 14:00", x: 60, y: 1283, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.7)", fontStyle: "italic", textAlign: "center" },

                { id: "i-2-l", type: "text", text: "PRECIO", x: 380, y: 1235, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(220,38,38,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "i-2-v", type: "text", text: "50€", x: 380, y: 1252, width: 320, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "i-2-x", type: "text", text: "Plazas limitadas a 15", x: 380, y: 1283, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.7)", fontStyle: "italic", textAlign: "center" },

                { id: "i-3-l", type: "text", text: "LUGAR", x: 700, y: 1235, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(220,38,38,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "i-3-v", type: "text", text: "Sala Carmen", x: 700, y: 1253, width: 320, fontSize: 18, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center" },
                { id: "i-3-x", type: "text", text: "C/ La Latina · Madrid", x: 700, y: 1283, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.7)", fontStyle: "italic", textAlign: "center" },

                // CTA pie
                { id: "cta", type: "text", text: "RESERVA EN  ·  estudio.anamaria@flamenco.es", x: 0, y: 1320, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#dc2626", fontStyle: "italic", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── SQUARE 1080x1080 ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#0a0102", selectable: false },
                { id: "halo-red", type: "shape", shape: "circle", x: 200, y: 100, width: 700, height: 700, fill: "rgba(220,38,38,0.55)", opacity: 0.65, selectable: false },
                { id: "ray-1", type: "shape", shape: "rect", x: 540, y: 600, width: 4, height: 700, fill: "rgba(220,38,38,0.55)", opacity: 0.85, angle: -28, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-2", type: "shape", shape: "rect", x: 540, y: 600, width: 4, height: 700, fill: "rgba(220,38,38,0.65)", opacity: 0.9, angle: 0, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-3", type: "shape", shape: "rect", x: 540, y: 600, width: 4, height: 700, fill: "rgba(220,38,38,0.55)", opacity: 0.85, angle: 28, originX: "center", originY: "bottom", selectable: false },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 540, y: 80, scaleX: 1.15, scaleY: 1.15, originX: "center", originY: "top", shadow: { color: "rgba(220,38,38,0.85)", blur: 60, offsetX: 0, offsetY: 0 } },
                { id: "overlay", type: "shape", shape: "rect", x: 0, y: 680, width: 1080, height: 400, fill: "rgba(10,1,2,0.92)", selectable: false },
                { id: "block-top-line", type: "shape", shape: "rect", x: 0, y: 680, width: 1080, height: 3, fill: "#dc2626", selectable: false },
                { id: "supra", type: "text", text: "T A L L E R   M O N O G R Á F I C O", x: 0, y: 700, width: 1080, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#dc2626", fontWeight: "700", textAlign: "center", charSpacing: 600 },
                { id: "title-1", type: "text", text: "Flamenco", x: 0, y: 728, width: 1080, fontSize: 82, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "& Compás", x: 0, y: 820, width: 1080, fontSize: 56, fontFamily: "Playfair Display, serif", color: "#dc2626", textAlign: "center", fontStyle: "italic" },
                { id: "by", type: "text", text: "Imparte  ·  Ana María Rodríguez", x: 0, y: 905, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.85)", textAlign: "center", fontStyle: "italic" },
                { id: "div", type: "shape", shape: "rect", x: 460, y: 945, width: 160, height: 1, fill: "#dc2626", selectable: false },
                { id: "info", type: "text", text: "DOM 18 OCT  ·  11:00 — 14:00  ·  50€", x: 0, y: 965, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "venue", type: "text", text: "SALA CARMEN  ·  LA LATINA  ·  MADRID", x: 0, y: 1005, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(220,38,38,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "cta", type: "text", text: "estudio.anamaria@flamenco.es", x: 0, y: 1040, width: 1080, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "#dc2626", fontStyle: "italic", textAlign: "center", charSpacing: 200 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0102", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: 100, y: 100, width: 900, height: 900, fill: "rgba(190,18,18,0.40)", opacity: 0.55, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 200, y: 500, width: 700, height: 700, fill: "rgba(220,38,38,0.55)", opacity: 0.65, selectable: false },
                { id: "ray-1", type: "shape", shape: "rect", x: 540, y: 1200, width: 4, height: 1400, fill: "rgba(220,38,38,0.45)", opacity: 0.8, angle: -42, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-2", type: "shape", shape: "rect", x: 540, y: 1200, width: 4, height: 1400, fill: "rgba(220,38,38,0.55)", opacity: 0.85, angle: -14, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-3", type: "shape", shape: "rect", x: 540, y: 1200, width: 4, height: 1400, fill: "rgba(220,38,38,0.65)", opacity: 0.9, angle: 0, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-4", type: "shape", shape: "rect", x: 540, y: 1200, width: 4, height: 1400, fill: "rgba(220,38,38,0.55)", opacity: 0.85, angle: 14, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-5", type: "shape", shape: "rect", x: 540, y: 1200, width: 4, height: 1400, fill: "rgba(220,38,38,0.45)", opacity: 0.8, angle: 42, originX: "center", originY: "bottom", selectable: false },
                { id: "header", type: "text", text: "ESTUDIO  ·  ANA  MARÍA  ·  2026", x: 0, y: 130, width: 1080, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#ffffff", fontWeight: "500", textAlign: "center", charSpacing: 500 },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 540, y: 220, scaleX: 1.85, scaleY: 1.85, originX: "center", originY: "top", shadow: { color: "rgba(220,38,38,0.85)", blur: 85, offsetX: 0, offsetY: 0 } },
                { id: "overlay", type: "shape", shape: "rect", x: 0, y: 1300, width: 1080, height: 620, fill: "rgba(10,1,2,0.92)", selectable: false },
                { id: "block-top-line", type: "shape", shape: "rect", x: 0, y: 1300, width: 1080, height: 3, fill: "#dc2626", selectable: false },
                { id: "supra", type: "text", text: "T A L L E R   M O N O G R Á F I C O", x: 0, y: 1330, width: 1080, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "#dc2626", fontWeight: "700", textAlign: "center", charSpacing: 700 },
                { id: "title-1", type: "text", text: "Flamenco", x: 0, y: 1370, width: 1080, fontSize: 120, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "& Compás", x: 0, y: 1500, width: 1080, fontSize: 86, fontFamily: "Playfair Display, serif", color: "#dc2626", textAlign: "center", fontStyle: "italic" },
                { id: "by-label", type: "text", text: "I M P A R T E", x: 0, y: 1620, width: 1080, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.55)", fontWeight: "600", textAlign: "center", charSpacing: 600 },
                { id: "profe-name", type: "text", text: "Ana María Rodríguez", x: 0, y: 1645, width: 1080, fontSize: 36, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "div", type: "shape", shape: "rect", x: 420, y: 1710, width: 240, height: 1, fill: "#dc2626", selectable: false },
                { id: "info-date", type: "text", text: "DOM 18 OCT  ·  11:00 — 14:00", x: 0, y: 1735, width: 1080, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 150 },
                { id: "info-price", type: "text", text: "50€  ·  Plazas limitadas a 15", x: 0, y: 1775, width: 1080, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.7)", fontStyle: "italic", textAlign: "center" },
                { id: "venue", type: "text", text: "SALA CARMEN  ·  LA LATINA  ·  MADRID", x: 0, y: 1820, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(220,38,38,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "cta", type: "text", text: "RESERVA  ·  estudio.anamaria@flamenco.es", x: 0, y: 1855, width: 1080, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "#dc2626", fontStyle: "italic", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#0a0102", selectable: false },
                { id: "halo-red", type: "shape", shape: "circle", x: 900, y: 0, width: 1000, height: 1000, fill: "rgba(220,38,38,0.55)", opacity: 0.6, selectable: false },
                { id: "ray-1", type: "shape", shape: "rect", x: 1440, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.55)", opacity: 0.85, angle: -28, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-2", type: "shape", shape: "rect", x: 1440, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.65)", opacity: 0.9, angle: 0, originX: "center", originY: "bottom", selectable: false },
                { id: "ray-3", type: "shape", shape: "rect", x: 1440, y: 800, width: 4, height: 1000, fill: "rgba(220,38,38,0.55)", opacity: 0.85, angle: 28, originX: "center", originY: "bottom", selectable: false },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 1440, y: 60, scaleX: 1.1, scaleY: 1.1, originX: "center", originY: "top", shadow: { color: "rgba(220,38,38,0.85)", blur: 60, offsetX: 0, offsetY: 0 } },
                { id: "supra", type: "text", text: "TALLER MONOGRÁFICO  ·  EDICIÓN OTOÑO", x: 80, y: 130, width: 800, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#dc2626", fontWeight: "700", textAlign: "left", charSpacing: 500 },
                { id: "title-1", type: "text", text: "Flamenco", x: 80, y: 170, width: 900, fontSize: 130, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "& Compás", x: 80, y: 310, width: 900, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#dc2626", textAlign: "left", fontStyle: "italic" },
                { id: "by-label", type: "text", text: "IMPARTE", x: 80, y: 430, width: 800, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.55)", fontWeight: "700", textAlign: "left", charSpacing: 600 },
                { id: "profe-name", type: "text", text: "Ana María Rodríguez", x: 80, y: 455, width: 800, fontSize: 32, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left", fontStyle: "italic" },
                { id: "div", type: "shape", shape: "rect", x: 80, y: 525, width: 160, height: 2, fill: "#dc2626", selectable: false },
                { id: "info-date", type: "text", text: "DOMINGO 18 OCTUBRE  ·  11:00 — 14:00", x: 80, y: 555, width: 1100, fontSize: 24, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "info-price", type: "text", text: "50€  ·  Plazas limitadas a 15", x: 80, y: 600, width: 900, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(255,255,255,0.7)", fontStyle: "italic", textAlign: "left" },
                { id: "venue-label", type: "text", text: "LUGAR", x: 80, y: 660, width: 800, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(220,38,38,0.85)", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "venue-value", type: "text", text: "Sala Carmen  ·  La Latina  ·  Madrid", x: 80, y: 685, width: 1100, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left", fontStyle: "italic" },
                { id: "cta-line", type: "shape", shape: "rect", x: 80, y: 765, width: 200, height: 1, fill: "#dc2626", selectable: false },
                { id: "cta", type: "text", text: "RESERVA  ·  estudio.anamaria@flamenco.es", x: 80, y: 785, width: 1100, fontSize: 17, fontFamily: "Cormorant Garamond, serif", color: "#dc2626", fontStyle: "italic", textAlign: "left", charSpacing: 200 },
                { id: "phone", type: "text", text: "+34 600 777 888", x: 80, y: 825, width: 1100, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "left", charSpacing: 200 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 38 — Ciclo 3 Maestros Bachata — color block 3 columnas (NUEVO LAYOUT)
//      3 bloques verticales color con un profe en cada uno
//      Cada bloque su info propia: dia + estilo
// ─────────────────────────────────────────────────────────────────────
    {
        id: 38,
        title: "Ciclo 3 Maestros",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
        premium: true,
        audience: ["academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO base negro
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a0a", selectable: false },

                // CABECERA con titulo grande arriba
                { id: "header-bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 270, fill: "#fbbf24", selectable: false },
                { id: "header-supra", type: "text", text: "CICLO  ·  OTOÑO  ·  2026", x: 0, y: 55, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "header-t1", type: "text", text: "TRES", x: 0, y: 85, width: 1080, fontSize: 120, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 80 },
                { id: "header-t2", type: "text", text: "MAESTROS", x: 0, y: 200, width: 1080, fontSize: 42, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 200 },

                // ─── COLUMNA 1 (rojo) ───
                { id: "col-1-bg", type: "shape", shape: "rect", x: 0, y: 270, width: 360, height: 870, fill: "#b91c1c", selectable: false },
                { id: "profe-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 180, y: 300, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "top" },
                { id: "c1-num", type: "text", text: "01", x: 0, y: 730, width: 360, fontSize: 90, fontFamily: "Anton, Impact, sans-serif", color: "rgba(255,255,255,0.25)", textAlign: "center" },
                { id: "c1-name", type: "text", text: "DAMIÁN", x: 0, y: 830, width: 360, fontSize: 34, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c1-style", type: "text", text: "BACHATA · MODERNA", x: 0, y: 880, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "c1-line", type: "shape", shape: "rect", x: 130, y: 920, width: 100, height: 2, fill: "#fbbf24", selectable: false },
                { id: "c1-day", type: "text", text: "VIE", x: 0, y: 945, width: 360, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "c1-time", type: "text", text: "19:00 — 21:00", x: 0, y: 1015, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 200 },
                { id: "c1-price-bg", type: "shape", shape: "rect", x: 90, y: 1060, width: 180, height: 50, fill: "#fbbf24", radius: 25, selectable: false },
                { id: "c1-price", type: "text", text: "30€ / CLASE", x: 0, y: 1077, width: 360, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 150 },

                // ─── COLUMNA 2 (rosa) ───
                { id: "col-2-bg", type: "shape", shape: "rect", x: 360, y: 270, width: 360, height: 870, fill: "#be185d", selectable: false },
                { id: "profe-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 540, y: 300, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "top" },
                { id: "c2-num", type: "text", text: "02", x: 360, y: 730, width: 360, fontSize: 90, fontFamily: "Anton, Impact, sans-serif", color: "rgba(255,255,255,0.25)", textAlign: "center" },
                { id: "c2-name", type: "text", text: "NIA", x: 360, y: 830, width: 360, fontSize: 34, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c2-style", type: "text", text: "BACHATA · LADY STYLE", x: 360, y: 880, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "c2-line", type: "shape", shape: "rect", x: 490, y: 920, width: 100, height: 2, fill: "#fbbf24", selectable: false },
                { id: "c2-day", type: "text", text: "SÁB", x: 360, y: 945, width: 360, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "c2-time", type: "text", text: "11:00 — 13:00", x: 360, y: 1015, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 200 },
                { id: "c2-price-bg", type: "shape", shape: "rect", x: 450, y: 1060, width: 180, height: 50, fill: "#fbbf24", radius: 25, selectable: false },
                { id: "c2-price", type: "text", text: "30€ / CLASE", x: 360, y: 1077, width: 360, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 150 },

                // ─── COLUMNA 3 (azul) ───
                { id: "col-3-bg", type: "shape", shape: "rect", x: 720, y: 270, width: 360, height: 870, fill: "#1d4ed8", selectable: false },
                { id: "profe-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 900, y: 300, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "top" },
                { id: "c3-num", type: "text", text: "03", x: 720, y: 730, width: 360, fontSize: 90, fontFamily: "Anton, Impact, sans-serif", color: "rgba(255,255,255,0.25)", textAlign: "center" },
                { id: "c3-name", type: "text", text: "MALIK", x: 720, y: 830, width: 360, fontSize: 34, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c3-style", type: "text", text: "BACHATA · URBAN MIX", x: 720, y: 880, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "c3-line", type: "shape", shape: "rect", x: 850, y: 920, width: 100, height: 2, fill: "#fbbf24", selectable: false },
                { id: "c3-day", type: "text", text: "DOM", x: 720, y: 945, width: 360, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "c3-time", type: "text", text: "12:00 — 14:00", x: 720, y: 1015, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 200 },
                { id: "c3-price-bg", type: "shape", shape: "rect", x: 810, y: 1060, width: 180, height: 50, fill: "#fbbf24", radius: 25, selectable: false },
                { id: "c3-price", type: "text", text: "30€ / CLASE", x: 720, y: 1077, width: 360, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 150 },

                // BANDA INFERIOR amarilla con BONO completo
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 1140, width: 1080, height: 210, fill: "#fbbf24", selectable: false },
                { id: "footer-label", type: "text", text: "BONO CICLO COMPLETO", x: 0, y: 1160, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "footer-price", type: "text", text: "80€", x: 0, y: 1180, width: 1080, fontSize: 88, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "footer-detail", type: "text", text: "3 CLASES  ·  3 ESTILOS  ·  3 MAESTROS  ·  ESCUELA DEL SOL  ·  MADRID", x: 0, y: 1290, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 300 },
                { id: "footer-cta", type: "text", text: "RESERVA EN  ·  escueladelsol.es / ciclo", x: 0, y: 1320, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "600", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── SQUARE 1080x1080 — 3 columnas color comprimidas ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#0a0a0a", selectable: false },
                { id: "header-bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 180, fill: "#fbbf24", selectable: false },
                { id: "header-supra", type: "text", text: "CICLO · OTOÑO 2026", x: 0, y: 35, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "header-t1", type: "text", text: "3 MAESTROS", x: 0, y: 60, width: 1080, fontSize: 78, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 80 },
                // Columna 1 rojo
                { id: "col-1-bg", type: "shape", shape: "rect", x: 0, y: 180, width: 360, height: 700, fill: "#b91c1c", selectable: false },
                { id: "profe-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 180, y: 210, scaleX: 0.5, scaleY: 0.5, originX: "center", originY: "top" },
                { id: "c1-name", type: "text", text: "DAMIÁN", x: 0, y: 660, width: 360, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c1-day", type: "text", text: "VIE · 19H", x: 0, y: 700, width: 360, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "c1-style", type: "text", text: "BACHATA MODERNA", x: 0, y: 740, width: 360, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 200 },
                // Columna 2 rosa
                { id: "col-2-bg", type: "shape", shape: "rect", x: 360, y: 180, width: 360, height: 700, fill: "#be185d", selectable: false },
                { id: "profe-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 540, y: 210, scaleX: 0.5, scaleY: 0.5, originX: "center", originY: "top" },
                { id: "c2-name", type: "text", text: "NIA", x: 360, y: 660, width: 360, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c2-day", type: "text", text: "SÁB · 11H", x: 360, y: 700, width: 360, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "c2-style", type: "text", text: "BACHATA LADY STYLE", x: 360, y: 740, width: 360, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 200 },
                // Columna 3 azul
                { id: "col-3-bg", type: "shape", shape: "rect", x: 720, y: 180, width: 360, height: 700, fill: "#1d4ed8", selectable: false },
                { id: "profe-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 900, y: 210, scaleX: 0.5, scaleY: 0.5, originX: "center", originY: "top" },
                { id: "c3-name", type: "text", text: "MALIK", x: 720, y: 660, width: 360, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c3-day", type: "text", text: "DOM · 12H", x: 720, y: 700, width: 360, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "c3-style", type: "text", text: "BACHATA URBAN", x: 720, y: 740, width: 360, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 200 },
                // Footer amarillo
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 880, width: 1080, height: 200, fill: "#fbbf24", selectable: false },
                { id: "footer-label", type: "text", text: "BONO CICLO COMPLETO · 3 CLASES", x: 0, y: 900, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "footer-price", type: "text", text: "80€", x: 0, y: 925, width: 1080, fontSize: 88, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "footer-detail", type: "text", text: "ESCUELA DEL SOL  ·  MADRID  ·  escueladelsol.es/ciclo", x: 0, y: 1040, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── STORY 1080x1920 — 3 columnas estiradas verticalmente ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0a0a", selectable: false },
                { id: "header-bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 360, fill: "#fbbf24", selectable: false },
                { id: "header-supra", type: "text", text: "CICLO  ·  OTOÑO  ·  2026", x: 0, y: 130, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "header-t1", type: "text", text: "TRES", x: 0, y: 165, width: 1080, fontSize: 140, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 80 },
                { id: "header-t2", type: "text", text: "MAESTROS", x: 0, y: 300, width: 1080, fontSize: 46, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 200 },
                { id: "col-1-bg", type: "shape", shape: "rect", x: 0, y: 360, width: 360, height: 1200, fill: "#b91c1c", selectable: false },
                { id: "profe-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 180, y: 410, scaleX: 0.62, scaleY: 0.62, originX: "center", originY: "top" },
                { id: "c1-num", type: "text", text: "01", x: 0, y: 940, width: 360, fontSize: 100, fontFamily: "Anton, Impact, sans-serif", color: "rgba(255,255,255,0.25)", textAlign: "center" },
                { id: "c1-name", type: "text", text: "DAMIÁN", x: 0, y: 1060, width: 360, fontSize: 38, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c1-style", type: "text", text: "BACHATA MODERNA", x: 0, y: 1115, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "c1-day", type: "text", text: "VIE", x: 0, y: 1175, width: 360, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "c1-time", type: "text", text: "19:00 — 21:00", x: 0, y: 1240, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 150 },
                { id: "c1-price-bg", type: "shape", shape: "rect", x: 90, y: 1290, width: 180, height: 50, fill: "#fbbf24", radius: 25, selectable: false },
                { id: "c1-price", type: "text", text: "30€ / CLASE", x: 0, y: 1307, width: 360, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 150 },
                { id: "col-2-bg", type: "shape", shape: "rect", x: 360, y: 360, width: 360, height: 1200, fill: "#be185d", selectable: false },
                { id: "profe-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 540, y: 410, scaleX: 0.62, scaleY: 0.62, originX: "center", originY: "top" },
                { id: "c2-num", type: "text", text: "02", x: 360, y: 940, width: 360, fontSize: 100, fontFamily: "Anton, Impact, sans-serif", color: "rgba(255,255,255,0.25)", textAlign: "center" },
                { id: "c2-name", type: "text", text: "NIA", x: 360, y: 1060, width: 360, fontSize: 38, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c2-style", type: "text", text: "BACHATA LADY STYLE", x: 360, y: 1115, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "c2-day", type: "text", text: "SÁB", x: 360, y: 1175, width: 360, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "c2-time", type: "text", text: "11:00 — 13:00", x: 360, y: 1240, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 150 },
                { id: "c2-price-bg", type: "shape", shape: "rect", x: 450, y: 1290, width: 180, height: 50, fill: "#fbbf24", radius: 25, selectable: false },
                { id: "c2-price", type: "text", text: "30€ / CLASE", x: 360, y: 1307, width: 360, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 150 },
                { id: "col-3-bg", type: "shape", shape: "rect", x: 720, y: 360, width: 360, height: 1200, fill: "#1d4ed8", selectable: false },
                { id: "profe-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 900, y: 410, scaleX: 0.62, scaleY: 0.62, originX: "center", originY: "top" },
                { id: "c3-num", type: "text", text: "03", x: 720, y: 940, width: 360, fontSize: 100, fontFamily: "Anton, Impact, sans-serif", color: "rgba(255,255,255,0.25)", textAlign: "center" },
                { id: "c3-name", type: "text", text: "MALIK", x: 720, y: 1060, width: 360, fontSize: 38, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c3-style", type: "text", text: "BACHATA URBAN", x: 720, y: 1115, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "c3-day", type: "text", text: "DOM", x: 720, y: 1175, width: 360, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "c3-time", type: "text", text: "12:00 — 14:00", x: 720, y: 1240, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 150 },
                { id: "c3-price-bg", type: "shape", shape: "rect", x: 810, y: 1290, width: 180, height: 50, fill: "#fbbf24", radius: 25, selectable: false },
                { id: "c3-price", type: "text", text: "30€ / CLASE", x: 720, y: 1307, width: 360, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 150 },
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 1560, width: 1080, height: 360, fill: "#fbbf24", selectable: false },
                { id: "footer-label", type: "text", text: "BONO CICLO COMPLETO", x: 0, y: 1610, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "footer-price", type: "text", text: "80€", x: 0, y: 1640, width: 1080, fontSize: 120, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "footer-detail", type: "text", text: "3 CLASES  ·  3 ESTILOS  ·  3 MAESTROS", x: 0, y: 1790, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 300 },
                { id: "footer-where", type: "text", text: "ESCUELA DEL SOL  ·  MADRID", x: 0, y: 1825, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 300 },
                { id: "footer-cta", type: "text", text: "RESERVA EN  ·  escueladelsol.es / ciclo", x: 0, y: 1865, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "600", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── FB-COVER 1920x1005 — 3 columnas horizontales ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#0a0a0a", selectable: false },
                { id: "header-bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 160, fill: "#fbbf24", selectable: false },
                { id: "header-supra", type: "text", text: "CICLO · OTOÑO 2026", x: 0, y: 35, width: 1920, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "header-t1", type: "text", text: "3 MAESTROS · 3 ESTILOS · 3 CLASES", x: 0, y: 65, width: 1920, fontSize: 64, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 80 },
                { id: "col-1-bg", type: "shape", shape: "rect", x: 80, y: 200, width: 540, height: 720, fill: "#b91c1c", selectable: false },
                { id: "profe-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 350, y: 230, scaleX: 0.7, scaleY: 0.7, originX: "center", originY: "top" },
                { id: "c1-name", type: "text", text: "DAMIÁN", x: 80, y: 760, width: 540, fontSize: 36, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c1-style", type: "text", text: "BACHATA MODERNA", x: 80, y: 805, width: 540, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "c1-day", type: "text", text: "VIE  ·  19:00 — 21:00", x: 80, y: 845, width: 540, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 150 },
                { id: "c1-price", type: "text", text: "30€ / CLASE", x: 80, y: 880, width: 540, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "col-2-bg", type: "shape", shape: "rect", x: 690, y: 200, width: 540, height: 720, fill: "#be185d", selectable: false },
                { id: "profe-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 960, y: 230, scaleX: 0.7, scaleY: 0.7, originX: "center", originY: "top" },
                { id: "c2-name", type: "text", text: "NIA", x: 690, y: 760, width: 540, fontSize: 36, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c2-style", type: "text", text: "BACHATA LADY STYLE", x: 690, y: 805, width: 540, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "c2-day", type: "text", text: "SÁB  ·  11:00 — 13:00", x: 690, y: 845, width: 540, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 150 },
                { id: "c2-price", type: "text", text: "30€ / CLASE", x: 690, y: 880, width: 540, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "col-3-bg", type: "shape", shape: "rect", x: 1300, y: 200, width: 540, height: 720, fill: "#1d4ed8", selectable: false },
                { id: "profe-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 1570, y: 230, scaleX: 0.7, scaleY: 0.7, originX: "center", originY: "top" },
                { id: "c3-name", type: "text", text: "MALIK", x: 1300, y: 760, width: 540, fontSize: 36, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "c3-style", type: "text", text: "BACHATA URBAN", x: 1300, y: 805, width: 540, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "c3-day", type: "text", text: "DOM  ·  12:00 — 14:00", x: 1300, y: 845, width: 540, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 150 },
                { id: "c3-price", type: "text", text: "30€ / CLASE", x: 1300, y: 880, width: 540, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "footer-text", type: "text", text: "BONO COMPLETO  80€  ·  ESCUELA DEL SOL · MADRID  ·  escueladelsol.es / ciclo", x: 0, y: 960, width: 1920, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 350 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 39 — Bachata Principiantes — friendly verde menta (NUEVO LAYOUT)
//      Pareja con look amigable, fondo pastel, mensaje invitador
//      Tipografia chunky pero friendly, decoraciones simpaticas
// ─────────────────────────────────────────────────────────────────────
    {
        id: 39,
        title: "Bachata Principiantes",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png",
        premium: false,
        audience: ["academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO verde menta pastel
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#a7f3d0", selectable: false },

                // Burbujas decorativas grandes (friendly)
                { id: "bubble-1", type: "shape", shape: "circle", x: -100, y: -100, width: 350, height: 350, fill: "#fbbf24", opacity: 0.85, selectable: false },
                { id: "bubble-2", type: "shape", shape: "circle", x: 850, y: 50, width: 280, height: 280, fill: "#f472b6", opacity: 0.85, selectable: false },
                { id: "bubble-3", type: "shape", shape: "circle", x: 900, y: 1100, width: 220, height: 220, fill: "#6366f1", opacity: 0.85, selectable: false },
                { id: "bubble-4", type: "shape", shape: "circle", x: -50, y: 1050, width: 200, height: 200, fill: "#f59e0b", opacity: 0.85, selectable: false },
                // Estrellas/puntos pequeños decorativos (circulos pequenos sueltos)
                { id: "dot-1", type: "shape", shape: "circle", x: 280, y: 110, width: 22, height: 22, fill: "#7c2d12", selectable: false },
                { id: "dot-2", type: "shape", shape: "circle", x: 760, y: 380, width: 18, height: 18, fill: "#7c2d12", selectable: false },
                { id: "dot-3", type: "shape", shape: "circle", x: 220, y: 660, width: 18, height: 18, fill: "#be185d", selectable: false },
                { id: "dot-4", type: "shape", shape: "circle", x: 820, y: 720, width: 22, height: 22, fill: "#7c2d12", selectable: false },
                { id: "dot-5", type: "shape", shape: "circle", x: 380, y: 1180, width: 16, height: 16, fill: "#be185d", selectable: false },

                // CHIP arriba "PRIMERA CLASE GRATIS"
                { id: "chip-bg", type: "shape", shape: "rect", x: 290, y: 70, width: 500, height: 60, fill: "#0a0a0a", radius: 30, selectable: false },
                { id: "chip-label", type: "text", text: "★ PRIMERA CLASE GRATIS ★", x: 0, y: 88, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 250 },

                // TITULO megabold curvas friendly (Anton 2 lineas con sombra dura)
                { id: "title-shadow", type: "text", text: "BACHATA", x: 10, y: 200, width: 1080, fontSize: 150, fontFamily: "Anton, Impact, sans-serif", color: "#7c2d12", textAlign: "center", charSpacing: -5 },
                { id: "title-1", type: "text", text: "BACHATA", x: 0, y: 190, width: 1080, fontSize: 150, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: -5 },

                { id: "title-2-bg", type: "shape", shape: "rect", x: 280, y: 340, width: 520, height: 70, fill: "#be185d", radius: 35, selectable: false, angle: -3, originX: "left", originY: "top" },
                { id: "title-2", type: "text", text: "para principiantes", x: 0, y: 358, width: 1080, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100, angle: -3 },

                // FOTO PAREJA centrada con halo blanco friendly
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 540, y: 430, scaleX: 0.75, scaleY: 0.75, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 45, offsetX: 0, offsetY: 0 } },

                // ─── BLOQUE INFO inferior ───
                // Caja blanca grande con texto friendly
                { id: "info-bg", type: "shape", shape: "rect", x: 60, y: 940, width: 960, height: 350, fill: "#ffffff", radius: 22, stroke: "#0a0a0a", strokeWidth: 4, selectable: false },

                // Mensaje amistoso
                { id: "msg-1", type: "text", text: "¿NUNCA BAILASTE?", x: 60, y: 970, width: 960, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#be185d", textAlign: "center", charSpacing: 200 },
                { id: "msg-2", type: "text", text: "Empieza aquí.", x: 60, y: 1005, width: 960, fontSize: 48, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },

                // Divider con corazon
                { id: "msg-dot-l", type: "shape", shape: "circle", x: 380, y: 1075, width: 12, height: 12, fill: "#be185d", selectable: false },
                { id: "msg-line", type: "shape", shape: "rect", x: 400, y: 1078, width: 280, height: 4, fill: "#be185d", selectable: false },
                { id: "msg-dot-r", type: "shape", shape: "circle", x: 680, y: 1075, width: 12, height: 12, fill: "#be185d", selectable: false },

                // INFO con dia hora precio
                { id: "info-day", type: "text", text: "MARTES  ·  20:00 H", x: 60, y: 1110, width: 960, fontSize: 38, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 100 },
                { id: "info-where", type: "text", text: "Estudio Jean  ·  C/ Goya 22  ·  Madrid", x: 60, y: 1170, width: 960, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.65)", fontWeight: "600", textAlign: "center" },

                // Precio destacado con tag
                { id: "tag-bg", type: "shape", shape: "rect", x: 320, y: 1210, width: 440, height: 60, fill: "#fbbf24", radius: 30, selectable: false },
                { id: "tag-text", type: "text", text: "DESPUÉS  ·  15€ / CLASE", x: 0, y: 1228, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 200 },

                // CTA pie
                { id: "cta", type: "text", text: "RESERVA WHATSAPP  ·  +34 600 222 333", x: 0, y: 1310, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── SQUARE 1080x1080 ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#a7f3d0", selectable: false },
                { id: "bubble-1", type: "shape", shape: "circle", x: -100, y: -100, width: 320, height: 320, fill: "#fbbf24", opacity: 0.85, selectable: false },
                { id: "bubble-2", type: "shape", shape: "circle", x: 880, y: 0, width: 260, height: 260, fill: "#f472b6", opacity: 0.85, selectable: false },
                { id: "bubble-3", type: "shape", shape: "circle", x: -50, y: 800, width: 200, height: 200, fill: "#f59e0b", opacity: 0.85, selectable: false },
                { id: "bubble-4", type: "shape", shape: "circle", x: 920, y: 850, width: 200, height: 200, fill: "#6366f1", opacity: 0.85, selectable: false },
                { id: "chip-bg", type: "shape", shape: "rect", x: 290, y: 50, width: 500, height: 54, fill: "#0a0a0a", radius: 27, selectable: false },
                { id: "chip-label", type: "text", text: "★ PRIMERA CLASE GRATIS ★", x: 0, y: 66, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 250 },
                { id: "title-shadow", type: "text", text: "BACHATA", x: 8, y: 145, width: 1080, fontSize: 120, fontFamily: "Anton, Impact, sans-serif", color: "#7c2d12", textAlign: "center", charSpacing: -5 },
                { id: "title-1", type: "text", text: "BACHATA", x: 0, y: 138, width: 1080, fontSize: 120, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: -5 },
                { id: "title-2-bg", type: "shape", shape: "rect", x: 290, y: 270, width: 500, height: 56, fill: "#be185d", radius: 28, selectable: false, angle: -3, originX: "left", originY: "top" },
                { id: "title-2", type: "text", text: "para principiantes", x: 0, y: 284, width: 1080, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100, angle: -3 },
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 540, y: 360, scaleX: 0.6, scaleY: 0.6, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "info-bg", type: "shape", shape: "rect", x: 60, y: 770, width: 960, height: 270, fill: "#ffffff", radius: 22, stroke: "#0a0a0a", strokeWidth: 4, selectable: false },
                { id: "msg-1", type: "text", text: "¿NUNCA BAILASTE?", x: 60, y: 795, width: 960, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#be185d", textAlign: "center", charSpacing: 200 },
                { id: "msg-2", type: "text", text: "Empieza aquí.", x: 60, y: 826, width: 960, fontSize: 42, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "info-day", type: "text", text: "MARTES  ·  20:00 H", x: 60, y: 890, width: 960, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 100 },
                { id: "info-where", type: "text", text: "Estudio Jean  ·  C/ Goya 22  ·  Madrid", x: 60, y: 935, width: 960, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.65)", fontWeight: "600", textAlign: "center" },
                { id: "tag-bg", type: "shape", shape: "rect", x: 320, y: 975, width: 440, height: 50, fill: "#fbbf24", radius: 25, selectable: false },
                { id: "tag-text", type: "text", text: "DESPUÉS  ·  15€ / CLASE", x: 0, y: 990, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 200 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#a7f3d0", selectable: false },
                { id: "bubble-1", type: "shape", shape: "circle", x: -100, y: 100, width: 400, height: 400, fill: "#fbbf24", opacity: 0.85, selectable: false },
                { id: "bubble-2", type: "shape", shape: "circle", x: 850, y: 200, width: 320, height: 320, fill: "#f472b6", opacity: 0.85, selectable: false },
                { id: "bubble-3", type: "shape", shape: "circle", x: -50, y: 1500, width: 280, height: 280, fill: "#f59e0b", opacity: 0.85, selectable: false },
                { id: "bubble-4", type: "shape", shape: "circle", x: 920, y: 1550, width: 280, height: 280, fill: "#6366f1", opacity: 0.85, selectable: false },
                { id: "chip-bg", type: "shape", shape: "rect", x: 240, y: 140, width: 600, height: 68, fill: "#0a0a0a", radius: 34, selectable: false },
                { id: "chip-label", type: "text", text: "★ PRIMERA CLASE GRATIS ★", x: 0, y: 162, width: 1080, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 250 },
                { id: "title-shadow", type: "text", text: "BACHATA", x: 12, y: 290, width: 1080, fontSize: 180, fontFamily: "Anton, Impact, sans-serif", color: "#7c2d12", textAlign: "center", charSpacing: -5 },
                { id: "title-1", type: "text", text: "BACHATA", x: 0, y: 278, width: 1080, fontSize: 180, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: -5 },
                { id: "title-2-bg", type: "shape", shape: "rect", x: 220, y: 450, width: 640, height: 78, fill: "#be185d", radius: 39, selectable: false, angle: -3, originX: "left", originY: "top" },
                { id: "title-2", type: "text", text: "para principiantes", x: 0, y: 470, width: 1080, fontSize: 36, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100, angle: -3 },
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 540, y: 580, scaleX: 0.95, scaleY: 0.95, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 55, offsetX: 0, offsetY: 0 } },
                { id: "info-bg", type: "shape", shape: "rect", x: 60, y: 1320, width: 960, height: 460, fill: "#ffffff", radius: 22, stroke: "#0a0a0a", strokeWidth: 4, selectable: false },
                { id: "msg-1", type: "text", text: "¿NUNCA BAILASTE?", x: 60, y: 1360, width: 960, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#be185d", textAlign: "center", charSpacing: 200 },
                { id: "msg-2", type: "text", text: "Empieza aquí.", x: 60, y: 1400, width: 960, fontSize: 64, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "div", type: "shape", shape: "rect", x: 400, y: 1490, width: 280, height: 4, fill: "#be185d", selectable: false },
                { id: "info-day", type: "text", text: "MARTES  ·  20:00 H", x: 60, y: 1520, width: 960, fontSize: 48, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 100 },
                { id: "info-where", type: "text", text: "Estudio Jean  ·  C/ Goya 22  ·  Madrid", x: 60, y: 1590, width: 960, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.65)", fontWeight: "600", textAlign: "center" },
                { id: "tag-bg", type: "shape", shape: "rect", x: 320, y: 1640, width: 440, height: 60, fill: "#fbbf24", radius: 30, selectable: false },
                { id: "tag-text", type: "text", text: "DESPUÉS  ·  15€ / CLASE", x: 0, y: 1658, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 200 },
                { id: "cta", type: "text", text: "RESERVA WHATSAPP  ·  +34 600 222 333", x: 0, y: 1730, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#a7f3d0", selectable: false },
                { id: "bubble-1", type: "shape", shape: "circle", x: -100, y: -100, width: 380, height: 380, fill: "#fbbf24", opacity: 0.85, selectable: false },
                { id: "bubble-2", type: "shape", shape: "circle", x: 1700, y: 600, width: 300, height: 300, fill: "#f472b6", opacity: 0.85, selectable: false },
                { id: "bubble-3", type: "shape", shape: "circle", x: 1750, y: -100, width: 280, height: 280, fill: "#6366f1", opacity: 0.85, selectable: false },
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 1400, y: 80, scaleX: 0.78, scaleY: 0.78, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 45, offsetX: 0, offsetY: 0 } },
                { id: "chip-bg", type: "shape", shape: "rect", x: 80, y: 80, width: 440, height: 50, fill: "#0a0a0a", radius: 25, selectable: false },
                { id: "chip-label", type: "text", text: "★ PRIMERA CLASE GRATIS ★", x: 80, y: 95, width: 440, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 150 },
                { id: "title-shadow", type: "text", text: "BACHATA", x: 88, y: 180, width: 900, fontSize: 160, fontFamily: "Anton, Impact, sans-serif", color: "#7c2d12", textAlign: "left", charSpacing: -5 },
                { id: "title-1", type: "text", text: "BACHATA", x: 80, y: 170, width: 900, fontSize: 160, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: -5 },
                { id: "title-2-bg", type: "shape", shape: "rect", x: 80, y: 340, width: 600, height: 64, fill: "#be185d", radius: 32, selectable: false },
                { id: "title-2", type: "text", text: "para principiantes", x: 80, y: 355, width: 600, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "info-bg", type: "shape", shape: "rect", x: 80, y: 460, width: 900, height: 380, fill: "#ffffff", radius: 22, stroke: "#0a0a0a", strokeWidth: 4, selectable: false },
                { id: "msg-1", type: "text", text: "¿NUNCA BAILASTE? EMPIEZA AQUÍ.", x: 80, y: 500, width: 900, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#be185d", textAlign: "center", charSpacing: 150 },
                { id: "div", type: "shape", shape: "rect", x: 380, y: 550, width: 300, height: 3, fill: "#be185d", selectable: false },
                { id: "info-day", type: "text", text: "MARTES  ·  20:00 H", x: 80, y: 580, width: 900, fontSize: 48, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 100 },
                { id: "info-where", type: "text", text: "Estudio Jean  ·  C/ Goya 22  ·  Madrid", x: 80, y: 650, width: 900, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.65)", fontWeight: "600", textAlign: "center" },
                { id: "tag-bg", type: "shape", shape: "rect", x: 280, y: 700, width: 500, height: 60, fill: "#fbbf24", radius: 30, selectable: false },
                { id: "tag-text", type: "text", text: "DESPUÉS  ·  15€ / CLASE", x: 280, y: 718, width: 500, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 200 },
                { id: "cta", type: "text", text: "RESERVA WHATSAPP  ·  +34 600 222 333", x: 80, y: 790, width: 900, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 250 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 40 — Intensivo Fin de Semana — bold itinerario azul/amarillo (NUEVO)
//      2 fotos pareja stack vertical + schedule sabado/domingo
//      Tipografia bold tipo bootcamp deportivo
// ─────────────────────────────────────────────────────────────────────
    {
        id: 40,
        title: "Intensivo Fin de Semana",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png",
        premium: true,
        audience: ["academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO azul marino profundo
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0c1a3d", selectable: false },
                // Halos azules dispersos
                { id: "halo-bl", type: "shape", shape: "circle", x: -100, y: 200, width: 600, height: 600, fill: "rgba(59,130,246,0.30)", opacity: 0.7, selectable: false },
                { id: "halo-br", type: "shape", shape: "circle", x: 680, y: 700, width: 600, height: 600, fill: "rgba(96,165,250,0.25)", opacity: 0.7, selectable: false },

                // BANDA AMARILLA arriba diagonal
                { id: "diag-band", type: "shape", shape: "rect", x: -150, y: 80, width: 1400, height: 70, fill: "#fbbf24", angle: -3, selectable: false },
                { id: "diag-text", type: "text", text: "·  INTENSIVO BACHATA  ·  10 HORAS  ·  2 DÍAS  ·  CUPO 24  ·", x: 0, y: 100, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 250, angle: -3 },

                // CABECERA titulo
                { id: "kicker", type: "text", text: "DEL 25 AL 26 DE OCTUBRE", x: 0, y: 200, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 500 },
                { id: "title-1", type: "text", text: "BOOTCAMP", x: 0, y: 230, width: 1080, fontSize: 88, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "title-2", type: "text", text: "DE BACHATA", x: 0, y: 320, width: 1080, fontSize: 46, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },

                // ─── DOS FOTOS PROFES (izquierda y derecha) ───
                // Profe izq (Isabela & Alejandro)
                { id: "frame-l", type: "shape", shape: "circle", x: 270, y: 400, width: 280, height: 280, fill: "#fbbf24", originX: "center", originY: "top", selectable: false },
                { id: "profe-l", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 270, y: 395, scaleX: 0.42, scaleY: 0.42, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.5)", blur: 25, offsetX: 0, offsetY: 5 } },
                { id: "name-l", type: "text", text: "ISA & ALE", x: 130, y: 695, width: 280, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "role-l", type: "text", text: "Sensual & Lady styling", x: 130, y: 730, width: 280, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 100 },

                // Profe der (Damian solo - como secondary)
                { id: "frame-r", type: "shape", shape: "circle", x: 810, y: 400, width: 280, height: 280, fill: "#fbbf24", originX: "center", originY: "top", selectable: false },
                { id: "profe-r", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 810, y: 395, scaleX: 0.42, scaleY: 0.42, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.5)", blur: 25, offsetX: 0, offsetY: 5 } },
                { id: "name-r", type: "text", text: "DAMIÁN", x: 670, y: 695, width: 280, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "role-r", type: "text", text: "Técnica & musicalidad", x: 670, y: 730, width: 280, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 100 },

                // ─── ITINERARIO SCHEDULE bloques ───
                { id: "sched-title", type: "text", text: "PROGRAMA", x: 0, y: 790, width: 1080, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.5)", fontWeight: "700", textAlign: "center", charSpacing: 500 },

                // Sábado bloque
                { id: "sab-bg", type: "shape", shape: "rect", x: 60, y: 825, width: 460, height: 290, fill: "rgba(255,255,255,0.06)", radius: 8, stroke: "rgba(251,191,36,0.45)", strokeWidth: 1, selectable: false },
                { id: "sab-day", type: "text", text: "SÁBADO 25", x: 60, y: 845, width: 460, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "sab-line", type: "shape", shape: "rect", x: 220, y: 880, width: 140, height: 2, fill: "#fbbf24", selectable: false },

                { id: "sab-1-t", type: "text", text: "10:00", x: 90, y: 905, width: 100, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "sab-1-d", type: "text", text: "Técnica de base", x: 200, y: 907, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },

                { id: "sab-2-t", type: "text", text: "13:00", x: 90, y: 940, width: 100, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "sab-2-d", type: "text", text: "Almuerzo", x: 200, y: 942, width: 300, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.55)", fontWeight: "500", textAlign: "left", fontStyle: "italic" },

                { id: "sab-3-t", type: "text", text: "16:00", x: 90, y: 975, width: 100, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "sab-3-d", type: "text", text: "Figuras pareja", x: 200, y: 977, width: 300, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },

                { id: "sab-4-t", type: "text", text: "19:00", x: 90, y: 1010, width: 100, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "sab-4-d", type: "text", text: "Social abierta", x: 200, y: 1012, width: 300, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },

                { id: "sab-hours", type: "text", text: "5H DE TRABAJO", x: 60, y: 1075, width: 460, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 350 },

                // Domingo bloque
                { id: "dom-bg", type: "shape", shape: "rect", x: 560, y: 825, width: 460, height: 290, fill: "rgba(255,255,255,0.06)", radius: 8, stroke: "rgba(251,191,36,0.45)", strokeWidth: 1, selectable: false },
                { id: "dom-day", type: "text", text: "DOMINGO 26", x: 560, y: 845, width: 460, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "dom-line", type: "shape", shape: "rect", x: 720, y: 880, width: 140, height: 2, fill: "#fbbf24", selectable: false },

                { id: "dom-1-t", type: "text", text: "10:00", x: 590, y: 905, width: 100, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "dom-1-d", type: "text", text: "Musicalidad", x: 700, y: 907, width: 300, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },

                { id: "dom-2-t", type: "text", text: "13:00", x: 590, y: 940, width: 100, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "dom-2-d", type: "text", text: "Almuerzo", x: 700, y: 942, width: 300, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.55)", fontWeight: "500", textAlign: "left", fontStyle: "italic" },

                { id: "dom-3-t", type: "text", text: "16:00", x: 590, y: 975, width: 100, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "dom-3-d", type: "text", text: "Sensual styling", x: 700, y: 977, width: 300, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },

                { id: "dom-4-t", type: "text", text: "18:00", x: 590, y: 1010, width: 100, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "dom-4-d", type: "text", text: "Cierre & grupal", x: 700, y: 1012, width: 300, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },

                { id: "dom-hours", type: "text", text: "5H DE TRABAJO", x: 560, y: 1075, width: 460, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 350 },

                // BANDA PIE precio + cta
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 1150, width: 1080, height: 200, fill: "#fbbf24", selectable: false },
                { id: "footer-price-label", type: "text", text: "INVERSIÓN COMPLETA", x: 0, y: 1170, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "footer-price", type: "text", text: "150€", x: 0, y: 1190, width: 1080, fontSize: 80, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "footer-extra", type: "text", text: "EARLY BIRD 130€ HASTA 10 OCT", x: 0, y: 1285, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 300 },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  bootcamp@escueladelsol.es", x: 0, y: 1315, width: 1080, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.75)", fontWeight: "700", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── SQUARE 1080x1080 — Intensivo bootcamp compacto ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#0c1a3d", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -100, y: 100, width: 600, height: 600, fill: "rgba(59,130,246,0.30)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 680, y: 400, width: 600, height: 600, fill: "rgba(96,165,250,0.25)", opacity: 0.7, selectable: false },
                { id: "diag-band", type: "shape", shape: "rect", x: -150, y: 50, width: 1400, height: 60, fill: "#fbbf24", angle: -3, selectable: false },
                { id: "diag-text", type: "text", text: "·  INTENSIVO BACHATA  ·  10H  ·  2 DÍAS  ·", x: 0, y: 68, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 250, angle: -3 },
                { id: "title-1", type: "text", text: "BOOTCAMP", x: 0, y: 145, width: 1080, fontSize: 75, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "title-2", type: "text", text: "DE BACHATA", x: 0, y: 220, width: 1080, fontSize: 36, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "frame-l", type: "shape", shape: "circle", x: 340, y: 290, width: 220, height: 220, fill: "#fbbf24", originX: "center", originY: "top", selectable: false },
                { id: "profe-l", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 340, y: 285, scaleX: 0.34, scaleY: 0.34, originX: "center", originY: "top" },
                { id: "name-l", type: "text", text: "ISA & ALE", x: 230, y: 520, width: 220, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "frame-r", type: "shape", shape: "circle", x: 740, y: 290, width: 220, height: 220, fill: "#fbbf24", originX: "center", originY: "top", selectable: false },
                { id: "profe-r", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 740, y: 285, scaleX: 0.34, scaleY: 0.34, originX: "center", originY: "top" },
                { id: "name-r", type: "text", text: "DAMIÁN", x: 630, y: 520, width: 220, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "sab-bg", type: "shape", shape: "rect", x: 80, y: 580, width: 440, height: 180, fill: "rgba(255,255,255,0.06)", radius: 8, stroke: "rgba(251,191,36,0.45)", strokeWidth: 1, selectable: false },
                { id: "sab-day", type: "text", text: "SÁBADO 25", x: 80, y: 600, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "sab-info", type: "text", text: "10:00 Técnica  ·  16:00 Figuras  ·  19:00 Social", x: 80, y: 645, width: 440, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center" },
                { id: "sab-hours", type: "text", text: "5H DE TRABAJO", x: 80, y: 720, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "dom-bg", type: "shape", shape: "rect", x: 560, y: 580, width: 440, height: 180, fill: "rgba(255,255,255,0.06)", radius: 8, stroke: "rgba(251,191,36,0.45)", strokeWidth: 1, selectable: false },
                { id: "dom-day", type: "text", text: "DOMINGO 26", x: 560, y: 600, width: 440, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "dom-info", type: "text", text: "10:00 Musicalidad  ·  16:00 Sensual  ·  18:00 Cierre", x: 560, y: 645, width: 440, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center" },
                { id: "dom-hours", type: "text", text: "5H DE TRABAJO", x: 560, y: 720, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 790, width: 1080, height: 290, fill: "#fbbf24", selectable: false },
                { id: "footer-label", type: "text", text: "INVERSIÓN COMPLETA", x: 0, y: 815, width: 1080, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "footer-price", type: "text", text: "150€", x: 0, y: 840, width: 1080, fontSize: 100, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "footer-extra", type: "text", text: "EARLY BIRD 130€ HASTA 10 OCT  ·  25-26 OCT", x: 0, y: 960, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 250 },
                { id: "footer-cta", type: "text", text: "bootcamp@escueladelsol.es", x: 0, y: 1010, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.75)", fontWeight: "700", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── STORY 1080x1920 — Intensivo bootcamp espacioso ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0c1a3d", selectable: false },
                { id: "halo-bl", type: "shape", shape: "circle", x: -100, y: 300, width: 700, height: 700, fill: "rgba(59,130,246,0.30)", opacity: 0.7, selectable: false },
                { id: "halo-br", type: "shape", shape: "circle", x: 680, y: 900, width: 700, height: 700, fill: "rgba(96,165,250,0.25)", opacity: 0.7, selectable: false },
                { id: "diag-band", type: "shape", shape: "rect", x: -150, y: 130, width: 1400, height: 70, fill: "#fbbf24", angle: -3, selectable: false },
                { id: "diag-text", type: "text", text: "·  INTENSIVO BACHATA  ·  10 HORAS  ·  2 DÍAS  ·", x: 0, y: 152, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 250, angle: -3 },
                { id: "kicker", type: "text", text: "DEL 25 AL 26 DE OCTUBRE", x: 0, y: 260, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 500 },
                { id: "title-1", type: "text", text: "BOOTCAMP", x: 0, y: 295, width: 1080, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "title-2", type: "text", text: "DE BACHATA", x: 0, y: 405, width: 1080, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "frame-l", type: "shape", shape: "circle", x: 290, y: 520, width: 320, height: 320, fill: "#fbbf24", originX: "center", originY: "top", selectable: false },
                { id: "profe-l", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 290, y: 515, scaleX: 0.5, scaleY: 0.5, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.5)", blur: 25, offsetX: 0, offsetY: 5 } },
                { id: "name-l", type: "text", text: "ISA & ALE", x: 130, y: 855, width: 320, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "frame-r", type: "shape", shape: "circle", x: 790, y: 520, width: 320, height: 320, fill: "#fbbf24", originX: "center", originY: "top", selectable: false },
                { id: "profe-r", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 790, y: 515, scaleX: 0.5, scaleY: 0.5, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.5)", blur: 25, offsetX: 0, offsetY: 5 } },
                { id: "name-r", type: "text", text: "DAMIÁN", x: 630, y: 855, width: 320, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "sched-title", type: "text", text: "PROGRAMA", x: 0, y: 950, width: 1080, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.5)", fontWeight: "700", textAlign: "center", charSpacing: 500 },
                { id: "sab-bg", type: "shape", shape: "rect", x: 60, y: 990, width: 460, height: 340, fill: "rgba(255,255,255,0.06)", radius: 8, stroke: "rgba(251,191,36,0.45)", strokeWidth: 1, selectable: false },
                { id: "sab-day", type: "text", text: "SÁBADO 25", x: 60, y: 1020, width: 460, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "sab-1", type: "text", text: "10:00 Técnica de base", x: 80, y: 1080, width: 420, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },
                { id: "sab-2", type: "text", text: "13:00 Almuerzo", x: 80, y: 1115, width: 420, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.55)", fontWeight: "500", textAlign: "left", fontStyle: "italic" },
                { id: "sab-3", type: "text", text: "16:00 Figuras en pareja", x: 80, y: 1150, width: 420, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },
                { id: "sab-4", type: "text", text: "19:00 Social abierta", x: 80, y: 1185, width: 420, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },
                { id: "sab-hours", type: "text", text: "5H DE TRABAJO", x: 60, y: 1280, width: 460, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "dom-bg", type: "shape", shape: "rect", x: 560, y: 990, width: 460, height: 340, fill: "rgba(255,255,255,0.06)", radius: 8, stroke: "rgba(251,191,36,0.45)", strokeWidth: 1, selectable: false },
                { id: "dom-day", type: "text", text: "DOMINGO 26", x: 560, y: 1020, width: 460, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "dom-1", type: "text", text: "10:00 Musicalidad", x: 580, y: 1080, width: 420, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },
                { id: "dom-2", type: "text", text: "13:00 Almuerzo", x: 580, y: 1115, width: 420, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.55)", fontWeight: "500", textAlign: "left", fontStyle: "italic" },
                { id: "dom-3", type: "text", text: "16:00 Sensual styling", x: 580, y: 1150, width: 420, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },
                { id: "dom-4", type: "text", text: "18:00 Cierre grupal", x: 580, y: 1185, width: 420, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "left" },
                { id: "dom-hours", type: "text", text: "5H DE TRABAJO", x: 560, y: 1280, width: 460, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 1450, width: 1080, height: 470, fill: "#fbbf24", selectable: false },
                { id: "footer-price-label", type: "text", text: "INVERSIÓN COMPLETA", x: 0, y: 1500, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "footer-price", type: "text", text: "150€", x: 0, y: 1530, width: 1080, fontSize: 140, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "footer-extra", type: "text", text: "EARLY BIRD 130€ HASTA 10 OCT", x: 0, y: 1700, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 300 },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  bootcamp@escueladelsol.es", x: 0, y: 1750, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.75)", fontWeight: "700", textAlign: "center", charSpacing: 250 },
                { id: "footer-phone", type: "text", text: "+34 600 222 333  ·  WhatsApp", x: 0, y: 1800, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.65)", fontWeight: "600", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── FB-COVER 1920x1005 — Intensivo horizontal ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#0c1a3d", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -100, y: 100, width: 700, height: 700, fill: "rgba(59,130,246,0.30)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 1280, y: 200, width: 700, height: 700, fill: "rgba(96,165,250,0.25)", opacity: 0.7, selectable: false },
                { id: "diag-band", type: "shape", shape: "rect", x: -150, y: 50, width: 2200, height: 50, fill: "#fbbf24", angle: -2, selectable: false },
                { id: "diag-text", type: "text", text: "INTENSIVO BACHATA  ·  10 HORAS  ·  2 DÍAS  ·  CUPO 24", x: 0, y: 65, width: 1920, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 250, angle: -2 },
                { id: "title-1", type: "text", text: "BOOTCAMP", x: 80, y: 140, width: 1000, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "title-2", type: "text", text: "DE BACHATA  ·  25-26 OCTUBRE", x: 80, y: 270, width: 1100, fontSize: 38, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "left", charSpacing: 200 },
                { id: "frame-l", type: "shape", shape: "circle", x: 200, y: 380, width: 220, height: 220, fill: "#fbbf24", originX: "center", originY: "top", selectable: false },
                { id: "profe-l", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 200, y: 375, scaleX: 0.34, scaleY: 0.34, originX: "center", originY: "top" },
                { id: "name-l", type: "text", text: "ISA & ALE", x: 90, y: 610, width: 220, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "frame-r", type: "shape", shape: "circle", x: 450, y: 380, width: 220, height: 220, fill: "#fbbf24", originX: "center", originY: "top", selectable: false },
                { id: "profe-r", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 450, y: 375, scaleX: 0.34, scaleY: 0.34, originX: "center", originY: "top" },
                { id: "name-r", type: "text", text: "DAMIÁN", x: 340, y: 610, width: 220, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "sab-bg", type: "shape", shape: "rect", x: 700, y: 360, width: 540, height: 240, fill: "rgba(255,255,255,0.06)", radius: 8, stroke: "rgba(251,191,36,0.45)", strokeWidth: 1, selectable: false },
                { id: "sab-day", type: "text", text: "SÁBADO 25", x: 700, y: 380, width: 540, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "sab-info", type: "text", text: "10:00 Técnica  ·  16:00 Figuras  ·  19:00 Social", x: 720, y: 425, width: 500, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center" },
                { id: "sab-hours", type: "text", text: "5H DE TRABAJO", x: 700, y: 560, width: 540, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "dom-bg", type: "shape", shape: "rect", x: 1260, y: 360, width: 540, height: 240, fill: "rgba(255,255,255,0.06)", radius: 8, stroke: "rgba(251,191,36,0.45)", strokeWidth: 1, selectable: false },
                { id: "dom-day", type: "text", text: "DOMINGO 26", x: 1260, y: 380, width: 540, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
                { id: "dom-info", type: "text", text: "10:00 Musicalidad  ·  16:00 Sensual  ·  18:00 Cierre", x: 1280, y: 425, width: 500, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center" },
                { id: "dom-hours", type: "text", text: "5H DE TRABAJO", x: 1260, y: 560, width: 540, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 730, width: 1920, height: 275, fill: "#fbbf24", selectable: false },
                { id: "footer-label", type: "text", text: "INVERSIÓN COMPLETA  ·  EARLY BIRD 130€ HASTA 10 OCT", x: 0, y: 760, width: 1920, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "footer-price", type: "text", text: "150€", x: 0, y: 790, width: 1920, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  bootcamp@escueladelsol.es  ·  +34 600 222 333", x: 0, y: 960, width: 1920, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.75)", fontWeight: "700", textAlign: "center", charSpacing: 300 },
            ] },
        ],
    },

// ═════════════════════════════════════════════════════════════════════
// FAMILIA CLASES & WORKSHOPS — SEGUNDA TANDA — estilos variados
// 3 plantillas con fotos reusadas. 3 mas se haran al recibir fotos nuevas.
// ═════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// 41 — Tango Argentino Workshop — art-deco vintage Buenos Aires (NUEVO)
//      Blanco/negro contraste alto + acento bordo, tipografia retro
//      Decoracion lineas tipo art-deco. Estetica "milonga".
// ─────────────────────────────────────────────────────────────────────
    {
        id: 41,
        title: "Tango Argentino",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png",
        premium: true,
        audience: ["academias", "instituciones"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO crema casi blanco
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#f5f0e8", selectable: false },
                // Mancha bordo lateral derecha (forma angular art-deco)
                { id: "shape-bordo", type: "shape", shape: "rect", x: 540, y: 0, width: 800, height: 1350, fill: "#7a1532", angle: 6, originX: "left", originY: "top", selectable: false },

                // LINEAS ART-DECO doradas radiales esquina sup izq
                { id: "deco-l1", type: "shape", shape: "rect", x: 60, y: 60, width: 380, height: 2, fill: "#b8860b", selectable: false },
                { id: "deco-l2", type: "shape", shape: "rect", x: 60, y: 76, width: 280, height: 1, fill: "#b8860b", selectable: false },
                { id: "deco-l3", type: "shape", shape: "rect", x: 60, y: 87, width: 180, height: 1, fill: "#b8860b", selectable: false },

                // LINEAS art-deco esquina inf der (sobre bordo)
                { id: "deco-r1", type: "shape", shape: "rect", x: 660, y: 1290, width: 360, height: 2, fill: "#d4af37", selectable: false },
                { id: "deco-r2", type: "shape", shape: "rect", x: 760, y: 1275, width: 260, height: 1, fill: "#d4af37", selectable: false },
                { id: "deco-r3", type: "shape", shape: "rect", x: 840, y: 1264, width: 180, height: 1, fill: "#d4af37", selectable: false },

                // CABECERA tipo programa milonga
                { id: "kicker", type: "text", text: "M I L O N G A   ·   E S T U D I O   B A I L E", x: 60, y: 110, width: 480, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#7a1532", fontWeight: "700", textAlign: "left", charSpacing: 500 },

                // TITULO Playfair italica MASIVO 2 lineas
                { id: "title-1", type: "text", text: "Tango", x: 60, y: 150, width: 480, fontSize: 130, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "Argentino", x: 60, y: 280, width: 480, fontSize: 78, fontFamily: "Playfair Display, serif", color: "#7a1532", textAlign: "left", fontStyle: "italic" },

                // Ornamento bajo titulo
                { id: "orn-1", type: "shape", shape: "rect", x: 60, y: 380, width: 60, height: 2, fill: "#b8860b", selectable: false },
                { id: "orn-d", type: "shape", shape: "circle", x: 128, y: 376, width: 10, height: 10, fill: "transparent", stroke: "#b8860b", strokeWidth: 1, selectable: false },
                { id: "orn-2", type: "shape", shape: "rect", x: 148, y: 380, width: 280, height: 2, fill: "#b8860b", selectable: false },

                // Descripcion italica corta
                { id: "desc-1", type: "text", text: "Tradición porteña, abrazo cerrado", x: 60, y: 405, width: 480, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(10,10,10,0.78)", fontStyle: "italic", textAlign: "left" },
                { id: "desc-2", type: "text", text: "y caminata. Para todos los niveles.", x: 60, y: 435, width: 480, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(10,10,10,0.78)", fontStyle: "italic", textAlign: "left" },

                // FOTO pareja en lado derecho sobre fondo bordo — más grande
                // Imagen real: 500×500. Scale 1.05 → render 525×525, ocupa bien la zona bordo
                // y:130 → termina en y:655. Franja fade decorativa enmascara corte
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 800, y: 130, scaleX: 1.05, scaleY: 1.05, originX: "center", originY: "top", shadow: { color: "rgba(180,134,11,0.65)", blur: 50, offsetX: 0, offsetY: 0 } },

                // FRANJA gradiente simulado bajo la pareja (enmascara corte de piernas)
                { id: "couple-fade-1", type: "shape", shape: "rect", x: 540, y: 600, width: 540, height: 25, fill: "rgba(122,21,50,0.35)", angle: 6, selectable: false },
                { id: "couple-fade-2", type: "shape", shape: "rect", x: 540, y: 625, width: 540, height: 25, fill: "rgba(122,21,50,0.65)", angle: 6, selectable: false },
                { id: "couple-fade-3", type: "shape", shape: "rect", x: 540, y: 650, width: 540, height: 30, fill: "#7a1532", angle: 6, selectable: false },
                // Línea dorada decorativa para enmarcar
                { id: "couple-gold-line", type: "shape", shape: "rect", x: 600, y: 695, width: 380, height: 2, fill: "#d4af37", selectable: false },

                // Plate de nombres dentro del bordo
                { id: "plate-bg", type: "shape", shape: "rect", x: 600, y: 760, width: 400, height: 100, fill: "rgba(245,240,232,0.92)", selectable: false },
                { id: "plate-line-t", type: "shape", shape: "rect", x: 600, y: 760, width: 400, height: 2, fill: "#b8860b", selectable: false },
                { id: "plate-line-b", type: "shape", shape: "rect", x: 600, y: 858, width: 400, height: 2, fill: "#b8860b", selectable: false },
                { id: "plate-label", type: "text", text: "IMPARTEN", x: 600, y: 776, width: 400, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(122,21,50,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-names", type: "text", text: "Lucía  &  Mateo", x: 600, y: 798, width: 400, fontSize: 32, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "center", fontStyle: "italic" },

                // ─── BLOQUE INFO 4 LINEAS columna izq ───
                // Linea 1 FECHA
                { id: "info-1-l", type: "text", text: "FECHA", x: 60, y: 920, width: 200, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.55)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "info-1-v", type: "text", text: "Sábado 8 de noviembre", x: 60, y: 942, width: 440, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "info-1-sep", type: "shape", shape: "rect", x: 60, y: 985, width: 440, height: 1, fill: "rgba(10,10,10,0.18)", selectable: false },

                // Linea 2 HORA
                { id: "info-2-l", type: "text", text: "HORARIO", x: 60, y: 1000, width: 200, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.55)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "info-2-v", type: "text", text: "18:00 — 21:00 H", x: 60, y: 1022, width: 440, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "info-2-sep", type: "shape", shape: "rect", x: 60, y: 1065, width: 440, height: 1, fill: "rgba(10,10,10,0.18)", selectable: false },

                // Linea 3 LUGAR
                { id: "info-3-l", type: "text", text: "LUGAR", x: 60, y: 1080, width: 200, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.55)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "info-3-v", type: "text", text: "El Salón Buenos Aires", x: 60, y: 1102, width: 440, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "info-3-x", type: "text", text: "C/ Espoz y Mina · Madrid", x: 60, y: 1135, width: 440, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(10,10,10,0.6)", fontStyle: "italic", textAlign: "left" },

                // ─── PRECIO destacado en bloque bordo abajo derecha ───
                { id: "price-bg", type: "shape", shape: "rect", x: 600, y: 920, width: 400, height: 270, fill: "#0a0a0a", selectable: false },
                { id: "price-line-t", type: "shape", shape: "rect", x: 630, y: 945, width: 340, height: 1, fill: "#b8860b", selectable: false },
                { id: "price-line-b", type: "shape", shape: "rect", x: 630, y: 1170, width: 340, height: 1, fill: "#b8860b", selectable: false },
                { id: "price-label", type: "text", text: "INVERSIÓN", x: 600, y: 965, width: 400, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#b8860b", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "price-value", type: "text", text: "65€", x: 600, y: 990, width: 400, fontSize: 110, fontFamily: "Playfair Display, serif", color: "#f5f0e8", textAlign: "center", fontStyle: "italic" },
                { id: "price-extra", type: "text", text: "Plazas limitadas a 18", x: 600, y: 1130, width: 400, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(245,240,232,0.78)", fontStyle: "italic", textAlign: "center", charSpacing: 100 },

                // FOOTER cta linea inferior
                { id: "footer-line", type: "shape", shape: "rect", x: 60, y: 1230, width: 480, height: 1, fill: "#7a1532", selectable: false },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  salon.ba@tango.es", x: 60, y: 1245, width: 480, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#7a1532", fontStyle: "italic", textAlign: "left", charSpacing: 250 },
                { id: "footer-phone", type: "text", text: "+34 600 333 444", x: 60, y: 1275, width: 480, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.6)", fontWeight: "500", textAlign: "left", charSpacing: 200 },
            ] },

            // ─── SQUARE 1080x1080 ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#f5f0e8", selectable: false },
                { id: "shape-bordo", type: "shape", shape: "rect", x: 540, y: 0, width: 800, height: 1080, fill: "#7a1532", angle: 6, originX: "left", originY: "top", selectable: false },
                { id: "kicker", type: "text", text: "MILONGA · ESTUDIO BAILE", x: 60, y: 60, width: 480, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#7a1532", fontWeight: "700", textAlign: "left", charSpacing: 500 },
                { id: "title-1", type: "text", text: "Tango", x: 60, y: 95, width: 460, fontSize: 100, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "Argentino", x: 60, y: 200, width: 460, fontSize: 60, fontFamily: "Playfair Display, serif", color: "#7a1532", textAlign: "left", fontStyle: "italic" },
                { id: "div", type: "shape", shape: "rect", x: 60, y: 285, width: 60, height: 2, fill: "#b8860b", selectable: false },
                { id: "desc", type: "text", text: "Abrazo cerrado y caminata.", x: 60, y: 305, width: 460, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(10,10,10,0.78)", fontStyle: "italic", textAlign: "left" },
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 800, y: 60, scaleX: 0.62, scaleY: 0.62, originX: "center", originY: "top", shadow: { color: "rgba(180,134,11,0.55)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "plate-bg", type: "shape", shape: "rect", x: 620, y: 600, width: 380, height: 80, fill: "rgba(245,240,232,0.92)", selectable: false },
                { id: "plate-label", type: "text", text: "IMPARTEN", x: 620, y: 612, width: 380, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(122,21,50,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-names", type: "text", text: "Lucía  &  Mateo", x: 620, y: 632, width: 380, fontSize: 28, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "center", fontStyle: "italic" },
                { id: "info-1", type: "text", text: "FECHA  ·  Sábado 8 de noviembre  ·  18:00 — 21:00 H", x: 60, y: 760, width: 960, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "info-2", type: "text", text: "LUGAR  ·  El Salón Buenos Aires  ·  Madrid", x: 60, y: 800, width: 960, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "price-bg", type: "shape", shape: "rect", x: 660, y: 850, width: 340, height: 150, fill: "#0a0a0a", selectable: false },
                { id: "price-label", type: "text", text: "INVERSIÓN", x: 660, y: 870, width: 340, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#b8860b", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "price-value", type: "text", text: "65€", x: 660, y: 890, width: 340, fontSize: 84, fontFamily: "Playfair Display, serif", color: "#f5f0e8", textAlign: "center", fontStyle: "italic" },
                { id: "cta", type: "text", text: "RESERVA  ·  salon.ba@tango.es", x: 60, y: 870, width: 580, fontSize: 23, fontFamily: "Cormorant Garamond, serif", color: "#7a1532", fontStyle: "italic", textAlign: "left", charSpacing: 200 },
                { id: "phone", type: "text", text: "+34 600 333 444", x: 60, y: 905, width: 580, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.6)", fontWeight: "500", textAlign: "left", charSpacing: 200 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#f5f0e8", selectable: false },
                { id: "shape-bordo", type: "shape", shape: "rect", x: 0, y: 1080, width: 1500, height: 1000, fill: "#7a1532", angle: -6, originX: "left", originY: "top", selectable: false },
                { id: "kicker", type: "text", text: "M I L O N G A   ·   E S T U D I O   B A I L E", x: 0, y: 140, width: 1080, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#7a1532", fontWeight: "700", textAlign: "center", charSpacing: 600 },
                { id: "title-1", type: "text", text: "Tango", x: 0, y: 175, width: 1080, fontSize: 170, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "Argentino", x: 0, y: 360, width: 1080, fontSize: 100, fontFamily: "Playfair Display, serif", color: "#7a1532", textAlign: "center", fontStyle: "italic" },
                { id: "div-l", type: "shape", shape: "rect", x: 360, y: 490, width: 130, height: 1, fill: "#b8860b", selectable: false },
                { id: "div-d", type: "shape", shape: "circle", x: 530, y: 485, width: 10, height: 10, fill: "transparent", stroke: "#b8860b", strokeWidth: 1, selectable: false },
                { id: "div-r", type: "shape", shape: "rect", x: 590, y: 490, width: 130, height: 1, fill: "#b8860b", selectable: false },
                { id: "desc", type: "text", text: "Tradición porteña, abrazo cerrado y caminata.", x: 80, y: 510, width: 920, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "rgba(10,10,10,0.78)", fontStyle: "italic", textAlign: "center" },
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 540, y: 580, scaleX: 1.0, scaleY: 1.0, originX: "center", originY: "top", shadow: { color: "rgba(180,134,11,0.55)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "plate-bg", type: "shape", shape: "rect", x: 290, y: 1190, width: 500, height: 110, fill: "rgba(245,240,232,0.92)", selectable: false },
                { id: "plate-label", type: "text", text: "IMPARTEN", x: 290, y: 1207, width: 500, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(122,21,50,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-names", type: "text", text: "Lucía  &  Mateo", x: 290, y: 1230, width: 500, fontSize: 38, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "center", fontStyle: "italic" },
                { id: "info-1-l", type: "text", text: "FECHA", x: 80, y: 1370, width: 920, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(254,243,199,0.85)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "info-1-v", type: "text", text: "Sábado 8 de noviembre  ·  18:00 — 21:00 H", x: 80, y: 1395, width: 920, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left", fontStyle: "italic" },
                { id: "info-2-l", type: "text", text: "LUGAR", x: 80, y: 1460, width: 920, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(254,243,199,0.85)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "info-2-v", type: "text", text: "El Salón Buenos Aires  ·  C/ Espoz y Mina  ·  Madrid", x: 80, y: 1485, width: 920, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "left", fontStyle: "italic" },
                { id: "price-bg", type: "shape", shape: "rect", x: 340, y: 1570, width: 400, height: 220, fill: "#0a0a0a", selectable: false },
                { id: "price-label", type: "text", text: "INVERSIÓN", x: 340, y: 1595, width: 400, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#b8860b", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "price-value", type: "text", text: "65€", x: 340, y: 1620, width: 400, fontSize: 120, fontFamily: "Playfair Display, serif", color: "#f5f0e8", textAlign: "center", fontStyle: "italic" },
                { id: "price-extra", type: "text", text: "Plazas limitadas a 18", x: 340, y: 1755, width: 400, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(245,240,232,0.78)", fontStyle: "italic", textAlign: "center", charSpacing: 100 },
                { id: "cta", type: "text", text: "RESERVA · salon.ba@tango.es · +34 600 333 444", x: 80, y: 1830, width: 920, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontStyle: "italic", textAlign: "center", charSpacing: 200 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#f5f0e8", selectable: false },
                { id: "shape-bordo", type: "shape", shape: "rect", x: 1100, y: -100, width: 1100, height: 1300, fill: "#7a1532", angle: 4, originX: "left", originY: "top", selectable: false },
                { id: "kicker", type: "text", text: "M I L O N G A   ·   E S T U D I O   B A I L E", x: 80, y: 80, width: 1000, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "#7a1532", fontWeight: "700", textAlign: "left", charSpacing: 600 },
                { id: "title-1", type: "text", text: "Tango", x: 80, y: 110, width: 1000, fontSize: 150, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "Argentino", x: 80, y: 270, width: 1000, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#7a1532", textAlign: "left", fontStyle: "italic" },
                { id: "div", type: "shape", shape: "rect", x: 80, y: 390, width: 80, height: 2, fill: "#b8860b", selectable: false },
                { id: "desc", type: "text", text: "Tradición porteña, abrazo cerrado y caminata.", x: 80, y: 410, width: 1000, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "rgba(10,10,10,0.78)", fontStyle: "italic", textAlign: "left" },
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 1500, y: 50, scaleX: 0.85, scaleY: 0.85, originX: "center", originY: "top", shadow: { color: "rgba(180,134,11,0.55)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "plate-label", type: "text", text: "IMPARTEN", x: 80, y: 490, width: 700, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(122,21,50,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 500 },
                { id: "plate-names", type: "text", text: "Lucía  &  Mateo", x: 80, y: 510, width: 700, fontSize: 36, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "info-1", type: "text", text: "Sábado 8 de noviembre  ·  18:00 — 21:00 H", x: 80, y: 590, width: 1000, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#0a0a0a", textAlign: "left", fontStyle: "italic" },
                { id: "info-2", type: "text", text: "El Salón Buenos Aires  ·  C/ Espoz y Mina  ·  Madrid", x: 80, y: 625, width: 1000, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(10,10,10,0.7)", textAlign: "left" },
                { id: "price-bg", type: "shape", shape: "rect", x: 80, y: 680, width: 400, height: 130, fill: "#0a0a0a", selectable: false },
                { id: "price-label", type: "text", text: "INVERSIÓN", x: 80, y: 700, width: 400, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#b8860b", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "price-value", type: "text", text: "65€", x: 80, y: 720, width: 400, fontSize: 80, fontFamily: "Playfair Display, serif", color: "#f5f0e8", textAlign: "center", fontStyle: "italic" },
                { id: "cta", type: "text", text: "RESERVA  ·  salon.ba@tango.es", x: 510, y: 700, width: 600, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "#7a1532", fontStyle: "italic", textAlign: "left", charSpacing: 200 },
                { id: "phone", type: "text", text: "+34 600 333 444  ·  Plazas limitadas a 18", x: 510, y: 735, width: 600, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.6)", fontWeight: "500", textAlign: "left", charSpacing: 150 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 42 — Salsa Cubana — clases regulares tropical solar (NUEVO LAYOUT)
//      Fondo amarillo+naranja+verde palmera bold caribeño
//      Iconos abstractos (notas, hojas), tipografia chunky
// ─────────────────────────────────────────────────────────────────────
    {
        id: 42,
        title: "Salsa Cubana",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
        premium: false,
        audience: ["academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO amarillo solar
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#fde047", selectable: false },
                // Banda diagonal naranja arriba
                { id: "diag-orange", type: "shape", shape: "rect", x: -200, y: 0, width: 1500, height: 380, fill: "#ea580c", angle: -8, originX: "left", originY: "top", selectable: false },
                // Banda diagonal verde palmera abajo
                { id: "diag-green", type: "shape", shape: "rect", x: -200, y: 1050, width: 1500, height: 500, fill: "#15803d", angle: -6, originX: "left", originY: "top", selectable: false },

                // SOL/circulos decorativos (hojas tropicales abstractas)
                { id: "sun-1", type: "shape", shape: "circle", x: 820, y: 80, width: 200, height: 200, fill: "#fbbf24", selectable: false },
                { id: "sun-ray-1", type: "shape", shape: "rect", x: 920, y: 50, width: 4, height: 50, fill: "#fbbf24", angle: 0, originX: "center", originY: "top", selectable: false },
                { id: "sun-ray-2", type: "shape", shape: "rect", x: 920, y: 180, width: 4, height: 50, fill: "#fbbf24", angle: 45, originX: "center", originY: "top", selectable: false },
                { id: "sun-ray-3", type: "shape", shape: "rect", x: 920, y: 180, width: 4, height: 50, fill: "#fbbf24", angle: -45, originX: "center", originY: "top", selectable: false },
                // Hojas tropicales abstractas (lateral izquierdo)
                { id: "leaf-1", type: "shape", shape: "circle", x: -40, y: 460, width: 240, height: 240, fill: "#84cc16", opacity: 0.85, selectable: false },
                { id: "leaf-2", type: "shape", shape: "circle", x: -100, y: 700, width: 200, height: 200, fill: "#65a30d", opacity: 0.85, selectable: false },
                // Hojas en lateral derecho
                { id: "leaf-3", type: "shape", shape: "circle", x: 950, y: 540, width: 180, height: 180, fill: "#84cc16", opacity: 0.85, selectable: false },

                // CABECERA blanca sobre naranja
                { id: "kicker", type: "text", text: "ESTUDIO DEL SOL  ·  TEMPORADA 26/27", x: 0, y: 75, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 500 },

                // TITULO masivo blanco sobre naranja
                { id: "title-1", type: "text", text: "SALSA", x: 0, y: 110, width: 1080, fontSize: 175, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40 },
                { id: "title-2-bg", type: "shape", shape: "rect", x: 280, y: 280, width: 520, height: 60, fill: "#0a0a0a", radius: 30, selectable: false, angle: 2 },
                { id: "title-2", type: "text", text: "CUBANA · DESDE LA HABANA", x: 0, y: 296, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 200, angle: 2 },

                // FOTO profe centrado con halo
                { id: "frame-circle", type: "shape", shape: "circle", x: 540, y: 400, width: 460, height: 460, fill: "#ffffff", originX: "center", originY: "top", stroke: "#0a0a0a", strokeWidth: 5, selectable: false },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 540, y: 395, scaleX: 0.78, scaleY: 0.78, originX: "center", originY: "top", shadow: { color: "rgba(234,88,12,0.65)", blur: 35, offsetX: 0, offsetY: 5 } },

                // Plate nombre profe
                { id: "plate-name-bg", type: "shape", shape: "rect", x: 340, y: 850, width: 400, height: 60, fill: "#0a0a0a", radius: 30, selectable: false },
                { id: "plate-name", type: "text", text: "PROFE DAMIÁN", x: 0, y: 868, width: 1080, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 250 },

                // ─── BLOQUE INFO HORARIOS sobre verde ───
                { id: "info-title", type: "text", text: "·  HORARIOS  ·", x: 0, y: 945, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 500 },

                // 3 dias en grid 3 columnas (sobre verde)
                // Lunes
                { id: "day-1-bg", type: "shape", shape: "rect", x: 80, y: 990, width: 290, height: 130, fill: "rgba(254,224,71,0.95)", radius: 12, selectable: false },
                { id: "day-1-label", type: "text", text: "LUNES", x: 80, y: 1005, width: 290, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ea580c", textAlign: "center", charSpacing: 400 },
                { id: "day-1-time", type: "text", text: "19:00", x: 80, y: 1030, width: 290, fontSize: 50, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "day-1-extra", type: "text", text: "INICIO", x: 80, y: 1090, width: 290, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 300 },

                // Miercoles
                { id: "day-2-bg", type: "shape", shape: "rect", x: 395, y: 990, width: 290, height: 130, fill: "rgba(254,224,71,0.95)", radius: 12, selectable: false },
                { id: "day-2-label", type: "text", text: "MIÉRCOLES", x: 395, y: 1005, width: 290, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ea580c", textAlign: "center", charSpacing: 400 },
                { id: "day-2-time", type: "text", text: "20:00", x: 395, y: 1030, width: 290, fontSize: 50, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "day-2-extra", type: "text", text: "INTERMEDIO", x: 395, y: 1090, width: 290, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 300 },

                // Viernes
                { id: "day-3-bg", type: "shape", shape: "rect", x: 710, y: 990, width: 290, height: 130, fill: "rgba(254,224,71,0.95)", radius: 12, selectable: false },
                { id: "day-3-label", type: "text", text: "VIERNES", x: 710, y: 1005, width: 290, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ea580c", textAlign: "center", charSpacing: 400 },
                { id: "day-3-time", type: "text", text: "21:00", x: 710, y: 1030, width: 290, fontSize: 50, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "day-3-extra", type: "text", text: "SOCIAL", x: 710, y: 1090, width: 290, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 300 },

                // PRECIO destacado abajo
                { id: "price-bg", type: "shape", shape: "rect", x: 340, y: 1160, width: 400, height: 70, fill: "#0a0a0a", radius: 35, selectable: false },
                { id: "price-text", type: "text", text: "BONO MES · 50€", x: 0, y: 1183, width: 1080, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 200 },

                // CTA pie
                { id: "footer-where", type: "text", text: "ESTUDIO DEL SOL  ·  C/ TENERIFE 5  ·  MADRID", x: 0, y: 1265, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 300 },
                { id: "footer-cta", type: "text", text: "·  estudiodelsol.es  ·  whatsapp +34 600 444 555  ·", x: 0, y: 1300, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 300 },
            ] },

            // ─── SQUARE 1080x1080 — Salsa tropical comprimido ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#fde047", selectable: false },
                { id: "diag-orange", type: "shape", shape: "rect", x: -200, y: 0, width: 1500, height: 300, fill: "#ea580c", angle: -8, originX: "left", originY: "top", selectable: false },
                { id: "diag-green", type: "shape", shape: "rect", x: -200, y: 870, width: 1500, height: 400, fill: "#15803d", angle: -6, originX: "left", originY: "top", selectable: false },
                { id: "sun", type: "shape", shape: "circle", x: 850, y: 50, width: 160, height: 160, fill: "#fbbf24", selectable: false },
                { id: "kicker", type: "text", text: "ESTUDIO DEL SOL · 2026/27", x: 0, y: 65, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "title-1", type: "text", text: "SALSA", x: 0, y: 95, width: 1080, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40 },
                { id: "title-2", type: "text", text: "CUBANA · DESDE LA HABANA", x: 0, y: 230, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 200 },
                { id: "frame-circle", type: "shape", shape: "circle", x: 540, y: 290, width: 360, height: 360, fill: "#ffffff", originX: "center", originY: "top", stroke: "#0a0a0a", strokeWidth: 4, selectable: false },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 540, y: 285, scaleX: 0.6, scaleY: 0.6, originX: "center", originY: "top", shadow: { color: "rgba(234,88,12,0.55)", blur: 25, offsetX: 0, offsetY: 5 } },
                { id: "plate-name-bg", type: "shape", shape: "rect", x: 360, y: 660, width: 360, height: 50, fill: "#0a0a0a", radius: 25, selectable: false },
                { id: "plate-name", type: "text", text: "PROFE DAMIÁN", x: 0, y: 675, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 250 },
                { id: "day-1-bg", type: "shape", shape: "rect", x: 60, y: 760, width: 300, height: 80, fill: "rgba(254,224,71,0.95)", radius: 10, selectable: false },
                { id: "day-1", type: "text", text: "LUN · 19H", x: 60, y: 778, width: 300, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ea580c", textAlign: "center", charSpacing: 100 },
                { id: "day-1-x", type: "text", text: "INICIO", x: 60, y: 808, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 300 },
                { id: "day-2-bg", type: "shape", shape: "rect", x: 390, y: 760, width: 300, height: 80, fill: "rgba(254,224,71,0.95)", radius: 10, selectable: false },
                { id: "day-2", type: "text", text: "MIÉ · 20H", x: 390, y: 778, width: 300, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ea580c", textAlign: "center", charSpacing: 100 },
                { id: "day-2-x", type: "text", text: "INTERMEDIO", x: 390, y: 808, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 300 },
                { id: "day-3-bg", type: "shape", shape: "rect", x: 720, y: 760, width: 300, height: 80, fill: "rgba(254,224,71,0.95)", radius: 10, selectable: false },
                { id: "day-3", type: "text", text: "VIE · 21H", x: 720, y: 778, width: 300, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ea580c", textAlign: "center", charSpacing: 100 },
                { id: "day-3-x", type: "text", text: "SOCIAL", x: 720, y: 808, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 300 },
                { id: "price-bg", type: "shape", shape: "rect", x: 340, y: 880, width: 400, height: 60, fill: "#0a0a0a", radius: 30, selectable: false },
                { id: "price-text", type: "text", text: "BONO MES · 50€", x: 0, y: 895, width: 1080, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 200 },
                { id: "footer-where", type: "text", text: "ESTUDIO DEL SOL  ·  C/ TENERIFE 5  ·  MADRID", x: 0, y: 985, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 300 },
                { id: "footer-cta", type: "text", text: "estudiodelsol.es · WhatsApp +34 600 444 555", x: 0, y: 1020, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#fde047", selectable: false },
                { id: "diag-orange", type: "shape", shape: "rect", x: -200, y: 0, width: 1500, height: 500, fill: "#ea580c", angle: -8, originX: "left", originY: "top", selectable: false },
                { id: "diag-green", type: "shape", shape: "rect", x: -200, y: 1500, width: 1500, height: 600, fill: "#15803d", angle: -6, originX: "left", originY: "top", selectable: false },
                { id: "sun", type: "shape", shape: "circle", x: 830, y: 100, width: 220, height: 220, fill: "#fbbf24", selectable: false },
                { id: "leaf-1", type: "shape", shape: "circle", x: -40, y: 700, width: 240, height: 240, fill: "#84cc16", opacity: 0.85, selectable: false },
                { id: "leaf-2", type: "shape", shape: "circle", x: 950, y: 850, width: 200, height: 200, fill: "#84cc16", opacity: 0.85, selectable: false },
                { id: "kicker", type: "text", text: "ESTUDIO DEL SOL · TEMPORADA 26/27", x: 0, y: 130, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "title-1", type: "text", text: "SALSA", x: 0, y: 170, width: 1080, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40 },
                { id: "title-2-bg", type: "shape", shape: "rect", x: 240, y: 370, width: 600, height: 60, fill: "#0a0a0a", radius: 30, selectable: false, angle: 2 },
                { id: "title-2", type: "text", text: "CUBANA · DESDE LA HABANA", x: 0, y: 386, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 200, angle: 2 },
                { id: "frame-circle", type: "shape", shape: "circle", x: 540, y: 530, width: 480, height: 480, fill: "#ffffff", originX: "center", originY: "top", stroke: "#0a0a0a", strokeWidth: 5, selectable: false },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 540, y: 525, scaleX: 0.82, scaleY: 0.82, originX: "center", originY: "top", shadow: { color: "rgba(234,88,12,0.65)", blur: 35, offsetX: 0, offsetY: 5 } },
                { id: "plate-name-bg", type: "shape", shape: "rect", x: 340, y: 1030, width: 400, height: 60, fill: "#0a0a0a", radius: 30, selectable: false },
                { id: "plate-name", type: "text", text: "PROFE DAMIÁN", x: 0, y: 1048, width: 1080, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 250 },
                { id: "info-title", type: "text", text: "·  HORARIOS  ·", x: 0, y: 1125, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 500 },
                { id: "day-1-bg", type: "shape", shape: "rect", x: 80, y: 1170, width: 290, height: 130, fill: "rgba(254,224,71,0.95)", radius: 12, selectable: false },
                { id: "day-1-label", type: "text", text: "LUNES", x: 80, y: 1185, width: 290, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ea580c", textAlign: "center", charSpacing: 400 },
                { id: "day-1-time", type: "text", text: "19:00", x: 80, y: 1210, width: 290, fontSize: 50, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "day-1-extra", type: "text", text: "INICIO", x: 80, y: 1270, width: 290, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 300 },
                { id: "day-2-bg", type: "shape", shape: "rect", x: 395, y: 1170, width: 290, height: 130, fill: "rgba(254,224,71,0.95)", radius: 12, selectable: false },
                { id: "day-2-label", type: "text", text: "MIÉRCOLES", x: 395, y: 1185, width: 290, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ea580c", textAlign: "center", charSpacing: 400 },
                { id: "day-2-time", type: "text", text: "20:00", x: 395, y: 1210, width: 290, fontSize: 50, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "day-2-extra", type: "text", text: "INTERMEDIO", x: 395, y: 1270, width: 290, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 300 },
                { id: "day-3-bg", type: "shape", shape: "rect", x: 710, y: 1170, width: 290, height: 130, fill: "rgba(254,224,71,0.95)", radius: 12, selectable: false },
                { id: "day-3-label", type: "text", text: "VIERNES", x: 710, y: 1185, width: 290, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ea580c", textAlign: "center", charSpacing: 400 },
                { id: "day-3-time", type: "text", text: "21:00", x: 710, y: 1210, width: 290, fontSize: 50, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 30 },
                { id: "day-3-extra", type: "text", text: "SOCIAL", x: 710, y: 1270, width: 290, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "700", textAlign: "center", charSpacing: 300 },
                { id: "price-bg", type: "shape", shape: "rect", x: 340, y: 1380, width: 400, height: 80, fill: "#0a0a0a", radius: 40, selectable: false },
                { id: "price-text", type: "text", text: "BONO MES · 50€", x: 0, y: 1405, width: 1080, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 200 },
                { id: "footer-where", type: "text", text: "ESTUDIO DEL SOL  ·  C/ TENERIFE 5  ·  MADRID", x: 0, y: 1700, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 300 },
                { id: "footer-cta", type: "text", text: "estudiodelsol.es  ·  WhatsApp +34 600 444 555", x: 0, y: 1750, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 300 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#fde047", selectable: false },
                { id: "diag-orange", type: "shape", shape: "rect", x: -200, y: 0, width: 2400, height: 280, fill: "#ea580c", angle: -3, originX: "left", originY: "top", selectable: false },
                { id: "diag-green", type: "shape", shape: "rect", x: -200, y: 800, width: 2400, height: 400, fill: "#15803d", angle: -3, originX: "left", originY: "top", selectable: false },
                { id: "sun", type: "shape", shape: "circle", x: 1750, y: 30, width: 200, height: 200, fill: "#fbbf24", selectable: false },
                { id: "leaf", type: "shape", shape: "circle", x: -80, y: 400, width: 280, height: 280, fill: "#84cc16", opacity: 0.85, selectable: false },
                { id: "kicker", type: "text", text: "ESTUDIO DEL SOL · TEMPORADA 26/27", x: 0, y: 90, width: 1920, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "title-1", type: "text", text: "SALSA CUBANA", x: 0, y: 120, width: 1920, fontSize: 140, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40 },
                { id: "title-2-bg", type: "shape", shape: "rect", x: 660, y: 290, width: 600, height: 60, fill: "#0a0a0a", radius: 30, selectable: false },
                { id: "title-2", type: "text", text: "DESDE LA HABANA", x: 0, y: 306, width: 1920, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 200 },
                { id: "frame-circle", type: "shape", shape: "circle", x: 300, y: 420, width: 380, height: 380, fill: "#ffffff", originX: "center", originY: "top", stroke: "#0a0a0a", strokeWidth: 5, selectable: false },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 300, y: 415, scaleX: 0.65, scaleY: 0.65, originX: "center", originY: "top", shadow: { color: "rgba(234,88,12,0.65)", blur: 35, offsetX: 0, offsetY: 5 } },
                { id: "plate-name", type: "text", text: "PROFE DAMIÁN", x: 110, y: 820, width: 380, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 200 },
                { id: "day-1-bg", type: "shape", shape: "rect", x: 700, y: 430, width: 360, height: 130, fill: "rgba(254,224,71,0.95)", radius: 12, selectable: false },
                { id: "day-1", type: "text", text: "LUNES  19:00", x: 700, y: 458, width: 360, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 80 },
                { id: "day-1-x", type: "text", text: "INICIO", x: 700, y: 510, width: 360, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 300 },
                { id: "day-2-bg", type: "shape", shape: "rect", x: 1080, y: 430, width: 360, height: 130, fill: "rgba(254,224,71,0.95)", radius: 12, selectable: false },
                { id: "day-2", type: "text", text: "MIÉ  20:00", x: 1080, y: 458, width: 360, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 80 },
                { id: "day-2-x", type: "text", text: "INTERMEDIO", x: 1080, y: 510, width: 360, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 300 },
                { id: "day-3-bg", type: "shape", shape: "rect", x: 1460, y: 430, width: 360, height: 130, fill: "rgba(254,224,71,0.95)", radius: 12, selectable: false },
                { id: "day-3", type: "text", text: "VIE  21:00", x: 1460, y: 458, width: 360, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a0a", textAlign: "center", charSpacing: 80 },
                { id: "day-3-x", type: "text", text: "SOCIAL", x: 1460, y: 510, width: 360, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "rgba(10,10,10,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 300 },
                { id: "price-bg", type: "shape", shape: "rect", x: 700, y: 610, width: 1120, height: 80, fill: "#0a0a0a", radius: 40, selectable: false },
                { id: "price-text", type: "text", text: "BONO MES · 50€", x: 700, y: 635, width: 1120, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 200 },
                { id: "footer-where", type: "text", text: "ESTUDIO DEL SOL  ·  C/ TENERIFE 5  ·  MADRID  ·  estudiodelsol.es", x: 0, y: 870, width: 1920, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 300 },
                { id: "footer-cta", type: "text", text: "WhatsApp +34 600 444 555", x: 0, y: 920, width: 1920, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 43 — Urban Hip-Hop — street graffiti (NUEVO LAYOUT)
//      Fondo negro con manchas spray color, tags graffiti dispersos
//      Tipografia bold sketch, etiquetas tipo street art
// ─────────────────────────────────────────────────────────────────────
    {
        id: 43,
        title: "Urban Hip-Hop",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png",
        premium: false,
        audience: ["academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO negro graffiti
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0d0d0d", selectable: false },

                // MANCHAS spray dispersas (circulos grandes con opacidad baja - simula spray)
                { id: "spray-pink", type: "shape", shape: "circle", x: -150, y: -100, width: 700, height: 700, fill: "rgba(244,114,182,0.30)", opacity: 0.9, selectable: false },
                { id: "spray-cyan", type: "shape", shape: "circle", x: 580, y: 100, width: 600, height: 600, fill: "rgba(34,211,238,0.28)", opacity: 0.9, selectable: false },
                { id: "spray-yellow", type: "shape", shape: "circle", x: 100, y: 900, width: 500, height: 500, fill: "rgba(253,224,71,0.20)", opacity: 0.85, selectable: false },
                { id: "spray-purple", type: "shape", shape: "circle", x: 700, y: 800, width: 550, height: 550, fill: "rgba(168,85,247,0.25)", opacity: 0.85, selectable: false },

                // TAGS graffiti simulados (rect rotados pequeños con color)
                { id: "tag-1-bg", type: "shape", shape: "rect", x: 60, y: 80, width: 180, height: 32, fill: "#f472b6", angle: -8, selectable: false },
                { id: "tag-1-text", type: "text", text: "URBAN", x: 60, y: 86, width: 180, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", fontWeight: "900", textAlign: "center", charSpacing: 200, angle: -8 },

                { id: "tag-2-bg", type: "shape", shape: "rect", x: 870, y: 130, width: 150, height: 28, fill: "#22d3ee", angle: 6, selectable: false },
                { id: "tag-2-text", type: "text", text: "VIBES", x: 870, y: 135, width: 150, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", fontWeight: "900", textAlign: "center", charSpacing: 200, angle: 6 },

                { id: "tag-3-bg", type: "shape", shape: "rect", x: 30, y: 1180, width: 160, height: 28, fill: "#fde047", angle: -5, selectable: false },
                { id: "tag-3-text", type: "text", text: "STREET", x: 30, y: 1185, width: 160, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", fontWeight: "900", textAlign: "center", charSpacing: 200, angle: -5 },

                // Simulacion de "spray drips" (rect verticales finos con color)
                { id: "drip-1", type: "shape", shape: "rect", x: 200, y: 280, width: 3, height: 60, fill: "rgba(244,114,182,0.6)", selectable: false },
                { id: "drip-2", type: "shape", shape: "rect", x: 360, y: 260, width: 2, height: 50, fill: "rgba(244,114,182,0.5)", selectable: false },
                { id: "drip-3", type: "shape", shape: "rect", x: 880, y: 320, width: 3, height: 70, fill: "rgba(34,211,238,0.6)", selectable: false },

                // TITULO graffiti masivo con stroke (efecto graffiti contorno)
                { id: "title-stroke", type: "text", text: "HIP-HOP", x: 0, y: 230, width: 1080, fontSize: 180, fontFamily: "Anton, Impact, sans-serif", color: "transparent", stroke: "#f472b6", strokeWidth: 6, textAlign: "center", charSpacing: -10 },
                { id: "title", type: "text", text: "HIP-HOP", x: 0, y: 230, width: 1080, fontSize: 180, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: -10 },

                // SUBTITULO debajo con angle
                { id: "subtitle-bg", type: "shape", shape: "rect", x: 240, y: 405, width: 600, height: 48, fill: "#22d3ee", angle: -2, selectable: false },
                { id: "subtitle", type: "text", text: "·  CLASES SEMANALES  ·  TODOS NIVELES  ·", x: 0, y: 418, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 200, angle: -2 },

                // PROFE foto centro
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 540, y: 475, scaleX: 0.85, scaleY: 0.85, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.85)", blur: 70, offsetX: 0, offsetY: 0 } },

                // Sello nombre profe (rect rotado tipo sticker)
                { id: "sticker-bg", type: "shape", shape: "rect", x: 700, y: 880, width: 280, height: 60, fill: "#fde047", angle: 4, selectable: false },
                { id: "sticker-l", type: "text", text: "PROFE", x: 700, y: 887, width: 280, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(13,13,13,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 400, angle: 4 },
                { id: "sticker-n", type: "text", text: "MALIK SANTOS", x: 700, y: 905, width: 280, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 100, angle: 4 },

                // ─── INFO INFERIOR caja "tag-board" con grid ───
                { id: "board-bg", type: "shape", shape: "rect", x: 60, y: 980, width: 960, height: 280, fill: "rgba(255,255,255,0.06)", radius: 6, stroke: "rgba(244,114,182,0.5)", strokeWidth: 2, strokeDashArray: [8, 5], selectable: false },

                // Grid 2x2 info
                // Lun-Mie-Vie
                { id: "g-1-l", type: "text", text: "DÍAS", x: 90, y: 1010, width: 300, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#f472b6", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-1-v", type: "text", text: "LUN  ·  MIÉ  ·  VIE", x: 90, y: 1030, width: 440, fontSize: 36, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },

                // Hora
                { id: "g-2-l", type: "text", text: "HORA", x: 600, y: 1010, width: 300, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#f472b6", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-2-v", type: "text", text: "20:30 H", x: 600, y: 1030, width: 380, fontSize: 36, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },

                // separador
                { id: "g-sep", type: "shape", shape: "rect", x: 90, y: 1100, width: 900, height: 1, fill: "rgba(255,255,255,0.2)", selectable: false },

                // Lugar
                { id: "g-3-l", type: "text", text: "LUGAR", x: 90, y: 1115, width: 300, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-3-v", type: "text", text: "WAREHOUSE 12", x: 90, y: 1135, width: 440, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "g-3-x", type: "text", text: "Vallecas · Madrid", x: 90, y: 1175, width: 440, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "500", textAlign: "left" },

                // Precio
                { id: "g-4-l", type: "text", text: "BONO MES", x: 600, y: 1115, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fde047", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-4-v", type: "text", text: "55€", x: 600, y: 1130, width: 380, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "g-4-x", type: "text", text: "Drop-in · 18€", x: 600, y: 1195, width: 380, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "500", textAlign: "left" },

                // CTA pie con tag grande
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 1290, width: 1080, height: 60, fill: "#f472b6", selectable: false },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  warehouse12.es  ·  @WAREHOUSE12_HIPHOP", x: 0, y: 1306, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 200 },
            ] },

            // ─── SQUARE 1080x1080 ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#0d0d0d", selectable: false },
                { id: "spray-pink", type: "shape", shape: "circle", x: -150, y: -100, width: 600, height: 600, fill: "rgba(244,114,182,0.30)", opacity: 0.9, selectable: false },
                { id: "spray-cyan", type: "shape", shape: "circle", x: 580, y: 100, width: 600, height: 600, fill: "rgba(34,211,238,0.28)", opacity: 0.9, selectable: false },
                { id: "spray-yellow", type: "shape", shape: "circle", x: 200, y: 700, width: 500, height: 500, fill: "rgba(253,224,71,0.20)", opacity: 0.85, selectable: false },
                { id: "tag-1-bg", type: "shape", shape: "rect", x: 60, y: 70, width: 160, height: 30, fill: "#f472b6", angle: -8, selectable: false },
                { id: "tag-1-text", type: "text", text: "URBAN", x: 60, y: 76, width: 160, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", fontWeight: "900", textAlign: "center", charSpacing: 200, angle: -8 },
                { id: "title-stroke", type: "text", text: "HIP-HOP", x: 0, y: 160, width: 1080, fontSize: 150, fontFamily: "Anton, Impact, sans-serif", color: "transparent", stroke: "#f472b6", strokeWidth: 5, textAlign: "center", charSpacing: -10 },
                { id: "title", type: "text", text: "HIP-HOP", x: 0, y: 160, width: 1080, fontSize: 150, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: -10 },
                { id: "subtitle-bg", type: "shape", shape: "rect", x: 240, y: 310, width: 600, height: 44, fill: "#22d3ee", angle: -2, selectable: false },
                { id: "subtitle", type: "text", text: "·  CLASES SEMANALES  ·  TODOS NIVELES  ·", x: 0, y: 322, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 200, angle: -2 },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 540, y: 380, scaleX: 0.6, scaleY: 0.6, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.85)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "sticker-bg", type: "shape", shape: "rect", x: 740, y: 720, width: 260, height: 55, fill: "#fde047", angle: 4, selectable: false },
                { id: "sticker-n", type: "text", text: "PROFE MALIK", x: 740, y: 736, width: 260, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 150, angle: 4 },
                { id: "g-1-l", type: "text", text: "DÍAS", x: 60, y: 815, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#f472b6", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-1-v", type: "text", text: "LUN · MIÉ · VIE", x: 60, y: 835, width: 480, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "g-2-l", type: "text", text: "HORA", x: 600, y: 815, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#f472b6", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-2-v", type: "text", text: "20:30 H", x: 600, y: 835, width: 380, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "g-3-l", type: "text", text: "LUGAR", x: 60, y: 895, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-3-v", type: "text", text: "WAREHOUSE 12", x: 60, y: 912, width: 480, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "g-4-l", type: "text", text: "BONO MES", x: 600, y: 895, width: 300, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#fde047", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-4-v", type: "text", text: "55€", x: 600, y: 905, width: 380, fontSize: 48, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 1020, width: 1080, height: 60, fill: "#f472b6", selectable: false },
                { id: "footer-cta", type: "text", text: "warehouse12.es  ·  @WAREHOUSE12_HIPHOP", x: 0, y: 1036, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 200 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0d0d0d", selectable: false },
                { id: "spray-pink", type: "shape", shape: "circle", x: -150, y: 100, width: 800, height: 800, fill: "rgba(244,114,182,0.30)", opacity: 0.9, selectable: false },
                { id: "spray-cyan", type: "shape", shape: "circle", x: 580, y: 300, width: 700, height: 700, fill: "rgba(34,211,238,0.28)", opacity: 0.9, selectable: false },
                { id: "spray-yellow", type: "shape", shape: "circle", x: 100, y: 1300, width: 600, height: 600, fill: "rgba(253,224,71,0.20)", opacity: 0.85, selectable: false },
                { id: "spray-purple", type: "shape", shape: "circle", x: 700, y: 1200, width: 650, height: 650, fill: "rgba(168,85,247,0.25)", opacity: 0.85, selectable: false },
                { id: "tag-1-bg", type: "shape", shape: "rect", x: 60, y: 170, width: 200, height: 36, fill: "#f472b6", angle: -8, selectable: false },
                { id: "tag-1-text", type: "text", text: "URBAN", x: 60, y: 178, width: 200, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", fontWeight: "900", textAlign: "center", charSpacing: 200, angle: -8 },
                { id: "tag-2-bg", type: "shape", shape: "rect", x: 820, y: 220, width: 180, height: 32, fill: "#22d3ee", angle: 6, selectable: false },
                { id: "tag-2-text", type: "text", text: "VIBES", x: 820, y: 225, width: 180, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", fontWeight: "900", textAlign: "center", charSpacing: 200, angle: 6 },
                { id: "title-stroke", type: "text", text: "HIP-HOP", x: 0, y: 310, width: 1080, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "transparent", stroke: "#f472b6", strokeWidth: 6, textAlign: "center", charSpacing: -10 },
                { id: "title", type: "text", text: "HIP-HOP", x: 0, y: 310, width: 1080, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: -10 },
                { id: "subtitle-bg", type: "shape", shape: "rect", x: 200, y: 510, width: 680, height: 50, fill: "#22d3ee", angle: -2, selectable: false },
                { id: "subtitle", type: "text", text: "·  CLASES SEMANALES  ·  TODOS NIVELES  ·", x: 0, y: 525, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 200, angle: -2 },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 540, y: 620, scaleX: 1.0, scaleY: 1.0, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.85)", blur: 80, offsetX: 0, offsetY: 0 } },
                { id: "sticker-bg", type: "shape", shape: "rect", x: 700, y: 1180, width: 320, height: 70, fill: "#fde047", angle: 4, selectable: false },
                { id: "sticker-n", type: "text", text: "PROFE MALIK", x: 700, y: 1200, width: 320, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 150, angle: 4 },
                { id: "board-bg", type: "shape", shape: "rect", x: 60, y: 1320, width: 960, height: 380, fill: "rgba(255,255,255,0.06)", radius: 6, stroke: "rgba(244,114,182,0.5)", strokeWidth: 2, strokeDashArray: [8, 5], selectable: false },
                { id: "g-1-l", type: "text", text: "DÍAS", x: 90, y: 1360, width: 300, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#f472b6", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-1-v", type: "text", text: "LUN  ·  MIÉ  ·  VIE", x: 90, y: 1385, width: 440, fontSize: 42, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "g-2-l", type: "text", text: "HORA", x: 600, y: 1360, width: 300, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#f472b6", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-2-v", type: "text", text: "20:30 H", x: 600, y: 1385, width: 380, fontSize: 42, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "g-sep", type: "shape", shape: "rect", x: 90, y: 1470, width: 900, height: 1, fill: "rgba(255,255,255,0.2)", selectable: false },
                { id: "g-3-l", type: "text", text: "LUGAR", x: 90, y: 1490, width: 300, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-3-v", type: "text", text: "WAREHOUSE 12", x: 90, y: 1515, width: 480, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "g-3-x", type: "text", text: "Vallecas  ·  Madrid", x: 90, y: 1560, width: 480, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "500", textAlign: "left" },
                { id: "g-4-l", type: "text", text: "BONO MES", x: 600, y: 1490, width: 300, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#fde047", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-4-v", type: "text", text: "55€", x: 600, y: 1500, width: 380, fontSize: 70, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "g-4-x", type: "text", text: "Drop-in · 18€", x: 600, y: 1580, width: 380, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.6)", fontWeight: "500", textAlign: "left" },
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 1830, width: 1080, height: 90, fill: "#f472b6", selectable: false },
                { id: "footer-cta", type: "text", text: "warehouse12.es  ·  @WAREHOUSE12_HIPHOP", x: 0, y: 1855, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 200 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#0d0d0d", selectable: false },
                { id: "spray-pink", type: "shape", shape: "circle", x: -200, y: -100, width: 800, height: 800, fill: "rgba(244,114,182,0.30)", opacity: 0.9, selectable: false },
                { id: "spray-cyan", type: "shape", shape: "circle", x: 1200, y: 100, width: 800, height: 800, fill: "rgba(34,211,238,0.28)", opacity: 0.9, selectable: false },
                { id: "tag-1-bg", type: "shape", shape: "rect", x: 80, y: 80, width: 200, height: 36, fill: "#f472b6", angle: -8, selectable: false },
                { id: "tag-1-text", type: "text", text: "URBAN", x: 80, y: 88, width: 200, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", fontWeight: "900", textAlign: "center", charSpacing: 200, angle: -8 },
                { id: "title-stroke", type: "text", text: "HIP-HOP", x: 88, y: 160, width: 1100, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "transparent", stroke: "#f472b6", strokeWidth: 6, textAlign: "left", charSpacing: -10 },
                { id: "title", type: "text", text: "HIP-HOP", x: 80, y: 160, width: 1100, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: -10 },
                { id: "subtitle-bg", type: "shape", shape: "rect", x: 80, y: 380, width: 700, height: 48, fill: "#22d3ee", angle: -2, selectable: false },
                { id: "subtitle", type: "text", text: "CLASES SEMANALES · TODOS NIVELES", x: 80, y: 393, width: 700, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 200, angle: -2 },
                { id: "g-1-l", type: "text", text: "DÍAS", x: 80, y: 480, width: 300, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#f472b6", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-1-v", type: "text", text: "LUN  ·  MIÉ  ·  VIE  ·  20:30 H", x: 80, y: 505, width: 800, fontSize: 38, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "g-3-l", type: "text", text: "LUGAR", x: 80, y: 580, width: 300, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-3-v", type: "text", text: "WAREHOUSE 12  ·  Vallecas · Madrid", x: 80, y: 605, width: 900, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 80 },
                { id: "g-4-l", type: "text", text: "BONO MES", x: 80, y: 680, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#fde047", fontWeight: "800", textAlign: "left", charSpacing: 350 },
                { id: "g-4-v", type: "text", text: "55€  ·  Drop-in 18€", x: 80, y: 695, width: 600, fontSize: 48, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 30 },
                { id: "profe", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 1480, y: 100, scaleX: 0.85, scaleY: 0.85, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.85)", blur: 60, offsetX: 0, offsetY: 0 } },
                { id: "sticker-bg", type: "shape", shape: "rect", x: 1300, y: 800, width: 360, height: 60, fill: "#fde047", angle: 4, selectable: false },
                { id: "sticker-n", type: "text", text: "PROFE MALIK", x: 1300, y: 818, width: 360, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 150, angle: 4 },
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 920, width: 1920, height: 85, fill: "#f472b6", selectable: false },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  warehouse12.es  ·  @WAREHOUSE12_HIPHOP", x: 0, y: 945, width: 1920, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0d0d0d", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 44 — Kizomba Workshop — editorial tierra (NUEVO LAYOUT)
//      2 fotos pareja (foto principal grande + secondary), terracota+oro+crema
//      Mix tipografia sans+serif, lineas curvas sugieren musica/abrazo
// ─────────────────────────────────────────────────────────────────────
    {
        id: 44,
        title: "Kizomba Workshop",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Kizomba-Joa%CC%83o%20y%20Catarina.png",
        premium: true,
        audience: ["academias"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO crema oscuro tierra
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1c0f08", selectable: false },
                // Halos tierra calidos
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: 100, width: 720, height: 720, fill: "rgba(180,83,9,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 500, y: 400, width: 720, height: 720, fill: "rgba(154,52,18,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: -50, y: 850, width: 600, height: 600, fill: "rgba(217,119,6,0.30)", opacity: 0.65, selectable: false },

                // CABECERA editorial linea fina y kicker
                { id: "header-line", type: "shape", shape: "rect", x: 60, y: 80, width: 480, height: 1, fill: "#d4a058", selectable: false },
                { id: "header-num", type: "text", text: "WORKSHOP  ·  N° 12  ·  TEMPORADA 26/27", x: 60, y: 50, width: 480, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "700", textAlign: "left", charSpacing: 450 },

                // TITULO grande Playfair italica + sans condensado
                { id: "supra", type: "text", text: "MASTER", x: 60, y: 110, width: 480, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "rgba(212,160,88,0.85)", textAlign: "left", charSpacing: 500 },
                { id: "title-1", type: "text", text: "Kizomba", x: 60, y: 140, width: 700, fontSize: 130, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "& Tarraxinha", x: 60, y: 270, width: 700, fontSize: 60, fontFamily: "Playfair Display, serif", color: "#d4a058", textAlign: "left", fontStyle: "italic" },

                // Descripcion linea italica
                { id: "desc", type: "text", text: "Abrazo cerrado, musicalidad lenta, raíces angoleñas.", x: 60, y: 360, width: 720, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.78)", fontStyle: "italic", textAlign: "left" },

                // ─── DOBLE FOTO COMPOSICION ───
                // Foto principal grande (Kizomba-Joao+Catarina) lado derecho dominante
                { id: "couple-main", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Kizomba-Joa%CC%83o%20y%20Catarina.png", x: 760, y: 420, scaleX: 0.95, scaleY: 0.95, originX: "center", originY: "top", shadow: { color: "rgba(212,160,88,0.65)", blur: 50, offsetX: 0, offsetY: 0 } },

                // Foto secondary mas pequeña abajo izq (otro angulo / momento)
                { id: "frame-sec", type: "shape", shape: "rect", x: 80, y: 460, width: 300, height: 360, fill: "rgba(212,160,88,0.15)", stroke: "#d4a058", strokeWidth: 1, selectable: false },
                { id: "couple-sec", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Kizomba-Joa%CC%83o%20y%20Catarina-2.png", x: 230, y: 470, scaleX: 0.50, scaleY: 0.50, originX: "center", originY: "top", shadow: { color: "rgba(180,83,9,0.55)", blur: 30, offsetX: 0, offsetY: 0 } },

                // Caption foto secondary
                { id: "caption-num", type: "text", text: "Nº 02  ·", x: 80, y: 845, width: 300, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "800", textAlign: "left", charSpacing: 300 },
                { id: "caption-text", type: "text", text: "Otro momento en escena", x: 160, y: 845, width: 220, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.65)", fontStyle: "italic", textAlign: "left" },

                // Plate nombres profes pareja
                { id: "plate-line-t", type: "shape", shape: "rect", x: 80, y: 905, width: 920, height: 1, fill: "#d4a058", selectable: false },
                { id: "plate-label", type: "text", text: "IMPARTEN", x: 0, y: 920, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(212,160,88,0.75)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-names", type: "text", text: "João  &  Catarina", x: 0, y: 944, width: 1080, fontSize: 44, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "plate-from", type: "text", text: "DESDE LISBOA · CAMPEONES DEL MUNDO 2024", x: 0, y: 1005, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "600", textAlign: "center", charSpacing: 400 },
                { id: "plate-line-b", type: "shape", shape: "rect", x: 80, y: 1035, width: 920, height: 1, fill: "#d4a058", selectable: false },

                // ─── BLOQUE INFO 3 cajas tierra ───
                { id: "box-1-bg", type: "shape", shape: "rect", x: 60, y: 1070, width: 310, height: 200, fill: "rgba(28,15,8,0.7)", stroke: "rgba(212,160,88,0.45)", strokeWidth: 1, selectable: false },
                { id: "b1-l", type: "text", text: "FECHA", x: 60, y: 1090, width: 310, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "b1-day", type: "text", text: "22", x: 60, y: 1110, width: 310, fontSize: 88, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "b1-month", type: "text", text: "NOV · SÁBADO", x: 60, y: 1228, width: 310, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", textAlign: "center", charSpacing: 250 },

                { id: "box-2-bg", type: "shape", shape: "rect", x: 385, y: 1070, width: 310, height: 200, fill: "rgba(28,15,8,0.7)", stroke: "rgba(212,160,88,0.45)", strokeWidth: 1, selectable: false },
                { id: "b2-l", type: "text", text: "HORARIO", x: 385, y: 1090, width: 310, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "b2-day", type: "text", text: "16 — 20H", x: 385, y: 1110, width: 310, fontSize: 50, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "b2-month", type: "text", text: "4 HORAS · 2 BLOQUES", x: 385, y: 1228, width: 310, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", textAlign: "center", charSpacing: 200 },

                { id: "box-3-bg", type: "shape", shape: "rect", x: 710, y: 1070, width: 310, height: 200, fill: "rgba(28,15,8,0.7)", stroke: "rgba(212,160,88,0.45)", strokeWidth: 1, selectable: false },
                { id: "b3-l", type: "text", text: "INVERSIÓN", x: 710, y: 1090, width: 310, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "b3-day", type: "text", text: "70€", x: 710, y: 1110, width: 310, fontSize: 88, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "b3-month", type: "text", text: "EARLY BIRD 60€", x: 710, y: 1228, width: 310, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", textAlign: "center", charSpacing: 200 },

                // CTA pie
                { id: "footer-where", type: "text", text: "STUDIO KIZ  ·  C/ MIRA EL RÍO ALTA 17  ·  MADRID", x: 0, y: 1290, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "600", textAlign: "center", charSpacing: 350 },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  workshop@studiokiz.es", x: 0, y: 1315, width: 1080, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.7)", fontStyle: "italic", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── SQUARE 1080x1080 — Kizomba tierra ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#1c0f08", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: 0, width: 700, height: 700, fill: "rgba(180,83,9,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 500, y: 300, width: 700, height: 700, fill: "rgba(154,52,18,0.40)", opacity: 0.7, selectable: false },
                { id: "supra", type: "text", text: "MASTER WORKSHOP  ·  KIZOMBA", x: 60, y: 70, width: 960, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "700", textAlign: "left", charSpacing: 500 },
                { id: "title-1", type: "text", text: "Kizomba", x: 60, y: 100, width: 800, fontSize: 100, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "& Tarraxinha", x: 60, y: 210, width: 800, fontSize: 50, fontFamily: "Playfair Display, serif", color: "#d4a058", textAlign: "left", fontStyle: "italic" },
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Kizomba-Joa%CC%83o%20y%20Catarina.png", x: 540, y: 320, scaleX: 0.78, scaleY: 0.78, originX: "center", originY: "top", shadow: { color: "rgba(212,160,88,0.65)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "plate-label", type: "text", text: "IMPARTEN", x: 0, y: 800, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(212,160,88,0.75)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-names", type: "text", text: "João  &  Catarina", x: 0, y: 822, width: 1080, fontSize: 36, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "info", type: "text", text: "SÁB 22 NOV  ·  16 — 20H  ·  70€ (Early bird 60€)", x: 0, y: 890, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", fontStyle: "italic", textAlign: "center", charSpacing: 100 },
                { id: "venue", type: "text", text: "STUDIO KIZ  ·  C/ MIRA EL RÍO ALTA 17  ·  MADRID", x: 0, y: 935, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "600", textAlign: "center", charSpacing: 350 },
                { id: "footer-bg", type: "shape", shape: "rect", x: 0, y: 1000, width: 1080, height: 80, fill: "rgba(28,15,8,0.92)", selectable: false },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  workshop@studiokiz.es", x: 0, y: 1020, width: 1080, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.7)", fontStyle: "italic", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#1c0f08", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -200, y: 200, width: 900, height: 900, fill: "rgba(180,83,9,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 500, y: 500, width: 900, height: 900, fill: "rgba(154,52,18,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: -50, y: 1300, width: 800, height: 800, fill: "rgba(217,119,6,0.30)", opacity: 0.65, selectable: false },
                { id: "supra", type: "text", text: "MASTER WORKSHOP  ·  N° 12", x: 0, y: 150, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "700", textAlign: "center", charSpacing: 500 },
                { id: "title-1", type: "text", text: "Kizomba", x: 0, y: 190, width: 1080, fontSize: 150, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "& Tarraxinha", x: 0, y: 360, width: 1080, fontSize: 78, fontFamily: "Playfair Display, serif", color: "#d4a058", textAlign: "center", fontStyle: "italic" },
                { id: "desc", type: "text", text: "Abrazo cerrado, musicalidad lenta, raíces angoleñas.", x: 60, y: 480, width: 960, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.78)", fontStyle: "italic", textAlign: "center" },
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Kizomba-Joa%CC%83o%20y%20Catarina.png", x: 540, y: 560, scaleX: 1.1, scaleY: 1.1, originX: "center", originY: "top", shadow: { color: "rgba(212,160,88,0.65)", blur: 60, offsetX: 0, offsetY: 0 } },
                { id: "plate-line-t", type: "shape", shape: "rect", x: 80, y: 1280, width: 920, height: 1, fill: "#d4a058", selectable: false },
                { id: "plate-label", type: "text", text: "IMPARTEN", x: 0, y: 1300, width: 1080, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(212,160,88,0.75)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-names", type: "text", text: "João  &  Catarina", x: 0, y: 1325, width: 1080, fontSize: 50, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "plate-from", type: "text", text: "DESDE LISBOA · CAMPEONES DEL MUNDO 2024", x: 0, y: 1395, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "600", textAlign: "center", charSpacing: 400 },
                { id: "plate-line-b", type: "shape", shape: "rect", x: 80, y: 1430, width: 920, height: 1, fill: "#d4a058", selectable: false },
                { id: "box-1-bg", type: "shape", shape: "rect", x: 60, y: 1470, width: 310, height: 200, fill: "rgba(28,15,8,0.7)", stroke: "rgba(212,160,88,0.45)", strokeWidth: 1, selectable: false },
                { id: "b1-l", type: "text", text: "FECHA", x: 60, y: 1490, width: 310, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "b1-day", type: "text", text: "22", x: 60, y: 1510, width: 310, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "b1-month", type: "text", text: "NOV · SÁB", x: 60, y: 1628, width: 310, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", textAlign: "center", charSpacing: 250 },
                { id: "box-2-bg", type: "shape", shape: "rect", x: 385, y: 1470, width: 310, height: 200, fill: "rgba(28,15,8,0.7)", stroke: "rgba(212,160,88,0.45)", strokeWidth: 1, selectable: false },
                { id: "b2-l", type: "text", text: "HORARIO", x: 385, y: 1490, width: 310, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "b2-day", type: "text", text: "16 — 20H", x: 385, y: 1510, width: 310, fontSize: 50, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "b2-month", type: "text", text: "4H · 2 BLOQUES", x: 385, y: 1628, width: 310, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", textAlign: "center", charSpacing: 200 },
                { id: "box-3-bg", type: "shape", shape: "rect", x: 710, y: 1470, width: 310, height: 200, fill: "rgba(28,15,8,0.7)", stroke: "rgba(212,160,88,0.45)", strokeWidth: 1, selectable: false },
                { id: "b3-l", type: "text", text: "INVERSIÓN", x: 710, y: 1490, width: 310, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "b3-day", type: "text", text: "70€", x: 710, y: 1510, width: 310, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "b3-month", type: "text", text: "EARLY BIRD 60€", x: 710, y: 1628, width: 310, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", textAlign: "center", charSpacing: 200 },
                { id: "footer-where", type: "text", text: "STUDIO KIZ  ·  C/ MIRA EL RÍO ALTA 17  ·  MADRID", x: 0, y: 1750, width: 1080, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "600", textAlign: "center", charSpacing: 350 },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  workshop@studiokiz.es", x: 0, y: 1810, width: 1080, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", fontStyle: "italic", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#1c0f08", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: -100, width: 900, height: 900, fill: "rgba(180,83,9,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 1100, y: 100, width: 900, height: 900, fill: "rgba(154,52,18,0.40)", opacity: 0.7, selectable: false },
                { id: "supra", type: "text", text: "MASTER WORKSHOP · N° 12 · TEMPORADA 26/27", x: 80, y: 110, width: 1100, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "700", textAlign: "left", charSpacing: 500 },
                { id: "title-1", type: "text", text: "Kizomba", x: 80, y: 140, width: 1100, fontSize: 150, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "& Tarraxinha", x: 80, y: 305, width: 1100, fontSize: 70, fontFamily: "Playfair Display, serif", color: "#d4a058", textAlign: "left", fontStyle: "italic" },
                { id: "desc", type: "text", text: "Abrazo cerrado, musicalidad lenta, raíces angoleñas.", x: 80, y: 410, width: 1100, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.78)", fontStyle: "italic", textAlign: "left" },
                { id: "plate-label", type: "text", text: "IMPARTEN", x: 80, y: 475, width: 800, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(212,160,88,0.75)", fontWeight: "800", textAlign: "left", charSpacing: 500 },
                { id: "plate-names", type: "text", text: "João  &  Catarina  ·  Desde Lisboa", x: 80, y: 500, width: 1100, fontSize: 32, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "left", fontStyle: "italic" },
                { id: "box-1-bg", type: "shape", shape: "rect", x: 80, y: 570, width: 360, height: 170, fill: "rgba(28,15,8,0.7)", stroke: "rgba(212,160,88,0.45)", strokeWidth: 1, selectable: false },
                { id: "b1-l", type: "text", text: "FECHA", x: 80, y: 590, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "b1-day", type: "text", text: "SÁB 22 NOV", x: 80, y: 620, width: 360, fontSize: 38, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "b1-month", type: "text", text: "16:00 — 20:00 H", x: 80, y: 690, width: 360, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", textAlign: "center", charSpacing: 200 },
                { id: "box-2-bg", type: "shape", shape: "rect", x: 460, y: 570, width: 360, height: 170, fill: "rgba(28,15,8,0.7)", stroke: "rgba(212,160,88,0.45)", strokeWidth: 1, selectable: false },
                { id: "b2-l", type: "text", text: "INVERSIÓN", x: 460, y: 590, width: 360, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "b2-day", type: "text", text: "70€", x: 460, y: 615, width: 360, fontSize: 82, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "b2-month", type: "text", text: "EARLY BIRD 60€", x: 460, y: 710, width: 360, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", textAlign: "center", charSpacing: 200 },
                { id: "couple", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Kizomba-Joa%CC%83o%20y%20Catarina.png", x: 1440, y: 60, scaleX: 0.95, scaleY: 0.95, originX: "center", originY: "top", shadow: { color: "rgba(212,160,88,0.65)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "footer-where", type: "text", text: "STUDIO KIZ  ·  C/ MIRA EL RÍO ALTA 17  ·  MADRID", x: 80, y: 810, width: 1200, fontSize: 19, fontFamily: "Cormorant Garamond, serif", color: "#d4a058", fontWeight: "600", textAlign: "left", charSpacing: 300 },
                { id: "footer-cta", type: "text", text: "RESERVA  ·  workshop@studiokiz.es", x: 80, y: 855, width: 1200, fontSize: 15, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", fontStyle: "italic", textAlign: "left", charSpacing: 250 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 45 — Urbano Latino con Elena — solo, foto grande (REEMPLAZA duo anterior)
//      Coral+rojo bold con titulo masivo Anton, foto recortada a tope
// ─────────────────────────────────────────────────────────────────────
    {
        id: 45,
        title: "Urbano Latino con Elena",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Elena-grupales.png",
        premium: true,
        audience: ["academias", "instituciones"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO coral profundo
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#7f1d1d", selectable: false },
                // Halos calidos coral/naranja
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: -50, width: 800, height: 800, fill: "rgba(251,113,133,0.45)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 480, y: 400, width: 750, height: 750, fill: "rgba(249,115,22,0.40)", opacity: 0.65, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: -100, y: 900, width: 600, height: 600, fill: "rgba(244,63,94,0.35)", opacity: 0.6, selectable: false },

                // Etiqueta lateral vertical
                { id: "vert-label", type: "text", text: "URBAN  ·  LATIN  ·  TEMPORADA 26/27", x: 40, y: 670, width: 60, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "left", angle: -90, charSpacing: 500 },

                // FOTO ELENA grande dominante a la derecha
                { id: "elena", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Elena-grupales.png", x: 720, y: 60, scaleX: 1.45, scaleY: 1.45, originX: "center", originY: "top", shadow: { color: "rgba(253,224,71,0.55)", blur: 60, offsetX: 0, offsetY: 0 } },

                // CHIP arriba izquierda
                { id: "chip-bg", type: "shape", shape: "rect", x: 100, y: 90, width: 280, height: 42, fill: "transparent", radius: 21, stroke: "#fde047", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  CLASES GRUPALES  ·", x: 100, y: 100, width: 280, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 350 },

                // TITULO MASIVO orientado a izquierda
                { id: "title-1", type: "text", text: "URBANO", x: 80, y: 170, width: 540, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 20 },
                { id: "title-2", type: "text", text: "+ LATIN", x: 80, y: 305, width: 540, fontSize: 100, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "left", charSpacing: 30 },

                // Linea decorativa
                { id: "title-line", type: "shape", shape: "rect", x: 80, y: 425, width: 200, height: 5, fill: "#fde047", selectable: false },

                // Subtitulo
                { id: "subtitle-1", type: "text", text: "Tu academia se sube al ritmo.", x: 80, y: 450, width: 540, fontSize: 22, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.9)", fontStyle: "italic", textAlign: "left" },
                { id: "subtitle-2", type: "text", text: "Sesiones de grupo de hasta 20 personas.", x: 80, y: 485, width: 540, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.65)", fontWeight: "500", textAlign: "left" },

                // BLOQUE info pie (sin tapar la foto, banda angosta inferior)
                { id: "info-bg", type: "shape", shape: "rect", x: 0, y: 950, width: 1080, height: 400, fill: "rgba(15,5,5,0.92)", selectable: false },
                { id: "info-top-line", type: "shape", shape: "rect", x: 0, y: 950, width: 1080, height: 4, fill: "#fde047", selectable: false },

                // Nombre profe destacado
                { id: "profe-label", type: "text", text: "IMPARTE", x: 0, y: 985, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "profe-name", type: "text", text: "ELENA RUIZ", x: 0, y: 1010, width: 1080, fontSize: 52, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "profe-role", type: "text", text: "10 años en escuelas internacionales", x: 0, y: 1075, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.65)", fontStyle: "italic", textAlign: "center" },

                // Divider
                { id: "div", type: "shape", shape: "rect", x: 420, y: 1115, width: 240, height: 1, fill: "rgba(253,224,71,0.5)", selectable: false },

                // INFO grid 3 columnas
                { id: "i-1-l", type: "text", text: "DÍAS", x: 60, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-1-v", type: "text", text: "LUN · JUE", x: 60, y: 1162, width: 320, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "i-1-x", type: "text", text: "20:00 — 21:30", x: 60, y: 1208, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center" },

                { id: "i-2-l", type: "text", text: "PRECIO", x: 380, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-2-v", type: "text", text: "55€", x: 380, y: 1160, width: 320, fontSize: 40, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "i-2-x", type: "text", text: "BONO MENSUAL", x: 380, y: 1208, width: 320, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "600", textAlign: "center", charSpacing: 200 },

                { id: "i-3-l", type: "text", text: "DÓNDE", x: 700, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-3-v", type: "text", text: "Academia del Ritmo", x: 700, y: 1166, width: 320, fontSize: 17, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "i-3-x", type: "text", text: "Gran Vía 12 · Madrid", x: 700, y: 1198, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center" },

                // CTA pie
                { id: "cta-line", type: "shape", shape: "rect", x: 80, y: 1265, width: 920, height: 1, fill: "rgba(253,224,71,0.3)", selectable: false },
                { id: "cta", type: "text", text: "INSCRIBE TU GRUPO  ·  academiaritmo.es  ·  WhatsApp +34 600 444 555", x: 0, y: 1285, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 300 },
            ] },

            // ─── SQUARE 1080x1080 ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#7f1d1d", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: -50, width: 800, height: 800, fill: "rgba(251,113,133,0.45)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 480, y: 300, width: 750, height: 750, fill: "rgba(249,115,22,0.40)", opacity: 0.65, selectable: false },
                { id: "elena", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Elena-grupales.png", x: 720, y: 40, scaleX: 1.0, scaleY: 1.0, originX: "center", originY: "top", shadow: { color: "rgba(253,224,71,0.55)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "chip-bg", type: "shape", shape: "rect", x: 60, y: 70, width: 260, height: 38, fill: "transparent", radius: 19, stroke: "#fde047", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  CLASES GRUPALES  ·", x: 60, y: 78, width: 260, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 300 },
                { id: "title-1", type: "text", text: "URBANO", x: 60, y: 140, width: 540, fontSize: 100, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 20 },
                { id: "title-2", type: "text", text: "+ LATIN", x: 60, y: 245, width: 540, fontSize: 78, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "left", charSpacing: 30 },
                { id: "title-line", type: "shape", shape: "rect", x: 60, y: 340, width: 160, height: 5, fill: "#fde047", selectable: false },
                { id: "subtitle", type: "text", text: "Tu academia se sube al ritmo.", x: 60, y: 360, width: 540, fontSize: 20, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.9)", fontStyle: "italic", textAlign: "left" },
                { id: "info-bg", type: "shape", shape: "rect", x: 0, y: 760, width: 1080, height: 320, fill: "rgba(15,5,5,0.92)", selectable: false },
                { id: "info-top-line", type: "shape", shape: "rect", x: 0, y: 760, width: 1080, height: 3, fill: "#fde047", selectable: false },
                { id: "profe-label", type: "text", text: "IMPARTE", x: 0, y: 785, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "profe-name", type: "text", text: "ELENA RUIZ", x: 0, y: 805, width: 1080, fontSize: 42, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "i-1-l", type: "text", text: "DÍAS", x: 60, y: 880, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-1-v", type: "text", text: "LUN · JUE 20H", x: 60, y: 900, width: 320, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "i-2-l", type: "text", text: "BONO", x: 380, y: 880, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-2-v", type: "text", text: "55€ / MES", x: 380, y: 900, width: 320, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "i-3-l", type: "text", text: "DÓNDE", x: 700, y: 880, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-3-v", type: "text", text: "Academia Ritmo", x: 700, y: 904, width: 320, fontSize: 15, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "cta", type: "text", text: "INSCRIBE TU GRUPO · academiaritmo.es", x: 0, y: 1010, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 250 },
                { id: "cta-phone", type: "text", text: "+34 600 444 555", x: 0, y: 1045, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#7f1d1d", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: 100, width: 800, height: 800, fill: "rgba(251,113,133,0.45)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 480, y: 600, width: 750, height: 750, fill: "rgba(249,115,22,0.40)", opacity: 0.65, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: -100, y: 1400, width: 700, height: 700, fill: "rgba(244,63,94,0.35)", opacity: 0.6, selectable: false },
                { id: "chip-bg", type: "shape", shape: "rect", x: 380, y: 150, width: 320, height: 50, fill: "transparent", radius: 25, stroke: "#fde047", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  CLASES GRUPALES  ·", x: 0, y: 163, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 400 },
                { id: "title-1", type: "text", text: "URBANO", x: 0, y: 240, width: 1080, fontSize: 160, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 20 },
                { id: "title-2", type: "text", text: "+ LATIN", x: 0, y: 405, width: 1080, fontSize: 120, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 30 },
                { id: "elena", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Elena-grupales.png", x: 540, y: 580, scaleX: 1.8, scaleY: 1.8, originX: "center", originY: "top", shadow: { color: "rgba(253,224,71,0.55)", blur: 70, offsetX: 0, offsetY: 0 } },
                { id: "info-bg", type: "shape", shape: "rect", x: 0, y: 1380, width: 1080, height: 540, fill: "rgba(15,5,5,0.92)", selectable: false },
                { id: "info-top-line", type: "shape", shape: "rect", x: 0, y: 1380, width: 1080, height: 4, fill: "#fde047", selectable: false },
                { id: "profe-label", type: "text", text: "IMPARTE", x: 0, y: 1415, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "profe-name", type: "text", text: "ELENA RUIZ", x: 0, y: 1445, width: 1080, fontSize: 58, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "profe-role", type: "text", text: "10 años en escuelas internacionales", x: 0, y: 1515, width: 1080, fontSize: 19, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.65)", fontStyle: "italic", textAlign: "center" },
                { id: "div", type: "shape", shape: "rect", x: 460, y: 1565, width: 160, height: 1, fill: "rgba(253,224,71,0.5)", selectable: false },
                { id: "i-1-l", type: "text", text: "DÍAS", x: 60, y: 1595, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-1-v", type: "text", text: "LUN · JUE", x: 60, y: 1620, width: 320, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "i-1-x", type: "text", text: "20:00 — 21:30", x: 60, y: 1670, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center" },
                { id: "i-2-l", type: "text", text: "BONO MES", x: 380, y: 1595, width: 320, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-2-v", type: "text", text: "55€", x: 380, y: 1615, width: 320, fontSize: 46, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "i-2-x", type: "text", text: "TODAS LAS CLASES", x: 380, y: 1672, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "600", textAlign: "center", charSpacing: 200 },
                { id: "i-3-l", type: "text", text: "DÓNDE", x: 700, y: 1595, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-3-v", type: "text", text: "Academia Ritmo", x: 700, y: 1625, width: 320, fontSize: 18, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "i-3-x", type: "text", text: "Gran Vía 12 · Madrid", x: 700, y: 1665, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center" },
                { id: "cta-line", type: "shape", shape: "rect", x: 80, y: 1750, width: 920, height: 1, fill: "rgba(253,224,71,0.3)", selectable: false },
                { id: "cta", type: "text", text: "INSCRIBE TU GRUPO  ·  academiaritmo.es", x: 0, y: 1775, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 300 },
                { id: "cta-phone", type: "text", text: "WhatsApp +34 600 444 555", x: 0, y: 1830, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#7f1d1d", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: -100, width: 900, height: 900, fill: "rgba(251,113,133,0.45)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 1100, y: 100, width: 900, height: 900, fill: "rgba(249,115,22,0.40)", opacity: 0.65, selectable: false },
                { id: "chip-bg", type: "shape", shape: "rect", x: 80, y: 80, width: 260, height: 38, fill: "transparent", radius: 19, stroke: "#fde047", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  CLASES GRUPALES  ·", x: 80, y: 88, width: 260, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "center", charSpacing: 300 },
                { id: "title-1", type: "text", text: "URBANO", x: 80, y: 150, width: 900, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 20 },
                { id: "title-2", type: "text", text: "+ LATIN", x: 80, y: 290, width: 900, fontSize: 90, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "left", charSpacing: 30 },
                { id: "title-line", type: "shape", shape: "rect", x: 80, y: 400, width: 200, height: 5, fill: "#fde047", selectable: false },
                { id: "subtitle", type: "text", text: "Tu academia se sube al ritmo.", x: 80, y: 420, width: 900, fontSize: 22, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.9)", fontStyle: "italic", textAlign: "left" },
                { id: "elena", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Elena-grupales.png", x: 1500, y: 60, scaleX: 0.9, scaleY: 0.9, originX: "center", originY: "top", shadow: { color: "rgba(253,224,71,0.55)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "profe-label", type: "text", text: "IMPARTE", x: 80, y: 510, width: 800, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "800", textAlign: "left", charSpacing: 500 },
                { id: "profe-name", type: "text", text: "ELENA RUIZ  ·  Coreógrafa", x: 80, y: 535, width: 1100, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "info-1", type: "text", text: "LUN · JUE 20:00 — 21:30  ·  BONO MES 55€", x: 80, y: 610, width: 1100, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "left", charSpacing: 150 },
                { id: "info-2", type: "text", text: "Academia del Ritmo  ·  Gran Vía 12  ·  Madrid", x: 80, y: 655, width: 1100, fontSize: 20, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.85)", textAlign: "left", fontStyle: "italic" },
                { id: "cta-line", type: "shape", shape: "rect", x: 80, y: 720, width: 360, height: 2, fill: "#fde047", selectable: false },
                { id: "cta", type: "text", text: "INSCRIBE TU GRUPO  ·  academiaritmo.es", x: 80, y: 740, width: 1100, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", textAlign: "left", charSpacing: 250 },
                { id: "cta-phone", type: "text", text: "WhatsApp +34 600 444 555", x: 80, y: 780, width: 1100, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "left", charSpacing: 200 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 46 — Urbano Latino con Marco — solo, foto grande (NUEVO)
//      Azul electrico/cyan dinamico, titulo lateral, foto recortada izquierda
// ─────────────────────────────────────────────────────────────────────
    {
        id: 46,
        title: "Urbano Latino con Marco",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Marco_grupales.png",
        premium: true,
        audience: ["academias", "instituciones"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO azul electrico profundo
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0c1a3d", selectable: false },
                // Halos cyan/azul
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: 200, width: 800, height: 800, fill: "rgba(34,211,238,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 580, y: -50, width: 700, height: 700, fill: "rgba(59,130,246,0.50)", opacity: 0.7, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: 100, y: 800, width: 700, height: 700, fill: "rgba(168,85,247,0.30)", opacity: 0.6, selectable: false },

                // Barras laterales electric blue (sugieren movimiento)
                { id: "bar-1", type: "shape", shape: "rect", x: 950, y: 100, width: 6, height: 240, fill: "#22d3ee", angle: -8, selectable: false },
                { id: "bar-2", type: "shape", shape: "rect", x: 1020, y: 220, width: 4, height: 180, fill: "#22d3ee", angle: -8, opacity: 0.7, selectable: false },
                { id: "bar-3", type: "shape", shape: "rect", x: 60, y: 460, width: 6, height: 240, fill: "#fde047", angle: 8, selectable: false },
                { id: "bar-4", type: "shape", shape: "rect", x: 30, y: 580, width: 4, height: 180, fill: "#fde047", angle: 8, opacity: 0.7, selectable: false },

                // Etiqueta lateral vertical
                { id: "vert-label", type: "text", text: "URBAN  ·  LATIN  ·  GROUPS", x: 1015, y: 970, width: 60, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "left", angle: 90, charSpacing: 500 },

                // CHIP arriba derecha
                { id: "chip-bg", type: "shape", shape: "rect", x: 700, y: 90, width: 280, height: 42, fill: "transparent", radius: 21, stroke: "#22d3ee", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  ACADEMIA / EVENTOS  ·", x: 700, y: 100, width: 280, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 250 },

                // FOTO MARCO grande dominante a la izquierda
                { id: "marco", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Marco_grupales.png", x: 380, y: 60, scaleX: 1.45, scaleY: 1.45, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.65)", blur: 65, offsetX: 0, offsetY: 0 } },

                // TITULO orientado a derecha
                { id: "title-1", type: "text", text: "MARCO", x: 480, y: 170, width: 540, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "right", charSpacing: 60 },
                { id: "title-2", type: "text", text: "URBAN LATIN", x: 480, y: 305, width: 540, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "right", charSpacing: 100 },

                // Linea decorativa der
                { id: "title-line", type: "shape", shape: "rect", x: 820, y: 390, width: 200, height: 5, fill: "#22d3ee", selectable: false },

                // Subtitulo der
                { id: "subtitle-1", type: "text", text: "Coreografía moderna y movimiento.", x: 480, y: 415, width: 540, fontSize: 20, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.9)", fontStyle: "italic", textAlign: "right" },
                { id: "subtitle-2", type: "text", text: "Para grupos de academia o evento.", x: 480, y: 448, width: 540, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.65)", fontWeight: "500", textAlign: "right" },

                // BLOQUE info pie
                { id: "info-bg", type: "shape", shape: "rect", x: 0, y: 950, width: 1080, height: 400, fill: "rgba(4,8,20,0.92)", selectable: false },
                { id: "info-top-line", type: "shape", shape: "rect", x: 0, y: 950, width: 1080, height: 4, fill: "#22d3ee", selectable: false },

                // Nombre profe destacado
                { id: "profe-label", type: "text", text: "IMPARTE", x: 0, y: 985, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "profe-name", type: "text", text: "MARCO SILVA", x: 0, y: 1010, width: 1080, fontSize: 52, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "profe-role", type: "text", text: "Coreógrafo · Producciones audiovisuales", x: 0, y: 1075, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.65)", fontStyle: "italic", textAlign: "center" },

                // Divider
                { id: "div", type: "shape", shape: "rect", x: 420, y: 1115, width: 240, height: 1, fill: "rgba(34,211,238,0.5)", selectable: false },

                // INFO grid 3 columnas
                { id: "i-1-l", type: "text", text: "DÍAS", x: 60, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-1-v", type: "text", text: "MAR · VIE", x: 60, y: 1162, width: 320, fontSize: 30, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "i-1-x", type: "text", text: "19:00 — 20:30", x: 60, y: 1208, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center" },

                { id: "i-2-l", type: "text", text: "PRECIO", x: 380, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-2-v", type: "text", text: "60€", x: 380, y: 1160, width: 320, fontSize: 40, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "i-2-x", type: "text", text: "BONO MENSUAL", x: 380, y: 1208, width: 320, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "600", textAlign: "center", charSpacing: 200 },

                { id: "i-3-l", type: "text", text: "DÓNDE", x: 700, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-3-v", type: "text", text: "Academia del Ritmo", x: 700, y: 1166, width: 320, fontSize: 17, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "i-3-x", type: "text", text: "Gran Vía 12 · Madrid", x: 700, y: 1198, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center" },

                // CTA pie
                { id: "cta-line", type: "shape", shape: "rect", x: 80, y: 1265, width: 920, height: 1, fill: "rgba(34,211,238,0.3)", selectable: false },
                { id: "cta", type: "text", text: "INFO Y RESERVA  ·  academiaritmo.es  ·  +34 600 444 555", x: 0, y: 1285, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 300 },
            ] },

            // ─── SQUARE 1080x1080 ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#0c1a3d", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: 0, width: 800, height: 800, fill: "rgba(34,211,238,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 580, y: 300, width: 700, height: 700, fill: "rgba(59,130,246,0.50)", opacity: 0.7, selectable: false },
                { id: "marco", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Marco_grupales.png", x: 360, y: 40, scaleX: 1.0, scaleY: 1.0, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.65)", blur: 55, offsetX: 0, offsetY: 0 } },
                { id: "chip-bg", type: "shape", shape: "rect", x: 760, y: 70, width: 260, height: 38, fill: "transparent", radius: 19, stroke: "#22d3ee", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  ACADEMIA / EVENTOS  ·", x: 760, y: 78, width: 260, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 250 },
                { id: "title-1", type: "text", text: "MARCO", x: 480, y: 140, width: 540, fontSize: 100, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "right", charSpacing: 40 },
                { id: "title-2", type: "text", text: "URBAN LATIN", x: 480, y: 245, width: 540, fontSize: 48, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "right", charSpacing: 100 },
                { id: "title-line", type: "shape", shape: "rect", x: 860, y: 320, width: 160, height: 5, fill: "#22d3ee", selectable: false },
                { id: "subtitle", type: "text", text: "Coreografía moderna y movimiento.", x: 480, y: 340, width: 540, fontSize: 19, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.9)", fontStyle: "italic", textAlign: "right" },
                { id: "info-bg", type: "shape", shape: "rect", x: 0, y: 760, width: 1080, height: 320, fill: "rgba(4,8,20,0.92)", selectable: false },
                { id: "info-top-line", type: "shape", shape: "rect", x: 0, y: 760, width: 1080, height: 3, fill: "#22d3ee", selectable: false },
                { id: "profe-label", type: "text", text: "IMPARTE", x: 0, y: 785, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "profe-name", type: "text", text: "MARCO SILVA", x: 0, y: 805, width: 1080, fontSize: 42, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "i-1-l", type: "text", text: "DÍAS", x: 60, y: 880, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-1-v", type: "text", text: "MAR · VIE 19H", x: 60, y: 900, width: 320, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "i-2-l", type: "text", text: "BONO", x: 380, y: 880, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-2-v", type: "text", text: "60€ / MES", x: 380, y: 900, width: 320, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "i-3-l", type: "text", text: "DÓNDE", x: 700, y: 880, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-3-v", type: "text", text: "Academia Ritmo", x: 700, y: 904, width: 320, fontSize: 15, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "cta", type: "text", text: "INFO Y RESERVA · academiaritmo.es", x: 0, y: 1010, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 250 },
                { id: "cta-phone", type: "text", text: "+34 600 444 555", x: 0, y: 1045, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0c1a3d", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -150, y: 200, width: 800, height: 800, fill: "rgba(34,211,238,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 580, y: 600, width: 700, height: 700, fill: "rgba(59,130,246,0.50)", opacity: 0.7, selectable: false },
                { id: "halo-3", type: "shape", shape: "circle", x: 100, y: 1300, width: 700, height: 700, fill: "rgba(168,85,247,0.30)", opacity: 0.6, selectable: false },
                { id: "chip-bg", type: "shape", shape: "rect", x: 380, y: 150, width: 320, height: 50, fill: "transparent", radius: 25, stroke: "#22d3ee", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  ACADEMIA / EVENTOS  ·", x: 0, y: 163, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 300 },
                { id: "title-1", type: "text", text: "MARCO", x: 0, y: 240, width: 1080, fontSize: 170, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40 },
                { id: "title-2", type: "text", text: "URBAN LATIN", x: 0, y: 415, width: 1080, fontSize: 70, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 100 },
                { id: "marco", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Marco_grupales.png", x: 540, y: 540, scaleX: 1.8, scaleY: 1.8, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.65)", blur: 80, offsetX: 0, offsetY: 0 } },
                { id: "info-bg", type: "shape", shape: "rect", x: 0, y: 1380, width: 1080, height: 540, fill: "rgba(4,8,20,0.92)", selectable: false },
                { id: "info-top-line", type: "shape", shape: "rect", x: 0, y: 1380, width: 1080, height: 4, fill: "#22d3ee", selectable: false },
                { id: "profe-label", type: "text", text: "IMPARTE", x: 0, y: 1415, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.7)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "profe-name", type: "text", text: "MARCO SILVA", x: 0, y: 1445, width: 1080, fontSize: 58, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "profe-role", type: "text", text: "Coreógrafo · Producciones audiovisuales", x: 0, y: 1515, width: 1080, fontSize: 16, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.65)", fontStyle: "italic", textAlign: "center" },
                { id: "div", type: "shape", shape: "rect", x: 460, y: 1565, width: 160, height: 1, fill: "rgba(34,211,238,0.5)", selectable: false },
                { id: "i-1-l", type: "text", text: "DÍAS", x: 60, y: 1595, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-1-v", type: "text", text: "MAR · VIE", x: 60, y: 1620, width: 320, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 80 },
                { id: "i-1-x", type: "text", text: "19:00 — 20:30", x: 60, y: 1670, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center" },
                { id: "i-2-l", type: "text", text: "BONO MES", x: 380, y: 1595, width: 320, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-2-v", type: "text", text: "60€", x: 380, y: 1615, width: 320, fontSize: 46, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "i-3-l", type: "text", text: "DÓNDE", x: 700, y: 1595, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-3-v", type: "text", text: "Academia Ritmo", x: 700, y: 1625, width: 320, fontSize: 18, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", fontStyle: "italic" },
                { id: "i-3-x", type: "text", text: "Gran Vía 12 · Madrid", x: 700, y: 1665, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center" },
                { id: "cta", type: "text", text: "INFO Y RESERVA  ·  academiaritmo.es", x: 0, y: 1775, width: 1080, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 300 },
                { id: "cta-phone", type: "text", text: "+34 600 444 555", x: 0, y: 1830, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "center", charSpacing: 250 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#0c1a3d", selectable: false },
                { id: "halo-1", type: "shape", shape: "circle", x: -100, y: 200, width: 900, height: 900, fill: "rgba(34,211,238,0.40)", opacity: 0.7, selectable: false },
                { id: "halo-2", type: "shape", shape: "circle", x: 1100, y: 0, width: 900, height: 900, fill: "rgba(59,130,246,0.50)", opacity: 0.7, selectable: false },
                { id: "marco", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Marco_grupales.png", x: 380, y: 50, scaleX: 0.95, scaleY: 0.95, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.65)", blur: 55, offsetX: 0, offsetY: 0 } },
                { id: "chip-bg", type: "shape", shape: "rect", x: 800, y: 80, width: 280, height: 38, fill: "transparent", radius: 19, stroke: "#22d3ee", strokeWidth: 2, selectable: false },
                { id: "chip-label", type: "text", text: "·  ACADEMIA / EVENTOS  ·", x: 800, y: 88, width: 280, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 250 },
                { id: "title-1", type: "text", text: "MARCO", x: 780, y: 140, width: 1100, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 40 },
                { id: "title-2", type: "text", text: "URBAN LATIN", x: 780, y: 285, width: 1100, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "left", charSpacing: 100 },
                { id: "title-line", type: "shape", shape: "rect", x: 780, y: 380, width: 200, height: 5, fill: "#22d3ee", selectable: false },
                { id: "subtitle", type: "text", text: "Coreografía moderna y movimiento.", x: 780, y: 400, width: 1100, fontSize: 22, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.9)", fontStyle: "italic", textAlign: "left" },
                { id: "profe-label", type: "text", text: "IMPARTE", x: 780, y: 490, width: 800, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "800", textAlign: "left", charSpacing: 500 },
                { id: "profe-name", type: "text", text: "MARCO SILVA  ·  Coreógrafo", x: 780, y: 515, width: 1100, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 100 },
                { id: "info-1", type: "text", text: "MAR · VIE 19:00 — 20:30  ·  BONO MES 60€", x: 780, y: 595, width: 1100, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "left", charSpacing: 150 },
                { id: "info-2", type: "text", text: "Academia del Ritmo  ·  Gran Vía 12  ·  Madrid", x: 780, y: 640, width: 1100, fontSize: 20, fontFamily: "Playfair Display, serif", color: "rgba(255,255,255,0.85)", textAlign: "left", fontStyle: "italic" },
                { id: "cta-line", type: "shape", shape: "rect", x: 780, y: 700, width: 360, height: 2, fill: "#22d3ee", selectable: false },
                { id: "cta", type: "text", text: "INFO Y RESERVA  ·  academiaritmo.es", x: 780, y: 720, width: 1100, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "left", charSpacing: 250 },
                { id: "cta-phone", type: "text", text: "+34 600 444 555  ·  WhatsApp", x: 780, y: 760, width: 1100, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.7)", fontWeight: "500", textAlign: "left", charSpacing: 200 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 47 — Baile Mayores con Martha — solo, foto grande (NUEVO)
//      Calido lifestyle. Azul polvoroso + crema + ambar. "El baile no tiene edad"
// ─────────────────────────────────────────────────────────────────────
    {
        id: 47,
        title: "Baile Mayores con Martha",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores%20-Martha-grupo.png",
        premium: false,
        audience: ["academias", "instituciones"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO crema calido
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#f7eed8", selectable: false },
                // Banda azul polvoroso superior (cabecera)
                { id: "header-band", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 280, fill: "#5b7a99", selectable: false },
                // Wave curve simulada con circulo grande sobresaliente
                { id: "wave", type: "shape", shape: "circle", x: -300, y: 180, width: 1680, height: 320, fill: "#5b7a99", originX: "left", originY: "top", selectable: false },

                // CABECERA decorativa
                { id: "kicker", type: "text", text: "C E N T R O   M A Y O R E S   ·   2 0 2 6 / 2 7", x: 0, y: 50, width: 1080, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "700", textAlign: "center", charSpacing: 700 },

                // TITULO grande Playfair italica
                { id: "title-1", type: "text", text: "El baile", x: 0, y: 80, width: 1080, fontSize: 88, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "no tiene edad", x: 0, y: 180, width: 1080, fontSize: 52, fontFamily: "Playfair Display, serif", color: "#fde68a", textAlign: "center", fontStyle: "italic" },

                // FOTO MARTHA grande centrada (con marco crema)
                { id: "frame-bg", type: "shape", shape: "rect", x: 140, y: 320, width: 800, height: 620, fill: "#ffffff", stroke: "rgba(91,122,153,0.25)", strokeWidth: 2, selectable: false },
                { id: "frame-inner", type: "shape", shape: "rect", x: 160, y: 340, width: 760, height: 540, fill: "#e6dcc4", selectable: false },
                { id: "martha", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores%20-Martha-grupo.png", x: 540, y: 340, scaleX: 1.35, scaleY: 1.35, originX: "center", originY: "top", shadow: { color: "rgba(91,122,153,0.55)", blur: 35, offsetX: 0, offsetY: 8 } },

                // Caption Martha
                { id: "caption-label", type: "text", text: "COORDINA  ·  IMPARTE", x: 140, y: 895, width: 800, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.8)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "caption-name", type: "text", text: "Martha González", x: 140, y: 915, width: 800, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "center", fontStyle: "italic" },

                // ─── BLOQUE INFO INFERIOR ───
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 960, width: 1080, height: 390, fill: "#ffffff", selectable: false },
                { id: "info-band-top", type: "shape", shape: "rect", x: 0, y: 960, width: 1080, height: 4, fill: "#d97706", selectable: false },

                // Descripcion calida
                { id: "desc", type: "text", text: "Ritmo, equilibrio, memoria y mucha alegría.", x: 60, y: 985, width: 960, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#5b7a99", textAlign: "center", fontStyle: "italic" },

                // Lista de generos en chips suaves
                { id: "chip-1-bg", type: "shape", shape: "rect", x: 130, y: 1025, width: 200, height: 46, fill: "#fde68a", radius: 23, selectable: false },
                { id: "chip-1", type: "text", text: "BACHATA SUAVE", x: 130, y: 1038, width: 200, fontSize: 21, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },

                { id: "chip-2-bg", type: "shape", shape: "rect", x: 350, y: 1025, width: 200, height: 46, fill: "#fde68a", radius: 23, selectable: false },
                { id: "chip-2", type: "text", text: "PASODOBLE", x: 350, y: 1038, width: 200, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },

                { id: "chip-3-bg", type: "shape", shape: "rect", x: 570, y: 1025, width: 180, height: 46, fill: "#fde68a", radius: 23, selectable: false },
                { id: "chip-3", type: "text", text: "VALS LENTO", x: 570, y: 1038, width: 180, fontSize: 21, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },

                { id: "chip-4-bg", type: "shape", shape: "rect", x: 770, y: 1025, width: 180, height: 46, fill: "#fde68a", radius: 23, selectable: false },
                { id: "chip-4", type: "text", text: "MERENGUE", x: 770, y: 1038, width: 180, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },

                // ─── DETALLES PRACTICOS grid 4 columnas ───
                { id: "details-1-l", type: "text", text: "DÍAS", x: 60, y: 1110, width: 240, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-1-v", type: "text", text: "MAR  ·  JUE", x: 60, y: 1128, width: 240, fontSize: 24, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "left", fontStyle: "italic" },

                { id: "details-2-l", type: "text", text: "HORA", x: 330, y: 1110, width: 240, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-2-v", type: "text", text: "11:00 H", x: 330, y: 1128, width: 240, fontSize: 24, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "left", fontStyle: "italic" },

                { id: "details-3-l", type: "text", text: "PRECIO", x: 580, y: 1110, width: 240, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-3-v", type: "text", text: "30€ / mes", x: 580, y: 1128, width: 240, fontSize: 24, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "left", fontStyle: "italic" },

                { id: "details-4-l", type: "text", text: "PARA", x: 830, y: 1110, width: 240, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-4-v", type: "text", text: "+55 años", x: 830, y: 1128, width: 240, fontSize: 24, fontFamily: "Playfair Display, serif", color: "#d97706", textAlign: "left", fontStyle: "italic" },

                // Linea separadora
                { id: "info-sep", type: "shape", shape: "rect", x: 60, y: 1190, width: 960, height: 1, fill: "rgba(91,122,153,0.3)", selectable: false },

                // CTA pie
                { id: "footer-1", type: "text", text: "Centro Cultural La Plaza  ·  Goya 88  ·  Madrid", x: 0, y: 1210, width: 1080, fontSize: 19, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "center", fontStyle: "italic" },
                { id: "footer-2", type: "text", text: "INFORMACIÓN  ·  +34 600 555 666  ·  WHATSAPP", x: 0, y: 1255, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#5b7a99", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "footer-3", type: "text", text: "primera sesión gratuita", x: 0, y: 1295, width: 1080, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "#d97706", fontStyle: "italic", textAlign: "center", charSpacing: 100 },
            ] },

            // ─── SQUARE 1080x1080 ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#f7eed8", selectable: false },
                { id: "header-band", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 240, fill: "#5b7a99", selectable: false },
                { id: "wave", type: "shape", shape: "circle", x: -300, y: 160, width: 1680, height: 240, fill: "#5b7a99", originX: "left", originY: "top", selectable: false },
                { id: "kicker", type: "text", text: "C E N T R O   M A Y O R E S   ·   2 6 / 2 7", x: 0, y: 50, width: 1080, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "700", textAlign: "center", charSpacing: 700 },
                { id: "title-1", type: "text", text: "El baile", x: 0, y: 80, width: 1080, fontSize: 70, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "no tiene edad", x: 0, y: 158, width: 1080, fontSize: 42, fontFamily: "Playfair Display, serif", color: "#fde68a", textAlign: "center", fontStyle: "italic" },
                { id: "frame-bg", type: "shape", shape: "rect", x: 240, y: 270, width: 600, height: 480, fill: "#ffffff", stroke: "rgba(91,122,153,0.25)", strokeWidth: 2, selectable: false },
                { id: "frame-inner", type: "shape", shape: "rect", x: 260, y: 290, width: 560, height: 400, fill: "#e6dcc4", selectable: false },
                { id: "martha", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores%20-Martha-grupo.png", x: 540, y: 290, scaleX: 1.05, scaleY: 1.05, originX: "center", originY: "top", shadow: { color: "rgba(91,122,153,0.55)", blur: 30, offsetX: 0, offsetY: 8 } },
                { id: "caption-label", type: "text", text: "COORDINA · IMPARTE", x: 240, y: 705, width: 600, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.8)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "caption-name", type: "text", text: "Martha González", x: 240, y: 725, width: 600, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "center", fontStyle: "italic" },
                { id: "chip-1-bg", type: "shape", shape: "rect", x: 130, y: 800, width: 200, height: 42, fill: "#fde68a", radius: 21, selectable: false },
                { id: "chip-1", type: "text", text: "BACHATA SUAVE", x: 130, y: 812, width: 200, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "chip-2-bg", type: "shape", shape: "rect", x: 350, y: 800, width: 180, height: 42, fill: "#fde68a", radius: 21, selectable: false },
                { id: "chip-2", type: "text", text: "PASODOBLE", x: 350, y: 812, width: 180, fontSize: 21, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "chip-3-bg", type: "shape", shape: "rect", x: 550, y: 800, width: 180, height: 42, fill: "#fde68a", radius: 21, selectable: false },
                { id: "chip-3", type: "text", text: "VALS LENTO", x: 550, y: 812, width: 180, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "chip-4-bg", type: "shape", shape: "rect", x: 750, y: 800, width: 180, height: 42, fill: "#fde68a", radius: 21, selectable: false },
                { id: "chip-4", type: "text", text: "MERENGUE", x: 750, y: 812, width: 180, fontSize: 21, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "info", type: "text", text: "MAR · JUE  ·  11:00 H  ·  30€/mes  ·  +55 años", x: 0, y: 880, width: 1080, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "center", fontStyle: "italic" },
                { id: "info-sep", type: "shape", shape: "rect", x: 60, y: 925, width: 960, height: 1, fill: "rgba(91,122,153,0.3)", selectable: false },
                { id: "footer-1", type: "text", text: "Centro Cultural La Plaza  ·  Goya 88  ·  Madrid", x: 0, y: 945, width: 1080, fontSize: 18, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "center", fontStyle: "italic" },
                { id: "footer-2", type: "text", text: "INFO  ·  +34 600 555 666  ·  WHATSAPP", x: 0, y: 980, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#5b7a99", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "footer-3", type: "text", text: "primera sesión gratuita", x: 0, y: 1015, width: 1080, fontSize: 15, fontFamily: "Cormorant Garamond, serif", color: "#d97706", fontStyle: "italic", textAlign: "center", charSpacing: 100 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#f7eed8", selectable: false },
                { id: "header-band", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 420, fill: "#5b7a99", selectable: false },
                { id: "wave", type: "shape", shape: "circle", x: -300, y: 320, width: 1680, height: 320, fill: "#5b7a99", originX: "left", originY: "top", selectable: false },
                { id: "kicker", type: "text", text: "C E N T R O   M A Y O R E S   ·   2 0 2 6 / 2 7", x: 0, y: 130, width: 1080, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "700", textAlign: "center", charSpacing: 700 },
                { id: "title-1", type: "text", text: "El baile", x: 0, y: 165, width: 1080, fontSize: 110, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "no tiene edad", x: 0, y: 290, width: 1080, fontSize: 70, fontFamily: "Playfair Display, serif", color: "#fde68a", textAlign: "center", fontStyle: "italic" },
                { id: "frame-bg", type: "shape", shape: "rect", x: 100, y: 470, width: 880, height: 700, fill: "#ffffff", stroke: "rgba(91,122,153,0.25)", strokeWidth: 2, selectable: false },
                { id: "frame-inner", type: "shape", shape: "rect", x: 120, y: 490, width: 840, height: 620, fill: "#e6dcc4", selectable: false },
                { id: "martha", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores%20-Martha-grupo.png", x: 540, y: 490, scaleX: 1.55, scaleY: 1.55, originX: "center", originY: "top", shadow: { color: "rgba(91,122,153,0.55)", blur: 35, offsetX: 0, offsetY: 8 } },
                { id: "caption-label", type: "text", text: "COORDINA  ·  IMPARTE", x: 100, y: 1125, width: 880, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.8)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "caption-name", type: "text", text: "Martha González", x: 100, y: 1145, width: 880, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "center", fontStyle: "italic" },
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 1210, width: 1080, height: 710, fill: "#ffffff", selectable: false },
                { id: "info-band-top", type: "shape", shape: "rect", x: 0, y: 1210, width: 1080, height: 4, fill: "#d97706", selectable: false },
                { id: "desc", type: "text", text: "Ritmo, equilibrio, memoria y mucha alegría.", x: 60, y: 1245, width: 960, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#5b7a99", textAlign: "center", fontStyle: "italic" },
                { id: "chip-1-bg", type: "shape", shape: "rect", x: 130, y: 1300, width: 200, height: 50, fill: "#fde68a", radius: 25, selectable: false },
                { id: "chip-1", type: "text", text: "BACHATA SUAVE", x: 130, y: 1315, width: 200, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "chip-2-bg", type: "shape", shape: "rect", x: 350, y: 1300, width: 200, height: 50, fill: "#fde68a", radius: 25, selectable: false },
                { id: "chip-2", type: "text", text: "PASODOBLE", x: 350, y: 1315, width: 200, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "chip-3-bg", type: "shape", shape: "rect", x: 570, y: 1300, width: 180, height: 50, fill: "#fde68a", radius: 25, selectable: false },
                { id: "chip-3", type: "text", text: "VALS LENTO", x: 570, y: 1315, width: 180, fontSize: 19, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "chip-4-bg", type: "shape", shape: "rect", x: 770, y: 1300, width: 180, height: 50, fill: "#fde68a", radius: 25, selectable: false },
                { id: "chip-4", type: "text", text: "MERENGUE", x: 770, y: 1315, width: 180, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "details-1-l", type: "text", text: "DÍAS", x: 60, y: 1400, width: 240, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-1-v", type: "text", text: "MAR  ·  JUE", x: 60, y: 1420, width: 240, fontSize: 28, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "left", fontStyle: "italic" },
                { id: "details-2-l", type: "text", text: "HORA", x: 330, y: 1400, width: 240, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-2-v", type: "text", text: "11:00 H", x: 330, y: 1420, width: 240, fontSize: 28, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "left", fontStyle: "italic" },
                { id: "details-3-l", type: "text", text: "PRECIO", x: 580, y: 1400, width: 240, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-3-v", type: "text", text: "30€ / mes", x: 580, y: 1420, width: 240, fontSize: 28, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "left", fontStyle: "italic" },
                { id: "details-4-l", type: "text", text: "PARA", x: 830, y: 1400, width: 240, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-4-v", type: "text", text: "+55 años", x: 830, y: 1420, width: 240, fontSize: 28, fontFamily: "Playfair Display, serif", color: "#d97706", textAlign: "left", fontStyle: "italic" },
                { id: "info-sep", type: "shape", shape: "rect", x: 60, y: 1480, width: 960, height: 1, fill: "rgba(91,122,153,0.3)", selectable: false },
                { id: "footer-1", type: "text", text: "Centro Cultural La Plaza  ·  Goya 88  ·  Madrid", x: 0, y: 1740, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "center", fontStyle: "italic" },
                { id: "footer-2", type: "text", text: "INFORMACIÓN  ·  +34 600 555 666  ·  WHATSAPP", x: 0, y: 1790, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#5b7a99", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "footer-3", type: "text", text: "primera sesión gratuita", x: 0, y: 1840, width: 1080, fontSize: 18, fontFamily: "Cormorant Garamond, serif", color: "#d97706", fontStyle: "italic", textAlign: "center", charSpacing: 100 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#f7eed8", selectable: false },
                { id: "header-band", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 220, fill: "#5b7a99", selectable: false },
                { id: "wave", type: "shape", shape: "circle", x: -300, y: 140, width: 2700, height: 220, fill: "#5b7a99", originX: "left", originY: "top", selectable: false },
                { id: "kicker", type: "text", text: "C E N T R O   M A Y O R E S   ·   2 6 / 2 7", x: 0, y: 50, width: 1920, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#fde68a", fontWeight: "700", textAlign: "center", charSpacing: 700 },
                { id: "title-1", type: "text", text: "El baile no tiene edad", x: 0, y: 85, width: 1920, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "frame-bg", type: "shape", shape: "rect", x: 80, y: 270, width: 700, height: 600, fill: "#ffffff", stroke: "rgba(91,122,153,0.25)", strokeWidth: 2, selectable: false },
                { id: "frame-inner", type: "shape", shape: "rect", x: 100, y: 290, width: 660, height: 520, fill: "#e6dcc4", selectable: false },
                { id: "martha", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores%20-Martha-grupo.png", x: 430, y: 290, scaleX: 1.15, scaleY: 1.15, originX: "center", originY: "top", shadow: { color: "rgba(91,122,153,0.55)", blur: 30, offsetX: 0, offsetY: 8 } },
                { id: "caption-name", type: "text", text: "Martha González · Coordina e imparte", x: 80, y: 830, width: 700, fontSize: 19, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "center", fontStyle: "italic" },
                { id: "desc", type: "text", text: "Ritmo, equilibrio, memoria y alegría.", x: 820, y: 280, width: 1050, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#5b7a99", textAlign: "left", fontStyle: "italic" },
                { id: "chip-1-bg", type: "shape", shape: "rect", x: 820, y: 330, width: 200, height: 46, fill: "#fde68a", radius: 23, selectable: false },
                { id: "chip-1", type: "text", text: "BACHATA SUAVE", x: 820, y: 343, width: 200, fontSize: 21, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "chip-2-bg", type: "shape", shape: "rect", x: 1040, y: 330, width: 200, height: 46, fill: "#fde68a", radius: 23, selectable: false },
                { id: "chip-2", type: "text", text: "PASODOBLE", x: 1040, y: 343, width: 200, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "chip-3-bg", type: "shape", shape: "rect", x: 1260, y: 330, width: 200, height: 46, fill: "#fde68a", radius: 23, selectable: false },
                { id: "chip-3", type: "text", text: "VALS LENTO", x: 1260, y: 343, width: 200, fontSize: 21, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "chip-4-bg", type: "shape", shape: "rect", x: 1480, y: 330, width: 200, height: 46, fill: "#fde68a", radius: 23, selectable: false },
                { id: "chip-4", type: "text", text: "MERENGUE", x: 1480, y: 343, width: 200, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#7c4a03", textAlign: "center", charSpacing: 200 },
                { id: "details-1-l", type: "text", text: "DÍAS · HORA", x: 820, y: 430, width: 320, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-1-v", type: "text", text: "MAR  ·  JUE  ·  11:00 H", x: 820, y: 450, width: 600, fontSize: 32, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "left", fontStyle: "italic" },
                { id: "details-2-l", type: "text", text: "PRECIO  ·  PARA", x: 820, y: 520, width: 320, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "rgba(91,122,153,0.7)", fontWeight: "800", textAlign: "left", charSpacing: 400 },
                { id: "details-2-v", type: "text", text: "30€ / mes  ·  +55 años", x: 820, y: 540, width: 600, fontSize: 32, fontFamily: "Playfair Display, serif", color: "#d97706", textAlign: "left", fontStyle: "italic" },
                { id: "footer-1", type: "text", text: "Centro Cultural La Plaza  ·  Goya 88  ·  Madrid", x: 820, y: 640, width: 1050, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#1a2b3f", textAlign: "left", fontStyle: "italic" },
                { id: "footer-2", type: "text", text: "INFORMACIÓN  ·  +34 600 555 666  ·  WHATSAPP", x: 820, y: 690, width: 1050, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#5b7a99", fontWeight: "700", textAlign: "left", charSpacing: 350 },
                { id: "footer-3", type: "text", text: "primera sesión gratuita", x: 820, y: 730, width: 1050, fontSize: 18, fontFamily: "Cormorant Garamond, serif", color: "#d97706", fontStyle: "italic", textAlign: "left", charSpacing: 100 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 48 — Baile Mayores con Paco — solo, foto grande (NUEVO)
//      Calido editorial. Verde oliva + crema + ambar. "Sumate a la pista"
// ─────────────────────────────────────────────────────────────────────
    {
        id: 48,
        title: "Baile Mayores con Paco",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores-grupales-Paco.png",
        premium: false,
        audience: ["academias", "instituciones"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO crema lino
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#efe6cf", selectable: false },
                // Banda verde oliva inferior 1/3 abajo (split tonal)
                { id: "bottom-band", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 450, fill: "#4a5a2c", selectable: false },
                // Curva organica entre bandas
                { id: "wave", type: "shape", shape: "circle", x: -300, y: 760, width: 1680, height: 320, fill: "#4a5a2c", originX: "left", originY: "top", selectable: false },

                // CABECERA tipo programa editorial
                { id: "header-line-t", type: "shape", shape: "rect", x: 60, y: 60, width: 960, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "header-line-b", type: "shape", shape: "rect", x: 60, y: 100, width: 960, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "header-text", type: "text", text: "C E N T R O   M A Y O R E S   ·   E D I C I Ó N   2 0 2 6", x: 0, y: 73, width: 1080, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#4a5a2c", fontWeight: "700", textAlign: "center", charSpacing: 600 },

                // SUPRATITULO con tracking
                { id: "supra", type: "text", text: "L A   P I S T A   E S T Á   A B I E R T A", x: 0, y: 135, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#7c4a03", fontWeight: "700", textAlign: "center", charSpacing: 700 },

                // TITULO Playfair italica masivo
                { id: "title-1", type: "text", text: "Súmate a", x: 0, y: 165, width: 1080, fontSize: 100, fontFamily: "Playfair Display, serif", color: "#2a3018", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "la pista.", x: 0, y: 280, width: 1080, fontSize: 100, fontFamily: "Playfair Display, serif", color: "#7c4a03", textAlign: "center", fontStyle: "italic" },

                // Ornamento divider
                { id: "orn-l", type: "shape", shape: "rect", x: 380, y: 405, width: 130, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "orn-d", type: "shape", shape: "circle", x: 530, y: 400, width: 12, height: 12, fill: "transparent", stroke: "#4a5a2c", strokeWidth: 1, selectable: false },
                { id: "orn-r", type: "shape", shape: "rect", x: 570, y: 405, width: 130, height: 1, fill: "#4a5a2c", selectable: false },

                // Descripcion italica
                { id: "desc", type: "text", text: "Sesiones suaves para mantenerte activo,", x: 60, y: 425, width: 960, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(42,48,24,0.78)", textAlign: "center", fontStyle: "italic" },
                { id: "desc-2", type: "text", text: "con amigos y mucha música.", x: 60, y: 452, width: 960, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(42,48,24,0.78)", textAlign: "center", fontStyle: "italic" },

                // FOTO PACO grande centrada en la zona crema (a caballo entre banda crema y verde)
                { id: "paco", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores-grupales-Paco.png", x: 540, y: 490, scaleX: 1.40, scaleY: 1.40, originX: "center", originY: "top", shadow: { color: "rgba(74,90,44,0.55)", blur: 45, offsetX: 0, offsetY: 10 } },

                // ─── BLOQUE INFO sobre banda verde ───
                // Plate nombre profe sobre banda verde
                { id: "plate-line", type: "shape", shape: "rect", x: 360, y: 985, width: 360, height: 1, fill: "#fde68a", selectable: false },
                { id: "plate-label", type: "text", text: "I M P A R T E", x: 0, y: 1000, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.75)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-name", type: "text", text: "Paco Romero", x: 0, y: 1025, width: 1080, fontSize: 36, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "plate-role", type: "text", text: "Maestro de baile · 30 años de experiencia", x: 0, y: 1075, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", fontStyle: "italic", textAlign: "center", charSpacing: 200 },

                // Linea separadora oro
                { id: "div", type: "shape", shape: "rect", x: 460, y: 1115, width: 160, height: 1, fill: "#fde68a", selectable: false },

                // INFO 3 columnas sobre verde
                { id: "i-1-l", type: "text", text: "DÍAS", x: 60, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-1-v", type: "text", text: "LUN · MIÉ", x: 60, y: 1160, width: 320, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "i-1-x", type: "text", text: "11:00 — 12:30", x: 60, y: 1200, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.7)", fontStyle: "italic", textAlign: "center" },

                { id: "i-2-l", type: "text", text: "PRECIO", x: 380, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-2-v", type: "text", text: "30€ / mes", x: 380, y: 1160, width: 320, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "i-2-x", type: "text", text: "Sesión suelta · 10€", x: 380, y: 1200, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.7)", fontStyle: "italic", textAlign: "center" },

                { id: "i-3-l", type: "text", text: "PARA", x: 700, y: 1140, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-3-v", type: "text", text: "+60 años", x: 700, y: 1160, width: 320, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#fde68a", textAlign: "center", fontStyle: "italic" },
                { id: "i-3-x", type: "text", text: "Sin experiencia previa", x: 700, y: 1200, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.7)", fontStyle: "italic", textAlign: "center" },

                // CTA pie
                { id: "cta-line", type: "shape", shape: "rect", x: 80, y: 1255, width: 920, height: 1, fill: "rgba(254,230,138,0.3)", selectable: false },
                { id: "footer-1", type: "text", text: "Centro Cultural La Plaza  ·  Goya 88  ·  Madrid", x: 0, y: 1275, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic", charSpacing: 200 },
                { id: "footer-2", type: "text", text: "INFO  ·  +34 600 555 666  ·  primera sesión gratuita", x: 0, y: 1308, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
            ] },

            // ─── SQUARE 1080x1080 ───
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#efe6cf", selectable: false },
                { id: "bottom-band", type: "shape", shape: "rect", x: 0, y: 680, width: 1080, height: 400, fill: "#4a5a2c", selectable: false },
                { id: "wave", type: "shape", shape: "circle", x: -300, y: 560, width: 1680, height: 240, fill: "#4a5a2c", originX: "left", originY: "top", selectable: false },
                { id: "header-line-t", type: "shape", shape: "rect", x: 60, y: 50, width: 960, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "header-line-b", type: "shape", shape: "rect", x: 60, y: 90, width: 960, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "header-text", type: "text", text: "C E N T R O   M A Y O R E S   ·   2 6 / 2 7", x: 0, y: 63, width: 1080, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "#4a5a2c", fontWeight: "700", textAlign: "center", charSpacing: 600 },
                { id: "supra", type: "text", text: "L A   P I S T A   E S T Á   A B I E R T A", x: 0, y: 120, width: 1080, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#7c4a03", fontWeight: "700", textAlign: "center", charSpacing: 700 },
                { id: "title-1", type: "text", text: "Súmate a", x: 0, y: 150, width: 1080, fontSize: 80, fontFamily: "Playfair Display, serif", color: "#2a3018", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "la pista.", x: 0, y: 240, width: 1080, fontSize: 80, fontFamily: "Playfair Display, serif", color: "#7c4a03", textAlign: "center", fontStyle: "italic" },
                { id: "orn-l", type: "shape", shape: "rect", x: 380, y: 345, width: 130, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "orn-d", type: "shape", shape: "circle", x: 530, y: 340, width: 12, height: 12, fill: "transparent", stroke: "#4a5a2c", strokeWidth: 1, selectable: false },
                { id: "orn-r", type: "shape", shape: "rect", x: 570, y: 345, width: 130, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "paco", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores-grupales-Paco.png", x: 540, y: 365, scaleX: 1.05, scaleY: 1.05, originX: "center", originY: "top", shadow: { color: "rgba(74,90,44,0.55)", blur: 35, offsetX: 0, offsetY: 8 } },
                { id: "plate-label", type: "text", text: "I M P A R T E", x: 0, y: 750, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.75)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-name", type: "text", text: "Paco Romero", x: 0, y: 772, width: 1080, fontSize: 30, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "plate-role", type: "text", text: "Maestro de baile · 30 años de experiencia", x: 0, y: 815, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", fontStyle: "italic", textAlign: "center", charSpacing: 200 },
                { id: "div", type: "shape", shape: "rect", x: 460, y: 855, width: 160, height: 1, fill: "#fde68a", selectable: false },
                { id: "info", type: "text", text: "LUN · MIÉ  ·  11:00 — 12:30  ·  30€/mes  ·  +60 años", x: 0, y: 880, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic", charSpacing: 100 },
                { id: "footer-1", type: "text", text: "Centro Cultural La Plaza  ·  Goya 88  ·  Madrid", x: 0, y: 935, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic", charSpacing: 200 },
                { id: "footer-2", type: "text", text: "INFO  ·  +34 600 555 666  ·  primera sesión gratuita", x: 0, y: 985, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
            ] },

            // ─── STORY 1080x1920 ───
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#efe6cf", selectable: false },
                { id: "bottom-band", type: "shape", shape: "rect", x: 0, y: 1350, width: 1080, height: 570, fill: "#4a5a2c", selectable: false },
                { id: "wave", type: "shape", shape: "circle", x: -300, y: 1210, width: 1680, height: 320, fill: "#4a5a2c", originX: "left", originY: "top", selectable: false },
                { id: "header-line-t", type: "shape", shape: "rect", x: 60, y: 130, width: 960, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "header-line-b", type: "shape", shape: "rect", x: 60, y: 170, width: 960, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "header-text", type: "text", text: "C E N T R O   M A Y O R E S   ·   2 0 2 6 / 2 7", x: 0, y: 143, width: 1080, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#4a5a2c", fontWeight: "700", textAlign: "center", charSpacing: 600 },
                { id: "supra", type: "text", text: "L A   P I S T A   E S T Á   A B I E R T A", x: 0, y: 220, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#7c4a03", fontWeight: "700", textAlign: "center", charSpacing: 700 },
                { id: "title-1", type: "text", text: "Súmate a", x: 0, y: 260, width: 1080, fontSize: 130, fontFamily: "Playfair Display, serif", color: "#2a3018", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "la pista.", x: 0, y: 410, width: 1080, fontSize: 130, fontFamily: "Playfair Display, serif", color: "#7c4a03", textAlign: "center", fontStyle: "italic" },
                { id: "orn-l", type: "shape", shape: "rect", x: 380, y: 580, width: 130, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "orn-d", type: "shape", shape: "circle", x: 530, y: 575, width: 12, height: 12, fill: "transparent", stroke: "#4a5a2c", strokeWidth: 1, selectable: false },
                { id: "orn-r", type: "shape", shape: "rect", x: 570, y: 580, width: 130, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "desc", type: "text", text: "Sesiones suaves para mantenerte activo,", x: 60, y: 600, width: 960, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "rgba(42,48,24,0.78)", textAlign: "center", fontStyle: "italic" },
                { id: "desc-2", type: "text", text: "con amigos y mucha música.", x: 60, y: 635, width: 960, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "rgba(42,48,24,0.78)", textAlign: "center", fontStyle: "italic" },
                { id: "paco", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores-grupales-Paco.png", x: 540, y: 700, scaleX: 1.6, scaleY: 1.6, originX: "center", originY: "top", shadow: { color: "rgba(74,90,44,0.55)", blur: 55, offsetX: 0, offsetY: 10 } },
                { id: "plate-line", type: "shape", shape: "rect", x: 360, y: 1410, width: 360, height: 1, fill: "#fde68a", selectable: false },
                { id: "plate-label", type: "text", text: "I M P A R T E", x: 0, y: 1430, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.75)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-name", type: "text", text: "Paco Romero", x: 0, y: 1455, width: 1080, fontSize: 44, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "plate-role", type: "text", text: "Maestro de baile · 30 años de experiencia", x: 0, y: 1520, width: 1080, fontSize: 18, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", fontStyle: "italic", textAlign: "center", charSpacing: 200 },
                { id: "div", type: "shape", shape: "rect", x: 460, y: 1565, width: 160, height: 1, fill: "#fde68a", selectable: false },
                { id: "i-1-l", type: "text", text: "DÍAS", x: 60, y: 1595, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-1-v", type: "text", text: "LUN · MIÉ", x: 60, y: 1620, width: 320, fontSize: 30, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "i-1-x", type: "text", text: "11:00 — 12:30", x: 60, y: 1665, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.7)", fontStyle: "italic", textAlign: "center" },
                { id: "i-2-l", type: "text", text: "PRECIO", x: 380, y: 1595, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-2-v", type: "text", text: "30€ / mes", x: 380, y: 1620, width: 320, fontSize: 30, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "i-2-x", type: "text", text: "Sesión suelta · 10€", x: 380, y: 1665, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.7)", fontStyle: "italic", textAlign: "center" },
                { id: "i-3-l", type: "text", text: "PARA", x: 700, y: 1595, width: 320, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.85)", fontWeight: "800", textAlign: "center", charSpacing: 400 },
                { id: "i-3-v", type: "text", text: "+60 años", x: 700, y: 1620, width: 320, fontSize: 30, fontFamily: "Playfair Display, serif", color: "#fde68a", textAlign: "center", fontStyle: "italic" },
                { id: "i-3-x", type: "text", text: "Sin experiencia previa", x: 700, y: 1665, width: 320, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.7)", fontStyle: "italic", textAlign: "center" },
                { id: "cta-line", type: "shape", shape: "rect", x: 80, y: 1740, width: 920, height: 1, fill: "rgba(254,230,138,0.3)", selectable: false },
                { id: "footer-1", type: "text", text: "Centro Cultural La Plaza  ·  Goya 88  ·  Madrid", x: 0, y: 1770, width: 1080, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic", charSpacing: 200 },
                { id: "footer-2", type: "text", text: "INFO  ·  +34 600 555 666  ·  primera sesión gratuita", x: 0, y: 1820, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(253,224,71,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
            ] },

            // ─── FB-COVER 1920x1005 ───
            { format: "fb-cover", width: 1920, height: 1005, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1920, height: 1005, fill: "#efe6cf", selectable: false },
                { id: "side-band", type: "shape", shape: "rect", x: 1100, y: 0, width: 820, height: 1005, fill: "#4a5a2c", selectable: false },
                { id: "wave", type: "shape", shape: "circle", x: 980, y: -100, width: 240, height: 1200, fill: "#4a5a2c", selectable: false },
                { id: "header-line", type: "shape", shape: "rect", x: 80, y: 100, width: 960, height: 1, fill: "#4a5a2c", selectable: false },
                { id: "header-text", type: "text", text: "C E N T R O   M A Y O R E S   ·   2 0 2 6", x: 80, y: 70, width: 960, fontSize: 21, fontFamily: "Cormorant Garamond, serif", color: "#4a5a2c", fontWeight: "700", textAlign: "left", charSpacing: 600 },
                { id: "supra", type: "text", text: "L A   P I S T A   E S T Á   A B I E R T A", x: 80, y: 130, width: 960, fontSize: 21, fontFamily: "Montserrat, sans-serif", color: "#7c4a03", fontWeight: "700", textAlign: "left", charSpacing: 700 },
                { id: "title-1", type: "text", text: "Súmate a", x: 80, y: 165, width: 1000, fontSize: 110, fontFamily: "Playfair Display, serif", color: "#2a3018", textAlign: "left", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "la pista.", x: 80, y: 290, width: 1000, fontSize: 110, fontFamily: "Playfair Display, serif", color: "#7c4a03", textAlign: "left", fontStyle: "italic" },
                { id: "desc", type: "text", text: "Sesiones suaves para mantenerte activo,", x: 80, y: 440, width: 1000, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(42,48,24,0.78)", textAlign: "left", fontStyle: "italic" },
                { id: "desc-2", type: "text", text: "con amigos y mucha música.", x: 80, y: 470, width: 1000, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(42,48,24,0.78)", textAlign: "left", fontStyle: "italic" },
                { id: "info-1", type: "text", text: "LUN · MIÉ  ·  11:00 — 12:30  ·  30€ / mes", x: 80, y: 550, width: 1000, fontSize: 24, fontFamily: "Playfair Display, serif", color: "#2a3018", textAlign: "left", fontStyle: "italic" },
                { id: "info-2", type: "text", text: "Para +60 años  ·  Sin experiencia previa", x: 80, y: 590, width: 1000, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(42,48,24,0.65)", textAlign: "left", fontStyle: "italic" },
                { id: "info-3", type: "text", text: "Centro Cultural La Plaza  ·  Goya 88  ·  Madrid", x: 80, y: 660, width: 1000, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "#7c4a03", fontStyle: "italic", textAlign: "left" },
                { id: "cta-line", type: "shape", shape: "rect", x: 80, y: 720, width: 240, height: 2, fill: "#4a5a2c", selectable: false },
                { id: "cta", type: "text", text: "+34 600 555 666  ·  primera sesión gratuita", x: 80, y: 740, width: 1000, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#4a5a2c", fontWeight: "700", textAlign: "left", charSpacing: 250 },
                { id: "paco", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores-grupales-Paco.png", x: 1500, y: 60, scaleX: 1.0, scaleY: 1.0, originX: "center", originY: "top", shadow: { color: "rgba(74,90,44,0.55)", blur: 40, offsetX: 0, offsetY: 10 } },
                { id: "plate-label", type: "text", text: "I M P A R T E", x: 1200, y: 830, width: 700, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(254,230,138,0.75)", fontWeight: "800", textAlign: "center", charSpacing: 500 },
                { id: "plate-name", type: "text", text: "Paco Romero", x: 1200, y: 850, width: 700, fontSize: 28, fontFamily: "Playfair Display, serif", color: "#fef3c7", textAlign: "center", fontStyle: "italic" },
                { id: "plate-role", type: "text", text: "30 años de experiencia", x: 1200, y: 905, width: 700, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(254,243,199,0.75)", fontStyle: "italic", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 49 — DJ Urban Night (DJ-1, hombre joven con bomber jacket)
//      Paleta: pink fucsia + amber + dark navy. Urban-vibe nocturno.
//      Caso: club mediano, fiesta urbana de fin de semana.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 49,
        title: "DJ Urban Night",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
        premium: false,
        audience: ["productoras", "freelance"],
        internalTags: ["beta"],
        useCases: ["promote", "sellTickets", "announceArtist"],
        variants: [
            // ── Historia Instagram (1080×1920) — formato principal para DJs
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#0a0612", selectable: false },
                // Glows ambientales
                { id: "glow-fucsia", type: "shape", shape: "circle", x: -100, y: 400, width: 900, height: 900, radius: 450, fill: "#ec4899", opacity: 0.22, selectable: false },
                { id: "glow-amber", type: "shape", shape: "circle", x: 600, y: 1300, width: 800, height: 800, radius: 400, fill: "#f59e0b", opacity: 0.18, selectable: false },
                // Foto DJ (centrado, grande, con sombra de glow)
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 540, y: 1080, scaleX: 1.4, scaleY: 1.4, originX: "center", originY: "center", shadow: { color: "rgba(236,72,153,0.55)", blur: 60, offsetX: 0, offsetY: 0 } },
                // Eyebrow superior
                { id: "supra", type: "text", text: "URBAN NIGHT · DJ SET", x: 540, y: 200, width: 1000, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "center", originX: "center", charSpacing: 500 },
                // Titular gigante
                { id: "title", type: "text", text: "DJ\nSHADOW", x: 540, y: 360, width: 1080, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", lineHeight: 0.95 },
                // Separador diagonal
                { id: "diag-band", type: "shape", shape: "rect", x: -100, y: 1480, width: 1300, height: 4, fill: "#f59e0b", angle: -3, selectable: false },
                // Bloque fecha + venue (parte inferior)
                { id: "date-day", type: "text", text: "SAB 06 JUL", x: 540, y: 1560, width: 1000, fontSize: 72, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "SALA APOLO · BARCELONA", x: 540, y: 1660, width: 1000, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#f59e0b", fontWeight: "600", textAlign: "center", originX: "center", charSpacing: 500 },
                { id: "doors", type: "text", text: "DOORS 23:30  ·  15€ ANT  ·  20€ PUERTA", x: 540, y: 1750, width: 1000, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#d1d5db", fontWeight: "400", textAlign: "center", originX: "center", charSpacing: 300 },
                // Botón CTA visual
                { id: "cta-box", type: "shape", shape: "rect", x: 290, y: 1810, width: 500, height: 70, fill: "#ec4899", radius: 35, selectable: false },
                { id: "cta-text", type: "text", text: "ENTRADAS  →", x: 540, y: 1830, width: 500, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", charSpacing: 300 },
            ] },
            // ── Post Instagram cuadrado (1080×1080)
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#0a0612", selectable: false },
                { id: "glow-fucsia", type: "shape", shape: "circle", x: -50, y: 200, width: 700, height: 700, radius: 350, fill: "#ec4899", opacity: 0.22, selectable: false },
                { id: "glow-amber", type: "shape", shape: "circle", x: 500, y: 700, width: 600, height: 600, radius: 300, fill: "#f59e0b", opacity: 0.18, selectable: false },
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 800, y: 540, scaleX: 0.9, scaleY: 0.9, originX: "center", originY: "center", shadow: { color: "rgba(236,72,153,0.55)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "supra", type: "text", text: "URBAN · DJ SET", x: 60, y: 120, width: 600, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "left", charSpacing: 400 },
                { id: "title", type: "text", text: "DJ\nSHADOW", x: 60, y: 180, width: 600, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "left", originY: "top", lineHeight: 0.95 },
                { id: "date-day", type: "text", text: "SAB 06 JUL", x: 60, y: 580, width: 500, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#f59e0b", fontWeight: "900", textAlign: "left", charSpacing: 200 },
                { id: "venue", type: "text", text: "SALA APOLO · BARCELONA", x: 60, y: 660, width: 600, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "left", charSpacing: 400 },
                { id: "doors", type: "text", text: "DOORS 23:30  ·  15€ ANT", x: 60, y: 710, width: 600, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d1d5db", fontWeight: "400", textAlign: "left", charSpacing: 300 },
                { id: "cta-box", type: "shape", shape: "rect", x: 60, y: 940, width: 320, height: 60, fill: "#ec4899", radius: 30, selectable: false },
                { id: "cta-text", type: "text", text: "ENTRADAS  →", x: 220, y: 957, width: 320, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", charSpacing: 300 },
            ] },
            // ── Post vertical (1080×1350)
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0612", selectable: false },
                { id: "glow-fucsia", type: "shape", shape: "circle", x: -100, y: 250, width: 800, height: 800, radius: 400, fill: "#ec4899", opacity: 0.22, selectable: false },
                { id: "glow-amber", type: "shape", shape: "circle", x: 550, y: 850, width: 700, height: 700, radius: 350, fill: "#f59e0b", opacity: 0.18, selectable: false },
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 540, y: 780, scaleX: 1.15, scaleY: 1.15, originX: "center", originY: "center", shadow: { color: "rgba(236,72,153,0.55)", blur: 55, offsetX: 0, offsetY: 0 } },
                { id: "supra", type: "text", text: "URBAN NIGHT · DJ SET", x: 540, y: 140, width: 1000, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "center", originX: "center", charSpacing: 500 },
                { id: "title", type: "text", text: "DJ\nSHADOW", x: 540, y: 250, width: 1080, fontSize: 170, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", lineHeight: 0.95 },
                { id: "diag-band", type: "shape", shape: "rect", x: -100, y: 1050, width: 1300, height: 4, fill: "#f59e0b", angle: -3, selectable: false },
                { id: "date-day", type: "text", text: "SAB 06 JUL", x: 540, y: 1110, width: 1000, fontSize: 60, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "SALA APOLO · BARCELONA", x: 540, y: 1195, width: 1000, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#f59e0b", fontWeight: "600", textAlign: "center", originX: "center", charSpacing: 500 },
                { id: "doors", type: "text", text: "DOORS 23:30  ·  15€ ANT  ·  20€ PUERTA", x: 540, y: 1240, width: 1000, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#d1d5db", fontWeight: "400", textAlign: "center", originX: "center", charSpacing: 300 },
                { id: "cta-box", type: "shape", shape: "rect", x: 390, y: 1280, width: 300, height: 50, fill: "#ec4899", radius: 25, selectable: false },
                { id: "cta-text", type: "text", text: "ENTRADAS  →", x: 540, y: 1294, width: 300, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 50 — DJ Electronic Pulse (DJ-2, mujer rubia con auriculares)
//      Paleta: cyan eléctrico + violeta + dark teal. Tech-house / EDM.
//      Caso: festival electrónico, fiesta tech-house.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 50,
        title: "DJ Electronic Pulse",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
        premium: false,
        audience: ["productoras", "freelance"],
        internalTags: ["beta"],
        useCases: ["promote", "sellTickets", "announceArtist"],
        variants: [
            // ── Story (1080×1920)
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#020817", selectable: false },
                { id: "glow-cyan", type: "shape", shape: "circle", x: 540, y: 600, width: 1200, height: 1200, radius: 600, fill: "#06b6d4", opacity: 0.20, originX: "center", originY: "center", selectable: false },
                { id: "glow-violet", type: "shape", shape: "circle", x: 200, y: 1600, width: 800, height: 800, radius: 400, fill: "#8b5cf6", opacity: 0.22, selectable: false },
                // Grid wireframe (sutil, decorativo)
                { id: "grid-line-1", type: "shape", shape: "rect", x: 0, y: 1300, width: 1080, height: 1, fill: "#06b6d4", opacity: 0.3, selectable: false },
                { id: "grid-line-2", type: "shape", shape: "rect", x: 540, y: 1300, width: 1, height: 620, fill: "#06b6d4", opacity: 0.3, selectable: false, originX: "center" },
                // Foto DJ
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 540, y: 1100, scaleX: 1.5, scaleY: 1.5, originX: "center", originY: "center", shadow: { color: "rgba(6,182,212,0.65)", blur: 70, offsetX: 0, offsetY: 0 } },
                // Etiqueta tipo "FREQUENCY: 128 BPM"
                { id: "freq-tag", type: "text", text: "FREQUENCY: 128 BPM", x: 540, y: 180, width: 1000, fontSize: 22, fontFamily: "Space Mono, monospace", color: "#06b6d4", fontWeight: "400", textAlign: "center", originX: "center", charSpacing: 400 },
                // Línea de subtítulo
                { id: "supra", type: "text", text: "ELECTRONIC SESSION", x: 540, y: 240, width: 1000, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "700", textAlign: "center", originX: "center", charSpacing: 700 },
                // Titular masivo
                { id: "title", type: "text", text: "PULSE", x: 540, y: 380, width: 1080, fontSize: 280, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top" },
                { id: "subtitle", type: "text", text: "—  by  —", x: 540, y: 680, width: 1000, fontSize: 24, fontFamily: "Space Mono, monospace", color: "#8b5cf6", fontWeight: "400", textAlign: "center", originX: "center", charSpacing: 600 },
                { id: "dj-name", type: "text", text: "LUNA NOVA", x: 540, y: 740, width: 1000, fontSize: 80, fontFamily: "Anton, Impact, sans-serif", color: "#06b6d4", fontWeight: "900", textAlign: "center", originX: "center", charSpacing: 400 },
                // Bloque inferior fecha
                { id: "date-day", type: "text", text: "VIE 12 JUL · 23H", x: 540, y: 1600, width: 1000, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "RAZZMATAZZ · BARCELONA", x: 540, y: 1690, width: 1000, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "600", textAlign: "center", originX: "center", charSpacing: 500 },
                { id: "doors", type: "text", text: "EARLY 12€ · GENERAL 18€", x: 540, y: 1750, width: 1000, fontSize: 20, fontFamily: "Space Mono, monospace", color: "#d1d5db", fontWeight: "400", textAlign: "center", originX: "center", charSpacing: 300 },
                { id: "cta-box", type: "shape", shape: "rect", x: 240, y: 1810, width: 600, height: 70, fill: "transparent", stroke: "#06b6d4", strokeWidth: 2, radius: 0, selectable: false },
                { id: "cta-text", type: "text", text: "[ TICKETS ONLINE ]", x: 540, y: 1830, width: 600, fontSize: 24, fontFamily: "Space Mono, monospace", color: "#06b6d4", fontWeight: "700", textAlign: "center", originX: "center", charSpacing: 400 },
            ] },
            // ── Square (1080×1080)
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#020817", selectable: false },
                { id: "glow-cyan", type: "shape", shape: "circle", x: 540, y: 540, width: 1100, height: 1100, radius: 550, fill: "#06b6d4", opacity: 0.18, originX: "center", originY: "center", selectable: false },
                { id: "glow-violet", type: "shape", shape: "circle", x: 200, y: 900, width: 700, height: 700, radius: 350, fill: "#8b5cf6", opacity: 0.22, selectable: false },
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 820, y: 540, scaleX: 0.95, scaleY: 0.95, originX: "center", originY: "center", shadow: { color: "rgba(6,182,212,0.6)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "freq-tag", type: "text", text: "FREQ: 128 BPM", x: 60, y: 130, width: 500, fontSize: 18, fontFamily: "Space Mono, monospace", color: "#06b6d4", fontWeight: "400", textAlign: "left", charSpacing: 400 },
                { id: "supra", type: "text", text: "ELECTRONIC SESSION", x: 60, y: 170, width: 500, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "700", textAlign: "left", charSpacing: 600 },
                { id: "title", type: "text", text: "PULSE", x: 60, y: 240, width: 600, fontSize: 180, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "left", originY: "top" },
                { id: "dj-name", type: "text", text: "LUNA NOVA", x: 60, y: 470, width: 500, fontSize: 50, fontFamily: "Anton, Impact, sans-serif", color: "#06b6d4", fontWeight: "900", textAlign: "left", charSpacing: 300 },
                { id: "date-day", type: "text", text: "VIE 12 JUL · 23H", x: 60, y: 720, width: 500, fontSize: 40, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "left", charSpacing: 250 },
                { id: "venue", type: "text", text: "RAZZMATAZZ · BARCELONA", x: 60, y: 780, width: 500, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "600", textAlign: "left", charSpacing: 400 },
                { id: "doors", type: "text", text: "EARLY 12€ · GENERAL 18€", x: 60, y: 815, width: 500, fontSize: 19, fontFamily: "Space Mono, monospace", color: "#d1d5db", fontWeight: "400", textAlign: "left", charSpacing: 300 },
                { id: "cta-box", type: "shape", shape: "rect", x: 60, y: 960, width: 380, height: 56, fill: "transparent", stroke: "#06b6d4", strokeWidth: 2, radius: 0, selectable: false },
                { id: "cta-text", type: "text", text: "[ TICKETS ONLINE ]", x: 250, y: 977, width: 380, fontSize: 20, fontFamily: "Space Mono, monospace", color: "#06b6d4", fontWeight: "700", textAlign: "center", originX: "center", charSpacing: 400 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 51 — DJ Reggaeton Night (DJ-3, hombre con bomber + auriculares)
//      Paleta: pink fucsia + lime neon + black. Reggaeton / latin urban.
//      Caso: fiesta latina, perreo, urban night.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 51,
        title: "DJ Reggaeton Night",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png",
        premium: false,
        audience: ["productoras", "freelance"],
        internalTags: ["beta"],
        useCases: ["promote", "sellTickets", "announceArtist"],
        variants: [
            // ── Story (1080×1920)
            { format: "story", width: 1080, height: 1920, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1920, fill: "#000000", selectable: false },
                { id: "glow-pink", type: "shape", shape: "circle", x: 540, y: 900, width: 1100, height: 1100, radius: 550, fill: "#ec4899", opacity: 0.28, originX: "center", originY: "center", selectable: false },
                { id: "glow-lime", type: "shape", shape: "circle", x: 800, y: 250, width: 600, height: 600, radius: 300, fill: "#84cc16", opacity: 0.25, selectable: false },
                // Foto DJ (más grande, hero)
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png", x: 540, y: 1100, scaleX: 1.45, scaleY: 1.45, originX: "center", originY: "center", shadow: { color: "rgba(236,72,153,0.7)", blur: 80, offsetX: 0, offsetY: 0 } },
                // Eyebrow encima
                { id: "supra", type: "text", text: "★  PERREO NIGHT  ★", x: 540, y: 180, width: 1000, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#84cc16", fontWeight: "700", textAlign: "center", originX: "center", charSpacing: 500 },
                // Titular gigante con stroke
                { id: "title-1", type: "text", text: "REGGAE", x: 540, y: 280, width: 1080, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top" },
                { id: "title-2", type: "text", text: "TON", x: 540, y: 470, width: 1080, fontSize: 240, fontFamily: "Anton, Impact, sans-serif", color: "#ec4899", fontWeight: "900", textAlign: "center", originX: "center", originY: "top" },
                // Tag DJ
                { id: "dj-tag", type: "text", text: "with  DJ  EL  GRINGO", x: 540, y: 770, width: 1000, fontSize: 32, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "700", textAlign: "center", originX: "center", charSpacing: 400 },
                // Banda inferior con info
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 1550, width: 1080, height: 370, fill: "#ec4899", selectable: false },
                { id: "date-day", type: "text", text: "SAB 20 JUL", x: 540, y: 1610, width: 1000, fontSize: 80, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "SALA TOTEM · MADRID", x: 540, y: 1720, width: 1000, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#000000", fontWeight: "700", textAlign: "center", originX: "center", charSpacing: 500 },
                { id: "doors", type: "text", text: "DOORS 00:00  ·  CHICAS GRATIS HASTA 02H", x: 540, y: 1780, width: 1000, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(0,0,0,0.85)", fontWeight: "500", textAlign: "center", originX: "center", charSpacing: 300 },
                { id: "cta-text", type: "text", text: "→  RESERVA EN @SALATOTEM  ←", x: 540, y: 1850, width: 1000, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#84cc16", fontWeight: "900", textAlign: "center", originX: "center", charSpacing: 400 },
            ] },
            // ── Square (1080×1080)
            { format: "square", width: 1080, height: 1080, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1080, fill: "#000000", selectable: false },
                { id: "glow-pink", type: "shape", shape: "circle", x: 540, y: 540, width: 1000, height: 1000, radius: 500, fill: "#ec4899", opacity: 0.25, originX: "center", originY: "center", selectable: false },
                { id: "glow-lime", type: "shape", shape: "circle", x: 800, y: 200, width: 500, height: 500, radius: 250, fill: "#84cc16", opacity: 0.25, selectable: false },
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png", x: 800, y: 540, scaleX: 0.9, scaleY: 0.9, originX: "center", originY: "center", shadow: { color: "rgba(236,72,153,0.7)", blur: 60, offsetX: 0, offsetY: 0 } },
                { id: "supra", type: "text", text: "★ PERREO NIGHT ★", x: 60, y: 130, width: 500, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#84cc16", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "title-1", type: "text", text: "REGGAE", x: 60, y: 190, width: 600, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "left", originY: "top" },
                { id: "title-2", type: "text", text: "TON", x: 60, y: 325, width: 600, fontSize: 160, fontFamily: "Anton, Impact, sans-serif", color: "#ec4899", fontWeight: "900", textAlign: "left", originY: "top" },
                { id: "dj-tag", type: "text", text: "with DJ EL GRINGO", x: 60, y: 540, width: 500, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 850, width: 1080, height: 230, fill: "#ec4899", selectable: false },
                { id: "date-day", type: "text", text: "SAB 20 JUL", x: 60, y: 880, width: 700, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "left", charSpacing: 250 },
                { id: "venue", type: "text", text: "SALA TOTEM · MADRID", x: 60, y: 960, width: 700, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#000000", fontWeight: "700", textAlign: "left", charSpacing: 400 },
                { id: "doors", type: "text", text: "DOORS 00:00 · CHICAS GRATIS HASTA 02H", x: 60, y: 1005, width: 700, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(0,0,0,0.85)", fontWeight: "500", textAlign: "left", charSpacing: 300 },
                { id: "cta-text", type: "text", text: "→ @SALATOTEM", x: 60, y: 1040, width: 600, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#84cc16", fontWeight: "900", textAlign: "left", charSpacing: 400 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 52 — DJ Techno Dark (DJ-2, underground violeta + glitch)
//      Estética: negro pleno + glow violeta + glitch lines RGB offset
// ─────────────────────────────────────────────────────────────────────
    {
        id: 52,
        title: "DJ Techno Dark",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
        premium: false,
        audience: ["productoras", "freelance"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO negro plenitud
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a0a", selectable: false },
                // Glow violeta ambient esquina superior derecha
                { id: "glow-violet", type: "shape", shape: "circle", x: 880, y: 200, width: 700, height: 700, radius: 350, fill: "#7B2FBE", opacity: 0.30, originX: "center", originY: "center", selectable: false },
                // Glow cyan ambient esquina inferior izquierda
                { id: "glow-cyan", type: "shape", shape: "circle", x: 100, y: 1150, width: 600, height: 600, radius: 300, fill: "#06b6d4", opacity: 0.18, originX: "center", originY: "center", selectable: false },
                // Líneas glitch horizontales (rayas violetas que simulan VHS distortion)
                { id: "glitch-1", type: "shape", shape: "rect", x: 0, y: 280, width: 1080, height: 2, fill: "#a855f7", opacity: 0.45, selectable: false },
                { id: "glitch-2", type: "shape", shape: "rect", x: 0, y: 285, width: 1080, height: 1, fill: "#22d3ee", opacity: 0.30, selectable: false },
                { id: "glitch-3", type: "shape", shape: "rect", x: 0, y: 820, width: 1080, height: 2, fill: "#a855f7", opacity: 0.35, selectable: false },
                // KICKER top
                { id: "kicker", type: "text", text: "U N D E R G R O U N D   ·   T E C H N O", x: 540, y: 110, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "#a855f7", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 600 },
                // TÍTULO hero — TECHNO en violeta gigante
                { id: "title-1", type: "text", text: "TECHNO", x: 540, y: 160, width: 1080, fontSize: 160, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 40 },
                // Subtítulo NIGHT en violeta neon
                { id: "title-2", type: "text", text: "NIGHT", x: 540, y: 310, width: 1080, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#a855f7", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 100 },
                // DJ photo centrada con glow violeta
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 540, y: 480, scaleX: 1.0, scaleY: 1.0, originX: "center", originY: "top", shadow: { color: "rgba(168,85,247,0.75)", blur: 70, offsetX: 0, offsetY: 0 } },
                // Banda inferior con info — fondo violeta translúcido
                { id: "info-band-bg", type: "shape", shape: "rect", x: 0, y: 1070, width: 1080, height: 280, fill: "rgba(168,85,247,0.18)", selectable: false },
                { id: "info-band-top-line", type: "shape", shape: "rect", x: 0, y: 1070, width: 1080, height: 2, fill: "#a855f7", selectable: false },
                // DJ name hero
                { id: "dj-name", type: "text", text: "DJ AXIS", x: 540, y: 1095, width: 1080, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                // Fecha hero amarilla
                { id: "date", type: "text", text: "VIE 28 JUN  ·  23:30 H", x: 540, y: 1170, width: 1080, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#facc15", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 150 },
                // Sala + ciudad
                { id: "venue", type: "text", text: "MONDO DISKO  ·  MADRID", x: 540, y: 1225, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
                // Entrada
                { id: "doors", type: "text", text: "12€ ANT  ·  15€ PUERTA  ·  +18", x: 540, y: 1280, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(168,85,247,0.95)", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 53 — DJ Day Pool (DJ-1, sunset cyan + pool party brunch)
//      Estética: gradiente sunset + acentos cyan + vibe diurna
// ─────────────────────────────────────────────────────────────────────
    {
        id: 53,
        title: "DJ Day Pool",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
        premium: false,
        audience: ["productoras", "freelance"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO base — naranja sunset
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#fb923c", selectable: false },
                // Capa rosa coral arriba (gradiente simulado)
                { id: "sunset-pink", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 500, fill: "#f472b6", opacity: 0.65, selectable: false },
                // Capa amarilla en medio (gradiente simulado)
                { id: "sunset-yellow", type: "shape", shape: "rect", x: 0, y: 350, width: 1080, height: 300, fill: "#fde047", opacity: 0.45, selectable: false },
                // "Sol" — círculo cyan que representa pool/agua
                { id: "sun", type: "shape", shape: "circle", x: 540, y: 950, width: 900, height: 900, radius: 450, fill: "#06b6d4", opacity: 0.85, originX: "center", originY: "center", selectable: false },
                // Rayos de sol — barras blancas radiales (decoración)
                { id: "ray-1", type: "shape", shape: "rect", x: 480, y: 50, width: 6, height: 120, fill: "#ffffff", opacity: 0.55, selectable: false },
                { id: "ray-2", type: "shape", shape: "rect", x: 600, y: 50, width: 6, height: 120, fill: "#ffffff", opacity: 0.55, selectable: false },
                { id: "ray-3", type: "shape", shape: "rect", x: 360, y: 80, width: 4, height: 90, fill: "#ffffff", opacity: 0.45, selectable: false },
                { id: "ray-4", type: "shape", shape: "rect", x: 720, y: 80, width: 4, height: 90, fill: "#ffffff", opacity: 0.45, selectable: false },
                // KICKER top
                { id: "kicker", type: "text", text: "POOL PARTY  ·  DAY VIBES", x: 540, y: 200, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 600 },
                // TÍTULO hero — SUNSET amarillo
                { id: "title-1", type: "text", text: "SUNSET", x: 540, y: 250, width: 1080, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#0c4a6e", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 60 },
                // Subtítulo SESSION
                { id: "title-2", type: "text", text: "SESSION", x: 540, y: 380, width: 1080, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 100 },
                // DJ photo centrada — más abajo dentro del círculo cyan
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 540, y: 580, scaleX: 1.05, scaleY: 1.05, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.85)", blur: 60, offsetX: 0, offsetY: 0 } },
                // Banda inferior con info — fondo azul oscuro
                { id: "info-band-bg", type: "shape", shape: "rect", x: 0, y: 1180, width: 1080, height: 170, fill: "#0c4a6e", selectable: false },
                // DJ name hero
                { id: "dj-name", type: "text", text: "DJ NOVA", x: 540, y: 1200, width: 1080, fontSize: 44, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                // Fecha + hora
                { id: "date", type: "text", text: "DOMINGO 7 JUL  ·  14:00 — 22:00", x: 540, y: 1260, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 150 },
                // Lugar
                { id: "venue", type: "text", text: "AZOTEA HOTEL ME  ·  MADRID  ·  20€", x: 540, y: 1300, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 54 — DJ Festival Multi (3 DJs stacked horizontal, barras de color)
//      Estética: 3 DJs en hilera con barra cromática debajo
// ─────────────────────────────────────────────────────────────────────
    {
        id: 54,
        title: "DJ Festival Multi",
        category: "Festival",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
        premium: false,
        audience: ["productoras"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // FONDO negro
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a14", selectable: false },
                // Glow violeta top-right
                { id: "glow-top", type: "shape", shape: "circle", x: 900, y: -50, width: 700, height: 700, radius: 350, fill: "#7B2FBE", opacity: 0.30, originX: "center", originY: "center", selectable: false },
                // Glow rosa bottom-left
                { id: "glow-bottom", type: "shape", shape: "circle", x: 100, y: 1300, width: 600, height: 600, radius: 300, fill: "#ec4899", opacity: 0.30, originX: "center", originY: "center", selectable: false },
                // KICKER
                { id: "kicker", type: "text", text: "M U L T I   D J   L I N E U P", x: 540, y: 70, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 700 },
                // TÍTULO hero "FESTIVAL"
                { id: "title-1", type: "text", text: "FESTIVAL", x: 540, y: 115, width: 1080, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 40 },
                // Subtítulo "NIGHTS"
                { id: "title-2", type: "text", text: "NIGHTS", x: 540, y: 245, width: 1080, fontSize: 90, fontFamily: "Anton, Impact, sans-serif", color: "#facc15", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 250 },
                // 3 DJs en fila — cada uno con su slot + color
                // DJ 1 (izquierda) — DJ-1 con acento rojo
                { id: "slot-1-bg", type: "shape", shape: "rect", x: 60, y: 400, width: 300, height: 400, fill: "#1a1a28", radius: 12, selectable: false },
                { id: "dj-1-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 210, y: 410, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "top", shadow: { color: "rgba(239,68,68,0.6)", blur: 35, offsetX: 0, offsetY: 0 } },
                { id: "dj-1-bar", type: "shape", shape: "rect", x: 60, y: 750, width: 300, height: 6, fill: "#ef4444", selectable: false },
                { id: "dj-1-name", type: "text", text: "DJ NOVA", x: 60, y: 765, width: 300, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 150 },
                { id: "dj-1-genre", type: "text", text: "TECHNO", x: 60, y: 795, width: 300, fontSize: 12, fontFamily: "Montserrat, sans-serif", color: "#ef4444", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                // DJ 2 (centro) — DJ-2 con acento azul
                { id: "slot-2-bg", type: "shape", shape: "rect", x: 390, y: 400, width: 300, height: 400, fill: "#1a1a28", radius: 12, selectable: false },
                { id: "dj-2-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 540, y: 410, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "top", shadow: { color: "rgba(59,130,246,0.6)", blur: 35, offsetX: 0, offsetY: 0 } },
                { id: "dj-2-bar", type: "shape", shape: "rect", x: 390, y: 750, width: 300, height: 6, fill: "#3b82f6", selectable: false },
                { id: "dj-2-name", type: "text", text: "DJ AXIS", x: 390, y: 765, width: 300, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 150 },
                { id: "dj-2-genre", type: "text", text: "HOUSE", x: 390, y: 795, width: 300, fontSize: 12, fontFamily: "Montserrat, sans-serif", color: "#3b82f6", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                // DJ 3 (derecha) — DJ-3 con acento amarillo
                { id: "slot-3-bg", type: "shape", shape: "rect", x: 720, y: 400, width: 300, height: 400, fill: "#1a1a28", radius: 12, selectable: false },
                { id: "dj-3-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png", x: 870, y: 410, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "top", shadow: { color: "rgba(250,204,21,0.6)", blur: 35, offsetX: 0, offsetY: 0 } },
                { id: "dj-3-bar", type: "shape", shape: "rect", x: 720, y: 750, width: 300, height: 6, fill: "#facc15", selectable: false },
                { id: "dj-3-name", type: "text", text: "DJ KAI", x: 720, y: 765, width: 300, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 150 },
                { id: "dj-3-genre", type: "text", text: "REGGAETON", x: 720, y: 795, width: 300, fontSize: 12, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                // Banda inferior con info — gradiente simulado violeta→rosa
                { id: "info-band-bg", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 450, fill: "#1a0a1f", selectable: false },
                { id: "info-band-accent", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 4, fill: "#facc15", selectable: false },
                // Fecha grande
                { id: "date-day", type: "text", text: "VIE 28  ·  SÁB 29", x: 540, y: 935, width: 1080, fontSize: 60, fontFamily: "Anton, Impact, sans-serif", color: "#facc15", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "date-month", type: "text", text: "JUNIO  ·  2026", x: 540, y: 1010, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 600 },
                // Hora
                { id: "time", type: "text", text: "23:00 — 06:00 H", x: 540, y: 1075, width: 1080, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 250 },
                // Sala
                { id: "venue", type: "text", text: "RAZZMATAZZ  ·  BARCELONA", x: 540, y: 1130, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
                // Precio + abono
                { id: "price-bg", type: "shape", shape: "rect", x: 240, y: 1190, width: 600, height: 60, fill: "#facc15", radius: 30, selectable: false },
                { id: "price", type: "text", text: "ABONO 2 DÍAS  ·  35€", x: 540, y: 1205, width: 600, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#1a0a1f", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                // Tickets URL
                { id: "tickets", type: "text", text: "ENTRADAS · ENTRADIUM.COM", x: 540, y: 1280, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(250,204,21,0.85)", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 500 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 55 — DJ Tropical House (DJ-1, beach party + sunset turquoise vibes)
// ─────────────────────────────────────────────────────────────────────
    {
        id: 55,
        title: "DJ Tropical House",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
        premium: false,
        audience: ["productoras", "freelance"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // Fondo coral sunset
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#fb7185", selectable: false },
                // Capa naranja arriba
                { id: "sunset-orange", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 700, fill: "#fb923c", opacity: 0.85, selectable: false },
                // Capa amarilla degradada
                { id: "sunset-yellow", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 400, fill: "#fde047", opacity: 0.55, selectable: false },
                // Sol — círculo blanco
                { id: "sun", type: "shape", shape: "circle", x: 540, y: 280, width: 420, height: 420, radius: 210, fill: "#ffffff", opacity: 0.85, originX: "center", originY: "center", selectable: false },
                // Mar — banda turquesa abajo
                { id: "sea", type: "shape", shape: "rect", x: 0, y: 850, width: 1080, height: 500, fill: "#14b8a6", selectable: false },
                // Olas — bandas blancas finas
                { id: "wave-1", type: "shape", shape: "rect", x: 0, y: 870, width: 1080, height: 3, fill: "#ffffff", opacity: 0.55, selectable: false },
                { id: "wave-2", type: "shape", shape: "rect", x: 0, y: 890, width: 1080, height: 2, fill: "#ffffff", opacity: 0.40, selectable: false },
                // KICKER
                { id: "kicker", type: "text", text: "TROPICAL HOUSE  ·  BEACH PARTY", x: 540, y: 80, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#7c2d12", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 500 },
                // TÍTULO PARADISE
                { id: "title-1", type: "text", text: "PARADISE", x: 540, y: 480, width: 1080, fontSize: 120, fontFamily: "Anton, Impact, sans-serif", color: "#0c4a6e", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 60 },
                // Subtítulo SESSION
                { id: "title-2", type: "text", text: "SESSION", x: 540, y: 600, width: 1080, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#ffffff", fontStyle: "italic", textAlign: "center", originX: "center", originY: "top", charSpacing: 100 },
                // DJ photo
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 540, y: 720, scaleX: 0.95, scaleY: 0.95, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.85)", blur: 50, offsetX: 0, offsetY: 0 } },
                // Info bottom
                { id: "info-bg", type: "shape", shape: "rect", x: 0, y: 1200, width: 1080, height: 150, fill: "#0c4a6e", selectable: false },
                { id: "dj-name", type: "text", text: "DJ NOVA", x: 540, y: 1220, width: 1080, fontSize: 40, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 250 },
                { id: "date", type: "text", text: "SÁB 13 JUL  ·  PLAYA DE PALMA", x: 540, y: 1280, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
                { id: "venue", type: "text", text: "16:00 — 00:00  ·  25€ DESDE 18 AÑOS", x: 540, y: 1315, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 56 — DJ Hip-Hop Graffiti (DJ-3, concrete + spray naranja/amarillo)
// ─────────────────────────────────────────────────────────────────────
    {
        id: 56,
        title: "DJ Hip-Hop Graffiti",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png",
        premium: false,
        audience: ["productoras", "freelance"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // Fondo concrete (gris oscuro)
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1f2937", selectable: false },
                // Manchas concrete simuladas (rectángulos oscuros aleatorios)
                { id: "stain-1", type: "shape", shape: "rect", x: 100, y: 300, width: 400, height: 250, fill: "#111827", opacity: 0.65, angle: -8, selectable: false },
                { id: "stain-2", type: "shape", shape: "rect", x: 600, y: 900, width: 350, height: 200, fill: "#111827", opacity: 0.55, angle: 6, selectable: false },
                // Spray naranja — forma decorativa
                { id: "spray-orange", type: "shape", shape: "rect", x: 60, y: 120, width: 250, height: 80, fill: "#fb923c", angle: -8, opacity: 0.95, selectable: false },
                // Spray amarillo
                { id: "spray-yellow", type: "shape", shape: "rect", x: 780, y: 850, width: 200, height: 60, fill: "#fde047", angle: 12, opacity: 0.95, selectable: false },
                // Drip naranja (líneas finas que simulan goteos de spray)
                { id: "drip-1", type: "shape", shape: "rect", x: 130, y: 190, width: 4, height: 50, fill: "#fb923c", selectable: false },
                { id: "drip-2", type: "shape", shape: "rect", x: 200, y: 195, width: 3, height: 35, fill: "#fb923c", selectable: false },
                { id: "drip-3", type: "shape", shape: "rect", x: 270, y: 190, width: 4, height: 40, fill: "#fb923c", selectable: false },
                // TÍTULO STREET en outline naranja
                { id: "title-1", type: "text", text: "STREET", x: 540, y: 220, width: 1080, fontSize: 140, fontFamily: "Anton, Impact, sans-serif", color: "transparent", stroke: "#fb923c", strokeWidth: 4, fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 60 },
                // BEATS sólido amarillo
                { id: "title-2", type: "text", text: "BEATS", x: 540, y: 360, width: 1080, fontSize: 160, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 40 },
                // KICKER
                { id: "kicker", type: "text", text: "★ HIP-HOP NIGHT ★", x: 540, y: 540, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
                // DJ photo
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png", x: 540, y: 590, scaleX: 1.0, scaleY: 1.0, originX: "center", originY: "top", shadow: { color: "rgba(251,146,60,0.7)", blur: 50, offsetX: 4, offsetY: 4 } },
                // Tag pegatina
                { id: "sticker-bg", type: "shape", shape: "rect", x: 100, y: 1200, width: 880, height: 70, fill: "#fde047", angle: -1.5, selectable: false },
                { id: "dj-name", type: "text", text: "DJ MASTER  ·  MC FLOW  ·  DJ UVE", x: 540, y: 1218, width: 880, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#1f2937", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 80 },
                // Info bottom
                { id: "date", type: "text", text: "VIE 19 JUL  ·  23:30 H", x: 540, y: 1290, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fde047", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "venue", type: "text", text: "SALA VILLANOS  ·  MADRID  ·  12€", x: 540, y: 1320, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 57 — DJ Electronic Grid (DJ-2, cyber pink + cyan + wireframe grid)
// ─────────────────────────────────────────────────────────────────────
    {
        id: 57,
        title: "DJ Electronic Grid",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
        premium: false,
        audience: ["productoras", "freelance"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // Fondo oscuro azulado
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a1f", selectable: false },
                // Glow cyan top-left
                { id: "glow-cyan", type: "shape", shape: "circle", x: 100, y: 100, width: 700, height: 700, radius: 350, fill: "#06b6d4", opacity: 0.20, originX: "center", originY: "center", selectable: false },
                // Glow pink bottom-right
                { id: "glow-pink", type: "shape", shape: "circle", x: 900, y: 1200, width: 700, height: 700, radius: 350, fill: "#ec4899", opacity: 0.25, originX: "center", originY: "center", selectable: false },
                // GRID — líneas horizontales cyan (wireframe)
                { id: "grid-h-1", type: "shape", shape: "rect", x: 0, y: 200, width: 1080, height: 1, fill: "#06b6d4", opacity: 0.30, selectable: false },
                { id: "grid-h-2", type: "shape", shape: "rect", x: 0, y: 350, width: 1080, height: 1, fill: "#06b6d4", opacity: 0.25, selectable: false },
                { id: "grid-h-3", type: "shape", shape: "rect", x: 0, y: 500, width: 1080, height: 1, fill: "#06b6d4", opacity: 0.20, selectable: false },
                { id: "grid-h-4", type: "shape", shape: "rect", x: 0, y: 1000, width: 1080, height: 1, fill: "#ec4899", opacity: 0.25, selectable: false },
                { id: "grid-h-5", type: "shape", shape: "rect", x: 0, y: 1150, width: 1080, height: 1, fill: "#ec4899", opacity: 0.20, selectable: false },
                // GRID — líneas verticales
                { id: "grid-v-1", type: "shape", shape: "rect", x: 200, y: 0, width: 1, height: 1350, fill: "#06b6d4", opacity: 0.20, selectable: false },
                { id: "grid-v-2", type: "shape", shape: "rect", x: 540, y: 0, width: 1, height: 1350, fill: "#ec4899", opacity: 0.25, selectable: false },
                { id: "grid-v-3", type: "shape", shape: "rect", x: 880, y: 0, width: 1, height: 1350, fill: "#06b6d4", opacity: 0.20, selectable: false },
                // KICKER
                { id: "kicker", type: "text", text: "[ CYBER ELECTRONIC SESSION ]", x: 540, y: 80, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 500 },
                // TÍTULO TECH gradiente simulado
                { id: "title-1", type: "text", text: "TECH", x: 540, y: 130, width: 1080, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#06b6d4", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 60 },
                // Subtítulo NIGHT en pink
                { id: "title-2", type: "text", text: "NIGHT", x: 540, y: 330, width: 1080, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ec4899", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 150 },
                // DJ photo con glow doble
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 540, y: 500, scaleX: 1.05, scaleY: 1.05, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.7)", blur: 60, offsetX: 0, offsetY: 0 } },
                // Info bottom — banda translúcida con borde
                { id: "info-bg", type: "shape", shape: "rect", x: 60, y: 1170, width: 960, height: 150, fill: "rgba(6,182,212,0.10)", radius: 6, stroke: "#06b6d4", strokeWidth: 1, selectable: false },
                { id: "dj-name", type: "text", text: "DJ AXIS  ·  LIVE SET", x: 540, y: 1190, width: 960, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "date", type: "text", text: ">>  SÁB 06 JUL  ·  23:00 — 06:00", x: 540, y: 1240, width: 960, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 250 },
                { id: "venue", type: "text", text: "FABRIK  ·  HUMANES (MADRID)  ·  20€", x: 540, y: 1280, width: 960, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 58 — DJ Vinyl Vintage (DJ-1, sepia/dorado + texturas grano + vinyl)
// ─────────────────────────────────────────────────────────────────────
    {
        id: 58,
        title: "DJ Vinyl Vintage",
        category: "Club / Discoteca",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
        premium: false,
        audience: ["productoras", "freelance"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                // Fondo crema vintage
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#f5e6c8", selectable: false },
                // Marco dorado interior
                { id: "frame-top", type: "shape", shape: "rect", x: 40, y: 40, width: 1000, height: 4, fill: "#b8860b", selectable: false },
                { id: "frame-bottom", type: "shape", shape: "rect", x: 40, y: 1306, width: 1000, height: 4, fill: "#b8860b", selectable: false },
                { id: "frame-left", type: "shape", shape: "rect", x: 40, y: 40, width: 4, height: 1270, fill: "#b8860b", selectable: false },
                { id: "frame-right", type: "shape", shape: "rect", x: 1036, y: 40, width: 4, height: 1270, fill: "#b8860b", selectable: false },
                // Disco vinyl decorativo arriba derecha
                { id: "vinyl-outer", type: "shape", shape: "circle", x: 880, y: 200, width: 280, height: 280, radius: 140, fill: "#1a1a1a", originX: "center", originY: "center", selectable: false },
                { id: "vinyl-ring-1", type: "shape", shape: "circle", x: 880, y: 200, width: 220, height: 220, radius: 110, fill: "transparent", stroke: "#3d3d3d", strokeWidth: 1, originX: "center", originY: "center", selectable: false },
                { id: "vinyl-ring-2", type: "shape", shape: "circle", x: 880, y: 200, width: 160, height: 160, radius: 80, fill: "transparent", stroke: "#3d3d3d", strokeWidth: 1, originX: "center", originY: "center", selectable: false },
                { id: "vinyl-label", type: "shape", shape: "circle", x: 880, y: 200, width: 90, height: 90, radius: 45, fill: "#7c2d12", originX: "center", originY: "center", selectable: false },
                { id: "vinyl-center", type: "shape", shape: "circle", x: 880, y: 200, width: 14, height: 14, radius: 7, fill: "#f5e6c8", originX: "center", originY: "center", selectable: false },
                // Textura grano simulada — puntos dispersos
                { id: "grain-1", type: "shape", shape: "circle", x: 120, y: 350, width: 4, height: 4, radius: 2, fill: "#5c3317", opacity: 0.40, selectable: false },
                { id: "grain-2", type: "shape", shape: "circle", x: 250, y: 480, width: 3, height: 3, radius: 1.5, fill: "#5c3317", opacity: 0.35, selectable: false },
                { id: "grain-3", type: "shape", shape: "circle", x: 950, y: 720, width: 5, height: 5, radius: 2.5, fill: "#5c3317", opacity: 0.30, selectable: false },
                { id: "grain-4", type: "shape", shape: "circle", x: 180, y: 890, width: 3, height: 3, radius: 1.5, fill: "#5c3317", opacity: 0.35, selectable: false },
                { id: "grain-5", type: "shape", shape: "circle", x: 800, y: 1020, width: 4, height: 4, radius: 2, fill: "#5c3317", opacity: 0.30, selectable: false },
                // KICKER decorativo arriba izq
                { id: "kicker", type: "text", text: "VINYL ONLY  ·  EST. 1968", x: 60, y: 90, width: 700, fontSize: 16, fontFamily: "Cormorant Garamond, serif", color: "#7c2d12", fontWeight: "700", textAlign: "left", originX: "left", originY: "top", charSpacing: 500 },
                // TÍTULO hero serif italica
                { id: "title-1", type: "text", text: "Soul", x: 60, y: 140, width: 800, fontSize: 180, fontFamily: "Playfair Display, serif", color: "#1f1010", fontStyle: "italic", textAlign: "left", originX: "left", originY: "top" },
                // Subtítulo &
                { id: "title-amp", type: "text", text: "&", x: 60, y: 320, width: 800, fontSize: 100, fontFamily: "Playfair Display, serif", color: "#b8860b", fontStyle: "italic", textAlign: "left", originX: "left", originY: "top" },
                // Subtítulo Funk
                { id: "title-2", type: "text", text: "Funk", x: 60, y: 420, width: 800, fontSize: 180, fontFamily: "Playfair Display, serif", color: "#7c2d12", fontStyle: "italic", textAlign: "left", originX: "left", originY: "top" },
                // Divider ornamental
                { id: "div-line", type: "shape", shape: "rect", x: 60, y: 640, width: 200, height: 2, fill: "#b8860b", selectable: false },
                // Descripción
                { id: "desc", type: "text", text: "Una noche de vinilo clásico, soul, funk\ny groove. Solo vinilo, solo verdad.", x: 60, y: 660, width: 700, fontSize: 20, fontFamily: "Cormorant Garamond, serif", color: "rgba(31,16,16,0.78)", fontStyle: "italic", textAlign: "left", lineHeight: 1.3, originX: "left", originY: "top" },
                // DJ photo a la derecha
                { id: "dj-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 700, y: 480, scaleX: 0.75, scaleY: 0.75, originX: "center", originY: "top", shadow: { color: "rgba(184,134,11,0.45)", blur: 30, offsetX: 4, offsetY: 4 } },
                // Banda info inferior — fondo oscuro
                { id: "info-bg", type: "shape", shape: "rect", x: 60, y: 1100, width: 960, height: 180, fill: "#1f1010", selectable: false },
                { id: "info-frame-top", type: "shape", shape: "rect", x: 60, y: 1100, width: 960, height: 2, fill: "#b8860b", selectable: false },
                { id: "info-frame-bottom", type: "shape", shape: "rect", x: 60, y: 1278, width: 960, height: 2, fill: "#b8860b", selectable: false },
                { id: "dj-name", type: "text", text: "DJ VINTAGE", x: 540, y: 1130, width: 960, fontSize: 38, fontFamily: "Playfair Display, serif", color: "#f5e6c8", fontStyle: "italic", textAlign: "center", originX: "center", originY: "top", charSpacing: 100 },
                { id: "date", type: "text", text: "Sábado 27 Julio  ·  22:00 H", x: 540, y: 1190, width: 960, fontSize: 22, fontFamily: "Cormorant Garamond, serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "venue", type: "text", text: "GROOVE BAR  ·  LAVAPIÉS  ·  MADRID  ·  10€", x: 540, y: 1230, width: 960, fontSize: 14, fontFamily: "Cormorant Garamond, serif", color: "rgba(245,230,200,0.85)", fontStyle: "italic", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 59 — DJ Lineup 4 (grid 2x2, festival medio-formato)
//      Para eventos con 4 DJs. Más espacio por slot que en festivales grandes.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 59,
        title: "DJ Lineup 4",
        category: "Festival",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
        premium: false,
        audience: ["productoras"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0b0b18", selectable: false },
                { id: "glow-tl", type: "shape", shape: "circle", x: 100, y: 100, width: 600, height: 600, radius: 300, fill: "#a855f7", opacity: 0.28, originX: "center", originY: "center", selectable: false },
                { id: "glow-br", type: "shape", shape: "circle", x: 980, y: 1250, width: 600, height: 600, radius: 300, fill: "#ec4899", opacity: 0.28, originX: "center", originY: "center", selectable: false },
                // Header
                { id: "kicker", type: "text", text: "F O U R   D J   N I G H T", x: 540, y: 60, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 700 },
                { id: "title-1", type: "text", text: "BASS", x: 540, y: 105, width: 1080, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 40 },
                { id: "title-2", type: "text", text: "REVOLUTION", x: 540, y: 235, width: 1080, fontSize: 60, fontFamily: "Anton, Impact, sans-serif", color: "#a855f7", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                // GRID 2x2 — Slots de 460x270, gap 20
                // DJ 1 (top-left) — rojo
                { id: "slot-1-bg", type: "shape", shape: "rect", x: 60, y: 330, width: 470, height: 280, fill: "#1a1a28", radius: 16, selectable: false },
                { id: "dj-1-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 295, y: 340, scaleX: 0.42, scaleY: 0.42, originX: "center", originY: "top", shadow: { color: "rgba(239,68,68,0.6)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "dj-1-bar", type: "shape", shape: "rect", x: 60, y: 560, width: 470, height: 6, fill: "#ef4444", selectable: false },
                { id: "dj-1-name", type: "text", text: "DJ NOVA", x: 60, y: 575, width: 470, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 150 },
                { id: "dj-1-genre", type: "text", text: "TECHNO", x: 60, y: 605, width: 470, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "#ef4444", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                // DJ 2 (top-right) — cyan
                { id: "slot-2-bg", type: "shape", shape: "rect", x: 550, y: 330, width: 470, height: 280, fill: "#1a1a28", radius: 16, selectable: false },
                { id: "dj-2-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 785, y: 340, scaleX: 0.42, scaleY: 0.42, originX: "center", originY: "top", shadow: { color: "rgba(6,182,212,0.6)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "dj-2-bar", type: "shape", shape: "rect", x: 550, y: 560, width: 470, height: 6, fill: "#06b6d4", selectable: false },
                { id: "dj-2-name", type: "text", text: "DJ AXIS", x: 550, y: 575, width: 470, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 150 },
                { id: "dj-2-genre", type: "text", text: "HOUSE", x: 550, y: 605, width: 470, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                // DJ 3 (bottom-left) — amarillo
                { id: "slot-3-bg", type: "shape", shape: "rect", x: 60, y: 630, width: 470, height: 280, fill: "#1a1a28", radius: 16, selectable: false },
                { id: "dj-3-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png", x: 295, y: 640, scaleX: 0.42, scaleY: 0.42, originX: "center", originY: "top", shadow: { color: "rgba(250,204,21,0.6)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "dj-3-bar", type: "shape", shape: "rect", x: 60, y: 860, width: 470, height: 6, fill: "#facc15", selectable: false },
                { id: "dj-3-name", type: "text", text: "DJ KAI", x: 60, y: 875, width: 470, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 150 },
                { id: "dj-3-genre", type: "text", text: "REGGAETON", x: 60, y: 905, width: 470, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                // DJ 4 (bottom-right) — rosa
                { id: "slot-4-bg", type: "shape", shape: "rect", x: 550, y: 630, width: 470, height: 280, fill: "#1a1a28", radius: 16, selectable: false },
                { id: "dj-4-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 785, y: 640, scaleX: 0.42, scaleY: 0.42, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.6)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "dj-4-bar", type: "shape", shape: "rect", x: 550, y: 860, width: 470, height: 6, fill: "#ec4899", selectable: false },
                { id: "dj-4-name", type: "text", text: "DJ LUNA", x: 550, y: 875, width: 470, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 150 },
                { id: "dj-4-genre", type: "text", text: "AFRO HOUSE", x: 550, y: 905, width: 470, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                // Footer info band
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 950, width: 1080, height: 400, fill: "#1a0a1f", selectable: false },
                { id: "info-accent", type: "shape", shape: "rect", x: 0, y: 950, width: 1080, height: 4, fill: "#facc15", selectable: false },
                { id: "date-day", type: "text", text: "VIE 12  ·  SÁB 13", x: 540, y: 985, width: 1080, fontSize: 60, fontFamily: "Anton, Impact, sans-serif", color: "#facc15", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "date-month", type: "text", text: "SEPTIEMBRE  ·  2026", x: 540, y: 1060, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 600 },
                { id: "time", type: "text", text: "23:00 — 07:00 H", x: 540, y: 1125, width: 1080, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 250 },
                { id: "venue", type: "text", text: "MIRADOR  ·  MADRID", x: 540, y: 1180, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
                { id: "price-bg", type: "shape", shape: "rect", x: 240, y: 1240, width: 600, height: 60, fill: "#facc15", radius: 30, selectable: false },
                { id: "price", type: "text", text: "ABONO 2 DÍAS  ·  45€", x: 540, y: 1255, width: 600, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#1a0a1f", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 60 — DJ Lineup 6 (grid 3x2, festival mediano)
//      Para eventos con 6 DJs. 3 columnas x 2 filas.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 60,
        title: "DJ Lineup 6",
        category: "Festival",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png",
        premium: false,
        audience: ["productoras"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a14", selectable: false },
                { id: "glow-1", type: "shape", shape: "circle", x: 540, y: 600, width: 800, height: 800, radius: 400, fill: "#7c3aed", opacity: 0.22, originX: "center", originY: "center", selectable: false },
                // Header
                { id: "kicker", type: "text", text: "S I X   D J   F E S T I V A L", x: 540, y: 55, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 600 },
                { id: "title-1", type: "text", text: "NEON", x: 540, y: 95, width: 1080, fontSize: 120, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 40 },
                { id: "title-2", type: "text", text: "WAVE", x: 540, y: 215, width: 1080, fontSize: 80, fontFamily: "Anton, Impact, sans-serif", color: "#06b6d4", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                // GRID 3x2 — slots de 310x270, gap 15
                // FILA 1
                { id: "slot-1-bg", type: "shape", shape: "rect", x: 60, y: 330, width: 310, height: 270, fill: "#1a1a28", radius: 12, selectable: false },
                { id: "dj-1-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 215, y: 340, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "top", shadow: { color: "rgba(239,68,68,0.55)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "dj-1-bar", type: "shape", shape: "rect", x: 60, y: 555, width: 310, height: 5, fill: "#ef4444", selectable: false },
                { id: "dj-1-name", type: "text", text: "DJ NOVA", x: 60, y: 568, width: 310, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 120 },
                { id: "dj-1-genre", type: "text", text: "TECHNO", x: 60, y: 593, width: 310, fontSize: 11, fontFamily: "Montserrat, sans-serif", color: "#ef4444", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 350 },
                { id: "slot-2-bg", type: "shape", shape: "rect", x: 385, y: 330, width: 310, height: 270, fill: "#1a1a28", radius: 12, selectable: false },
                { id: "dj-2-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 540, y: 340, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "top", shadow: { color: "rgba(6,182,212,0.55)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "dj-2-bar", type: "shape", shape: "rect", x: 385, y: 555, width: 310, height: 5, fill: "#06b6d4", selectable: false },
                { id: "dj-2-name", type: "text", text: "DJ AXIS", x: 385, y: 568, width: 310, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 120 },
                { id: "dj-2-genre", type: "text", text: "HOUSE", x: 385, y: 593, width: 310, fontSize: 11, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 350 },
                { id: "slot-3-bg", type: "shape", shape: "rect", x: 710, y: 330, width: 310, height: 270, fill: "#1a1a28", radius: 12, selectable: false },
                { id: "dj-3-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png", x: 865, y: 340, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "top", shadow: { color: "rgba(250,204,21,0.55)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "dj-3-bar", type: "shape", shape: "rect", x: 710, y: 555, width: 310, height: 5, fill: "#facc15", selectable: false },
                { id: "dj-3-name", type: "text", text: "DJ KAI", x: 710, y: 568, width: 310, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 120 },
                { id: "dj-3-genre", type: "text", text: "REGGAETON", x: 710, y: 593, width: 310, fontSize: 11, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 350 },
                // FILA 2
                { id: "slot-4-bg", type: "shape", shape: "rect", x: 60, y: 615, width: 310, height: 270, fill: "#1a1a28", radius: 12, selectable: false },
                { id: "dj-4-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 215, y: 625, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.55)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "dj-4-bar", type: "shape", shape: "rect", x: 60, y: 840, width: 310, height: 5, fill: "#ec4899", selectable: false },
                { id: "dj-4-name", type: "text", text: "DJ LUNA", x: 60, y: 853, width: 310, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 120 },
                { id: "dj-4-genre", type: "text", text: "AFRO HOUSE", x: 60, y: 878, width: 310, fontSize: 11, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 350 },
                { id: "slot-5-bg", type: "shape", shape: "rect", x: 385, y: 615, width: 310, height: 270, fill: "#1a1a28", radius: 12, selectable: false },
                { id: "dj-5-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 540, y: 625, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "top", shadow: { color: "rgba(168,85,247,0.55)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "dj-5-bar", type: "shape", shape: "rect", x: 385, y: 840, width: 310, height: 5, fill: "#a855f7", selectable: false },
                { id: "dj-5-name", type: "text", text: "DJ ZARA", x: 385, y: 853, width: 310, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 120 },
                { id: "dj-5-genre", type: "text", text: "TRANCE", x: 385, y: 878, width: 310, fontSize: 11, fontFamily: "Montserrat, sans-serif", color: "#a855f7", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 350 },
                { id: "slot-6-bg", type: "shape", shape: "rect", x: 710, y: 615, width: 310, height: 270, fill: "#1a1a28", radius: 12, selectable: false },
                { id: "dj-6-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png", x: 865, y: 625, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "top", shadow: { color: "rgba(34,197,94,0.55)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "dj-6-bar", type: "shape", shape: "rect", x: 710, y: 840, width: 310, height: 5, fill: "#22c55e", selectable: false },
                { id: "dj-6-name", type: "text", text: "DJ ROKA", x: 710, y: 853, width: 310, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 120 },
                { id: "dj-6-genre", type: "text", text: "DRUM & BASS", x: 710, y: 878, width: 310, fontSize: 11, fontFamily: "Montserrat, sans-serif", color: "#22c55e", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 350 },
                // Footer
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 920, width: 1080, height: 430, fill: "#0f0f1a", selectable: false },
                { id: "info-accent", type: "shape", shape: "rect", x: 0, y: 920, width: 1080, height: 4, fill: "#06b6d4", selectable: false },
                { id: "date-day", type: "text", text: "VIE 09  ·  SÁB 10", x: 540, y: 955, width: 1080, fontSize: 55, fontFamily: "Anton, Impact, sans-serif", color: "#06b6d4", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "date-month", type: "text", text: "OCTUBRE  ·  2026", x: 540, y: 1025, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 600 },
                { id: "time", type: "text", text: "22:00 — 07:00 H", x: 540, y: 1085, width: 1080, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 250 },
                { id: "venue", type: "text", text: "CLUB ORBIT  ·  MADRID", x: 540, y: 1140, width: 1080, fontSize: 19, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
                { id: "price-bg", type: "shape", shape: "rect", x: 240, y: 1195, width: 600, height: 60, fill: "#06b6d4", radius: 30, selectable: false },
                { id: "price", type: "text", text: "ABONO 2 DÍAS  ·  55€", x: 540, y: 1210, width: 600, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0a0a14", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "tickets", type: "text", text: "ENTRADAS · ENTRADIUM.COM", x: 540, y: 1290, width: 1080, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "rgba(6,182,212,0.85)", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 500 },
            ] },
        ],
    },

// ─────────────────────────────────────────────────────────────────────
// 61 — DJ Lineup 8 (grid 4x2, festival grande)
//      Para eventos con 8 DJs. 4 columnas x 2 filas, slots compactos.
// ─────────────────────────────────────────────────────────────────────
    {
        id: 61,
        title: "DJ Lineup 8",
        category: "Festival",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
        premium: false,
        audience: ["productoras"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#08080f", selectable: false },
                { id: "glow-tl", type: "shape", shape: "circle", x: 150, y: 200, width: 500, height: 500, radius: 250, fill: "#ef4444", opacity: 0.20, originX: "center", originY: "center", selectable: false },
                { id: "glow-tr", type: "shape", shape: "circle", x: 930, y: 200, width: 500, height: 500, radius: 250, fill: "#06b6d4", opacity: 0.20, originX: "center", originY: "center", selectable: false },
                // Header — compacto para dar espacio a 8 slots
                { id: "kicker", type: "text", text: "M E G A   F E S T   ·   8   D J S", x: 540, y: 50, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 500 },
                { id: "title-1", type: "text", text: "ULTRA", x: 540, y: 85, width: 1080, fontSize: 100, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 40 },
                { id: "title-2", type: "text", text: "FEST", x: 540, y: 185, width: 1080, fontSize: 60, fontFamily: "Anton, Impact, sans-serif", color: "#facc15", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                // GRID 4x2 — slots de 230x265, gap 16
                // FILA 1
                { id: "slot-1-bg", type: "shape", shape: "rect", x: 60, y: 275, width: 230, height: 270, fill: "#15151f", radius: 10, selectable: false },
                { id: "dj-1-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 175, y: 285, scaleX: 0.24, scaleY: 0.24, originX: "center", originY: "top", shadow: { color: "rgba(239,68,68,0.5)", blur: 20, offsetX: 0, offsetY: 0 } },
                { id: "dj-1-bar", type: "shape", shape: "rect", x: 60, y: 500, width: 230, height: 4, fill: "#ef4444", selectable: false },
                { id: "dj-1-name", type: "text", text: "DJ NOVA", x: 60, y: 510, width: 230, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 90 },
                { id: "dj-1-genre", type: "text", text: "TECHNO", x: 60, y: 530, width: 230, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#ef4444", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 300 },
                { id: "slot-2-bg", type: "shape", shape: "rect", x: 305, y: 275, width: 230, height: 270, fill: "#15151f", radius: 10, selectable: false },
                { id: "dj-2-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 420, y: 285, scaleX: 0.24, scaleY: 0.24, originX: "center", originY: "top", shadow: { color: "rgba(6,182,212,0.5)", blur: 20, offsetX: 0, offsetY: 0 } },
                { id: "dj-2-bar", type: "shape", shape: "rect", x: 305, y: 500, width: 230, height: 4, fill: "#06b6d4", selectable: false },
                { id: "dj-2-name", type: "text", text: "DJ AXIS", x: 305, y: 510, width: 230, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 90 },
                { id: "dj-2-genre", type: "text", text: "HOUSE", x: 305, y: 530, width: 230, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 300 },
                { id: "slot-3-bg", type: "shape", shape: "rect", x: 550, y: 275, width: 230, height: 270, fill: "#15151f", radius: 10, selectable: false },
                { id: "dj-3-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png", x: 665, y: 285, scaleX: 0.24, scaleY: 0.24, originX: "center", originY: "top", shadow: { color: "rgba(250,204,21,0.5)", blur: 20, offsetX: 0, offsetY: 0 } },
                { id: "dj-3-bar", type: "shape", shape: "rect", x: 550, y: 500, width: 230, height: 4, fill: "#facc15", selectable: false },
                { id: "dj-3-name", type: "text", text: "DJ KAI", x: 550, y: 510, width: 230, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 90 },
                { id: "dj-3-genre", type: "text", text: "REGGAETON", x: 550, y: 530, width: 230, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#facc15", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 300 },
                { id: "slot-4-bg", type: "shape", shape: "rect", x: 795, y: 275, width: 230, height: 270, fill: "#15151f", radius: 10, selectable: false },
                { id: "dj-4-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 910, y: 285, scaleX: 0.24, scaleY: 0.24, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.5)", blur: 20, offsetX: 0, offsetY: 0 } },
                { id: "dj-4-bar", type: "shape", shape: "rect", x: 795, y: 500, width: 230, height: 4, fill: "#ec4899", selectable: false },
                { id: "dj-4-name", type: "text", text: "DJ LUNA", x: 795, y: 510, width: 230, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 90 },
                { id: "dj-4-genre", type: "text", text: "AFRO HOUSE", x: 795, y: 530, width: 230, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 300 },
                // FILA 2
                { id: "slot-5-bg", type: "shape", shape: "rect", x: 60, y: 560, width: 230, height: 270, fill: "#15151f", radius: 10, selectable: false },
                { id: "dj-5-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 175, y: 570, scaleX: 0.24, scaleY: 0.24, originX: "center", originY: "top", shadow: { color: "rgba(168,85,247,0.5)", blur: 20, offsetX: 0, offsetY: 0 } },
                { id: "dj-5-bar", type: "shape", shape: "rect", x: 60, y: 785, width: 230, height: 4, fill: "#a855f7", selectable: false },
                { id: "dj-5-name", type: "text", text: "DJ ZARA", x: 60, y: 795, width: 230, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 90 },
                { id: "dj-5-genre", type: "text", text: "TRANCE", x: 60, y: 815, width: 230, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#a855f7", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 300 },
                { id: "slot-6-bg", type: "shape", shape: "rect", x: 305, y: 560, width: 230, height: 270, fill: "#15151f", radius: 10, selectable: false },
                { id: "dj-6-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png", x: 420, y: 570, scaleX: 0.24, scaleY: 0.24, originX: "center", originY: "top", shadow: { color: "rgba(34,197,94,0.5)", blur: 20, offsetX: 0, offsetY: 0 } },
                { id: "dj-6-bar", type: "shape", shape: "rect", x: 305, y: 785, width: 230, height: 4, fill: "#22c55e", selectable: false },
                { id: "dj-6-name", type: "text", text: "DJ ROKA", x: 305, y: 795, width: 230, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 90 },
                { id: "dj-6-genre", type: "text", text: "DRUM & BASS", x: 305, y: 815, width: 230, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#22c55e", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 300 },
                { id: "slot-7-bg", type: "shape", shape: "rect", x: 550, y: 560, width: 230, height: 270, fill: "#15151f", radius: 10, selectable: false },
                { id: "dj-7-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png", x: 665, y: 570, scaleX: 0.24, scaleY: 0.24, originX: "center", originY: "top", shadow: { color: "rgba(251,146,60,0.5)", blur: 20, offsetX: 0, offsetY: 0 } },
                { id: "dj-7-bar", type: "shape", shape: "rect", x: 550, y: 785, width: 230, height: 4, fill: "#fb923c", selectable: false },
                { id: "dj-7-name", type: "text", text: "DJ BLAZE", x: 550, y: 795, width: 230, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 90 },
                { id: "dj-7-genre", type: "text", text: "URBAN LATIN", x: 550, y: 815, width: 230, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#fb923c", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 300 },
                { id: "slot-8-bg", type: "shape", shape: "rect", x: 795, y: 560, width: 230, height: 270, fill: "#15151f", radius: 10, selectable: false },
                { id: "dj-8-img", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png", x: 910, y: 570, scaleX: 0.24, scaleY: 0.24, originX: "center", originY: "top", shadow: { color: "rgba(56,189,248,0.5)", blur: 20, offsetX: 0, offsetY: 0 } },
                { id: "dj-8-bar", type: "shape", shape: "rect", x: 795, y: 785, width: 230, height: 4, fill: "#38bdf8", selectable: false },
                { id: "dj-8-name", type: "text", text: "DJ KIRA", x: 795, y: 795, width: 230, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "left", originY: "top", charSpacing: 90 },
                { id: "dj-8-genre", type: "text", text: "ELECTRO POP", x: 795, y: 815, width: 230, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#38bdf8", fontWeight: "700", textAlign: "center", originX: "left", originY: "top", charSpacing: 300 },
                // Footer compacto
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 860, width: 1080, height: 490, fill: "#1a0a1f", selectable: false },
                { id: "info-accent", type: "shape", shape: "rect", x: 0, y: 860, width: 1080, height: 4, fill: "#facc15", selectable: false },
                { id: "date-day", type: "text", text: "JUE 17  ·  VIE 18  ·  SÁB 19", x: 540, y: 895, width: 1080, fontSize: 45, fontFamily: "Anton, Impact, sans-serif", color: "#facc15", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 150 },
                { id: "date-month", type: "text", text: "JULIO  ·  2026", x: 540, y: 960, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 600 },
                { id: "time", type: "text", text: "22:00 — 08:00 H  ·  3 ESCENARIOS", x: 540, y: 1020, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 250 },
                { id: "venue", type: "text", text: "RECINTO FERIAL  ·  VALENCIA", x: 540, y: 1080, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 350 },
                { id: "price-bg", type: "shape", shape: "rect", x: 200, y: 1140, width: 680, height: 60, fill: "#facc15", radius: 30, selectable: false },
                { id: "price", type: "text", text: "ABONO 3 DÍAS  ·  85€", x: 540, y: 1155, width: 680, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#1a0a1f", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
                { id: "tickets", type: "text", text: "ULTRAFEST.ES  ·  ABONOS LIMITADOS", x: 540, y: 1240, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(250,204,21,0.85)", fontWeight: "700", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
            ] },
        ],
    },

// ═════════════════════════════════════════════════════════════════════
// FAMILIA WORKSHOP / INTENSIVOS BAILE — 20 plantillas (IDs 62-81)
// 4 estilos × 5 composiciones = 20 flyers variados
// Kizomba (62-66) · Timba (67-71) · Reparto (72-76) · Reggaeton (77-81)
// Reutiliza los 10 modelos R2 Dance existentes con combinaciones distintas
// Cada plantilla: ciudad ES distinta + paleta unica + layout unico
// ═════════════════════════════════════════════════════════════════════

// ─── 62 — Masterclass Kizomba Fusion con Nelo Paim (1 solo) ─────────
    {
        id: 62,
        title: "Masterclass Kizomba Fusión",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1a0f08", selectable: false },
                { id: "bg-glow-1", type: "shape", shape: "circle", x: -180, y: 100, width: 720, height: 720, fill: "rgba(180,90,40,0.45)", opacity: 0.75, selectable: false },
                { id: "bg-glow-2", type: "shape", shape: "circle", x: 620, y: 200, width: 660, height: 660, fill: "rgba(212,160,80,0.28)", opacity: 0.7, selectable: false },
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 540, y: 100, scaleX: 1.30, scaleY: 1.30, originX: "center", originY: "top", shadow: { color: "rgba(212,160,80,0.5)", blur: 60, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 820, width: 1080, height: 530, fill: "rgba(15,8,4,0.82)", selectable: false },
                { id: "ornament-top", type: "shape", shape: "rect", x: 380, y: 890, width: 320, height: 1, fill: "#d4a058", selectable: false },
                { id: "kicker", type: "text", text: "MASTERCLASS · KIZOMBA FUSIÓN", x: 0, y: 905, width: 1080, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#d4a058", textAlign: "center", charSpacing: 450, fontStyle: "italic" },
                { id: "title", type: "text", text: "PROF. CARLOS", x: 0, y: 950, width: 1080, fontSize: 96, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "ornament-bot", type: "shape", shape: "rect", x: 380, y: 1090, width: 320, height: 1, fill: "#d4a058", selectable: false },
                { id: "date", type: "text", text: "SÁBADO 12 DE SEPTIEMBRE  ·  17:00 — 21:00 H", x: 0, y: 1120, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", charSpacing: 280 },
                { id: "venue", type: "text", text: "ESTUDIO CAFÉ BERLÍN  ·  C/ JESÚS Y MARÍA 6", x: 0, y: 1170, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#d4a058", textAlign: "center", charSpacing: 250 },
                { id: "city", type: "text", text: "MADRID", x: 0, y: 1210, width: 1080, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 900, fontStyle: "italic" },
                { id: "price-bg", type: "shape", shape: "rect", x: 380, y: 1265, width: 320, height: 50, fill: "transparent", stroke: "#d4a058", strokeWidth: 1, radius: 25, selectable: false },
                { id: "price", type: "text", text: "45€  ·  PLAZAS LIMITADAS", x: 0, y: 1278, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#d4a058", fontWeight: "600", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },

// ─── 63 — Kizomba Weekend en pareja (2 artistas) ─────────────────────
    {
        id: 63,
        title: "Kizomba Weekend en Pareja",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a1428", selectable: false },
                { id: "bg-radial", type: "shape", shape: "circle", x: 240, y: 300, width: 900, height: 900, fill: "rgba(30,58,138,0.55)", opacity: 0.8, selectable: false },
                { id: "bg-gold", type: "shape", shape: "circle", x: 620, y: 180, width: 500, height: 500, fill: "rgba(217,165,89,0.22)", opacity: 0.7, selectable: false },
                { id: "chip-bg", type: "shape", shape: "rect", x: 380, y: 60, width: 320, height: 38, fill: "transparent", stroke: "#d9a559", strokeWidth: 1, radius: 19, selectable: false },
                { id: "chip", type: "text", text: "WEEKEND KIZOMBA · EDICIÓN X", x: 0, y: 68, width: 1080, fontSize: 17, fontFamily: "Playfair Display, serif", color: "#d9a559", textAlign: "center", charSpacing: 400, fontStyle: "italic" },
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 540, y: 170, scaleX: 1.20, scaleY: 1.20, originX: "center", originY: "top", shadow: { color: "rgba(217,165,89,0.55)", blur: 55, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 860, width: 1080, height: 490, fill: "rgba(4,10,20,0.85)", selectable: false },
                { id: "title-1", type: "text", text: "SOFÍA", x: 0, y: 905, width: 1080, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 50 },
                { id: "ampersand", type: "text", text: "&", x: 0, y: 985, width: 1080, fontSize: 44, fontFamily: "Playfair Display, serif", color: "#d9a559", textAlign: "center", fontStyle: "italic" },
                { id: "title-2", type: "text", text: "MARCO", x: 0, y: 1030, width: 1080, fontSize: 90, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 50 },
                { id: "date", type: "text", text: "SÁBADO 8 · DOMINGO 9 DE NOVIEMBRE", x: 0, y: 1145, width: 1080, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#d9a559", fontWeight: "600", textAlign: "center", charSpacing: 250 },
                { id: "venue", type: "text", text: "SALA ANTILLA BCN  ·  PG. MARÍTIM 54", x: 0, y: 1185, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 200 },
                { id: "city", type: "text", text: "BARCELONA", x: 0, y: 1220, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 500, fontStyle: "italic" },
                { id: "price", type: "text", text: "PACK 2 DÍAS  ·  85€  ·  KIZOMBABCN.ES", x: 0, y: 1275, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#d9a559", fontWeight: "700", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },

// ─── 64 — Semba Intensivo 3 profesores (3 artistas triangulo) ────────
    {
        id: 64,
        title: "Semba Intensivo — 3 Profesores",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0d1f14", selectable: false },
                { id: "bg-glow", type: "shape", shape: "circle", x: 540, y: 320, width: 900, height: 900, fill: "rgba(46,101,64,0.5)", opacity: 0.75, selectable: false },
                { id: "leaf-1", type: "shape", shape: "circle", x: -80, y: 900, width: 320, height: 320, fill: "rgba(34,197,94,0.15)", opacity: 0.6, selectable: false },
                { id: "leaf-2", type: "shape", shape: "circle", x: 850, y: 60, width: 260, height: 260, fill: "rgba(34,197,94,0.15)", opacity: 0.6, selectable: false },
                { id: "kicker", type: "text", text: "• SEMBA INTENSIVO •", x: 0, y: 70, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#eab676", fontWeight: "700", textAlign: "center", charSpacing: 500 },
                { id: "artist-top", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 540, y: 120, scaleX: 1.0, scaleY: 1.0, originX: "center", originY: "top", shadow: { color: "rgba(234,182,118,0.7)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "artist-l", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 200, y: 480, scaleX: 0.75, scaleY: 0.75, originX: "center", originY: "top", shadow: { color: "rgba(234,182,118,0.65)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "artist-r", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 880, y: 480, scaleX: 0.75, scaleY: 0.75, originX: "center", originY: "top", shadow: { color: "rgba(234,182,118,0.65)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 870, width: 1080, height: 480, fill: "rgba(5,15,10,0.86)", selectable: false },
                { id: "title", type: "text", text: "SEMBA", x: 0, y: 910, width: 1080, fontSize: 145, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40 },
                { id: "subtitle", type: "text", text: "RAÍCES ANGOLEÑAS  ·  MÁLAGA 2026", x: 0, y: 1075, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#eab676", fontWeight: "600", textAlign: "center", charSpacing: 350 },
                { id: "divider", type: "shape", shape: "rect", x: 440, y: 1115, width: 200, height: 2, fill: "#eab676", selectable: false },
                { id: "date", type: "text", text: "3 DÍAS · VIE 20 A DOM 22 DE JUNIO", x: 0, y: 1135, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 220 },
                { id: "venue", type: "text", text: "SALA ANDÉN  ·  C/ CUARTELES 12  ·  MÁLAGA", x: 0, y: 1185, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", textAlign: "center", charSpacing: 220 },
                { id: "price", type: "text", text: "PACK 3 DÍAS  120€  ·  SUELTAS 50€", x: 0, y: 1240, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#eab676", textAlign: "center", charSpacing: 250 },
                { id: "cta", type: "text", text: "RESERVAS: +34 651 400 200  ·  SEMBAFEST.ES", x: 0, y: 1290, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "rgba(234,182,118,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 300 },
            ] },
        ],
    },

// ─── 65 — Kizomba 4 estilos (4 artistas grid 2x2) ───────────────────
    {
        id: 65,
        title: "Kizomba 4 Estilos — Workshop",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1a0a12", selectable: false },
                { id: "bg-blush", type: "shape", shape: "circle", x: -100, y: -100, width: 700, height: 700, fill: "rgba(244,182,192,0.35)", opacity: 0.7, selectable: false },
                { id: "bg-blush2", type: "shape", shape: "circle", x: 700, y: 1000, width: 700, height: 700, fill: "rgba(244,182,192,0.25)", opacity: 0.7, selectable: false },
                { id: "kicker", type: "text", text: "WORKSHOP KIZOMBA · 4 ESTILOS EN 1 DÍA", x: 0, y: 80, width: 1080, fontSize: 18, fontFamily: "Poppins, sans-serif", color: "#f4b6c0", fontWeight: "600", textAlign: "center", charSpacing: 380 },
                { id: "title", type: "text", text: "KIZOMBA 4.0", x: 0, y: 130, width: 1080, fontSize: 100, fontFamily: "Poppins, sans-serif", color: "#ffffff", fontWeight: "800", textAlign: "center", charSpacing: 20 },
                { id: "card-1-halo", type: "shape", shape: "circle", x: 300, y: 400, width: 300, height: 300, fill: "rgba(244,182,192,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "card-1-ring", type: "shape", shape: "circle", x: 300, y: 400, width: 260, height: 260, fill: "transparent", stroke: "#f4b6c0", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 300, y: 440, scaleX: 0.50, scaleY: 0.50, originX: "center", originY: "center", clipPath: { type: "circle", radius: 260, offsetY: -100 } },
                { id: "card-1-tag", type: "text", text: "URBAN KIZ", x: 120, y: 555, width: 360, fontSize: 20, fontFamily: "Poppins, sans-serif", color: "#f4b6c0", fontWeight: "800", textAlign: "center", originX: "left", originY: "top", charSpacing: 200 },
                { id: "card-2-halo", type: "shape", shape: "circle", x: 780, y: 400, width: 300, height: 300, fill: "rgba(244,182,192,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "card-2-ring", type: "shape", shape: "circle", x: 780, y: 400, width: 260, height: 260, fill: "transparent", stroke: "#f4b6c0", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 780, y: 440, scaleX: 0.50, scaleY: 0.50, originX: "center", originY: "center", clipPath: { type: "circle", radius: 260, offsetY: -100 } },
                { id: "card-2-tag", type: "text", text: "TARRAXO", x: 600, y: 555, width: 360, fontSize: 20, fontFamily: "Poppins, sans-serif", color: "#f4b6c0", fontWeight: "800", textAlign: "center", originX: "left", originY: "top", charSpacing: 200 },
                { id: "card-3-halo", type: "shape", shape: "circle", x: 300, y: 720, width: 300, height: 300, fill: "rgba(244,182,192,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "card-3-ring", type: "shape", shape: "circle", x: 300, y: 720, width: 260, height: 260, fill: "transparent", stroke: "#f4b6c0", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 300, y: 837, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 } },
                { id: "card-3-tag", type: "text", text: "SEMBA", x: 120, y: 875, width: 360, fontSize: 20, fontFamily: "Poppins, sans-serif", color: "#f4b6c0", fontWeight: "800", textAlign: "center", originX: "left", originY: "top", charSpacing: 200 },
                { id: "card-4-halo", type: "shape", shape: "circle", x: 780, y: 720, width: 300, height: 300, fill: "rgba(244,182,192,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "card-4-ring", type: "shape", shape: "circle", x: 780, y: 720, width: 260, height: 260, fill: "transparent", stroke: "#f4b6c0", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 780, y: 837, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 } },
                { id: "card-4-tag", type: "text", text: "GHETTO", x: 600, y: 875, width: 360, fontSize: 20, fontFamily: "Poppins, sans-serif", color: "#f4b6c0", fontWeight: "800", textAlign: "center", originX: "left", originY: "top", charSpacing: 200 },
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 930, width: 1080, height: 420, fill: "rgba(15,5,12,0.9)", selectable: false },
                { id: "date", type: "text", text: "DOMINGO 26 DE OCTUBRE  ·  11:00 — 20:00 H", x: 0, y: 970, width: 1080, fontSize: 22, fontFamily: "Poppins, sans-serif", color: "#ffffff", fontWeight: "700", textAlign: "center", charSpacing: 200 },
                { id: "venue", type: "text", text: "SALA REPVBLICCA  ·  C/ SAN VICENTE 65", x: 0, y: 1020, width: 1080, fontSize: 18, fontFamily: "Poppins, sans-serif", color: "#f4b6c0", textAlign: "center", charSpacing: 220 },
                { id: "city", type: "text", text: "VALENCIA", x: 0, y: 1070, width: 1080, fontSize: 22, fontFamily: "Poppins, sans-serif", color: "#ffffff", fontWeight: "800", textAlign: "center", charSpacing: 700 },
                { id: "pill-bg", type: "shape", shape: "rect", x: 290, y: 1140, width: 500, height: 60, fill: "#f4b6c0", radius: 30, selectable: false },
                { id: "price", type: "text", text: "1 DÍA · 4 CLASES · 65€", x: 0, y: 1156, width: 1080, fontSize: 22, fontFamily: "Poppins, sans-serif", color: "#1a0a12", fontWeight: "800", textAlign: "center", charSpacing: 150 },
                { id: "cta", type: "text", text: "KIZOMBAVLC.ES  ·  30 PLAZAS", x: 0, y: 1240, width: 1080, fontSize: 16, fontFamily: "Poppins, sans-serif", color: "rgba(244,182,192,0.85)", fontWeight: "600", textAlign: "center", charSpacing: 350 },
            ] },
        ],
    },

// ─── 66 — Festival Kizomba 6 artistas (coral estilo #15) ────────────
    {
        id: 66,
        title: "Festival Kizomba — 6 Artistas",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#180422", selectable: false },
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200", x: 0, y: 0, scaleX: 0.95, scaleY: 0.95, opacity: 0.28 },
                { id: "tint", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(120,20,110,0.55)", selectable: false },
                { id: "deco-l", type: "shape", shape: "circle", x: -100, y: -100, width: 350, height: 350, fill: "rgba(236,72,153,0.4)", opacity: 0.75, selectable: false },
                { id: "deco-r", type: "shape", shape: "circle", x: 830, y: -100, width: 350, height: 350, fill: "rgba(34,211,238,0.4)", opacity: 0.75, selectable: false },
                { id: "kicker", type: "text", text: "• KIZOMBA FEST · 4ª EDICIÓN •", x: 0, y: 80, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 500 },
                { id: "art-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 200, y: 180, scaleX: 0.45, scaleY: 0.45, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.85)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "art-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 880, y: 180, scaleX: 0.45, scaleY: 0.45, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.85)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "art-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 180, y: 460, scaleX: 0.45, scaleY: 0.45, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.85)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "art-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 900, y: 460, scaleX: 0.45, scaleY: 0.45, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.85)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "art-5-headliner", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 540, y: 250, scaleX: 0.75, scaleY: 0.75, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.95)", blur: 45, offsetX: 0, offsetY: 0 } },
                { id: "info-bg", type: "shape", shape: "rect", x: 60, y: 890, width: 960, height: 400, fill: "rgba(15,4,25,0.82)", radius: 20, selectable: false },
                { id: "title", type: "text", text: "KIZOMBA FEST", x: 0, y: 920, width: 1080, fontSize: 78, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "artists-list", type: "text", text: "CARLOS · ANA · MARCO · SOFÍA · DIEGO · LUCÍA", x: 0, y: 1010, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#f472b6", fontWeight: "600", textAlign: "center", charSpacing: 200 },
                { id: "date", type: "text", text: "13 · 14 · 15 DE MARZO 2026", x: 0, y: 1055, width: 1080, fontSize: 34, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 250 },
                { id: "venue", type: "text", text: "SALA CUSTOM  ·  AV. LA RAÑA 25  ·  SEVILLA", x: 0, y: 1120, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 250 },
                { id: "price", type: "text", text: "ABONO 3 DÍAS  95€  ·  DÍA SUELTO 45€", x: 0, y: 1165, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#f472b6", textAlign: "center", charSpacing: 250 },
                { id: "cta", type: "text", text: "KIZOMBAFESTSEVILLA.COM", x: 0, y: 1225, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 500 },
            ] },
        ],
    },

// ─── 67 — Masterclass Timba Cubana con Yulien Oviedo (1 solo) ───────
    {
        id: 67,
        title: "Masterclass Timba Cubana",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#7f1d1d", selectable: false },
                { id: "stripes-y", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 30, fill: "#fbbf24", selectable: false },
                { id: "stripes-y2", type: "shape", shape: "rect", x: 0, y: 1320, width: 1080, height: 30, fill: "#fbbf24", selectable: false },
                { id: "sun-halo", type: "shape", shape: "circle", x: 540, y: 500, width: 700, height: 700, fill: "rgba(251,191,36,0.4)", opacity: 0.7, originX: "center", originY: "center", selectable: false },
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 540, y: 90, scaleX: 1.6, scaleY: 1.6, originX: "center", originY: "top", shadow: { color: "rgba(251,191,36,0.9)", blur: 65, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 860, width: 1080, height: 460, fill: "rgba(60,10,10,0.85)", selectable: false },
                { id: "banner-bg", type: "shape", shape: "rect", x: 100, y: 890, width: 880, height: 50, fill: "#fbbf24", angle: -2, selectable: false },
                { id: "banner-text", type: "text", text: "★ MASTERCLASS TIMBA CUBANA ★", x: 0, y: 903, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#7f1d1d", textAlign: "center", charSpacing: 300, angle: -2 },
                { id: "title", type: "text", text: "PROF.\nDIEGO", x: 0, y: 970, width: 1080, fontSize: 92, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40, lineHeight: 0.9 },
                { id: "divider", type: "shape", shape: "rect", x: 460, y: 1170, width: 160, height: 3, fill: "#fbbf24", selectable: false },
                { id: "date", type: "text", text: "SÁBADO 4 DE ABRIL  ·  16:00 — 19:00 H", x: 0, y: 1190, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 220 },
                { id: "venue", type: "text", text: "ESTUDIO SALSA CAFÉ BERLÍN  ·  MADRID", x: 0, y: 1225, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", charSpacing: 250 },
                { id: "price", type: "text", text: "40€ ANTICIPADA  ·  50€ EN PUERTA", x: 0, y: 1265, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 250 },
            ] },
        ],
    },

// ─── 68 — Timba Session en pareja (2 artistas) ──────────────────────
    {
        id: 68,
        title: "Timba Session en Pareja",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#fbbf24", selectable: false },
                { id: "bg-half", type: "shape", shape: "rect", x: 0, y: 675, width: 1080, height: 675, fill: "#7f1d1d", selectable: false },
                { id: "sun", type: "shape", shape: "circle", x: 540, y: 675, width: 500, height: 500, fill: "#fbbf24", originX: "center", originY: "center", selectable: false },
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 540, y: 170, scaleX: 1.20, scaleY: 1.20, originX: "center", originY: "top", shadow: { color: "rgba(127,29,29,0.5)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "kicker-band", type: "shape", shape: "rect", x: 0, y: 810, width: 1080, height: 55, fill: "#000000", selectable: false },
                { id: "kicker", type: "text", text: "TIMBA SESSION · A DOS · EDICIÓN BILBAO", x: 0, y: 825, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 350 },
                { id: "title", type: "text", text: "DAVID", x: 0, y: 890, width: 1080, fontSize: 76, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 30 },
                { id: "amp", type: "text", text: "&", x: 0, y: 960, width: 1080, fontSize: 40, fontFamily: "Playfair Display, serif", color: "#ffffff", fontStyle: "italic", textAlign: "center" },
                { id: "title-2", type: "text", text: "LAURA", x: 0, y: 1000, width: 1080, fontSize: 76, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "info-band", type: "shape", shape: "rect", x: 90, y: 1105, width: 900, height: 200, fill: "rgba(0,0,0,0.4)", radius: 15, selectable: false },
                { id: "date", type: "text", text: "DOMINGO 17 DE MAYO  ·  11:00 A 15:00 H", x: 0, y: 1130, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 250 },
                { id: "venue", type: "text", text: "KAFE ANTZOKIA  ·  C/ SAN VICENTE 2  ·  BILBAO", x: 0, y: 1180, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", charSpacing: 200 },
                { id: "price", type: "text", text: "55€ PAREJA  ·  35€ INDIVIDUAL", x: 0, y: 1225, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 250 },
                { id: "cta", type: "text", text: "TIMBAENBILBAO.COM  ·  +34 944 000 100", x: 0, y: 1265, width: 1080, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
            ] },
        ],
    },

// ─── 69 — Cuba Fest Line-up 5 artistas (diamante) ───────────────────
    {
        id: 69,
        title: "Cuba Fest — Line-up Timba",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#7f1d1d", selectable: false },
                { id: "bg-blue", type: "shape", shape: "rect", x: 0, y: 450, width: 1080, height: 450, fill: "#1e40af", selectable: false },
                { id: "bg-white", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 450, fill: "#f3f4f6", selectable: false },
                { id: "stars-band", type: "shape", shape: "rect", x: 0, y: 40, width: 1080, height: 50, fill: "rgba(255,255,255,0.15)", selectable: false },
                { id: "stars", type: "text", text: "★ ★ ★ ★ ★ ★ ★ ★", x: 0, y: 52, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 800 },
                { id: "ring-1", type: "shape", shape: "circle", x: 200, y: 260, width: 180, height: 180, fill: "transparent", stroke: "#ffffff", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 200, y: 340, scaleX: 0.22, scaleY: 0.22, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(255,255,255,0.9)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "ring-2", type: "shape", shape: "circle", x: 880, y: 260, width: 180, height: 180, fill: "transparent", stroke: "#ffffff", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 880, y: 340, scaleX: 0.22, scaleY: 0.22, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(255,255,255,0.9)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "ring-3", type: "shape", shape: "circle", x: 200, y: 590, width: 180, height: 180, fill: "transparent", stroke: "#ffffff", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png", x: 200, y: 670, scaleX: 0.22, scaleY: 0.22, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(255,255,255,0.9)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "ring-4", type: "shape", shape: "circle", x: 880, y: 590, width: 180, height: 180, fill: "transparent", stroke: "#ffffff", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 880, y: 670, scaleX: 0.22, scaleY: 0.22, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(255,255,255,0.9)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "ring-5", type: "shape", shape: "circle", x: 540, y: 430, width: 320, height: 320, fill: "transparent", stroke: "#fbbf24", strokeWidth: 5, originX: "center", originY: "center", selectable: false },
                { id: "art-5", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 540, y: 545, scaleX: 0.36, scaleY: 0.36, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(255,255,255,1)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "title-bg", type: "shape", shape: "rect", x: 0, y: 920, width: 1080, height: 320, fill: "rgba(20,10,10,0.9)", selectable: false },
                { id: "title-kicker", type: "text", text: "¡CUBA FEST!  ·  ALICANTE 2026", x: 0, y: 945, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 400 },
                { id: "title", type: "text", text: "TIMBA · SON · CASINO", x: 0, y: 990, width: 1080, fontSize: 60, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 100 },
                { id: "artists", type: "text", text: "DIEGO · CARLOS · ANA · MARCO · LAURA", x: 0, y: 1065, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "700", textAlign: "center", charSpacing: 220 },
                { id: "date", type: "text", text: "10 · 11 · 12 DE JULIO 2026", x: 0, y: 1105, width: 1080, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "SALA CONCENTRO  ·  AV. DE ALCOY 32  ·  ALICANTE", x: 0, y: 1150, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", textAlign: "center", charSpacing: 200 },
                { id: "price", type: "text", text: "ABONO 3 DÍAS 110€  ·  DÍA SUELTO 50€", x: 0, y: 1195, width: 1080, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#fbbf24", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },

// ─── 70 — Semana Timba 3 profesores (fila con 1 grande) ─────────────
    {
        id: 70,
        title: "Semana Timba — 3 Profesores",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#052e33", selectable: false },
                { id: "bg-cyan", type: "shape", shape: "circle", x: 200, y: 200, width: 900, height: 900, fill: "rgba(20,184,166,0.55)", opacity: 0.85, selectable: false },
                { id: "bg-coral", type: "shape", shape: "circle", x: 800, y: 900, width: 500, height: 500, fill: "rgba(251,113,133,0.45)", opacity: 0.75, selectable: false },
                { id: "wave-1", type: "shape", shape: "rect", x: 0, y: 100, width: 1080, height: 4, fill: "rgba(20,184,166,0.7)", angle: -3, selectable: false },
                { id: "wave-2", type: "shape", shape: "rect", x: 0, y: 130, width: 1080, height: 4, fill: "rgba(251,113,133,0.7)", angle: -3, selectable: false },
                { id: "kicker", type: "text", text: "SEMANA TIMBA · ZARAGOZA 2026", x: 0, y: 60, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#fda4af", textAlign: "center", charSpacing: 500 },
                { id: "ring-big", type: "shape", shape: "circle", x: 300, y: 430, width: 480, height: 480, fill: "transparent", stroke: "#fda4af", strokeWidth: 5, originX: "center", originY: "center", selectable: false },
                { id: "art-big", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 300, y: 605, scaleX: 0.54, scaleY: 0.54, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(251,113,133,0.9)", blur: 55, offsetX: 0, offsetY: 0 } },
                { id: "ring-s1", type: "shape", shape: "circle", x: 810, y: 320, width: 260, height: 260, fill: "transparent", stroke: "#5eead4", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-s1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 810, y: 375, scaleX: 0.50, scaleY: 0.50, originX: "center", originY: "center", clipPath: { type: "circle", radius: 260, offsetY: -100 }, shadow: { color: "rgba(20,184,166,0.9)", blur: 35, offsetX: 0, offsetY: 0 } },
                { id: "ring-s2", type: "shape", shape: "circle", x: 810, y: 620, width: 260, height: 260, fill: "transparent", stroke: "#fda4af", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-s2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 810, y: 735, scaleX: 0.30, scaleY: 0.30, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(251,113,133,0.9)", blur: 35, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 900, width: 1080, height: 450, fill: "rgba(5,20,25,0.9)", selectable: false },
                { id: "title", type: "text", text: "SEMANA\nTIMBERA", x: 0, y: 925, width: 1080, fontSize: 88, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40, lineHeight: 0.9 },
                { id: "artists", type: "text", text: "LAURA · SERGIO · PABLO", x: 0, y: 1120, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#5eead4", fontWeight: "600", textAlign: "center", charSpacing: 300 },
                { id: "date", type: "text", text: "LUN 3 A SAB 8 DE MAYO  ·  20:00 H", x: 0, y: 1165, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#fda4af", textAlign: "center", charSpacing: 220 },
                { id: "venue", type: "text", text: "CLUB KALIMA  ·  C/ CINCO DE MARZO 3  ·  ZARAGOZA", x: 0, y: 1205, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 220 },
                { id: "price", type: "text", text: "SEMANA COMPLETA 80€  ·  DÍA SUELTO 18€", x: 0, y: 1240, width: 1080, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#5eead4", textAlign: "center", charSpacing: 200 },
                { id: "cta", type: "text", text: "TIMBAZARAGOZA.ES  ·  RESERVA PLAZA", x: 0, y: 1290, width: 1080, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "rgba(253,164,175,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
            ] },
        ],
    },

// ─── 71 — Intensivo Timba Fin de Semana (4 artistas 2 arriba 2 abajo)
    {
        id: 71,
        title: "Intensivo Timba — Fin de Semana",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#052e16", selectable: false },
                { id: "bg-tropic", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(22,163,74,0.28)", selectable: false },
                { id: "sun-orange", type: "shape", shape: "circle", x: 540, y: 480, width: 620, height: 620, fill: "rgba(249,115,22,0.4)", opacity: 0.8, originX: "center", originY: "center", selectable: false },
                { id: "leaf-l", type: "shape", shape: "circle", x: -160, y: 60, width: 380, height: 380, fill: "rgba(34,197,94,0.35)", opacity: 0.7, selectable: false },
                { id: "leaf-r", type: "shape", shape: "circle", x: 870, y: 900, width: 380, height: 380, fill: "rgba(34,197,94,0.35)", opacity: 0.7, selectable: false },
                { id: "kicker", type: "text", text: "INTENSIVO TIMBA · FIN DE SEMANA", x: 0, y: 70, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#f97316", textAlign: "center", charSpacing: 400 },
                { id: "spot-1", type: "shape", shape: "circle", x: 260, y: 300, width: 320, height: 320, fill: "rgba(249,115,22,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "ring-1", type: "shape", shape: "circle", x: 260, y: 300, width: 280, height: 280, fill: "transparent", stroke: "#f97316", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 260, y: 417, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(249,115,22,0.85)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "spot-2", type: "shape", shape: "circle", x: 820, y: 300, width: 320, height: 320, fill: "rgba(249,115,22,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "ring-2", type: "shape", shape: "circle", x: 820, y: 300, width: 280, height: 280, fill: "transparent", stroke: "#f97316", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 820, y: 417, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(249,115,22,0.85)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "spot-3", type: "shape", shape: "circle", x: 260, y: 650, width: 320, height: 320, fill: "rgba(34,197,94,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "ring-3", type: "shape", shape: "circle", x: 260, y: 650, width: 280, height: 280, fill: "transparent", stroke: "#22c55e", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 260, y: 705, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "center", clipPath: { type: "circle", radius: 260, offsetY: -100 }, shadow: { color: "rgba(34,197,94,0.85)", blur: 35, offsetX: 0, offsetY: 0 } },
                { id: "spot-4", type: "shape", shape: "circle", x: 820, y: 650, width: 320, height: 320, fill: "rgba(34,197,94,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "ring-4", type: "shape", shape: "circle", x: 820, y: 650, width: 280, height: 280, fill: "transparent", stroke: "#22c55e", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 820, y: 705, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "center", clipPath: { type: "circle", radius: 260, offsetY: -100 }, shadow: { color: "rgba(34,197,94,0.85)", blur: 35, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 850, width: 1080, height: 500, fill: "rgba(2,20,10,0.88)", selectable: false },
                { id: "title", type: "text", text: "TIMBA WEEKEND", x: 0, y: 910, width: 1080, fontSize: 84, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "subtitle", type: "text", text: "4 PROFESORES  ·  8 CLASES  ·  2 DÍAS", x: 0, y: 1005, width: 1080, fontSize: 20, fontFamily: "Montserrat, sans-serif", color: "#f97316", fontWeight: "700", textAlign: "center", charSpacing: 300 },
                { id: "date", type: "text", text: "SÁB 6 · DOM 7 DE SEPTIEMBRE", x: 0, y: 1075, width: 1080, fontSize: 24, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 280 },
                { id: "venue", type: "text", text: "SALA ALIATAR  ·  PL. ALIATAR 3  ·  GRANADA", x: 0, y: 1130, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#86efac", textAlign: "center", charSpacing: 220 },
                { id: "price-pill", type: "shape", shape: "rect", x: 280, y: 1180, width: 520, height: 55, fill: "#f97316", radius: 27, selectable: false },
                { id: "price", type: "text", text: "PACK 2 DÍAS · 95€  ·  ANTICIPADA", x: 0, y: 1195, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#052e16", textAlign: "center", charSpacing: 200 },
                { id: "cta", type: "text", text: "TIMBAGRANADA.COM  ·  25 PLAZAS", x: 0, y: 1265, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "rgba(249,115,22,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
            ] },
        ],
    },

// ─── 72 — Masterclass Reparto con El Chulo (1 solo) ─────────────────
    {
        id: 72,
        title: "Masterclass Reparto Cubano",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a0a", selectable: false },
                { id: "grid-y1", type: "shape", shape: "rect", x: 0, y: 200, width: 1080, height: 1, fill: "rgba(250,204,21,0.15)", selectable: false },
                { id: "grid-y2", type: "shape", shape: "rect", x: 0, y: 400, width: 1080, height: 1, fill: "rgba(250,204,21,0.15)", selectable: false },
                { id: "grid-y3", type: "shape", shape: "rect", x: 0, y: 600, width: 1080, height: 1, fill: "rgba(250,204,21,0.15)", selectable: false },
                { id: "grid-y4", type: "shape", shape: "rect", x: 0, y: 800, width: 1080, height: 1, fill: "rgba(250,204,21,0.15)", selectable: false },
                { id: "neon-glow", type: "shape", shape: "circle", x: 540, y: 500, width: 780, height: 780, fill: "rgba(236,72,153,0.4)", opacity: 0.75, originX: "center", originY: "center", selectable: false },
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 540, y: 140, scaleX: 1.30, scaleY: 1.30, originX: "center", originY: "top", shadow: { color: "rgba(250,204,21,0.95)", blur: 70, offsetX: 0, offsetY: 0 } },
                { id: "tag-bg", type: "shape", shape: "rect", x: 380, y: 60, width: 320, height: 38, fill: "#facc15", radius: 4, angle: -3, selectable: false },
                { id: "tag", type: "text", text: "¡REPARTO KLK!  ·  MASTERCLASS", x: 0, y: 68, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#000000", textAlign: "center", charSpacing: 300, angle: -3 },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 850, width: 1080, height: 500, fill: "rgba(0,0,0,0.9)", selectable: false },
                { id: "title", type: "text", text: "PROF. ALEX", x: 0, y: 890, width: 1080, fontSize: 110, fontFamily: "Anton, Impact, sans-serif", color: "#facc15", textAlign: "center", charSpacing: 40, stroke: "#ec4899", strokeWidth: 2 },
                { id: "subtitle", type: "text", text: "• REPARTO CUBANO EDITION •", x: 0, y: 1055, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ec4899", textAlign: "center", charSpacing: 400 },
                { id: "date", type: "text", text: "VIERNES 24 DE JULIO  ·  22:00 — 02:00 H", x: 0, y: 1130, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 220 },
                { id: "venue", type: "text", text: "SALA LA RIVIERA  ·  PS. BAJO DE LA VIRGEN 1  ·  MADRID", x: 0, y: 1175, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#facc15", textAlign: "center", charSpacing: 180 },
                { id: "price-bg", type: "shape", shape: "rect", x: 340, y: 1220, width: 400, height: 50, fill: "#ec4899", radius: 25, selectable: false },
                { id: "price", type: "text", text: "25€ ANTICIPADA · 35€ PUERTA", x: 0, y: 1233, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#000000", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },

// ─── 73 — Reparto en pareja Bebeshito & Bombillo (2 artistas) ───────
    {
        id: 73,
        title: "Reparto en Pareja",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0f0518", selectable: false },
                { id: "bg-uv", type: "shape", shape: "circle", x: 800, y: 200, width: 800, height: 800, fill: "rgba(139,92,246,0.55)", opacity: 0.85, selectable: false },
                { id: "bg-acid", type: "shape", shape: "circle", x: 100, y: 900, width: 700, height: 700, fill: "rgba(163,230,53,0.35)", opacity: 0.75, selectable: false },
                { id: "diag-1", type: "shape", shape: "rect", x: -100, y: 400, width: 1400, height: 4, fill: "#a3e635", angle: -12, opacity: 0.7, selectable: false },
                { id: "diag-2", type: "shape", shape: "rect", x: -100, y: 460, width: 1400, height: 2, fill: "#8b5cf6", angle: -12, opacity: 0.7, selectable: false },
                { id: "stage-halo", type: "shape", shape: "circle", x: 540, y: 500, width: 700, height: 700, fill: "rgba(139,92,246,0.35)", opacity: 0.85, originX: "center", originY: "center", selectable: false },
                { id: "ring-couple", type: "shape", shape: "circle", x: 540, y: 500, width: 600, height: 600, fill: "transparent", stroke: "#a3e635", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png", x: 540, y: 700, scaleX: 0.70, scaleY: 0.70, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(163,230,53,0.9)", blur: 60, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 870, width: 1080, height: 480, fill: "rgba(5,0,15,0.9)", selectable: false },
                { id: "kicker", type: "text", text: "REPARTO CUBANO · PALMA EDITION", x: 0, y: 895, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#a3e635", textAlign: "center", charSpacing: 500 },
                { id: "title-1", type: "text", text: "PABLO", x: 0, y: 935, width: 1080, fontSize: 92, fontFamily: "Anton, Impact, sans-serif", color: "#a3e635", textAlign: "center", charSpacing: 30, stroke: "#8b5cf6", strokeWidth: 1 },
                { id: "amp", type: "text", text: "×", x: 0, y: 1030, width: 1080, fontSize: 44, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center" },
                { id: "title-2", type: "text", text: "PATRICIA", x: 0, y: 1075, width: 1080, fontSize: 92, fontFamily: "Anton, Impact, sans-serif", color: "#8b5cf6", textAlign: "center", charSpacing: 30, stroke: "#a3e635", strokeWidth: 1 },
                { id: "date", type: "text", text: "SÁBADO 21 DE JUNIO · 23:00 — 04:00 H", x: 0, y: 1195, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 220 },
                { id: "venue", type: "text", text: "DISCOTECA TITOS  ·  PASSEIG MARÍTIM 33  ·  PALMA", x: 0, y: 1235, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#a3e635", fontWeight: "600", textAlign: "center", charSpacing: 180 },
                { id: "price", type: "text", text: "30€ ENTRADA + COPA  ·  REPARTOPALMA.ES", x: 0, y: 1280, width: 1080, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#8b5cf6", textAlign: "center", charSpacing: 250 },
            ] },
        ],
    },

// ─── 74 — Reparto Weekend 4 profesores (grid) ───────────────────────
    {
        id: 74,
        title: "Reparto Weekend — 4 Profesores",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#050510", selectable: false },
                { id: "bg-magenta", type: "shape", shape: "circle", x: -200, y: -200, width: 900, height: 900, fill: "rgba(236,72,153,0.55)", opacity: 0.85, selectable: false },
                { id: "bg-cyan", type: "shape", shape: "circle", x: 700, y: 1200, width: 900, height: 900, fill: "rgba(34,211,238,0.55)", opacity: 0.85, selectable: false },
                { id: "scanline", type: "shape", shape: "rect", x: 0, y: 100, width: 1080, height: 2, fill: "rgba(236,72,153,0.5)", selectable: false },
                { id: "scanline-2", type: "shape", shape: "rect", x: 0, y: 850, width: 1080, height: 2, fill: "rgba(34,211,238,0.5)", selectable: false },
                { id: "title", type: "text", text: "REPARTO", x: 0, y: 90, width: 1080, fontSize: 130, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30, stroke: "#ec4899", strokeWidth: 3 },
                { id: "subtitle", type: "text", text: "WEEKEND · 4 PROFESORES CUBANOS", x: 0, y: 245, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 350 },
                { id: "grid-1-halo", type: "shape", shape: "circle", x: 270, y: 390, width: 340, height: 340, fill: "rgba(236,72,153,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "grid-1-ring", type: "shape", shape: "circle", x: 270, y: 390, width: 300, height: 300, fill: "transparent", stroke: "#ec4899", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 270, y: 507, scaleX: 0.36, scaleY: 0.36, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 } },
                { id: "grid-1-name", type: "text", text: "ANDREA G.", x: 100, y: 580, width: 400, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", originX: "left", originY: "top", charSpacing: 100 },
                { id: "grid-1-role", type: "text", text: "REPARTO CUBANO", x: 100, y: 615, width: 400, fontSize: 11, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                { id: "grid-2-halo", type: "shape", shape: "circle", x: 810, y: 390, width: 340, height: 340, fill: "rgba(34,211,238,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "grid-2-ring", type: "shape", shape: "circle", x: 810, y: 390, width: 300, height: 300, fill: "transparent", stroke: "#22d3ee", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 810, y: 507, scaleX: 0.36, scaleY: 0.36, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 } },
                { id: "grid-2-name", type: "text", text: "MARCOS L.", x: 580, y: 580, width: 400, fontSize: 28, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", originX: "left", originY: "top", charSpacing: 100 },
                { id: "grid-2-role", type: "text", text: "REPARTO CUBANO", x: 580, y: 615, width: 400, fontSize: 11, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "600", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                { id: "grid-3-halo", type: "shape", shape: "circle", x: 270, y: 780, width: 320, height: 320, fill: "rgba(34,211,238,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "grid-3-ring", type: "shape", shape: "circle", x: 270, y: 780, width: 280, height: 280, fill: "transparent", stroke: "#22d3ee", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 270, y: 830, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "center", clipPath: { type: "circle", radius: 260, offsetY: -100 } },
                { id: "grid-3-name", type: "text", text: "LUCÍA S.", x: 100, y: 950, width: 400, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", originX: "left", originY: "top", charSpacing: 100 },
                { id: "grid-3-role", type: "text", text: "REPARTO CUBANO", x: 100, y: 983, width: 400, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", fontWeight: "600", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                { id: "grid-4-halo", type: "shape", shape: "circle", x: 810, y: 780, width: 320, height: 320, fill: "rgba(236,72,153,0.35)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "grid-4-ring", type: "shape", shape: "circle", x: 810, y: 780, width: 280, height: 280, fill: "transparent", stroke: "#ec4899", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 810, y: 830, scaleX: 0.55, scaleY: 0.55, originX: "center", originY: "center", clipPath: { type: "circle", radius: 260, offsetY: -100 } },
                { id: "grid-4-name", type: "text", text: "DIEGO P.", x: 580, y: 950, width: 400, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", originX: "left", originY: "top", charSpacing: 100 },
                { id: "grid-4-role", type: "text", text: "REPARTO CUBANO", x: 580, y: 983, width: 400, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "center", originX: "left", originY: "top", charSpacing: 400 },
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 1030, width: 1080, height: 320, fill: "rgba(5,5,15,0.92)", selectable: false },
                { id: "date", type: "text", text: "SÁB 27 · DOM 28 DE JUNIO", x: 0, y: 1055, width: 1080, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 280 },
                { id: "hours", type: "text", text: "8 CLASES · 4 ESTILOS · 2 DÍAS", x: 0, y: 1105, width: 1080, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "REPUBLICA LATINA  ·  SEVILLA", x: 0, y: 1160, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "center", charSpacing: 300 },
                { id: "price", type: "text", text: "PACK 2 DÍAS · 85€ · ANTICIPADA", x: 0, y: 1210, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 220 },
                { id: "cta", type: "text", text: "REPARTOSEVILLA.COM", x: 0, y: 1275, width: 1080, fontSize: 12, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 500 },
            ] },
        ],
    },

// ─── 75 — Reparto Bootcamp 3 profesores (escalonado) ────────────────
    {
        id: 75,
        title: "Reparto Bootcamp — 3 Profesores",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#1a0326", selectable: false },
                { id: "bg-flour", type: "shape", shape: "circle", x: -100, y: -100, width: 600, height: 600, fill: "rgba(255,20,147,0.55)", opacity: 0.8, selectable: false },
                { id: "bg-lila", type: "shape", shape: "circle", x: 700, y: 800, width: 700, height: 700, fill: "rgba(217,70,239,0.45)", opacity: 0.75, selectable: false },
                { id: "kicker-band", type: "shape", shape: "rect", x: 0, y: 60, width: 1080, height: 60, fill: "#ff1493", angle: -1, selectable: false },
                { id: "kicker", type: "text", text: "¡BOOTCAMP! · 3 DÍAS · 3 PROFES · REPARTO", x: 0, y: 80, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 300, angle: -1 },
                { id: "art-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 540, y: 200, scaleX: 1.35, scaleY: 1.35, originX: "center", originY: "top", shadow: { color: "rgba(217,70,239,0.95)", blur: 55, offsetX: 0, offsetY: 0 } },
                { id: "art-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 180, y: 380, scaleX: 0.62, scaleY: 0.62, originX: "center", originY: "top", shadow: { color: "rgba(255,20,147,0.9)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "art-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 900, y: 380, scaleX: 0.62, scaleY: 0.62, originX: "center", originY: "top", shadow: { color: "rgba(255,20,147,0.9)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 890, width: 1080, height: 460, fill: "rgba(10,0,20,0.9)", selectable: false },
                { id: "title", type: "text", text: "REPARTO\nBOOTCAMP", x: 0, y: 920, width: 1080, fontSize: 88, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40, lineHeight: 0.9 },
                { id: "artists", type: "text", text: "ALEX · PABLO · IVÁN", x: 0, y: 1120, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#f0abfc", fontWeight: "700", textAlign: "center", charSpacing: 350 },
                { id: "date", type: "text", text: "VIE 22 · SAB 23 · DOM 24 DE AGOSTO", x: 0, y: 1160, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ff1493", textAlign: "center", charSpacing: 220 },
                { id: "venue", type: "text", text: "SALA REPVBLICCA  ·  C/ SAN VICENTE 65  ·  VALENCIA", x: 0, y: 1210, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 200 },
                { id: "price", type: "text", text: "PACK 3 DÍAS  120€  ·  DÍA SUELTO 45€", x: 0, y: 1250, width: 1080, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#f0abfc", textAlign: "center", charSpacing: 220 },
                { id: "cta", type: "text", text: "REPARTOVLC.COM  ·  RESERVAS +34 963 000 100", x: 0, y: 1300, width: 1080, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "rgba(240,171,252,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 300 },
            ] },
        ],
    },

// ─── 76 — Reparto Line-up 5 artistas cubanos (diamante) ─────────────
    {
        id: 76,
        title: "Reparto Line-up — 5 Artistas",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0505", selectable: false },
                { id: "bg-photo", type: "image", src: "https://images.unsplash.com/photo-1520391587814-8aa9d8f5c53b?q=80&w=1200", x: 0, y: 0, scaleX: 0.9, scaleY: 0.9, opacity: 0.28 },
                { id: "tint-red", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "rgba(120,0,20,0.55)", selectable: false },
                { id: "grid-scan", type: "shape", shape: "rect", x: 0, y: 300, width: 1080, height: 3, fill: "#22c55e", opacity: 0.8, selectable: false },
                { id: "kicker", type: "text", text: "REPARTO CUBANO ES REPARTO CUBANO", x: 0, y: 60, width: 1080, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#22c55e", textAlign: "center", charSpacing: 500 },
                { id: "art-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 200, y: 130, scaleX: 0.45, scaleY: 0.45, originX: "center", originY: "top", shadow: { color: "rgba(34,197,94,0.85)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "art-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 880, y: 130, scaleX: 0.45, scaleY: 0.45, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "art-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 200, y: 430, scaleX: 0.45, scaleY: 0.45, originX: "center", originY: "top", shadow: { color: "rgba(255,255,255,0.9)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "art-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 880, y: 430, scaleX: 0.45, scaleY: 0.45, originX: "center", originY: "top", shadow: { color: "rgba(34,197,94,0.85)", blur: 30, offsetX: 0, offsetY: 0 } },
                { id: "art-5-head", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 540, y: 240, scaleX: 0.75, scaleY: 0.75, originX: "center", originY: "top", shadow: { color: "rgba(220,38,38,0.9)", blur: 50, offsetX: 0, offsetY: 0 } },
                { id: "info-band", type: "shape", shape: "rect", x: 40, y: 900, width: 1000, height: 400, fill: "rgba(10,0,0,0.88)", radius: 12, stroke: "#22c55e", strokeWidth: 1, selectable: false },
                { id: "title", type: "text", text: "¡KLK REPARTO!", x: 0, y: 925, width: 1080, fontSize: 78, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 50, stroke: "#dc2626", strokeWidth: 2 },
                { id: "artists", type: "text", text: "ALEX · PABLO · IVÁN · SERGIO · ANDREA", x: 0, y: 1015, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#22c55e", fontWeight: "700", textAlign: "center", charSpacing: 200 },
                { id: "date", type: "text", text: "SÁBADO 5 DE SEPTIEMBRE  ·  22:00 H", x: 0, y: 1065, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 250 },
                { id: "venue", type: "text", text: "CLUB SABOR LATINO  ·  BARCELONA", x: 0, y: 1115, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#22c55e", textAlign: "center", charSpacing: 250 },
                { id: "price", type: "text", text: "35€ ANTICIPADA + 1 COPA  ·  45€ PUERTA", x: 0, y: 1160, width: 1080, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#dc2626", textAlign: "center", charSpacing: 220 },
                { id: "cta", type: "text", text: "¡EL REPARTO ES CUBANO!  ·  REPARTOBCN.ES", x: 0, y: 1220, width: 1080, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 400 },
            ] },
        ],
    },

// ─── 77 — Masterclass Reggaeton Old School (1 solo) ─────────────────
    {
        id: 77,
        title: "Masterclass Reggaeton Old School",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0f0518", selectable: false },
                { id: "bg-rosa", type: "shape", shape: "circle", x: -150, y: 800, width: 900, height: 900, fill: "rgba(244,63,94,0.5)", opacity: 0.85, selectable: false },
                { id: "bg-lila", type: "shape", shape: "circle", x: 700, y: -100, width: 800, height: 800, fill: "rgba(168,85,247,0.55)", opacity: 0.85, selectable: false },
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 540, y: 130, scaleX: 1.30, scaleY: 1.30, originX: "center", originY: "top", shadow: { color: "rgba(244,63,94,0.95)", blur: 70, offsetX: 0, offsetY: 0 } },
                { id: "tag-bg", type: "shape", shape: "rect", x: 340, y: 60, width: 400, height: 40, fill: "transparent", stroke: "#f43f5e", strokeWidth: 2, radius: 20, selectable: false },
                { id: "tag", type: "text", text: "MASTERCLASS • REGGAETON OLD SCHOOL", x: 0, y: 71, width: 1080, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#f43f5e", textAlign: "center", charSpacing: 400 },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 850, width: 1080, height: 500, fill: "rgba(5,0,15,0.9)", selectable: false },
                { id: "title", type: "text", text: "OLD SCHOOL", x: 0, y: 890, width: 1080, fontSize: 118, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40, stroke: "#f43f5e", strokeWidth: 2 },
                { id: "subtitle", type: "text", text: "DEL PERREO CLÁSICO A HOY  ·  2000–2026", x: 0, y: 1045, width: 1080, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#a855f7", fontWeight: "700", textAlign: "center", charSpacing: 300 },
                { id: "divider", type: "shape", shape: "rect", x: 460, y: 1105, width: 160, height: 2, fill: "#f43f5e", selectable: false },
                { id: "date", type: "text", text: "SÁBADO 30 DE MAYO  ·  20:00 — 23:00 H", x: 0, y: 1130, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 220 },
                { id: "venue", type: "text", text: "STAGE STUDIO  ·  C/ MAGÚNCIA 12  ·  MADRID", x: 0, y: 1180, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#f43f5e", textAlign: "center", charSpacing: 220 },
                { id: "price-bg", type: "shape", shape: "rect", x: 340, y: 1235, width: 400, height: 55, fill: "#f43f5e", radius: 27, selectable: false },
                { id: "price", type: "text", text: "40€  ·  25 PLAZAS", x: 0, y: 1250, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#0f0518", textAlign: "center", charSpacing: 250 },
            ] },
        ],
    },

// ─── 78 — Reggaeton Perreo en pareja (2 artistas) ───────────────────
    {
        id: 78,
        title: "Reggaeton Perreo — Pareja",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#000000", selectable: false },
                { id: "neon-1", type: "shape", shape: "rect", x: 40, y: 40, width: 1000, height: 1270, fill: "transparent", stroke: "#f43f5e", strokeWidth: 3, radius: 20, selectable: false },
                { id: "corner-l", type: "shape", shape: "circle", x: 60, y: 60, width: 200, height: 200, fill: "rgba(244,63,94,0.6)", opacity: 0.85, selectable: false },
                { id: "corner-r", type: "shape", shape: "circle", x: 820, y: 1090, width: 200, height: 200, fill: "rgba(244,63,94,0.6)", opacity: 0.85, selectable: false },
                { id: "kicker", type: "text", text: "PERREO INTENSIVO · MARBELLA VIBES", x: 0, y: 90, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#f43f5e", textAlign: "center", charSpacing: 500 },
                { id: "artist", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png", x: 540, y: 140, scaleX: 1.55, scaleY: 1.55, originX: "center", originY: "top", shadow: { color: "rgba(244,63,94,0.95)", blur: 55, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 40, y: 880, width: 1000, height: 430, fill: "rgba(0,0,0,0.9)", selectable: false },
                { id: "title", type: "text", text: "PERREO", x: 0, y: 920, width: 1080, fontSize: 148, fontFamily: "Anton, Impact, sans-serif", color: "#f43f5e", textAlign: "center", charSpacing: 60 },
                { id: "subtitle-band", type: "shape", shape: "rect", x: 190, y: 1085, width: 700, height: 46, fill: "#f43f5e", angle: -2, selectable: false },
                { id: "subtitle", type: "text", text: "REGGAETON A DOS · TÚNICA + TÚNICO", x: 0, y: 1094, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#000000", textAlign: "center", charSpacing: 250, angle: -2 },
                { id: "date", type: "text", text: "SÁB 11 DE JULIO  ·  17:00 — 21:00 H", x: 0, y: 1160, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 220 },
                { id: "venue", type: "text", text: "OLIVIA VALERE  ·  CTRA. ISTAN KM 0.8  ·  MARBELLA", x: 0, y: 1200, width: 1080, fontSize: 15, fontFamily: "Montserrat, sans-serif", color: "#f43f5e", textAlign: "center", charSpacing: 220 },
                { id: "price", type: "text", text: "55€ PAREJA  ·  30€ INDIVIDUAL", x: 0, y: 1245, width: 1080, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 250 },
            ] },
        ],
    },

// ─── 79 — Reggaeton Bootcamp 3 profesores (triangulo) ───────────────
    {
        id: 79,
        title: "Reggaeton Bootcamp — 3 Profesores",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#050025", selectable: false },
                { id: "bg-cyan", type: "shape", shape: "circle", x: 900, y: 300, width: 900, height: 900, fill: "rgba(34,211,238,0.55)", opacity: 0.85, selectable: false },
                { id: "bg-pink", type: "shape", shape: "circle", x: -100, y: 600, width: 900, height: 900, fill: "rgba(236,72,153,0.55)", opacity: 0.85, selectable: false },
                { id: "grid-h1", type: "shape", shape: "rect", x: 0, y: 250, width: 1080, height: 1, fill: "rgba(34,211,238,0.35)", selectable: false },
                { id: "grid-h2", type: "shape", shape: "rect", x: 0, y: 550, width: 1080, height: 1, fill: "rgba(236,72,153,0.35)", selectable: false },
                { id: "grid-h3", type: "shape", shape: "rect", x: 0, y: 850, width: 1080, height: 1, fill: "rgba(34,211,238,0.35)", selectable: false },
                { id: "art-top", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 540, y: 130, scaleX: 0.85, scaleY: 0.85, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.9)", blur: 55, offsetX: 0, offsetY: 0 } },
                { id: "art-l", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 200, y: 470, scaleX: 0.7, scaleY: 0.7, originX: "center", originY: "top", shadow: { color: "rgba(34,211,238,0.9)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "art-r", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 880, y: 470, scaleX: 0.7, scaleY: 0.7, originX: "center", originY: "top", shadow: { color: "rgba(236,72,153,0.9)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "vignette", type: "shape", shape: "rect", x: 0, y: 880, width: 1080, height: 470, fill: "rgba(0,0,15,0.9)", selectable: false },
                { id: "kicker", type: "text", text: "BOOTCAMP · REGGAETON CYBER", x: 0, y: 905, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 500 },
                { id: "title", type: "text", text: "CYBER PERREO", x: 0, y: 945, width: 1080, fontSize: 88, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 40, stroke: "#ec4899", strokeWidth: 2 },
                { id: "artists", type: "text", text: "ADRIÁN · SERGIO · IVÁN", x: 0, y: 1075, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "700", textAlign: "center", charSpacing: 400 },
                { id: "date", type: "text", text: "VIE 18 · SAB 19 · DOM 20 DE ABRIL", x: 0, y: 1115, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 220 },
                { id: "venue", type: "text", text: "SALA MONDO  ·  PL. DE LA CONSTITUCIÓN 3  ·  VIGO", x: 0, y: 1170, width: 1080, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "#22d3ee", textAlign: "center", charSpacing: 200 },
                { id: "price-band", type: "shape", shape: "rect", x: 100, y: 1215, width: 880, height: 55, fill: "rgba(236,72,153,0.15)", radius: 12, stroke: "#ec4899", strokeWidth: 1, selectable: false },
                { id: "price", type: "text", text: "PACK 3 DÍAS  110€  ·  DÍA SUELTO 42€", x: 0, y: 1230, width: 1080, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 200 },
                { id: "cta", type: "text", text: "PERREOVIGO.COM  ·  25 PLAZAS · GRABÓN INCL.", x: 0, y: 1300, width: 1080, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "rgba(34,211,238,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 350 },
            ] },
        ],
    },

// ─── 80 — Intensivo Reggaeton 4 profesores (grid dorado/negro) ──────
    {
        id: 80,
        title: "Intensivo Reggaeton — 4 Profesores",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a0a", selectable: false },
                { id: "bg-gold-halo", type: "shape", shape: "circle", x: 540, y: 500, width: 900, height: 900, fill: "rgba(217,165,89,0.28)", opacity: 0.75, originX: "center", originY: "center", selectable: false },
                { id: "border-top", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 6, fill: "#d9a559", selectable: false },
                { id: "border-bot", type: "shape", shape: "rect", x: 0, y: 1344, width: 1080, height: 6, fill: "#d9a559", selectable: false },
                { id: "kicker", type: "text", text: "✦  INTENSIVO REGGAETON  ✦", x: 0, y: 60, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#d9a559", textAlign: "center", charSpacing: 400, fontStyle: "italic" },
                { id: "title", type: "text", text: "STREET STYLE", x: 0, y: 100, width: 1080, fontSize: 82, fontFamily: "Anton, Impact, sans-serif", color: "#d9a559", textAlign: "center", charSpacing: 70 },
                { id: "grid-1-halo", type: "shape", shape: "circle", x: 270, y: 390, width: 320, height: 320, fill: "rgba(217,165,89,0.28)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "grid-1-ring", type: "shape", shape: "circle", x: 270, y: 390, width: 280, height: 280, fill: "transparent", stroke: "#d9a559", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 270, y: 507, scaleX: 0.34, scaleY: 0.34, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 } },
                { id: "art-1-name", type: "text", text: "ALEX R.", x: 100, y: 570, width: 400, fontSize: 30, fontFamily: "Playfair Display, serif", color: "#d9a559", textAlign: "center", originX: "left", originY: "top", charSpacing: 100, fontStyle: "italic" },
                { id: "art-1-role", type: "text", text: "URBAN CHOREO", x: 100, y: 610, width: 400, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "rgba(217,165,89,0.75)", fontWeight: "600", textAlign: "center", originX: "left", originY: "top", charSpacing: 450 },
                { id: "grid-2-halo", type: "shape", shape: "circle", x: 810, y: 390, width: 320, height: 320, fill: "rgba(217,165,89,0.28)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "grid-2-ring", type: "shape", shape: "circle", x: 810, y: 390, width: 280, height: 280, fill: "transparent", stroke: "#d9a559", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 810, y: 507, scaleX: 0.34, scaleY: 0.34, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 } },
                { id: "art-2-name", type: "text", text: "SOFÍA M.", x: 580, y: 570, width: 400, fontSize: 30, fontFamily: "Playfair Display, serif", color: "#d9a559", textAlign: "center", originX: "left", originY: "top", charSpacing: 100, fontStyle: "italic" },
                { id: "art-2-role", type: "text", text: "PERREO INTENSO", x: 580, y: 610, width: 400, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "rgba(217,165,89,0.75)", fontWeight: "600", textAlign: "center", originX: "left", originY: "top", charSpacing: 450 },
                { id: "grid-3-halo", type: "shape", shape: "circle", x: 270, y: 780, width: 300, height: 300, fill: "rgba(217,165,89,0.28)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "grid-3-ring", type: "shape", shape: "circle", x: 270, y: 780, width: 260, height: 260, fill: "transparent", stroke: "#d9a559", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 270, y: 890, scaleX: 0.32, scaleY: 0.32, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 } },
                { id: "art-3-name", type: "text", text: "MARCO L.", x: 100, y: 940, width: 400, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#d9a559", textAlign: "center", originX: "left", originY: "top", charSpacing: 100, fontStyle: "italic" },
                { id: "art-3-role", type: "text", text: "OLD SCHOOL", x: 100, y: 975, width: 400, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "rgba(217,165,89,0.75)", fontWeight: "600", textAlign: "center", originX: "left", originY: "top", charSpacing: 450 },
                { id: "grid-4-halo", type: "shape", shape: "circle", x: 810, y: 780, width: 300, height: 300, fill: "rgba(217,165,89,0.28)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "grid-4-ring", type: "shape", shape: "circle", x: 810, y: 780, width: 260, height: 260, fill: "transparent", stroke: "#d9a559", strokeWidth: 3, originX: "center", originY: "center", selectable: false },
                { id: "art-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png", x: 810, y: 830, scaleX: 0.52, scaleY: 0.52, originX: "center", originY: "center", clipPath: { type: "circle", radius: 260, offsetY: -100 } },
                { id: "art-4-name", type: "text", text: "LAURA S.", x: 580, y: 940, width: 400, fontSize: 26, fontFamily: "Playfair Display, serif", color: "#d9a559", textAlign: "center", originX: "left", originY: "top", charSpacing: 100, fontStyle: "italic" },
                { id: "art-4-role", type: "text", text: "STREET DANCE", x: 580, y: 975, width: 400, fontSize: 10, fontFamily: "Montserrat, sans-serif", color: "rgba(217,165,89,0.75)", fontWeight: "600", textAlign: "center", originX: "left", originY: "top", charSpacing: 450 },
                { id: "info-bg", type: "shape", shape: "rect", x: 0, y: 1030, width: 1080, height: 320, fill: "rgba(5,5,5,0.9)", selectable: false },
                { id: "date", type: "text", text: "SÁB 14 · DOM 15 DE FEBRERO", x: 0, y: 1060, width: 1080, fontSize: 24, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 200, fontStyle: "italic" },
                { id: "hours", type: "text", text: "8 CLASES · 4 ESTILOS · 2 DÍAS", x: 0, y: 1110, width: 1080, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#d9a559", textAlign: "center", charSpacing: 300 },
                { id: "venue", type: "text", text: "CAMELOT SALAMANCA", x: 0, y: 1155, width: 1080, fontSize: 15, fontFamily: "Playfair Display, serif", color: "#ffffff", textAlign: "center", charSpacing: 300, fontStyle: "italic" },
                { id: "price-bg", type: "shape", shape: "rect", x: 340, y: 1200, width: 400, height: 48, fill: "transparent", stroke: "#d9a559", strokeWidth: 2, radius: 24, selectable: false },
                { id: "price", type: "text", text: "PACK 2 DÍAS · 90€", x: 0, y: 1213, width: 1080, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#d9a559", textAlign: "center", charSpacing: 250, fontStyle: "italic" },
                { id: "cta", type: "text", text: "STREETSALAMANCA.ES", x: 0, y: 1275, width: 1080, fontSize: 12, fontFamily: "Playfair Display, serif", color: "rgba(217,165,89,0.85)", textAlign: "center", charSpacing: 400, fontStyle: "italic" },
            ] },
        ],
    },

// ─── 81 — Reggaeton Battle 6 artistas (coral rojo/negro/blanco) ─────
    {
        id: 81,
        title: "Reggaeton Battle — 6 Artistas",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Marco_grupales.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["beta"],
        variants: [
            { format: "portrait", width: 1080, height: 1350, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#000000", selectable: false },
                { id: "bg-red", type: "shape", shape: "rect", x: 0, y: 450, width: 1080, height: 900, fill: "#dc2626", selectable: false },
                { id: "diagonal-white", type: "shape", shape: "rect", x: -100, y: 400, width: 1400, height: 8, fill: "#ffffff", angle: -6, selectable: false },
                { id: "vs-badge-bg", type: "shape", shape: "circle", x: 540, y: 60, width: 80, height: 80, fill: "#ffffff", originX: "center", originY: "top", selectable: false },
                { id: "vs-badge", type: "text", text: "VS", x: 0, y: 82, width: 1080, fontSize: 32, fontFamily: "Anton, Impact, sans-serif", color: "#dc2626", textAlign: "center", charSpacing: 100 },
                { id: "ring-1", type: "shape", shape: "circle", x: 180, y: 250, width: 200, height: 200, fill: "transparent", stroke: "#ffffff", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-1", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png", x: 180, y: 330, scaleX: 0.22, scaleY: 0.22, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(255,255,255,1)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "ring-2", type: "shape", shape: "circle", x: 900, y: 250, width: 200, height: 200, fill: "transparent", stroke: "#ffffff", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-2", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png", x: 900, y: 330, scaleX: 0.22, scaleY: 0.22, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(255,255,255,1)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "ring-3", type: "shape", shape: "circle", x: 200, y: 540, width: 200, height: 200, fill: "transparent", stroke: "#dc2626", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-3", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png", x: 200, y: 595, scaleX: 0.40, scaleY: 0.40, originX: "center", originY: "center", clipPath: { type: "circle", radius: 260, offsetY: -100 }, shadow: { color: "rgba(255,255,255,1)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "ring-4", type: "shape", shape: "circle", x: 880, y: 540, width: 200, height: 200, fill: "transparent", stroke: "#dc2626", strokeWidth: 4, originX: "center", originY: "center", selectable: false },
                { id: "art-4", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png", x: 880, y: 595, scaleX: 0.22, scaleY: 0.22, originX: "center", originY: "center", clipPath: { type: "circle", radius: 415, offsetY: -325 }, shadow: { color: "rgba(255,255,255,1)", blur: 25, offsetX: 0, offsetY: 0 } },
                { id: "art-5", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Marco_grupales.png", x: 540, y: 250, scaleX: 0.75, scaleY: 0.75, originX: "center", originY: "top", shadow: { color: "rgba(0,0,0,0.9)", blur: 40, offsetX: 0, offsetY: 0 } },
                { id: "info-band", type: "shape", shape: "rect", x: 0, y: 880, width: 1080, height: 470, fill: "rgba(0,0,0,0.92)", selectable: false },
                { id: "title-part-1", type: "text", text: "REGGAETON", x: 0, y: 905, width: 1080, fontSize: 88, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 30 },
                { id: "title-part-2", type: "text", text: "B·A·T·T·L·E", x: 0, y: 1000, width: 1080, fontSize: 62, fontFamily: "Anton, Impact, sans-serif", color: "#dc2626", textAlign: "center", charSpacing: 200 },
                { id: "artists", type: "text", text: "6 CREWS · 3 BATALLAS · 1 GANADOR · 500€", x: 0, y: 1080, width: 1080, fontSize: 16, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 300 },
                { id: "date", type: "text", text: "SÁBADO 8 DE AGOSTO · 20:00 H", x: 0, y: 1120, width: 1080, fontSize: 22, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 250 },
                { id: "venue", type: "text", text: "SALA BBK  ·  C/ ASTARLOA 7  ·  BILBAO", x: 0, y: 1170, width: 1080, fontSize: 17, fontFamily: "Montserrat, sans-serif", color: "#dc2626", fontWeight: "700", textAlign: "center", charSpacing: 220 },
                { id: "price-band", type: "shape", shape: "rect", x: 0, y: 1220, width: 1080, height: 50, fill: "#dc2626", angle: -1, selectable: false },
                { id: "price", type: "text", text: "12€ ANTICIPADA · 20€ PUERTA · GRATIS BAILARINES", x: 0, y: 1235, width: 1080, fontSize: 17, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 200, angle: -1 },
                { id: "cta", type: "text", text: "REGGAETONBATTLE.ES  ·  INSCRIPCIÓN CREWS ABIERTA", x: 0, y: 1298, width: 1080, fontSize: 13, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.85)", fontWeight: "700", textAlign: "center", charSpacing: 300 },
            ] },
        ],
    },

];
