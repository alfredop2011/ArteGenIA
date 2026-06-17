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
  // Z.17 — Borrador mágico/manual
  Brush,
} from "lucide-react";
import { templates, getVariant, type Template, type TemplateLayer } from "@/data/templates";
import { FORMATS, PUBLIC_FORMATS, type FormatId, getFormatByDimensions } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import { applyWatermark, shouldWatermark } from "@/lib/applyWatermark";
import { getBlocksForTemplate, BLOCK_ICONS, BLOCK_TINTS, type EditableBlock } from "@/data/templateBlocks";
import { getPalettesForCategory, type Palette } from "@/data/templatePalettes";
import { REMIX_STYLES, type RemixStyle } from "@/data/templateRemixes";
import { useProjects } from "@/hooks/useProjects";
import { useProjectPages } from "@/hooks/useProjectPages";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/hooks/useLocale";
import { UpgradeModal, type UpgradeFeature } from "@/components/upgrade/UpgradeModal";
import { ConfirmCreditModal } from "@/components/credits/ConfirmCreditModal";
import AuthModal from "@/components/auth/AuthModal";
import { useCredits } from "@/hooks/useCredits";
import { CREDIT_COST, type CreditModule } from "@/lib/credits";
// Z.17 — Borrador mágico/manual full-screen reutilizable desktop+mobile
import BrushEraserModal from "@/components/editor/BrushEraserModal";
import { Save, FolderOpen, Share2, Link2, Mail, MessageCircle, Send, Plus, Layers, Lock, Unlock, Eye, EyeOff, Circle as CircleIcon, Square as SquareIcon, Triangle, Heart, Star, AlignHorizontalJustifyCenter, Clipboard, ClipboardPaste } from "lucide-react";

type Props = {
  templateId?: number;
  projectId?: string;
  formatId?: FormatId;
};

/** Sheet temporal que puede estar abierto. null = canvas limpio (caso comun).
 *  "texto" desaparecio: se reemplazo por sub-tools bar inline cuando hay
 *  objeto seleccionado (patron Canva). */
type SheetId = null | "foto" | "estilo" | "ia" | "plantillas" | "export" | "more" | "add" | "layers" | "format" | "assistant";

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
  // Multi-página (Fase W.1). Backward-compat: proyectos legacy se tratan
  // como 1 sola página automáticamente. El sheet de páginas se abre desde
  // bottom-nav cuando no hay objeto seleccionado.
  const pages = useProjectPages();
  const [showPagesSheet, setShowPagesSheet] = useState(false);
  // Z.25 — AuthModal contextual. Si el usuario intenta una accion que
  // requiere sesion (guardar, exportar, renombrar), abrir AuthModal con
  // titulo + subtitulo contextual y ejecutar la accion tras login.
  const [authModalConfig, setAuthModalConfig] = useState<{
    title: string;
    subtitle: string;
    onSuccess: () => void;
  } | null>(null);
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
  /** Z.25 — Si hay sesion, ejecuta action. Si no, abre AuthModal con
   *  titulo/subtitulo contextual y deja la action en cola para correr
   *  tras login exitoso. Patron copiado de GeneratedEditor (desktop). */
  const requireAuth = useCallback((
    action: () => void,
    opts: { title: string; subtitle: string },
  ) => {
    if (authUser) {
      action();
    } else {
      setAuthModalConfig({ ...opts, onSuccess: action });
    }
  }, [authUser]);
  // Z.16.1 — declarado early porque handleRemoveBackground (más arriba en el
  // archivo que el useCredits original de Z.7) lo necesita en deps. El export
  // de Z.7 también lo usa pero reutiliza esta misma referencia.
  const credits = useCredits();
  const { toast } = useToast();
  const { t } = useLocale();

  // Z.17 — Estado del borrador mágico/manual. Cuando no es null, el modal
  // BrushEraserModal está abierto editando esa imagen Fabric.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [brushEraserState, setBrushEraserState] = useState<{
    url: string;
    obj: import("fabric").FabricImage;
  } | null>(null);

  // Z.8.1 — Mis recursos en mobile: lazy fetch al abrir el sheet foto.
  // Reusa /api/assets, igual que /mis-recursos y el panel desktop.
  type MyAssetMobile = { id: string; type: string; url: string; name: string };
  const [myAssets, setMyAssets] = useState<MyAssetMobile[]>([]);
  const [myAssetsLoaded, setMyAssetsLoaded] = useState(false);
  const fetchMyAssetsMobile = useCallback(async () => {
    if (myAssetsLoaded) return;
    try {
      const res = await fetch("/api/assets", { cache: "no-store" });
      const data = await res.json();
      if (data.authenticated && Array.isArray(data.assets)) {
        setMyAssets(data.assets);
      }
      setMyAssetsLoaded(true);
    } catch (e) {
      console.error("[my-assets mobile]", e);
    }
  }, [myAssetsLoaded]);

  // Upgrade gating — Free users tocan limitaciones → modal "Sube a Pro"
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeature | null>(null);
  const isPaid = authProfile?.plan === "pro" || authProfile?.plan === "enterprise";
  const requirePro = (feature: UpgradeFeature): boolean => {
    if (isPaid) return true; // tiene acceso
    setUpgradeFeature(feature);
    return false; // bloquea la acción
  };

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

  // Z.8.1 — lazy fetch de Mis recursos al abrir el sheet foto por 1ª vez.
  useEffect(() => {
    if (openSheet === "foto") void fetchMyAssetsMobile();
    // fetchMyAssetsMobile se declara más abajo pero React es lenient con
    // forward refs por declaración hoisting en TS strict mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSheet]);

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
    | "capas-magicas" | "borrador"
    // Forma
    | "fill" | "borde" | "opacidad-shape" | "esquinas";
  const [activeSubTool, setActiveSubTool] = useState<SubTool>(null);

  // Tipo del objeto seleccionado — define que sub-tools mostrar
  type ObjType = null | "text" | "image" | "shape";
  const [selectedType, setSelectedType] = useState<ObjType>(null);

  // Flag para distinguir selecciones programaticas (tap en pill de "Editar")
  // de selecciones por interaccion del usuario en el canvas. La primera NO
  // debe cerrar el sub-tool activo (el usuario sigue editando, solo cambio
  // de bloque). La segunda SI lo cierra (era el comportamiento original).
  const programmaticSelectionRef = useRef(false);

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
      // Hidratar el hook de páginas (detecta formato legacy vs multi-página)
      pages.hydrate(row.fabric_json, row.width ?? 1080, row.height ?? 1350);
      // El canvas cargará la fabric de la página activa
      pendingFabricJsonRef.current = pages.consumePendingFabric();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, router]);

  // ─── Onboarding primera vez (Fase M.3) ─────────────────────────────────
  // Tooltips guiados para enseñar el patron del editor. Solo se muestra la
  // primera vez (localStorage "artegenia-v3-onboarding-seen"). 4 steps con
  // mensaje + flecha apuntando al elemento + botones Siguiente / Saltar.
  const ONBOARDING_KEY = "artegenia-v3-onboarding-seen";
  const [onboardingStep, setOnboardingStep] = useState<number>(-1);
  useEffect(() => {
    // Disparar onboarding solo cuando el canvas esta listo Y nunca se vio
    if (!loaded) return;
    try {
      const seen = window.localStorage.getItem(ONBOARDING_KEY);
      if (!seen) {
        // Pequeño delay para que la UI termine de animar
        const t = setTimeout(() => setOnboardingStep(0), 700);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [loaded]);

  const dismissOnboarding = useCallback(() => {
    try { window.localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
    setOnboardingStep(-1);
  }, []);

  const nextOnboardingStep = useCallback(() => {
    setOnboardingStep(s => {
      if (s >= 3) {
        try { window.localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
        return -1;
      }
      return s + 1;
    });
  }, []);

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
      // ─── Detectar formato Capas Mágicas ──────────────────────────────
      // Si el fabric_json viene marcado __magicLayers, NO usar loadFromJSON
      // sino aplicar via applyTemplateLayers (carga imágenes async bien).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pending = pendingFabricJsonRef.current as any;
      if (pending && pending.__magicLayers === true && Array.isArray(pending.layers)) {
        applyTemplateLayers(fc, pending.layers).then(() => {
          pendingFabricJsonRef.current = null;
          setupAfterLoad();
        });
      } else {
        // Hidratación normal: loadFromJSON con el fabric serializado.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (fc.loadFromJSON as any)(pendingFabricJsonRef.current).then(() => {
          pendingFabricJsonRef.current = null;
          setupAfterLoad();
        });
      }
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
      // Si la seleccion viene de un cambio programatico (ej: tap en pill
      // de Editar), NO reseteamos el sub-tool — el usuario sigue editando
      // texto, solo cambio de bloque. Sin este check el panel se cerraba.
      if (!programmaticSelectionRef.current) {
        setActiveSubTool(null);
      } else {
        programmaticSelectionRef.current = false;
      }
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
      // Limpia smart guides si por alguna razon quedaron de un drag previo
      setActiveGuides([]);
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

    // ─── Smart guides al arrastrar (Fase J — perf optimizada Fase N) ───
    // Cacheamos las refs (centros + bordes de los OTROS objetos) UNA VEZ al
    // empezar el drag (mouse:down). Durante el drag (mouse:move → object:moving)
    // reusamos la caché — antes era O(n²) iterando getObjects() en cada frame.
    let cachedVRefs: number[] | null = null;
    let cachedHRefs: number[] | null = null;

    const computeStaticRefs = (movingObj: FabricObject) => {
      const vRefs: number[] = [0, canvasSize.w / 2, canvasSize.w];
      const hRefs: number[] = [0, canvasSize.h / 2, canvasSize.h];
      fc.getObjects().forEach(other => {
        if (other === movingObj) return;
        if (other.visible === false) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((other as any).customId as string | undefined ?? "").toLowerCase();
        if (cid.startsWith("bg-") || cid === "background") return;
        const ob = other.getBoundingRect();
        vRefs.push(ob.left, ob.left + ob.width / 2, ob.left + ob.width);
        hRefs.push(ob.top, ob.top + ob.height / 2, ob.top + ob.height);
      });
      cachedVRefs = vRefs;
      cachedHRefs = hRefs;
    };

    const onMouseDown = (e: { target?: FabricObject }) => {
      // Pre-computar refs si hay objeto activo (potencial drag).
      // Se invalidan en mouse:up.
      if (e.target) computeStaticRefs(e.target);
    };

    const onObjectMoving = (e: { target?: FabricObject }) => {
      const obj = e.target;
      if (!obj) return;
      // Si por alguna razón no tenemos cache (drag programatico), computar
      if (!cachedVRefs || !cachedHRefs) computeStaticRefs(obj);
      const zoom = fc.getZoom();
      const THRESHOLD = 8 / zoom; // 8px en pantalla
      const bounds = obj.getBoundingRect();
      const w = bounds.width;
      const h = bounds.height;
      const cx = bounds.left + w / 2;
      const cy = bounds.top + h / 2;

      const vRefs = cachedVRefs!;
      const hRefs = cachedHRefs!;

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
    // Cleanup robusto: ademas de mouse:up, limpiamos en mouse:out
    // (drag suelto fuera del canvas) y selection:cleared (deselect en medio
    // de drag programatico). Asi NO quedan lineas cyan colgadas si el
    // usuario suelta el dedo fuera del wrapper.
    const onDragEnd = () => {
      setActiveGuides([]);
      cachedVRefs = null;
      cachedHRefs = null;
    };
    fc.on("mouse:down", onMouseDown);
    fc.on("object:moving", onObjectMoving);
    fc.on("mouse:up", onDragEnd);
    fc.on("mouse:out", onDragEnd);

    return () => {
      fc.off("selection:created", onSelect);
      fc.off("selection:updated", onSelect);
      fc.off("selection:cleared", onDeselect);
      fc.off("object:modified", debouncedPush);
      fc.off("object:added", debouncedPush);
      fc.off("object:removed", debouncedPush);
      fc.off("mouse:down", onMouseDown);
      fc.off("object:moving", onObjectMoving);
      fc.off("mouse:up", onDragEnd);
      fc.off("mouse:out", onDragEnd);
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

  // ─── Z.25 — Copy/paste entre paginas ─────────────────────────────────────
  // clipboardRef guarda los fabric objects clonados. Sobrevive cambios de
  // pagina porque es ref. Al pegar, clonamos OTRA vez para que pueda
  // pegarse multiples veces.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clipboardRef = useRef<any[]>([]);
  const [hasClipboard, setHasClipboard] = useState(false);

  const handleCopy = useCallback(async () => {
    const fc = fabricRef.current;
    const active = fc?.getActiveObject();
    if (!fc || !active) return;
    try {
      // Si es ActiveSelection (multi-select), copiar todos sus children.
      // Sino, solo el objeto activo.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: any[] = (active as any).type === "activeselection"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (active as any).getObjects()
        : [active];
      const clones = await Promise.all(items.map((o) => o.clone()));
      clipboardRef.current = clones;
      setHasClipboard(true);
      toast.success(`Copiado · ${clones.length} ${clones.length === 1 ? "elemento" : "elementos"}`);
    } catch (e) {
      console.error("Copy failed:", e);
      toast.error("No se pudo copiar");
    }
  }, [toast]);

  const handlePaste = useCallback(async () => {
    const fc = fabricRef.current;
    if (!fc || clipboardRef.current.length === 0) return;
    try {
      // Re-clonar para que pueda pegarse multiples veces sin compartir
      // referencias con futuros pastes.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fresh: any[] = await Promise.all(
        clipboardRef.current.map((o) => o.clone()),
      );
      const OFFSET = 20;
      fresh.forEach((o) => {
        o.set({ left: (o.left ?? 0) + OFFSET, top: (o.top ?? 0) + OFFSET });
        fc.add(o);
      });
      // Seleccionar todos los pegados — si es uno solo, seleccionarlo
      // directamente; si son varios, crear ActiveSelection.
      if (fresh.length === 1) {
        fc.setActiveObject(fresh[0]);
      } else {
        // Necesitamos importar ActiveSelection — lo hacemos lazy via fabric module
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fabric = await import("fabric") as any;
        if (fabric.ActiveSelection) {
          const sel = new fabric.ActiveSelection(fresh, { canvas: fc });
          fc.setActiveObject(sel);
        }
      }
      fc.requestRenderAll();
      setSaveState("unsaved");
      pushHistory();
      toast.success(`Pegado · ${fresh.length} ${fresh.length === 1 ? "elemento" : "elementos"}`);
    } catch (e) {
      console.error("Paste failed:", e);
      toast.error("No se pudo pegar");
    }
  }, [toast, pushHistory]);

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
    toast.success(axis === "x" ? t("mobileEditor.toast.flippedH") : t("mobileEditor.toast.flippedV"));
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

  // Z.16.1 — Migrado a /api/remove-bg (BiRefNet) con sistema unificado de
  // créditos. Antes usaba /api/refine-hd con JSON (path no fiable) y cuotas
  // por plan (deprecadas). Ahora: FormData + consume server-side + refund
  // automático Z.13 si falla.
  const handleRemoveBackground = useCallback(async () => {
    if (!authUser) {
      setAuthModalConfig({
        title: "Inicia sesión para Quitar fondo",
        subtitle: "Esta función usa IA y necesita identificarte para descontar los créditos correctamente.",
        onSuccess: () => { /* el user volvera a tap tras login */ },
      });
      return;
    }
    const fc = fabricRef.current;
    const img = getActiveImage();
    if (!fc || !img) { toast.error(t("mobileEditor.toast.selectImageFirst")); return; }
    setRemovingBg(true);
    try {
      // 1. Convertir imagen del canvas a dataURL → blob → File
      const dataUrl = await fabricImageToDataUrl(img);
      const blobRes = await fetch(dataUrl);
      const blob = await blobRes.blob();
      const file = new File([blob], "canvas-image.png", { type: blob.type || "image/png" });

      // 2. POST a /api/remove-bg con FormData (consume crédito server-side)
      const form = new FormData();
      form.append("image_file", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401) { toast.error("Inicia sesión"); return; }
      if (res.status === 402) {
        toast.error(data.error || "Sin créditos suficientes");
        return;
      }
      if (res.status === 429) { toast.error("Demasiadas peticiones, espera 1 min"); return; }
      if (!res.ok || !data.url) {
        toast.error(data.error || "La IA falló — intenta de nuevo");
        return;
      }

      // 3. Cargar resultado en Fabric, cache-buster para evitar CORS R2
      const newUrl = `${data.url}${data.url.includes("?") ? "&" : "?"}v=${Date.now()}`;
      const newImg = await FabricImage.fromURL(newUrl, { crossOrigin: "anonymous" });
      img.setElement(newImg.getElement() as HTMLImageElement);
      img.dirty = true;
      // PNG transparente ya viene recortado → reset filtros para no corromper alpha
      img.filters = [];
      img.applyFilters();
      fc.requestRenderAll();
      setSaveState("unsaved");
      pushHistory();
      void credits.refetch();
      toast.success(t("mobileEditor.toast.bgRemoved"));
    } catch (e) {
      console.error("[remove-bg]", e);
      toast.error(t("mobileEditor.toast.imageError"));
    } finally {
      setRemovingBg(false);
    }
  }, [authUser, getActiveImage, fabricImageToDataUrl, pushHistory, toast, t, credits]);

  // ─── Z.17 — Borrador mágico/manual ────────────────────────────────────
  // Extrae src de la imagen activa y abre modal full-screen para refinar
  // con pincel manual o IA. Al guardar, reemplaza src.
  const openBrushEraser = useCallback(async () => {
    if (!authUser) {
      setAuthModalConfig({
        title: "Inicia sesión para Borrador mágico",
        subtitle: "El borrador mágico usa IA y requiere sesión para descontar los créditos correctamente.",
        onSuccess: () => { /* el user volvera a tap tras login */ },
      });
      return;
    }
    const img = getActiveImage();
    if (!img) { toast.error(t("mobileEditor.toast.selectImageFirst")); return; }
    try {
      const dataUrl = await fabricImageToDataUrl(img);
      setBrushEraserState({ url: dataUrl, obj: img });
    } catch (e) {
      console.error("[brush-eraser open]", e);
      toast.error("No se pudo abrir el editor de refinado");
    }
  }, [authUser, getActiveImage, fabricImageToDataUrl, toast, t]);

  const handleBrushEraserSave = useCallback(async (resultDataUrl: string) => {
    const state = brushEraserState;
    setBrushEraserState(null);
    if (!state) return;
    const fc = fabricRef.current;
    if (!fc) return;
    try {
      const newImg = await FabricImage.fromURL(resultDataUrl, { crossOrigin: "anonymous" });
      state.obj.setElement(newImg.getElement() as HTMLImageElement);
      state.obj.dirty = true;
      state.obj.filters = [];
      state.obj.applyFilters();
      fc.requestRenderAll();
      setSaveState("unsaved");
      pushHistory();
      toast.success("Refinado aplicado");
    } catch (e) {
      console.error("[brush-eraser save]", e);
      toast.error("No se pudo aplicar el refinado");
    }
  }, [brushEraserState, pushHistory, toast]);

  // ─── Capas Mágicas (Fase V.1) ──────────────────────────────────────────
  // Convierte la imagen seleccionada en plantilla editable. El endpoint
  // /api/photo-to-template combina Claude Haiku 4.5 visión (textos) +
  // Florence-2 detection (objetos) y devuelve TemplateLayer[]. Los aplicamos
  // al canvas borrando la imagen original (ahora reconstruida en capas).
  // Cuota: Free 3/mes · Pro 20/mes · Enterprise 100/mes.
  const [magicLayersLoading, setMagicLayersLoading] = useState(false);
  const [magicLayersQuota, setMagicLayersQuota] = useState<{ used: number; limit: number; unlimited: boolean } | null>(null);

  /** Carga la cuota actual desde GET /api/photo-to-template para mostrar
   *  badge "X/3 este mes" en el botón. */
  const refreshMagicLayersQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/photo-to-template", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json() as { used: number; limit: number; unlimited: boolean };
      setMagicLayersQuota({ used: data.used, limit: data.limit, unlimited: data.unlimited });
    } catch (e) {
      console.warn("[magic-layers] quota fetch failed:", e);
    }
  }, []);

  // Cargar cuota al montar (solo si hay user)
  useEffect(() => {
    if (authUser) void refreshMagicLayersQuota();
  }, [authUser, refreshMagicLayersQuota]);

  const handleMagicLayers = useCallback(async () => {
    if (!authUser) {
      setAuthModalConfig({
        title: "Inicia sesión para Capas Mágicas",
        subtitle: "Capas Mágicas analiza tu imagen con IA. Necesitamos tu sesión para descontar los créditos.",
        onSuccess: () => { /* el user volvera a tap tras login */ },
      });
      return;
    }
    const fc = fabricRef.current;
    const img = getActiveImage();
    if (!fc || !img) {
      toast.error(t("mobileEditor.toast.selectImageFirst"));
      return;
    }
    // Subir/obtener URL HTTP pública de la imagen (el endpoint no acepta
    // dataURLs porque Florence-2 requiere URL pública).
    setMagicLayersLoading(true);
    try {
      const el = img.getElement() as HTMLImageElement;
      let publicUrl = el?.src ?? "";

      // Si es data: o blob:, subir a R2 primero — /api/share-upload espera
      // JSON con imageDataUrl en formato base64, no FormData.
      if (publicUrl.startsWith("data:") || publicUrl.startsWith("blob:")) {
        toast.info("Subiendo imagen…");
        // Si es blob:, convertimos a dataURL. Si ya es data:, lo usamos tal cual.
        let imageDataUrl = publicUrl;
        if (publicUrl.startsWith("blob:")) {
          const blob = await (await fetch(publicUrl)).blob();
          imageDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
            reader.readAsDataURL(blob);
          });
        }
        const upRes = await fetch("/api/share-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl, title: "Capas Mágicas" }),
        });
        if (!upRes.ok) {
          const err = await upRes.json().catch(() => ({})) as { error?: string };
          toast.error(err.error || "No se pudo subir la imagen");
          return;
        }
        const { url } = await upRes.json() as { url: string };
        publicUrl = url;
      }

      const res = await fetch("/api/photo-to-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: publicUrl }),
      });

      if (res.status === 402) {
        // Cuota agotada — abrir modal upgrade contextual
        setUpgradeFeature("magic-layers");
        return;
      }
      if (res.status === 401) {
        toast.error("Inicia sesión");
        return;
      }
      if (res.status === 429) {
        toast.error("Demasiadas peticiones, espera 1 min");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error || "La IA falló — intenta de nuevo");
        return;
      }

      const data = await res.json() as {
        layers: TemplateLayer[];
        meta: { textsDetected: number; objectsDetected: number; quota: { used: number; limit: number; unlimited: boolean } };
      };

      if (!data.layers?.length) {
        toast.error("No se detectaron capas en la imagen");
        return;
      }

      // Borrar el objeto imagen original — ahora lo sustituimos por las capas
      // detectadas (la primera es el original como fondo de nuevo).
      fc.remove(img);

      // Aplicar las nuevas capas al canvas
      await applyTemplateLayers(fc, data.layers, 1);
      fc.requestRenderAll();
      setSaveState("unsaved");
      pushHistory();
      setActiveSubTool(null);

      // Actualizar cuota en UI
      setMagicLayersQuota({
        used: data.meta.quota.used,
        limit: data.meta.quota.limit,
        unlimited: data.meta.quota.unlimited,
      });

      toast.success(`✨ ${data.meta.textsDetected} textos y ${data.meta.objectsDetected} elementos detectados`);
    } catch (e) {
      console.error("[magic-layers]", e);
      toast.error(t("mobileEditor.toast.imageError"));
    } finally {
      setMagicLayersLoading(false);
    }
  }, [authUser, getActiveImage, pushHistory, toast, t]);

  // ─── Asistente IA chat → flyer (Fase O) ────────────────────────────────
  // Llama /api/assistant con prompt + bloques editables → recibe valores
  // sugeridos por Claude Haiku → aplica a blockValues y al canvas.
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantResult, setAssistantResult] = useState<Record<string, string> | null>(null);

  const runAssistant = useCallback(async (prompt: string) => {
    if (!template) return;
    if (!authUser) {
      setAuthModalConfig({
        title: "Inicia sesión para el Asistente IA",
        subtitle: "El Asistente genera contenido con IA y necesita identificarte para descontar los créditos.",
        onSuccess: () => { /* el user volvera a tap tras login */ },
      });
      return;
    }
    if (!prompt.trim()) { toast.error("Escribe primero qué evento es"); return; }
    setAssistantLoading(true);
    setAssistantResult(null);
    try {
      const blockHints = blocks.map(b => ({
        id: b.id,
        label: b.label,
        current: blockValues[b.id] || b.placeholder || "",
      }));
      console.log("[assistant] POST /api/assistant", { prompt, blocksCount: blockHints.length });
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          blocks: blockHints,
          category: template.category ?? "evento",
        }),
      });
      console.log("[assistant] response status:", res.status);
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn("[assistant] error body:", errText);
        if (res.status === 401) toast.error("Sesión expirada — vuelve a iniciar sesión");
        else if (res.status === 429 && !isPaid) setUpgradeFeature("assistant");
        else if (res.status === 429) toast.error("Demasiadas peticiones, espera 1 min");
        else if (res.status >= 500) toast.error(`Servidor no disponible (${res.status})`);
        else toast.error(`La IA respondió ${res.status} — intenta de nuevo`);
        return;
      }
      const data = await res.json() as { values?: Record<string, string> };
      console.log("[assistant] received values:", data.values);
      const values = data.values ?? {};
      if (Object.keys(values).length === 0) {
        toast.error("La IA no devolvió valores — intenta con otra descripción");
        return;
      }
      setAssistantResult(values);
    } catch (e) {
      console.error("[assistant] fetch error:", e);
      toast.error(`Error de conexión: ${(e as Error).message}`);
    } finally {
      setAssistantLoading(false);
    }
  }, [template, authUser, blocks, blockValues, toast]);

  const applyAssistantResult = useCallback(() => {
    if (!assistantResult) return;
    let applied = 0;
    Object.entries(assistantResult).forEach(([blockId, value]) => {
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;
      applyBlockToCanvas(block, value);
      setBlockValues(prev => ({ ...prev, [blockId]: value }));
      applied++;
    });
    setAssistantResult(null);
    setOpenSheet(null);
    toast.success(`${applied} campos rellenados con IA`);
  }, [assistantResult, blocks, applyBlockToCanvas, toast]);

  // ─── Reiniciar plantilla (Fase M.1) ────────────────────────────────────
  // Vuelve al diseño original limpio. Limpia canvas, re-aplica template
  // layers, resetea blockValues/paleta/remix. Push history para poder
  // deshacer si fue por error.
  const handleResetTemplate = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc || !template) return;
    if (!window.confirm(t("mobileEditor.confirm.resetTemplate"))) return;
    const variant = getVariant(template, formatId);
    if (!variant) return;
    fc.discardActiveObject();
    fc.remove(...fc.getObjects());
    fc.backgroundColor = "#000";
    applyTemplateLayers(fc, variant.layers).then(() => {
      const objs = fc.getObjects();
      if (objs.length === 0) {
        toast.error("No se pudo restaurar la plantilla");
        return;
      }
      objs.forEach(obj => {
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
    }).catch(err => {
      console.error("[reset-template]", err);
      toast.error("Error al restaurar — recarga la página");
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
    // Z.25 — Si hay multipagina, advertir explicitamente que se perderan
    // las paginas extra al cambiar formato. La opcion C completa (reescalar
    // paginas al nuevo formato) requiere refactor de 2-3h con riesgo;
    // post-launch cuando llegue feedback real.
    if (pages.pageCount > 1) {
      const fmtName = FORMATS[newFormatId].name;
      const extraPages = pages.pageCount - 1;
      const ok = window.confirm(
        `Cambiar a "${fmtName}":\n\n` +
        `Tienes ${pages.pageCount} páginas en tu flyer.\n` +
        `Al cambiar de formato se recarga la plantilla y se perderán ` +
        `las ${extraPages} ${extraPages === 1 ? "página adicional" : "páginas adicionales"}.\n\n` +
        `¿Continuar?`,
      );
      if (!ok) return;
    }
    if (saveState === "unsaved" && !authUser) {
      const ok = window.confirm(t("mobileEditor.confirm.changeFormatUnsaved"));
      if (!ok) return;
    } else if (saveState === "unsaved" && authUser) {
      // Guardar antes de cambiar — preserva trabajo. Usamos ref para evitar
      // problema de declaracion-antes-de-uso (doSave esta mas abajo).
      await doSaveRef.current?.(true);
    }
    // Navegar al mismo proyecto (o template) con el formato nuevo
    const idForUrl = currentProjectId ?? template.id;
    router.push(`/editor/${idForUrl}?format=${newFormatId}`);
  }, [template, saveState, authUser, currentProjectId, router, toast, t, pages.pageCount]);

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
    toast.success(t("mobileEditor.toast.centeredCanvas"));
  }, [canvasSize.w, canvasSize.h, pushHistory, toast, t]);

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
    toast.success(t("mobileEditor.toast.textAdded"));
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
    toast.success(t("mobileEditor.toast.shapeAdded"));
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
      toast.success(t("mobileEditor.toast.imageAdded"));
    } catch (e) {
      console.error(e);
      toast.error(t("mobileEditor.toast.imageLoadError"));
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
    toast.success(next ? t("mobileEditor.toast.objectLocked") : t("mobileEditor.toast.objectUnlocked"));
  }, [pushHistory, toast, t]);

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
      toast.success(t("mobileEditor.toast.imageReplaced"));
    } catch (e) {
      console.error(e);
      toast.error(t("mobileEditor.toast.imageLoadError"));
    }
  }, [getActiveImage, pushHistory, toast]);

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
      // Multi-página: si hay más de 1 página o el proyecto ya está en
      // formato nuevo, serializamos como ProjectPages. Si no (proyecto
      // legacy con 1 página), guardamos el JSON plano de Fabric para
      // mantener backward compat con el resto del código.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fabricJson: object = pages.pageCount > 1
        ? (pages.serializeForSave(fc, canvasSize.w, canvasSize.h) as unknown as object)
        : ((fc.toJSON as any)(["customId"]) as object);
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
        if (!silent) toast.success(t("mobileEditor.toast.savedOk"));
      } else {
        setSaveState("unsaved");
        if (!silent) toast.error(t("mobileEditor.toast.savedFail"));
      }
    } catch (e) {
      console.error("save error", e);
      setSaveState("unsaved");
      if (!silent) toast.error(t("mobileEditor.toast.savedError"));
    }
  }, [loaded, currentProjectId, docTitle, templateId, template, formatId, canvasSize, saveProject, toast, t]);

  // ─── Multi-página: switch + add (Fase W.1) ──────────────────────────────
  // Cambia la página activa: serializa la actual, carga la nueva en el canvas.
  // El hook ya hace el guardado interno; aquí solo aplicamos al Fabric Canvas.
  /** Z.25 fix multipagina — aplica background + sincroniza canvasSize +
   *  hace fit-to-view tras 2 RAF para esperar a que el wrapper este
   *  actualizado (el flash del cambio de pagina + el re-render). Sin
   *  esperar, fitToView se ejecuta con dimensiones obsoletas y el
   *  canvas se ve agrandado. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyPageDimensions = useCallback((fc: any, pageData: any) => {
    if (!pageData?.width || !pageData?.height) return;
    if (pageData.background) {
      fc.backgroundColor = pageData.background;
    }
    setCanvasSize({ w: pageData.width, h: pageData.height });
    // Doble RAF: primero espera al commit del setCanvasSize, segundo a
    // que el browser pinte el wrapper con sus dims definitivas.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const r = wrapper.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const zoomW = r.width / pageData.width;
        const zoomH = r.height / pageData.height;
        const fit = Math.min(zoomW, zoomH);
        fc.setDimensions({ width: r.width, height: r.height });
        fc.setZoom(fit);
        const tx = (r.width - pageData.width * fit) / 2;
        const ty = (r.height - pageData.height * fit) / 2;
        fc.setViewportTransform([fit, 0, 0, fit, tx, ty]);
        fc.requestRenderAll();
      });
    });
  }, []);

  const switchToPage = useCallback((index: number) => {
    const fc = fabricRef.current;
    if (!fc) return;
    // Pasar dimensiones LOGICAS del canvas (canvasSize state) — no las
    // CSS de canvas.getWidth() que son del wrapper.
    pages.switchTo(index, fc, canvasSize.w, canvasSize.h);
    const next = pages.consumePendingFabric();
    if (!next) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fc.loadFromJSON as any)(next).then(() => {
      applyPageDimensions(fc, next);
      fc.discardActiveObject();
      fc.requestRenderAll();
    });
    setSaveState("unsaved");
  }, [pages, applyPageDimensions, canvasSize.w, canvasSize.h]);

  // Añade una página vacía con las dimensiones de la activa y la activa.
  const handleAddPage = useCallback(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    // CRITICO: pasar canvasSize (dimensiones LOGICAS del flyer), NO las
    // CSS de canvas.getWidth(). Sin esto las paginas se guardan con dims
    // del wrapper y al volver el canvas se ve con zoom imposible.
    pages.addPage(fc, canvasSize.w, canvasSize.h);
    const next = pages.consumePendingFabric();
    if (!next) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fc.loadFromJSON as any)(next).then(() => {
      applyPageDimensions(fc, next);
      fc.discardActiveObject();
      fc.requestRenderAll();
    });
    setSaveState("unsaved");
    toast.success(`Página ${pages.pageCount + 1} añadida`);
  }, [pages, toast, applyPageDimensions, canvasSize.w, canvasSize.h]);

  const handleSave = useCallback(() => {
    requireAuth(
      () => void doSave(false),
      {
        title: "Inicia sesión para guardar",
        subtitle: "Tu flyer se guardará en Mis recursos y podrás seguir editándolo desde cualquier dispositivo.",
      },
    );
  }, [requireAuth, doSave]);

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
      const ok = window.confirm(t("mobileEditor.confirm.exitUnsaved"));
      if (!ok) return;
    }
    if (to) router.push(to);
    else router.back();
  }, [saveState, router, t]);

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

  /** Sube el ultimo PNG exportado a R2 y crea entry shared_flyers para
   *  obtener URL publica /flyer/<id> con OG tags. Cacheado en shareUrl
   *  para no re-subir si el usuario abre el modal varias veces.
   *  Fallback: si shared_flyers no esta listo en prod, usa R2 URL directo. */
  const ensureSharedUrl = useCallback(async (): Promise<string | null> => {
    if (shareUrl) return shareUrl;
    if (!lastExportedDataUrl) return null;
    if (!authUser) {
      setAuthModalConfig({
        title: "Inicia sesión para compartir",
        subtitle: "Para generar el link compartible de tu flyer y subirlo a tu cuenta, necesitas tener sesión iniciada.",
        onSuccess: () => { /* el user volvera a tap tras login */ },
      });
      return null;
    }
    setShareUploading(true);
    try {
      const res = await fetch("/api/share-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: lastExportedDataUrl,
          title: docTitle || template?.title || "Mi flyer",
        }),
      });
      if (!res.ok) {
        if (res.status === 429) toast.error(t("mobileEditor.toast.rateLimitWait"));
        else toast.error(t("mobileEditor.toast.shareUploadFailed"));
        return null;
      }
      const data = await res.json() as { url?: string; publicUrl?: string };
      // Preferimos publicUrl (con OG tags). Si endpoint cae al fallback
      // sin shareId, usamos url R2 directo.
      const finalUrl = data.publicUrl || data.url;
      if (!finalUrl) return null;
      setShareUrl(finalUrl);
      return finalUrl;
    } finally {
      setShareUploading(false);
    }
  }, [shareUrl, lastExportedDataUrl, authUser, docTitle, template?.title, toast, t]);

  // ─── Export ─────────────────────────────────────────────────────────────
  const doExport = useCallback(async (format: "png" | "jpg" | "pdf" | "svg" = "png") => {
    const fc = fabricRef.current;
    if (!fc) return;
    // Gate PDF + SVG para Free users — abre modal upgrade
    if (format === "pdf" && !requirePro("pdf")) return;
    if (format === "svg" && !requirePro("svg")) return;
    setExporting(true);
    try {
      const currentZoom = fc.getZoom();
      const currentVpt = fc.viewportTransform ? [...fc.viewportTransform] : null;
      fc.setZoom(1);
      fc.setDimensions({ width: canvasSize.w, height: canvasSize.h });

      // SVG — output directo de Fabric (vectorial)
      if (format === "svg") {
        const svg = fc.toSVG();
        fc.setZoom(currentZoom);
        if (currentVpt) fc.setViewportTransform(currentVpt as [number, number, number, number, number, number]);
        fc.requestRenderAll();
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "artegenia-flyer.svg";
        link.href = url;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success("Descargado SVG vectorial");
        if (authUser) {
          // Para Compartir, generamos PNG aparte (las redes no aceptan SVG bien)
          fc.setZoom(1);
          fc.setDimensions({ width: canvasSize.w, height: canvasSize.h });
          const pngUrl = fc.toDataURL({ format: "png", quality: 0.95, multiplier: 1 });
          fc.setZoom(currentZoom);
          if (currentVpt) fc.setViewportTransform(currentVpt as [number, number, number, number, number, number]);
          fc.requestRenderAll();
          setLastExportedDataUrl(pngUrl);
          setShareUrl(null);
          setOpenSheet(null);
          setShareOpen(true);
        }
        return;
      }

      // PNG / JPG / PDF — todos requieren raster primero
      const rawDataUrl = fc.toDataURL({
        format: format === "jpg" ? "jpeg" : "png",
        quality: format === "jpg" ? 0.92 : 0.95,
        multiplier: 1,
      });
      fc.setZoom(currentZoom);
      if (currentVpt) fc.setViewportTransform(currentVpt as [number, number, number, number, number, number]);
      fc.requestRenderAll();

      let finalUrl = rawDataUrl;
      if (shouldWatermark(authProfile?.plan)) {
        try { finalUrl = await applyWatermark(rawDataUrl); }
        catch (e) { console.warn(e); }
      }

      if (format === "pdf") {
        // jspdf: embed la imagen al tamaño real del canvas
        const { jsPDF } = await import("jspdf");
        // 1 px = 0.264583 mm a 96 DPI estándar
        const pxToMm = 25.4 / 96;
        const wMm = canvasSize.w * pxToMm;
        const hMm = canvasSize.h * pxToMm;
        const orientation = wMm >= hMm ? "landscape" : "portrait";
        const pdf = new jsPDF({ orientation, unit: "mm", format: [wMm, hMm] });
        pdf.addImage(finalUrl, "PNG", 0, 0, wMm, hMm);
        pdf.save("artegenia-flyer.pdf");
        toast.success("Descargado PDF para imprenta");
      } else {
        const link = document.createElement("a");
        link.download = `artegenia-flyer.${format}`;
        link.href = finalUrl;
        link.click();
        toast.success(`Descargado ${format.toUpperCase()}`);
      }

      // Guardar para Compartir — PNG/JPG funcionan directo; PDF cae al PNG
      setLastExportedDataUrl(finalUrl);
      setShareUrl(null);
      if (authUser) {
        setOpenSheet(null);
        setShareOpen(true);
      }

      // Z.14 — Track export (schema Z.9 unificado, igual que desktop)
      void import("@/lib/analytics").then(m => {
        const fc = fabricRef.current;
        const objs = fc?.getObjects() ?? [];
        const hasAiLayers = objs.some(o => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cid = ((o as any).customId as string | undefined) ?? "";
          return cid.startsWith("magic-") || cid.startsWith("sticker-") || cid.startsWith("auto-");
        });
        const creditCost = (["pdf", "svg"] as string[]).includes(format) ? 3 : 1;
        m.trackExportCompleted({
          format,
          credits_consumed: creditCost,
          has_ai_layers: hasAiLayers,
          plan: (authProfile?.plan as "free" | "pro" | "enterprise") ?? "free",
          source: "editor_mobile",
        });
      });
    } finally { setExporting(false); }
  }, [canvasSize, authProfile?.plan, toast, authUser]);

  const handleExport = useCallback(() => {
    // Z.25 — Pedir sesion ANTES de abrir el sheet. La descarga consume
    // creditos y requiere identificar al usuario; mejor avisar de una
    // vez que dejar al user navegar el sheet y fallar al final.
    requireAuth(
      () => setOpenSheet("export"),
      {
        title: "Inicia sesión para descargar",
        subtitle: "Para descargar tu flyer en alta calidad y guardarlo en tu cuenta, necesitas tener sesión iniciada.",
      },
    );
  }, [requireAuth]);

  // ─── Multi-formato exportar ─────────────────────────────────────────────
  // Renderiza una variant del template off-screen con los blockValues
  // actuales aplicados (texto editado) y devuelve dataUrl.
  // Las paletas/remixes NO se replican aqui — para preservarlos exactos
  // exportamos el formato ACTUAL via doExport() y los OTROS formatos llevan
  // el variant original con solo los textos editados. Trade-off documentado.
  // exportFileFormat: 4 tipos disponibles:
  //  - PNG: lossless, ideal redes sociales y reediciones
  //  - JPG: ~5x más liviano, ideal WhatsApp
  //  - PDF: vectorial-ish (imagen embedded a tamaño real), ideal imprenta
  //  - SVG: vectorial real, ideal reusar en otros editores
  const [exportFileFormat, setExportFileFormat] = useState<"png" | "jpg" | "pdf" | "svg">("png");

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

  // Fase Z.7 — créditos export (la const `credits` se declara más arriba en Z.16.1)
  const [pendingExportPayload, setPendingExportPayload] = useState<{
    fmtId: FormatId;
    fileFormat: "png" | "jpg" | "pdf" | "svg";
  } | null>(null);

  /** Mapea formato → módulo de créditos (CREDIT_COST). PNG/JPG=1cr, PDF/SVG=3cr. */
  const formatToCreditModule = (fileFormat: "png"|"jpg"|"pdf"|"svg"): CreditModule => {
    if (fileFormat === "pdf") return "download_pdf";
    if (fileFormat === "svg") return "download_svg";
    return "download_png"; // jpg también = 1 crédito (mismo CREDIT_COST.download_png)
  };

  /** Lógica REAL de export (renombrada para wrappear con modal créditos).
   *  Llamada solo tras confirmar consumo en handleConfirmExport. */
  const _executeExport = useCallback(async (fmtId: FormatId) => {
    if (!template) return;
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
      // PNG/JPG/PDF: render off-screen como PNG/JPG, luego convertir si PDF
      // SVG: el render off-screen siempre devuelve raster — para SVG en multi-
      // formato, fallback a PNG con warning porque necesitaríamos un flow
      // off-screen-toSVG (no implementado para mantener simple).
      const rasterFormat: "png" | "jpg" =
        exportFileFormat === "jpg" ? "jpg" : "png";
      const url = await renderVariantOffscreen(variant, rasterFormat);
      if (!url) { toast.error("Error al renderizar"); return; }
      let finalUrl = url;
      if (shouldWatermark(authProfile?.plan)) {
        try { finalUrl = await applyWatermark(url); } catch (e) { console.warn(e); }
      }
      if (exportFileFormat === "pdf") {
        const { jsPDF } = await import("jspdf");
        const pxToMm = 25.4 / 96;
        const wMm = variant.width * pxToMm;
        const hMm = variant.height * pxToMm;
        const orientation = wMm >= hMm ? "landscape" : "portrait";
        const pdf = new jsPDF({ orientation, unit: "mm", format: [wMm, hMm] });
        pdf.addImage(finalUrl, "PNG", 0, 0, wMm, hMm);
        pdf.save(`artegenia-${template.id}-${fmtId}.pdf`);
        toast.success(`Descargado ${FORMATS[fmtId].name} (PDF)`);
      } else if (exportFileFormat === "svg") {
        // Multi-formato + SVG no soportado off-screen — fallback a PNG con info
        downloadDataUrl(finalUrl, `artegenia-${template.id}-${fmtId}.png`);
        toast.info(`${FORMATS[fmtId].name} no se exporta SVG — descargado PNG`);
      } else {
        downloadDataUrl(finalUrl, `artegenia-${template.id}-${fmtId}.${exportFileFormat}`);
        toast.success(`Descargado ${FORMATS[fmtId].name} (${exportFileFormat.toUpperCase()})`);
      }
    } finally {
      setExporting(false);
    }
  }, [template, formatId, doExport, renderVariantOffscreen, authProfile?.plan, toast, downloadDataUrl, exportFileFormat]);

  /** Wrapper público que pasamos al sheet de export. Hace guards (auth,
   *  pro/pdf/svg, plantilla) y abre modal de créditos. La descarga real
   *  ocurre solo tras confirmar. */
  const exportSingleFormat = useCallback(async (fmtId: FormatId) => {
    if (!template) return;
    if (exportFileFormat === "pdf" && !requirePro("pdf")) return;
    if (exportFileFormat === "svg" && !requirePro("svg")) return;
    if (!authUser) {
      setAuthModalConfig({
        title: "Inicia sesión para descargar",
        subtitle: "Necesitas una cuenta gratis para descargar tus flyers. Tienes 10 créditos al registrarte.",
        onSuccess: () => setPendingExportPayload({ fmtId, fileFormat: exportFileFormat }),
      });
      return;
    }
    // Abrir modal de créditos. El user confirma → handleConfirmExport ejecuta.
    setPendingExportPayload({ fmtId, fileFormat: exportFileFormat });
  }, [template, exportFileFormat, requirePro, authUser]);

  /** Tras confirmar modal: consume crédito server-side + ejecuta export. */
  const handleConfirmExport = useCallback(async () => {
    if (!pendingExportPayload) return;
    const moduleKey = formatToCreditModule(pendingExportPayload.fileFormat);
    const result = await credits.consume(moduleKey, { format: pendingExportPayload.fileFormat });
    if (!result.success) {
      toast.error("Sin créditos suficientes");
      return;
    }
    await _executeExport(pendingExportPayload.fmtId);
    setPendingExportPayload(null);
  }, [pendingExportPayload, credits, _executeExport, toast]);

  const exportAllFormats = useCallback(async () => {
    if (!template) return;
    // Z.7 — Multi-formato consume N créditos (1 por formato). Usamos download_png
    // como módulo para todos los formatos en este lote (simplifica el cobro).
    // El user debería decidir formato base en el sheet antes de "exportar todos".
    if (exportFileFormat === "pdf" && !requirePro("pdf")) return;
    if (exportFileFormat === "svg" && !requirePro("svg")) return;
    if (!authUser) {
      setAuthModalConfig({
        title: "Inicia sesión para descargar",
        subtitle: "Necesitas una cuenta gratis para descargar tus flyers en todos los formatos. 10 créditos al registrarte.",
        onSuccess: () => {},
      });
      return;
    }
    const available = PUBLIC_FORMATS.filter(fmt => {
      const v = template.variants.find(x => x.format === fmt);
      return !!v;
    });
    if (available.length === 0) return;

    // Coste = N formatos × CREDIT_COST.download_png
    const moduleKey = formatToCreditModule(exportFileFormat);
    const totalCost = CREDIT_COST[moduleKey] * available.length;
    if ((credits.balance ?? 0) < totalCost) {
      toast.error(`Necesitas ${totalCost} créditos para descargar ${available.length} formatos`);
      return;
    }

    setExporting(true);
    try {
      let done = 0;
      for (const fmt of available) {
        // Consumir crédito por formato + ejecutar export
        const result = await credits.consume(moduleKey, { format: exportFileFormat, batch: true });
        if (!result.success) {
          toast.error(`Sin créditos a mitad del lote (${done}/${available.length} descargados)`);
          break;
        }
        await _executeExport(fmt);
        done++;
        await new Promise(r => setTimeout(r, 400));
      }
      if (done > 0) toast.success(`Descargados ${done} formatos`);
    } finally {
      setExporting(false);
    }
  }, [template, exportFileFormat, requirePro, authUser, toast, credits, _executeExport]);

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
    if (!authUser) {
      setAuthModalConfig({
        title: "Inicia sesión para Remix IA",
        subtitle: "Remix IA reinterpreta tu flyer con un estilo nuevo. Necesita sesión para descontar los créditos.",
        onSuccess: () => { /* el user volvera a tap tras login */ },
      });
      return;
    }
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
        if (res.status === 429 && !isPaid) setUpgradeFeature("remix");
        else if (res.status === 429) toast.error("Demasiadas peticiones, espera 1 min");
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
          aria-label={t("mobileEditor.header.back")}
          className="w-9 h-9 rounded-lg flex items-center justify-center active:bg-white/10 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.2}/>
        </button>
        <button
          className="flex-1 min-w-0 px-1 text-left active:bg-white/[0.04] rounded-md py-0.5"
          onClick={() => {
            // Z.25 — renombrar requiere sesion (sino el rename no se guarda
            // y se pierde al recargar). Pedimos auth ANTES de mostrar el
            // prompt; tras login se reabre automaticamente el prompt.
            const doRename = () => {
              const next = window.prompt(t("mobileEditor.header.renamePromptName"), docTitle || template?.title || "");
              if (next === null) return;
              const trimmed = next.trim();
              if (!trimmed) return;
              setDocTitle(trimmed);
              setSaveState("unsaved");
            };
            requireAuth(doRename, {
              title: "Inicia sesión para renombrar",
              subtitle: "El nombre de tu flyer se guarda en tu cuenta. Inicia sesión para no perder el cambio.",
            });
          }}
          aria-label={t("mobileEditor.header.renameLabel")}
          title={t("mobileEditor.header.renameTitle")}
        >
          <h1 className="text-[13px] font-bold leading-tight truncate">
            {docTitle || template?.title || t("mobileEditor.header.loading")}
          </h1>
          {/* Z.25 — nombre semantico del formato + estado guardado.
              "Post de Instagram · Guardado" comunica MUCHO mas que solo
              "1080×1080" para el usuario no-tecnico. */}
          <p className="text-[9px] text-gray-400 leading-tight truncate">
            {(() => {
              const fmt = getFormatByDimensions(canvasSize.w, canvasSize.h);
              return fmt ? fmt.name : `${canvasSize.w}×${canvasSize.h}`;
            })()} · {
              saveState === "saved" ? t("mobileEditor.state.saved")
              : saveState === "saving" ? t("mobileEditor.state.saving")
              : t("mobileEditor.state.unsaved")
            }
          </p>
        </button>
        <button
          aria-label={t("mobileEditor.header.undo")}
          onClick={() => void handleUndo()}
          disabled={!canUndo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 active:bg-white/10 disabled:opacity-25"
        >
          <Undo2 size={17} strokeWidth={2}/>
        </button>
        <button
          aria-label={t("mobileEditor.header.redo")}
          onClick={() => void handleRedo()}
          disabled={!canRedo}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 active:bg-white/10 disabled:opacity-25"
        >
          <Redo2 size={17} strokeWidth={2}/>
        </button>
        <button
          aria-label={t("mobileEditor.header.saveShort")}
          onClick={handleSave}
          disabled={saveState === "saving"}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${
            saveState === "saved" && currentProjectId
              ? "text-emerald-400 active:bg-white/10"
              : "text-gray-300 active:bg-white/10"
          }`}
          title={currentProjectId ? t("mobileEditor.header.save") : t("mobileEditor.header.saveNew")}
        >
          <Save size={16} strokeWidth={2.2}/>
        </button>
        <button
          aria-label={t("mobileEditor.header.more")}
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
          {t("mobileEditor.header.export")}
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
            {/* Z.25 — Copiar al portapapeles interno para pegar en otra pagina.
                Solo visible si hay >1 pagina (sino no tiene sentido). */}
            {pages.pageCount > 1 && (
              <ChipBtn
                onClick={handleCopy}
                icon={<Clipboard size={15} strokeWidth={2.2}/>}
                label="Copiar"
              />
            )}
            <ChipBtn
              onClick={() => handleCenterActive("both")}
              icon={<AlignHorizontalJustifyCenter size={15} strokeWidth={2.2}/>}
              label="Centrar al canvas"
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

        {/* Z.25 — Boton flotante PEGAR. Visible cuando hay algo en el
            clipboard Y NO hay seleccion activa Y hay >1 pagina. */}
        {hasClipboard && !selectedLayerId && !openSheet && pages.pageCount > 1 && (
          <button
            onClick={handlePaste}
            className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-purple-500 text-white rounded-full shadow-2xl shadow-purple-500/40 px-3 py-2 active:scale-95 transition-transform"
            aria-label="Pegar elementos copiados"
          >
            <ClipboardPaste size={14} strokeWidth={2.4}/>
            <span className="text-[11px] font-bold tracking-tight">Pegar</span>
          </button>
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
              onSelectBlock={(id) => {
                setActiveBlockId(id);
                if (!id) return;
                // Sincroniza con el canvas: selecciona el primer layer del
                // bloque para que el usuario vea con bbox morado QUÉ esta
                // editando. Marca la seleccion como programatica para que
                // el listener onSelect NO cierre el sub-tool "Editar".
                const fc = fabricRef.current;
                if (!fc) return;
                const block = blocks.find(b => b.id === id);
                if (!block) return;
                const obj = fc.getObjects().find(o => {
                  const cid = (o as FabricObject & { customId?: string }).customId;
                  return cid && block.layerIds.includes(cid);
                });
                if (obj) {
                  programmaticSelectionRef.current = true;
                  fc.setActiveObject(obj);
                  fc.requestRenderAll();
                }
              }}
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
              cost={CREDIT_COST.quitar_fondo}
              balance={credits.balance}
            />
          )}
          {selectedType === "image" && activeSubTool === "capas-magicas" && (
            <MagicLayersInline
              loading={magicLayersLoading}
              quota={magicLayersQuota}
              onConfirm={handleMagicLayers}
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
                <SubToolBtnIcon node={<Pencil size={18} strokeWidth={2.2}/>} label={t("mobileEditor.subtool.edit")} active={activeSubTool === "editar"} onClick={() => setActiveSubTool(s => s === "editar" ? null : "editar")}/>
                <SubToolBtn icon="Ff" label={t("mobileEditor.subtool.font")} active={activeSubTool === "fuente"} onClick={() => setActiveSubTool(s => s === "fuente" ? null : "fuente")} fontStyle="italic"/>
                <SubToolBtn icon="H" label={t("mobileEditor.subtool.styles")} active={activeSubTool === "estilos"} onClick={() => setActiveSubTool(s => s === "estilos" ? null : "estilos")}/>
                <SubToolBtn icon="Aa" label={t("mobileEditor.subtool.size")} active={activeSubTool === "tamano"} onClick={() => setActiveSubTool(s => s === "tamano" ? null : "tamano")}/>
                <SubToolBtn icon="🎨" label={t("mobileEditor.subtool.color")} active={activeSubTool === "color"} onClick={() => setActiveSubTool(s => s === "color" ? null : "color")} emoji/>
              </>
            )}
            {selectedType === "image" && (
              <>
                <SubToolBtnIcon node={<Replace size={18} strokeWidth={2.2}/>} label={t("mobileEditor.subtool.replace")} active={activeSubTool === "reemplazar"} onClick={() => setActiveSubTool(s => s === "reemplazar" ? null : "reemplazar")}/>
                <SubToolBtnIcon node={<Crop size={18} strokeWidth={2.2}/>} label={t("mobileEditor.subtool.crop")} active={activeSubTool === "recortar"} onClick={() => setActiveSubTool(s => s === "recortar" ? null : "recortar")}/>
                <SubToolBtnIcon node={<Sliders size={18} strokeWidth={2.2}/>} label={t("mobileEditor.subtool.filters")} active={activeSubTool === "filtros"} onClick={() => setActiveSubTool(s => s === "filtros" ? null : "filtros")}/>
                <SubToolBtnIcon node={<Eraser size={18} strokeWidth={2.2}/>} label={t("mobileEditor.subtool.removeBg")} active={activeSubTool === "quitar-fondo"} onClick={() => setActiveSubTool(s => s === "quitar-fondo" ? null : "quitar-fondo")}/>
                {/* Z.17 — Borrador mágico/manual full-screen */}
                <SubToolBtnIcon node={<Brush size={18} strokeWidth={2.2}/>} label="Refinar" active={false} onClick={() => { void openBrushEraser(); }}/>
                {/* Capas Mágicas (Fase V.1) — convierte foto en plantilla editable.
                    Badge muestra cuota restante para Free; nada para Pro/Enterprise. */}
                <SubToolBtnIcon
                  node={
                    <span className="relative inline-flex items-center">
                      <Wand2 size={18} strokeWidth={2.2}/>
                      {magicLayersQuota && !magicLayersQuota.unlimited && (
                        <span className={`absolute -top-1.5 -right-2 text-[9px] font-black px-1 py-0.5 rounded-md ${
                          magicLayersQuota.used >= magicLayersQuota.limit
                            ? "bg-red-500/30 text-red-300"
                            : "bg-emerald-500/30 text-emerald-200"
                        }`}>
                          {Math.max(0, magicLayersQuota.limit - magicLayersQuota.used)}
                        </span>
                      )}
                    </span>
                  }
                  label="Capas IA"
                  active={activeSubTool === "capas-magicas"}
                  onClick={() => setActiveSubTool(s => s === "capas-magicas" ? null : "capas-magicas")}
                />
                <SubToolBtn icon="◐" label={t("mobileEditor.subtool.opacity")} active={activeSubTool === "opacidad-img"} onClick={() => setActiveSubTool(s => s === "opacidad-img" ? null : "opacidad-img")} emoji/>
              </>
            )}
            {selectedType === "shape" && (
              <>
                <SubToolBtn icon="🎨" label={t("mobileEditor.subtool.color")} active={activeSubTool === "fill"} onClick={() => setActiveSubTool(s => s === "fill" ? null : "fill")} emoji/>
                <SubToolBtnIcon node={<Square size={18} strokeWidth={2.2}/>} label={t("mobileEditor.subtool.border")} active={activeSubTool === "borde"} onClick={() => setActiveSubTool(s => s === "borde" ? null : "borde")}/>
                <SubToolBtn icon="◐" label={t("mobileEditor.subtool.opacity")} active={activeSubTool === "opacidad-shape"} onClick={() => setActiveSubTool(s => s === "opacidad-shape" ? null : "opacidad-shape")} emoji/>
                <SubToolBtn icon="◢" label={t("mobileEditor.subtool.corners")} active={activeSubTool === "esquinas"} onClick={() => setActiveSubTool(s => s === "esquinas" ? null : "esquinas")} emoji/>
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
          {/* Z.25 — botón Formatos sustituye al de Plantillas (que sacaba
              del editor). Ahora abre el sheet de formatos in-situ.
              Para volver a plantillas, el usuario usa el back del header. */}
          <BarBtn
            icon={<LayoutGrid size={18} strokeWidth={2}/>}
            label={t("mobileEditor.sheet.format")}
            active={openSheet === "format"}
            onClick={() => setOpenSheet(s => s === "format" ? null : "format")}
          />
          <BarBtn
            icon={<Plus size={20} strokeWidth={2.4}/>}
            label={t("mobileEditor.bottomBar.add")}
            active={openSheet === "add"}
            onClick={() => setOpenSheet(s => s === "add" ? null : "add")}
          />
          <BarBtn
            icon={<ImageIcon size={18} strokeWidth={2}/>}
            label={t("mobileEditor.bottomBar.photo")}
            active={openSheet === "foto"}
            onClick={() => setOpenSheet(s => s === "foto" ? null : "foto")}
          />
          <BarBtn
            icon={<PaletteIcon size={18} strokeWidth={2}/>}
            label={t("mobileEditor.bottomBar.style")}
            active={openSheet === "estilo"}
            onClick={() => setOpenSheet(s => s === "estilo" ? null : "estilo")}
          />
          <BarBtn
            icon={<Sparkles size={18} strokeWidth={2}/>}
            label={t("mobileEditor.bottomBar.remix")}
            active={openSheet === "ia"}
            onClick={() => setOpenSheet(s => s === "ia" ? null : "ia")}
          />
          {/* Botón Páginas (Fase W.1) — abre sheet con lista de páginas + add.
              Badge con número de página activa si hay más de 1 página. */}
          <BarBtn
            icon={
              <span className="relative inline-flex items-center">
                <Copy size={18} strokeWidth={2}/>
                {pages.pageCount > 1 && (
                  <span className="absolute -top-1.5 -right-2 text-[9px] font-black px-1 py-0.5 rounded-md bg-purple-500/30 text-purple-200">
                    {pages.activeIndex + 1}
                  </span>
                )}
              </span>
            }
            label="Páginas"
            active={showPagesSheet}
            onClick={() => {
              // Z.25 — capturar thumbnail con dims logicas del flyer
              // (no las CSS del canvas que son las del wrapper).
              pages.refreshActiveThumbnail(fabricRef.current, canvasSize.w, canvasSize.h);
              setShowPagesSheet(true);
            }}
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
                {openSheet === "foto" && t("mobileEditor.sheet.photo")}
                {openSheet === "estilo" && t("mobileEditor.sheet.style")}
                {openSheet === "ia" && t("mobileEditor.sheet.remix")}
                {openSheet === "more" && t("mobileEditor.sheet.more")}
                {openSheet === "export" && t("mobileEditor.sheet.export")}
                {openSheet === "add" && t("mobileEditor.sheet.add")}
                {openSheet === "layers" && t("mobileEditor.sheet.layers")}
                {openSheet === "format" && t("mobileEditor.sheet.format")}
                {openSheet === "assistant" && t("mobileEditor.sheet.assistant")}
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
                  myAssets={myAssets}
                  onAddFromUrl={async (url) => {
                    const fc = fabricRef.current;
                    if (!fc) return;
                    try {
                      const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
                      const maxDim = Math.min(canvasSize.w, canvasSize.h) * 0.4;
                      const w = img.width ?? 1;
                      const h = img.height ?? 1;
                      const scale = Math.min(maxDim / w, maxDim / h, 1);
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
                      toast.success("Añadido al canvas");
                    } catch (e) {
                      console.error("[my-asset add]", e);
                      toast.error("No se pudo añadir el recurso");
                    }
                  }}
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
                    {t("mobileEditor.style.palettesFor")} {template?.category ?? "—"}
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
                    {t("mobileEditor.remix.intro")}
                  </p>

                  {/* BLOQUE IA — botones contextuales */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <Wand2 size={14} className="text-purple-300"/>
                      <span className="text-[12px] font-bold text-purple-200">{t("mobileEditor.remix.generateAI")}</span>
                      <span className="text-[9px] uppercase tracking-widest text-purple-400 ml-auto">{t("mobileEditor.remix.beta")}</span>
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
                        {aiRemixing ? "…" : t("mobileEditor.remix.surprise")}
                      </button>
                      <button
                        onClick={() => void requestAIRemix("vibrante neón")}
                        disabled={aiRemixing}
                        className="py-2 rounded-lg bg-white/[0.06] text-gray-200 text-[11px] font-bold active:scale-[0.96] disabled:opacity-50"
                      >
                        {t("mobileEditor.remix.neon")}
                      </button>
                      <button
                        onClick={() => void requestAIRemix("elegante sobrio")}
                        disabled={aiRemixing}
                        className="py-2 rounded-lg bg-white/[0.06] text-gray-200 text-[11px] font-bold active:scale-[0.96] disabled:opacity-50"
                      >
                        {t("mobileEditor.remix.elegant")}
                      </button>
                      <button
                        onClick={() => void requestAIRemix("vintage retro")}
                        disabled={aiRemixing}
                        className="py-2 rounded-lg bg-white/[0.06] text-gray-200 text-[11px] font-bold active:scale-[0.96] disabled:opacity-50"
                      >
                        {t("mobileEditor.remix.vintage")}
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    {t("mobileEditor.remix.curatedStyles")}
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
                    label={t("mobileEditor.more.layers")}
                    subtitle={t("mobileEditor.more.layersSub")}
                    onClick={() => setOpenSheet("layers")}
                  />
                  <MoreRowLink
                    icon={<FolderOpen size={18}/>}
                    label={t("mobileEditor.more.myFlyers")}
                    subtitle={t("mobileEditor.more.myFlyersSub")}
                    onClick={() => { setOpenSheet(null); router.push("/projects"); }}
                  />
                  <MoreRowLink
                    icon={<Sparkles size={18}/>}
                    label={t("mobileEditor.more.viewTutorial")}
                    subtitle={t("mobileEditor.more.viewTutorialSub")}
                    onClick={() => {
                      try { window.localStorage.removeItem(ONBOARDING_KEY); } catch {}
                      setOpenSheet(null);
                      setOnboardingStep(0);
                    }}
                  />
                  <MoreRowLink
                    icon={<Wand2 size={18}/>}
                    label={t("mobileEditor.more.aiAssistant")}
                    subtitle={t("mobileEditor.more.aiAssistantSub")}
                    onClick={() => setOpenSheet("assistant")}
                  />
                  <MoreRowLink
                    icon={<LayoutGrid size={18}/>}
                    label={t("mobileEditor.more.changeFormat")}
                    subtitle={t("mobileEditor.more.changeFormatSub")}
                    onClick={() => setOpenSheet("format")}
                  />
                  <MoreRowLink
                    icon={<XIcon size={18}/>}
                    label={t("mobileEditor.more.resetTemplate")}
                    subtitle={t("mobileEditor.more.resetTemplateSub")}
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

              {/* SHEET ASISTENTE IA ────────────────────────────────────── */}
              {openSheet === "assistant" && template && (
                <AssistantSheet
                  category={template.category}
                  loading={assistantLoading}
                  result={assistantResult}
                  isAuthed={!!authUser}
                  onRun={runAssistant}
                  onApply={applyAssistantResult}
                  onCancel={() => setAssistantResult(null)}
                  onLogin={() => { setOpenSheet(null); router.push("/?login=1"); }}
                  blocks={blocks}
                />
              )}

              {/* SHEET FORMATOS — Z.25: incluye accion "Añadir página"
                  para consolidar las opciones de estructura del documento. */}
              {openSheet === "format" && template && (
                <ChangeFormatSheet
                  template={template}
                  currentFormat={formatId}
                  onSelect={(fmt) => { setOpenSheet(null); void handleChangeFormat(fmt); }}
                  pageCount={pages.pageCount}
                  onAddPage={() => { setOpenSheet(null); handleAddPage(); }}
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
                  /* Z.25 — al confirmar varios elementos, crear ActiveSelection
                     en el canvas para que el user pueda moverlos juntos. */
                  onMultiSelect={async (objs) => {
                    const fc = fabricRef.current;
                    if (!fc || objs.length === 0) return;
                    fc.discardActiveObject();
                    if (objs.length === 1) {
                      fc.setActiveObject(objs[0]);
                    } else {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const fabric = await import("fabric") as any;
                      if (fabric.ActiveSelection) {
                        const sel = new fabric.ActiveSelection(objs, { canvas: fc });
                        fc.setActiveObject(sel);
                      }
                    }
                    fc.requestRenderAll();
                    setOpenSheet(null);
                    toast.success(`${objs.length} ${objs.length === 1 ? "elemento seleccionado" : "elementos seleccionados"}`);
                  }}
                />
              )}

            </div>
          </div>
        </>
      )}

      {/* ═══ ONBOARDING OVERLAY — Primera vez (Fase M.3) ═══════════════ */}
      {onboardingStep >= 0 && (
        <OnboardingOverlay
          step={onboardingStep}
          onNext={nextOnboardingStep}
          onSkip={dismissOnboarding}
        />
      )}

      {/* ═══ SHARE MODAL — Compartir tras descargar (Fase H) ═══════════ */}
      {/* UPGRADE MODAL — Free user toca limitaciones Pro (Fase U) */}
      {upgradeFeature && (
        <UpgradeModal
          feature={upgradeFeature}
          onClose={() => setUpgradeFeature(null)}
        />
      )}

      {/* Fase Z.7 — Modal de confirmación de crédito antes de export.
          Z.25 — anade bloque exportDetails con formato + dimensiones + tipo. */}
      <ConfirmCreditModal
        open={pendingExportPayload !== null}
        onClose={() => setPendingExportPayload(null)}
        onConfirm={handleConfirmExport}
        actionLabel={
          pendingExportPayload
            ? `Descargar flyer en ${pendingExportPayload.fileFormat.toUpperCase()}`
            : "Descargar flyer"
        }
        amount={
          pendingExportPayload
            ? CREDIT_COST[formatToCreditModule(pendingExportPayload.fileFormat)]
            : 1
        }
        balance={credits.balance ?? 0}
        daysUntilReset={credits.daysUntilReset ?? undefined}
        exportDetails={(() => {
          if (!pendingExportPayload) return undefined;
          const fmt = getFormatByDimensions(canvasSize.w, canvasSize.h);
          return {
            formatName: fmt?.name,
            formatSubtitle: fmt?.subtitle,
            dimensions: `${canvasSize.w} × ${canvasSize.h} px`,
            fileType: pendingExportPayload.fileFormat,
          };
        })()}
      />

      {/* Z.17 — Borrador mágico/manual mobile */}
      <BrushEraserModal
        open={brushEraserState !== null}
        imageUrl={brushEraserState?.url ?? ""}
        magicCost={CREDIT_COST.borrador_magico}
        balance={credits.balance}
        onCancel={() => setBrushEraserState(null)}
        onSave={handleBrushEraserSave}
        onCreditsConsumed={() => void credits.refetch()}
        onError={(msg) => toast.error(msg)}
      />


      {/* PÁGINAS SHEET — Multi-página (Fase W.1) */}
      {showPagesSheet && (
        <PagesSheet
          pages={pages.pages}
          activeIndex={pages.activeIndex}
          onSwitch={(i) => { switchToPage(i); setShowPagesSheet(false); }}
          onAdd={() => { handleAddPage(); setShowPagesSheet(false); }}
          onClose={() => setShowPagesSheet(false)}
        />
      )}

      {/* Z.25 — AuthModal contextual. Se abre cuando el usuario intenta
          guardar, exportar o renombrar sin sesion. Tras login exitoso
          ejecuta la accion pendiente (onSuccess) y se cierra. */}
      {authModalConfig && (
        <AuthModal
          title={authModalConfig.title}
          subtitle={authModalConfig.subtitle}
          onAuthSuccess={authModalConfig.onSuccess}
          onClose={() => setAuthModalConfig(null)}
        />
      )}

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

/** Sheet de páginas (Fase W.1 MVP). Lista las páginas del proyecto, marca
 *  la activa, y permite añadir página vacía. Polish (duplicar, borrar,
 *  renombrar, thumbnails con preview real) viene en V2. */
function PagesSheet({
  pages, activeIndex, onSwitch, onAdd, onClose,
}: {
  pages: Array<{ name: string; width: number; height: number; thumbnail?: string }>;
  activeIndex: number;
  onSwitch: (index: number) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[100] rounded-t-3xl bg-[#0a0a14] border-t border-white/[0.08] pb-8 max-h-[75vh] flex flex-col">
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2"/>
        <div className="px-5 pt-2 pb-3 flex items-center justify-between border-b border-white/[0.06]">
          <div>
            <h2 className="text-[16px] font-black">Páginas</h2>
            <p className="text-[11px] text-gray-500">
              {pages.length} {pages.length === 1 ? "página" : "páginas"} · misma medida
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center text-gray-400 active:bg-white/[0.10]"
            aria-label="Cerrar"
          >
            <XIcon size={16} strokeWidth={2.2}/>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-2 flex-1">
          {pages.map((p, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={i}
                onClick={() => onSwitch(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                  isActive
                    ? "bg-purple-500/15 border-purple-500/40"
                    : "bg-white/[0.03] border-white/[0.06] active:bg-white/[0.08]"
                }`}
              >
                {/* Z.25 — Thumbnail real si esta disponible.
                    El thumbnail se captura en switchTo/addPage del hook
                    useProjectPages. La primera vez que abres una pagina
                    nueva-no-visitada no hay thumbnail y se muestra placeholder. */}
                <div
                  className={`w-12 shrink-0 rounded-md border overflow-hidden ${
                    isActive ? "border-purple-400/60 bg-purple-500/10" : "border-white/10 bg-white/[0.04]"
                  }`}
                  style={{ aspectRatio: `${p.width}/${p.height}` }}
                >
                  {p.thumbnail && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-bold truncate ${isActive ? "text-purple-200" : "text-gray-200"}`}>
                    {p.name || `Página ${i + 1}`}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {p.width} × {p.height}
                  </p>
                </div>
                {isActive && (
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md">
                    Activa
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-5 pt-3 pb-1 border-t border-white/[0.06]">
          <button
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-[13px] active:scale-[0.97] transition-transform"
          >
            <Plus size={16} strokeWidth={2.5}/>
            Añadir página
          </button>
          <p className="text-[10px] text-gray-500 text-center mt-2">
            Duplicar, borrar y renombrar — próximamente
          </p>
        </div>
      </div>
    </>
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

/** Tamaño — slider compacto rango 8-200. State local para que la barra
 *  se actualice EN VIVO al arrastrar (sin esperar re-render del padre). */
function SizeSlider({ currentSize, onChange }: { currentSize: number; onChange: (n: number) => void }) {
  const { t } = useLocale();
  const [val, setVal] = useState(currentSize);
  useEffect(() => { setVal(currentSize); }, [currentSize]);
  return (
    <div className="border-b border-white/[0.06] px-4 py-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] text-gray-400 font-semibold">{t("mobileEditor.text.fontSizeLabel")}</span>
        <span className="text-[11px] text-purple-400 font-bold">{Math.round(val)} px</span>
      </div>
      <input
        type="range"
        min={8} max={200} step={1}
        value={val}
        onChange={e => { const n = Number(e.target.value); setVal(n); onChange(n); }}
        className="slider-mobile w-full"
        style={sliderFill(val, 8, 200)}
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
  const { t } = useLocale();
  return (
    <div className="border-b border-white/[0.06] flex gap-2 overflow-x-auto scrollbar-hide px-3 py-3">
      {QUICK_COLORS.map(c => {
        const isAct = currentColor.toLowerCase() === c.toLowerCase();
        return (
          <button
            key={c}
            onClick={() => onPick(c)}
            aria-label={`${t("mobileEditor.aria.colorSwatch")} ${c}`}
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
  const { t } = useLocale();
  // State local para que los 3 sliders se actualicen en vivo
  const [strokeVal, setStrokeVal] = useState(currentStrokeWidth);
  const [lhVal, setLhVal] = useState(currentLineHeight);
  const [csVal, setCsVal] = useState(currentCharSpacing);
  useEffect(() => { setStrokeVal(currentStrokeWidth); }, [currentStrokeWidth]);
  useEffect(() => { setLhVal(currentLineHeight); }, [currentLineHeight]);
  useEffect(() => { setCsVal(currentCharSpacing); }, [currentCharSpacing]);
  return (
    <div className="border-b border-white/[0.06] flex flex-col gap-3 px-3 py-3 max-h-[55vh] overflow-y-auto">
      {/* Fila 1 — Formato basico */}
      <div className="flex gap-2">
        <button onClick={() => onApply("fontWeight", "900")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white font-black" aria-label={t("mobileEditor.text.bold")}>B</button>
        <button onClick={() => onApply("fontStyle", "italic")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white italic font-bold" aria-label={t("mobileEditor.text.italic")}>I</button>
        <button onClick={() => onApply("underline", true)} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white underline font-bold" aria-label={t("mobileEditor.text.underline")}>U</button>
      </div>
      {/* Fila 2 — Alineacion + Reset */}
      <div className="flex gap-2">
        <button onClick={() => onApply("textAlign", "left")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold" aria-label={t("mobileEditor.text.alignLeft")}>⇤</button>
        <button onClick={() => onApply("textAlign", "center")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold" aria-label={t("mobileEditor.text.alignCenter")}>⇔</button>
        <button onClick={() => onApply("textAlign", "right")} className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold" aria-label={t("mobileEditor.text.alignRight")}>⇥</button>
        <button
          onClick={() => {
            onApply("fontWeight", "400");
            onApply("fontStyle", "normal");
            onApply("underline", false);
            onShadow("none");
            onOutline(0);
          }}
          className="flex-1 py-2 rounded-xl bg-white/[0.05] text-gray-400 text-[11px]"
          aria-label={t("mobileEditor.text.reset")}
        >Reset</button>
      </div>

      {/* Sombra & glow */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
          <span>{t("mobileEditor.text.shadow")}</span>
          {hasShadow && <span className="text-emerald-400 normal-case tracking-normal text-[10px]">{t("mobileEditor.text.shadowActive")}</span>}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <ShadowBtn label={t("mobileEditor.text.shadowNone")} preview="—" onClick={() => onShadow("none")}/>
          <ShadowBtn label={t("mobileEditor.text.shadowSoft")} preview="aA" textShadow="2px 2px 4px rgba(0,0,0,0.6)" onClick={() => onShadow("soft")}/>
          <ShadowBtn label={t("mobileEditor.text.shadowStrong")} preview="aA" textShadow="4px 4px 8px rgba(0,0,0,0.9)" onClick={() => onShadow("strong")}/>
          <ShadowBtn label={t("mobileEditor.text.shadowGlow")} preview="aA" textShadow="0 0 12px #a855f7" textColor="#a855f7" onClick={() => onShadow("glow")}/>
        </div>
      </div>

      {/* Outline */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("mobileEditor.text.outline")}</span>
          <span className="text-[10px] text-purple-400 font-bold">{strokeVal.toFixed(1)} px</span>
        </div>
        <input
          type="range"
          min={0} max={10} step={0.5}
          value={strokeVal}
          onChange={e => { const n = Number(e.target.value); setStrokeVal(n); onOutline(n, currentStroke || "#000000"); }}
          className="slider-mobile w-full"
          style={sliderFill(strokeVal, 0, 10)}
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
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("mobileEditor.text.lineHeight")}</span>
          <span className="text-[10px] text-purple-400 font-bold">{lhVal.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.8} max={2.5} step={0.05}
          value={lhVal}
          onChange={e => { const n = Number(e.target.value); setLhVal(n); onApply("lineHeight", n); }}
          className="slider-mobile w-full"
          style={sliderFill(lhVal, 0.8, 2.5)}
        />
      </div>

      {/* Espaciado letras */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("mobileEditor.text.charSpacing")}</span>
          <span className="text-[10px] text-purple-400 font-bold">{Math.round(csVal)}</span>
        </div>
        <input
          type="range"
          min={-50} max={500} step={5}
          value={csVal}
          onChange={e => { const n = Number(e.target.value); setCsVal(n); onApply("charSpacing", n); }}
          className="slider-mobile w-full"
          style={sliderFill(csVal, -50, 500)}
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
  const { t } = useLocale();
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
          {t("mobileEditor.replace.button")}
        </span>
      </label>
      <p className="text-[10px] text-gray-500 text-center mt-2">
        {t("mobileEditor.replace.hint")}
      </p>
    </div>
  );
}

/** Recortar — 3 opciones de máscara. */
function CropOptionsInline({ onPick }: { onPick: (s: "square" | "circle" | "rounded") => void }) {
  const { t } = useLocale();
  const opts: Array<{ id: "square" | "circle" | "rounded"; label: string; mask: string }> = [
    { id: "square", label: t("mobileEditor.crop.square"), mask: "rounded-none" },
    { id: "rounded", label: t("mobileEditor.crop.rounded"), mask: "rounded-2xl" },
    { id: "circle", label: t("mobileEditor.crop.circle"), mask: "rounded-full" },
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
  const { t } = useLocale();
  const presets: Array<{ id: "none" | "bw" | "warm" | "cool" | "vintage"; label: string; bg: string }> = [
    { id: "none", label: t("mobileEditor.filters.original"), bg: "linear-gradient(135deg,#a855f7,#ec4899)" },
    { id: "bw", label: t("mobileEditor.filters.bw"), bg: "linear-gradient(135deg,#333,#999)" },
    { id: "warm", label: t("mobileEditor.filters.warm"), bg: "linear-gradient(135deg,#f97316,#facc15)" },
    { id: "cool", label: t("mobileEditor.filters.cool"), bg: "linear-gradient(135deg,#06b6d4,#3b82f6)" },
    { id: "vintage", label: t("mobileEditor.filters.vintage"), bg: "linear-gradient(135deg,#92400e,#fde68a)" },
  ];
  return (
    <div className="border-b border-white/[0.06] flex flex-col gap-3 px-3 py-3 max-h-[55vh] overflow-y-auto">
      {/* Presets — fila scroll horizontal */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">{t("mobileEditor.filters.presets")}</div>
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
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("mobileEditor.filters.fineAdjust")}</div>
        <AdjustSlider label={t("mobileEditor.filters.brightness")} value={brightness} min={-0.5} max={0.5} step={0.02} display={Math.round(brightness * 100)} onChange={onBrightness} onCommit={onCommit}/>
        <AdjustSlider label={t("mobileEditor.filters.contrast")}   value={contrast}   min={-0.5} max={0.5} step={0.02} display={Math.round(contrast * 100)}   onChange={onContrast}   onCommit={onCommit}/>
        <AdjustSlider label={t("mobileEditor.filters.saturation")} value={saturation} min={-1}   max={1}   step={0.05} display={Math.round(saturation * 100)} onChange={onSaturation} onCommit={onCommit}/>
      </div>

      {/* Rotacion + flip */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t("mobileEditor.filters.rotateFlip")}</div>
        <RotationSlider angle={angle} onRotation={onRotation} onCommit={onCommit}/>
        <div className="flex gap-2">
          <button
            onClick={onFlipH}
            className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold flex items-center justify-center gap-1.5"
            aria-label={t("mobileEditor.toast.flippedH")}
          >
            {t("mobileEditor.filters.flipH")}
          </button>
          <button
            onClick={onFlipV}
            className="flex-1 py-2 rounded-xl bg-white/[0.05] text-white text-[12px] font-bold flex items-center justify-center gap-1.5"
            aria-label={t("mobileEditor.toast.flippedV")}
          >
            {t("mobileEditor.filters.flipV")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Rotación slider con state local. */
function RotationSlider({
  angle, onRotation, onCommit,
}: {
  angle: number;
  onRotation: (v: number) => void;
  onCommit: () => void;
}) {
  const { t } = useLocale();
  const [val, setVal] = useState(angle);
  useEffect(() => { setVal(angle); }, [angle]);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[11px] text-gray-400 font-semibold">{t("mobileEditor.filters.rotation")}</span>
        <span className="text-[11px] text-purple-400 font-bold">{Math.round(val)}°</span>
      </div>
      <input
        type="range"
        min={-180} max={180} step={1}
        value={val}
        onChange={e => { const n = Number(e.target.value); setVal(n); onRotation(n); }}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="slider-mobile w-full"
        style={sliderFill(val, -180, 180)}
      />
    </div>
  );
}

/** Slider de ajuste con label + valor + commit al soltar.
 *  Usado para brillo/contraste/saturacion. State local sincronizado. */
function AdjustSlider({
  label, value, min, max, step, onChange, onCommit,
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
  const [val, setVal] = useState(value);
  useEffect(() => { setVal(value); }, [value]);
  // El display visible (escala a porcentaje aproximado) se computa del val local
  const liveDisplay = Math.round((val / (max - min)) * 200);
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-[11px] text-gray-400 font-semibold">{label}</span>
        <span className={`text-[11px] font-bold ${liveDisplay === 0 ? "text-gray-500" : "text-purple-400"}`}>
          {liveDisplay > 0 ? "+" : ""}{liveDisplay}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={val}
        onChange={e => { const n = Number(e.target.value); setVal(n); onChange(n); }}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="slider-mobile w-full"
        style={sliderFill(val, min, max)}
      />
    </div>
  );
}

/** Quitar fondo — CTA real al endpoint /api/remove-bg (BiRefNet). Muestra
 *  loading spinner mientras la IA procesa (~2-4s). Coste + balance visibles
 *  antes de tocar el botón (Z.16.1).
 */
function RemoveBgInline({
  loading, onConfirm, cost, balance,
}: {
  loading: boolean;
  onConfirm: () => void;
  cost: number;
  balance: number | null;
}) {
  const { t } = useLocale();
  const insufficient = balance !== null && balance < cost;
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
        {loading ? t("mobileEditor.removeBg.loadingTitle") : t("mobileEditor.removeBg.title")}
      </p>
      <p className="text-[10px] text-gray-500 leading-snug max-w-[280px]">
        {loading
          ? t("mobileEditor.removeBg.loadingDesc")
          : t("mobileEditor.removeBg.desc")
        }
      </p>
      {!loading && (
        <div className="text-[10px] flex items-center gap-1.5">
          <span className="text-gray-400">Coste:</span>
          <span className="font-bold text-purple-200">{cost} crédito{cost !== 1 ? "s" : ""}</span>
          {balance !== null && (
            <>
              <span className="text-gray-600">·</span>
              <span className={`font-bold ${insufficient ? "text-red-300" : "text-gray-300"}`}>
                Tienes {balance}
              </span>
            </>
          )}
        </div>
      )}
      <button
        onClick={onConfirm}
        disabled={loading || insufficient}
        className="mt-1 px-5 py-2 rounded-xl bg-purple-500 text-white text-[12px] font-bold active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        <Sparkles size={13} strokeWidth={2.5}/>
        {loading
          ? t("mobileEditor.removeBg.buttonLoading")
          : insufficient
            ? "Sin créditos"
            : t("mobileEditor.removeBg.button")}
      </button>
    </div>
  );
}

/** Capas Mágicas (Fase V.1) — convierte el flyer subido en plantilla
 *  editable. CTA real al endpoint /api/photo-to-template. Muestra cuota
 *  restante (X/3 para Free) y loading spinner mientras procesa (~14s). */
function MagicLayersInline({
  loading, onConfirm, quota,
}: {
  loading: boolean;
  onConfirm: () => void;
  quota: { used: number; limit: number; unlimited: boolean } | null;
}) {
  const remaining = quota && !quota.unlimited
    ? Math.max(0, quota.limit - quota.used)
    : null;
  const isOutOfQuota = remaining !== null && remaining === 0;
  return (
    <div className="border-b border-white/[0.06] px-4 py-4 flex flex-col items-center gap-2.5 text-center">
      <div className="w-11 h-11 rounded-full bg-fuchsia-500/15 flex items-center justify-center text-fuchsia-300">
        {loading ? (
          <div className="w-5 h-5 border-2 border-fuchsia-300 border-t-transparent rounded-full animate-spin"/>
        ) : (
          <Wand2 size={22}/>
        )}
      </div>
      <p className="text-[12px] text-gray-200 font-semibold">
        {loading ? "Analizando capas…" : "Convertir foto en plantilla editable"}
      </p>
      <p className="text-[10px] text-gray-500 leading-snug max-w-[300px]">
        {loading
          ? "Detectando textos, colores y elementos. Esto tarda ~15s."
          : "Sube un flyer hecho con ChatGPT o cualquier imagen y la convertimos en plantilla editable sin perder el diseño."
        }
      </p>
      {remaining !== null && !loading && (
        <p className={`text-[10px] font-bold ${isOutOfQuota ? "text-red-400" : "text-emerald-300"}`}>
          {isOutOfQuota
            ? `0/${quota!.limit} este mes — agotado`
            : `${remaining}/${quota!.limit} disponibles este mes`}
        </p>
      )}
      <button
        onClick={onConfirm}
        disabled={loading || isOutOfQuota}
        className="mt-1 px-5 py-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white text-[12px] font-bold active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        <Sparkles size={13} strokeWidth={2.5}/>
        {loading ? "Procesando…" : isOutOfQuota ? "Sin cuota" : "Convertir con IA"}
      </button>
    </div>
  );
}

// ─── COMUNES (Opacidad / Borde / Esquinas) ────────────────────────────────

/** Opacidad — slider 0-100. State local para sincronizar visual en vivo. */
function OpacitySlider({ current, onChange }: { current: number; onChange: (n: number) => void }) {
  const { t } = useLocale();
  const [pct, setPct] = useState(Math.round(current * 100));
  useEffect(() => { setPct(Math.round(current * 100)); }, [current]);
  return (
    <div className="border-b border-white/[0.06] px-4 py-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] text-gray-400 font-semibold">{t("mobileEditor.subtool.opacity")}</span>
        <span className="text-[11px] text-purple-400 font-bold">{pct}%</span>
      </div>
      <input
        type="range"
        min={0} max={100} step={1}
        value={pct}
        onChange={e => { const n = Number(e.target.value); setPct(n); onChange(n / 100); }}
        className="slider-mobile w-full"
        style={sliderFill(pct, 0, 100)}
      />
    </div>
  );
}

/** Borde — swatch color + slider grosor + boton Quitar.
 *  State local en el slider de grosor para sync visual en vivo. */
function BorderInline({
  currentColor, currentWidth, onColor, onWidth, onClear,
}: {
  currentColor: string;
  currentWidth: number;
  onColor: (c: string) => void;
  onWidth: (w: number) => void;
  onClear: () => void;
}) {
  const { t } = useLocale();
  const [wVal, setWVal] = useState(currentWidth);
  useEffect(() => { setWVal(currentWidth); }, [currentWidth]);
  return (
    <div className="border-b border-white/[0.06] flex flex-col gap-3 px-3 py-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {QUICK_COLORS.map(c => {
          const isAct = currentColor.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              onClick={() => onColor(c)}
              aria-label={`${t("mobileEditor.aria.borderColor")} ${c}`}
              className={`shrink-0 w-9 h-9 rounded-full border-2 ${isAct ? "border-purple-400 scale-110" : "border-white/15"} transition-transform`}
              style={{ background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
            />
          );
        })}
      </div>
      <div className="px-1">
        <div className="flex justify-between mb-1">
          <span className="text-[11px] text-gray-400 font-semibold">{t("mobileEditor.border.thickness")}</span>
          <span className="text-[11px] text-purple-400 font-bold">{Math.round(wVal)} px</span>
        </div>
        <input
          type="range"
          min={0} max={30} step={1}
          value={wVal}
          onChange={e => { const n = Number(e.target.value); setWVal(n); onWidth(n); }}
          className="slider-mobile w-full"
          style={sliderFill(wVal, 0, 30)}
        />
      </div>
      <button
        onClick={onClear}
        className="self-start text-[11px] px-3 py-1.5 rounded-full bg-white/[0.05] text-gray-300 font-semibold"
      >
        {t("mobileEditor.border.remove")}
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
  fileFormat: "png" | "jpg" | "pdf" | "svg";
  onFileFormatChange: (f: "png" | "jpg" | "pdf" | "svg") => void;
  onExportOne: (f: FormatId) => void;
  onExportAll: () => void;
}) {
  const available: FormatId[] = PUBLIC_FORMATS.filter(fmt =>
    !!template.variants.find(v => v.format === fmt)
  );
  const fileFormatHelp: Record<typeof fileFormat, string> = {
    png: "PNG sin pérdida. Texto nítido y bordes perfectos. Ideal imprimir o subir a Instagram en alta.",
    jpg: "JPG comprimido (~5× más liviano). Ideal WhatsApp y rapidez. Puede mostrar artefactos en texto fino.",
    pdf: "PDF para imprenta profesional. Tamaño real en mm, calidad de impresión. Ideal llevarlo a una imprenta o printable.",
    svg: "SVG vectorial. Editable en Illustrator/Figma/Inkscape sin perder calidad. Las redes sociales pueden no aceptarlo.",
  };
  return (
    <div className="flex flex-col gap-4">
      {/* Toggle PNG/JPG/PDF/SVG */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          Tipo de archivo
        </div>
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-black/30 border border-white/[0.06]">
          {(["png", "jpg", "pdf", "svg"] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => onFileFormatChange(fmt)}
              className={`py-2 rounded-lg text-[12px] font-bold transition-colors ${
                fileFormat === fmt
                  ? "bg-purple-500 text-white shadow-md"
                  : "text-gray-400 active:bg-white/[0.05]"
              }`}
            >
              {fmt.toUpperCase()}
              <span className="block text-[8px] font-normal opacity-70 mt-0.5">
                {fmt === "png" && "Calidad"}
                {fmt === "jpg" && "Ligero"}
                {fmt === "pdf" && "Imprenta"}
                {fmt === "svg" && "Vector"}
              </span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
          {fileFormatHelp[fileFormat]}
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

/** Sheet Foto — lista thumbnails de imagenes del canvas + Mis recursos
 *  guardados (Z.8.1) + boton añadir nueva. */
function PhotoSheet({
  fc, onSelectImage, onAddPhoto, myAssets, onAddFromUrl,
}: {
  fc: FabricCanvas | null;
  onSelectImage: (img: FabricImage) => void;
  onAddPhoto: (file: File) => void;
  // Z.8.1 — props para la sección "Mis recursos"
  myAssets: Array<{ id: string; url: string; name: string }>;
  onAddFromUrl: (url: string) => void;
}) {
  const { t } = useLocale();
  const images = (fc?.getObjects().filter(o => o.type === "image") ?? []) as FabricImage[];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
          {t("mobileEditor.photo.flyerPhotos")} ({images.length})
        </div>
        {images.length === 0 ? (
          <p className="text-[12px] text-gray-500 italic">{t("mobileEditor.photo.noPhotos")}</p>
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
          {t("mobileEditor.photo.tapToEdit")}
        </p>
      </div>

      {/* Z.8.1 — Mis recursos guardados (assets del user para reusar) */}
      {myAssets.length > 0 && (
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
            Mis recursos ({myAssets.length})
          </div>
          <div className="grid grid-cols-3 gap-2">
            {myAssets.map((a) => (
              <button
                key={a.id}
                onClick={() => onAddFromUrl(a.url)}
                title={a.name}
                className="aspect-square rounded-xl overflow-hidden bg-[#0a0a14] border-2 border-white/[0.08] active:border-purple-500 transition-colors relative"
                aria-label={`Añadir ${a.name} al canvas`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.name}
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain p-1"
                  style={{
                    backgroundImage: "linear-gradient(45deg, #2a2a3a 25%, transparent 25%), linear-gradient(-45deg, #2a2a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a3a 75%), linear-gradient(-45deg, transparent 75%, #2a2a3a 75%)",
                    backgroundSize: "10px 10px",
                    backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                  }}
                />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-2 text-center">
            Toca para añadir al canvas
          </p>
        </div>
      )}

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
            {t("mobileEditor.photo.uploadNew")}
          </span>
        </label>
        <p className="text-[10px] text-gray-500 text-center mt-2">
          {t("mobileEditor.photo.uploadHint")}
        </p>
      </div>
    </div>
  );
}

/** Esquinas — slider 0-100. Solo aplica a Rect; deshabilitado en otros.
 *  State local para barra en vivo. */
function CornerRadiusSlider({
  current, onChange, applicable,
}: {
  current: number;
  onChange: (n: number) => void;
  applicable: boolean;
}) {
  const { t } = useLocale();
  const [val, setVal] = useState(current);
  useEffect(() => { setVal(current); }, [current]);
  if (!applicable) {
    return (
      <div className="border-b border-white/[0.06] px-4 py-4 text-center text-[12px] text-gray-400">
        {t("mobileEditor.corners.onlyRect")}
      </div>
    );
  }
  return (
    <div className="border-b border-white/[0.06] px-4 py-3">
      <div className="flex justify-between mb-1.5">
        <span className="text-[11px] text-gray-400 font-semibold">{t("mobileEditor.corners.label")}</span>
        <span className="text-[11px] text-purple-400 font-bold">{Math.round(val)} px</span>
      </div>
      <input
        type="range"
        min={0} max={200} step={1}
        value={val}
        onChange={e => { const n = Number(e.target.value); setVal(n); onChange(n); }}
        className="slider-mobile w-full"
        style={sliderFill(val, 0, 200)}
      />
    </div>
  );
}

// ─── ONBOARDING OVERLAY (Fase M.3) ───────────────────────────────────────

/** Steps shape (titulos/bodies se traducen en runtime). */
const ONBOARDING_STEPS = [
  { titleKey: "mobileEditor.onb.step1Title", bodyKey: "mobileEditor.onb.step1Body", emoji: "👆", anchor: "canvas-top" as const },
  { titleKey: "mobileEditor.onb.step2Title", bodyKey: "mobileEditor.onb.step2Body", emoji: "➕", anchor: "bottom-add" as const },
  { titleKey: "mobileEditor.onb.step3Title", bodyKey: "mobileEditor.onb.step3Body", emoji: "🎨", anchor: "bottom-style" as const },
  { titleKey: "mobileEditor.onb.step4Title", bodyKey: "mobileEditor.onb.step4Body", emoji: "🚀", anchor: "header-export" as const },
] as const;

function OnboardingOverlay({
  step, onNext, onSkip,
}: {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { t } = useLocale();
  const data = ONBOARDING_STEPS[step] ?? ONBOARDING_STEPS[0];
  const isLast = step >= ONBOARDING_STEPS.length - 1;
  // Posicion de la card de mensaje según anchor
  const cardPos =
    data.anchor === "header-export"
      ? "top-[65px] right-3 left-3"
      : data.anchor === "canvas-top"
      ? "top-[30%] left-3 right-3"
      : data.anchor === "bottom-add" || data.anchor === "bottom-style"
      ? "bottom-[90px] left-3 right-3"
      : "top-1/2 left-3 right-3";

  return (
    <>
      {/* Backdrop oscuro semi-transparente */}
      <div
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-[1px] animate-in fade-in duration-300"
        onClick={onNext}
      />
      {/* Card del mensaje */}
      <div
        className={`fixed ${cardPos} z-[90] bg-gradient-to-br from-[#1c1c2a] to-[#13131f] border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-500/20 p-4 animate-in slide-in-from-bottom duration-300`}
      >
        <div className="flex items-start gap-3">
          <div className="text-[32px] leading-none shrink-0">{data.emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-white leading-tight mb-1">
              {t(data.titleKey as Parameters<typeof t>[0])}
            </h3>
            <p className="text-[12px] text-gray-300 leading-relaxed">
              {t(data.bodyKey as Parameters<typeof t>[0])}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
          <button
            onClick={onSkip}
            className="text-[11px] text-gray-500 font-semibold active:text-gray-300"
          >
            {t("mobileEditor.onb.skip")}
          </button>
          <div className="flex items-center gap-1.5">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? "bg-purple-400" : "bg-white/15"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onNext}
            className="px-4 py-1.5 rounded-full bg-purple-500 text-white text-[12px] font-bold active:scale-95 transition-transform"
          >
            {isLast ? t("mobileEditor.onb.start") : t("mobileEditor.onb.next")}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Sheet ASISTENTE IA (Fase O) ────────────────────────────────────────

/** Sheet del Asistente IA. Usuario escribe en lenguaje natural lo que
 *  quiere comunicar y la IA rellena los bloques editables del flyer. */
function AssistantSheet({
  category, loading, result, isAuthed, onRun, onApply, onCancel, onLogin, blocks,
}: {
  category?: string;
  loading: boolean;
  result: Record<string, string> | null;
  isAuthed: boolean;
  onRun: (prompt: string) => void;
  onApply: () => void;
  onCancel: () => void;
  onLogin: () => void;
  blocks: EditableBlock[];
}) {
  const { t } = useLocale();
  const [prompt, setPrompt] = useState("");

  // Si no esta logueado, mostrar CTA grande de login en lugar del flujo IA.
  if (!isAuthed) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
          <Wand2 size={26}/>
        </div>
        <div>
          <h3 className="text-[15px] font-bold">{t("mobileEditor.assistant.loginTitle")}</h3>
          <p className="text-[12px] text-gray-400 leading-relaxed max-w-[280px] mt-1">
            {t("mobileEditor.assistant.loginDesc")}
          </p>
        </div>
        <button
          onClick={onLogin}
          className="mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[13px] active:scale-[0.97] shadow-lg shadow-purple-500/30 flex items-center gap-2"
        >
          <Sparkles size={14} strokeWidth={2.4}/>
          {t("mobileEditor.assistant.loginBtn")}
        </button>
        <p className="text-[10px] text-gray-500">
          {t("mobileEditor.assistant.loginFooter")}
        </p>
      </div>
    );
  }

  const examples: Record<string, string[]> = {
    "Clases de baile": [
      "Clase de bachata sábado 22 nov 16-20h, Studio Kiz, 70€ early bird 60€",
      "Workshop kizomba con João & Catarina, todo el día domingo, Madrid 90€",
    ],
    "Conciertos": [
      "Concierto Don Filosofín viernes 20 jun 21h, Sala Apolo Barcelona, entrada libre",
      "Festival reggaeton sábado 12 julio 20h, Wizink Center Madrid, desde 45€",
    ],
    "Fiestas": [
      "Fiesta latina sábado 25 nov 23h hasta cierre, Sala Razzmatazz, 15€ con consumición",
      "Halloween party 31 oct 22h, mejor disfraz premio 500€, Sala Florida 135",
    ],
    "_default": [
      "Mi evento sábado 20 diciembre a las 20:00, Madrid centro, entrada 25€",
      "Workshop de fotografía digital fin de semana 14-15 enero, online o presencial",
    ],
  };
  const cat = category && examples[category] ? category : "_default";
  const tips = examples[cat];

  // Si hay resultado, mostrar preview de los valores aplicados
  if (result) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <Check size={16} className="text-emerald-400 shrink-0"/>
          <span className="text-[12px] text-emerald-200 font-semibold">
            {t("mobileEditor.assistant.previewTitle")}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 leading-snug">
          {t("mobileEditor.assistant.previewDesc")}
        </p>
        <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
          {Object.entries(result).map(([blockId, value]) => {
            const block = blocks.find(b => b.id === blockId);
            return (
              <div key={blockId} className="px-3 py-2 rounded-xl bg-[#13131f] border border-white/[0.06]">
                <div className="text-[9px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">
                  {block?.label ?? blockId}
                </div>
                <div className="text-[12px] text-white font-medium leading-snug">
                  {value || <span className="text-gray-500 italic">{t("mobileEditor.assistant.emptyValue")}</span>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.06] text-gray-300 text-[12px] font-bold active:scale-[0.97]"
          >
            {t("mobileEditor.assistant.retry")}
          </button>
          <button
            onClick={onApply}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-[12px] font-bold active:scale-[0.97] shadow-lg shadow-emerald-500/30"
          >
            {t("mobileEditor.assistant.apply")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2 p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30">
        <Wand2 size={16} className="text-purple-300 shrink-0 mt-0.5"/>
        <div>
          <div className="text-[12px] font-bold text-purple-200">
            {t("mobileEditor.assistant.headerTitle")}
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed mt-0.5">
            {t("mobileEditor.assistant.headerDesc")} ({blocks.length})
          </p>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={t("mobileEditor.assistant.placeholder")}
        rows={4}
        style={{ fontSize: 16 }}
        disabled={loading}
        className="w-full bg-[#0a0a14] border border-purple-500/30 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-[13px] outline-none focus:border-purple-500 resize-none disabled:opacity-50"
      />

      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
          {t("mobileEditor.assistant.examples")}
        </div>
        <div className="flex flex-col gap-1.5">
          {tips.map((tip, i) => (
            <button
              key={i}
              onClick={() => setPrompt(tip)}
              disabled={loading}
              className="text-left px-3 py-2 rounded-xl bg-[#13131f] border border-white/[0.06] text-[11px] text-gray-300 leading-snug active:bg-white/[0.04] disabled:opacity-50"
            >
              💡 {tip}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onRun(prompt)}
        disabled={loading || !prompt.trim()}
        className="w-full py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-purple-500/30 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
            {t("mobileEditor.assistant.generating")}
          </>
        ) : (
          <>
            <Sparkles size={14} strokeWidth={2.4}/>
            {t("mobileEditor.assistant.generate")}
          </>
        )}
      </button>

      <p className="text-[9px] text-gray-500 text-center leading-snug">
        {t("mobileEditor.assistant.poweredBy")}
      </p>
    </div>
  );
}

// ─── Sheet CAMBIAR FORMATO (Fase M.1) ────────────────────────────────────

/** Sheet con grid de formatos disponibles del template. Tap navega al
 *  mismo proyecto con el formato nuevo. Marca el actual con border. */
function ChangeFormatSheet({
  template, currentFormat, onSelect, pageCount, onAddPage,
}: {
  template: Template;
  currentFormat: FormatId | undefined;
  onSelect: (f: FormatId) => void;
  /** Z.25 — para mostrar bloque "Añadir página" dentro del sheet de formatos.
   *  Si los props no se pasan, no se renderiza (compatibilidad atrás). */
  pageCount?: number;
  onAddPage?: () => void;
}) {
  const available: FormatId[] = PUBLIC_FORMATS.filter(fmt =>
    !!template.variants.find(v => v.format === fmt)
  );
  return (
    <div className="flex flex-col gap-4">
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

      {/* Z.25 — Bloque "Añadir página" debajo del grid de formatos.
          Consolida en un solo sheet las acciones de estructura del documento
          (formato + paginas). El boton dedicado en bottom bar sigue existiendo. */}
      {onAddPage && (
        <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
          <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">Páginas</p>
          <button
            onClick={onAddPage}
            className="flex items-center justify-between gap-3 rounded-xl p-3 border border-white/[0.08] bg-white/[0.03] active:bg-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/25 to-pink-500/25 flex items-center justify-center shrink-0">
                <Copy size={18} strokeWidth={2.2} className="text-purple-200"/>
              </span>
              <div className="text-left">
                <div className="text-[13px] font-bold leading-tight">Añadir página</div>
                <div className="text-[10.5px] text-gray-500 leading-tight mt-0.5">
                  {pageCount && pageCount > 1 ? `Tu flyer tiene ${pageCount} páginas` : "Crea una segunda página al mismo proyecto"}
                </div>
              </div>
            </div>
            <Plus size={18} strokeWidth={2.4} className="text-gray-400 shrink-0"/>
          </button>
        </div>
      )}
    </div>
  );
}

/** Calcula el % de fill del slider para que el track muestre la parte
 *  rellenada en morado y la parte sin rellenar gris. Aplicado via CSS var
 *  --fill-pct que el linear-gradient del track lee. */
function sliderFill(value: number, min: number, max: number): React.CSSProperties {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return { ["--fill-pct" as string]: `${pct}%` } as React.CSSProperties;
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
  const { t } = useLocale();
  return (
    <div className="flex flex-col gap-5">
      {/* Texto */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          {t("mobileEditor.add.textSection")}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onAddText("title")}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-[#13131f] border border-white/[0.06] active:scale-[0.97] transition-transform"
          >
            <span className="text-[20px] font-black text-white" style={{ fontFamily: "Anton" }}>T</span>
            <span className="text-[10px] text-gray-400 font-semibold">{t("mobileEditor.add.title")}</span>
          </button>
          <button
            onClick={() => onAddText("subtitle")}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-[#13131f] border border-white/[0.06] active:scale-[0.97] transition-transform"
          >
            <span className="text-[16px] font-bold text-white" style={{ fontFamily: "Bebas Neue" }}>S</span>
            <span className="text-[10px] text-gray-400 font-semibold">{t("mobileEditor.add.subtitle")}</span>
          </button>
          <button
            onClick={() => onAddText("body")}
            className="flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-[#13131f] border border-white/[0.06] active:scale-[0.97] transition-transform"
          >
            <span className="text-[14px] text-white">Aa</span>
            <span className="text-[10px] text-gray-400 font-semibold">{t("mobileEditor.add.body")}</span>
          </button>
        </div>
      </div>

      {/* Formas */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          {t("mobileEditor.add.shapesSection")}
        </div>
        <div className="grid grid-cols-6 gap-2">
          <ShapeBtn icon={<SquareIcon size={18} fill="currentColor"/>} label={t("mobileEditor.add.rect")} onClick={() => onAddShape("rect")}/>
          <ShapeBtn icon={<CircleIcon size={18} fill="currentColor"/>} label={t("mobileEditor.add.circle")} onClick={() => onAddShape("circle")}/>
          <ShapeBtn icon={<Triangle size={18} fill="currentColor"/>} label={t("mobileEditor.add.triangle")} onClick={() => onAddShape("triangle")}/>
          <ShapeBtn icon={<Heart size={18} fill="currentColor"/>} label={t("mobileEditor.add.heart")} onClick={() => onAddShape("heart")}/>
          <ShapeBtn icon={<Star size={18} fill="currentColor"/>} label={t("mobileEditor.add.star")} onClick={() => onAddShape("star")}/>
          <ShapeBtn icon={<div className="w-4 h-0.5 bg-current"/>} label={t("mobileEditor.add.line")} onClick={() => onAddShape("line")}/>
        </div>
      </div>

      {/* Imagen nueva */}
      <div>
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          {t("mobileEditor.add.imageSection")}
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
            {t("mobileEditor.add.uploadPhoto")}
          </span>
        </label>
      </div>

      <p className="text-[10px] text-gray-500 leading-snug text-center pt-1">
        {t("mobileEditor.add.hint")}
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
  fc, onSelect, onMutate, onMultiSelect,
}: {
  fc: FabricCanvas | null;
  onSelect: (obj: FabricObject) => void;
  onMutate: () => void;
  /** Z.25 — al confirmar multi-seleccion, crea ActiveSelection en el canvas. */
  onMultiSelect?: (objs: FabricObject[]) => void;
}) {
  const { t } = useLocale();
  // Forzar re-render cuando el usuario hace cambios en la sheet
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  // Z.25 — modo seleccion multiple: cuando esta activo, cada tap añade/quita
  // del Set en lugar de seleccionar directamente.
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedSet, setSelectedSet] = useState<Set<number>>(new Set());

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
        {t("mobileEditor.layers.empty")}
        <br/>
        <span className="text-[11px] text-gray-500">{t("mobileEditor.layers.emptyHint")}</span>
      </div>
    );
  }

  const handleApplyMulti = () => {
    if (!onMultiSelect || selectedSet.size === 0) return;
    const picked: FabricObject[] = [];
    selectedSet.forEach((idx) => {
      if (visibleObjects[idx]) picked.push(visibleObjects[idx]);
    });
    onMultiSelect(picked);
    setMultiSelectMode(false);
    setSelectedSet(new Set());
  };

  const toggleSelection = (idx: number) => {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-gray-400 leading-snug flex-1">
          {multiSelectMode
            ? "Marca los elementos que quieres seleccionar juntos."
            : t("mobileEditor.layers.intro")}
        </p>
        <button
          onClick={() => {
            setMultiSelectMode((v) => !v);
            setSelectedSet(new Set());
          }}
          className={`shrink-0 text-[10.5px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
            multiSelectMode
              ? "bg-purple-500/20 border-purple-500/50 text-purple-200"
              : "bg-white/[0.04] border-white/[0.10] text-gray-300 active:bg-white/[0.08]"
          }`}
        >
          {multiSelectMode ? "Cancelar" : "Seleccionar varios"}
        </button>
      </div>

      {multiSelectMode && selectedSet.size > 0 && (
        <button
          onClick={handleApplyMulti}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-bold text-[12.5px] active:scale-[0.98] transition-transform"
        >
          Seleccionar {selectedSet.size} {selectedSet.size === 1 ? "elemento" : "elementos"}
        </button>
      )}
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
              return txt.length > 24 ? `${txt.slice(0, 24)}…` : (txt || t("mobileEditor.layers.fallback.text"));
            }
            if (type === "image") return t("mobileEditor.layers.fallback.image");
            if (type === "rect") return t("mobileEditor.layers.fallback.rect");
            if (type === "circle") return t("mobileEditor.layers.fallback.circle");
            if (type === "triangle") return t("mobileEditor.layers.fallback.triangle");
            return `${t("mobileEditor.layers.fallback.shape")} (${type})`;
          })();
          const isLocked = obj.lockMovementX === true;
          const isHidden = obj.visible === false;
          const isActive = fc?.getActiveObject() === obj;
          const isInMultiSet = selectedSet.has(idx);
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border ${
                multiSelectMode
                  ? isInMultiSet
                    ? "border-purple-500 bg-purple-500/15"
                    : "border-white/[0.06] bg-[#13131f]"
                  : isActive
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-white/[0.06] bg-[#13131f]"
              }`}
            >
              <button
                onClick={() => multiSelectMode ? toggleSelection(idx) : onSelect(obj)}
                className="flex-1 text-left min-w-0 flex items-center gap-2"
              >
                {/* Checkbox solo en modo multi-seleccion */}
                {multiSelectMode && (
                  <span className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isInMultiSet
                      ? "bg-purple-500 border-purple-500"
                      : "border-white/30 bg-transparent"
                  }`}>
                    {isInMultiSet && <Check size={12} strokeWidth={3} className="text-white"/>}
                  </span>
                )}
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
                aria-label={t("mobileEditor.layers.aria.up")}
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
                aria-label={t("mobileEditor.layers.aria.down")}
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
                aria-label={isHidden ? t("mobileEditor.layers.aria.show") : t("mobileEditor.layers.aria.hide")}
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
