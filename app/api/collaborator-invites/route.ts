import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/collaborator-invites
 * Crea un token de invitación normal (sin re-invitación asociada).
 * Requiere autenticación.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

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

  return NextResponse.json({ token, expiresAt: expiresAt.toISOString() });
}

/**
 * GET /api/collaborator-invites?token=...
 * Valida un token público.
 * Devuelve si es válido + si es una re-invitación (con datos previos para pre-rellenar).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) return NextResponse.json({ error: "Falta token" }, { status: 400 });

  const { data: invite, error } = await supabaseAdmin
    .from("collaborator_invites")
    .select("token, owner_id, expires_at, used_at, updates_collaborator_id")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("[invites GET]", error);
    return NextResponse.json({ error: "Error al validar" }, { status: 500 });
  }

  if (!invite) {
    return NextResponse.json({ valid: false, reason: "not_found" }, { status: 404 });
  }

  const now = Date.now();
  const expiresAt = new Date(invite.expires_at).getTime();
  if (invite.used_at) return NextResponse.json({ valid: false, reason: "already_used" });
  if (expiresAt < now) return NextResponse.json({ valid: false, reason: "expired" });

  // Si es re-invitación, devolvemos datos previos para pre-rellenar
  let isUpdate = false;
  let previousData: { artistName: string; role: string | null; phone: string | null } | null = null;
  if (invite.updates_collaborator_id) {
    const { data: prev } = await supabaseAdmin
      .from("collaborators")
      .select("artist_name, role, phone")
      .eq("id", invite.updates_collaborator_id)
      .maybeSingle();
    if (prev) {
      isUpdate = true;
      previousData = {
        artistName: prev.artist_name,
        role: prev.role,
        phone: prev.phone,
      };
    }
  }

  return NextResponse.json({
    valid: true,
    expiresAt: invite.expires_at,
    isUpdate,
    previousData,
  });
}
