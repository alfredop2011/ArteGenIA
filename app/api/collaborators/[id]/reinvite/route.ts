import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * POST /api/collaborators/[id]/reinvite
 *
 * Genera un token nuevo vinculado a un colaborador existente.
 * Cuando el colaborador lo use, se ACTUALIZARÁ su fila en vez de crear una nueva.
 *
 * Esto preserva el rastro RGPD: el usuario rellena de nuevo el consentimiento
 * con datos actualizados, sin que el organizador haya tocado los datos personales
 * directamente.
 *
 * Solo aplica a `kind=person` (las marcas se pueden editar directamente vía PATCH).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Verificar que el colaborador existe, es del usuario, y es persona
  const { data: collab, error: getErr } = await supabase
    .from("collaborators")
    .select("id, kind, artist_name")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (getErr || !collab) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  if (collab.kind !== "person") {
    return NextResponse.json(
      { error: "Solo se puede re-invitar a personas" },
      { status: 400 }
    );
  }

  // Token CSPRNG (122 bits) — no enumerable. Ver collaborator-invites.
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const { error } = await supabase
    .from("collaborator_invites")
    .insert({
      token,
      owner_id: user.id,
      expires_at: expiresAt.toISOString(),
      updates_collaborator_id: id,
    });

  if (error) {
    console.error("[reinvite POST]", error);
    return NextResponse.json({ error: "No se pudo generar el link" }, { status: 500 });
  }

  return NextResponse.json({
    token,
    expiresAt: expiresAt.toISOString(),
    artistName: collab.artist_name,
  });
}
