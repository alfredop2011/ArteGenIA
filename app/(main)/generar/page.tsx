"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import AuthModal from "@/components/auth/AuthModal";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";
import { ChevronLeft, Sparkles, Wand2, Check } from "lucide-react";
import { FLYER_STYLES } from "@/lib/flyerStyles";
import { FLYER_TEMPLATES, getTemplate } from "@/lib/flyerTemplates";

/**
 * /generar — Generador IA editable.
 *
 * Pitch: "ChatGPT te da imagen plana. ArteGenIA genera tu flyer Y lo
 * deja editable. Cambia fecha, DJ, precio... sin regenerar."
 *
 * Flow: tipo de evento → estilo visual → info → generate → editor.
 */

type Step = "type" | "style" | "info" | "generating";

export default function GenerarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<Step>("type");
  const [eventType, setEventType] = useState<string>("");
  const [styleId, setStyleId] = useState<string>("");
  const [info, setInfo] = useState<Record<string, string>>({});
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [progress, setProgress] = useState("");

  const template = eventType ? getTemplate(eventType) : null;
  const style = styleId ? FLYER_STYLES.find((s) => s.id === styleId) : null;

  const handleGenerate = useCallback(async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    if (!template || !style) return;

    // Validar campos obligatorios
    const missing = template.slots
      .filter((s) => s.required && !(info[s.key] ?? "").trim())
      .map((s) => s.label);
    if (missing.length > 0) {
      toast.error(`Faltan: ${missing.join(", ")}`);
      return;
    }

    setStep("generating");
    setProgress("Generando fondo con IA…");
    try {
      const res = await fetch("/api/generate-flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          styleId,
          templateType: eventType,
          info,
          width: 1080,
          height: 1350,
        }),
      });
      if (res.status === 401) {
        setShowAuth(true);
        setStep("info");
        return;
      }
      if (res.status === 402) {
        setShowUpgrade(true);
        setStep("info");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        toast.error(err.error || "La IA falló — intenta de nuevo");
        setStep("info");
        return;
      }
      setProgress("Aplicando textos editables…");
      const data = await res.json() as { projectId: string };
      toast.success("¡Listo! Abriendo editor…");
      router.push(`/editor/${data.projectId}`);
    } catch (e) {
      console.error("[generate-flyer]", e);
      toast.error("Error de conexión");
      setStep("info");
    }
  }, [user, template, style, info, styleId, eventType, router, toast]);

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white">
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          title="Crea tu cuenta para generar flyers IA"
          subtitle="2 flyers gratis al mes. Pro: 30/mes."
          nextUrl="/generar"
        />
      )}
      {showUpgrade && (
        <UpgradeModal feature="generic" onClose={() => setShowUpgrade(false)} />
      )}

      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0a0a14]/80 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-white">
            <ChevronLeft size={16} strokeWidth={2.5}/>
            Inicio
          </Link>
          {/* Indicador de pasos */}
          <div className="flex items-center gap-2 text-[11px]">
            {(["type", "style", "info"] as const).map((s, i) => {
              const isDone = (
                (s === "type" && (step === "style" || step === "info" || step === "generating")) ||
                (s === "style" && (step === "info" || step === "generating")) ||
                (s === "info" && step === "generating")
              );
              const isCurrent = step === s;
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isDone ? "bg-emerald-500/20 text-emerald-300" :
                    isCurrent ? "bg-purple-500/20 text-purple-300" :
                    "bg-white/[0.06] text-gray-500"
                  }`}>
                    {isDone ? <Check size={12} strokeWidth={3}/> : i + 1}
                  </span>
                  {i < 2 && <span className="text-gray-700">·</span>}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* ═══ STEP 1: tipo de evento ═════════════════════════════════ */}
      {step === "type" && (
        <section className="max-w-4xl mx-auto px-5 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 mb-4">
              <Wand2 size={14} className="text-purple-300"/>
              <span className="text-[11px] uppercase tracking-widest text-purple-300 font-bold">Nuevo · Generador IA editable</span>
            </div>
            <h1 className="text-[32px] md:text-[44px] font-black leading-tight mb-3">
              Genera tu flyer con IA
              <br/>
              <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">y edítalo todo</span>
            </h1>
            <p className="text-[15px] text-gray-400 max-w-xl mx-auto">
              ChatGPT te da imagen plana. ArteGenIA genera el fondo, pone los textos
              y te lo deja editable. Cambia lo que quieras sin regenerar.
            </p>
          </div>

          <h2 className="text-[13px] uppercase tracking-widest text-gray-500 font-bold mb-4 text-center">¿Qué tipo de flyer?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FLYER_TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => { setEventType(t.type); setStep("style"); }}
                className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-purple-500/[0.08] hover:border-purple-500/40 active:scale-[0.98] transition-all text-left"
              >
                <div className="text-3xl mb-3">{t.icon}</div>
                <p className="text-[14px] font-black">{t.name}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-snug">{t.description}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ STEP 2: estilo visual ═════════════════════════════════ */}
      {step === "style" && (
        <section className="max-w-4xl mx-auto px-5 py-12">
          <div className="text-center mb-8">
            <button onClick={() => setStep("type")} className="text-[12px] text-gray-500 hover:text-gray-300 mb-3">
              ← Cambiar tipo
            </button>
            <h2 className="text-[26px] md:text-[32px] font-black mb-2">Elige el estilo visual</h2>
            <p className="text-[13px] text-gray-400">La IA generará un fondo único basado en este estilo</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FLYER_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => { setStyleId(s.id); setStep("info"); }}
                className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-purple-500/[0.08] hover:border-purple-500/40 active:scale-[0.98] transition-all text-left"
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <p className="text-[14px] font-black">{s.name}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-snug">{s.tagline}</p>
                <div className="flex gap-1 mt-3">
                  <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: s.titleColor }} title="Título"/>
                  <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: s.subtitleColor }} title="Subtítulo"/>
                  <span className="w-4 h-4 rounded-full border border-white/10" style={{ background: s.infoColor }} title="Info"/>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ STEP 3: form de info ═══════════════════════════════════ */}
      {step === "info" && template && style && (
        <section className="max-w-2xl mx-auto px-5 py-12">
          <div className="text-center mb-8">
            <button onClick={() => setStep("style")} className="text-[12px] text-gray-500 hover:text-gray-300 mb-3">
              ← Cambiar estilo
            </button>
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] mb-4">
              <span className="text-lg">{template.icon}</span>
              <span className="text-[12px] font-bold">{template.name}</span>
              <span className="text-gray-600">·</span>
              <span className="text-lg">{style.icon}</span>
              <span className="text-[12px] font-bold">{style.name}</span>
            </div>
            <h2 className="text-[26px] md:text-[32px] font-black mb-2">Rellena los datos</h2>
            <p className="text-[13px] text-gray-400">Solo los obligatorios son necesarios. Lo demás opcional.</p>
          </div>

          <div className="space-y-3">
            {template.slots.map((slot) => (
              <div key={slot.key}>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">
                  {slot.label}
                  {slot.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={info[slot.key] ?? ""}
                  onChange={(e) => setInfo((prev) => ({ ...prev, [slot.key]: e.target.value }))}
                  placeholder={slot.placeholder}
                  maxLength={slot.maxLength}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-[14px] text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06]"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            className="w-full mt-8 py-4 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-[14px] active:scale-[0.98] transition-transform shadow-lg shadow-purple-500/40 flex items-center justify-center gap-2"
          >
            <Sparkles size={16}/>
            Generar mi flyer
          </button>
          <p className="text-[10px] text-gray-600 text-center mt-3">
            ~15 segundos · IA generará el fondo + textos editables
          </p>
        </section>
      )}

      {/* ═══ STEP 4: generando (loading) ═══════════════════════════ */}
      {step === "generating" && (
        <section className="max-w-2xl mx-auto px-5 py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-purple-300 border-t-transparent rounded-full animate-spin"/>
          </div>
          <h2 className="text-[26px] md:text-[32px] font-black mb-3">Generando tu flyer…</h2>
          <p className="text-[14px] text-gray-400 mb-2">{progress || "Procesando…"}</p>
          <p className="text-[12px] text-gray-600">~15 segundos. No cierres esta pestaña.</p>
        </section>
      )}
    </main>
  );
}
