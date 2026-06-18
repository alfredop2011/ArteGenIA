import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const runtime = "nodejs";

/**
 * /api/events/claim — el usuario autenticado reclama los eventos que envió por
 * bot (sin cuenta). El claim_token llega en el enlace que le dio el bot.
 *
 * Asigna a su user id todos los eventos huérfanos con ese token vía la función
 * SQL claim_events_by_token (SECURITY DEFINER). Devuelve cuántos reclamó.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });

    const { token } = (await req.json()) as { token?: string };
    if (!token || !/^[0-9a-f-]{36}$/i.test(token)) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("claim_events_by_token", {
      p_token: token,
      p_user: user.id,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ claimed: typeof data === "number" ? data : 0 });
  } catch (err) {
    console.error("[events/claim]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
