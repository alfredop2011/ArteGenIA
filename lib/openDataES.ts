/**
 * Open Data de ayuntamientos españoles — fuente GRATIS y oficial de eventos
 * culturales (sin API key). Complementa a Ticketmaster con la agenda municipal:
 * conciertos de barrio, teatro, danza, fiestas populares…
 *
 * Empezamos por Madrid (JSON documentado, 100 días vista). La estructura está
 * pensada para ir añadiendo más ciudades (Barcelona, Valencia…) con su propio
 * fetcher que devuelva el mismo shape `OpenDataRow`.
 *
 * Importante: importamos SOLO las categorías que encajan con nuestra taxonomía
 * (música, teatro, danza/baile, fiestas, festivales). Nos saltamos cine,
 * exposiciones, conferencias, deportes, cuentacuentos, etc. para no inundar la
 * agenda con cosas fuera de foco.
 */

import type { EventCategory } from "@/lib/supabase";
import { seriesKeyFromTitle } from "@/lib/eventSeries";

export type OpenDataRow = {
  external_id: string;
  title: string;
  event_date: string; // yyyy-mm-dd
  event_time: string; // HH:mm
  venue: string;
  city: string; // id interno (madrid…)
  category: EventCategory;
  price: number | null; // 0 = gratis, null = consultar
  price_info: string | null;
  ticket_url: string | null;
  neighborhood: string | null;
};

// Mapa @type de Madrid (último segmento de la URL) → categoría nuestra.
// Lo que NO esté aquí se descarta (cine, exposiciones, deportes, conferencias…).
const MADRID_TYPE_MAP: Record<string, EventCategory> = {
  Musica: "conciertos",
  Clasica: "conciertos",
  RockPop: "conciertos",
  JazzSoulFunkySwingReagge: "conciertos",
  Flamenco: "conciertos",
  CoroGospel: "conciertos",
  CantautorFolkCountry: "conciertos",
  Zarzuela: "conciertos",
  TeatroPerformance: "teatro",
  CircoMagia: "teatro",
  ComediaMonologo: "teatro",
  DanzaBaile: "social",
  Fiestas: "fiesta",
  Festivales: "festival",
};

type MadridEvent = {
  "@type"?: string;
  id?: string;
  title?: string;
  free?: number;
  price?: string;
  dtstart?: string;
  time?: string;
  link?: string;
  "event-location"?: string;
  address?: { area?: { "street-address"?: string; locality?: string } };
};

// "20 euros" → 20 · "Entrada libre…" → null (texto a price_info)
function parsePrice(free: number | undefined, raw: string | undefined): { price: number | null; price_info: string | null } {
  if (free === 1) return { price: 0, price_info: null };
  const text = (raw || "").trim();
  if (!text) return { price: null, price_info: null };
  const m = text.match(/(\d+([.,]\d+)?)/);
  if (m) return { price: Math.round(parseFloat(m[1].replace(",", "."))), price_info: text.length > 12 ? text.slice(0, 120) : null };
  return { price: null, price_info: text.slice(0, 120) };
}

/**
 * Agenda de actividades culturales de Madrid (próximos 100 días).
 * Dataset abierto del Ayuntamiento de Madrid, sin clave.
 */
export async function fetchMadridOpenData(todayIso: string): Promise<OpenDataRow[]> {
  const url = "https://datos.madrid.es/egob/catalogo/206974-0-agenda-eventos-culturales-100.json";
  let data: { "@graph"?: MadridEvent[] };
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return [];
    data = await res.json();
  } catch {
    return [];
  }
  const out: OpenDataRow[] = [];
  for (const e of data["@graph"] ?? []) {
    const type = (e["@type"] || "").split("/").pop() || "";
    const category = MADRID_TYPE_MAP[type];
    if (!category) continue; // categoría fuera de foco → descartar
    const dtstart = e.dtstart || "";
    const date = dtstart.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayIso) continue; // solo futuros válidos
    const time = /^\d{1,2}:\d{2}$/.test(e.time || "") ? (e.time as string) : dtstart.slice(11, 16) || "20:00";
    const { price, price_info } = parsePrice(e.free, e.price);
    out.push({
      external_id: `madrid-${e.id || e.title}`,
      title: String(e.title || "Evento").slice(0, 120),
      event_date: date,
      event_time: time.length === 4 ? `0${time}` : time,
      venue: String(e["event-location"] || e.address?.area?.["street-address"] || "Madrid").slice(0, 120),
      city: "madrid",
      category,
      price,
      price_info,
      ticket_url: typeof e.link === "string" && e.link.startsWith("http") ? e.link : null,
      neighborhood: e.address?.area?.locality && e.address.area.locality !== "MADRID" ? e.address.area.locality : null,
    });
  }
  return out;
}

// Mapea una OpenDataRow al shape de inserción de la tabla `events`.
export function openDataToInsert(r: OpenDataRow) {
  return {
    organizer_id: null,
    source: "auto",
    status: "published",
    title: r.title,
    series_key: seriesKeyFromTitle(r.title),
    event_date: r.event_date,
    event_time: r.event_time,
    country: "es",
    city: r.city,
    venue: r.venue,
    neighborhood: r.neighborhood,
    category: r.category,
    price: r.price,
    price_info: r.price_info,
    has_online_sale: false, // el link es informativo / web municipal
    ticket_url: r.ticket_url,
    image_url: null, // open data de Madrid no trae imagen → la card usa gradiente por categoría
  };
}
