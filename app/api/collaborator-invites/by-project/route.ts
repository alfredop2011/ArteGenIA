import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/collaborator-invites/by-project?project_id=<uuid>
 *
 * Devuelve todos los invites contextuales de un proyecto del user con su
 * estado actual: pendiente vs usado, y si fue usado quién subió la foto.
 *
 * Usado por el modal multi-invite para mostrar:
 *   - Quién ya cargó (nombre del colaborador)
 *   - Cuántos invites están pendientes
 *   - % de completitud
 *
 * Solo invites del owner autenticado + del proyecto pedido (anti-abuso).
 */
export async function GET(req: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const projectId = new URL(req.url).searchParams.get("project_id");
    if (!projectId) {
        return NextResponse.json({ error: "Falta project_id" }, { status: 400 });
    }

    // Validar ownership del proyecto
    const { data: proj } = await supabase
        .from("projects")
        .select("id, user_id")
        .eq("id", projectId)
        .maybeSingle();
    if (!proj || proj.user_id !== user.id) {
        return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Traer invites con datos del colaborador asociado (LEFT JOIN via FK).
    // Hint EXPLÍCITO de FK porque collaborator_invites tiene 2 FK a
    // collaborators (collaborator_id + updates_collaborator_id) y sin
    // hint PostgREST devuelve PGRST201 (ambiguous relationship).
    const { data: invites, error } = await supabaseAdmin
        .from("collaborator_invites")
        .select(`
            token,
            target_layer_id,
            expires_at,
            used_at,
            collaborator_id,
            created_at,
            collaborator:collaborators!collaborator_id (
                artist_name,
                kind
            )
        `)
        .eq("owner_id", user.id)
        .eq("project_id", projectId)
        .not("target_layer_id", "is", null)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[invites by-project GET]", error);
        return NextResponse.json({ error: "No se pudieron cargar los invites" }, { status: 500 });
    }

    return NextResponse.json({
        invites: (invites ?? []).map(i => ({
            token: i.token,
            target_layer_id: i.target_layer_id,
            expires_at: i.expires_at,
            used_at: i.used_at,
            created_at: i.created_at,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            collaborator: (i.collaborator as any) ?? null,
        })),
    });
}
