import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getStyleById } from "@/lib/flyerStyles";
import { getTemplate, SIZE_PX, type FlyerSlot } from "@/lib/flyerTemplates";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/generate-flyer
 *
 * Generador IA editable (Fase X.1): combina Flux para fondo visual + layout
 * pre-diseñado por tipo de evento + estilo + datos del usuario → crea
 * proyecto Supabase con fabric_json __magicLayers compatible con el editor.
 *
 * Diferenciador comercial:
 *   ChatGPT/DALL-E te dan imagen plana. ArteGenIA genera el flyer Y
 *   lo deja editable. Cambia fecha, DJ, precio... sin regenerar.
 *
 * Flow:
 *   1. Auth + cuota check (action: generate_flyer)
 *   2. Flux Schnell genera fondo sin texto usando style.bgPrompt
 *   3. Por cada slot del template, si el user lo llenó → text layer
 *      en la posición fija del template, con fuente/color del estilo
 *   4. Crea proyecto con fabric_json marcado __magicLayers para que
 *      el editor lo cargue con applyTemplateLayers (carga imágenes async)
 *
 * Coste:
 *   - Flux Schnell: $0.003
 *   - Resto: gratis (lógica local)
 *   - Total: ~$0.01/uso
 */

type Body = {
  styleId: string;
  templateType: string;
  info: Record<string, string>;
  width?: number;
  height?: number;
};

const ACTION = "generate_flyer";
// Coste estimado para la action; el contador real de uso queda registrado
// igual en ai_usage para los analytics.
const COST_USD = 0.01;

export async function POST(req: Request) {
  try {
    // ─── 1. AUTH ─────────────────────────────────────────────────────────
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
    }

    // ─── 2. PARSE + VALIDAR ──────────────────────────────────────────────
    const body = (await req.json()) as Body;
    if (!body?.styleId || !body?.templateType || !body?.info) {
      return NextResponse.json(
        { error: "styleId, templateType e info son obligatorios" },
        { status: 400 },
      );
    }
    const style = getStyleById(body.styleId);
    const template = getTemplate(body.templateType);
    if (!style || !template) {
      return NextResponse.json(
        { error: "styleId o templateType no válidos" },
        { status: 400 },
      );
    }
    // Validar campos obligatorios del template
    const missingRequired = template.slots
      .filter((s) => s.required && !(body.info[s.key] ?? "").trim())
      .map((s) => s.label);
    if (missingRequired.length > 0) {
      return NextResponse.json(
        { error: `Faltan campos obligatorios: ${missingRequired.join(", ")}` },
        { status: 400 },
      );
    }

    const width = body.width ?? 1080;
    const height = body.height ?? 1350;

    // ─── 3. CUOTA (~generate_flyer) ──────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles").select("plan").eq("id", user.id).maybeSingle();
    const plan = (profile?.plan as string) ?? "free";
    // Cuotas inline (no en lib/quotas porque no hemos añadido generate_flyer
    // al tipo AIAction todavía — lo haremos después si vemos uso real)
    const quotaLimit = plan === "enterprise" ? 100 : plan === "pro" ? 30 : 2;
    const { data: countData } = await supabase
      .rpc("count_ai_usage_this_month", { p_user_id: user.id, p_action: ACTION });
    const used = typeof countData === "number" ? countData : 0;
    if (used >= quotaLimit) {
      return NextResponse.json(
        {
          error: "Sin cuota mensual de generación. Sube a Pro o Enterprise.",
          feature: "generate-flyer",
          used, limit: quotaLimit, plan,
        },
        { status: 402 },
      );
    }

    // ─── 4. RATE LIMIT anti-burst ────────────────────────────────────────
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const rl = await checkRateLimit(supabase, user.id, "generate-flyer");
    if (rl) return rl;

    // ─── 5. GENERAR FONDO con Flux ───────────────────────────────────────
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json({ error: "FAL_KEY no configurada" }, { status: 503 });
    }
    const t0 = Date.now();
    const falRes = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt: style.bgPrompt,
        image_size: { width, height },
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });
    if (!falRes.ok) {
      const errText = await falRes.text();
      console.error("[generate-flyer] Flux error:", falRes.status, errText);
      return NextResponse.json(
        { error: "Flux no pudo generar el fondo. Inténtalo de nuevo." },
        { status: 502 },
      );
    }
    const falData = await falRes.json() as { images?: Array<{ url: string }> };
    const bgImageUrl = falData.images?.[0]?.url;
    if (!bgImageUrl) {
      return NextResponse.json({ error: "Flux no devolvió imagen" }, { status: 502 });
    }
    const elapsed = Date.now() - t0;

    // ─── 6. CONSTRUIR TemplateLayer[] ────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const layers: any[] = [];

    // Layer 0: fondo generado por Flux.
    // IMPORTANTE: id "bg-magic" (NO "bg-photo") — ver explicación en
    // /api/photo-to-template/route.ts. Canvas dims = imagen dims, no
    // necesitamos re-escalado.
    layers.push({
      id: "bg-magic",
      type: "image",
      src: bgImageUrl,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    });

    // Layers de texto: uno por slot del template (solo si el user lo llenó)
    let textIdx = 0;
    for (const slot of template.slots) {
      const content = (body.info[slot.key] ?? "").trim();
      if (!content) continue; // saltar slots vacíos (opcionales no rellenados)

      const fontFamily = pickFontForSlot(slot, style);
      const color = pickColorForSlot(slot, style);
      const fontSize = SIZE_PX[slot.size];
      const fontWeight = slot.bold ? "bold" : "normal";

      // Posición top-left desde el centro+ancho del slot
      const x = Math.round(slot.x - slot.w / 2);
      const y = slot.y;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer: any = {
        id: `text-${textIdx++}`,
        type: "text",
        text: content,
        x,
        y,
        width: slot.w,
        fontSize,
        fontFamily,
        color,
        fontWeight,
        textAlign: slot.align,
      };

      // Sombra para legibilidad sobre fondos cargados
      if (style.textShadow) {
        layer.shadow = {
          color: "rgba(0,0,0,0.7)",
          blur: 8,
          offsetX: 0,
          offsetY: 2,
        };
      }

      layers.push(layer);
    }

    // ─── 7. CREAR PROYECTO SUPABASE ──────────────────────────────────────
    const titleSlot = template.slots.find((s) => s.key === "title");
    const projectTitle = (titleSlot && body.info[titleSlot.key]) || `Flyer ${template.name}`;
    const fabricJson = {
      __magicLayers: true,
      version: "magic-layers-v1",
      layers,
      width,
      height,
      originalImageUrl: bgImageUrl,
      // Metadata útil para futuras iteraciones (Remix con mismo template)
      generator: {
        styleId: style.id,
        templateType: template.type,
        info: body.info,
      },
    };

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title: projectTitle.slice(0, 120),
        template_id: 0,
        fabric_json: fabricJson,
        format: "custom",
        width,
        height,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[generate-flyer] insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ─── 8. REGISTRAR USO ────────────────────────────────────────────────
    void supabaseAdmin.from("ai_usage").insert({
      user_id: user.id,
      action: ACTION,
      cost_usd: COST_USD,
      meta: {
        elapsed_ms: elapsed,
        style_id: style.id,
        template_type: template.type,
        text_layers: layers.length - 1,
      },
    });

    return NextResponse.json({
      projectId: project.id,
      title: projectTitle,
      bgImageUrl,
      meta: {
        elapsed,
        quota: { used: used + 1, limit: quotaLimit, plan },
      },
    });
  } catch (e) {
    console.error("[generate-flyer]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}

/** Decide qué fuente usar para un slot según su rol y el estilo activo. */
function pickFontForSlot(
  slot: FlyerSlot,
  style: ReturnType<typeof getStyleById> & object,
): string {
  if (slot.role === "title") return style.defaultFonts.title;
  if (slot.role === "subtitle") return style.defaultFonts.subtitle;
  return style.defaultFonts.info;
}

/** Decide el color del texto para un slot según su rol. */
function pickColorForSlot(
  slot: FlyerSlot,
  style: ReturnType<typeof getStyleById> & object,
): string {
  if (slot.role === "title") return style.titleColor;
  if (slot.role === "subtitle") return style.subtitleColor;
  return style.infoColor;
}
