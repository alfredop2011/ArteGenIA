import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { TemplateLayer } from "@/data/templates";

/**
 * POST /api/projects/from-magic-layers
 *
 * Recibe los TemplateLayer[] (output de /api/photo-to-template, posiblemente
 * con ediciones inline del usuario aplicadas) y crea un proyecto en Supabase.
 *
 * Guardamos en fabric_json un formato custom marcado con __magicLayers=true.
 * El editor detecta este formato y aplica via applyTemplateLayers (que
 * maneja correctamente la carga async de imágenes), en lugar de loadFromJSON
 * (que requiere objetos Fabric ya serializados).
 *
 * Trade-off: no usamos toJSON() del cliente para evitar el bug de imágenes
 * que no cargan en StaticCanvas headless (Fabric necesita DOM real para
 * FabricImage.fromURL async, y los timeouts pueden hacer que se persistan
 * objects vacíos).
 */

type Body = {
  title: string;
  width: number;
  height: number;
  layers: TemplateLayer[];
  originalImageUrl?: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    if (!Array.isArray(body?.layers) || body.layers.length === 0) {
      return NextResponse.json({ error: "layers obligatorio (array no vacío)" }, { status: 400 });
    }
    if (!body.width || !body.height) {
      return NextResponse.json({ error: "width/height obligatorios" }, { status: 400 });
    }

    const title = (body.title || "Mi flyer mágico").slice(0, 120);

    // Formato custom que el editor detecta y aplica con applyTemplateLayers.
    // Esto se hace para que las imágenes async se carguen correctamente
    // en el DOM canvas real del editor (no en un StaticCanvas headless).
    const fabricJson = {
      __magicLayers: true,
      version: "magic-layers-v1",
      layers: body.layers,
      width: body.width,
      height: body.height,
      originalImageUrl: body.originalImageUrl ?? null,
    };

    // Crear el proyecto. template_id=0 marca "custom magic layers".
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title,
        template_id: 0,
        fabric_json: fabricJson,
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
