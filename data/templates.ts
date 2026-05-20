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

export type Template = {
    id: number;
    title: string;
    category: string;
    image: string;
    premium: boolean;
    width: number;
    height: number;
    layers: TemplateLayer[];
};

export const templates: Template[] = [
    // 1 — Don Filosofín Live
    {
        id: 1,
        title: "Don Filosofín Live",
        category: "Concierto",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800",
        premium: true,
        width: 430,
        height: 540,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "#0a0800", selectable: false },
            { id: "artist-photo", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/Filosofin-.png", x: 0, y: 0, scaleX: 0.478, scaleY: 0.478, opacity: 1 },
            { id: "overlay-bottom", type: "shape", shape: "rect", x: 0, y: 270, width: 430, height: 270, fill: "rgba(5,4,0,0.88)", selectable: false },
            { id: "overlay-top", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 60, fill: "rgba(5,4,0,0.5)", selectable: false },
            { id: "line-gold", type: "shape", shape: "rect", x: 60, y: 278, width: 310, height: 1, fill: "#b8860b", opacity: 0.7, selectable: false },
            { id: "label", type: "text", text: "LIVE SHOW", x: 0, y: 20, width: 430, fontSize: 13, fontFamily: "Arial", color: "#b8860b", fontWeight: "bold", textAlign: "center" },
            { id: "title-1", type: "text", text: "DON", x: 0, y: 295, width: 430, fontSize: 90, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "title-2", type: "text", text: "FILOSOFÍN", x: 0, y: 375, width: 430, fontSize: 72, fontFamily: "Arial", color: "#b8860b", fontWeight: "bold", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Una noche de conversación y música", x: 20, y: 445, width: 390, fontSize: 13, fontFamily: "Arial", color: "#e0d0b0", textAlign: "center" },
            { id: "date", type: "text", text: "VIERNES 20 JUNIO · 21:00 HRS", x: 0, y: 468, width: 430, fontSize: 12, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "venue", type: "text", text: "SALA APOLO · BARCELONA", x: 0, y: 490, width: 430, fontSize: 11, fontFamily: "Arial", color: "#b8860b", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA LIBRE · AFORO LIMITADO", x: 0, y: 514, width: 430, fontSize: 10, fontFamily: "Arial", color: "#888888", textAlign: "center" },
        ],
    },

    // 2 — Urban Party
    {
        id: 2,
        title: "Urban Party",
        category: "Concierto",
        image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800",
        premium: false,
        width: 430,
        height: 540,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "#070711", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800", x: 0, y: 0, scaleX: 0.478, scaleY: 0.478, opacity: 0.5 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(7,7,17,0.75)", selectable: false },
            { id: "accent", type: "shape", shape: "rect", x: 0, y: 0, width: 215, height: 270, fill: "#3b0764", opacity: 0.6, radius: 45, selectable: false },
            { id: "accent2", type: "shape", shape: "rect", x: 215, y: 270, width: 215, height: 270, fill: "#1e1b4b", opacity: 0.6, radius: 45, selectable: false },
            { id: "title", type: "text", text: "URBAN PARTY", x: 0, y: 140, width: 430, fontSize: 52, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Live Experience", x: 0, y: 210, width: 430, fontSize: 22, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "artist", type: "text", text: "ARTISTA PRINCIPAL", x: 0, y: 250, width: 430, fontSize: 18, fontFamily: "Arial", color: "#a78bfa", fontWeight: "bold", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 80, y: 295, width: 270, height: 1, fill: "#facc15", opacity: 0.5, selectable: false },
            { id: "date", type: "text", text: "SÁBADO 21 JUNIO", x: 0, y: 315, width: 430, fontSize: 22, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "time", type: "text", text: "21:00 HRS · Puertas 20:00", x: 0, y: 350, width: 430, fontSize: 14, fontFamily: "Arial", color: "#9ca3af", textAlign: "center" },
            { id: "venue", type: "text", text: "Teatro del Río", x: 0, y: 385, width: 430, fontSize: 16, fontFamily: "Arial", color: "#fbbf24", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA ANTICIPADA 25€", x: 0, y: 460, width: 430, fontSize: 16, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "center" },
        ],
    },

    // 3 — DJ Neon
    {
        id: 3,
        title: "DJ Neon",
        category: "Discoteca",
        image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800",
        premium: true,
        width: 430,
        height: 540,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "#020617", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800", x: 0, y: 0, scaleX: 0.478, scaleY: 0.478, opacity: 0.4 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(2,6,23,0.8)", selectable: false },
            { id: "neon-box", type: "shape", shape: "rect", x: 35, y: 60, width: 360, height: 420, fill: "rgba(34,211,238,0.06)", radius: 35, selectable: false },
            { id: "neon-border", type: "shape", shape: "rect", x: 35, y: 60, width: 360, height: 2, fill: "#22d3ee", opacity: 0.6, selectable: false },
            { id: "dj-label", type: "text", text: "DJ SET", x: 0, y: 100, width: 430, fontSize: 14, fontFamily: "Arial", color: "#22d3ee", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "DJ NEON", x: 0, y: 140, width: 430, fontSize: 72, fontFamily: "Arial", color: "#22d3ee", fontWeight: "bold", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Live Experience", x: 0, y: 230, width: 430, fontSize: 24, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "genres", type: "text", text: "TECHNO · HOUSE · ELECTRO", x: 0, y: 268, width: 430, fontSize: 13, fontFamily: "Arial", color: "#ec4899", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 80, y: 295, width: 270, height: 1, fill: "#22d3ee", opacity: 0.4, selectable: false },
            { id: "date", type: "text", text: "VIERNES 28 JUNIO", x: 0, y: 315, width: 430, fontSize: 24, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "center" },
            { id: "time", type: "text", text: "00:00 — 06:00 HRS", x: 0, y: 352, width: 430, fontSize: 15, fontFamily: "Arial", color: "#9ca3af", textAlign: "center" },
            { id: "venue", type: "text", text: "Club Espacio · Madrid", x: 0, y: 388, width: 430, fontSize: 15, fontFamily: "Arial", color: "#22d3ee", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA 20€ · LISTA HASTA 01:00", x: 0, y: 458, width: 430, fontSize: 13, fontFamily: "Arial", color: "#d1d5db", textAlign: "center" },
        ],
    },

    // 4 — Evento Premium
    {
        id: 4,
        title: "Evento Premium",
        category: "Gala",
        image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
        premium: false,
        width: 430,
        height: 540,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "#111827", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800", x: 0, y: 0, scaleX: 0.478, scaleY: 0.478, opacity: 0.35 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(17,24,39,0.82)", selectable: false },
            { id: "gold-card", type: "shape", shape: "rect", x: 45, y: 70, width: 340, height: 400, fill: "rgba(250,204,21,0.06)", radius: 30, selectable: false },
            { id: "gold-line-t", type: "shape", shape: "rect", x: 65, y: 100, width: 300, height: 1, fill: "#facc15", opacity: 0.6, selectable: false },
            { id: "gold-line-b", type: "shape", shape: "rect", x: 65, y: 440, width: 300, height: 1, fill: "#facc15", opacity: 0.6, selectable: false },
            { id: "label", type: "text", text: "GALA ESPECIAL", x: 0, y: 118, width: 430, fontSize: 12, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "EVENTO PREMIUM", x: 0, y: 155, width: 430, fontSize: 42, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Una noche inolvidable", x: 0, y: 222, width: 430, fontSize: 20, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "artists", type: "text", text: "ARTISTA 1 · ARTISTA 2", x: 0, y: 260, width: 430, fontSize: 16, fontFamily: "Arial", color: "#fbbf24", fontWeight: "bold", textAlign: "center" },
            { id: "date", type: "text", text: "SÁBADO 5 JULIO · 21:00 HRS", x: 0, y: 310, width: 430, fontSize: 17, fontFamily: "Arial", color: "#e5e7eb", fontWeight: "bold", textAlign: "center" },
            { id: "venue", type: "text", text: "Gran Salón · Hotel Palace", x: 0, y: 345, width: 430, fontSize: 14, fontFamily: "Arial", color: "#9ca3af", textAlign: "center" },
            { id: "footer", type: "text", text: "ArteGenIA", x: 0, y: 455, width: 430, fontSize: 18, fontFamily: "Arial", color: "#facc15", textAlign: "center" },
        ],
    },

    // 5 — Salsa Caliente
    {
        id: 5,
        title: "Salsa Caliente",
        category: "Salsa",
        image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?q=80&w=800",
        premium: false,
        width: 430,
        height: 540,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "#1a0500", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?q=80&w=800", x: 0, y: 0, scaleX: 0.478, scaleY: 0.478, opacity: 0.5 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(26,5,0,0.78)", selectable: false },
            { id: "glow-red", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(220,38,38,0.15)", selectable: false },
            { id: "label", type: "text", text: "NOCHE DE", x: 0, y: 90, width: 430, fontSize: 20, fontFamily: "Arial", color: "#fb923c", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "SALSA CALIENTE", x: 0, y: 122, width: 430, fontSize: 50, fontFamily: "Arial", color: "#fef2f2", fontWeight: "bold", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 80, y: 195, width: 270, height: 3, fill: "#ef4444", selectable: false },
            { id: "artist", type: "text", text: "ARTISTA PRINCIPAL", x: 0, y: 212, width: 430, fontSize: 22, fontFamily: "Arial", color: "#fb923c", fontWeight: "bold", textAlign: "center" },
            { id: "genres", type: "text", text: "SALSA · BACHATA · MERENGUE", x: 0, y: 252, width: 430, fontSize: 13, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
            { id: "date", type: "text", text: "VIERNES 18 JULIO", x: 0, y: 305, width: 430, fontSize: 26, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "time", type: "text", text: "22:30 HRS · Hasta las 04:00", x: 0, y: 345, width: 430, fontSize: 14, fontFamily: "Arial", color: "#9ca3af", textAlign: "center" },
            { id: "venue", type: "text", text: "Puerto Sol Club · Madrid", x: 0, y: 378, width: 430, fontSize: 15, fontFamily: "Arial", color: "#fb923c", textAlign: "center" },
            { id: "price", type: "text", text: "ANTICIPADA 20€ · PUERTA 25€", x: 0, y: 460, width: 430, fontSize: 16, fontFamily: "Arial", color: "#fef2f2", fontWeight: "bold", textAlign: "center" },
        ],
    },

    // 6 — Festival Aurora
    {
        id: 6,
        title: "Festival Aurora",
        category: "Festival",
        image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800",
        premium: true,
        width: 430,
        height: 540,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "#0a0a1a", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=800", x: 0, y: 0, scaleX: 0.478, scaleY: 0.478, opacity: 0.45 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(10,10,26,0.78)", selectable: false },
            { id: "aurora1", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 200, fill: "rgba(16,185,129,0.12)", selectable: false },
            { id: "aurora2", type: "shape", shape: "rect", x: 0, y: 100, width: 430, height: 200, fill: "rgba(99,102,241,0.1)", selectable: false },
            { id: "days", type: "text", text: "18 · 19 · 20 JULIO", x: 0, y: 70, width: 430, fontSize: 18, fontFamily: "Arial", color: "#34d399", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "FESTIVAL", x: 0, y: 108, width: 430, fontSize: 62, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "title2", type: "text", text: "AURORA", x: 0, y: 172, width: 430, fontSize: 62, fontFamily: "Arial", color: "#34d399", fontWeight: "bold", textAlign: "center" },
            { id: "subtitle", type: "text", text: "MÚSICA SIN LÍMITES", x: 0, y: 248, width: 430, fontSize: 14, fontFamily: "Arial", color: "#a7f3d0", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 80, y: 272, width: 270, height: 1, fill: "#34d399", opacity: 0.5, selectable: false },
            { id: "artists", type: "text", text: "+20 ARTISTAS · 4 ESCENARIOS", x: 0, y: 288, width: 430, fontSize: 14, fontFamily: "Arial", color: "#d1fae5", textAlign: "center" },
            { id: "genres", type: "text", text: "SALSA · BACHATA · URBANO · TROPICAL", x: 0, y: 315, width: 430, fontSize: 12, fontFamily: "Arial", color: "#6ee7b7", textAlign: "center" },
            { id: "venue", type: "text", text: "Parque Costa Azul · Barcelona", x: 0, y: 358, width: 430, fontSize: 15, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "tickets", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 0, y: 390, width: 430, fontSize: 12, fontFamily: "Arial", color: "#34d399", textAlign: "center" },
            { id: "price", type: "text", text: "ABONO 3 DÍAS · DESDE 45€", x: 0, y: 460, width: 430, fontSize: 18, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
        ],
    },

    // 7 — Bachata Nights
    {
        id: 7,
        title: "Bachata Nights",
        category: "Bachata",
        image: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800",
        premium: false,
        width: 430,
        height: 540,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "#0d0005", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800", x: 0, y: 0, scaleX: 0.478, scaleY: 0.478, opacity: 0.45 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(13,0,5,0.8)", selectable: false },
            { id: "glow-pink", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(219,39,119,0.1)", selectable: false },
            { id: "label", type: "text", text: "UNA NOCHE DE", x: 0, y: 90, width: 430, fontSize: 14, fontFamily: "Arial", color: "#f9a8d4", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "BACHATA", x: 0, y: 118, width: 430, fontSize: 72, fontFamily: "Arial", color: "#fce7f3", fontWeight: "bold", textAlign: "center" },
            { id: "title2", type: "text", text: "NIGHTS", x: 0, y: 192, width: 430, fontSize: 72, fontFamily: "Arial", color: "#ec4899", fontWeight: "bold", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 80, y: 278, width: 270, height: 1, fill: "#ec4899", opacity: 0.5, selectable: false },
            { id: "artists", type: "text", text: "CORA & NIKO", x: 0, y: 295, width: 430, fontSize: 26, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "genre", type: "text", text: "BACHATA · AMOR · CONEXIÓN", x: 0, y: 332, width: 430, fontSize: 12, fontFamily: "Arial", color: "#f9a8d4", textAlign: "center" },
            { id: "date", type: "text", text: "DOMINGO 29 JUNIO", x: 0, y: 372, width: 430, fontSize: 22, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "time", type: "text", text: "20:00 HRS · La Terraza", x: 0, y: 405, width: 430, fontSize: 15, fontFamily: "Arial", color: "#f9a8d4", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA 18€", x: 0, y: 460, width: 430, fontSize: 22, fontFamily: "Arial", color: "#fce7f3", fontWeight: "bold", textAlign: "center" },
        ],
    },

    // 8 — Vibra Fest
    {
        id: 8,
        title: "Vibra Fest",
        category: "Urbano",
        image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=800",
        premium: true,
        width: 430,
        height: 540,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "#050014", selectable: false },
            { id: "photo", type: "image", src: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=800", x: 0, y: 0, scaleX: 0.478, scaleY: 0.478, opacity: 0.4 },
            { id: "overlay", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(5,0,20,0.82)", selectable: false },
            { id: "glow-v", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(124,58,237,0.12)", selectable: false },
            { id: "dates", type: "text", text: "25 · 26 · 27 JULIO", x: 0, y: 72, width: 430, fontSize: 16, fontFamily: "Arial", color: "#c4b5fd", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "VIBRA", x: 0, y: 105, width: 430, fontSize: 90, fontFamily: "Arial", color: "#a855f7", fontWeight: "bold", textAlign: "center" },
            { id: "title2", type: "text", text: "FEST 2025", x: 0, y: 195, width: 430, fontSize: 42, fontFamily: "Arial", color: "#06b6d4", fontWeight: "bold", textAlign: "center" },
            { id: "subtitle", type: "text", text: "MÚSICA · ARTE · CULTURA · DIVERSIÓN", x: 0, y: 250, width: 430, fontSize: 11, fontFamily: "Arial", color: "#e0e7ff", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 80, y: 272, width: 270, height: 1, fill: "#a855f7", opacity: 0.6, selectable: false },
            { id: "artists", type: "text", text: "+30 ARTISTAS", x: 0, y: 288, width: 430, fontSize: 24, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "genres", type: "text", text: "REGGAETON · TRAP · AFROBEAT · ELECTRO", x: 0, y: 322, width: 430, fontSize: 11, fontFamily: "Arial", color: "#c4b5fd", textAlign: "center" },
            { id: "venue", type: "text", text: "Arena Metrópolis · Valencia", x: 0, y: 362, width: 430, fontSize: 15, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA GENERAL DESDE 35€", x: 0, y: 460, width: 430, fontSize: 17, fontFamily: "Arial", color: "#c4b5fd", fontWeight: "bold", textAlign: "center" },
        ],
    },


    // 9 — Clases de Baile (Neón Amarillo) — semanal
    {
        id: 9,
        title: "Clases de Baile — Neón",
        category: "Clases",
        image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?q=80&w=800",
        premium: false,
        width: 1080,
        height: 1350,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#FFE600", selectable: false },
            { id: "deco-purple", type: "shape", shape: "rect", x: 594, y: -80, width: 420, height: 520, fill: "#7B2FBE", opacity: 0.95, angle: 12 },
            { id: "top-band", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 220, fill: "#0D0D0D", selectable: false },
            { id: "title-line1", type: "text", text: "CLASES DE", x: 540, y: 48, width: 1080, fontSize: 112, fontFamily: "Anton, Impact, sans-serif", color: "#FFFFFF", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: -10 },
            { id: "title-line2", type: "text", text: "BAILE", x: 540, y: 148, width: 1080, fontSize: 112, fontFamily: "Anton, Impact, sans-serif", color: "#FFE600", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: -10 },
            { id: "artist-photo-9", type: "image", src: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/ChatGPT%20Image%2012%20abr%202026%2C%2014_10_17.png", x: 540, y: 670, scaleX: 0.65, scaleY: 0.65, originX: "center", originY: "center" },
            { id: "bottom-band", type: "shape", shape: "rect", x: 0, y: 1090, width: 1080, height: 260, fill: "#0D0D0D", selectable: false },
            { id: "date", type: "text", text: "00.00.2024", x: 540, y: 1110, width: 1080, fontSize: 96, fontFamily: "Anton, Impact, sans-serif", color: "#FFE600", fontWeight: "900", textAlign: "center", originX: "center", originY: "top", charSpacing: 5 },
            { id: "venue", type: "text", text: "DESDE LAS 17:00 | CALLE CUALQUIERA 123", x: 540, y: 1222, width: 1080, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#FFFFFF", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 30 },
        ],
    },

    // 10 — Dance Class (Negro & Amarillo) — workshop
    {
        id: 10,
        title: "Dance Class — Workshop",
        category: "Clases",
        image: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800",
        premium: true,
        width: 1080,
        height: 1350,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0D0D0D", selectable: false },
            { id: "stripes", type: "shape-pattern", shape: "rect", x: 670, y: -60, width: 22, height: 340, fill: "#F5C518", count: 6, offsetX: 38, angle: -15 },
            { id: "studio-bg", type: "shape", shape: "rect", x: 48, y: 52, width: 520, height: 56, fill: "#F5C518", selectable: false },
            { id: "studio-name", type: "text", text: "NOMBRE DEL ESTUDIO", x: 80, y: 60, width: 480, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#0D0D0D", fontWeight: "800", textAlign: "left", charSpacing: 20 },
            { id: "title1", type: "text", text: "DANCE", x: 48, y: 148, width: 980, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "#FFFFFF", fontWeight: "900", textAlign: "left", charSpacing: -8 },
            { id: "title2", type: "text", text: "CLASS", x: 48, y: 340, width: 980, fontSize: 200, fontFamily: "Anton, Impact, sans-serif", color: "transparent", stroke: "#F5C518", strokeWidth: 4, fontWeight: "900", textAlign: "left", charSpacing: -8 },
            { id: "description", type: "text", text: "Encuentra la libertad en el movimiento.\nÚnete a nuestra clase de baile.", x: 48, y: 580, width: 480, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#FFFFFF", fontWeight: "400", textAlign: "left", lineHeight: 1.4 },
            { id: "price-bg", type: "shape", shape: "rect", x: 48, y: 720, width: 220, height: 100, fill: "#F5C518", selectable: false },
            { id: "price", type: "text", text: "$75", x: 80, y: 730, width: 200, fontSize: 52, fontFamily: "Anton, Impact, sans-serif", color: "#0D0D0D", fontWeight: "900", textAlign: "left" },
            { id: "price-label", type: "text", text: "/ PERSONA", x: 80, y: 790, width: 200, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#0D0D0D", fontWeight: "600", textAlign: "left" },
            { id: "schedule-bg", type: "shape", shape: "rect", x: 288, y: 720, width: 340, height: 100, fill: "#F5C518", selectable: false },
            { id: "schedule", type: "text", text: "TODOS LOS DOMINGOS", x: 308, y: 728, width: 320, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#0D0D0D", fontWeight: "700", textAlign: "left" },
            { id: "time", type: "text", text: "9:00 AM", x: 308, y: 762, width: 320, fontSize: 44, fontFamily: "Anton, Impact, sans-serif", color: "#0D0D0D", fontWeight: "900", textAlign: "left" },
            { id: "separator", type: "shape", shape: "rect", x: 0, y: 850, width: 1080, height: 8, fill: "#F5C518", selectable: false },
            { id: "website", type: "text", text: "www.tusitio.com", x: 540, y: 890, width: 1080, fontSize: 30, fontFamily: "Montserrat, sans-serif", color: "#F5C518", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", underline: true },
            { id: "arrow", type: "text", text: "<<<", x: 540, y: 1270, width: 200, fontSize: 48, fontFamily: "Montserrat, sans-serif", color: "#F5C518", fontWeight: "900", textAlign: "center", originX: "center", originY: "top" },
        ],
    },
];
