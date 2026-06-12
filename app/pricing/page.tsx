"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";

/**
 * /pricing — 3 planes (Free, Pro, Enterprise) estilo shadcn limpio.
 *
 * Inspirado en https://21st.dev/r/Codehagen/pricing — cards minimal con
 * bordes sutiles, jerarquía clara, tipografía consistente. Adaptado a la
 * paleta morado/fucsia de ArteGenIA.
 *
 * Plans:
 * - FREE 0€: editor + watermark + 1 IA/día
 * - PRO 9,99€/mes: editor + sin watermark + IA ilimitada + PDF/SVG
 * - ENTERPRISE 34,99€/mes: Pro + acceso para equipos (early access)
 */

function PricingContent() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);

  const isPro = profile?.plan === "pro";
  const isEnterprise = profile?.plan === "enterprise";
  const isPaid = isPro || isEnterprise;
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
      window.location.href = url;
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
      <div aria-hidden className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-3xl animate-blob pointer-events-none"/>
      <div aria-hidden className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full bg-fuchsia-600/15 blur-3xl animate-blob animate-blob-delay-2 pointer-events-none"/>

      <section className="relative px-5 py-12 md:py-20 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-[11px] text-gray-500 mb-6">
          <Link href="/" className="hover:text-purple-300 transition-colors">Inicio</Link>
          <span className="mx-1.5">›</span>
          <span className="text-gray-300">Precios</span>
        </nav>

        {/* HERO */}
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-[11px] uppercase tracking-widest text-purple-300 font-bold">
              Precios simples · Sin permanencia
            </span>
          </div>
          <h1 className="text-[36px] md:text-[56px] font-black leading-[1.05] mb-4 tracking-tight">
            Empieza gratis.<br/>
            <span className="shimmer-text">Escala cuando crezcas.</span>
          </h1>
          <p className="text-[15px] md:text-[17px] text-gray-400 leading-relaxed">
            Editor completo siempre gratis. Cuando vendas más, sube a Pro o Enterprise.
            Sin permanencia, sin trucos.
          </p>
        </div>

        {/* Banner success */}
        {success && (
          <div className="mb-8 max-w-md mx-auto p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <p className="text-[14px] font-bold text-emerald-200 mb-3">
              🎉 ¡Bienvenido! Ya puedes descargar sin watermark.
            </p>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 text-white font-bold text-[13px]"
            >
              Ir al editor →
            </Link>
          </div>
        )}

        {/* Cards de planes — estilo shadcn limpio */}
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">

          {/* FREE */}
          <div className="relative flex flex-col p-7 rounded-2xl bg-[#13131f] border border-white/[0.08]">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-[20px] font-black">Free</h2>
            </div>
            <p className="text-[13px] text-gray-400 mb-6">Para empezar y probar</p>

            <div className="mb-6 pb-6 border-b border-white/[0.06]">
              <div className="flex items-baseline gap-1">
                <span className="text-[42px] font-black tracking-tight">0€</span>
                <span className="text-[13px] text-gray-500">/siempre</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Empieza sin tarjeta
              </p>
            </div>

            <ul className="space-y-3 flex-1 mb-7">
              <Check text="Editor completo (texto + imagen + forma)"/>
              <Check text="50+ plantillas profesionales"/>
              <Check text="Exportar PNG y JPG"/>
              <Check text="Multi-formato (Story, Post, Square)"/>
              <Check text="4 idiomas (ES/EN/FR/PT)"/>
              <Check text="Mis flyers (guardar proyectos)"/>
              <Cross text="1 generación IA/día"/>
              <Cross text='Watermark "Hecho con ArteGenIA"'/>
            </ul>

            <Link
              href="/templates"
              className="w-full text-center py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-bold text-[13px] hover:bg-white/[0.10] transition-colors"
            >
              Empezar gratis
            </Link>
          </div>

          {/* PRO — destacado */}
          <div className="relative flex flex-col p-7 rounded-2xl bg-gradient-to-br from-purple-500/[0.08] via-fuchsia-500/[0.05] to-transparent border border-purple-500/40 shadow-[0_0_60px_-15px_rgba(168,85,247,0.4)] md:scale-[1.03] md:z-10">
            {/* Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/40">
              ⭐ Más popular
            </div>

            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-[20px] font-black">Pro</h2>
            </div>
            <p className="text-[13px] text-purple-200 mb-6">Para profesionales</p>

            <div className="mb-6 pb-6 border-b border-white/[0.06]">
              <div className="flex items-baseline gap-1">
                <span className="text-[42px] font-black tracking-tight shimmer-text">9,99€</span>
                <span className="text-[13px] text-gray-400">/mes</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Cancela cuando quieras
              </p>
            </div>

            <ul className="space-y-3 flex-1 mb-7">
              <Check strong text="Todo lo de Free"/>
              <Check strong text="Sin watermark"/>
              <Check strong text="IA ilimitada (asistente + remix + quitar fondo)"/>
              <Check strong text="Exportar PDF imprenta + SVG vectorial"/>
              <Check strong text="Subir tus propias fuentes"/>
              <Check strong text="Soporte prioritario por email"/>
              <Check strong text="Uso comercial sin restricciones"/>
            </ul>

            <button
              onClick={startCheckout}
              disabled={loading || isPaid}
              className="w-full text-center py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-[13px] active:scale-[0.97] transition-transform shadow-lg shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow"
            >
              {isPro ? "Ya eres Pro ✓" : isEnterprise ? "Ya tienes Enterprise" : loading ? "Cargando…" : "Subir a Pro →"}
            </button>
            {!user && (
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Necesitas iniciar sesión
              </p>
            )}
          </div>

          {/* ENTERPRISE */}
          <div className="relative flex flex-col p-7 rounded-2xl bg-[#13131f] border border-amber-500/40">
            {/* Badge early access */}
            <div className="absolute -top-3 right-5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/30">
              🚀 Early access
            </div>

            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-[20px] font-black">Enterprise</h2>
            </div>
            <p className="text-[13px] text-amber-200 mb-6">Para equipos y agencias</p>

            <div className="mb-6 pb-6 border-b border-white/[0.06]">
              <div className="flex items-baseline gap-1">
                <span className="text-[42px] font-black tracking-tight bg-gradient-to-br from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  34,99€
                </span>
                <span className="text-[13px] text-gray-400">/mes</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Acceso anticipado limitado
              </p>
            </div>

            <ul className="space-y-3 flex-1 mb-7">
              <Check strong text="Todo lo de Pro"/>
              <Check strong text="Múltiples usuarios en un equipo"/>
              <Check strong text="Brand Kit (logo + paleta de marca)"/>
              <Check strong text="Plantillas exclusivas por industria"/>
              <Check strong text="Account manager dedicado"/>
              <Check strong text="Soporte prioritario por WhatsApp"/>
              <Check strong text="Facturación a empresa con IVA"/>
              <Check strong text="Más herramientas próximamente"/>
            </ul>

            <a
              href={`mailto:alfredop2011@gmail.com?subject=${encodeURIComponent("Early access Enterprise — ArteGenIA")}&body=${encodeURIComponent(
                "Hola,\n\nQuiero reservar mi plaza en el early access del plan Enterprise (34,99€/mes).\n\n" +
                "Mis datos:\n" +
                "- Nombre / Empresa: \n" +
                "- Número estimado de usuarios: \n" +
                "- Para qué tipo de eventos / proyectos: \n\n" +
                "Gracias."
              )}`}
              className="w-full text-center py-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-[13px] active:scale-[0.97] transition-transform shadow-lg shadow-amber-500/30"
            >
              {isEnterprise ? "Ya tienes Enterprise ✓" : "Reservar early access →"}
            </a>
            <p className="text-[10px] text-gray-500 text-center mt-2">
              Plazas limitadas · Respuesta en 24h
            </p>
          </div>
        </div>

        {/* Sub-texto debajo */}
        <p className="text-center text-[12px] text-gray-500 mt-8 max-w-xl mx-auto leading-relaxed">
          Todos los planes incluyen el editor completo. La diferencia está en límites de IA, watermark, exportación profesional y soporte. ¿Dudas? <a href="mailto:alfredop2011@gmail.com" className="text-purple-300 hover:text-purple-200 underline">Escríbenos</a>.
        </p>

        {/* Comparativa rápida — opcional, estilo shadcn */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-2">
              Comparativa rápida
            </p>
            <h2 className="text-[22px] md:text-[28px] font-black">
              Todo lo que necesitas en cada plan
            </h2>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#13131f] overflow-hidden">
            <div className="grid grid-cols-4 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Feature</div>
              <div className="text-[11px] text-gray-300 font-bold text-center">Free</div>
              <div className="text-[11px] text-purple-300 font-bold text-center">Pro</div>
              <div className="text-[11px] text-amber-300 font-bold text-center">Enterprise</div>
            </div>
            {[
              { f: "Editor completo", free: "✓", pro: "✓", ent: "✓" },
              { f: "Plantillas", free: "50+", pro: "50+", ent: "50+ exclusivas" },
              { f: "Generaciones IA", free: "1/día", pro: "Ilimitadas", ent: "Ilimitadas" },
              { f: "Watermark", free: "Sí", pro: "No", ent: "No" },
              { f: "Exportar PNG/JPG", free: "✓", pro: "✓", ent: "✓" },
              { f: "Exportar PDF / SVG", free: "—", pro: "✓", ent: "✓" },
              { f: "Equipo multi-usuario", free: "—", pro: "—", ent: "✓" },
              { f: "Brand Kit", free: "—", pro: "—", ent: "✓" },
              { f: "Soporte", free: "Comunidad", pro: "Email prioritario", ent: "WhatsApp dedicado" },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-4 px-4 py-3 border-b border-white/[0.04] last:border-b-0">
                <div className="text-[12px] text-gray-300 font-semibold">{row.f}</div>
                <div className="text-[12px] text-gray-400 text-center">{row.free}</div>
                <div className="text-[12px] text-purple-200 text-center font-bold">{row.pro}</div>
                <div className="text-[12px] text-amber-200 text-center font-bold">{row.ent}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-2">
              FAQ
            </p>
            <h2 className="text-[22px] md:text-[28px] font-black">
              Preguntas frecuentes
            </h2>
          </div>
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
              q: "¿Cuándo me conviene Enterprise vs Pro?",
              a: "Pro es para 1 profesional autónomo. Enterprise es para equipos (2+ personas), agencias o empresas que necesitan varios usuarios bajo una misma cuenta, brand kit personalizado y soporte por WhatsApp.",
            },
            {
              q: "¿Aceptáis facturas con IVA?",
              a: "Sí. Pro genera facturas automáticas con IVA al pagar. Enterprise se factura mensualmente con datos completos de tu empresa.",
            },
            {
              q: "¿Hay prueba gratis?",
              a: "El plan Free no caduca — pruébalo todo lo que quieras. Pro empieza el cobro al suscribirte.",
            },
            {
              q: "¿Qué incluye el Early access de Enterprise?",
              a: "Plazas limitadas durante esta fase. Pagas el precio reducido fijo (34,99€/mes) que mantenemos garantizado durante todo tu primer año. Si suben los precios, tú no pagas más.",
            },
          ].map((f, i) => (
            <details
              key={i}
              className="group rounded-xl bg-[#13131f] border border-white/[0.06] px-5 py-4 mb-3 hover:border-purple-500/30 transition-colors"
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

function Check({ text, strong }: { text: string; strong?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px]">
      <svg
        className="shrink-0 mt-0.5 text-emerald-400"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <span className={strong ? "text-white font-semibold" : "text-gray-300"}>{text}</span>
    </li>
  );
}

function Cross({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px]">
      <svg
        className="shrink-0 mt-0.5 text-gray-600"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      <span className="text-gray-500">{text}</span>
    </li>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a14]"/>}>
      <PricingContent/>
    </Suspense>
  );
}
