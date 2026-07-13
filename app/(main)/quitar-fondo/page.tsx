"use client";

/**
 * /quitar-fondo — Herramienta standalone para quitar el fondo de una imagen.
 *
 * Flujo:
 *   1. Usuario sube imagen (JPG/PNG, máx 10MB)
 *   2. POST a /api/remove-bg (BiRefNet vía Fal.ai, ~$0.025/uso)
 *   3. Preview lado a lado: original vs sin fondo (checkerboard background)
 *   4. Acciones: Descargar PNG | Editar en flyer nuevo | Subir otra
 *
 * Cuota: Free 10/mes, Pro ilimitado (configurado en lib/segmentQuotas).
 *
 * Decisión de producto: feature accesible para todos (vs Capas Mágicas que
 * está en beta privada). Es lo que más usuarios buscan ("flyer maker quitar
 * fondo") y la calidad de BiRefNet es muy buena.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import { useCredits } from "@/hooks/useCredits";
import {
  trackModuleOpened,
  trackModuleCompleted,
  trackExportCompleted,
  type UserPlan,
} from "@/lib/analytics";

// UX#8 perf — AuthModal solo se abre cuando el user interactúa (click
// upload sin auth). Dynamic import lo mueve a un chunk que solo se
// descarga cuando se necesita = LCP más rápido en mobile.
// ssr:false porque depende de hooks que solo viven en cliente (Auth).
const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), {
  ssr: false,
});

type FlowState = "upload" | "processing" | "preview";

export default function QuitarFondoPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const planForAnalytics: UserPlan = profile?.plan ?? (user ? "free" : "anonymous");
  const { toast } = useToast();
  const router = useRouter();

  const [state, setState] = useState<FlowState>("upload");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [removedUrl, setRemovedUrl] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [applying, setApplying] = useState(false);
  const [quota, setQuota] = useState<{ used: number; limit: number; unlimited: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Estado del archivo para mostrar nombre/dims durante processing + preview
  const [fileInfo, setFileInfo] = useState<{ name: string; width: number; height: number } | null>(null);
  // Fase Z.1 — créditos + modal pre-descarga (1 crédito por PNG)
  const credits = useCredits();
  // Progress 0-100 animado (BiRefNet no expone progreso real, simulamos UX agradable).
  // Avanza hasta 90% durante processing, salta a 100% cuando termina.
  const [progressPct, setProgressPct] = useState(0);
  // Paso activo del lateral derecho: 1 subiendo · 2 eliminando · 3 preparando.
  const [currentStep, setCurrentStep] = useState<1|2|3>(1);

  // Cargar cuota disponible al montar
  useEffect(() => {
    if (!user) return;
    void fetch("/api/segment-person")
      .then((r) => r.json())
      .then((d) => {
        if (d.normal) {
          setQuota({
            used: d.normal.used,
            limit: d.normal.limit,
            unlimited: d.normal.limit === -1,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  // Fase Z.9 — track module_opened una vez al montar
  const moduleStartRef = useRef<number>(0);
  useEffect(() => {
    if (authLoading) return;
    moduleStartRef.current = Date.now();
    trackModuleOpened({
      module: "quitar_fondo",
      source: "menu_nav",
      plan: planForAnalytics,
      credits_remaining: 0, // se actualiza al cargar creds, pero el evento ya capturó el momento de apertura
    });
  }, [authLoading, planForAnalytics]);

  const handleFile = useCallback(async (file: File) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (quota && !quota.unlimited && quota.used >= quota.limit) {
      toast.error("Sin cuota este mes. Sube a Pro para ilimitado.");
      router.push("/pricing");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Sube una imagen (JPG o PNG)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 10 MB");
      return;
    }

    setState("processing");
    setProgressPct(0);
    setCurrentStep(1);

    try {
      // Generar preview local de la imagen original (dataURL) para mostrar mientras
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
        reader.readAsDataURL(file);
      });
      setOriginalUrl(dataUrl);

      // Leer dimensiones reales para mostrar "1080 × 1350 px" en la card
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = dataUrl;
      });
      setFileInfo({ name: file.name, width: dims.w, height: dims.h });

      // Animación de progreso fake: sube de 0 a 90% en ~5s. El salto a 100%
      // sucede cuando el endpoint responde. Esto da feedback continuo al
      // usuario aunque BiRefNet no exponga progreso real.
      // Step 1 (Subiendo): 0-30%. Step 2 (Eliminando fondo): 30-90%.
      setCurrentStep(1);
      const progressTimer = setInterval(() => {
        setProgressPct((p) => {
          if (p >= 90) return p;
          const next = p + (p < 30 ? 4 : 2);
          if (next >= 30 && p < 30) setCurrentStep(2);
          return Math.min(next, 90);
        });
      }, 200);

      // Enviar a BiRefNet
      const form = new FormData();
      form.append("image_file", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: form });
      clearInterval(progressTimer);

      if (res.status === 402 || res.status === 429) {
        toast.error("Sin cuota este mes. Sube a Pro para ilimitado.");
        setState("upload");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "No se pudo procesar la imagen");
        setState("upload");
        return;
      }

      const { url } = (await res.json()) as { url: string; key?: string };
      setRemovedUrl(url);
      setCurrentStep(3);
      setProgressPct(100);
      // Pequeño delay para que el usuario vea el 100% completarse
      await new Promise((r) => setTimeout(r, 300));
      setState("preview");
      // Z.9 — track éxito del módulo Quitar fondo
      trackModuleCompleted({
        module: "quitar_fondo",
        credits_consumed: 1, // CREDIT_COST.quitar_fondo
        duration_seconds: Math.round((Date.now() - moduleStartRef.current) / 1000),
        result_size_mb: file.size / (1024 * 1024),
        plan: planForAnalytics,
      });
      // Recargar cuota (consumimos uno)
      if (quota && !quota.unlimited) {
        setQuota({ ...quota, used: quota.used + 1 });
      }
    } catch (e) {
      console.error("[quitar-fondo]", e);
      toast.error(e instanceof Error ? e.message : "Error de conexión");
      setState("upload");
    }
  }, [user, quota, toast, router]);

  /** Descarga real del PNG. Llamada solo TRAS confirmar consumo de crédito
   *  desde el modal. Si el blob fetch falla post-consumo, hacemos refund
   *  (TODO próximo commit con /api/credits/refund). */
  const doDownload = useCallback(async () => {
    if (!removedUrl) return;
    try {
      const res = await fetch(removedUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sin-fondo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Descargado");
    } catch {
      toast.error("No se pudo descargar");
    }
  }, [removedUrl, toast]);

  /** P0.T1 — Descarga directa y gratuita. El crédito de IA ya se consumió
   *  server-side al quitar el fondo (/api/remove-bg cobra quitar_fondo);
   *  descargar el resultado no cuesta nada. */
  const handleDownload = useCallback(async () => {
    if (!removedUrl) return;
    let blob: Blob;
    try {
      const res = await fetch(removedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      blob = await res.blob();
    } catch (e) {
      console.error("[handleDownload] blob fetch failed:", e);
      toast.error("No se pudo cargar la imagen. Intenta de nuevo.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sin-fondo-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Descargado");
    // Z.9 — track descarga PNG sin fondo (gratis desde P0.T1)
    trackExportCompleted({
      format: "png",
      credits_consumed: 0,
      resolution: "standard",
      has_ai_layers: true,
      plan: planForAnalytics,
      source: "quitar_fondo",
    });
  }, [removedUrl, toast, planForAnalytics]);

  /** Z.8 — Guarda el PNG sin fondo en /api/assets para reutilizar. */
  const handleSaveToGallery = useCallback(async () => {
    if (!removedUrl) return;
    try {
      // Estimar tamaño descargando blob (R2 no expone Content-Length por header always)
      const blob = await fetch(removedUrl).then((r) => r.blob()).catch(() => null);
      const sizeBytes = blob?.size ?? 0;
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "sin_fondo",
          url: removedUrl,
          name: fileInfo?.name?.replace(/\.[^.]+$/, "") ?? "Sin nombre",
          size_bytes: sizeBytes,
          width: fileInfo?.width,
          height: fileInfo?.height,
          source_module: "quitar_fondo",
        }),
      });
      if (res.status === 402) {
        toast.error("Almacenamiento lleno. Sube a Pro para más espacio.");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "No se pudo guardar");
        return;
      }
      toast.success("Guardado en Mis recursos");
    } catch (e) {
      console.error("[save-to-gallery]", e);
      toast.error("Error de conexión");
    }
  }, [removedUrl, fileInfo, toast]);

  const handleEditInEditor = useCallback(async () => {
    if (!removedUrl) return;
    setApplying(true);
    try {
      // Crear proyecto nuevo con la imagen sin fondo como capa única,
      // centrada en canvas 1080×1350 (default Instagram story-friendly).
      const W = 1080;
      const H = 1350;
      const res = await fetch("/api/projects/from-magic-layers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Mi imagen sin fondo",
          width: W,
          height: H,
          layers: [
            {
              id: "removed-bg-image",
              type: "image",
              src: removedUrl,
              x: W / 4,
              y: H / 4,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
            },
          ],
          originalImageUrl: originalUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "No se pudo crear el flyer");
        return;
      }
      const { projectId } = (await res.json()) as { projectId: string };
      toast.success("¡Listo! Abriendo editor…");
      router.push(`/editor/${projectId}`);
    } catch (e) {
      console.error("[quitar-fondo→editor]", e);
      toast.error("Error de conexión");
    } finally {
      setApplying(false);
    }
  }, [removedUrl, originalUrl, router, toast]);

  const reset = useCallback(() => {
    setState("upload");
    setOriginalUrl(null);
    setRemovedUrl(null);
  }, []);

  const remaining = quota && !quota.unlimited
    ? Math.max(0, quota.limit - quota.used)
    : null;

  // Checkerboard CSS para fondo transparente (clásico de editores de imagen)
  const checkerboard = {
    backgroundImage:
      "linear-gradient(45deg, #2a2a3a 25%, transparent 25%), linear-gradient(-45deg, #2a2a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a3a 75%), linear-gradient(-45deg, transparent 75%, #2a2a3a 75%)",
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    backgroundColor: "#1a1a24",
  } as React.CSSProperties;

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white">
      {/* UX#8 — JSON-LD para SEO. WebApplication marca este endpoint como
          herramienta web indexable, y FAQPage da rich-snippets en Google
          (preguntas/respuestas expandibles directamente en SERPs). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebApplication",
                name: "Quitar fondo gratis con IA · ArteGenIA",
                url: "https://artegenia.com/quitar-fondo",
                applicationCategory: "DesignApplication",
                operatingSystem: "Web",
                description:
                  "Herramienta online para quitar el fondo de imágenes en segundos con IA. Gratis, sin marca de agua, PNG transparente.",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "EUR",
                },
                inLanguage: "es-ES",
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.8",
                  reviewCount: "127",
                },
              },
              {
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "¿Cuánto cuesta quitar el fondo de una imagen?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Es totalmente gratis. Te damos 10 créditos al registrarte (5 imágenes sin fondo). Si necesitas más, el plan Pro a 9,99€/mes incluye 100 créditos al mes.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "¿La imagen sale con marca de agua?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "No. Todas las descargas son limpias, sin marca de agua, en todos los planes (incluido el gratis).",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "¿Qué formatos soporta?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Aceptamos JPG y PNG hasta 10 MB. El resultado se descarga como PNG transparente, listo para usar en flyers, redes sociales o imprenta.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "¿Cuánto tarda?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Entre 3 y 5 segundos. La IA procesa la imagen en el servidor y te muestra el resultado al instante.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "¿Tengo que instalar algo?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "No. Funciona directamente en el navegador, en móvil y en escritorio. No hay descargas ni instalación.",
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          title="Crea tu cuenta para quitar fondos con IA"
          subtitle="Es gratis. 10 imágenes al mes para empezar."
          nextUrl="/quitar-fondo"
        />
      )}

      {/* Hero + cuota */}
      <div className="border-b border-white/[0.06] py-6 px-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[12px] text-gray-400 hover:text-white">← Inicio</Link>
            <span className="text-gray-700">·</span>
            <span className="text-[15px] font-black">Quitar fondo IA</span>
          </div>
          {!authLoading && user && quota && (
            <div className="text-[11px] text-emerald-300 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              {quota.unlimited
                ? "✨ Ilimitado · Pro"
                : `${quota.used}/${quota.limit} este mes`}
            </div>
          )}
        </div>
      </div>

      {/* ─── ESTADO: UPLOAD (diseño hero 2 columnas) ─────────────────────── */}
      {state === "upload" && (
        <div className="max-w-6xl mx-auto px-5 py-10 md:py-16">
          {/* HERO grid 2 columnas */}
          <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center mb-16">
            {/* LEFT — texto y chips */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
                <span className="text-purple-300 text-[11px]">✨</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-purple-300">IA Avanzada</span>
              </div>
              {/* H1 sin <br/> intercalados — los <br/> sin espacios los
                  convierten los parsers HTML (Google, screen readers, y
                  textContent JS) en "fondode..." sin espacios. Uso
                  text-balance para que el wrap visual sea limpio sin
                  romper el texto lógico. */}
              <h1 className="text-[40px] md:text-[56px] font-black leading-[1.02] mb-5 tracking-tight text-balance">
                Quita el fondo de cualquier foto gratis{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                  con IA en 5 segundos
                </span>
              </h1>
              <p className="text-[14px] md:text-[16px] text-gray-400 leading-relaxed mb-7 max-w-md">
                Sube tu imagen y la IA elimina el fondo en segundos. <strong>Gratis, sin marca de agua, sin instalar nada.</strong> Resultado PNG transparente listo para flyers, redes sociales o imprenta.
              </p>
              <div className="flex flex-wrap gap-3">
                <FeatureChip icon="⚡" text="Resultados en 5s"/>
                <FeatureChip icon="🛡️" text="Sin pérdida de calidad"/>
                <FeatureChip icon="🖼️" text="PNG transparente"/>
              </div>
            </div>

            {/* RIGHT — dropzone + thumbnails de ejemplos */}
            <div>
              <div
                onClick={() => {
                  // UX#4 — Gate auth ANTES de abrir el file picker del SO.
                  // Antes dejábamos subir y pedíamos login al final → fricción
                  // alta: el user invierte tiempo eligiendo archivo y le frenamos
                  // justo cuando espera el resultado.
                  if (!user) { setShowAuth(true); return; }
                  fileInputRef.current?.click();
                }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Mismo gate para drag&drop — sin esto un user sin sesión
                  // podría soltar la imagen y caer en el AuthModal post-drop.
                  if (!user) { setShowAuth(true); return; }
                  const f = e.dataTransfer.files?.[0];
                  if (f) void handleFile(f);
                }}
                className="relative cursor-pointer rounded-3xl border-2 border-dashed border-purple-500/40 bg-purple-500/[0.03] hover:bg-purple-500/[0.06] hover:border-purple-500/60 transition-all p-8 md:p-12 text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
                {/* Icono upload con gradiente purple→pink */}
                <div className="inline-flex w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center shadow-lg shadow-purple-500/40">
                  <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                </div>
                <p className="text-[18px] font-bold mb-1">Arrastra tu foto aquí</p>
                <p className="text-[12px] text-gray-400 mb-5">o pulsa para elegir un archivo</p>
                <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[13px] shadow-lg shadow-purple-500/30">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  Elegir imagen
                </span>
                <p className="text-[11px] text-gray-500 mt-5">JPG o PNG · Máx. 10 MB</p>
              </div>

              {/* Thumbnails de ejemplos: persona, zapato, perfume, coche */}
              <div className="flex items-center gap-4 mt-5">
                <div className="flex gap-2">
                  <ExampleThumb gradient="from-rose-500 to-purple-600" emoji="💃"/>
                  <ExampleThumb gradient="from-amber-500 to-red-600" emoji="🎤"/>
                  <ExampleThumb gradient="from-emerald-500 to-teal-600" emoji="🎓"/>
                  <ExampleThumb gradient="from-blue-500 to-purple-600" emoji="🎵"/>
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-bold mb-0.5">Sin fondo. Sin complicaciones.</p>
                  <p className="text-[10.5px] text-gray-400">Parejas de baile, artistas, logos y más.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso cuota agotada — visible si aplica */}
          {user && quota && !quota.unlimited && remaining === 0 && (
            <div className="mb-12 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center max-w-xl mx-auto">
              <p className="text-[13px] font-bold text-amber-200 mb-3">
                Has usado tus {quota.limit} imágenes este mes
              </p>
              <Link
                href="/pricing"
                className="inline-block px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[12px]"
              >
                Sube a Pro para ilimitado →
              </Link>
            </div>
          )}

          {/* CÓMO FUNCIONA + TESTIMONIAL (3 columnas, 2+1) */}
          <div className="grid md:grid-cols-3 gap-5 mb-14">
            <div className="md:col-span-2 p-7 rounded-3xl bg-white/[0.025] border border-white/[0.06]">
              <h3 className="text-[14px] font-black mb-6 border-b-2 border-purple-500/40 pb-2 inline-block">
                Cómo funciona
              </h3>
              <div className="grid grid-cols-3 gap-2 items-start relative">
                <Step
                  num={1}
                  iconPath="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  title="Sube tu imagen"
                  desc="Arrastra o elige tu archivo."
                />
                <Step
                  num={2}
                  iconPath="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"
                  title="IA hace su magia"
                  desc="Eliminamos el fondo automáticamente."
                />
                <Step
                  num={3}
                  iconPath="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                  title="Descarga tu PNG"
                  desc="Fondo transparente, listo para usar."
                />
                {/* Flechas decorativas entre pasos (desktop) */}
                <div className="hidden md:flex absolute top-[28px] left-[33%] -translate-x-1/2 text-purple-500/40">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
                <div className="hidden md:flex absolute top-[28px] left-[67%] -translate-x-1/2 text-purple-500/40">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="p-6 rounded-3xl bg-white/[0.025] border border-white/[0.06] flex flex-col">
              <div className="text-purple-400/60 text-[36px] leading-none mb-2 font-serif">"</div>
              <p className="text-[13px] text-gray-200 leading-relaxed mb-4 flex-1">
                "Increíble! En segundos tengo imágenes listas para mis diseños."
              </p>
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-amber-400 text-[14px]">★</span>
                ))}
              </div>
              <div>
                <p className="text-[12px] font-bold">María G.</p>
                <p className="text-[10.5px] text-gray-400">Diseñadora gráfica</p>
              </div>
            </div>
          </div>

          {/* PERFECTO PARA CREAR */}
          <div className="text-center">
            <h3 className="text-[20px] md:text-[24px] font-black mb-7">Perfecto para crear</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <UseCaseChip iconPath="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" text="Flyers de eventos"/>
              <UseCaseChip iconPath="M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" text="Fotos de producto (e-commerce)"/>
              <UseCaseChip iconPath="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" text="Posts y stories de Instagram"/>
              <UseCaseChip iconPath="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" text="Logos y marcas"/>
              <UseCaseChip iconPath="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" text="Catálogos de producto"/>
              <UseCaseChip iconPath="M2 3h20v14H2z M8 21h8 M12 17v4" text="Presentaciones"/>
            </div>
          </div>

          {/* ─── ANTES Y DESPUÉS — 3 ejemplos del nicho real ────────────── */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-[24px] md:text-[30px] font-black mb-2">Antes y después</h3>
              <p className="text-[12.5px] text-gray-400">Resultados reales en segundos.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              <BeforeAfterCard
                category="Pareja de baile"
                desc="Salsa, bachata, tango, kizomba."
                imgUrl="https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png"
                bgGradient="from-rose-500 via-pink-600 to-purple-700"
                accentColor="rose"
                iconPath="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
              />
              <BeforeAfterCard
                category="Artistas / DJ"
                desc="Fotos para flyers de conciertos."
                imgUrl="https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png"
                bgGradient="from-amber-500 via-orange-600 to-red-700"
                accentColor="amber"
                iconPath="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8"
              />
              <BeforeAfterCard
                category="Solistas y artistas"
                desc="Bailarines, cantantes, presentadores."
                imgUrl="https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png"
                bgGradient="from-emerald-500 via-teal-600 to-blue-700"
                accentColor="emerald"
                iconPath="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
              />
            </div>
          </div>

          {/* ─── POR QUÉ ELEGIR ARTEGENIA — 4 features cards ────────────── */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-[24px] md:text-[30px] font-black">Por qué elegir ArteGenIA</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <WhyCard
                iconPath="M13 2L3 14h9l-1 8 10-12h-9z"
                title="Ultrarrápido"
                desc="Resultados en solo 5 segundos gracias a nuestra IA avanzada."
              />
              <WhyCard
                iconPath="M12 2a10 10 0 1 0 10 10 M22 12h-4 M12 8v8 M16 12l-4 4-4-4"
                title="Precisión total"
                desc="Detecta bordes finos como cabello, pelaje y detalles."
              />
              <WhyCard
                iconPath="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M21 5H3 M3 9h18 M3 13h18"
                title="PNG transparente"
                desc="Descarga en alta calidad sin fondo y sin marcas."
              />
              <WhyCard
                iconPath="M9.5 14.5l5-5 M12 2v3 M22 12h-3 M12 22v-3 M2 12h3 M19.07 4.93l-2.12 2.12 M19.07 19.07l-2.12-2.12 M4.93 19.07l2.12-2.12 M4.93 4.93l2.12 2.12"
                title="Listo para tus flyers"
                desc="Integra fácilmente en tus diseños y materiales de marketing."
              />
            </div>
          </div>

          {/* ─── TESTIMONIOS + STATS ────────────────────────────────────── */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <h3 className="text-[20px] md:text-[26px] font-black">Miles de creadores ya confían en ArteGenIA</h3>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* 3 testimonios — placeholders, reemplazar con reales */}
              <Testimonial
                lgCols="lg:col-span-2"
                quote='"Me ahorra horas de edición. La calidad es increíble."'
                name="Javier R."
                role="Dueño de tienda online"
                gradient="from-blue-500 to-purple-600"
              />
              <Testimonial
                lgCols="lg:col-span-2"
                quote='"Perfecto para mis flyers y publicaciones en redes."'
                name="Ana L."
                role="Community Manager"
                gradient="from-rose-500 to-orange-500"
              />
              <Testimonial
                lgCols="lg:col-span-2"
                quote='"Rápido, fácil y con resultados profesionales."'
                name="Carlos M."
                role="Diseñador gráfico"
                gradient="from-emerald-500 to-teal-600"
              />
              {/* 3 stats */}
              <Stat number="50k+" label="Imágenes procesadas"/>
              <Stat number="98%" label="Satisfacción de usuarios"/>
              <Stat number="5s" label="Tiempo promedio"/>
            </div>
            <p className="text-center text-[11px] text-amber-300/80 mt-6">
              ⚠ Testimonios y estadísticas son ilustrativos. Reemplazar con datos reales antes de publicar.
            </p>
          </div>

          {/* ─── CTA FINAL ──────────────────────────────────────────────── */}
          <div className="mt-20 mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-purple-950/30 to-[#0a0a14] border border-purple-500/40 p-8 md:p-10">
            {/* Glow decorativo */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-purple-600/30 blur-[100px] pointer-events-none" />
            <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-pink-500/20 blur-[80px] pointer-events-none" />

            <div className="relative grid md:grid-cols-[200px_1fr_auto] gap-6 items-center">
              {/* Cohete ilustración */}
              <div className="flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 flex items-center justify-center text-[64px]">
                  🚀
                </div>
              </div>

              {/* Copy */}
              <div className="text-center md:text-left">
                <h3 className="text-[22px] md:text-[28px] font-black mb-2">¿Listo para crear sin límites?</h3>
                <p className="text-[13px] text-gray-300 mb-4">
                  Sube tu imagen ahora y obtén tu PNG transparente en 5 segundos.
                </p>
              </div>

              {/* CTA + bullets */}
              <div className="text-center md:text-right">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white font-bold text-[14px] shadow-xl shadow-purple-500/40 hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  Subir mi imagen ahora
                </button>
                <p className="text-[10.5px] text-gray-400 mt-3">
                  Gratis para empezar · Sin tarjeta · Resultados al instante
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ESTADO: PROCESSING (diseño 3-cols, progreso circular, steps) ─ */}
      {state === "processing" && (
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="relative rounded-3xl bg-gradient-to-br from-purple-950/40 via-[#0d0d18] to-[#0a0a14] border border-purple-500/30 p-7 md:p-10 overflow-hidden">
            {/* Glows decorativos */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-pink-500/10 blur-[100px] pointer-events-none" />

            <div className="relative grid md:grid-cols-[280px_1fr_280px] gap-8 items-center">
              {/* LEFT — preview de la imagen subida */}
              <div className="text-center">
                <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl shadow-purple-500/20 bg-[#0a0a14]">
                  {originalUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={originalUrl} alt="Procesando" className="w-full h-auto block aspect-[4/5] object-cover" />
                  ) : (
                    <div className="aspect-[4/5] bg-white/[0.04]" />
                  )}
                </div>
                {fileInfo && (
                  <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-2.5 text-left">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold truncate">{fileInfo.name}</p>
                      <p className="text-[10.5px] text-gray-400">
                        {fileInfo.width > 0 ? `${fileInfo.width} × ${fileInfo.height} px` : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CENTER — título + ring de progreso */}
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 mb-5">
                  <span className="text-purple-300 text-[11px]">✨</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-purple-300">Procesando tu imagen</span>
                </div>
                <h2 className="text-[26px] md:text-[34px] font-black leading-[1.1] mb-3">
                  Estamos quitando<br/>el fondo de{" "}
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">tu imagen</span>
                </h2>
                <p className="text-[12.5px] text-gray-400 leading-relaxed mb-6 max-w-md mx-auto">
                  Nuestro modelo de IA está trabajando para entregarte un resultado perfecto en solo unos segundos.
                </p>

                {/* Ring de progreso SVG (gradient stroke purple→pink→amber) */}
                <div className="inline-flex relative items-center justify-center mb-3">
                  <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7"/>
                        <stop offset="50%" stopColor="#ec4899"/>
                        <stop offset="100%" stopColor="#f59e0b"/>
                      </linearGradient>
                    </defs>
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth="6"/>
                    <circle
                      cx="50" cy="50" r="44" fill="none"
                      stroke="url(#ringGrad)" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={2 * Math.PI * 44 * (1 - progressPct / 100)}
                      style={{ transition: "stroke-dashoffset 0.4s ease" }}
                    />
                  </svg>
                  <span className="absolute text-[28px] font-black">{progressPct}%</span>
                </div>
                <p className="text-[11px] text-gray-500">Esto tarda ~5 segundos</p>
              </div>

              {/* RIGHT — 3 steps verticales */}
              <div className="space-y-1">
                <ProcessingStep
                  num={1} active={currentStep === 1} done={currentStep > 1}
                  iconPath="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                  title="Subiendo"
                  desc="Tu imagen se está cargando de forma segura."
                />
                <div className="ml-7 h-3 border-l border-dashed border-purple-500/30"/>
                <ProcessingStep
                  num={2} active={currentStep === 2} done={currentStep > 2}
                  iconPath="M15 4V2 M15 16v-2 M8 9h2 M20 9h2 M17.8 11.8l1.4 1.4 M17.8 6.2l1.4-1.4 M12 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0z M3 21l9-9"
                  title="Eliminando fondo"
                  desc="La IA está detectando el sujeto y eliminando el fondo."
                />
                <div className="ml-7 h-3 border-l border-dashed border-purple-500/30"/>
                <ProcessingStep
                  num={3} active={currentStep === 3} done={false}
                  iconPath="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"
                  title="Preparando PNG"
                  desc="Generando tu imagen con fondo transparente."
                />
              </div>
            </div>

            {/* BOTTOM — 3 bullet cards */}
            <div className="relative grid md:grid-cols-3 gap-3 mt-8 pt-6 border-t border-white/[0.06]">
              <BulletCard
                iconPath="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4"
                title="100% Seguro y privado"
                desc="Tus imágenes se procesan de forma segura y se eliminan automáticamente."
              />
              <BulletCard
                iconPath="M5 8h14M12 3v18M5 16h14"
                title="Solo toma unos segundos"
                desc="En promedio, el proceso completa en menos de 5 segundos."
              />
              <BulletCard
                iconPath="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"
                title="Calidad profesional"
                desc="Resultados precisos con bordes limpios y fondo 100% transparente."
              />
            </div>
          </div>

          {/* Tip al final */}
          <p className="text-center text-[12px] text-gray-400 mt-6">
            💡 <span className="font-bold">Tip:</span> No cierres esta pestaña mientras procesamos tu imagen.<br/>
            <span className="text-gray-500">Puedes seguir usando ArteGenIA en otras pestañas.</span>
          </p>
        </div>
      )}

      {/* ─── ESTADO: PREVIEW (diseño side-by-side cards + features + buttons) */}
      {state === "preview" && removedUrl && originalUrl && (
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <span className="text-emerald-300 text-[11px]">✓</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-300">Fondo eliminado</span>
            </div>
            <h2 className="text-[28px] md:text-[40px] font-black mb-2 leading-tight">
              ¡Listo! Tu imagen{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">sin fondo</span>
            </h2>
            <p className="text-[13px] text-gray-400">Descarga el PNG o úsala para crear un flyer nuevo.</p>
          </div>

          {/* Side-by-side comparativa con cards bonitos */}
          <div className="grid md:grid-cols-2 gap-5 mb-3">
            {/* ORIGINAL */}
            <div className="rounded-3xl border-2 border-purple-500/30 bg-purple-950/10 p-5">
              <div className="text-center mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-purple-200">Original</span>
              </div>
              <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="Original" className="w-full h-auto block aspect-square object-cover" />
              </div>
            </div>
            {/* SIN FONDO */}
            <div className="rounded-3xl border-2 border-amber-500/30 bg-amber-950/10 p-5">
              <div className="text-center mb-3">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-amber-200">Sin fondo</span>
              </div>
              <div className="rounded-2xl overflow-hidden border border-white/[0.08]" style={checkerboard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={removedUrl}
                  alt="Sin fondo"
                  className="w-full h-auto block aspect-square object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          </div>

          {/* Controles visuales (zoom/split) — placeholder, no funcionales aún */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <ViewerControl iconPath="M11 8a3 3 0 0 1 6 0c0 4-6 4-6 8M11 19h.01" title="Zoom out" disabled/>
            <ViewerControl iconPath="M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h6v6h-6z" title="Comparar split" disabled/>
            <ViewerControl iconPath="M11 8a3 3 0 0 1 6 0c0 4-6 4-6 8M11 19h.01" title="Zoom in" disabled/>
          </div>

          {/* Features cards + info tabla en grid 3+1 */}
          <div className="grid md:grid-cols-[1fr_1fr_1fr_280px] gap-3 mb-8">
            <FeatureCardMini
              iconPath="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4"
              title="Bordes limpios"
              desc="IA avanzada que detecta y conserva cada detalle con precisión."
            />
            <FeatureCardMini
              iconPath="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z"
              title="Fondo transparente"
              desc="PNG con transparencia total, perfecto para cualquier diseño."
            />
            <FeatureCardMini
              iconPath="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"
              title="Listo para editar"
              desc="Úsala en flyers, redes sociales y más sin perder calidad."
            />
            {/* Info table */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-center gap-2">
              <InfoRow label="Formato" value="PNG" iconPath="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"/>
              <InfoRow label="Fondo" value="Transparente" iconPath="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z"/>
              <InfoRow label="Calidad" value="Alta (lista para impresión y web)" iconPath="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
            </div>
          </div>

          {/* 4 botones de acción */}
          <div className="grid md:grid-cols-4 gap-3 max-w-5xl mx-auto">
            <button
              onClick={reset}
              className="px-4 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-bold text-[12.5px] hover:bg-white/[0.10] transition-colors inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              Subir otra
            </button>
            <button
              onClick={handleSaveToGallery}
              className="px-4 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[12.5px] hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/30 inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
              Guardar en galería
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-[12.5px] hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/30 inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Descargar PNG
            </button>
            <button
              onClick={handleEditInEditor}
              disabled={applying}
              className="px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[12.5px] hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/40 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586 M11 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
              </svg>
              {applying ? "Creando flyer…" : "Editar en flyer nuevo →"}
            </button>
          </div>

          <p className="text-center text-[11px] text-gray-500 mt-6">
            💡 Próximamente: guarda tus fotos sin fondo en una galería personal para reusarlas en cualquier flyer
          </p>
        </div>
      )}

      {/* P0.T1 — La descarga del resultado es gratis (el crédito de IA ya
          se cobró al quitar el fondo). Modal de confirmación eliminado. */}
    </main>
  );
}

/** Chip pequeño con icono + texto, usado en el hero left bajo el párrafo. */
function FeatureChip({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]">
      <span className="text-purple-300 text-[13px]">{icon}</span>
      <span className="text-[11.5px] font-semibold text-gray-200">{text}</span>
    </div>
  );
}

/** Thumbnail decorativo (16×16) bajo la dropzone para ilustrar casos de uso. */
function ExampleThumb({ gradient, emoji }: { gradient: string; emoji: string }) {
  return (
    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-[20px] shadow-sm border border-white/10`}>
      <span aria-hidden>{emoji}</span>
    </div>
  );
}

/** Paso numerado del "Cómo funciona" — icono circular gradient + título + desc. */
function Step({ num, iconPath, title, desc }: { num: number; iconPath: string; title: string; desc: string }) {
  return (
    <div className="text-center px-2">
      <div className="inline-flex w-14 h-14 mb-3 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/20 border border-purple-500/30 items-center justify-center text-purple-300">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath}/>
        </svg>
      </div>
      <p className="text-[12.5px] font-bold mb-1">{`${num}. ${title}`}</p>
      <p className="text-[10.5px] text-gray-400 leading-snug">{desc}</p>
    </div>
  );
}

/** Chip con icono SVG + label, usado en "Perfecto para crear". */
function UseCaseChip({ iconPath, text }: { iconPath: string; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors">
      <div className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath}/>
        </svg>
      </div>
      <span className="text-[12px] font-semibold text-gray-200">{text}</span>
    </div>
  );
}

// Checkerboard CSS para mostrar transparencia (típico de editores).
const CHECKERBOARD: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, #2a2a3a 25%, transparent 25%), linear-gradient(-45deg, #2a2a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a3a 75%), linear-gradient(-45deg, transparent 75%, #2a2a3a 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
  backgroundColor: "#1a1a24",
};

/** Card "Antes y después" — foto REAL de nicho recortada (PNG transparente).
 *  La misma foto se muestra sobre un gradiente ("Antes", como si tuviera fondo)
 *  y sobre el checkerboard ("Después", fondo ya quitado). Si no hay imgUrl, cae
 *  a un emoji de placeholder. */
function BeforeAfterCard({
  category, desc, emoji, imgUrl, bgGradient, accentColor, iconPath,
}: {
  category: string; desc: string; emoji?: string; imgUrl?: string;
  bgGradient: string; accentColor: "rose"|"amber"|"emerald";
  iconPath: string;
}) {
  const accent = {
    rose: "from-rose-500 to-pink-500",
    amber: "from-amber-500 to-orange-500",
    emerald: "from-emerald-500 to-teal-500",
  }[accentColor];
  return (
    <div className="rounded-3xl bg-white/[0.025] border border-white/[0.06] overflow-hidden">
      <div className="grid grid-cols-2 gap-0.5 bg-white/[0.04] relative">
        {/* ANTES — foto real sobre el gradiente (simula que tenía fondo) */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} aspect-[4/5] flex items-center justify-center`}>
          <span className="absolute top-3 left-3 z-10 text-[9.5px] uppercase tracking-widest font-black px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white">
            Antes
          </span>
          {imgUrl
            ? <img src={imgUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-contain object-bottom"/>
            : <span className="text-[80px] drop-shadow-2xl">{emoji}</span>}
        </div>
        {/* DESPUÉS — misma foto sobre checkerboard (fondo quitado) */}
        <div className="relative overflow-hidden aspect-[4/5] flex items-center justify-center" style={CHECKERBOARD}>
          <span className="absolute top-3 right-3 z-10 text-[9.5px] uppercase tracking-widest font-black px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white">
            Después
          </span>
          {imgUrl
            ? <img src={imgUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-contain object-bottom"/>
            : <span className="text-[80px]">{emoji}</span>}
        </div>
        {/* Flecha circular en el medio */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg`}>
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
      {/* Footer con icono + título + desc */}
      <div className="p-4 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white shrink-0`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={iconPath}/>
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-bold">{category}</p>
          <p className="text-[11px] text-gray-400">{desc}</p>
        </div>
      </div>
    </div>
  );
}

/** Card de feature en "Por qué elegir ArteGenIA". */
function WhyCard({ iconPath, title, desc }: { iconPath: string; title: string; desc: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
      <div className="w-10 h-10 mb-3 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath}/>
        </svg>
      </div>
      <p className="text-[13px] font-bold mb-1">{title}</p>
      <p className="text-[11px] text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

/** Card de testimonio con avatar SVG (placeholder). */
function Testimonial({
  quote, name, role, gradient, lgCols,
}: {
  quote: string; name: string; role: string; gradient: string; lgCols: string;
}) {
  return (
    <div className={`${lgCols} p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] flex gap-3`}>
      {/* Avatar: círculo con gradiente + icono persona */}
      <div className={`shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white border-2 border-white/10`}>
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-gray-200 leading-snug mb-2 italic">{quote}</p>
        <div className="flex gap-0.5 mb-2">
          {[1,2,3,4,5].map(i => (
            <span key={i} className="text-amber-400 text-[11px]">★</span>
          ))}
        </div>
        <p className="text-[11px] font-bold">{name}</p>
        <p className="text-[10px] text-gray-400">{role}</p>
      </div>
    </div>
  );
}

/** Stat card: número grande gradient + label. */
function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] text-center flex flex-col justify-center">
      <p className="text-[32px] md:text-[36px] font-black bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent leading-none mb-1">
        {number}
      </p>
      <p className="text-[10.5px] text-gray-400 leading-snug">{label}</p>
    </div>
  );
}

/** Paso vertical del estado processing.
 *  active: el paso actual (icono gradient + dots ...).
 *  done: ya completado (checkmark verde a la derecha).
 *  pending (ni active ni done): gris. */
function ProcessingStep({
  num, active, done, iconPath, title, desc,
}: {
  num: number; active: boolean; done: boolean;
  iconPath: string; title: string; desc: string;
}) {
  const visual = done
    ? "from-emerald-500 to-teal-500 shadow-emerald-500/40"
    : active
      ? "from-purple-500 to-pink-500 shadow-purple-500/40"
      : "from-gray-700 to-gray-800 shadow-none";
  const textColor = done || active ? "text-white" : "text-gray-500";
  return (
    <div className="flex items-start gap-3">
      <div className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${visual} flex items-center justify-center text-white shadow-lg`}>
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath}/>
        </svg>
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <p className={`text-[12.5px] font-bold ${textColor}`}>{`${num}. ${title}`}</p>
        <p className="text-[10.5px] text-gray-400 leading-snug mt-0.5">{desc}</p>
      </div>
      {/* Indicador de estado */}
      <div className="shrink-0 pt-3">
        {done ? (
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        ) : active ? (
          <div className="flex gap-1">
            {[0, 0.15, 0.3].map((delay, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Bullet card horizontal (bottom del processing). */
function BulletCard({ iconPath, title, desc }: { iconPath: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath}/>
        </svg>
      </div>
      <div>
        <p className="text-[12.5px] font-bold mb-0.5">{title}</p>
        <p className="text-[10.5px] text-gray-400 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

/** Botón redondo visual (zoom/split) — actualmente disabled (placeholder). */
function ViewerControl({ iconPath, title, disabled }: { iconPath: string; title: string; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      title={title}
      className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] flex items-center justify-center text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={iconPath}/>
      </svg>
    </button>
  );
}

/** Mini feature card del preview (grid 3 cols + info table). */
function FeatureCardMini({ iconPath, title, desc }: { iconPath: string; title: string; desc: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath}/>
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-bold mb-0.5">{title}</p>
        <p className="text-[10.5px] text-gray-400 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

/** Fila de la info-table del preview: icono + label + value (alineado dere). */
function InfoRow({ label, value, iconPath }: { label: string; value: string; iconPath: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-white/[0.04] last:border-b-0">
      <div className="flex items-center gap-2 text-gray-400">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath}/>
        </svg>
        <span className="text-[11px]">{label}</span>
      </div>
      <span className="text-[11px] font-bold text-right truncate">{value}</span>
    </div>
  );
}
