import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { TemplateLayer } from "@/data/templates";

/**
 * POST /api/projects/from-magic-layers
 *
 * Recibe los TemplateLayer[] generados por /api/photo-to-template + título
 * + dimensiones. Construye un fabric_json válido y crea un proyecto nuevo
 * en Supabase. Devuelve el projectId para que el cliente redirija a
 * /editor/[id] y abra el flyer editable.
 *
 * El fabric_json se genera SIN llamar a Fabric (que requiere DOM canvas).
 * Construimos manualmente la estructura `objects[]` que Fabric espera,
 * basándonos en las claves que ya usan las plantillas existentes.
 */

type Body = {
  title: string;
  width: number;
  height: number;
  layers: TemplateLayer[];
};

/** Convierte un TemplateLayer en el objeto JSON que Fabric.js entiende
 *  al hacer canvas.loadFromJSON(). Cubre los 4 tipos: text, image, shape,
 *  shape-pattern. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function layerToFabricObject(layer: TemplateLayer): any | null {
  if (layer.type === "text") {
    return {
      type: "textbox",
      version: "6.0.0",
      // Fabric usa originX/originY = left/top por defecto en textbox.
      // Para coincidir con templates.ts que usa coords TOP-LEFT, dejamos así.
      left: layer.x,
      top: layer.y,
      width: layer.width,
      fontSize: layer.fontSize,
      fontFamily: layer.fontFamily,
      fill: layer.color,
      fontWeight: layer.fontWeight ?? "normal",
      fontStyle: layer.fontStyle ?? "normal",
      textAlign: layer.textAlign ?? "left",
      angle: layer.angle ?? 0,
      charSpacing: layer.charSpacing ?? 0,
      lineHeight: layer.lineHeight ?? 1.16,
      underline: layer.underline ?? false,
      stroke: layer.stroke ?? null,
      strokeWidth: layer.strokeWidth ?? 0,
      text: layer.text,
      // Marca para que el editor identifique este objeto por su id semántico
      customId: layer.id,
    };
  }
  if (layer.type === "image") {
    return {
      type: "image",
      version: "6.0.0",
      left: layer.x ?? 0,
      top: layer.y ?? 0,
      scaleX: layer.scaleX ?? 1,
      scaleY: layer.scaleY ?? 1,
      opacity: layer.opacity ?? 1,
      angle: layer.angle ?? 0,
      src: layer.src,
      // crossOrigin para que Fabric pueda manipular sin tainted canvas
      crossOrigin: "anonymous",
      cropX: layer.cropX ?? 0,
      cropY: layer.cropY ?? 0,
      // En Fabric el crop también requiere width/height (no cropWidth)
      // pero al cargar desde JSON se respetan las props nativas.
      customId: layer.id,
    };
  }
  if (layer.type === "shape") {
    const common = {
      version: "6.0.0",
      left: layer.x,
      top: layer.y,
      fill: layer.fill,
      opacity: layer.opacity ?? 1,
      angle: layer.angle ?? 0,
      stroke: layer.stroke ?? null,
      strokeWidth: layer.strokeWidth ?? 0,
      strokeDashArray: layer.strokeDashArray ?? null,
      customId: layer.id,
    };
    if (layer.shape === "rect") {
      return {
        ...common,
        type: "rect",
        width: layer.width,
        height: layer.height,
        rx: layer.radius ?? 0,
        ry: layer.radius ?? 0,
      };
    }
    if (layer.shape === "circle") {
      return {
        ...common,
        type: "circle",
        radius: layer.width / 2,
      };
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    if (!body?.layers || !Array.isArray(body.layers)) {
      return NextResponse.json({ error: "layers obligatorio" }, { status: 400 });
    }
    if (!body.width || !body.height) {
      return NextResponse.json({ error: "width/height obligatorios" }, { status: 400 });
    }

    const title = (body.title || "Mi flyer mágico").slice(0, 120);

    // Construir el fabric_json que el editor cargará
    const objects = body.layers
      .map(layerToFabricObject)
      .filter((o) => o !== null);

    const fabricJson = {
      version: "6.0.0",
      objects,
      width: body.width,
      height: body.height,
      background: "#ffffff",
    };

    // Crear el proyecto en Supabase. templateId 0 = "custom magic layers"
    // (no usa plantilla predefinida, viene de upload del usuario).
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
