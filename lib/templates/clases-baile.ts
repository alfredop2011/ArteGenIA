/**
 * PLANTILLA: Clases de Baile — Neon Amarillo
 * Estilo: Urban, Bold, Neón
 * Formato: 1080x1350 (Instagram Portrait)
 * 
 * Estructura visual:
 * - Fondo amarillo neón
 * - Banda negra superior con título
 * - Foto artista centrada recortada
 * - Elemento decorativo morado diagonal (esquina derecha)
 * - Banda negra inferior con fecha y lugar
 */

import type { Canvas as FabricCanvas, FabricObject } from "fabric";

export type TemplateData = {
  title?: string;        // "Clases de"
  subtitle?: string;     // "baile" (en amarillo)
  date?: string;         // "13.12.2024"
  venue?: string;        // "CALLE CUALQUIERA 123"
  time?: string;         // "DESDE LAS 17:00"
  artistPhotoUrl?: string | null;
};

export type LayerItem = {
  id: string;
  name: string;
  type: "text" | "image" | "background" | "shape";
  obj: FabricObject;
  visible: boolean;
  locked: boolean;
};

const W = 1080;
const H = 1350;

export async function applyTemplateClasesBaile(
  canvas: FabricCanvas,
  data: TemplateData,
  fabric: typeof import("fabric")
): Promise<LayerItem[]> {
  const layers: LayerItem[] = [];

  // ── 1. FONDO AMARILLO NEÓN ──────────────────────────────────────────────────
  const bg = new fabric.Rect({
    left: 0, top: 0,
    width: W, height: H,
    fill: "#FFE600",
    selectable: false, evented: false,
  });
  (bg as FabricObject & { customId?: string; customRole?: string }).customId = "bg";
  (bg as FabricObject & { customRole?: string }).customRole = "background";
  canvas.add(bg);
  canvas.sendObjectToBack(bg);
  layers.push({ id: "bg", name: "Fondo amarillo", type: "background", obj: bg, visible: true, locked: true });

  // ── 2. ELEMENTO MORADO DIAGONAL (esquina superior derecha) ─────────────────
  const purpleRect = new fabric.Rect({
    left: W * 0.55, top: -80,
    width: 420, height: 520,
    fill: "#7B2FBE",
    angle: 12,
    selectable: true, evented: true,
    opacity: 0.95,
  });
  (purpleRect as FabricObject & { customId?: string }).customId = "deco-purple";
  canvas.add(purpleRect);
  layers.push({ id: "deco-purple", name: "Deco morado", type: "shape", obj: purpleRect, visible: true, locked: false });

  // ── 3. BANDA NEGRA SUPERIOR ─────────────────────────────────────────────────
  const topBand = new fabric.Rect({
    left: 0, top: 0,
    width: W, height: 220,
    fill: "#0D0D0D",
    selectable: false, evented: false,
  });
  (topBand as FabricObject & { customId?: string }).customId = "top-band";
  canvas.add(topBand);
  layers.push({ id: "top-band", name: "Banda superior", type: "shape", obj: topBand, visible: true, locked: true });

  // ── 4. TÍTULO PRINCIPAL (línea 1) ───────────────────────────────────────────
  const titleLine1 = new fabric.IText(data.title?.toUpperCase() ?? "CLASES DE", {
    left: W / 2, top: 48,
    fontFamily: "Anton, Impact, sans-serif",
    fontSize: 112,
    fontWeight: "900",
    fill: "#FFFFFF",
    textAlign: "center",
    originX: "center", originY: "top",
    charSpacing: -10,
    selectable: true, evented: true,
  });
  (titleLine1 as FabricObject & { customId?: string }).customId = "title-line1";
  canvas.add(titleLine1);
  layers.push({ id: "title-line1", name: "Título línea 1", type: "text", obj: titleLine1, visible: true, locked: false });

  // ── 5. SUBTÍTULO (línea 2 — en amarillo neón) ───────────────────────────────
  const titleLine2 = new fabric.IText(data.subtitle?.toUpperCase() ?? "BAILE", {
    left: W / 2, top: 148,
    fontFamily: "Anton, Impact, sans-serif",
    fontSize: 112,
    fontWeight: "900",
    fill: "#FFE600",
    textAlign: "center",
    originX: "center", originY: "top",
    charSpacing: -10,
    selectable: true, evented: true,
  });
  (titleLine2 as FabricObject & { customId?: string }).customId = "title-line2";
  canvas.add(titleLine2);
  layers.push({ id: "title-line2", name: "Título línea 2", type: "text", obj: titleLine2, visible: true, locked: false });

  // ── 6. FOTO ARTISTA ─────────────────────────────────────────────────────────
  if (data.artistPhotoUrl) {
    try {
      const artistImg = await fabric.FabricImage.fromURL(data.artistPhotoUrl, { crossOrigin: "anonymous" });
      const artistH = H * 0.60;
      const artistScale = artistH / (artistImg.height ?? artistH);
      const artistW = (artistImg.width ?? 400) * artistScale;

      artistImg.set({
        left: (W - artistW) / 2,
        top: H * 0.20,
        scaleX: artistScale,
        scaleY: artistScale,
        angle: -3, // ligera inclinación como en el diseño
        selectable: true, evented: true,
      });
      (artistImg as FabricObject & { customId?: string }).customId = "artist";
      canvas.add(artistImg);
      layers.push({ id: "artist", name: "Foto artista", type: "image", obj: artistImg, visible: true, locked: false });
    } catch (e) { console.warn("Artist image error:", e); }
  } else {
    // Placeholder si no hay foto
    const placeholder = new fabric.Rect({
      left: W * 0.25, top: H * 0.22,
      width: W * 0.5, height: H * 0.55,
      fill: "rgba(0,0,0,0.15)",
      rx: 8, ry: 8,
      selectable: true, evented: true,
      strokeDashArray: [10, 5],
      stroke: "rgba(0,0,0,0.3)",
      strokeWidth: 2,
    });
    (placeholder as FabricObject & { customId?: string }).customId = "artist-placeholder";
    canvas.add(placeholder);

    const placeholderText = new fabric.IText("+ Foto artista", {
      left: W / 2, top: H * 0.48,
      fontFamily: "Montserrat, sans-serif",
      fontSize: 32, fill: "rgba(0,0,0,0.4)",
      textAlign: "center", originX: "center", originY: "center",
      selectable: false, evented: false,
    });
    canvas.add(placeholderText);
    layers.push({ id: "artist-placeholder", name: "Foto artista (vacío)", type: "image", obj: placeholder, visible: true, locked: false });
  }

  // ── 7. BANDA NEGRA INFERIOR ─────────────────────────────────────────────────
  const bottomBand = new fabric.Rect({
    left: 0, top: H - 260,
    width: W, height: 260,
    fill: "#0D0D0D",
    selectable: false, evented: false,
  });
  (bottomBand as FabricObject & { customId?: string }).customId = "bottom-band";
  canvas.add(bottomBand);
  layers.push({ id: "bottom-band", name: "Banda inferior", type: "shape", obj: bottomBand, visible: true, locked: true });

  // ── 8. FECHA GRANDE ─────────────────────────────────────────────────────────
  const dateText = new fabric.IText(data.date ?? "00.00.2024", {
    left: W / 2, top: H - 240,
    fontFamily: "Anton, Impact, sans-serif",
    fontSize: 96,
    fontWeight: "900",
    fill: "#FFE600",
    textAlign: "center",
    originX: "center", originY: "top",
    charSpacing: 5,
    selectable: true, evented: true,
  });
  (dateText as FabricObject & { customId?: string }).customId = "date";
  canvas.add(dateText);
  layers.push({ id: "date", name: "Fecha", type: "text", obj: dateText, visible: true, locked: false });

  // ── 9. HORA Y LUGAR ─────────────────────────────────────────────────────────
  const venueText = new fabric.IText(
    [data.time, data.venue].filter(Boolean).join(" | ").toUpperCase() || "HORA | LUGAR",
    {
      left: W / 2, top: H - 128,
      fontFamily: "Montserrat, sans-serif",
      fontSize: 28,
      fontWeight: "600",
      fill: "#FFFFFF",
      textAlign: "center",
      originX: "center", originY: "top",
      charSpacing: 30,
      selectable: true, evented: true,
    }
  );
  (venueText as FabricObject & { customId?: string }).customId = "venue";
  canvas.add(venueText);
  layers.push({ id: "venue", name: "Hora y lugar", type: "text", obj: venueText, visible: true, locked: false });

  canvas.renderAll();
  return layers.reverse(); // top layer first in panel
}

// ── METADATA DE LA PLANTILLA ─────────────────────────────────────────────────

export const TEMPLATE_CLASES_BAILE_META = {
  id: "clases-baile-neon",
  name: "Clases de Baile — Neón",
  category: "clases",
  tags: ["baile", "clases", "academia", "neon", "urbano"],
  thumbnail: "/templates/clases-baile-neon-thumb.jpg",
  defaultData: {
    title: "Clases de",
    subtitle: "Baile",
    date: "00.00.2024",
    time: "DESDE LAS 17:00",
    venue: "CALLE CUALQUIERA 123",
  },
};
