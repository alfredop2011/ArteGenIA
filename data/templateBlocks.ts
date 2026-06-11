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

/** Helper: devuelve los bloques editables para una plantilla. Si hay
 *  schema definido manualmente, lo usa. Sino, auto-genera bloques desde
 *  los layer IDs de la primera variante (heuristicas semanticas). */
export function getBlocksForTemplate(templateId: number): EditableBlock[] {
  const manual = TEMPLATE_BLOCKS[templateId];
  if (manual) return manual;
  // Auto-generate desde la plantilla
  return autoGenerateBlocks(templateId);
}

/** Helper: tiene esta plantilla un schema definido manualmente? */
export function hasBlocksSchema(templateId: number): boolean {
  return templateId in TEMPLATE_BLOCKS;
}

// ─── AUTO-GENERATE BLOCKS ────────────────────────────────────────────────
// Inferir EditableBlocks desde los layers de la plantilla cuando no hay
// schema manual. Reglas semanticas basadas en el id del layer.
//
// Esto desbloquea las 47 plantillas del catalogo sin tener que escribir
// schemas a mano. Las 3 plantillas con schema manual quedan con UX premium
// (placeholders correctos, agrupacion de layers). El resto recibe un schema
// "best effort" basado en heuristicas — lo suficientemente bueno para el
// 90% de los casos.

/** Mapa palabra-clave → BlockKind. La primera coincidencia gana. */
const KIND_HEURISTICS: Array<[RegExp, BlockKind]> = [
  // Profesores / artistas / DJs
  [/profe-name|professor|teacher|profe$|^profe-/i, "teacher"],
  [/\bdj\b|dj-name|^dj-/i, "dj"],
  [/artist|lineup|cartel|band-name/i, "artist"],
  // Titulos
  [/title-1$|title-main|^title$|^main-title/i, "title"],
  [/title-2|title-script|title-sub/i, "title"],
  [/supra|kicker|tagline|claim|epigraph/i, "subtitle"],
  [/subtitle|sub-title|desc|description/i, "subtitle"],
  // Fechas / horas
  [/datetime|date-time/i, "datetime"],
  [/^date$|fecha|day$|month/i, "date"],
  [/time$|hour|horario|schedule-time/i, "time"],
  [/doors|apertura/i, "doors"],
  [/schedule|days|dias/i, "schedule"],
  // Precio
  [/price|precio|cost|ticket|inversion|bono/i, "price"],
  // Lugar
  [/venue|local|sala|club|studio|recinto/i, "venue"],
  [/footer-where|footer$|address|direccion|location|ciudad/i, "location"],
  // Otros
  [/age|edad|restriction/i, "ageRestriction"],
  [/dress-code|dresscode|attire/i, "dressCode"],
  [/rsvp|confirm|contact|email/i, "rsvp"],
  [/company|empresa/i, "company"],
  [/web|url|website/i, "web"],
  [/social|instagram|@/i, "social"],
];

/** Labels human-readable por kind (auto-gen). */
const KIND_LABELS: Record<BlockKind, string> = {
  artist: "Artista", title: "Título", subtitle: "Subtítulo",
  date: "Fecha", time: "Hora", datetime: "Fecha · Hora",
  doors: "Apertura puertas", price: "Precio",
  venue: "Venue", location: "Ubicación",
  teacher: "Profesor", dj: "DJ", lineup: "Lineup",
  schedule: "Días", ageRestriction: "Edad mínima",
  dressCode: "Dress code", rsvp: "Confirmación",
  company: "Empresa", web: "Web", social: "Redes",
  footer: "Pie",
};

/** Layer IDs que NUNCA queremos exponer como editables (decorativos). */
const IGNORE_LAYER_IDS = new Set([
  "bg", "bg-photo", "overlay-bottom", "overlay-top", "line-gold",
  "halo-1", "halo-2", "halo-3", "header-line",
  "couple", "couple-main", "couple-sec", "frame-sec",
  "label", "marco", "div", "title-line",
  "box-1-bg", "box-2-bg", "box-3-bg", "info-bg", "info-top-line",
  "plate-line-t", "plate-line-b",
  "chip-bg", "bar-1", "bar-2", "bar-3", "bar-4",
]);

/** Adivinar el kind de un layer ID. Si no matchea, undefined (skipear). */
function guessKind(layerId: string): BlockKind | undefined {
  for (const [pattern, kind] of KIND_HEURISTICS) {
    if (pattern.test(layerId)) return kind;
  }
  return undefined;
}

/** Auto-genera bloques editables desde la plantilla. Async-safe — solo
 *  lee data en memoria, no llama APIs. */
function autoGenerateBlocks(templateId: number): EditableBlock[] {
  // Import lazy para evitar circular dep
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { templates } = require("@/data/templates") as { templates: Array<{ id: number; variants: Array<{ layers?: Array<{ id?: string; type?: string }> }> }> };
  const tpl = templates.find(t => t.id === templateId);
  if (!tpl) return [];
  const layers = tpl.variants?.[0]?.layers ?? [];

  const blocks: EditableBlock[] = [];
  const seen = new Set<string>();

  for (const layer of layers) {
    if (!layer.id || layer.type !== "text") continue;
    if (IGNORE_LAYER_IDS.has(layer.id)) continue;
    const kind = guessKind(layer.id);
    if (!kind) continue;
    // Agrupar layers consecutivos del mismo kind (ej. title-1 + title-2)
    const groupKey = `${kind}-${layer.id.replace(/-\d+$/, "")}`;
    if (seen.has(groupKey)) {
      // Anadir a bloque existente del mismo grupo
      const existing = blocks.find(b => b.id === groupKey);
      if (existing && !existing.layerIds.includes(layer.id)) {
        existing.layerIds.push(layer.id);
      }
      continue;
    }
    seen.add(groupKey);
    blocks.push({
      id: groupKey,
      kind,
      label: KIND_LABELS[kind],
      layerIds: [layer.id],
    });
  }

  return blocks;
}
