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
  Shadow,
  Line,
  Triangle,
  Polygon,
  Path,
} from "fabric";
import {
  ArrowLeft, Download, Layers, Type, Image as ImageIcon, Palette, MoreHorizontal,
  Trash2, Bold, Italic, AlignLeft, AlignCenter, AlignRight, Check, X as XIcon,
  Plus, Copy, Square, Circle as CircleIcon, MoveUp, MoveDown,
  ChevronUp, ChevronDown, GripVertical,
  Triangle as TriangleIcon, Star, Hexagon, Minus, ArrowRight as ArrowRightIcon,
  SquareDashed, Scissors, Loader2,
} from "lucide-react";
import { templates, getVariant, type Template } from "@/data/templates";
import type { FormatId } from "@/data/formats";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import { applyWatermark, shouldWatermark } from "@/lib/applyWatermark";
import { useLocale } from "@/hooks/useLocale";

// ════════════════════════════════════════════════════════════════════════════
//  MobileEditor — editor mobile-first separado del desktop
//
//  SESION 5 entrega (acumulado sobre V1+V2+V3+V4):
//    - Sheet "Foto" funcional: boton "Subir foto" abre galeria iPhone nativa
//      (FileReader + FabricImage.fromURL + auto-escala al 60% del canvas)
//    - Sheet "Mas" funcional: 3 botones para anadir capas + acciones contextuales
//        + Nuevo texto (Textbox por defecto centrada, abre auto sheet propiedades)
//        + Rectangulo (300x300 purple a centro)
//        + Circulo (radius 150 naranja a centro)
//        Si hay capa seleccionada: Duplicar, Eliminar, Al frente, Atras
//    - Sheet "Capas" mejorado:
//        + Boton "Anadir capa" arriba (atajo a Mas)
//        + Orden visual: ARRIBA en lista = FRENTE en canvas
//        + Cuando una capa esta seleccionada: 2 flechas chevron up/down para
//          reordenar al frente/atras
//        + Resync state layers tras reorder Fabric
//    - Helper registerLayer aplica styling tactil (sesion 4) a capas nuevas
//
//  Pendiente proximas sesiones: snapping / smart guides, undo/redo,
//    soporte mobile para /editor/generated y proyectos guardados.
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
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<LayerItem | null>(null);
  const [activeSheet, setActiveSheet] = useState<ToolId | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Auth: si el usuario intenta descargar sin sesion abrimos AuthModal y
  // reintentamos la descarga al hacer login exitoso.
  const { user: authUser, profile: authProfile } = useAuth();
  const { t } = useLocale();

  // ─── HINT INICIAL para usuarios nuevos ─────────────────────────────────
  // V7: primera vez que el usuario abre el editor en mobile, mostramos un
  // overlay corto con 3 hints. localStorage persistente — al cerrar, no
  // vuelve a aparecer. Para forzar reaparecer (debug): borrar la key
  // "artegenia-mobile-hint-seen" desde devtools.
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    try {
      const seen = window.localStorage.getItem("artegenia-mobile-hint-seen");
      if (!seen) setShowHint(true);
    } catch {
      // Modo privado / SSR: ignore
    }
  }, []);
  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      window.localStorage.setItem("artegenia-mobile-hint-seen", "1");
    } catch {
      // ignore
    }
  }, []);
  const [authModalConfig, setAuthModalConfig] = useState<{ title: string; subtitle: string; onSuccess: () => void } | null>(null);
  const requireAuth = useCallback((action: () => void, opts: { title: string; subtitle: string }) => {
    if (authUser) action();
    else setAuthModalConfig({ ...opts, onSuccess: action });
  }, [authUser]);

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

  // ─── 2. Calcular el AREA DISPONIBLE para el canvas (no el scale) ───────
  // SESION 3: cambio approach. El canvas DOM ocupa toda el area disponible.
  // El zoom inicial se calcula con setZoom + setViewportTransform para centrar
  // el flyer dentro. El pinch zoom puede aumentar/disminuir libremente despues.
  const [canvasArea, setCanvasArea] = useState({ w: 300, h: 500 });

  // Compute canvas area - mantiene tamano completo siempre.
  // El reposicionamiento del flyer cuando hay sheet abierto se hace via
  // viewport offset (effect mas abajo) para que la capa seleccionada quede
  // visible POR ENCIMA del sheet, no tapada.
  const computeArea = useCallback(() => {
    if (!template) return;
    const variant = getVariant(template, formatId);
    if (!variant) return;
    const availW = window.innerWidth - 16;
    const availH = window.innerHeight - 56 - 72 - 16;
    setCanvasArea({ w: availW, h: Math.max(200, availH) });
    setCanvasSize({ w: variant.width, h: variant.height });
  }, [template, formatId]);

  useEffect(() => {
    computeArea();
    window.addEventListener("resize", computeArea);
    return () => window.removeEventListener("resize", computeArea);
  }, [computeArea]);

  // Track del zoom actual (puede cambiar con pinch). Inicialmente auto-fit.
  const [, setZoomDisplay] = useState(1); // solo para re-render del display si lo mostramos

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

      // Configurar TODAS las capas para uso tactil mobile
      fc.getObjects().forEach((obj, i) => {
        const ld = variant.layers?.[i] as { selectable?: boolean } | undefined;
        if (ld && ld.selectable === false) {
          obj.selectable = false;
          obj.evented = false;
          return;
        }
        // SESION 4 + 6: Estilo handles tactil-friendly
        // Valores fijos (no escalan por zoom), Fabric ya gestiona internamente
        obj.set({
          cornerColor: "#a855f7",          // purple-500
          cornerStrokeColor: "#ffffff",
          cornerStyle: "circle",
          transparentCorners: false,
          borderColor: "#a855f7",
          borderScaleFactor: 1,
          cornerSize: 10,                   // tamano visual handle
          touchCornerSize: 36,              // hit area touch (Apple HIG)
          padding: 4,
          hasRotatingPoint: true,           // habilita rotate handle
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
  }, [template, formatId]);

  // ─── 3g. Ajustar tamano de handles (sesion 6 fix) ─────────────────────
  // Fabric ya escala los handles automaticamente con el zoom, asi que NO
  // necesitamos compensar dividiendo por zoom. Solo usamos valores fijos
  // razonables. cornerSize=14 da ~14px visuales en zoom 1, y Fabric lo
  // escala automatico. touchCornerSize=44 (Apple HIG min tap target) controla
  // SOLO el hit area de touch, sin afectar el tamano visual del bbox.
  const lastAppliedZoomRef = useRef<number>(0);
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;

    const applyHandleSize = () => {
      fc.getObjects().forEach(obj => {
        if (!obj.selectable) return;
        obj.set({
          // Valores FIJOS, no divididos por zoom (Fabric ya escala internamente).
          // Esto evita que el bbox crezca enormemente en zoom bajo.
          cornerSize: 10,
          touchCornerSize: 36, // hit area touch (no afecta visual)
          padding: 4,
          borderScaleFactor: 1,
        });
        obj.setCoords();
      });
      fc.requestRenderAll();
    };

    applyHandleSize();
    // Ya no necesitamos listener after:render porque los valores son fijos
  }, [loaded, layers.length]);

  // ─── 3b. Ajustar canvas DOM al area disponible + auto-fit zoom inicial
  // SESION 3: el canvas DOM ocupa toda el area disponible. El zoom + viewport
  // se ajusta para centrar el flyer dentro. Luego pinch puede modificarlo.
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    // Dimensionar el canvas DOM al area disponible
    fc.setDimensions({ width: canvasArea.w, height: canvasArea.h });
    // Auto-fit: calcula zoom que entra ancho+alto y centra
    const zoomW = canvasArea.w / canvasSize.w;
    const zoomH = canvasArea.h / canvasSize.h;
    const fitZoom = Math.min(zoomW, zoomH) * 0.98; // 2% margen visual
    fc.setZoom(fitZoom);
    // Centrar viewport: traslada para que el flyer quede centrado
    const tx = (canvasArea.w - canvasSize.w * fitZoom) / 2;
    const ty = (canvasArea.h - canvasSize.h * fitZoom) / 2;
    fc.setViewportTransform([fitZoom, 0, 0, fitZoom, tx, ty]);
    setZoomDisplay(fitZoom);
    fc.requestRenderAll();
  }, [canvasArea.w, canvasArea.h, canvasSize.w, canvasSize.h]);

  // ─── 3b-bis. PINCH ZOOM + PAN (sesion 3, fix sesion 6) ─────────────────
  // FIX SESION 6: el listener anterior estaba en fc.upperCanvasEl que en Fabric 7
  // se rompe si el handler se registra antes que la wrapper interna este montada.
  // Ahora usamos wrapperRef (el div padre) que SIEMPRE esta disponible y captura
  // los eventos touch ANTES que Fabric los procese.
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !loaded) return;
    const el = wrapperRef.current;
    if (!el) return;

    // Estado del gesto en curso
    let mode: "none" | "pan" | "pinch" = "none";
    let lastPanX = 0, lastPanY = 0;
    let initialDist = 0;
    let initialZoom = 1;
    let initialMidX = 0, initialMidY = 0;
    let initialVptX = 0, initialVptY = 0;

    const distance = (t1: Touch, t2: Touch) => {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return Math.hypot(dx, dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Empieza pinch: cancela cualquier seleccion activa para que Fabric no estorbe
        e.preventDefault();
        e.stopPropagation();
        fc.discardActiveObject();
        mode = "pinch";
        const [t1, t2] = [e.touches[0], e.touches[1]];
        initialDist = distance(t1, t2);
        initialZoom = fc.getZoom();
        const vpt = fc.viewportTransform;
        if (!vpt) return;
        initialVptX = vpt[4];
        initialVptY = vpt[5];
        // Punto medio en coords del wrapper
        const rect = el.getBoundingClientRect();
        initialMidX = ((t1.clientX + t2.clientX) / 2) - rect.left;
        initialMidY = ((t1.clientY + t2.clientY) / 2) - rect.top;
      } else if (e.touches.length === 1) {
        // Verificar si toco objeto - si no, modo PAN
        const t = e.touches[0];
        const rect = el.getBoundingClientRect();
        const target = fc.findTarget({ clientX: t.clientX, clientY: t.clientY } as unknown as MouseEvent);
        if (!target) {
          // Zona vacia -> pan
          mode = "pan";
          lastPanX = t.clientX - rect.left;
          lastPanY = t.clientY - rect.top;
        } else {
          // Hay objeto -> Fabric gestiona drag, no interferir
          mode = "none";
        }
      } else {
        mode = "none";
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (mode === "pinch" && e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        const [t1, t2] = [e.touches[0], e.touches[1]];
        const newDist = distance(t1, t2);
        const ratio = newDist / initialDist;
        let newZoom = initialZoom * ratio;
        // Limitar zoom min/max
        newZoom = Math.max(0.1, Math.min(5, newZoom));
        // Aplicar zoom manteniendo el punto medio inicial fijo
        const zoomRatio = newZoom / initialZoom;
        const newVptX = initialMidX - (initialMidX - initialVptX) * zoomRatio;
        const newVptY = initialMidY - (initialMidY - initialVptY) * zoomRatio;
        fc.setViewportTransform([newZoom, 0, 0, newZoom, newVptX, newVptY]);
        setZoomDisplay(newZoom);
        fc.requestRenderAll();
      } else if (mode === "pan" && e.touches.length === 1) {
        e.preventDefault();
        e.stopPropagation();
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
      if (e.touches.length === 0) {
        mode = "none";
      } else if (e.touches.length === 1 && mode === "pinch") {
        mode = "none";
      }
    };

    // Capture phase = true: el listener se ejecuta ANTES de que Fabric lo procese
    el.addEventListener("touchstart", onTouchStart, { passive: false, capture: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    el.addEventListener("touchend", onTouchEnd, { capture: true });
    el.addEventListener("touchcancel", onTouchEnd, { capture: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart, { capture: true });
      el.removeEventListener("touchmove", onTouchMove, { capture: true });
      el.removeEventListener("touchend", onTouchEnd, { capture: true });
      el.removeEventListener("touchcancel", onTouchEnd, { capture: true });
    };
  }, [loaded]);

  // ─── 3b-tris. RESET VIEW (zoom + pan al original) ──────────────────────
  const resetView = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const zoomW = canvasArea.w / canvasSize.w;
    const zoomH = canvasArea.h / canvasSize.h;
    const fitZoom = Math.min(zoomW, zoomH) * 0.98;
    const tx = (canvasArea.w - canvasSize.w * fitZoom) / 2;
    const ty = (canvasArea.h - canvasSize.h * fitZoom) / 2;
    fc.setViewportTransform([fitZoom, 0, 0, fitZoom, tx, ty]);
    setZoomDisplay(fitZoom);
    fc.requestRenderAll();
  }, [canvasArea.w, canvasArea.h, canvasSize.w, canvasSize.h]);

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

  // ─── 3c-bis. Reposicionar viewport al editar (SIN tocar zoom) ──────────
  //
  // V7.1 (revert del auto-zoom): el auto-zoom agresivo causaba sensacion de
  // "loquera" al cambiar entre capas (re-zoom en cada seleccion). Movimos
  // a un comportamiento mas neutro: SOLO ajustamos el pan para que la capa
  // quede visible por encima del sheet inferior, pero NO tocamos el zoom.
  // El usuario controla el zoom con pellizco — mas predecible y permite
  // edicion libre.
  //
  // Si la capa ya está visible en la mitad superior, no movemos nada
  // (evita micro-jitter al re-seleccionar la misma capa).
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !loaded || !activeSheet || !selectedLayer) return;

    // Altura disponible cuando hay sheet abierto: por encima del sheet
    const sheetHpx = window.innerHeight * 0.30;
    const visibleH = canvasArea.h - sheetHpx;

    // Centro del objeto en coords del canvas (sin viewport)
    const obj = selectedLayer.obj;
    const bounds = obj.getBoundingRect();
    const objCenterY = bounds.top + bounds.height / 2;

    const zoom = fc.getZoom();
    const vpt = fc.viewportTransform;
    if (!vpt) return;

    // Donde esta el centro del objeto en pantalla actualmente
    const currentScreenY = objCenterY * zoom + vpt[5];

    // Si ya esta en la mitad superior visible (con margen), no movemos
    const safeTopBand = visibleH * 0.15;
    const safeBottomBand = visibleH * 0.85;
    if (currentScreenY >= safeTopBand && currentScreenY <= safeBottomBand) {
      return; // ya esta bien situado, no molestar
    }

    // Reposicionar: queremos centro del objeto en mitad de la zona visible
    const targetCenterY = visibleH / 2;
    const ty = targetCenterY - objCenterY * zoom;
    fc.setViewportTransform([vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], ty]);
    fc.requestRenderAll();
  }, [activeSheet, selectedLayer, loaded, canvasArea.h]);

  // ─── 3d. Auto-abrir sheet contextual al seleccionar capa ────────────────
  //
  // V7 (mejora UX mobile): ahora TODOS los tipos de capa auto-abren sheet
  // para que el usuario VEA inmediatamente las opciones de edicion sin
  // tener que descubrirlas en la bottom nav. Esto + el auto-zoom del
  // useEffect anterior hace que la edicion sea "tap → ya estoy editando".
  //
  //   - text  → sheet "text" (Bold/Italic/Tamano/Color de texto)
  //   - image → sheet "color" (Opacidad/efectos basicos)
  //   - shape → sheet "color" (Color de fondo/Opacidad)
  //
  // Al deseleccionar, cerramos el sheet contextual (no los manuales como
  // "photo" o "more").
  useEffect(() => {
    if (!selectedLayer) {
      if (activeSheet === "text" || activeSheet === "color") {
        setActiveSheet(null);
      }
      return;
    }
    if (selectedLayer.type === "text") {
      setActiveSheet("text");
    } else {
      // image, shape, etc.
      setActiveSheet("color");
    }
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
  // Logica pura del export. Aplica marca de agua si el usuario es free.
  // NO checkea sesion (lo hace el wrapper handleExport).
  const doExport = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.discardActiveObject();

    // Guardar zoom + viewport + dimensions (usuario puede haber zoomeado/paneado)
    const prevZoom = fc.getZoom();
    const prevW = fc.getWidth();
    const prevH = fc.getHeight();
    const prevVpt = fc.viewportTransform ? [...fc.viewportTransform] : [1, 0, 0, 1, 0, 0];

    // Resetear todo al estado nativo del flyer (zoom 1, viewport identity, tamano original)
    fc.setZoom(1);
    fc.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fc.setDimensions({ width: canvasSize.w, height: canvasSize.h });
    fc.renderAll();

    const rawUrl = fc.toDataURL({ format: "png", multiplier: 2 });

    // Restaurar exactamente como estaba
    fc.setDimensions({ width: prevW, height: prevH });
    fc.setZoom(prevZoom);
    fc.setViewportTransform(prevVpt as [number, number, number, number, number, number]);
    fc.renderAll();

    // Marca de agua solo en plan free. Pro/Enterprise descargan limpio.
    // Si falla, fallback a la imagen sin marca para no romper la descarga.
    let finalUrl = rawUrl;
    if (shouldWatermark(authProfile?.plan)) {
      try {
        finalUrl = await applyWatermark(rawUrl);
      } catch (err) {
        console.warn("Watermark failed, fallback a imagen sin marca:", err);
      }
    }

    const a = document.createElement("a");
    a.download = `flyer-${template?.title ?? "diseno"}.png`;
    a.href = finalUrl;
    a.click();
    setActiveSheet(null);
  }, [template, canvasSize.w, canvasSize.h, authProfile?.plan]);

  // Wrapper publico: pide sesion antes de descargar. Si no hay, abre el
  // AuthModal y reintenta el export tras login exitoso.
  const handleExport = useCallback(() => {
    requireAuth(
      doExport,
      {
        title: "Descarga tu diseño",
        subtitle: "Inicia sesión para descargar. Es gratis.",
      },
    );
  }, [requireAuth, doExport]);

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

  // ─── 5b. Anadir capa al layers state (helper interno) ───────────────────
  const registerLayer = useCallback((obj: FabricObject, name: string, type: LayerItem["type"]) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Aplica el styling tactil (mismo que loaded effect, sesion 6)
    obj.set({
      cornerColor: "#a855f7",
      cornerStrokeColor: "#ffffff",
      cornerStyle: "circle",
      transparentCorners: false,
      borderColor: "#a855f7",
      borderScaleFactor: 1,
      cornerSize: 10,
      touchCornerSize: 36,
      padding: 4,
      hasRotatingPoint: true,
    });
    const item: LayerItem = { id, name, type, obj };
    setLayers(prev => [...prev, item]);
    return item;
  }, []);

  // ─── 5c. + Texto ────────────────────────────────────────────────────────
  const handleAddText = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const t = new Textbox("Doble tap para editar", {
      left: canvasSize.w / 2 - 200,
      top: canvasSize.h / 2 - 30,
      width: 400,
      fontSize: 60,
      fontFamily: "Montserrat",
      fill: "#ffffff",
      fontWeight: "700",
      textAlign: "center",
    });
    fc.add(t);
    const item = registerLayer(t, "Nuevo texto", "text");
    fc.setActiveObject(t);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet("text"); // auto-abrir sheet propiedades
  }, [canvasSize.w, canvasSize.h, registerLayer]);

  // ─── 5d. + Rectangulo ───────────────────────────────────────────────────
  const handleAddRect = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const r = new Rect({
      left: canvasSize.w / 2 - 150,
      top: canvasSize.h / 2 - 150,
      width: 300,
      height: 300,
      fill: "#a855f7",
      opacity: 0.8,
    });
    fc.add(r);
    const item = registerLayer(r, "Rectángulo", "shape");
    fc.setActiveObject(r);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [canvasSize.w, canvasSize.h, registerLayer]);

  // ─── 5e. + Circulo ──────────────────────────────────────────────────────
  const handleAddCircle = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const c = new Circle({
      left: canvasSize.w / 2 - 150,
      top: canvasSize.h / 2 - 150,
      radius: 150,
      fill: "#fb923c",
      opacity: 0.8,
    });
    fc.add(c);
    const item = registerLayer(c, "Círculo", "shape");
    fc.setActiveObject(c);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [canvasSize.w, canvasSize.h, registerLayer]);

  // ─── Formas extras (linea, triangulo, estrella, hexagono, flecha, marco) ─
  // Helper centro: las nuevas formas se anaden centradas en el canvas.
  const centerLeft = canvasSize.w / 2;
  const centerTop = canvasSize.h / 2;

  /** Linea horizontal central. Usuario puede rotarla / arrastrar extremos. */
  const handleAddLine = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const line = new Line([centerLeft - 200, centerTop, centerLeft + 200, centerTop], {
      stroke: "#a855f7",
      strokeWidth: 8,
      strokeLineCap: "round",
    });
    fc.add(line);
    const item = registerLayer(line, "Línea", "shape");
    fc.setActiveObject(line);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [centerLeft, centerTop, registerLayer]);

  /** Triangulo equilatero. */
  const handleAddTriangle = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const t = new Triangle({
      left: centerLeft - 150,
      top: centerTop - 130,
      width: 300,
      height: 260,
      fill: "#fb923c",
      opacity: 0.85,
    });
    fc.add(t);
    const item = registerLayer(t, "Triángulo", "shape");
    fc.setActiveObject(t);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [centerLeft, centerTop, registerLayer]);

  /** Estrella de 5 puntas como Polygon. Puntos calculados con trig. */
  const handleAddStar = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const outerR = 150;
    const innerR = 65;
    const points: { x: number; y: number }[] = [];
    // 10 puntos alternando outer/inner. Empieza arriba (-PI/2).
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    const star = new Polygon(points, {
      left: centerLeft - outerR,
      top: centerTop - outerR,
      fill: "#facc15",
      opacity: 0.9,
    });
    fc.add(star);
    const item = registerLayer(star, "Estrella", "shape");
    fc.setActiveObject(star);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [centerLeft, centerTop, registerLayer]);

  /** Hexagono regular como Polygon. */
  const handleAddHexagon = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const r = 150;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    const hex = new Polygon(points, {
      left: centerLeft - r,
      top: centerTop - r,
      fill: "#22d3ee",
      opacity: 0.85,
    });
    fc.add(hex);
    const item = registerLayer(hex, "Hexágono", "shape");
    fc.setActiveObject(hex);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [centerLeft, centerTop, registerLayer]);

  /** Flecha apuntando a la derecha (Path SVG). */
  const handleAddArrow = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    // Path SVG de flecha: trazo simple con punta. Tamano base ~400x80.
    const arrowPath = "M 0 30 L 320 30 L 320 0 L 400 50 L 320 100 L 320 70 L 0 70 Z";
    const arrow = new Path(arrowPath, {
      left: centerLeft - 200,
      top: centerTop - 50,
      fill: "#a855f7",
      opacity: 0.9,
    });
    fc.add(arrow);
    const item = registerLayer(arrow, "Flecha", "shape");
    fc.setActiveObject(arrow);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [centerLeft, centerTop, registerLayer]);

  /** Marco/borde: rectangulo sin fill, solo stroke. Util para destacar zonas. */
  const handleAddFrame = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    const f = new Rect({
      left: centerLeft - 200,
      top: centerTop - 200,
      width: 400,
      height: 400,
      fill: "transparent",
      stroke: "#ffffff",
      strokeWidth: 6,
    });
    fc.add(f);
    const item = registerLayer(f, "Marco", "shape");
    fc.setActiveObject(f);
    fc.requestRenderAll();
    setSelectedLayer(item);
    setActiveSheet(null);
  }, [centerLeft, centerTop, registerLayer]);

  // ─── 5g. Mask: recortar foto a forma (circulo o rect-rounded) ────────────
  /** Aplica un clipPath a la imagen seleccionada para recortarla a una forma. */
  const handleCropToShape = useCallback((shape: "circle" | "rounded" | "square" | "none") => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!obj || obj.type !== "image") return;
    // Obtener dimensiones reales del objeto (no del cropPath)
    const w = (obj.width ?? 400) * (obj.scaleX ?? 1);
    const h = (obj.height ?? 400) * (obj.scaleY ?? 1);
    // En Fabric el clipPath se aplica en coords locales del objeto (sin escala).
    // Usamos width/height "originales" del image para que el clip se escale junto.
    const localW = obj.width ?? 400;
    const localH = obj.height ?? 400;
    const minDim = Math.min(localW, localH);
    if (shape === "none") {
      (obj as FabricObject & { clipPath?: unknown }).clipPath = undefined;
    } else if (shape === "circle") {
      const clip = new Circle({
        radius: minDim / 2,
        originX: "center",
        originY: "center",
        left: 0,
        top: 0,
      });
      (obj as FabricObject & { clipPath?: unknown }).clipPath = clip;
    } else if (shape === "rounded") {
      const clip = new Rect({
        width: localW,
        height: localH,
        rx: minDim * 0.15,
        ry: minDim * 0.15,
        originX: "center",
        originY: "center",
        left: 0,
        top: 0,
      });
      (obj as FabricObject & { clipPath?: unknown }).clipPath = clip;
    } else if (shape === "square") {
      const side = minDim;
      const clip = new Rect({
        width: side,
        height: side,
        originX: "center",
        originY: "center",
        left: 0,
        top: 0,
      });
      (obj as FabricObject & { clipPath?: unknown }).clipPath = clip;
    }
    obj.dirty = true;
    fc?.requestRenderAll();
    // touchear el ancho/alto visible no cambia
    void w; void h;
  }, []);

  // ─── 5h. Foto DENTRO de forma activa ─────────────────────────────────────
  /** Reemplaza el shape activo por una imagen recortada con la silueta del shape. */
  const SHAPE_TYPES_MOBILE = ["rect", "circle", "triangle", "polygon", "path", "line"];
  const handleAddImageInsideShape = useCallback(async () => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!obj || !fc) return;
    if (!SHAPE_TYPES_MOBILE.includes(obj.type ?? "")) return;

    // Pedir foto al usuario (file picker nativo: galeria/camara en mobile)
    const file = await new Promise<File | null>((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => resolve((e.target as HTMLInputElement).files?.[0] ?? null);
      input.click();
    });
    if (!file) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Error leyendo el archivo"));
      reader.readAsDataURL(file);
    });

    const img = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
    const bounds = obj.getBoundingRect();
    const imgW = img.width ?? 1;
    const imgH = img.height ?? 1;
    const fillScale = Math.max(bounds.width / imgW, bounds.height / imgH);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clipPath = await (obj as any).clone() as FabricObject;
    clipPath.set({ left: 0, top: 0, originX: "center", originY: "center", angle: 0 });

    const cx = bounds.left + bounds.width / 2;
    const cy = bounds.top + bounds.height / 2;
    img.set({
      left: cx,
      top: cy,
      originX: "center",
      originY: "center",
      angle: obj.angle ?? 0,
      scaleX: fillScale,
      scaleY: fillScale,
    });
    (img as FabricObject & { clipPath?: unknown }).clipPath = clipPath;

    // Encontrar el item del shape en layers para reemplazarlo
    const oldLayer = layers.find(l => l.obj === obj) ?? null;
    fc.remove(obj);
    fc.add(img);
    const newItem = registerLayer(img, "Foto en forma", "image");
    fc.setActiveObject(img);
    fc.requestRenderAll();
    if (oldLayer) {
      setLayers(prev => prev.filter(l => l.id !== oldLayer.id));
    }
    setSelectedLayer(newItem);
    setActiveSheet(null);
  }, [layers, registerLayer]);

  // ─── 5i. Recortar persona (Fal.ai SAM-2) — multi-tap ─────────────────────
  const [segmentState, setSegmentState] = useState<{
    open: boolean;
    imgSrc: string;
    naturalW: number;
    naturalH: number;
    taps: Array<{ x: number; y: number }>;
    loading: boolean;
    error: string | null;
  }>({ open: false, imgSrc: "", naturalW: 0, naturalH: 0, taps: [], loading: false, error: null });

  const closeSegmentModalMobile = useCallback(() => {
    setSegmentState({ open: false, imgSrc: "", naturalW: 0, naturalH: 0, taps: [], loading: false, error: null });
  }, []);

  const addTapMobile = useCallback((xRatio: number, yRatio: number) => {
    setSegmentState(s => {
      if (s.loading) return s;
      const x = Math.round(xRatio * s.naturalW);
      const y = Math.round(yRatio * s.naturalH);
      return { ...s, taps: [...s.taps, { x, y }], error: null };
    });
  }, []);

  const undoLastTapMobile = useCallback(() => {
    setSegmentState(s => ({ ...s, taps: s.taps.slice(0, -1) }));
  }, []);

  const clearTapsMobile = useCallback(() => {
    setSegmentState(s => ({ ...s, taps: [] }));
  }, []);

  /** Abre el modal de segmentacion para cualquier foto del canvas (subidas
   *  por el usuario o las que vienen en la plantilla). */
  const handleOpenSegmentModal = useCallback(() => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj || obj.type !== "image") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src = (obj as any).getSrc?.() as string | undefined;
    if (!src) return;
    const probe = new Image();
    probe.crossOrigin = "anonymous";
    probe.onload = () => {
      setSegmentState({
        open: true,
        imgSrc: src,
        naturalW: probe.naturalWidth,
        naturalH: probe.naturalHeight,
        taps: [],
        loading: false,
        error: null,
      });
      setActiveSheet(null);
    };
    probe.onerror = () => setSegmentState(s => ({ ...s, error: "No se pudo cargar la imagen" }));
    probe.src = src;
  }, []);

  /** Compone imagen + mask en cliente para PNG transparente.
   *  NOTA: la mask SAM-2 es RGB sin alpha — convertimos brillo→alpha antes
   *  del destination-in. Sin este paso la imagen sale opaca completa. */
  const composeMaskedImageMobile = useCallback(async (imageUrl: string, maskUrl: string): Promise<string> => {
    const [img, mask] = await Promise.all([
      new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => res(im); im.onerror = () => rej(new Error("error img"));
        im.src = imageUrl;
      }),
      new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => res(im); im.onerror = () => rej(new Error("error mask"));
        im.src = maskUrl;
      }),
    ]);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    // Mask RGB → alpha (umbral binario para bordes limpios)
    const maskCv = document.createElement("canvas");
    maskCv.width = w; maskCv.height = h;
    const maskCtx = maskCv.getContext("2d");
    if (!maskCtx) throw new Error("canvas mask 2d no disponible");
    maskCtx.drawImage(mask, 0, 0, w, h);
    const md = maskCtx.getImageData(0, 0, w, h);
    for (let i = 0; i < md.data.length; i += 4) {
      md.data[i + 3] = md.data[i] > 128 ? 255 : 0;
    }
    maskCtx.putImageData(md, 0, 0);
    // Compose
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("canvas 2d no disponible");
    ctx.drawImage(img, 0, 0, w, h);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskCv, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    return cv.toDataURL("image/png");
  }, []);

  const processTapsMobile = useCallback(async () => {
    if (segmentState.taps.length === 0) {
      setSegmentState(s => ({ ...s, error: "Marca al menos un punto sobre la persona" }));
      return;
    }
    setSegmentState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/segment-person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: segmentState.imgSrc,
          points: segmentState.taps,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error en el servidor" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const { segmentedUrl, cropBounds } = await res.json();
      if (!segmentedUrl || !cropBounds) throw new Error("No se recibio la persona recortada");
      const fc = fabricRef.current;
      const sourceObj = fc?.getActiveObject();
      if (!sourceObj || sourceObj.type !== "image" || !fc) throw new Error("Imagen activa no disponible");
      // Posicionar en bbox EXACTO donde estaba la persona en la foto original
      const newImg = await FabricImage.fromURL(segmentedUrl, { crossOrigin: "anonymous" });
      const naturalW = sourceObj.width ?? 1;
      const naturalH = sourceObj.height ?? 1;
      const scaleX = sourceObj.scaleX ?? 1;
      const scaleY = sourceObj.scaleY ?? 1;
      const srcLeft = sourceObj.left ?? 0;
      const srcTop = sourceObj.top ?? 0;
      const sox = sourceObj.originX === "center" ? -naturalW * scaleX / 2 : sourceObj.originX === "right" ? -naturalW * scaleX : 0;
      const soy = sourceObj.originY === "center" ? -naturalH * scaleY / 2 : sourceObj.originY === "bottom" ? -naturalH * scaleY : 0;
      newImg.set({
        left: srcLeft + sox + cropBounds.x * scaleX,
        top: srcTop + soy + cropBounds.y * scaleY,
        originX: "left",
        originY: "top",
        angle: sourceObj.angle ?? 0,
        scaleX,
        scaleY,
      });
      (newImg as FabricObject & { isUserUpload?: boolean }).isUserUpload = true;
      fc.add(newImg);
      const newItem = registerLayer(newImg, "Persona aislada", "image");
      fc.setActiveObject(newImg);
      fc.requestRenderAll();
      setSelectedLayer(newItem);
      closeSegmentModalMobile();
    } catch (e) {
      console.error("[segment-mobile] error:", e);
      setSegmentState(s => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Error inesperado" }));
    }
  }, [segmentState.imgSrc, segmentState.taps, registerLayer, closeSegmentModalMobile]);

  // ─── 5f. + Foto (galeria iPhone) ────────────────────────────────────────
  // Usa <input type="file" accept="image/*"> que abre nativo el picker.
  // En iPhone Safari ofrece "Tomar foto" + "Elegir de galeria".
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleAddPhotoClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fc = fabricRef.current;
    if (!fc) return;

    // Convertir file a dataURL para Fabric
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (!dataUrl) return;
      try {
        const img = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
        // Auto-escalar para que quepa en el canvas (max 60% del ancho)
        const maxW = canvasSize.w * 0.6;
        const maxH = canvasSize.h * 0.6;
        const imgW = img.width ?? 1;
        const imgH = img.height ?? 1;
        const scaleX = maxW / imgW;
        const scaleY = maxH / imgH;
        const s = Math.min(scaleX, scaleY, 1);
        img.set({
          left: canvasSize.w / 2 - (imgW * s) / 2,
          top: canvasSize.h / 2 - (imgH * s) / 2,
          scaleX: s,
          scaleY: s,
          // Halo claro auto. Mismo patron que las plantillas para artistas.
          // El usuario puede quitarlo o cambiar el color desde el panel de
          // propiedades de imagen (en desktop). En mobile aun no hay panel.
          shadow: new Shadow({
            color: "rgba(255,255,255,0.85)",
            blur: 40,
            offsetX: 0,
            offsetY: 0,
          }),
        });
        // Marca foto subida por el usuario — habilita el boton "Recortar persona"
        // (segmentacion con Fal.ai SAM-2) cuando este seleccionada.
        (img as FabricObject & { isUserUpload?: boolean }).isUserUpload = true;
        fc.add(img);
        const item = registerLayer(img, "Foto subida", "image");
        fc.setActiveObject(img);
        fc.requestRenderAll();
        setSelectedLayer(item);
        setActiveSheet(null);
      } catch (err) {
        console.error("Error subiendo foto:", err);
        alert("No se pudo cargar la foto.");
      }
    };
    reader.readAsDataURL(file);
    // Reset input para poder subir misma foto otra vez si quiere
    e.target.value = "";
  }, [canvasSize.w, canvasSize.h, registerLayer]);

  // ─── 5g. Duplicar capa seleccionada ─────────────────────────────────────
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
    } catch (err) {
      console.error("Error duplicando:", err);
    }
  }, [selectedLayer, registerLayer]);

  // ─── 5h. Reordenar capas (mover frente/atras) ───────────────────────────
  const handleBringForward = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !selectedLayer) return;
    fc.bringObjectForward(selectedLayer.obj);
    fc.requestRenderAll();
    // Resync layers order
    const ordered: LayerItem[] = fc.getObjects().map((obj) => {
      const found = layers.find(l => l.obj === obj);
      return found ?? { id: `unknown-${Date.now()}`, name: "Capa", type: "shape" as const, obj };
    });
    setLayers(ordered);
  }, [selectedLayer, layers]);

  const handleSendBackward = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !selectedLayer) return;
    fc.sendObjectBackwards(selectedLayer.obj);
    fc.requestRenderAll();
    const ordered: LayerItem[] = fc.getObjects().map((obj) => {
      const found = layers.find(l => l.obj === obj);
      return found ?? { id: `unknown-${Date.now()}`, name: "Capa", type: "shape" as const, obj };
    });
    setLayers(ordered);
  }, [selectedLayer, layers]);

  // ─── 6. Render ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#070711] flex flex-col text-white overflow-hidden">

      {/* ═══ HINT INICIAL (primera vez en mobile) ═════════════════════════
          Overlay corto con 3 pistas visuales para usuarios que abren el
          editor por primera vez. Se cierra con tap y NO vuelve a aparecer
          (localStorage). Emojis grandes en vez de iconos por accesibilidad
          visual — un emoji se entiende sin lectura. */}
      {showHint && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center px-6 animate-in fade-in duration-300"
          onClick={dismissHint}
        >
          <div className="max-w-sm w-full text-center">
            <h2 className="text-2xl font-black mb-1">¡Bienvenido al editor!</h2>
            <p className="text-sm text-gray-400 mb-6">3 cosas para empezar</p>
            <div className="space-y-4 text-left mb-8">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl shrink-0 leading-none">👆</div>
                <div>
                  <p className="font-bold text-sm">Toca un elemento</p>
                  <p className="text-xs text-gray-400 mt-0.5">Texto, foto o forma. Verás las opciones para editarlo abajo.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl shrink-0 leading-none">✏️</div>
                <div>
                  <p className="font-bold text-sm">Doble tap para escribir</p>
                  <p className="text-xs text-gray-400 mt-0.5">En cualquier texto. Se abre el teclado y puedes cambiar las palabras.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl shrink-0 leading-none">🤏</div>
                <div>
                  <p className="font-bold text-sm">Pellizca para acercar</p>
                  <p className="text-xs text-gray-400 mt-0.5">Con dos dedos, como en una foto. Suelta y arrastra para mover.</p>
                </div>
              </div>
            </div>
            <button
              onClick={dismissHint}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-sm active:scale-[0.98] transition-transform"
            >
              Empezar a diseñar
            </button>
          </div>
        </div>
      )}

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
          <p className="text-sm font-semibold truncate">{template?.title ?? t("editor.fallback.title")}</p>
          <p className="text-[10px] text-gray-500">{canvasSize.w} × {canvasSize.h}</p>
        </div>
        {selectedLayer && (
          <button
            onClick={handleDeleteSelected}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400 active:bg-red-500/10"
            aria-label={t("editor.deleteLayer")}
          >
            <Trash2 size={18} strokeWidth={2}/>
          </button>
        )}
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 active:from-purple-700 active:to-fuchsia-700 text-white text-sm font-bold flex items-center gap-1.5"
        >
          <Download size={15} strokeWidth={2.5}/>
          {t("editor.action.download")}
        </button>
      </header>

      {/* ═══ CANVAS AREA (sesion 3: ocupa toda el area disponible) ════════ */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-2 relative">
        <div
          ref={wrapperRef}
          className="relative shadow-2xl shadow-black/70 bg-[#1a1a2e] rounded-sm overflow-hidden"
          style={{
            width: canvasArea.w,
            height: canvasArea.h,
          }}
        >
          {/* Canvas DOM ocupa todo el wrapper. El flyer interno se posiciona
              y escala con setZoom + setViewportTransform (gestionado por gestures). */}
          <canvas ref={canvasRef}/>

          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] rounded">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          )}
        </div>

        {/* Boton flotante RESET ZOOM (visible solo cuando hay zoom o pan diferente al inicial) */}
        {loaded && (
          <button
            onClick={resetView}
            aria-label="Ajustar a pantalla"
            className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#1a1a2e]/90 backdrop-blur border border-white/15 text-gray-300 active:bg-purple-500/30 active:text-purple-200 flex items-center justify-center shadow-lg z-10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V3h4M21 7V3h-4M3 17v4h4M21 17v4h-4"/>
            </svg>
          </button>
        )}
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

      {/* ═══ BOTTOM SHEETS (sesion 6 fix: max-h 50vh + overlay transparente) ═══ */}
      {activeSheet && (
        <>
          {/* Overlay invisible para tap-fuera-cerrar (sin oscurecer canvas) */}
          <div
            onClick={() => setActiveSheet(null)}
            className="fixed inset-0 z-40"
            style={{ background: "transparent" }}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f1a]/95 backdrop-blur-md rounded-t-3xl border-t border-white/10 shadow-2xl pb-8 max-h-[30vh] flex flex-col safe-area-bottom">
            {/* Handle */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2 mb-2 shrink-0"/>

            {/* Header sheet */}
            <div className="px-4 pb-2 border-b border-white/[0.06] flex items-center justify-between shrink-0">
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
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {activeSheet === "layers" && (
                <div className="space-y-1">
                  {/* Boton +Anadir capa arriba (atajo a "Mas") */}
                  <button
                    onClick={() => setActiveSheet("more")}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-3 rounded-xl border border-dashed border-white/15 text-purple-300 active:bg-white/[0.05] text-sm font-semibold"
                  >
                    <Plus size={16} strokeWidth={2.5}/>
                    Añadir capa
                  </button>

                  {/* Lista de capas - orden visual: ARRIBA en lista = FRENTE en canvas */}
                  {[...layers].reverse().filter(l => l.obj.selectable !== false).map((layer) => {
                    const isSelected = selectedLayer?.id === layer.id;
                    const realIdx = layers.findIndex(l => l.id === layer.id);
                    const canMoveUp = realIdx < layers.length - 1;
                    const canMoveDown = realIdx > 0;
                    return (
                      <div
                        key={layer.id}
                        className={`flex items-center gap-2 px-2 py-2 rounded-xl ${
                          isSelected ? "bg-purple-600/20 border border-purple-500/40" : "bg-white/[0.03]"
                        }`}
                      >
                        <button
                          onClick={() => {
                            const fc = fabricRef.current;
                            if (!fc) return;
                            fc.setActiveObject(layer.obj);
                            fc.renderAll();
                            setSelectedLayer(layer);
                            setActiveSheet(null);
                          }}
                          className="flex items-center gap-3 flex-1 text-left active:bg-white/5 rounded-lg px-1 py-1"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center text-gray-400">
                            {layer.type === "text" ? <Type size={14}/> : layer.type === "image" ? <ImageIcon size={14}/> : <Palette size={14}/>}
                          </div>
                          <span className="text-sm text-white flex-1 truncate">{layer.name}</span>
                        </button>
                        {/* Arrows para reordenar - solo visible si esta seleccionada */}
                        {isSelected && (
                          <>
                            <button
                              onClick={() => {
                                const fc = fabricRef.current;
                                if (!fc || !canMoveUp) return;
                                fc.bringObjectForward(layer.obj);
                                fc.requestRenderAll();
                                const ordered = fc.getObjects().map((obj) => layers.find(l => l.obj === obj)!).filter(Boolean);
                                setLayers(ordered);
                              }}
                              disabled={!canMoveUp}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${canMoveUp ? "text-gray-300 active:bg-white/10" : "text-gray-700 opacity-30"}`}
                              aria-label="Mover al frente"
                            >
                              <ChevronUp size={16} strokeWidth={2.5}/>
                            </button>
                            <button
                              onClick={() => {
                                const fc = fabricRef.current;
                                if (!fc || !canMoveDown) return;
                                fc.sendObjectBackwards(layer.obj);
                                fc.requestRenderAll();
                                const ordered = fc.getObjects().map((obj) => layers.find(l => l.obj === obj)!).filter(Boolean);
                                setLayers(ordered);
                              }}
                              disabled={!canMoveDown}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${canMoveDown ? "text-gray-300 active:bg-white/10" : "text-gray-700 opacity-30"}`}
                              aria-label="Enviar atrás"
                            >
                              <ChevronDown size={16} strokeWidth={2.5}/>
                            </button>
                          </>
                        )}
                        {!isSelected && (
                          <div className="text-gray-700 px-1">
                            <GripVertical size={14} strokeWidth={2}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {layers.filter(l => l.obj.selectable !== false).length === 0 && (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No hay capas editables. Toca <span className="text-purple-300 font-semibold">+ Añadir capa</span> para empezar.
                    </p>
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

              {/* ─── SHEET FOTO (sesion 5) ─────────────────────────────── */}
              {activeSheet === "photo" && (
                <div className="space-y-3">
                  <button
                    onClick={handleAddPhotoClick}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 active:from-purple-700 active:to-fuchsia-700 text-white font-bold text-base"
                  >
                    <ImageIcon size={20} strokeWidth={2.5}/>
                    Subir foto desde galería
                  </button>
                  <p className="text-xs text-gray-500 text-center px-4">
                    iPhone te dará a elegir entre &quot;Tomar foto&quot; o &quot;Elegir de la galería&quot;.
                  </p>

                  {/* TODO sesion 8: galeria de fotos de eventos populares (Unsplash) */}
                  <div className="pt-4 border-t border-white/[0.06]">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">
                      Próximamente
                    </p>
                    <p className="text-xs text-gray-600">
                      Galería de fotos para eventos (música, fiesta, conciertos) integrada.
                    </p>
                  </div>
                </div>
              )}

              {/* ─── SHEET MAS (sesion 5) ──────────────────────────────── */}
              {activeSheet === "more" && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Añadir capa</p>
                  <button
                    onClick={handleAddText}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <Type size={16} strokeWidth={2}/>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Nuevo texto</p>
                      <p className="text-[11px] text-gray-500">Añade un texto editable</p>
                    </div>
                    <Plus size={16} strokeWidth={2.5} className="text-gray-500"/>
                  </button>

                  {/* Grid 3-cols con las 8 formas. Compacto para mobile. */}
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-2 mb-1.5 px-1">
                    Formas
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { onClick: handleAddRect,     icon: <Square size={18} strokeWidth={2}/>,        label: "Rect" },
                      { onClick: handleAddCircle,   icon: <CircleIcon size={18} strokeWidth={2}/>,    label: "Círculo" },
                      { onClick: handleAddTriangle, icon: <TriangleIcon size={18} strokeWidth={2}/>,  label: "Triángulo" },
                      { onClick: handleAddStar,     icon: <Star size={18} strokeWidth={2}/>,          label: "Estrella" },
                      { onClick: handleAddHexagon,  icon: <Hexagon size={18} strokeWidth={2}/>,       label: "Hexágono" },
                      { onClick: handleAddArrow,    icon: <ArrowRightIcon size={18} strokeWidth={2}/>,label: "Flecha" },
                      { onClick: handleAddLine,     icon: <Minus size={18} strokeWidth={2.5}/>,       label: "Línea" },
                      { onClick: handleAddFrame,    icon: <SquareDashed size={18} strokeWidth={2}/>,  label: "Marco" },
                    ].map(b => (
                      <button
                        key={b.label}
                        onClick={b.onClick}
                        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white"
                      >
                        <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                          {b.icon}
                        </div>
                        <span className="text-[11px] font-medium">{b.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Foto DENTRO de forma: solo si hay shape seleccionado.
                      Reemplaza la forma por una imagen que usa la silueta como mascara. */}
                  {(() => {
                    const activeObj = fabricRef.current?.getActiveObject();
                    const isShapeActive = !!activeObj && SHAPE_TYPES_MOBILE.includes(activeObj.type ?? "");
                    if (!isShapeActive) return null;
                    return (
                      <>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-5 mb-1.5 px-1">
                          <ImageIcon size={11} className="inline mr-1 -mt-0.5"/>
                          Foto dentro de la forma
                        </p>
                        <button
                          onClick={() => { void handleAddImageInsideShape(); }}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/15 active:bg-purple-600/30 border border-purple-500/35 text-purple-200 text-sm font-semibold"
                        >
                          <Plus size={15} strokeWidth={2.5}/>
                          Añadir foto dentro
                        </button>
                        <p className="text-[10px] text-gray-600 mt-1.5 leading-snug px-1">
                          La foto reemplaza la forma manteniendo su silueta como mascara.
                        </p>
                      </>
                    );
                  })()}

                  {/* Recortar persona (Fal.ai SAM-2) — cualquier foto del canvas */}
                  {(() => {
                    const activeObj = fabricRef.current?.getActiveObject();
                    if (activeObj?.type !== "image") return null;
                    return (
                      <>
                        <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-5 mb-1.5 px-1">
                          <Scissors size={11} className="inline mr-1 -mt-0.5"/>
                          Recortar persona
                        </p>
                        <button
                          onClick={handleOpenSegmentModal}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-emerald-600/20 to-teal-600/15 active:bg-emerald-600/30 border border-emerald-500/35 text-emerald-200 text-sm font-semibold"
                        >
                          <Scissors size={15} strokeWidth={2.2}/>
                          Recortar persona individual
                        </button>
                        <p className="text-[10px] text-gray-600 mt-1.5 leading-snug px-1">
                          Tocas a la persona del grupo y la IA la aisla con fondo transparente.
                        </p>
                      </>
                    );
                  })()}

                  {/* Mask: recortar foto a forma. Solo aparece si hay IMAGEN seleccionada. */}
                  {selectedLayer?.type === "image" && (
                    <>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-5 mb-1.5 px-1">
                        <Scissors size={11} className="inline mr-1 -mt-0.5"/>
                        Recortar foto a forma
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { shape: "circle"  as const, icon: <CircleIcon size={18} strokeWidth={2}/>,    label: "Círculo" },
                          { shape: "rounded" as const, icon: <SquareDashed size={18} strokeWidth={2}/>,  label: "Rounded" },
                          { shape: "square"  as const, icon: <Square size={18} strokeWidth={2}/>,        label: "Cuadrado" },
                          { shape: "none"    as const, icon: <XIcon size={18} strokeWidth={2}/>,         label: "Quitar" },
                        ].map(b => (
                          <button
                            key={b.shape}
                            onClick={() => handleCropToShape(b.shape)}
                            className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                              {b.icon}
                            </div>
                            <span className="text-[10px] font-medium">{b.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Acciones contextuales sobre capa seleccionada */}
                  {selectedLayer && (
                    <>
                      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-5 mb-2">
                        Capa seleccionada: <span className="text-gray-300 normal-case font-medium">{selectedLayer.name}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleDuplicateSelected}
                          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm"
                        >
                          <Copy size={14} strokeWidth={2}/>
                          Duplicar
                        </button>
                        <button
                          onClick={() => { handleDeleteSelected(); setActiveSheet(null); }}
                          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-red-500/10 active:bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
                        >
                          <Trash2 size={14} strokeWidth={2}/>
                          Eliminar
                        </button>
                        <button
                          onClick={handleBringForward}
                          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm"
                        >
                          <MoveUp size={14} strokeWidth={2}/>
                          Al frente
                        </button>
                        <button
                          onClick={handleSendBackward}
                          className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/[0.04] active:bg-white/[0.08] border border-white/10 text-white text-sm"
                        >
                          <MoveDown size={14} strokeWidth={2}/>
                          Atrás
                        </button>
                      </div>
                    </>
                  )}
                  {!selectedLayer && (
                    <p className="text-xs text-gray-600 text-center mt-4">
                      Selecciona una capa para duplicarla, eliminarla o cambiar su orden.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ FILE INPUT INVISIBLE ════════════════════════════════════════
          Triggered por handleAddPhotoClick.
          IMPORTANTE: NO usar `capture="environment"` — eso fuerza la apertura
          directa de la camara y oculta la galeria. Sin `capture`, iOS/Android
          muestran el selector nativo con Foto Library + Camara + Archivos,
          que es el comportamiento esperado para "subir foto".
          ═══════════════════════════════════════════════════════════════════ */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        style={{ display: "none" }}
      />

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

      {/* AuthModal: aparece si intentas descargar sin sesion. Tras login OK
          reintenta el export automaticamente. */}
      {authModalConfig && (
        <AuthModal
          title={authModalConfig.title}
          subtitle={authModalConfig.subtitle}
          onAuthSuccess={authModalConfig.onSuccess}
          onClose={() => setAuthModalConfig(null)}
        />
      )}

      {/* SegmentPersonModal mobile: multi-tap. Igual que desktop pero compacto. */}
      {segmentState.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3"
          onClick={e => { if (e.target === e.currentTarget && !segmentState.loading) closeSegmentModalMobile(); }}>
          <div className="w-full max-w-xl rounded-2xl overflow-hidden"
            style={{ background: "rgba(15,15,25,0.98)", border: "1px solid rgba(16,185,129,0.30)" }}>
            <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Scissors size={16} className="text-emerald-400"/>
                  Toca a la persona
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Un solo tap sobre la persona. La IA la detecta y recorta.
                </p>
              </div>
              {!segmentState.loading && (
                <button onClick={closeSegmentModalMobile} className="text-gray-500 hover:text-white text-2xl p-1">×</button>
              )}
            </div>
            <div className="p-4 relative">
              <div className="relative max-h-[50vh] mx-auto w-full"
                style={{ aspectRatio: segmentState.naturalH > 0 ? `${segmentState.naturalW}/${segmentState.naturalH}` : "1" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={segmentState.imgSrc}
                  alt="Toca a la persona"
                  className={`w-full h-full object-contain rounded-xl select-none ${segmentState.loading ? "opacity-50" : "cursor-crosshair"}`}
                  onClick={(e) => {
                    if (segmentState.loading) return;
                    const rect = (e.target as HTMLImageElement).getBoundingClientRect();
                    const xRatio = (e.clientX - rect.left) / rect.width;
                    const yRatio = (e.clientY - rect.top) / rect.height;
                    // Reset: cada tap reemplaza el anterior (no acumula)
                    setSegmentState(s => {
                      const x = Math.round(xRatio * s.naturalW);
                      const y = Math.round(yRatio * s.naturalH);
                      return { ...s, taps: [{ x, y }], error: null };
                    });
                  }}
                  draggable={false}
                />
                {segmentState.taps.map((tap, i) => (
                  <div
                    key={i}
                    className="absolute pointer-events-none flex items-center justify-center w-6 h-6 -ml-3 -mt-3 rounded-full bg-emerald-500 border-2 border-white shadow-lg text-[10px] font-black text-white"
                    style={{
                      left: `${(tap.x / segmentState.naturalW) * 100}%`,
                      top: `${(tap.y / segmentState.naturalH) * 100}%`,
                    }}>
                    {i + 1}
                  </div>
                ))}
                {segmentState.loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 rounded-xl">
                    <Loader2 className="w-9 h-9 text-emerald-400 animate-spin"/>
                    <p className="text-sm font-semibold text-emerald-200">Procesando...</p>
                    <p className="text-[11px] text-gray-500">2-4 segundos</p>
                  </div>
                )}
              </div>
              {segmentState.error && (
                <p className="text-red-400 text-xs mt-3 text-center">{segmentState.error}</p>
              )}
            </div>
            <div className="p-3 border-t border-white/[0.05] flex items-center gap-2">
              <span className="text-[11px] text-gray-500 flex-1">
                {segmentState.taps.length === 0 ? "Toca a la persona" : "Punto marcado"}
              </span>
              <button
                onClick={() => { void processTapsMobile(); }}
                disabled={segmentState.taps.length === 0 || segmentState.loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white disabled:opacity-30"
                style={{ background: segmentState.taps.length > 0 ? "linear-gradient(135deg,#059669,#10b981)" : "rgba(255,255,255,0.05)" }}>
                <Scissors size={12} strokeWidth={2.5}/>
                Recortar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
