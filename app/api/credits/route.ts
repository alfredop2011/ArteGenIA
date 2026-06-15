import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getCreditsBalance, daysUntilReset } from "@/lib/credits";

/**
 * GET /api/credits — devuelve balance y meta del usuario.
 *
 * Response (200, logged in):
 *   { balance: 23, monthlyGrant: 30, resetAt: "2026-07-01T00:00:00Z", daysUntilReset: 12 }
 *
 * Response (200, no auth):
 *   { authenticated: false }
 *
 * El cliente hace polling de este endpoint para mantener el badge del header
 * sincronizado. Caching mínimo (5s) en cliente para no spamear DB.
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ authenticated: false });
    }
    const balance = await getCreditsBalance(supabase, user.id);
    return NextResponse.json({
      authenticated: true,
      ...balance,
      daysUntilReset: daysUntilReset(balance.resetAt),
    });
  } catch (e) {
    console.error("[credits GET]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
