import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/feedback
 *
 * Recibe feedback desde el widget flotante. Cualquier user (logueado o no)
 * puede enviar. Si esta logueado, asociamos el user_id automaticamente.
 *
 * Body: { message: string, email?: string, page?: string }
 *
 * Sin rate limit explicito (el modal del cliente bloquea spam UI con
 * cooldown). Si recibimos abuso real, añadir rate limit por IP.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message?: string;
      email?: string;
      page?: string;
    };

    // Validacion minima
    const message = body.message?.trim();
    if (!message || message.length < 3) {
      return NextResponse.json({ error: "Mensaje demasiado corto" }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Mensaje demasiado largo (max 5000)" }, { status: 400 });
    }

    // Intentar obtener user logueado (opcional)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Insert via service_role (bypass RLS — la policy de insert es publica
    // de todos modos, esto es por consistencia y para tener todos los inserts
    // del backend desde admin client).
    const { error } = await supabaseAdmin.from("feedback").insert({
      user_id: user?.id ?? null,
      email: body.email?.trim() || user?.email || null,
      message,
      page: body.page?.slice(0, 200) || null,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) || null,
    });

    if (error) {
      console.error("[feedback] insert error:", error);
      return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[feedback] unexpected:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
