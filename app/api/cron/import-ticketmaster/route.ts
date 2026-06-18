import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchTicketmasterEvents, seriesKeyFromTitle } from "@/lib/ticketmaster";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * /api/cron/import-ticketmaster — agente de descubrimiento (conciertos + teatro).
 *
 * Diario: trae eventos próximos de Ticketmaster por ciudad y clasificación
 * (música → conciertos, artes escénicas → teatro) y los inserta en la agenda
 * como source='auto' (automáticos, sin dueño, reclamables), con cartel + link.
 * Dedup por título+fecha+ciudad para no repetir ni chocar con eventos del bot.
 */

const CITIES = [
  { id: "madrid", name: "Madrid" },
  { id: "barcelona", name: "Barcelona" },
  { id: "valencia", name: "Valencia" },
  { id: "sevilla", name: "Sevilla" },
  { id: "malaga", name: "Málaga" },
  { id: "bilbao", name: "Bilbao" },
  { id: "zaragoza", name: "Zaragoza" },
  { id: "granada", name: "Granada" },
];

// Clasificación de Ticketmaster → categoría nuestra.
const KINDS = [
  { classification: "music", category: "conciertos" },
  { classification: "Arts & Theatre", category: "teatro" },
];

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!process.env.TICKETMASTER_API_KEY) return NextResponse.json({ ok: true, note: "sin TICKETMASTER_API_KEY" });

  const todayIso = new Date().toISOString().slice(0, 10);
  let inserted = 0;

  for (const city of CITIES) {
    // Eventos ya existentes en esa ciudad (para no duplicar): clave título|fecha.
    const { data: existing } = await supabaseAdmin
      .from("events")
      .select("title,event_date")
      .eq("city", city.id)
      .gte("event_date", todayIso);
    const seen = new Set((existing ?? []).map((e) => `${(e.title as string).toLowerCase()}|${e.event_date}`));

    for (const kind of KINDS) {
      const rows = await fetchTicketmasterEvents(city.id, city.name, kind.classification, 30);
      const nuevos = rows
        .filter((c) => !seen.has(`${c.title.toLowerCase()}|${c.event_date}`))
        .map((c) => {
          seen.add(`${c.title.toLowerCase()}|${c.event_date}`); // evita duplicar entre clasificaciones
          return {
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
            category: kind.category,
            price: c.price,
            price_info: c.price_info,
            has_online_sale: !!c.ticket_url,
            ticket_url: c.ticket_url,
            image_url: c.image_url,
          };
        });
      if (nuevos.length > 0) {
        const { error } = await supabaseAdmin.from("events").insert(nuevos);
        if (error) console.error("[cron import-ticketmaster]", city.id, kind.category, error.message);
        else inserted += nuevos.length;
      }
    }
  }

  return NextResponse.json({ ok: true, inserted });
}
