import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { EventRow } from "@/lib/supabase";
import { rowToEvent } from "./eventData";
import EventosClient from "./EventosClient";

/**
 * /eventos — Agenda pública. Server Component: carga los eventos publicados (y
 * cancelados, que se muestran con sello) en SSR y se los pasa al cliente. Así
 * los eventos reales aparecen en el HTML aunque el JS de cliente tarde o falle
 * en hidratar — la página de consulta nunca queda vacía ni depende del fetch
 * en el navegador. El filtrado/interacción los maneja EventosClient.
 */

// Siempre dinámico: leemos cookies (sesión) y queremos datos frescos.
export const dynamic = "force-dynamic";

export default async function EventosPage() {
  let initialEvents: ReturnType<typeof rowToEvent>[] = [];
  try {
    const supabase = await createSupabaseServerClient();
    // Solo próximos (una agenda muestra lo que viene, no lo pasado).
    const todayIso = new Date().toISOString().slice(0, 10);
    // Perf: filtramos en la BD (no traer basura ni filas de más).
    //  - status published/cancelled, solo futuros
    //  - ocultar AUTO-importados sin foto (Open Data Madrid → tarjetas vacías);
    //    los curados (manual/web/bot/Ticketmaster) salen siempre. Antes este
    //    filtro era en JS, así que Supabase devolvía filas que se descartaban.
    //  - limit defensivo: la agenda no necesita miles de filas y los crons
    //    importan ~200/día; sin tope la query crecería sin control.
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["published", "cancelled"])
      .gte("event_date", todayIso)
      .or("image_url.not.is.null,source.neq.auto")
      .order("event_date", { ascending: true })
      .limit(600);
    const mapped = ((data as EventRow[]) ?? []).map(rowToEvent);
    // Dedup defensivo: colapsa duplicados (mismo título + fecha + ciudad + lugar).
    const seen = new Set<string>();
    initialEvents = mapped.filter((e) => {
      const k = `${e.title.toLowerCase()}|${e.date}|${e.city}|${e.venue.toLowerCase()}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  } catch {
    // Si Supabase falla, EventosClient cae a los ejemplos de muestra.
    initialEvents = [];
  }

  return <EventosClient initialEvents={initialEvents} />;
}
