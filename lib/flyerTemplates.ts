/**
 * Layouts pre-diseñados por tipo de evento para el Generador IA editable.
 *
 * Cada template define DÓNDE van los textos sobre el fondo generado.
 * Coordenadas en píxeles de un canvas 1080×1350 (portrait estándar).
 * Cada slot tiene un `key` semántico que matchea con el form de input
 * (ej. slot key=title corresponde al campo "title" del form).
 *
 * Filosofía: el layout es FIJO por tipo de evento (templates probados que
 * funcionan visualmente). El estilo visual viene del fondo IA + colores
 * + fuentes del FlyerStyle. Así garantizamos resultados consistentes
 * sin depender de IA para layout (que falla mucho).
 */

export type EventType =
  | "concert"
  | "salsa"
  | "festival"
  | "party"
  | "conference"
  | "class";

/** Tamaño relativo del texto. Se mapea a píxeles según el canvas. */
export type SlotSize = "huge" | "large" | "medium" | "small" | "tiny";

export type FlyerSlot = {
  /** Identificador semántico — debe matchear keys del form de input */
  key: "title" | "subtitle" | "date" | "venue" | "artists" | "price" | "url" | "tagline" | "speakers";
  /** Etiqueta visible al user en el form */
  label: string;
  /** Si el slot es obligatorio para generar el flyer */
  required: boolean;
  /** Posición y tamaño (px en canvas 1080×1350) */
  x: number;
  y: number;
  w: number;
  size: SlotSize;
  align: "left" | "center" | "right";
  /** Rol tipográfico para elegir la fuente del estilo */
  role: "title" | "subtitle" | "info";
  /** Si es bold (sobreescribe el default del estilo) */
  bold?: boolean;
  /** Placeholder del input en el form */
  placeholder?: string;
  /** Máximo de caracteres recomendado */
  maxLength?: number;
};

export type FlyerTemplate = {
  type: EventType;
  name: string;
  icon: string;
  description: string;
  slots: FlyerSlot[];
};

/** Mapeo SlotSize → fontSize en píxeles para canvas 1080×1350 */
export const SIZE_PX: Record<SlotSize, number> = {
  huge: 180,
  large: 96,
  medium: 56,
  small: 32,
  tiny: 20,
};

export const FLYER_TEMPLATES: FlyerTemplate[] = [
  // ─── CONCIERTO ─────────────────────────────────────────────────────────
  {
    type: "concert",
    name: "Concierto",
    icon: "🎤",
    description: "Concierto en vivo con artista principal",
    slots: [
      { key: "subtitle", label: "Etiqueta superior", required: false, x: 540, y: 60, w: 900, size: "small", align: "center", role: "subtitle", placeholder: "PRESENTA", maxLength: 30 },
      { key: "title", label: "Nombre del artista", required: true, x: 540, y: 130, w: 1000, size: "huge", align: "center", role: "title", bold: true, placeholder: "ALAIN PÉREZ", maxLength: 30 },
      { key: "tagline", label: "Tagline / álbum", required: false, x: 540, y: 340, w: 900, size: "medium", align: "center", role: "subtitle", placeholder: "& SU ORQUESTA EN VIVO", maxLength: 60 },
      { key: "date", label: "Fecha y hora", required: true, x: 540, y: 1070, w: 900, size: "medium", align: "center", role: "info", bold: true, placeholder: "VIERNES 15 MAYO · 21:00", maxLength: 50 },
      { key: "venue", label: "Lugar", required: true, x: 540, y: 1150, w: 900, size: "small", align: "center", role: "info", placeholder: "Sala Apolo · Barcelona", maxLength: 60 },
      { key: "price", label: "Precio", required: false, x: 540, y: 1220, w: 600, size: "small", align: "center", role: "info", placeholder: "Entradas desde 25€", maxLength: 40 },
      { key: "url", label: "Web / RRSS", required: false, x: 540, y: 1290, w: 800, size: "tiny", align: "center", role: "info", placeholder: "www.evento.com", maxLength: 50 },
    ],
  },
  // ─── SALSA / LATINO ────────────────────────────────────────────────────
  {
    type: "salsa",
    name: "Fiesta Salsa",
    icon: "💃",
    description: "Noche de salsa, bachata, latino",
    slots: [
      { key: "subtitle", label: "Etiqueta superior", required: false, x: 540, y: 80, w: 900, size: "small", align: "center", role: "subtitle", placeholder: "NOCHE LATINA", maxLength: 30 },
      { key: "title", label: "Título del evento", required: true, x: 540, y: 150, w: 1000, size: "huge", align: "center", role: "title", bold: true, placeholder: "SALSA NIGHT", maxLength: 25 },
      { key: "tagline", label: "Sub-tagline", required: false, x: 540, y: 360, w: 900, size: "medium", align: "center", role: "subtitle", placeholder: "BACHATA · KIZOMBA · REGGAETÓN", maxLength: 60 },
      { key: "artists", label: "DJs / artistas", required: false, x: 540, y: 900, w: 1000, size: "medium", align: "center", role: "subtitle", bold: true, placeholder: "DJ PEDRO · DJ CARMEN", maxLength: 80 },
      { key: "date", label: "Fecha", required: true, x: 540, y: 1050, w: 900, size: "medium", align: "center", role: "info", bold: true, placeholder: "SÁBADO 20 JUNIO", maxLength: 40 },
      { key: "venue", label: "Lugar", required: true, x: 540, y: 1140, w: 900, size: "small", align: "center", role: "info", placeholder: "Latin Palace · Madrid · 23:00", maxLength: 70 },
      { key: "price", label: "Entrada", required: false, x: 540, y: 1220, w: 600, size: "small", align: "center", role: "info", placeholder: "10€ con consumición", maxLength: 40 },
      { key: "url", label: "Reservas", required: false, x: 540, y: 1290, w: 800, size: "tiny", align: "center", role: "info", placeholder: "@latinpalace", maxLength: 50 },
    ],
  },
  // ─── FESTIVAL ──────────────────────────────────────────────────────────
  {
    type: "festival",
    name: "Festival",
    icon: "🎪",
    description: "Festival multi-día con lineup",
    slots: [
      { key: "date", label: "Fechas", required: true, x: 540, y: 90, w: 900, size: "medium", align: "center", role: "info", bold: true, placeholder: "15-19 MAY 2025", maxLength: 30 },
      { key: "title", label: "Nombre del festival", required: true, x: 540, y: 180, w: 1000, size: "huge", align: "center", role: "title", bold: true, placeholder: "GUAGUANCÓ FEST", maxLength: 30 },
      { key: "subtitle", label: "Edición / etiqueta", required: false, x: 540, y: 390, w: 900, size: "medium", align: "center", role: "subtitle", placeholder: "GOLD EDITION", maxLength: 30 },
      { key: "venue", label: "Ciudad / país", required: true, x: 540, y: 470, w: 900, size: "medium", align: "center", role: "info", placeholder: "LLORET DE MAR · SPAIN", maxLength: 50 },
      { key: "artists", label: "Lineup", required: true, x: 540, y: 1000, w: 1000, size: "medium", align: "center", role: "subtitle", bold: true, placeholder: "ALAIN PÉREZ · CHARANGA HABANERA", maxLength: 120 },
      { key: "tagline", label: "Tagline", required: false, x: 540, y: 1170, w: 900, size: "small", align: "center", role: "info", placeholder: "WORKSHOPS · 5 COMPETITIONS · LIVE MUSIC", maxLength: 80 },
      { key: "url", label: "Web", required: false, x: 540, y: 1290, w: 800, size: "tiny", align: "center", role: "info", placeholder: "www.festival.com", maxLength: 50 },
    ],
  },
  // ─── FIESTA GENERAL ────────────────────────────────────────────────────
  {
    type: "party",
    name: "Fiesta",
    icon: "🎉",
    description: "Fiesta universitaria, cumpleaños, opening",
    slots: [
      { key: "subtitle", label: "Etiqueta", required: false, x: 540, y: 100, w: 900, size: "small", align: "center", role: "subtitle", placeholder: "THE BIGGEST PARTY", maxLength: 30 },
      { key: "title", label: "Nombre de la fiesta", required: true, x: 540, y: 200, w: 1000, size: "huge", align: "center", role: "title", bold: true, placeholder: "SUMMER OPENING", maxLength: 25 },
      { key: "tagline", label: "Sub-título", required: false, x: 540, y: 420, w: 900, size: "medium", align: "center", role: "subtitle", placeholder: "El comienzo del verano", maxLength: 60 },
      { key: "artists", label: "DJs", required: false, x: 540, y: 920, w: 1000, size: "medium", align: "center", role: "subtitle", bold: true, placeholder: "DJ MARCOS · DJ LUNA", maxLength: 80 },
      { key: "date", label: "Fecha", required: true, x: 540, y: 1070, w: 900, size: "medium", align: "center", role: "info", bold: true, placeholder: "VIERNES 14 JUNIO · 22:00", maxLength: 50 },
      { key: "venue", label: "Lugar", required: true, x: 540, y: 1160, w: 900, size: "small", align: "center", role: "info", placeholder: "Club Vela · Barcelona", maxLength: 60 },
      { key: "url", label: "RRSS", required: false, x: 540, y: 1280, w: 800, size: "tiny", align: "center", role: "info", placeholder: "@clubvela", maxLength: 50 },
    ],
  },
  // ─── CONFERENCIA ───────────────────────────────────────────────────────
  {
    type: "conference",
    name: "Conferencia",
    icon: "🎙",
    description: "Charla, workshop, formación, ponencia",
    slots: [
      { key: "subtitle", label: "Organiza", required: false, x: 540, y: 80, w: 900, size: "small", align: "center", role: "info", placeholder: "Tech Hub Madrid presenta", maxLength: 50 },
      { key: "title", label: "Título de la charla", required: true, x: 540, y: 160, w: 1000, size: "large", align: "center", role: "title", bold: true, placeholder: "IA Generativa en 2026", maxLength: 60 },
      { key: "tagline", label: "Subtítulo / hook", required: false, x: 540, y: 350, w: 900, size: "medium", align: "center", role: "subtitle", placeholder: "Lo que viene en los próximos 12 meses", maxLength: 80 },
      { key: "speakers", label: "Ponentes", required: true, x: 540, y: 950, w: 1000, size: "medium", align: "center", role: "subtitle", bold: true, placeholder: "María García · Jordi López", maxLength: 100 },
      { key: "date", label: "Fecha y hora", required: true, x: 540, y: 1080, w: 900, size: "medium", align: "center", role: "info", bold: true, placeholder: "JUEVES 12 JUNIO · 19:00", maxLength: 50 },
      { key: "venue", label: "Lugar", required: true, x: 540, y: 1170, w: 900, size: "small", align: "center", role: "info", placeholder: "Sala Conference · Calle Mayor 5", maxLength: 70 },
      { key: "price", label: "Entrada", required: false, x: 540, y: 1240, w: 600, size: "small", align: "center", role: "info", placeholder: "Acceso gratuito · Inscripción", maxLength: 50 },
      { key: "url", label: "Inscripción", required: false, x: 540, y: 1300, w: 800, size: "tiny", align: "center", role: "info", placeholder: "techhub.es/eventos", maxLength: 50 },
    ],
  },
  // ─── CLASE / WORKSHOP ──────────────────────────────────────────────────
  {
    type: "class",
    name: "Clase / Taller",
    icon: "📚",
    description: "Clases regulares, workshops, formación",
    slots: [
      { key: "subtitle", label: "Etiqueta", required: false, x: 540, y: 90, w: 900, size: "small", align: "center", role: "subtitle", placeholder: "NUEVA TEMPORADA", maxLength: 30 },
      { key: "title", label: "Nombre de la clase", required: true, x: 540, y: 170, w: 1000, size: "huge", align: "center", role: "title", bold: true, placeholder: "YOGA FLOW", maxLength: 30 },
      { key: "tagline", label: "Sub-tagline", required: false, x: 540, y: 390, w: 900, size: "medium", align: "center", role: "subtitle", placeholder: "Reconecta con tu cuerpo", maxLength: 60 },
      { key: "artists", label: "Profesor/a", required: true, x: 540, y: 920, w: 1000, size: "medium", align: "center", role: "subtitle", bold: true, placeholder: "Con Laura Méndez", maxLength: 60 },
      { key: "date", label: "Horario", required: true, x: 540, y: 1050, w: 900, size: "medium", align: "center", role: "info", bold: true, placeholder: "LUN · MIÉ · VIE · 19:30", maxLength: 50 },
      { key: "venue", label: "Lugar", required: true, x: 540, y: 1140, w: 900, size: "small", align: "center", role: "info", placeholder: "Estudio Calma · Madrid", maxLength: 60 },
      { key: "price", label: "Precio", required: false, x: 540, y: 1220, w: 600, size: "small", align: "center", role: "info", placeholder: "60€/mes · Prueba gratis", maxLength: 50 },
      { key: "url", label: "Reservas", required: false, x: 540, y: 1290, w: 800, size: "tiny", align: "center", role: "info", placeholder: "estudiocalma.com", maxLength: 50 },
    ],
  },
];

export function getTemplate(type: string): FlyerTemplate | null {
  return FLYER_TEMPLATES.find((t) => t.type === type) ?? null;
}
