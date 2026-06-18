/**
 * Ticketmaster Discovery API — importa conciertos públicos por ciudad.
 * Usado por el cron /api/cron/import-ticketmaster (agente de descubrimiento).
 */
import { seriesKeyFromTitle } from "@/lib/eventSeries";

export type TmEventRow = {
  external_id: string;
  title: string;
  event_date: string;
  event_time: string;
  venue: string;
  city: string; // id interno (madrid, barcelona…)
  image_url: string | null;
  ticket_url: string | null;
  price: number | null;
};

type TmImage = { url: string; width: number; ratio?: string };
type TmEvent = {
  id: string;
  name: string;
  url?: string;
  images?: TmImage[];
  dates?: { start?: { localDate?: string; localTime?: string } };
  priceRanges?: { min?: number }[];
  _embedded?: { venues?: { name?: string }[] };
};

// Mejor imagen para card landscape: la más ancha (preferible 16_9).
function bestImage(images?: TmImage[]): string | null {
  if (!images?.length) return null;
  const wide = images.filter((i) => i.ratio === "16_9");
  const pool = wide.length ? wide : images;
  return pool.reduce((a, b) => (b.width > a.width ? b : a)).url ?? null;
}

/** Trae conciertos próximos de una ciudad (cityName) y los mapea a nuestro shape. */
export async function fetchTicketmasterConcerts(cityId: string, cityName: string, max = 40): Promise<TmEventRow[]> {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return [];
  const start = new Date().toISOString().slice(0, 19) + "Z"; // desde ahora
  const url =
    `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${key}` +
    `&city=${encodeURIComponent(cityName)}&countryCode=ES&classificationName=music` +
    `&startDateTime=${encodeURIComponent(start)}&sort=date,asc&size=${max}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const events: TmEvent[] = data?._embedded?.events ?? [];
  const out: TmEventRow[] = [];
  for (const e of events) {
    const date = e.dates?.start?.localDate;
    if (!date) continue;
    out.push({
      external_id: e.id,
      title: (e.name || "Concierto").slice(0, 120),
      event_date: date,
      event_time: (e.dates?.start?.localTime || "20:00").slice(0, 5),
      venue: e._embedded?.venues?.[0]?.name || "Por confirmar",
      city: cityId,
      image_url: bestImage(e.images),
      ticket_url: e.url ?? null,
      price: typeof e.priceRanges?.[0]?.min === "number" ? Math.round(e.priceRanges![0].min!) : null,
    });
  }
  return out;
}

export { seriesKeyFromTitle };
