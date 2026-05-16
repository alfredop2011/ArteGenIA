import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const FORMAT_DIMS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1350 },
  historia:  { width: 1080, height: 1920 },
  cuadrado:  { width: 1080, height: 1080 },
  evento:    { width: 1920, height: 1080 },
};

const STYLE_DESC: Record<string, string> = {
  urbano:   "urban nightclub atmosphere, dark moody city lights, bokeh street photography, cinematic shadows",
  elegante: "luxury high-end editorial, gold accents, sophisticated dark minimalism, velvet textures",
  neon:     "cyberpunk neon glow, electric magenta and cyan light streaks, dark background, rain reflections",
  festival: "outdoor festival energy, colorful light beams, vibrant crowd bokeh, psychedelic atmosphere",
  minima:   "clean minimalist abstract, geometric shapes, subtle gradient, lots of negative space",
  retro:    "vintage 80s aesthetic, grainy film texture, retro color grading, analog warmth",
  tropical: "tropical paradise mood, lush foliage bokeh, warm sunset tones, golden hour light",
};

const EVENT_DESC: Record<string, string> = {
  concierto:   "live concert stage atmosphere, dramatic spotlights, fog machine effects, crowd silhouettes",
  concert:     "live concert stage atmosphere, dramatic spotlights, fog machine effects",
  festival:    "outdoor music festival, colorful stage lighting, aerial crowd view, vibrant energy",
  fiesta:      "nightclub dance floor, colorful disco lights, abstract bokeh, energetic atmosphere",
  party:       "nightclub dance floor, colorful disco lights, abstract bokeh, energetic atmosphere",
  brunch:      "bright airy setting, natural window light, floral arrangements, lifestyle photography",
  rave:        "underground rave, laser beams, dark warehouse, strobe light effects",
  electronica: "electronic music club, LED light show, abstract geometric patterns, futuristic atmosphere",
  electronic:  "electronic music club, LED light show, abstract geometric patterns, futuristic atmosphere",
  reggaeton:   "Latin urban nightlife, warm neon city streets, tropical Miami vibes, vibrant colors",
  salsa:       "warm tropical Latin ballroom, amber stage lighting, elegant atmosphere, rich warm tones",
  jazz:        "moody jazz club, warm amber lighting, brick walls, sophisticated intimate atmosphere",
  cumbia:      "colorful Latin fiesta, warm tropical colors, festive folk atmosphere, vibrant energy",
  corporate:   "modern conference hall, clean professional lighting, contemporary architecture",
  gala:        "black tie gala, crystal chandeliers, elegant ballroom, sophisticated evening atmosphere",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      eventType?: string;
      style?: string;
      palette?: { colors: string[] };
      format?: string;
      // legacy fields — ignored for prompt building
      prompt?: string;
      eventName?: string;
    };

    const { eventType = "", style = "urbano", palette, format = "instagram" } = body;

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });
    }

    const styleKey = style.toLowerCase();
    const typeKey = eventType.toLowerCase();

    const styleDesc = STYLE_DESC[styleKey] ?? STYLE_DESC.urbano;
    const typeDesc = Object.entries(EVENT_DESC).find(([k]) => typeKey.includes(k))?.[1]
      ?? "event venue atmosphere, dramatic stage lighting, abstract background";

    const colorHint = (palette?.colors ?? ["#7c3aed", "#f5c518"]).slice(0, 2).join(" and ");

    // ══ CRITICAL: NO TEXT IN THE IMAGE ══════════════════════════════════════
    // This prompt intentionally omits ALL event data (name, date, venue, price).
    // Text is added as editable layers in the editor — NEVER baked into the image.
    const bgPrompt = [
      `Professional event flyer background. ${typeDesc}. ${styleDesc}.`,
      `Color palette inspired by ${colorHint} tones.`,
      `High quality cinematic digital art, commercial photography style.`,
      `ABSOLUTE RULE: zero text, zero letters, zero numbers, zero words, zero typography,`,
      `zero logos, zero signs, zero labels, zero dates, zero prices, zero names.`,
      `Completely text-free background image. No written content whatsoever.`,
      `Pure atmospheric visual only. Text will be added as separate editable layers later.`,
    ].join(" ");

    const dims = FORMAT_DIMS[format] ?? FORMAT_DIMS.instagram;

    console.log("[generate-bg] NO-TEXT prompt:", bgPrompt.slice(0, 150));

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

    // Upload to R2 for persistence (Fal URLs expire)
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
