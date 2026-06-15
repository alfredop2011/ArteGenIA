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

      {/* ─── ESTADO: UPLOAD ──────────────────────────────────────────────── */}
      {state === "upload" && (
        <div className="max-w-3xl mx-auto px-5 py-12 md:py-20">
          <div className="text-center mb-10">
            <h2 className="text-[32px] md:text-[44px] font-black leading-[1.05] mb-4">
              Quita el fondo de cualquier foto
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                en 5 segundos
              </span>
            </h2>
            <p className="text-[14px] md:text-[16px] text-gray-400 leading-relaxed max-w-xl mx-auto">
              Sube una foto y nuestra IA elimina el fondo dejando solo la persona o el objeto. Listo para usar en tus flyers o descargar como PNG transparente.
            </p>
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
            className="relative cursor-pointer rounded-3xl border-2 border-dashed border-purple-500/40 bg-purple-500/[0.04] hover:bg-purple-500/[0.08] hover:border-purple-500/60 transition-all p-10 md:p-16 text-center"
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
            <div className="inline-flex w-16 h-16 mx-auto mb-5 rounded-2xl bg-purple-500/15 border border-purple-500/30 items-center justify-center text-purple-300">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <p className="text-[16px] font-bold mb-1">Arrastra tu foto aquí</p>
            <p className="text-[12px] text-gray-400 mb-5">o pulsa para elegir un archivo</p>
            <span className="inline-block px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-[13px]">
              ✨ Elegir imagen
            </span>
            <p className="text-[10px] text-gray-500 mt-4">JPG o PNG · máx 10 MB</p>
          </div>

          {/* Aviso cuota agotada */}
          {user && quota && !quota.unlimited && remaining === 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-[13px] font-bold text-amber-200 mb-2">
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

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-3 mt-10">
            <Feature icon="⚡" title="Resultados en 5s" desc="BiRefNet IA, calidad pro" />
            <Feature icon="🎨" title="PNG transparente" desc="Listo para cualquier diseño" />
            <Feature icon="✏️" title="O editas un flyer" desc="Crea desde tu imagen al instante" />
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

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
      <div className="text-[20px] mb-1">{icon}</div>
      <p className="text-[12px] font-bold mb-0.5">{title}</p>
      <p className="text-[10.5px] text-gray-400">{desc}</p>
    </div>
  );
}
