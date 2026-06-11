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
 *  modo legacy (un solo bloque generico).
 *
 *  IMPORTANTE: los layerIds tienen que coincidir EXACTO con los `id` de
 *  los layers tipo text en data/templates.ts. Verificado con script de
 *  extraccion el 2026-06-11. */
export const TEMPLATE_BLOCKS: Record<number, EditableBlock[]> = {
  // ─── Template 1: Don Filosofín Live (Concierto) ────────────────────────
  // Layers reales: bg, title-1 "DON", title-2 "FILOSOFÍN", subtitle, date, venue, price
  1: [
    { id: "title", kind: "title", label: "Título principal", layerIds: ["title-1", "title-2"], placeholder: "DON FILOSOFÍN" },
    { id: "subtitle", kind: "subtitle", label: "Tagline", layerIds: ["subtitle"], placeholder: "Una noche de conversación y música" },
    { id: "date", kind: "datetime", label: "Fecha · Hora", layerIds: ["date"], placeholder: "VIERNES 20 JUNIO · 21:00 HRS" },
    { id: "venue", kind: "venue", label: "Venue", layerIds: ["venue"], placeholder: "SALA APOLO · BARCELONA" },
    { id: "price", kind: "price", label: "Entrada", layerIds: ["price"], placeholder: "ENTRADA LIBRE · AFORO LIMITADO" },
  ],

  // ─── Template 44: Kizomba Workshop (Clases) ────────────────────────────
  // Layers reales: title-1 "Kizomba", title-2 "& Tarraxinha", plate-names,
  // b1-day "22", b1-month "NOV · SÁBADO", b2-day "16 — 20H", b2-month "4 HORAS...",
  // b3-day "70€", b3-month "EARLY BIRD 60€", footer-where
  44: [
    { id: "title", kind: "title", label: "Título", layerIds: ["title-1", "title-2"], placeholder: "Kizomba & Tarraxinha" },
    { id: "teachers", kind: "teacher", label: "Profesores", layerIds: ["plate-names"], placeholder: "João & Catarina" },
    { id: "date_day", kind: "date", label: "Fecha (día)", layerIds: ["b1-day"], placeholder: "22" },
    { id: "date_month", kind: "date", label: "Fecha (mes y día semana)", layerIds: ["b1-month"], placeholder: "NOV · SÁBADO" },
    { id: "time", kind: "time", label: "Horario", layerIds: ["b2-day"], placeholder: "16 — 20H" },
    { id: "time_detail", kind: "subtitle", label: "Horario (detalle)", layerIds: ["b2-month"], placeholder: "4 HORAS · 2 BLOQUES" },
    { id: "price", kind: "price", label: "Precio", layerIds: ["b3-day"], placeholder: "70€" },
    { id: "price_promo", kind: "subtitle", label: "Promoción precio", layerIds: ["b3-month"], placeholder: "EARLY BIRD 60€" },
    { id: "venue", kind: "venue", label: "Studio", layerIds: ["footer-where"], placeholder: "STUDIO KIZ · C/ MIRA EL RÍO ALTA 17 · MADRID" },
  ],

  // ─── Template 46: Marco Silva Urban Latin (Clases) ─────────────────────
  // Layers reales: title-2 "URBAN LATIN", profe-name "MARCO SILVA",
  // i-1-v "MAR · VIE", i-1-x "19:00 — 20:30", i-2-v "60€", i-2-x "BONO MENSUAL",
  // i-3-v "Academia del Ritmo", i-3-x "Gran Vía 12 · Madrid"
  46: [
    { id: "title", kind: "title", label: "Título", layerIds: ["title-2"], placeholder: "URBAN LATIN" },
    { id: "teacher", kind: "teacher", label: "Profesor", layerIds: ["profe-name"], placeholder: "MARCO SILVA" },
    { id: "days", kind: "schedule", label: "Días", layerIds: ["i-1-v"], placeholder: "MAR · VIE" },
    { id: "time", kind: "time", label: "Hora", layerIds: ["i-1-x"], placeholder: "19:00 — 20:30" },
    { id: "price", kind: "price", label: "Precio", layerIds: ["i-2-v"], placeholder: "60€" },
    { id: "price_label", kind: "subtitle", label: "Tipo de precio", layerIds: ["i-2-x"], placeholder: "BONO MENSUAL" },
    { id: "venue", kind: "venue", label: "Academia", layerIds: ["i-3-v"], placeholder: "Academia del Ritmo" },
    { id: "venue_addr", kind: "location", label: "Dirección", layerIds: ["i-3-x"], placeholder: "Gran Vía 12 · Madrid" },
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
