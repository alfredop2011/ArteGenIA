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
    const { data } = await supabase
      .from("events")
      .select("*")
      .in("status", ["published", "cancelled"])
      .order("event_date", { ascending: true });
    initialEvents = ((data as EventRow[]) ?? []).map(rowToEvent);
  } catch {
    // Si Supabase falla, EventosClient cae a los ejemplos de muestra.
    initialEvents = [];
  }

  return <EventosClient initialEvents={initialEvents} />;
}
