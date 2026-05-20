"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Canvas as FabricCanvas, FabricObject, IText } from "fabric";
import { templates, type Template } from "@/data/templates";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import { ArtistLibraryModal, type ArtistEntry } from "@/components/wizard/ArtistLibrary";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/lib/supabase";

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
type LeftTool = "design" | "elements" | "text" | "photos" | "background" | "layers" | "ai" | "brand" | "favorites";
type ViewMode = "sidebar" | "dock";

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
  /** Si se pasa, el editor carga el proyecto guardado del usuario por su UUID. */
  projectId?: string;
};

export default function GeneratedEditor({ templateId, projectId }: GeneratedEditorProps = {}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);

  const [data, setData] = useState<GeneratedData | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<LayerItem | null>(null);
  const [activeTool, setActiveTool] = useState<LeftTool>("layers");
  const [artistsModalOpen, setArtistsModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("Diseño sin título");
  const [viewMode, setViewMode] = useState<ViewMode>("sidebar");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    style: true, effects: false, transform: false, position: false, animation: false,
  });
  const [zoom, setZoom] = useState(50);
  const [floatingToolbar, setFloatingToolbar] = useState<{visible: boolean; x: number; y: number; alignOpen: boolean; moreOpen: boolean}>({ visible: false, x: 0, y: 0, alignOpen: false, moreOpen: false });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId ?? null);
  const [savingProject, setSavingProject] = useState(false);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  // Si la prop projectId cambia (HMR, navegacion interna), sincronizar el state
  // Sin esto, modificar un proyecto ya guardado podia crear duplicados en lugar de actualizar
  useEffect(() => {
    if (projectId && projectId !== currentProjectId) {
      setCurrentProjectId(projectId);
    }
  }, [projectId, currentProjectId]);

  const { saveProject } = useProjects();
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

  // ─── PERSIST VIEW MODE ────────────────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("artegenia-view-mode");
    if (saved === "sidebar" || saved === "dock") setViewMode(saved);
    const sections = localStorage.getItem("artegenia-open-sections");
    if (sections) {
      try { setOpenSections(JSON.parse(sections)); } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("artegenia-view-mode", viewMode);
  }, [viewMode]);
  useEffect(() => {
    localStorage.setItem("artegenia-open-sections", JSON.stringify(openSections));
  }, [openSections]);

  // ─── RECALC TOOLBAR ON ZOOM / RESIZE / SCROLL ─────────────────────────────
  const updateToolbarRef = useRef<() => void>(() => {});
  useEffect(() => {
    const handler = () => updateToolbarRef.current();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, []);

  useEffect(() => { updateToolbarRef.current(); }, [zoom]);

  // ─── COMMAND PALETTE: Cmd+K / Ctrl+K + Cmd+S para guardar ─────────────────
  const handleSaveRef = useRef<() => void>(() => {});
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveRef.current();
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ─── LOAD DATA ────────────────────────────────────────────────────────────

  useEffect(() => {
    // Modo proyecto guardado: cargar fabric_json desde Supabase
    if (projectId) {
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/"); return; }
        const { data: row, error } = await supabase.from("projects")
          .select("*")
          .eq("id", projectId)
          .eq("user_id", user.id)
          .single();
        if (error || !row) { router.push("/projects"); return; }
        setDocTitle(row.title ?? "Diseño sin título");
        setCurrentProjectId(row.id);
        setCanvasSize({ w: row.width, h: row.height });
        // Si tenía template_id, podemos usarlo de pista de paleta
        if (row.template_id) {
          const tpl = templates.find(t => t.id === row.template_id);
          if (tpl) setTemplate(tpl);
        }
        setData({
          format: row.format ?? (row.width === row.height ? "cuadrado" : "instagram"),
          palette: { colors: ["#ffffff", "#f5c518", "#0d0d1a"], label: "default" },
        });
        // Guardamos el JSON para hidratar el canvas cuando esté listo (en el otro useEffect)
        (window as unknown as { __pendingFabricJson?: object }).__pendingFabricJson = row.fabric_json ?? {};
      })();
      return;
    }
    // Modo plantilla: cargar la plantilla por id
    if (typeof templateId === "number") {
      const tpl = templates.find(t => t.id === templateId);
      if (tpl) {
        setTemplate(tpl);
        setDocTitle(tpl.title);
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

      // ── MODO PROYECTO GUARDADO: hidratar desde fabric_json ──────────────
      const pendingJson = (window as unknown as { __pendingFabricJson?: object }).__pendingFabricJson;
      if (pendingJson) {
        delete (window as unknown as { __pendingFabricJson?: object }).__pendingFabricJson;
        try {
          await canvas.loadFromJSON(pendingJson);
          canvas.setZoom(scale);
          canvas.setDimensions({ width: dims.w * scale, height: dims.h * scale });
          canvas.renderAll();
          // Reconstruir LayerItem[] de los objetos cargados
          canvas.getObjects().forEach((obj, i) => {
            const cid = (obj as FabricObject & { customId?: string }).customId ?? `obj-${i}`;
            (obj as FabricObject & { customId?: string }).customId = cid;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const objType = (obj as any).type as string;
            const layerType: LayerType = objType === "i-text" || objType === "textbox" ? "text" : "image";
            newLayers.push({ id: cid, name: `Capa ${i+1}`, type: layerType, obj, visible: true, locked: false });
          });
          if (isMounted) setLayers([...newLayers].reverse());
          return;
        } catch (e) {
          console.warn("Error cargando proyecto:", e);
        }
      }

      // ── MODO PLANTILLA ─────────────────────────────────────────────────────
      if (template) {
        try {
          if (template.layers) {
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
        canvas.on("selection:created", e => { const o = e.selected?.[0]; if (o) handleSelTpl(o); updateFloatingToolbar(); });
        canvas.on("selection:updated", e => { const o = e.selected?.[0]; if (o) handleSelTpl(o); updateFloatingToolbar(); });
        canvas.on("selection:cleared", () => { setSelectedLayer(null); setFloatingToolbar(p => ({ ...p, visible: false, alignOpen: false, moreOpen: false })); });
        canvas.on("object:modified", () => { const o = canvas?.getActiveObject(); if (o) handleSelTpl(o); setSaveState("unsaved"); updateFloatingToolbar(); });
        canvas.on("object:moving", () => updateFloatingToolbar());
        canvas.on("object:scaling", () => updateFloatingToolbar());
        canvas.on("object:rotating", () => updateFloatingToolbar());
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
      canvas.on("selection:created", e => { const o = e.selected?.[0]; if (o) handleSel(o); updateFloatingToolbar(); });
      canvas.on("selection:updated", e => { const o = e.selected?.[0]; if (o) handleSel(o); updateFloatingToolbar(); });
      canvas.on("selection:cleared", () => { setSelectedLayer(null); setFloatingToolbar(p => ({ ...p, visible: false, alignOpen: false, moreOpen: false })); });
      canvas.on("object:modified", () => { const o = canvas?.getActiveObject(); if (o) handleSel(o); setSaveState("unsaved"); updateFloatingToolbar(); });
      canvas.on("object:moving", () => updateFloatingToolbar());
      canvas.on("object:scaling", () => updateFloatingToolbar());
      canvas.on("object:rotating", () => updateFloatingToolbar());
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

  // ─── ALIGN TO CANVAS ──────────────────────────────────────────────────────

  const alignSelectedTo = useCallback((position: "left" | "center-h" | "right" | "top" | "center-v" | "bottom") => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || !canvas) return;
    const cw = canvasSize.w;
    const ch = canvasSize.h;
    const bounds = obj.getBoundingRect();
    const oW = bounds.width / canvas.getZoom();
    const oH = bounds.height / canvas.getZoom();
    // Account for object's origin
    const ox = obj.originX === "center" ? 0.5 : obj.originX === "right" ? 1 : 0;
    const oy = obj.originY === "center" ? 0.5 : obj.originY === "bottom" ? 1 : 0;

    if (position === "left") obj.set("left", ox * oW);
    if (position === "right") obj.set("left", cw - (1 - ox) * oW);
    if (position === "center-h") obj.set("left", cw / 2 - oW / 2 + ox * oW);
    if (position === "top") obj.set("top", oy * oH);
    if (position === "bottom") obj.set("top", ch - (1 - oy) * oH);
    if (position === "center-v") obj.set("top", ch / 2 - oH / 2 + oy * oH);

    obj.setCoords();
    canvas.renderAll();
    // Sync visible props
    if (selectedLayer?.type === "text") {
      setTextProps(prev => ({ ...prev, left: obj.left as number, top: obj.top as number }));
    } else if (selectedLayer?.type === "image") {
      setImageProps(prev => ({ ...prev, left: obj.left as number, top: obj.top as number }));
    }
    setSaveState("unsaved");
  }, [canvasSize, selectedLayer]);

  // ─── FLOATING TOOLBAR POSITIONING ────────────────────────────────────────

  const updateFloatingToolbar = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    const wrapper = canvasWrapperRef.current;
    if (!canvas || !obj || !wrapper) {
      setFloatingToolbar(prev => ({ ...prev, visible: false, alignOpen: false, moreOpen: false }));
      return;
    }
    const bounds = obj.getBoundingRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    // bounds is in canvas-internal coords (already zoomed by Fabric), so add wrapperRect offset
    const x = wrapperRect.left + bounds.left + bounds.width / 2;
    let y = wrapperRect.top + bounds.top - 12; // 12px above bounding box
    // If too close to top of viewport, place below the object instead
    if (y < 80) y = wrapperRect.top + bounds.top + bounds.height + 12;
    // Clamp X so the toolbar never overflows the canvas area
    const TOOLBAR_HALF = 230;
    const minX = wrapperRect.left + TOOLBAR_HALF;
    const maxX = wrapperRect.right - TOOLBAR_HALF;
    const clampedX = Math.max(minX, Math.min(x, maxX));
    setFloatingToolbar({ visible: true, x: clampedX, y, alignOpen: false, moreOpen: false });
  }, []);

  // Keep the ref in sync so window listeners can call latest version
  useEffect(() => { updateToolbarRef.current = updateFloatingToolbar; }, [updateFloatingToolbar]);

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

  // ─── ADD ARTISTS / LOGOS FROM ARTISTLIBRARY ──────────────────────────────
  const addArtistsFromLibrary = useCallback(async (entries: ArtistEntry[]) => {
    const canvas = fabricRef.current;
    if (!canvas || entries.length === 0) return;

    const fabric = await import("fabric");
    const newLayers: LayerItem[] = [];
    const cw = canvasSize.w;
    const ch = canvasSize.h;

    for (const entry of entries) {
      try {
        // Si la entry quiere quitar fondo, llamar al endpoint primero
        let srcUrl = entry.imageSrc;
        if (entry.removeBackground) {
          try {
            const res = await fetch("/api/remove-bg", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: entry.imageSrc }),
            });
            if (res.ok) {
              const json = await res.json();
              if (json.url) srcUrl = json.url;
            }
          } catch (e) {
            console.warn("remove-bg falló, usando imagen original:", e);
          }
        }

        const img = await fabric.FabricImage.fromURL(srcUrl, { crossOrigin: "anonymous" });
        const isLogo = entry.type === "logo";
        // Tamaños distintos: logo pequeño, artista grande
        const targetH = isLogo ? Math.min(180, ch * 0.13) : Math.min(900, ch * 0.65);
        const imgH = img.height ?? targetH;
        const scale = targetH / imgH;
        img.set({
          left: cw / 2,
          top: isLogo ? ch * 0.92 : ch * 0.5,
          originX: "center",
          originY: isLogo ? "bottom" : "center",
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          evented: true,
        });
        (img as FabricObject & { customId?: string }).customId = entry.id;
        canvas.add(img);
        newLayers.push({
          id: entry.id,
          name: entry.name || (isLogo ? "Logo" : "Artista"),
          type: "image",
          obj: img,
          visible: true,
          locked: false,
        });
      } catch (e) {
        console.warn("Error añadiendo entry:", entry.id, e);
      }
    }

    canvas.renderAll();
    setLayers(prev => [...newLayers.reverse(), ...prev]);
    setSaveState("unsaved");
  }, [canvasSize]);

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

  // ─── SAVE TO SUPABASE ─────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    setSavingProject(true);
    setSaveState("saving");
    try {
      // Serializar el canvas a JSON. Incluimos customId para reidentificar capas al cargar.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabricJson = (canvas.toJSON as any)(["customId"]) as object;

      // Generar thumbnail JPEG ~320px de ancho como data URL para guardar inline en BD
      // Cambiamos zoom temporal a tamaño real para que el export sea fiel
      let thumbnailUrl: string | null = null;
      try {
        const currentZoom = canvas.getZoom();
        canvas.setZoom(1);
        canvas.setDimensions({ width: canvasSize.w, height: canvasSize.h });
        const thumbScale = 320 / Math.max(canvasSize.w, canvasSize.h);
        thumbnailUrl = canvas.toDataURL({ format: "jpeg", quality: 0.6, multiplier: thumbScale });
        canvas.setZoom(currentZoom);
        canvas.setDimensions({ width: canvasSize.w * currentZoom, height: canvasSize.h * currentZoom });
        canvas.renderAll();
      } catch (thumbErr) {
        console.warn("No se pudo generar thumbnail:", thumbErr);
      }

      const result = await saveProject(
        currentProjectId,
        docTitle || "Diseño sin título",
        templateId ?? template?.id ?? 0,
        fabricJson,
        data?.format ?? "instagram",
        canvasSize.w,
        canvasSize.h,
        thumbnailUrl,
      );
      if (result) {
        if (!currentProjectId) {
          setCurrentProjectId(result);
          // Actualiza la URL del navegador a /editor/<uuid> sin recargar
          window.history.replaceState(null, "", `/editor/${result}`);
        }
        setSaveState("saved");
      } else {
        setSaveState("unsaved");
        alert("No se pudo guardar. ¿Has iniciado sesión?");
      }
    } catch (e) {
      console.error("Error guardando:", e);
      setSaveState("unsaved");
      alert("Error al guardar el diseño.");
    } finally {
      setSavingProject(false);
    }
  }, [currentProjectId, docTitle, templateId, template, data, canvasSize, saveProject]);

  // Sync ref so the Cmd+S keyboard handler always calls the latest version
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  // ─── LEFT TOOLS ───────────────────────────────────────────────────────────

  const TOOLS: Array<{ id: LeftTool; label: string; icon: React.ReactNode; comingSoon?: boolean }> = [
    { id: "design",    label: "Diseño",    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: "text",      label: "Texto",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg> },
    { id: "elements",  label: "Elementos", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>, comingSoon: true },
    { id: "photos",    label: "Fotos",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg> },
    { id: "background",label: "Fondo",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
    { id: "layers",    label: "Capas",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
    { id: "ai",        label: "IA Tools",  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z"/></svg>, comingSoon: true },
    { id: "brand",     label: "Brand Kit", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, comingSoon: true },
    { id: "favorites", label: "Favoritos", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/></svg>, comingSoon: true },
  ];

  const isBackground = selectedLayer?.type === "background";
  const isText = selectedLayer?.type === "text";
  const isImage = selectedLayer?.type === "image";

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">

      {/* HEADER — TOPBAR */}
      <header className="h-14 ag-glass border-b border-white/[0.06] flex items-center px-4 gap-3 shrink-0 z-50">
        {/* Back */}
        <button onClick={() => router.push(template ? "/templates" : "/create")}
          title="Volver"
          className="ag-icon-btn">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-600 flex items-center justify-center text-[11px] font-black shadow-lg shadow-purple-500/40">AG</div>
          <span className="text-[13px] font-bold hidden lg:block text-white/90 tracking-tight">Arte Gen</span>
        </div>

        <div className="w-px h-6 bg-white/[0.07] mx-1"/>

        {/* Editable doc title */}
        <input
          value={docTitle}
          onChange={(e) => { setDocTitle(e.target.value); setSaveState("unsaved"); }}
          className="bg-transparent text-sm font-semibold text-white/95 px-2 py-1 rounded-lg hover:bg-white/[0.04] focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all min-w-0 max-w-[200px]"
          placeholder="Diseño sin título"
        />

        {/* Save state */}
        <div className="flex items-center gap-1.5 text-[11px] ml-1">
          {saveState === "saving"  && <><div className="w-2.5 h-2.5 border border-gray-500 border-t-purple-400 rounded-full animate-spin"/><span className="text-gray-500">Guardando…</span></>}
          {saveState === "saved"   && <><div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"/><span className="text-gray-500">Guardado</span></>}
          {saveState === "unsaved" && <><div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"/><span className="text-gray-500">Sin guardar</span></>}
        </div>

        {/* Size badge */}
        <div className="hidden md:flex items-center text-[11px] text-gray-400 border border-white/[0.07] bg-white/[0.02] rounded-lg px-2.5 py-1 ml-1">
          {canvasSize.w} × {canvasSize.h} px
        </div>

        <div className="flex-1"/>

        {/* Undo/redo (placeholder for now — coming in fase 2 functional) */}
        <button title="Deshacer (próximamente)" className="ag-icon-btn opacity-50 cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 7v6h6M21 17a9 9 0 00-15-6.7L3 13"/></svg>
        </button>
        <button title="Rehacer (próximamente)" className="ag-icon-btn opacity-50 cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 7v6h-6M3 17a9 9 0 0115-6.7l3 2.7"/></svg>
        </button>

        <div className="w-px h-5 bg-white/[0.07] mx-0.5"/>

        {/* Zoom selector */}
        <div className="flex items-center bg-white/[0.03] border border-white/[0.07] rounded-lg overflow-hidden">
          <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">−</button>
          <select value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))}
            className="bg-transparent text-[11px] text-white/90 px-1.5 py-1 outline-none cursor-pointer">
            {[25, 50, 75, 100, 125, 150, 200].map(z => <option key={z} value={z} className="bg-[#1c1c28]">{z}%</option>)}
          </select>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">+</button>
        </div>

        <div className="w-px h-5 bg-white/[0.07] mx-0.5"/>

        {/* View mode toggle — pill */}
        <div className="flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden p-0.5">
          <button
            onClick={() => setViewMode("sidebar")}
            title="Vista con barra lateral fija"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              viewMode === "sidebar"
                ? "bg-purple-600/30 text-purple-200 shadow-sm shadow-purple-500/30"
                : "text-gray-500 hover:text-gray-300"
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="6" height="18" rx="2"/><line x1="6" y1="7" x2="6" y2="7.01"/><line x1="6" y1="11" x2="6" y2="11.01"/><line x1="6" y1="15" x2="6" y2="15.01"/></svg>
            Sidebar
          </button>
          <button
            onClick={() => setViewMode("dock")}
            title="Vista con dock flotante inferior"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              viewMode === "dock"
                ? "bg-purple-600/30 text-purple-200 shadow-sm shadow-purple-500/30"
                : "text-gray-500 hover:text-gray-300"
            }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="14" width="18" height="6" rx="2"/><circle cx="8" cy="17" r="0.7" fill="currentColor"/><circle cx="12" cy="17" r="0.7" fill="currentColor"/><circle cx="16" cy="17" r="0.7" fill="currentColor"/></svg>
            Dock
          </button>
        </div>

        {/* Command palette trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          title="Buscar comando (⌘K)"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>Buscar</span>
          <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/[0.06] text-[9px] text-gray-500 border border-white/5 font-mono">⌘K</kbd>
        </button>

        {/* Share (placeholder) */}
        <button title="Compartir (próximamente)" className="ag-icon-btn opacity-60">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={savingProject}
          title={currentProjectId ? "Guardar cambios (⌘S)" : "Guardar nuevo diseño"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {savingProject ? (
            <><div className="w-3 h-3 border border-gray-400 border-t-white rounded-full animate-spin"/><span>Guardando…</span></>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span>{currentProjectId ? "Guardar" : "Guardar"}</span></>
          )}
        </button>

        {/* Export */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Exportar
          </button>
          <div className="absolute right-0 top-full mt-1 w-36 ag-glass border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
            {[["PNG","png"],["JPG","jpg"]].map(([label, fmt]) => (
              <button key={fmt} onClick={() => exportFlyer(fmt as "png"|"jpg")}
                className="w-full px-4 py-2.5 text-left text-xs text-gray-300 hover:bg-white/8 hover:text-white transition-all">
                Exportar {label}
              </button>
            ))}
          </div>
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/[0.07] flex items-center justify-center text-[11px] font-bold text-white/80 cursor-pointer hover:border-white/20 transition-all ml-1">AG</div>
      </header>

      <div className="flex-1 flex overflow-hidden bg-[#070711]">

        {/* LEFT SIDEBAR — only when viewMode = sidebar */}
        {viewMode === "sidebar" && (
          <div className="w-[68px] ag-glass border-r border-white/[0.06] flex flex-col items-center py-3 gap-1.5 shrink-0 z-30">
            {TOOLS.map(tool => {
              const isActive = activeTool === tool.id;
              return (
                <button key={tool.id}
                  onClick={() => {
                    if (tool.comingSoon) return;
                    if (tool.id === "photos") { setArtistsModalOpen(true); return; }
                    setActiveTool(tool.id);
                    if (tool.id === "text") addText();
                  }}
                  title={tool.comingSoon ? `${tool.label} · próximamente` : tool.label}
                  className={`relative w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all text-[9px] font-medium ag-sidebar-btn ${
                    isActive
                      ? "bg-gradient-to-br from-purple-600/30 to-fuchsia-600/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/20"
                      : tool.comingSoon
                      ? "text-gray-600 hover:text-gray-400 cursor-default"
                      : "text-gray-500 hover:text-white hover:bg-white/[0.05] active:scale-95"
                  }`}>
                  {tool.icon}
                  <span className="leading-none">{tool.label.slice(0, 6)}</span>
                  {tool.comingSoon && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/60"/>}
                  {isActive && <span className="absolute -left-px top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full bg-gradient-to-b from-purple-400 to-fuchsia-400"/>}
                </button>
              );
            })}
          </div>
        )}

        {/* LAYERS PANEL */}
        {activeTool === "layers" && (
          <div className="w-52 ag-glass border-r border-white/[0.06] flex flex-col shrink-0">
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
        <div className="flex-1 flex flex-col bg-transparent overflow-hidden">
          <div className="flex-1 overflow-auto">
            {/* Center the canvas both horizontally and vertically */}
            <div className="min-h-full flex items-center justify-center p-8">
              <div ref={canvasWrapperRef} className="relative shadow-2xl shadow-black/70"
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
          <div className="h-10 ag-glass border-t border-white/[0.06] flex items-center justify-center gap-3 px-4 shrink-0">
            <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all text-lg">−</button>
            <span className="text-xs text-gray-500 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all text-lg">+</button>
            <div className="w-px h-4 bg-white/[0.08] mx-1"/>
            <button onClick={() => setZoom(50)} className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors">Ajustar</button>
            <button onClick={() => setZoom(100)} className="text-[10px] h-5 px-2 rounded border border-white/8 text-gray-600 hover:text-gray-300 transition-colors">100%</button>
          </div>
        </div>

        {/* RIGHT PROPERTIES PANEL */}
        <div className="w-72 ag-glass border-l border-white/[0.06] flex flex-col shrink-0 overflow-hidden">
          {!selectedLayer ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5"/></svg>
              </div>
              <p className="text-xs text-gray-600">Selecciona un elemento<br/>para editar sus propiedades</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* HEADER */}
              <div className="px-3.5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isText ? "bg-blue-500/20 text-blue-300" : isBackground ? "bg-emerald-500/20 text-emerald-300" : "bg-purple-500/20 text-purple-300"}`}>
                    {isText ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
                     : isBackground ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h18v18H3z"/></svg>
                     : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>}
                  </div>
                  <p className="text-[11px] font-semibold text-white/90">
                    {isText ? "Texto" : isBackground ? "Fondo" : "Imagen"}
                  </p>
                </div>
                {!isBackground && (
                  <button onClick={() => deleteLayer(selectedLayer.id)} title="Eliminar capa" className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-white/5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                  </button>
                )}
              </div>

              {/* ─── SECCIÓN ESTILO ──────────────────────────────────── */}
              <CollapsibleSection
                title="Estilo"
                sectionKey="style"
                openSections={openSections}
                setOpenSections={setOpenSections}>
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
                </>)}
                {isImage && (<>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Opacidad · {Math.round(imageProps.opacity*100)}%</label><input type="range" min={0} max={1} step={0.01} value={imageProps.opacity} onChange={e => applyImageProp("opacity", Number(e.target.value))} className="w-full accent-purple-500"/></div>
                </>)}
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
              </CollapsibleSection>

              {/* ─── SECCIÓN EFECTOS (solo texto) ─────────────────────── */}
              {isText && (
                <CollapsibleSection
                  title="Efectos"
                  sectionKey="effects"
                  openSections={openSections}
                  setOpenSections={setOpenSections}>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => applyTextProp("shadow", !textProps.shadow)}
                      className={`relative py-2 rounded-lg text-[10px] font-medium transition-all border ${textProps.shadow ? "bg-purple-600/30 text-purple-200 border-purple-500/40" : "bg-white/[0.03] text-gray-400 border-white/5 hover:text-white"}`}>
                      Sombra
                    </button>
                    <button disabled className="relative py-2 rounded-lg text-[10px] font-medium bg-white/[0.03] text-gray-600 border border-white/5 cursor-not-allowed">
                      Contorno
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"/>
                    </button>
                    <button disabled className="relative py-2 rounded-lg text-[10px] font-medium bg-white/[0.03] text-gray-600 border border-white/5 cursor-not-allowed">
                      Neón
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"/>
                    </button>
                  </div>
                  {textProps.shadow && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div><label className="text-[10px] text-gray-500 mb-1 block">Color</label><input type="color" value={textProps.shadowColor} onChange={e => applyTextProp("shadowColor", e.target.value)} className="w-full h-8 rounded-lg border-0 cursor-pointer bg-transparent"/></div>
                      <div><label className="text-[10px] text-gray-500 mb-1 block">Blur · {textProps.shadowBlur}</label><input type="range" min={0} max={30} value={textProps.shadowBlur} onChange={e => applyTextProp("shadowBlur", Number(e.target.value))} className="w-full accent-purple-500"/></div>
                    </div>
                  )}
                </CollapsibleSection>
              )}

              {/* ─── SECCIÓN TRANSFORMAR (solo imagen) ────────────────── */}
              {isImage && (
                <CollapsibleSection
                  title="Transformar"
                  sectionKey="transform"
                  openSections={openSections}
                  setOpenSections={setOpenSections}>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Voltear</label>
                    <div className="flex gap-2">
                      <button onClick={() => { const obj = fabricRef.current?.getActiveObject(); if (obj) { const nv = !obj.flipX; obj.set("flipX", nv); applyImageProp("flipX", nv); fabricRef.current?.renderAll(); } }} className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${imageProps.flipX?"bg-purple-600/20 text-purple-300":"bg-white/5 text-gray-400 hover:text-white"}`}>↔ Horizontal</button>
                      <button onClick={() => { const obj = fabricRef.current?.getActiveObject(); if (obj) { const nv = !obj.flipY; obj.set("flipY", nv); applyImageProp("flipY", nv); fabricRef.current?.renderAll(); } }} className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${imageProps.flipY?"bg-purple-600/20 text-purple-300":"bg-white/5 text-gray-400 hover:text-white"}`}>↕ Vertical</button>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* ─── SECCIÓN POSICIÓN Y TAMAÑO ─────────────────────────── */}
              {!isBackground && (
                <CollapsibleSection
                  title="Posición y tamaño"
                  sectionKey="position"
                  openSections={openSections}
                  setOpenSections={setOpenSections}>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[10px] text-gray-500 mb-1 block">X</label>
                      <input type="number" value={Math.round(isText ? textProps.left : imageProps.left)}
                        onChange={e => isText ? applyTextProp("left", Number(e.target.value)) : applyImageProp("left", Number(e.target.value))}
                        className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50"/></div>
                    <div><label className="text-[10px] text-gray-500 mb-1 block">Y</label>
                      <input type="number" value={Math.round(isText ? textProps.top : imageProps.top)}
                        onChange={e => isText ? applyTextProp("top", Number(e.target.value)) : applyImageProp("top", Number(e.target.value))}
                        className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50"/></div>
                  </div>
                  <div><label className="text-[10px] text-gray-500 mb-1 block">Rotación · {Math.round(isText ? textProps.angle : imageProps.angle)}°</label>
                    <input type="range" min={-180} max={180}
                      value={isText ? textProps.angle : imageProps.angle}
                      onChange={e => isText ? applyTextProp("angle", Number(e.target.value)) : applyImageProp("angle", Number(e.target.value))}
                      className="w-full accent-purple-500"/></div>

                  {/* ALINEAR RESPECTO AL CANVAS */}
                  <div><label className="text-[10px] text-gray-500 mb-1.5 block">Alinear en canvas</label>
                    <div className="grid grid-cols-3 gap-1">
                      <button onClick={() => alignSelectedTo("left")} title="Alinear izquierda" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="3" x2="3" y2="21"/><rect x="7" y="8" width="10" height="3"/><rect x="7" y="14" width="6" height="3"/></svg>
                      </button>
                      <button onClick={() => alignSelectedTo("center-h")} title="Centrar horizontal" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="3" x2="12" y2="21"/><rect x="7" y="8" width="10" height="3"/><rect x="9" y="14" width="6" height="3"/></svg>
                      </button>
                      <button onClick={() => alignSelectedTo("right")} title="Alinear derecha" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="21" y1="3" x2="21" y2="21"/><rect x="7" y="8" width="10" height="3"/><rect x="11" y="14" width="6" height="3"/></svg>
                      </button>
                      <button onClick={() => alignSelectedTo("top")} title="Alinear arriba" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="3" x2="21" y2="3"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="7" width="3" height="6"/></svg>
                      </button>
                      <button onClick={() => alignSelectedTo("center-v")} title="Centrar vertical" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="12" x2="21" y2="12"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="9" width="3" height="6"/></svg>
                      </button>
                      <button onClick={() => alignSelectedTo("bottom")} title="Alinear abajo" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="21" x2="21" y2="21"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="11" width="3" height="6"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* ORDEN */}
                  <div><label className="text-[10px] text-gray-500 mb-1.5 block">Orden de capa</label>
                    <div className="flex gap-2">
                      <button onClick={() => moveLayer(selectedLayer.id, "up")} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↑ Subir</button>
                      <button onClick={() => moveLayer(selectedLayer.id, "down")} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all">↓ Bajar</button>
                    </div>
                  </div>
                </CollapsibleSection>
              )}

              {/* ─── SECCIÓN ANIMACIÓN (placeholder) ─────────────────── */}
              <CollapsibleSection
                title="Animación"
                sectionKey="animation"
                openSections={openSections}
                setOpenSections={setOpenSections}
                badge="próximamente">
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Las animaciones de entrada y salida estarán disponibles próximamente.
                </p>
              </CollapsibleSection>
            </div>
          )}
        </div>
      </div>

      {/* DOCK INFERIOR — only when viewMode = dock */}
      {viewMode === "dock" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 ag-glass border border-white/[0.08] rounded-3xl px-3 py-2 flex items-center gap-1.5 shadow-2xl shadow-purple-500/10">
          {TOOLS.filter(t => ["design","text","photos","layers","ai","background"].includes(t.id)).map(tool => {
            const isActive = activeTool === tool.id;
            return (
              <button key={tool.id}
                onClick={() => {
                  if (tool.comingSoon) return;
                  if (tool.id === "photos") { setArtistsModalOpen(true); return; }
                  setActiveTool(tool.id);
                  if (tool.id === "text") addText();
                }}
                title={tool.comingSoon ? `${tool.label} · próximamente` : tool.label}
                className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-purple-600/30 to-fuchsia-600/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/30"
                    : tool.comingSoon
                    ? "text-gray-600 cursor-default"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.06] hover:-translate-y-0.5 active:scale-95"
                }`}>
                {tool.icon}
                {tool.comingSoon && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/60"/>}
                <span className="absolute bottom-full mb-2 px-2 py-1 rounded-md bg-black/85 border border-white/10 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">{tool.label}</span>
              </button>
            );
          })}
          <div className="w-px h-7 bg-white/[0.08] mx-1"/>
          <button onClick={() => exportFlyer("png")}
            title="Exportar PNG"
            className="group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/40 hover:-translate-y-0.5 active:scale-95">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            <span className="absolute bottom-full mb-2 px-2 py-1 rounded-md bg-black/85 border border-white/10 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Exportar</span>
          </button>
        </div>
      )}

      <style>{`
        canvas { display: block; }
        input[type="color"] { -webkit-appearance: none; border-radius: 6px; padding: 0; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
        .ag-glass {
          background: rgba(18, 18, 32, 0.88);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .ag-icon-btn {
          width: 32px; height: 32px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 10px;
          color: rgba(255,255,255,0.55);
          transition: all 0.15s ease;
        }
        .ag-icon-btn:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.95);
        }
        .ag-icon-btn:active:not(.cursor-not-allowed) {
          transform: scale(0.94);
        }
        .ag-sidebar-btn { transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1); }
        .ag-fab-btn {
          display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 6px 10px;
          gap: 2px;
          border-radius: 10px;
          color: rgba(255,255,255,0.7);
          font-size: 10px;
          font-weight: 500;
          transition: all 0.15s ease;
          cursor: pointer;
          background: transparent;
          border: none;
        }
        .ag-fab-btn:hover {
          background: rgba(255,255,255,0.06);
          color: white;
        }
        .ag-fab-btn:active {
          transform: scale(0.94);
        }
        .ag-fab-btn-danger:hover {
          background: rgba(248, 113, 113, 0.15);
          color: rgb(248, 113, 113);
        }
        @keyframes ag-fade-in {
          from { opacity: 0; transform: translate(-50%, calc(-100% + 4px)); }
          to   { opacity: 1; transform: translate(-50%, -100%); }
        }
      `}</style>

      {/* ─── FLOATING TOOLBAR ─────────────────────────────────────────── */}
      {floatingToolbar.visible && selectedLayer && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: floatingToolbar.x, top: floatingToolbar.y, transform: "translate(-50%, -100%)" }}>
          <div className="pointer-events-auto ag-glass border border-white/[0.08] rounded-2xl shadow-2xl shadow-purple-500/20 flex items-center gap-0.5 p-1 animate-in fade-in slide-in-from-bottom-1 duration-150">
            {/* Editar */}
            <button
              onClick={() => {
                const obj = fabricRef.current?.getActiveObject();
                if (!obj) return;
                if (selectedLayer.type === "text") {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (obj as any).enterEditing?.();
                  fabricRef.current?.renderAll();
                } else if (selectedLayer.type === "image") {
                  const input = document.createElement("input");
                  input.type = "file"; input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const src = ev.target?.result as string;
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (obj as any).setSrc?.(src, () => { fabricRef.current?.renderAll(); });
                      setSaveState("unsaved");
                    };
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }
              }}
              title="Editar"
              className="ag-fab-btn"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Editar</span>
            </button>

            {/* Estilos → scroll to panel */}
            <button
              onClick={() => setOpenSections(p => ({ ...p, style: true }))}
              title="Abrir panel de estilos"
              className="ag-fab-btn"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
              <span>Estilos</span>
            </button>

            {/* Alinear (popup) */}
            <div className="relative">
              <button
                onClick={() => setFloatingToolbar(p => ({ ...p, alignOpen: !p.alignOpen, moreOpen: false }))}
                title="Alinear"
                className={`ag-fab-btn ${floatingToolbar.alignOpen ? "bg-purple-600/20 text-purple-200" : ""}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="12" x2="21" y2="12"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="9" width="3" height="6"/></svg>
                <span>Alinear</span>
              </button>
              {floatingToolbar.alignOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 ag-glass border border-white/[0.08] rounded-xl p-1.5 shadow-2xl">
                  <div className="grid grid-cols-3 gap-1 w-32">
                    {[
                      { pos: "left", label: "Izq", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="3" x2="3" y2="21"/><rect x="7" y="8" width="10" height="3"/><rect x="7" y="14" width="6" height="3"/></svg> },
                      { pos: "center-h", label: "C·H", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="12" y1="3" x2="12" y2="21"/><rect x="7" y="8" width="10" height="3"/><rect x="9" y="14" width="6" height="3"/></svg> },
                      { pos: "right", label: "Der", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="21" y1="3" x2="21" y2="21"/><rect x="7" y="8" width="10" height="3"/><rect x="11" y="14" width="6" height="3"/></svg> },
                      { pos: "top", label: "Arr", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="3" x2="21" y2="3"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="7" width="3" height="6"/></svg> },
                      { pos: "center-v", label: "C·V", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="12" x2="21" y2="12"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="9" width="3" height="6"/></svg> },
                      { pos: "bottom", label: "Aba", icon: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="3" y1="21" x2="21" y2="21"/><rect x="8" y="7" width="3" height="10"/><rect x="14" y="11" width="3" height="6"/></svg> },
                    ].map(item => (
                      <button key={item.pos} onClick={() => { alignSelectedTo(item.pos as "left" | "center-h" | "right" | "top" | "center-v" | "bottom"); setFloatingToolbar(p => ({ ...p, alignOpen: false })); }} title={item.label} className="aspect-square rounded-lg bg-white/5 hover:bg-purple-600/20 text-gray-400 hover:text-purple-200 transition-all flex items-center justify-center">
                        {item.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bloquear */}
            <button
              onClick={() => toggleLock(selectedLayer.id)}
              title={selectedLayer.locked ? "Desbloquear" : "Bloquear"}
              className={`ag-fab-btn ${selectedLayer.locked ? "bg-amber-500/20 text-amber-300" : ""}`}>
              {selectedLayer.locked
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>}
              <span>{selectedLayer.locked ? "Desbloq." : "Bloquear"}</span>
            </button>

            {/* Eliminar */}
            <button
              onClick={() => deleteLayer(selectedLayer.id)}
              title="Eliminar"
              className="ag-fab-btn ag-fab-btn-danger">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              <span>Eliminar</span>
            </button>

            <div className="w-px h-6 bg-white/10 mx-0.5"/>

            {/* Más */}
            <div className="relative">
              <button
                onClick={() => setFloatingToolbar(p => ({ ...p, moreOpen: !p.moreOpen, alignOpen: false }))}
                title="Más opciones"
                className={`ag-fab-btn ${floatingToolbar.moreOpen ? "bg-white/10 text-white" : ""}`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
              </button>
              {floatingToolbar.moreOpen && (
                <div className="absolute top-full right-0 mt-2 ag-glass border border-white/[0.08] rounded-xl py-1 shadow-2xl min-w-[180px]">
                  {[
                    { label: "Duplicar", onClick: () => {
                      const obj = fabricRef.current?.getActiveObject();
                      if (!obj) return;
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (obj as any).clone?.((cloned: FabricObject) => {
                        cloned.set({ left: (obj.left ?? 0) + 30, top: (obj.top ?? 0) + 30 });
                        const newId = `dup-${uid()}`;
                        (cloned as FabricObject & { customId?: string }).customId = newId;
                        fabricRef.current?.add(cloned);
                        fabricRef.current?.setActiveObject(cloned);
                        fabricRef.current?.renderAll();
                        setLayers(prev => [{ id: newId, name: `${selectedLayer.name} (copia)`, type: selectedLayer.type, obj: cloned, visible: true, locked: false }, ...prev]);
                        setSaveState("unsaved");
                      });
                    } },
                    { label: "Subir capa", onClick: () => moveLayer(selectedLayer.id, "up") },
                    { label: "Bajar capa", onClick: () => moveLayer(selectedLayer.id, "down") },
                    ...(selectedLayer.type === "image" ? [
                      { label: "Voltear H", onClick: () => { const obj = fabricRef.current?.getActiveObject(); if (obj) { obj.set("flipX", !obj.flipX); fabricRef.current?.renderAll(); setSaveState("unsaved"); } } },
                      { label: "Voltear V", onClick: () => { const obj = fabricRef.current?.getActiveObject(); if (obj) { obj.set("flipY", !obj.flipY); fabricRef.current?.renderAll(); setSaveState("unsaved"); } } },
                    ] : []),
                  ].map((item, i) => (
                    <button key={i} onClick={() => { item.onClick(); setFloatingToolbar(p => ({ ...p, moreOpen: false })); }}
                      className="w-full text-left px-3.5 py-2 text-[11px] text-gray-300 hover:bg-white/5 hover:text-white transition-all">
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── COMMAND PALETTE ─────────────────────────────────────────── */}
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          isText={isText}
          isImage={isImage}
          hasSelection={!!selectedLayer}
          commands={[
            // ── Acciones ────────────────────────────────────
            { id: "save", label: "Guardar diseño", desc: "Subir a la nube (⌘S)", group: "Acciones", icon: "💾", run: handleSave },
            { id: "add-text", label: "Añadir texto", desc: "Insertar un nuevo texto", group: "Acciones", icon: "T", run: addText },
            { id: "open-photos", label: "Abrir biblioteca de fotos", desc: "Subir artista o logo", group: "Acciones", icon: "📷", run: () => setArtistsModalOpen(true) },
            { id: "duplicate", label: "Duplicar elemento", desc: "Clonar la capa seleccionada", group: "Acciones", icon: "⧉", disabled: !selectedLayer, run: () => {
              const obj = fabricRef.current?.getActiveObject();
              if (!obj || !selectedLayer) return;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (obj as any).clone?.((cloned: FabricObject) => {
                cloned.set({ left: (obj.left ?? 0) + 30, top: (obj.top ?? 0) + 30 });
                const newId = `dup-${uid()}`;
                (cloned as FabricObject & { customId?: string }).customId = newId;
                fabricRef.current?.add(cloned);
                fabricRef.current?.setActiveObject(cloned);
                fabricRef.current?.renderAll();
                setLayers(prev => [{ id: newId, name: `${selectedLayer.name} (copia)`, type: selectedLayer.type, obj: cloned, visible: true, locked: false }, ...prev]);
                setSaveState("unsaved");
              });
            } },
            { id: "delete", label: "Eliminar elemento", desc: "Borra la capa seleccionada", group: "Acciones", icon: "🗑", disabled: !selectedLayer, run: () => selectedLayer && deleteLayer(selectedLayer.id) },
            { id: "lock", label: selectedLayer?.locked ? "Desbloquear elemento" : "Bloquear elemento", desc: "Evitar modificaciones", group: "Acciones", icon: "🔒", disabled: !selectedLayer, run: () => selectedLayer && toggleLock(selectedLayer.id) },
            { id: "flip-h", label: "Voltear horizontal", desc: "Espejo en eje X", group: "Acciones", icon: "↔", disabled: !isImage, run: () => { const obj = fabricRef.current?.getActiveObject(); if (obj) { obj.set("flipX", !obj.flipX); fabricRef.current?.renderAll(); setSaveState("unsaved"); } } },
            { id: "flip-v", label: "Voltear vertical", desc: "Espejo en eje Y", group: "Acciones", icon: "↕", disabled: !isImage, run: () => { const obj = fabricRef.current?.getActiveObject(); if (obj) { obj.set("flipY", !obj.flipY); fabricRef.current?.renderAll(); setSaveState("unsaved"); } } },

            // ── Alinear ────────────────────────────────────
            { id: "center-h", label: "Centrar horizontal", desc: "Eje X del canvas", group: "Alinear", icon: "⇔", disabled: !selectedLayer, run: () => alignSelectedTo("center-h") },
            { id: "center-v", label: "Centrar vertical", desc: "Eje Y del canvas", group: "Alinear", icon: "⇕", disabled: !selectedLayer, run: () => alignSelectedTo("center-v") },
            { id: "align-left", label: "Alinear izquierda", desc: "Pegado al borde izq", group: "Alinear", icon: "⇤", disabled: !selectedLayer, run: () => alignSelectedTo("left") },
            { id: "align-right", label: "Alinear derecha", desc: "Pegado al borde der", group: "Alinear", icon: "⇥", disabled: !selectedLayer, run: () => alignSelectedTo("right") },
            { id: "align-top", label: "Alinear arriba", desc: "Pegado al borde superior", group: "Alinear", icon: "⇡", disabled: !selectedLayer, run: () => alignSelectedTo("top") },
            { id: "align-bottom", label: "Alinear abajo", desc: "Pegado al borde inferior", group: "Alinear", icon: "⇣", disabled: !selectedLayer, run: () => alignSelectedTo("bottom") },

            // ── Capa ────────────────────────────────────
            { id: "layer-up", label: "Subir capa", desc: "Mover hacia adelante", group: "Capa", icon: "▲", disabled: !selectedLayer, run: () => selectedLayer && moveLayer(selectedLayer.id, "up") },
            { id: "layer-down", label: "Bajar capa", desc: "Mover hacia atrás", group: "Capa", icon: "▼", disabled: !selectedLayer, run: () => selectedLayer && moveLayer(selectedLayer.id, "down") },

            // ── Vista ────────────────────────────────────
            { id: "view-sidebar", label: "Vista Sidebar", desc: "Barra lateral con categorías", group: "Vista", icon: "▥", run: () => setViewMode("sidebar") },
            { id: "view-dock", label: "Vista Dock", desc: "Dock flotante inferior", group: "Vista", icon: "▤", run: () => setViewMode("dock") },
            { id: "zoom-fit", label: "Zoom 50%", desc: "Ajustar al área visible", group: "Vista", icon: "⊟", run: () => setZoom(50) },
            { id: "zoom-100", label: "Zoom 100%", desc: "Tamaño real", group: "Vista", icon: "⊞", run: () => setZoom(100) },

            // ── Exportar ────────────────────────────────────
            { id: "export-png", label: "Exportar como PNG", desc: "Descargar imagen PNG", group: "Exportar", icon: "⬇", run: () => exportFlyer("png") },
            { id: "export-jpg", label: "Exportar como JPG", desc: "Descargar imagen JPG", group: "Exportar", icon: "⬇", run: () => exportFlyer("jpg") },

            // ── Navegación ────────────────────────────────────
            { id: "go-projects", label: "Mis diseños", desc: "Ver mis diseños guardados", group: "Navegación", icon: "📁", run: () => router.push("/projects") },
            { id: "go-templates", label: "Ver todas las plantillas", desc: "Volver al listado", group: "Navegación", icon: "←", run: () => router.push("/templates") },
          ]}
        />
      )}

      {artistsModalOpen && (
        <ArtistLibraryModal
          initialSelected={[]}
          onConfirm={(entries) => {
            setArtistsModalOpen(false);
            void addArtistsFromLibrary(entries);
          }}
          onClose={() => setArtistsModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─── COLLAPSIBLE SECTION COMPONENT ────────────────────────────────────────────

function CollapsibleSection({
  title, sectionKey, openSections, setOpenSections, children, badge,
}: {
  title: string;
  sectionKey: string;
  openSections: Record<string, boolean>;
  setOpenSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  children: React.ReactNode;
  badge?: string;
}) {
  const isOpen = openSections[sectionKey] ?? false;
  return (
    <div className="border-b border-white/[0.04]">
      <button
        onClick={() => setOpenSections(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors group">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-white/85 group-hover:text-white">{title}</span>
          {badge && (
            <span className="flex items-center gap-1 text-[9px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-full px-1.5 py-0.5">
              <span className="w-1 h-1 rounded-full bg-amber-400"/>{badge}
            </span>
          )}
        </div>
        <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {isOpen && (
        <div className="px-3.5 pb-3 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── COMMAND PALETTE COMPONENT ────────────────────────────────────────────────

type PaletteCommand = {
  id: string;
  label: string;
  desc: string;
  group: string;
  icon: string;
  disabled?: boolean;
  run: () => void;
};

function CommandPalette({
  commands,
  onClose,
}: {
  commands: PaletteCommand[];
  onClose: () => void;
  isText: boolean;
  isImage: boolean;
  hasSelection: boolean;
}) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? commands.filter(c => !c.disabled && (c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.group.toLowerCase().includes(q)))
    : commands.filter(c => !c.disabled);

  const grouped: Record<string, PaletteCommand[]> = {};
  for (const c of filtered) {
    if (!grouped[c.group]) grouped[c.group] = [];
    grouped[c.group].push(c);
  }
  const orderedGroups = ["Acciones", "Alinear", "Capa", "Vista", "Exportar", "Navegación"].filter(g => grouped[g]);
  const flat = orderedGroups.flatMap(g => grouped[g]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flat.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = flat[activeIdx];
        if (cmd) { cmd.run(); onClose(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flat, activeIdx, onClose]);

  useEffect(() => {
    const el = document.querySelector(`[data-palette-idx="${activeIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}>
      <div
        className="w-full max-w-xl ag-glass border border-white/[0.08] rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden animate-in slide-in-from-top-2 duration-200"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Describe lo que quieres hacer…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-gray-500 border border-white/5 font-mono">esc</kbd>
        </div>

        <div className="max-h-[420px] overflow-y-auto py-1">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-gray-600">
              Sin resultados. Prueba otra búsqueda.
            </div>
          ) : (
            orderedGroups.map(group => (
              <div key={group}>
                <div className="px-4 pt-3 pb-1 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">{group}</div>
                {grouped[group].map(cmd => {
                  const idx = flat.indexOf(cmd);
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={cmd.id}
                      data-palette-idx={idx}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onClick={() => { cmd.run(); onClose(); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isActive ? "bg-purple-600/20 border-l-2 border-l-purple-500" : "hover:bg-white/[0.03]"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${isActive ? "bg-purple-500/30 text-purple-200" : "bg-white/5 text-gray-400"}`}>
                        {cmd.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12.5px] font-medium ${isActive ? "text-white" : "text-gray-300"}`}>{cmd.label}</div>
                        <div className="text-[10.5px] text-gray-600 truncate">{cmd.desc}</div>
                      </div>
                      {isActive && (
                        <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-gray-400 border border-white/5 font-mono">↵</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-gray-600">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/5 font-mono">↑↓</kbd> navegar</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/5 font-mono">↵</kbd> ejecutar</span>
            <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/5 font-mono">esc</kbd> cerrar</span>
          </div>
          <span>{flat.length} comandos</span>
        </div>
      </div>
    </div>
  );
}
