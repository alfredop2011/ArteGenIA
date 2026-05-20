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

export type Template = {
    id: number;
    title: string;
    category: string;
    image: string;
    premium: boolean;
    /** Audiencias objetivo (multi-select AND en /templates) */
    audience: AudienceId[];
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
];
