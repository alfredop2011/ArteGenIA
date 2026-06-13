import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * POST /api/projects/from-magic-layers
 *
 * Recibe el fabric_json YA SERIALIZADO desde el cliente (que lo generó
 * con StaticCanvas + applyTemplateLayers) y lo persiste en Supabase.
 * Devuelve el projectId para que el cliente redirija a /editor/[id].
 *
 * El fabric_json se serializa cliente-side porque:
 *  1. applyTemplateLayers carga imágenes async (await FabricImage.fromURL)
 *     que requieren DOM canvas — no funciona en server.
 *  2. canvas.toJSON() del cliente produce el formato EXACTO que el editor
 *     espera al hacer loadFromJSON, sin riesgo de inconsistencias.
 */

type Body = {
  title: string;
  width: number;
  height: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricJson: any;
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    if (!body?.fabricJson || typeof body.fabricJson !== "object") {
      return NextResponse.json({ error: "fabricJson obligatorio" }, { status: 400 });
    }
    if (!body.width || !body.height) {
      return NextResponse.json({ error: "width/height obligatorios" }, { status: 400 });
    }

    const title = (body.title || "Mi flyer mágico").slice(0, 120);

    // Crear el proyecto. template_id=0 marca "custom magic layers"
    // (no usa plantilla predefinida, viene de upload del usuario).
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title,
        template_id: 0,
        fabric_json: body.fabricJson,
        format: "custom",
        width: body.width,
        height: body.height,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[from-magic-layers] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projectId: data.id, title });
  } catch (e) {
    console.error("[from-magic-layers]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
