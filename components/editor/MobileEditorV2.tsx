"use client";

// ════════════════════════════════════════════════════════════════════════════
//  MobileEditorV2 — editor mobile rediseñado v4
//
//  Arquitectura nueva (basada en mockup v4):
//   - Header compacto (back · titulo · undo/redo · Exportar)
//   - Canvas con altura controlada (no se desborda sobre el sheet)
//   - Toolbar contextual delgada (solo cuando hay seleccion)
//   - Bottom sheet con 3 tabs: Contenido · Estilo · Remix
//   - Tab Contenido: form de bloques accordion sincronizado con canvas
//   - Bottom nav 3 tabs
//
//  Diferencias clave vs MobileEditor (V1):
//   - Sin dock con 5 botones (Capas/Texto/Foto/Color/Mas)
//   - Sin sheets de Layers/Color/More viejos
//   - Sin floating toolbar sobre el objeto (todo va al bottom sheet)
//   - Form-first: el usuario edita via inputs, no via canvas
//   - Sync bidireccional canvas ↔ form
//
//  Reutiliza:
//   - applyTemplateLayers (lib/fabricApplyTemplateLayers)
//   - getVariant (data/templates)
//   - applyWatermark, shouldWatermark
//   - useAuth, useToast, useLocale
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Canvas as FabricCanvas,
  Shadow,
  type FabricObject,
  Textbox,
} from "fabric";
import {
  ArrowLeft, Download, Undo2, Redo2,
  ChevronDown, Check, Sparkles,
  ChevronUp, Copy, Trash2, Palette as PaletteIcon,
  X as XIcon, Layers as LayersIcon, Star as StarIcon,
} from "lucide-react";
import { templates, getVariant, type Template } from "@/data/templates";
import type { FormatId } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import { applyWatermark, shouldWatermark } from "@/lib/applyWatermark";
import { getBlocksForTemplate, BLOCK_ICONS, BLOCK_TINTS, type EditableBlock } from "@/data/templateBlocks";
import { getPalettesForCategory, type Palette } from "@/data/templatePalettes";
import { REMIX_STYLES, type RemixStyle } from "@/data/templateRemixes";

type Props = {
  templateId?: number;
  projectId?: string;
  formatId?: FormatId;
};

type TabId = "contenido" | "estilo" | "remix";

// Mapa de Fabric customId → block kind para sync bidireccional canvas → form
type LayerToBlockMap = Map<string, EditableBlock>;

export default function MobileEditorV2({ templateId, formatId }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { user: authUser, profile: authProfile } = useAuth();
  const { toast } = useToast();

  // ─── Template & canvas state ─────────────────────────────────────────────
  const [template, setTemplate] = useState<Template | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1080, h: 1350 });
  const [loaded, setLoaded] = useState(false);

  // Bloques editables de esta plantilla (puede ser [] si no tiene schema)
  const blocks = useMemo<EditableBlock[]>(() => {
    return templateId ? getBlocksForTemplate(templateId) : [];
  }, [templateId]);

  // Valores actuales de cada bloque (texto que el usuario ha escrito).
  // Se inicializa con los valores que vienen del template Fabric al cargar.
  const [blockValues, setBlockValues] = useState<Record<string, string>>({});

  // Bloque expandido (solo 1 a la vez = accordion)
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  // Tab activa del bottom sheet
  const [activeTab, setActiveTab] = useState<TabId>("contenido");

  // Selected layer info (para mostrar bbox + sincronizar con bloque expandido)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // History (undo/redo) — placeholder por ahora
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo] = useState(false);

  // Save state visual
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");

  // Indicador "Aplicado al diseño ✓" verde tras editar un bloque
  const [showAppliedFor, setShowAppliedFor] = useState<string | null>(null);

  // Estilo / Remix / Export state
  const [activeStyleSubTab, setActiveStyleSubTab] = useState<"colores" | "fuentes" | "efectos">("colores");
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);
  const [activeRemixId, setActiveRemixId] = useState<RemixStyle["id"] | null>(null);
  const [exportSheetOpen, setExportSheetOpen] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(["portrait"]));

  // ─── Cargar template ──────────────────────────────────────────────────
  useEffect(() => {
    if (!templateId) return;
    const t = templates.find(t => t.id === templateId);
    if (t) setTemplate(t);
  }, [templateId]);

  // ─── Mapa layer customId → block (para sync canvas → form) ───────────────
  const layerToBlock = useMemo<LayerToBlockMap>(() => {
    const map = new Map<string, EditableBlock>();
    blocks.forEach(b => {
      b.layerIds.forEach(lid => map.set(lid, b));
    });
    return map;
  }, [blocks]);

  // ─── Inicializar Fabric + cargar plantilla ───────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !template) return;
    const variant = getVariant(template, formatId);
    if (!variant) return;

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
    setCanvasSize({ w: variant.width, h: variant.height });

    applyTemplateLayers(fc, variant.layers).then(() => {
      // Style handles tactil-friendly
      fc.getObjects().forEach(obj => {
        obj.set({
          cornerColor: "#a855f7",
          cornerStrokeColor: "#ffffff",
          cornerStyle: "circle",
          transparentCorners: false,
          borderColor: "#a855f7",
          borderScaleFactor: 1.5,
          cornerSize: 14,
          touchCornerSize: 44,
          padding: 4,
        });
      });

      // Inicializar blockValues con los textos actuales de los layers
      const initial: Record<string, string> = {};
      blocks.forEach(b => {
        // Buscar el primer layer asociado y leer su texto
        const obj = fc.getObjects().find(o => {
          const cid = (o as FabricObject & { customId?: string }).customId;
          return cid && b.layerIds.includes(cid);
        });
        if (obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initial[b.id] = String((obj as any).text ?? "");
        } else {
          initial[b.id] = "";
        }
      });
      setBlockValues(initial);
      setLoaded(true);
      fc.renderAll();
    });

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
  }, [template, formatId, blocks]);

  // ─── Auto-fit canvas al area disponible + reflit al resize ──────────────
  // Usamos ResizeObserver para que cuando el wrapper cambie de tamaño (ej.
  // al entrar/salir de modo edit donde canvas crece de 40vh a 58vh) el canvas
  // Fabric se ajuste automaticamente.
  useEffect(() => {
    const fc = fabricRef.current;
    const wrapper = wrapperRef.current;
    if (!fc || !loaded || !wrapper) return;

    const refit = () => {
      const r = wrapper.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const zoomW = r.width / canvasSize.w;
      const zoomH = r.height / canvasSize.h;
      const fit = Math.min(zoomW, zoomH);
      fc.setDimensions({ width: r.width, height: r.height });
      fc.setZoom(fit);
      const tx = (r.width - canvasSize.w * fit) / 2;
      const ty = (r.height - canvasSize.h * fit) / 2;
      fc.setViewportTransform([fit, 0, 0, fit, tx, ty]);
      fc.requestRenderAll();
    };
    refit();

    const ro = new ResizeObserver(refit);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [loaded, canvasSize.w, canvasSize.h]);

  // ─── Selection handlers — sync canvas → bloque expandido ─────────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const onSelect = (e: { selected?: FabricObject[] }) => {
      const sel = e.selected?.[0];
      if (!sel) return;
      const cid = (sel as FabricObject & { customId?: string }).customId;
      setSelectedLayerId(cid ?? null);
      // Si el layer pertenece a un bloque, expandir ese bloque automaticamente
      if (cid) {
        const block = layerToBlock.get(cid);
        if (block) {
          setExpandedBlockId(block.id);
          setActiveTab("contenido");
        }
      }
    };
    const onDeselect = () => {
      setSelectedLayerId(null);
    };
    fc.on("selection:created", onSelect);
    fc.on("selection:updated", onSelect);
    fc.on("selection:cleared", onDeselect);
    return () => {
      fc.off("selection:created", onSelect);
      fc.off("selection:updated", onSelect);
      fc.off("selection:cleared", onDeselect);
    };
  }, [layerToBlock]);

  // ─── Aplicar valor de un bloque al canvas Fabric ────────────────────────
  const applyBlockToCanvas = useCallback((block: EditableBlock, value: string) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const objs = fc.getObjects();
    block.layerIds.forEach(lid => {
      const obj = objs.find(o => (o as FabricObject & { customId?: string }).customId === lid);
      if (obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text")) {
        (obj as Textbox).set("text", value);
      }
    });
    fc.requestRenderAll();
    setSaveState("unsaved");
    setCanUndo(true);
    setShowAppliedFor(block.id);
    setTimeout(() => setShowAppliedFor(s => s === block.id ? null : s), 2500);
  }, []);

  // ─── Handler del input de un bloque ─────────────────────────────────────
  const onBlockChange = useCallback((block: EditableBlock, value: string) => {
    setBlockValues(prev => ({ ...prev, [block.id]: value }));
    applyBlockToCanvas(block, value);
  }, [applyBlockToCanvas]);

  // ─── Toggle expandir bloque (accordion) ─────────────────────────────────
  const toggleBlock = useCallback((blockId: string) => {
    setExpandedBlockId(prev => prev === blockId ? null : blockId);
    // Si hay un layer asociado, seleccionarlo en el canvas para mostrar bbox
    const block = blocks.find(b => b.id === blockId);
    const fc = fabricRef.current;
    if (block && fc) {
      const obj = fc.getObjects().find(o => {
        const cid = (o as FabricObject & { customId?: string }).customId;
        return cid && block.layerIds.includes(cid);
      });
      if (obj) {
        fc.setActiveObject(obj);
        fc.requestRenderAll();
      }
    }
  }, [blocks]);

  // ─── Acciones de toolbar contextual ─────────────────────────────────────
  const handleBringForward = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (fc && obj) {
      fc.bringObjectForward(obj);
      fc.requestRenderAll();
      setSaveState("unsaved");
    }
  }, []);
  const handleSendBackward = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (fc && obj) {
      fc.sendObjectBackwards(obj);
      fc.requestRenderAll();
      setSaveState("unsaved");
    }
  }, []);
  const handleDuplicate = useCallback(async () => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clone = await (obj as any).clone();
      clone.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 });
      fc.add(clone);
      fc.setActiveObject(clone);
      fc.requestRenderAll();
      setSaveState("unsaved");
    } catch (e) { console.error(e); }
  }, []);
  const handleDelete = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (fc && obj) {
      fc.remove(obj);
      fc.discardActiveObject();
      fc.requestRenderAll();
      setSelectedLayerId(null);
      setSaveState("unsaved");
    }
  }, []);

  // ─── Export ──────────────────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const doExport = useCallback(async (format: "png" | "jpg" = "png") => {
    const fc = fabricRef.current;
    if (!fc) return;
    setExporting(true);
    try {
      const currentZoom = fc.getZoom();
      const currentVpt = fc.viewportTransform ? [...fc.viewportTransform] : null;
      fc.setZoom(1);
      fc.setDimensions({ width: canvasSize.w, height: canvasSize.h });
      const rawDataUrl = fc.toDataURL({ format: format === "jpg" ? "jpeg" : "png", quality: 0.95, multiplier: 1 });
      fc.setZoom(currentZoom);
      if (currentVpt) fc.setViewportTransform(currentVpt as [number, number, number, number, number, number]);
      fc.requestRenderAll();

      let finalUrl = rawDataUrl;
      if (shouldWatermark(authProfile?.plan)) {
        try { finalUrl = await applyWatermark(rawDataUrl); }
        catch (e) { console.warn(e); }
      }
      const link = document.createElement("a");
      link.download = `artegenia-flyer.${format}`;
      link.href = finalUrl;
      link.click();
      toast.success(`Descargado ${format.toUpperCase()}`);
    } finally {
      setExporting(false);
    }
  }, [canvasSize, authProfile?.plan, toast]);

  const handleExport = useCallback(() => {
    if (!authUser) {
      toast.info("Inicia sesión para descargar");
      return;
    }
    setExportSheetOpen(true);
  }, [authUser, toast]);

  // ─── Aplicar paleta al canvas ────────────────────────────────────────────
  // Estrategia: cambiamos el fill de los layers tipo "shape" rotando entre
  // los 4 colores de la paleta, y el color de layers tipo "text" segun
  // rol semantico (titulo → primary, subtitulo → secondary, etc.).
  const applyPalette = useCallback((palette: Palette) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const objs = fc.getObjects();
    const colors = [palette.primary, palette.secondary, palette.accent, palette.dark];
    let shapeIdx = 0;
    objs.forEach(obj => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cid = (obj as any).customId as string | undefined;
      const type = obj.type;
      // Texts: titulo → primary, subtitle → secondary
      if (type === "textbox" || type === "i-text" || type === "text") {
        const lower = (cid ?? "").toLowerCase();
        let color = palette.primary;
        if (lower.includes("subtitle") || lower.includes("desc") || lower.includes("supra")) color = palette.secondary;
        else if (lower.includes("price") || lower.includes("cta") || lower.includes("badge")) color = palette.accent;
        else if (lower.includes("date") || lower.includes("venue") || lower.includes("footer")) color = palette.dark === "#000000" ? "#ffffff" : palette.secondary;
        else if (lower.includes("title")) color = palette.primary;
        obj.set("fill", color);
      }
      // Shapes: rotar entre los 4 colores (excepto dark = fondo)
      else if (type === "rect" || type === "circle" || type === "triangle" || type === "polygon" || type === "path") {
        const lower = (cid ?? "").toLowerCase();
        if (lower.includes("bg") || lower === "background") {
          obj.set("fill", palette.dark);
        } else {
          obj.set("fill", colors[shapeIdx % 3]);
          shapeIdx++;
        }
      }
    });
    fc.requestRenderAll();
    setActivePaletteId(palette.id);
    setSaveState("unsaved");
    setCanUndo(true);
  }, []);

  // ─── Aplicar remix preset al canvas ──────────────────────────────────────
  // Combina paleta + (opcional) fuente principal + (opcional) glow al titulo.
  const applyRemix = useCallback((remix: RemixStyle) => {
    const fc = fabricRef.current;
    if (!fc) return;
    applyPalette(remix.palette);
    // Aplicar fuente principal a layers titulo
    if (remix.primaryFont) {
      fc.getObjects().forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((obj as any).customId as string | undefined ?? "").toLowerCase();
        if (cid.includes("title") || cid.includes("supra")) {
          (obj as Textbox).set("fontFamily", remix.primaryFont!);
        }
      });
    }
    // Aplicar glow al titulo si el remix lo define
    if (remix.titleGlow) {
      fc.getObjects().forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((obj as any).customId as string | undefined ?? "").toLowerCase();
        if (cid.includes("title")) {
          obj.set("shadow", new Shadow({
            color: remix.titleGlow!.color,
            blur: remix.titleGlow!.blur,
            offsetX: 0,
            offsetY: 0,
          }));
        }
      });
    } else {
      // Sin glow → quitar shadows de titulos
      fc.getObjects().forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((obj as any).customId as string | undefined ?? "").toLowerCase();
        if (cid.includes("title")) {
          obj.set("shadow", null as never);
        }
      });
    }
    fc.requestRenderAll();
    setActiveRemixId(remix.id);
    setSaveState("unsaved");
    setCanUndo(true);
    toast.success(`Estilo ${remix.name} aplicado`);
  }, [applyPalette, toast]);

  // Paletas disponibles para esta plantilla segun su categoria
  const availablePalettes = useMemo<Palette[]>(() => {
    return getPalettesForCategory(template?.category);
  }, [template?.category]);

  // ─── Multi-formato export ────────────────────────────────────────────────
  const availableFormats = useMemo(() => {
    if (!template) return [];
    return template.variants.map(v => ({
      id: v.format,
      label: v.format === "portrait" ? "Post Instagram" :
             v.format === "story" ? "Story / TikTok" :
             v.format === "square" ? "Cuadrado" :
             v.format === "fb-cover" ? "Facebook Cover" :
             v.format,
      size: `${v.width} × ${v.height}`,
      aspect: v.format === "story" ? "9:16" :
              v.format === "square" ? "1:1" :
              v.format === "fb-cover" ? "16:9" : "4:5",
    }));
  }, [template]);

  const toggleFormat = useCallback((id: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedFormats.size === 0) return;
    setExportSheetOpen(false);
    // Por ahora descargamos secuencialmente cada formato como PNG separado.
    // Multi-formato real requiere re-renderizar cada variant — para Fase B
    // entregamos el formato actual + indicamos cuantos formatos se intentaron.
    await doExport("png");
    if (selectedFormats.size > 1) {
      toast.info(`Formato actual descargado. Multi-formato extra próximamente.`);
    }
  }, [selectedFormats, doExport, toast]);

  // ─── RENDER ──────────────────────────────────────────────────────────────

  const blocksWithValues = useMemo(() => {
    return blocks.map(b => ({ block: b, value: blockValues[b.id] ?? "" }));
  }, [blocks, blockValues]);

  // ─── MODO EDIT: si hay bloque expandido en Contenido, dejamos mas espacio
  // al canvas y solo mostramos ese bloque. Asi el usuario VE el cambio
  // en tiempo real en el flyer (objetivo principal del editor). ────────────
  const isEditingMode = activeTab === "contenido" && expandedBlockId !== null;

  // Si la plantilla no tiene schema de bloques, mostrar empty state amigable
  const hasNoSchema = blocks.length === 0 && loaded;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#0a0a14] text-white">

      {/* ═══ HEADER ════════════════════════════════════════════════════════
          En modo edit el header se comprime (sin meta) para dar mas altura
          al canvas que es lo que el usuario necesita ver. */}
      <header className={`px-3 ${isEditingMode ? "py-1.5" : "py-2"} flex items-center gap-2 border-b border-white/[0.06] shrink-0 transition-all`}>
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={17} strokeWidth={2.4} />
        </button>
        <div className="flex-1 min-w-0 pl-1">
          <h1 className="text-[14px] font-bold leading-tight truncate">
            {template?.title ?? "Cargando…"}
          </h1>
          {!isEditingMode && (
            <p className="text-[10px] text-gray-500 flex items-center gap-1.5">
              <span className={`w-1 h-1 rounded-full ${
                saveState === "saved" ? "bg-emerald-400" :
                saveState === "saving" ? "bg-amber-400 animate-pulse" :
                "bg-gray-500"
              }`}/>
              {canvasSize.w}×{canvasSize.h} · {
                saveState === "saved" ? "Guardado" :
                saveState === "saving" ? "Guardando…" :
                "Sin guardar"
              }
            </p>
          )}
        </div>
        <button
          aria-label="Deshacer"
          disabled={!canUndo}
          className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
        >
          <Undo2 size={15} strokeWidth={2} />
        </button>
        <button
          aria-label="Rehacer"
          disabled={!canRedo}
          className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
        >
          <Redo2 size={15} strokeWidth={2} />
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="h-10 px-3.5 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[13px] flex items-center gap-1.5 active:scale-95 transition-transform shadow-lg shadow-purple-500/30 disabled:opacity-60"
        >
          <Download size={15} strokeWidth={2.4} />
          Exportar
        </button>
      </header>

      {/* ═══ CANVAS AREA — crece en modo edit (lo que el usuario necesita ver) ═══ */}
      <div className={`shrink-0 px-3 pt-2 flex items-center justify-center transition-all duration-300 ${
        isEditingMode
          ? "h-[58vh] min-h-[400px]"     // CANVAS GRANDE durante edicion
          : "h-[40vh] min-h-[260px] max-h-[420px]" // canvas normal sin edicion
      }`}>
        <div
          ref={wrapperRef}
          className="h-full aspect-[4/5] rounded-xl overflow-hidden bg-[#111] shadow-2xl shadow-black/40 relative"
        >
          <canvas ref={canvasRef} />
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TOOLBAR CONTEXTUAL (solo cuando hay seleccion) ═══════════════ */}
      {selectedLayerId && (
        <div className="mx-4 mt-2.5 mb-1.5 shrink-0 rounded-2xl bg-[#1c1c2a]/95 backdrop-blur-xl border border-purple-500/25 shadow-2xl shadow-black/40 p-1 flex items-center">
          <ToolbarBtn onClick={handleBringForward} icon={<ChevronUp size={18} strokeWidth={2.4}/>} label="Subir"/>
          <ToolbarBtn onClick={handleSendBackward} icon={<ChevronDown size={18} strokeWidth={2.4}/>} label="Bajar"/>
          <div className="w-px h-7 bg-white/10 mx-0.5"/>
          <ToolbarBtn onClick={handleDuplicate} icon={<Copy size={16} strokeWidth={2.2}/>} label="Duplicar"/>
          <ToolbarBtn onClick={handleDelete} icon={<Trash2 size={16} strokeWidth={2.2}/>} label="Borrar" danger/>
        </div>
      )}

      {/* ═══ BOTTOM SHEET ═════════════════════════════════════════════════ */}
      <section className="flex-1 min-h-0 bg-[#1c1c2a] rounded-t-3xl border-t border-white/[0.08] flex flex-col overflow-hidden">
        <div className="w-9 h-1 bg-white/20 rounded-full mx-auto mt-2 mb-0.5 shrink-0"/>
        <div className="px-4 py-2 flex items-center justify-between shrink-0">
          <h2 className="text-[15px] font-bold">
            {activeTab === "contenido" && "Contenido"}
            {activeTab === "estilo" && "Estilo"}
            {activeTab === "remix" && "Remix"}
          </h2>
          {activeTab === "contenido" && (
            <button
              onClick={() => setActiveTab("remix")}
              className="px-2.5 py-1.5 rounded-full bg-purple-500/12 border border-purple-500/25 text-purple-300 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-transform"
            >
              <StarIcon size={11} strokeWidth={2.4}/>
              Probar otros estilos
            </button>
          )}
        </div>

        {/* Contenido del tab activo */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {activeTab === "contenido" && (
            <div className="px-3.5 pb-3 flex flex-col gap-2">
              {hasNoSchema && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 text-center text-[12px] text-gray-400">
                  <p className="text-white font-semibold mb-2">Esta plantilla no tiene bloques editables aún</p>
                  <p>Toca un elemento del flyer para seleccionarlo.</p>
                </div>
              )}

              {/* MODO EDIT: solo el bloque expandido visible + boton "Listo" */}
              {/* MODO LISTA: todos los bloques colapsados visibles */}
              {(isEditingMode
                ? blocksWithValues.filter(({ block }) => block.id === expandedBlockId)
                : blocksWithValues
              ).map(({ block, value }) => {
                const isExpanded = expandedBlockId === block.id;
                const isApplied = showAppliedFor === block.id;
                const tint = BLOCK_TINTS[block.kind];
                return (
                  <div
                    key={block.id}
                    className={`rounded-2xl border overflow-hidden transition-all ${
                      isExpanded
                        ? "border-purple-500/35 bg-gradient-to-b from-purple-500/[0.05] to-[#13131f]"
                        : "border-white/[0.06] bg-[#13131f]"
                    }`}
                  >
                    <button
                      onClick={() => toggleBlock(block.id)}
                      className="w-full px-3.5 py-3 flex items-center gap-3 active:opacity-80 transition-opacity"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
                        style={{ background: `rgba(${tint}, 0.15)` }}
                      >
                        {BLOCK_ICONS[block.kind]}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-[9.5px] font-bold tracking-widest text-gray-500 uppercase">
                          {block.label}
                        </div>
                        {/* En modo edit no mostramos el value debajo del label (lo ves en el flyer y en el input) */}
                        {!isEditingMode && (
                          <div className="text-[13px] font-semibold text-white truncate">
                            {value || <span className="text-gray-500">{block.placeholder}</span>}
                          </div>
                        )}
                      </div>
                      {isEditingMode ? (
                        <span className="text-[11px] font-bold text-purple-300 px-2 py-1 rounded-lg bg-purple-500/10">
                          LISTO
                        </span>
                      ) : (
                        <ChevronDown
                          size={16}
                          strokeWidth={2}
                          className={`text-gray-500 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-1 flex flex-col gap-2">
                        {block.inputType === "textarea" ? (
                          <textarea
                            value={value}
                            onChange={e => onBlockChange(block, e.target.value)}
                            placeholder={block.placeholder}
                            maxLength={block.maxLength}
                            rows={2}
                            autoFocus
                            className="w-full bg-[#0a0a14] border border-purple-500/40 rounded-xl px-3.5 py-3 text-[15px] text-white font-medium outline-none resize-none focus:border-purple-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={e => onBlockChange(block, e.target.value)}
                            placeholder={block.placeholder}
                            maxLength={block.maxLength}
                            autoFocus
                            className="w-full bg-[#0a0a14] border border-purple-500/40 rounded-xl px-3.5 py-3 text-[15px] text-white font-medium outline-none focus:border-purple-500"
                          />
                        )}
                        {isApplied && (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                            <Check size={12} strokeWidth={2.6}/>
                            Aplicado al diseño
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "estilo" && (
            <div className="px-4 pb-4 flex flex-col gap-4">
              {/* Sub-tabs */}
              <div className="flex gap-1.5 bg-[#0a0a14] rounded-xl p-1">
                {(["colores", "fuentes", "efectos"] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setActiveStyleSubTab(st)}
                    className={`flex-1 py-2 text-[12px] font-semibold rounded-lg transition-colors ${
                      activeStyleSubTab === st
                        ? "bg-purple-500/20 text-purple-300"
                        : "text-gray-400"
                    }`}
                  >
                    {st === "colores" ? "Colores" : st === "fuentes" ? "Fuentes" : "Efectos"}
                  </button>
                ))}
              </div>

              {activeStyleSubTab === "colores" && (
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                    Paletas para {template?.category ?? "esta plantilla"}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {availablePalettes.map(p => {
                      const isActive = activePaletteId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => applyPalette(p)}
                          className={`rounded-xl overflow-hidden border-2 transition-all ${
                            isActive ? "border-purple-500 scale-[0.98]" : "border-transparent active:scale-[0.97]"
                          }`}
                        >
                          <div className="aspect-[5/2] flex">
                            <div className="flex-1" style={{ background: p.primary }}/>
                            <div className="flex-1" style={{ background: p.secondary }}/>
                            <div className="flex-1" style={{ background: p.accent }}/>
                            <div className="flex-1" style={{ background: p.dark }}/>
                          </div>
                          <div className="bg-[#13131f] py-2 px-2 text-[11px] font-semibold text-center">
                            {p.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeStyleSubTab === "fuentes" && (
                <div className="flex flex-col items-center text-center text-gray-400 text-[13px] gap-2 py-8">
                  <p>Cambiar fuentes — próximamente</p>
                  <p className="text-[11px] text-gray-500">Por ahora cambia desde Remix</p>
                </div>
              )}

              {activeStyleSubTab === "efectos" && (
                <div className="flex flex-col items-center text-center text-gray-400 text-[13px] gap-2 py-8">
                  <p>Sombras, bordes, glow — próximamente</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "remix" && (
            <div className="px-4 pb-4 flex flex-col gap-3">
              <p className="text-[12px] text-gray-400 leading-relaxed">
                Aplica un estilo completo (paleta + fuente + efectos) al instante. Tu contenido se mantiene.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {REMIX_STYLES.map(r => {
                  const isActive = activeRemixId === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => applyRemix(r)}
                      className={`rounded-2xl overflow-hidden border-2 transition-all ${
                        isActive ? "border-purple-500 scale-[0.97]" : "border-white/[0.06] active:scale-[0.96]"
                      }`}
                    >
                      <div
                        className="aspect-[4/5] flex items-center justify-center text-[20px] font-black"
                        style={{
                          background: `linear-gradient(135deg, ${r.palette.dark}, ${r.palette.primary}40)`,
                          color: r.palette.primary,
                          fontFamily: r.primaryFont,
                          textShadow: r.titleGlow ? `0 0 20px ${r.titleGlow.color}` : undefined,
                        }}
                      >
                        Aa
                      </div>
                      <div className="bg-[#13131f] py-2.5 px-2 text-center">
                        <div className="text-[12px] font-bold">{r.name}</div>
                        {isActive && (
                          <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                            <Check size={10} strokeWidth={3}/>
                            Aplicado
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button className="w-full py-3 rounded-2xl border border-purple-500/30 border-dashed bg-purple-500/5 text-purple-300 text-[13px] font-semibold flex items-center justify-center gap-2">
                <Sparkles size={14} strokeWidth={2}/>
                Generar más estilos · próximamente
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ═══ EXPORT BOTTOM SHEET ═══════════════════════════════════════════ */}
      {exportSheetOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={() => setExportSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c2a] rounded-t-3xl border-t border-white/[0.1] shadow-2xl max-h-[80vh] flex flex-col safe-area-bottom">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1 shrink-0"/>
            <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-white/[0.06]">
              <h2 className="text-[16px] font-bold">Exportar diseño</h2>
              <button
                onClick={() => setExportSheetOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Cerrar"
              >
                <XIcon size={14} strokeWidth={2.4}/>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="text-[12px] text-gray-400 mb-3">
                Elige los formatos que necesitas. Te los descargamos todos.
              </p>
              <div className="flex flex-col gap-2">
                {availableFormats.map(fmt => {
                  const selected = selectedFormats.has(fmt.id);
                  return (
                    <button
                      key={fmt.id}
                      onClick={() => toggleFormat(fmt.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                        selected
                          ? "border-purple-500/40 bg-purple-500/[0.06]"
                          : "border-white/[0.06] bg-[#13131f]"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-[18px] shrink-0">
                        {fmt.aspect === "9:16" ? "📱" : fmt.aspect === "1:1" ? "⬛" : fmt.aspect === "16:9" ? "🖥" : "📷"}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[13px] font-bold">{fmt.label}</div>
                        <div className="text-[10px] text-gray-500">{fmt.size}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selected ? "bg-purple-500 border-purple-500" : "border-white/15"
                      }`}>
                        {selected && <Check size={12} strokeWidth={3.2} className="text-white"/>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-4 pt-3 pb-4 border-t border-white/[0.06] shrink-0">
              <button
                onClick={handleDownloadSelected}
                disabled={selectedFormats.size === 0 || exporting}
                className="w-full h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-purple-500/30 disabled:opacity-50"
              >
                <Download size={16} strokeWidth={2.4}/>
                {selectedFormats.size === 0
                  ? "Selecciona al menos uno"
                  : selectedFormats.size === 1
                  ? "Descargar"
                  : `Descargar ${selectedFormats.size} formatos`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══ BOTTOM NAV (3 tabs) ════════════════════════════════════════════ */}
      <nav className="shrink-0 border-t border-white/[0.08] bg-[#0a0a14] pt-2 pb-6 flex justify-around safe-area-bottom">
        <NavTab
          active={activeTab === "contenido"}
          onClick={() => setActiveTab("contenido")}
          icon={<LayersIcon size={20} strokeWidth={2}/>}
          label="Contenido"
        />
        <NavTab
          active={activeTab === "estilo"}
          onClick={() => setActiveTab("estilo")}
          icon={<PaletteIcon size={20} strokeWidth={2}/>}
          label="Estilo"
        />
        <NavTab
          active={activeTab === "remix"}
          onClick={() => setActiveTab("remix")}
          icon={<Sparkles size={20} strokeWidth={2}/>}
          label="Remix"
        />
      </nav>
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────

function ToolbarBtn({
  onClick, icon, label, danger,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-11 rounded-xl flex flex-col items-center justify-center gap-0.5 active:bg-white/10 transition-colors ${
        danger ? "text-red-300" : "text-gray-300"
      }`}
    >
      {icon}
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function NavTab({
  active, onClick, icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 ${active ? "text-purple-400" : "text-gray-500"}`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
          active ? "bg-purple-500/15 border border-purple-500/35" : "border border-transparent"
        }`}
      >
        {icon}
      </div>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
