"use client";

// ════════════════════════════════════════════════════════════════════════════
//  MobileEditorV3 — rediseño "single-row" estilo Canva/CapCut mobile
//
//  Principios del rediseño:
//   1. EL CANVAS ES EL PROTAGONISTA — ocupa ~70% de la pantalla siempre visible
//   2. UI MÍNIMA permanente — header de 50px + bottom bar 1 línea con 5 iconos
//   3. Contextual chip flotante sobre el objeto cuando hay seleccion (Canva-style)
//   4. Sheets TEMPORALES (no permanentes) — se abren al tap del icono de bottom bar
//      y se cierran al confirmar o tocar fuera
//   5. Sync canvas ↔ form bidireccional preservado
//
//  Diferencias vs V2:
//   - Sin bottom sheet PERMANENTE (V2 lo tiene siempre abierto con bloques)
//   - Sin bottom nav de 3 tabs duplicando funcionalidad
//   - Sin toolbar contextual encima del sheet (estaba consumiendo espacio)
//   - Toolbar contextual FLOTANTE sobre el objeto (como Canva mobile)
//
//  Reutiliza data + helpers de V2:
//   - templateBlocks (schema editable)
//   - templatePalettes (paletas por categoria)
//   - templateRemixes (4 estilos preset)
//   - applyTemplateLayers, useAuth, useToast, applyWatermark
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
  Check, Sparkles, MoreHorizontal,
  Copy, Trash2, Palette as PaletteIcon,
  X as XIcon, LayoutGrid, Type as TypeIcon, Image as ImageIcon,
  Wand2, ChevronUp, ChevronDown,
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

/** Sheet temporal que puede estar abierto. null = canvas limpio (caso comun). */
type SheetId = null | "texto" | "foto" | "estilo" | "ia" | "plantillas" | "export" | "more";

export default function MobileEditorV3({ templateId, formatId }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { user: authUser, profile: authProfile } = useAuth();
  const { toast } = useToast();

  // ─── Template & canvas ───────────────────────────────────────────────────
  const [template, setTemplate] = useState<Template | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1080, h: 1350 });
  const [loaded, setLoaded] = useState(false);

  const blocks = useMemo<EditableBlock[]>(() => {
    return templateId ? getBlocksForTemplate(templateId) : [];
  }, [templateId]);

  const [blockValues, setBlockValues] = useState<Record<string, string>>({});
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Sheet abierto (null = canvas limpio)
  const [openSheet, setOpenSheet] = useState<SheetId>(null);

  // Estilo state
  const [activePaletteId, setActivePaletteId] = useState<string | null>(null);
  const [activeRemixId, setActiveRemixId] = useState<RemixStyle["id"] | null>(null);

  // History + save
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const [exporting, setExporting] = useState(false);

  // ─── Cargar template ────────────────────────────────────────────────────
  useEffect(() => {
    if (!templateId) return;
    const t = templates.find(t => t.id === templateId);
    if (t) setTemplate(t);
  }, [templateId]);

  // ─── Mapa layer customId → block ────────────────────────────────────────
  const layerToBlock = useMemo(() => {
    const map = new Map<string, EditableBlock>();
    blocks.forEach(b => b.layerIds.forEach(lid => map.set(lid, b)));
    return map;
  }, [blocks]);

  // ─── Inicializar Fabric + aplicar plantilla ─────────────────────────────
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
      // Initial blockValues
      const initial: Record<string, string> = {};
      blocks.forEach(b => {
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

  // ─── Auto-fit + ResizeObserver ──────────────────────────────────────────
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

  // ─── Selection handlers ─────────────────────────────────────────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const onSelect = (e: { selected?: FabricObject[] }) => {
      const sel = e.selected?.[0];
      if (!sel) return;
      const cid = (sel as FabricObject & { customId?: string }).customId;
      setSelectedLayerId(cid ?? null);
      if (cid) {
        const block = layerToBlock.get(cid);
        if (block) {
          setActiveBlockId(block.id);
        }
      }
    };
    const onDeselect = () => {
      setSelectedLayerId(null);
      // No cerramos el sheet automaticamente — el usuario lo cierra con check o tap fuera
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

  // ─── Aplicar valor de bloque al canvas ──────────────────────────────────
  const applyBlockToCanvas = useCallback((block: EditableBlock, value: string) => {
    const fc = fabricRef.current;
    if (!fc) return;
    block.layerIds.forEach(lid => {
      const obj = fc.getObjects().find(o => (o as FabricObject & { customId?: string }).customId === lid);
      if (obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text")) {
        (obj as Textbox).set("text", value);
      }
    });
    fc.requestRenderAll();
    setSaveState("unsaved");
    setCanUndo(true);
  }, []);

  const onBlockChange = useCallback((block: EditableBlock, value: string) => {
    setBlockValues(prev => ({ ...prev, [block.id]: value }));
    applyBlockToCanvas(block, value);
  }, [applyBlockToCanvas]);

  // ─── Toolbar contextual actions ─────────────────────────────────────────
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

  const handleBringForward = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (fc && obj) { fc.bringObjectForward(obj); fc.requestRenderAll(); setSaveState("unsaved"); }
  }, []);

  const handleSendBackward = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (fc && obj) { fc.sendObjectBackwards(obj); fc.requestRenderAll(); setSaveState("unsaved"); }
  }, []);

  // ─── Export ─────────────────────────────────────────────────────────────
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
    } finally { setExporting(false); }
  }, [canvasSize, authProfile?.plan, toast]);

  const handleExport = useCallback(() => {
    if (!authUser) { toast.info("Inicia sesión para descargar"); return; }
    void doExport("png");
  }, [authUser, doExport, toast]);

  // ─── Aplicar paleta ──────────────────────────────────────────────────────
  const applyPalette = useCallback((palette: Palette) => {
    const fc = fabricRef.current;
    if (!fc) return;
    const colors = [palette.primary, palette.secondary, palette.accent, palette.dark];
    let shapeIdx = 0;
    fc.getObjects().forEach(obj => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cid = ((obj as any).customId as string | undefined ?? "").toLowerCase();
      const type = obj.type;
      if (type === "textbox" || type === "i-text" || type === "text") {
        let color = palette.primary;
        if (cid.includes("subtitle") || cid.includes("desc") || cid.includes("supra")) color = palette.secondary;
        else if (cid.includes("price") || cid.includes("cta") || cid.includes("badge")) color = palette.accent;
        else if (cid.includes("date") || cid.includes("venue") || cid.includes("footer")) color = palette.dark === "#000000" ? "#ffffff" : palette.secondary;
        else if (cid.includes("title")) color = palette.primary;
        obj.set("fill", color);
      }
      else if (type === "rect" || type === "circle" || type === "triangle" || type === "polygon" || type === "path") {
        if (cid.includes("bg") || cid === "background") {
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

  const applyRemix = useCallback((remix: RemixStyle) => {
    const fc = fabricRef.current;
    if (!fc) return;
    applyPalette(remix.palette);
    if (remix.primaryFont) {
      fc.getObjects().forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((obj as any).customId as string | undefined ?? "").toLowerCase();
        if (cid.includes("title") || cid.includes("supra")) {
          (obj as Textbox).set("fontFamily", remix.primaryFont!);
        }
      });
    }
    if (remix.titleGlow) {
      fc.getObjects().forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((obj as any).customId as string | undefined ?? "").toLowerCase();
        if (cid.includes("title")) {
          obj.set("shadow", new Shadow({ color: remix.titleGlow!.color, blur: remix.titleGlow!.blur, offsetX: 0, offsetY: 0 }));
        }
      });
    } else {
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

  const availablePalettes = useMemo<Palette[]>(() => getPalettesForCategory(template?.category), [template?.category]);

  // ─── Bloques de texto del template ──────────────────────────────────────
  const textBlocks = useMemo(() => blocks.filter(b => b.kind !== "footer"), [blocks]);
  const activeBlock = useMemo(() => blocks.find(b => b.id === activeBlockId), [blocks, activeBlockId]);
  const activeBlockValue = activeBlockId ? blockValues[activeBlockId] ?? "" : "";

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#0a0a14] text-white relative">

      {/* ═══ HEADER MINIMO (50px) ════════════════════════════════════════ */}
      <header className="h-[50px] px-2 flex items-center gap-1 border-b border-white/[0.06] shrink-0">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="w-9 h-9 rounded-lg flex items-center justify-center active:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.2}/>
        </button>
        <div className="flex-1 min-w-0 px-1">
          <h1 className="text-[13px] font-bold leading-tight truncate">
            {template?.title ?? "Cargando…"}
          </h1>
          <p className="text-[9px] text-gray-500 leading-tight">
            {canvasSize.w}×{canvasSize.h} · {saveState === "saved" ? "Guardado" : saveState === "saving" ? "Guardando…" : "Sin guardar"}
          </p>
        </div>
        <button
          aria-label="Deshacer"
          disabled={!canUndo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 active:bg-white/10 disabled:opacity-25"
        >
          <Undo2 size={17} strokeWidth={2}/>
        </button>
        <button
          aria-label="Rehacer"
          disabled={!canRedo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 active:bg-white/10 disabled:opacity-25"
        >
          <Redo2 size={17} strokeWidth={2}/>
        </button>
        <button
          aria-label="Mas"
          onClick={() => setOpenSheet(s => s === "more" ? null : "more")}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 active:bg-white/10"
        >
          <MoreHorizontal size={18} strokeWidth={2}/>
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="ml-1 h-9 px-3 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[12px] flex items-center gap-1 active:scale-95 transition-transform shadow-md shadow-purple-500/30 disabled:opacity-60"
        >
          <Download size={14} strokeWidth={2.4}/>
          Exportar
        </button>
      </header>

      {/* ═══ CANVAS — protagonista (~70% pantalla) ═══════════════════════ */}
      <div className="flex-1 min-h-0 px-3 py-3 flex items-center justify-center relative">
        <div
          ref={wrapperRef}
          className="h-full w-full max-w-full max-h-full rounded-xl overflow-hidden bg-[#111] shadow-2xl shadow-black/40 relative flex items-center justify-center"
        >
          <canvas ref={canvasRef} />
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          )}
        </div>

        {/* TOOLBAR CONTEXTUAL FLOTANTE (chip estilo Canva) — solo si hay seleccion */}
        {selectedLayerId && !openSheet && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 z-20 flex items-center bg-[#1c1c2a]/95 backdrop-blur-xl border border-purple-500/30 rounded-full shadow-2xl shadow-black/50 px-1 py-1 gap-0.5">
            <ChipBtn
              onClick={() => setOpenSheet("texto")}
              icon={<TypeIcon size={17} strokeWidth={2.2}/>}
              label="Editar"
            />
            <ChipBtn
              onClick={handleBringForward}
              icon={<ChevronUp size={17} strokeWidth={2.4}/>}
              label="Subir"
            />
            <ChipBtn
              onClick={handleSendBackward}
              icon={<ChevronDown size={17} strokeWidth={2.4}/>}
              label="Bajar"
            />
            <ChipBtn
              onClick={handleDuplicate}
              icon={<Copy size={15} strokeWidth={2.2}/>}
              label="Duplicar"
            />
            <ChipBtn
              onClick={handleDelete}
              icon={<Trash2 size={15} strokeWidth={2.2}/>}
              label="Borrar"
              danger
            />
          </div>
        )}
      </div>

      {/* ═══ BOTTOM BAR (1 línea, 5 botones, ~60px) ═══════════════════════ */}
      <nav className="h-[68px] border-t border-white/[0.08] bg-[#0a0a14] flex items-center justify-around shrink-0 safe-area-bottom">
        <BarBtn
          icon={<LayoutGrid size={20} strokeWidth={2}/>}
          label="Plantillas"
          onClick={() => router.push("/templates")}
        />
        <BarBtn
          icon={<TypeIcon size={20} strokeWidth={2}/>}
          label="Texto"
          active={openSheet === "texto"}
          onClick={() => setOpenSheet(s => s === "texto" ? null : "texto")}
        />
        <BarBtn
          icon={<ImageIcon size={20} strokeWidth={2}/>}
          label="Foto"
          active={openSheet === "foto"}
          onClick={() => setOpenSheet(s => s === "foto" ? null : "foto")}
        />
        <BarBtn
          icon={<PaletteIcon size={20} strokeWidth={2}/>}
          label="Estilo"
          active={openSheet === "estilo"}
          onClick={() => setOpenSheet(s => s === "estilo" ? null : "estilo")}
        />
        <BarBtn
          icon={<Sparkles size={20} strokeWidth={2}/>}
          label="Remix"
          active={openSheet === "ia"}
          onClick={() => setOpenSheet(s => s === "ia" ? null : "ia")}
        />
      </nav>

      {/* ═══ SHEETS TEMPORALES (overlay sobre canvas, no permanentes) ════ */}
      {openSheet && (
        <>
          {/* backdrop tap-fuera-cerrar */}
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpenSheet(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1c1c2a] rounded-t-3xl border-t border-white/[0.12] shadow-2xl max-h-[55vh] flex flex-col safe-area-bottom animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1 shrink-0"/>
            <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-white/[0.06]">
              <h2 className="text-[15px] font-bold">
                {openSheet === "texto" && "Editar texto"}
                {openSheet === "foto" && "Foto"}
                {openSheet === "estilo" && "Estilo"}
                {openSheet === "ia" && "Remix · 4 estilos"}
                {openSheet === "more" && "Más opciones"}
              </h2>
              <button
                onClick={() => setOpenSheet(null)}
                className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-transform shadow-lg"
                aria-label="Listo"
              >
                <Check size={18} strokeWidth={3}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">

              {/* SHEET TEXTO ─────────────────────────────────────────────── */}
              {openSheet === "texto" && (
                <div className="flex flex-col gap-3">
                  {textBlocks.length === 0 && (
                    <p className="text-[12px] text-gray-400 text-center py-6">
                      Esta plantilla no tiene textos editables aún. Toca un texto en el flyer para seleccionarlo.
                    </p>
                  )}
                  {textBlocks.map(block => {
                    const isActive = activeBlockId === block.id;
                    const value = blockValues[block.id] ?? "";
                    const tint = BLOCK_TINTS[block.kind];
                    return (
                      <div key={block.id} className={`rounded-2xl border ${isActive ? "border-purple-500/40 bg-purple-500/[0.05]" : "border-white/[0.06] bg-[#13131f]"}`}>
                        <button
                          onClick={() => setActiveBlockId(isActive ? null : block.id)}
                          className="w-full px-3 py-2.5 flex items-center gap-2.5"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[15px]" style={{ background: `rgba(${tint}, 0.15)` }}>
                            {BLOCK_ICONS[block.kind]}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-[9px] font-bold tracking-widest text-gray-500 uppercase">{block.label}</div>
                            <div className="text-[12px] font-semibold text-white truncate">
                              {value || <span className="text-gray-500">{block.placeholder}</span>}
                            </div>
                          </div>
                        </button>
                        {isActive && (
                          <div className="px-3 pb-3">
                            <input
                              type="text"
                              value={value}
                              onChange={e => onBlockChange(block, e.target.value)}
                              placeholder={block.placeholder}
                              autoFocus
                              className="w-full bg-[#0a0a14] border border-purple-500/40 rounded-lg px-3 py-2.5 text-[14px] text-white font-medium outline-none focus:border-purple-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SHEET FOTO ──────────────────────────────────────────────── */}
              {openSheet === "foto" && (
                <div className="flex flex-col items-center text-center text-gray-400 text-[13px] gap-2 py-8">
                  <ImageIcon size={36} className="opacity-30"/>
                  <p>Reemplazar foto, recortar, quitar fondo IA</p>
                  <p className="text-[11px] text-gray-500">Próximamente</p>
                </div>
              )}

              {/* SHEET ESTILO ────────────────────────────────────────────── */}
              {openSheet === "estilo" && (
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
                          className={`rounded-xl overflow-hidden border-2 transition-all ${isActive ? "border-purple-500" : "border-transparent active:scale-[0.97]"}`}
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

              {/* SHEET REMIX ─────────────────────────────────────────────── */}
              {openSheet === "ia" && (
                <div className="flex flex-col gap-3">
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
                          className={`rounded-2xl overflow-hidden border-2 transition-all ${isActive ? "border-purple-500" : "border-white/[0.06] active:scale-[0.96]"}`}
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
                </div>
              )}

              {/* SHEET MAS ───────────────────────────────────────────────── */}
              {openSheet === "more" && (
                <div className="flex flex-col gap-2">
                  <MoreRow icon={<Wand2 size={18}/>} label="Asistente IA" subtitle="Genera variaciones desde texto" disabled/>
                  <MoreRow icon={<LayoutGrid size={18}/>} label="Cambiar formato" subtitle="Story 9:16, Post 4:5, etc." disabled/>
                  <MoreRow icon={<XIcon size={18}/>} label="Reiniciar plantilla" subtitle="Volver al diseño original" disabled/>
                </div>
              )}

            </div>
          </div>
        </>
      )}

    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────

function ChipBtn({
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
      aria-label={label}
      className={`w-10 h-10 rounded-full flex items-center justify-center active:bg-white/10 transition-colors ${danger ? "text-red-400" : "text-gray-200"}`}
    >
      {icon}
    </button>
  );
}

function BarBtn({
  icon, label, active, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 ${active ? "text-purple-400" : "text-gray-400"}`}
    >
      <div className={`w-10 h-7 rounded-lg flex items-center justify-center ${active ? "bg-purple-500/15" : ""}`}>
        {icon}
      </div>
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  );
}

function MoreRow({
  icon, label, subtitle, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  disabled?: boolean;
}) {
  return (
    <div className={`px-3 py-2.5 rounded-xl bg-[#13131f] border border-white/[0.06] flex items-center gap-3 ${disabled ? "opacity-40" : ""}`}>
      <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-300 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold">{label}</div>
        <div className="text-[11px] text-gray-500">{subtitle}</div>
      </div>
      {disabled && <span className="text-[9px] text-amber-400 font-bold">PRÓXIMO</span>}
    </div>
  );
}
