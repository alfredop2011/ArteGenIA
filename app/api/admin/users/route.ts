import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/admin";

/**
 * GET /api/admin/users
 *
 * Devuelve estadisticas agregadas de profiles para el dashboard admin:
 *  - stats: { total, answered, pending, distribution: { [type]: count } }
 *  - recent: ultimos 50 usuarios con datos relevantes (sin info sensible)
 *
 * Permisos: solo admin (validado por email del usuario logueado).
 * Usa supabaseAdmin (service_role) para saltar RLS y poder agregar.
 */
export async function GET() {
  try {
    // 1) Verificar que el caller es admin
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2) Cargar todos los profiles (necesario para distribution + total)
    //    En el futuro si crece a >10k, agregamos paginacion o query SQL agregada.
    const { data: all, error: allErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, organizer_type, organizer_type_answered_at, plan, created_at, name");

    if (allErr) {
      console.error("[admin/users] error cargando profiles:", allErr);
      return NextResponse.json({ error: allErr.message }, { status: 500 });
    }

    const profiles = all ?? [];

    // 3) Calcular stats agregados
    const total = profiles.length;
    const answered = profiles.filter(p => p.organizer_type !== null).length;
    const pending = total - answered;
    // "skipped" se cuenta como answered (el user respondio "no quiero decir")
    // — eso es valor por si mismo (saber el rate de rechazo)

    // Distribucion por tipo (solo entre los que respondieron algo)
    const distribution: Record<string, number> = {};
    for (const p of profiles) {
      if (p.organizer_type === null) continue;
      const key = p.organizer_type as string;
      distribution[key] = (distribution[key] ?? 0) + 1;
    }

    // Plan distribution (tambien util en el dashboard)
    const planDistribution: Record<string, number> = {};
    for (const p of profiles) {
      const key = (p.plan ?? "free") as string;
      planDistribution[key] = (planDistribution[key] ?? 0) + 1;
    }

    // 4) Lista de usuarios recientes (top 50 por created_at desc)
    const recent = [...profiles]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50)
      .map(p => ({
        id: p.id,
        email: p.email,
        name: p.name,
        plan: p.plan,
        organizer_type: p.organizer_type,
        organizer_type_answered_at: p.organizer_type_answered_at,
        created_at: p.created_at,
      }));

    return NextResponse.json({
      stats: {
        total,
        answered,
        pending,
        answeredRate: total > 0 ? Math.round((answered / total) * 100) : 0,
        distribution,
        planDistribution,
      },
      recent,
    });
  } catch (e) {
    console.error("[admin/users] error inesperado:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
