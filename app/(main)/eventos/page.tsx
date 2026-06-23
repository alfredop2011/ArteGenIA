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
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["published", "cancelled"])
      .gte("event_date", todayIso)
      // Solo eventos CON foto: las fuentes sin imagen (p.ej. Open Data Madrid)
      // no se muestran — preferimos una agenda con cartel real a tarjetas vacías.
      .not("image_url", "is", null)
      .order("event_date", { ascending: true });
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
