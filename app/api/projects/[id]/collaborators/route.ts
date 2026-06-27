import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/projects/[id]/collaborators
 *
 * Devuelve la lista de colaboradores asociados a un proyecto (vía
 * collaborator_invites con target_layer_id apuntando a una capa del flyer).
 *
 * Usado por el modal "Publicar" del editor en la sección "Enviar a
 * colaboradores" — muestra a cada colab con los canales disponibles
 * (WhatsApp / Telegram / Instagram) para que el organizador les pase el
 * link del flyer ya publicado y les pida que lo compartan.
 *
 * Filtros:
 *   - Solo invites con target_layer_id NO NULL (= invites desde editor,
 *     no los genéricos de wizard)
 *   - Owner-only: solo devolvemos colab de proyectos del user logueado
 *
 * Response:
 *   {
 *     collaborators: [
 *       {
 *         id: "uuid",
 *         artist_name: "DJ Asesina",
 *         kind: "person" | "brand",
 *         photo_url: "...",
 *         phone: "+34666...",     // null si no lo dio
 *         telegram_handle: "djasesina",  // null si no lo dio
 *         instagram_handle: "djasesina_oficial",
 *         uploaded: true,         // true = ya subió foto, false = pendiente
 *         layer_id: "dj-1-img",   // capa del flyer donde va su foto
 *       },
 *       ...
 *     ]
 *   }
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id: projectId } = await params;
    if (!projectId) {
        return NextResponse.json({ error: "Falta project_id" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar ownership del proyecto
    const { data: proj } = await supabase
        .from("projects")
        .select("id, user_id")
        .eq("id", projectId)
        .maybeSingle();
    if (!proj || proj.user_id !== user.id) {
        return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Traer invites del proyecto con JOIN al colaborador.
    // Hint FK explícito porque collaborator_invites tiene 2 FK a collaborators
    // (collaborator_id + updates_collaborator_id) — sin hint PostgREST devuelve
    // PGRST201 "ambiguous relationship".
    const { data: invites, error } = await supabaseAdmin
        .from("collaborator_invites")
        .select(`
            target_layer_id,
            used_at,
            collaborator_id,
            collaborator:collaborators!collaborator_id (
                id,
                artist_name,
                kind,
                photo_url,
                phone,
                telegram_handle,
                instagram_handle
            )
        `)
        .eq("owner_id", user.id)
        .eq("project_id", projectId)
        .not("target_layer_id", "is", null)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("[projects collaborators GET]", error);
        return NextResponse.json({ error: "No se pudieron cargar los colaboradores" }, { status: 500 });
    }

    // Aplanar y deduplicar por collaborator_id (un colab podría aparecer en
    // varios invites si fue re-invitado). El más reciente gana.
    const seen = new Set<string>();
    const collaborators = [];
    for (const inv of (invites ?? [])) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = inv.collaborator as any;
        if (!c || !c.id || seen.has(c.id)) continue;
        seen.add(c.id);
        collaborators.push({
            id: c.id,
            artist_name: c.artist_name,
            kind: c.kind,
            photo_url: c.photo_url,
            phone: c.phone,
            telegram_handle: c.telegram_handle,
            instagram_handle: c.instagram_handle,
            uploaded: !!inv.used_at,
            layer_id: inv.target_layer_id,
        });
    }

    return NextResponse.json({ collaborators });
}
