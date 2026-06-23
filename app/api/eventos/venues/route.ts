import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/eventos/venues — PÚBLICO. Devuelve la lista de salas/lugares ya usados
 * en eventos, para autocompletar el campo "Lugar / sala" en /subir.
 * Si el organizador escribe uno nuevo, simplemente se añade (texto libre).
 */
export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from("events")
      .select("venue")
      .in("status", ["published", "cancelled"])
      .not("venue", "is", null)
      .limit(2000);
    const set = new Set<string>();
    for (const r of data ?? []) {
      const v = (r.venue as string)?.trim();
      if (v && v.length > 1 && v.toLowerCase() !== "por confirmar") set.add(v);
    }
    const venues = [...set].sort((a, b) => a.localeCompare(b, "es"));
    return NextResponse.json({ venues });
  } catch {
    return NextResponse.json({ venues: [] });
  }
}
