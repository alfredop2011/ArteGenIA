"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Canvas as FabricCanvas, type FabricObject } from "fabric";
import {
  ArrowLeft, Download, Layers, Type, Image as ImageIcon, Palette, MoreHorizontal,
  Undo2, Redo2, Trash2,
} from "lucide-react";
import { templates, getVariant, type Template } from "@/data/templates";
import type { FormatId } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";

// ════════════════════════════════════════════════════════════════════════════
//  MobileEditor — editor mobile-first separado del desktop
//  SESION 1 de 6-8 planificadas. Esta sesion entrega:
//    - Esqueleto base (header / canvas / bottom toolbar)
//    - Carga de plantilla desde data/templates.ts
//    - Touch basico: tap selecciona, drag con dedo mueve, Fabric default
//    - Bottom sheets vacios listos para llenar en sesiones siguientes
//    - Export PNG funcional
//  Pendientes proximas sesiones: pinch zoom, rotate, handles tactiles 40px,
//    panel propiedades completo, edicion texto fullscreen, capas drag-reorder,
//    selector colores/fuentes mobile, snapping, multi-select.
// ════════════════════════════════════════════════════════════════════════════

type Props = {
  templateId?: number;
  projectId?: string;
  formatId?: FormatId;
};

type LayerItem = {
  id: string;
  name: string;
  type: "text" | "image" | "shape";
  obj: FabricObject;
};

type ToolId = "layers" | "text" | "photo" | "color" | "more";

export default function MobileEditor({ templateId, formatId }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [template, setTemplate] = useState<Template | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1080, h: 1350 });
  const [scale, setScale] = useState(0.35);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<LayerItem | null>(null);
  const [activeSheet, setActiveSheet] = useState<ToolId | null>(null);
  const [loaded, setLoaded] = useState(false);

  // ─── 1. Encontrar la plantilla ─────────────────────────────────────────
  useEffect(() => {
    if (!templateId) return;
    const t = templates.find(x => x.id === templateId);
    if (t) setTemplate(t);
  }, [templateId]);

  // ─── 2. Calcular scale para que el canvas quepa en el viewport ──────────
  // El canvas Fabric se renderiza al tamano REAL (1080x1350) pero CSS lo escala.
  // Asi mantenemos calidad export sin sacrificar performance touch.
  const computeScale = useCallback(() => {
    if (!template) return;
    const variant = getVariant(template, formatId);
    if (!variant) return;
    const availW = window.innerWidth - 16; // 8px padding cada lado
    const availH = window.innerHeight - 56 - 72 - 16; // header + bottom toolbar + margins
    const sX = availW / variant.width;
    const sY = availH / variant.height;
    const s = Math.min(sX, sY, 1);
    setScale(s);
    setCanvasSize({ w: variant.width, h: variant.height });
  }, [template, formatId]);

  useEffect(() => {
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [computeScale]);

  // ─── 3. Inicializar Fabric con touch habilitado ─────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !template) return;
    const variant = getVariant(template, formatId);
    if (!variant) return;

    const fc = new FabricCanvas(canvasRef.current, {
      width: variant.width,
      height: variant.height,
      backgroundColor: "#000",
      // Touch optimizations
      enableRetinaScaling: true,
      allowTouchScrolling: false,
      preserveObjectStacking: true,
      selection: false, // no multi-select por ahora (caotico en touch)
      uniformScaling: false,
    });

    fabricRef.current = fc;

    // Aplicar capas de la plantilla a coordenadas nativas (1080x1350)
    applyTemplateLayers(fc, variant.layers).then(() => {
      // Construir lista de capas
      const items: LayerItem[] = fc.getObjects().map((obj, i) => {
        const layerData = variant.layers?.[i];
        const type = layerData?.type ?? "shape";
        const name = layerData?.id ?? `Capa ${i + 1}`;
        return { id: name, name, type: type as LayerItem["type"], obj };
      });
      setLayers(items);

      // Quitar interaccion de capas marcadas selectable: false
      fc.getObjects().forEach((obj, i) => {
        const ld = variant.layers?.[i] as { selectable?: boolean } | undefined;
        if (ld && ld.selectable === false) {
          obj.selectable = false;
          obj.evented = false;
        }
      });
      setLoaded(true);
      fc.renderAll();
    });

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, formatId]);

  // ─── 3b. Aplicar zoom visual cuando cambia scale ────────────────────────
  // Fabric.setZoom maneja internamente las coordenadas touch correctamente.
  // El canvas DOM se reduce visualmente pero el touch funciona perfecto.
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.setZoom(scale);
    fc.setDimensions({
      width: canvasSize.w * scale,
      height: canvasSize.h * scale,
    });
    fc.renderAll();
  }, [scale, canvasSize.w, canvasSize.h]);

  // ─── 3c. Selection handlers ─────────────────────────────────────────────
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

  // ─── 4. Export PNG ─────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.discardActiveObject();

    // Guardar el zoom actual y resetear a 1 para exportar a tamano nativo
    const prevZoom = fc.getZoom();
    const prevW = fc.getWidth();
    const prevH = fc.getHeight();
    fc.setZoom(1);
    fc.setDimensions({ width: canvasSize.w, height: canvasSize.h });
    fc.renderAll();

    const url = fc.toDataURL({ format: "png", multiplier: 2 });

    // Restaurar
    fc.setZoom(prevZoom);
    fc.setDimensions({ width: prevW, height: prevH });
    fc.renderAll();

    const a = document.createElement("a");
    a.download = `flyer-${template?.title ?? "diseno"}.png`;
    a.href = url;
    a.click();
    setActiveSheet(null);
  }, [template, canvasSize.w, canvasSize.h]);

  // ─── 5. Acciones rapidas ───────────────────────────────────────────────
  const handleDeleteSelected = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !selectedLayer) return;
    fc.remove(selectedLayer.obj);
    fc.discardActiveObject();
    fc.renderAll();
    setLayers(prev => prev.filter(l => l.id !== selectedLayer.id));
    setSelectedLayer(null);
  }, [selectedLayer]);

  // ─── 6. Render ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#070711] flex flex-col text-white overflow-hidden">

      {/* ═══ HEADER ═══════════════════════════════════════════════════════ */}
      <header className="h-14 bg-[#0e0e14]/95 backdrop-blur-md border-b border-white/[0.06] flex items-center px-3 gap-2 shrink-0 z-30">
        <button
          onClick={() => router.push(template ? "/templates" : "/projects")}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 active:bg-white/10"
          aria-label="Volver"
        >
          <ArrowLeft size={20} strokeWidth={2}/>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{template?.title ?? "Editor"}</p>
          <p className="text-[10px] text-gray-500">{canvasSize.w} × {canvasSize.h}</p>
        </div>
        {selectedLayer && (
          <button
            onClick={handleDeleteSelected}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 active:bg-red-500/10"
            aria-label="Eliminar capa"
          >
            <Trash2 size={18} strokeWidth={2}/>
          </button>
        )}
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 active:from-purple-700 active:to-fuchsia-700 text-white text-sm font-bold flex items-center gap-1.5"
        >
          <Download size={15} strokeWidth={2.5}/>
          Exportar
        </button>
      </header>

      {/* ═══ CANVAS AREA ══════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-2">
        <div
          ref={wrapperRef}
          className="relative shadow-2xl shadow-black/70 bg-[#1a1a2e] rounded-sm"
          style={{
            width: canvasSize.w * scale,
            height: canvasSize.h * scale,
          }}
        >
          {/* Canvas dimensionado al tamano visual final - touch funciona nativo
              La calidad de export se mantiene con multiplier al exportar */}
          <canvas ref={canvasRef}/>

          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] rounded">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM TOOLBAR ════════════════════════════════════════════════ */}
      <nav className="h-[72px] bg-[#0e0e14]/95 backdrop-blur-md border-t border-white/[0.08] flex items-center justify-around px-2 shrink-0 z-20 safe-area-bottom">
        {([
          { id: "layers" as ToolId, label: "Capas", icon: Layers },
          { id: "text" as ToolId, label: "Texto", icon: Type },
          { id: "photo" as ToolId, label: "Foto", icon: ImageIcon },
          { id: "color" as ToolId, label: "Color", icon: Palette },
          { id: "more" as ToolId, label: "Más", icon: MoreHorizontal },
        ]).map(tool => {
          const Icon = tool.icon;
          const isActive = activeSheet === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveSheet(isActive ? null : tool.id)}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-colors ${
                isActive
                  ? "text-purple-300 bg-purple-500/15"
                  : "text-gray-400 active:text-white active:bg-white/5"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2}/>
              <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {tool.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ═══ BOTTOM SHEETS (placeholders sesion 1) ════════════════════════ */}
      {activeSheet && (
        <>
          <div
            onClick={() => setActiveSheet(null)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f1a] rounded-t-3xl border-t border-white/10 shadow-2xl pb-8 max-h-[70vh] flex flex-col safe-area-bottom">
            {/* Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-3 shrink-0"/>

            {/* Header sheet */}
            <div className="px-4 pb-3 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <span className="text-sm font-bold uppercase tracking-widest text-gray-300">
                {activeSheet === "layers" && "Capas"}
                {activeSheet === "text" && "Texto"}
                {activeSheet === "photo" && "Foto"}
                {activeSheet === "color" && "Color"}
                {activeSheet === "more" && "Más"}
              </span>
              <button onClick={() => setActiveSheet(null)} className="text-gray-400 active:text-white text-xl leading-none w-8 h-8 flex items-center justify-center">×</button>
            </div>

            {/* Content sheet - placeholder hasta sesion 2 */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {activeSheet === "layers" && (
                <div className="space-y-1">
                  {layers.filter(l => l.obj.selectable !== false).map(layer => (
                    <button
                      key={layer.id}
                      onClick={() => {
                        const fc = fabricRef.current;
                        if (!fc) return;
                        fc.setActiveObject(layer.obj);
                        fc.renderAll();
                        setSelectedLayer(layer);
                        setActiveSheet(null);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                        selectedLayer?.id === layer.id ? "bg-purple-600/20 border border-purple-500/40" : "bg-white/[0.03] active:bg-white/[0.08]"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400">
                        {layer.type === "text" ? <Type size={14}/> : layer.type === "image" ? <ImageIcon size={14}/> : <Palette size={14}/>}
                      </div>
                      <span className="text-sm text-white flex-1 truncate">{layer.name}</span>
                    </button>
                  ))}
                  {layers.length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-8">No hay capas</p>
                  )}
                </div>
              )}

              {activeSheet !== "layers" && (
                <div className="text-center text-gray-500 text-sm py-12">
                  <p className="font-semibold text-gray-400 mb-2">Próximamente</p>
                  <p className="text-xs">Esta sección se completa en próximas sesiones.</p>
                  <p className="text-xs mt-1">Por ahora puedes seleccionar capas tocándolas en el canvas y moverlas con el dedo.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
