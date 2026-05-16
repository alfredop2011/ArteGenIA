import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// FORMAT DIMENSIONS
const FORMAT_DIMS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1350 },
  historia:  { width: 1080, height: 1920 },
  cuadrado:  { width: 1080, height: 1080 },
  evento:    { width: 1920, height: 1080 },
};

// STYLE DESCRIPTORS — pure visual, no text
const STYLE_DESCRIPTORS: Record<string, string> = {
  urbano:   "urban nightclub atmosphere, dark moody city lights, bokeh street photography, cinematic shadows",
  elegante: "luxury high-end editorial, gold accents, sophisticated dark minimalism, velvet textures",
  neon:     "cyberpunk neon glow, electric magenta and cyan light streaks, dark background, rain reflections",
  festival: "outdoor festival energy, colorful light beams, vibrant crowd bokeh, psychedelic atmosphere",
  minima:   "clean minimalist abstract, geometric shapes, subtle gradient, lots of negative space",
  retro:    "vintage 80s aesthetic, grainy film texture, retro color grading, analog warmth",
  tropical: "tropical paradise mood, lush foliage bokeh, warm sunset tones, golden hour light",
};

// EVENT TYPE DESCRIPTORS — atmosphere only, never shows text
const EVENT_DESCRIPTORS: Record<string, string> = {
  concierto:   "live concert stage atmosphere, dramatic spotlights, fog machine effects, crowd silhouettes",
  concert:     "live concert stage atmosphere, dramatic spotlights, fog machine effects, crowd silhouettes",
  festival:    "outdoor music festival, colorful stage lighting, aerial view of crowd, vibrant energy",
  fiesta:      "nightclub dance floor, colorful disco lights, abstract bokeh, energetic atmosphere",
  party:       "nightclub dance floor, colorful disco lights, abstract bokeh, energetic atmosphere",
  brunch:      "bright airy brunch setting, natural window light, floral arrangements, lifestyle photography",
  rave:        "underground rave, laser beams, dark warehouse, strobe light effects",
  electronica: "electronic music club, LED light show, abstract geometric patterns, futuristic atmosphere",
  electronic:  "electronic music club, LED light show, abstract geometric patterns, futuristic atmosphere",
  reggaeton:   "Latin urban nightlife, warm neon city streets, tropical Miami vibes, vibrant colors",
  salsa:       "warm tropical Latin ballroom, amber stage lighting, elegant atmosphere, rich warm tones",
  jazz:        "moody jazz club, warm amber lighting, brick walls, sophisticated intimate atmosphere",
  cumbia:      "colorful Latin fiesta, warm tropical colors, festive folk atmosphere, vibrant energy",
  corporate:   "modern conference hall, clean professional lighting, contemporary architecture, minimal",
  gala:        "black tie gala, crystal chandeliers, elegant ballroom, sophisticated evening atmosphere",
};

function buildBackgroundPrompt(
  eventType: string,
  style: string,
  palette: { colors: string[] }
): string {
  const styleKey = style?.toLowerCase() ?? "urbano";
  const typeKey = (eventType ?? "").toLowerCase();

  const styleDesc = STYLE_DESCRIPTORS[styleKey] ?? STYLE_DESCRIPTORS.urbano;
  const typeDesc = Object.entries(EVENT_DESCRIPTORS).find(([k]) => typeKey.includes(k))?.[1]
    ?? "event venue atmosphere, dramatic lighting, abstract background";

  const colorHint = palette.colors.slice(0, 2).join(" and ");

  // CRITICAL: This prompt MUST NOT produce any text in the image
  return [
    `Professional event flyer background image. ${typeDesc}. ${styleDesc}.`,
    `Color palette inspired by ${colorHint} tones.`,
    `High quality, cinematic, commercial photography or digital art style.`,
    `STRICT RULE: Do NOT include any text, letters, numbers, words, typography, logos, signs, labels, captions, watermarks, dates, prices, names, or any readable symbols whatsoever.`,
    `Do NOT write anything. The image must be completely free of text.`,
    `Pure visual background only. No text elements of any kind.`,
    `This image will have text and people composited on top as separate layers.`,
  ].join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      // Accept both old (prompt) and new (eventType) API shapes
      prompt?: string;
      eventType?: string;
      style?: string;
      palette?: { id?: string; colors: string[]; label?: string };
      format?: string;
    };

    const { eventType, prompt, style = "urbano", palette, format = "instagram" } = body;

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });
    }

    // Determine event type from eventType field OR extract from old prompt field
    // IMPORTANT: we NEVER put event-specific text (name, date, venue, price) into the image prompt
    let resolvedEventType = eventType ?? "";

    // If using old API shape with a prompt, extract just the event TYPE keywords
    // and discard any event-specific text (names, dates, venues, prices)
    if (!resolvedEventType && prompt) {
      const typeKeywords = ["concierto", "concert", "festival", "fiesta", "party", "brunch",
        "rave", "electronica", "electronic", "reggaeton", "salsa", "jazz", "cumbia", "corporate", "gala"];
      resolvedEventType = typeKeywords.find(k => prompt.toLowerCase().includes(k)) ?? "event";
    }

    const paletteObj = palette ?? { colors: ["#7c3aed", "#f5c518", "#0d0d1a"] };
    const bgPrompt = buildBackgroundPrompt(resolvedEventType, style, paletteObj);

    const dims = FORMAT_DIMS[format] ?? FORMAT_DIMS.instagram;

    console.log("[generate-bg] prompt:", bgPrompt.slice(0, 200));

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
      const errText = await falRes.text();
      console.error("[generate-bg] Fal.ai error:", errText);
      return NextResponse.json({ error: `Fal.ai ${falRes.status}` }, { status: 502 });
    }

    const falData = await falRes.json() as { images?: Array<{ url: string; width: number; height: number }> };
    const img = falData.images?.[0];
    if (!img) {
      return NextResponse.json({ error: "No image returned from Fal.ai" }, { status: 502 });
    }

    // Download and upload to R2 for persistence (Fal URLs expire)
    try {
      const imgRes = await fetch(img.url);
      if (!imgRes.ok) throw new Error("Failed to download from Fal");
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const { uploadToR2 } = await import("@/lib/r2");
      const key = `backgrounds/${Date.now()}-bg.jpg`;
      const persistentUrl = await uploadToR2(buf, key, "image/jpeg");
      return NextResponse.json({ url: persistentUrl, width: img.width, height: img.height });
    } catch (r2Err) {
      console.warn("[generate-bg] R2 upload failed, returning Fal URL:", r2Err);
      // Fallback: return Fal URL directly (will expire)
      return NextResponse.json({ url: img.url, width: img.width, height: img.height });
    }

  } catch (err) {
    console.error("[generate-bg] fatal:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
