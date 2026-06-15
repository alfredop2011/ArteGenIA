import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getStorageLimitFor, formatBytes, type AssetType } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * POST /api/assets — guardar un asset en "Mis creaciones" (Fase Z.8).
 *
 * Body: {
 *   type: "sin_fondo" | "sticker_ia" | "generada_ia" | "subida",
 *   url: string,           // URL pública R2 donde está el archivo
 *   storage_key?: string,  // R2 key para poder borrar luego
 *   name?: string,         // nombre legible
 *   size_bytes: number,    // tamaño del archivo (para storage tracking)
 *   width?: number,
 *   height?: number,
 *   source_module?: string,// quitar_fondo | capas_magicas | etc
 *   source_project_id?: string,
 * }
 *
 * Antes de insertar: valida que no exceda el storage limit del plan.
 * Si excede → 402 con mensaje "Almacenamiento lleno · Sube a Pro".
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }

    const body = await req.json() as {
      type?: AssetType;
      url?: string;
      storage_key?: string;
      name?: string;
      size_bytes?: number;
      width?: number;
      height?: number;
      source_module?: string;
      source_project_id?: string;
    };

    if (!body.type || !body.url) {
      return NextResponse.json({ error: "Faltan type/url" }, { status: 400 });
    }
    const validTypes: AssetType[] = ["sin_fondo", "sticker_ia", "generada_ia", "subida"];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ error: `type inválido: ${body.type}` }, { status: 400 });
    }
    const sizeBytes = typeof body.size_bytes === "number" ? body.size_bytes : 0;

    // ─── Storage limit check ────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("id", user.id).maybeSingle();
    const plan = (profile?.plan as string) ?? "free";
    const limit = getStorageLimitFor(plan);

    // Suma actual del usuario
    const { data: usedData } = await supabase.rpc("get_user_storage_bytes", { p_user_id: user.id });
    const usedBytes = typeof usedData === "number" ? usedData : Number(usedData ?? 0);
    if (usedBytes + sizeBytes > limit) {
      return NextResponse.json(
        {
          error: "Almacenamiento lleno",
          used: usedBytes,
          limit,
          used_human: formatBytes(usedBytes),
          limit_human: formatBytes(limit),
          plan,
        },
        { status: 402 },
      );
    }

    // ─── Insert ─────────────────────────────────────────────────────────
    const { data, error } = await supabase
      .from("user_assets")
      .insert({
        user_id: user.id,
        type: body.type,
        url: body.url,
        storage_key: body.storage_key ?? null,
        name: body.name?.slice(0, 200) ?? "Sin nombre",
        size_bytes: sizeBytes,
        width: body.width ?? null,
        height: body.height ?? null,
        source_module: body.source_module ?? null,
        source_project_id: body.source_project_id ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[assets POST] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ id: data.id, storage_used: usedBytes + sizeBytes, storage_limit: limit });
  } catch (e) {
    console.error("[assets POST]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

/**
 * GET /api/assets — listar assets del usuario.
 *
 * Query params:
 *   type=sin_fondo&type=sticker_ia → filtrar por tipo(s)
 *   limit=50 → paginación (default 100)
 *   sort=recent|created → orden (default created desc)
 */
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, assets: [] });
    }

    const { searchParams } = new URL(req.url);
    const types = searchParams.getAll("type");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const sort = searchParams.get("sort") ?? "created";

    let query = supabase.from("user_assets").select("*").eq("user_id", user.id);
    if (types.length > 0) query = query.in("type", types);
    query = sort === "recent"
      ? query.order("last_used_at", { ascending: false })
      : query.order("created_at", { ascending: false });
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error("[assets GET] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Storage info
    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("id", user.id).maybeSingle();
    const plan = (profile?.plan as string) ?? "free";
    const limitBytes = getStorageLimitFor(plan);
    const { data: usedData } = await supabase.rpc("get_user_storage_bytes", { p_user_id: user.id });
    const usedBytes = typeof usedData === "number" ? usedData : Number(usedData ?? 0);

    return NextResponse.json({
      authenticated: true,
      assets: data ?? [],
      storage: {
        used_bytes: usedBytes,
        limit_bytes: limitBytes,
        used_human: formatBytes(usedBytes),
        limit_human: formatBytes(limitBytes),
        percent: Math.round((usedBytes / limitBytes) * 100),
        plan,
      },
    });
  } catch (e) {
    console.error("[assets GET]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
