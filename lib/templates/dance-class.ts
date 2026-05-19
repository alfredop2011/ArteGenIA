/**
 * PLANTILLA: Dance Class — Negro & Amarillo
 * Estilo: Urban, Bold, Moderno
 * Formato: 1080x1350 (Instagram Portrait)
 *
 * Estructura visual:
 * - Fondo negro
 * - Patrón rayas amarillas esquina superior derecha
 * - Nombre estudio arriba izquierda en caja amarilla
 * - Título DANCE grande en blanco
 * - Subtítulo CLASS en outline amarillo
 * - Descripción en blanco
 * - Precio + horario en cajas amarillas
 * - Fotos artistas en círculo/óvalo derecha
 * - Flecha decorativa abajo
 */

import type { Canvas as FabricCanvas, FabricObject, IText } from "fabric";

export type DanceClassData = {
  studioName?: string;    // "WARNER & SPENCER"
  titleLine1?: string;    // "DANCE"
  titleLine2?: string;    // "CLASS"
  description?: string;  // "Find freedom in movement..."
  price?: string;         // "$75"
  priceLabel?: string;    // "/ PERSON"
  schedule?: string;      // "EVERY SUNDAY"
  time?: string;          // "9:00 AM"
  website?: string;       // "reallygreatsite.com"
  artistPhotoUrl?: string | null;
  artistPhotoUrl2?: string | null;
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
const YELLOW = "#F5C518";
const BLACK  = "#0D0D0D";
const WHITE  = "#FFFFFF";

export async function applyTemplateDanceClass(
  canvas: FabricCanvas,
  data: DanceClassData,
  fabric: typeof import("fabric")
): Promise<LayerItem[]> {
  const layers: LayerItem[] = [];

  // ── 1. FONDO NEGRO ──────────────────────────────────────────────────────────
  const bg = new fabric.Rect({
    left: 0, top: 0, width: W, height: H,
    fill: BLACK, selectable: false, evented: false,
  });
  (bg as FabricObject & { customId?: string; customRole?: string }).customId = "bg";
  (bg as FabricObject & { customRole?: string }).customRole = "background";
  canvas.add(bg);
  canvas.sendObjectToBack(bg);
  layers.push({ id: "bg", name: "Fondo negro", type: "background", obj: bg, visible: true, locked: true });

  // ── 2. PATRÓN RAYAS DIAGONAL (esquina sup. derecha) ────────────────────────
  // Simulado con rectángulos rotados amarillos
  for (let i = 0; i < 6; i++) {
    const stripe = new fabric.Rect({
      left: W * 0.62 + i * 38, top: -60,
      width: 22, height: 340,
      fill: YELLOW, angle: -15,
      selectable: false, evented: false, opacity: 1,
    });
    canvas.add(stripe);
  }
  // Caja amarilla que contiene las rayas (clip)
  const stripeBox = new fabric.Rect({
    left: W * 0.72, top: 0,
    width: W * 0.28, height: 220,
    fill: "transparent",
    selectable: false, evented: false,
  });
  canvas.add(stripeBox);

  // ── 3. CAJA NOMBRE ESTUDIO (arriba izquierda) ───────────────────────────────
  const studioBg = new fabric.Rect({
    left: 48, top: 52,
    width: 520, height: 56,
    fill: YELLOW, rx: 0, ry: 0,
    selectable: false, evented: false,
  });
  canvas.add(studioBg);

  const studioText = new fabric.IText(data.studioName?.toUpperCase() ?? "NOMBRE DEL ESTUDIO", {
    left: 80, top: 60,
    fontFamily: "Montserrat, sans-serif",
    fontSize: 28, fontWeight: "800",
    fill: BLACK, textAlign: "left",
    charSpacing: 20,
    selectable: true, evented: true,
  });
  (studioText as FabricObject & { customId?: string }).customId = "studio-name";
  canvas.add(studioText);
  layers.push({ id: "studio-name", name: "Nombre estudio", type: "text", obj: studioText, visible: true, locked: false });

  // ── 4. TÍTULO PRINCIPAL "DANCE" ──────────────────────────────────────────────
  const title1 = new fabric.IText(data.titleLine1?.toUpperCase() ?? "DANCE", {
    left: 48, top: 148,
    fontFamily: "Anton, Impact, sans-serif",
    fontSize: 200, fontWeight: "900",
    fill: WHITE, textAlign: "left",
    charSpacing: -8,
    selectable: true, evented: true,
  });
  (title1 as FabricObject & { customId?: string }).customId = "title1";
  canvas.add(title1);
  layers.push({ id: "title1", name: "Título línea 1", type: "text", obj: title1, visible: true, locked: false });

  // ── 5. SUBTÍTULO "CLASS" — outline amarillo ──────────────────────────────────
  const title2 = new fabric.IText(data.titleLine2?.toUpperCase() ?? "CLASS", {
    left: 48, top: 340,
    fontFamily: "Anton, Impact, sans-serif",
    fontSize: 200, fontWeight: "900",
    fill: "transparent",
    stroke: YELLOW,
    strokeWidth: 4,
    textAlign: "left",
    charSpacing: -8,
    selectable: true, evented: true,
  });
  (title2 as FabricObject & { customId?: string }).customId = "title2";
  canvas.add(title2);
  layers.push({ id: "title2", name: "Título línea 2", type: "text", obj: title2, visible: true, locked: false });

  // ── 6. DESCRIPCIÓN ──────────────────────────────────────────────────────────
  const desc = new fabric.IText(
    data.description ?? "Encuentra la libertad en el movimiento\nuniendo nuestra clase de baile.",
    {
      left: 48, top: 580,
      fontFamily: "Montserrat, sans-serif",
      fontSize: 30, fontWeight: "400",
      fill: WHITE, textAlign: "left",
      lineHeight: 1.4,
      width: 480,
      selectable: true, evented: true,
    }
  );
  (desc as FabricObject & { customId?: string }).customId = "description";
  canvas.add(desc);
  layers.push({ id: "description", name: "Descripción", type: "text", obj: desc, visible: true, locked: false });

  // ── 7. CAJA PRECIO ──────────────────────────────────────────────────────────
  const priceBg = new fabric.Rect({
    left: 48, top: 720,
    width: 220, height: 100,
    fill: YELLOW, rx: 0, ry: 0,
    selectable: false, evented: false,
  });
  canvas.add(priceBg);

  const priceText = new fabric.IText(data.price ?? "$75", {
    left: 80, top: 730,
    fontFamily: "Anton, sans-serif",
    fontSize: 52, fontWeight: "900",
    fill: BLACK, textAlign: "left",
    selectable: true, evented: true,
  });
  (priceText as FabricObject & { customId?: string }).customId = "price";
  canvas.add(priceText);
  layers.push({ id: "price", name: "Precio", type: "text", obj: priceText, visible: true, locked: false });

  const priceLabelText = new fabric.IText(data.priceLabel ?? "/ PERSONA", {
    left: 80, top: 790,
    fontFamily: "Montserrat, sans-serif",
    fontSize: 18, fontWeight: "600",
    fill: BLACK, textAlign: "left",
    selectable: true, evented: true,
  });
  (priceLabelText as FabricObject & { customId?: string }).customId = "price-label";
  canvas.add(priceLabelText);
  layers.push({ id: "price-label", name: "Etiqueta precio", type: "text", obj: priceLabelText, visible: true, locked: false });

  // ── 8. CAJA HORARIO ─────────────────────────────────────────────────────────
  const scheduleBg = new fabric.Rect({
    left: 288, top: 720,
    width: 340, height: 100,
    fill: YELLOW, rx: 0, ry: 0,
    selectable: false, evented: false,
  });
  canvas.add(scheduleBg);

  const scheduleText = new fabric.IText(data.schedule?.toUpperCase() ?? "TODOS LOS DOMINGOS", {
    left: 308, top: 728,
    fontFamily: "Montserrat, sans-serif",
    fontSize: 22, fontWeight: "700",
    fill: BLACK, textAlign: "left",
    selectable: true, evented: true,
  });
  (scheduleText as FabricObject & { customId?: string }).customId = "schedule";
  canvas.add(scheduleText);
  layers.push({ id: "schedule", name: "Horario", type: "text", obj: scheduleText, visible: true, locked: false });

  const timeText = new fabric.IText(data.time ?? "9:00 AM", {
    left: 308, top: 762,
    fontFamily: "Anton, sans-serif",
    fontSize: 44, fontWeight: "900",
    fill: BLACK, textAlign: "left",
    selectable: true, evented: true,
  });
  (timeText as FabricObject & { customId?: string }).customId = "time";
  canvas.add(timeText);
  layers.push({ id: "time", name: "Hora", type: "text", obj: timeText, visible: true, locked: false });

  // ── 9. BANDA AMARILLA HORIZONTAL (separador) ─────────────────────────────────
  const separator = new fabric.Rect({
    left: 0, top: 850,
    width: W, height: 8,
    fill: YELLOW,
    selectable: false, evented: false,
  });
  canvas.add(separator);

  // ── 10. WEBSITE / CONTACTO ───────────────────────────────────────────────────
  const websiteText = new fabric.IText(data.website ?? "www.tusitio.com", {
    left: W / 2, top: 890,
    fontFamily: "Montserrat, sans-serif",
    fontSize: 30, fontWeight: "600",
    fill: YELLOW, textAlign: "center",
    originX: "center", originY: "top",
    underline: true,
    selectable: true, evented: true,
  });
  (websiteText as FabricObject & { customId?: string }).customId = "website";
  canvas.add(websiteText);
  layers.push({ id: "website", name: "Contacto/Web", type: "text", obj: websiteText, visible: true, locked: false });

  // ── 11. FLECHA DECORATIVA <<< ────────────────────────────────────────────────
  const arrow = new fabric.IText("<<<", {
    left: W / 2, top: H - 80,
    fontFamily: "Montserrat, sans-serif",
    fontSize: 48, fontWeight: "900",
    fill: YELLOW, textAlign: "center",
    originX: "center", originY: "top",
    selectable: true, evented: true,
  });
  (arrow as FabricObject & { customId?: string }).customId = "arrow-deco";
  canvas.add(arrow);
  layers.push({ id: "arrow-deco", name: "Flecha decorativa", type: "text", obj: arrow, visible: true, locked: false });

  // ── 12. FOTO(S) ARTISTA — óvalo/círculo derecha ───────────────────────────────
  // Foto principal (grande)
  if (data.artistPhotoUrl) {
    try {
      const aImg = await fabric.FabricImage.fromURL(data.artistPhotoUrl, { crossOrigin: "anonymous" });
      const targetH = H * 0.55;
      const sc = targetH / (aImg.height ?? targetH);
      const aw = (aImg.width ?? 400) * sc;
      aImg.set({
        left: W * 0.52,
        top: H * 0.22,
        scaleX: sc, scaleY: sc,
        selectable: true, evented: true,
      });
      (aImg as FabricObject & { customId?: string }).customId = "artist-1";
      canvas.add(aImg);
      layers.push({ id: "artist-1", name: "Artista principal", type: "image", obj: aImg, visible: true, locked: false });
    } catch (e) { console.warn("Artist 1 error:", e); }
  }

  // Foto secundaria (si hay 2 artistas)
  if (data.artistPhotoUrl2) {
    try {
      const aImg2 = await fabric.FabricImage.fromURL(data.artistPhotoUrl2, { crossOrigin: "anonymous" });
      const targetH2 = H * 0.38;
      const sc2 = targetH2 / (aImg2.height ?? targetH2);
      aImg2.set({
        left: W * 0.62,
        top: H * 0.52,
        scaleX: sc2, scaleY: sc2,
        selectable: true, evented: true,
      });
      (aImg2 as FabricObject & { customId?: string }).customId = "artist-2";
      canvas.add(aImg2);
      layers.push({ id: "artist-2", name: "Artista secundario", type: "image", obj: aImg2, visible: true, locked: false });
    } catch (e) { console.warn("Artist 2 error:", e); }
  }

  // Círculo decorativo amarillo detrás de las fotos
  const circle = new fabric.Circle({
    left: W * 0.42, top: H * 0.28,
    radius: 320,
    fill: "transparent",
    stroke: YELLOW,
    strokeWidth: 6,
    selectable: false, evented: false,
  });
  canvas.add(circle);
  canvas.sendObjectBackwards(circle);

  canvas.renderAll();
  void (desc as IText);
  return layers.reverse();
}

// ── METADATA ─────────────────────────────────────────────────────────────────

export const TEMPLATE_DANCE_CLASS_META = {
  id: "dance-class-black-yellow",
  name: "Dance Class — Negro & Amarillo",
  category: "clases",
  tags: ["baile", "clases", "academia", "moderno", "negro", "amarillo"],
  thumbnail: "/templates/dance-class-black-yellow-thumb.jpg",
  defaultData: {
    studioName: "Nombre del Estudio",
    titleLine1: "DANCE",
    titleLine2: "CLASS",
    description: "Encuentra la libertad en el movimiento\nUnete a nuestra clase de baile.",
    price: "$75",
    priceLabel: "/ PERSONA",
    schedule: "TODOS LOS DOMINGOS",
    time: "9:00 AM",
    website: "www.tusitio.com",
  },
};
