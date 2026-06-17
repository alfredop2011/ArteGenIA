"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  // Sidebar / Dock (categorías)
  LayoutGrid, Type, Sparkles as SparklesIcon, Image as ImageIcon, Mountain,
  Layers as LayersIcon, Wand2, Tag, Heart,
  // Toolbar / Top bar
  ArrowLeft, Undo2, Redo2, Search, Share2, Save, Download, Send, Loader2,
  // Layers panel
  GripVertical, Eye, EyeOff, Lock, Unlock, Trash2,
  // Layer type indicators
  Square,
  // Properties / Align
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  // FAB
  Edit3, MoreHorizontal,
  // Collapsible
  ChevronDown, ChevronUp,
  // Text formatting (floating toolbar contextual)
  Bold, Italic,
  // Command palette icons
  Camera, Copy, Trash, FlipHorizontal, FlipVertical,
  MoveUp, MoveDown, PanelLeft, PanelBottom, Minimize2, Maximize2,
  FolderOpen, ArrowLeftCircle,
  // Empty / misc
  MousePointer2,
  // Formas extras + mask
  Triangle as TriangleIcon, Star, Hexagon, Minus, ArrowRight as ArrowRightIcon,
  SquareDashed, Scissors, X as XIconLuc,
  Circle as CircleIconLuc,
  // Z.16 — Quitar fondo dentro del editor
  Eraser,
  // Z.17 — Borrador mágico/manual
  Brush,
  // Z.25 — Dropdown cambiar formato (ChevronDown ya importado arriba)
  Check,
} from "lucide-react";
import type { Canvas as FabricCanvas, FabricObject, IText } from "fabric";
import {
  Shadow as FabricShadow,
  Rect as FabricRect,
  Circle as FabricCircle,
  Triangle as FabricTriangle,
  Line as FabricLine,
  Polygon as FabricPolygon,
  Path as FabricPath,
} from "fabric";
import { templates, type Template, type TemplateVariant, type AudienceId, getVariant } from "@/data/templates";
import { type FormatId, getFormatByDimensions, FORMATS, PUBLIC_FORMATS } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import { ArtistLibraryModal, type ArtistEntry } from "@/components/wizard/ArtistLibrary";
import { useProjects } from "@/hooks/useProjects";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useTemplateDrafts } from "@/hooks/useTemplateDrafts";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import DesktopEditorTour from "@/components/onboarding/DesktopEditorTour";
import { supabase } from "@/lib/supabase";
import { applyWatermark, shouldWatermark } from "@/lib/applyWatermark";
import { useLocale } from "@/hooks/useLocale";
import { useToast } from "@/lib/toast";
import ColorPickerPopover from "@/components/editor/ColorPickerPopover";
import KeyboardShortcutsModal from "@/components/editor/KeyboardShortcutsModal";
import FontPickerPopover from "@/components/editor/FontPickerPopover";
import PostDownloadModal from "@/components/editor/PostDownloadModal";
import { FEATURES } from "@/lib/features";
import { ConfirmCreditModal } from "@/components/credits/ConfirmCreditModal";
import { useCredits } from "@/hooks/useCredits";
import { CREDIT_COST, type CreditModule } from "@/lib/credits";
// Z.17 — Borrador mágico/manual para refinar bordes tras Quitar fondo
import BrushEraserModal from "@/components/editor/BrushEraserModal";

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
type LeftTool = "design" | "elements" | "text" | "photos" | "background" | "layers" | "ai" | "brand" | "favorites" | "myAssets";

// Z.8.1 — Asset de "Mis Recursos" cargado desde /api/assets para reusar
// en el editor sin tener que subir el archivo otra vez.
type MyAsset = {
  id: string;
  type: "sin_fondo" | "sticker_ia" | "generada_ia" | "subida";
  url: string;
  name: string;
};
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

// Z.18 — sintetiza un LayerItem cuando el objeto Fabric activo NO está en
// el array `layers` del state. Esto pasa con cualquier objeto añadido tras
// la carga inicial (segment-person, capas mágicas, drag de Fotos, etc.):
// el closure de los handlers selection:created tiene un array `newLayers`
// frozen del primer load. Sin fallback, setSelectedLayer(null) y el sidebar
// dice "Selecciona un elemento" aunque Fabric SÍ tenga activeObject.
//
// El helper también asigna customId al obj para que próximas búsquedas
// encuentren el mismo layer (idempotente).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function synthLayer(obj: any): LayerItem {
  const isText = obj.type === "i-text" || obj.type === "text" || obj.type === "textbox";
  const isImg = obj.type === "image";
  const isBg = (obj.customId ?? "") === "bg" || (obj.customId ?? "") === "background";
  const type: LayerType = isText ? "text" : isBg ? "background" : isImg ? "image" : "image";
  const text = isText ? String(obj.text ?? "").trim() : "";
  const name = isText
    ? (text.slice(0, 22) || "Texto")
    : isBg ? "Fondo"
    : isImg ? "Imagen"
    : "Forma";
  let id = String(obj.customId ?? "");
  if (!id) {
    id = `auto-${Math.random().toString(36).slice(2, 10)}`;
    obj.customId = id;
  }
  return { id, name, type, obj, visible: obj.visible !== false, locked: !obj.selectable };
}

/**
 * Detecta si una URL de imagen tiene canales transparentes muestreando píxeles.
 * Carga la imagen, la dibuja en un canvas 64x64 y comprueba alpha < 250
 * en cualquier píxel.
 *
 * Se usa antes de invocar remove-bg para evitar procesar imágenes que ya
 * son PNGs sin fondo (remove.bg a veces les añade fondo blanco al re-procesarlas).
 */
async function isImageTransparent(src: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(false);

        const ratio = Math.min(size / img.width, size / img.height);
        const sw = Math.max(1, Math.floor(img.width * ratio));
        const sh = Math.max(1, Math.floor(img.height * ratio));
        ctx.drawImage(img, 0, 0, sw, sh);

        const data = ctx.getImageData(0, 0, sw, sh).data;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 250) return resolve(true);
        }
        resolve(false);
      } catch {
        resolve(false);
      }
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = src;
  });
}

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
  if (type === "text")       return <Type      className="w-3.5 h-3.5 text-blue-400"   strokeWidth={2} />;
  if (type === "background") return <Mountain  className="w-3.5 h-3.5 text-green-400"  strokeWidth={2} />;
  return                            <ImageIcon className="w-3.5 h-3.5 text-purple-400" strokeWidth={2} />;
}

// ─── MAIN EDITOR ──────────────────────────────────────────────────────────────

type GeneratedEditorProps = {
  /** Si se pasa, el editor carga la plantilla por id en vez de leer localStorage. */
  templateId?: number;
  /** Variante de formato a cargar de la plantilla. Si no se pasa, usa la primera. */
  formatId?: FormatId;
  /** Si se pasa, el editor carga el proyecto guardado del usuario por su UUID. */
  projectId?: string;
  /**
   * Si se pasa, el editor carga una plantilla publicada (de templates_published Supabase).
   * Se trata como una plantilla normal pero sin id numerico en data/templates.ts.
   */
  publishedTemplate?: Template;
  /**
   * Si se pasa, el editor entra en MODO CREATOR ADMIN:
   *   - Carga las capas del draft desde Supabase (templates_draft)
   *   - Muestra barra metadata admin con titulo/categoria/audiencia/premium
   *   - Sustituye boton Save por "Guardar borrador" + anade "Publicar"
   *   - Cuando se publica, mueve a templates_published
   */
  draftId?: string;
};

export default function GeneratedEditor({ templateId, formatId, projectId, publishedTemplate, draftId }: GeneratedEditorProps = {}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);

  // Sistema Undo/Redo (Cmd+Z / Cmd+Shift+Z)
  const { captureInitial, pushSnapshot, pushSnapshotDebounced, undo, redo, canUndo, canRedo, reset: resetHistory } = useUndoRedo(fabricRef);

  const [data, setData] = useState<GeneratedData | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<LayerItem | null>(null);
  // Default a "design" (plantillas) — antes era "layers" pero hidden bajo
  // feature flag, no tendria sentido iniciar en una tab no renderizada.
  const [activeTool, setActiveTool] = useState<LeftTool>("design");
  const [artistsModalOpen, setArtistsModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  // PostDownload modal — guarda dataURL para reuso en compartir/copiar
  const [postDownload, setPostDownload] = useState<{ dataUrl: string; format: "png" | "jpg" } | null>(null);
  const [docTitle, setDocTitle] = useState("Diseño sin título");
  const [viewMode, setViewMode] = useState<ViewMode>("sidebar");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    style: true, effects: false, transform: false, position: false, animation: false,
  });
  const [zoom, setZoom] = useState(50);
  const [floatingToolbar, setFloatingToolbar] = useState<{visible: boolean; x: number; y: number; alignOpen: boolean; moreOpen: boolean}>({ visible: false, x: 0, y: 0, alignOpen: false, moreOpen: false });

  // ─── AUTH MODAL ──────────────────────────────────────────────────────────
  // Modal de login/registro que se abre cuando intentas descargar o guardar
  // sin sesion iniciada. Tras login exitoso, `onSuccess` reintenta la accion.
  const { user: authUser, profile: authProfile } = useAuth();
  const { t } = useLocale();
  const [authModalConfig, setAuthModalConfig] = useState<{ title: string; subtitle: string; onSuccess: () => void } | null>(null);
  /**
   * Si hay sesion, ejecuta `action` directamente. Si no, abre el AuthModal y
   * lo deja en cola para ejecutar tras login exitoso.
   */
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
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId ?? null);
  const [savingProject, setSavingProject] = useState(false);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);

  const { saveProject } = useProjects();
  const { toast } = useToast();
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [canvasSize, setCanvasSize] = useState({ w: 1080, h: 1350 });
  // Z.25 — dropdown para cambiar formato en vivo (desktop editor)
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  // Fase V.7 — Stickers IA (personas extraídas por SAM-3 al usar Capas
  // Mágicas). Se cargan desde fabric_json.__magicStickers del proyecto.
  // Se muestran en panel "IA" del sidebar — click añade al canvas.
  const [magicStickers, setMagicStickers] = useState<Array<{ id: string; src: string; originalX: number; originalY: number }>>([]);

  // ─── ADMIN CREATOR MODE (sesion 4 creador) ────────────────────────────────
  // Cuando se pasa draftId, el editor entra en modo admin: barra metadata
  // arriba, botones "Guardar borrador" y "Publicar" sustituyen al Save normal.
  // Si no hay draftId, esto no afecta para nada al editor normal.
  const isAdminMode = !!draftId;
  const { getDraft, saveDraft, publishDraft, createDraftFromPublished: _cdfp } = useTemplateDrafts();
  void _cdfp;
  const [adminTitle, setAdminTitle] = useState("");
  const [adminCategory, setAdminCategory] = useState("Otros");
  const [adminAudience, setAdminAudience] = useState<AudienceId[]>([]);
  const [adminPremium, setAdminPremium] = useState(false);
  const [adminInternalTags, setAdminInternalTags] = useState<string[]>([]);
  const [adminMetaOpen, setAdminMetaOpen] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminPublishing, setAdminPublishing] = useState(false);
  const [adminSavedRecently, setAdminSavedRecently] = useState(false);
  const isEditingPublished = adminInternalTags.some(t => t.startsWith("replaces:"));

  // ADMIN CATEGORIAS Y AUDIENCIAS (mismas que TemplateCreatorWrapper)
  const ADMIN_CATEGORIES = ["Concierto", "Festival", "Fiesta", "Conferencia", "Clases", "Promocional", "Otros"];
  const ADMIN_AUDIENCES: { id: AudienceId; label: string }[] = [
    { id: "academias", label: "Academias" },
    { id: "productoras", label: "Productoras" },
    { id: "freelance", label: "Freelance" },
    { id: "instituciones", label: "Instituciones" },
    { id: "agencias", label: "Agencias" },
    { id: "colegios", label: "Colegios" },
  ];

  // ─── MOBILE DETECTION + PANELS ────────────────────────────────────────────
  // Detecta viewport < 768px en cliente. Fuerza viewMode "dock" en mobile.
  // Bottom sheets: "layers" (modal capas), "properties" (drawer propiedades)
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState<"layers" | "properties" | "export" | null>(null);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  // ─── AUTO-FIT ZOOM EN MOBILE ───────────────────────────────────────
  // Cuando se carga el canvas o cambia su tamano en mobile, ajustar zoom
  // para que quepa en pantalla con margen comodo.
  useEffect(() => {
    if (!isMobile) return;
    if (!canvasSize.w || !canvasSize.h) return;
    // Ancho disponible: viewport - 24px padding (12 a cada lado)
    const availableW = window.innerWidth - 24;
    // Alto disponible: viewport - header (56) - dock bottom (~75) - margins (50)
    const availableH = window.innerHeight - 56 - 75 - 50;
    const zoomW = (availableW / canvasSize.w) * 100;
    const zoomH = (availableH / canvasSize.h) * 100;
    const fitZoom = Math.min(zoomW, zoomH);
    setZoom(Math.max(10, Math.min(100, Math.floor(fitZoom))));
  }, [isMobile, canvasSize.w, canvasSize.h]);

  // Auto-open properties panel when user selects a layer on mobile
  useEffect(() => {
    if (isMobile && selectedLayer && !mobilePanelOpen) {
      setMobilePanelOpen("properties");
    }
    if (!selectedLayer && mobilePanelOpen === "properties") {
      setMobilePanelOpen(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLayer, isMobile]);

  // Si la prop projectId cambia (HMR, navegacion interna), sincronizar el state
  // Sin esto, modificar un proyecto ya guardado podia crear duplicados en lugar de actualizar
  useEffect(() => {
    if (projectId && projectId !== currentProjectId) {
      setCurrentProjectId(projectId);
    }
  }, [projectId, currentProjectId]);

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
    // En mobile siempre dock (no se persiste preferencia)
    if (window.innerWidth < 768) {
      setViewMode("dock");
      return;
    }
    const saved = localStorage.getItem("artegenia-view-mode");
    if (saved === "sidebar" || saved === "dock") setViewMode(saved);
    const sections = localStorage.getItem("artegenia-open-sections");
    if (sections) {
      try { setOpenSections(JSON.parse(sections)); } catch {}
    }
  }, []);
  useEffect(() => {
    // No persistir si es mobile (siempre forzamos dock al cargar)
    if (window.innerWidth >= 768) {
      localStorage.setItem("artegenia-view-mode", viewMode);
    }
  }, [viewMode]);
  useEffect(() => {
    localStorage.setItem("artegenia-open-sections", JSON.stringify(openSections));
  }, [openSections]);

  // ─── RECALC TOOLBAR ON ZOOM / RESIZE / SCROLL ─────────────────────────────
  const updateToolbarRef = useRef<() => void>(() => {});
  // Guard: mientras el usuario edita un texto, NO mostramos la toolbar
  // (taparia el contenido que esta escribiendo). Se conmuta via fabric
  // events text:editing:entered/exited. Ref (no state) para que cambios
  // no causen re-render y porque updateFloatingToolbar lo lee sin deps.
  const isEditingTextRef = useRef(false);
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
        // Y dimensiones REALES del proyecto — evita race con setCanvasSize.
        // El useEffect de init canvas lee esto antes que canvasSize (que puede
        // no estar actualizado por timing de React batching).
        (window as unknown as { __pendingProjectDims?: { w: number; h: number } })
          .__pendingProjectDims = { w: row.width, h: row.height };
      })();
      return;
    }
    // Modo creator admin: cargar draft de Supabase como una plantilla
    if (draftId) {
      (async () => {
        const d = await getDraft(draftId);
        if (!d) {
          toast.error("Borrador no encontrado");
          router.push("/admin/templates/new");
          return;
        }
        // Hidratar estado admin
        setAdminTitle(d.title);
        setAdminCategory(d.category);
        setAdminAudience(d.audience as AudienceId[]);
        setAdminPremium(d.premium);
        setAdminInternalTags(d.internal_tags ?? []);
        setDocTitle(d.title);

        // Tratar el draft como una Template normal
        const variants = (d.variants as TemplateVariant[]) ?? [];
        if (variants.length === 0) {
          toast.error("El borrador no tiene variantes");
          router.push("/admin/templates/new");
          return;
        }
        const draftAsTemplate: Template = {
          id: -2,
          title: d.title,
          category: d.category,
          image: d.thumbnail_url ?? "",
          premium: d.premium,
          audience: d.audience as AudienceId[],
          internalTags: ["beta"],
          variants,
        };
        setTemplate(draftAsTemplate);
        const v = getVariant(draftAsTemplate, formatId);
        setData({
          format: v.width === v.height ? "cuadrado" : (v.width > v.height ? "evento" : "instagram"),
          palette: { colors: ["#ffffff", "#f5c518", "#0d0d1a"], label: "default" },
        });
      })();
      return;
    }
    // Modo plantilla publicada (Supabase templates_published): viene ya como Template object
    if (publishedTemplate) {
      setTemplate(publishedTemplate);
      setDocTitle(publishedTemplate.title);
      const v = getVariant(publishedTemplate, formatId);
      setData({
        format: v.width === v.height ? "cuadrado" : (v.width > v.height ? "evento" : "instagram"),
        palette: { colors: ["#ffffff", "#f5c518", "#0d0d1a"], label: "default" },
      });
      return;
    }
    // Modo plantilla: cargar la plantilla por id
    if (typeof templateId === "number") {
      const tpl = templates.find(t => t.id === templateId);
      if (tpl) {
        setTemplate(tpl);
        setDocTitle(tpl.title);
        const v = getVariant(tpl, formatId);
        // Construimos un GeneratedData mínimo para que el resto del editor tenga datos coherentes
        setData({
          format: v.width === v.height ? "cuadrado" : (v.width > v.height ? "evento" : "instagram"),
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
  }, [router, templateId, formatId]);

  // ─── INIT CANVAS ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    let isMounted = true;
    let canvas: FabricCanvas | null = null;

    (async () => {
      const fabric = await import("fabric");
      // Prioridad de dimensiones:
      // 1. Proyecto guardado (window.__pendingProjectDims): row.width/height
      //    persistidas. CRÍTICO para proyectos custom (Capas Mágicas) que
      //    pueden tener cualquier ratio — NO forzar 1080×1350.
      // 2. Plantilla: dimensiones de la variante.
      // 3. Wizard: formato seleccionado.
      const pendingDims = (window as unknown as { __pendingProjectDims?: { w: number; h: number } })
        .__pendingProjectDims;
      const dims = pendingDims
        ? pendingDims
        : template
          ? (() => { const v = getVariant(template, formatId); return { w: v.width, h: v.height }; })()
          : (FORMAT_DIMS[data.format ?? "instagram"] ?? FORMAT_DIMS.instagram);
      // Consumir el scratch para que no afecte futuras navegaciones a otro proyecto
      if (pendingDims) {
        delete (window as unknown as { __pendingProjectDims?: { w: number; h: number } })
          .__pendingProjectDims;
      }
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
          // ── Detectar formato Capas Mágicas (Fase V.1) ──────────────
          // Si viene marcado __magicLayers, aplicamos con applyTemplateLayers
          // (que carga imágenes async correctamente en lugar de loadFromJSON
          // que no espera a que las URLs HTTP terminen de cargar).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const magic = pendingJson as any;
          if (magic.__magicLayers === true && Array.isArray(magic.layers)) {
            await applyTemplateLayers(canvas, magic.layers);
            // Cargar stickers IA si vienen — el panel "IA" del sidebar los expone
            if (Array.isArray(magic.__magicStickers) && magic.__magicStickers.length > 0) {
              setMagicStickers(magic.__magicStickers);
              // Auto-abrir tab IA para que el usuario los descubra
              setActiveTool("ai");
            }
          } else {
            await canvas.loadFromJSON(pendingJson);
          }
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

          // ── SELECTION HANDLERS para proyecto guardado ──────────────
          // Bug fix: sin esto el panel derecho de propiedades nunca se
          // actualizaba al seleccionar objetos en proyectos cargados
          // (template handlers solo se registraban en MODO PLANTILLA).
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const handleSelProj = (obj: any) => {
            const id = (obj as FabricObject & { customId?: string }).customId ?? "";
            // Z.18 — fallback synthLayer si el customId no está en el array
            // (puede pasar con objetos añadidos post-load).
            const layer = newLayers.find(l => l.id === id) ?? synthLayer(obj);
            setSelectedLayer(layer);
            if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
              const t = obj as IText;
              const sh = t.shadow as { color?: string; blur?: number } | null;
              setTextProps({
                text: t.text ?? "",
                fontFamily: String(t.fontFamily ?? "Montserrat"),
                fontSize: t.fontSize ?? 60,
                fill: String(t.fill ?? "#ffffff"),
                textAlign: t.textAlign ?? "center",
                fontWeight: String(t.fontWeight ?? "700"),
                charSpacing: t.charSpacing ?? 0,
                lineHeight: t.lineHeight ?? 1.2,
                opacity: t.opacity ?? 1,
                angle: t.angle ?? 0,
                left: t.left ?? 0,
                top: t.top ?? 0,
                width: t.width ?? 900,
                shadow: !!sh,
                shadowColor: sh?.color ?? "#000000",
                shadowBlur: sh?.blur ?? 10,
              });
            } else {
              setImageProps({
                opacity: obj.opacity ?? 1,
                angle: obj.angle ?? 0,
                left: obj.left ?? 0,
                top: obj.top ?? 0,
                width: (obj.width ?? 400) * (obj.scaleX ?? 1),
                height: (obj.height ?? 600) * (obj.scaleY ?? 1),
                flipX: obj.flipX ?? false,
                flipY: obj.flipY ?? false,
              });
            }
          };
          canvas.on("selection:created", e => { const o = e.selected?.[0]; if (o) handleSelProj(o); updateFloatingToolbar(); });
          canvas.on("selection:updated", e => { const o = e.selected?.[0]; if (o) handleSelProj(o); updateFloatingToolbar(); });
          canvas.on("selection:cleared", () => { setSelectedLayer(null); setFloatingToolbar(p => ({ ...p, visible: false, alignOpen: false, moreOpen: false })); });
          canvas.on("object:modified", () => { const o = canvas?.getActiveObject(); if (o) handleSelProj(o); setSaveState("unsaved"); updateFloatingToolbar(); pushSnapshot(); });
          canvas.on("object:added",    () => { pushSnapshot(); });
          canvas.on("object:removed",  () => { pushSnapshot(); });
          canvas.on("text:changed",    () => { pushSnapshotDebounced(); });
          canvas.on("object:moving",   () => updateFloatingToolbar());
          canvas.on("object:scaling",  () => updateFloatingToolbar());
          return;
        } catch (e) {
          console.warn("Error cargando proyecto:", e);
        }
      }

      // ── MODO PLANTILLA ─────────────────────────────────────────────────────
      if (template) {
        try {
          const variant = getVariant(template, formatId);
          if (variant.layers) {
            // Plantilla declarativa: usar applyTemplateLayers y luego enumerar los objetos del canvas
            await applyTemplateLayers(canvas, variant.layers);
            // Recorrer objetos añadidos y registrarlos como capas
            const objs = canvas.getObjects();
            for (let i = 0; i < objs.length; i++) {
              const obj = objs[i];
              const tplLayer = variant.layers[i];
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
          // Z.18 — fallback synthLayer si customId no está mapeado.
          const layer = newLayers.find(l => l.id === id) ?? synthLayer(obj);
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
        canvas.on("object:modified", () => { const o = canvas?.getActiveObject(); if (o) handleSelTpl(o); setSaveState("unsaved"); updateFloatingToolbar(); pushSnapshot(); });
        canvas.on("object:added",    () => { pushSnapshot(); });
        canvas.on("object:removed",  () => { pushSnapshot(); });
        canvas.on("text:changed",    () => { pushSnapshotDebounced(); });
        canvas.on("object:moving",   () => updateFloatingToolbar());
        canvas.on("object:scaling",  () => updateFloatingToolbar());
        canvas.on("object:rotating", () => updateFloatingToolbar());
        // Ocultar toolbar al entrar en modo edicion de texto (doble-click).
        // Marcamos isEditingTextRef PRIMERO para que cualquier otro evento
        // (selection:updated tras el dblclick, etc.) tambien bail-out.
        canvas.on("text:editing:entered", () => {
          isEditingTextRef.current = true;
          setFloatingToolbar(p => ({ ...p, visible: false, alignOpen: false, moreOpen: false }));
        });
        canvas.on("text:editing:exited", () => {
          isEditingTextRef.current = false;
          updateFloatingToolbar();
        });

        // Estado inicial limpio para el historial
        captureInitial();
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
        // Z.18 — fallback synthLayer si customId no está mapeado.
        const layer = newLayers.find(l => l.id === id) ?? synthLayer(obj);
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
      canvas.on("object:modified", () => { const o = canvas?.getActiveObject(); if (o) handleSel(o); setSaveState("unsaved"); updateFloatingToolbar(); pushSnapshot(); });
      canvas.on("object:added",    () => { pushSnapshot(); });
      canvas.on("object:removed",  () => { pushSnapshot(); });
      canvas.on("text:changed",    () => { pushSnapshotDebounced(); });
      canvas.on("object:moving",   () => updateFloatingToolbar());
      canvas.on("object:scaling",  () => updateFloatingToolbar());
      canvas.on("object:rotating", () => updateFloatingToolbar());
      // Ocultar toolbar al entrar en modo edicion de texto (doble-click).
      // Marca el ref guard primero para que cualquier evento posterior
      // (selection:updated, etc.) tambien respete el bail-out.
      canvas.on("text:editing:entered", () => {
        isEditingTextRef.current = true;
        setFloatingToolbar(p => ({ ...p, visible: false, alignOpen: false, moreOpen: false }));
      });
      canvas.on("text:editing:exited", () => {
        isEditingTextRef.current = false;
        updateFloatingToolbar();
      });

      // Estado inicial limpio para el historial
      captureInitial();
    })();

    return () => { isMounted = false; resetHistory(); canvas?.dispose(); fabricRef.current = null; };
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

  // ─── KEYBOARD: atajos contextuales (z-order y duplicar) ────────────────
  // Atajos:
  //   ]      → traer adelante (bring forward)
  //   [      → enviar atras  (send backward)
  //   ⌘D     → duplicar elemento seleccionado
  // No interfieren mientras el usuario escribe en input/textarea.
  // Usamos refs para `moveLayer` / `duplicateActiveObject` porque estan
  // declaradas mas abajo en el componente (hoisting block-scoped no aplica
  // a const). Los refs se actualizan via useEffect cuando esas funciones
  // cambian — el handler global no se re-attacha.
  const moveLayerRef = useRef<((id: string, dir: "up" | "down") => void) | null>(null);
  const duplicateRef = useRef<(() => Promise<void> | void) | null>(null);
  const selectedLayerRef = useRef<LayerItem | null>(null);
  useEffect(() => { selectedLayerRef.current = selectedLayer; }, [selectedLayer]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const layer = selectedLayerRef.current;
      if (!layer) return;
      if (e.key === "]") { e.preventDefault(); moveLayerRef.current?.(layer.id, "up"); return; }
      if (e.key === "[") { e.preventDefault(); moveLayerRef.current?.(layer.id, "down"); return; }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        void duplicateRef.current?.();
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ─── KEYBOARD: tecla "?" abre modal de atajos ──────────────────────────
  // Separado porque no requiere selectedLayer y debe funcionar siempre.
  // Excepto cuando el usuario escribe en input/textarea (donde "?" es char).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "?") return;
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      setShortcutsOpen(s => !s);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ─── MOBILE KEYBOARD AVOIDANCE ─────────────────────────────────────────
  // Cuando el teclado nativo (iOS/Android) aparece, cubre la mitad inferior
  // de la pantalla — si el usuario esta editando texto en la parte baja del
  // canvas, no ve lo que escribe. Solucion: usamos visualViewport API para
  // detectar el cambio de altura y hacemos scroll del canvas al centro del
  // area visible.
  //
  // Solo aplica en mobile (desktop nunca tiene teclado virtual). La deteccion
  // de keyboard es: visualViewport.height significativamente menor que window.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return; // navegadores viejos sin API — degradacion grácil
    const isMobileViewport = window.innerWidth < 768;
    if (!isMobileViewport) return;
    const handleResize = () => {
      // Heuristica: si la altura visible es <85% de window.innerHeight,
      // asumimos teclado abierto. Es robusto vs el bottom UI variable de iOS.
      const isKeyboardOpen = vv.height < window.innerHeight * 0.85;
      if (!isKeyboardOpen) return;
      // Si hay un texto en edicion, scroll para que el canvas quede visible
      const canvas = fabricRef.current;
      const active = canvas?.getActiveObject();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isEditing = !!active && ((active as any).isEditing === true);
      if (!isEditing) return;
      // Scroll al wrapper del canvas — center en viewport visible
      const wrapper = canvasWrapperRef.current;
      if (wrapper) {
        // requestAnimationFrame para que el browser termine el resize antes
        requestAnimationFrame(() => {
          wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    };
    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);

  // ─── TEXT PROPS ───────────────────────────────────────────────────────────

  // Tipos Fabric que consideramos "texto editable". Antes era solo
  // ["i-text","text"] — pero las plantillas crean instancias de Textbox
  // (ver fabricApplyTemplateLayers.ts:76), asi que TODO cambio en el panel
  // se ignoraba silenciosamente: fontSize, color, peso, fuente, etc.
  // FIX P0-mobile/edit: incluir "textbox" + variantes mayusculas que algunos
  // codecs Fabric reportan.
  const TEXT_TYPES = ["i-text", "text", "textbox", "IText", "Text", "Textbox"];

  const applyTextProp = useCallback(<K extends keyof TextProps>(key: K, value: TextProps[K]) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject() as IText | undefined;
    if (!obj || !TEXT_TYPES.includes(obj.type ?? "")) return;
    setTextProps(prev => ({ ...prev, [key]: value }));
    if (key === "text") { obj.set("text", String(value)); }
    else if (key === "shadow") { obj.set("shadow", value ? { color: textProps.shadowColor, blur: textProps.shadowBlur, offsetX: 2, offsetY: 2 } as never : null as never); }
    else if (key === "shadowColor" || key === "shadowBlur") { if (textProps.shadow) obj.set("shadow", { color: key === "shadowColor" ? String(value) : textProps.shadowColor, blur: key === "shadowBlur" ? Number(value) : textProps.shadowBlur, offsetX: 2, offsetY: 2 } as never); }
    else { obj.set(key as keyof IText, value as never); }
    canvas?.renderAll(); setSaveState("unsaved");
    // Tras cambio de tamano/peso/fuente el bbox puede cambiar — sincroniza
    // los coords para que los handles se redibujen en la posicion correcta.
    obj.setCoords?.();
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

  // ─── HALO / SHADOW DE IMAGEN ─────────────────────────────────────────────
  // 3 presets rapidos (claro / oscuro / sin halo) + selector avanzado de
  // color y blur. Trabaja directo sobre el objeto activo en el canvas.
  const setHaloPreset = useCallback((preset: "light" | "dark" | "none") => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    if (preset === "none") {
      obj.set("shadow", null);
    } else {
      const color = preset === "light" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)";
      obj.set("shadow", new FabricShadow({ color, blur: 40, offsetX: 0, offsetY: 0 }));
    }
    canvas?.renderAll();
    setSaveState("unsaved");
    // Forzar re-render del panel para reflejar el cambio en sliders/picker
    setSelectedLayer(prev => prev ? { ...prev } : prev);
  }, []);

  /** Aplica color del halo. Si no hay halo previo, lo crea con blur default 40. */
  const setHaloColor = useCallback((color: string) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    const existing = obj.shadow as FabricShadow | null;
    const blur = existing && typeof existing === "object" ? (existing.blur ?? 40) : 40;
    obj.set("shadow", new FabricShadow({ color, blur, offsetX: 0, offsetY: 0 }));
    canvas?.renderAll();
    setSaveState("unsaved");
    setSelectedLayer(prev => prev ? { ...prev } : prev);
  }, []);

  /** Aplica blur del halo. Si no hay halo previo, lo crea con color blanco. */
  const setHaloBlur = useCallback((blur: number) => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    const existing = obj.shadow as FabricShadow | null;
    const color = existing && typeof existing === "object" && existing.color
      ? existing.color
      : "rgba(255,255,255,0.85)";
    obj.set("shadow", new FabricShadow({ color, blur, offsetX: 0, offsetY: 0 }));
    canvas?.renderAll();
    setSaveState("unsaved");
    setSelectedLayer(prev => prev ? { ...prev } : prev);
  }, []);

  // Estado de UI: si esta abierto el selector avanzado de halo
  const [haloAdvancedOpen, setHaloAdvancedOpen] = useState(false);

  // ─── SEGMENTACION PERSONA (Fal.ai SAM-2) ─────────────────────────────────
  // Modal multi-tap: el usuario hace varios clicks sobre la misma persona
  // (cabeza, torso, brazo, pierna...) y SAM-2 entiende que son partes del
  // MISMO objeto. Cuando pulsa "Recortar", se envia el array de puntos.
  const [segmentState, setSegmentState] = useState<{
    open: boolean;
    imgSrc: string;
    naturalW: number;
    naturalH: number;
    taps: Array<{ x: number; y: number }>;  // coords NATURALES de imagen
    isPainting: boolean;                     // true mientras mouse esta presionado (brocha)
    hd: boolean;                             // modo HD: refinamiento con BRIA tras SAM-2
    loading: boolean;
    error: string | null;
  }>({ open: false, imgSrc: "", naturalW: 0, naturalH: 0, taps: [], isPainting: false, hd: false, loading: false, error: null });

  /** Abre el modal con la imagen activa. Funciona para cualquier foto del
   *  canvas — subidas por el usuario y las que vienen en la plantilla. */
  const openSegmentModal = useCallback(() => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj || obj.type !== "image") return;
    // Obtener el dataURL/URL de la imagen. Fabric.Image guarda el elemento HTML
    // en `_element` o `_originalElement`; usamos getSrc() que es la API publica.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src = (obj as any).getSrc?.() as string | undefined;
    if (!src) {
      console.warn("[segment] no se pudo obtener src de la imagen activa");
      return;
    }
    // Cargamos un Image en JS para conocer las dimensiones naturales (necesarias
    // para escalar las coordenadas del tap a coords de imagen original).
    const probe = new Image();
    probe.crossOrigin = "anonymous";
    probe.onload = () => {
      setSegmentState({
        open: true,
        imgSrc: src,
        naturalW: probe.naturalWidth,
        naturalH: probe.naturalHeight,
        taps: [],
        isPainting: false,
        hd: false,
        loading: false,
        error: null,
      });
    };
    probe.onerror = () => {
      setSegmentState(s => ({ ...s, error: "No se pudo cargar la imagen" }));
    };
    probe.src = src;
  }, []);

  /** Helper: cierra el modal de segment limpiando todo el state. */
  const closeSegmentModal = useCallback(() => {
    setSegmentState({ open: false, imgSrc: "", naturalW: 0, naturalH: 0, taps: [], isPainting: false, hd: false, loading: false, error: null });
  }, []);

  /** Anade un tap al array (coords naturales de imagen). */
  const addSegmentTap = useCallback((xRatio: number, yRatio: number) => {
    setSegmentState(s => {
      if (s.loading) return s;
      const x = Math.round(xRatio * s.naturalW);
      const y = Math.round(yRatio * s.naturalH);
      return { ...s, taps: [...s.taps, { x, y }], error: null };
    });
  }, []);

  /** Quita el ultimo tap (boton "Deshacer ultimo"). */
  const undoLastSegmentTap = useCallback(() => {
    setSegmentState(s => ({ ...s, taps: s.taps.slice(0, -1) }));
  }, []);

  /** Limpia todos los taps. */
  const clearSegmentTaps = useCallback(() => {
    setSegmentState(s => ({ ...s, taps: [] }));
  }, []);

  /**
   * Compone imagen original + mask de SAM-2 para generar un PNG transparente
   * con solo la persona segmentada. Devuelve dataURL.
   *
   * IMPORTANTE: la mask que devuelve SAM-2 es PNG RGB blanco/negro SIN canal
   * alpha (toda opaca). destination-in usa alpha, asi que primero convertimos
   * brillo RGB → alpha (blanco=255, negro=0). Sin este paso TODA la imagen
   * queda opaca y no se recorta nada.
   */
  const composeMaskedImage = useCallback(async (imageUrl: string, maskUrl: string): Promise<string> => {
    const [img, mask] = await Promise.all([
      new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => res(im);
        im.onerror = () => rej(new Error("error cargando imagen original"));
        im.src = imageUrl;
      }),
      new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => res(im);
        im.onerror = () => rej(new Error("error cargando mask"));
        im.src = maskUrl;
      }),
    ]);

    const w = img.naturalWidth;
    const h = img.naturalHeight;

    // 1. Preparar mask en canvas auxiliar.
    // SAM-2 puede devolver mask en 2 formatos distintos segun version/params:
    //   A) RGB blanco/negro SIN alpha (toda opaca) → R indica persona
    //   B) PNG con alpha real (alpha indica persona)
    // Detectamos cual es y normalizamos a alpha real.
    const maskCv = document.createElement("canvas");
    maskCv.width = w;
    maskCv.height = h;
    const maskCtx = maskCv.getContext("2d");
    if (!maskCtx) throw new Error("canvas mask 2d no disponible");
    maskCtx.drawImage(mask, 0, 0, w, h);
    const maskData = maskCtx.getImageData(0, 0, w, h);
    // Detectar si la mask trae alpha variable (al menos un pixel con alpha<255 y otro con alpha>0)
    let hasVariableAlpha = false;
    let foundOpaque = false;
    let foundTransparent = false;
    for (let i = 3; i < maskData.data.length; i += 4) {
      const a = maskData.data[i];
      if (a > 250) foundOpaque = true;
      else if (a < 10) foundTransparent = true;
      if (foundOpaque && foundTransparent) { hasVariableAlpha = true; break; }
    }
    if (!hasVariableAlpha) {
      // No hay alpha variable → asumimos formato A: R = brillo de persona
      for (let i = 0; i < maskData.data.length; i += 4) {
        maskData.data[i + 3] = maskData.data[i] > 128 ? 255 : 0;
      }
      maskCtx.putImageData(maskData, 0, 0);
    }
    // Si hasVariableAlpha=true, dejamos la mask como vino — alpha ya esta bien

    // 2. Dibujar imagen original + aplicar mask con alpha como destination-in
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d");
    if (!ctx) throw new Error("canvas 2d no disponible");
    ctx.drawImage(img, 0, 0, w, h);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(maskCv, 0, 0);
    ctx.globalCompositeOperation = "source-over";

    return cv.toDataURL("image/png");
  }, []);

  /**
   * Procesa todos los taps acumulados: llama al endpoint, recibe imagen
   * recortada y la añade como nueva capa al canvas.
   */
  const processSegmentTaps = useCallback(async () => {
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
          hd: segmentState.hd,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error en el servidor" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const responseData = await res.json();
      const { segmentedUrl, cropBounds } = responseData;
      console.log("[segment-debug] response:", responseData);
      if (!segmentedUrl) throw new Error("No se recibio la persona recortada");
      if (!cropBounds) throw new Error("No se recibio el bbox del crop");

      // CREAR NUEVA capa con la persona aislada (no reemplaza la original).
      const canvas = fabricRef.current;
      const sourceObj = canvas?.getActiveObject();
      if (!sourceObj || sourceObj.type !== "image" || !canvas) {
        throw new Error("Imagen activa no disponible");
      }
      const fabric = await import("fabric");
      const newImg = await fabric.FabricImage.fromURL(segmentedUrl, { crossOrigin: "anonymous" });

      // Posicionar la nueva imagen EN LA POSICION EXACTA donde estaba la
      // persona en la foto original. Para eso traducimos las coords del
      // bbox (que estan en pixeles de la imagen original) a coords del
      // canvas (sourceObj puede estar escalado/desplazado).
      const naturalW = sourceObj.width ?? 1;
      const naturalH = sourceObj.height ?? 1;
      const scaleX = sourceObj.scaleX ?? 1;
      const scaleY = sourceObj.scaleY ?? 1;
      const srcLeft = sourceObj.left ?? 0;
      const srcTop = sourceObj.top ?? 0;
      // Si sourceObj tiene originX=center, ajustamos el offset
      const sox = sourceObj.originX === "center" ? -naturalW * scaleX / 2 : sourceObj.originX === "right" ? -naturalW * scaleX : 0;
      const soy = sourceObj.originY === "center" ? -naturalH * scaleY / 2 : sourceObj.originY === "bottom" ? -naturalH * scaleY : 0;
      const cropLeftOnCanvas = srcLeft + sox + cropBounds.x * scaleX;
      const cropTopOnCanvas  = srcTop  + soy + cropBounds.y * scaleY;

      newImg.set({
        left: cropLeftOnCanvas,
        top: cropTopOnCanvas,
        originX: "left",
        originY: "top",
        angle: sourceObj.angle ?? 0,
        scaleX: scaleX,
        scaleY: scaleY,
        selectable: true,
        evented: true,
      });
      const newId = `segment-${uid()}`;
      (newImg as FabricObject & { customId?: string }).customId = newId;
      (newImg as FabricObject & { isUserUpload?: boolean }).isUserUpload = true;
      canvas.add(newImg);
      canvas.setActiveObject(newImg);
      canvas.renderAll();
      const newLayer: LayerItem = { id: newId, name: "Persona aislada", type: "image", obj: newImg, visible: true, locked: false };
      setLayers(prev => [newLayer, ...prev]);
      setSelectedLayer(newLayer);
      setSaveState("unsaved");
      closeSegmentModal();
    } catch (e) {
      console.error("[segment] error:", e);
      setSegmentState(s => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Error inesperado" }));
    }
  }, [segmentState.imgSrc, segmentState.taps, segmentState.hd, closeSegmentModal]);

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
    // Guard: si el usuario esta editando un texto, NO mostramos la toolbar
    // (taparia lo que esta escribiendo). Lee isEditing DIRECTO del objeto
    // (mas robusto que depender solo del evento text:editing:entered, que
    // a veces tarda o no se dispara en headless/programatico).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isEditing = (obj as any).isEditing === true || isEditingTextRef.current;
    if (isEditing) {
      setFloatingToolbar(prev => prev.visible ? { ...prev, visible: false, alignOpen: false, moreOpen: false } : prev);
      return;
    }
    // ─── REGLA: TOOLBAR SIEMPRE DENTRO DEL CANVAS (lienzo) ────────────────
    //   Para evitar que la toolbar se vaya al area negra del workspace o se
    //   esconda detras de la zoom bar / panel lateral, la clampeamos siempre
    //   al rectangulo del propio canvas. El usuario nunca ve la toolbar fuera
    //   del lienzo que esta editando.
    //
    //   La toolbar se renderiza con transform: translate(-50%, -100%):
    //     - top:Y → la toolbar ocupa el rango [Y-H, Y] en pantalla
    //     - left:X → centrada horizontalmente en X
    //
    //   Logica Y:
    //     1) Preferir arriba del bbox si la toolbar entera cabe arriba dentro
    //        del canvas (Y-H >= canvasRect.top)
    //     2) Sino, abajo del bbox si su bottom (Y) cabe dentro (Y <= canvasRect.bottom)
    //     3) Sino (objeto mas grande que toolbar height), clampear a los
    //        bordes del canvas
    //
    //   Logica X: centrado en el bbox, clampeado al canvas para que la toolbar
    //   entera quepa horizontalmente.
    // ─────────────────────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvasEl = (canvas as any).lowerCanvasEl as HTMLCanvasElement | undefined ?? canvas.getElement();
    const canvasRect = canvasEl?.getBoundingClientRect();
    if (!canvasRect) {
      setFloatingToolbar(prev => ({ ...prev, visible: false }));
      return;
    }
    const bounds = obj.getBoundingRect();

    const TOOLBAR_HEIGHT = 56;        // altura real medida (55px + margen)
    const TOOLBAR_WIDTH_APPROX = 460; // ancho aproximado
    const PAD = 12;                   // separacion del bbox

    // Bbox del objeto en coords del viewport
    const objTop = canvasRect.top + bounds.top;
    const objBottom = objTop + bounds.height;
    const objCenterX = canvasRect.left + bounds.left + bounds.width / 2;

    // ─── REGLA CRITICA: NUNCA TAPAR EL BBOX ──────────────────────────────
    // El usuario reporto que la toolbar quedaba encima del objeto impidiendo
    // editar/mover. Cambio total: la toolbar SIEMPRE va arriba o abajo del
    // bbox, NUNCA solapada. Si para eso hay que salir del canvas, mejor
    // afuera que encima — el usuario ve la toolbar pero al objeto tambien.
    //
    // Prioridades:
    //   1) Arriba del bbox dentro del canvas (preferido)
    //   2) Abajo del bbox dentro del canvas
    //   3) Arriba del bbox aunque fuera del canvas (en el viewport)
    //   4) Abajo del bbox aunque fuera del canvas
    //   5) Forzar abajo (caso patologico — objeto ocupa todo el viewport)
    // ─────────────────────────────────────────────────────────────────────
    const tryAboveY = objTop - PAD;
    const tryBelowY = objBottom + PAD + TOOLBAR_HEIGHT;
    const aboveTopInViewport = tryAboveY - TOOLBAR_HEIGHT;
    const belowBottomInViewport = tryBelowY;

    let y: number;
    if (aboveTopInViewport >= canvasRect.top) {
      y = tryAboveY;  // arriba bbox dentro canvas
    } else if (belowBottomInViewport <= canvasRect.bottom) {
      y = tryBelowY;  // abajo bbox dentro canvas
    } else if (aboveTopInViewport >= 8) {
      y = tryAboveY;  // arriba bbox fuera canvas pero en viewport
    } else if (belowBottomInViewport <= window.innerHeight - 8) {
      y = tryBelowY;  // abajo bbox fuera canvas pero en viewport
    } else {
      y = tryBelowY;  // forzar abajo (clipado abajo del viewport, raro)
    }

    // X centrado bajo el bbox, clampeado al canvas
    const halfW = TOOLBAR_WIDTH_APPROX / 2;
    const xMin = canvasRect.left + halfW + PAD;
    const xMax = canvasRect.right - halfW - PAD;
    let clampedX: number;
    if (xMin >= xMax) {
      // Canvas mas estrecho que toolbar — centrar al canvas
      clampedX = (canvasRect.left + canvasRect.right) / 2;
    } else {
      clampedX = Math.max(xMin, Math.min(objCenterX, xMax));
    }

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
        // PERO antes verificamos si la imagen YA es transparente (PNG sin fondo).
        // Si lo es, saltamos remove-bg para no estropearla (remove.bg sobre PNGs
        // sin fondo a veces devuelve la imagen con fondo blanco generado).
        let srcUrl = entry.imageSrc;
        if (entry.removeBackground) {
          const alreadyTransparent = await isImageTransparent(entry.imageSrc).catch(() => false);
          if (alreadyTransparent) {
            console.log("[editor] Imagen ya transparente, saltando remove-bg:", entry.id);
          } else {
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
          // Halo claro automatico para artistas (mismo look que plantillas).
          // Logos no llevan halo. El usuario puede quitarlo o cambiar a oscuro
          // desde el panel de propiedades de imagen.
          shadow: isLogo ? undefined : new fabric.Shadow({
            color: "rgba(255,255,255,0.85)",
            blur: 40,
            offsetX: 0,
            offsetY: 0,
          }),
        });
        (img as FabricObject & { customId?: string }).customId = entry.id;
        // Marca foto subida por usuario — habilita el boton "Recortar persona"
        // (segmentacion con Fal.ai SAM-2) en el panel de propiedades.
        (img as FabricObject & { isUserUpload?: boolean }).isUserUpload = true;
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

  // Duplica el objeto activo del canvas. En Fabric 7, clone() devuelve Promise.
  const duplicateActiveObject = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj || !selectedLayer) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cloned = await (obj as any).clone();
      if (!cloned) return;
      cloned.set({ left: (obj.left ?? 0) + 30, top: (obj.top ?? 0) + 30 });
      const newId = `dup-${uid()}`;
      (cloned as FabricObject & { customId?: string }).customId = newId;
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      setLayers(prev => [
        { id: newId, name: `${selectedLayer.name} (copia)`, type: selectedLayer.type, obj: cloned, visible: true, locked: false },
        ...prev,
      ]);
      setSaveState("unsaved");
    } catch (err) {
      console.error("[duplicate] clone failed:", err);
    }
  }, [selectedLayer]);

  // Sync de refs para atajos de teclado (], [, ⌘D) — declarados arriba pero
  // necesitan apuntar a las versiones actuales de moveLayer/duplicate.
  useEffect(() => { moveLayerRef.current = moveLayer; }, [moveLayer]);
  useEffect(() => { duplicateRef.current = duplicateActiveObject; }, [duplicateActiveObject]);

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
    setLayers(prev => [newLayer, ...prev]); setSelectedLayer(newLayer); setSaveState("unsaved");
    // Antes setActiveTool("layers") — pero layers esta hidden en MVP, no
    // hace falta cambiar de tab tras agregar capa.
    if (FEATURES.layersPanel) setActiveTool("layers");
  }, [canvasSize]);

  // ─── ADD SHAPES (rect, circle, triangle, line, star, hex, arrow, frame) ──
  /** Helper interno: registra un FabricObject como nueva capa y selecciona. */
  const addShapeToCanvas = useCallback((obj: FabricObject, name: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const newId = `shape-${uid()}`;
    (obj as FabricObject & { customId?: string }).customId = newId;
    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    const newLayer: LayerItem = { id: newId, name, type: "image", obj, visible: true, locked: false };
    setLayers(prev => [newLayer, ...prev]);
    setSelectedLayer(newLayer);
    setSaveState("unsaved");
  }, []);

  /**
   * Sube una imagen desde el ordenador y la añade como capa NUEVA al canvas
   * (no reemplaza la actual). Se invoca desde la barra flotante y desde el
   * panel de capas. La imagen se escala para entrar en ~60% del canvas y
   * se centra. El usuario después la mueve/escala como cualquier capa.
   */
  const addNewImage = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // 1. Pedir foto al usuario
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
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(file);
    });

    // 2. Cargar como FabricImage
    const fabric = await import("fabric");
    const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });

    // 3. Escalar para entrar en ~60% del canvas (alto o ancho dominante)
    const imgW = img.width ?? 1;
    const imgH = img.height ?? 1;
    const targetMax = Math.min(canvasSize.w, canvasSize.h) * 0.6;
    const scale = Math.min(targetMax / imgW, targetMax / imgH, 1);
    img.set({
      left: canvasSize.w / 2,
      top: canvasSize.h / 2,
      originX: "center",
      originY: "center",
      scaleX: scale,
      scaleY: scale,
      selectable: true,
      evented: true,
    });

    addShapeToCanvas(img, t("editor.layerName.image"));
  }, [canvasSize, addShapeToCanvas, t]);

  /** Fase V.7 — Añadir un sticker IA (persona extraída) al canvas. Se carga
   *  desde URL PNG transparente y se centra en el canvas a tamaño razonable. */
  // Z.8.1 — Estado del panel "Mis recursos": carga assets del user desde
  // /api/assets cuando se abre el panel. Lazy fetch para no impactar el load
  // inicial del editor.
  const [myAssets, setMyAssets] = useState<MyAsset[]>([]);
  const [myAssetsLoading, setMyAssetsLoading] = useState(false);
  const [myAssetsLoaded, setMyAssetsLoaded] = useState(false);

  const fetchMyAssets = useCallback(async () => {
    if (myAssetsLoaded || myAssetsLoading) return;
    setMyAssetsLoading(true);
    try {
      const res = await fetch("/api/assets", { cache: "no-store" });
      const data = await res.json();
      if (data.authenticated && Array.isArray(data.assets)) {
        setMyAssets(data.assets);
      }
      setMyAssetsLoaded(true);
    } catch (e) {
      console.error("[my-assets]", e);
    } finally {
      setMyAssetsLoading(false);
    }
  }, [myAssetsLoaded, myAssetsLoading]);

  // Auto-fetch cuando se abre el tab por primera vez
  useEffect(() => {
    if (activeTool === "myAssets") void fetchMyAssets();
  }, [activeTool, fetchMyAssets]);

  const addStickerToCanvas = useCallback(async (src: string) => {
    const fabric = await import("fabric");
    try {
      const img = await fabric.FabricImage.fromURL(src, { crossOrigin: "anonymous" });
      const imgW = img.width ?? 1;
      const imgH = img.height ?? 1;
      // Escalar a 40% del canvas para que no domine — usuario puede agrandar
      const targetMax = Math.min(canvasSize.w, canvasSize.h) * 0.4;
      const scale = Math.min(targetMax / imgW, targetMax / imgH, 1);
      img.set({
        left: canvasSize.w / 2,
        top: canvasSize.h / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: true,
        evented: true,
      });
      addShapeToCanvas(img, "Sticker IA");
      toast.success("Sticker añadido");
    } catch (e) {
      console.error("[sticker] error:", e);
      toast.error("No se pudo añadir el sticker");
    }
  }, [canvasSize, addShapeToCanvas, toast]);

  const addRect = useCallback(() => {
    addShapeToCanvas(
      new FabricRect({ left: canvasSize.w / 2 - 150, top: canvasSize.h / 2 - 150, width: 300, height: 300, fill: "#a855f7", opacity: 0.85, selectable: true, evented: true }),
      t("editor.layerName.rect"),
    );
  }, [canvasSize, addShapeToCanvas, t]);

  const addCircle = useCallback(() => {
    addShapeToCanvas(
      new FabricCircle({ left: canvasSize.w / 2 - 150, top: canvasSize.h / 2 - 150, radius: 150, fill: "#fb923c", opacity: 0.85, selectable: true, evented: true }),
      t("editor.layerName.circle"),
    );
  }, [canvasSize, addShapeToCanvas, t]);

  const addTriangle = useCallback(() => {
    addShapeToCanvas(
      new FabricTriangle({ left: canvasSize.w / 2 - 150, top: canvasSize.h / 2 - 130, width: 300, height: 260, fill: "#fb923c", opacity: 0.85, selectable: true, evented: true }),
      t("editor.layerName.triangle"),
    );
  }, [canvasSize, addShapeToCanvas, t]);

  const addLine = useCallback(() => {
    addShapeToCanvas(
      new FabricLine([canvasSize.w / 2 - 200, canvasSize.h / 2, canvasSize.w / 2 + 200, canvasSize.h / 2], { stroke: "#a855f7", strokeWidth: 8, strokeLineCap: "round", selectable: true, evented: true }),
      t("editor.layerName.line"),
    );
  }, [canvasSize, addShapeToCanvas, t]);

  const addStar = useCallback(() => {
    const outerR = 150, innerR = 65;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 === 0 ? outerR : innerR;
      points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    addShapeToCanvas(
      new FabricPolygon(points, { left: canvasSize.w / 2 - outerR, top: canvasSize.h / 2 - outerR, fill: "#facc15", opacity: 0.9, selectable: true, evented: true }),
      t("editor.layerName.star"),
    );
  }, [canvasSize, addShapeToCanvas, t]);

  const addHexagon = useCallback(() => {
    const r = 150;
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
    }
    addShapeToCanvas(
      new FabricPolygon(points, { left: canvasSize.w / 2 - r, top: canvasSize.h / 2 - r, fill: "#22d3ee", opacity: 0.85, selectable: true, evented: true }),
      t("editor.layerName.hexagon"),
    );
  }, [canvasSize, addShapeToCanvas, t]);

  const addArrow = useCallback(() => {
    const arrowPath = "M 0 30 L 320 30 L 320 0 L 400 50 L 320 100 L 320 70 L 0 70 Z";
    addShapeToCanvas(
      new FabricPath(arrowPath, { left: canvasSize.w / 2 - 200, top: canvasSize.h / 2 - 50, fill: "#a855f7", opacity: 0.9, selectable: true, evented: true }),
      t("editor.layerName.arrow"),
    );
  }, [canvasSize, addShapeToCanvas, t]);

  const addFrame = useCallback(() => {
    addShapeToCanvas(
      new FabricRect({ left: canvasSize.w / 2 - 200, top: canvasSize.h / 2 - 200, width: 400, height: 400, fill: "transparent", stroke: "#ffffff", strokeWidth: 6, selectable: true, evented: true }),
      t("editor.layerName.frame"),
    );
  }, [canvasSize, addShapeToCanvas, t]);

  // ─── MASK: recortar imagen a forma (clipPath) ────────────────────────────
  /** Aplica un clipPath al objeto activo (debe ser image). */
  const cropImageToShape = useCallback((shape: "circle" | "rounded" | "square" | "none") => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.type !== "image") return;
    const localW = obj.width ?? 400;
    const localH = obj.height ?? 400;
    const minDim = Math.min(localW, localH);
    if (shape === "none") {
      (obj as FabricObject & { clipPath?: unknown }).clipPath = undefined;
    } else if (shape === "circle") {
      (obj as FabricObject & { clipPath?: unknown }).clipPath = new FabricCircle({
        radius: minDim / 2, originX: "center", originY: "center", left: 0, top: 0,
      });
    } else if (shape === "rounded") {
      (obj as FabricObject & { clipPath?: unknown }).clipPath = new FabricRect({
        width: localW, height: localH, rx: minDim * 0.15, ry: minDim * 0.15,
        originX: "center", originY: "center", left: 0, top: 0,
      });
    } else if (shape === "square") {
      (obj as FabricObject & { clipPath?: unknown }).clipPath = new FabricRect({
        width: minDim, height: minDim, originX: "center", originY: "center", left: 0, top: 0,
      });
    }
    obj.dirty = true;
    canvas?.requestRenderAll();
    setSaveState("unsaved");
  }, []);

  // ─── IMAGEN DENTRO DE FORMA ──────────────────────────────────────────────
  /** Tipos Fabric que consideramos "formas" (no imagen real ni texto). */
  const SHAPE_TYPES = ["rect", "circle", "triangle", "polygon", "path", "line"];

  /**
   * Reemplaza el shape activo por una imagen del usuario clipeada con la forma
   * del shape. La imagen se escala "cover" para llenar la forma sin deformar.
   * Tras la operacion el shape desaparece y queda la imagen — el usuario sigue
   * pudiendo mover/escalar/rotar como cualquier otra capa.
   */
  const addImageInsideShape = useCallback(async () => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || !canvas) return;
    if (!SHAPE_TYPES.includes(obj.type ?? "")) return;

    // 1. Pedir foto al usuario via file picker
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

    // 2. Cargar imagen en Fabric
    const fabric = await import("fabric");
    const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });

    // 3. Calcular bounding box visual del shape (en coords del canvas)
    const bounds = obj.getBoundingRect();
    const imgW = img.width ?? 1;
    const imgH = img.height ?? 1;
    // "Cover": la imagen llena el bounding sin huecos (puede recortar).
    const fillScale = Math.max(bounds.width / imgW, bounds.height / imgH);

    // 4. Clonar el shape para usarlo como clipPath. clipPath se interpreta en
    //    coords LOCALES del objeto contenedor (la imagen), centrado en (0,0)
    //    cuando originX/Y son "center".
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clipPath = await (obj as any).clone() as FabricObject;
    clipPath.set({
      left: 0,
      top: 0,
      originX: "center",
      originY: "center",
      angle: 0, // el angulo lo gestiona la imagen contenedora
    });

    // 5. Posicionar la imagen donde estaba el shape (centro del bounding)
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
      selectable: true,
      evented: true,
    });
    (img as FabricObject & { clipPath?: unknown }).clipPath = clipPath;

    // 6. Reemplazar el shape por la imagen en el canvas
    const oldId = (obj as FabricObject & { customId?: string }).customId;
    const newId = `image-in-shape-${uid()}`;
    (img as FabricObject & { customId?: string }).customId = newId;

    canvas.remove(obj);
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();

    // 7. Actualizar el estado de layers (reemplazar item del shape por el nuevo)
    const newLayer: LayerItem = { id: newId, name: "Foto en forma", type: "image", obj: img, visible: true, locked: false };
    setLayers(prev => {
      if (!oldId) return [newLayer, ...prev];
      const idx = prev.findIndex(l => l.id === oldId);
      if (idx === -1) return [newLayer, ...prev];
      const next = [...prev];
      next[idx] = newLayer;
      return next;
    });
    setSelectedLayer(newLayer);
    setSaveState("unsaved");
  }, []);

  // ─── EXPORT ───────────────────────────────────────────────────────────────

  // Logica pura de export: hace toDataURL, aplica marca de agua si el usuario
  // es free, y dispara la descarga. NO checkea sesion (eso lo hace el wrapper
  // publico `exportFlyer`).
  const doExport = useCallback(async (format: "png" | "jpg" = "png") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const currentZoom = canvas.getZoom();
    canvas.setZoom(1);
    canvas.setDimensions({ width: canvasSize.w, height: canvasSize.h });
    const rawDataUrl = canvas.toDataURL({ format: format === "jpg" ? "jpeg" : "png", quality: 0.95, multiplier: 1 });
    canvas.setZoom(currentZoom);
    canvas.setDimensions({ width: canvasSize.w * currentZoom, height: canvasSize.h * currentZoom });
    canvas.renderAll();

    // Marca de agua solo en plan free. Pro/Enterprise descargan limpio.
    // Si applyWatermark falla por cualquier motivo, no bloqueamos el export
    // — preferimos dar al usuario su descarga (sin watermark) a romperle el flow.
    let finalDataUrl = rawDataUrl;
    if (shouldWatermark(authProfile?.plan)) {
      try {
        finalDataUrl = await applyWatermark(rawDataUrl);
      } catch (err) {
        console.warn("Watermark failed, fallback a imagen sin marca:", err);
      }
    }

    const link = document.createElement("a");
    link.download = `artegenia-flyer.${format}`; link.href = finalDataUrl; link.click();

    // Abrimos el modal post-descarga para extender el momento de exito —
    // permite compartir/copiar inmediato sin perder al usuario. Si plan
    // free, el toast adicional aclara el tema watermark (no se duplica
    // info, solo da contexto rapido antes de abrir el modal).
    if (shouldWatermark(authProfile?.plan)) {
      toast.info("Marca de agua aplicada (plan gratis)", { durationMs: 2500 });
    }
    setPostDownload({ dataUrl: finalDataUrl, format });

    // Z.14 — Track export con schema unificado Z.9 (trackExportCompleted).
    // Reemplaza el evento legacy "flyer_downloaded" que tenia campos
    // distintos al resto del sistema analytics. Reuso el mismo helper
    // tipado para que el dashboard PostHog compose bien las metricas.
    void import("@/lib/analytics").then(m => {
      // Detectar si hay capas IA (stickers magicos o assets de Mis recursos)
      // mirando customId que típicamente empieza con "magic-" o "sticker-".
      const objs = fabricRef.current?.getObjects() ?? [];
      const hasAiLayers = objs.some(o => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cid = ((o as any).customId as string | undefined) ?? "";
        return cid.startsWith("magic-") || cid.startsWith("sticker-") || cid.startsWith("auto-");
      });
      m.trackExportCompleted({
        format,
        credits_consumed: CREDIT_COST.download_png,
        has_ai_layers: hasAiLayers,
        plan: (authProfile?.plan as "free" | "pro" | "enterprise") ?? "free",
        source: "editor_desktop",
      });
    });
  }, [canvasSize, authProfile?.plan, toast]);

  // Fase Z.7 — modal de confirmación de crédito antes de export.
  // PNG/JPG = 1 crédito (CREDIT_COST.download_png).
  const credits = useCredits();
  const [pendingExportFormat, setPendingExportFormat] = useState<"png" | "jpg" | null>(null);

  // ─── Z.16 — Quitar fondo en imagen del canvas ──────────────────────────────
  // Estado del objeto pendiente + objeto procesando (para overlay loading).
  // No consumimos cliente-side: /api/remove-bg ya consume server-side + refund
  // automático Z.13 si falla. El modal solo confirma el coste visualmente.
  const [pendingRemoveBg, setPendingRemoveBg] = useState<FabricObject | null>(null);
  const [removingBgObjId, setRemovingBgObjId] = useState<string | null>(null);

  // Z.17 — Borrador mágico/manual sobre la imagen seleccionada.
  // brushEraserState contiene el URL de la imagen y el objeto Fabric para
  // poder reemplazar su src tras guardar. null cuando el modal está cerrado.
  const [brushEraserState, setBrushEraserState] = useState<{
    url: string;
    obj: FabricObject;
  } | null>(null);

  const openBrushEraser = useCallback(() => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj || obj.type !== "image") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const srcUrl = (obj as any).getSrc?.() ?? (obj as any)._element?.src;
    if (!srcUrl) { toast.error("No se pudo leer la imagen"); return; }
    requireAuth(
      () => setBrushEraserState({ url: srcUrl, obj }),
      {
        title: "Inicia sesión para refinar la imagen",
        subtitle: "El borrador mágico usa IA con créditos. Crea una cuenta gratis (10 créditos al registrarte) para probarlo.",
      },
    );
  }, [toast, requireAuth]);

  const handleBrushEraserSave = useCallback(async (resultDataUrl: string) => {
    const state = brushEraserState;
    setBrushEraserState(null);
    if (!state) return;
    try {
      // Fabric v6 setSrc devuelve Promise (NO callback). dataURL no necesita
      // crossOrigin pero lo dejamos por consistencia con URLs http.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (state.obj as any).setSrc(resultDataUrl);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state.obj as any).filters = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (state.obj as any).applyFilters?.();
      // Mantener selección tras el reemplazo
      fabricRef.current?.setActiveObject(state.obj);
      fabricRef.current?.requestRenderAll();
      setSaveState("unsaved");
      toast.success("Refinado aplicado");
    } catch (e) {
      console.error("[brush-eraser save]", e);
      toast.error("No se pudo aplicar el refinado");
    }
  }, [brushEraserState, toast]);

  /** Abre modal de confirmación. Si la imagen ya es transparente, no abre nada
   *  y avisa con toast. Si no hay sesión, dispara AuthModal. */
  const openRemoveBgFlow = useCallback(async () => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj || obj.type !== "image") return;
    // Pre-check rápido: si ya es PNG transparente, evita gastar crédito
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const srcUrl = (obj as any).getSrc?.() ?? (obj as any)._element?.src;
    if (srcUrl) {
      const already = await isImageTransparent(srcUrl).catch(() => false);
      if (already) {
        toast.info("Esta imagen ya tiene el fondo transparente");
        return;
      }
    }
    requireAuth(
      () => setPendingRemoveBg(obj),
      {
        title: "Inicia sesión para quitar el fondo",
        subtitle: "Quitar fondo usa IA y consume 1 crédito. Crea una cuenta gratis (10 créditos al registrarte) para probarlo.",
      },
    );
  }, [toast, requireAuth]);

  /** Tras confirmar modal: descarga blob, manda a /api/remove-bg, reemplaza src
   *  en Fabric. Si 402 → sin créditos. Si 5xx → refund automático server-side. */
  const handleConfirmRemoveBg = useCallback(async () => {
    const obj = pendingRemoveBg;
    if (!obj) return;
    setPendingRemoveBg(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const objId = ((obj as any).customId as string | undefined) ?? String(obj.left ?? "") + ":" + String(obj.top ?? "");
    setRemovingBgObjId(objId);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const srcUrl = (obj as any).getSrc?.() ?? (obj as any)._element?.src;
      if (!srcUrl) throw new Error("No se pudo leer la imagen del canvas");

      const blobRes = await fetch(srcUrl);
      if (!blobRes.ok) throw new Error("No se pudo descargar la imagen");
      const blob = await blobRes.blob();
      const file = new File([blob], "canvas-image.png", { type: blob.type || "image/png" });

      const form = new FormData();
      form.append("image_file", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));

      if (res.status === 402) {
        toast.error("Sin créditos suficientes para Quitar fondo");
        return;
      }
      if (!res.ok || !json.url) {
        throw new Error(json.error || "No se pudo quitar el fondo");
      }

      // Reemplaza src en Fabric — añadimos ?v= para evitar caché R2 sin CORS.
      // Fabric v6 setSrc(src, opts) devuelve Promise (NO acepta callback).
      const newUrl = `${json.url}${json.url.includes("?") ? "&" : "?"}v=${Date.now()}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (obj as any).setSrc(newUrl, { crossOrigin: "anonymous" });
      // Limpiar filtros — PNG transparente nuevo, filtros viejos corromperían alpha
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).filters = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).applyFilters?.();
      // Mantener el objeto seleccionado tras el reemplazo (Fabric a veces lo deselecciona)
      fabricRef.current?.setActiveObject(obj);
      fabricRef.current?.requestRenderAll();
      setSaveState("unsaved");
      void credits.refetch();
      toast.success("Fondo eliminado");
    } catch (e) {
      console.error("[quitar-fondo-editor]", e);
      toast.error(e instanceof Error ? e.message : "Error al quitar fondo");
    } finally {
      setRemovingBgObjId(null);
    }
  }, [pendingRemoveBg, credits, toast]);

  /** Wrapper publico: pide sesion → muestra modal créditos → consume → exporta.
   *  Flow: requireAuth → setPendingExportFormat (abre modal) → handleConfirmExport
   *  → consume crédito server-side → doExport(format) → descarga real. */
  const exportFlyer = useCallback((format: "png" | "jpg" = "png") => {
    requireAuth(
      () => setPendingExportFormat(format),
      {
        title: "Descarga tu diseño",
        subtitle: "Inicia sesión para descargar. Es gratis.",
      },
    );
  }, [requireAuth]);

  /** Tras confirmar modal: consume crédito y dispara descarga. */
  const handleConfirmExport = useCallback(async () => {
    if (!pendingExportFormat) return;
    // Mismo CREDIT_COST.download_png para PNG/JPG (políticamente equivalente)
    const moduleKey: CreditModule = "download_png";
    const result = await credits.consume(moduleKey, { format: pendingExportFormat });
    if (!result.success) {
      toast.error("Sin créditos suficientes");
      return;
    }
    await doExport(pendingExportFormat);
    setPendingExportFormat(null);
  }, [pendingExportFormat, credits, doExport, toast]);

  // ─── SAVE TO SUPABASE ─────────────────────────────────────────────────────

  // Logica pura de guardado en Supabase. NO checkea sesion (eso lo hace
  // el wrapper publico `handleSave` via requireAuth + useProjects ya valida
  // de nuevo en el server).
  const doSave = useCallback(async () => {
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
        toast.success("Diseño guardado");
      } else {
        setSaveState("unsaved");
        toast.error("No se pudo guardar. ¿Has iniciado sesión?");
      }
    } catch (e) {
      console.error("Error guardando:", e);
      setSaveState("unsaved");
      toast.error("Error al guardar el diseño");
    } finally {
      setSavingProject(false);
    }
  }, [currentProjectId, docTitle, templateId, template, data, canvasSize, saveProject, toast]);

  // Wrapper publico: pide sesion antes de guardar. Si no hay, abre AuthModal
  // y reintenta tras login. Si hay sesion, guarda directo.
  const handleSave = useCallback(() => {
    requireAuth(
      () => { void doSave(); },
      {
        title: "Guarda tu diseño",
        subtitle: "Inicia sesión para guardar tu trabajo. Es gratis.",
      },
    );
  }, [requireAuth, doSave]);

  // Sync ref so the Cmd+S keyboard handler always calls the latest version
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);

  // ─── ADMIN: SAVE DRAFT + PUBLISH ──────────────────────────────────────────
  // Serializa el canvas Fabric a una TemplateVariant compatible con applyTemplateLayers,
  // sube thumbnail a R2 y guarda en templates_draft.
  // IMPORTANTE: iteramos sobre fc.getObjects() directamente (no toJSON) para tener
  // acceso a las propiedades reales del objeto Fabric.
  const serializeCanvasToVariant = useCallback((): TemplateVariant | null => {
    const fc = fabricRef.current;
    if (!fc) return null;

    const objs = fc.getObjects();

    type AnyLayer = {
      id: string; type: string; text?: string; src?: string;
      x?: number; y?: number; width?: number; height?: number; radius?: number;
      fontSize?: number; fontFamily?: string; color?: string; fill?: string;
      fontWeight?: string; fontStyle?: string; textAlign?: string;
      originX?: string; originY?: string; angle?: number;
      charSpacing?: number; lineHeight?: number;
      opacity?: number; scaleX?: number; scaleY?: number;
      shape?: string; selectable?: boolean;
    };

    const layersOut: AnyLayer[] = objs.map((o, i) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj = o as any;
      const oType = obj.type as string;

      // TEXT: textbox, i-text, text — Fabric guarda en .text directamente
      if (oType === "textbox" || oType === "i-text" || oType === "text" || oType === "Textbox" || oType === "IText") {
        return {
          id: `text-${i}`, type: "text",
          text: obj.text ?? "",
          x: obj.left ?? 0,
          y: obj.top ?? 0,
          width: (obj.width ?? 300) * (obj.scaleX ?? 1),
          fontSize: obj.fontSize ?? 60,
          fontFamily: obj.fontFamily ?? "Montserrat",
          color: obj.fill ?? "#fff",
          fontWeight: obj.fontWeight ?? "normal",
          fontStyle: obj.fontStyle ?? "normal",
          textAlign: obj.textAlign ?? "left",
          originX: obj.originX ?? "left",
          originY: obj.originY ?? "top",
          angle: obj.angle ?? 0,
          charSpacing: obj.charSpacing ?? 0,
          lineHeight: obj.lineHeight ?? 1.16,
        };
      }

      // IMAGE: FabricImage. El src está en _element.src o getSrc()
      if (oType === "image" || oType === "Image" || oType === "FabricImage") {
        const src = obj._element?.src ?? obj.getSrc?.() ?? "";
        return {
          id: `image-${i}`, type: "image",
          src,
          x: obj.left ?? 0,
          y: obj.top ?? 0,
          scaleX: obj.scaleX ?? 1,
          scaleY: obj.scaleY ?? 1,
          opacity: obj.opacity ?? 1,
          angle: obj.angle ?? 0,
          originX: obj.originX ?? "left",
          originY: obj.originY ?? "top",
        };
      }

      // SHAPE rect
      if (oType === "rect" || oType === "Rect") {
        return {
          id: `shape-${i}`, type: "shape", shape: "rect",
          x: obj.left ?? 0, y: obj.top ?? 0,
          width: (obj.width ?? 100) * (obj.scaleX ?? 1),
          height: (obj.height ?? 100) * (obj.scaleY ?? 1),
          fill: obj.fill ?? "#fff",
          opacity: obj.opacity ?? 1,
          selectable: obj.selectable ?? true,
          angle: obj.angle ?? 0,
        };
      }

      // SHAPE circle
      if (oType === "circle" || oType === "Circle") {
        const radius = (obj.radius ?? 50) * (obj.scaleX ?? 1);
        return {
          id: `shape-${i}`, type: "shape", shape: "circle",
          x: obj.left ?? 0, y: obj.top ?? 0,
          width: radius * 2, // applyTemplateLayers usa width/2 como radius
          height: radius * 2,
          fill: obj.fill ?? "#fff",
          opacity: obj.opacity ?? 1,
          selectable: obj.selectable ?? true,
          angle: obj.angle ?? 0,
        };
      }

      // Fallback: rect generico magenta para detectar tipos no manejados
      console.warn("[SERIALIZE] tipo desconocido:", oType, obj);
      return {
        id: `unknown-${i}`, type: "shape", shape: "rect",
        x: obj.left ?? 0, y: obj.top ?? 0,
        width: (obj.width ?? 100) * (obj.scaleX ?? 1),
        height: (obj.height ?? 100) * (obj.scaleY ?? 1),
        fill: obj.fill ?? "#ff00ff",
        opacity: 0.5,
      };
    });

    return {
      format: (data?.format === "cuadrado" ? "square" : data?.format === "evento" ? "fb-cover" : "portrait") as TemplateVariant["format"],
      width: canvasSize.w,
      height: canvasSize.h,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      layers: layersOut as any,
    };
  }, [canvasSize.w, canvasSize.h, data?.format]);

  const handleAdminSaveDraft = useCallback(async () => {
    if (!draftId) return;
    const newVariant = serializeCanvasToVariant();
    if (!newVariant) return;
    setAdminSaving(true);
    // Subir thumbnail en paralelo
    const thumbPromise = (async (): Promise<string | null> => {
      const fc = fabricRef.current;
      if (!fc) return null;
      try {
        const prevZoom = fc.getZoom();
        const prevW = fc.getWidth();
        const prevH = fc.getHeight();
        const prevVpt = fc.viewportTransform ? [...fc.viewportTransform] : [1, 0, 0, 1, 0, 0];
        fc.discardActiveObject();
        fc.setZoom(1);
        fc.setViewportTransform([1, 0, 0, 1, 0, 0]);
        fc.setDimensions({ width: canvasSize.w, height: canvasSize.h });
        fc.renderAll();
        const targetW = 320;
        const multiplier = targetW / canvasSize.w;
        const dataUrl = fc.toDataURL({ format: "png", multiplier });
        fc.setDimensions({ width: prevW, height: prevH });
        fc.setZoom(prevZoom);
        fc.setViewportTransform(prevVpt as [number, number, number, number, number, number]);
        fc.renderAll();
        const res = await fetch("/api/admin/upload-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, draftId }),
        });
        if (!res.ok) return null;
        const j = (await res.json()) as { url?: string };
        return j.url ?? null;
      } catch (e) { console.warn(e); return null; }
    })();

    const id = await saveDraft(draftId, {
      title: adminTitle, category: adminCategory, audience: adminAudience, premium: adminPremium,
      internal_tags: adminInternalTags,
      variants: [newVariant],
      status: "draft",
    });
    const thumbnailUrl = await thumbPromise;
    if (id && thumbnailUrl) {
      await saveDraft(id, { thumbnail_url: thumbnailUrl });
    }
    setAdminSaving(false);
    if (id) {
      setAdminSavedRecently(true);
      setTimeout(() => setAdminSavedRecently(false), 2000);
      toast.success("Borrador guardado");
    } else {
      toast.error("Error guardando borrador");
    }
  }, [draftId, adminTitle, adminCategory, adminAudience, adminPremium, adminInternalTags, serializeCanvasToVariant, saveDraft, canvasSize.w, canvasSize.h, toast]);

  const handleAdminPublish = useCallback(async () => {
    if (!draftId) return;
    const msg = isEditingPublished
      ? `¿Publicar cambios de "${adminTitle}"? Reemplazará la versión anterior en /templates.`
      : `¿Publicar "${adminTitle}" al catálogo? Aparecerá en /templates para todos.`;
    if (!confirm(msg)) return;
    await handleAdminSaveDraft();
    setAdminPublishing(true);
    const id = await publishDraft(draftId);
    setAdminPublishing(false);
    if (id) {
      toast.success(isEditingPublished
        ? "Cambios publicados · reemplaza versión anterior"
        : "Plantilla publicada · ya aparece en /templates");
      router.push("/admin/templates/new");
    } else {
      toast.error("Error publicando");
    }
  }, [draftId, adminTitle, isEditingPublished, handleAdminSaveDraft, publishDraft, router]);

  // ─── LEFT TOOLS ───────────────────────────────────────────────────────────

  // Lista completa de tabs disponibles. Filtramos abajo segun FEATURES.
  // Reducimos sidebar de 9 → 4 tabs (P2.4) escondiendo elements/background/
  // brand/favorites/layers bajo flags. La funcionalidad SUBYACENTE sigue
  // accesible: shapes via "Imagenes", background via click directo en canvas,
  // capas via floating toolbar contextual.
  const ALL_TOOLS: Array<{ id: LeftTool; label: string; icon: React.ReactNode; comingSoon?: boolean; hidden?: boolean }> = [
    { id: "design",    label: t("editor.tool.design"),     icon: <LayoutGrid className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "text",      label: t("editor.tool.text"),       icon: <Type className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "elements",  label: t("editor.tool.elements"),   icon: <SparklesIcon className="w-5 h-5" strokeWidth={1.5} />, hidden: !FEATURES.elementsTab },
    { id: "photos",    label: t("editor.tool.photos"),     icon: <ImageIcon className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "background",label: t("editor.tool.background"), icon: <Mountain className="w-5 h-5" strokeWidth={1.5} />, hidden: !FEATURES.backgroundTab },
    { id: "layers",    label: t("editor.tool.layers"),     icon: <LayersIcon className="w-5 h-5" strokeWidth={1.5} />, hidden: !FEATURES.layersPanel },
    { id: "ai",        label: t("editor.tool.ai"),         icon: <Wand2 className="w-5 h-5" strokeWidth={1.5} /> },
    // Z.8.1 — Panel de assets reutilizables de "Mis Recursos"
    { id: "myAssets",  label: "Mis recursos",              icon: <FolderOpen className="w-5 h-5" strokeWidth={1.5} /> },
    { id: "brand",     label: t("editor.tool.brand"),      icon: <Tag className="w-5 h-5" strokeWidth={1.5} />, comingSoon: true, hidden: !FEATURES.brandKit },
    { id: "favorites", label: t("editor.tool.favorites"),  icon: <Heart className="w-5 h-5" strokeWidth={1.5} />, comingSoon: true, hidden: !FEATURES.favorites },
  ];
  const TOOLS = ALL_TOOLS.filter(t => !t.hidden);

  const isBackground = selectedLayer?.type === "background";
  const isText = selectedLayer?.type === "text";
  const isImage = selectedLayer?.type === "image";

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">

      {/* HEADER — TOPBAR */}
      <header className="h-14 ag-glass border-b border-white/[0.06] flex items-center px-2 sm:px-4 gap-2 sm:gap-3 shrink-0 z-50">
        {/* Back */}
        <button onClick={() => router.push(isAdminMode ? "/admin/templates/new" : (template ? "/templates" : "/create"))}
          title="Volver"
          className="ag-icon-btn">
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Logo - oculto en mobile pequeno */}
        <div className="hidden sm:flex items-center gap-2">
          <img
            src="/brand/exports/icon-180.png"
            alt="ArteGenIA"
            className="w-8 h-8 object-contain"
            width={32}
            height={32}
          />
          <span className="text-[13px] font-bold hidden lg:block text-white/90 tracking-tight">
            Arte<span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">GenIA</span>
          </span>
        </div>

        {isAdminMode && (
          <span className="px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold tracking-wide">
            ADMIN
          </span>
        )}

        <div className="hidden sm:block w-px h-6 bg-white/[0.07] mx-1"/>

        {/* Editable doc title (en modo admin sincroniza con adminTitle) */}
        <input
          value={isAdminMode ? adminTitle : docTitle}
          onChange={(e) => {
            if (isAdminMode) {
              setAdminTitle(e.target.value);
              setDocTitle(e.target.value);
            } else {
              setDocTitle(e.target.value);
            }
            setSaveState("unsaved");
          }}
          className="bg-transparent text-xs sm:text-sm font-semibold text-white/95 px-2 py-1 rounded-lg hover:bg-white/[0.04] focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-purple-500/40 transition-all min-w-0 flex-1 sm:flex-none sm:max-w-[200px]"
          placeholder="Diseño sin título"
        />

        {/* Save state - oculto en mobile y en admin mode */}
        {!isAdminMode && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] ml-1">
            {saveState === "saving"  && <><div className="w-2.5 h-2.5 border border-gray-500 border-t-purple-400 rounded-full animate-spin"/><span className="text-gray-500">Guardando…</span></>}
            {saveState === "saved"   && <><div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50"/><span className="text-gray-500">Guardado</span></>}
            {saveState === "unsaved" && <><div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"/><span className="text-gray-500">Sin guardar</span></>}
          </div>
        )}

        {/* Size badge clickable - oculto en admin (se ve en meta panel).
            Z.25 — boton con dropdown para cambiar formato. Si la plantilla
            tiene variantes para ese formato, navega al editor con el formato
            nuevo (preserva trabajo guardando antes si hay cambios). Si no
            tiene variante, muestra "no disponible" en el item del menu. */}
        {!isAdminMode && (() => {
          const fmt = getFormatByDimensions(canvasSize.w, canvasSize.h);
          const FmtIcon = fmt?.icon;
          return (
            <div className="hidden md:flex relative ml-1">
              <button
                onClick={() => setShowFormatMenu((v) => !v)}
                className="group flex items-center gap-2 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] rounded-xl pl-2 pr-2.5 py-1.5 transition-all"
                title={fmt ? `${fmt.name} · ${fmt.subtitle} — Click para cambiar` : `${canvasSize.w} × ${canvasSize.h} px — Click para cambiar formato`}>
                {FmtIcon && (
                  <span className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500/25 to-pink-500/25 flex items-center justify-center shrink-0">
                    <FmtIcon size={13} strokeWidth={2.2} className="text-purple-200"/>
                  </span>
                )}
                <span className="flex flex-col items-start leading-none gap-0.5">
                  <span className="text-[11.5px] font-semibold text-white/90">
                    {fmt ? fmt.name : "Personalizado"}
                  </span>
                  <span className="text-[9.5px] font-mono text-gray-500 tracking-tight">
                    {canvasSize.w} × {canvasSize.h} px
                  </span>
                </span>
                <ChevronDown size={12} strokeWidth={2.2} className={`text-gray-400 group-hover:text-gray-200 shrink-0 transition-all ${showFormatMenu ? "rotate-180" : ""}`}/>
              </button>
              {showFormatMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowFormatMenu(false)}/>
                  <div className="absolute top-full mt-1 left-0 z-50 w-64 rounded-xl border border-white/10 bg-[#0f0f1a] shadow-2xl overflow-hidden">
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                      <p className="text-[11px] font-medium text-white/90">Cambiar formato</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">El diseño se adapta al nuevo tamaño</p>
                    </div>
                    {PUBLIC_FORMATS.map((id) => {
                      const f = FORMATS[id];
                      const FIcon = f.icon;
                      const isCurrent = fmt?.id === id;
                      const hasVariant = template ? !!getVariant(template, id) : false;
                      return (
                        <button
                          key={id}
                          disabled={isCurrent || !hasVariant}
                          onClick={async () => {
                            if (isCurrent || !hasVariant || !template) return;
                            setShowFormatMenu(false);
                            if (saveState === "unsaved" && authUser) {
                              await doSave();
                            } else if (saveState === "unsaved" && !authUser) {
                              const ok = window.confirm("Perderás los cambios no guardados. ¿Continuar?");
                              if (!ok) return;
                            }
                            const idForUrl = currentProjectId ?? template.id;
                            router.push(`/editor/${idForUrl}?format=${id}`);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[11px] transition-colors ${
                            isCurrent
                              ? "bg-purple-500/10 text-purple-300 cursor-default"
                              : hasVariant
                                ? "text-gray-200 hover:bg-white/[0.04]"
                                : "text-gray-500 cursor-not-allowed opacity-50"
                          }`}>
                          <FIcon size={14} strokeWidth={2} className={isCurrent ? "text-purple-300" : "text-gray-400"}/>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{f.name}</div>
                            <div className="text-[10px] text-gray-500 truncate">
                              {f.width} × {f.height} · {hasVariant ? f.subtitle : "no disponible"}
                            </div>
                          </div>
                          {isCurrent && <Check size={12} strokeWidth={2.5} className="text-purple-300 shrink-0"/>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        <div className="flex-1"/>

        {/* Undo/redo - visible siempre (esenciales) */}
        <button
          onClick={undo}
          disabled={!canUndo}
          title={`${t("editor.action.undo")} (⌘Z)`}
          className={`ag-icon-btn ${canUndo ? "" : "opacity-30 cursor-not-allowed"}`}>
          <Undo2 className="w-4 h-4" strokeWidth={2} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title={`${t("editor.action.redo")} (⌘⇧Z)`}
          className={`ag-icon-btn ${canRedo ? "" : "opacity-30 cursor-not-allowed"}`}>
          <Redo2 className="w-4 h-4" strokeWidth={2} />
        </button>

        {!isAdminMode && <div className="hidden sm:block w-px h-5 bg-white/[0.07] mx-0.5"/>}

        {/* Zoom selector - oculto en mobile y en admin mode */}
        {!isAdminMode && (
          <div className="hidden sm:flex items-center bg-white/[0.03] border border-white/[0.07] rounded-lg overflow-hidden">
            <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">−</button>
            <select value={zoom} onChange={(e) => setZoom(parseInt(e.target.value))}
              className="bg-transparent text-[11px] text-white/90 px-1.5 py-1 outline-none cursor-pointer">
              {[25, 50, 75, 100, 125, 150, 200].map(z => <option key={z} value={z} className="bg-[#1c1c28]">{z}%</option>)}
            </select>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">+</button>
          </div>
        )}

        {!isAdminMode && <div className="hidden md:block w-px h-5 bg-white/[0.07] mx-0.5"/>}

        {/* View mode toggle - oculto en admin */}
        {!isAdminMode && (
          <div className="hidden md:flex items-center bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden p-0.5">
            <button
              onClick={() => setViewMode("sidebar")}
              title="Vista con barra lateral fija"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                viewMode === "sidebar"
                  ? "bg-purple-600/30 text-purple-200 shadow-sm shadow-purple-500/30"
                  : "text-gray-500 hover:text-gray-300"
              }`}>
              <PanelLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
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
              <PanelBottom className="w-3.5 h-3.5" strokeWidth={1.5} />
              Dock
            </button>
          </div>
        )}

        {/* Command palette - oculto en admin */}
        {!isAdminMode && (
          <button
            onClick={() => setPaletteOpen(true)}
            title="Buscar comando (⌘K)"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[11px] text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all">
            <Search className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Buscar</span>
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/[0.06] text-[9px] text-gray-500 border border-white/5 font-mono">⌘K</kbd>
          </button>
        )}

        {/* Share - oculto en admin */}
        {!isAdminMode && (
          <button title={t("editor.action.shareSoon")} className="ag-icon-btn opacity-60 hidden md:flex">
            <Share2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}

        {/* Save normal - oculto en modo admin */}
        {!isAdminMode && (
          <button
            onClick={handleSave}
            disabled={savingProject}
            title={currentProjectId ? "Guardar cambios (⌘S)" : "Guardar nuevo diseño"}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {savingProject ? (
              <><div className="w-3 h-3 border border-gray-400 border-t-white rounded-full animate-spin"/><span className="hidden sm:inline">Guardando…</span></>
            ) : (
              <><Save className="w-3.5 h-3.5" strokeWidth={2} /><span className="hidden sm:inline">{currentProjectId ? "Guardar" : "Guardar"}</span></>
            )}
          </button>
        )}

        {/* ADMIN: boton meta toggle */}
        {isAdminMode && (
          <button
            onClick={() => setAdminMetaOpen(o => !o)}
            title="Metadata (categoria, audiencia, premium)"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.10] text-gray-300 text-xs font-medium transition-all"
          >
            <Tag className="w-3.5 h-3.5" strokeWidth={2}/>
            <span className="hidden lg:inline">{adminCategory} · {adminAudience.length || 0} pub</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${adminMetaOpen ? "rotate-180" : ""}`} strokeWidth={2}/>
          </button>
        )}

        {/* ADMIN: Guardar borrador */}
        {isAdminMode && (
          <button
            onClick={handleAdminSaveDraft}
            disabled={adminSaving}
            title={t("editor.action.save")}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-semibold transition-all disabled:opacity-50"
          >
            {adminSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : (adminSavedRecently ? <><span className="w-2 h-2 rounded-full bg-emerald-400"/><span className="hidden sm:inline">Guardado</span></> : <><Save className="w-3.5 h-3.5" strokeWidth={2}/><span className="hidden sm:inline">Guardar borrador</span></>)}
          </button>
        )}

        {/* Export normal - oculto en modo admin (porque tenemos Publicar) */}
        {!isAdminMode && (
        <div className="relative group">
          <button
            onClick={() => isMobile && setMobilePanelOpen("export")}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50">
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          {/* Dropdown hover - SOLO DESKTOP */}
          <div className="hidden md:block absolute right-0 top-full mt-1 w-36 ag-glass border border-white/10 rounded-xl shadow-2xl overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
            {[["PNG","png"],["JPG","jpg"]].map(([label, fmt]) => (
              <button key={fmt} onClick={() => exportFlyer(fmt as "png"|"jpg")}
                className="w-full px-4 py-2.5 text-left text-xs text-gray-300 hover:bg-white/8 hover:text-white transition-all">
                Exportar {label}
              </button>
            ))}
          </div>
        </div>
        )}

        {/* ADMIN: Publicar */}
        {isAdminMode && (
          <button
            onClick={handleAdminPublish}
            disabled={adminPublishing}
            title="Publicar al catalogo /templates"
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50"
          >
            {adminPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <><Send className="w-3.5 h-3.5" strokeWidth={2.5}/><span className="hidden sm:inline">{isEditingPublished ? "Publicar cambios" : "Publicar"}</span></>}
          </button>
        )}

        {/* User avatar - oculto en mobile */}
        <div className="hidden sm:flex w-8 h-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/[0.07] items-center justify-center text-[11px] font-bold text-white/80 cursor-pointer hover:border-white/20 transition-all ml-1">AG</div>
      </header>

      {/* ADMIN: Banner editando publicada */}
      {isAdminMode && isEditingPublished && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-2 text-xs text-amber-300 flex items-center gap-2 shrink-0">
          <Edit3 className="w-3 h-3" strokeWidth={2.5}/>
          <span><strong>Editando publicada:</strong> al publicar, la versión anterior se reemplazará en /templates.</span>
        </div>
      )}

      {/* ADMIN: Meta panel desplegable */}
      {isAdminMode && adminMetaOpen && (
        <div className="bg-[#0f0f1a] border-b border-white/[0.08] px-4 py-3 space-y-3 shrink-0 z-20 max-h-[40vh] overflow-y-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 font-semibold w-24 shrink-0">Categoría</label>
            <select
              value={adminCategory}
              onChange={e => setAdminCategory(e.target.value)}
              className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-purple-500/40"
            >
              {ADMIN_CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1c1c28]">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold mb-1.5 block">Audiencia (multi)</label>
            <div className="flex flex-wrap gap-1.5">
              {ADMIN_AUDIENCES.map(a => {
                const active = adminAudience.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => setAdminAudience(prev => active ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      active ? "bg-purple-600/30 text-purple-200 border border-purple-500/40" : "bg-white/[0.04] text-gray-400 border border-white/10 hover:bg-white/[0.08]"
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
              onClick={() => setAdminPremium(p => !p)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                adminPremium ? "bg-fuchsia-600/30 text-fuchsia-200 border border-fuchsia-500/40" : "bg-white/[0.04] text-gray-500 border border-white/10"
              }`}
            >
              {adminPremium ? "✓ Premium" : "Free"}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden bg-[#070711]">

        {/* LEFT SIDEBAR — only when viewMode = sidebar AND desktop */}
        {viewMode === "sidebar" && !isMobile && (
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

        {/* ELEMENTS PANEL - formas y shapes ─────────────────────────────── */}
        {activeTool === "elements" && !isMobile && (
          <div className="w-52 ag-glass border-r border-white/[0.06] flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Elementos</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <p className="text-[9.5px] uppercase tracking-widest text-gray-600 font-semibold mt-1 mb-1.5 px-1">Formas</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { onClick: addRect,     icon: <Square size={16} strokeWidth={2}/>,         label: "Rect" },
                  { onClick: addCircle,   icon: <CircleIconLuc size={16} strokeWidth={2}/>,  label: "Círculo" },
                  { onClick: addTriangle, icon: <TriangleIcon size={16} strokeWidth={2}/>,   label: "Triángulo" },
                  { onClick: addStar,     icon: <Star size={16} strokeWidth={2}/>,           label: "Estrella" },
                  { onClick: addHexagon,  icon: <Hexagon size={16} strokeWidth={2}/>,        label: "Hexágono" },
                  { onClick: addArrow,    icon: <ArrowRightIcon size={16} strokeWidth={2}/>, label: "Flecha" },
                  { onClick: addLine,     icon: <Minus size={16} strokeWidth={2.5}/>,        label: "Línea" },
                  { onClick: addFrame,    icon: <SquareDashed size={16} strokeWidth={2}/>,   label: "Marco" },
                ].map(b => (
                  <button
                    key={b.label}
                    onClick={b.onClick}
                    className="flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-purple-500/30 text-gray-300 hover:text-white transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      {b.icon}
                    </div>
                    <span className="text-[10px] font-medium leading-tight">{b.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-3 px-1 leading-snug">
                Toca una forma para añadirla al diseño. Despues puedes mover, escalar y rotar.
              </p>
            </div>
          </div>
        )}

        {/* AI PANEL - Stickers IA (personas extraídas con SAM-3 desde Capas
            Mágicas). Si no hay stickers en este proyecto, mensaje vacío con
            CTA para ir a /capas-magicas. */}
        {activeTool === "ai" && !isMobile && (
          <div className="w-52 ag-glass border-r border-white/[0.06] flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Stickers IA</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {magicStickers.length > 0 ? (
                <>
                  <p className="text-[10px] text-gray-400 mb-2 px-1 leading-snug">
                    {magicStickers.length} {magicStickers.length === 1 ? "persona extraída" : "personas extraídas"} de tu flyer. Toca para añadirla al canvas.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {magicStickers.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addStickerToCanvas(s.src)}
                        className="aspect-square rounded-xl overflow-hidden bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.08] hover:border-purple-500/40 transition-all group"
                        title="Añadir al canvas"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.src}
                          alt="Sticker IA"
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                          crossOrigin="anonymous"
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-[9.5px] text-gray-600 mt-3 px-1 leading-snug">
                    💡 Si borras una persona del flyer, puedes volver a añadirla aquí
                  </p>
                </>
              ) : (
                <div className="text-center py-8 px-2">
                  <Wand2 className="w-8 h-8 mx-auto mb-3 text-purple-300/60" strokeWidth={1.5} />
                  <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                    Aún no tienes stickers IA en este flyer.
                  </p>
                  <p className="text-[10px] text-gray-500 leading-snug">
                    Usa <span className="text-purple-300 font-medium">Capas Mágicas</span> para extraer personas de cualquier foto y reusarlas como stickers.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Z.8.1 — MIS RECURSOS PANEL: assets del user reutilizables.
            Lazy fetch al abrir, grid de thumbnails, click añade al canvas. */}
        {activeTool === "myAssets" && !isMobile && (
          <div className="w-52 ag-glass border-r border-white/[0.06] flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Mis recursos</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {myAssetsLoading ? (
                <div className="grid grid-cols-2 gap-1.5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-xl bg-white/[0.04] animate-pulse" />
                  ))}
                </div>
              ) : myAssets.length > 0 ? (
                <>
                  <p className="text-[10px] text-gray-400 mb-2 px-1 leading-snug">
                    {myAssets.length} {myAssets.length === 1 ? "imagen guardada" : "imágenes guardadas"}. Toca para añadirla al canvas.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {myAssets.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => addStickerToCanvas(a.url)}
                        title={a.name}
                        className="aspect-square rounded-xl overflow-hidden bg-white/[0.04] hover:bg-white/[0.10] border border-white/[0.08] hover:border-purple-500/40 transition-all group relative"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.url}
                          alt={a.name}
                          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 bg-black/60 backdrop-blur text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                          {a.name}
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9.5px] text-gray-600 mt-3 px-1 leading-snug">
                    💡 Estos son los assets que has guardado en /mis-recursos
                  </p>
                </>
              ) : (
                <div className="text-center py-8 px-2">
                  <FolderOpen className="w-8 h-8 mx-auto mb-3 text-purple-300/60" strokeWidth={1.5} />
                  <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                    Aún no tienes recursos guardados.
                  </p>
                  <p className="text-[10px] text-gray-500 leading-snug">
                    Cuando uses <span className="text-purple-300 font-medium">Quitar fondo</span> o <span className="text-purple-300 font-medium">Capas Mágicas</span>, guarda el resultado para reusarlo aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LAYERS PANEL - hidden by feature flag (P2.1). Z-order accesible
            via floating toolbar contextual. Para reactivar: FEATURES.layersPanel */}
        {FEATURES.layersPanel && activeTool === "layers" && !isMobile && (
          <div className="w-52 ag-glass border-r border-white/[0.06] flex flex-col shrink-0">
            <div className="px-3 py-2.5 border-b border-white/[0.06]">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Capas</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {layers.map(layer => (
                <div key={layer.id} onClick={() => selectLayerFromPanel(layer)}
                  className={`group flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-white/[0.04] transition-all ${selectedLayer?.id === layer.id ? "bg-purple-600/15 border-l-2 border-l-purple-500" : "hover:bg-white/4"}`}>
                  <GripVertical className="w-3 h-3 text-gray-700 shrink-0 cursor-grab" strokeWidth={2} />
                  <LayerIcon type={layer.type}/>
                  <span className={`flex-1 text-xs truncate ${selectedLayer?.id === layer.id ? "text-white" : "text-gray-400"}`}>{layer.name}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); toggleVisibility(layer.id); }} className={`p-0.5 rounded ${layer.visible ? "text-gray-500 hover:text-white" : "text-gray-700"}`}>
                      {layer.visible
                        ? <Eye    className="w-3 h-3" strokeWidth={2} />
                        : <EyeOff className="w-3 h-3" strokeWidth={2} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleLock(layer.id); }} className={`p-0.5 rounded ${layer.locked ? "text-yellow-500" : "text-gray-500 hover:text-white"}`}>
                      {layer.locked
                        ? <Lock   className="w-3 h-3" strokeWidth={2} />
                        : <Unlock className="w-3 h-3" strokeWidth={2} />}
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
            {/* Center the canvas both horizontally and vertically. Padding bottom en mobile para dejar espacio al dock */}
            <div className={`min-h-full flex items-center justify-center ${isMobile ? "p-3 pb-24" : "p-8"}`}>
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

          {/* ZOOM BAR - oculta en mobile (zoom via pinch nativo + el dock ya esta abajo) */}
          <div className="hidden md:flex h-10 ag-glass border-t border-white/[0.06] items-center justify-center gap-3 px-4 shrink-0">
            <button onClick={() => setZoom(z => Math.max(10, z - 10))} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all text-lg">−</button>
            <span className="text-xs text-gray-500 w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all text-lg">+</button>
            <div className="w-px h-4 bg-white/[0.08] mx-1"/>
            <button onClick={() => setZoom(50)} className="text-[10px] text-gray-600 hover:text-gray-300 transition-colors">Ajustar</button>
            <button onClick={() => setZoom(100)} className="text-[10px] h-5 px-2 rounded border border-white/8 text-gray-600 hover:text-gray-300 transition-colors">100%</button>
          </div>
        </div>

        {/* RIGHT PROPERTIES PANEL - desktop fijo lateral, mobile bottom sheet */}
        <div className={`
          ${isMobile
            ? `${mobilePanelOpen === "properties" ? "translate-y-0" : "translate-y-full"}
               fixed bottom-0 left-0 right-0 z-40 max-h-[70vh] rounded-t-3xl
               transition-transform duration-300 ease-out`
            : "w-72 shrink-0"
          }
          ag-glass border-l border-white/[0.06] flex flex-col overflow-hidden
        `}>
          {/* Handle bar - SOLO MOBILE */}
          {isMobile && (
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.06]">
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2"/>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Propiedades</span>
              <button
                onClick={() => setMobilePanelOpen(null)}
                className="text-gray-400 active:text-white text-xl leading-none"
              >×</button>
            </div>
          )}
          {!selectedLayer ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 flex items-center justify-center">
                <MousePointer2 className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-gray-600">Selecciona un elemento<br/>para editar sus propiedades</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* HEADER */}
              <div className="px-3.5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isText ? "bg-blue-500/20 text-blue-300" : isBackground ? "bg-emerald-500/20 text-emerald-300" : "bg-purple-500/20 text-purple-300"}`}>
                    {isText       ? <Type      className="w-3 h-3" strokeWidth={2} />
                     : isBackground ? <Square    className="w-3 h-3" strokeWidth={2} />
                     :                <ImageIcon className="w-3 h-3" strokeWidth={2} />}
                  </div>
                  <p className="text-[11px] font-semibold text-white/90">
                    {isText ? "Texto" : isBackground ? "Fondo" : "Imagen"}
                  </p>
                </div>
                {!isBackground && (
                  <button onClick={() => deleteLayer(selectedLayer.id)} title="Eliminar capa" className="text-gray-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-white/5">
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
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
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Fuente</label>
                    <FontPickerPopover
                      value={textProps.fontFamily}
                      fonts={FONTS}
                      onChange={(f) => applyTextProp("fontFamily", f)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 mb-1 block">
                        Tamaño
                        {textProps.fontSize < 12 && (
                          <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Muy pequeño
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        min={8}
                        max={200}
                        value={textProps.fontSize}
                        onChange={e => {
                          // Clamp en el commit para evitar que un usuario meta 2px
                          // por accidente. 8-200 cubre todos los casos reales de flyer.
                          const raw = Number(e.target.value);
                          if (Number.isNaN(raw)) return;
                          const clamped = Math.max(8, Math.min(200, raw));
                          applyTextProp("fontSize", clamped);
                        }}
                        className={`w-full bg-white/[0.04] border rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-purple-500/50 ${textProps.fontSize < 12 ? "border-amber-500/40" : "border-white/8"}`}
                      />
                      {textProps.fontSize < 12 && (
                        <p className="text-[9.5px] text-amber-400/90 mt-1 leading-snug">
                          Tamaños menores a 12px pueden ser ilegibles en móvil.
                        </p>
                      )}
                    </div>
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

              {/* ─── SECCIÓN HALO / GLOW (solo imagen) ───────────────────── */}
              {isImage && (() => {
                // Leer el shadow actual del objeto activo para reflejar en sliders/picker.
                const obj = fabricRef.current?.getActiveObject();
                const shadow = (obj?.shadow ?? null) as FabricShadow | null;
                const hasShadow = !!shadow && typeof shadow === "object";
                const currentColor = hasShadow ? (shadow.color ?? "rgba(255,255,255,0.85)") : "rgba(255,255,255,0.85)";
                const currentBlur = hasShadow ? (shadow.blur ?? 40) : 40;
                // Detectar preset activo (light/dark/none) para resaltar el boton
                const isLight = hasShadow && currentColor.includes("255,255,255");
                const isDark  = hasShadow && currentColor.includes("0,0,0") && !currentColor.includes("255");
                const isNone  = !hasShadow;
                // Para el color picker (input type="color"): convertir rgba a hex aproximado.
                // Si es rgba lo dejamos en su hex base (los rgba con alpha 0.85 son color base).
                const hexFromColor = (() => {
                  const m = currentColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                  if (!m) return currentColor.startsWith("#") ? currentColor : "#ffffff";
                  const r = Number(m[1]).toString(16).padStart(2, "0");
                  const g = Number(m[2]).toString(16).padStart(2, "0");
                  const b = Number(m[3]).toString(16).padStart(2, "0");
                  return `#${r}${g}${b}`;
                })();
                return (
                  <CollapsibleSection
                    title="Halo"
                    sectionKey="halo"
                    openSections={openSections}
                    setOpenSections={setOpenSections}>
                    {/* 3 presets rapidos */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setHaloPreset("light")}
                        className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${isLight ? "bg-purple-600/20 text-purple-300 border border-purple-500/40" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                        Claro
                      </button>
                      <button
                        onClick={() => setHaloPreset("dark")}
                        className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${isDark ? "bg-purple-600/20 text-purple-300 border border-purple-500/40" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                        Oscuro
                      </button>
                      <button
                        onClick={() => setHaloPreset("none")}
                        className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${isNone ? "bg-purple-600/20 text-purple-300 border border-purple-500/40" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                        Sin halo
                      </button>
                    </div>
                    {/* Toggle avanzado */}
                    <button
                      onClick={() => setHaloAdvancedOpen(v => !v)}
                      className="mt-3 w-full text-[10.5px] text-gray-500 hover:text-white text-left flex items-center gap-1.5">
                      <ChevronDown size={11} className={`transition-transform ${haloAdvancedOpen ? "rotate-180" : ""}`} />
                      Avanzado
                    </button>
                    {haloAdvancedOpen && (
                      <div className="mt-2 space-y-2.5 pl-2.5 border-l border-white/[0.06]">
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">Color del halo</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={hexFromColor}
                              onChange={e => setHaloColor(e.target.value)}
                              className="h-7 w-10 rounded cursor-pointer bg-transparent border border-white/10"
                            />
                            <span className="text-[10.5px] text-gray-500 font-mono">{hexFromColor}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">Difuminado · {Math.round(currentBlur)}px</label>
                          <input
                            type="range"
                            min={0}
                            max={120}
                            step={1}
                            value={currentBlur}
                            onChange={e => setHaloBlur(Number(e.target.value))}
                            className="w-full accent-purple-500"
                          />
                        </div>
                      </div>
                    )}
                  </CollapsibleSection>
                );
              })()}

              {/* ─── Z.16: SECCIÓN QUITAR FONDO (cualquier foto del canvas) ── */}
              {isImage && (() => {
                const obj = fabricRef.current?.getActiveObject();
                if (obj?.type !== "image") return null;
                const isProcessing = removingBgObjId !== null;
                return (
                  <CollapsibleSection
                    title="Fondo"
                    sectionKey="remove-bg"
                    openSections={openSections}
                    setOpenSections={setOpenSections}>
                    <button
                      onClick={() => { void openRemoveBgFlow(); }}
                      disabled={isProcessing}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/15 hover:from-purple-600/30 hover:to-fuchsia-600/25 border border-purple-500/35 text-purple-200 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-wait">
                      {isProcessing ? (
                        <>
                          <Loader2 size={14} strokeWidth={2} className="animate-spin"/>
                          Quitando fondo…
                        </>
                      ) : (
                        <>
                          <Eraser size={14} strokeWidth={2}/>
                          Quitar fondo entero
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-gray-600 mt-2 leading-snug">
                      Elimina TODO el fondo, deja solo el sujeto principal con
                      transparencia. Cuesta {CREDIT_COST.quitar_fondo} crédito.
                    </p>

                    {/* Z.17 — Refinar manualmente / borrador mágico */}
                    <button
                      onClick={openBrushEraser}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.10] text-gray-200 text-xs font-semibold transition-all">
                      <Brush size={14} strokeWidth={2}/>
                      Refinar bordes (pincel + IA)
                    </button>
                    <p className="text-[10px] text-gray-600 mt-2 leading-snug">
                      Borra manualmente lo que sobra, o toca con borrador mágico
                      (IA, {CREDIT_COST.borrador_magico} cr por click) para borrados precisos.
                    </p>
                  </CollapsibleSection>
                );
              })()}

              {/* ─── SECCIÓN RECORTAR PERSONA (cualquier foto del canvas) ── */}
              {isImage && (() => {
                const obj = fabricRef.current?.getActiveObject();
                // Aparece para cualquier objeto type "image" — incluye fotos
                // subidas por el usuario y fotos que vienen en la plantilla.
                if (obj?.type !== "image") return null;
                return (
                  <CollapsibleSection
                    title="Recortar persona"
                    sectionKey="segment-person"
                    openSections={openSections}
                    setOpenSections={setOpenSections}>
                    <button
                      onClick={openSegmentModal}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-emerald-600/20 to-teal-600/15 hover:from-emerald-600/30 hover:to-teal-600/25 border border-emerald-500/35 text-emerald-200 text-xs font-semibold transition-all">
                      <Scissors size={14} strokeWidth={2}/>
                      Recortar persona individual
                    </button>
                    <p className="text-[10px] text-gray-600 mt-2 leading-snug">
                      Para fotos grupales. Tocas a la persona que quieres aislar
                      y la IA recorta solo a esa (deja fondo transparente).
                    </p>
                  </CollapsibleSection>
                );
              })()}

              {/* ─── SECCIÓN FOTO DENTRO DE FORMA (solo si es shape) ─── */}
              {isImage && (() => {
                const obj = fabricRef.current?.getActiveObject();
                const isShape = !!obj && SHAPE_TYPES.includes(obj.type ?? "");
                if (!isShape) return null;
                return (
                  <CollapsibleSection
                    title="Foto dentro"
                    sectionKey="image-in-shape"
                    openSections={openSections}
                    setOpenSections={setOpenSections}>
                    <button
                      onClick={() => { void addImageInsideShape(); }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/15 hover:from-purple-600/30 hover:to-fuchsia-600/25 border border-purple-500/35 text-purple-200 text-xs font-semibold transition-all">
                      <ImageIcon size={14} strokeWidth={2}/>
                      Añadir foto dentro de la forma
                    </button>
                    <p className="text-[10px] text-gray-600 mt-2 leading-snug">
                      La foto reemplaza la forma manteniendo su silueta como mascara.
                      Despues podras seguir moviendo, escalando y rotando.
                    </p>
                  </CollapsibleSection>
                );
              })()}

              {/* ─── SECCIÓN RECORTAR A FORMA (solo imagen) ─────────────── */}
              {isImage && (() => {
                const obj = fabricRef.current?.getActiveObject();
                const clip = (obj as FabricObject & { clipPath?: { type?: string; rx?: number } })?.clipPath;
                // Detectar tipo actual de mask para resaltar
                const isCircle  = !!clip && clip.type === "circle";
                const isRounded = !!clip && clip.type === "rect" && (clip.rx ?? 0) > 0;
                const isSquare  = !!clip && clip.type === "rect" && (clip.rx ?? 0) === 0;
                const isNone    = !clip;
                return (
                  <CollapsibleSection
                    title="Recortar a forma"
                    sectionKey="crop"
                    openSections={openSections}
                    setOpenSections={setOpenSections}>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { shape: "circle"  as const, icon: <CircleIconLuc size={16} strokeWidth={2}/>, label: "Círculo", active: isCircle },
                        { shape: "rounded" as const, icon: <SquareDashed size={16} strokeWidth={2}/>,  label: "Rounded", active: isRounded },
                        { shape: "square"  as const, icon: <Square size={16} strokeWidth={2}/>,        label: "Cuadrado", active: isSquare },
                        { shape: "none"    as const, icon: <XIconLuc size={16} strokeWidth={2}/>,      label: "Quitar", active: isNone },
                      ].map(b => (
                        <button
                          key={b.shape}
                          onClick={() => cropImageToShape(b.shape)}
                          className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${b.active ? "bg-amber-500/20 text-amber-200 border-amber-500/45" : "bg-white/[0.04] text-gray-400 border-white/[0.06] hover:text-white"}`}
                        >
                          <div className="text-amber-300">{b.icon}</div>
                          <span className="text-[10px] font-medium">{b.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2 leading-snug">
                      <Scissors size={10} className="inline mr-1 -mt-0.5"/>
                      Recorta la foto a una forma sin perder la imagen original.
                    </p>
                  </CollapsibleSection>
                );
              })()}

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
                        <AlignStartVertical className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button onClick={() => alignSelectedTo("center-h")} title="Centrar horizontal" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <AlignCenterVertical className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button onClick={() => alignSelectedTo("right")} title="Alinear derecha" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <AlignEndVertical className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button onClick={() => alignSelectedTo("top")} title="Alinear arriba" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <AlignStartHorizontal className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button onClick={() => alignSelectedTo("center-v")} title="Centrar vertical" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <AlignCenterHorizontal className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button onClick={() => alignSelectedTo("bottom")} title="Alinear abajo" className="py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center">
                        <AlignEndHorizontal className="w-3.5 h-3.5" strokeWidth={2} />
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
        <div className={`
          ${isMobile
            ? "fixed bottom-0 left-0 right-0 z-30 px-2 py-2 border-t border-white/[0.08] ag-glass safe-area-bottom"
            : "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 ag-glass border border-white/[0.08] rounded-3xl px-3 py-2 shadow-2xl shadow-purple-500/10"
          }
          flex items-center gap-1.5 ${isMobile ? "justify-around" : ""}
        `}>
          {TOOLS.filter(t => ["design","text","photos","layers","ai","background"].includes(t.id)).map(tool => {
            const isActive = activeTool === tool.id;
            return (
              <button key={tool.id}
                onClick={() => {
                  if (tool.comingSoon) return;
                  if (tool.id === "photos") { setArtistsModalOpen(true); return; }
                  if (tool.id === "layers" && isMobile) {
                    setMobilePanelOpen(mobilePanelOpen === "layers" ? null : "layers");
                    return;
                  }
                  setActiveTool(tool.id);
                  if (tool.id === "text") addText();
                }}
                title={tool.comingSoon ? `${tool.label} · próximamente` : tool.label}
                className={`group relative ${isMobile ? "w-11 h-11" : "w-12 h-12"} rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-purple-600/30 to-fuchsia-600/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/30"
                    : tool.comingSoon
                    ? "text-gray-600 cursor-default"
                    : "text-gray-400 active:text-white hover:text-white hover:bg-white/[0.06] hover:-translate-y-0.5 active:scale-95"
                }`}>
                {tool.icon}
                {tool.comingSoon && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/60"/>}
                {!isMobile && (
                  <span className="absolute bottom-full mb-2 px-2 py-1 rounded-md bg-black/85 border border-white/10 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">{tool.label}</span>
                )}
              </button>
            );
          })}
          {!isMobile && <div className="w-px h-7 bg-white/[0.08] mx-1"/>}
          {/* En mobile el boton export esta en el header. Solo se muestra aqui en desktop dock */}
          {!isMobile && (
            <button onClick={() => exportFlyer("png")}
              title="Exportar PNG"
              className="group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/40 hover:-translate-y-0.5 active:scale-95">
              <Download className="w-5 h-5" strokeWidth={2} />
              <span className="absolute bottom-full mb-2 px-2 py-1 rounded-md bg-black/85 border border-white/10 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">Exportar</span>
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE BOTTOM SHEETS (capas + export)
          Se renderizan SOLO en mobile. Backdrop tap cierra.
          ═══════════════════════════════════════════════════════════════════ */}
      {isMobile && (mobilePanelOpen === "layers" || mobilePanelOpen === "export") && (
        <div
          onClick={() => setMobilePanelOpen(null)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}

      {/* MOBILE BOTTOM SHEET: CAPAS — hidden bajo feature flag (P2.1) */}
      {FEATURES.layersPanel && isMobile && (
        <div className={`
          ${mobilePanelOpen === "layers" ? "translate-y-0" : "translate-y-full"}
          fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] rounded-t-3xl ag-glass
          border-t border-white/10 shadow-2xl flex flex-col
          transition-transform duration-300 ease-out safe-area-bottom
        `}>
          <div className="relative px-4 pt-3 pb-2 border-b border-white/[0.06]">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2"/>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Capas</span>
              <button onClick={() => setMobilePanelOpen(null)} className="text-gray-400 active:text-white text-xl leading-none">×</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {layers.map(layer => (
              <div key={layer.id}
                onClick={() => { selectLayerFromPanel(layer); }}
                className={`flex items-center gap-3 px-4 py-3 border-b border-white/[0.04] transition-all ${selectedLayer?.id === layer.id ? "bg-purple-600/15 border-l-2 border-l-purple-500" : "active:bg-white/5"}`}>
                <LayerIcon type={layer.type}/>
                <span className={`flex-1 text-sm truncate ${selectedLayer?.id === layer.id ? "text-white" : "text-gray-300"}`}>{layer.name}</span>
                <button onClick={e => { e.stopPropagation(); toggleVisibility(layer.id); }} className={`p-2 rounded-lg ${layer.visible ? "text-gray-400 active:text-white" : "text-gray-700"}`}>
                  {layer.visible ? <Eye className="w-4 h-4" strokeWidth={2} /> : <EyeOff className="w-4 h-4" strokeWidth={2} />}
                </button>
                <button onClick={e => { e.stopPropagation(); toggleLock(layer.id); }} className={`p-2 rounded-lg ${layer.locked ? "text-yellow-500" : "text-gray-400 active:text-white"}`}>
                  {layer.locked ? <Lock className="w-4 h-4" strokeWidth={2} /> : <Unlock className="w-4 h-4" strokeWidth={2} />}
                </button>
              </div>
            ))}
            {layers.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">No hay capas todavia</div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM SHEET: EXPORT */}
      {isMobile && (
        <div className={`
          ${mobilePanelOpen === "export" ? "translate-y-0" : "translate-y-full"}
          fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl ag-glass
          border-t border-white/10 shadow-2xl
          transition-transform duration-300 ease-out safe-area-bottom
        `}>
          <div className="relative px-4 pt-3 pb-2 border-b border-white/[0.06]">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-2"/>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Exportar</span>
              <button onClick={() => setMobilePanelOpen(null)} className="text-gray-400 active:text-white text-xl leading-none">×</button>
            </div>
          </div>
          <div className="p-4 space-y-2">
            <button
              onClick={() => { exportFlyer("png"); setMobilePanelOpen(null); }}
              className="w-full px-4 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 active:from-purple-700 active:to-fuchsia-700 text-white font-bold text-base flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" strokeWidth={2}/>
              Descargar PNG
            </button>
            <button
              onClick={() => { exportFlyer("jpg"); setMobilePanelOpen(null); }}
              className="w-full px-4 py-4 rounded-2xl bg-white/[0.06] active:bg-white/[0.10] border border-white/[0.10] text-white font-semibold text-base flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" strokeWidth={2}/>
              Descargar JPG
            </button>
          </div>
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

      {/* ─── FLOATING TOOLBAR — contextual por tipo de objeto ──────────────
          Diseno post-auditoria UX (sprint P0):
            - TEXTO   → tamano stepper, B/I, color picker, align, z-order, dup, lock, del
            - IMAGEN  → reemplazar (image puro) o color (shape), align, z-order, dup, lock, del
            - FONDO   → color/reemplazar, z-order, lock
          Decisiones:
            - Color y z-order son PRIMARIOS (no submenu) — son las acciones #1 y #2
              que el usuario reporta como "escondidas".
            - "More" desaparece: duplicate, layer up/down ya no estan enterrados.
            - Align se mantiene como popup porque tiene 6 opciones — meterlas
              inline ocupa demasiado espacio horizontal.
          ─────────────────────────────────────────────────────────────────── */}
      {floatingToolbar.visible && selectedLayer && (() => {
        // Detectamos si la "imagen" es realmente una shape (rect/circle/etc) o
        // una imagen verdadera. Las shapes admiten color fill; las imagenes admiten
        // reemplazo de src. Distincion clave para mostrar el control correcto.
        const activeObj = fabricRef.current?.getActiveObject();
        const isShape = !!activeObj && SHAPE_TYPES.includes(activeObj.type ?? "");
        const isRealImage = selectedLayer.type === "image" && !isShape;
        // Color actual de fill — leer del objeto directamente (mas fiable que
        // mantener un state separado para shapes).
        const currentFill = (() => {
          if (isText) return textProps.fill;
          if (isShape || selectedLayer.type === "background") {
            const f = activeObj?.fill;
            return typeof f === "string" ? f : "#000000";
          }
          return "#ffffff";
        })();
        // Setter directo de fill para shapes/background (no hay applyShapeProp)
        const setObjFill = (color: string) => {
          if (!activeObj) return;
          activeObj.set("fill", color);
          fabricRef.current?.renderAll();
          setSaveState("unsaved");
        };
        return (
        // ─── TOOLBAR DE POSICION FIJA (estilo Figma/Sketch) ───────────────
        //   Despues de multiples intentos de posicionar la toolbar arriba/
        //   abajo del bbox sin tapar el objeto, optamos por el approach
        //   estandar de Figma: barra FIJA debajo del header del editor,
        //   horizontalmente centrada sobre el lienzo. SIEMPRE visible
        //   cuando hay un objeto seleccionado, NUNCA tapa nada.
        //
        //   La toolbar es CONTEXTUAL (su contenido depende del tipo de
        //   objeto: texto / imagen / shape / fondo), pero su POSICION es
        //   estable. El usuario sabe siempre donde encontrarla.
        // ──────────────────────────────────────────────────────────────────
        <div
          className="fixed z-50 pointer-events-none left-1/2"
          style={{ top: 64, transform: "translateX(-50%)" }}>
          <div className="pointer-events-auto ag-glass border border-white/[0.08] rounded-2xl shadow-2xl shadow-purple-500/20 flex items-center gap-0.5 p-1 animate-in fade-in slide-in-from-bottom-1 duration-150">

            {/* ═══ SECCION TIPO-ESPECIFICA ═══ */}

            {isText && (
              <>
                {/* Editar inline (doble-clic equivalente) */}
                <button
                  onClick={() => {
                    const obj = fabricRef.current?.getActiveObject();
                    if (!obj) return;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (obj as any).enterEditing?.();
                    fabricRef.current?.renderAll();
                  }}
                  title={t("editor.fab.edit")}
                  className="ag-fab-btn">
                  <Edit3 className="w-4 h-4" strokeWidth={2} />
                  <span>{t("editor.fab.edit")}</span>
                </button>

                {/* Tamano con stepper +/- y warning si <12 */}
                <div className="inline-flex items-center bg-white/5 rounded-lg h-8 px-0.5"
                     title={textProps.fontSize < 12 ? "Quiza no se lea en movil" : "Tamano de fuente"}>
                  <button
                    onClick={() => applyTextProp("fontSize", Math.max(8, Math.round(textProps.fontSize) - 1))}
                    className="px-1.5 text-gray-400 hover:text-white text-sm leading-none"
                    aria-label="Reducir tamano">−</button>
                  <span className={`text-[11px] font-mono tabular-nums px-1 min-w-[26px] text-center ${textProps.fontSize < 12 ? "text-amber-400 font-bold" : "text-white"}`}>
                    {Math.round(textProps.fontSize)}
                  </span>
                  <button
                    onClick={() => applyTextProp("fontSize", Math.min(200, Math.round(textProps.fontSize) + 1))}
                    className="px-1.5 text-gray-400 hover:text-white text-sm leading-none"
                    aria-label="Aumentar tamano">+</button>
                </div>

                {/* Bold toggle */}
                <button
                  onClick={() => applyTextProp("fontWeight", textProps.fontWeight === "700" || textProps.fontWeight === "800" || textProps.fontWeight === "900" ? "400" : "700")}
                  title="Negrita"
                  className={`ag-fab-btn ${textProps.fontWeight === "700" || textProps.fontWeight === "800" || textProps.fontWeight === "900" ? "bg-purple-600/30 text-purple-200" : ""}`}>
                  <Bold className="w-4 h-4" strokeWidth={2.4} />
                </button>

                {/* Color del texto — PRIMARIO (antes solo en panel lateral) */}
                <div className="flex items-center px-1">
                  <ColorPickerPopover
                    value={currentFill}
                    onChange={(c) => applyTextProp("fill", c)}
                    scope="text"
                    swatchSize={26}
                    title="Color del texto"
                  />
                </div>
              </>
            )}

            {isRealImage && (
              <>
                {/* Reemplazar imagen — BOTON PROMINENTE (antes escondido en Edit) */}
                <button
                  onClick={() => {
                    const obj = fabricRef.current?.getActiveObject();
                    if (!obj) return;
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
                  }}
                  title="Reemplazar imagen"
                  className="ag-fab-btn bg-purple-600/20 text-purple-200 hover:bg-purple-600/30">
                  <ImageIcon className="w-4 h-4" strokeWidth={2.2} />
                  <span>Reemplazar</span>
                </button>

                {/* Z.16 — Quitar fondo: acceso rapido desde toolbar.
                    Abre modal de confirmación de créditos (1 cr) + reemplaza
                    src en Fabric tras llamada a /api/remove-bg. */}
                <button
                  onClick={() => { void openRemoveBgFlow(); }}
                  disabled={removingBgObjId !== null}
                  title={`Quitar fondo (${CREDIT_COST.quitar_fondo} crédito)`}
                  className="ag-fab-btn bg-fuchsia-600/20 text-fuchsia-200 hover:bg-fuchsia-600/30 disabled:opacity-50 disabled:cursor-wait">
                  {removingBgObjId !== null ? (
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.2} />
                  ) : (
                    <Eraser className="w-4 h-4" strokeWidth={2.2} />
                  )}
                  <span>Quitar fondo</span>
                </button>

                {/* Recortar a forma — abre seccion del panel */}
                <button
                  onClick={() => setOpenSections(p => ({ ...p, crop: true, style: true, "remove-bg": true }))}
                  title="Recortar / efectos"
                  className="ag-fab-btn">
                  <SparklesIcon className="w-4 h-4" strokeWidth={2} />
                  <span>Más</span>
                </button>
              </>
            )}

            {isShape && (
              <>
                {/* Color de relleno de la forma — PRIMARIO (antes inaccesible
                    sin abrir panel lateral, la queja #1 del usuario) */}
                <div className="flex items-center px-1">
                  <ColorPickerPopover
                    value={currentFill}
                    onChange={setObjFill}
                    scope="shape"
                    swatchSize={26}
                    title="Color de relleno"
                    label="Color"
                  />
                </div>
              </>
            )}

            {selectedLayer.type === "background" && (
              <>
                {/* Color del fondo si es color, reemplazar si es imagen */}
                <div className="flex items-center px-1">
                  <ColorPickerPopover
                    value={currentFill}
                    onChange={setObjFill}
                    scope="background"
                    swatchSize={26}
                    title="Color de fondo"
                  />
                </div>
                <button
                  onClick={() => {
                    const obj = fabricRef.current?.getActiveObject();
                    if (!obj) return;
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
                  }}
                  title="Reemplazar imagen de fondo"
                  className="ag-fab-btn">
                  <ImageIcon className="w-4 h-4" strokeWidth={2} />
                  <span>Imagen</span>
                </button>
              </>
            )}

            <div className="w-px h-6 bg-white/10 mx-0.5"/>

            {/* ═══ ACCIONES COMUNES (orden de capa, alinear, duplicar, lock, eliminar) ═══ */}

            {/* Alinear — popup porque son 6 opciones (no caben inline) */}
            <div className="relative">
              <button
                onClick={() => setFloatingToolbar(p => ({ ...p, alignOpen: !p.alignOpen, moreOpen: false }))}
                title={t("editor.fab.alignTitle")}
                className={`ag-fab-btn ${floatingToolbar.alignOpen ? "bg-purple-600/20 text-purple-200" : ""}`}>
                <AlignCenterHorizontal className="w-4 h-4" strokeWidth={2} />
              </button>
              {floatingToolbar.alignOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 ag-glass border border-white/[0.08] rounded-xl p-1.5 shadow-2xl">
                  <div className="grid grid-cols-3 gap-1 w-32">
                    {[
                      { pos: "left",     label: t("editor.align.left"),    icon: <AlignStartVertical    className="w-3.5 h-3.5" strokeWidth={2} /> },
                      { pos: "center-h", label: t("editor.align.centerH"), icon: <AlignCenterVertical   className="w-3.5 h-3.5" strokeWidth={2} /> },
                      { pos: "right",    label: t("editor.align.right"),   icon: <AlignEndVertical      className="w-3.5 h-3.5" strokeWidth={2} /> },
                      { pos: "top",      label: t("editor.align.top"),     icon: <AlignStartHorizontal  className="w-3.5 h-3.5" strokeWidth={2} /> },
                      { pos: "center-v", label: t("editor.align.centerV"), icon: <AlignCenterHorizontal className="w-3.5 h-3.5" strokeWidth={2} /> },
                      { pos: "bottom",   label: t("editor.align.bottom"),  icon: <AlignEndHorizontal    className="w-3.5 h-3.5" strokeWidth={2} /> },
                    ].map(item => (
                      <button key={item.pos} onClick={() => { alignSelectedTo(item.pos as "left" | "center-h" | "right" | "top" | "center-v" | "bottom"); setFloatingToolbar(p => ({ ...p, alignOpen: false })); }} title={item.label} className="aspect-square rounded-lg bg-white/5 hover:bg-purple-600/20 text-gray-400 hover:text-purple-200 transition-all flex items-center justify-center">
                        {item.icon}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Z-ORDER PROMOVIDO A PRIMARIO (atajos: ] traer adelante / [ enviar atras) */}
            <button
              onClick={() => moveLayer(selectedLayer.id, "up")}
              title="Traer adelante (])"
              className="ag-fab-btn">
              <ChevronUp className="w-4 h-4" strokeWidth={2.4} />
            </button>
            <button
              onClick={() => moveLayer(selectedLayer.id, "down")}
              title="Enviar atras ([)"
              className="ag-fab-btn">
              <ChevronDown className="w-4 h-4" strokeWidth={2.4} />
            </button>

            {/* Duplicar — PROMOVIDO (antes en submenu "More") */}
            {selectedLayer.type !== "background" && (
              <button
                onClick={() => { void duplicateActiveObject(); }}
                title={`${t("editor.fab.duplicate")} (⌘D)`}
                className="ag-fab-btn">
                <Copy className="w-4 h-4" strokeWidth={2} />
              </button>
            )}

            {/* Bloquear */}
            <button
              onClick={() => toggleLock(selectedLayer.id)}
              title={selectedLayer.locked ? t("editor.fab.unlock") : t("editor.fab.lock")}
              className={`ag-fab-btn ${selectedLayer.locked ? "bg-amber-500/20 text-amber-300" : ""}`}>
              {selectedLayer.locked
                ? <Lock   className="w-4 h-4" strokeWidth={2} />
                : <Unlock className="w-4 h-4" strokeWidth={2} />}
            </button>

            {/* Eliminar — no aplicable a fondo (no se puede borrar) */}
            {selectedLayer.type !== "background" && (
              <button
                onClick={() => deleteLayer(selectedLayer.id)}
                title={`${t("editor.fab.delete")} (Supr)`}
                className="ag-fab-btn ag-fab-btn-danger">
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        );
      })()}

      {/* ─── COMMAND PALETTE ─────────────────────────────────────────── */}
      {/* Modal de atajos teclado — abre con "?" (sin modifier) */}
      {shortcutsOpen && <KeyboardShortcutsModal onClose={() => setShortcutsOpen(false)} />}

      {/* Modal post-descarga — abre tras doExport exitoso */}
      {postDownload && (
        <PostDownloadModal
          imageDataUrl={postDownload.dataUrl}
          format={postDownload.format}
          currentFormatId={data?.format}
          onClose={() => setPostDownload(null)}
        />
      )}

      {/* Fase Z.7 — Modal de confirmación de crédito antes de export.
          Z.25 — anade bloque de detalles para que el user sepa formato +
          dimensiones + tipo de archivo antes de gastar el credito. */}
      <ConfirmCreditModal
        open={pendingExportFormat !== null}
        onClose={() => setPendingExportFormat(null)}
        onConfirm={handleConfirmExport}
        actionLabel={`Descargar flyer en ${pendingExportFormat?.toUpperCase() ?? "imagen"}`}
        amount={CREDIT_COST.download_png}
        balance={credits.balance ?? 0}
        daysUntilReset={credits.daysUntilReset ?? undefined}
        exportDetails={(() => {
          const fmt = getFormatByDimensions(canvasSize.w, canvasSize.h);
          return {
            formatName: fmt?.name,
            formatSubtitle: fmt?.subtitle,
            dimensions: `${canvasSize.w} × ${canvasSize.h} px`,
            fileType: pendingExportFormat ?? undefined,
          };
        })()}
      />

      {/* Z.16 — Modal de confirmación para Quitar fondo en editor */}
      <ConfirmCreditModal
        open={pendingRemoveBg !== null}
        onClose={() => setPendingRemoveBg(null)}
        onConfirm={handleConfirmRemoveBg}
        actionLabel="Quitar el fondo de esta imagen"
        amount={CREDIT_COST.quitar_fondo}
        balance={credits.balance ?? 0}
        daysUntilReset={credits.daysUntilReset ?? undefined}
      />

      {/* Z.17 — Borrador mágico/manual full-screen */}
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


      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          isText={isText}
          isImage={isImage}
          hasSelection={!!selectedLayer}
          commands={[
            // ── Acciones ────────────────────────────────────
            { id: "save", label: "Guardar diseño", desc: "Subir a la nube (⌘S)", group: "Acciones", icon: <Save className="w-4 h-4" strokeWidth={2} />, run: handleSave },
            { id: "undo", label: "Deshacer", desc: "Revertir el último cambio (⌘Z)", group: "Acciones", icon: <Undo2 className="w-4 h-4" strokeWidth={2} />, disabled: !canUndo, run: undo },
            { id: "redo", label: "Rehacer", desc: "Rehacer el último deshacer (⌘⇧Z)", group: "Acciones", icon: <Redo2 className="w-4 h-4" strokeWidth={2} />, disabled: !canRedo, run: redo },
            { id: "add-text", label: "Añadir texto", desc: "Insertar un nuevo texto", group: "Acciones", icon: <Type className="w-4 h-4" strokeWidth={2} />, run: addText },
            { id: "open-photos", label: "Abrir biblioteca de fotos", desc: "Subir artista o logo", group: "Acciones", icon: <Camera className="w-4 h-4" strokeWidth={2} />, run: () => setArtistsModalOpen(true) },
            { id: "duplicate", label: "Duplicar elemento", desc: "Clonar la capa seleccionada", group: "Acciones", icon: <Copy className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: duplicateActiveObject },
            { id: "delete", label: "Eliminar elemento", desc: "Borra la capa seleccionada", group: "Acciones", icon: <Trash className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => selectedLayer && deleteLayer(selectedLayer.id) },
            { id: "lock", label: selectedLayer?.locked ? "Desbloquear elemento" : "Bloquear elemento", desc: "Evitar modificaciones", group: "Acciones", icon: <Lock className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => selectedLayer && toggleLock(selectedLayer.id) },
            { id: "flip-h", label: "Voltear horizontal", desc: "Espejo en eje X", group: "Acciones", icon: <FlipHorizontal className="w-4 h-4" strokeWidth={2} />, disabled: !isImage, run: () => { const obj = fabricRef.current?.getActiveObject(); if (obj) { obj.set("flipX", !obj.flipX); fabricRef.current?.renderAll(); setSaveState("unsaved"); } } },
            { id: "flip-v", label: "Voltear vertical", desc: "Espejo en eje Y", group: "Acciones", icon: <FlipVertical className="w-4 h-4" strokeWidth={2} />, disabled: !isImage, run: () => { const obj = fabricRef.current?.getActiveObject(); if (obj) { obj.set("flipY", !obj.flipY); fabricRef.current?.renderAll(); setSaveState("unsaved"); } } },

            // ── Alinear ────────────────────────────────────
            { id: "center-h", label: "Centrar horizontal", desc: "Eje X del canvas", group: "Alinear", icon: <AlignCenterVertical className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => alignSelectedTo("center-h") },
            { id: "center-v", label: "Centrar vertical", desc: "Eje Y del canvas", group: "Alinear", icon: <AlignCenterHorizontal className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => alignSelectedTo("center-v") },
            { id: "align-left", label: "Alinear izquierda", desc: "Pegado al borde izq", group: "Alinear", icon: <AlignStartVertical className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => alignSelectedTo("left") },
            { id: "align-right", label: "Alinear derecha", desc: "Pegado al borde der", group: "Alinear", icon: <AlignEndVertical className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => alignSelectedTo("right") },
            { id: "align-top", label: "Alinear arriba", desc: "Pegado al borde superior", group: "Alinear", icon: <AlignStartHorizontal className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => alignSelectedTo("top") },
            { id: "align-bottom", label: "Alinear abajo", desc: "Pegado al borde inferior", group: "Alinear", icon: <AlignEndHorizontal className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => alignSelectedTo("bottom") },

            // ── Capa ────────────────────────────────────
            { id: "layer-up", label: "Subir capa", desc: "Mover hacia adelante", group: "Capa", icon: <MoveUp className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => selectedLayer && moveLayer(selectedLayer.id, "up") },
            { id: "layer-down", label: "Bajar capa", desc: "Mover hacia atrás", group: "Capa", icon: <MoveDown className="w-4 h-4" strokeWidth={2} />, disabled: !selectedLayer, run: () => selectedLayer && moveLayer(selectedLayer.id, "down") },

            // ── Vista ────────────────────────────────────
            { id: "view-sidebar", label: "Vista Sidebar", desc: "Barra lateral con categorías", group: "Vista", icon: <PanelLeft className="w-4 h-4" strokeWidth={2} />, run: () => setViewMode("sidebar") },
            { id: "view-dock", label: "Vista Dock", desc: "Dock flotante inferior", group: "Vista", icon: <PanelBottom className="w-4 h-4" strokeWidth={2} />, run: () => setViewMode("dock") },
            { id: "zoom-fit", label: "Zoom 50%", desc: "Ajustar al área visible", group: "Vista", icon: <Minimize2 className="w-4 h-4" strokeWidth={2} />, run: () => setZoom(50) },
            { id: "zoom-100", label: "Zoom 100%", desc: "Tamaño real", group: "Vista", icon: <Maximize2 className="w-4 h-4" strokeWidth={2} />, run: () => setZoom(100) },
            { id: "shortcuts", label: "Ver atajos de teclado", desc: "Lista de atajos (?)", group: "Vista", icon: <Search className="w-4 h-4" strokeWidth={2} />, run: () => setShortcutsOpen(true) },

            // ── Exportar ────────────────────────────────────
            { id: "export-png", label: "Exportar como PNG", desc: "Descargar imagen PNG", group: "Exportar", icon: <Download className="w-4 h-4" strokeWidth={2} />, run: () => exportFlyer("png") },
            { id: "export-jpg", label: "Exportar como JPG", desc: "Descargar imagen JPG", group: "Exportar", icon: <Download className="w-4 h-4" strokeWidth={2} />, run: () => exportFlyer("jpg") },

            // ── Navegación ────────────────────────────────────
            { id: "go-projects", label: "Mis diseños", desc: "Ver mis diseños guardados", group: "Navegación", icon: <FolderOpen className="w-4 h-4" strokeWidth={2} />, run: () => router.push("/projects") },
            { id: "go-templates", label: "Ver todas las plantillas", desc: "Volver al listado", group: "Navegación", icon: <ArrowLeftCircle className="w-4 h-4" strokeWidth={2} />, run: () => router.push("/templates") },
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

      {/* AuthModal: se abre cuando el usuario intenta descargar/guardar sin
          sesion. Tras login exitoso ejecuta la accion pendiente (onSuccess) y
          se cierra. Si cierra manualmente sin login, no se reintenta. */}
      {authModalConfig && (
        <AuthModal
          title={authModalConfig.title}
          subtitle={authModalConfig.subtitle}
          onAuthSuccess={authModalConfig.onSuccess}
          onClose={() => setAuthModalConfig(null)}
        />
      )}

      {/* Tour de bienvenida primera vez en desktop editor. Auto-detecta
          si ya se vio (localStorage). NO se muestra en modo admin creator
          (donde el flujo es distinto) ni en mobile (tiene su propio hint). */}
      {!isAdminMode && <DesktopEditorTour />}

      {/* SegmentPersonModal: BROCHA MAGICA. Usuario hace click + arrastra
          sobre la persona como si pintara. Cada movimiento del cursor anade
          un punto al array (con espacio minimo entre ellos para no saturar).
          SAM-2 recibe muchos puntos densos del MISMO object_id y entiende
          el area completa de la persona. */}
      {segmentState.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={e => {
            if (e.target === e.currentTarget && !segmentState.loading) closeSegmentModal();
          }}
        >
          <div className="w-full max-w-2xl rounded-3xl overflow-hidden"
            style={{ background: "rgba(15,15,25,0.98)", border: "1px solid rgba(16,185,129,0.30)", boxShadow: "0 0 60px rgba(16,185,129,0.15)" }}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Scissors size={18} className="text-emerald-400"/>
                  Toca a la persona
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold tracking-wider border border-amber-500/40">BETA</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="text-emerald-300 font-semibold">Un solo click</span> sobre la persona que quieres aislar.
                </p>
                <p className="text-[10px] text-amber-300/80 mt-1 leading-snug">
                  ⚠ Funciona mejor con <strong>1 sola persona</strong> o personas <strong>bien separadas</strong>.
                  Grupos densos o personas abrazadas pueden no separarse bien.
                </p>
              </div>
              {!segmentState.loading && (
                <button onClick={closeSegmentModal} className="text-gray-500 hover:text-white text-2xl p-1 shrink-0">×</button>
              )}
            </div>
            <div className="p-5 relative">
              <div
                className="relative max-h-[55vh] mx-auto w-full"
                style={{ aspectRatio: segmentState.naturalH > 0 ? `${segmentState.naturalW}/${segmentState.naturalH}` : "1" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={segmentState.imgSrc}
                  alt="Toca a la persona"
                  className={`w-full h-full object-contain rounded-xl select-none ${segmentState.loading ? "opacity-50" : "cursor-crosshair"}`}
                  // UN SOLO CLICK: el backend usa Florence-2 para detectar
                  // personas y SAM-2 con el bounding box de la persona del
                  // tap. Multi-click se reemplaza por click → click cambia tap.
                  onClick={(e) => {
                    if (segmentState.loading) return;
                    const rect = (e.target as HTMLImageElement).getBoundingClientRect();
                    const xRatio = (e.clientX - rect.left) / rect.width;
                    const yRatio = (e.clientY - rect.top) / rect.height;
                    // Reset: cada click empieza desde 0 (no acumula)
                    setSegmentState(s => {
                      const x = Math.round(xRatio * s.naturalW);
                      const y = Math.round(yRatio * s.naturalH);
                      return { ...s, taps: [{ x, y }], error: null };
                    });
                  }}
                  draggable={false}
                />
                {/* Render trazo verde — overlay sobre la imagen */}
                {segmentState.taps.map((tap, i) => {
                  const xPct = (tap.x / segmentState.naturalW) * 100;
                  const yPct = (tap.y / segmentState.naturalH) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute pointer-events-none rounded-full bg-emerald-500/70 border border-emerald-300 shadow-lg"
                      style={{
                        left: `${xPct}%`,
                        top: `${yPct}%`,
                        width: 28,
                        height: 28,
                        marginLeft: -14,
                        marginTop: -14,
                      }}
                    />
                  );
                })}
                {segmentState.loading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 rounded-xl">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin"/>
                    <p className="text-sm font-semibold text-emerald-200">Procesando con IA...</p>
                    <p className="text-xs text-gray-500">Esto tarda unos 2-4 segundos</p>
                  </div>
                )}
              </div>
              {segmentState.error && (
                <p className="text-red-400 text-xs mt-3 text-center">{segmentState.error}</p>
              )}
            </div>
            {/* Footer con toggle HD + controles */}
            <div className="border-t border-white/[0.05]">
              {/* Toggle HD: refinamiento BRIA tras SAM-2. Bordes pelo/tela mejores. */}
              <button
                onClick={() => setSegmentState(s => ({ ...s, hd: !s.hd }))}
                disabled={segmentState.loading}
                className={`w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.03] ${segmentState.loading ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-5 rounded-full transition-colors relative ${segmentState.hd ? "bg-purple-500" : "bg-white/[0.15]"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${segmentState.hd ? "left-4" : "left-0.5"}`}/>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      Calidad HD
                      {segmentState.hd && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/25 text-purple-200 font-bold tracking-wide">PRO</span>}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {segmentState.hd
                        ? "Bordes precisos en pelo y telas (consume cuota HD)"
                        : "Activa para bordes excelentes en pelo y telas"}
                    </p>
                  </div>
                </div>
              </button>
              <div className="px-4 pb-4 flex items-center gap-2">
                <span className="text-xs text-gray-500 flex-1">
                  {segmentState.taps.length === 0
                    ? "Toca a la persona que quieres aislar."
                    : "Punto marcado. Si no es correcto, toca otra vez."}
                </span>
                <button
                  onClick={() => { void processSegmentTaps(); }}
                  disabled={segmentState.taps.length === 0 || segmentState.loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: segmentState.taps.length === 0
                      ? "rgba(255,255,255,0.05)"
                      : segmentState.hd
                        ? "linear-gradient(135deg,#7c3aed,#a855f7)"  // morado para HD
                        : "linear-gradient(135deg,#059669,#10b981)", // verde normal
                  }}>
                  <Scissors size={13} strokeWidth={2.5}/>
                  Recortar{segmentState.hd ? " HD" : ""}
                </button>
              </div>
            </div>
          </div>
        </div>
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
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
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
  icon: ReactNode;
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
          <Search className="w-4 h-4 text-gray-500" strokeWidth={2} />
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
