import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/collaborator-invites
 * Crea un token de invitación para que un artista se registre.
 * Requiere usuario logueado.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Token corto, suficientemente único para invites con expiración a 7 días.
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("collaborator_invites")
    .insert({
      token,
      owner_id: user.id,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error("[invites POST]", error);
    return NextResponse.json({ error: "No se pudo crear el invite" }, { status: 500 });
  }

  return NextResponse.json({
    token,
    expiresAt: expiresAt.toISOString(),
  });
}

/**
 * GET /api/collaborator-invites?token=...
 * Valida un token público. Devuelve si es válido, expirado o ya usado.
 * NO requiere autenticación (lo usa la página pública del artista).
 *
 * Usa supabaseAdmin para saltarse RLS (el visitante anónimo no puede leer
 * la tabla collaborator_invites con RLS activa).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Falta token" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("collaborator_invites")
    .select("token, owner_id, expires_at, used_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("[invites GET]", error);
    return NextResponse.json({ error: "Error al validar" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
  }

  const now = Date.now();
  const expiresAt = new Date(data.expires_at).getTime();

  if (data.used_at) {
    return NextResponse.json({ valid: false, reason: "already_used" });
  }
  if (expiresAt < now) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  return NextResponse.json({ valid: true, expiresAt: data.expires_at });
}
