"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Canvas as FabricCanvas,
  type FabricObject,
  Textbox,
  Rect,
  Circle,
  FabricImage,
} from "fabric";
import {
  ArrowLeft, Save, Loader2, Send, Check, Plus, Trash2, Copy,
  Type, Image as ImageIcon, Square, Circle as CircleIcon, Palette,
  Layers as LayersIcon, MoreHorizontal, ChevronUp, ChevronDown, GripVertical,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, X as XIcon,
  MoveUp, MoveDown,
} from "lucide-react";
import { useTemplateDrafts } from "@/hooks/useTemplateDrafts";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import type { TemplateLayer, TemplateVariant, AudienceId } from "@/data/templates";

// ════════════════════════════════════════════════════════════════════════════
//  TemplateCreatorWrapper — editor especializado para crear plantillas admin
//
//  Reusa la arquitectura de MobileEditor (simple y funcional) y le anade:
//   - Barra superior con metadata editable (titulo, categoria, audiencia, tags)
//   - Botones "Guardar borrador" y "Publicar"
//   - Persistencia en Supabase (useTemplateDrafts)
//
//  El catalogo /templates lee las publicadas mezcladas con data/templates.ts.
//
//  Esta primera version se base en el patron de MobileEditor (Fabric.js +
//  bottom sheets). Es funcional en desktop y mobile. En sesiones futuras
//  se puede sofisticar con el editor desktop (sidebar + paneles).
// ════════════════════════════════════════════════════════════════════════════

const CATEGORIES = [
  "Concierto", "Festival", "Fiesta", "Conferencia", "Clases", "Promocional", "Otros",
];

const AUDIENCES: { id: AudienceId; label: string }[] = [
  { id: "academias", label: "Academias" },
  { id: "productoras", label: "Productoras" },
  { id: "freelance", label: "Freelance" },
  { id: "instituciones", label: "Instituciones" },
  { id: "agencias", label: "Agencias" },
  { id: "colegios", label: "Colegios" },
];

const COLOR_PALETTE = [
  "#ffffff", "#000000", "#9ca3af", "#6b7280",
  "#fb923c", "#facc15", "#22c55e", "#22d3ee",
  "#3b82f6", "#a855f7", "#ec4899", "#ef4444",
];
const FONTS = [
  "Anton", "Bebas Neue", "Montserrat", "Playfair Display", "Oswald",
  "Cormorant Garamond", "Great Vibes",
];

type LayerItem = {
  id: string;
  name: string;
  type: "text" | "image" | "shape";
  obj: FabricObject;
};
type ToolId = "layers" | "text" | "photo" | "color" | "more";

type Props = {
  draftId: string;
};

export default function TemplateCreatorWrapper({ draftId }: Props) {
  const router = useRouter();
  const { getDraft, saveDraft, publishDraft, loading } = useTemplateDrafts();

  // ─── Metadata del draft ─────────────────────────────────────────────────
  const [title, setTitle] = useState("Plantilla sin título");
  const [category, setCategory] = useState("Otros");
  const [audience, setAudience] = useState<AudienceId[]>([]);
  const [premium, setPremium] = useState(false);
  const [variant, setVariant] = useState<TemplateVariant | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [metaPanelOpen, setMetaPanelOpen] = useState(false);

  // ─── Canvas Fabric ──────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const [canvasArea, setCanvasArea] = useState({ w: 300, h: 500 });
  const [canvasSize, setCanvasSize] = useState({ w: 1080, h: 1350 });
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<LayerItem | null>(null);
  const [activeSheet, setActiveSheet] = useState<ToolId | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [, forceRerender] = useState(0);
  const bumpRender = useCallback(() => forceRerender(n => n + 1), []);
  const [textEditFullscreen, setTextEditFullscreen] = useState(false);
  const [tempText, setTempText] = useState("");
  const lastAppliedZoomRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── 1. Cargar draft de Supabase ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const d = await getDraft(draftId);
      if (cancelled || !d) return;
      setTitle(d.title);
      setCategory(d.category);
      setAudience(d.audience as AudienceId[]);
      setPremium(d.premium);
      const v = (d.variants as TemplateVariant[])[0];
      if (v) {
        setVariant(v);
        setCanvasSize({ w: v.width, h: v.height });
      }
      setDraftReady(true);
    })();
    return () => { cancelled = true; };
  }, [draftId, getDraft]);

  // ─── 2. Compute canvas area + auto-fit zoom ─────────────────────────────
  const computeArea = useCallback(() => {
    if (!variant) return;
    const availW = window.innerWidth - 16;
    // Header (56) + bottom toolbar (72) + meta-bar (48) + margins (16)
    const availH = window.innerHeight - 56 - 72 - 48 - 16;
    setCanvasArea({ w: availW, h: Math.max(200, availH) });
  }, [variant]);

  useEffect(() => {
    computeArea();
    window.addEventListener("resize", computeArea);
    return () => window.removeEventListener("resize", computeArea);
  }, [computeArea]);

  // ─── 3. Inicializar Fabric + cargar capas del variant ───────────────────
  useEffect(() => {
    if (!canvasRef.current || !variant || !draftReady) return;

    const fc = new FabricCanvas(canvasRef.current, {
      width: variant.width,
      height: variant.height,
      backgroundColor: "#000",
      enableRetinaScaling: true,
      allowTouchScrolling: false,
      preserveObjectStacking: true,
      selection: false,
      uniformScaling: false,
    });
    fabricRef.current = fc;

    applyTemplateLayers(fc, variant.layers as TemplateLayer[]).then(() => {
      const items: LayerItem[] = fc.getObjects().map((obj, i) => {
        const layerData = (variant.layers as TemplateLayer[])?.[i];
        const type = layerData?.type ?? "shape";
        const name = layerData?.id ?? `Capa ${i + 1}`;
        return { id: name, name, type: type as LayerItem["type"], obj };
      });
      setLayers(items);

      fc.getObjects().forEach((obj, i) => {
        const ld = (variant.layers as TemplateLayer[])?.[i] as { selectable?: boolean } | undefined;
        if (ld && ld.selectable === false) {
          obj.selectable = false;
          obj.evented = false;
          return;
        }
        obj.set({
          cornerColor: "#a855f7",
          cornerStrokeColor: "#ffffff",
          cornerStyle: "circle",
          transparentCorners: false,
          borderColor: "#a855f7",
          borderScaleFactor: 2,
          padding: 8,
          hasRotatingPoint: true,
        });
      });
      setLoaded(true);
      fc.renderAll();
    });

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, draftReady]);

  // ─── 4. Auto-fit zoom + handle sizing dynamic ───────────────────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.setDimensions({ width: canvasArea.w, height: canvasArea.h });
    const zoomW = canvasArea.w / canvasSize.w;
    const zoomH = canvasArea.h / canvasSize.h;
    const fitZoom = Math.min(zoomW, zoomH) * 0.98;
    fc.setZoom(fitZoom);
    const tx = (canvasArea.w - canvasSize.w * fitZoom) / 2;
    const ty = (canvasArea.h - canvasSize.h * fitZoom) / 2;
    fc.setViewportTransform([fitZoom, 0, 0, fitZoom, tx, ty]);
    fc.requestRenderAll();
  }, [canvasArea.w, canvasArea.h, canvasSize.w, canvasSize.h]);

  // Handle sizing dynamic
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const apply = (force = false) => {
      const z = fc.getZoom();
      if (z <= 0) return;
      if (!force && Math.abs(z - lastAppliedZoomRef.current) < 0.01) return;
      lastAppliedZoomRef.current = z;
      fc.getObjects().forEach(obj => {
        if (!obj.selectable) return;
        obj.set({
          cornerSize: 40 / z,
          touchCornerSize: 40 / z,
          padding: 12 / z,
          borderScaleFactor: 2 / z,
          rotatingPointOffset: 60 / z,
        });
        obj.setCoords();
      });
      fc.requestRenderAll();
    };
    apply(true);
    const onTransform = () => apply();
    fc.on("after:render", onTransform);
    return () => { fc.off("after:render", onTransform); };
  }, [loaded]);

  // ─── Selection handlers + double tap ────────────────────────────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const onSelect = (e: { selected?: FabricObject[] }) => {
      const sel = e.selected?.[0];
      if (!sel) return;
      const found = layers.find(l => l.obj === sel);
      if (found) setSelectedLayer(found);
    };
    const onDeselect = () => setSelectedLayer(null);
    fc.on("selection:created", onSelect);
    fc.on("selection:updated", onSelect);
    fc.on("selection:cleared", onDeselect);
    return () => {
      fc.off("selection:created", onSelect);
      fc.off("selection:updated", onSelect);
      fc.off("selection:cleared", onDeselect);
    };
  }, [layers]);

  useEffect(() => {
    if (!selectedLayer) {
      if (activeSheet === "text" || activeSheet === "color") setActiveSheet(null);
      return;
    }
    if (selectedLayer.type === "text") setActiveSheet("text");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayer]);

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const onDouble = (e: { target?: FabricObject }) => {
      const target = e.target;
      if (!target) return;
      const isText = target.type === "textbox" || target.type === "i-text" || target.type === "text";
      if (!isText) return;
      const t = target as unknown as { text: string };
      setTempText(t.text ?? "");
      setTextEditFullscreen(true);
    };
    fc.on("mouse:dblclick", onDouble);
    return () => { fc.off("mouse:dblclick", onDouble); };
  }, [loaded]);

  // ─── Pinch zoom + pan ───────────────────────────────────────────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const el = fc.upperCanvasEl;
    if (!el) return;

    let mode: "none" | "pan" | "pinch" = "none";
    let lastPanX = 0, lastPanY = 0;
    let initialDist = 0;
    let initialZoom = 1;
    let initialMidX = 0, initialMidY = 0;
    let initialVptX = 0, initialVptY = 0;

    const distance = (t1: Touch, t2: Touch) => Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        fc.discardActiveObject();
        mode = "pinch";
        const [t1, t2] = [e.touches[0], e.touches[1]];
        initialDist = distance(t1, t2);
        initialZoom = fc.getZoom();
        const vpt = fc.viewportTransform;
        if (!vpt) return;
        initialVptX = vpt[4];
        initialVptY = vpt[5];
        const rect = el.getBoundingClientRect();
        initialMidX = ((t1.clientX + t2.clientX) / 2) - rect.left;
        initialMidY = ((t1.clientY + t2.clientY) / 2) - rect.top;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        const rect = el.getBoundingClientRect();
        const target = fc.findTarget({ clientX: t.clientX, clientY: t.clientY } as unknown as MouseEvent);
        if (!target) {
          mode = "pan";
          lastPanX = t.clientX - rect.left;
          lastPanY = t.clientY - rect.top;
        } else { mode = "none"; }
      } else { mode = "none"; }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (mode === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        const [t1, t2] = [e.touches[0], e.touches[1]];
        const newDist = distance(t1, t2);
        const ratio = newDist / initialDist;
        let newZoom = initialZoom * ratio;
        newZoom = Math.max(0.1, Math.min(5, newZoom));
        const zoomRatio = newZoom / initialZoom;
        const newVptX = initialMidX - (initialMidX - initialVptX) * zoomRatio;
        const newVptY = initialMidY - (initialMidY - initialVptY) * zoomRatio;
        fc.setViewportTransform([newZoom, 0, 0, newZoom, newVptX, newVptY]);
        fc.requestRenderAll();
      } else if (mode === "pan" && e.touches.length === 1) {
        e.preventDefault();
        const t = e.touches[0];
        const rect = el.getBoundingClientRect();
        const x = t.clientX - rect.left;
        const y = t.clientY - rect.top;
        const dx = x - lastPanX;
        const dy = y - lastPanY;
        const vpt = fc.viewportTransform;
        if (!vpt) return;
        vpt[4] += dx;
        vpt[5] += dy;
        fc.setViewportTransform(vpt);
        fc.requestRenderAll();
        lastPanX = x;
        lastPanY = y;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) mode = "none";
      else if (e.touches.length === 1 && mode === "pinch") mode = "none";
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [loaded]);

  // ─── updateProp ────────────────────────────────────────────────────────
  const updateProp = useCallback((prop: string, value: unknown) => {
    const fc = fabricRef.current;
    if (!fc || !selectedLayer) return;
    const obj = selectedLayer.obj as FabricObject & Record<string, unknown>;
    obj.set(prop, value);
    obj.setCoords();
    fc.requestRenderAll();
    bumpRender();
  }, [selectedLayer, bumpRender]);

  const commitFullscreenText = useCallback(() => {
    if (!selectedLayer || selectedLayer.type !== "text") {
      setTextEditFullscreen(false);
      return;
    }
    updateProp("text", tempText);
    setTextEditFullscreen(false);
  }, [selectedLayer, tempText, updateProp]);

  // ─── Layer helpers ──────────────────────────────────────────────────────
  const registerLayer = useCallback((obj: FabricObject, name: string, type: LayerItem["type"]) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    obj.set({
      cornerColor: "#a855f7",
      cornerStrokeColor: "#ffffff",
      cornerStyle: "circle",
      transparentCorners: false,
      borderColor: "#a855f7",
      borderScaleFactor: 2,
      padding: 8,
      hasRotatingPoint: true,
    });
    const item: LayerItem = { id, name, type, obj };
    setLayers(prev => [...prev, item]);
    lastAppliedZoomRef.current = 0;
    return item;
  }, []);

  const handleAddText = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const t = new Textbox("Doble tap para editar", {
      left: canvasSize.w / 2 - 200,
      top: canvasSize.h / 2 - 30,
      width: 400, fontSize: 60, fontFamily: "Montserrat",
      fill: "#ffffff", fontWeight: "700", textAlign: "center",
    });
    fc.add(t);
    const item = registerLayer(t, "Texto", "text");
    fc.setActiveObject(t);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet("text");
  }, [canvasSize.w, canvasSize.h, registerLayer]);

  const handleAddRect = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const r = new Rect({
      left: canvasSize.w / 2 - 150,
      top: canvasSize.h / 2 - 150,
      width: 300, height: 300, fill: "#a855f7", opacity: 0.8,
    });
    fc.add(r);
    const item = registerLayer(r, "Rectángulo", "shape");
    fc.setActiveObject(r);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [canvasSize.w, canvasSize.h, registerLayer]);

  const handleAddCircle = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const c = new Circle({
      left: canvasSize.w / 2 - 150,
      top: canvasSize.h / 2 - 150,
      radius: 150, fill: "#fb923c", opacity: 0.8,
    });
    fc.add(c);
    const item = registerLayer(c, "Círculo", "shape");
    fc.setActiveObject(c);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [canvasSize.w, canvasSize.h, registerLayer]);

  const handleAddPhotoClick = useCallback(() => fileInputRef.current?.click(), []);
  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fc = fabricRef.current;
    if (!fc) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      try {
        const img = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
        const maxW = canvasSize.w * 0.6;
        const maxH = canvasSize.h * 0.6;
        const imgW = img.width ?? 1;
        const imgH = img.height ?? 1;
        const s = Math.min(maxW / imgW, maxH / imgH, 1);
        img.set({
          left: canvasSize.w / 2 - (imgW * s) / 2,
          top: canvasSize.h / 2 - (imgH * s) / 2,
          scaleX: s, scaleY: s,
        });
        fc.add(img);
        const item = registerLayer(img, "Foto", "image");
        fc.setActiveObject(img);
        fc.requestRenderAll();
        setSelectedLayer(item);
        setActiveSheet(null);
      } catch (err) { console.error(err); alert("No se pudo cargar la foto"); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [canvasSize.w, canvasSize.h, registerLayer]);

  const handleDeleteSelected = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !selectedLayer) return;
    fc.remove(selectedLayer.obj);
    fc.discardActiveObject();
    fc.renderAll();
    setLayers(prev => prev.filter(l => l.id !== selectedLayer.id));
    setSelectedLayer(null);
  }, [selectedLayer]);

  const handleDuplicateSelected = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc || !selectedLayer) return;
    try {
      const cloned = await selectedLayer.obj.clone();
      cloned.set({
        left: (selectedLayer.obj.left ?? 0) + 40,
        top: (selectedLayer.obj.top ?? 0) + 40,
      });
      fc.add(cloned);
      const item = registerLayer(cloned, `${selectedLayer.name} (copia)`, selectedLayer.type);
      fc.setActiveObject(cloned);
      fc.requestRenderAll();
      setSelectedLayer(item);
    } catch (err) { console.error(err); }
  }, [selectedLayer, registerLayer]);

  // ─── Save + Publish ─────────────────────────────────────────────────────
  const serializeCanvasToVariant = useCallback((): TemplateVariant | null => {
    const fc = fabricRef.current;
    if (!fc) return null;
    // Volcar canvas a json y luego mapearlo a TemplateLayer[]
    const fabricJson = fc.toJSON() as { objects?: Array<Record<string, unknown>> };
    const objs = fabricJson.objects ?? [];

    const layersOut: TemplateLayer[] = objs.map((o, i) => {
      const oType = o.type as string;
      if (oType === "textbox" || oType === "i-text" || oType === "text") {
        return {
          id: `text-${i}`,
          type: "text",
          text: (o.text as string) ?? "",
          x: (o.left as number) ?? 0,
          y: (o.top as number) ?? 0,
          width: ((o.width as number) ?? 300) * ((o.scaleX as number) ?? 1),
          fontSize: (o.fontSize as number) ?? 60,
          fontFamily: (o.fontFamily as string) ?? "Montserrat",
          color: (o.fill as string) ?? "#fff",
          fontWeight: o.fontWeight as string,
          fontStyle: o.fontStyle as "normal" | "italic" | "oblique" | undefined,
          textAlign: o.textAlign as "left" | "center" | "right" | undefined,
          originX: o.originX as "left" | "center" | "right" | undefined,
          originY: o.originY as "top" | "center" | "bottom" | undefined,
          angle: o.angle as number | undefined,
          charSpacing: o.charSpacing as number | undefined,
          lineHeight: o.lineHeight as number | undefined,
        } as TemplateLayer;
      }
      if (oType === "image") {
        return {
          id: `image-${i}`,
          type: "image",
          src: (o.src as string) ?? "",
          x: o.left as number | undefined,
          y: o.top as number | undefined,
          scaleX: o.scaleX as number | undefined,
          scaleY: o.scaleY as number | undefined,
          opacity: o.opacity as number | undefined,
          angle: o.angle as number | undefined,
        } as TemplateLayer;
      }
      // rect / circle / shape
      const isRect = oType === "rect";
      const isCircle = oType === "circle";
      return {
        id: `shape-${i}`,
        type: "shape",
        shape: isCircle ? "circle" : "rect",
        x: (o.left as number) ?? 0,
        y: (o.top as number) ?? 0,
        width: ((o.width as number) ?? 100) * ((o.scaleX as number) ?? 1),
        height: ((o.height as number) ?? 100) * ((o.scaleY as number) ?? 1),
        fill: (o.fill as string) ?? "#fff",
        opacity: o.opacity as number | undefined,
        radius: isCircle ? (o.radius as number) : undefined,
        selectable: (o.selectable as boolean | undefined),
        angle: o.angle as number | undefined,
      } as TemplateLayer;
    });

    return {
      format: variant?.format ?? "story",
      width: canvasSize.w,
      height: canvasSize.h,
      layers: layersOut,
    };
  }, [variant, canvasSize.w, canvasSize.h]);

  const handleSaveDraft = useCallback(async () => {
    const newVariant = serializeCanvasToVariant();
    if (!newVariant) return;
    setSaving(true);
    const id = await saveDraft(draftId, {
      title, category, audience, premium,
      variants: [newVariant],
      status: "draft",
    });
    setSaving(false);
    if (id) {
      setSavedRecently(true);
      setTimeout(() => setSavedRecently(false), 2000);
    } else {
      alert("Error guardando borrador. Mira la consola para detalles.");
    }
  }, [draftId, title, category, audience, premium, serializeCanvasToVariant, saveDraft]);

  const handlePublish = useCallback(async () => {
    if (!confirm(`¿Publicar "${title}" al catálogo? Aparecerá en /templates para todos los usuarios.`)) return;
    // Primero guardamos cambios pendientes
    await handleSaveDraft();
    setPublishing(true);
    const id = await publishDraft(draftId);
    setPublishing(false);
    if (id) {
      alert("¡Plantilla publicada! Verás aparecer en /templates.");
      router.push("/admin/templates/new");
    } else {
      alert("Error publicando. Mira la consola.");
    }
  }, [draftId, title, handleSaveDraft, publishDraft, router]);

  // ─── Render ─────────────────────────────────────────────────────────────
  if (!draftReady) {
    return (
      <div className="fixed inset-0 bg-[#070711] flex items-center justify-center text-white">
        <Loader2 size={32} className="animate-spin text-purple-400"/>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#070711] flex flex-col text-white overflow-hidden">

      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <header className="h-14 bg-[#0e0e14]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center px-2 sm:px-3 gap-2 shrink-0 z-30">
        <button
          onClick={() => router.push("/admin/templates/new")}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 active:bg-white/10"
        >
          <ArrowLeft size={20} strokeWidth={2}/>
        </button>
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-white outline-none focus:bg-white/[0.04] rounded-lg px-2 py-1"
            placeholder="Sin título"
          />
          <button
            onClick={() => setMetaPanelOpen(p => !p)}
            className="text-[10px] text-gray-500 px-2 hover:text-gray-300 active:text-gray-300"
          >
            {category} · {audience.length > 0 ? audience.join(", ") : "Sin audiencia"} · {premium ? "Premium" : "Free"} {metaPanelOpen ? "▲" : "▼"}
          </button>
        </div>
        <button
          onClick={handleSaveDraft}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.06] active:bg-white/[0.12] border border-white/[0.10] text-white text-xs font-bold disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin"/> : (savedRecently ? <Check size={14}/> : <Save size={14} strokeWidth={2.5}/>)}
          <span className="hidden sm:inline">{savedRecently ? "Guardado" : "Guardar"}</span>
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing || loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 active:from-emerald-700 active:to-green-700 text-white text-xs font-bold disabled:opacity-50"
        >
          {publishing ? <Loader2 size={14} className="animate-spin"/> : <Send size={14} strokeWidth={2.5}/>}
          <span className="hidden sm:inline">Publicar</span>
        </button>
      </header>

      {/* ═══ META PANEL desplegable ═══════════════════════════════════════ */}
      {metaPanelOpen && (
        <div className="bg-[#0f0f1a] border-b border-white/[0.08] px-3 sm:px-4 py-3 space-y-3 shrink-0 z-20 max-h-[40vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs text-gray-400 font-semibold w-24 shrink-0">Categoría</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500/40"
            >
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1c1c28]">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold mb-2 block">Audiencia (multi)</label>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCES.map(a => {
                const active = audience.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => setAudience(prev => active ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      active
                        ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                        : "bg-white/[0.04] text-gray-400 border border-white/10 active:bg-white/[0.08]"
                    }`}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400 font-semibold w-24 shrink-0">Premium</label>
            <button
              onClick={() => setPremium(p => !p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                premium
                  ? "bg-fuchsia-600/30 text-fuchsia-200 border border-fuchsia-500/40"
                  : "bg-white/[0.04] text-gray-500 border border-white/10"
              }`}
            >
              {premium ? "✓ Plan Premium" : "Plantilla Free"}
            </button>
          </div>
        </div>
      )}

      {/* ═══ CANVAS AREA ══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-2 relative">
        <div
          className="relative shadow-2xl shadow-black/70 bg-[#1a1a2e] rounded-sm overflow-hidden"
          style={{ width: canvasArea.w, height: canvasArea.h }}
        >
          <canvas ref={canvasRef}/>
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
              <Loader2 size={32} className="animate-spin text-purple-500"/>
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM TOOLBAR ════════════════════════════════════════════════ */}
      <nav className="h-[72px] bg-[#0e0e14]/95 backdrop-blur-md border-t border-white/[0.08] flex items-center justify-around px-2 shrink-0 z-20 safe-area-bottom">
        {([
          { id: "layers" as ToolId, label: "Capas", icon: LayersIcon },
          { id: "text" as ToolId, label: "Texto", icon: Type },
          { id: "photo" as ToolId, label: "Foto", icon: ImageIcon },
          { id: "color" as ToolId, label: "Color", icon: Palette },
          { id: "more" as ToolId, label: "Más", icon: MoreHorizontal },
        ]).map(tool => {
          const Icon = tool.icon;
          const isActive = activeSheet === tool.id;
          return (
            <button key={tool.id}
              onClick={() => setActiveSheet(isActive ? null : tool.id)}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-colors ${
                isActive ? "text-purple-300 bg-purple-500/15" : "text-gray-400 active:text-white active:bg-white/5"
              }`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2}/>
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>{tool.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ═══ FILE INPUT INVISIBLE ═════════════════════════════════════════ */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

      {/* ═══ BOTTOM SHEETS ════════════════════════════════════════════════ */}
      {activeSheet && (
        <>
          <div onClick={() => setActiveSheet(null)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"/>
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f1a] rounded-t-3xl border-t border-white/10 shadow-2xl pb-8 max-h-[70vh] flex flex-col safe-area-bottom">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-3 shrink-0"/>
            <div className="px-4 pb-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <span className="text-sm font-bold uppercase tracking-widest text-gray-300">
                {activeSheet === "layers" && "Capas"}
                {activeSheet === "text" && "Texto"}
                {activeSheet === "photo" && "Foto"}
                {activeSheet === "color" && "Color"}
                {activeSheet === "more" && "Más"}
              </span>
              <button onClick={() => setActiveSheet(null)} className="text-gray-400 active:text-white text-xl w-8 h-8 flex items-center justify-center">×</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* CAPAS */}
              {activeSheet === "layers" && (
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveSheet("more")}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-3 rounded-xl border border-dashed border-white/15 text-purple-300 active:bg-white/[0.05] text-sm font-semibold"
                  >
                    <Plus size={16} strokeWidth={2.5}/>
                    Añadir capa
                  </button>
                  {[...layers].reverse().filter(l => l.obj.selectable !== false).map(layer => {
                    const isSel = selectedLayer?.id === layer.id;
                    const realIdx = layers.findIndex(l => l.id === layer.id);
                    const canUp = realIdx < layers.length - 1;
                    const canDown = realIdx > 0;
                    return (
                      <div key={layer.id} className={`flex items-center gap-2 px-2 py-2 rounded-xl ${isSel ? "bg-purple-600/20 border border-purple-500/40" : "bg-white/[0.03]"}`}>
                        <button
                          onClick={() => {
                            const fc = fabricRef.current; if (!fc) return;
                            fc.setActiveObject(layer.obj);
                            fc.renderAll();
                            setSelectedLayer(layer);
                            setActiveSheet(null);
                          }}
                          className="flex items-center gap-3 flex-1 text-left px-1 py-1"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400">
                            {layer.type === "text" ? <Type size={14}/> : layer.type === "image" ? <ImageIcon size={14}/> : <Palette size={14}/>}
                          </div>
                          <span className="text-sm text-white flex-1 truncate">{layer.name}</span>
                        </button>
                        {isSel ? (
                          <>
                            <button onClick={() => { const fc = fabricRef.current; if (!fc || !canUp) return; fc.bringObjectForward(layer.obj); fc.requestRenderAll(); const ord = fc.getObjects().map(o => layers.find(l=>l.obj===o)!).filter(Boolean); setLayers(ord); }} disabled={!canUp} className={`w-8 h-8 rounded-lg flex items-center justify-center ${canUp ? "text-gray-300 active:bg-white/10" : "text-gray-700 opacity-30"}`}>
                              <ChevronUp size={16}/>
                            </button>
                            <button onClick={() => { const fc = fabricRef.current; if (!fc || !canDown) return; fc.sendObjectBackwards(layer.obj); fc.requestRenderAll(); const ord = fc.getObjects().map(o => layers.find(l=>l.obj===o)!).filter(Boolean); setLayers(ord); }} disabled={!canDown} className={`w-8 h-8 rounded-lg flex items-center justify-center ${canDown ? "text-gray-300 active:bg-white/10" : "text-gray-700 opacity-30"}`}>
                              <ChevronDown size={16}/>
                            </button>
                          </>
                        ) : (
                          <div className="text-gray-700 px-1"><GripVertical size={14}/></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TEXTO */}
              {activeSheet === "text" && selectedLayer && selectedLayer.type === "text" && (() => {
                const obj = selectedLayer.obj as Textbox;
                return (
                  <div className="space-y-5">
                    <button
                      onClick={() => { setTempText(obj.text ?? ""); setTextEditFullscreen(true); }}
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-3 text-sm text-white text-left active:bg-white/[0.10] flex items-center justify-between gap-2"
                    >
                      <span className="truncate flex-1">{obj.text || <em className="text-gray-500">Vacío</em>}</span>
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Editar</span>
                    </button>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2 block">Color</label>
                      <div className="grid grid-cols-6 gap-1.5 mb-2">
                        {COLOR_PALETTE.map(c => (
                          <button key={c} onClick={() => updateProp("fill", c)} className={`aspect-square rounded-lg border-2 ${(obj.fill as string)?.toLowerCase() === c.toLowerCase() ? "border-white" : "border-white/10"}`} style={{background:c}}/>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2 block">Fuente</label>
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                        {FONTS.map(f => {
                          const isActive = (obj.fontFamily ?? "").toString().includes(f);
                          return (
                            <button key={f} onClick={() => updateProp("fontFamily", f)} className={`shrink-0 px-4 py-2 rounded-xl text-sm whitespace-nowrap ${isActive ? "bg-purple-600/30 text-purple-200 border border-purple-500/40" : "bg-white/[0.04] text-gray-300 border border-white/10"}`} style={{fontFamily:f}}>{f}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Tamaño</label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round((obj.fontSize as number) ?? 60)}px</span>
                      </div>
                      <input type="range" min={12} max={300} value={(obj.fontSize as number) ?? 60} onChange={e => updateProp("fontSize", Number(e.target.value))} className="w-full accent-purple-500"/>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateProp("fontWeight", obj.fontWeight === "bold" || obj.fontWeight === "700" ? "400" : "bold")} className={`flex-1 h-12 rounded-xl flex items-center justify-center ${obj.fontWeight === "bold" || obj.fontWeight === "700" ? "bg-purple-600/30 text-purple-200 border border-purple-500/40" : "bg-white/[0.04] text-gray-400 border border-white/10"}`}><Bold size={18} strokeWidth={2.5}/></button>
                      <button onClick={() => updateProp("fontStyle", obj.fontStyle === "italic" ? "normal" : "italic")} className={`flex-1 h-12 rounded-xl flex items-center justify-center ${obj.fontStyle === "italic" ? "bg-purple-600/30 text-purple-200 border border-purple-500/40" : "bg-white/[0.04] text-gray-400 border border-white/10"}`}><Italic size={18} strokeWidth={2.5}/></button>
                      <div className="w-px h-8 bg-white/10"/>
                      {(["left","center","right"] as const).map(align => {
                        const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                        return <button key={align} onClick={() => updateProp("textAlign", align)} className={`flex-1 h-12 rounded-xl flex items-center justify-center ${obj.textAlign === align ? "bg-purple-600/30 text-purple-200 border border-purple-500/40" : "bg-white/[0.04] text-gray-400 border border-white/10"}`}><Icon size={18} strokeWidth={2.5}/></button>
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* COLOR (capa no-texto) */}
              {activeSheet === "color" && selectedLayer && selectedLayer.type !== "text" && (() => {
                const obj = selectedLayer.obj as FabricObject & { fill?: unknown };
                const current = typeof obj.fill === "string" ? obj.fill : "#ffffff";
                return (
                  <div className="space-y-4">
                    {selectedLayer.type !== "image" && (
                      <div className="grid grid-cols-6 gap-1.5">
                        {COLOR_PALETTE.map(c => (
                          <button key={c} onClick={() => updateProp("fill", c)} className={`aspect-square rounded-lg border-2 ${current.toLowerCase() === c.toLowerCase() ? "border-white" : "border-white/10"}`} style={{background:c}}/>
                        ))}
                      </div>
                    )}
                    {selectedLayer.type === "image" && (
                      <p className="text-xs text-gray-500 text-center">Color no aplica a imágenes</p>
                    )}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Opacidad</label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round(((obj.opacity as number) ?? 1) * 100)}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={Math.round(((obj.opacity as number) ?? 1) * 100)} onChange={e => updateProp("opacity", Number(e.target.value)/100)} className="w-full accent-purple-500"/>
                    </div>
                  </div>
                );
              })()}

              {/* FOTO */}
              {activeSheet === "photo" && (
                <button onClick={handleAddPhotoClick} className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 active:from-purple-700 active:to-fuchsia-700 text-white font-bold text-base">
                  <ImageIcon size={20} strokeWidth={2.5}/>
                  Subir foto desde galería
                </button>
              )}

              {/* MAS */}
              {activeSheet === "more" && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Añadir capa</p>
                  <button onClick={handleAddText} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300"><Type size={16}/></div>
                    <div className="flex-1 text-left"><p className="font-semibold">Nuevo texto</p></div>
                    <Plus size={16}/>
                  </button>
                  <button onClick={handleAddRect} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300"><Square size={16}/></div>
                    <div className="flex-1 text-left"><p className="font-semibold">Rectángulo</p></div>
                    <Plus size={16}/>
                  </button>
                  <button onClick={handleAddCircle} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300"><CircleIcon size={16}/></div>
                    <div className="flex-1 text-left"><p className="font-semibold">Círculo</p></div>
                    <Plus size={16}/>
                  </button>

                  {selectedLayer && (
                    <>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-5 mb-2">Capa: {selectedLayer.name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleDuplicateSelected} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm"><Copy size={14}/>Duplicar</button>
                        <button onClick={() => { handleDeleteSelected(); setActiveSheet(null); }} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-red-500/10 active:bg-red-500/20 border border-red-500/30 text-red-400 text-sm"><Trash2 size={14}/>Eliminar</button>
                        <button onClick={() => { const fc = fabricRef.current; if (!fc) return; fc.bringObjectForward(selectedLayer.obj); fc.requestRenderAll(); const ord = fc.getObjects().map(o => layers.find(l=>l.obj===o)!).filter(Boolean); setLayers(ord); }} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm"><MoveUp size={14}/>Al frente</button>
                        <button onClick={() => { const fc = fabricRef.current; if (!fc) return; fc.sendObjectBackwards(selectedLayer.obj); fc.requestRenderAll(); const ord = fc.getObjects().map(o => layers.find(l=>l.obj===o)!).filter(Boolean); setLayers(ord); }} className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm"><MoveDown size={14}/>Atrás</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ FULLSCREEN TEXT EDIT ═════════════════════════════════════════ */}
      {textEditFullscreen && selectedLayer && selectedLayer.type === "text" && (
        <div className="fixed inset-0 z-[60] bg-[#0a0a14] flex flex-col safe-area-bottom">
          <div className="h-14 border-b border-white/10 flex items-center px-3 gap-2 bg-[#0e0e14]">
            <button onClick={() => setTextEditFullscreen(false)} className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 active:bg-white/10"><XIcon size={20}/></button>
            <p className="flex-1 text-sm font-semibold text-white">Editar texto</p>
            <button onClick={commitFullscreenText} className="px-4 py-2 rounded-xl bg-purple-600 active:bg-purple-700 text-white text-sm font-bold flex items-center gap-1.5"><Check size={15} strokeWidth={2.5}/>Aplicar</button>
          </div>
          <div className="flex-1 p-4">
            <textarea
              autoFocus
              value={tempText}
              onChange={e => setTempText(e.target.value)}
              placeholder="Escribe el texto..."
              className="w-full h-full bg-transparent text-white text-2xl font-bold leading-tight outline-none resize-none placeholder-gray-700"
              style={{ fontFamily: (selectedLayer.obj as Textbox).fontFamily ?? "Montserrat" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
