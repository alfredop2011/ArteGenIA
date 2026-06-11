// ════════════════════════════════════════════════════════════════════════════
//  TEMPLATE EDITABLE BLOCKS
//
//  Schema que define que campos del flyer son editables por el usuario
//  desde el bottom sheet del editor mobile (Tab Contenido).
//
//  Por que separado de templates.ts:
//   - No queremos modificar las 47 plantillas existentes
//   - Permite agregar bloques editables de forma incremental
//   - Mapea cada bloque a uno o varios layer IDs del template Fabric
//
//  Como funciona:
//   - El editor mobile lee getBlocksForTemplate(templateId)
//   - Renderiza un accordion con esos bloques
//   - Al editar un bloque, busca los layer IDs en el canvas Fabric y
//     actualiza su .text
//
//  Si una plantilla no tiene bloques definidos aqui, el editor cae al
//  modo legacy (todo el flyer como un solo bloque "Texto").
// ════════════════════════════════════════════════════════════════════════════

export type BlockKind =
  | "artist"       // Artista o título principal
  | "title"        // Título del evento (nombre clase, nombre fiesta, etc.)
  | "subtitle"     // Subtítulo / kicker
  | "date"         // Fecha del evento
  | "time"         // Hora
  | "datetime"     // Fecha + Hora juntos
  | "doors"        // Apertura de puertas
  | "price"        // Precio (anticipada, puerta, etc.)
  | "venue"        // Local / sitio
  | "location"     // Ciudad / dirección
  | "teacher"      // Profesor
  | "dj"           // DJ
  | "lineup"       // Lista de artistas
  | "schedule"     // Horario (días)
  | "ageRestriction" // +18, +21, etc.
  | "dressCode"    // Black tie, casual, etc.
  | "rsvp"         // Confirmación / contacto
  | "company"      // Empresa
  | "web"          // URL
  | "social"       // @handle
  | "footer";      // Pie del flyer (texto suelto)

/** Iconos emoji para cada kind. Mas tarde podemos pasar a lucide. */
export const BLOCK_ICONS: Record<BlockKind, string> = {
  artist: "🎤",
  title: "✨",
  subtitle: "📝",
  date: "📅",
  time: "🕐",
  datetime: "📅",
  doors: "🚪",
  price: "🎫",
  venue: "📍",
  location: "🗺",
  teacher: "👤",
  dj: "🎧",
  lineup: "🎤",
  schedule: "📅",
  ageRestriction: "🔞",
  dressCode: "👔",
  rsvp: "✉",
  company: "🏢",
  web: "🌐",
  social: "📱",
  footer: "ℹ",
};

/** Color de tinte para el icono del bloque (rgba sin alpha). */
export const BLOCK_TINTS: Record<BlockKind, string> = {
  artist: "168,85,247",       // purple
  title: "236,72,153",        // pink
  subtitle: "100,116,139",    // slate
  date: "34,211,238",         // cyan
  time: "250,204,21",         // yellow
  datetime: "34,211,238",
  doors: "250,204,21",
  price: "16,185,129",        // green
  venue: "236,72,153",
  location: "236,72,153",
  teacher: "168,85,247",
  dj: "168,85,247",
  lineup: "168,85,247",
  schedule: "34,211,238",
  ageRestriction: "239,68,68",// red
  dressCode: "168,85,247",
  rsvp: "16,185,129",
  company: "168,85,247",
  web: "100,116,139",
  social: "236,72,153",
  footer: "100,116,139",
};

export type EditableBlock = {
  /** Identificador unico del bloque dentro del template. */
  id: string;
  /** Tipo semantico — define icono, color, validacion. */
  kind: BlockKind;
  /** Label visible al usuario (ej. "Artista principal"). */
  label: string;
  /** Layer IDs del template Fabric que recibe el contenido de este bloque.
   *  Si hay multiples, el primero es el "principal" (se sincroniza con la
   *  seleccion canvas → form), y los demas se actualizan en paralelo. */
  layerIds: string[];
  /** Tipo de input UI: text simple, textarea multiline, o time picker. */
  inputType?: "text" | "textarea" | "time" | "date";
  /** Placeholder mostrado en el input. */
  placeholder?: string;
  /** Limite de caracteres (para titulos cortos, etc.). */
  maxLength?: number;
};

/** Mapa template ID → lista de bloques editables. Incremental: añadir
 *  plantillas cuando esten validadas. Para no-listadas, el editor cae al
 *  modo legacy (un solo bloque generico). */
export const TEMPLATE_BLOCKS: Record<number, EditableBlock[]> = {
  // ─── Template 1: Don Filosofín Live (Concierto) ────────────────────────
  1: [
    { id: "artist", kind: "artist", label: "Artista", layerIds: ["title-main"], placeholder: "Nombre del artista" },
    { id: "subtitle", kind: "subtitle", label: "Tagline", layerIds: ["subtitle"], placeholder: "Subtítulo del evento" },
    { id: "datetime", kind: "datetime", label: "Fecha · Hora", layerIds: ["datetime"], placeholder: "VIERNES 20 JUNIO · 21:00 HRS" },
    { id: "venue", kind: "venue", label: "Venue", layerIds: ["venue"], placeholder: "Sala Apolo · Barcelona" },
    { id: "footer", kind: "footer", label: "Pie del flyer", layerIds: ["footer"], placeholder: "Entrada libre · Aforo limitado" },
  ],

  // ─── Template 44: Kizomba Workshop (Clases) ────────────────────────────
  44: [
    { id: "title", kind: "title", label: "Título", layerIds: ["title-main", "title-script"], placeholder: "Kizomba & Tarraxinha" },
    { id: "teachers", kind: "teacher", label: "Profesores", layerIds: ["teachers"], placeholder: "João & Catarina" },
    { id: "date", kind: "date", label: "Fecha", layerIds: ["date-value"], placeholder: "22 NOV · SÁBADO" },
    { id: "time", kind: "time", label: "Horario", layerIds: ["time-value"], inputType: "text", placeholder: "16 — 20H" },
    { id: "price", kind: "price", label: "Inversión", layerIds: ["price-value"], placeholder: "70€" },
    { id: "venue", kind: "venue", label: "Studio", layerIds: ["studio"], placeholder: "Studio 12 · Madrid" },
  ],

  // ─── Template 46: Marco Silva Urban Latin (Clases) ─────────────────────
  46: [
    { id: "teacher", kind: "teacher", label: "Profesor", layerIds: ["teacher-name"], placeholder: "Marco Silva" },
    { id: "title", kind: "title", label: "Título", layerIds: ["title-main"], placeholder: "URBAN LATIN" },
    { id: "schedule", kind: "schedule", label: "Días", layerIds: ["schedule-days"], placeholder: "MAR · VIE" },
    { id: "time", kind: "time", label: "Hora", layerIds: ["schedule-time"], placeholder: "20:00 — 21:30" },
    { id: "price", kind: "price", label: "Bono mensual", layerIds: ["price"], placeholder: "60€" },
    { id: "venue", kind: "venue", label: "Estudio", layerIds: ["studio"], placeholder: "Academia del Ritmo" },
  ],
};

/** Helper: devuelve los bloques editables para una plantilla. Si no hay
 *  schema definido, devuelve [] (el editor cae al modo legacy). */
export function getBlocksForTemplate(templateId: number): EditableBlock[] {
  return TEMPLATE_BLOCKS[templateId] ?? [];
}

/** Helper: tiene esta plantilla un schema definido? */
export function hasBlocksSchema(templateId: number): boolean {
  return templateId in TEMPLATE_BLOCKS;
}
