"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Canvas as FabricCanvas, FabricObject, IText } from "fabric";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type LayerItem = {
  id: string;
  name: string;
  type: "text" | "image" | "shape" | "background";
  obj: FabricObject;
  visible: boolean;
  locked: boolean;
};

type TextProps = {
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  textAlign: string;
  fontWeight: string;
  charSpacing: number;
  lineHeight: number;
  opacity: number;
  angle: number;
  left: number;
  top: number;
  width: number;
};

type ImageProps = {
  opacity: number;
  angle: number;
  left: number;
  top: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
};

type LeftTool = "templates" | "elements" | "text" | "photos" | "background" | "layers";

type SaveState = "saved" | "saving" | "unsaved";

type GeneratedData = {
  eventName?: string;
  eventDate?: string;
  eventVenue?: string;
  eventPrice?: string;
  artistPhotoUrl?: string | null;
  artists?: Array<{ name: string; photoUrl: string | null }>;
  bgUrl?: string;
  bgWidth?: number;
  bgHeight?: number;
  textLayers?: Array<{
    id: string; role: string; content: string;
    style: { fontFamily: string; fontSize: number; fontWeight: string; color: string; textAlign: string; letterSpacing?: number; opacity?: number };
    position: { x: number; y: number; width: number; originX: string; originY: string };
  }>;
  palette?: { colors: string[]; label: string };
  format?: string;
  mode?: string;
};

const FONTS = [
  "Montserrat", "Playfair Display", "Bebas Neue", "Oswald",
  "Raleway", "Poppins", "Inter", "Anton", "Roboto Condensed",
];

const FORMAT_DIMS: Record<string, { w: number; h: number }> = {
  instagram: { w: 1080, h: 1350 },
  historia:  { w: 1080, h: 1920 },
  cuadrado:  { w: 1080, h: 1080 },
  evento:    { w: 1920, h: 1080 },
};

function uid() { return Math.random().toString(36).slice(2, 8); }

// ─── LAYER ICON ───────────────────────────────────────────────────────────────

function LayerIcon({ type }: { type: LayerItem["type"] }) {
  const icons = {
    text:       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 6h16M4 12h8m-8 6h16"/></svg>,
    image:      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
    shape:      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
    background: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  };
  return <span className="text-gray-500">{icons[type]}</span>;
}

// ─── MAIN EDITOR ──────────────────────────────────────────────────────────────

export default function GeneratedEditor() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<GeneratedData | null>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<LayerItem | null>(null);
  const [activeTool, setActiveTool] = useState<LeftTool>("layers");
  const [zoom, setZoom] = useState(50);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [canvasSize, setCanvasSize] = useState({ w: 1080, h: 1350 });
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Text props for selected text layer
  const [textProps, setTextProps] = useState<TextProps>({
    text: "", fontFamily: "Montserrat", fontSize: 60, fill: "#ffffff",
    textAlign: "center", fontWeight: "700", charSpacing: 0,
    lineHeight: 1.2, opacity: 1, angle: 0, left: 540, top: 100, width: 900,
  });

  // Image props for selected image layer
  const [imageProps, setImageProps] = useState<ImageProps>({
    opacity: 1, angle: 0, left: 0, top: 0, width: 400, height: 600, scaleX: 1, scaleY: 1,
  });

  // ─── LOAD DATA ──────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const raw = localStorage.getItem("artegenia_generated");
      if (raw) setData(JSON.parse(raw));
      else router.push("/create");
    } catch { router.push("/create"); }
  }, [router]);

  // ─── INIT FABRIC ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!data || !canvasRef.current) return;

    let isMounted = true;
    let canvas: FabricCanvas | null = null;

    (async () => {
      const fabric = await import("fabric");

      const format = data.format ?? "instagram";
      const dims = FORMAT_DIMS[format] ?? FORMAT_DIMS.instagram;
      if (isMounted) setCanvasSize({ w: dims.w, h: dims.h });

      const scale = zoom / 100;

      canvas = new fabric.Canvas(canvasRef.current!, {
        width: dims.w * scale,
        height: dims.h * scale,
        backgroundColor: "#1a1a2e",
        selection: true,
        preserveObjectStacking: true,
      });

      canvas.setZoom(scale);
      fabricRef.current = canvas;

      const newLayers: LayerItem[] = [];

      // ── Load background ──────────────────────────────────────────────────────
      if (data.bgUrl) {
        try {
          const bgImg = await fabric.FabricImage.fromURL(data.bgUrl, { crossOrigin: "anonymous" });
          bgImg.set({
            left: 0, top: 0,
            scaleX: dims.w / (bgImg.width ?? dims.w),
            scaleY: dims.h / (bgImg.height ?? dims.h),
            selectable: true, evented: true,
            lockMovementX: false, lockMovementY: false,
          });
          (bgImg as FabricObject & { customId?: string; customRole?: string }).customId = "background";
          (bgImg as FabricObject & { customRole?: string }).customRole = "background";
          canvas.add(bgImg);
          canvas.sendObjectToBack(bgImg);
          newLayers.unshift({
            id: "background", name: "Fondo generado", type: "background",
            obj: bgImg, visible: true, locked: false,
          });
        } catch (e) { console.warn("BG load error:", e); }
      }

      // ── Load text layers (from generate-flyer-assets) ────────────────────────
      if (data.textLayers && data.textLayers.length > 0) {
        for (const tl of data.textLayers) {
          const itext = new fabric.IText(tl.content, {
            left: tl.position.x,
            top: tl.position.y,
            width: tl.position.width,
            fontFamily: tl.style.fontFamily,
            fontSize: tl.style.fontSize,
            fontWeight: tl.style.fontWeight,
            fill: tl.style.color,
            textAlign: tl.style.textAlign as "left" | "center" | "right",
            charSpacing: (tl.style.letterSpacing ?? 0) * 10,
            originX: tl.position.originX as "left" | "center" | "right",
            originY: tl.position.originY as "top" | "center" | "bottom",
            opacity: tl.style.opacity ?? 1,
            selectable: true, evented: true,
          });
          (itext as FabricObject & { customId?: string }).customId = tl.id;
          canvas.add(itext);

          const roleLabels: Record<string, string> = {
            eventTitle: "Título del evento",
            mainArtist: "Artista principal",
            additionalArtists: "Artistas adicionales",
            date: "Fecha y hora",
            venue: "Lugar",
            price: "Precio",
            label: "Etiqueta",
          };
          newLayers.push({
            id: tl.id, name: roleLabels[tl.role] ?? tl.content.slice(0, 20),
            type: "text", obj: itext, visible: true, locked: false,
          });
        }
      } else {
        // Fallback: build text layers from event data
        const textDefs = [
          { id: "title",  content: data.eventName ?? "",  y: dims.h * 0.07, size: 80,  weight: "900", ls: 4  },
          { id: "date",   content: data.eventDate ?? "",  y: dims.h * 0.82, size: 28,  weight: "700", ls: 3  },
          { id: "venue",  content: data.eventVenue ?? "", y: dims.h * 0.87, size: 22,  weight: "500", ls: 2  },
          { id: "price",  content: data.eventPrice ?? "", y: dims.h * 0.92, size: 20,  weight: "700", ls: 2  },
        ].filter(t => t.content.trim());

        const palette = data.palette?.colors ?? ["#ffffff", "#cccccc", "#0d0d1a"];

        for (const td of textDefs) {
          const itext = new fabric.IText(td.content.toUpperCase(), {
            left: dims.w / 2, top: td.y, width: dims.w * 0.85,
            fontFamily: "Montserrat", fontSize: td.size,
            fontWeight: td.weight, fill: palette[0],
            textAlign: "center", charSpacing: td.ls * 10,
            originX: "center", originY: "top",
            selectable: true, evented: true,
          });
          (itext as FabricObject & { customId?: string }).customId = td.id;
          canvas.add(itext);
          const labelMap: Record<string, string> = { title: "Título", date: "Fecha", venue: "Lugar", price: "Precio" };
          newLayers.push({
            id: td.id, name: labelMap[td.id] ?? td.id,
            type: "text", obj: itext, visible: true, locked: false,
          });
        }
      }

      // ── Load artist cutouts ──────────────────────────────────────────────────
      const artists = data.artists ?? (data.artistPhotoUrl ? [{ name: "Artista", photoUrl: data.artistPhotoUrl }] : []);
      for (let i = 0; i < artists.length; i++) {
        const artist = artists[i];
        if (!artist.photoUrl) continue;
        try {
          const aImg = await fabric.FabricImage.fromURL(artist.photoUrl, { crossOrigin: "anonymous" });
          const maxH = dims.h * 0.6;
          const scale = maxH / (aImg.height ?? maxH);
          const w = (aImg.width ?? 400) * scale;
          const xPos = artists.length === 1
            ? dims.w / 2 - w / 2
            : i * (dims.w / artists.length) + dims.w / artists.length / 2 - w / 2;

          aImg.set({
            left: xPos, top: dims.h * 0.3,
            scaleX: scale, scaleY: scale,
            selectable: true, evented: true,
          });
          const artistId = `artist-${i}`;
          (aImg as FabricObject & { customId?: string }).customId = artistId;
          canvas.add(aImg);
          newLayers.push({
            id: artistId, name: artist.name || `Artista ${i + 1}`,
            type: "image", obj: aImg, visible: true, locked: false,
          });
        } catch (e) { console.warn(`Artist ${i} load error:`, e); }
      }

      canvas.renderAll();
      if (isMounted) setLayers(newLayers.reverse()); // Reverse for layers panel (top = front)

      // ── Selection handler ────────────────────────────────────────────────────
      canvas.on("selection:created", (e) => {
        const obj = e.selected?.[0];
        if (!obj) return;
        updateSelectedFromObj(obj, newLayers);
      });
      canvas.on("selection:updated", (e) => {
        const obj = e.selected?.[0];
        if (!obj) return;
        updateSelectedFromObj(obj, newLayers);
      });
      canvas.on("selection:cleared", () => {
        setSelectedLayer(null);
      });
      canvas.on("object:modified", () => {
        const obj = canvas?.getActiveObject();
        if (obj) updateSelectedFromObj(obj, newLayers);
        setSaveState("unsaved");
        saveHistory(canvas!);
      });

      saveHistory(canvas);
    })();

    return () => {
      isMounted = false;
      canvas?.dispose();
      fabricRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ─── UPDATE ZOOM ────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const scale = zoom / 100;
    canvas.setZoom(scale);
    canvas.setDimensions({ width: canvasSize.w * scale, height: canvasSize.h * scale });
    canvas.renderAll();
  }, [zoom, canvasSize]);

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  const updateSelectedFromObj = useCallback((obj: FabricObject, allLayers: LayerItem[]) => {
    const id = (obj as FabricObject & { customId?: string }).customId ?? "";
    const layer = allLayers.find(l => l.id === id) ?? null;
    setSelectedLayer(layer);

    if (obj.type === "i-text" || obj.type === "text") {
      const t = obj as IText;
      setTextProps({
        text: t.text ?? "",
        fontFamily: String(t.fontFamily ?? "Montserrat"),
        fontSize: t.fontSize ?? 60,
        fill: String(t.fill ?? "#ffffff"),
        textAlign: t.textAlign ?? "center",
        fontWeight: String(t.fontWeight ?? "700"),
        charSpacing: t.charSpacing ?? 0,
        lineHeight: t.lineHeight ?? 1.2,
        opacity: t.opacity ?? 1,
        angle: t.angle ?? 0,
        left: t.left ?? 0,
        top: t.top ?? 0,
        width: t.width ?? 900,
      });
    } else {
      setImageProps({
        opacity: obj.opacity ?? 1,
        angle: obj.angle ?? 0,
        left: obj.left ?? 0,
        top: obj.top ?? 0,
        width: (obj.width ?? 400) * (obj.scaleX ?? 1),
        height: (obj.height ?? 600) * (obj.scaleY ?? 1),
        scaleX: obj.scaleX ?? 1,
        scaleY: obj.scaleY ?? 1,
      });
    }
  }, []);

  const saveHistory = useCallback((canvas: FabricCanvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory(prev => {
      const next = prev.slice(0, historyIdx + 1);
      next.push(json);
      setHistoryIdx(next.length - 1);
      return next;
    });
  }, [historyIdx]);

  const undo = useCallback(async () => {
    if (historyIdx <= 0 || !fabricRef.current) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    await fabricRef.current.loadFromJSON(history[newIdx]);
    fabricRef.current.renderAll();
  }, [history, historyIdx]);

  const redo = useCallback(async () => {
    if (historyIdx >= history.length - 1 || !fabricRef.current) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx);
    await fabricRef.current.loadFromJSON(history[newIdx]);
    fabricRef.current.renderAll();
  }, [history, historyIdx]);

  // ─── TEXT UPDATES ────────────────────────────────────────────────────────────

  const applyTextProp = useCallback(<K extends keyof TextProps>(key: K, value: TextProps[K]) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject() as IText | undefined;
    if (!obj || (obj.type !== "i-text" && obj.type !== "text")) return;

    setTextProps(prev => ({ ...prev, [key]: value }));

    const fabricPropMap: Partial<Record<keyof TextProps, string>> = {
      fontFamily: "fontFamily", fontSize: "fontSize", fill: "fill",
      textAlign: "textAlign", fontWeight: "fontWeight",
      charSpacing: "charSpacing", lineHeight: "lineHeight",
      opacity: "opacity", angle: "angle", left: "left", top: "top", width: "width",
    };

    if (key === "text") {
      (obj as IText).set("text", String(value));
    } else {
      const fabricKey = fabricPropMap[key];
      if (fabricKey) obj.set(fabricKey as keyof IText, value as never);
    }

    canvas?.renderAll();
    setSaveState("unsaved");
  }, []);

  // ─── IMAGE UPDATES ────────────────────────────────────────────────────────────

  const applyImageProp = useCallback(<K extends keyof ImageProps>(key: K, value: ImageProps[K]) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.type === "i-text" || obj.type === "text") return;

    setImageProps(prev => ({ ...prev, [key]: value }));
    obj.set(key as keyof FabricObject, value as never);
    canvas?.renderAll();
    setSaveState("unsaved");
  }, []);

  // ─── LAYERS PANEL ────────────────────────────────────────────────────────────

  const refreshLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const objs = canvas.getObjects();
    setLayers(prev => {
      const updated = [...prev];
      for (const layer of updated) {
        const found = objs.find(o => (o as FabricObject & { customId?: string }).customId === layer.id);
        if (found) layer.obj = found;
      }
      return [...updated];
    });
  }, []);

  const toggleVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;
      l.obj.set("visible", !l.visible);
      fabricRef.current?.renderAll();
      return { ...l, visible: !l.visible };
    }));
    setSaveState("unsaved");
  }, []);

  const toggleLock = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => {
      if (l.id !== layerId) return l;
      const newLocked = !l.locked;
      l.obj.set({ selectable: !newLocked, evented: !newLocked });
      fabricRef.current?.renderAll();
      return { ...l, locked: newLocked };
    }));
  }, []);

  const deleteLayer = useCallback((layerId: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setLayers(prev => {
      const layer = prev.find(l => l.id === layerId);
      if (layer) { canvas.remove(layer.obj); canvas.renderAll(); }
      return prev.filter(l => l.id !== layerId);
    });
    setSelectedLayer(null);
    setSaveState("unsaved");
  }, []);

  const moveLayer = useCallback((layerId: string, dir: "up" | "down") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === layerId);
      if (idx < 0) return prev;
      const layer = prev[idx];
      if (dir === "up" && idx > 0) {
        canvas.bringObjectForward(layer.obj);
        const next = [...prev];
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
        return next;
      } else if (dir === "down" && idx < prev.length - 1) {
        canvas.sendObjectBackwards(layer.obj);
        const next = [...prev];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        return next;
      }
      return prev;
    });
    canvas.renderAll();
    setSaveState("unsaved");
  }, []);

  const selectLayerFromPanel = useCallback((layer: LayerItem) => {
    const canvas = fabricRef.current;
    if (!canvas || layer.locked) return;
    canvas.setActiveObject(layer.obj);
    canvas.renderAll();
    setSelectedLayer(layer);
    updateSelectedFromObj(layer.obj, layers);
  }, [layers, updateSelectedFromObj]);

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
    canvas.add(itext);
    canvas.setActiveObject(itext);
    canvas.renderAll();
    const newLayer: LayerItem = { id: newId, name: "Nuevo texto", type: "text", obj: itext, visible: true, locked: false };
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayer(newLayer);
    setSaveState("unsaved");
  }, [canvasSize]);

  // ─── EXPORT ────────────────────────────────────────────────────────────────

  const exportFlyer = useCallback((format: "png" | "jpg" = "png") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // Export at full resolution
    const currentZoom = canvas.getZoom();
    canvas.setZoom(1);
    canvas.setDimensions({ width: canvasSize.w, height: canvasSize.h });
    const dataUrl = canvas.toDataURL({
      format: format === "jpg" ? "jpeg" : "png",
      quality: 0.95,
      multiplier: 1,
    });
    canvas.setZoom(currentZoom);
    canvas.setDimensions({ width: canvasSize.w * currentZoom, height: canvasSize.h * currentZoom });
    canvas.renderAll();

    const link = document.createElement("a");
    link.download = `artegenia-flyer.${format}`;
    link.href = dataUrl;
    link.click();
  }, [canvasSize]);

  // ─── AUTO-SAVE ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (saveState !== "unsaved") return;
    const t = setTimeout(() => {
      setSaveState("saving");
      setTimeout(() => setSaveState("saved"), 800);
    }, 2000);
    return () => clearTimeout(t);
  }, [saveState]);

  // ─── KEYBOARD SHORTCUTS ─────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = canvas.getActiveObject();
        if (active && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
          const id = (active as FabricObject & { customId?: string }).customId;
          if (id) deleteLayer(id);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); setSaveState("saved"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteLayer, undo, redo]);

  // ─── LEFT TOOLBAR TOOLS ──────────────────────────────────────────────────────

  const TOOLS: Array<{ id: LeftTool; icon: React.ReactNode; label: string }> = [
    {
      id: "templates",
      label: "Templates",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    },
    {
      id: "elements",
      label: "Elementos",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    },
    {
      id: "text",
      label: "Texto",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>,
    },
    {
      id: "photos",
      label: "Fotos",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>,
    },
    {
      id: "background",
      label: "Fondo",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
    },
    {
      id: "layers",
      label: "Capas",
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    },
  ];

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden font-sans">

      {/* ══ TOP HEADER ════════════════════════════════════════════════════════════ */}
      <header className="h-12 bg-[#111118] border-b border-white/[0.07] flex items-center px-4 gap-3 shrink-0 z-50">

        {/* Logo + back */}
        <div className="flex items-center gap-3 mr-2">
          <button onClick={() => router.push("/create")}
            className="text-gray-500 hover:text-white transition-colors p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-[10px] font-black">AG</div>
            <span className="text-sm font-bold text-white hidden sm:block">Arte Gen</span>
          </div>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs">
          {saveState === "saving" && (
            <><div className="w-2.5 h-2.5 border border-gray-500 border-t-gray-300 rounded-full animate-spin" /><span className="text-gray-500">Guardando...</span></>
          )}
          {saveState === "saved" && (
            <><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-gray-500">Guardado</span></>
          )}
          {saveState === "unsaved" && (
            <><div className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-gray-500">Sin guardar</span></>
          )}
        </div>

        {/* Canvas size */}
        <div className="hidden md:flex items-center gap-1 text-xs text-gray-600 ml-2 border border-white/[0.06] rounded px-2 py-1">
          {canvasSize.w} × {canvasSize.h} px
        </div>

        <div className="flex-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={historyIdx <= 0}
            className="p-1.5 rounded hover:bg-white/8 text-gray-500 hover:text-white disabled:opacity-30 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 10h10a8 8 0 010 16v0M3 10l5-5m-5 5l5 5"/></svg>
          </button>
          <button onClick={redo} disabled={historyIdx >= history.length - 1}
            className="p-1.5 rounded hover:bg-white/8 text-gray-500 hover:text-white disabled:opacity-30 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 10H11a8 8 0 100 16v0M21 10l-5-5m5 5l-5 5"/></svg>
          </button>
        </div>

        {/* Export */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Descargar
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#1c1c28] border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
              {[["PNG", "png"], ["JPG", "jpg"]].map(([label, fmt]) => (
                <button key={fmt} onClick={() => exportFlyer(fmt as "png" | "jpg")}
                  className="w-full px-4 py-2.5 text-left text-xs text-gray-300 hover:bg-white/8 hover:text-white transition-all">
                  Exportar como {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ══ MAIN LAYOUT ══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ══ LEFT TOOLBAR ═══════════════════════════════════════════════════════ */}
        <div className="w-[60px] bg-[#111118] border-r border-white/[0.07] flex flex-col items-center py-3 gap-1 shrink-0 z-40">
          {TOOLS.map(tool => (
            <button key={tool.id}
              onClick={() => {
                setActiveTool(tool.id);
                if (tool.id === "text") addText();
              }}
              title={tool.label}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-medium ${
                activeTool === tool.id
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                  : "text-gray-600 hover:text-gray-300 hover:bg-white/5"
              }`}>
              {tool.icon}
              <span className="leading-none">{tool.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* ══ LEFT PANEL (contextual) ════════════════════════════════════════════ */}
        {activeTool === "layers" && (
          <div className="w-52 bg-[#111118] border-r border-white/[0.07] flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Capas</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {layers.map((layer, i) => (
                <div key={layer.id}
                  onClick={() => selectLayerFromPanel(layer)}
                  className={`group flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-white/[0.04] transition-all ${
                    selectedLayer?.id === layer.id ? "bg-purple-600/15 border-l-2 border-l-purple-500" : "hover:bg-white/4"
                  }`}>
                  {/* Drag handle */}
                  <svg className="w-3 h-3 text-gray-700 shrink-0 cursor-grab" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>

                  <LayerIcon type={layer.type} />

                  <span className={`flex-1 text-xs truncate min-w-0 ${selectedLayer?.id === layer.id ? "text-white" : "text-gray-400"}`}>
                    {layer.name}
                  </span>

                  {/* Controls */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); toggleVisibility(layer.id); }}
                      className={`p-0.5 rounded ${layer.visible ? "text-gray-500 hover:text-white" : "text-gray-700"}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{layer.visible ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></>}</svg>
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleLock(layer.id); }}
                      className={`p-0.5 rounded ${layer.locked ? "text-yellow-500" : "text-gray-500 hover:text-white"}`}>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{layer.locked ? <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></> : <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></>}</svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ CANVAS AREA ════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col bg-[#0e0e16] overflow-hidden">

          {/* Canvas container */}
          <div ref={containerRef} className="flex-1 overflow-auto flex items-center justify-center p-8">
            <div className="relative shadow-2xl shadow-black/60"
              style={{ width: canvasSize.w * zoom / 100, height: canvasSize.h * zoom / 100 }}>
              <canvas ref={canvasRef} />
              {!data && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] rounded">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Cargando editor…</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom zoom controls ─────────────────────────────────────────── */}
          <div className="h-10 bg-[#111118] border-t border-white/[0.06] flex items-center justify-center gap-3 px-4 shrink-0">
            <button onClick={() => setZoom(z => Math.max(10, z - 10))}
              className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all text-lg leading-none">−</button>
            <span className="text-xs text-gray-500 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))}
              className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all text-lg leading-none">+</button>
            <div className="w-px h-4 bg-white/[0.08] mx-1" />
            <button onClick={() => setZoom(50)} className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors">Ajustar</button>
            <button onClick={() => setZoom(100)} className="text-[10px] h-5 px-2 rounded border border-white/8 text-gray-600 hover:text-gray-300 transition-colors">100%</button>
          </div>
        </div>

        {/* ══ RIGHT PROPERTIES PANEL ════════════════════════════════════════════ */}
        <div className="w-64 bg-[#111118] border-l border-white/[0.07] flex flex-col shrink-0 overflow-hidden">

          {!selectedLayer ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>
              </div>
              <p className="text-xs text-gray-600">Selecciona un elemento<br/>para editar sus propiedades</p>
            </div>
          ) : selectedLayer.type === "text" ? (

            // ── TEXT PROPERTIES ────────────────────────────────────────────────
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Texto</p>
                <button onClick={() => deleteLayer(selectedLayer.id)}
                  className="text-gray-700 hover:text-red-400 transition-colors p-0.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                </button>
              </div>

              <div className="p-3 space-y-3">
                {/* Text content */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Contenido</label>
                  <textarea value={textProps.text}
                    onChange={e => applyTextProp("text", e.target.value)}
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white resize-none outline-none focus:border-purple-500/50" />
                </div>

                {/* Font family */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Fuente</label>
                  <select value={textProps.fontFamily}
                    onChange={e => applyTextProp("fontFamily", e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50">
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Size + Weight */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Tamaño</label>
                    <input type="number" value={textProps.fontSize}
                      onChange={e => applyTextProp("fontSize", Number(e.target.value))}
                      className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Peso</label>
                    <select value={textProps.fontWeight}
                      onChange={e => applyTextProp("fontWeight", e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50">
                      {["400", "500", "600", "700", "800", "900"].map(w => <option key={w} value={w}>{w === "400" ? "Normal" : w === "700" ? "Bold" : w === "900" ? "Black" : w}</option>)}
                    </select>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={textProps.fill}
                      onChange={e => applyTextProp("fill", e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent" />
                    <input type="text" value={textProps.fill}
                      onChange={e => applyTextProp("fill", e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50 font-mono" />
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Alineación</label>
                  <div className="flex gap-1">
                    {["left", "center", "right"].map(align => (
                      <button key={align} onClick={() => applyTextProp("textAlign", align)}
                        className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${textProps.textAlign === align ? "bg-purple-600 text-white" : "bg-white/5 text-gray-500 hover:text-white"}`}>
                        {align === "left" ? "↤" : align === "center" ? "↔" : "↦"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Letter spacing */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Espaciado · {Math.round(textProps.charSpacing / 10)}</label>
                  <input type="range" min={0} max={500} value={textProps.charSpacing}
                    onChange={e => applyTextProp("charSpacing", Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>

                {/* Opacity */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Opacidad · {Math.round(textProps.opacity * 100)}%</label>
                  <input type="range" min={0} max={1} step={0.01} value={textProps.opacity}
                    onChange={e => applyTextProp("opacity", Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>

                {/* Rotation */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Rotación · {Math.round(textProps.angle)}°</label>
                  <input type="range" min={-180} max={180} value={textProps.angle}
                    onChange={e => applyTextProp("angle", Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>

                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">X</label>
                    <input type="number" value={Math.round(textProps.left)}
                      onChange={e => applyTextProp("left", Number(e.target.value))}
                      className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Y</label>
                    <input type="number" value={Math.round(textProps.top)}
                      onChange={e => applyTextProp("top", Number(e.target.value))}
                      className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50" />
                  </div>
                </div>

                {/* Layer order */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Orden de capa</label>
                  <div className="flex gap-2">
                    <button onClick={() => moveLayer(selectedLayer.id, "up")}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↑ Subir</button>
                    <button onClick={() => moveLayer(selectedLayer.id, "down")}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↓ Bajar</button>
                  </div>
                </div>
              </div>
            </div>

          ) : (

            // ── IMAGE PROPERTIES ───────────────────────────────────────────────
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  {selectedLayer.type === "background" ? "Fondo" : "Imagen"}
                </p>
                {selectedLayer.type !== "background" && (
                  <button onClick={() => deleteLayer(selectedLayer.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors p-0.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  </button>
                )}
              </div>

              <div className="p-3 space-y-3">
                {/* Opacity */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Opacidad · {Math.round(imageProps.opacity * 100)}%</label>
                  <input type="range" min={0} max={1} step={0.01} value={imageProps.opacity}
                    onChange={e => applyImageProp("opacity", Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>

                {/* Rotation */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Rotación · {Math.round(imageProps.angle)}°</label>
                  <input type="range" min={-180} max={180} value={imageProps.angle}
                    onChange={e => applyImageProp("angle", Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>

                {/* Flip */}
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Voltear</label>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const obj = fabricRef.current?.getActiveObject();
                      if (obj) { obj.set("flipX", !obj.flipX); fabricRef.current?.renderAll(); setSaveState("unsaved"); }
                    }} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↔ Horizontal</button>
                    <button onClick={() => {
                      const obj = fabricRef.current?.getActiveObject();
                      if (obj) { obj.set("flipY", !obj.flipY); fabricRef.current?.renderAll(); setSaveState("unsaved"); }
                    }} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↕ Vertical</button>
                  </div>
                </div>

                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">X</label>
                    <input type="number" value={Math.round(imageProps.left)}
                      onChange={e => applyImageProp("left", Number(e.target.value))}
                      className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Y</label>
                    <input type="number" value={Math.round(imageProps.top)}
                      onChange={e => applyImageProp("top", Number(e.target.value))}
                      className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50" />
                  </div>
                </div>

                {/* Lock background */}
                {selectedLayer.type === "background" && (
                  <button onClick={() => toggleLock(selectedLayer.id)}
                    className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedLayer.locked ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "bg-white/5 text-gray-400 hover:text-white"
                    }`}>
                    {selectedLayer.locked ? "🔒 Fondo bloqueado" : "🔓 Bloquear fondo"}
                  </button>
                )}

                {/* Layer order */}
                {selectedLayer.type !== "background" && (
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Orden de capa</label>
                    <div className="flex gap-2">
                      <button onClick={() => moveLayer(selectedLayer.id, "up")}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↑ Subir</button>
                      <button onClick={() => moveLayer(selectedLayer.id, "down")}
                        className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↓ Bajar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        canvas { display: block; }
        input[type="range"]::-webkit-slider-thumb { cursor: pointer; }
        input[type="color"] { -webkit-appearance: none; border-radius: 6px; padding: 0; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
      `}</style>
    </div>
  );
}
