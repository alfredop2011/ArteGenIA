import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60; // flux/dev needs more time

const FORMAT_DIMS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1350 },
  historia:  { width: 1080, height: 1920 },
  cuadrado:  { width: 1080, height: 1080 },
  evento:    { width: 1920, height: 1080 },
};

// ─── NEGATIVE PROMPT ──────────────────────────────────────────────────────────
// Used with models that support negative_prompt parameter
// This is the most effective way to prevent text generation
const NEGATIVE_PROMPT = [
  "text, letters, words, typography, fonts, writing, handwriting, calligraphy,",
  "numbers, digits, symbols, signs, labels, captions, titles, subtitles,",
  "watermarks, logos, badges, icons with text, poster text, event name,",
  "artist name, date, price, venue name, readable text, unreadable text,",
  "fake text, distorted text, blurry text, overlaid text, neon signs with letters,",
  "street signs, billboards with text, marquee signs, graffiti, tags,",
  "people, faces, persons, humans, artists, singers, crowd, audience,",
  "silhouettes of people, portrait, close-up face.",
].join(" ");

// ─── TEMPLATE STYLE ───────────────────────────────────────────────────────────
const TEMPLATE_STYLE = [
  "premium event flyer background,",
  "dramatic stage lighting, rich atmospheric color gradients,",
  "cinematic depth of field, professional commercial photography quality,",
  "high-end nightclub or concert poster aesthetic,",
  "strong color contrast, vivid saturated tones, poster-worthy composition.",
].join(" ");

// ─── EVENT PRESETS ────────────────────────────────────────────────────────────
// Focused on VISUAL ELEMENTS ONLY — no references to text, names, or events
const EVENT_PRESETS: Record<string, string> = {
  salsa:       "warm tropical nightclub interior, amber and golden stage lights reflecting on polished dance floor, lush palm leaf silhouettes, deep warm reds and golds, elegant Latin ballroom atmosphere",
  bachata:     "romantic deep blue and purple nightclub, soft spotlight beams through atmospheric haze, rose gold and indigo tones, intimate luxury Latin club atmosphere",
  reggaeton:   "vibrant Miami-style urban nightclub interior, electric neon pink and cyan light reflections on glossy surfaces, high-energy modern club atmosphere",
  electronica: "futuristic LED light array, deep blue and cyan laser beams cutting through dark space, abstract geometric light patterns, cyberpunk electronic festival energy",
  electronic:  "futuristic LED light array, deep blue and cyan laser beams cutting through dark space, abstract neon geometric patterns, cyberpunk atmosphere",
  festival:    "massive outdoor concert stage lighting rig, rainbow colored light beams across dark sky, pyrotechnic sparks and atmospheric haze, grand festival energy",
  concierto:   "dramatic concert stage, powerful spotlight beams, golden and white light wash, atmospheric smoke haze, grand ornate venue backlighting",
  concert:     "dramatic concert stage, powerful spotlight beams, golden and white light wash, atmospheric smoke haze, grand ornate venue backlighting",
  brunch:      "luxury tropical outdoor brunch venue, soft golden morning light filtering through palm leaves, lush botanical garden, warm pastel tones, upscale lifestyle",
  fiesta:      "luxury event space, dramatic golden string lights and floral arrangements on ceiling, deep jewel tones, emerald and gold, elegant celebratory atmosphere",
  party:       "premium nightclub, dynamic multicolored light beams, mirror ball reflections on dark surfaces, electric purples and pinks, high-end club aesthetic",
  gala:        "opulent ballroom, crystal chandeliers, rich black and gold color palette, elegant formal venue, sophisticated ambient lighting",
  corporate:   "modern professional conference venue, clean architectural lighting, cool blues and whites, minimal sophisticated business aesthetic",
  jazz:        "moody intimate jazz club, warm amber spotlights, rich wood textures, vintage brick walls, deep warm shadows, sophisticated noir aesthetic",
  cumbia:      "vibrant tropical Latin venue, bright warm yellows and oranges, festive atmospheric lighting, joyful energetic Latin event mood",
  rave:        "underground venue, intense laser grid through pitch black space, electric neon greens and ultraviolet tones, dark industrial warehouse atmosphere",
  tropical:    "luxury tropical outdoor event, golden sunset over turquoise water, lush palm fronds, premium beach club, warm rich tones",
};

// ─── BUILD PROMPT ─────────────────────────────────────────────────────────────

function buildPrompt(bgDesc: string | undefined, eventType: string): string {
  const typeKey = (eventType ?? "").toLowerCase();
  const preset = Object.entries(EVENT_PRESETS).find(([k]) => typeKey.includes(k))?.[1]
    ?? EVENT_PRESETS.party;

  let content: string;
  if (bgDesc?.trim()) {
    // Combine user description with event preset for richer context
    content = `${bgDesc.trim()}, ${preset}`;
  } else {
    content = preset;
  }

  // Structure: STYLE + CONTENT + explicit "no text" at the START (more weight)
  // Putting the instruction at the start gives it more weight in diffusion models
  return [
    "Abstract atmospheric background with no text, no letters, no writing, no signs, no people.",
    TEMPLATE_STYLE,
    content + ".",
    "Pure visual atmosphere only, no human figures, no readable or unreadable text of any kind.",
  ].join(" ");
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  console.log("[generate-bg] called, FAL_KEY exists:", !!process.env.FAL_KEY);
  try {
    const body = await req.json() as {
      backgroundDescription?: string;
      eventType?: string;
      format?: string;
      style?: string;
      palette?: { colors: string[] };
      prompt?: string;
    };

    const { backgroundDescription, eventType = "", format = "instagram" } = body;

    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });
    }

    const bgPrompt = buildPrompt(backgroundDescription, eventType);
    const dims = FORMAT_DIMS[format] ?? FORMAT_DIMS.instagram;

    console.log("[generate-bg] prompt:", bgPrompt.slice(0, 200));

    // Try flux/dev first (better instruction following), fallback to schnell
    let imageUrl: string | null = null;
    let imageW = dims.width;
    let imageH = dims.height;

    // Attempt 1: flux/dev with negative prompt
    try {
      const devRes = await fetch("https://fal.run/fal-ai/flux/dev", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Key ${falKey}`,
        },
        body: JSON.stringify({
          prompt: bgPrompt,
          negative_prompt: NEGATIVE_PROMPT,
          image_size: { width: dims.width, height: dims.height },
          num_inference_steps: 20,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
        }),
      });

      if (devRes.ok) {
        const devData = await devRes.json() as { images?: Array<{ url: string; width: number; height: number }> };
        const img = devData.images?.[0];
        if (img?.url) {
          imageUrl = img.url;
          imageW = img.width;
          imageH = img.height;
          console.log("[generate-bg] flux/dev success");
        }
      } else {
        const err = await devRes.text();
        console.warn("[generate-bg] flux/dev failed:", devRes.status, err.slice(0, 200));
      }
    } catch (devErr) {
      console.warn("[generate-bg] flux/dev error:", devErr);
    }

    // Fallback: flux/schnell (faster, less control)
    if (!imageUrl) {
      console.log("[generate-bg] falling back to flux/schnell");
      const schnellRes = await fetch("https://fal.run/fal-ai/flux/schnell", {
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

      if (!schnellRes.ok) {
        const err = await schnellRes.text();
        console.error("[generate-bg] schnell error:", err);
        return NextResponse.json({ error: `Fal.ai ${schnellRes.status}` }, { status: 502 });
      }

      const schnellData = await schnellRes.json() as { images?: Array<{ url: string; width: number; height: number }> };
      const img = schnellData.images?.[0];
      if (!img?.url) {
        return NextResponse.json({ error: "No image from Fal.ai" }, { status: 502 });
      }
      imageUrl = img.url;
      imageW = img.width;
      imageH = img.height;
      console.log("[generate-bg] flux/schnell success (fallback)");
    }

    // Upload to R2
    try {
      const { uploadToR2 } = await import("@/lib/r2");
      const imgBuf = Buffer.from(await (await fetch(imageUrl)).arrayBuffer());
      const { url } = await uploadToR2(imgBuf, `backgrounds/${Date.now()}-bg.jpg`, "image/jpeg");
      return NextResponse.json({ url, width: imageW, height: imageH });
    } catch (r2Err) {
      console.warn("[generate-bg] R2 upload failed, using Fal URL:", r2Err);
      return NextResponse.json({ url: imageUrl, width: imageW, height: imageH });
    }

  } catch (err) {
    console.error("[generate-bg] fatal:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
