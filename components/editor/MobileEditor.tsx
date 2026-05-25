"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Canvas as FabricCanvas, type FabricObject, Textbox } from "fabric";
import {
  ArrowLeft, Download, Layers, Type, Image as ImageIcon, Palette, MoreHorizontal,
  Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Check, X as XIcon,
} from "lucide-react";
import { templates, getVariant, type Template } from "@/data/templates";
import type { FormatId } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";

// ════════════════════════════════════════════════════════════════════════════
//  MobileEditor — editor mobile-first separado del desktop
//
//  SESION 2 entrega (acumulado sobre V1):
//    - Sheet "Texto" funcional: input + sliders fontSize/spacing + bold/italic
//      + align + propiedades comunes
//    - Sheet "Color" funcional: paleta tactil + native color picker
//    - Auto-open sheet "Texto" al seleccionar capa de tipo texto
//    - Doble tap en capa texto del canvas -> fullscreen editor con teclado iPhone
//    - Funcion updateProp que aplica cambios a Fabric en tiempo real
//
//  Pendiente proximas sesiones: pinch zoom, rotate, handles tactiles 40px,
//    drag-reorder capas, anadir texto/imagen, snapping, undo/redo.
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

  // SESION 2: estado para edicion de texto
  // textEditFullscreen: cuando true, modal pantalla completa con input + teclado
  const [textEditFullscreen, setTextEditFullscreen] = useState(false);
  const [tempText, setTempText] = useState(""); // buffer del texto en el modal fullscreen
  // forceRerender: bump number para forzar re-render del sheet con valores nuevos
  // tras cambiar prop del Fabric obj (Fabric muta in-place, React no detecta)
  const [, forceRerender] = useState(0);
  const bumpRender = useCallback(() => forceRerender(n => n + 1), []);

  // Paleta de colores rapidos para el sheet Color (mobile-friendly tap)
  const COLOR_PALETTE = [
    "#ffffff", "#000000", "#9ca3af", "#6b7280",
    "#fb923c", "#facc15", "#22c55e", "#22d3ee",
    "#3b82f6", "#a855f7", "#ec4899", "#ef4444",
    "#fef3c7", "#fed7aa", "#d8b4fe", "#fbcfe8",
  ];

  // Fuentes disponibles (las que el proyecto carga en layout.tsx)
  const FONTS = [
    { id: "Anton", label: "Anton" },
    { id: "Bebas Neue", label: "Bebas Neue" },
    { id: "Montserrat", label: "Montserrat" },
    { id: "Playfair Display", label: "Playfair" },
    { id: "Oswald", label: "Oswald" },
    { id: "Cormorant Garamond", label: "Cormorant" },
    { id: "Great Vibes", label: "Great Vibes" },
  ];

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

  // ─── 3d. Auto-abrir sheet contextual al seleccionar capa ────────────────
  // Sesion 2: al seleccionar capa texto -> abre sheet "text" (propiedades).
  // Al seleccionar imagen/shape -> abre sheet "color" (cambiar color/opacity).
  useEffect(() => {
    if (!selectedLayer) {
      // Si se deselecciona, cerrar sheet si era contextual
      if (activeSheet === "text" || activeSheet === "color") {
        setActiveSheet(null);
      }
      return;
    }
    if (selectedLayer.type === "text") {
      setActiveSheet("text");
    }
    // No autoabrir sheets para shape/image - menos invasivo
    // El usuario puede tocar el boton "Color" del toolbar si quiere editar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayer]);

  // ─── 3e. Doble tap en capa texto -> modal fullscreen edit ───────────────
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const onDouble = (e: { target?: FabricObject }) => {
      const target = e.target;
      if (!target) return;
      // Solo para textos (Textbox de Fabric)
      const isText = target.type === "textbox" || target.type === "i-text" || target.type === "text";
      if (!isText) return;
      const t = target as unknown as { text: string };
      setTempText(t.text ?? "");
      setTextEditFullscreen(true);
    };
    fc.on("mouse:dblclick", onDouble);
    return () => {
      fc.off("mouse:dblclick", onDouble);
    };
  }, [loaded]);

  // ─── 3f. updateProp - aplica cambio en la capa seleccionada en tiempo real
  const updateProp = useCallback((prop: string, value: unknown) => {
    const fc = fabricRef.current;
    if (!fc || !selectedLayer) return;
    const obj = selectedLayer.obj as FabricObject & Record<string, unknown>;
    obj.set(prop, value);
    obj.setCoords();
    fc.requestRenderAll();
    bumpRender();
  }, [selectedLayer, bumpRender]);

  // Aplica texto desde el modal fullscreen y cierra
  const commitFullscreenText = useCallback(() => {
    if (!selectedLayer || selectedLayer.type !== "text") {
      setTextEditFullscreen(false);
      return;
    }
    updateProp("text", tempText);
    setTextEditFullscreen(false);
  }, [selectedLayer, tempText, updateProp]);

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

            {/* Content sheet */}
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

              {/* ─── SHEET TEXTO (sesion 2) ────────────────────────────── */}
              {activeSheet === "text" && selectedLayer && selectedLayer.type === "text" && (() => {
                const obj = selectedLayer.obj as Textbox;
                return (
                  <div className="space-y-5">
                    {/* Quick text edit */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-1.5 block">Texto</label>
                      <button
                        onClick={() => { setTempText(obj.text ?? ""); setTextEditFullscreen(true); }}
                        className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-3 py-3 text-sm text-white text-left active:bg-white/[0.10] flex items-center justify-between gap-2"
                      >
                        <span className="truncate flex-1">{obj.text || <em className="text-gray-500">Vacío</em>}</span>
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider shrink-0">Editar</span>
                      </button>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2 block">Color</label>
                      <div className="grid grid-cols-8 gap-1.5 mb-2">
                        {COLOR_PALETTE.map(c => (
                          <button
                            key={c}
                            onClick={() => updateProp("fill", c)}
                            className={`aspect-square rounded-lg active:scale-90 transition-transform border-2 ${
                              (obj.fill as string)?.toLowerCase() === c.toLowerCase() ? "border-white" : "border-white/10"
                            }`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      <label className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 active:bg-white/[0.08]">
                        <span className="text-xs text-gray-400">Personalizado</span>
                        <input
                          type="color"
                          value={typeof obj.fill === "string" ? obj.fill : "#ffffff"}
                          onChange={e => updateProp("fill", e.target.value)}
                          className="ml-auto w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                          style={{ appearance: "none" }}
                        />
                      </label>
                    </div>

                    {/* Fuente */}
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2 block">Fuente</label>
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
                        {FONTS.map(f => {
                          const current = (obj.fontFamily ?? "").toString();
                          const isActive = current.includes(f.id);
                          return (
                            <button
                              key={f.id}
                              onClick={() => updateProp("fontFamily", f.id)}
                              className={`shrink-0 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all ${
                                isActive
                                  ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                                  : "bg-white/[0.04] text-gray-300 border border-white/10 active:bg-white/[0.08]"
                              }`}
                              style={{ fontFamily: f.id }}
                            >
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tamano */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Tamaño</label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round((obj.fontSize as number) ?? 60)}px</span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={300}
                        value={(obj.fontSize as number) ?? 60}
                        onChange={e => updateProp("fontSize", Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    {/* Espaciado */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Espaciado</label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round((obj.charSpacing as number) ?? 0)}</span>
                      </div>
                      <input
                        type="range"
                        min={-100}
                        max={1200}
                        step={10}
                        value={(obj.charSpacing as number) ?? 0}
                        onChange={e => updateProp("charSpacing", Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    {/* Estilos: bold/italic + align */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateProp("fontWeight", obj.fontWeight === "bold" || obj.fontWeight === "700" ? "400" : "bold")}
                        className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all ${
                          obj.fontWeight === "bold" || obj.fontWeight === "700"
                            ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                            : "bg-white/[0.04] text-gray-400 border border-white/10 active:bg-white/[0.08]"
                        }`}
                      >
                        <Bold size={18} strokeWidth={2.5}/>
                      </button>
                      <button
                        onClick={() => updateProp("fontStyle", obj.fontStyle === "italic" ? "normal" : "italic")}
                        className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all ${
                          obj.fontStyle === "italic"
                            ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                            : "bg-white/[0.04] text-gray-400 border border-white/10 active:bg-white/[0.08]"
                        }`}
                      >
                        <Italic size={18} strokeWidth={2.5}/>
                      </button>
                      <div className="w-px h-8 bg-white/10 mx-0.5"/>
                      {(["left", "center", "right"] as const).map(align => {
                        const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
                        const isActive = obj.textAlign === align;
                        return (
                          <button
                            key={align}
                            onClick={() => updateProp("textAlign", align)}
                            className={`flex-1 h-12 rounded-xl flex items-center justify-center transition-all ${
                              isActive
                                ? "bg-purple-600/30 text-purple-200 border border-purple-500/40"
                                : "bg-white/[0.04] text-gray-400 border border-white/10 active:bg-white/[0.08]"
                            }`}
                          >
                            <Icon size={18} strokeWidth={2.5}/>
                          </button>
                        );
                      })}
                    </div>

                    {/* Opacidad */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Opacidad</label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round(((obj.opacity as number) ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(((obj.opacity as number) ?? 1) * 100)}
                        onChange={e => updateProp("opacity", Number(e.target.value) / 100)}
                        className="w-full accent-purple-500"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* SHEET TEXTO sin seleccion - hint */}
              {activeSheet === "text" && (!selectedLayer || selectedLayer.type !== "text") && (
                <div className="text-center text-gray-500 text-sm py-12">
                  <Type size={32} strokeWidth={1.5} className="mx-auto mb-3 text-gray-700"/>
                  <p className="font-semibold text-gray-400 mb-2">Selecciona un texto</p>
                  <p className="text-xs">Toca una capa de texto en el lienzo para editar su contenido, color y fuente.</p>
                </div>
              )}

              {/* ─── SHEET COLOR (sesion 2) ────────────────────────────── */}
              {activeSheet === "color" && selectedLayer && (() => {
                const obj = selectedLayer.obj as FabricObject & { fill?: unknown; opacity?: number };
                const currentColor = typeof obj.fill === "string" ? obj.fill : "#ffffff";
                return (
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2 block">
                        Color {selectedLayer.type === "text" ? "del texto" : selectedLayer.type === "image" ? "(no aplica a imagenes)" : "de relleno"}
                      </label>
                      {selectedLayer.type !== "image" && (
                        <>
                          <div className="grid grid-cols-8 gap-1.5 mb-2">
                            {COLOR_PALETTE.map(c => (
                              <button
                                key={c}
                                onClick={() => updateProp("fill", c)}
                                className={`aspect-square rounded-lg active:scale-90 transition-transform border-2 ${
                                  currentColor.toLowerCase() === c.toLowerCase() ? "border-white" : "border-white/10"
                                }`}
                                style={{ background: c }}
                              />
                            ))}
                          </div>
                          <label className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5">
                            <span className="text-xs text-gray-400">Personalizado</span>
                            <input
                              type="color"
                              value={currentColor}
                              onChange={e => updateProp("fill", e.target.value)}
                              className="ml-auto w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                              style={{ appearance: "none" }}
                            />
                          </label>
                        </>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Opacidad</label>
                        <span className="text-xs text-gray-400 tabular-nums">{Math.round(((obj.opacity as number) ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={Math.round(((obj.opacity as number) ?? 1) * 100)}
                        onChange={e => updateProp("opacity", Number(e.target.value) / 100)}
                        className="w-full accent-purple-500"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* SHEET COLOR sin seleccion */}
              {activeSheet === "color" && !selectedLayer && (
                <div className="text-center text-gray-500 text-sm py-12">
                  <Palette size={32} strokeWidth={1.5} className="mx-auto mb-3 text-gray-700"/>
                  <p className="font-semibold text-gray-400 mb-2">Selecciona una capa</p>
                  <p className="text-xs">Toca una capa en el lienzo para cambiar su color.</p>
                </div>
              )}

              {/* SHEETS PENDIENTES: photo + more */}
              {(activeSheet === "photo" || activeSheet === "more") && (
                <div className="text-center text-gray-500 text-sm py-12">
                  <p className="font-semibold text-gray-400 mb-2">Próximamente</p>
                  <p className="text-xs">Esta sección se completa en próximas sesiones (subir foto, duplicar, mover capa, etc).</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ FULLSCREEN TEXT EDIT MODAL (sesion 2) ════════════════════════
          Se abre via doble tap en canvas OR boton "Editar" del sheet Texto.
          Usa textarea nativo -> aprovecha teclado iPhone, autocompletado,
          dictado por voz, etc.
          ═══════════════════════════════════════════════════════════════════ */}
      {textEditFullscreen && selectedLayer && selectedLayer.type === "text" && (
        <div className="fixed inset-0 z-[60] bg-[#0a0a14] flex flex-col safe-area-bottom">
          {/* Header */}
          <div className="h-14 border-b border-white/10 flex items-center px-3 gap-2 bg-[#0e0e14]">
            <button
              onClick={() => setTextEditFullscreen(false)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 active:bg-white/10"
              aria-label="Cancelar"
            >
              <XIcon size={20} strokeWidth={2}/>
            </button>
            <p className="flex-1 text-sm font-semibold text-white">Editar texto</p>
            <button
              onClick={commitFullscreenText}
              className="px-4 py-2 rounded-xl bg-purple-600 active:bg-purple-700 text-white text-sm font-bold flex items-center gap-1.5"
            >
              <Check size={15} strokeWidth={2.5}/>
              Aplicar
            </button>
          </div>

          {/* Textarea fullscreen */}
          <div className="flex-1 p-4">
            <textarea
              autoFocus
              value={tempText}
              onChange={e => setTempText(e.target.value)}
              placeholder="Escribe el texto..."
              className="w-full h-full bg-transparent text-white text-2xl font-bold leading-tight outline-none resize-none placeholder-gray-700"
              style={{
                fontFamily: (selectedLayer.obj as Textbox).fontFamily ?? "Montserrat",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
