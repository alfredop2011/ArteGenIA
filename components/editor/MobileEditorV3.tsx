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
  StaticCanvas as FabricStaticCanvas,
  Shadow,
  type FabricObject,
  Textbox,
  FabricImage,
  Circle as FabricCircle,
  Rect as FabricRect,
  filters as FabricFilters,
} from "fabric";
import {
  ArrowLeft, Download, Undo2, Redo2,
  Check, Sparkles, MoreHorizontal,
  Copy, Trash2, Palette as PaletteIcon,
  X as XIcon, LayoutGrid, Type as TypeIcon, Image as ImageIcon,
  Wand2, ChevronUp, ChevronDown,
  Replace, Crop, Eraser, Sliders, Square,
  Pencil,
} from "lucide-react";
import { templates, getVariant, type Template } from "@/data/templates";
import { FORMATS, PUBLIC_FORMATS, type FormatId } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import { applyWatermark, shouldWatermark } from "@/lib/applyWatermark";
import { getBlocksForTemplate, BLOCK_ICONS, BLOCK_TINTS, type EditableBlock } from "@/data/templateBlocks";
import { getPalettesForCategory, type Palette } from "@/data/templatePalettes";
import { REMIX_STYLES, type RemixStyle } from "@/data/templateRemixes";
import { useProjects } from "@/hooks/useProjects";
import { supabase } from "@/lib/supabase";
import { Save, FolderOpen, Share2, Link2, Mail, MessageCircle, Send, Plus, Layers, Lock, Unlock, Eye, EyeOff, Circle as CircleIcon, Square as SquareIcon, Triangle, Heart, Star, AlignHorizontalJustifyCenter } from "lucide-react";

type Props = {
  templateId?: number;
  projectId?: string;
  formatId?: FormatId;
};

/** Sheet temporal que puede estar abierto. null = canvas limpio (caso comun).
 *  "texto" desaparecio: se reemplazo por sub-tools bar inline cuando hay
 *  objeto seleccionado (patron Canva). */
type SheetId = null | "foto" | "estilo" | "ia" | "plantillas" | "export" | "more" | "add" | "layers" | "format";

export default function MobileEditorV3({ templateId, projectId, formatId }: Props) {
  const router = useRouter();
  // ─── Persistencia (Fase E) ──────────────────────────────────────────────
  // Si recibimos projectId, abrimos un proyecto guardado. Cargamos el JSON
  // de Fabric desde Supabase y lo hidratamos en lugar de aplicar el template.
  // Si recibimos templateId, flujo normal: aplicar template + (al guardar)
  // crear nuevo proyecto y redirigir a /editor/<uuid>.
  const { saveProject } = useProjects();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId ?? null);
  const [docTitle, setDocTitle] = useState<string>("");
  // JSON pendiente para hidratar canvas al crearse (load mode)
  const pendingFabricJsonRef = useRef<object | null>(null);
  const [pendingProjectMeta, setPendingProjectMeta] = useState<{
    title: string;
    templateId: number | null;
    width: number;
    height: number;
    format: string;
  } | null>(null);
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

  // Sub-tool activo (cuando hay seleccion). Lista varia segun tipo del
  // objeto seleccionado. SubTool es un union de todas las posibles.
  type SubTool = null
    // Texto
    | "editar" | "fuente" | "estilos" | "tamano" | "color"
    // Imagen
    | "reemplazar" | "recortar" | "quitar-fondo" | "filtros" | "opacidad-img"
    // Forma
    | "fill" | "borde" | "opacidad-shape" | "esquinas";
  const [activeSubTool, setActiveSubTool] = useState<SubTool>(null);

  // Tipo del objeto seleccionado — define que sub-tools mostrar
  type ObjType = null | "text" | "image" | "shape";
  const [selectedType, setSelectedType] = useState<ObjType>(null);

  /** Detectar tipo del objeto Fabric. Shape es cualquier cosa que no sea
   *  texto ni imagen (rect, circle, triangle, polygon, path, line, etc.). */
  const detectType = useCallback((obj: FabricObject): ObjType => {
    const t = obj.type;
    if (!t) return null;
    if (t === "textbox" || t === "text" || t === "i-text") return "text";
    if (t === "image") return "image";
    return "shape";
  }, []);

  // History + save
  // History stack: array de fabric JSON snapshots. Pivot index apunta al
  // estado actual. Undo decrementa, Redo incrementa. Cambios al canvas
  // trunca la rama futura (igual que Canva/Figma).
  const historyRef = useRef<{ stack: object[]; index: number }>({ stack: [], index: -1 });
  const restoringRef = useRef(false); // evita registrar cambios de undo/redo
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved">("saved");
  const [exporting, setExporting] = useState(false);

  const recomputeCanUndoRedo = useCallback(() => {
    const h = historyRef.current;
    setCanUndo(h.index > 0);
    setCanRedo(h.index < h.stack.length - 1);
  }, []);

  const pushHistory = useCallback(() => {
    if (restoringRef.current) return;
    const fc = fabricRef.current;
    if (!fc) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snap = (fc.toJSON as any)(["customId"]) as object;
    const h = historyRef.current;
    // trunca futuro si estabamos en medio del stack
    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(snap);
    h.index = h.stack.length - 1;
    // limita stack a 30 snapshots para no comerse memoria
    if (h.stack.length > 30) {
      h.stack = h.stack.slice(-30);
      h.index = h.stack.length - 1;
    }
    recomputeCanUndoRedo();
  }, [recomputeCanUndoRedo]);

  const restoreSnapshot = useCallback(async (snap: object) => {
    const fc = fabricRef.current;
    if (!fc) return;
    restoringRef.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (fc.loadFromJSON as any)(snap);
      fc.getObjects().forEach(obj => {
        obj.set({
          cornerColor: "#a855f7", cornerStrokeColor: "#ffffff",
          cornerStyle: "circle", transparentCorners: false,
          borderColor: "#a855f7", borderScaleFactor: 1.5,
          cornerSize: 14, touchCornerSize: 44, padding: 4,
        });
      });
      fc.requestRenderAll();
    } finally {
      restoringRef.current = false;
    }
  }, []);

  const handleUndo = useCallback(async () => {
    const h = historyRef.current;
    if (h.index <= 0) return;
    h.index--;
    await restoreSnapshot(h.stack[h.index]);
    setSaveState("unsaved");
    recomputeCanUndoRedo();
  }, [restoreSnapshot, recomputeCanUndoRedo]);

  const handleRedo = useCallback(async () => {
    const h = historyRef.current;
    if (h.index >= h.stack.length - 1) return;
    h.index++;
    await restoreSnapshot(h.stack[h.index]);
    setSaveState("unsaved");
    recomputeCanUndoRedo();
  }, [restoreSnapshot, recomputeCanUndoRedo]);

  // ─── Cargar template (modo plantilla nueva) ────────────────────────────
  useEffect(() => {
    if (!templateId) return;
    const t = templates.find(t => t.id === templateId);
    if (t) {
      setTemplate(t);
      setDocTitle(t.title);
    }
  }, [templateId]);

  // ─── Cargar proyecto guardado (modo Fase E) ────────────────────────────
  // Lee la fila projects + setea Template (si templateId existe) + guarda
  // fabric_json para hidratar el canvas en el otro useEffect.
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      const { data: row, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("user_id", user.id)
        .single();
      if (error || !row) { router.push("/projects"); return; }
      setCurrentProjectId(row.id);
      setDocTitle(row.title ?? "Diseño sin título");
      if (row.template_id) {
        const t = templates.find(t => t.id === row.template_id);
        if (t) setTemplate(t);
      }
      setPendingProjectMeta({
        title: row.title ?? "Diseño sin título",
        templateId: row.template_id ?? null,
        width: row.width ?? 1080,
        height: row.height ?? 1350,
        format: row.format ?? "portrait",
      });
      pendingFabricJsonRef.current = row.fabric_json ?? null;
    })();
  }, [projectId, router]);

  // ─── KEYBOARD AVOIDANCE (visualViewport API) ───────────────────────────
  // Cuando el teclado virtual sube en mobile, redimensionamos el editor
  // para que canvas + sheet queden VISIBLES sobre el teclado. Sin esto
  // el teclado tapa el flyer y el usuario no ve lo que está editando.
  // Mismo enfoque que Canva/Figma web.
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbHeight(kh);
    };
    onResize();
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  // ─── Mapa layer customId → block ────────────────────────────────────────
  const layerToBlock = useMemo(() => {
    const map = new Map<string, EditableBlock>();
    blocks.forEach(b => b.layerIds.forEach(lid => map.set(lid, b)));
    return map;
  }, [blocks]);

  // ─── Inicializar Fabric + aplicar plantilla O cargar JSON guardado ─────
  useEffect(() => {
    if (!canvasRef.current) return;

    // Modo proyecto guardado: usamos las dimensiones del proyecto guardado
    const isLoadMode = !!projectId && !!pendingFabricJsonRef.current && !!pendingProjectMeta;
    if (!isLoadMode && !template) return;
    let width: number, height: number;
    if (isLoadMode && pendingProjectMeta) {
      width = pendingProjectMeta.width;
      height = pendingProjectMeta.height;
    } else {
      const variant = getVariant(template!, formatId);
      if (!variant) return;
      width = variant.width;
      height = variant.height;
    }

    const fc = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#000",
      enableRetinaScaling: true,
      allowTouchScrolling: false,
      preserveObjectStacking: true,
      selection: false,
      uniformScaling: false,
    });
    fabricRef.current = fc;
    setCanvasSize({ w: width, h: height });

    const setupAfterLoad = () => {
      fc.getObjects().forEach(obj => {
        // Fondos (customId "bg-*" o "background") quedan NO interactivos —
        // si los seleccionas sin querer al tap fuera de objetos arruina la
        // edicion. Quien quiera cambiarlos usa el sheet "Estilo" o Remix.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((obj as any).customId as string | undefined ?? "").toLowerCase();
        const isBackground = cid.startsWith("bg-") || cid === "background";
        if (isBackground) {
          obj.set({
            selectable: false,
            evented: false,
            hoverCursor: "default",
          });
          return;
        }
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
      setSaveState("saved");
      fc.renderAll();
      // Push estado inicial al history (index 0). Asi el primer cambio
      // permite undo de vuelta al inicio.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const snap = (fc.toJSON as any)(["customId"]) as object;
      historyRef.current = { stack: [snap], index: 0 };
      recomputeCanUndoRedo();
    };

    if (isLoadMode) {
      // Hidrata canvas desde el JSON guardado. Despues de loadFromJSON
      // los objetos no traen customId si fueron serializados sin pasarlo
      // a toJSON, pero el desktop lo hace, asi que customId esta presente.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fc.loadFromJSON as any)(pendingFabricJsonRef.current).then(() => {
        pendingFabricJsonRef.current = null;
        setupAfterLoad();
      });
    } else {
      const variant = getVariant(template!, formatId);
      if (!variant) return;
      applyTemplateLayers(fc, variant.layers).then(setupAfterLoad);
    }

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
  }, [template, formatId, blocks, projectId, pendingProjectMeta]);

  // ─── Auto-fit + ResizeObserver + zoom-to-element ───────────────────────
  //
  // Logica de zoom:
  //   - Por defecto: fit-to-view (todo el flyer visible en el wrapper)
  //   - Si hay un bloque ACTIVO en el sheet de texto: zoom + pan al bbox
  //     del layer asociado, asi el usuario ve grande lo que esta editando
  //     (igual que Canva cuando seleccionas un texto chico).
  //   - Al cerrar el sheet o desactivar bloque: vuelve al fit-to-view.

  // Calcular y aplicar zoom contextual a un objeto Fabric.
  const focusOnObject = useCallback((fc: FabricCanvas, obj: FabricObject) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const r = wrapper.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const bounds = obj.getBoundingRect();
    // Margenes para que el bbox NO ocupe el 100% del wrapper. Asi se ve
    // contexto alrededor y la transicion es menos abrupta.
    const PAD_RATIO = 0.45; // bbox ocupa ~55% del wrapper
    const zoomW = (r.width * PAD_RATIO) / bounds.width;
    const zoomH = (r.height * PAD_RATIO) / bounds.height;
    // Tope superior — no hacer zoom infinito en textos minusculos
    const zoom = Math.min(zoomW, zoomH, 4);
    // Centrar el bbox en el wrapper
    const cx = bounds.left + bounds.width / 2;
    const cy = bounds.top + bounds.height / 2;
    const tx = r.width / 2 - cx * zoom;
    const ty = r.height / 2 - cy * zoom;
    fc.setDimensions({ width: r.width, height: r.height });
    fc.setZoom(zoom);
    fc.setViewportTransform([zoom, 0, 0, zoom, tx, ty]);
    fc.requestRenderAll();
  }, []);

  // Fit-to-view (todo el flyer visible).
  const fitToView = useCallback((fc: FabricCanvas) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
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
  }, [canvasSize.w, canvasSize.h]);

  // Suprimimos warning del lint — focusOnObject queda como helper exportable
  // por si se necesita en pinch-zoom manual en el futuro.
  void focusOnObject;

  useEffect(() => {
    const fc = fabricRef.current;
    const wrapper = wrapperRef.current;
    if (!fc || !loaded || !wrapper) return;
    // Patron Canva: el flyer SIEMPRE fit-to-view. El usuario decide hacer
    // zoom manual via pinch si necesita ver detalle. Editar texto NO hace
    // zoom auto (esto provocaba confusion al cambiar de bloque).
    fitToView(fc);
    const ro = new ResizeObserver(() => fitToView(fc));
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [loaded, fitToView]);

  // ─── Selection handlers — ref para evitar re-suscripcion ────────────────
  // Usamos ref de layerToBlock para que el listener se suscriba UNA sola vez
  // (al loaded). Si dependieramos de layerToBlock, el listener se re-suscribe
  // cada render y podria perder eventos durante la transicion.
  const layerToBlockRef = useRef(layerToBlock);
  useEffect(() => { layerToBlockRef.current = layerToBlock; }, [layerToBlock]);

  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !loaded) return;
    const onSelect = (e: { selected?: FabricObject[] }) => {
      const sel = e.selected?.[0];
      if (!sel) return;
      const cid = (sel as FabricObject & { customId?: string }).customId;
      setSelectedLayerId(cid ?? "__obj__");
      const t = detectType(sel);
      setSelectedType(t);
      // Cambiar sub-tool a uno valido segun el tipo (resetea si cambiamos
      // de un texto a una imagen por ejemplo)
      setActiveSubTool(null);
      if (cid) {
        const block = layerToBlockRef.current.get(cid);
        if (block) {
          setActiveBlockId(block.id);
        }
      }
    };
    const onDeselect = () => {
      setSelectedLayerId(null);
      setSelectedType(null);
      setActiveSubTool(null);
    };
    fc.on("selection:created", onSelect);
    fc.on("selection:updated", onSelect);
    fc.on("selection:cleared", onDeselect);

    // ─── History tracking (Fase F) ─────────────────────────────────────
    // Push snapshot tras cualquier modificacion del usuario. Usamos un
    // debounce simple: agrupamos cambios consecutivos en 350ms para no
    // crear un snapshot por cada delta del drag.
    let pushTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedPush = () => {
      if (restoringRef.current) return;
      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(() => { pushHistory(); }, 350);
    };
    fc.on("object:modified", debouncedPush);
    fc.on("object:added", debouncedPush);
    fc.on("object:removed", debouncedPush);

    // ─── Smart guides al arrastrar (Fase J) ───────────────────────────
    const onObjectMoving = (e: { target?: FabricObject }) => {
      const obj = e.target;
      if (!obj) return;
      const zoom = fc.getZoom();
      const THRESHOLD = 8 / zoom; // 8px en pantalla
      const bounds = obj.getBoundingRect();
      const w = bounds.width;
      const h = bounds.height;
      const cx = bounds.left + w / 2;
      const cy = bounds.top + h / 2;

      // Referencias verticales (eje X) y horizontales (eje Y)
      const vRefs: number[] = [0, canvasSize.w / 2, canvasSize.w];
      const hRefs: number[] = [0, canvasSize.h / 2, canvasSize.h];
      fc.getObjects().forEach(other => {
        if (other === obj) return;
        if (other.visible === false) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((other as any).customId as string | undefined ?? "").toLowerCase();
        if (cid.startsWith("bg-") || cid === "background") return;
        const ob = other.getBoundingRect();
        vRefs.push(ob.left, ob.left + ob.width / 2, ob.left + ob.width);
        hRefs.push(ob.top, ob.top + ob.height / 2, ob.top + ob.height);
      });

      const guides: Guide[] = [];
      // Snap vertical: para cada ref vertical, probar left, center, right del objeto
      let snappedX = false;
      for (const ref of vRefs) {
        if (snappedX) break;
        for (const objX of [bounds.left, cx, bounds.left + w]) {
          if (Math.abs(objX - ref) < THRESHOLD) {
            obj.set("left", (obj.left ?? 0) + (ref - objX));
            guides.push({ axis: "v", pos: ref });
            snappedX = true;
            break;
          }
        }
      }
      // Snap horizontal
      let snappedY = false;
      for (const ref of hRefs) {
        if (snappedY) break;
        for (const objY of [bounds.top, cy, bounds.top + h]) {
          if (Math.abs(objY - ref) < THRESHOLD) {
            obj.set("top", (obj.top ?? 0) + (ref - objY));
            guides.push({ axis: "h", pos: ref });
            snappedY = true;
            break;
          }
        }
      }
      if (snappedX || snappedY) obj.setCoords();
      setActiveGuides(guides);
    };
    const onObjectMoved = () => setActiveGuides([]);
    fc.on("object:moving", onObjectMoving);
    fc.on("mouse:up", onObjectMoved);

    return () => {
      fc.off("selection:created", onSelect);
      fc.off("selection:updated", onSelect);
      fc.off("selection:cleared", onDeselect);
      fc.off("object:modified", debouncedPush);
      fc.off("object:added", debouncedPush);
      fc.off("object:removed", debouncedPush);
      fc.off("object:moving", onObjectMoving);
      fc.off("mouse:up", onObjectMoved);
      if (pushTimer) clearTimeout(pushTimer);
    };
  }, [loaded, pushHistory, canvasSize.w, canvasSize.h]);

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
    pushHistory();
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

  // ─── Helpers para sub-tools (leer/escribir propiedades del objeto activo)
  const getActiveText = useCallback((): Textbox | null => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return null;
    if (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text") {
      return obj as Textbox;
    }
    return null;
  }, []);

  const setTextProp = useCallback(<K extends keyof Textbox>(key: K, value: Textbox[K]) => {
    const fc = fabricRef.current;
    const t = getActiveText();
    if (!fc || !t) return;
    t.set(key, value as never);
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
  }, [getActiveText]);

  // ─── Texto avanzado (Fase K) ────────────────────────────────────────────
  // Sombra preset, outline, glow. Reusa setTextProp para uniformidad.
  const applyTextShadow = useCallback((mode: "none" | "soft" | "strong" | "glow") => {
    const fc = fabricRef.current;
    const t = getActiveText();
    if (!fc || !t) return;
    if (mode === "none") {
      t.set("shadow", null as never);
    } else if (mode === "soft") {
      t.set("shadow", new Shadow({ color: "rgba(0,0,0,0.4)", blur: 8, offsetX: 2, offsetY: 4 }));
    } else if (mode === "strong") {
      t.set("shadow", new Shadow({ color: "rgba(0,0,0,0.85)", blur: 16, offsetX: 4, offsetY: 8 }));
    } else { // glow — color del texto, brillo alrededor
      const color = (t.fill as string) ?? "#a855f7";
      t.set("shadow", new Shadow({ color, blur: 24, offsetX: 0, offsetY: 0 }));
    }
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
  }, [getActiveText, pushHistory]);

  const applyTextOutline = useCallback((width: number, color: string = "#000000") => {
    const fc = fabricRef.current;
    const t = getActiveText();
    if (!fc || !t) return;
    t.set("stroke", width > 0 ? color : "");
    t.set("strokeWidth", width);
    // Pinta el stroke ANTES del fill — así el borde no come letra
    t.set("paintFirst", "stroke" as never);
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
  }, [getActiveText, pushHistory]);

  const setObjFill = useCallback((color: string) => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    obj.set("fill", color);
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
  }, []);

  // ─── Helpers IMAGEN (filtros, opacidad, recorte, reemplazo) ─────────────
  const getActiveImage = useCallback((): FabricImage | null => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj || obj.type !== "image") return null;
    return obj as FabricImage;
  }, []);

  /** Aplica un preset de filtro: Original / B&N / Cálido / Frío / Vintage */
  const applyImageFilter = useCallback((preset: "none" | "bw" | "warm" | "cool" | "vintage") => {
    const fc = fabricRef.current;
    const img = getActiveImage();
    if (!fc || !img) return;
    switch (preset) {
      case "none":
        img.filters = [];
        break;
      case "bw":
        img.filters = [new FabricFilters.Grayscale()];
        break;
      case "warm":
        // mas rojo + brillo
        img.filters = [
          new FabricFilters.HueRotation({ rotation: 0.05 }),
          new FabricFilters.Saturation({ saturation: 0.2 }),
        ];
        break;
      case "cool":
        img.filters = [
          new FabricFilters.HueRotation({ rotation: -0.1 }),
          new FabricFilters.Saturation({ saturation: 0.1 }),
        ];
        break;
      case "vintage":
        img.filters = [new FabricFilters.Sepia()];
        break;
    }
    img.applyFilters();
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
  }, [getActiveImage]);

  // ─── Imagen avanzada (Fase L) ───────────────────────────────────────────
  // Sliders brillo/contraste/saturacion: cada slider escribe un filtro
  // Brightness/Contrast/Saturation que sustituye al de su tipo si ya
  // existe. Asi los presets (Grayscale, Sepia) se mantienen intactos.
  //
  // El push de history se hace al soltar (onMouseUp del slider) — si
  // pushearamos en cada delta tendriamos 200 snapshots por drag.

  /** Reemplaza o anade un filtro a la imagen activa. */
  const setImageFilter = useCallback((
    name: "Brightness" | "Contrast" | "Saturation",
    options: Record<string, number>
  ) => {
    const fc = fabricRef.current;
    const img = getActiveImage();
    if (!fc || !img) return;
    // Filtros existentes excluyendo el tipo que vamos a actualizar.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const others = (img.filters ?? []).filter((f: any) => {
      // Fabric guarda type como string capitalizado
      return f?.type !== name;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let newF: any;
    if (name === "Brightness") newF = new FabricFilters.Brightness(options);
    else if (name === "Contrast") newF = new FabricFilters.Contrast(options);
    else newF = new FabricFilters.Saturation(options);
    img.filters = [...others, newF];
    img.applyFilters();
    fc.requestRenderAll();
    setSaveState("unsaved");
  }, [getActiveImage]);

  /** Lee el valor actual de un filtro por tipo. -1 si no existe. */
  const getImageFilterValue = useCallback((name: "Brightness" | "Contrast" | "Saturation"): number => {
    const img = getActiveImage();
    if (!img) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = (img.filters ?? []).find((f: any) => f?.type === name);
    if (!f) return 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyF = f as any;
    if (name === "Brightness") return anyF.brightness ?? 0;
    if (name === "Contrast") return anyF.contrast ?? 0;
    return anyF.saturation ?? 0;
  }, [getActiveImage]);

  const setImageRotation = useCallback((angle: number) => {
    const fc = fabricRef.current;
    const img = getActiveImage();
    if (!fc || !img) return;
    img.set("angle", angle);
    img.setCoords();
    fc.requestRenderAll();
    setSaveState("unsaved");
  }, [getActiveImage]);

  const flipImage = useCallback((axis: "x" | "y") => {
    const fc = fabricRef.current;
    const img = getActiveImage();
    if (!fc || !img) return;
    if (axis === "x") img.set("flipX", !img.flipX);
    else img.set("flipY", !img.flipY);
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
    toast.success(axis === "x" ? "Volteado horizontal" : "Volteado vertical");
  }, [getActiveImage, pushHistory, toast]);

  /** Cambia la forma de recorte: cuadrado, círculo, redondeado.
   *  Usa clipPath de Fabric en coordenadas locales del objeto. */
  const applyImageCrop = useCallback((shape: "square" | "circle" | "rounded") => {
    const fc = fabricRef.current;
    const img = getActiveImage();
    if (!fc || !img) return;
    const w = img.width ?? 0;
    const h = img.height ?? 0;
    switch (shape) {
      case "square":
        img.clipPath = undefined;
        break;
      case "circle":
        img.clipPath = new FabricCircle({
          radius: Math.min(w, h) / 2,
          originX: "center",
          originY: "center",
        });
        break;
      case "rounded": {
        const r = Math.min(w, h) * 0.12;
        img.clipPath = new FabricRect({
          width: w,
          height: h,
          rx: r,
          ry: r,
          originX: "center",
          originY: "center",
        });
        break;
      }
    }
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
  }, [getActiveImage]);

  // ─── Quitar fondo con IA (Fase G) ───────────────────────────────────────
  // POST a /api/refine-hd con dataURL de la imagen seleccionada. Sustituye
  // el src del FabricImage por la version sin fondo (PNG transparente).
  // Auth + rate limit aplicados en el endpoint.
  const [removingBg, setRemovingBg] = useState(false);

  /** Genera dataURL de una imagen Fabric. Si el src ya es data:/blob: lo
   *  retorna directo. Si es http, lo descargamos via fetch para evitar
   *  tainted canvas (R2 tiene CORS configurado). */
  const fabricImageToDataUrl = useCallback(async (img: FabricImage): Promise<string> => {
    const el = img.getElement() as HTMLImageElement;
    const src = el?.src ?? "";
    if (src.startsWith("data:") || src.startsWith("blob:")) return src;
    // Para URLs http: descargar y convertir a dataURL
    const res = await fetch(src, { mode: "cors" });
    if (!res.ok) throw new Error("No se pudo leer la imagen");
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    if (!authUser) { toast.info("Inicia sesión para usar IA"); return; }
    const fc = fabricRef.current;
    const img = getActiveImage();
    if (!fc || !img) { toast.error("Selecciona primero una imagen"); return; }
    setRemovingBg(true);
    try {
      const dataUrl = await fabricImageToDataUrl(img);
      const res = await fetch("/api/refine-hd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: dataUrl }),
      });
      if (!res.ok) {
        if (res.status === 401) toast.error("Inicia sesión");
        else if (res.status === 429) toast.error("Demasiadas peticiones, espera 1 min");
        else toast.error("La IA falló — intenta de nuevo");
        return;
      }
      const data = await res.json() as { refinedUrl?: string };
      if (!data.refinedUrl) {
        toast.error("La IA no devolvió imagen");
        return;
      }
      // Cargar la imagen nueva. Reemplazamos el HTMLImageElement del Fabric
      // preservando posicion + escala originales.
      const newImg = await FabricImage.fromURL(data.refinedUrl, { crossOrigin: "anonymous" });
      img.setElement(newImg.getElement() as HTMLImageElement);
      img.dirty = true;
      // Limpiar filtros previos y clipPath — el PNG transparente ya viene
      // recortado por la IA; filtros antiguos podrian re-corromper alpha.
      img.filters = [];
      img.applyFilters();
      fc.requestRenderAll();
      setSaveState("unsaved");
      pushHistory();
      toast.success("Fondo eliminado");
    } catch (e) {
      console.error("[remove-bg]", e);
      toast.error("Error procesando la imagen");
    } finally {
      setRemovingBg(false);
    }
  }, [authUser, getActiveImage, fabricImageToDataUrl, pushHistory, toast]);

  // ─── Reiniciar plantilla (Fase M.1) ────────────────────────────────────
  // Vuelve al diseño original limpio. Limpia canvas, re-aplica template
  // layers, resetea blockValues/paleta/remix. Push history para poder
  // deshacer si fue por error.
  const handleResetTemplate = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !template) return;
    if (!window.confirm("¿Volver al diseño original?\n\nPerderás todos los cambios no guardados.")) return;
    const variant = getVariant(template, formatId);
    if (!variant) return;
    fc.discardActiveObject();
    fc.remove(...fc.getObjects());
    fc.backgroundColor = "#000";
    applyTemplateLayers(fc, variant.layers).then(() => {
      fc.getObjects().forEach(obj => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((obj as any).customId as string | undefined ?? "").toLowerCase();
        const isBackground = cid.startsWith("bg-") || cid === "background";
        if (isBackground) {
          obj.set({ selectable: false, evented: false, hoverCursor: "default" });
          return;
        }
        obj.set({
          cornerColor: "#a855f7", cornerStrokeColor: "#ffffff",
          cornerStyle: "circle", transparentCorners: false,
          borderColor: "#a855f7", borderScaleFactor: 1.5,
          cornerSize: 14, touchCornerSize: 44, padding: 4,
        });
      });
      // Reset blockValues a los textos originales del template
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
      setActivePaletteId(null);
      setActiveRemixId(null);
      fc.requestRenderAll();
      setSaveState("unsaved");
      pushHistory();
      setOpenSheet(null);
      toast.success("Plantilla restaurada");
    });
  }, [template, formatId, blocks, pushHistory, toast]);

  // Ref a doSave para usar desde callbacks declaradas ANTES de doSave
  const doSaveRef = useRef<((silent?: boolean) => Promise<void>) | null>(null);

  // ─── Cambiar formato en vivo (Fase M.1) ────────────────────────────────
  // Si el proyecto esta guardado, lo guardamos primero (con cambios actuales)
  // y luego navegamos a la nueva URL con el formato nuevo. Si NO esta
  // guardado y el user no tiene cambios, navegamos directo. Si tiene
  // cambios pero no esta autenticado, advertimos.
  const handleChangeFormat = useCallback(async (newFormatId: FormatId) => {
    if (!template) return;
    const variant = getVariant(template, newFormatId);
    if (!variant) {
      toast.error(`Esta plantilla no tiene formato ${FORMATS[newFormatId].name}`);
      return;
    }
    if (saveState === "unsaved" && !authUser) {
      const ok = window.confirm("Tienes cambios sin guardar. ¿Cambiar de formato igualmente? Se perderán.");
      if (!ok) return;
    } else if (saveState === "unsaved" && authUser) {
      // Guardar antes de cambiar — preserva trabajo. Usamos ref para evitar
      // problema de declaracion-antes-de-uso (doSave esta mas abajo).
      await doSaveRef.current?.(true);
    }
    // Navegar al mismo proyecto (o template) con el formato nuevo
    const idForUrl = currentProjectId ?? template.id;
    router.push(`/editor/${idForUrl}?format=${newFormatId}`);
  }, [template, saveState, authUser, currentProjectId, router, toast]);

  // ─── Smart guides (Fase J) ─────────────────────────────────────────────
  // Líneas guía cyan al arrastrar objetos. Snap a:
  //   - Centro horizontal/vertical del canvas
  //   - Bordes (left/right/top/bottom) del canvas
  //   - Centros y bordes de otros objetos
  //
  // Threshold ajustado por zoom: 8px en pantalla → 8/zoom en canvas units.
  // Guides se renderizan como divs absolute en un overlay sobre el canvas
  // wrapper — más rápido que pintar en Fabric y no se exportan.
  type Guide = { axis: "v" | "h"; pos: number };
  const [activeGuides, setActiveGuides] = useState<Guide[]>([]);

  const handleCenterActive = useCallback((axis: "h" | "v" | "both") => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    const bounds = obj.getBoundingRect();
    if (axis === "h" || axis === "both") {
      const dx = canvasSize.w / 2 - (bounds.left + bounds.width / 2);
      obj.set("left", (obj.left ?? 0) + dx);
    }
    if (axis === "v" || axis === "both") {
      const dy = canvasSize.h / 2 - (bounds.top + bounds.height / 2);
      obj.set("top", (obj.top ?? 0) + dy);
    }
    obj.setCoords();
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
    toast.success(
      axis === "both" ? "Centrado en el canvas" :
      axis === "h" ? "Centrado horizontal" : "Centrado vertical"
    );
  }, [canvasSize.w, canvasSize.h, pushHistory, toast]);

  // ─── Añadir nuevo elemento (Fase I.1) ──────────────────────────────────
  // Helpers para crear texto/forma/imagen NUEVA y añadirla al canvas
  // centrado, con corner config consistente, seleccionada para editar.

  /** Decoracion default que damos a todo objeto nuevo para que se vea
   *  consistente con los del template (handles morados). */
  const decorateNewObject = useCallback((obj: FabricObject) => {
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
  }, []);

  const addText = useCallback((variant: "title" | "subtitle" | "body" = "body") => {
    const fc = fabricRef.current;
    if (!fc) return;
    const presets = {
      title:    { text: "Tu título", fontSize: 96, fontFamily: "Anton", fontWeight: "900" },
      subtitle: { text: "Tu subtítulo", fontSize: 48, fontFamily: "Bebas Neue", fontWeight: "400" },
      body:     { text: "Tu texto aquí", fontSize: 36, fontFamily: "Inter", fontWeight: "400" },
    } as const;
    const p = presets[variant];
    const tb = new Textbox(p.text, {
      left: canvasSize.w / 2,
      top: canvasSize.h / 2,
      originX: "center",
      originY: "center",
      width: Math.min(canvasSize.w * 0.7, 800),
      fill: "#ffffff",
      fontSize: p.fontSize,
      fontFamily: p.fontFamily,
      fontWeight: p.fontWeight,
      textAlign: "center",
      editable: true,
    });
    decorateNewObject(tb as FabricObject);
    fc.add(tb);
    fc.setActiveObject(tb);
    fc.requestRenderAll();
    setSaveState("unsaved");
    setOpenSheet(null);
    pushHistory();
    toast.success("Texto añadido");
  }, [canvasSize.w, canvasSize.h, decorateNewObject, pushHistory, toast]);

  /** Añade una forma. Soporta rect, circle, triangle, heart, star, line. */
  const addShape = useCallback((kind: "rect" | "circle" | "triangle" | "heart" | "star" | "line") => {
    const fc = fabricRef.current;
    if (!fc) return;
    const cx = canvasSize.w / 2;
    const cy = canvasSize.h / 2;
    const size = Math.min(canvasSize.w, canvasSize.h) * 0.25;
    const fill = "#a855f7";
    let obj: FabricObject;
    if (kind === "rect") {
      obj = new FabricRect({
        left: cx, top: cy, originX: "center", originY: "center",
        width: size, height: size, fill,
        rx: 12, ry: 12,
      });
    } else if (kind === "circle") {
      obj = new FabricCircle({
        left: cx, top: cy, originX: "center", originY: "center",
        radius: size / 2, fill,
      });
    } else if (kind === "triangle") {
      // Cargado lazy dinamicamente para evitar bundle pesado si no se usa
      // Pero ya tenemos fabric importado completo en el archivo, asi que
      // creamos via dynamic require — Fabric exporta Triangle.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Triangle: FabricTriangle } = require("fabric");
      obj = new FabricTriangle({
        left: cx, top: cy, originX: "center", originY: "center",
        width: size, height: size, fill,
      });
    } else if (kind === "heart") {
      // SVG path del corazón clásico
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Path } = require("fabric");
      const heartPath = "M 272.70141,238.71731 C 206.46141,238.71731 152.70146,292.4773 152.70146,358.71731 C 152.70146,493.47282 288.63461,528.80461 381.26391,662.02535 C 468.83815,529.62199 609.82641,489.17075 609.82641,358.71731 C 609.82641,292.47731 556.06651,238.7173 489.82641,238.71731 C 441.77851,238.71731 400.42481,267.08774 381.26391,307.90481 C 362.10311,267.08773 320.74941,238.7173 272.70141,238.71731 z";
      obj = new Path(heartPath, {
        left: cx, top: cy, originX: "center", originY: "center",
        fill,
        scaleX: size / 800, scaleY: size / 800,
      });
    } else if (kind === "star") {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Polygon } = require("fabric");
      // Estrella 5 puntas
      const points: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? size / 2 : size / 4;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      obj = new Polygon(points, {
        left: cx, top: cy, originX: "center", originY: "center", fill,
      });
    } else {
      // line
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Line } = require("fabric");
      obj = new Line([cx - size, cy, cx + size, cy], {
        stroke: fill, strokeWidth: 8,
      });
    }
    decorateNewObject(obj);
    fc.add(obj);
    fc.setActiveObject(obj);
    fc.requestRenderAll();
    setSaveState("unsaved");
    setOpenSheet(null);
    pushHistory();
    toast.success("Forma añadida");
  }, [canvasSize.w, canvasSize.h, decorateNewObject, pushHistory, toast]);

  /** Añade una imagen NUEVA desde galería al centro del canvas. */
  const addImageFromFile = useCallback(async (file: File) => {
    const fc = fabricRef.current;
    if (!fc) return;
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
      const maxDim = Math.min(canvasSize.w, canvasSize.h) * 0.4;
      const w = img.width ?? 1;
      const h = img.height ?? 1;
      const scale = Math.min(maxDim / w, maxDim / h);
      img.set({
        left: canvasSize.w / 2,
        top: canvasSize.h / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
      });
      decorateNewObject(img);
      fc.add(img);
      fc.setActiveObject(img);
      fc.requestRenderAll();
      setSaveState("unsaved");
      setOpenSheet(null);
      pushHistory();
      toast.success("Imagen añadida");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar la imagen");
    }
  }, [canvasSize.w, canvasSize.h, decorateNewObject, pushHistory, toast]);

  // ─── Lock / Unlock (Fase I.3) ──────────────────────────────────────────
  const toggleLockActive = useCallback(() => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    const wasLocked = obj.lockMovementX === true;
    const next = !wasLocked;
    obj.set({
      lockMovementX: next,
      lockMovementY: next,
      lockScalingX: next,
      lockScalingY: next,
      lockRotation: next,
      hasControls: !next, // sin handles cuando esta bloqueado
    });
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
    toast.success(next ? "Objeto bloqueado" : "Objeto desbloqueado");
  }, [pushHistory, toast]);

  /** Reemplaza la imagen activa preservando posicion + escala.
   *  Carga el archivo local via FileReader → data URL → FabricImage. */
  const handleReplaceImage = useCallback(async (file: File) => {
    const fc = fabricRef.current;
    const img = getActiveImage();
    if (!fc || !img) return;
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const newImg = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
      const el = newImg.getElement();
      img.setElement(el as HTMLImageElement);
      img.dirty = true;
      fc.requestRenderAll();
      setSaveState("unsaved");
      pushHistory();
      toast.success("Imagen reemplazada");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo cargar la imagen");
    }
  }, [getActiveImage, toast]);

  // ─── Helpers FORMA (borde, opacidad, esquinas) ──────────────────────────
  const setObjOpacity = useCallback((o: number) => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    obj.set("opacity", o);
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
  }, []);

  const setObjStroke = useCallback((color: string | null, width?: number) => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj) return;
    if (color !== undefined) obj.set("stroke", color ?? "");
    if (width !== undefined) obj.set("strokeWidth", width);
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
  }, []);

  /** Esquinas redondeadas solo aplica a Rect (rx/ry). En otros objetos no
   *  hace nada visible. */
  const setRectCornerRadius = useCallback((r: number) => {
    const fc = fabricRef.current;
    const obj = fc?.getActiveObject();
    if (!fc || !obj || obj.type !== "rect") return;
    obj.set("rx", r);
    obj.set("ry", r);
    fc.requestRenderAll();
    setSaveState("unsaved");
    pushHistory();
  }, []);

  const handleDeselect = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    fc.discardActiveObject();
    fc.requestRenderAll();
    setSelectedLayerId(null);
    setActiveSubTool(null);
    setActiveBlockId(null);
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

  // ─── Save / Persistencia (Fase E) ───────────────────────────────────────
  // Serializa el canvas (incluyendo customId), genera thumbnail JPEG inline
  // y guarda o actualiza en Supabase. Si es nuevo, redirige URL a /editor/<uuid>
  // sin recargar (replaceState).
  const doSave = useCallback(async (silent = false) => {
    const fc = fabricRef.current;
    if (!fc || !loaded) return;
    setSaveState("saving");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabricJson = (fc.toJSON as any)(["customId"]) as object;
      // Thumbnail JPEG ~320px
      let thumbnailUrl: string | null = null;
      try {
        const zoom = fc.getZoom();
        const vpt = fc.viewportTransform ? [...fc.viewportTransform] : null;
        fc.setZoom(1);
        fc.setDimensions({ width: canvasSize.w, height: canvasSize.h });
        const thumbScale = 320 / Math.max(canvasSize.w, canvasSize.h);
        thumbnailUrl = fc.toDataURL({ format: "jpeg", quality: 0.6, multiplier: thumbScale });
        fc.setZoom(zoom);
        if (vpt) fc.setViewportTransform(vpt as [number, number, number, number, number, number]);
        fc.renderAll();
      } catch (e) { console.warn("thumb error", e); }

      const result = await saveProject(
        currentProjectId,
        docTitle || template?.title || "Diseño sin título",
        templateId ?? template?.id ?? 0,
        fabricJson,
        formatId ?? "portrait",
        canvasSize.w,
        canvasSize.h,
        thumbnailUrl,
      );
      if (result) {
        if (!currentProjectId) {
          setCurrentProjectId(result);
          // Cambia URL a /editor/<uuid> sin recargar
          window.history.replaceState(null, "", `/editor/${result}`);
        }
        setSaveState("saved");
        if (!silent) toast.success("Diseño guardado");
      } else {
        setSaveState("unsaved");
        if (!silent) toast.error("No se pudo guardar");
      }
    } catch (e) {
      console.error("save error", e);
      setSaveState("unsaved");
      if (!silent) toast.error("Error al guardar");
    }
  }, [loaded, currentProjectId, docTitle, templateId, template, formatId, canvasSize, saveProject, toast]);

  const handleSave = useCallback(() => {
    if (!authUser) { toast.info("Inicia sesión para guardar"); return; }
    void doSave(false);
  }, [authUser, doSave, toast]);

  // Sync ref para que callbacks declaradas antes de doSave (handleChangeFormat)
  // puedan invocar la version mas reciente sin closure stale.
  useEffect(() => { doSaveRef.current = doSave; }, [doSave]);

  // ─── Warning al salir sin guardar ───────────────────────────────────────
  // beforeunload alerta al cerrar pestaña/tab. Para back navigation in-app
  // usamos confirmExit() que se invoca desde el boton ArrowLeft + del bottom
  // bar "Plantillas".
  useEffect(() => {
    if (saveState !== "unsaved") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome requiere returnValue para mostrar el dialogo nativo
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  const confirmExit = useCallback((to: string | null) => {
    if (saveState === "unsaved") {
      const ok = window.confirm("Tienes cambios sin guardar. ¿Seguro que quieres salir?");
      if (!ok) return;
    }
    if (to) router.push(to);
    else router.back();
  }, [saveState, router]);

  // ─── Auto-save (cada 12s si hay cambios sin guardar y user autenticado) ─
  // Si dispara mientras una guardada esta en curso, se ignora porque saveState
  // sera "saving". Auto-save SOLO actua sobre proyectos ya creados (con
  // currentProjectId) — no creamos automaticamente para evitar bloating de
  // proyectos vacios accidentales.
  useEffect(() => {
    if (!authUser || !loaded || !currentProjectId) return;
    if (saveState !== "unsaved") return;
    const t = window.setTimeout(() => { void doSave(true); }, 12_000);
    return () => window.clearTimeout(t);
  }, [authUser, loaded, currentProjectId, saveState, doSave]);

  // ─── Compartir tras descargar (Fase H) ──────────────────────────────────
  // Tras descargar el flyer, abrimos un modal con opciones de compartir.
  // Subimos el PNG a R2 para tener URL publica que WhatsApp/Facebook/etc.
  // puedan crawlear con preview. Web Share API nativo se ofrece primero en
  // mobile — abre el picker iOS/Android con todas las apps instaladas.
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUploading, setShareUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [lastExportedDataUrl, setLastExportedDataUrl] = useState<string | null>(null);

  /** Sube el ultimo PNG exportado a R2. Cacheado en shareUrl para no
   *  re-subir si el usuario abre el modal varias veces. */
  const ensureSharedUrl = useCallback(async (): Promise<string | null> => {
    if (shareUrl) return shareUrl;
    if (!lastExportedDataUrl) return null;
    if (!authUser) { toast.info("Inicia sesión para compartir"); return null; }
    setShareUploading(true);
    try {
      const res = await fetch("/api/share-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: lastExportedDataUrl }),
      });
      if (!res.ok) {
        if (res.status === 429) toast.error("Demasiadas peticiones, espera 1 min");
        else toast.error("No se pudo preparar el enlace");
        return null;
      }
      const data = await res.json() as { url?: string };
      if (!data.url) return null;
      setShareUrl(data.url);
      return data.url;
    } finally {
      setShareUploading(false);
    }
  }, [shareUrl, lastExportedDataUrl, authUser, toast]);

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
      // Guardar dataURL para que el modal Compartir pueda re-subir a R2
      // sin re-renderizar el canvas.
      setLastExportedDataUrl(finalUrl);
      setShareUrl(null); // invalida cache (es un nuevo render)
      toast.success(`Descargado ${format.toUpperCase()}`);
      // Auto-abrir modal compartir tras descarga exitosa (si user logueado).
      // El sheet export se cierra para no saturar visual.
      if (authUser) {
        setOpenSheet(null);
        setShareOpen(true);
      }
    } finally { setExporting(false); }
  }, [canvasSize, authProfile?.plan, toast, authUser]);

  const handleExport = useCallback(() => {
    // Cambio Fase D.2: el boton Exportar abre el sheet multi-formato.
    // El sheet incluye opcion "Descargar este" (formato actual rapido) y
    // "Descargar todos" (variantes disponibles del template).
    // Auth se valida DENTRO de los botones de descarga (mejor UX — el
    // usuario puede explorar formatos antes de loguearse).
    setOpenSheet("export");
  }, []);

  // ─── Multi-formato exportar ─────────────────────────────────────────────
  // Renderiza una variant del template off-screen con los blockValues
  // actuales aplicados (texto editado) y devuelve dataUrl.
  // Las paletas/remixes NO se replican aqui — para preservarlos exactos
  // exportamos el formato ACTUAL via doExport() y los OTROS formatos llevan
  // el variant original con solo los textos editados. Trade-off documentado.
  // exportFileFormat: toggle PNG (calidad lossless, archivo grande) vs JPG
  // (lossy ~5x mas liviano, sin transparencia — ideal WhatsApp).
  const [exportFileFormat, setExportFileFormat] = useState<"png" | "jpg">("png");

  const renderVariantOffscreen = useCallback(async (variant: ReturnType<typeof getVariant>, fileFormat: "png" | "jpg" = "png"): Promise<string | null> => {
    if (!variant) return null;
    const sc = new FabricStaticCanvas(undefined, {
      width: variant.width,
      height: variant.height,
      backgroundColor: "#000",
    });
    await applyTemplateLayers(sc, variant.layers);
    // Aplicar blockValues (textos editados por el usuario) por customId
    Object.entries(blockValues).forEach(([blockId, value]) => {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;
      block.layerIds.forEach(lid => {
        const obj = sc.getObjects().find(o => (o as FabricObject & { customId?: string }).customId === lid);
        if (obj && (obj.type === "textbox" || obj.type === "text" || obj.type === "i-text")) {
          (obj as Textbox).set("text", value);
        }
      });
    });
    sc.renderAll();
    const url = sc.toDataURL({
      format: fileFormat === "jpg" ? "jpeg" : "png",
      quality: fileFormat === "jpg" ? 0.92 : 0.95,
      multiplier: 1,
    });
    sc.dispose();
    return url;
  }, [blockValues, blocks]);

  const downloadDataUrl = useCallback((url: string, filename: string) => {
    const a = document.createElement("a");
    a.download = filename;
    a.href = url;
    a.click();
  }, []);

  const exportSingleFormat = useCallback(async (fmtId: FormatId) => {
    if (!template) return;
    if (!authUser) { toast.info("Inicia sesión para descargar"); return; }
    setExporting(true);
    try {
      // Si es el formato actual, usar export directo del canvas vivo (preserva
      // paleta/remix/imagenes subidas). Si no, render off-screen del variant.
      if (fmtId === formatId) {
        await doExport(exportFileFormat);
        return;
      }
      const variant = getVariant(template, fmtId);
      if (!variant) {
        toast.error(`Esta plantilla no tiene variante ${FORMATS[fmtId].name}`);
        return;
      }
      const url = await renderVariantOffscreen(variant, exportFileFormat);
      if (!url) { toast.error("Error al renderizar"); return; }
      let finalUrl = url;
      if (shouldWatermark(authProfile?.plan)) {
        try { finalUrl = await applyWatermark(url); } catch (e) { console.warn(e); }
      }
      downloadDataUrl(finalUrl, `artegenia-${template.id}-${fmtId}.${exportFileFormat}`);
      toast.success(`Descargado ${FORMATS[fmtId].name} (${exportFileFormat.toUpperCase()})`);
    } finally {
      setExporting(false);
    }
  }, [template, formatId, doExport, renderVariantOffscreen, authProfile?.plan, toast, downloadDataUrl, exportFileFormat]);

  const exportAllFormats = useCallback(async () => {
    if (!template) return;
    setExporting(true);
    try {
      const available = PUBLIC_FORMATS.filter(fmt => {
        const v = template.variants.find(x => x.format === fmt);
        return !!v;
      });
      let done = 0;
      for (const fmt of available) {
        await exportSingleFormat(fmt);
        done++;
        // Pequeño delay para que el navegador no bloquee las descargas multiples
        await new Promise(r => setTimeout(r, 400));
      }
      toast.success(`Descargados ${done} formatos`);
    } finally {
      setExporting(false);
    }
  }, [template, exportSingleFormat, toast]);

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
    pushHistory();
    // No mostrar toast si viene de applyRemix (paletas "ai-*" o internas de
    // REMIX_STYLES) — applyRemix lo hace con texto mas descriptivo.
    if (!palette.id.startsWith("ai-") && !palette.id.startsWith("remix-")) {
      toast.success(`Paleta "${palette.name}" aplicada`);
    }
  }, [pushHistory, toast]);

  // ─── Remix IA generativa ────────────────────────────────────────────────
  // Llama /api/remix → recibe paleta + fuente generadas por Claude Haiku
  // basadas en categoria + titulo del template + mood opcional.
  // Aplica al canvas usando el mismo applyPalette + cambio de fuente.
  const [aiRemixing, setAiRemixing] = useState(false);
  const [aiRemixResult, setAiRemixResult] = useState<{
    name: string;
    mood: string;
    palette: { primary: string; secondary: string; accent: string; dark: string };
    primaryFont: string;
  } | null>(null);

  const requestAIRemix = useCallback(async (mood?: string) => {
    if (!template) return;
    if (!authUser) { toast.info("Inicia sesión para usar IA"); return; }
    setAiRemixing(true);
    try {
      const res = await fetch("/api/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: template.category ?? "evento",
          title: template.title ?? "",
          mood: mood ?? "",
        }),
      });
      if (!res.ok) {
        if (res.status === 429) toast.error("Demasiadas peticiones, espera 1 min");
        else toast.error("Error al generar remix");
        return;
      }
      const data = await res.json() as {
        name: string; mood: string;
        palette: { primary: string; secondary: string; accent: string; dark: string };
        primaryFont: string;
      };
      setAiRemixResult(data);
      // Aplicar inmediatamente
      const fc = fabricRef.current;
      if (fc) {
        // Reusar applyPalette tratando el resultado como Palette
        const fakePalette = {
          id: "ai-" + Date.now(),
          name: data.name,
          primary: data.palette.primary,
          secondary: data.palette.secondary,
          accent: data.palette.accent,
          dark: data.palette.dark,
        };
        applyPalette(fakePalette);
        // Aplicar fuente al titulo
        fc.getObjects().forEach(obj => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cid = ((obj as any).customId as string | undefined ?? "").toLowerCase();
          if (cid.includes("title") || cid.includes("supra")) {
            (obj as Textbox).set("fontFamily", data.primaryFont);
          }
        });
        fc.requestRenderAll();
      }
      toast.success(`Estilo "${data.name}" aplicado`);
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión");
    } finally {
      setAiRemixing(false);
    }
  }, [template, authUser, toast, applyPalette]);

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
    pushHistory();
    toast.success(`Estilo ${remix.name} aplicado`);
  }, [applyPalette, toast]);

  const availablePalettes = useMemo<Palette[]>(() => getPalettesForCategory(template?.category), [template?.category]);

  // ─── Bloques de texto del template ──────────────────────────────────────
  const textBlocks = useMemo(() => blocks.filter(b => b.kind !== "footer"), [blocks]);
  const activeBlock = useMemo(() => blocks.find(b => b.id === activeBlockId), [blocks, activeBlockId]);
  const activeBlockValue = activeBlockId ? blockValues[activeBlockId] ?? "" : "";

  return (
    <div
      className="w-full flex flex-col overflow-hidden bg-[#0a0a14] text-white relative"
      style={{
        // Si el teclado esta visible, restamos su altura para que el canvas
        // + sheet queden completamente sobre el. Sino h-screen normal.
        height: kbHeight > 0 ? `calc(100vh - ${kbHeight}px)` : "100vh",
        transition: "height 0.15s ease-out",
      }}>

      {/* ═══ HEADER MINIMO (50px) ════════════════════════════════════════ */}
      <header className="h-[50px] px-2 flex items-center gap-1 border-b border-white/[0.06] shrink-0">
        <button
          onClick={() => confirmExit(null)}
          aria-label="Volver"
          className="w-9 h-9 rounded-lg flex items-center justify-center active:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.2}/>
        </button>
        <button
          className="flex-1 min-w-0 px-1 text-left active:bg-white/[0.04] rounded-md py-0.5"
          onClick={() => {
            const next = window.prompt("Nombre del flyer", docTitle || template?.title || "");
            if (next === null) return;
            const trimmed = next.trim();
            if (!trimmed) return;
            setDocTitle(trimmed);
            setSaveState("unsaved");
          }}
          aria-label="Renombrar flyer"
          title="Tap para renombrar"
        >
          <h1 className="text-[13px] font-bold leading-tight truncate">
            {docTitle || template?.title || "Cargando…"}
          </h1>
          <p className="text-[9px] text-gray-500 leading-tight">
            {canvasSize.w}×{canvasSize.h} · {saveState === "saved" ? "Guardado" : saveState === "saving" ? "Guardando…" : "Sin guardar"}
          </p>
        </button>
        <button
          aria-label="Deshacer"
          onClick={() => void handleUndo()}
          disabled={!canUndo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 active:bg-white/10 disabled:opacity-25"
        >
          <Undo2 size={17} strokeWidth={2}/>
        </button>
        <button
          aria-label="Rehacer"
          onClick={() => void handleRedo()}
          disabled={!canRedo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 active:bg-white/10 disabled:opacity-25"
        >
          <Redo2 size={17} strokeWidth={2}/>
        </button>
        <button
          aria-label="Guardar"
          onClick={handleSave}
          disabled={saveState === "saving"}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
            saveState === "saved" && currentProjectId
              ? "text-emerald-400 active:bg-white/10"
              : "text-gray-300 active:bg-white/10"
          }`}
          title={currentProjectId ? "Guardar cambios" : "Guardar nuevo diseño"}
        >
          <Save size={16} strokeWidth={2.2}/>
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
          {/* SMART GUIDES overlay — divs cyan absolute. Coords canvas → pantalla
              via zoom + viewportTransform. pointer-events none para no robar
              taps al canvas Fabric. */}
          {activeGuides.length > 0 && fabricRef.current && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {activeGuides.map((g, i) => {
                const fc = fabricRef.current!;
                const zoom = fc.getZoom();
                const vpt = fc.viewportTransform ?? [1, 0, 0, 1, 0, 0];
                if (g.axis === "v") {
                  const x = g.pos * zoom + vpt[4];
                  return <div key={i} className="absolute top-0 bottom-0 w-px bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]" style={{ left: x }}/>;
                } else {
                  const y = g.pos * zoom + vpt[5];
                  return <div key={i} className="absolute left-0 right-0 h-px bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]" style={{ top: y }}/>;
                }
              })}
            </div>
          )}
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
              onClick={() => setActiveSubTool("editar")}
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
              onClick={() => handleCenterActive("both")}
              icon={<AlignHorizontalJustifyCenter size={15} strokeWidth={2.2}/>}
              label="Centrar"
            />
            <ChipBtn
              onClick={toggleLockActive}
              icon={
                (fabricRef.current?.getActiveObject()?.lockMovementX)
                  ? <Lock size={15} strokeWidth={2.2}/>
                  : <Unlock size={15} strokeWidth={2.2}/>
              }
              label="Bloquear"
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

      {/* ═══ FOOTER — sub-tools bar (si seleccion) o bottom bar (si no) ═════
          Patron Canva: cuando hay objeto seleccionado, la barra inferior
          se reemplaza por sub-tools del objeto + check verde para cerrar.
          Si no hay seleccion, bottom bar global con 5 botones.
          ──────────────────────────────────────────────────────────────── */}
      {selectedLayerId ? (
        <div className="shrink-0 border-t border-white/[0.08] bg-[#0a0a14] safe-area-bottom">
          {/* ─── CONTENIDO del sub-tool activo (arriba de la barra) ───── */}

          {/* TEXTO ──────────────────────────────────────────────────────── */}
          {selectedType === "text" && activeSubTool === "editar" && (
            <TextEditInline
              blocks={textBlocks}
              activeBlockId={activeBlockId}
              blockValues={blockValues}
              onChange={onBlockChange}
              onSelectBlock={setActiveBlockId}
            />
          )}
          {selectedType === "text" && activeSubTool === "fuente" && (
            <FontPills
              currentFont={getActiveText()?.fontFamily as string | undefined}
              onPick={f => setTextProp("fontFamily", f)}
            />
          )}
          {selectedType === "text" && activeSubTool === "tamano" && (
            <SizeSlider
              currentSize={getActiveText()?.fontSize as number | undefined ?? 24}
              onChange={n => setTextProp("fontSize", n)}
            />
          )}
          {selectedType === "text" && activeSubTool === "color" && (
            <ColorSwatches
              currentColor={(getActiveText()?.fill as string | undefined) ?? "#ffffff"}
              onPick={setObjFill}
            />
          )}
          {selectedType === "text" && activeSubTool === "estilos" && (
            <StylePresets
              currentLineHeight={(getActiveText()?.lineHeight as number | undefined) ?? 1.16}
              currentCharSpacing={(getActiveText()?.charSpacing as number | undefined) ?? 0}
              currentStrokeWidth={(getActiveText()?.strokeWidth as number | undefined) ?? 0}
              currentStroke={(getActiveText()?.stroke as string | undefined) ?? ""}
              hasShadow={!!getActiveText()?.shadow}
              onApply={(prop, val) => setTextProp(prop as keyof Textbox, val as never)}
              onShadow={applyTextShadow}
              onOutline={applyTextOutline}
            />
          )}

          {/* IMAGEN ──────────────────────────────────────────────────────── */}
          {selectedType === "image" && activeSubTool === "reemplazar" && (
            <ReplaceImageInline onFile={handleReplaceImage}/>
          )}
          {selectedType === "image" && activeSubTool === "recortar" && (
            <CropOptionsInline onPick={applyImageCrop}/>
          )}
          {selectedType === "image" && activeSubTool === "filtros" && (
            <FilterPresetsInline
              onPick={applyImageFilter}
              brightness={getImageFilterValue("Brightness")}
              contrast={getImageFilterValue("Contrast")}
              saturation={getImageFilterValue("Saturation")}
              angle={fabricRef.current?.getActiveObject()?.angle ?? 0}
              onBrightness={(v) => setImageFilter("Brightness", { brightness: v })}
              onContrast={(v) => setImageFilter("Contrast", { contrast: v })}
              onSaturation={(v) => setImageFilter("Saturation", { saturation: v })}
              onRotation={setImageRotation}
              onFlipH={() => flipImage("x")}
              onFlipV={() => flipImage("y")}
              onCommit={pushHistory}
            />
          )}
          {selectedType === "image" && activeSubTool === "quitar-fondo" && (
            <RemoveBgInline
              loading={removingBg}
              onConfirm={handleRemoveBackground}
            />
          )}
          {selectedType === "image" && activeSubTool === "opacidad-img" && (
            <OpacitySlider
              current={fabricRef.current?.getActiveObject()?.opacity ?? 1}
              onChange={setObjOpacity}
            />
          )}

          {/* FORMA ──────────────────────────────────────────────────────── */}
          {selectedType === "shape" && activeSubTool === "fill" && (
            <ColorSwatches
              currentColor={(fabricRef.current?.getActiveObject()?.fill as string | undefined) ?? "#ffffff"}
              onPick={setObjFill}
            />
          )}
          {selectedType === "shape" && activeSubTool === "borde" && (
            <BorderInline
              currentColor={(fabricRef.current?.getActiveObject()?.stroke as string | undefined) ?? ""}
              currentWidth={fabricRef.current?.getActiveObject()?.strokeWidth ?? 0}
              onColor={c => setObjStroke(c, undefined)}
              onWidth={w => setObjStroke(undefined as unknown as string | null, w)}
              onClear={() => setObjStroke(null, 0)}
            />
          )}
          {selectedType === "shape" && activeSubTool === "opacidad-shape" && (
            <OpacitySlider
              current={fabricRef.current?.getActiveObject()?.opacity ?? 1}
              onChange={setObjOpacity}
            />
          )}
          {selectedType === "shape" && activeSubTool === "esquinas" && (
            <CornerRadiusSlider
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              current={((fabricRef.current?.getActiveObject() as any)?.rx ?? 0) as number}
              onChange={setRectCornerRadius}
              applicable={fabricRef.current?.getActiveObject()?.type === "rect"}
            />
          )}

          {/* ─── SUB-TOOLS BAR contextual al tipo ──────────────────────── */}
          <div className="h-[68px] flex items-center px-2 gap-1">
            {selectedType === "text" && (
              <>
                <SubToolBtnIcon node={<Pencil size={18} strokeWidth={2.2}/>} label="Editar" active={activeSubTool === "editar"} onClick={() => setActiveSubTool(s => s === "editar" ? null : "editar")}/>
                <SubToolBtn icon="Ff" label="Fuente" active={activeSubTool === "fuente"} onClick={() => setActiveSubTool(s => s === "fuente" ? null : "fuente")} fontStyle="italic"/>
                <SubToolBtn icon="H" label="Estilos" active={activeSubTool === "estilos"} onClick={() => setActiveSubTool(s => s === "estilos" ? null : "estilos")}/>
                <SubToolBtn icon="Aa" label="Tamaño" active={activeSubTool === "tamano"} onClick={() => setActiveSubTool(s => s === "tamano" ? null : "tamano")}/>
                <SubToolBtn icon="🎨" label="Color" active={activeSubTool === "color"} onClick={() => setActiveSubTool(s => s === "color" ? null : "color")} emoji/>
              </>
            )}
            {selectedType === "image" && (
              <>
                <SubToolBtnIcon node={<Replace size={18} strokeWidth={2.2}/>} label="Reemplazar" active={activeSubTool === "reemplazar"} onClick={() => setActiveSubTool(s => s === "reemplazar" ? null : "reemplazar")}/>
                <SubToolBtnIcon node={<Crop size={18} strokeWidth={2.2}/>} label="Recortar" active={activeSubTool === "recortar"} onClick={() => setActiveSubTool(s => s === "recortar" ? null : "recortar")}/>
                <SubToolBtnIcon node={<Sliders size={18} strokeWidth={2.2}/>} label="Filtros" active={activeSubTool === "filtros"} onClick={() => setActiveSubTool(s => s === "filtros" ? null : "filtros")}/>
                <SubToolBtnIcon node={<Eraser size={18} strokeWidth={2.2}/>} label="Quitar fondo" active={activeSubTool === "quitar-fondo"} onClick={() => setActiveSubTool(s => s === "quitar-fondo" ? null : "quitar-fondo")}/>
                <SubToolBtn icon="◐" label="Opacidad" active={activeSubTool === "opacidad-img"} onClick={() => setActiveSubTool(s => s === "opacidad-img" ? null : "opacidad-img")} emoji/>
              </>
            )}
            {selectedType === "shape" && (
              <>
                <SubToolBtn icon="🎨" label="Color" active={activeSubTool === "fill"} onClick={() => setActiveSubTool(s => s === "fill" ? null : "fill")} emoji/>
                <SubToolBtnIcon node={<Square size={18} strokeWidth={2.2}/>} label="Borde" active={activeSubTool === "borde"} onClick={() => setActiveSubTool(s => s === "borde" ? null : "borde")}/>
                <SubToolBtn icon="◐" label="Opacidad" active={activeSubTool === "opacidad-shape"} onClick={() => setActiveSubTool(s => s === "opacidad-shape" ? null : "opacidad-shape")} emoji/>
                <SubToolBtn icon="◢" label="Esquinas" active={activeSubTool === "esquinas"} onClick={() => setActiveSubTool(s => s === "esquinas" ? null : "esquinas")} emoji/>
              </>
            )}
            <button
              onClick={handleDeselect}
              aria-label="Listo"
              className="w-11 h-11 ml-1 rounded-full bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-transform shadow-lg shrink-0"
            >
              <Check size={18} strokeWidth={3}/>
            </button>
          </div>
        </div>
      ) : (
        <nav className="h-[68px] border-t border-white/[0.08] bg-[#0a0a14] flex items-center justify-around shrink-0 safe-area-bottom">
          <BarBtn
            icon={<LayoutGrid size={18} strokeWidth={2}/>}
            label="Plantillas"
            onClick={() => confirmExit("/templates")}
          />
          <BarBtn
            icon={<Plus size={20} strokeWidth={2.4}/>}
            label="Añadir"
            active={openSheet === "add"}
            onClick={() => setOpenSheet(s => s === "add" ? null : "add")}
          />
          <BarBtn
            icon={<ImageIcon size={18} strokeWidth={2}/>}
            label="Foto"
            active={openSheet === "foto"}
            onClick={() => setOpenSheet(s => s === "foto" ? null : "foto")}
          />
          <BarBtn
            icon={<PaletteIcon size={18} strokeWidth={2}/>}
            label="Estilo"
            active={openSheet === "estilo"}
            onClick={() => setOpenSheet(s => s === "estilo" ? null : "estilo")}
          />
          <BarBtn
            icon={<Sparkles size={18} strokeWidth={2}/>}
            label="Remix"
            active={openSheet === "ia"}
            onClick={() => setOpenSheet(s => s === "ia" ? null : "ia")}
          />
        </nav>
      )}

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
                {openSheet === "foto" && "Foto"}
                {openSheet === "estilo" && "Estilo"}
                {openSheet === "ia" && "Remix · 4 estilos"}
                {openSheet === "more" && "Más opciones"}
                {openSheet === "export" && "Exportar"}
                {openSheet === "add" && "Añadir elemento"}
                {openSheet === "layers" && "Capas"}
                {openSheet === "format" && "Cambiar formato"}
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

              {/* SHEET FOTO ──────────────────────────────────────────────── */}
              {openSheet === "foto" && (
                <PhotoSheet
                  fc={fabricRef.current}
                  onSelectImage={(img) => {
                    const fc = fabricRef.current;
                    if (!fc) return;
                    fc.setActiveObject(img);
                    fc.requestRenderAll();
                    // Sync con nuestro state — selection:created se disparara
                    setOpenSheet(null);
                  }}
                  onAddPhoto={async (file) => {
                    const fc = fabricRef.current;
                    if (!fc) return;
                    try {
                      const dataUrl = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                      });
                      const img = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
                      // Centrar y escalar para que quepa al 40% del canvas
                      const maxDim = Math.min(canvasSize.w, canvasSize.h) * 0.4;
                      const w = img.width ?? 1;
                      const h = img.height ?? 1;
                      const scale = Math.min(maxDim / w, maxDim / h);
                      img.set({
                        left: canvasSize.w / 2 - (w * scale) / 2,
                        top: canvasSize.h / 2 - (h * scale) / 2,
                        scaleX: scale,
                        scaleY: scale,
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
                      fc.add(img);
                      fc.setActiveObject(img);
                      fc.requestRenderAll();
                      setSaveState("unsaved");
                      pushHistory();
                      setOpenSheet(null);
                      toast.success("Foto añadida");
                    } catch (e) {
                      console.error(e);
                      toast.error("No se pudo añadir la foto");
                    }
                  }}
                />
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

                  {/* BLOQUE IA — botones contextuales */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Wand2 size={14} className="text-purple-300"/>
                      <span className="text-[12px] font-bold text-purple-200">Generar con IA</span>
                      <span className="text-[9px] uppercase tracking-widest text-purple-400 ml-auto">Beta</span>
                    </div>
                    {aiRemixResult && (
                      <div className="px-2.5 py-2 rounded-lg bg-black/30 border border-purple-500/20 flex items-center gap-2">
                        <div className="flex gap-1 shrink-0">
                          <div className="w-3 h-3 rounded-full" style={{ background: aiRemixResult.palette.primary }}/>
                          <div className="w-3 h-3 rounded-full" style={{ background: aiRemixResult.palette.secondary }}/>
                          <div className="w-3 h-3 rounded-full" style={{ background: aiRemixResult.palette.accent }}/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold truncate">{aiRemixResult.name}</div>
                          <div className="text-[9px] text-gray-400 truncate">{aiRemixResult.mood}</div>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => void requestAIRemix()}
                        disabled={aiRemixing}
                        className="py-2 rounded-lg bg-purple-500 text-white text-[11px] font-bold active:scale-[0.96] disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Sparkles size={12} strokeWidth={2.5}/>
                        {aiRemixing ? "…" : "Sorpréndeme"}
                      </button>
                      <button
                        onClick={() => void requestAIRemix("vibrante neón")}
                        disabled={aiRemixing}
                        className="py-2 rounded-lg bg-white/[0.06] text-gray-200 text-[11px] font-bold active:scale-[0.96] disabled:opacity-50"
                      >
                        Neón
                      </button>
                      <button
                        onClick={() => void requestAIRemix("elegante sobrio")}
                        disabled={aiRemixing}
                        className="py-2 rounded-lg bg-white/[0.06] text-gray-200 text-[11px] font-bold active:scale-[0.96] disabled:opacity-50"
                      >
                        Elegante
                      </button>
                      <button
                        onClick={() => void requestAIRemix("vintage retro")}
                        disabled={aiRemixing}
                        className="py-2 rounded-lg bg-white/[0.06] text-gray-200 text-[11px] font-bold active:scale-[0.96] disabled:opacity-50"
                      >
                        Vintage
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    Estilos curados
                  </div>
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
                  <MoreRowLink
                    icon={<Layers size={18}/>}
                    label="Capas"
                    subtitle="Ver y organizar elementos del flyer"
                    onClick={() => setOpenSheet("layers")}
                  />
                  <MoreRowLink
                    icon={<FolderOpen size={18}/>}
                    label="Mis flyers"
                    subtitle="Volver a tus diseños guardados"
                    onClick={() => { setOpenSheet(null); router.push("/projects"); }}
                  />
                  <MoreRow icon={<Wand2 size={18}/>} label="Asistente IA" subtitle="Genera variaciones desde texto" disabled/>
                  <MoreRowLink
                    icon={<LayoutGrid size={18}/>}
                    label="Cambiar formato"
                    subtitle="Story 9:16, Post 4:5, etc."
                    onClick={() => setOpenSheet("format")}
                  />
                  <MoreRowLink
                    icon={<XIcon size={18}/>}
                    label="Reiniciar plantilla"
                    subtitle="Volver al diseño original"
                    onClick={handleResetTemplate}
                  />
                </div>
              )}

              {/* SHEET EXPORT (multi-formato) ───────────────────────────── */}
              {openSheet === "export" && template && (
                <ExportMultiFormatSheet
                  template={template}
                  currentFormat={formatId}
                  exporting={exporting}
                  fileFormat={exportFileFormat}
                  onFileFormatChange={setExportFileFormat}
                  onExportOne={exportSingleFormat}
                  onExportAll={exportAllFormats}
                />
              )}

              {/* SHEET AÑADIR ────────────────────────────────────────────── */}
              {openSheet === "add" && (
                <AddElementSheet
                  onAddText={addText}
                  onAddShape={addShape}
                  onAddImage={addImageFromFile}
                />
              )}

              {/* SHEET CAMBIAR FORMATO ──────────────────────────────────── */}
              {openSheet === "format" && template && (
                <ChangeFormatSheet
                  template={template}
                  currentFormat={formatId}
                  onSelect={(fmt) => { setOpenSheet(null); void handleChangeFormat(fmt); }}
                />
              )}

              {/* SHEET CAPAS ────────────────────────────────────────────── */}
              {openSheet === "layers" && (
                <LayersSheet
                  fc={fabricRef.current}
                  onSelect={(obj) => {
                    const fc = fabricRef.current;
                    if (!fc) return;
                    fc.setActiveObject(obj);
                    fc.requestRenderAll();
                    setOpenSheet(null);
                  }}
                  onMutate={() => {
                    setSaveState("unsaved");
                    pushHistory();
                  }}
                />
              )}

            </div>
          </div>
        </>
      )}

      {/* ═══ SHARE MODAL — Compartir tras descargar (Fase H) ═══════════ */}
      {shareOpen && (
        <ShareModal
          flyerTitle={docTitle || template?.title || "Mi flyer"}
          uploading={shareUploading}
          shareUrl={shareUrl}
          ensureSharedUrl={ensureSharedUrl}
          lastExportedDataUrl={lastExportedDataUrl}
          onClose={() => setShareOpen(false)}
        />
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

function MoreRowLink({
  icon, label, subtitle, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2.5 rounded-xl bg-[#13131f] border border-white/[0.06] flex items-center gap-3 active:bg-[#1c1c2a] transition-colors text-left w-full"
    >
      <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-300 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold">{label}</div>
        <div className="text-[11px] text-gray-500">{subtitle}</div>
      </div>
    </button>
  );
}

// ─── Sub-tools inline components (patron Canva) ────────────────────────

function SubToolBtn({
  icon, label, active, onClick, fontStyle, emoji,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
  fontStyle?: string;
  emoji?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 rounded-lg ${active ? "bg-purple-500/12 text-purple-300" : "text-gray-300"}`}
    >
      <div
        className="text-[18px] font-bold leading-none"
        style={{ fontStyle, fontFamily: emoji ? undefined : "Georgia, serif" }}
      >
        {icon}
      </div>
      <span className="text-[9px] font-semibold">{label}</span>
    </button>
  );
}

/** Editar inline — muestra los bloques editables como pills horizontales
 *  + input grande del bloque activo. Sustituye al sheet grande. */
function TextEditInline({
  blocks, activeBlockId, blockValues, onChange, onSelectBlock,
}: {
  blocks: EditableBlock[];
  activeBlockId: string | null;
  blockValues: Record<string, string>;
  onChange: (b: EditableBlock, v: string) => void;
  onSelectBlock: (id: string | null) => void;
}) {
  const active = blocks.find(b => b.id === activeBlockId) ?? blocks[0];
  const value = active ? blockValues[active.id] ?? "" : "";
  return (
    <div className="border-b border-white/[0.06] flex flex-col gap-2 px-3 pt-2.5 pb-3">
      {/* Pills de bloques disponibles */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {blocks.map(b => {
          const isAct = active?.id === b.id;
          return (
            <button
              key={b.id}
              onClick={() => onSelectBlock(b.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ${isAct ? "bg-purple-500 text-white" : "bg-white/[0.05] text-gray-300"}`}
            >
              {b.label}
            </button>
          );
        })}
      </div>
      {/* Input del bloque activo */}
      {active && (
        <input
          type="text"
          value={value}
          onChange={e => onChange(active, e.target.value)}
          placeholder={active.placeholder}
          autoFocus
          style={{ fontSize: 16 }}
          className="w-full bg-[#0a0a14] border border-purple-500/40 rounded-xl px-3 py-2.5 text-white font-medium outline-none focus:border-purple-500"
        />
      )}
    </div>
  );
}

/** Fuentes — pills scroll horizontal con preview de cada fuente. */
const AVAILABLE_FONTS = [
  "Anton", "Bebas Neue", "Playfair Display", "Cormorant Garamond",
  "Montserrat", "Inter", "Oswald", "Roboto Condensed",
];
function FontPills({ currentFont, onPick }: { currentFont?: string; onPick: (f: string) => void }) {
  return (
    <div className="border-b border-white/[0.06] flex gap-2 overflow-x-auto scrollbar-hide px-3 py-3">
      {AVAILABLE_FONTS.map(f => {
        const isAct = currentFont === f;
        return (
          <button
            key={f}
            onClick={() => onPick(f)}
            className={`shrink-0 px-4 py-2 rounded-full border-2 whitespace-nowrap text-[15px] ${isAct ? "border-purple-500 bg-purple-500/15 text-purple-200" : "border-transparent bg-white/[0.05] text-white"}`}
            style={{ fontFamily: f }}
          >
            {f}
          </button>
        );
      })}
    </div>
  );
}

/** Tamaño — slider compacto rango 8-200. */
function SizeSlider({ currentSize, onChange }: { currentSize: number; onChange: (n: number) => void }) {
  return (
    <div className="border-b border-white/[0.06] px-4 py-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] text-gray-400 font-semibold">Tamaño</span>
        <span className="text-[11px] text-purple-400 font-bold">{Math.round(currentSize)} px</span>
      </div>
      <input
        type="range"
        min={8} max={200} step={1}
        value={currentSize}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-purple-500"
      />
    </div>
  );
}

/** Color — swatches scroll horizontal. */
const QUICK_COLORS = [
  "#ffffff", "#000000", "#a855f7", "#ec4899", "#facc15", "#22d3ee",
  "#22c55e", "#ef4444", "#fb923c", "#3b82f6", "#fef3c7", "#d8b4fe",
];
function ColorSwatches({ currentColor, onPick }: { currentColor: string; onPick: (c: string) => void }) {
  return (
    <div className="border-b border-white/[0.06] flex gap-2 overflow-x-auto scrollbar-hide px-3 py-3">
      {QUICK_COLORS.map(c => {
        const isAct = currentColor.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            onClick={() => onPick(c)}
            aria-label={`Color ${c}`}
            className={`shrink-0 w-9 h-9 rounded-full border-2 ${isAct ? "border-purple-400 scale-110" : "border-white/15"} transition-transform`}
            style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
          />
        );
      })}
    </div>
  );
}

/** Variante de SubToolBtn que renderiza un ReactNode (icono lucide) en
 *  lugar de un caracter. Mantiene mismo estilo visual. */
function SubToolBtnIcon({
  node, label, active, onClick,
}: {
  node: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 rounded-lg ${active ? "bg-purple-500/12 text-purple-300" : "text-gray-300"}`}
    >
      <div className="h-[18px] flex items-center justify-center">{node}</div>
      <span className="text-[9px] font-semibold whitespace-nowrap">{label}</span>
    </button>
  );
}

/** Estilos preset — Bold/Italic/Underline + Alineacion + Sombra/Outline +
 *  Interlineado + Espaciado letras. Fase K — texto avanzado. */
function StylePresets({
  currentLineHeight, currentCharSpacing, currentStrokeWidth, currentStroke, hasShadow,
  onApply, onShadow, onOutline,
}: {
  currentLineHeight: number;
  currentCharSpacing: number;
  currentStrokeWidth: number;
  currentStroke: string;
  hasShadow: boolean;
  onApply: (prop: string, val: string | boolean | number) => void;
  onShadow: (mode: "none" | "soft" | "strong" | "glow") => void;
  onOutline: (width: number, color?: string) => void;
}) {
  return (
    <div className="border-b border-white/[0.06] flex flex-col gap-3 px-3 py-3 max-h-[55vh] overflow-y-auto">
      {/* Fila 1 — Formato basico */}
      <div className="flex gap-2">
        <button onClick={() => onApply("fontWeight", "900")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white font-black" aria-label="Negrita">B</button>
        <button onClick={() => onApply("fontStyle", "italic")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white italic font-bold" aria-label="Cursiva">I</button>
        <button onClick={() => onApply("underline", true)} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white underline font-bold" aria-label="Subrayado">U</button>
      </div>
      {/* Fila 2 — Alineacion + Reset */}
      <div className="flex gap-2">
        <button onClick={() => onApply("textAlign", "left")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold" aria-label="Alinear a la izquierda">⇤</button>
        <button onClick={() => onApply("textAlign", "center")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold" aria-label="Centrar">⇔</button>
        <button onClick={() => onApply("textAlign", "right")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold" aria-label="Alinear a la derecha">⇥</button>
        <button
          onClick={() => {
            onApply("fontWeight", "400");
            onApply("fontStyle", "normal");
            onApply("underline", false);
            onShadow("none");
            onOutline(0);
          }}
          className="flex-1 py-2 rounded-xl bg-white/[0.05] text-gray-400 text-[11px]"
          aria-label="Restablecer formato"
        >Reset</button>
      </div>

      {/* Sombra & glow */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
          <span>Sombra</span>
          {hasShadow && <span className="text-emerald-400 normal-case tracking-normal text-[10px]">Activa</span>}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <ShadowBtn label="Ninguna" preview="—" onClick={() => onShadow("none")}/>
          <ShadowBtn label="Suave" preview="aA" textShadow="2px 2px 4px rgba(0,0,0,0.6)" onClick={() => onShadow("soft")}/>
          <ShadowBtn label="Fuerte" preview="aA" textShadow="4px 4px 8px rgba(0,0,0,0.9)" onClick={() => onShadow("strong")}/>
          <ShadowBtn label="Glow" preview="aA" textShadow="0 0 12px #a855f7" textColor="#a855f7" onClick={() => onShadow("glow")}/>
        </div>
      </div>

      {/* Outline */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Borde texto</span>
          <span className="text-[10px] text-purple-400 font-bold">{Math.round(currentStrokeWidth)} px</span>
        </div>
        <input
          type="range"
          min={0} max={10} step={0.5}
          value={currentStrokeWidth}
          onChange={e => onOutline(Number(e.target.value), currentStroke || "#000000")}
          className="w-full accent-purple-500"
        />
        {currentStrokeWidth > 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {["#000000", "#ffffff", "#a855f7", "#ec4899", "#facc15", "#22d3ee", "#22c55e", "#ef4444"].map(c => (
              <button
                key={c}
                onClick={() => onOutline(currentStrokeWidth, c)}
                className={`shrink-0 w-7 h-7 rounded-full border-2 ${currentStroke?.toLowerCase() === c ? "border-purple-400 scale-110" : "border-white/20"} transition-transform`}
                style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
                aria-label={`Color borde ${c}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interlineado */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Interlineado</span>
          <span className="text-[10px] text-purple-400 font-bold">{currentLineHeight.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.8} max={2.5} step={0.05}
          value={currentLineHeight}
          onChange={e => onApply("lineHeight", Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>

      {/* Espaciado letras */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Espaciado letras</span>
          <span className="text-[10px] text-purple-400 font-bold">{Math.round(currentCharSpacing)}</span>
        </div>
        <input
          type="range"
          min={-50} max={500} step={5}
          value={currentCharSpacing}
          onChange={e => onApply("charSpacing", Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>
    </div>
  );
}

function ShadowBtn({
  label, preview, textShadow, textColor, onClick,
}: {
  label: string;
  preview: string;
  textShadow?: string;
  textColor?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white/[0.04] active:scale-[0.96] transition-transform"
    >
      <span
        className="text-[18px] font-black"
        style={{ textShadow, color: textColor ?? "#ffffff" }}
      >
        {preview}
      </span>
      <span className="text-[9px] text-gray-400 font-semibold">{label}</span>
    </button>
  );
}

// ─── IMAGEN ────────────────────────────────────────────────────────────────

/** Reemplazar imagen — file input que carga local desde galeria/camara. */
function ReplaceImageInline({ onFile }: { onFile: (f: File) => void }) {
  return (
    <div className="border-b border-white/[0.06] px-4 py-3">
      <label className="block">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <span className="block w-full py-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-200 text-[13px] font-bold text-center active:scale-[0.98] transition-transform">
          Elegir imagen de tu galería
        </span>
      </label>
      <p className="text-[10px] text-gray-500 text-center mt-2">
        Se mantiene la posición y el tamaño actuales
      </p>
    </div>
  );
}

/** Recortar — 3 opciones de máscara. */
function CropOptionsInline({ onPick }: { onPick: (s: "square" | "circle" | "rounded") => void }) {
  const opts: Array<{ id: "square" | "circle" | "rounded"; label: string; mask: string }> = [
    { id: "square", label: "Cuadrado", mask: "rounded-none" },
    { id: "rounded", label: "Redondeado", mask: "rounded-2xl" },
    { id: "circle", label: "Círculo", mask: "rounded-full" },
  ];
  return (
    <div className="border-b border-white/[0.06] flex gap-2 px-3 py-3">
      {opts.map(o => (
        <button
          key={o.id}
          onClick={() => onPick(o.id)}
          className="flex-1 flex flex-col items-center gap-1.5 py-2"
        >
          <div className={`w-12 h-12 bg-gradient-to-br from-purple-500 to-fuchsia-500 ${o.mask}`}/>
          <span className="text-[10px] text-gray-300 font-semibold">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Filtros — 5 presets + sliders ajuste fino + rotacion + flip. */
function FilterPresetsInline({
  onPick, brightness, contrast, saturation, angle,
  onBrightness, onContrast, onSaturation, onRotation,
  onFlipH, onFlipV, onCommit,
}: {
  onPick: (p: "none" | "bw" | "warm" | "cool" | "vintage") => void;
  brightness: number;
  contrast: number;
  saturation: number;
  angle: number;
  onBrightness: (v: number) => void;
  onContrast: (v: number) => void;
  onSaturation: (v: number) => void;
  onRotation: (v: number) => void;
  onFlipH: () => void;
  onFlipV: () => void;
  onCommit: () => void;
}) {
  const presets: Array<{ id: "none" | "bw" | "warm" | "cool" | "vintage"; label: string; bg: string }> = [
    { id: "none", label: "Original", bg: "linear-gradient(135deg,#a855f7,#ec4899)" },
    { id: "bw", label: "B&N", bg: "linear-gradient(135deg,#333,#999)" },
    { id: "warm", label: "Cálido", bg: "linear-gradient(135deg,#f97316,#facc15)" },
    { id: "cool", label: "Frío", bg: "linear-gradient(135deg,#06b6d4,#3b82f6)" },
    { id: "vintage", label: "Vintage", bg: "linear-gradient(135deg,#92400e,#fde68a)" },
  ];
  return (
    <div className="border-b border-white/[0.06] flex flex-col gap-3 px-3 py-3 max-h-[55vh] overflow-y-auto">
      {/* Presets — fila scroll horizontal */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Presets</div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => onPick(p.id)}
              className="shrink-0 flex flex-col items-center gap-1.5"
            >
              <div className="w-12 h-12 rounded-xl border-2 border-white/10" style={{ background: p.bg }}/>
              <span className="text-[9px] text-gray-300 font-semibold">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ajuste fino */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ajuste fino</div>
        <AdjustSlider label="Brillo"      value={brightness} min={-0.5} max={0.5} step={0.02} display={Math.round(brightness * 100)} onChange={onBrightness} onCommit={onCommit}/>
        <AdjustSlider label="Contraste"   value={contrast}   min={-0.5} max={0.5} step={0.02} display={Math.round(contrast * 100)}   onChange={onContrast}   onCommit={onCommit}/>
        <AdjustSlider label="Saturación"  value={saturation} min={-1}   max={1}   step={0.05} display={Math.round(saturation * 100)} onChange={onSaturation} onCommit={onCommit}/>
      </div>

      {/* Rotacion + flip */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rotar / voltear</div>
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-gray-400 font-semibold">Rotación</span>
            <span className="text-[11px] text-purple-400 font-bold">{Math.round(angle)}°</span>
          </div>
          <input
            type="range"
            min={-180} max={180} step={1}
            value={angle}
            onChange={e => onRotation(Number(e.target.value))}
            onMouseUp={onCommit}
            onTouchEnd={onCommit}
            className="w-full accent-purple-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onFlipH}
            className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold flex items-center justify-center gap-1.5"
            aria-label="Voltear horizontal"
          >
            ↔ Horizontal
          </button>
          <button
            onClick={onFlipV}
            className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold flex items-center justify-center gap-1.5"
            aria-label="Voltear vertical"
          >
            ↕ Vertical
          </button>
        </div>
      </div>
    </div>
  );
}

/** Slider de ajuste con label + valor + commit al soltar.
 *  Usado para brillo/contraste/saturacion. */
function AdjustSlider({
  label, value, min, max, step, display, onChange, onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: number;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-[11px] text-gray-400 font-semibold">{label}</span>
        <span className={`text-[11px] font-bold ${display === 0 ? "text-gray-500" : "text-purple-400"}`}>
          {display > 0 ? "+" : ""}{display}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="w-full accent-purple-500"
      />
    </div>
  );
}

/** Quitar fondo — CTA real al endpoint /api/refine-hd. Muestra loading
 *  spinner mientras la IA procesa (~2-4s). */
function RemoveBgInline({
  loading, onConfirm,
}: {
  loading: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="border-b border-white/[0.06] px-4 py-4 flex flex-col items-center gap-2.5 text-center">
      <div className="w-11 h-11 rounded-full bg-purple-500/15 flex items-center justify-center text-purple-300">
        {loading ? (
          <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"/>
        ) : (
          <Eraser size={22}/>
        )}
      </div>
      <p className="text-[12px] text-gray-200 font-semibold">
        {loading ? "Eliminando fondo…" : "Quitar fondo con IA"}
      </p>
      <p className="text-[10px] text-gray-500 leading-snug max-w-[280px]">
        {loading
          ? "Esto tarda 2-4 segundos. No cierres la app."
          : "BRIA detecta el sujeto automáticamente y elimina el fondo. Funciona mejor con fotos de personas u objetos centrados."
        }
      </p>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="mt-1 px-5 py-2 rounded-xl bg-purple-500 text-white text-[12px] font-bold active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        <Sparkles size={13} strokeWidth={2.5}/>
        {loading ? "Procesando…" : "Quitar fondo ahora"}
      </button>
    </div>
  );
}

// ─── COMUNES (Opacidad / Borde / Esquinas) ────────────────────────────────

/** Opacidad — slider 0-100. */
function OpacitySlider({ current, onChange }: { current: number; onChange: (n: number) => void }) {
  const pct = Math.round(current * 100);
  return (
    <div className="border-b border-white/[0.06] px-4 py-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] text-gray-400 font-semibold">Opacidad</span>
        <span className="text-[11px] text-purple-400 font-bold">{pct}%</span>
      </div>
      <input
        type="range"
        min={0} max={100} step={1}
        value={pct}
        onChange={e => onChange(Number(e.target.value) / 100)}
        className="w-full accent-purple-500"
      />
    </div>
  );
}

/** Borde — swatch color + slider grosor + boton Quitar. */
function BorderInline({
  currentColor, currentWidth, onColor, onWidth, onClear,
}: {
  currentColor: string;
  currentWidth: number;
  onColor: (c: string) => void;
  onWidth: (w: number) => void;
  onClear: () => void;
}) {
  return (
    <div className="border-b border-white/[0.06] flex flex-col gap-3 px-3 py-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {QUICK_COLORS.map(c => {
          const isAct = currentColor.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              onClick={() => onColor(c)}
              aria-label={`Color borde ${c}`}
              className={`shrink-0 w-9 h-9 rounded-full border-2 ${isAct ? "border-purple-400 scale-110" : "border-white/15"} transition-transform`}
              style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
            />
          );
        })}
      </div>
      <div className="px-1">
        <div className="flex justify-between mb-1">
          <span className="text-[11px] text-gray-400 font-semibold">Grosor</span>
          <span className="text-[11px] text-purple-400 font-bold">{Math.round(currentWidth)} px</span>
        </div>
        <input
          type="range"
          min={0} max={30} step={1}
          value={currentWidth}
          onChange={e => onWidth(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
      </div>
      <button
        onClick={onClear}
        className="self-start text-[11px] px-3 py-1.5 rounded-full bg-white/[0.05] text-gray-300 font-semibold"
      >
        Quitar borde
      </button>
    </div>
  );
}

/** Sheet Exportar multi-formato — grid de variants del template + descargas. */
function ExportMultiFormatSheet({
  template, currentFormat, exporting, fileFormat, onFileFormatChange, onExportOne, onExportAll,
}: {
  template: Template;
  currentFormat: FormatId | undefined;
  exporting: boolean;
  fileFormat: "png" | "jpg";
  onFileFormatChange: (f: "png" | "jpg") => void;
  onExportOne: (f: FormatId) => void;
  onExportAll: () => void;
}) {
  const available: FormatId[] = PUBLIC_FORMATS.filter(fmt =>
    !!template.variants.find(v => v.format === fmt)
  );
  return (
    <div className="flex flex-col gap-4">
      {/* Toggle PNG/JPG */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Tipo de archivo
        </div>
        <div className="flex gap-2 p-1 rounded-xl bg-black/30 border border-white/[0.06]">
          <button
            onClick={() => onFileFormatChange("png")}
            className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-colors ${
              fileFormat === "png"
                ? "bg-purple-500 text-white shadow-md"
                : "text-gray-400 active:bg-white/[0.05]"
            }`}
          >
            PNG
            <span className="block text-[9px] font-normal opacity-70 mt-0.5">Calidad máxima</span>
          </button>
          <button
            onClick={() => onFileFormatChange("jpg")}
            className={`flex-1 py-2 rounded-lg text-[12px] font-bold transition-colors ${
              fileFormat === "jpg"
                ? "bg-purple-500 text-white shadow-md"
                : "text-gray-400 active:bg-white/[0.05]"
            }`}
          >
            JPG
            <span className="block text-[9px] font-normal opacity-70 mt-0.5">Archivo ligero</span>
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
          {fileFormat === "png"
            ? "PNG sin pérdida. Texto nítido y bordes perfectos. Ideal imprimir o subir a Instagram en alta."
            : "JPG comprimido (~5× más liviano). Ideal WhatsApp y rapidez. Puede mostrar artefactos en texto fino."
          }
        </p>
      </div>

      <p className="text-[12px] text-gray-400 leading-relaxed">
        Esta plantilla tiene <span className="text-purple-300 font-bold">{available.length}</span> formato{available.length === 1 ? "" : "s"} disponible{available.length === 1 ? "" : "s"}.
        Los textos editados se mantienen al cambiar de formato.
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {available.map(fmtId => {
          const fmt = FORMATS[fmtId];
          const isCurrent = fmtId === currentFormat;
          const aspect = fmt.width / fmt.height;
          // Caja preview proporcional, max 70% del ancho del card
          const w = aspect >= 1 ? 70 : aspect * 70;
          const h = aspect >= 1 ? 70 / aspect : 70;
          const Icon = fmt.icon;
          return (
            <div
              key={fmtId}
              className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-2 ${isCurrent ? "border-purple-500 bg-purple-500/5" : "border-white/[0.06] bg-[#13131f]"}`}
            >
              <div
                className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 rounded-lg flex items-center justify-center text-purple-300"
                style={{ width: w, height: h }}
              >
                <Icon size={20}/>
              </div>
              <div className="text-center">
                <div className="text-[12px] font-bold leading-tight">{fmt.name}</div>
                <div className="text-[10px] text-gray-500">{fmt.description}</div>
              </div>
              <button
                onClick={() => onExportOne(fmtId)}
                disabled={exporting}
                className="w-full mt-1 py-1.5 rounded-lg bg-purple-500/15 text-purple-200 text-[11px] font-bold active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                Descargar {fileFormat.toUpperCase()}
              </button>
              {isCurrent && (
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                  Editado
                </span>
              )}
            </div>
          );
        })}
      </div>

      {available.length > 1 && (
        <button
          onClick={onExportAll}
          disabled={exporting}
          className="w-full py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white text-[14px] font-bold active:scale-[0.98] transition-transform shadow-lg shadow-purple-500/30 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Download size={16} strokeWidth={2.4}/>
          {exporting ? "Exportando…" : `Descargar los ${available.length} formatos`}
        </button>
      )}

      <p className="text-[10px] text-gray-500 leading-snug">
        Los formatos distintos al actual ({currentFormat ? FORMATS[currentFormat].name : "n/a"}) se renderizan con la maquetación original de la plantilla — paleta, remix e imágenes subidas solo se preservan en el formato actual.
      </p>
    </div>
  );
}

/** Sheet Foto — lista thumbnails de imagenes del canvas + boton añadir. */
function PhotoSheet({
  fc, onSelectImage, onAddPhoto,
}: {
  fc: FabricCanvas | null;
  onSelectImage: (img: FabricImage) => void;
  onAddPhoto: (file: File) => void;
}) {
  // Snapshot de imagenes en render. Sin reactividad porque el sheet se
  // monta/desmonta al abrir y siempre lee el state actual.
  const images = (fc?.getObjects().filter(o => o.type === "image") ?? []) as FabricImage[];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
          Fotos del flyer ({images.length})
        </div>
        {images.length === 0 ? (
          <p className="text-[12px] text-gray-500 italic">Esta plantilla no tiene fotos.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {images.map((img, idx) => {
              const el = img.getElement() as HTMLImageElement;
              const src = el?.src;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const cid = (img as any).customId as string | undefined;
              return (
                <button
                  key={cid ?? idx}
                  onClick={() => onSelectImage(img)}
                  className="aspect-square rounded-xl overflow-hidden bg-[#0a0a14] border-2 border-white/[0.08] active:border-purple-500 transition-colors"
                  aria-label={`Editar foto ${idx + 1}`}
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" crossOrigin="anonymous" className="w-full h-full object-cover"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <ImageIcon size={20}/>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          Tap en una foto para editarla (reemplazar, recortar, filtros, opacidad).
        </p>
      </div>

      <div className="pt-2 border-t border-white/[0.06]">
        <label className="block">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) onAddPhoto(f);
            }}
          />
          <span className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-200 text-[13px] font-bold active:scale-[0.98] transition-transform">
            <ImageIcon size={16}/>
            Subir foto nueva
          </span>
        </label>
        <p className="text-[10px] text-gray-500 text-center mt-2">
          Se añade al centro del flyer y queda seleccionada para moverla.
        </p>
      </div>
    </div>
  );
}

/** Esquinas — slider 0-100. Solo aplica a Rect; deshabilitado en otros. */
function CornerRadiusSlider({
  current, onChange, applicable,
}: {
  current: number;
  onChange: (n: number) => void;
  applicable: boolean;
}) {
  if (!applicable) {
    return (
      <div className="border-b border-white/[0.06] px-4 py-4 text-center text-[12px] text-gray-400">
        Las esquinas redondeadas solo aplican a rectángulos.
      </div>
    );
  }
  return (
    <div className="border-b border-white/[0.06] px-4 py-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] text-gray-400 font-semibold">Esquinas</span>
        <span className="text-[11px] text-purple-400 font-bold">{Math.round(current)} px</span>
      </div>
      <input
        type="range"
        min={0} max={200} step={1}
        value={current}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-purple-500"
      />
    </div>
  );
}

// ─── Sheet CAMBIAR FORMATO (Fase M.1) ────────────────────────────────────

/** Sheet con grid de formatos disponibles del template. Tap navega al
 *  mismo proyecto con el formato nuevo. Marca el actual con border. */
function ChangeFormatSheet({
  template, currentFormat, onSelect,
}: {
  template: Template;
  currentFormat: FormatId | undefined;
  onSelect: (f: FormatId) => void;
}) {
  const available: FormatId[] = PUBLIC_FORMATS.filter(fmt =>
    !!template.variants.find(v => v.format === fmt)
  );
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-gray-400 leading-relaxed">
        Cambia el tamaño y proporción del flyer manteniendo el contenido.
        Si tienes cambios sin guardar se guardan antes de cambiar.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {available.map(fmtId => {
          const fmt = FORMATS[fmtId];
          const isCurrent = fmtId === currentFormat;
          const aspect = fmt.width / fmt.height;
          const w = aspect >= 1 ? 80 : aspect * 80;
          const h = aspect >= 1 ? 80 / aspect : 80;
          const Icon = fmt.icon;
          return (
            <button
              key={fmtId}
              onClick={() => !isCurrent && onSelect(fmtId)}
              disabled={isCurrent}
              className={`rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all ${
                isCurrent
                  ? "border-emerald-500 bg-emerald-500/5 cursor-default"
                  : "border-white/[0.06] bg-[#13131f] active:scale-[0.97]"
              }`}
            >
              <div
                className={`rounded-lg flex items-center justify-center ${
                  isCurrent ? "bg-emerald-500/15 text-emerald-300" : "bg-purple-500/15 text-purple-300"
                }`}
                style={{ width: w, height: h }}
              >
                <Icon size={22}/>
              </div>
              <div className="text-center">
                <div className="text-[12px] font-bold leading-tight">{fmt.name}</div>
                <div className="text-[10px] text-gray-500">{fmt.description}</div>
              </div>
              {isCurrent && (
                <span className="text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
                  Actual
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sheet AÑADIR ELEMENTO (Fase I.1) ────────────────────────────────────

/** Sheet para añadir texto/forma/imagen nuevos al canvas. */
function AddElementSheet({
  onAddText, onAddShape, onAddImage,
}: {
  onAddText: (variant: "title" | "subtitle" | "body") => void;
  onAddShape: (kind: "rect" | "circle" | "triangle" | "heart" | "star" | "line") => void;
  onAddImage: (file: File) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Texto */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Texto
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onAddText("title")}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-[#13131f] border border-white/[0.06] active:scale-[0.97] transition-transform"
          >
            <span className="text-[20px] font-black text-white" style={{ fontFamily: "Anton" }}>T</span>
            <span className="text-[10px] text-gray-400 font-semibold">Título</span>
          </button>
          <button
            onClick={() => onAddText("subtitle")}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-[#13131f] border border-white/[0.06] active:scale-[0.97] transition-transform"
          >
            <span className="text-[16px] font-bold text-white" style={{ fontFamily: "Bebas Neue" }}>S</span>
            <span className="text-[10px] text-gray-400 font-semibold">Subtítulo</span>
          </button>
          <button
            onClick={() => onAddText("body")}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-[#13131f] border border-white/[0.06] active:scale-[0.97] transition-transform"
          >
            <span className="text-[14px] text-white">Aa</span>
            <span className="text-[10px] text-gray-400 font-semibold">Cuerpo</span>
          </button>
        </div>
      </div>

      {/* Formas */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Formas
        </div>
        <div className="grid grid-cols-6 gap-2">
          <ShapeBtn icon={<SquareIcon size={18} fill="currentColor"/>} label="Rect" onClick={() => onAddShape("rect")}/>
          <ShapeBtn icon={<CircleIcon size={18} fill="currentColor"/>} label="Círculo" onClick={() => onAddShape("circle")}/>
          <ShapeBtn icon={<Triangle size={18} fill="currentColor"/>} label="Triáng." onClick={() => onAddShape("triangle")}/>
          <ShapeBtn icon={<Heart size={18} fill="currentColor"/>} label="Corazón" onClick={() => onAddShape("heart")}/>
          <ShapeBtn icon={<Star size={18} fill="currentColor"/>} label="Estrella" onClick={() => onAddShape("star")}/>
          <ShapeBtn icon={<div className="w-4 h-0.5 bg-current"/>} label="Línea" onClick={() => onAddShape("line")}/>
        </div>
      </div>

      {/* Imagen nueva */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Imagen
        </div>
        <label className="block">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) onAddImage(f);
            }}
          />
          <span className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-200 text-[13px] font-bold active:scale-[0.98] transition-transform">
            <ImageIcon size={16}/>
            Subir foto de tu galería
          </span>
        </label>
      </div>

      <p className="text-[10px] text-gray-500 leading-snug text-center pt-1">
        El elemento se añade centrado y queda seleccionado para editarlo.
      </p>
    </div>
  );
}

function ShapeBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="aspect-square flex flex-col items-center justify-center gap-1 rounded-xl bg-[#13131f] border border-white/[0.06] text-purple-300 active:scale-[0.95] transition-transform"
    >
      {icon}
      <span className="text-[8px] text-gray-400 font-semibold leading-none">{label}</span>
    </button>
  );
}

// ─── Sheet CAPAS (Fase I.2) ──────────────────────────────────────────────

/** Sheet con lista de todos los objetos del canvas, ordenados de superior
 *  a inferior. Permite seleccionar, mover capa, toggle visibility, lock. */
function LayersSheet({
  fc, onSelect, onMutate,
}: {
  fc: FabricCanvas | null;
  onSelect: (obj: FabricObject) => void;
  onMutate: () => void;
}) {
  // Forzar re-render cuando el usuario hace cambios en la sheet
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  // Lista invertida (Fabric renderiza index 0 abajo, en UI mostramos arriba).
  // Dep en tick para invalidar el memo cuando se reordenan capas.
  const objects = useMemo(() => {
    if (!fc) return [];
    return [...fc.getObjects()].reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fc, tick]);

  const visibleObjects = objects.filter(o => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cid = ((o as any).customId as string | undefined ?? "").toLowerCase();
    // Fondos siguen ocultos del panel — son shapes globales no editables
    return !cid.startsWith("bg-") && cid !== "background";
  });

  if (visibleObjects.length === 0) {
    return (
      <div className="py-10 text-center text-[13px] text-gray-400">
        Este flyer no tiene capas editables aún.
        <br/>
        <span className="text-[11px] text-gray-500">Usa el botón "Añadir" abajo para crear elementos.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-gray-400 leading-snug">
        Las capas se muestran en orden — la superior se ve encima del resto.
      </p>
      <div className="flex flex-col gap-1.5">
        {visibleObjects.map((obj, idx) => {
          const type = obj.type ?? "obj";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cid = (obj as any).customId as string | undefined;
          const label = (() => {
            if (cid) return cid;
            if (type === "textbox" || type === "text" || type === "i-text") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const txt = ((obj as any).text as string | undefined) ?? "";
              return txt.length > 24 ? `${txt.slice(0, 24)}…` : (txt || "Texto");
            }
            if (type === "image") return "Imagen";
            if (type === "rect") return "Rectángulo";
            if (type === "circle") return "Círculo";
            if (type === "triangle") return "Triángulo";
            return `Forma (${type})`;
          })();
          const isLocked = obj.lockMovementX === true;
          const isHidden = obj.visible === false;
          const isActive = fc?.getActiveObject() === obj;
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border ${
                isActive
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/[0.06] bg-[#13131f]"
              }`}
            >
              <button
                onClick={() => onSelect(obj)}
                className="flex-1 text-left min-w-0 flex items-center gap-2"
              >
                <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold shrink-0">
                  {type === "textbox" || type === "text" || type === "i-text" ? "T" : type === "image" ? "📷" : "◆"}
                </span>
                <span className="text-[12px] font-semibold truncate">{label}</span>
              </button>
              {/* Subir */}
              <button
                onClick={() => {
                  if (!fc) return;
                  fc.bringObjectForward(obj);
                  fc.requestRenderAll();
                  onMutate();
                  refresh();
                }}
                className="w-7 h-7 rounded-md active:bg-white/10 flex items-center justify-center text-gray-400"
                aria-label="Subir capa"
              >
                <ChevronUp size={14} strokeWidth={2.2}/>
              </button>
              {/* Bajar */}
              <button
                onClick={() => {
                  if (!fc) return;
                  fc.sendObjectBackwards(obj);
                  fc.requestRenderAll();
                  onMutate();
                  refresh();
                }}
                className="w-7 h-7 rounded-md active:bg-white/10 flex items-center justify-center text-gray-400"
                aria-label="Bajar capa"
              >
                <ChevronDown size={14} strokeWidth={2.2}/>
              </button>
              {/* Visibility */}
              <button
                onClick={() => {
                  if (!fc) return;
                  obj.visible = !obj.visible;
                  fc.requestRenderAll();
                  onMutate();
                  refresh();
                }}
                className={`w-7 h-7 rounded-md active:bg-white/10 flex items-center justify-center ${
                  isHidden ? "text-gray-600" : "text-gray-300"
                }`}
                aria-label={isHidden ? "Mostrar" : "Ocultar"}
              >
                {isHidden ? <EyeOff size={13} strokeWidth={2.2}/> : <Eye size={13} strokeWidth={2.2}/>}
              </button>
              {/* Lock */}
              <button
                onClick={() => {
                  if (!fc) return;
                  const next = !isLocked;
                  obj.set({
                    lockMovementX: next, lockMovementY: next,
                    lockScalingX: next, lockScalingY: next,
                    lockRotation: next,
                    hasControls: !next,
                  });
                  fc.requestRenderAll();
                  onMutate();
                  refresh();
                }}
                className={`w-7 h-7 rounded-md active:bg-white/10 flex items-center justify-center ${
                  isLocked ? "text-amber-400" : "text-gray-400"
                }`}
                aria-label={isLocked ? "Desbloquear" : "Bloquear"}
              >
                {isLocked ? <Lock size={13} strokeWidth={2.2}/> : <Unlock size={13} strokeWidth={2.2}/>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SHARE MODAL — Compartir tras descargar (Fase H) ─────────────────────

/** Modal de compartir. Aparece tras descargar el flyer. Ofrece:
 *  - Web Share API nativa (en mobile abre picker iOS/Android)
 *  - WhatsApp / Facebook / Twitter / Telegram / Email / Copiar link
 *  - Instagram (instrucciones — no tiene URL share publica) */
function ShareModal({
  flyerTitle, uploading, shareUrl, ensureSharedUrl, lastExportedDataUrl, onClose,
}: {
  flyerTitle: string;
  uploading: boolean;
  shareUrl: string | null;
  ensureSharedUrl: () => Promise<string | null>;
  lastExportedDataUrl: string | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [igInstrOpen, setIgInstrOpen] = useState(false);

  // Texto base que acompaña al link en cada red social
  const message = `Mira el flyer que hice para "${flyerTitle}" con ArteGenIA 🎨`;
  const credit = "Creado con ArteGenIA — artegenia.vercel.app";

  // ─── Handlers ──────────────────────────────────────────────────────────
  // Web Share API (nativo iOS/Android). Si esta disponible, ofrece compartir
  // CON LA IMAGEN adjunta (no solo link). Funciona en Safari iOS 15+ y
  // Chrome Android. En desktop solo Edge lo soporta.
  const webShareWithImage = useCallback(async () => {
    if (!lastExportedDataUrl) return;
    try {
      const res = await fetch(lastExportedDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "artegenia-flyer.png", { type: blob.type });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({
          files: [file],
          title: flyerTitle,
          text: message,
        });
        return;
      }
      // Fallback: share solo texto+url
      const url = await ensureSharedUrl();
      if (!url) return;
      await nav.share({ title: flyerTitle, text: message, url });
    } catch (e) {
      // Usuario canceló — silencio
      if ((e as Error).name !== "AbortError") console.error(e);
    }
  }, [lastExportedDataUrl, flyerTitle, message, ensureSharedUrl]);

  const shareTo = useCallback(async (target: "whatsapp" | "facebook" | "twitter" | "telegram" | "email") => {
    const url = await ensureSharedUrl();
    if (!url) return;
    const text = `${message}\n\n${credit}`;
    let href = "";
    switch (target) {
      case "whatsapp":
        href = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
        break;
      case "facebook":
        // Facebook sharer ignora "text" — solo crawler-fetches OG del URL.
        // Por eso es importante que la URL tenga OG image (R2 + meta).
        href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
        break;
      case "twitter":
        href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "telegram":
        href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case "email":
        href = `mailto:?subject=${encodeURIComponent(flyerTitle)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
        break;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }, [ensureSharedUrl, message, credit, flyerTitle]);

  const copyLink = useCallback(async () => {
    const url = await ensureSharedUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [ensureSharedUrl]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasWebShare = typeof navigator !== "undefined" && !!(navigator as any).share;

  return (
    <>
      <div
        className="fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-[#13131f] rounded-t-3xl border-t border-white/[0.12] shadow-2xl max-h-[80vh] flex flex-col safe-area-bottom animate-in slide-in-from-bottom duration-200">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 mb-1 shrink-0"/>
        <div className="px-4 py-3 flex items-center justify-between shrink-0 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-bold flex items-center gap-2">
            <Share2 size={16} className="text-purple-300"/>
            Compartir flyer
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] text-gray-300 flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Cerrar"
          >
            <XIcon size={16} strokeWidth={2.4}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* Preview thumbnail */}
          {lastExportedDataUrl && (
            <div className="flex items-center gap-3 p-2 rounded-xl bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lastExportedDataUrl} alt="Tu flyer" className="w-14 h-14 rounded-lg object-cover border border-white/10"/>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold truncate">{flyerTitle}</div>
                <div className="text-[10px] text-gray-500">Descargado correctamente</div>
              </div>
            </div>
          )}

          {/* Web Share nativo — botón principal en mobile */}
          {hasWebShare && (
            <button
              onClick={webShareWithImage}
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-purple-500/30 disabled:opacity-60"
            >
              <Share2 size={16} strokeWidth={2.4}/>
              Compartir con la app del sistema
            </button>
          )}

          {/* Grid de redes sociales */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
              O elige una red
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              <ShareBtn
                bg="bg-emerald-500"
                icon={<MessageCircle size={20} strokeWidth={2.2}/>}
                label="WhatsApp"
                onClick={() => void shareTo("whatsapp")}
                loading={uploading}
              />
              <ShareBtn
                bg="bg-pink-500"
                icon={<InstagramIcon/>}
                label="Instagram"
                onClick={() => setIgInstrOpen(true)}
                loading={uploading}
              />
              <ShareBtn
                bg="bg-blue-600"
                icon={<FacebookIcon/>}
                label="Facebook"
                onClick={() => void shareTo("facebook")}
                loading={uploading}
              />
              <ShareBtn
                bg="bg-black"
                icon={<XLogoIcon/>}
                label="Twitter"
                onClick={() => void shareTo("twitter")}
                loading={uploading}
              />
              <ShareBtn
                bg="bg-sky-500"
                icon={<Send size={18} strokeWidth={2.2}/>}
                label="Telegram"
                onClick={() => void shareTo("telegram")}
                loading={uploading}
              />
              <ShareBtn
                bg="bg-gray-600"
                icon={<Mail size={18} strokeWidth={2.2}/>}
                label="Email"
                onClick={() => void shareTo("email")}
                loading={uploading}
              />
              <ShareBtn
                bg="bg-purple-500"
                icon={<Link2 size={18} strokeWidth={2.2}/>}
                label={copied ? "Copiado ✓" : "Copiar link"}
                onClick={() => void copyLink()}
                loading={uploading}
              />
              <ShareBtn
                bg="bg-orange-500"
                icon={<Download size={18} strokeWidth={2.2}/>}
                label="Re-descargar"
                onClick={() => {
                  if (!lastExportedDataUrl) return;
                  const a = document.createElement("a");
                  a.download = "artegenia-flyer.png";
                  a.href = lastExportedDataUrl;
                  a.click();
                }}
              />
            </div>
          </div>

          {/* Link preview (cuando ya está subido) */}
          {shareUrl && (
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.06] flex items-center gap-2">
              <Link2 size={12} className="text-purple-300 shrink-0"/>
              <code className="text-[10px] text-gray-300 truncate flex-1">{shareUrl}</code>
            </div>
          )}

          <p className="text-[10px] text-gray-500 leading-snug text-center pt-1">
            Tu flyer se publica en una URL privada. Solo quien recibe el link puede verlo.
          </p>
        </div>

        {/* Instrucciones Instagram (no tiene URL share publica desde web) */}
        {igInstrOpen && (
          <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end" onClick={() => setIgInstrOpen(false)}>
            <div className="w-full bg-[#1c1c2a] rounded-t-3xl p-5 flex flex-col gap-3 safe-area-bottom animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
              <h3 className="text-[15px] font-bold flex items-center gap-2">
                <InstagramIcon/>
                Compartir en Instagram
              </h3>
              <p className="text-[12px] text-gray-300 leading-relaxed">
                Instagram no permite compartir desde la web automáticamente. Sigue estos 3 pasos:
              </p>
              <ol className="text-[12px] text-gray-300 leading-relaxed space-y-2 pl-4 list-decimal">
                <li>Ya tienes el flyer descargado en tu galería.</li>
                <li>Abre Instagram → toca el <strong>+</strong> arriba.</li>
                <li>Elige <strong>Historia</strong> o <strong>Publicación</strong> y selecciona el flyer.</li>
              </ol>
              <button
                onClick={() => {
                  // Intentamos abrir la app via deep link. Si no esta instalada,
                  // el dispositivo abrira la web de Instagram.
                  window.location.href = "instagram://camera";
                  setTimeout(() => window.open("https://instagram.com", "_blank"), 800);
                }}
                className="mt-2 py-3 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 text-white font-bold text-[13px] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <InstagramIcon/>
                Abrir Instagram
              </button>
              <button
                onClick={() => setIgInstrOpen(false)}
                className="py-2 rounded-xl bg-white/[0.06] text-gray-300 text-[12px] font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ShareBtn({
  bg, icon, label, onClick, loading,
}: {
  bg: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform disabled:opacity-50"
    >
      <div className={`w-13 h-13 ${bg} rounded-2xl flex items-center justify-center text-white shadow-md`} style={{ width: 52, height: 52 }}>
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
        ) : icon}
      </div>
      <span className="text-[10px] font-semibold text-gray-300 leading-tight text-center">{label}</span>
    </button>
  );
}

// ─── Iconos SVG inline de redes sociales (lucide no tiene FB/IG/X) ─────────
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
    </svg>
  );
}
function XLogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
