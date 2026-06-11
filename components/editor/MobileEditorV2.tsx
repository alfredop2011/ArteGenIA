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
  type FabricObject,
  Textbox,
} from "fabric";
import {
  ArrowLeft, Download, Undo2, Redo2,
  ChevronDown, Check, Sparkles,
  ChevronUp, Copy, Trash2, Palette as PaletteIcon,
  Type as TypeIcon, X as XIcon, Layers as LayersIcon, Star as StarIcon,
} from "lucide-react";
import { templates, getVariant, type Template } from "@/data/templates";
import type { FormatId } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import { applyWatermark, shouldWatermark } from "@/lib/applyWatermark";
import { getBlocksForTemplate, BLOCK_ICONS, BLOCK_TINTS, type EditableBlock } from "@/data/templateBlocks";

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

  // ─── Auto-fit canvas al area disponible ─────────────────────────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !loaded || !wrapperRef.current) return;
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const zoomW = wrapperRect.width / canvasSize.w;
    const zoomH = wrapperRect.height / canvasSize.h;
    const fit = Math.min(zoomW, zoomH);
    fc.setDimensions({ width: wrapperRect.width, height: wrapperRect.height });
    fc.setZoom(fit);
    const tx = (wrapperRect.width - canvasSize.w * fit) / 2;
    const ty = (wrapperRect.height - canvasSize.h * fit) / 2;
    fc.setViewportTransform([fit, 0, 0, fit, tx, ty]);
    fc.requestRenderAll();
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
    void doExport("png");
  }, [authUser, doExport, toast]);

  // ─── RENDER ──────────────────────────────────────────────────────────────

  const blocksWithValues = useMemo(() => {
    return blocks.map(b => ({ block: b, value: blockValues[b.id] ?? "" }));
  }, [blocks, blockValues]);

  // Si la plantilla no tiene schema de bloques, mostrar empty state amigable
  const hasNoSchema = blocks.length === 0 && loaded;

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#0a0a14] text-white">

      {/* ═══ HEADER ════════════════════════════════════════════════════════ */}
      <header className="px-3 py-2 flex items-center gap-2 border-b border-white/[0.06] shrink-0">
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
        </button>
        <div className="flex-1 min-w-0 pl-1">
          <h1 className="text-[15px] font-bold leading-tight truncate">
            {template?.title ?? "Cargando…"}
          </h1>
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

      {/* ═══ CANVAS AREA (altura controlada para no desbordar el sheet) ═══ */}
      <div className="shrink-0 h-[42vh] min-h-[280px] max-h-[400px] px-4 pt-3 flex items-center justify-center">
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
              {blocksWithValues.map(({ block, value }) => {
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
                        <div className="text-[13px] font-semibold text-white truncate">
                          {value || <span className="text-gray-500">{block.placeholder}</span>}
                        </div>
                      </div>
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        className={`text-gray-500 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
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
                            className="w-full bg-[#0a0a14] border border-purple-500/40 rounded-xl px-3.5 py-3 text-[14px] text-white font-medium outline-none resize-none focus:border-purple-500"
                          />
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={e => onBlockChange(block, e.target.value)}
                            placeholder={block.placeholder}
                            maxLength={block.maxLength}
                            className="w-full bg-[#0a0a14] border border-purple-500/40 rounded-xl px-3.5 py-3 text-[14px] text-white font-medium outline-none focus:border-purple-500"
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
            <div className="px-4 pb-4 flex flex-col items-center justify-center h-full text-center text-gray-400 text-[13px] gap-2">
              <PaletteIcon size={36} className="opacity-30"/>
              <p>Paletas y fuentes — próximamente</p>
            </div>
          )}

          {activeTab === "remix" && (
            <div className="px-4 pb-4 flex flex-col items-center justify-center h-full text-center text-gray-400 text-[13px] gap-2">
              <Sparkles size={36} className="opacity-30"/>
              <p>Variaciones de estilo — próximamente</p>
            </div>
          )}

        </div>
      </section>

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
