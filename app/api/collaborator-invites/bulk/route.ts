import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/collaborator-invites/bulk
 *
 * Genera N invites contextuales de golpe para un mismo proyecto, una por
 * cada capa indicada. Usado por el wizard "Solicitar fotos" del editor
 * cuando el user quiere pedir fotos a varios colaboradores para varias
 * capas del mismo flyer (ej. 4 bailarines + 1 DJ + 1 marca).
 *
 * Body:
 *   {
 *     project_id: string,
 *     layer_ids: string[],          // customIds de las capas image
 *     skip_existing_pending?: bool, // si true, ignora layers que ya tienen
 *                                   // invite pendiente (no usado, no expirado).
 *                                   // Default true — evita generar duplicados
 *                                   // si el user vuelve al wizard.
 *   }
 *
 * Response: { invites: [{ token, target_layer_id, expiresAt }] }
 *
 * Si el user pide invites para layers que YA tienen un invite activo, los
 * reutiliza (no genera nuevo). Esto cubre el caso del user que añade más
 * capas después y vuelve al wizard — solo se generan las nuevas.
 */
export async function POST(req: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json().catch(() => null) as {
        project_id?: string;
        layer_ids?: string[];
        skip_existing_pending?: boolean;
    } | null;

    if (!body || typeof body.project_id !== "string" || !Array.isArray(body.layer_ids) || body.layer_ids.length === 0) {
        return NextResponse.json(
            { error: "Faltan campos: project_id (string) y layer_ids (array no vacío)" },
            { status: 400 },
        );
    }
    if (body.layer_ids.length > 50) {
        // Sanity cap: nadie pide >50 fotos para un solo flyer
        return NextResponse.json({ error: "Máximo 50 capas por solicitud" }, { status: 400 });
    }

    // Validar que el proyecto pertenece al user
    const { data: proj } = await supabase
        .from("projects")
        .select("id, user_id")
        .eq("id", body.project_id)
        .maybeSingle();
    if (!proj || proj.user_id !== user.id) {
        return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // Dedupar layer_ids (por si el cliente manda repetidos) + normalizar
    const uniqueLayerIds = Array.from(new Set(body.layer_ids.filter(id => typeof id === "string" && id.length > 0)));

    // Por defecto, evitamos duplicados: si una capa ya tiene un invite
    // pendiente (no usado, no expirado), reutilizamos ese token en vez de
    // crear uno nuevo. Esto permite al user volver al wizard sin generar
    // links extra que confundirían a los colaboradores.
    //
    // ADEMÁS: si una capa ya tiene invite USADO (foto recibida), tampoco
    // creamos uno nuevo — esa capa ya está completada y volver a pedirla
    // sería confuso. La devolvemos en la respuesta con `completed: true`
    // para que el modal la muestre como "Recibida".
    const skipExisting = body.skip_existing_pending !== false;

    const nowIso = new Date().toISOString();
    let pending: Array<{ token: string; target_layer_id: string; expires_at: string }> = [];
    let completed: Array<{ token: string; target_layer_id: string; expires_at: string }> = [];
    if (skipExisting) {
        // Pendientes: no usados, no expirados
        const { data: pendingInvites } = await supabaseAdmin
            .from("collaborator_invites")
            .select("token, target_layer_id, expires_at")
            .eq("owner_id", user.id)
            .eq("project_id", body.project_id)
            .in("target_layer_id", uniqueLayerIds)
            .is("used_at", null)
            .gt("expires_at", nowIso);
        pending = (pendingInvites ?? []) as typeof pending;

        // Completados: ya usados (foto recibida)
        const { data: completedInvites } = await supabaseAdmin
            .from("collaborator_invites")
            .select("token, target_layer_id, expires_at")
            .eq("owner_id", user.id)
            .eq("project_id", body.project_id)
            .in("target_layer_id", uniqueLayerIds)
            .not("used_at", "is", null);
        completed = (completedInvites ?? []) as typeof completed;
    }

    const existingLayerIds = new Set([
        ...pending.map(p => p.target_layer_id),
        ...completed.map(c => c.target_layer_id),
    ]);
    const layersToCreate = uniqueLayerIds.filter(id => !existingLayerIds.has(id));

    // Crear los nuevos invites en una sola query batch
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const newInvites: Array<{ token: string; target_layer_id: string; expires_at: string }> = [];

    if (layersToCreate.length > 0) {
        const rows = layersToCreate.map(layerId => ({
            token: crypto.randomUUID(),
            owner_id: user.id,
            expires_at: expiresAt.toISOString(),
            project_id: body.project_id,
            target_layer_id: layerId,
        }));
        const { data: inserted, error } = await supabaseAdmin
            .from("collaborator_invites")
            .insert(rows)
            .select("token, target_layer_id, expires_at");
        if (error) {
            console.error("[invites bulk POST]", error);
            return NextResponse.json({ error: "No se pudieron crear los invites" }, { status: 500 });
        }
        newInvites.push(...((inserted ?? []) as typeof newInvites));
    }

    // Devolvemos TODOS los invites: completados (con flag para que el
    // modal los muestre como 'Recibida' sin re-pedir) + pendientes
    // reutilizados + nuevos creados.
    const allInvites = [
        ...completed.map(c => ({
            token: c.token,
            target_layer_id: c.target_layer_id,
            expiresAt: c.expires_at,
            reused: true,
            completed: true,
        })),
        ...pending.map(p => ({
            token: p.token,
            target_layer_id: p.target_layer_id,
            expiresAt: p.expires_at,
            reused: true,
            completed: false,
        })),
        ...newInvites.map(n => ({
            token: n.token,
            target_layer_id: n.target_layer_id,
            expiresAt: n.expires_at,
            reused: false,
            completed: false,
        })),
    ];

    return NextResponse.json({ invites: allInvites });
}
