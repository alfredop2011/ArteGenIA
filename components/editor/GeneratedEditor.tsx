"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Canvas as FabricCanvas, FabricObject, IText } from "fabric";
import { templates, type Template } from "@/data/templates";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type LayerType = "text" | "image" | "background";

type LayerItem = {
  id: string;
  name: string;
  type: LayerType;
  obj: FabricObject;
  visible: boolean;
  locked: boolean;
};

type TextProps = {
  text: string; fontFamily: string; fontSize: number; fill: string;
  textAlign: string; fontWeight: string; charSpacing: number;
  lineHeight: number; opacity: number; angle: number;
  left: number; top: number; width: number;
  shadow: boolean; shadowColor: string; shadowBlur: number;
};

type ImageProps = {
  opacity: number; angle: number; left: number; top: number;
  width: number; height: number; flipX: boolean; flipY: boolean;
};

type SaveState = "saved" | "saving" | "unsaved";
type LeftTool = "templates" | "elements" | "text" | "photos" | "background" | "layers";

type ArtistData = { name: string; photoUrl: string | null };

type GeneratedData = {
  eventName?: string; eventDate?: string; eventVenue?: string; eventPrice?: string;
  artistPhotoUrl?: string | null;
  artists?: ArtistData[];
  logos?: ArtistData[];
  artistCount?: number;
  bgUrl?: string; bgWidth?: number; bgHeight?: number;
  textLayers?: Array<{
    id: string; role: string; content: string;
    style: { fontFamily: string; fontSize: number; fontWeight: string; color: string; textAlign: string; letterSpacing?: number; opacity?: number };
    position: { x: number; y: number; width: number; originX: string; originY: string };
  }>;
  palette?: { colors: string[]; label: string };
  format?: string; style?: string; mode?: string;
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FONTS = ["Montserrat","Playfair Display","Bebas Neue","Oswald","Raleway","Poppins","Inter","Anton","Roboto Condensed"];

const FORMAT_DIMS: Record<string, { w: number; h: number }> = {
  instagram: { w: 1080, h: 1350 },
  historia:  { w: 1080, h: 1920 },
  cuadrado:  { w: 1080, h: 1080 },
  evento:    { w: 1920, h: 1080 },
};

const SAFE_MARGIN = 72;

function uid() { return Math.random().toString(36).slice(2, 8); }

// ─── TEXT LAYOUT ──────────────────────────────────────────────────────────────

function buildTextLayout(data: GeneratedData, dims: { w: number; h: number }, hasArtists: boolean) {
  const { w, h } = dims;
  const isLandscape = w > h;
  const palette = data.palette?.colors ?? ["#ffffff","#f5c518","#0d0d1a"];
  const primary = palette[0] ?? "#ffffff";
  const accent  = palette[1] ?? "#f5c518";
  const cx = w / 2;
  const safeW = w - SAFE_MARGIN * 2;

  const layers: Array<{
    id: string; role: string; content: string;
    x: number; y: number; width: number;
    fontSize: number; fontWeight: string; fontFamily: string;
    fill: string; textAlign: string; charSpacing: number;
    opacity: number; originX: string; originY: string;
  }> = [];

  // Title zone: top 18% of canvas
  const titleY = SAFE_MARGIN;
  // Info zone: bottom 25% of canvas (below artist area)
  const infoBaseY = hasArtists ? h * 0.74 : h * 0.52;

  if (data.eventName) {
    layers.push({
      id: "eventTitle", role: "eventTitle",
      content: data.eventName.toUpperCase(),
      x: cx, y: titleY, width: safeW,
      fontSize: isLandscape ? 80 : Math.min(88, w * 0.08),
      fontWeight: "900", fontFamily: "Montserrat",
      fill: primary, textAlign: "center",
      charSpacing: 30, opacity: 1,
      originX: "center", originY: "top",
    });
  }

  if (data.eventDate) {
    layers.push({
      id: "eventDate", role: "date",
      content: data.eventDate.toUpperCase(),
      x: cx, y: infoBaseY, width: safeW * 0.8,
      fontSize: 28, fontWeight: "700", fontFamily: "Montserrat",
      fill: primary, textAlign: "center",
      charSpacing: 40, opacity: 0.95,
      originX: "center", originY: "top",
    });
  }

  if (data.eventVenue) {
    layers.push({
      id: "eventVenue", role: "venue",
      content: data.eventVenue.toUpperCase(),
      x: cx, y: infoBaseY + (data.eventDate ? 52 : 0), width: safeW * 0.75,
      fontSize: 22, fontWeight: "500", fontFamily: "Montserrat",
      fill: primary, textAlign: "center",
      charSpacing: 20, opacity: 0.82,
      originX: "center", originY: "top",
    });
  }

  if (data.eventPrice) {
    layers.push({
      id: "eventPrice", role: "price",
      content: data.eventPrice.toUpperCase(),
      x: cx, y: h - SAFE_MARGIN - 36, width: safeW * 0.5,
      fontSize: 22, fontWeight: "800", fontFamily: "Montserrat",
      fill: accent, textAlign: "center",
      charSpacing: 20, opacity: 1,
      originX: "center", originY: "top",
    });
  }

  return layers.filter(l => l.content.trim());
}

// ─── ARTIST COMPOSITION ───────────────────────────────────────────────────────

function computeArtistCompositions(
  artists: ArtistData[], dims: { w: number; h: number },
  naturalW: number, naturalH: number
) {
  const { w, h } = dims;
  const n = artists.length;

  const mainTargetH = h * (n === 1 ? 0.65 : 0.60);
  const mainScale = mainTargetH / naturalH;
  const mainW = naturalW * mainScale;

  if (n === 1) {
    return [{ x: (w - mainW) / 2, y: h * 0.20, scaleX: mainScale, scaleY: mainScale, zIndex: 10 }];
  }
  if (n === 2) {
    const secScale = (h * 0.50) / naturalH;
    const secW = naturalW * secScale;
    return [
      { x: w * 0.50 - mainW * 0.3, y: h * 0.22, scaleX: mainScale, scaleY: mainScale, zIndex: 10 },
      { x: w * 0.04,               y: h * 0.30, scaleX: secScale,  scaleY: secScale,  zIndex: 5  },
    ];
  }
  if (n === 3) {
    const secScale = (h * 0.46) / naturalH;
    const secW = naturalW * secScale;
    return [
      { x: (w - mainW) / 2,              y: h * 0.20, scaleX: mainScale, scaleY: mainScale, zIndex: 10 },
      { x: SAFE_MARGIN,                  y: h * 0.28, scaleX: secScale,  scaleY: secScale,  zIndex: 5  },
      { x: w - secW - SAFE_MARGIN,       y: h * 0.28, scaleX: secScale,  scaleY: secScale,  zIndex: 5  },
    ];
  }
  // 4+ lineup
  const slotW = w / n;
  return artists.map((_, i) => {
    const isMain = i === 0;
    const sc = (h * (isMain ? 0.56 : 0.48)) / naturalH;
    const aw = naturalW * sc;
    return { x: slotW * i + (slotW - aw) / 2, y: h * (isMain ? 0.20 : 0.24), scaleX: sc, scaleY: sc, zIndex: isMain ? 10 : 5 };
  });
}

// ─── LAYER ICON ───────────────────────────────────────────────────────────────

function LayerIcon({ type }: { type: LayerType }) {
  if (type === "text") return <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>;
  if (type === "background") return <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;
  return <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>;
}

// ─── MAIN EDITOR ──────────────────────────────────────────────────────────────

type GeneratedEditorProps = {
  /** Si se pasa, el editor carga la plantilla por id en vez de leer localStorage. */
  templateId?: number;
};

export default function GeneratedEditor({ templateId }: GeneratedEditorProps = {}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);

  const [data, setData] = useState<GeneratedData | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<LayerItem | null>(null);
  const [activeTool, setActiveTool] = useState<LeftTool>("layers");
  const [zoom, setZoom] = useState(50);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [canvasSize, setCanvasSize] = useState({ w: 1080, h: 1350 });

  const [textProps, setTextProps] = useState<TextProps>({
    text: "", fontFamily: "Montserrat", fontSize: 60, fill: "#ffffff",
    textAlign: "center", fontWeight: "700", charSpacing: 0,
    lineHeight: 1.2, opacity: 1, angle: 0, left: 540, top: 100, width: 900,
    shadow: false, shadowColor: "#000000", shadowBlur: 10,
  });

  const [imageProps, setImageProps] = useState<ImageProps>({
    opacity: 1, angle: 0, left: 0, top: 0, width: 400, height: 600, flipX: false, flipY: false,
  });

  // ─── LOAD DATA ────────────────────────────────────────────────────────────

  useEffect(() => {
    // Modo plantilla: cargar la plantilla por id
    if (typeof templateId === "number") {
      const tpl = templates.find(t => t.id === templateId);
      if (tpl) {
        setTemplate(tpl);
        // Construimos un GeneratedData mínimo para que el resto del editor tenga datos coherentes
        setData({
          format: tpl.width === tpl.height ? "cuadrado" : (tpl.width > tpl.height ? "evento" : "instagram"),
          palette: { colors: ["#ffffff", "#f5c518", "#0d0d1a"], label: "default" },
        });
      } else {
        router.push("/templates");
      }
      return;
    }
    // Modo generated: leer localStorage
    try {
      const raw = localStorage.getItem("artegenia_generated");
      if (raw) setData(JSON.parse(raw));
      else router.push("/create");
    } catch { router.push("/create"); }
  }, [router, templateId]);

  // ─── INIT CANVAS ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    let isMounted = true;
    let canvas: FabricCanvas | null = null;

    (async () => {
      const fabric = await import("fabric");
      // Si hay plantilla, usar sus dimensiones; si no, las del formato del wizard
      const dims = template
        ? { w: template.width, h: template.height }
        : (FORMAT_DIMS[data.format ?? "instagram"] ?? FORMAT_DIMS.instagram);
      if (isMounted) setCanvasSize({ w: dims.w, h: dims.h });

      const scale = zoom / 100;
      canvas = new fabric.Canvas(canvasRef.current!, {
        width: dims.w * scale,
        height: dims.h * scale,
        backgroundColor: "#111118",
        selection: true,
        preserveObjectStacking: true,
      });
      canvas.setZoom(scale);
      fabricRef.current = canvas;

      const newLayers: LayerItem[] = [];

      // ── MODO PLANTILLA ─────────────────────────────────────────────────────
      if (template) {
        try {
          if (template.builder) {
            // ARREGLO CRÍTICO: Agrandar canvas DOM a tamaño nativo + zoom 1 ANTES del builder.
            // Los builders dibujan en coords absolutas 0..dims.w / 0..dims.h.
            // Si el canvas está reducido (540x675) y con setZoom(0.5), los píxeles del builder
            // se dibujarían fuera del bitmap interno.
            canvas.setDimensions({ width: dims.w, height: dims.h });
            canvas.setZoom(1);
            const builderResult = await template.builder(canvas, fabric);
            // Restaurar canvas reducido + zoom para mostrar el resultado a tamaño viewport
            canvas.setDimensions({ width: dims.w * scale, height: dims.h * scale });
            canvas.setZoom(scale);
            canvas.requestRenderAll();
            if (Array.isArray(builderResult)) {
              for (const bl of builderResult as Array<{ id: string; name: string; type: string; obj: FabricObject; visible: boolean; locked: boolean }>) {
                const obj = bl.obj;
                (obj as FabricObject & { customId?: string }).customId = bl.id;
                // Mapear "shape" → "image" porque el editor sólo conoce text/image/background
                const mappedType: LayerType = bl.type === "text" ? "text" : (bl.type === "background" ? "background" : "image");
                newLayers.push({ id: bl.id, name: bl.name, type: mappedType, obj, visible: bl.visible, locked: bl.locked });
              }
            }
          } else if (template.layers) {
            // Plantilla declarativa: usar applyTemplateLayers y luego enumerar los objetos del canvas
            await applyTemplateLayers(canvas, template.layers);
            // Recorrer objetos añadidos y registrarlos como capas
            const objs = canvas.getObjects();
            for (let i = 0; i < objs.length; i++) {
              const obj = objs[i];
              const tplLayer = template.layers[i];
              if (!tplLayer) continue;
              const layerId = tplLayer.id;
              (obj as FabricObject & { customId?: string }).customId = layerId;
              const mappedType: LayerType = tplLayer.type === "text" ? "text" : (tplLayer.id === "bg" || tplLayer.id === "background" ? "background" : "image");
              const layerName = tplLayer.type === "text" ? (tplLayer.text.slice(0, 22) || "Texto") : (tplLayer.type === "image" ? "Imagen" : `Forma ${i + 1}`);
              newLayers.push({ id: layerId, name: layerName, type: mappedType, obj, visible: true, locked: false });
            }
          }
        } catch (e) {
          console.warn("Template load error:", e);
        }
        canvas.renderAll();
        if (isMounted) setLayers([...newLayers].reverse());
        // Selection handlers (mismo bloque que el modo generated; lo registramos también aquí)
        const handleSelTpl = (obj: FabricObject) => {
          const id = (obj as FabricObject & { customId?: string }).customId ?? "";
          const layer = newLayers.find(l => l.id === id) ?? null;
          setSelectedLayer(layer);
          if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
            const t = obj as IText;
            const sh = t.shadow as { color?: string; blur?: number } | null;
            setTextProps({ text: t.text ?? "", fontFamily: String(t.fontFamily ?? "Montserrat"), fontSize: t.fontSize ?? 60, fill: String(t.fill ?? "#ffffff"), textAlign: t.textAlign ?? "center", fontWeight: String(t.fontWeight ?? "700"), charSpacing: t.charSpacing ?? 0, lineHeight: t.lineHeight ?? 1.2, opacity: t.opacity ?? 1, angle: t.angle ?? 0, left: t.left ?? 0, top: t.top ?? 0, width: t.width ?? 900, shadow: !!sh, shadowColor: sh?.color ?? "#000000", shadowBlur: sh?.blur ?? 10 });
          } else {
            setImageProps({ opacity: obj.opacity ?? 1, angle: obj.angle ?? 0, left: obj.left ?? 0, top: obj.top ?? 0, width: (obj.width ?? 400) * (obj.scaleX ?? 1), height: (obj.height ?? 600) * (obj.scaleY ?? 1), flipX: obj.flipX ?? false, flipY: obj.flipY ?? false });
          }
        };
        canvas.on("selection:created", e => { const o = e.selected?.[0]; if (o) handleSelTpl(o); });
        canvas.on("selection:updated", e => { const o = e.selected?.[0]; if (o) handleSelTpl(o); });
        canvas.on("selection:cleared", () => setSelectedLayer(null));
        canvas.on("object:modified", () => { const o = canvas?.getActiveObject(); if (o) handleSelTpl(o); setSaveState("unsaved"); });
        return;
      }

      // ── MODO GENERATED (resto del código original) ─────────────────────────
      const artists: ArtistData[] = data.artists?.filter(a => a.photoUrl) ??
        (data.artistPhotoUrl ? [{ name: "Artista", photoUrl: data.artistPhotoUrl }] : []);

      // ── BACKGROUND — must fill canvas completely ──────────────────────────
      if (data.bgUrl) {
        try {
          const bgImg = await fabric.FabricImage.fromURL(data.bgUrl, { crossOrigin: "anonymous" });
          const imgW = bgImg.width ?? dims.w;
          const imgH = bgImg.height ?? dims.h;

          // Cover fit: scale to fill entire canvas, center crop
          const scaleX = dims.w / imgW;
          const scaleY = dims.h / imgH;
          const bgScale = Math.max(scaleX, scaleY); // cover, not contain

          const scaledW = imgW * bgScale;
          const scaledH = imgH * bgScale;
          const offsetX = (dims.w - scaledW) / 2;
          const offsetY = (dims.h - scaledH) / 2;

          bgImg.set({
            left: offsetX, top: offsetY,
            scaleX: bgScale, scaleY: bgScale,
            selectable: true, evented: true,
            originX: "left", originY: "top",
          });
          (bgImg as FabricObject & { customId?: string }).customId = "background";
          (bgImg as FabricObject & { customRole?: string }).customRole = "background";
          canvas.add(bgImg);
          canvas.sendObjectToBack(bgImg);
          newLayers.push({ id: "background", name: "Fondo", type: "background", obj: bgImg, visible: true, locked: false });
        } catch (e) { console.warn("BG load error:", e); }
      }

      // ── ARTIST PHOTOS — computed centered composition ──────────────────────
      if (artists.length > 0) {
        let naturalW = 400, naturalH = 600;
        try {
          const probe = await fabric.FabricImage.fromURL(artists[0].photoUrl!, { crossOrigin: "anonymous" });
          naturalW = probe.width ?? 400;
          naturalH = probe.height ?? 600;
        } catch {}

        const compositions = computeArtistCompositions(artists, dims, naturalW, naturalH);

        for (let i = 0; i < artists.length; i++) {
          const artist = artists[i];
          if (!artist.photoUrl) continue;
          const comp = compositions[i] ?? compositions[0];
          try {
            const aImg = await fabric.FabricImage.fromURL(artist.photoUrl, { crossOrigin: "anonymous" });
            aImg.set({
              left: comp.x, top: comp.y,
              scaleX: comp.scaleX, scaleY: comp.scaleY,
              originX: "left", originY: "top",
              selectable: true, evented: true,
            });
            const artistId = `artist-${i}`;
            (aImg as FabricObject & { customId?: string }).customId = artistId;
            canvas.add(aImg);
            newLayers.push({ id: artistId, name: artist.name || `Artista ${i + 1}`, type: "image", obj: aImg, visible: true, locked: false });
          } catch (e) { console.warn(`Artist ${i} error:`, e); }
        }
      }

      // ── TEXT LAYERS ───────────────────────────────────────────────────────
      const hasArtists = artists.length > 0;
      const textDefs = data.textLayers && data.textLayers.length > 0
        ? null
        : buildTextLayout(data, dims, hasArtists);

      if (data.textLayers && data.textLayers.length > 0) {
        for (const tl of data.textLayers) {
          if (!tl.content.trim()) continue;
          const itext = new fabric.IText(tl.content, {
            left: tl.position.x, top: tl.position.y, width: tl.position.width,
            fontFamily: tl.style.fontFamily, fontSize: tl.style.fontSize,
            fontWeight: tl.style.fontWeight, fill: tl.style.color,
            textAlign: tl.style.textAlign as "left" | "center" | "right",
            charSpacing: (tl.style.letterSpacing ?? 0) * 10,
            originX: tl.position.originX as "left" | "center" | "right",
            originY: tl.position.originY as "top" | "center" | "bottom",
            opacity: tl.style.opacity ?? 1,
            selectable: true, evented: true,
          });
          (itext as FabricObject & { customId?: string }).customId = tl.id;
          canvas.add(itext);
          const roleLabels: Record<string, string> = { eventTitle: "Título", mainArtist: "Artista principal", date: "Fecha", venue: "Lugar", price: "Precio", label: "Etiqueta" };
          newLayers.push({ id: tl.id, name: roleLabels[tl.role] ?? tl.content.slice(0, 18), type: "text", obj: itext, visible: true, locked: false });
        }
      } else if (textDefs) {
        for (const td of textDefs) {
          const itext = new fabric.IText(td.content, {
            left: td.x, top: td.y, width: td.width,
            fontFamily: td.fontFamily, fontSize: td.fontSize,
            fontWeight: td.fontWeight, fill: td.fill,
            textAlign: td.textAlign as "left" | "center" | "right",
            charSpacing: td.charSpacing,
            originX: td.originX as "left" | "center" | "right",
            originY: td.originY as "top" | "center" | "bottom",
            opacity: td.opacity, selectable: true, evented: true,
          });
          (itext as FabricObject & { customId?: string }).customId = td.id;
          canvas.add(itext);
          const names: Record<string, string> = { eventTitle: "Título", eventDate: "Fecha", eventVenue: "Lugar", eventPrice: "Precio" };
          newLayers.push({ id: td.id, name: names[td.id] ?? td.role, type: "text", obj: itext, visible: true, locked: false });
        }
      }

      // ── LOGOS — fila centrada abajo ──────────────────────────────────────
      const logos = (data.logos ?? []).filter((l: ArtistData) => l.photoUrl);
      if (logos.length > 0) {
        const logoH = 80;
        const logoGap = 20;
        const margin = 40;
        const logoY = dims.h - logoH - margin;

        // First pass: load all logos to get widths
        const logoImgs: Array<{ img: InstanceType<typeof fabric.FabricImage>; w: number }> = [];
        for (const logo of logos) {
          try {
            const img = await fabric.FabricImage.fromURL(logo.photoUrl!, { crossOrigin: "anonymous" });
            const sc = logoH / (img.height ?? logoH);
            const w = (img.width ?? logoH) * sc;
            logoImgs.push({ img, w });
          } catch {}
        }

        // Calculate total width and starting X to center
        const totalW = logoImgs.reduce((sum, l) => sum + l.w, 0) + logoGap * (logoImgs.length - 1);
        let currentX = (dims.w - totalW) / 2;

        for (let i = 0; i < logoImgs.length; i++) {
          const { img, w } = logoImgs[i];
          const sc = logoH / (img.height ?? logoH);
          img.set({ left: currentX, top: logoY, scaleX: sc, scaleY: sc, selectable: true, evented: true, originX: "left", originY: "top" });
          const logoId = `logo-${i}`;
          (img as FabricObject & { customId?: string }).customId = logoId;
          canvas.add(img);
          newLayers.push({ id: logoId, name: logos[i].name || `Logo ${i+1}`, type: "image", obj: img, visible: true, locked: false });
          currentX += w + logoGap;
        }
      }
      canvas.renderAll();
      if (isMounted) setLayers([...newLayers].reverse());

      // ── SELECTION ─────────────────────────────────────────────────────────
      const handleSel = (obj: FabricObject) => {
        const id = (obj as FabricObject & { customId?: string }).customId ?? "";
        const layer = newLayers.find(l => l.id === id) ?? null;
        setSelectedLayer(layer);
        if (obj.type === "i-text" || obj.type === "text") {
          const t = obj as IText;
          const sh = t.shadow as { color?: string; blur?: number } | null;
          setTextProps({ text: t.text ?? "", fontFamily: String(t.fontFamily ?? "Montserrat"), fontSize: t.fontSize ?? 60, fill: String(t.fill ?? "#ffffff"), textAlign: t.textAlign ?? "center", fontWeight: String(t.fontWeight ?? "700"), charSpacing: t.charSpacing ?? 0, lineHeight: t.lineHeight ?? 1.2, opacity: t.opacity ?? 1, angle: t.angle ?? 0, left: t.left ?? 0, top: t.top ?? 0, width: t.width ?? 900, shadow: !!sh, shadowColor: sh?.color ?? "#000000", shadowBlur: sh?.blur ?? 10 });
        } else {
          setImageProps({ opacity: obj.opacity ?? 1, angle: obj.angle ?? 0, left: obj.left ?? 0, top: obj.top ?? 0, width: (obj.width ?? 400) * (obj.scaleX ?? 1), height: (obj.height ?? 600) * (obj.scaleY ?? 1), flipX: obj.flipX ?? false, flipY: obj.flipY ?? false });
        }
      };
      canvas.on("selection:created", e => { const o = e.selected?.[0]; if (o) handleSel(o); });
      canvas.on("selection:updated", e => { const o = e.selected?.[0]; if (o) handleSel(o); });
      canvas.on("selection:cleared", () => setSelectedLayer(null));
      canvas.on("object:modified", () => { const o = canvas?.getActiveObject(); if (o) handleSel(o); setSaveState("unsaved"); });
    })();

    return () => { isMounted = false; canvas?.dispose(); fabricRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, template]);

  // ─── ZOOM ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const scale = zoom / 100;
    canvas.setZoom(scale);
    canvas.setDimensions({ width: canvasSize.w * scale, height: canvasSize.h * scale });
    canvas.renderAll();
  }, [zoom, canvasSize]);

  // ─── AUTO-SAVE ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (saveState !== "unsaved") return;
    const t = setTimeout(() => { setSaveState("saving"); setTimeout(() => setSaveState("saved"), 800); }, 2000);
    return () => clearTimeout(t);
  }, [saveState]);

  // ─── KEYBOARD ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if ((e.key === "Delete" || e.key === "Backspace") && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        const active = canvas.getActiveObject();
        if (active) {
          const id = (active as FabricObject & { customId?: string }).customId;
          canvas.remove(active); canvas.renderAll();
          if (id) setLayers(prev => prev.filter(l => l.id !== id));
          setSelectedLayer(null); setSaveState("unsaved");
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); setSaveState("saved"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ─── TEXT PROPS ───────────────────────────────────────────────────────────

  const applyTextProp = useCallback(<K extends keyof TextProps>(key: K, value: TextProps[K]) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject() as IText | undefined;
    if (!obj || (obj.type !== "i-text" && obj.type !== "text")) return;
    setTextProps(prev => ({ ...prev, [key]: value }));
    if (key === "text") { obj.set("text", String(value)); }
    else if (key === "shadow") { obj.set("shadow", value ? { color: textProps.shadowColor, blur: textProps.shadowBlur, offsetX: 2, offsetY: 2 } as never : null as never); }
    else if (key === "shadowColor" || key === "shadowBlur") { if (textProps.shadow) obj.set("shadow", { color: key === "shadowColor" ? String(value) : textProps.shadowColor, blur: key === "shadowBlur" ? Number(value) : textProps.shadowBlur, offsetX: 2, offsetY: 2 } as never); }
    else { obj.set(key as keyof IText, value as never); }
    canvas?.renderAll(); setSaveState("unsaved");
  }, [textProps]);

  // ─── IMAGE PROPS ──────────────────────────────────────────────────────────

  const applyImageProp = useCallback(<K extends keyof ImageProps>(key: K, value: ImageProps[K]) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    setImageProps(prev => ({ ...prev, [key]: value }));
    if (key !== "width" && key !== "height") obj.set(key as keyof FabricObject, value as never);
    canvas?.renderAll(); setSaveState("unsaved");
  }, []);

  // ─── LAYER OPS ────────────────────────────────────────────────────────────

  const toggleVisibility = useCallback((id: string) => {
    setLayers(prev => prev.map(l => { if (l.id !== id) return l; l.obj.set("visible", !l.visible); fabricRef.current?.renderAll(); return { ...l, visible: !l.visible }; }));
    setSaveState("unsaved");
  }, []);

  const toggleLock = useCallback((id: string) => {
    setLayers(prev => prev.map(l => { if (l.id !== id) return l; const nl = !l.locked; l.obj.set({ selectable: !nl, evented: !nl }); fabricRef.current?.renderAll(); return { ...l, locked: nl }; }));
  }, []);

  const deleteLayer = useCallback((id: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setLayers(prev => { const layer = prev.find(l => l.id === id); if (layer) { canvas.remove(layer.obj); canvas.renderAll(); } return prev.filter(l => l.id !== id); });
    setSelectedLayer(null); setSaveState("unsaved");
  }, []);

  const moveLayer = useCallback((id: string, dir: "up" | "down") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === id);
      if (idx < 0) return prev;
      const layer = prev[idx];
      if (dir === "up" && idx > 0) { canvas.bringObjectForward(layer.obj); const next = [...prev]; [next[idx], next[idx-1]] = [next[idx-1], next[idx]]; return next; }
      if (dir === "down" && idx < prev.length - 1) { canvas.sendObjectBackwards(layer.obj); const next = [...prev]; [next[idx], next[idx+1]] = [next[idx+1], next[idx]]; return next; }
      return prev;
    });
    canvas.renderAll(); setSaveState("unsaved");
  }, []);

  const selectLayerFromPanel = useCallback((layer: LayerItem) => {
    const canvas = fabricRef.current;
    if (!canvas || layer.locked) return;
    canvas.setActiveObject(layer.obj); canvas.renderAll(); setSelectedLayer(layer);
  }, []);

  // ─── ADD TEXT ─────────────────────────────────────────────────────────────

  const addText = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const fabric = await import("fabric");
    const itext = new fabric.IText("Nuevo texto", {
      left: canvasSize.w / 2, top: canvasSize.h / 2,
      fontFamily: "Montserrat", fontSize: 60, fontWeight: "700",
      fill: "#ffffff", textAlign: "center",
      originX: "center", originY: "center",
      selectable: true, evented: true,
    });
    const newId = `text-${uid()}`;
    (itext as FabricObject & { customId?: string }).customId = newId;
    canvas.add(itext); canvas.setActiveObject(itext); canvas.renderAll();
    const newLayer: LayerItem = { id: newId, name: "Texto nuevo", type: "text", obj: itext, visible: true, locked: false };
    setLayers(prev => [newLayer, ...prev]); setSelectedLayer(newLayer); setSaveState("unsaved"); setActiveTool("layers");
  }, [canvasSize]);

  // ─── EXPORT ───────────────────────────────────────────────────────────────

  const exportFlyer = useCallback((format: "png" | "jpg" = "png") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    canvas.setZoom(1);
    canvas.setDimensions({ width: canvasSize.w, height: canvasSize.h });
    const dataUrl = canvas.toDataURL({ format: format === "jpg" ? "jpeg" : "png", quality: 0.95, multiplier: 1 });
    canvas.setZoom(currentZoom);
    canvas.setDimensions({ width: canvasSize.w * currentZoom, height: canvasSize.h * currentZoom });
    canvas.renderAll();
    const link = document.createElement("a");
    link.download = `artegenia-flyer.${format}`; link.href = dataUrl; link.click();
  }, [canvasSize]);

  // ─── LEFT TOOLS ───────────────────────────────────────────────────────────

  const TOOLS: Array<{ id: LeftTool; label: string; icon: React.ReactNode }> = [
    { id: "templates", label: "Plantillas", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: "text",      label: "Texto",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg> },
    { id: "photos",    label: "Fotos",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg> },
    { id: "background",label: "Fondo",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
    { id: "layers",    label: "Capas",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
  ];

  const isBackground = selectedLayer?.type === "background";
  const isText = selectedLayer?.type === "text";
  const isImage = selectedLayer?.type === "image";

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">

      {/* HEADER */}
      <header className="h-12 bg-[#111118] border-b border-white/[0.07] flex items-center px-4 gap-3 shrink-0 z-50">
        <button onClick={() => router.push(template ? "/templates" : "/create")} className="p-1.5 text-gray-500 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] font-black">AG</div>
          <span className="text-sm font-bold hidden sm:block">Arte Gen</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs ml-1">
          {saveState === "saving"  && <><div className="w-2.5 h-2.5 border border-gray-500 border-t-gray-300 rounded-full animate-spin"/><span className="text-gray-500">Guardando…</span></>}
          {saveState === "saved"   && <><div className="w-2 h-2 rounded-full bg-green-500"/><span className="text-gray-500">Guardado</span></>}
          {saveState === "unsaved" && <><div className="w-2 h-2 rounded-full bg-yellow-500"/><span className="text-gray-500">Sin guardar</span></>}
        </div>
        <div className="hidden md:flex text-xs text-gray-600 border border-white/[0.06] rounded px-2 py-1 ml-1">
          {canvasSize.w} × {canvasSize.h} px
        </div>
        <div className="flex-1"/>
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Descargar
          </button>
          <div className="absolute right-0 top-full mt-1 w-32 bg-[#1c1c28] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
            {[["PNG","png"],["JPG","jpg"]].map(([label, fmt]) => (
              <button key={fmt} onClick={() => exportFlyer(fmt as "png"|"jpg")}
                className="w-full px-4 py-2.5 text-left text-xs text-gray-300 hover:bg-white/8 hover:text-white transition-all">
                Exportar {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* LEFT TOOLBAR */}
        <div className="w-[60px] bg-[#111118] border-r border-white/[0.07] flex flex-col items-center py-3 gap-1 shrink-0">
          {TOOLS.map(tool => (
            <button key={tool.id}
              onClick={() => { setActiveTool(tool.id); if (tool.id === "text") addText(); }}
              title={tool.label}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-medium ${activeTool === tool.id ? "bg-purple-600/20 text-purple-400 border border-purple-500/30" : "text-gray-600 hover:text-gray-300 hover:bg-white/5"}`}>
              {tool.icon}
              <span className="leading-none">{tool.label.slice(0,6)}</span>
            </button>
          ))}
        </div>

        {/* LAYERS PANEL */}
        {activeTool === "layers" && (
          <div className="w-52 bg-[#111118] border-r border-white/[0.07] flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Capas</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {layers.map(layer => (
                <div key={layer.id} onClick={() => selectLayerFromPanel(layer)}
                  className={`group flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-white/[0.04] transition-all ${selectedLayer?.id === layer.id ? "bg-purple-600/15 border-l-2 border-l-purple-500" : "hover:bg-white/4"}`}>
                  <svg className="w-3 h-3 text-gray-700 shrink-0 cursor-grab" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
                  <LayerIcon type={layer.type}/>
                  <span className={`flex-1 text-xs truncate ${selectedLayer?.id === layer.id ? "text-white" : "text-gray-400"}`}>{layer.name}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); toggleVisibility(layer.id); }} className={`p-0.5 rounded ${layer.visible ? "text-gray-500 hover:text-white" : "text-gray-700"}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{layer.visible ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>}</svg>
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleLock(layer.id); }} className={`p-0.5 rounded ${layer.locked ? "text-yellow-500" : "text-gray-500 hover:text-white"}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d={layer.locked ? "M7 11V7a5 5 0 0110 0v4" : "M7 11V7a5 5 0 019.9-1"}/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CANVAS — centered in dark workspace */}
        <div className="flex-1 flex flex-col bg-[#0e0e16] overflow-hidden">
          <div className="flex-1 overflow-auto">
            {/* Center the canvas both horizontally and vertically */}
            <div className="min-h-full flex items-center justify-center p-8">
              <div className="relative shadow-2xl shadow-black/70"
                style={{ width: canvasSize.w * zoom / 100, height: canvasSize.h * zoom / 100, flexShrink: 0 }}>
                <canvas ref={canvasRef} />
                {!data && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] rounded">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ZOOM BAR */}
          <div className="h-10 bg-[#111118] border-t border-white/[0.06] flex items-center justify-center gap-3 px-4 shrink-0">
            <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all text-lg">−</button>
            <span className="text-xs text-gray-500 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all text-lg">+</button>
            <div className="w-px h-4 bg-white/[0.08] mx-1"/>
            <button onClick={() => setZoom(50)} className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors">Ajustar</button>
            <button onClick={() => setZoom(100)} className="text-[10px] h-5 px-2 rounded border border-white/8 text-gray-600 hover:text-gray-300 transition-colors">100%</button>
          </div>
        </div>

        {/* RIGHT PROPERTIES PANEL */}
        <div className="w-64 bg-[#111118] border-l border-white/[0.07] flex flex-col shrink-0 overflow-hidden">
          {!selectedLayer ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>
              </div>
              <p className="text-xs text-gray-600">Selecciona un elemento<br/>para editar sus propiedades</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  {isText ? "Texto" : isBackground ? "Fondo" : "Imagen"}
                </p>
                {!isBackground && (
                  <button onClick={() => deleteLayer(selectedLayer.id)} className="text-gray-700 hover:text-red-400 transition-colors p-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  </button>
                )}
              </div>

              <div className="p-3 space-y-3">

                {/* TEXT PROPS */}
                {isText && (<>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Contenido</label><textarea value={textProps.text} onChange={e => applyTextProp("text", e.target.value)} rows={2} className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white resize-none outline-none focus:border-purple-500/50"/></div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Fuente</label><select value={textProps.fontFamily} onChange={e => applyTextProp("fontFamily", e.target.value)} className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50">{FONTS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Tamaño</label><input type="number" value={textProps.fontSize} onChange={e => applyTextProp("fontSize", Number(e.target.value))} className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50"/></div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Peso</label><select value={textProps.fontWeight} onChange={e => applyTextProp("fontWeight", e.target.value)} className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50">{["400","500","600","700","800","900"].map(w => <option key={w} value={w}>{w}</option>)}</select></div>
                  </div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Color</label><div className="flex items-center gap-2"><input type="color" value={textProps.fill} onChange={e => applyTextProp("fill", e.target.value)} className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"/><input type="text" value={textProps.fill} onChange={e => applyTextProp("fill", e.target.value)} className="flex-1 bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none font-mono focus:border-purple-500/50"/></div></div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Alineación</label><div className="flex gap-1">{["left","center","right"].map(a => (<button key={a} onClick={() => applyTextProp("textAlign", a)} className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${textProps.textAlign === a ? "bg-purple-600 text-white" : "bg-white/5 text-gray-500 hover:text-white"}`}>{a==="left"?"↤":a==="center"?"↔":"↦"}</button>))}</div></div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Espaciado · {Math.round(textProps.charSpacing/10)}</label><input type="range" min={0} max={500} value={textProps.charSpacing} onChange={e => applyTextProp("charSpacing", Number(e.target.value))} className="w-full accent-purple-500"/></div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Opacidad · {Math.round(textProps.opacity*100)}%</label><input type="range" min={0} max={1} step={0.01} value={textProps.opacity} onChange={e => applyTextProp("opacity", Number(e.target.value))} className="w-full accent-purple-500"/></div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Rotación · {Math.round(textProps.angle)}°</label><input type="range" min={-180} max={180} value={textProps.angle} onChange={e => applyTextProp("angle", Number(e.target.value))} className="w-full accent-purple-500"/></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] text-gray-500 mb-1 block">X</label><input type="number" value={Math.round(textProps.left)} onChange={e => applyTextProp("left", Number(e.target.value))} className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50"/></div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Y</label><input type="number" value={Math.round(textProps.top)} onChange={e => applyTextProp("top", Number(e.target.value))} className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50"/></div>
                  </div>
                  <div className="flex items-center gap-2"><input type="checkbox" checked={textProps.shadow} onChange={e => applyTextProp("shadow", e.target.checked)} className="accent-purple-500"/><label className="text-[10px] text-gray-400">Sombra</label></div>
                  {textProps.shadow && <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-gray-500 mb-1 block">Color sombra</label><input type="color" value={textProps.shadowColor} onChange={e => applyTextProp("shadowColor", e.target.value)} className="w-full h-8 rounded-lg border-0 cursor-pointer bg-transparent"/></div><div><label className="text-[10px] text-gray-500 mb-1 block">Blur · {textProps.shadowBlur}</label><input type="range" min={0} max={30} value={textProps.shadowBlur} onChange={e => applyTextProp("shadowBlur", Number(e.target.value))} className="w-full accent-purple-500"/></div></div>}
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Orden</label><div className="flex gap-2"><button onClick={() => moveLayer(selectedLayer.id, "up")} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↑ Subir</button><button onClick={() => moveLayer(selectedLayer.id, "down")} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↓ Bajar</button></div></div>
                </>)}

                {/* IMAGE PROPS */}
                {isImage && (<>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Opacidad · {Math.round(imageProps.opacity*100)}%</label><input type="range" min={0} max={1} step={0.01} value={imageProps.opacity} onChange={e => applyImageProp("opacity", Number(e.target.value))} className="w-full accent-purple-500"/></div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Rotación · {Math.round(imageProps.angle)}°</label><input type="range" min={-180} max={180} value={imageProps.angle} onChange={e => applyImageProp("angle", Number(e.target.value))} className="w-full accent-purple-500"/></div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Voltear</label><div className="flex gap-2"><button onClick={() => { const obj = fabricRef.current?.getActiveObject(); if (obj) { const nv = !obj.flipX; obj.set("flipX", nv); applyImageProp("flipX", nv); fabricRef.current?.renderAll(); } }} className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${imageProps.flipX?"bg-purple-600/20 text-purple-300":"bg-white/5 text-gray-400 hover:text-white"}`}>↔ H</button><button onClick={() => { const obj = fabricRef.current?.getActiveObject(); if (obj) { const nv = !obj.flipY; obj.set("flipY", nv); applyImageProp("flipY", nv); fabricRef.current?.renderAll(); } }} className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${imageProps.flipY?"bg-purple-600/20 text-purple-300":"bg-white/5 text-gray-400 hover:text-white"}`}>↕ V</button></div></div>
                  <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] text-gray-500 mb-1 block">X</label><input type="number" value={Math.round(imageProps.left)} onChange={e => applyImageProp("left", Number(e.target.value))} className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50"/></div><div><label className="text-[10px] text-gray-500 mb-1 block">Y</label><input type="number" value={Math.round(imageProps.top)} onChange={e => applyImageProp("top", Number(e.target.value))} className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50"/></div></div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Orden</label><div className="flex gap-2"><button onClick={() => moveLayer(selectedLayer.id, "up")} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↑ Subir</button><button onClick={() => moveLayer(selectedLayer.id, "down")} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↓ Bajar</button></div></div>
                </>)}

                {/* BACKGROUND PROPS */}
                {isBackground && (<>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Opacidad</label><input type="range" min={0} max={1} step={0.01} value={fabricRef.current?.getActiveObject()?.opacity ?? 1} onChange={e => { const obj = fabricRef.current?.getActiveObject(); if (obj) { obj.set("opacity", Number(e.target.value)); fabricRef.current?.renderAll(); setSaveState("unsaved"); } }} className="w-full accent-purple-500"/></div>
                  <button onClick={() => toggleLock(selectedLayer.id)} className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${selectedLayer.locked?"bg-yellow-500/20 text-yellow-400 border border-yellow-500/30":"bg-white/5 text-gray-400 hover:text-white"}`}>{selectedLayer.locked?"🔒 Fondo bloqueado":"🔓 Bloquear fondo"}</button>
                  <button onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file"; input.accept = "image/*";
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file || !fabricRef.current) return;
                      const reader = new FileReader();
                      reader.onload = async (ev) => {
                        const src = ev.target?.result as string;
                        const obj = fabricRef.current?.getActiveObject();
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        if (obj) (obj as any).setSrc?.(src, () => { fabricRef.current?.renderAll(); });
                        setSaveState("unsaved");
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }} className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">📁 Reemplazar fondo</button>
                </>)}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        canvas { display: block; }
        input[type="color"] { -webkit-appearance: none; border-radius: 6px; padding: 0; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
      `}</style>
    </div>
  );
}
