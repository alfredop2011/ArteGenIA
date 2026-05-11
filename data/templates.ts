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
    {
        id: 1,
        title: "Noche Magnética",
        category: "Fiesta",
        image:
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800",
        premium: true,
        width: 430,
        height: 540,
        layers: [
            {
                id: "background",
                type: "shape",
                shape: "rect",
                x: 0,
                y: 0,
                width: 430,
                height: 540,
                fill: "#080812",
                selectable: false,
            },
            {
                id: "glow",
                type: "shape",
                shape: "rect",
                x: 40,
                y: 40,
                width: 350,
                height: 460,
                fill: "rgba(168,85,247,0.22)",
                opacity: 1,
                radius: 42,
                selectable: false,
            },
            {
                id: "title",
                type: "text",
                text: "NOCHE MAGNÉTICA",
                x: 35,
                y: 180,
                width: 360,
                fontSize: 42,
                fontFamily: "Arial",
                color: "#facc15",
                fontWeight: "black",
                textAlign: "center",
            },
            {
                id: "subtitle",
                type: "text",
                text: "Fiesta Latina",
                x: 55,
                y: 265,
                width: 320,
                fontSize: 26,
                fontFamily: "Arial",
                color: "#ffffff",
                fontWeight: "bold",
                textAlign: "center",
            },
            {
                id: "date",
                type: "text",
                text: "SÁBADO 21 JUNIO",
                x: 70,
                y: 340,
                width: 290,
                fontSize: 22,
                fontFamily: "Arial",
                color: "#ffffff",
                fontWeight: "bold",
                textAlign: "center",
            },
            {
                id: "price",
                type: "text",
                text: "ENTRADA ANTICIPADA 25€",
                x: 55,
                y: 445,
                width: 320,
                fontSize: 18,
                fontFamily: "Arial",
                color: "#111111",
                fontWeight: "black",
                textAlign: "center",
            },
        ],
    },
    {
        id: 2,
        title: "Urban Party",
        category: "Concierto",
        image:
            "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800",
        premium: false,
        width: 430,
        height: 540,
        layers: [
            {
                id: "background",
                type: "shape",
                shape: "rect",
                x: 0,
                y: 0,
                width: 430,
                height: 540,
                fill: "#070711",
                selectable: false,
            },
            {
                id: "accent",
                type: "shape",
                shape: "rect",
                x: 0,
                y: 0,
                width: 220,
                height: 270,
                fill: "#3b0764",
                opacity: 0.72,
                radius: 45,
                selectable: false,
            },
            {
                id: "title",
                type: "text",
                text: "URBAN PARTY",
                x: 35,
                y: 175,
                width: 360,
                fontSize: 40,
                fontFamily: "Arial",
                color: "#facc15",
                fontWeight: "black",
                textAlign: "center",
            },
            {
                id: "date",
                type: "text",
                text: "SÁBADO 21 JUNIO",
                x: 70,
                y: 325,
                width: 290,
                fontSize: 22,
                fontFamily: "Arial",
                color: "#ffffff",
                fontWeight: "bold",
                textAlign: "center",
            },
            {
                id: "category",
                type: "text",
                text: "Concierto",
                x: 55,
                y: 445,
                width: 320,
                fontSize: 24,
                fontFamily: "Arial",
                color: "#ffffff",
                textAlign: "center",
            },
            {
                id: "price",
                type: "text",
                text: "ENTRADA ANTICIPADA 25€",
                x: 55,
                y: 480,
                width: 320,
                fontSize: 18,
                fontFamily: "Arial",
                color: "#111111",
                fontWeight: "black",
                textAlign: "center",
            },
        ],
    },
    {
        id: 3,
        title: "DJ Neon",
        category: "Discoteca",
        image:
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800",
        premium: true,
        width: 430,
        height: 540,
        layers: [
            {
                id: "background",
                type: "shape",
                shape: "rect",
                x: 0,
                y: 0,
                width: 430,
                height: 540,
                fill: "#020617",
                selectable: false,
            },
            {
                id: "neon-box",
                type: "shape",
                shape: "rect",
                x: 35,
                y: 60,
                width: 360,
                height: 420,
                fill: "rgba(236,72,153,0.18)",
                radius: 35,
                selectable: false,
            },
            {
                id: "title",
                type: "text",
                text: "DJ NEON",
                x: 35,
                y: 190,
                width: 360,
                fontSize: 48,
                fontFamily: "Arial",
                color: "#22d3ee",
                fontWeight: "black",
                textAlign: "center",
            },
            {
                id: "subtitle",
                type: "text",
                text: "Live Experience",
                x: 55,
                y: 270,
                width: 320,
                fontSize: 26,
                fontFamily: "Arial",
                color: "#ffffff",
                textAlign: "center",
            },
            {
                id: "date",
                type: "text",
                text: "VIERNES 28 JUNIO",
                x: 70,
                y: 350,
                width: 290,
                fontSize: 22,
                fontFamily: "Arial",
                color: "#facc15",
                fontWeight: "bold",
                textAlign: "center",
            },
        ],
    },
    {
        id: 4,
        title: "Evento Premium",
        category: "Flyer",
        image:
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
        premium: false,
        width: 430,
        height: 540,
        layers: [
            {
                id: "background",
                type: "shape",
                shape: "rect",
                x: 0,
                y: 0,
                width: 430,
                height: 540,
                fill: "#111827",
                selectable: false,
            },
            {
                id: "gold-card",
                type: "shape",
                shape: "rect",
                x: 45,
                y: 70,
                width: 340,
                height: 400,
                fill: "rgba(250,204,21,0.12)",
                radius: 30,
                selectable: false,
            },
            {
                id: "title",
                type: "text",
                text: "EVENTO PREMIUM",
                x: 35,
                y: 195,
                width: 360,
                fontSize: 38,
                fontFamily: "Arial",
                color: "#facc15",
                fontWeight: "black",
                textAlign: "center",
            },
            {
                id: "subtitle",
                type: "text",
                text: "Diseño editable",
                x: 55,
                y: 275,
                width: 320,
                fontSize: 25,
                fontFamily: "Arial",
                color: "#ffffff",
                textAlign: "center",
            },
            {
                id: "footer",
                type: "text",
                text: "ArteGenIA",
                x: 80,
                y: 430,
                width: 270,
                fontSize: 20,
                fontFamily: "Arial",
                color: "#ffffff",
                textAlign: "center",
            },
        ],
    },
];