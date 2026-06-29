/**
 * Text Presets — combos de texto pre-diseñados profesionalmente.
 *
 * MVP de 10 presets curados para el vertical DJ/eventos/fiestas. Cada
 * preset es un GRUPO de Fabric.IText insertados juntos en el canvas con
 * tipografía + tamaños + spacing pensados para que un no-diseñador
 * obtenga un resultado profesional sin tocar nada.
 *
 * Tipografías = Google Fonts ya cargadas en el proyecto (sin nuevas
 * dependencias). Si añades preset con font nuevo, verifica que esté
 * incluida en app/layout.tsx o el rendering fallará a serif del sistema.
 *
 * Escalado: pensado para canvas 1080×1350 (formato post 4:5). Tamaños
 * REDUCIDOS tras feedback v1 ("demasiado grandes"): ahora el preset
 * típico ocupa ~30-40% del alto del canvas. Cada preset combina al
 * menos 2 niveles de jerarquía (título grande + body legible).
 */
import type { Canvas as FabricCanvas, IText, Object as FabricObject } from "fabric";

export interface TextBlock {
    text: string;
    fontFamily: string;
    fontSize: number;             // px del Fabric
    fontWeight: "normal" | "bold" | "100" | "300" | "400" | "500" | "600" | "700" | "800" | "900";
    fontStyle?: "normal" | "italic";
    fill: string;                 // hex color
    textAlign: "left" | "center" | "right";
    letterSpacing?: number;       // Fabric charSpacing (1/1000 em)
    lineHeight?: number;
    yOffsetPx: number;            // relativo al top del primer bloque
}

export interface TextPreset {
    id: string;
    name: string;                 // display en UI
    category: "header" | "evento" | "dj" | "promo" | "info";
    blocks: TextBlock[];
    /** Para preview en grid: usamos el bloque dominante (mayor fontSize) */
    previewIndex?: number;
}

// Convenciones de tamaño (canvas 1080×1350) — REDUCIDAS tras feedback v1:
// - Hero/Display: 90-120px (antes 130-180)
// - H1: 60-80px    (antes 80-120)
// - H2: 40-50px    (antes 50-70)
// - Body: 22-30px  (antes 28-40)
// - Caption: 16-20px (antes 20-26)
//
// Colores blanco (#ffffff) por defecto — el user los cambiará desde la
// toolbar contextual. Mejor empezar legibles sobre cualquier fondo
// oscuro (target típico de flyers DJ).

export const TEXT_PRESETS: TextPreset[] = [
    // ─── Encabezados básicos (3) ─────────────────────────────────────
    {
        id: "basic-header",
        name: "Encabezado + Body",
        category: "header",
        blocks: [
            {
                text: "TÍTULO PRINCIPAL",
                fontFamily: "Bebas Neue",
                fontSize: 90,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 80,
                lineHeight: 1,
                yOffsetPx: 0,
            },
            {
                text: "Añade aquí una descripción breve\nde tu evento o promoción",
                fontFamily: "Inter",
                fontSize: 22,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                lineHeight: 1.4,
                yOffsetPx: 110,
            },
        ],
    },
    {
        id: "basic-subheader",
        name: "Subtítulo elegante",
        category: "header",
        blocks: [
            {
                text: "Subtítulo elegante",
                fontFamily: "Playfair Display",
                fontSize: 48,
                fontWeight: "600",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "center",
                lineHeight: 1.1,
                yOffsetPx: 0,
            },
            {
                text: "Línea de apoyo · más sutil",
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 200,
                yOffsetPx: 70,
            },
        ],
    },
    {
        id: "basic-body",
        name: "Texto cuerpo",
        category: "header",
        blocks: [
            {
                text: "Añade aquí el texto descriptivo de\ntu evento. Puedes escribir varias líneas\ny ajustar el ancho a tu gusto.",
                fontFamily: "Inter",
                fontSize: 24,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                lineHeight: 1.45,
                yOffsetPx: 0,
            },
        ],
    },

    // ─── Eventos/Fiestas (3) ────────────────────────────────────────
    {
        id: "evento-tonight",
        name: "Tonight · Live",
        category: "evento",
        blocks: [
            {
                text: "· LIVE MUSIC ·",
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: "600",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "TONIGHT",
                fontFamily: "Bebas Neue",
                fontSize: 110,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 150,
                lineHeight: 1,
                yOffsetPx: 30,
            },
            {
                text: "Música en directo · Cocktails · DJ set",
                fontFamily: "Inter",
                fontSize: 20,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                yOffsetPx: 145,
            },
        ],
    },
    {
        id: "evento-saturday-night",
        name: "Saturday Night",
        category: "evento",
        blocks: [
            {
                text: "Saturday",
                fontFamily: "Playfair Display",
                fontSize: 44,
                fontWeight: "400",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "center",
                lineHeight: 1,
                yOffsetPx: 0,
            },
            {
                text: "NIGHT",
                fontFamily: "Anton",
                fontSize: 100,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 80,
                lineHeight: 0.95,
                yOffsetPx: 50,
            },
            {
                text: "Una noche para recordar · 23:00 — 06:00",
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: "500",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 150,
                yOffsetPx: 155,
            },
        ],
    },
    {
        id: "evento-vip",
        name: "VIP Access",
        category: "evento",
        blocks: [
            {
                text: "VIP",
                fontFamily: "Anton",
                fontSize: 130,
                fontWeight: "400",
                fill: "#ffd700",
                textAlign: "center",
                letterSpacing: 50,
                lineHeight: 1,
                yOffsetPx: 0,
            },
            {
                text: "ACCESS · EXCLUSIVE",
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 600,
                yOffsetPx: 140,
            },
            {
                text: "Mesa reservada · Botella incluida · Entrada prioritaria",
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                yOffsetPx: 180,
            },
        ],
    },

    // ─── DJ/Lineup (2) ──────────────────────────────────────────────
    {
        id: "dj-feat-special",
        name: "DJ · Featuring",
        category: "dj",
        blocks: [
            {
                text: "FEATURING",
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: "600",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 600,
                yOffsetPx: 0,
            },
            {
                text: "DJ NAME",
                fontFamily: "Bebas Neue",
                fontSize: 90,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 80,
                lineHeight: 1,
                yOffsetPx: 32,
            },
            {
                text: "Special Guest · TBA",
                fontFamily: "Playfair Display",
                fontSize: 22,
                fontWeight: "400",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "center",
                yOffsetPx: 130,
            },
        ],
    },
    {
        id: "dj-lineup-card",
        name: "Lineup",
        category: "dj",
        blocks: [
            {
                text: "L I N E U P",
                fontFamily: "Inter",
                fontSize: 20,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 1200,
                yOffsetPx: 0,
            },
            {
                text: "Artist One",
                fontFamily: "Bebas Neue",
                fontSize: 56,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 50,
                lineHeight: 1,
                yOffsetPx: 50,
            },
            {
                text: "Artist Two",
                fontFamily: "Bebas Neue",
                fontSize: 56,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 50,
                lineHeight: 1,
                yOffsetPx: 120,
            },
            {
                text: "Artist Three",
                fontFamily: "Bebas Neue",
                fontSize: 56,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 50,
                lineHeight: 1,
                yOffsetPx: 190,
            },
        ],
    },

    // ─── Promo (1) ──────────────────────────────────────────────────
    {
        id: "promo-early-bird",
        name: "Early Bird · % OFF",
        category: "promo",
        blocks: [
            {
                text: "EARLY BIRD",
                fontFamily: "Bebas Neue",
                fontSize: 60,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 150,
                lineHeight: 1,
                yOffsetPx: 0,
            },
            {
                text: "50% OFF",
                fontFamily: "Anton",
                fontSize: 120,
                fontWeight: "400",
                fill: "#ff3b30",
                textAlign: "center",
                lineHeight: 1,
                yOffsetPx: 65,
            },
            {
                text: "Solo primeras 50 entradas · Hasta agotar stock",
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: "500",
                fill: "#ffffff",
                textAlign: "center",
                letterSpacing: 150,
                yOffsetPx: 200,
            },
        ],
    },

    // ─── Info evento (1) ────────────────────────────────────────────
    {
        id: "info-date-time-place",
        name: "Fecha · Hora · Lugar",
        category: "info",
        blocks: [
            {
                text: "DETALLES DEL EVENTO",
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 400,
                yOffsetPx: 0,
            },
            {
                text: "📅  Sábado 12 Julio",
                fontFamily: "Inter",
                fontSize: 24,
                fontWeight: "600",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 50,
                yOffsetPx: 40,
            },
            {
                text: "🕐  23:00 — 06:00",
                fontFamily: "Inter",
                fontSize: 24,
                fontWeight: "600",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 50,
                yOffsetPx: 80,
            },
            {
                text: "📍  Sala Razzmatazz · BCN",
                fontFamily: "Inter",
                fontSize: 24,
                fontWeight: "600",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 50,
                yOffsetPx: 120,
            },
        ],
    },
];

/**
 * Inserta un preset al canvas Fabric. Cada bloque se añade como IText
 * individual (NO Group) para que el user pueda editar/mover/borrar cada
 * uno por separado igual que cualquier texto creado con "Añadir texto".
 *
 * Posicionamiento: el primer bloque se centra horizontalmente. Los
 * siguientes se posicionan en base al yOffsetPx del preset. Origen Y
 * arranca en ~28% del canvas (típico para hero text con body debajo).
 *
 * Devuelve la lista de Fabric IText creados para que el caller los
 * registre como layers.
 */
export async function insertTextPreset(
    canvas: FabricCanvas,
    preset: TextPreset,
    canvasSize: { w: number; h: number },
): Promise<IText[]> {
    const fabric = await import("fabric");
    const created: IText[] = [];

    const baseY = canvasSize.h * 0.28;
    const baseX = canvasSize.w / 2;

    for (const block of preset.blocks) {
        const it = new fabric.IText(block.text, {
            left: baseX,
            top: baseY + block.yOffsetPx,
            fontFamily: block.fontFamily,
            fontSize: block.fontSize,
            fontWeight: block.fontWeight,
            fontStyle: block.fontStyle ?? "normal",
            fill: block.fill,
            textAlign: block.textAlign,
            charSpacing: block.letterSpacing ?? 0,
            lineHeight: block.lineHeight ?? 1.16,
            originX: block.textAlign === "left" ? "left" : block.textAlign === "right" ? "right" : "center",
            originY: "top",
            selectable: true,
            evented: true,
        });
        canvas.add(it);
        created.push(it);
    }

    // Seleccionar el primer bloque para que el user vea el resultado
    // y pueda empezar a editar de inmediato.
    if (created.length > 0) {
        canvas.setActiveObject(created[0] as unknown as FabricObject);
    }
    canvas.requestRenderAll();
    return created;
}
