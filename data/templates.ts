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

    // ─────────────────────────────────────────────────────────────────────
    // 11 — NEON NIGHT (Club electrónico, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 11,
        title: "Neon Night",
        category: "Club / Discoteca",
        image: "https://images.unsplash.com/photo-1571266028243-d220c6a82b8d?q=80&w=800",
        premium: true,
        width: 1080,
        height: 1350,
        layers: [
            // Fondo oscuro
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#05050f", selectable: false },
            // Gradiente simulado con rectángulos translúcidos
            { id: "glow-1", type: "shape", shape: "circle", x: 200, y: 200, width: 700, height: 700, radius: 350, fill: "#7c3aed", opacity: 0.18, selectable: false },
            { id: "glow-2", type: "shape", shape: "circle", x: 600, y: 800, width: 600, height: 600, radius: 300, fill: "#ec4899", opacity: 0.16, selectable: false },
            { id: "glow-3", type: "shape", shape: "circle", x: -100, y: 1000, width: 500, height: 500, radius: 250, fill: "#06b6d4", opacity: 0.14, selectable: false },
            // Línea horizontal decorativa arriba
            { id: "top-line", type: "shape", shape: "rect", x: 70, y: 110, width: 80, height: 2, fill: "#06b6d4", selectable: false },
            { id: "category", type: "text", text: "DJ SET · LIVE", x: 170, y: 95, width: 600, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#06b6d4", fontWeight: "600", charSpacing: 400 },
            // Título principal grande
            { id: "title", type: "text", text: "NEON", x: 540, y: 320, width: 1080, fontSize: 320, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            { id: "title2", type: "text", text: "NIGHT", x: 540, y: 540, width: 1080, fontSize: 320, fontFamily: "Anton, Impact, sans-serif", color: "#06b6d4", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", stroke: "#06b6d4", strokeWidth: 0 },
            // Subtítulo con géneros
            { id: "genres", type: "text", text: "TECHNO · HOUSE · BASS", x: 540, y: 740, width: 900, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#e2e8f0", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            // Banda magenta diagonal decorativa
            { id: "diag-band", type: "shape", shape: "rect", x: -100, y: 850, width: 1300, height: 4, fill: "#ec4899", angle: -2, selectable: false },
            // Bloque de fecha grande
            { id: "date-box", type: "shape", shape: "rect", x: 90, y: 920, width: 900, height: 220, fill: "rgba(124, 58, 237, 0.15)", stroke: "#7c3aed", strokeWidth: 2, selectable: false },
            { id: "date-day", type: "text", text: "VIERNES 28", x: 540, y: 950, width: 900, fontSize: 56, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", fontWeight: "900", textAlign: "center", originX: "center", originY: "top" },
            { id: "date-month", type: "text", text: "JUNIO 2026", x: 540, y: 1020, width: 900, fontSize: 36, fontFamily: "Montserrat, sans-serif", color: "#ec4899", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 400 },
            { id: "date-time", type: "text", text: "23:00 — 06:00 HRS", x: 540, y: 1080, width: 900, fontSize: 24, fontFamily: "Montserrat, sans-serif", color: "#e2e8f0", fontWeight: "400", textAlign: "center", originX: "center", originY: "top", charSpacing: 200 },
            // Pie con datos
            { id: "venue", type: "text", text: "CLUB ESPACIO · MADRID", x: 540, y: 1210, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#ffffff", fontWeight: "600", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
            { id: "price", type: "text", text: "ENTRADA 20€ · LISTA HASTA 01:00", x: 540, y: 1255, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#94a3b8", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 12 — LATIN HEAT (Salsa / Bachata, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 12,
        title: "Latin Heat",
        category: "Salsa",
        image: "https://images.unsplash.com/photo-1535525153412-5a42439a210d?q=80&w=800",
        premium: true,
        width: 1080,
        height: 1350,
        layers: [
            // Fondo gradiente cálido (rectángulos apilados)
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#7c1d1d", selectable: false },
            { id: "bg-warm-1", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 700, fill: "rgba(220, 38, 38, 0.45)", selectable: false },
            { id: "bg-warm-2", type: "shape", shape: "circle", x: 540, y: 200, width: 1400, height: 1400, radius: 700, fill: "rgba(245, 158, 11, 0.18)", selectable: false },
            // Sello VIP arriba derecha
            { id: "vip-circle", type: "shape", shape: "circle", x: 920, y: 100, width: 100, height: 100, radius: 50, fill: "rgba(0,0,0,0)", stroke: "#fef3c7", strokeWidth: 2, selectable: false },
            { id: "vip-text", type: "text", text: "VIP", x: 970, y: 150, width: 100, fontSize: 32, fontFamily: "Playfair Display, serif", color: "#fef3c7", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            // Mini etiqueta arriba izquierda
            { id: "tag", type: "text", text: "— NOCHE LATINA —", x: 90, y: 130, width: 600, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#fef3c7", fontWeight: "400", charSpacing: 300 },
            // Título principal (serif elegante)
            { id: "title", type: "text", text: "Latin", x: 540, y: 420, width: 1080, fontSize: 240, fontFamily: "Playfair Display, serif", color: "#fef3c7", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            { id: "title2", type: "text", text: "HEAT", x: 540, y: 620, width: 1080, fontSize: 280, fontFamily: "Anton, Impact, sans-serif", color: "#f59e0b", fontWeight: "900", textAlign: "center", originX: "center", originY: "center", charSpacing: 500 },
            // Línea decorativa curvada (simulada con rect angle)
            { id: "deco-line", type: "shape", shape: "rect", x: 290, y: 800, width: 500, height: 3, fill: "#fef3c7", selectable: false },
            // Géneros
            { id: "genres", type: "text", text: "SALSA · BACHATA · MERENGUE", x: 540, y: 850, width: 1000, fontSize: 26, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 400 },
            // Bloque de información
            { id: "info-bg", type: "shape", shape: "rect", x: 140, y: 970, width: 800, height: 220, fill: "rgba(0,0,0,0.35)", selectable: false },
            { id: "date", type: "text", text: "SÁBADO 12 JULIO", x: 540, y: 1000, width: 800, fontSize: 52, fontFamily: "Playfair Display, serif", color: "#fef3c7", fontWeight: "900", textAlign: "center", originX: "center", originY: "top" },
            { id: "time", type: "text", text: "22:00 HRS · OPEN BAR", x: 540, y: 1075, width: 800, fontSize: 28, fontFamily: "Montserrat, sans-serif", color: "#f59e0b", fontWeight: "600", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
            { id: "place", type: "text", text: "SALA TROPICANA · BARCELONA", x: 540, y: 1130, width: 800, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#fef3c7", fontWeight: "400", textAlign: "center", originX: "center", originY: "top", charSpacing: 300 },
            // Footer
            { id: "footer", type: "text", text: "ENTRADA 15€ ANTICIPADA · 20€ EN PUERTA", x: 540, y: 1260, width: 1000, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "rgba(254,243,199,0.7)", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 13 — FESTIVAL POP (Festival, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 13,
        title: "Festival Pop",
        category: "Festival",
        image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800",
        premium: true,
        width: 1080,
        height: 1350,
        layers: [
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
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 14 — BLACK TIE (Gala corporativa, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 14,
        title: "Black Tie",
        category: "Corporativo",
        image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=800",
        premium: true,
        width: 1080,
        height: 1350,
        layers: [
            // Fondo negro profundo
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0a0a0a", selectable: false },
            // Sutil overlay para textura
            { id: "vignette", type: "shape", shape: "circle", x: 540, y: 675, width: 1400, height: 1400, radius: 700, fill: "rgba(212, 175, 55, 0.05)", selectable: false },
            // Marco dorado fino - 4 lados
            { id: "frame-top", type: "shape", shape: "rect", x: 60, y: 60, width: 960, height: 1, fill: "#d4af37", selectable: false },
            { id: "frame-bottom", type: "shape", shape: "rect", x: 60, y: 1290, width: 960, height: 1, fill: "#d4af37", selectable: false },
            { id: "frame-left", type: "shape", shape: "rect", x: 60, y: 60, width: 1, height: 1231, fill: "#d4af37", selectable: false },
            { id: "frame-right", type: "shape", shape: "rect", x: 1019, y: 60, width: 1, height: 1231, fill: "#d4af37", selectable: false },
            // Pequeño label arriba
            { id: "year-line", type: "shape", shape: "rect", x: 470, y: 175, width: 140, height: 1, fill: "#d4af37", selectable: false },
            { id: "year", type: "text", text: "G A L A   2 0 2 6", x: 540, y: 220, width: 900, fontSize: 22, fontFamily: "Cormorant Garamond, Playfair Display, serif", color: "#d4af37", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 800 },
            // Título principal
            { id: "title", type: "text", text: "Black", x: 540, y: 460, width: 1080, fontSize: 200, fontFamily: "Cormorant Garamond, Playfair Display, serif", color: "#ffffff", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            { id: "title-amp", type: "text", text: "&", x: 540, y: 605, width: 1080, fontSize: 90, fontFamily: "Cormorant Garamond, Playfair Display, serif", color: "#d4af37", fontWeight: "300", textAlign: "center", originX: "center", originY: "center" },
            { id: "title2", type: "text", text: "Tie", x: 540, y: 740, width: 1080, fontSize: 200, fontFamily: "Cormorant Garamond, Playfair Display, serif", color: "#d4af37", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            // Línea separadora
            { id: "sep", type: "shape", shape: "rect", x: 470, y: 880, width: 140, height: 1, fill: "#d4af37", selectable: false },
            // Subtítulo
            { id: "subtitle", type: "text", text: "Una noche de elegancia y distinción", x: 540, y: 930, width: 1000, fontSize: 28, fontFamily: "Cormorant Garamond, Playfair Display, serif", color: "#e5e5e5", fontWeight: "300", textAlign: "center", originX: "center", originY: "center" },
            // Bloque información
            { id: "date-label", type: "text", text: "SÁBADO", x: 540, y: 1050, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#d4af37", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 1000 },
            { id: "date", type: "text", text: "5 DE JULIO", x: 540, y: 1100, width: 900, fontSize: 56, fontFamily: "Cormorant Garamond, Playfair Display, serif", color: "#ffffff", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            { id: "time", type: "text", text: "21:00 H — HOTEL PALACE", x: 540, y: 1180, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "#e5e5e5", fontWeight: "300", textAlign: "center", originX: "center", originY: "center", charSpacing: 500 },
            // Footer
            { id: "rsvp", type: "text", text: "R S V P    ·    + 3 4   6 0 0   0 0 0   0 0 0", x: 540, y: 1245, width: 1000, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(212,175,55,0.7)", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 15 — STREET WAVE (Reggaeton / Trap Urbano, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 15,
        title: "Street Wave",
        category: "Urbano",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800",
        premium: true,
        width: 1080,
        height: 1350,
        layers: [
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
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 16 — GOLDEN PARTY (Cumpleaños / Aniversario, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 16,
        title: "Golden Party",
        category: "Cumpleaños",
        image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800",
        premium: true,
        width: 1080,
        height: 1350,
        layers: [
            // Fondo azul medianoche profundo
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#0c0a3e", selectable: false },
            // Capa decorativa - circulo suave central
            { id: "glow-center", type: "shape", shape: "circle", x: 540, y: 600, width: 1100, height: 1100, radius: 550, fill: "rgba(251, 191, 36, 0.08)", selectable: false },
            { id: "glow-2", type: "shape", shape: "circle", x: 540, y: 600, width: 700, height: 700, radius: 350, fill: "rgba(251, 191, 36, 0.06)", selectable: false },
            // Confetti / estrellas pequeñas (puntos dorados)
            { id: "star-1", type: "shape", shape: "circle", x: 150, y: 200, width: 8, height: 8, radius: 4, fill: "#fbbf24", selectable: false },
            { id: "star-2", type: "shape", shape: "circle", x: 880, y: 230, width: 6, height: 6, radius: 3, fill: "#fbbf24", selectable: false },
            { id: "star-3", type: "shape", shape: "circle", x: 950, y: 380, width: 10, height: 10, radius: 5, fill: "#fbbf24", selectable: false },
            { id: "star-4", type: "shape", shape: "circle", x: 120, y: 480, width: 6, height: 6, radius: 3, fill: "#fbbf24", selectable: false },
            { id: "star-5", type: "shape", shape: "circle", x: 200, y: 1100, width: 8, height: 8, radius: 4, fill: "#fbbf24", selectable: false },
            { id: "star-6", type: "shape", shape: "circle", x: 920, y: 1150, width: 6, height: 6, radius: 3, fill: "#fbbf24", selectable: false },
            { id: "star-7", type: "shape", shape: "circle", x: 80, y: 850, width: 10, height: 10, radius: 5, fill: "#fbbf24", selectable: false },
            { id: "star-8", type: "shape", shape: "circle", x: 1000, y: 900, width: 8, height: 8, radius: 4, fill: "#fbbf24", selectable: false },
            // Marco decorativo dorado fino (esquinas)
            { id: "corner-tl-h", type: "shape", shape: "rect", x: 80, y: 80, width: 80, height: 2, fill: "#fbbf24", selectable: false },
            { id: "corner-tl-v", type: "shape", shape: "rect", x: 80, y: 80, width: 2, height: 80, fill: "#fbbf24", selectable: false },
            { id: "corner-tr-h", type: "shape", shape: "rect", x: 920, y: 80, width: 80, height: 2, fill: "#fbbf24", selectable: false },
            { id: "corner-tr-v", type: "shape", shape: "rect", x: 998, y: 80, width: 2, height: 80, fill: "#fbbf24", selectable: false },
            { id: "corner-bl-h", type: "shape", shape: "rect", x: 80, y: 1268, width: 80, height: 2, fill: "#fbbf24", selectable: false },
            { id: "corner-bl-v", type: "shape", shape: "rect", x: 80, y: 1190, width: 2, height: 80, fill: "#fbbf24", selectable: false },
            { id: "corner-br-h", type: "shape", shape: "rect", x: 920, y: 1268, width: 80, height: 2, fill: "#fbbf24", selectable: false },
            { id: "corner-br-v", type: "shape", shape: "rect", x: 998, y: 1190, width: 2, height: 80, fill: "#fbbf24", selectable: false },
            // Etiqueta arriba "Happy Birthday"
            { id: "label", type: "text", text: "— HAPPY BIRTHDAY —", x: 540, y: 200, width: 1000, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#fbbf24", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 800 },
            // Edad gigante protagonista
            { id: "age", type: "text", text: "30", x: 540, y: 480, width: 1080, fontSize: 480, fontFamily: "Playfair Display, serif", color: "#fbbf24", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            // Nombre en script
            { id: "name", type: "text", text: "Carlos", x: 540, y: 800, width: 1080, fontSize: 96, fontFamily: "Great Vibes, cursive", color: "#ffffff", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            // Línea decorativa
            { id: "deco-line", type: "shape", shape: "rect", x: 390, y: 890, width: 300, height: 1, fill: "#fbbf24", selectable: false },
            // Bloque fecha
            { id: "date-day", type: "text", text: "SÁBADO", x: 540, y: 960, width: 900, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#fbbf24", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 800 },
            { id: "date", type: "text", text: "15 DE MARZO", x: 540, y: 1010, width: 900, fontSize: 48, fontFamily: "Playfair Display, serif", color: "#ffffff", fontWeight: "700", textAlign: "center", originX: "center", originY: "center" },
            { id: "time", type: "text", text: "20:00 H · CENA Y FIESTA", x: 540, y: 1080, width: 900, fontSize: 22, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.8)", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 300 },
            // Lugar
            { id: "place", type: "text", text: "Salón Marbella · Av. Principal 25", x: 540, y: 1160, width: 900, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#fbbf24", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            // Footer
            { id: "rsvp", type: "text", text: "Confirmar asistencia · 600 000 000", x: 540, y: 1230, width: 1000, fontSize: 16, fontFamily: "Montserrat, sans-serif", color: "rgba(251,191,36,0.7)", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
        ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // 17 — BOTANIC LOVE (Boda / 15 años, 1080x1350)
    // ─────────────────────────────────────────────────────────────────────
    {
        id: 17,
        title: "Botanic Love",
        category: "Boda",
        image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800",
        premium: true,
        width: 1080,
        height: 1350,
        layers: [
            // Fondo crema cálido
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 1350, fill: "#fef3e8", selectable: false },
            // Sutil overlay con tonos polvo
            { id: "wash", type: "shape", shape: "circle", x: 540, y: 675, width: 1500, height: 1500, radius: 750, fill: "rgba(253, 164, 175, 0.06)", selectable: false },
            // Hojas botánicas decorativas (simuladas con elipses rotadas)
            { id: "leaf-tl-1", type: "shape", shape: "circle", x: 50, y: 80, width: 200, height: 80, radius: 40, fill: "#86efac", opacity: 0.7, angle: -25, selectable: false },
            { id: "leaf-tl-2", type: "shape", shape: "circle", x: 130, y: 130, width: 160, height: 60, radius: 30, fill: "#bbf7d0", opacity: 0.85, angle: -45, selectable: false },
            { id: "leaf-tl-3", type: "shape", shape: "circle", x: 80, y: 200, width: 130, height: 50, radius: 25, fill: "#86efac", opacity: 0.6, angle: 15, selectable: false },
            { id: "leaf-br-1", type: "shape", shape: "circle", x: 1030, y: 1270, width: 200, height: 80, radius: 40, fill: "#86efac", opacity: 0.7, angle: 155, selectable: false },
            { id: "leaf-br-2", type: "shape", shape: "circle", x: 950, y: 1220, width: 160, height: 60, radius: 30, fill: "#bbf7d0", opacity: 0.85, angle: 135, selectable: false },
            { id: "leaf-br-3", type: "shape", shape: "circle", x: 1000, y: 1150, width: 130, height: 50, radius: 25, fill: "#86efac", opacity: 0.6, angle: 195, selectable: false },
            // Flores rosadas
            { id: "flower-1", type: "shape", shape: "circle", x: 180, y: 170, width: 40, height: 40, radius: 20, fill: "#fda4af", opacity: 0.85, selectable: false },
            { id: "flower-1-c", type: "shape", shape: "circle", x: 180, y: 170, width: 14, height: 14, radius: 7, fill: "#fef3e8", selectable: false },
            { id: "flower-2", type: "shape", shape: "circle", x: 920, y: 1220, width: 40, height: 40, radius: 20, fill: "#fda4af", opacity: 0.85, selectable: false },
            { id: "flower-2-c", type: "shape", shape: "circle", x: 920, y: 1220, width: 14, height: 14, radius: 7, fill: "#fef3e8", selectable: false },
            // Etiqueta arriba
            { id: "label", type: "text", text: "— SAVE THE DATE —", x: 540, y: 320, width: 900, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#9a3412", fontWeight: "400", textAlign: "center", originX: "center", originY: "center", charSpacing: 800 },
            // Nombres en script grandes
            { id: "name1", type: "text", text: "María", x: 540, y: 450, width: 1080, fontSize: 130, fontFamily: "Great Vibes, cursive", color: "#7c2d12", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            { id: "amp", type: "text", text: "&", x: 540, y: 580, width: 1080, fontSize: 70, fontFamily: "Playfair Display, serif", color: "#fda4af", fontWeight: "300", textAlign: "center", originX: "center", originY: "center" },
            { id: "name2", type: "text", text: "Daniel", x: 540, y: 700, width: 1080, fontSize: 130, fontFamily: "Great Vibes, cursive", color: "#7c2d12", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            // Línea decorativa
            { id: "deco-line", type: "shape", shape: "rect", x: 390, y: 820, width: 300, height: 1, fill: "#fda4af", selectable: false },
            // Mensaje
            { id: "message", type: "text", text: "Tenemos el honor de invitarte a nuestra boda", x: 540, y: 880, width: 900, fontSize: 22, fontFamily: "Playfair Display, serif", color: "#7c2d12", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            // Fecha protagonista
            { id: "date-day-label", type: "text", text: "SÁBADO", x: 300, y: 1000, width: 200, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#9a3412", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            { id: "date-day", type: "text", text: "12", x: 300, y: 1070, width: 200, fontSize: 120, fontFamily: "Playfair Display, serif", color: "#7c2d12", fontWeight: "900", textAlign: "center", originX: "center", originY: "center" },
            { id: "date-month", type: "text", text: "JUNIO", x: 540, y: 1000, width: 200, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#9a3412", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            { id: "date-month-name", type: "text", text: "DE", x: 540, y: 1060, width: 200, fontSize: 36, fontFamily: "Playfair Display, serif", color: "#7c2d12", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            { id: "date-month-name2", type: "text", text: "2026", x: 540, y: 1110, width: 200, fontSize: 36, fontFamily: "Playfair Display, serif", color: "#7c2d12", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
            { id: "date-time-label", type: "text", text: "CEREMONIA", x: 780, y: 1000, width: 200, fontSize: 18, fontFamily: "Montserrat, sans-serif", color: "#9a3412", fontWeight: "500", textAlign: "center", originX: "center", originY: "center", charSpacing: 600 },
            { id: "date-time", type: "text", text: "17:00", x: 780, y: 1070, width: 200, fontSize: 56, fontFamily: "Playfair Display, serif", color: "#7c2d12", fontWeight: "700", textAlign: "center", originX: "center", originY: "center" },
            // Lugar
            { id: "place", type: "text", text: "Hacienda Los Olivos · Sevilla", x: 540, y: 1230, width: 900, fontSize: 20, fontFamily: "Playfair Display, serif", color: "#9a3412", fontWeight: "400", textAlign: "center", originX: "center", originY: "center" },
        ],
    },
];
