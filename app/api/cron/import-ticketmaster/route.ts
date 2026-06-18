import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchTicketmasterConcerts, seriesKeyFromTitle } from "@/lib/ticketmaster";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * /api/cron/import-ticketmaster — agente de descubrimiento de conciertos.
 *
 * Diario: trae los conciertos próximos de Ticketmaster (Madrid, Barcelona) y los
 * inserta en la agenda como source='auto' (automáticos, sin dueño, reclamables),
 * con su cartel + link de compra. Dedup por título+fecha+ciudad para no repetir
 * entre ejecuciones ni chocar con eventos del bot/organizadores.
 */

const CITIES = [
  { id: "madrid", name: "Madrid" },
  { id: "barcelona", name: "Barcelona" },
];

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!process.env.TICKETMASTER_API_KEY) return NextResponse.json({ ok: true, note: "sin TICKETMASTER_API_KEY" });

  const todayIso = new Date().toISOString().slice(0, 10);
  let inserted = 0;

  for (const city of CITIES) {
    const concerts = await fetchTicketmasterConcerts(city.id, city.name, 40);
    if (concerts.length === 0) continue;

    // Eventos ya existentes en esa ciudad (para no duplicar): clave título|fecha.
    const { data: existing } = await supabaseAdmin
      .from("events")
      .select("title,event_date")
      .eq("city", city.id)
      .gte("event_date", todayIso);
    const seen = new Set((existing ?? []).map((e) => `${(e.title as string).toLowerCase()}|${e.event_date}`));

    const nuevos = concerts
      .filter((c) => !seen.has(`${c.title.toLowerCase()}|${c.event_date}`))
      .map((c) => ({
        organizer_id: null,
        source: "auto",
        status: "published",
        title: c.title,
        series_key: seriesKeyFromTitle(c.title),
        event_date: c.event_date,
        event_time: c.event_time,
        country: "es",
        city: c.city,
        venue: c.venue,
        category: "conciertos",
        price: c.price,
        has_online_sale: !!c.ticket_url,
        ticket_url: c.ticket_url,
        image_url: c.image_url,
      }));

    if (nuevos.length > 0) {
      const { error } = await supabaseAdmin.from("events").insert(nuevos);
      if (error) console.error("[cron import-ticketmaster]", city.id, error.message);
      else inserted += nuevos.length;
    }
  }

  return NextResponse.json({ ok: true, inserted });
}
