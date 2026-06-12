"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";

/**
 * /pricing — Página de planes con CTA a Stripe Checkout.
 *
 * 2 planes:
 * - FREE: editor completo + 1 IA/día + watermark "Hecho con ArteGenIA"
 * - PRO: editor completo + IA ilimitada + sin watermark + PDF/SVG + priority support
 *
 * Tras pago exitoso, Stripe redirige aquí con ?success=1 y el webhook ya ha
 * actualizado profile.plan. Mostramos confirmación + CTA "Ir al editor".
 */

function PricingContent() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);

  const isPro = profile?.plan === "pro" || profile?.plan === "enterprise";
  const success = sp.get("success") === "1";
  const canceled = sp.get("canceled") === "1";

  useEffect(() => {
    if (success) toast.success("¡Bienvenido a Pro! 🎉");
    if (canceled) toast.info("Pago cancelado — sin cargo.");
  }, [success, canceled, toast]);

  const startCheckout = async () => {
    if (!user) {
      router.push("/?login=1");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503) toast.error("Plan Pro no disponible aún — vuelve pronto.");
        else toast.error(data.error || "No se pudo iniciar el pago");
        return;
      }
      const { url } = await res.json() as { url: string };
      window.location.href = url; // redirect a Stripe Checkout
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">
      {/* Blobs decorativos */}
      <div aria-hidden className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-3xl animate-blob"/>
      <div aria-hidden className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full bg-fuchsia-600/15 blur-3xl animate-blob animate-blob-delay-2"/>

      <section className="relative px-5 py-12 md:py-20 max-w-5xl mx-auto">
        {/* Breadcrumb + intro */}
        <nav aria-label="Breadcrumb" className="text-[11px] text-gray-500 mb-6">
          <Link href="/" className="hover:text-purple-300 transition-colors">Inicio</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-300">Precios</span>
        </nav>

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[11px] uppercase tracking-widest text-purple-300 font-bold">
              Precios simples
            </span>
          </div>
          <h1 className="text-[32px] md:text-[52px] font-black leading-[1.05] mb-3">
            Empieza gratis.<br/>
            <span className="shimmer-text">Sube a Pro cuando vendas más.</span>
          </h1>
          <p className="text-[14px] md:text-[16px] text-gray-300 leading-relaxed max-w-2xl mx-auto">
            Editor completo siempre gratis. Pro elimina el watermark, te da IA ilimitada
            y soporta tu trabajo profesional.
          </p>
        </div>

        {/* Banner success */}
        {success && (
          <div className="mb-8 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <p className="text-[14px] font-bold text-emerald-200">
              🎉 ¡Bienvenido a Pro! Ya puedes descargar sin watermark.
            </p>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 mt-3 px-5 py-2 rounded-xl bg-emerald-500 text-white font-bold text-[13px]"
            >
              Ir al editor →
            </Link>
          </div>
        )}

        {/* Cards de planes */}
        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* FREE */}
          <div className="relative p-6 rounded-3xl bg-[#13131f] border-2 border-white/[0.08] shadow-lg">
            <h2 className="text-[18px] font-black mb-1">Free</h2>
            <p className="text-[12px] text-gray-400 mb-4">Para empezar y probar</p>
            <div className="mb-5">
              <span className="text-[40px] font-black">0€</span>
              <span className="text-[12px] text-gray-400">/siempre</span>
            </div>
            <Feature ok text="Editor completo (texto + imagen + forma)"/>
            <Feature ok text="50+ plantillas profesionales"/>
            <Feature ok text="Exportar PNG y JPG"/>
            <Feature ok text="Multi-formato (Story, Post, Square)"/>
            <Feature ok text="4 idiomas (ES/EN/FR/PT)"/>
            <Feature ok text="Mis flyers (guardar proyectos)"/>
            <Feature limit text="1 generación IA/día"/>
            <Feature limit text='Watermark "Hecho con ArteGenIA"'/>
            <Link
              href="/templates"
              className="block mt-5 text-center py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-bold text-[13px] hover:bg-white/[0.10] transition-colors"
            >
              Empezar gratis
            </Link>
          </div>

          {/* PRO */}
          <div className="relative p-6 rounded-3xl bg-gradient-to-br from-purple-600/20 via-fuchsia-600/15 to-pink-600/10 border-2 border-purple-500/40 shadow-2xl shadow-purple-500/30 overflow-hidden">
            {/* Badge */}
            <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
              ⭐ Recomendado
            </div>
            <h2 className="text-[18px] font-black mb-1">Pro</h2>
            <p className="text-[12px] text-purple-200 mb-4">Para profesionales</p>
            <div className="mb-5">
              <span className="text-[40px] font-black shimmer-text">9,99€</span>
              <span className="text-[12px] text-gray-400">/mes</span>
              <p className="text-[10px] text-gray-500 mt-1">Cancela cuando quieras</p>
            </div>
            <Feature ok strong text="Todo lo de Free"/>
            <Feature ok strong text="SIN watermark"/>
            <Feature ok strong text="IA ilimitada (asistente + remix + quitar fondo)"/>
            <Feature ok strong text="Exportar PDF imprenta + SVG vectorial"/>
            <Feature ok strong text="Subir tus propias fuentes"/>
            <Feature ok strong text="Plantillas Pro exclusivas (próximamente)"/>
            <Feature ok strong text="Soporte prioritario por email"/>
            <Feature ok strong text="Marca registrada (uso comercial)"/>
            <button
              onClick={startCheckout}
              disabled={loading || isPro}
              className="block mt-5 w-full text-center py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-[13px] active:scale-[0.97] transition-transform shadow-lg shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow"
            >
              {isPro ? "Ya eres Pro ✓" : loading ? "Cargando…" : "Subir a Pro →"}
            </button>
            {!user && (
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Necesitas estar logueado para suscribirte
              </p>
            )}
          </div>
        </div>

        {/* FAQ corto */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-[20px] font-black text-center mb-6">Preguntas frecuentes</h2>
          {[
            {
              q: "¿Puedo cancelar cuando quiera?",
              a: "Sí. Sin permanencia, sin penalización. Puedes cancelar desde tu cuenta y dejarás de pagar al final del periodo actual.",
            },
            {
              q: "¿Qué pasa con mis flyers si cancelo?",
              a: "Tus flyers se quedan guardados en tu cuenta. Pero perderás IA ilimitada y volverá el watermark en nuevas descargas.",
            },
            {
              q: "¿Aceptáis empresas / facturas?",
              a: "Sí. Pro genera facturas automáticas con IVA. Para empresas con varios usuarios contacta para plan Enterprise.",
            },
            {
              q: "¿Hay prueba gratis?",
              a: "El plan Free no caduca — pruébalo todo lo que quieras. Pro empieza el cobro al suscribirte.",
            },
          ].map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl bg-[#13131f] border border-white/[0.06] px-5 py-4 mb-3 hover:border-purple-500/30 transition-colors"
            >
              <summary className="text-[13px] font-bold cursor-pointer leading-snug flex items-center justify-between gap-3 list-none">
                <span>{f.q}</span>
                <span className="text-purple-300 group-open:rotate-45 transition-transform duration-300 text-[20px] leading-none shrink-0">
                  +
                </span>
              </summary>
              <p className="text-[12px] text-gray-300 leading-relaxed mt-3">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

function Feature({ ok, limit, strong, text }: { ok?: boolean; limit?: boolean; strong?: boolean; text: string }) {
  return (
    <div className="flex items-start gap-2 text-[12px] mb-2">
      <span className={`shrink-0 mt-0.5 text-[14px] ${ok ? "text-emerald-400" : limit ? "text-amber-400" : "text-gray-500"}`}>
        {ok ? "✓" : limit ? "△" : "·"}
      </span>
      <span className={strong ? "font-bold text-white" : "text-gray-300"}>{text}</span>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a14]"/>}>
      <PricingContent/>
    </Suspense>
  );
}
