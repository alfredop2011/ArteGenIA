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
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import AuthModal from "@/components/auth/AuthModal";

type FlowState = "upload" | "processing" | "preview";

export default function QuitarFondoPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [state, setState] = useState<FlowState>("upload");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [removedUrl, setRemovedUrl] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [applying, setApplying] = useState(false);
  const [quota, setQuota] = useState<{ used: number; limit: number; unlimited: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setProgress("Subiendo y procesando…");

    try {
      // Generar preview local de la imagen original (dataURL) para mostrar mientras
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
        reader.readAsDataURL(file);
      });
      setOriginalUrl(dataUrl);

      // Enviar a BiRefNet
      const form = new FormData();
      form.append("image_file", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: form });

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
      setState("preview");
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

  const handleDownload = useCallback(async () => {
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
            <h1 className="text-[15px] font-black">Quitar fondo IA</h1>
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
              <h2 className="text-[40px] md:text-[56px] font-black leading-[1.02] mb-5 tracking-tight">
                Quita el fondo<br/>de cualquier foto<br/>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                  en 5 segundos
                </span>
              </h2>
              <p className="text-[14px] md:text-[16px] text-gray-400 leading-relaxed mb-7 max-w-md">
                Nuestra IA elimina el fondo dejando solo la persona o el objeto. Listo para usar en tus flyers o descargar como PNG transparente.
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
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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
              <UseCaseChip iconPath="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" text="Flyers"/>
              <UseCaseChip iconPath="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" text="Catálogos"/>
              <UseCaseChip iconPath="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" text="Redes sociales"/>
              <UseCaseChip iconPath="M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" text="E-commerce"/>
              <UseCaseChip iconPath="M2 3h20v14H2z M8 21h8 M12 17v4" text="Presentaciones"/>
              <UseCaseChip iconPath="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" text="Y mucho más"/>
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
                emoji="💃"
                bgGradient="from-rose-500 via-pink-600 to-purple-700"
                accentColor="rose"
                iconPath="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
              />
              <BeforeAfterCard
                category="Artistas / DJ"
                desc="Fotos para flyers de conciertos."
                emoji="🎤"
                bgGradient="from-amber-500 via-orange-600 to-red-700"
                accentColor="amber"
                iconPath="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8"
              />
              <BeforeAfterCard
                category="Logos / Escuelas"
                desc="Marcas, promotoras, academias."
                emoji="🎓"
                bgGradient="from-emerald-500 via-teal-600 to-blue-700"
                accentColor="emerald"
                iconPath="M22 10v6 M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5"
              />
            </div>
            <p className="text-center text-[11px] text-gray-500 mt-6">
              💡 Ilustraciones genéricas — cuando subas fotos reales del nicho, reemplaza estas tarjetas.
            </p>
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

      {/* ─── ESTADO: PROCESSING ──────────────────────────────────────────── */}
      {state === "processing" && (
        <div className="max-w-3xl mx-auto px-5 py-20 text-center">
          <div className="inline-block w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin mb-6" />
          <p className="text-[18px] font-bold mb-1">{progress}</p>
          <p className="text-[12px] text-gray-400">Esto tarda ~5 segundos</p>
        </div>
      )}

      {/* ─── ESTADO: PREVIEW ─────────────────────────────────────────────── */}
      {state === "preview" && removedUrl && originalUrl && (
        <div className="max-w-5xl mx-auto px-5 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-300">✓ Fondo eliminado</span>
            </div>
            <h2 className="text-[24px] md:text-[32px] font-black mb-2">
              ¡Listo! Tu imagen sin fondo
            </h2>
            <p className="text-[13px] text-gray-400">Descarga el PNG o úsala para crear un flyer nuevo</p>
          </div>

          {/* Side-by-side: original vs sin fondo */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 text-center">
                Original
              </p>
              <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={originalUrl} alt="Original" className="w-full h-auto block" />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-purple-300 font-bold mb-2 text-center">
                Sin fondo
              </p>
              <div className="rounded-2xl overflow-hidden border border-purple-500/30" style={checkerboard}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={removedUrl}
                  alt="Sin fondo"
                  className="w-full h-auto block"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col md:flex-row gap-3 max-w-3xl mx-auto">
            <button
              onClick={reset}
              className="md:flex-1 px-5 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-bold text-[13px] hover:bg-white/[0.10] transition-colors"
            >
              ← Subir otra
            </button>
            <button
              onClick={handleDownload}
              className="md:flex-1 px-5 py-3.5 rounded-xl bg-emerald-500 text-white font-bold text-[13px] hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
            >
              ⬇ Descargar PNG
            </button>
            <button
              onClick={handleEditInEditor}
              disabled={applying}
              className="md:flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[13px] hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/40 disabled:opacity-50"
            >
              {applying ? "Creando flyer…" : "✏️ Editar en flyer nuevo →"}
            </button>
          </div>

          <p className="text-center text-[11px] text-gray-500 mt-6">
            💡 Próximamente: guarda tus fotos sin fondo en una galería personal para reusarlas en cualquier flyer
          </p>
        </div>
      )}
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

/** Card "Antes y después" — ilustración SVG estilizada del nicho.
 *  TODO cuando tengamos fotos reales: reemplazar SVG con <Image src=fotoReal/>.
 *  Mantener las cajas "Antes" (con bgGradient) y "Después" (checkerboard) idénticas. */
function BeforeAfterCard({
  category, desc, emoji, bgGradient, accentColor, iconPath,
}: {
  category: string; desc: string; emoji: string;
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
        {/* ANTES — gradiente como fondo + silueta SVG blanca */}
        <div className={`relative bg-gradient-to-br ${bgGradient} aspect-[4/5] flex items-center justify-center`}>
          <span className="absolute top-3 left-3 text-[9.5px] uppercase tracking-widest font-black px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white">
            Antes
          </span>
          <span className="text-[80px] drop-shadow-2xl">{emoji}</span>
        </div>
        {/* DESPUÉS — checkerboard + misma silueta */}
        <div className="relative aspect-[4/5] flex items-center justify-center" style={CHECKERBOARD}>
          <span className="absolute top-3 right-3 text-[9.5px] uppercase tracking-widest font-black px-2 py-1 rounded bg-black/40 backdrop-blur-sm text-white">
            Después
          </span>
          <span className="text-[80px]">{emoji}</span>
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
