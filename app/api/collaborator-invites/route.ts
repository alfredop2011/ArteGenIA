import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/collaborator-invites
 * Crea un token de invitación. Soporta 2 modos:
 *
 *  - SIN body / sin project_id  → modo clásico (Invitar colaborador desde
 *    /mis-recursos). El colaborador sube foto y queda en su lista.
 *
 *  - CON { project_id, target_layer_id } → modo "Solicitar foto desde
 *    editor" (botón en toolbar). Cuando el colaborador sube la foto en
 *    /upload/[token], el backend la inserta automáticamente en el layer
 *    target_layer_id del project_id indicado (auto-actualiza fabric_json).
 *
 * Requiere autenticación. Token CSPRNG (122 bits). Expira en 7 días.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Body opcional con contexto del editor
  let projectId: string | null = null;
  let targetLayerId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (body && typeof body === "object") {
      if (typeof body.project_id === "string") projectId = body.project_id;
      if (typeof body.target_layer_id === "string") targetLayerId = body.target_layer_id;
    }
  } catch { /* sin body, modo clásico */ }

  // Validar que ambos campos van juntos: o ninguno o los dos.
  if ((projectId && !targetLayerId) || (!projectId && targetLayerId)) {
    return NextResponse.json(
      { error: "project_id y target_layer_id deben venir juntos o ninguno" },
      { status: 400 },
    );
  }

  // Si hay project_id, validar que el proyecto pertenece al user (anti-abuso)
  if (projectId) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!proj || proj.user_id !== user.id) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("collaborator_invites")
    .insert({
      token,
      owner_id: user.id,
      expires_at: expiresAt.toISOString(),
      project_id: projectId,
      target_layer_id: targetLayerId,
    });

  if (error) {
    console.error("[invites POST]", error);
    return NextResponse.json({ error: "No se pudo crear el invite" }, { status: 500 });
  }

  return NextResponse.json({
    token,
    expiresAt: expiresAt.toISOString(),
    contextual: Boolean(projectId),
  });
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
