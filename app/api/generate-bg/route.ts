import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const FORMAT_DIMS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1350 },
  historia:  { width: 1080, height: 1920 },
  cuadrado:  { width: 1080, height: 1080 },
  evento:    { width: 1920, height: 1080 },
};

function buildPrompt(backgroundDescription: string | undefined, eventType: string): string {
  // If user provided a natural language background description, use it directly
  const baseDesc = backgroundDescription?.trim()
    ? backgroundDescription.trim()
    : getDefaultAtmosphere(eventType);

  // Append strict no-text rule
  return [
    `Professional event flyer background image. ${baseDesc}.`,
    `High quality, cinematic, commercial photography or digital art style.`,
    `ABSOLUTE RULE: Do not include any text, letters, numbers, words, typography, logos,`,
    `signs, labels, dates, prices, names, or any readable symbols whatsoever.`,
    `Completely text-free background image. No written content of any kind.`,
    `Pure atmospheric visual background only. Text will be added as separate editable layers.`,
  ].join(" ");
}

function getDefaultAtmosphere(eventType: string): string {
  const type = (eventType ?? "").toLowerCase();
  const map: Record<string, string> = {
    concierto:   "live concert stage atmosphere, dramatic spotlights, fog machine effects, crowd silhouettes",
    concert:     "live concert stage atmosphere, dramatic spotlights, fog machine effects",
    festival:    "outdoor music festival, colorful stage lighting, vibrant crowd energy",
    fiesta:      "nightclub dance floor, colorful disco lights, abstract bokeh, energetic atmosphere",
    party:       "nightclub dance floor, colorful disco lights, abstract bokeh, energetic atmosphere",
    brunch:      "bright airy brunch setting, natural window light, floral arrangements",
    rave:        "underground rave, laser beams, dark warehouse, strobe light effects",
    electronica: "electronic music club, LED light show, abstract geometric patterns, futuristic",
    electronic:  "electronic music club, LED light show, abstract geometric patterns, futuristic",
    reggaeton:   "Latin urban nightlife, warm neon city streets, tropical Miami vibes",
    salsa:       "warm tropical Latin ballroom, amber stage lighting, elegant atmosphere",
    jazz:        "moody jazz club, warm amber lighting, brick walls, sophisticated atmosphere",
    cumbia:      "colorful Latin fiesta, warm tropical colors, festive folk atmosphere",
    corporate:   "modern conference hall, clean professional lighting, contemporary architecture",
    gala:        "black tie gala, crystal chandeliers, elegant ballroom, sophisticated evening",
  };
  return Object.entries(map).find(([k]) => type.includes(k))?.[1]
    ?? "event venue atmosphere, dramatic cinematic lighting, abstract modern background";
}

export async function POST(req: NextRequest) {
  console.log("[generate-bg] called, FAL_KEY exists:", !!process.env.FAL_KEY);
  try {
    // ─── AUTH + RATE LIMIT ──────────────────────────────────────────────
    // V8: este endpoint NO tenia auth → cualquiera podia llamarlo y vaciar
    // Fal.ai. Ahora exige sesion y aplica rate limit (10/min por user).
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion para usar esta funcion" }, { status: 401 });
    }
    const limitRes = await checkRateLimit(supabase, user.id, "generate-bg");
    if (limitRes) return limitRes;

    const body = await req.json() as {
      backgroundDescription?: string;
      eventType?: string;
      format?: string;
      // legacy fields kept for backwards compat
      style?: string;
      palette?: { colors: string[] };
      prompt?: string;
    };

    const {
      backgroundDescription,
      eventType = "",
      format = "instagram",
    } = body;

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });
    }

    const bgPrompt = buildPrompt(backgroundDescription, eventType);
    const dims = FORMAT_DIMS[format] ?? FORMAT_DIMS.instagram;

    console.log("[generate-bg] prompt:", bgPrompt.slice(0, 160));

    const falRes = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt: bgPrompt,
        image_size: { width: dims.width, height: dims.height },
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!falRes.ok) {
      const err = await falRes.text();
      console.error("[generate-bg] Fal error:", err);
      return NextResponse.json({ error: `Fal.ai ${falRes.status}` }, { status: 502 });
    }

    const falData = await falRes.json() as { images?: Array<{ url: string; width: number; height: number }> };
    const img = falData.images?.[0];
    if (!img) {
      return NextResponse.json({ error: "No image from Fal.ai" }, { status: 502 });
    }

    // Upload to R2 for persistence
    try {
      const { uploadToR2 } = await import("@/lib/r2");
      const imgBuf = Buffer.from(await (await fetch(img.url)).arrayBuffer());
      const { url } = await uploadToR2(imgBuf, `backgrounds/${Date.now()}-bg.jpg`, "image/jpeg");
      return NextResponse.json({ url, width: img.width, height: img.height });
    } catch (r2Err) {
      console.warn("[generate-bg] R2 upload failed, using Fal URL:", r2Err);
      return NextResponse.json({ url: img.url, width: img.width, height: img.height });
    }

  } catch (err) {
    console.error("[generate-bg] fatal:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
