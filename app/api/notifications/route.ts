import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/notifications?limit=20
 * Devuelve las notificaciones del usuario autenticado (más recientes primero)
 * + contador de no leídas (para badge de la campana).
 *
 * Ligero por diseño: solo trae max 50 items. El dropdown de la campana
 * muestra ~5-10 y la página completa (futura) puede paginar.
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));

  // Query paralela: items + count. Más rápido que dos awaits en serie.
  const [itemsRes, countRes] = await Promise.all([
    supabaseAdmin
      .from("notifications")
      .select("id, type, payload, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabaseAdmin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);

  if (itemsRes.error) {
    console.error("[notifications GET] error", itemsRes.error);
    return NextResponse.json({ error: "No se pudieron cargar las notificaciones" }, { status: 500 });
  }

  return NextResponse.json({
    items: itemsRes.data ?? [],
    unread_count: countRes.count ?? 0,
  });
}

/**
 * POST /api/notifications/mark-read
 * Body: { ids?: string[], all?: boolean }
 *   - { ids: [...] }: marca esas notificaciones como leídas (idempotente)
 *   - { all: true }: marca TODAS las del user como leídas (botón "Marcar todo")
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { ids?: string[]; all?: boolean } | null;
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  let query = supabaseAdmin
    .from("notifications")
    .update({ read_at: nowIso })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (body.all === true) {
    // Marca todas las no leídas
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    query = query.in("id", body.ids);
  } else {
    return NextResponse.json({ error: "Especifica ids o all=true" }, { status: 400 });
  }

  const { error } = await query;
  if (error) {
    console.error("[notifications POST mark-read] error", error);
    return NextResponse.json({ error: "No se pudo marcar como leída" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
