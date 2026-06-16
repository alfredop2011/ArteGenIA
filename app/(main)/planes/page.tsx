"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Check, Crown, Sparkles, Zap, Star, Users,
  ArrowRight, X, Loader2, Mail,
} from "lucide-react";

/**
 * /planes — Pricing publica con waitlist (modo validacion MVP).
 *
 * Los CTAs no llevan a checkout real todavia (LemonSqueezy/Stripe pendiente).
 * En su lugar, capturan emails en la tabla `waitlist` de Supabase. Sirve
 * para validar si hay interes real ANTES de implementar pagos.
 *
 * Despues de validar (~50 emails de waitlist):
 *  1. Implementar checkout real (LemonSqueezy)
 *  2. Reemplazar handleWaitlist por handleCheckout
 *  3. Email broadcast a los waitlist diciendo "ya esta disponible"
 *
 * Los precios y beneficios son editables aqui en PLANS array.
 */

type PlanFeature = { text: string; included: boolean; highlight?: boolean };

type Plan = {
  id: "free" | "pro" | "business";
  name: string;
  tagline: string;
  // Tres precios: el mensual normal, el mensual-efectivo cuando se factura
  // anualmente (con descuento), y el total anual. El display es responsabilidad
  // del componente segun billingCycle.
  price: {
    monthly: string;           // "9,99€"
    monthlyAnnual: string;     // "8,25€" (precio efectivo /mes en plan anual)
    yearly: string;            // "99€" (total facturado al año)
  };
  cta: string;
  featured?: boolean;
  features: PlanFeature[];
  // Colores accent del plan
  accent: { bg: string; border: string; text: string };
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratis",
    tagline: "Para empezar a crear flyers",
    price: { monthly: "0€", monthlyAnnual: "0€", yearly: "0€" },
    cta: "Plan actual",
    // accent.text usa CSS var para que en light sea oscuro y en dark sea claro.
    // El bg/border gris ya tiene buen contraste en ambos temas.
    accent: {
      bg: "linear-gradient(135deg, rgba(156,163,175,0.10), rgba(107,114,128,0.05))",
      border: "rgba(156,163,175,0.30)",
      text: "var(--home-text-muted)",
    },
    features: [
      { text: "Plantillas básicas",                       included: true },
      { text: "10 descargas al mes",                      included: true },
      { text: "Marca de agua en descargas",               included: true },
      { text: "Editor completo",                          included: true },
      { text: "Plantillas PRO (Conciertos, Festivales…)", included: false },
      { text: "Descargas ilimitadas sin marca",           included: false },
      { text: "Recortar persona con IA",                  included: false },
      { text: "Eliminar fondo de imágenes",               included: false },
      { text: "Soporte prioritario",                      included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Para creadores y profesionales",
    // 99€/año = 8,25€/mes efectivo. Ahorro mensual: 1,74€.
    price: { monthly: "9,99€", monthlyAnnual: "8,25€", yearly: "99€" },
    cta: "Empezar Pro",
    featured: true,
    accent: {
      bg: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(124,58,237,0.08))",
      border: "rgba(168,85,247,0.45)",
      text: "var(--ag-brand)",
    },
    features: [
      { text: "Todo lo de Gratis, y además:",             included: true, highlight: true },
      { text: "Todas las plantillas PRO",                 included: true },
      { text: "Descargas ilimitadas sin marca",           included: true },
      { text: "Recortar persona con IA (10/mes)",         included: true },
      { text: "Eliminar fondo de imágenes (30/mes)",      included: true },
      { text: "Generar fondos con IA",                    included: true },
      { text: "Acceso a nuevas plantillas antes",         included: true },
      { text: "Soporte por email",                        included: true },
      { text: "Marca personalizada (Brand Kit)",          included: false },
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "Para academias, productoras y agencias",
    // 249€/año = 20,75€/mes efectivo. Ahorro mensual: 4,24€.
    price: { monthly: "24,99€", monthlyAnnual: "20,75€", yearly: "249€" },
    cta: "Hablar con ventas",
    accent: {
      bg: "linear-gradient(135deg, rgba(250,204,21,0.12), rgba(245,158,11,0.06))",
      border: "rgba(250,204,21,0.40)",
      text: "var(--ag-warning)",
    },
    features: [
      { text: "Todo lo de Pro, y además:",                included: true, highlight: true },
      { text: "Descargas y recortes ilimitados",          included: true },
      { text: "Brand Kit personalizado (logos, colores)", included: true },
      { text: "Hasta 5 colaboradores",                    included: true },
      { text: "Plantillas exclusivas Business",           included: true },
      { text: "Soporte prioritario (chat + email)",       included: true },
      { text: "Reportes de uso y analytics",              included: true },
      { text: "Onboarding personalizado",                 included: true },
      { text: "API para integraciones (próximamente)",    included: true },
    ],
  },
];

// Ciclo de facturacion. "annual" se renderiza como precio efectivo mensual
// con el descuento (price.yearly / 12), y muestra debajo el total anual.
type BillingCycle = "monthly" | "annual";

export default function PlanesPage() {
  const { user } = useAuth();
  // Default annual: el ahorro es el incentivo, casi todas las webs lo
  // pre-seleccionan asi por mejor conversion.
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");
  // Modal waitlist: cuando user pulsa CTA de plan pago abre modal con
  // input de email y se inserta en tabla waitlist via /api/waitlist
  const [waitlistFor, setWaitlistFor] = useState<Plan | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">

        {/* HEADER */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
               style={{ background: "var(--ag-brand-bg)", border: "1px solid var(--ag-brand-border)" }}>
            <Sparkles size={11} strokeWidth={2.2} style={{ color: "var(--ag-brand)" }} />
            <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: "var(--ag-brand)" }}>
              Planes y precios
            </span>
          </div>
          <h1 className="font-black tracking-tight mb-3" style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}>
            Elige el plan{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              perfecto para ti
            </span>
          </h1>
          <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: "var(--home-text-muted)" }}>
            Empieza gratis, crece con Pro o despliega con Business. Cancela cuando quieras.
          </p>

          {/* Badge waitlist (transparencia: aun no pueden pagar, sino apuntarse) */}
          <div className="mt-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider"
               style={{ background: "var(--ag-warning-bg)", border: "1px solid var(--ag-warning-border)", color: "var(--ag-warning)" }}>
            <Mail size={10} strokeWidth={2.5} />
            APÚNTATE EN LA LISTA · LANZAMIENTO PRÓXIMO
          </div>
        </div>

        {/* TOGGLE MENSUAL / ANUAL — segmented control */}
        {/* En mobile es full-width (ancho 100% del contenedor), en desktop
            queda centrado con max-width fijo. */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="inline-flex p-1 rounded-full"
               style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>
            <button
              onClick={() => setBillingCycle("monthly")}
              className="px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all"
              style={billingCycle === "monthly"
                ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }
                : { color: "var(--home-text-muted)" }
              }>
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className="px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all inline-flex items-center gap-1.5"
              style={billingCycle === "annual"
                ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }
                : { color: "var(--home-text-muted)" }
              }>
              Anual
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={billingCycle === "annual"
                      ? { background: "rgba(255,255,255,0.25)", color: "#fff" }
                      : { background: "var(--ag-success-bg)", color: "var(--ag-success)" }
                    }>
                −17%
              </span>
            </button>
          </div>
        </div>

        {/* GRID DE 3 PLANES.
            En mobile: 1 columna apilada con el card "pro" featured (con escala)
            DEPRECADO el scale en mobile para que no se salga del viewport.
            Espacio extra mt-4 antes del primer card para acomodar el badge
            "Más popular" que sobresale. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-5 mb-12 pt-4">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              onWaitlist={() => setWaitlistFor(plan)}
            />
          ))}
        </div>

        {/* Modal waitlist */}
        {waitlistFor && (
          <WaitlistModal
            plan={waitlistFor}
            cycle={billingCycle}
            defaultEmail={user?.email ?? ""}
            onClose={() => setWaitlistFor(null)}
          />
        )}

        {/* FAQ corto */}
        <section className="rounded-2xl p-6 sm:p-8 mb-10"
                 style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
          <h2 className="text-lg sm:text-xl font-black mb-5 text-center">Preguntas frecuentes</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <Faq
              q="¿Puedo cancelar cuando quiera?"
              a="Sí. Cancelas desde tu cuenta y mantienes acceso hasta el final del periodo facturado."
            />
            <Faq
              q="¿Hay descuento anual?"
              a="Sí. Pagando 12 meses obtienes ~17% de descuento (paga 10, llévate 12)."
            />
            <Faq
              q="¿Qué métodos de pago aceptáis?"
              a="Tarjeta de crédito/débito y Apple/Google Pay. Próximamente PayPal."
            />
            <Faq
              q="¿Hay devolución?"
              a="Reembolso 100% en los primeros 14 días sin preguntas."
            />
            <Faq
              q="¿Puedo cambiar de plan?"
              a="Sí, subes o bajas cuando quieras. El cambio es prorrateado."
            />
            <Faq
              q="¿Las plantillas son mías?"
              a="Los flyers que creas son tuyos. Las plantillas base son propiedad de ArteGenIA."
            />
          </div>
        </section>

        {/* TRUST BAND */}
        <div className="text-center" style={{ color: "var(--home-text-soft)" }}>
          <p className="text-xs sm:text-sm">
            ¿Dudas sobre qué plan elegir? Escríbenos a{" "}
            <a href="mailto:hola@artegenia.com" className="font-bold text-purple-400 hover:text-purple-300">
              hola@artegenia.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}

// ─── SUB-COMPONENTES ─────────────────────────────────────────────────────

function PlanCard({ plan, billingCycle, onWaitlist }: {
  plan: Plan;
  billingCycle: BillingCycle;
  onWaitlist: () => void;
}) {
  // Featured plan tiene una escala visual mayor y tag "Más popular".
  // En mobile NO aplicamos scale (queda mal con el viewport estrecho).
  const isFeatured = plan.featured;

  return (
    <article
      className={`relative rounded-2xl p-4 sm:p-6 transition-all ${
        isFeatured ? "md:scale-[1.03] md:-translate-y-1" : ""
      }`}
      style={{
        background: plan.accent.bg,
        border: `1.5px solid ${plan.accent.border}`,
        boxShadow: isFeatured
          ? "0 20px 50px rgba(168,85,247,0.20), 0 0 30px rgba(168,85,247,0.10)"
          : "0 8px 20px rgba(0,0,0,0.08)",
      }}
    >
      {/* Badge "Más popular" — solo en el plan featured */}
      {isFeatured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase text-white whitespace-nowrap"
             style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 12px rgba(168,85,247,0.4)" }}>
          ⭐ Más popular
        </div>
      )}

      {/* Cabecera: icono + nombre + tagline.
          Caja del icono usa var en vez de rgba(255,255,255,0.08) para que en
          light se vea con contraste. */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
             style={{ background: "var(--home-card-bg)", border: `1px solid ${plan.accent.border}` }}>
          {plan.id === "free" && <Zap size={18} strokeWidth={2} style={{ color: plan.accent.text }} />}
          {plan.id === "pro" && <Crown size={18} strokeWidth={2} style={{ color: plan.accent.text }} fill={plan.accent.text} />}
          {plan.id === "business" && <Users size={18} strokeWidth={2} style={{ color: plan.accent.text }} />}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-black" style={{ color: "var(--home-text)" }}>{plan.name}</h3>
          <p className="text-[11px]" style={{ color: "var(--home-text-soft)" }}>{plan.tagline}</p>
        </div>
      </div>

      {/* Precio — cambia segun billingCycle.
          - monthly: precio mensual normal (9,99€/mes)
          - annual: precio mensual efectivo del plan anual (8,25€/mes) +
            tachado del precio original + texto pequeno "facturado anualmente: 99€"
          El plan Free siempre muestra 0€ sin ningun extra. */}
      <div className="mb-5 mt-4">
        {plan.id === "free" ? (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-black tracking-tight" style={{ color: "var(--home-text)" }}>
              {plan.price.monthly}
            </span>
            <span className="text-sm" style={{ color: "var(--home-text-muted)" }}>
              /mes
            </span>
          </div>
        ) : billingCycle === "annual" ? (
          <>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-4xl font-black tracking-tight" style={{ color: "var(--home-text)" }}>
                {plan.price.monthlyAnnual}
              </span>
              <span className="text-sm" style={{ color: "var(--home-text-muted)" }}>
                /mes
              </span>
              {/* Tachado del precio mensual normal */}
              <span className="text-xs line-through opacity-60" style={{ color: "var(--home-text-soft)" }}>
                {plan.price.monthly}
              </span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--home-text-soft)" }}>
              Facturado anualmente: <span className="font-bold" style={{ color: "var(--home-text)" }}>{plan.price.yearly}</span>
              {" · "}
              <span className="font-bold" style={{ color: "var(--ag-success)" }}>ahorras 17%</span>
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black tracking-tight" style={{ color: "var(--home-text)" }}>
                {plan.price.monthly}
              </span>
              <span className="text-sm" style={{ color: "var(--home-text-muted)" }}>
                /mes
              </span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--home-text-soft)" }}>
              Facturado mensualmente · cambia a anual y ahorras 17%
            </p>
          </>
        )}
      </div>

      {/* Lista de features */}
      <ul className="space-y-2.5 mb-6">
        {plan.features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2 text-xs ${f.highlight ? "font-bold mb-1" : ""}`}
              style={{ color: f.included ? "var(--home-text)" : "var(--home-text-soft)" }}>
            {f.highlight ? (
              <Star size={12} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: plan.accent.text }} fill="currentColor" />
            ) : f.included ? (
              <Check size={12} strokeWidth={3} className="shrink-0 mt-0.5" style={{ color: plan.accent.text }} />
            ) : (
              <X size={12} strokeWidth={2} className="shrink-0 mt-0.5 opacity-40" />
            )}
            <span className={!f.included ? "line-through opacity-60" : ""}>{f.text}</span>
          </li>
        ))}
      </ul>

      {/* CTA — plan free es disabled (es el plan actual); pagos abren waitlist */}
      {plan.id === "free" ? (
        <button
          disabled
          className="w-full py-3 rounded-xl font-bold text-sm cursor-not-allowed opacity-90"
          style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)", color: "var(--home-text)" }}
        >
          Plan actual
        </button>
      ) : (
        <button
          onClick={onWaitlist}
          className="w-full py-3 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02]"
          style={
            isFeatured
              ? { background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", boxShadow: "0 4px 16px rgba(168,85,247,0.4)" }
              : { background: "linear-gradient(135deg,#facc15,#f59e0b)", color: "#000" }
          }
        >
          ¡Lo quiero!
          <ArrowRight size={13} strokeWidth={2.5} className="inline ml-1.5" />
        </button>
      )}

      {/* Disclaimer transparente */}
      <p className="text-[9px] text-center mt-2.5" style={{ color: "var(--home-text-soft)" }}>
        {plan.id === "free" ? "Sin tarjeta · empieza ya" : "Apúntate y te avisamos cuando esté listo"}
      </p>
    </article>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold mb-1" style={{ color: "var(--home-text)" }}>{q}</h3>
      <p className="text-xs leading-relaxed" style={{ color: "var(--home-text-muted)" }}>{a}</p>
    </div>
  );
}

/**
 * Modal de waitlist: captura email para avisar cuando el plan este disponible.
 * Insert via /api/waitlist. Si el email ya esta apuntado para ese plan,
 * mostramos mensaje "ya estabas en la lista".
 */
function WaitlistModal({
  plan, cycle, defaultEmail, onClose,
}: {
  plan: Plan;
  cycle: BillingCycle;
  defaultEmail: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<"new" | "already" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim()) {
      setError("Email obligatorio");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          plan: plan.id,
          cycle,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setDone(data.already ? "already" : "new");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && !sending && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl p-6 relative"
        style={{
          background: "var(--home-bg-soft)",
          border: "1px solid var(--ag-brand-border)",
          boxShadow: "0 0 60px var(--ag-brand-bg)",
        }}
      >
        <button
          onClick={() => !sending && onClose()}
          aria-label="Cerrar"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70"
          style={{ color: "var(--home-text-soft)" }}
        >
          <X size={18} />
        </button>

        {done ? (
          // Estado post-envio
          <div className="py-2 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
                 style={{ background: "var(--ag-success-bg)", border: "1px solid var(--ag-success-border)", color: "var(--ag-success)" }}>
              <Check size={26} strokeWidth={2.5} />
            </div>
            <h2 className="text-lg font-black mb-1" style={{ color: "var(--home-text)" }}>
              {done === "already" ? "¡Ya estabas en la lista!" : "¡Apuntado!"}
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--home-text-muted)" }}>
              Te avisaremos por email cuando <strong>{plan.name}</strong> esté disponible.
              <br />
              Mientras tanto, sigue creando flyers gratis.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
            >
              Genial, gracias
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                   style={{ background: "var(--ag-brand-bg)", color: "var(--ag-brand)" }}>
                <Mail size={18} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-black" style={{ color: "var(--home-text)" }}>
                  Lista de espera · {plan.name}
                </h2>
                <p className="text-xs" style={{ color: "var(--home-text-muted)" }}>
                  Te avisamos cuando esté disponible. Sin compromiso.
                </p>
              </div>
            </div>

            <label className="block text-xs font-bold mb-1 mt-4" style={{ color: "var(--home-text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoFocus={!defaultEmail}
              disabled={sending}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500/50 disabled:opacity-50"
              style={{
                background: "var(--home-card-bg)",
                border: "1px solid var(--home-card-border)",
                color: "var(--home-text)",
              }}
            />

            <label className="block text-xs font-bold mb-1 mt-3" style={{ color: "var(--home-text-muted)" }}>
              Cuéntanos qué necesitas <span className="font-normal opacity-60">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: tengo una academia de baile, hago 5 flyers al mes…"
              rows={3}
              maxLength={1000}
              disabled={sending}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500/50 resize-none disabled:opacity-50"
              style={{
                background: "var(--home-card-bg)",
                border: "1px solid var(--home-card-border)",
                color: "var(--home-text)",
              }}
            />

            {error && (
              <p className="text-xs mt-2" style={{ color: "var(--ag-danger)" }}>
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={sending || !email.trim()}
              className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-white transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 inline-flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                boxShadow: "0 4px 16px rgba(168,85,247,0.4)",
              }}
            >
              {sending && <Loader2 size={14} className="animate-spin" />}
              {sending ? "Apuntando…" : "Apúntame a la lista"}
            </button>

            <p className="text-[10px] text-center mt-3" style={{ color: "var(--home-text-soft)" }}>
              Sin spam · cancela cuando quieras
            </p>
          </>
        )}
      </div>
    </div>
  );
}
