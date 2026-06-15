"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/lib/toast";
import AuthModal from "@/components/auth/AuthModal";

/**
 * /pricing — 3 planes (Free, Pro, Enterprise) estilo shadcn limpio.
 *
 * Inspirado en https://21st.dev/r/Codehagen/pricing — cards minimal con
 * bordes sutiles, jerarquía clara, tipografía consistente. Adaptado a la
 * paleta morado/fucsia de ArteGenIA.
 *
 * Plans:
 * - FREE 0€: editor sin watermark + 10 quitar-fondo IA/mes
 * - PRO 9,99€/mes: editor + Quitar fondo IA ilimitado + PDF imprenta
 * - ENTERPRISE 34,99€/mes: Pro + acceso para equipos (early access)
 */

function PricingContent() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);

  const isPro = profile?.plan === "pro";
  const isEnterprise = profile?.plan === "enterprise";
  const isPaid = isPro || isEnterprise;
  const success = sp.get("success") === "1";
  const canceled = sp.get("canceled") === "1";
  const successPlan = sp.get("plan"); // "pro" | "enterprise" | null
  // Distinguimos qué botón está cargando para mostrar spinner solo en el suyo.
  const [loadingPlan, setLoadingPlan] = useState<"pro" | "enterprise" | null>(null);
  // Fase T.9 — toggle facturación. Anual = 20% off → 2 meses gratis al año.
  // Persistimos en URL para que el toggle no se pierda en navegación interna.
  const intervalParam = sp.get("interval");
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    intervalParam === "year" ? "year" : "month"
  );
  // Calculadora: cuántos flyers/mes — decide la recomendación Pro vs Enterprise.
  // 1 flyer hecho con freelance ~= 30€; con ArteGenIA ~= coste plan / N.
  const [flyersPerMonth, setFlyersPerMonth] = useState(20);
  const [teamSize, setTeamSize] = useState(1);
  // Recomendación simple: 2+ personas o 80+ flyers/mes → Enterprise.
  const recommended: "pro" | "enterprise" =
    teamSize >= 2 || flyersPerMonth >= 80 ? "enterprise" : "pro";
  // ROI vs contratar diseñador (estimación conservadora: 30€/flyer freelance).
  const freelanceCost = flyersPerMonth * 30;
  const planCost = recommended === "enterprise" ? 34.99 : 9.99;
  const savings = Math.max(0, freelanceCost - planCost);

  useEffect(() => {
    if (success) {
      if (successPlan === "enterprise") toast.success("🚀 ¡Bienvenido a Enterprise!");
      else toast.success("¡Bienvenido a Pro! 🎉");
      // Tras volver de Stripe Checkout, el webhook tarda 1-3s en propagar
      // el plan a nuestra BD. Refrescamos el profile con reintentos cortos
      // hasta detectar el cambio o tras 5 intentos (~10s) — así el badge
      // del header y el banner "Gestionar suscripción" se actualizan solos
      // sin que el user tenga que cerrar sesión y volver a entrar.
      let attempts = 0;
      const pollId = setInterval(async () => {
        attempts += 1;
        await refreshProfile();
        if (attempts >= 5) clearInterval(pollId);
      }, 2000);
      // Primer refresh inmediato (por si el webhook ya completó)
      void refreshProfile();
      return () => clearInterval(pollId);
    }
    if (canceled) toast.info("Pago cancelado — sin cargo.");
  }, [success, canceled, successPlan, toast, refreshProfile]);

  const [portalLoading, setPortalLoading] = useState(false);

  const openCustomerPortal = async () => {
    if (!user) {
      router.push("/?login=1");
      return;
    }
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "No se pudo abrir el portal");
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión");
    } finally {
      setPortalLoading(false);
    }
  };

  // Auth modal local — se abre cuando un guest user clica "Subir a Pro/Enterprise"
  // sin estar logueado. Recordamos qué plan quería para disparar el checkout
  // automático tras el login (en cualquiera de los 2 flows).
  const [showAuth, setShowAuth] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<"pro" | "enterprise" | null>(null);

  // Plan que viene en la URL después del callback OAuth (?autostart=pro).
  // Lo metimos en `nextUrl` cuando se inició el OAuth, y al volver lanzamos
  // el checkout automáticamente — pero solo una vez (limpiamos la query).
  const autostart = sp.get("autostart"); // "pro" | "enterprise" | null
  useEffect(() => {
    if (!autostart) return;
    if (!user) return; // todavía no se hidrató la sesión
    if (isPaid) return; // por si ya estaba pago — no relanzamos
    if (autostart !== "pro" && autostart !== "enterprise") return;
    // Lanzar checkout + limpiar query para no relanzar en refresh.
    const plan = autostart as "pro" | "enterprise";
    router.replace("/pricing");
    void startCheckoutInternal(plan);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autostart, user, isPaid]);

  /** Internal: ejecuta el POST a /api/stripe/checkout asumiendo que ya hay
   *  user logueado. NO se ocupa de auth. */
  const startCheckoutInternal = async (plan: "pro" | "enterprise") => {
    setLoading(true);
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: billingInterval }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503) {
          toast.error(
            plan === "enterprise"
              ? "Plan Enterprise no disponible aún — vuelve pronto."
              : "Plan Pro no disponible aún — vuelve pronto.",
          );
        } else toast.error(data.error || "No se pudo iniciar el pago");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (e) {
      console.error(e);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
      setLoadingPlan(null);
    }
  };

  const startCheckout = async (plan: "pro" | "enterprise" = "pro") => {
    if (!user) {
      // Guest user: abrir AuthModal aquí mismo. Tras el login disparamos
      // checkout sin perder qué plan querían comprar.
      setPendingPlan(plan);
      setShowAuth(true);
      return;
    }
    return startCheckoutInternal(plan);
  };

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white overflow-x-hidden">
      {/* AuthModal: aparece cuando guest user clica "Subir a Pro/Enterprise".
          - email/password: onAuthSuccess dispara checkout antes de cerrar.
          - Google OAuth: pasa nextUrl con ?autostart=<plan> para que tras el
            callback vuelva aquí y el useEffect arranque el checkout. */}
      {showAuth && (
        <AuthModal
          onClose={() => {
            setShowAuth(false);
            setPendingPlan(null);
          }}
          title={
            pendingPlan === "enterprise"
              ? "Crea tu cuenta para Enterprise"
              : "Crea tu cuenta para Pro"
          }
          subtitle="Solo necesitas un email. Después seguimos con el pago."
          nextUrl={pendingPlan ? `/pricing?autostart=${pendingPlan}` : "/pricing"}
          onAuthSuccess={() => {
            // Login email/password OK → disparamos checkout enseguida.
            // OAuth Google no llega aquí (la modal se desmonta con el redirect).
            if (pendingPlan) {
              const plan = pendingPlan;
              setPendingPlan(null);
              // Pequeño delay para que el modal cierre primero (mejor feedback).
              setTimeout(() => void startCheckoutInternal(plan), 100);
            }
          }}
        />
      )}

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
            Editor completo siempre gratis. <span className="text-emerald-300 font-bold">Sin watermark</span>, incluso en el plan Free.
            Cuando vendas más, sube a Pro. Sin permanencia, sin trucos.
          </p>
        </div>

        {/* Toggle Mensual / Anual — Fase T.9. Pasa el billingInterval al checkout
            y cambia visualmente el precio mostrado. Anual = 20% off
            (equivale a 2 meses gratis al año). */}
        {!isPaid && (
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
              <button
                onClick={() => setBillingInterval("month")}
                className={`px-5 py-2 rounded-full text-[12px] font-bold transition-all ${
                  billingInterval === "month"
                    ? "bg-white text-[#0a0a14] shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
                aria-pressed={billingInterval === "month"}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingInterval("year")}
                className={`px-5 py-2 rounded-full text-[12px] font-bold transition-all flex items-center gap-2 ${
                  billingInterval === "year"
                    ? "bg-white text-[#0a0a14] shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
                aria-pressed={billingInterval === "year"}
              >
                Anual
                <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  -20%
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Banner usuario paid — botón gestionar suscripción */}
        {isPaid && !success && (
          <div className="mb-8 max-w-2xl mx-auto p-5 rounded-2xl bg-gradient-to-br from-purple-500/[0.08] via-fuchsia-500/[0.05] to-transparent border border-purple-500/30 flex items-center gap-4 flex-wrap justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[18px]">
                {isEnterprise ? "🏢" : "⭐"}
              </div>
              <div>
                <div className="text-[13px] font-black">
                  {isEnterprise ? "Eres Enterprise" : "Eres Pro"}
                </div>
                <div className="text-[11px] text-gray-400">
                  Cancela, cambia de plan o actualiza tu tarjeta cuando quieras
                </div>
              </div>
            </div>
            <button
              onClick={openCustomerPortal}
              disabled={portalLoading}
              className="px-5 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white font-bold text-[12.5px] hover:bg-white/[0.12] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {portalLoading ? "Abriendo…" : "Gestionar suscripción →"}
            </button>
          </div>
        )}

        {/* Banner success */}
        {success && (
          <div className="mb-8 max-w-md mx-auto p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
            <p className="text-[14px] font-bold text-emerald-200 mb-3">
              🎉 ¡Bienvenido! Ya tienes IA ilimitada y PDF imprenta.
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
              <Check text="48+ plantillas profesionales"/>
              <Check text="Sin watermark · descarga limpia"/>
              <Check text="10 créditos IA al mes (= 5 fotos sin fondo)"/>
              <Check text="Exportar PNG y JPG"/>
              <Check text="Multi-formato (Story, Post, Square)"/>
              <Check text="4 idiomas (ES/EN/FR/PT)"/>
              <Check text="Mis flyers (guardar proyectos)"/>
              <Cross text="Exportar PDF imprenta"/>
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
              {billingInterval === "year" ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[42px] font-black tracking-tight shimmer-text">7,99€</span>
                    <span className="text-[13px] text-gray-400">/mes</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Facturado 95,90€/año · <span className="line-through">119,88€</span>{" "}
                    <span className="text-emerald-300 font-bold">Ahorras 23,98€</span>
                  </p>
                  <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                    🎁 30 días gratis · 2 meses gratis al año
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[42px] font-black tracking-tight shimmer-text">9,99€</span>
                    <span className="text-[13px] text-gray-400">/mes</span>
                  </div>
                  <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                    🎁 30 días gratis · Cancela cuando quieras
                  </p>
                </>
              )}
            </div>

            <ul className="space-y-3 flex-1 mb-7">
              <Check strong text="Todo lo de Free"/>
              <Check strong text="100 créditos IA al mes (= 50 fotos sin fondo)"/>
              <Check strong text="Exportar PDF imprenta de alta calidad"/>
              <Check strong text="Asistente IA · Capas Mágicas · Generador IA"/>
              <Check strong text="Soporte prioritario por email"/>
              <Check strong text="Uso comercial sin restricciones"/>
              <Check strong text="Más herramientas IA próximamente"/>
            </ul>

            <button
              onClick={() => startCheckout("pro")}
              disabled={loading || isPaid}
              className="w-full text-center py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-[13px] active:scale-[0.97] transition-transform shadow-lg shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow"
            >
              {isPro
                ? "Ya eres Pro ✓"
                : isEnterprise
                  ? "Ya tienes Enterprise"
                  : loadingPlan === "pro"
                    ? "Cargando…"
                    : "Probar 30 días gratis →"}
            </button>
            {!isPaid && (
              <p className="text-[10px] text-gray-400 text-center mt-2">
                Sin cargo hoy · Te avisamos antes del primer cobro
              </p>
            )}
          </div>

          {/* ENTERPRISE — Próximamente (Fase V.9 honesto). Features Brand Kit,
              multi-user, IVA aún no implementadas. Para evitar fraude legal,
              quitamos checkout y exponemos como teaser con mailto para lista
              de espera. Activar el checkout cuando esté implementado todo. */}
          <div className="relative flex flex-col p-7 rounded-2xl bg-[#13131f] border border-amber-500/40">
            {/* Badge próximamente */}
            <div className="absolute -top-3 right-5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/30">
              ✨ Próximamente
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
              <p className="text-[11px] text-amber-300 font-semibold mt-1">
                🔔 Reserva tu plaza · Acceso anticipado limitado
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

            {/* Botón principal DESACTIVADO — visible para mantener layout
                consistente con Pro pero sin permitir compra. Al activar
                Enterprise: quitar disabled + cambiar onClick a startCheckout("enterprise"). */}
            <button
              disabled
              aria-disabled="true"
              className="w-full text-center py-3 rounded-xl bg-gradient-to-br from-amber-500/40 to-orange-600/40 text-white/70 font-black text-[13px] cursor-not-allowed border border-amber-500/20"
              title="Próximamente disponible"
            >
              Próximamente
            </button>
            <p className="text-[10px] text-gray-500 text-center mt-2">
              ¿Necesitas Enterprise ya?{" "}
              <a
                href="mailto:alfredop2011@gmail.com?subject=Reserva%20Enterprise%20ArteGenIA&body=Hola%2C%20me%20interesa%20reservar%20una%20plaza%20para%20Enterprise%20cuando%20est%C3%A9%20disponible.%20Mi%20equipo%20es%20de%20___%20personas%20y%20hacemos%20___%20flyers%2Fmes."
                className="text-amber-300 hover:text-amber-200 underline"
              >
                Escríbenos
              </a>
            </p>
          </div>
        </div>

        {/* Sub-texto debajo */}
        <p className="text-center text-[12px] text-gray-500 mt-8 max-w-xl mx-auto leading-relaxed">
          Todos los planes incluyen el editor completo SIN watermark. La diferencia está en límites de IA, exportación profesional y soporte. ¿Dudas? <a href="mailto:alfredop2011@gmail.com" className="text-purple-300 hover:text-purple-200 underline">Escríbenos</a>.
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
              { f: "Editor completo", free: "✓", pro: "✓", ent: "Próximamente" },
              { f: "Sin watermark", free: "✓", pro: "✓", ent: "Próximamente" },
              { f: "Plantillas profesionales", free: "48+", pro: "48+", ent: "Próximamente" },
              { f: "Créditos IA al mes", free: "10", pro: "100", ent: "Próximamente" },
              { f: "Fotos sin fondo equivalentes", free: "5/mes", pro: "50/mes", ent: "Próximamente" },
              { f: "Exportar PNG / JPG", free: "✓", pro: "✓", ent: "Próximamente" },
              { f: "Exportar PDF imprenta", free: "—", pro: "✓", ent: "Próximamente" },
              { f: "Equipo multi-usuario", free: "—", pro: "—", ent: "Próximamente" },
              { f: "Brand Kit", free: "—", pro: "—", ent: "Próximamente" },
              { f: "Soporte", free: "Comunidad", pro: "Email prioritario", ent: "Próximamente" },
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

        {/* ¿Pro o Enterprise? — Bloque de decisión con perfiles + calculadora ROI */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-2">
              ¿Cuál elijo?
            </p>
            <h2 className="text-[22px] md:text-[28px] font-black mb-2">
              Pro o Enterprise — depende de cómo trabajas
            </h2>
            <p className="text-[13px] text-gray-400 max-w-xl mx-auto">
              No hay plan malo. Solo el que encaja contigo.
            </p>
          </div>

          {/* Perfiles lado a lado */}
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {/* Perfil Pro */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/[0.08] via-fuchsia-500/[0.04] to-transparent border border-purple-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[24px]">
                  👤
                </div>
                <div>
                  <div className="text-[11px] text-purple-300 font-bold uppercase tracking-wider">
                    Para ti
                  </div>
                  <div className="text-[16px] font-black">Autónomo / Creator</div>
                </div>
              </div>
              <p className="text-[13px] text-gray-300 leading-relaxed mb-4">
                Trabajas <strong className="text-white">solo</strong>. Haces flyers para tus eventos, tu marca personal, tus redes. Necesitas IA ilimitada y export profesional, pero no manejas equipo.
              </p>
              <div className="space-y-2 mb-5">
                <ProfileReason text="Eres el único que diseña" />
                <ProfileReason text="Hasta ~80 flyers/mes" />
                <ProfileReason text="No necesitas brand kit corporativo" />
              </div>
              <div className="pt-5 border-t border-white/[0.06] flex items-baseline justify-between">
                <span className="text-[12px] text-gray-400">Recomendado:</span>
                <span className="text-[18px] font-black shimmer-text">Pro · 9,99€/mes</span>
              </div>
            </div>

            {/* Perfil Enterprise */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/[0.08] via-orange-500/[0.04] to-transparent border border-amber-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[24px]">
                  🏢
                </div>
                <div>
                  <div className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                    Para tu equipo
                  </div>
                  <div className="text-[16px] font-black">Agencia / Empresa</div>
                </div>
              </div>
              <p className="text-[13px] text-gray-300 leading-relaxed mb-4">
                Trabajáis <strong className="text-white">varios</strong>. Diseñas para tus clientes, organizas eventos a escala, o tu empresa necesita coherencia de marca. Cada uno con su cuenta, mismo brand kit.
              </p>
              <div className="space-y-2 mb-5">
                <ProfileReason text="2+ personas diseñando" />
                <ProfileReason text="Plantillas con tu logo + paleta fija" />
                <ProfileReason text="Factura con IVA + WhatsApp directo" />
              </div>
              <div className="pt-5 border-t border-white/[0.06] flex items-baseline justify-between">
                <span className="text-[12px] text-gray-400">Recomendado:</span>
                <span className="text-[18px] font-black bg-gradient-to-br from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Enterprise · 34,99€/mes
                </span>
              </div>
            </div>
          </div>

          {/* Calculadora ROI */}
          <div className="rounded-2xl bg-[#13131f] border border-white/[0.06] p-6 md:p-8">
            <div className="text-center mb-6">
              <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-2">
                Calculadora rápida
              </p>
              <h3 className="text-[18px] md:text-[22px] font-black">
                ¿Cuánto ahorras vs contratar diseñador?
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-7">
              {/* Slider flyers */}
              <div>
                <label className="flex items-baseline justify-between mb-3">
                  <span className="text-[12px] text-gray-300 font-semibold">Flyers al mes</span>
                  <span className="text-[18px] font-black text-purple-300">{flyersPerMonth}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="200"
                  step="1"
                  value={flyersPerMonth}
                  onChange={(e) => setFlyersPerMonth(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>1</span>
                  <span>50</span>
                  <span>100</span>
                  <span>200+</span>
                </div>
              </div>

              {/* Slider equipo */}
              <div>
                <label className="flex items-baseline justify-between mb-3">
                  <span className="text-[12px] text-gray-300 font-semibold">Personas en tu equipo</span>
                  <span className="text-[18px] font-black text-amber-300">{teamSize}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>1</span>
                  <span>3</span>
                  <span>5</span>
                  <span>10+</span>
                </div>
              </div>
            </div>

            {/* Resultado */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Coste freelance</div>
                <div className="text-[20px] md:text-[24px] font-black text-gray-400 line-through">
                  {freelanceCost.toFixed(0)}€
                </div>
                <div className="text-[10px] text-gray-500 mt-1">/mes</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-500/[0.08] border border-purple-500/30">
                <div className="text-[10px] text-purple-300 uppercase tracking-wider mb-1">Con ArteGenIA</div>
                <div className="text-[20px] md:text-[24px] font-black shimmer-text">
                  {planCost.toFixed(2)}€
                </div>
                <div className="text-[10px] text-gray-500 mt-1">/mes</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/30">
                <div className="text-[10px] text-emerald-300 uppercase tracking-wider mb-1">Ahorras</div>
                <div className="text-[20px] md:text-[24px] font-black text-emerald-400">
                  {savings.toFixed(0)}€
                </div>
                <div className="text-[10px] text-emerald-300/70 mt-1">/mes</div>
              </div>
            </div>

            {/* CTA recomendado */}
            <div className={`p-4 rounded-xl border ${
              recommended === "enterprise"
                ? "bg-amber-500/[0.05] border-amber-500/30"
                : "bg-purple-500/[0.05] border-purple-500/30"
            }`}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[11px] uppercase tracking-wider font-bold mb-1 text-gray-400">
                    Te recomendamos
                  </div>
                  <div className="text-[16px] font-black">
                    {recommended === "enterprise" ? (
                      <>Plan <span className="text-amber-300">Enterprise</span> — equipo + volumen alto</>
                    ) : (
                      <>Plan <span className="text-purple-300">Pro</span> — perfecto para ti</>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => startCheckout(recommended)}
                  disabled={loading || (recommended === "pro" ? isPaid : isEnterprise)}
                  className={`px-5 py-2.5 rounded-xl text-white font-black text-[13px] active:scale-[0.97] transition-transform disabled:opacity-50 disabled:cursor-not-allowed ${
                    recommended === "enterprise"
                      ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30"
                      : "bg-gradient-to-br from-purple-600 to-fuchsia-600 shadow-lg shadow-purple-500/40"
                  }`}
                >
                  {loadingPlan === recommended ? "Cargando…" : `Empezar con ${recommended === "enterprise" ? "Enterprise" : "Pro"} →`}
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 text-center mt-4 leading-relaxed">
              * Estimación basada en ~30€/flyer freelance. Cálculo orientativo —
              tu coste real depende de la complejidad y del diseñador.
            </p>
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
              a: "Tus flyers se quedan guardados en tu cuenta. Solo perderás las funciones premium (IA ilimitada, PDF imprenta) — sigues sin watermark.",
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

function ProfileReason({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 text-[12.5px] text-gray-200">
      <svg
        className="shrink-0 mt-0.5 text-purple-300"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <span>{text}</span>
    </div>
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
