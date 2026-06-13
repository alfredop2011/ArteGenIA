"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import AuthModal from "@/components/auth/AuthModal";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";
import { Upload, Wand2, Sparkles, Check, ChevronLeft, Edit3, X as XIcon } from "lucide-react";
import type { TemplateLayer } from "@/data/templates";

/**
 * /capas-magicas — Página dedicada con el pitch comercial:
 *
 *   "¿Hiciste tu flyer con ChatGPT? Es solo imagen plana.
 *    Súbelo aquí y lo convertimos en plantilla editable
 *    sin perder el diseño."
 *
 * Flujo de 3 estados:
 *   1. upload      — drag/drop + pitch + cuota visible
 *   2. processing  — spinner + pasos animados (~30s)
 *   3. preview     — comparación antes/después + edición de textos
 *
 * Al confirmar, POST a /api/projects/from-magic-layers crea el proyecto
 * con fabric_json válido y redirige a /editor/[projectId].
 */

type FlowState = "upload" | "processing" | "preview";

type PhotoToTemplateResponse = {
  layers: TemplateLayer[];
  meta: {
    width: number;
    height: number;
    textsDetected: number;
    objectsDetected: number;
    originalUrl: string;
    quota: { used: number; limit: number; unlimited: boolean };
  };
};

export default function CapasMagicasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [state, setState] = useState<FlowState>("upload");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PhotoToTemplateResponse | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [applying, setApplying] = useState(false);

  const [quota, setQuota] = useState<{ used: number; limit: number; unlimited: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar cuota al montar
  useEffect(() => {
    if (!user) return;
    void fetch("/api/photo-to-template")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.used === "number") {
          setQuota({ used: d.used, limit: d.limit, unlimited: d.unlimited });
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
      setShowUpgrade(true);
      return;
    }
    // Validaciones básicas
    if (!file.type.startsWith("image/")) {
      toast.error("Sube una imagen (JPG o PNG)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no puede pesar más de 10 MB");
      return;
    }

    setState("processing");
    setProgress("Subiendo imagen…");

    try {
      // 1. Convertir File a dataURL — /api/share-upload espera JSON
      // { imageDataUrl: "data:image/...;base64,..." }, no FormData.
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
        reader.readAsDataURL(file);
      });

      // 2. Subir a R2 vía /api/share-upload (devuelve URL pública)
      const upRes = await fetch("/api/share-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, title: "Capas Mágicas" }),
      });
      if (!upRes.ok) {
        const err = await upRes.json().catch(() => ({})) as { error?: string };
        toast.error(err.error || "No se pudo subir la imagen");
        setState("upload");
        return;
      }
      const { url } = (await upRes.json()) as { url: string };
      setImageUrl(url);
      setProgress("Detectando textos y colores…");

      // 2. Llamar al endpoint de IA
      const aiRes = await fetch("/api/photo-to-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (aiRes.status === 402) {
        setShowUpgrade(true);
        setState("upload");
        return;
      }
      if (aiRes.status === 401) {
        setShowAuth(true);
        setState("upload");
        return;
      }
      if (!aiRes.ok) {
        const err = await aiRes.json().catch(() => ({})) as { error?: string };
        toast.error(err.error || "La IA falló — intenta de nuevo");
        setState("upload");
        return;
      }

      setProgress("Aplicando mejoras de color…");
      const data = (await aiRes.json()) as PhotoToTemplateResponse;
      setResult(data);
      setQuota({
        used: data.meta.quota.used,
        limit: data.meta.quota.limit,
        unlimited: data.meta.quota.unlimited,
      });
      setState("preview");
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión");
      setState("upload");
    }
  }, [user, quota, toast]);

  const handleApply = useCallback(async () => {
    if (!result) return;
    setApplying(true);
    try {
      // Aplicar ediciones inline del usuario a los textos detectados.
      // El resto de layers (background image, image-regions, shapes) van tal cual.
      const finalLayers: TemplateLayer[] = result.layers.map((l) => {
        if (l.type === "text" && editedTexts[l.id] !== undefined) {
          return { ...l, text: editedTexts[l.id] };
        }
        return l;
      });

      // Persistir los TemplateLayer[] crudos. El editor los aplicará con
      // applyTemplateLayers (que maneja correctamente la carga async de
      // imágenes). Mucho más fiable que serializar fabric_json en cliente.
      const res = await fetch("/api/projects/from-magic-layers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Mi flyer mágico",
          width: result.meta.width,
          height: result.meta.height,
          layers: finalLayers,
          originalImageUrl: imageUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error || "No se pudo guardar el proyecto");
        return;
      }
      const { projectId } = (await res.json()) as { projectId: string };
      toast.success("¡Listo! Abriendo editor…");
      router.push(`/editor/${projectId}`);
    } catch (e) {
      console.error("[magic-layers apply]", e);
      toast.error(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setApplying(false);
    }
  }, [result, editedTexts, router, toast]);

  const remaining = quota && !quota.unlimited
    ? Math.max(0, quota.limit - quota.used)
    : null;

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white">
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          title="Crea tu cuenta para usar Capas Mágicas"
          subtitle="Es gratis. 2 conversiones IA al mes para empezar."
          nextUrl="/capas-magicas"
        />
      )}
      {showUpgrade && (
        <UpgradeModal feature="magic-layers" onClose={() => setShowUpgrade(false)} />
      )}

      {/* Header con back */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0a0a14]/80 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={16} strokeWidth={2.5} />
            Inicio
          </Link>
          {quota && (
            <div className={`text-[11px] font-bold px-3 py-1 rounded-full ${
              quota.unlimited
                ? "bg-purple-500/15 text-purple-300"
                : remaining === 0
                  ? "bg-red-500/15 text-red-300"
                  : "bg-emerald-500/15 text-emerald-300"
            }`}>
              {quota.unlimited
                ? "✨ Ilimitado"
                : `${remaining}/${quota.limit} este mes`}
            </div>
          )}
        </div>
      </header>

      {/* ─── ESTADO 1: UPLOAD ───────────────────────────────────────────── */}
      {state === "upload" && (
        <section className="max-w-3xl mx-auto px-5 py-12 md:py-20">
          {/* Pitch comercial */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/15 to-fuchsia-500/15 border border-purple-500/30 mb-5">
              <Wand2 size={14} className="text-purple-300" />
              <span className="text-[11px] uppercase tracking-widest text-purple-300 font-bold">
                Nuevo · Capas Mágicas IA
              </span>
            </div>
            <h1 className="text-[32px] md:text-[52px] font-black leading-[1.05] mb-5 tracking-tight">
              ¿Hiciste tu flyer con <span className="text-gray-500">ChatGPT</span>?
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Hazlo editable.
              </span>
            </h1>
            <p className="text-[15px] md:text-[18px] text-gray-400 leading-relaxed max-w-2xl mx-auto">
              ChatGPT, Midjourney y demás te dan <strong className="text-white">imagen plana</strong>.
              Súbela aquí y la convertimos en <strong className="text-white">plantilla editable</strong> sin perder el diseño.
              Cambia textos, fechas, artistas… mantén lo que ya te gusta.
            </p>
          </div>

          {/* Upload zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 rounded-3xl p-12 md:p-16 text-center cursor-pointer transition-colors bg-purple-500/[0.03] hover:bg-purple-500/[0.06]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto mb-5">
              <Upload size={28} className="text-purple-300" />
            </div>
            <p className="text-[16px] font-bold mb-2">Arrastra tu flyer aquí</p>
            <p className="text-[13px] text-gray-500 mb-5">o pulsa para elegir un archivo</p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white text-[13px] font-black">
              <Wand2 size={14} />
              Elegir imagen
            </div>
            <p className="text-[10px] text-gray-600 mt-5">JPG o PNG · máx 10 MB</p>
          </div>

          {/* Cómo funciona */}
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {[
              { icon: "🪄", title: "1. Subes tu imagen", desc: "Ese flyer que generaste con IA o diseñaste fuera de ArteGenIA" },
              { icon: "✨", title: "2. La IA la analiza", desc: "Detectamos textos, colores y elementos en ~30 segundos" },
              { icon: "📝", title: "3. Editas lo que quieras", desc: "Cambia fechas, nombres, artistas… mantén el diseño que te gusta" },
            ].map((s, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-[13px] font-bold mb-1">{s.title}</p>
                <p className="text-[12px] text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── ESTADO 2: PROCESSING ───────────────────────────────────────── */}
      {state === "processing" && (
        <section className="max-w-2xl mx-auto px-5 py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-purple-300 border-t-transparent rounded-full animate-spin"/>
          </div>
          <h2 className="text-[26px] md:text-[32px] font-black mb-3">
            Analizando tu flyer…
          </h2>
          <p className="text-[14px] text-gray-400 mb-2">
            {progress}
          </p>
          <p className="text-[12px] text-gray-600">
            Esto tarda ~30 segundos. No cierres esta pestaña.
          </p>
        </section>
      )}

      {/* ─── ESTADO 3: PREVIEW ──────────────────────────────────────────── */}
      {state === "preview" && result && imageUrl && (
        <section className="max-w-6xl mx-auto px-5 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 mb-4">
              <Check size={14} className="text-emerald-300" />
              <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold">
                ¡Listo!
              </span>
            </div>
            <h2 className="text-[24px] md:text-[32px] font-black mb-2">
              Detectamos {result.meta.textsDetected} textos
            </h2>
            <p className="text-[13px] text-gray-400">
              Revisa y edita los que quieras cambiar. Lo demás del diseño se mantiene.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Imagen original */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 text-center">
                Original
              </p>
              <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Original" className="w-full h-auto"/>
              </div>
            </div>

            {/* Lista de textos editables */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-purple-300 font-bold mb-2 text-center">
                Textos detectados (edita los que quieras)
              </p>
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 max-h-[600px] overflow-y-auto space-y-2">
                {result.layers
                  .filter((l): l is Extract<TemplateLayer, { type: "text" }> => l.type === "text")
                  .map((l) => {
                    const currentValue = editedTexts[l.id] !== undefined ? editedTexts[l.id] : l.text;
                    const isEdited = editedTexts[l.id] !== undefined && editedTexts[l.id] !== l.text;
                    return (
                      <div
                        key={l.id}
                        className={`p-3 rounded-xl border transition-colors ${
                          isEdited
                            ? "bg-emerald-500/[0.06] border-emerald-500/40"
                            : "bg-white/[0.02] border-white/[0.06]"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Edit3 size={11} className="text-gray-500"/>
                          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">
                            {l.fontSize >= 60 ? "Título" : l.fontSize >= 30 ? "Subtítulo" : "Texto"}
                          </span>
                          <span
                            className="ml-auto w-4 h-4 rounded border border-white/10"
                            style={{ background: l.color }}
                            title={l.color}
                          />
                          {isEdited && (
                            <button
                              onClick={() => {
                                setEditedTexts((prev) => {
                                  const next = { ...prev };
                                  delete next[l.id];
                                  return next;
                                });
                              }}
                              className="text-[10px] text-gray-500 hover:text-gray-300 flex items-center gap-1"
                              title="Restaurar original"
                            >
                              <XIcon size={10}/>
                              Restaurar
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) => setEditedTexts((prev) => ({ ...prev, [l.id]: e.target.value }))}
                          className="w-full bg-transparent border-0 outline-none text-[14px] text-white placeholder:text-gray-600 focus:bg-white/[0.05] rounded-md px-2 py-1.5 -mx-2 transition-colors"
                          placeholder={l.text}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
            <button
              onClick={() => {
                setState("upload");
                setImageUrl(null);
                setResult(null);
                setEditedTexts({});
              }}
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-bold text-[13px] hover:bg-white/[0.10] transition-colors"
            >
              ← Subir otra imagen
            </button>
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-[13px] active:scale-[0.97] transition-transform shadow-lg shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {applying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  Abriendo editor…
                </>
              ) : (
                <>
                  <Sparkles size={14}/>
                  Abrir en el editor →
                </>
              )}
            </button>
          </div>

          {/* Meta info */}
          <p className="text-center text-[11px] text-gray-600 mt-6">
            {result.meta.textsDetected} textos detectados · {result.meta.objectsDetected} elementos · IA reconstruyó tu flyer en {Math.round((result.meta as { elapsedMs?: number }).elapsedMs ?? 30000) / 1000}s
          </p>
        </section>
      )}
    </main>
  );
}
