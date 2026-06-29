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
    category: "header" | "evento" | "dj" | "promo" | "info" | "invitacion";
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

    // ─── Eventos extras (4) ─────────────────────────────────────────
    {
        id: "evento-opening",
        name: "Grand Opening",
        category: "evento",
        blocks: [
            {
                text: "NEW VENUE · NEW VIBES",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 400,
                yOffsetPx: 0,
            },
            {
                text: "GRAND\nOPENING",
                fontFamily: "Anton",
                fontSize: 96,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 40,
                lineHeight: 0.95,
                yOffsetPx: 30,
            },
            {
                text: "Te esperamos para inaugurar el nuevo espacio.\nDJs, cocktails y mucho más.",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 220,
            },
        ],
    },
    {
        id: "evento-anniversary",
        name: "Aniversario",
        category: "evento",
        blocks: [
            {
                text: "CELEBRATING TOGETHER",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "5 YEARS",
                fontFamily: "Playfair Display",
                fontSize: 100,
                fontWeight: "700",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 30,
            },
            {
                text: "Gracias por estos 5 años increíbles.\nVamos a por muchos más.",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 145,
            },
        ],
    },
    {
        id: "evento-afterhours",
        name: "After Hours",
        category: "evento",
        blocks: [
            {
                text: "UNDERGROUND",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#a855f7",
                textAlign: "left",
                letterSpacing: 600,
                yOffsetPx: 0,
            },
            {
                text: "AFTER\nHOURS",
                fontFamily: "Anton",
                fontSize: 110,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 60,
                lineHeight: 0.95,
                yOffsetPx: 28,
            },
            {
                text: "04:00 — Late · Solo para los más nocturnos\nTechno · House · Minimal",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 240,
            },
        ],
    },
    {
        id: "evento-rooftop",
        name: "Rooftop Sunset",
        category: "evento",
        blocks: [
            {
                text: "SUNSET SESSION",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ff6b35",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "Rooftop",
                fontFamily: "Playfair Display",
                fontSize: 90,
                fontWeight: "700",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 30,
            },
            {
                text: "Vista 360º · Cocktails de autor\n19:00 — 23:00 · Cada viernes",
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

    // ─── DJ/Lineup extras (3) ───────────────────────────────────────
    {
        id: "dj-headliner",
        name: "Headliner",
        category: "dj",
        blocks: [
            {
                text: "MAIN STAGE",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "HEADLINER",
                fontFamily: "Bebas Neue",
                fontSize: 96,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 80,
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "DJ Featured · 02:00 — 04:00\nMain stage · Sala principal",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 130,
            },
        ],
    },
    {
        id: "dj-b2b",
        name: "B2B Session",
        category: "dj",
        blocks: [
            {
                text: "SPECIAL COLLAB",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "DJ ONE\n× DJ TWO",
                fontFamily: "Anton",
                fontSize: 76,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 30,
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Back to back set · 03:00 — 06:00\nNunca antes en la misma cabina",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 200,
            },
        ],
    },
    {
        id: "dj-festival",
        name: "Festival Lineup",
        category: "dj",
        blocks: [
            {
                text: "FESTIVAL LINEUP",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 600,
                yOffsetPx: 0,
            },
            {
                text: "12 ARTISTS\n2 STAGES",
                fontFamily: "Bebas Neue",
                fontSize: 76,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 60,
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Day pass · 35€ · Hasta 12 julio\nGuestlist abierta para Pro members",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 200,
            },
        ],
    },

    // ─── Promos extras (3) ──────────────────────────────────────────
    {
        id: "promo-2x1",
        name: "2x1 Happy Hour",
        category: "promo",
        blocks: [
            {
                text: "HAPPY HOUR",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "2x1",
                fontFamily: "Anton",
                fontSize: 140,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "ALL NIGHT · Cocktails hasta medianoche\nPide en barra o reserva mesa",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "500",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 180,
            },
        ],
    },
    {
        id: "promo-free-entry",
        name: "Free Entry",
        category: "promo",
        blocks: [
            {
                text: "LIMITED OFFER",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#22c55e",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "FREE ENTRY",
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
                text: "Antes de las 23:00 · RSVP en bio\nDespués de las 23:00: 10€",
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
    {
        id: "promo-guestlist",
        name: "Guestlist",
        category: "promo",
        blocks: [
            {
                text: "RESERVA TU SPOT",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "GUESTLIST",
                fontFamily: "Bebas Neue",
                fontSize: 90,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 80,
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Plazas limitadas · Confirma por WhatsApp\nNombre + número de personas",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 130,
            },
        ],
    },

    // ─── Info extras (2) ────────────────────────────────────────────
    {
        id: "info-price-list",
        name: "Lista de Precios",
        category: "info",
        blocks: [
            {
                text: "PRECIOS",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "Entrada general",
                fontFamily: "Inter",
                fontSize: 22,
                fontWeight: "600",
                fill: "#ffffff",
                textAlign: "left",
                yOffsetPx: 36,
            },
            {
                text: "10€  ·  Antes 23:00\n15€  ·  Después 23:00\n50€  ·  Mesa VIP (4 pers.)",
                fontFamily: "Inter",
                fontSize: 18,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.6,
                yOffsetPx: 70,
            },
        ],
    },
    {
        id: "info-contact",
        name: "Contacto · RRSS",
        category: "info",
        blocks: [
            {
                text: "CONTACTO",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "@tuhandle",
                fontFamily: "Inter",
                fontSize: 26,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                yOffsetPx: 36,
            },
            {
                text: "WhatsApp · 600 000 000\nReservas · hola@tudominio.com\nweb.tudominio.com",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.6,
                yOffsetPx: 78,
            },
        ],
    },

    // ─── Invitaciones (3, nueva categoría) ──────────────────────────
    {
        id: "inv-birthday",
        name: "Cumpleaños",
        category: "invitacion",
        blocks: [
            {
                text: "BIRTHDAY PARTY",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ff6b9d",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "Happy\nBirthday",
                fontFamily: "Playfair Display",
                fontSize: 80,
                fontWeight: "700",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 30,
            },
            {
                text: "Celebra con nosotros el cumple de [NOMBRE]\nViernes 12 · 20:00 · [LUGAR]",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 215,
            },
        ],
    },
    {
        id: "inv-save-date",
        name: "Save the Date",
        category: "invitacion",
        blocks: [
            {
                text: "MARK YOUR CALENDAR",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "SAVE\nTHE DATE",
                fontFamily: "Anton",
                fontSize: 80,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 40,
                lineHeight: 0.95,
                yOffsetPx: 28,
            },
            {
                text: "Sábado · 12 de Julio · 2026\nMás detalles muy pronto.",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 180,
            },
        ],
    },
    {
        id: "inv-elegant",
        name: "You're Invited",
        category: "invitacion",
        blocks: [
            {
                text: "WITH PLEASURE",
                fontFamily: "Inter",
                fontSize: 13,
                fontWeight: "400",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 700,
                yOffsetPx: 0,
            },
            {
                text: "You're\nInvited",
                fontFamily: "Playfair Display",
                fontSize: 88,
                fontWeight: "400",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 30,
            },
            {
                text: "A una velada exclusiva con cena de gala,\ncocktails y música en vivo.",
                fontFamily: "Playfair Display",
                fontSize: 18,
                fontWeight: "400",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.6,
                yOffsetPx: 220,
            },
        ],
    },

    // ─── Eventos extras v8 (3) ──────────────────────────────────────
    {
        id: "evento-workshop",
        name: "Workshop · Clases",
        category: "evento",
        blocks: [
            {
                text: "WORKSHOP INTENSIVO",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#22c55e",
                textAlign: "left",
                letterSpacing: 400,
                yOffsetPx: 0,
            },
            {
                text: "Salsa &\nBachata",
                fontFamily: "Playfair Display",
                fontSize: 76,
                fontWeight: "700",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Todos los niveles · Profesores certificados\n4 horas intensivas · Material incluido",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 210,
            },
        ],
    },
    {
        id: "evento-festival-3-days",
        name: "Festival 3 días",
        category: "evento",
        blocks: [
            {
                text: "3 DÍAS · 2 ESCENARIOS",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ff6b35",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "FESTIVAL",
                fontFamily: "Anton",
                fontSize: 110,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 60,
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "12, 13 y 14 de Julio · Madrid\nAbono 3 días · 75€",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "500",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 150,
            },
        ],
    },
    {
        id: "evento-summer-party",
        name: "Summer Pool Party",
        category: "evento",
        blocks: [
            {
                text: "SUMMER VIBES",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#22d3ee",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "Pool\nParty",
                fontFamily: "Anton",
                fontSize: 110,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 40,
                lineHeight: 0.95,
                yOffsetPx: 28,
            },
            {
                text: "All day long · DJ residentes · Cocktails\nDress code: swimwear & sunglasses",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 240,
            },
        ],
    },

    // ─── DJ extras v8 (2) ───────────────────────────────────────────
    {
        id: "dj-set-time",
        name: "DJ Set + Horario",
        category: "dj",
        blocks: [
            {
                text: "TONIGHT'S SET",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "DJ ASESINA",
                fontFamily: "Bebas Neue",
                fontSize: 90,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 80,
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "02:00 — 04:00  ·  Sala principal\nReggaeton · Latin · Urban",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 130,
            },
        ],
    },
    {
        id: "dj-residentes",
        name: "Residentes semanales",
        category: "dj",
        blocks: [
            {
                text: "RESIDENTES",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 600,
                yOffsetPx: 0,
            },
            {
                text: "Tus DJs\ncada semana",
                fontFamily: "Bebas Neue",
                fontSize: 64,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 40,
                lineHeight: 1,
                yOffsetPx: 30,
            },
            {
                text: "Viernes · DJ One · House\nSábados · DJ Two · Reggaeton\nDomingos · DJ Three · Latin",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.6,
                yOffsetPx: 180,
            },
        ],
    },

    // ─── Promos extras v8 (3) ───────────────────────────────────────
    {
        id: "promo-pre-sale",
        name: "Pre-sale 30%",
        category: "promo",
        blocks: [
            {
                text: "SOLO ESTA SEMANA",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "PRE-SALE\n30% OFF",
                fontFamily: "Anton",
                fontSize: 84,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 0.95,
                yOffsetPx: 28,
            },
            {
                text: "Compra hasta el viernes y ahorra\nDespués: precio normal 25€",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "500",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 195,
            },
        ],
    },
    {
        id: "promo-flash-sale",
        name: "Flash Sale 24h",
        category: "promo",
        blocks: [
            {
                text: "SOLO 24 HORAS",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ff3b30",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "FLASH\nSALE",
                fontFamily: "Anton",
                fontSize: 130,
                fontWeight: "400",
                fill: "#ff3b30",
                textAlign: "left",
                letterSpacing: 30,
                lineHeight: 0.95,
                yOffsetPx: 28,
            },
            {
                text: "Aprovecha antes que termine el reloj\nUsa el código: FLASH24",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "600",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 280,
            },
        ],
    },
    {
        id: "promo-bring-friend",
        name: "Trae un amigo · 2x1",
        category: "promo",
        blocks: [
            {
                text: "VEN ACOMPAÑADO",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#a855f7",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "BRING A\nFRIEND",
                fontFamily: "Bebas Neue",
                fontSize: 96,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 50,
                lineHeight: 0.95,
                yOffsetPx: 28,
            },
            {
                text: "2x1 en entradas si vienes con un amigo\nPaga una, entran los dos",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "500",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 220,
            },
        ],
    },

    // ─── Invitaciones extras v8 (4) ─────────────────────────────────
    {
        id: "inv-wedding",
        name: "Boda · Wedding",
        category: "invitacion",
        blocks: [
            {
                text: "WE ARE GETTING MARRIED",
                fontFamily: "Inter",
                fontSize: 13,
                fontWeight: "400",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 600,
                yOffsetPx: 0,
            },
            {
                text: "Sara\n& David",
                fontFamily: "Playfair Display",
                fontSize: 88,
                fontWeight: "400",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Acompáñanos en nuestro gran día\n12 · Julio · 2026  ·  Madrid",
                fontFamily: "Playfair Display",
                fontSize: 19,
                fontWeight: "400",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.6,
                yOffsetPx: 220,
            },
        ],
    },
    {
        id: "inv-babyshower",
        name: "Baby Shower",
        category: "invitacion",
        blocks: [
            {
                text: "WELCOME BABY",
                fontFamily: "Inter",
                fontSize: 13,
                fontWeight: "700",
                fill: "#ff6b9d",
                textAlign: "left",
                letterSpacing: 600,
                yOffsetPx: 0,
            },
            {
                text: "Baby\nShower",
                fontFamily: "Playfair Display",
                fontSize: 84,
                fontWeight: "700",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Celebra con nosotros la llegada de [BEBÉ]\nDomingo 21 · 17:00 · Casa de [NOMBRE]",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 215,
            },
        ],
    },
    {
        id: "inv-baptism",
        name: "Bautizo",
        category: "invitacion",
        blocks: [
            {
                text: "CON GRAN ALEGRÍA",
                fontFamily: "Inter",
                fontSize: 13,
                fontWeight: "400",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 600,
                yOffsetPx: 0,
            },
            {
                text: "El Bautizo\nde Lucas",
                fontFamily: "Playfair Display",
                fontSize: 64,
                fontWeight: "400",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.05,
                yOffsetPx: 28,
            },
            {
                text: "Iglesia de San Pedro · 12:00\nSábado 19 de Julio · Madrid",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 175,
            },
        ],
    },
    {
        id: "inv-quinceanera",
        name: "Mis Quince",
        category: "invitacion",
        blocks: [
            {
                text: "CELEBRANDO MIS",
                fontFamily: "Inter",
                fontSize: 13,
                fontWeight: "700",
                fill: "#ff6b9d",
                textAlign: "left",
                letterSpacing: 600,
                yOffsetPx: 0,
            },
            {
                text: "Quince\nAños",
                fontFamily: "Playfair Display",
                fontSize: 92,
                fontWeight: "700",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1,
                yOffsetPx: 28,
            },
            {
                text: "Acompáñame en mi noche especial\n14 · Septiembre · 19:00 · [LUGAR]",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.5,
                yOffsetPx: 225,
            },
        ],
    },

    // ─── Info extras v8 (3) ─────────────────────────────────────────
    {
        id: "info-menu",
        name: "Menú · 3 platos",
        category: "info",
        blocks: [
            {
                text: "MENÚ DE LA CASA",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffd700",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "3 platos · 25€",
                fontFamily: "Playfair Display",
                fontSize: 30,
                fontWeight: "700",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                yOffsetPx: 38,
            },
            {
                text: "Entrante · Burrata con tomate confitado\nPrincipal · Solomillo con foie\nPostre · Tarta de queso casera",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.6,
                yOffsetPx: 88,
            },
        ],
    },
    {
        id: "info-weekly-schedule",
        name: "Agenda semanal",
        category: "info",
        blocks: [
            {
                text: "AGENDA DE LA SEMANA",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "Jueves",
                fontFamily: "Inter",
                fontSize: 22,
                fontWeight: "700",
                fill: "#ffffff",
                textAlign: "left",
                yOffsetPx: 36,
            },
            {
                text: "JUE  ·  Latin Night  ·  DJ Asesina\nVIE  ·  House Session  ·  DJ Vintage\nSAB  ·  Reggaeton  ·  DJ Tonight\nDOM  ·  Brunch + Música chill",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.7,
                yOffsetPx: 70,
            },
        ],
    },
    {
        id: "info-rules",
        name: "Normas de la casa",
        category: "info",
        blocks: [
            {
                text: "NORMAS DE LA CASA",
                fontFamily: "Inter",
                fontSize: 14,
                fontWeight: "700",
                fill: "#ff3b30",
                textAlign: "left",
                letterSpacing: 500,
                yOffsetPx: 0,
            },
            {
                text: "Por favor",
                fontFamily: "Playfair Display",
                fontSize: 28,
                fontWeight: "700",
                fontStyle: "italic",
                fill: "#ffffff",
                textAlign: "left",
                yOffsetPx: 36,
            },
            {
                text: "01  ·  Reserva imprescindible\n02  ·  +18 con DNI obligatorio\n03  ·  Dress code: smart casual\n04  ·  Prohibido grabar en cabina",
                fontFamily: "Inter",
                fontSize: 17,
                fontWeight: "400",
                fill: "#ffffff",
                textAlign: "left",
                lineHeight: 1.7,
                yOffsetPx: 80,
            },
        ],
    },
];

/**
 * Detecta si un color hex es perceptualmente oscuro (luminance < 0.5).
 * Usa la fórmula clásica de Rec. 601 (ojo humano más sensible al verde).
 */
function isHexDark(hex: string): boolean {
    const c = hex.replace("#", "");
    if (c.length !== 6) return false;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
}

/**
 * Renderiza el canvas Fabric a un PNG temporal (multiplier bajo para
 * velocidad), samplea pixels en el área especificada y devuelve la
 * luminance promedio.
 *
 * Esto SUPERA todas las heurísticas anteriores porque analiza EL FONDO
 * REAL que el ojo verá detrás del texto: funciona con imágenes, gradients,
 * shapes complejas, fondos con varias zonas, etc.
 *
 * Devuelve null si algo falla (img no carga, ctx 2D no disponible) —
 * el caller hace fallback a la heurística clásica.
 */
async function sampleAreaLuminance(
    canvas: FabricCanvas,
    area: { x: number; y: number; w: number; h: number },
): Promise<number | null> {
    try {
        const MULT = 0.3; // 30% del tamaño real — suficiente para promedio fiable
        const dataUrl = canvas.toDataURL({ format: "png", multiplier: MULT, quality: 0.8 });

        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error("img load failed"));
            i.src = dataUrl;
        });

        const tmp = document.createElement("canvas");
        tmp.width = img.width;
        tmp.height = img.height;
        const ctx = tmp.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(img, 0, 0);

        // Clamp el área al tamaño real de la imagen (multiplier 0.3)
        const sx = Math.max(0, Math.floor(area.x * MULT));
        const sy = Math.max(0, Math.floor(area.y * MULT));
        const sw = Math.min(img.width - sx, Math.max(1, Math.floor(area.w * MULT)));
        const sh = Math.min(img.height - sy, Math.max(1, Math.floor(area.h * MULT)));
        if (sw < 2 || sh < 2) return null;

        const imgData = ctx.getImageData(sx, sy, sw, sh);
        const data = imgData.data;

        // Sample 1 de cada 4 pixels (paso de 16 bytes) — velocidad sin
        // perder precisión para áreas grandes.
        let totalLum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 16) {
            const a = data[i + 3];
            if (a < 128) continue; // skip transparente
            const r = data[i], g = data[i + 1], b = data[i + 2];
            totalLum += (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            count++;
        }
        return count > 0 ? totalLum / count : null;
    } catch {
        return null;
    }
}

/**
 * Fallback heurístico (v5) cuando el sampling falla. Mantiene compatibilidad:
 *  1. canvas.backgroundColor hex → usar luminance
 *  2. backgroundImage existente → asumir oscuro (foto típica)
 *  3. Rect grande (>800×800) → usar su fill
 *  4. Fallback: asumir light bg
 */
function isCanvasBackgroundDark(canvas: FabricCanvas): boolean {
    const bg = canvas.backgroundColor as unknown;
    if (typeof bg === "string" && bg.startsWith("#")) {
        return isHexDark(bg);
    }
    if (canvas.backgroundImage) return true;
    const objects = canvas.getObjects();
    for (const obj of objects) {
        const w = (obj.width ?? 0) * (obj.scaleX ?? 1);
        const h = (obj.height ?? 0) * (obj.scaleY ?? 1);
        if (w > 800 && h > 800) {
            const fill = (obj as { fill?: unknown }).fill;
            if (typeof fill === "string" && fill.startsWith("#")) {
                return isHexDark(fill);
            }
        }
    }
    return false;
}

/**
 * Adapta el color de un bloque al fondo del canvas:
 *  - Si fill = blanco puro y fondo CLARO → cambia a negro (legible)
 *  - Si fill = negro y fondo OSCURO → cambia a blanco (legible)
 *  - Cualquier otro color (dorado, rojo, etc.) se mantiene intacto
 *    porque es decisión intencional del preset
 */
function adaptColorToBackground(originalFill: string, isDarkBg: boolean): string {
    const f = originalFill.toLowerCase();
    const isWhite = f === "#ffffff" || f === "#fff";
    const isBlack = f === "#000000" || f === "#000" || f === "#0e0e14";
    if (isWhite && !isDarkBg) return "#0e0e14";
    if (isBlack && isDarkBg) return "#ffffff";
    return originalFill;
}

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
    /** Callback opcional que se aplica a CADA IText recién creado ANTES
     *  del setActiveObject(ActiveSelection). Úsalo para customId (desktop)
     *  o decorateNewObject (mobile) sin romper la selección agrupada. */
    onEachCreated?: (it: IText, index: number) => void,
): Promise<IText[]> {
    const fabric = await import("fabric");
    const created: IText[] = [];

    // Detectar si todos los blocks son left → ancla a margen izquierdo;
    // si es mixto o center → centro horizontal (mejor default visual).
    const allLeft = preset.blocks.every(b => b.textAlign === "left");
    const baseY = canvasSize.h * 0.22;
    const baseX = allLeft ? canvasSize.w * 0.10 : canvasSize.w / 2;

    // Detectar fondo UNA SOLA VEZ — todos los bloques del preset usan
    // la misma adaptación (evita inconsistencia visual entre bloques).
    //
    // v7: pixel sampling REAL del área donde irá el preset (no heurística
    // ciega). Calculamos el bbox aproximado del preset y muestreamos esa
    // zona específica del canvas renderizado — funciona con imagen,
    // gradient, shapes y cualquier combinación visual.
    const lastBlock = preset.blocks[preset.blocks.length - 1];
    const presetHeight = lastBlock.yOffsetPx + lastBlock.fontSize * (lastBlock.lineHeight ?? 1.2) * 2;
    const sampleArea = {
        x: allLeft ? baseX : baseX - canvasSize.w * 0.4,
        y: baseY,
        w: allLeft ? canvasSize.w * 0.8 : canvasSize.w * 0.8,
        h: Math.min(presetHeight, canvasSize.h - baseY),
    };
    const sampledLum = await sampleAreaLuminance(canvas, sampleArea);
    const isDarkBg = sampledLum !== null
        ? sampledLum < 0.5
        : isCanvasBackgroundDark(canvas); // fallback si sampling falla

    for (const block of preset.blocks) {
        const adaptedFill = adaptColorToBackground(block.fill, isDarkBg);
        const it = new fabric.IText(block.text, {
            left: baseX,
            top: baseY + block.yOffsetPx,
            fontFamily: block.fontFamily,
            fontSize: block.fontSize,
            fontWeight: block.fontWeight,
            fontStyle: block.fontStyle ?? "normal",
            fill: adaptedFill,
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

    // Decoración por-objeto (customId, cornerColor, etc.) ANTES del
    // setActiveObject — si se aplicara después, decorate llama .set()
    // que en algunos casos invalida la ActiveSelection visualmente.
    if (onEachCreated) {
        created.forEach((it, i) => onEachCreated(it, i));
    }

    // Si el preset tiene 1 bloque → seleccionar ese. Si tiene varios →
    // crear ActiveSelection que los agrupe TODOS (feedback v4: "una vez
    // se implemente en el lienzo debe quedar todo seleccionado por
    // defecto"). El user puede mover el grupo entero como una unidad,
    // y al hacer click en un IText específico Fabric entra al modo
    // individual automáticamente.
    if (created.length === 1) {
        canvas.setActiveObject(created[0] as unknown as FabricObject);
    } else if (created.length > 1) {
        // discardActiveObject ANTES de crear ActiveSelection — evita que
        // Fabric retenga la selección previa (causa "ghost selection" en
        // algunos casos cuando el user ya tenía algo seleccionado).
        canvas.discardActiveObject();
        const sel = new fabric.ActiveSelection(
            created as unknown as FabricObject[],
            { canvas },
        );
        canvas.setActiveObject(sel as unknown as FabricObject);
    }
    canvas.requestRenderAll();
    return created;
}
