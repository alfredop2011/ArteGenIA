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
 * v3 — estilo "card" tipo Polotno (feedback usuario):
 * - Alineación IZQUIERDA en la mayoría (más profesional para flyers)
 * - Bloques JUNTOS verticalmente (yOffset pequeño 30-60px) — leen como
 *   una sola unidad visual tipo "tarjeta", no como elementos sueltos
 * - Mix DRAMÁTICO de fuentes: caption sans + display bold + body sans
 * - Contenido específico del vertical DJ/eventos (no "TÍTULO PRINCIPAL"
 *   genérico — usa textos plausibles que el user puede editar/mantener)
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

// Escala canvas 1080×1350:
// - Display 70-100px (titulares cortos: VIP, SALE, NIGHT)
// - H1 50-70px (titulares medios)
// - H2 28-36px (sub)
// - Body 18-24px (descripción multi-line)
// - Caption 12-16px (uppercase pequeño tipo "LOOKING FOR")
//
// Spacing entre bloques: 25-60px (NO 100+ — leen como card).

export const TEXT_PRESETS: TextPreset[] = [
    // ─── Encabezados básicos (3) ─────────────────────────────────────
    {
        id: "card-operations",
        name: "Título + Body",
        category: "header",
        blocks: [
            {
                text: "LOOKING FOR",
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 300,
                yOffsetPx: 0,
            },
            {
                text: "OPERATIONS\nMANAGER",
                fontFamily: "Inter",
                fontSize: 56,
                fontWeight: "900",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 30,
            },
            {
                text: "Will be responsible for managing activities that are\npart of the production of goods and services.\nDirect responsibilities include managing both the\noperations process, embracing design, planning,\ncontrol, performance improvement.",
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.4,
                yOffsetPx: 175,
            },
        ],
    },
    {
        id: "card-marketing-proposal",
        name: "Tag + Title bold",
        category: "header",
        blocks: [
            {
                text: "M.MK and CO",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 200,
                yOffsetPx: 0,
            },
            {
                text: "MARKETING\nPROPOSAL",
                fontFamily: "Inter",
                fontSize: 64,
                fontWeight: "900",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "An operational document that outlines an advertising\nstrategy that an organization will implement to\ngenerate leads and reach its target market.",
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.45,
                yOffsetPx: 165,
            },
        ],
    },
    {
        id: "card-minimalism",
        name: "Tag + Display",
        category: "header",
        blocks: [
            {
                text: "The Future Of Design",
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 50,
                yOffsetPx: 0,
            },
            {
                text: "MINIMALISIM",
                fontFamily: "Inter",
                fontSize: 56,
                fontWeight: "900",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 30,
                lineHeight: 1,
                yOffsetPx: 28,
            },
        ],
    },

    // ─── Eventos/Fiestas (3) ────────────────────────────────────────
    {
        id: "evento-tonight",
        name: "Caption + TONIGHT",
        category: "evento",
        blocks: [
            {
                text: "LIVE MUSIC TONIGHT",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 400,
                yOffsetPx: 0,
            },
            {
                text: "TONIGHT",
                fontFamily: "Bebas Neue",
                fontSize: 100,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 80,
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Música en directo · Cocktails · DJ set\nDoors open 22:00 — Free entry before midnight",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 138,
            },
        ],
    },
    {
        id: "evento-saturday-night",
        name: "Saturday NIGHT",
        category: "evento",
        blocks: [
            {
                text: "Saturday",
                fontFamily: "Playfair Display",
                fontSize: 38,
                fontWeight: "400",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 0,
            },
            {
                text: "NIGHT",
                fontFamily: "Anton",
                fontSize: 110,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 60,
                lineHeight: 0.95,
                yOffsetPx: 38,
            },
            {
                text: "An unforgettable night with the best DJs in town.\nReserve your table — limited capacity.",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.45,
                yOffsetPx: 165,
            },
        ],
    },
    {
        id: "evento-vip",
        name: "EXCLUSIVE · VIP",
        category: "evento",
        blocks: [
            {
                text: "EXCLUSIVE ACCESS",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "VIP TABLE",
                fontFamily: "Anton",
                fontSize: 90,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 40,
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Mesa reservada · Botella incluida\nEntrada prioritaria · Zona VIP",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "500",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 130,
            },
        ],
    },

    // ─── DJ/Lineup (2) ──────────────────────────────────────────────
    {
        id: "dj-feat-special",
        name: "Featuring · DJ",
        category: "dj",
        blocks: [
            {
                text: "TONIGHT FEATURING",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 400,
                yOffsetPx: 0,
            },
            {
                text: "DJ NAME",
                fontFamily: "Bebas Neue",
                fontSize: 80,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 80,
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Special guest · TBA",
                fontFamily: "Playfair Display",
                fontSize: 22,
                fontWeight: "400",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                yOffsetPx: 115,
            },
        ],
    },
    {
        id: "dj-lineup-card",
        name: "Lineup card",
        category: "dj",
        blocks: [
            {
                text: "L I N E U P",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 800,
                yOffsetPx: 0,
            },
            {
                text: "Artist One",
                fontFamily: "Bebas Neue",
                fontSize: 48,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 30,
                lineHeight: 1,
                yOffsetPx: 30,
            },
            {
                text: "Artist Two",
                fontFamily: "Bebas Neue",
                fontSize: 48,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 30,
                lineHeight: 1,
                yOffsetPx: 85,
            },
            {
                text: "Artist Three",
                fontFamily: "Bebas Neue",
                fontSize: 48,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 30,
                lineHeight: 1,
                yOffsetPx: 140,
            },
        ],
    },

    // ─── Promo (1) ──────────────────────────────────────────────────
    {
        id: "promo-early-bird",
        name: "EARLY BIRD · OFF",
        category: "promo",
        blocks: [
            {
                text: "LIMITED OFFER",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 400,
                yOffsetPx: 0,
            },
            {
                text: "50% OFF",
                fontFamily: "Anton",
                fontSize: 100,
                fontWeight: "400",
                fill: "#ff3b30",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Solo primeras 50 entradas · Reserva ya\nValido hasta el 30 de junio",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "500",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 140,
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
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 400,
                yOffsetPx: 0,
            },
            {
                text: "Sábado 12 Julio",
                fontFamily: "Inter",
                fontSize: 28,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.1,
                yOffsetPx: 30,
            },
            {
                text: "23:00 — 06:00\nSala Razzmatazz · BCN\nC/ Pamplona 88",
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 75,
            },
        ],
    },
];

/**
 * Inserta un preset al canvas Fabric. Cada bloque se añade como IText
 * individual (NO Group) para que el user pueda editar/mover/borrar cada
 * uno por separado igual que cualquier texto creado con "Añadir texto".
 *
 * v3 — alineación izquierda: los presets tipo "card" se anclan al
 * cuadrante superior-izquierdo del canvas (15% margen). El user después
 * los mueve/centra a gusto. Si el preset es center-aligned, se ancla a
 * centro horizontal.
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

    // Detectar si todos los blocks son left → ancla a margen izquierdo;
    // si es mixto o center → centro horizontal (mejor default visual).
    const allLeft = preset.blocks.every(b => b.textAlign === "left");
    const baseY = canvasSize.h * 0.22;
    const baseX = allLeft ? canvasSize.w * 0.10 : canvasSize.w / 2;

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
