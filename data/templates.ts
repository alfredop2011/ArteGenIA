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
    fontWeight?: "normal" | "bold" | "black";
    textAlign?: "left" | "center" | "right";
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
    // 1 — Noche Magnética (Fiesta / Club)
    {
        id: 1,
        title: "Noche Magnética",
        category: "Fiesta",
        image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800",
        premium: true,
        width: 430,
        height: 540,
        layers: [
            { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "#080812", selectable: false },
            { id: "glow", type: "shape", shape: "rect", x: 40, y: 40, width: 350, height: 460, fill: "rgba(168,85,247,0.22)", opacity: 1, radius: 42, selectable: false },
            { id: "line-top", type: "shape", shape: "rect", x: 60, y: 90, width: 310, height: 2, fill: "#facc15", opacity: 0.6, selectable: false },
            { id: "line-bot", type: "shape", shape: "rect", x: 60, y: 430, width: 310, height: 2, fill: "#facc15", opacity: 0.6, selectable: false },
            { id: "title", type: "text", text: "NOCHE MAGNÉTICA", x: 35, y: 160, width: 360, fontSize: 42, fontFamily: "Arial", color: "#facc15", fontWeight: "black", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Fiesta Latina", x: 55, y: 240, width: 320, fontSize: 26, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "date", type: "text", text: "SÁBADO 21 JUNIO · 23:00 HRS", x: 55, y: 300, width: 320, fontSize: 18, fontFamily: "Arial", color: "#e0e0e0", fontWeight: "bold", textAlign: "center" },
            { id: "venue", type: "text", text: "Club Metrópolis", x: 55, y: 340, width: 320, fontSize: 16, fontFamily: "Arial", color: "#a78bfa", textAlign: "center" },
            { id: "djs", type: "text", text: "DJ LUXO · MARCOS VEGA", x: 55, y: 375, width: 320, fontSize: 14, fontFamily: "Arial", color: "#d1d5db", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA ANTICIPADA 15€", x: 80, y: 445, width: 270, fontSize: 16, fontFamily: "Arial", color: "#111111", fontWeight: "black", textAlign: "center" },
        ],
    },

    // 2 — Urban Party (Concierto)
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
            { id: "accent", type: "shape", shape: "rect", x: 0, y: 0, width: 220, height: 270, fill: "#3b0764", opacity: 0.72, radius: 45, selectable: false },
            { id: "accent2", type: "shape", shape: "rect", x: 210, y: 270, width: 220, height: 270, fill: "#1e1b4b", opacity: 0.72, radius: 45, selectable: false },
            { id: "title", type: "text", text: "URBAN PARTY", x: 35, y: 155, width: 360, fontSize: 40, fontFamily: "Arial", color: "#facc15", fontWeight: "black", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Live Experience", x: 55, y: 220, width: 320, fontSize: 22, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "artist", type: "text", text: "ARTISTA PRINCIPAL", x: 55, y: 265, width: 320, fontSize: 18, fontFamily: "Arial", color: "#a78bfa", fontWeight: "bold", textAlign: "center" },
            { id: "date", type: "text", text: "SÁBADO 21 JUNIO", x: 70, y: 320, width: 290, fontSize: 20, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "time", type: "text", text: "21:00 HRS · Puertas 20:00", x: 70, y: 355, width: 290, fontSize: 14, fontFamily: "Arial", color: "#9ca3af", textAlign: "center" },
            { id: "venue", type: "text", text: "Teatro del Río", x: 55, y: 390, width: 320, fontSize: 16, fontFamily: "Arial", color: "#fbbf24", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA ANTICIPADA 25€", x: 55, y: 460, width: 320, fontSize: 16, fontFamily: "Arial", color: "#111111", fontWeight: "black", textAlign: "center" },
        ],
    },

    // 3 — DJ Neon (Discoteca)
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
            { id: "neon-box", type: "shape", shape: "rect", x: 35, y: 60, width: 360, height: 420, fill: "rgba(236,72,153,0.12)", radius: 35, selectable: false },
            { id: "circle", type: "shape", shape: "circle", x: 155, y: 60, width: 120, height: 120, fill: "rgba(34,211,238,0.1)", selectable: false },
            { id: "dj-label", type: "text", text: "DJ SET", x: 35, y: 110, width: 360, fontSize: 14, fontFamily: "Arial", color: "#22d3ee", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "DJ NEON", x: 35, y: 150, width: 360, fontSize: 56, fontFamily: "Arial", color: "#22d3ee", fontWeight: "black", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Live Experience", x: 55, y: 230, width: 320, fontSize: 24, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "genres", type: "text", text: "TECHNO · HOUSE · ELECTRO", x: 55, y: 275, width: 320, fontSize: 13, fontFamily: "Arial", color: "#ec4899", textAlign: "center" },
            { id: "date", type: "text", text: "VIERNES 28 JUNIO", x: 70, y: 330, width: 290, fontSize: 22, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "center" },
            { id: "time", type: "text", text: "00:00 — 06:00 HRS", x: 70, y: 365, width: 290, fontSize: 15, fontFamily: "Arial", color: "#9ca3af", textAlign: "center" },
            { id: "venue", type: "text", text: "Club Espacio · Madrid", x: 55, y: 400, width: 320, fontSize: 15, fontFamily: "Arial", color: "#22d3ee", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA 20€ · LISTA HASTA 01:00", x: 55, y: 450, width: 320, fontSize: 13, fontFamily: "Arial", color: "#d1d5db", textAlign: "center" },
        ],
    },

    // 4 — Evento Premium (Gala)
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
            { id: "gold-card", type: "shape", shape: "rect", x: 45, y: 70, width: 340, height: 400, fill: "rgba(250,204,21,0.08)", radius: 30, selectable: false },
            { id: "gold-line-t", type: "shape", shape: "rect", x: 65, y: 100, width: 300, height: 1, fill: "#facc15", opacity: 0.5, selectable: false },
            { id: "gold-line-b", type: "shape", shape: "rect", x: 65, y: 440, width: 300, height: 1, fill: "#facc15", opacity: 0.5, selectable: false },
            { id: "label", type: "text", text: "GALA ESPECIAL", x: 55, y: 120, width: 320, fontSize: 12, fontFamily: "Arial", color: "#facc15", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "EVENTO PREMIUM", x: 35, y: 165, width: 360, fontSize: 38, fontFamily: "Arial", color: "#facc15", fontWeight: "black", textAlign: "center" },
            { id: "subtitle", type: "text", text: "Una noche inolvidable", x: 55, y: 235, width: 320, fontSize: 20, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "artists", type: "text", text: "ARTISTA 1 · ARTISTA 2", x: 55, y: 275, width: 320, fontSize: 16, fontFamily: "Arial", color: "#fbbf24", fontWeight: "bold", textAlign: "center" },
            { id: "date", type: "text", text: "SÁBADO 5 JULIO · 21:00 HRS", x: 55, y: 325, width: 320, fontSize: 17, fontFamily: "Arial", color: "#e5e7eb", fontWeight: "bold", textAlign: "center" },
            { id: "venue", type: "text", text: "Gran Salón · Hotel Palace", x: 55, y: 360, width: 320, fontSize: 14, fontFamily: "Arial", color: "#9ca3af", textAlign: "center" },
            { id: "footer", type: "text", text: "ArteGenIA", x: 80, y: 450, width: 270, fontSize: 18, fontFamily: "Arial", color: "#facc15", textAlign: "center" },
        ],
    },

    // 5 — Salsa Caliente (Salsa / Bachata)
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
            { id: "glow-red", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(220,38,38,0.18)", selectable: false },
            { id: "circle1", type: "shape", shape: "circle", x: 280, y: 20, width: 200, height: 200, fill: "rgba(251,146,60,0.15)", selectable: false },
            { id: "label", type: "text", text: "NOCHE DE", x: 35, y: 100, width: 360, fontSize: 20, fontFamily: "Arial", color: "#fb923c", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "SALSA CALIENTE", x: 35, y: 135, width: 360, fontSize: 44, fontFamily: "Arial", color: "#fef2f2", fontWeight: "black", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 80, y: 205, width: 270, height: 3, fill: "#ef4444", selectable: false },
            { id: "artist", type: "text", text: "ARTISTA PRINCIPAL", x: 35, y: 225, width: 360, fontSize: 22, fontFamily: "Arial", color: "#fb923c", fontWeight: "bold", textAlign: "center" },
            { id: "genres", type: "text", text: "SALSA · BACHATA · MERENGUE", x: 55, y: 270, width: 320, fontSize: 13, fontFamily: "Arial", color: "#fca5a5", textAlign: "center" },
            { id: "date", type: "text", text: "VIERNES 18 JULIO", x: 55, y: 320, width: 320, fontSize: 22, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "time", type: "text", text: "22:30 HRS · Hasta las 04:00", x: 55, y: 355, width: 320, fontSize: 14, fontFamily: "Arial", color: "#9ca3af", textAlign: "center" },
            { id: "venue", type: "text", text: "Puerto Sol Club · Madrid", x: 55, y: 390, width: 320, fontSize: 15, fontFamily: "Arial", color: "#fb923c", textAlign: "center" },
            { id: "price", type: "text", text: "ANTICIPADA 20€ · PUERTA 25€", x: 55, y: 460, width: 320, fontSize: 14, fontFamily: "Arial", color: "#fef2f2", fontWeight: "bold", textAlign: "center" },
        ],
    },

    // 6 — Festival Aurora (Festival)
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
            { id: "aurora1", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 200, fill: "rgba(16,185,129,0.15)", selectable: false },
            { id: "aurora2", type: "shape", shape: "rect", x: 0, y: 100, width: 430, height: 200, fill: "rgba(99,102,241,0.12)", selectable: false },
            { id: "days", type: "text", text: "18 · 19 · 20 JULIO", x: 35, y: 80, width: 360, fontSize: 18, fontFamily: "Arial", color: "#34d399", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "FESTIVAL", x: 35, y: 120, width: 360, fontSize: 52, fontFamily: "Arial", color: "#ffffff", fontWeight: "black", textAlign: "center" },
            { id: "title2", type: "text", text: "AURORA", x: 35, y: 178, width: 360, fontSize: 52, fontFamily: "Arial", color: "#34d399", fontWeight: "black", textAlign: "center" },
            { id: "subtitle", type: "text", text: "MÚSICA SIN LÍMITES", x: 55, y: 242, width: 320, fontSize: 14, fontFamily: "Arial", color: "#a7f3d0", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 80, y: 268, width: 270, height: 1, fill: "#34d399", opacity: 0.5, selectable: false },
            { id: "artists", type: "text", text: "+20 ARTISTAS · 4 ESCENARIOS", x: 35, y: 285, width: 360, fontSize: 14, fontFamily: "Arial", color: "#d1fae5", textAlign: "center" },
            { id: "genres", type: "text", text: "SALSA · BACHATA · URBANO · TROPICAL", x: 35, y: 315, width: 360, fontSize: 12, fontFamily: "Arial", color: "#6ee7b7", textAlign: "center" },
            { id: "venue", type: "text", text: "Parque Costa Azul · Barcelona", x: 55, y: 360, width: 320, fontSize: 15, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "tickets", type: "text", text: "ENTRADAS EN ARTEGENIA.COM", x: 55, y: 395, width: 320, fontSize: 12, fontFamily: "Arial", color: "#34d399", textAlign: "center" },
            { id: "price", type: "text", text: "ABONO 3 DÍAS · DESDE 45€", x: 55, y: 460, width: 320, fontSize: 16, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
        ],
    },

    // 7 — Bachata Nights (Bachata)
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
            { id: "glow-pink", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(219,39,119,0.12)", selectable: false },
            { id: "circle-big", type: "shape", shape: "circle", x: 65, y: 100, width: 300, height: 300, fill: "rgba(219,39,119,0.08)", selectable: false },
            { id: "label", type: "text", text: "UNA NOCHE DE", x: 35, y: 100, width: 360, fontSize: 14, fontFamily: "Arial", color: "#f9a8d4", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "BACHATA", x: 35, y: 130, width: 360, fontSize: 58, fontFamily: "Arial", color: "#fce7f3", fontWeight: "black", textAlign: "center" },
            { id: "title2", type: "text", text: "NIGHTS", x: 35, y: 193, width: 360, fontSize: 58, fontFamily: "Arial", color: "#ec4899", fontWeight: "black", textAlign: "center" },
            { id: "artists", type: "text", text: "CORA & NIKO", x: 35, y: 268, width: 360, fontSize: 24, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "genre", type: "text", text: "BACHATA · AMOR · CONEXIÓN", x: 55, y: 305, width: 320, fontSize: 12, fontFamily: "Arial", color: "#f9a8d4", textAlign: "center" },
            { id: "date", type: "text", text: "DOMINGO 29 JUNIO", x: 55, y: 350, width: 320, fontSize: 20, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "time", type: "text", text: "20:00 HRS · La Terraza", x: 55, y: 385, width: 320, fontSize: 15, fontFamily: "Arial", color: "#f9a8d4", textAlign: "center" },
            { id: "price", type: "text", text: "ENTRADA 18€", x: 55, y: 460, width: 320, fontSize: 18, fontFamily: "Arial", color: "#fce7f3", fontWeight: "bold", textAlign: "center" },
        ],
    },

    // 8 — Vibra Fest (Festival Urbano)
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
            { id: "glow-v", type: "shape", shape: "rect", x: 0, y: 0, width: 430, height: 540, fill: "rgba(124,58,237,0.15)", selectable: false },
            { id: "glow-c", type: "shape", shape: "circle", x: 65, y: 200, width: 300, height: 300, fill: "rgba(6,182,212,0.08)", selectable: false },
            { id: "dates", type: "text", text: "25 · 26 · 27 JULIO", x: 35, y: 80, width: 360, fontSize: 16, fontFamily: "Arial", color: "#c4b5fd", fontWeight: "bold", textAlign: "center" },
            { id: "title", type: "text", text: "VIBRA", x: 35, y: 115, width: 360, fontSize: 72, fontFamily: "Arial", color: "#a855f7", fontWeight: "black", textAlign: "center" },
            { id: "title2", type: "text", text: "FEST 2025", x: 35, y: 190, width: 360, fontSize: 36, fontFamily: "Arial", color: "#06b6d4", fontWeight: "black", textAlign: "center" },
            { id: "subtitle", type: "text", text: "MÚSICA · ARTE · CULTURA · DIVERSIÓN", x: 35, y: 245, width: 360, fontSize: 11, fontFamily: "Arial", color: "#e0e7ff", textAlign: "center" },
            { id: "line", type: "shape", shape: "rect", x: 80, y: 268, width: 270, height: 1, fill: "#a855f7", opacity: 0.6, selectable: false },
            { id: "artists", type: "text", text: "+30 ARTISTAS", x: 35, y: 285, width: 360, fontSize: 20, fontFamily: "Arial", color: "#ffffff", fontWeight: "bold", textAlign: "center" },
            { id: "genres", type: "text", text: "REGGAETON · TRAP · AFROBEAT · ELECTRO", x: 35, y: 320, width: 360, fontSize: 11, fontFamily: "Arial", color: "#c4b5fd", textAlign: "center" },
            { id: "venue", type: "text", text: "Arena Metrópolis · Valencia", x: 55, y: 365, width: 320, fontSize: 15, fontFamily: "Arial", color: "#ffffff", textAlign: "center" },
            { id: "tickets", type: "text", text: "ENTRADA GENERAL DESDE 35€", x: 55, y: 460, width: 320, fontSize: 15, fontFamily: "Arial", color: "#c4b5fd", fontWeight: "bold", textAlign: "center" },
        ],
    },
];