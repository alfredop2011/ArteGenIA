import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { fetchMadridOpenData, openDataToInsert } from "@/lib/openDataES";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * /api/cron/import-opendata — agente de descubrimiento (open data municipal).
 *
 * Diario: trae la agenda cultural pública de ayuntamientos (gratis, sin key) y
 * la inserta como source='auto'. Hoy: Madrid. Dedup por título+fecha+ciudad
 * para no repetir ni chocar con Ticketmaster ni con eventos del bot.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const todayIso = new Date().toISOString().slice(0, 10);
  let inserted = 0;
  const byCity: Record<string, number> = {};

  // Fuentes registradas (id ciudad → fetcher). Añadir aquí Barcelona, etc.
  const sources: { city: string; fetch: () => Promise<Awaited<ReturnType<typeof fetchMadridOpenData>>> }[] = [
    { city: "madrid", fetch: () => fetchMadridOpenData(todayIso) },
  ];

  for (const src of sources) {
    const rows = await src.fetch();
    if (!rows.length) continue;

    // Eventos ya existentes en esa ciudad para no duplicar (clave título|fecha).
    const { data: existing } = await supabaseAdmin
      .from("events")
      .select("title,event_date")
      .eq("city", src.city)
      .gte("event_date", todayIso);
    const seen = new Set((existing ?? []).map((e) => `${(e.title as string).toLowerCase()}|${e.event_date}`));

    const nuevos = rows
      .filter((r) => {
        const k = `${r.title.toLowerCase()}|${r.event_date}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map(openDataToInsert)
      // Solo insertamos eventos CON foto (la agenda oculta los que no tienen).
      // Madrid open data no trae imágenes → de facto no inserta nada, pero el
      // importador queda listo para fuentes/ciudades que sí incluyan cartel.
      .filter((n) => !!n.image_url);

    if (nuevos.length > 0) {
      const { error } = await supabaseAdmin.from("events").insert(nuevos);
      if (error) console.error("[cron import-opendata]", src.city, error.message);
      else {
        inserted += nuevos.length;
        byCity[src.city] = nuevos.length;
      }
    }
  }

  return NextResponse.json({ ok: true, inserted, byCity });
}
