import { NextRequest, NextResponse } from "next/server";
import type { EventData } from "@/app/api/chat-wizard/route";

export const runtime = "nodejs";
export const maxDuration = 60;

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type TextLayer = {
  id: string;
  role: "eventTitle" | "mainArtist" | "additionalArtists" | "date" | "time" | "venue" | "city" | "price" | "cta" | "label";
  content: string;
  style: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    textAlign: "left" | "center" | "right";
    letterSpacing?: number;
    textTransform?: "uppercase" | "lowercase" | "none";
    opacity?: number;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height?: number;
    originX: "left" | "center" | "right";
    originY: "top" | "center" | "bottom";
  };
};

export type ArtistCutout = {
  id: string;
  artistName: string;
  isMainArtist: boolean;
  originalUrl: string | null;
  cutoutUrl: string | null;
  order: number;
};

export type LayoutVariant = {
  id: string;
  label: string;
  description: string;
  artistPositions: Array<{
    artistId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    scaleX?: number;
    scaleY?: number;
  }>;
};

export type FlyerAssets = {
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  textLayers: TextLayer[];
  artistCutouts: ArtistCutout[];
  layoutVariants: LayoutVariant[];
  palette: { id: string; colors: string[]; label: string };
  eventData: EventData;
  format: string;
  style: string;
};

// ─── FORMAT DIMENSIONS ────────────────────────────────────────────────────────

const FORMAT_DIMS: Record<string, { w: number; h: number }> = {
  instagram: { w: 1080, h: 1350 },
  historia:  { w: 1080, h: 1920 },
  cuadrado:  { w: 1080, h: 1080 },
  evento:    { w: 1920, h: 1080 },
};

// ─── BUILD BACKGROUND PROMPT ──────────────────────────────────────────────────

function buildBackgroundPrompt(eventData: EventData, style: string, palette: { colors: string[] }): string {
  const typeMap: Record<string, string> = {
    concierto: "live concert energy, stage lights, crowd atmosphere",
    concert:   "live concert energy, stage lights, crowd atmosphere",
    festival:  "outdoor festival, vibrant crowd, colorful stage",
    fiesta:    "nightclub party atmosphere, dance floor, colorful lights",
    party:     "nightclub party atmosphere, dance floor, colorful lights",
    brunch:    "tropical brunch setting, natural light, floral elements",
    rave:      "underground rave, neon laser beams, dark atmosphere",
    electronica: "electronic music scene, neon lights, abstract patterns",
    electronic: "electronic music scene, neon lights, abstract patterns",
    reggaeton: "urban Latin night, neon city lights, energetic atmosphere",
    salsa:     "vibrant Latin ballroom, warm colors, tropical energy",
    jazz:      "moody jazz club, warm amber lighting, sophisticated",
    corporate: "modern professional conference, clean minimal design",
  };

  const styleMap: Record<string, string> = {
    urbano:   "urban street photography aesthetic, dark moody tones, city lights bokeh",
    elegante: "luxury high-end editorial look, gold accents, sophisticated minimalism",
    neon:     "cyberpunk neon glow, electric blues and magentas, dark background",
    festival: "colorful psychedelic festival, vibrant saturated colors",
    minima:   "clean minimalist design, lots of negative space, simple geometry",
    retro:    "vintage 80s/90s aesthetic, grainy texture, retro color palette",
    tropical: "tropical paradise, lush greens, warm sunset tones",
  };

  const eventTypeKey = (eventData.eventType ?? "").toLowerCase();
  const typeDesc = Object.entries(typeMap).find(([k]) => eventTypeKey.includes(k))?.[1]
    ?? "event venue atmosphere";
  const styleDesc = styleMap[style] ?? styleMap.urbano;

  const colorHints = palette.colors.slice(0, 2).join(", ");

  return [
    `Professional event flyer background. ${typeDesc}. ${styleDesc}.`,
    `Color palette inspired by: ${colorHints}.`,
    `Highly detailed, cinematic, commercial photography quality.`,
    `IMPORTANT: Do not include any text, letters, numbers, typography, logos, names, dates, prices, or readable symbols of any kind.`,
    `Do not write anything. Pure visual background only.`,
    `The image will have text and people added on top as separate layers.`,
  ].join(" ");
}

// ─── BUILD TEXT LAYERS ────────────────────────────────────────────────────────

function buildTextLayers(
  eventData: EventData,
  format: string,
  palette: { colors: string[] },
  style: string
): TextLayer[] {
  const dims = FORMAT_DIMS[format] ?? FORMAT_DIMS.instagram;
  const W = dims.w;
  const H = dims.h;
  const layers: TextLayer[] = [];

  // Color assignments
  const primary = palette.colors[0] ?? "#ffffff";
  const secondary = palette.colors[1] ?? "#cccccc";
  const accent = palette.colors[2] ?? "#0d0d1a";

  const isLandscape = W > H;
  const centerX = W / 2;

  // Layout zones (portrait default)
  const titleY = isLandscape ? H * 0.15 : H * 0.08;
  const artistY = isLandscape ? H * 0.4 : H * 0.55;
  const infoY   = isLandscape ? H * 0.72 : H * 0.82;

  // 1. Event title
  if (eventData.eventName) {
    layers.push({
      id: "eventTitle",
      role: "eventTitle",
      content: eventData.eventName.toUpperCase(),
      style: {
        fontFamily: style === "elegante" ? "Playfair Display" : style === "retro" ? "Bebas Neue" : "Montserrat",
        fontSize: isLandscape ? 90 : 80,
        fontWeight: "900",
        color: primary,
        textAlign: "center",
        letterSpacing: 4,
        textTransform: "uppercase",
      },
      position: {
        x: centerX, y: titleY,
        width: W * 0.85,
        originX: "center", originY: "top",
      },
    });
  }

  // 2. Event type label
  if (eventData.eventType) {
    layers.push({
      id: "eventType",
      role: "label",
      content: eventData.eventType.toUpperCase(),
      style: {
        fontFamily: "Montserrat",
        fontSize: 22,
        fontWeight: "600",
        color: secondary,
        textAlign: "center",
        letterSpacing: 8,
        textTransform: "uppercase",
        opacity: 0.85,
      },
      position: {
        x: centerX, y: titleY + (isLandscape ? 110 : 100),
        width: W * 0.7,
        originX: "center", originY: "top",
      },
    });
  }

  // 3. Main artist
  if (eventData.mainArtist) {
    layers.push({
      id: "mainArtist",
      role: "mainArtist",
      content: eventData.mainArtist.toUpperCase(),
      style: {
        fontFamily: style === "elegante" ? "Playfair Display" : "Montserrat",
        fontSize: isLandscape ? 70 : 64,
        fontWeight: "800",
        color: primary,
        textAlign: "center",
        letterSpacing: 2,
        textTransform: "uppercase",
      },
      position: {
        x: centerX, y: artistY,
        width: W * 0.8,
        originX: "center", originY: "top",
      },
    });
  }

  // 4. Additional artists
  if (eventData.additionalArtists.length > 0) {
    const additionalY = eventData.mainArtist
      ? artistY + (isLandscape ? 90 : 80)
      : artistY;
    layers.push({
      id: "additionalArtists",
      role: "additionalArtists",
      content: eventData.additionalArtists.join("  ·  ").toUpperCase(),
      style: {
        fontFamily: "Montserrat",
        fontSize: 28,
        fontWeight: "600",
        color: secondary,
        textAlign: "center",
        letterSpacing: 4,
        textTransform: "uppercase",
        opacity: 0.9,
      },
      position: {
        x: centerX, y: additionalY,
        width: W * 0.75,
        originX: "center", originY: "top",
      },
    });
  }

  // 5. Date + time combined
  const dateParts = [eventData.date, eventData.time].filter(Boolean);
  if (dateParts.length > 0) {
    layers.push({
      id: "dateTime",
      role: "date",
      content: dateParts.join("  ·  ").toUpperCase(),
      style: {
        fontFamily: "Montserrat",
        fontSize: 26,
        fontWeight: "700",
        color: primary,
        textAlign: "center",
        letterSpacing: 3,
        opacity: 0.95,
      },
      position: {
        x: centerX, y: infoY,
        width: W * 0.8,
        originX: "center", originY: "top",
      },
    });
  }

  // 6. Venue + city
  const venueParts = [eventData.venue, eventData.city].filter(Boolean);
  if (venueParts.length > 0) {
    layers.push({
      id: "venue",
      role: "venue",
      content: venueParts.join(", ").toUpperCase(),
      style: {
        fontFamily: "Montserrat",
        fontSize: 22,
        fontWeight: "500",
        color: secondary,
        textAlign: "center",
        letterSpacing: 2,
        opacity: 0.85,
      },
      position: {
        x: centerX, y: infoY + 50,
        width: W * 0.75,
        originX: "center", originY: "top",
      },
    });
  }

  // 7. Price / Free entry badge
  if (eventData.price || eventData.isFree) {
    const priceText = eventData.isFree ? "ENTRADA LIBRE" : (eventData.price ?? "").toUpperCase();
    layers.push({
      id: "price",
      role: "price",
      content: priceText,
      style: {
        fontFamily: "Montserrat",
        fontSize: 20,
        fontWeight: "700",
        color: accent,
        textAlign: "center",
        letterSpacing: 2,
      },
      position: {
        x: centerX, y: infoY + 95,
        width: W * 0.5,
        originX: "center", originY: "top",
      },
    });
  }

  return layers;
}

// ─── BUILD LAYOUT VARIANTS ────────────────────────────────────────────────────

function buildLayoutVariants(
  cutouts: ArtistCutout[],
  format: string
): LayoutVariant[] {
  if (cutouts.length === 0) return [];

  const dims = FORMAT_DIMS[format] ?? FORMAT_DIMS.instagram;
  const W = dims.w;
  const H = dims.h;
  const mainCutout = cutouts.find(c => c.isMainArtist) ?? cutouts[0];
  const secondary = cutouts.filter(c => !c.isMainArtist);

  const variants: LayoutVariant[] = [];

  // Variant 1: Hero center
  variants.push({
    id: "hero-center",
    label: "Héroe centrado",
    description: "Artista principal grande al centro",
    artistPositions: [
      {
        artistId: mainCutout.id,
        x: W * 0.5 - W * 0.35,
        y: H * 0.25,
        width: W * 0.7,
        height: H * 0.55,
        zIndex: 10,
      },
      ...secondary.map((a, i) => ({
        artistId: a.id,
        x: i % 2 === 0 ? W * 0.05 : W * 0.65,
        y: H * 0.35,
        width: W * 0.28,
        height: H * 0.35,
        zIndex: 5,
      })),
    ],
  });

  // Variant 2: Left-aligned hero
  variants.push({
    id: "hero-left",
    label: "Héroe izquierda",
    description: "Artista principal a la izquierda, info a la derecha",
    artistPositions: [
      {
        artistId: mainCutout.id,
        x: W * 0.02,
        y: H * 0.15,
        width: W * 0.48,
        height: H * 0.65,
        zIndex: 10,
      },
      ...secondary.map((a, i) => ({
        artistId: a.id,
        x: W * 0.55 + i * (W * 0.18),
        y: H * 0.42,
        width: W * 0.2,
        height: H * 0.28,
        zIndex: 5,
      })),
    ],
  });

  // Variant 3: Lineup horizontal (for 2+ artists)
  if (cutouts.length >= 2) {
    const slotW = W / cutouts.length;
    variants.push({
      id: "lineup",
      label: "Lineup horizontal",
      description: "Todos los artistas en fila",
      artistPositions: cutouts.map((a, i) => ({
        artistId: a.id,
        x: slotW * i + slotW * 0.05,
        y: H * 0.2,
        width: slotW * 0.88,
        height: H * 0.6,
        zIndex: a.isMainArtist ? 10 : 5,
        scaleX: a.isMainArtist ? 1.15 : 1,
        scaleY: a.isMainArtist ? 1.15 : 1,
      })),
    });
  }

  // Variant 4: Diagonal overlap
  variants.push({
    id: "diagonal",
    label: "Diagonal overlap",
    description: "Composición diagonal con capas superpuestas",
    artistPositions: cutouts.map((a, i) => ({
      artistId: a.id,
      x: W * 0.1 + i * (W * 0.2),
      y: H * 0.15 + i * (H * 0.08),
      width: a.isMainArtist ? W * 0.55 : W * 0.38,
      height: a.isMainArtist ? H * 0.62 : H * 0.45,
      zIndex: cutouts.length - i,
    })),
  });

  return variants;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      eventData: EventData;
      artistPhotos: Array<{ artistName: string; isMainArtist: boolean; dataUrl: string; fileName: string }>;
      style: string;
      palette: { id: string; colors: string[]; label: string };
      format: string;
    };

    const { eventData, artistPhotos = [], style, palette, format } = body;

    const dims = FORMAT_DIMS[format] ?? FORMAT_DIMS.instagram;

    // ── STEP 1: Generate background (NO TEXT in prompt) ───────────────────────
    const bgPrompt = buildBackgroundPrompt(eventData, style, palette);

    let bgUrl = "";
    let bgWidth = dims.w;
    let bgHeight = dims.h;

    try {
      const falKey = process.env.FAL_KEY;
      if (falKey) {
        const falRes = await fetch("https://fal.run/fal-ai/flux/schnell", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Key ${falKey}`,
          },
          body: JSON.stringify({
            prompt: bgPrompt,
            image_size: format === "evento"
              ? { width: 1920, height: 1080 }
              : format === "cuadrado"
              ? { width: 1080, height: 1080 }
              : format === "historia"
              ? { width: 1080, height: 1920 }
              : { width: 1080, height: 1350 },
            num_inference_steps: 4,
            num_images: 1,
            enable_safety_checker: true,
          }),
        });

        if (falRes.ok) {
          const falData = await falRes.json() as { images?: Array<{ url: string; width: number; height: number }> };
          const img = falData.images?.[0];
          if (img) {
            // Upload to R2
            const imgRes = await fetch(img.url);
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const { uploadToR2 } = await import("@/lib/r2");
            bgUrl = await uploadToR2(buf, `backgrounds/${Date.now()}-bg.jpg`, "image/jpeg");
            bgWidth = img.width;
            bgHeight = img.height;
          }
        } else {
          console.error("[generate-assets] Fal error:", await falRes.text());
        }
      }
    } catch (bgErr) {
      console.error("[generate-assets] background generation failed:", bgErr);
    }

    // ── STEP 2: Build text layers (NO image generation, pure data) ─────────────
    const textLayers = buildTextLayers(eventData, format, palette, style);

    // ── STEP 3: Process artist photos (remove background) ─────────────────────
    const artistCutouts: ArtistCutout[] = [];

    const removeBgApiKey = process.env.REMOVE_BG_API_KEY;

    for (let i = 0; i < artistPhotos.length; i++) {
      const photo = artistPhotos[i];
      const cutoutId = `artist-${i}`;

      let cutoutUrl: string | null = null;
      let originalUrl: string | null = null;

      try {
        // Convert dataUrl to buffer
        const [, b64] = photo.dataUrl.split(",");
        const buf = Buffer.from(b64, "base64");

        // Upload original first
        const { uploadToR2 } = await import("@/lib/r2");
        originalUrl = await uploadToR2(buf, `artists/original/${Date.now()}-${i}.png`, "image/png");

        // Try remove.bg
        if (removeBgApiKey) {
          const fd = new FormData();
          const blob = new Blob([buf], { type: "image/png" });
          fd.append("image_file", blob, photo.fileName || "artist.png");
          fd.append("size", "auto");

          const rbRes = await fetch("https://api.remove.bg/v1.0/removebg", {
            method: "POST",
            headers: { "X-Api-Key": removeBgApiKey },
            body: fd,
          });

          if (rbRes.ok) {
            const cutoutBuf = Buffer.from(await rbRes.arrayBuffer());
            cutoutUrl = await uploadToR2(cutoutBuf, `artists/cutout/${Date.now()}-${i}-nobg.png`, "image/png");
          } else {
            const errBody = await rbRes.text();
            console.warn(`[generate-assets] remove.bg ${rbRes.status} for artist ${i}:`, errBody);
            // Fall back to original — non-fatal
            cutoutUrl = originalUrl;
          }
        } else {
          cutoutUrl = originalUrl;
        }
      } catch (err) {
        console.warn(`[generate-assets] artist ${i} processing failed:`, err);
      }

      artistCutouts.push({
        id: cutoutId,
        artistName: photo.artistName,
        isMainArtist: photo.isMainArtist,
        originalUrl,
        cutoutUrl,
        order: i,
      });
    }

    // ── STEP 4: Build layout variants ─────────────────────────────────────────
    const layoutVariants = buildLayoutVariants(artistCutouts, format);

    // ── STEP 5: Assemble and return ────────────────────────────────────────────
    const assets: FlyerAssets = {
      backgroundUrl: bgUrl,
      backgroundWidth: bgWidth,
      backgroundHeight: bgHeight,
      textLayers,
      artistCutouts,
      layoutVariants,
      palette,
      eventData,
      format,
      style,
    };

    return NextResponse.json(assets);
  } catch (err) {
    console.error("[generate-assets] fatal:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
