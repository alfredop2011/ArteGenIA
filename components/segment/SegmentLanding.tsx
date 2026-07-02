import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Check, Clock, TrendingUp, Zap } from "lucide-react";

/**
 * SegmentLanding — landing page reusable por segmento del target.
 *
 * Genera páginas específicas para /para-salas, /para-djs-boda, etc.
 * con dolor + solución + casos + pricing enfocados a UN perfil concreto.
 *
 * SEO: cada segmento aporta keyword específica ("flyers para discotecas",
 * "flyer boda dj", "flyer academia baile", etc.) sin canibalizar la home
 * genérica.
 */

export interface SegmentPain {
    /** El "dolor" concreto que sufre este perfil ahora mismo */
    text: string;
}

export interface SegmentSolution {
    icon: LucideIcon;
    title: string;
    body: string;
}

export interface SegmentTestimonial {
    quote: string;
    author: string;
    role: string;
}

export interface SegmentLandingProps {
    /** Slug de la ruta (ej. "para-salas") — usado para canonical y tracking */
    slug: string;
    /** Emoji o icon principal del hero */
    heroIcon: LucideIcon;
    /** H1 con keyword SEO específica del segmento */
    heroH1: string;
    /** Sub-hero explicando el valor en 1-2 líneas */
    heroSubtitle: string;
    /** Bullet de pain points (3-4 items) */
    pains: SegmentPain[];
    /** Tarjetas de features/solución (3-6 items) */
    solutions: SegmentSolution[];
    /** Métrica destacada (ej. "5 min por flyer" / "20h/mes ahorradas") */
    highlightMetric: {
        value: string;
        label: string;
    };
    /** Testimonial placeholder (cambiar por real cuando tengas 1) */
    testimonial: SegmentTestimonial;
    /** Plan recomendado */
    recommendedPlan: "free" | "pro" | "enterprise";
}

const PLAN_META = {
    free: { name: "Free", price: "0€", desc: "para empezar y probar" },
    pro: { name: "Pro", price: "9,99€", desc: "para uso semanal o diario" },
    enterprise: { name: "Enterprise", price: "34,99€", desc: "para equipos y alto volumen" },
};

export function SegmentLanding({
    slug,
    heroIcon: HeroIcon,
    heroH1,
    heroSubtitle,
    pains,
    solutions,
    highlightMetric,
    testimonial,
    recommendedPlan,
}: SegmentLandingProps) {
    const plan = PLAN_META[recommendedPlan];

    return (
        <div className="min-h-screen bg-[#0e0e14] text-white">
            {/* Hero */}
            <div className="border-b border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6 py-16 md:py-20 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border border-purple-500/30 mb-6">
                        <HeroIcon className="w-8 h-8 text-purple-300" strokeWidth={2} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-balance">
                        {heroH1}
                    </h1>
                    <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        {heroSubtitle}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                        <Link
                            href="/templates"
                            className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:scale-[1.03] transition-transform"
                        >
                            Probar gratis — 10 créditos
                        </Link>
                        <Link
                            href="/pricing"
                            className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-semibold text-sm hover:bg-white/[0.10] transition-colors"
                        >
                            Ver planes
                        </Link>
                    </div>
                </div>
            </div>

            {/* Pain points */}
            <div className="bg-[#0b0b12] border-b border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6 py-14">
                    <div className="text-center mb-8">
                        <p className="text-[11px] uppercase tracking-widest text-red-300 font-bold mb-2">
                            El problema real
                        </p>
                        <h2 className="text-xl md:text-2xl font-black">
                            Si te suena, este producto es para ti
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {pains.map((pain, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4">
                                <div className="w-6 h-6 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-red-300 text-[11px] font-bold">!</span>
                                </div>
                                <p className="text-[13px] text-gray-300 leading-relaxed">{pain.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Solutions */}
            <div className="max-w-5xl mx-auto px-6 py-14">
                <div className="text-center mb-10">
                    <p className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold mb-2">
                        Cómo lo resolvemos
                    </p>
                    <h2 className="text-2xl md:text-3xl font-black">
                        Todo lo que necesitas, ni una feature de más
                    </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {solutions.map((sol, i) => {
                        const Icon = sol.icon;
                        return (
                            <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#13131f] p-5">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mb-3">
                                    <Icon className="w-5 h-5 text-purple-300" strokeWidth={2.2} />
                                </div>
                                <h3 className="text-[15px] font-bold mb-1.5">{sol.title}</h3>
                                <p className="text-[12px] text-gray-400 leading-relaxed">{sol.body}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Highlight metric */}
            <div className="border-t border-b border-white/[0.06] bg-gradient-to-br from-purple-500/[0.06] to-transparent">
                <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                    <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-3">
                        En cifras
                    </p>
                    <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent mb-2">
                        {highlightMetric.value}
                    </div>
                    <p className="text-sm text-gray-300">{highlightMetric.label}</p>
                </div>
            </div>

            {/* Testimonial */}
            <div className="max-w-3xl mx-auto px-6 py-14">
                <div className="rounded-2xl border border-white/[0.06] bg-[#13131f] p-8 relative">
                    <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200 text-[10px] font-bold uppercase tracking-widest">
                        Beta private
                    </div>
                    <p className="text-lg md:text-xl text-gray-100 leading-relaxed italic mb-5">
                        &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <div>
                        <div className="text-[13px] font-bold">{testimonial.author}</div>
                        <div className="text-[11px] text-gray-500">{testimonial.role}</div>
                    </div>
                </div>
            </div>

            {/* CTA + plan recomendado */}
            <div className="border-t border-white/[0.06] bg-[#0b0b12]">
                <div className="max-w-3xl mx-auto px-6 py-16">
                    <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/[0.08] via-fuchsia-500/[0.04] to-transparent p-8 text-center">
                        <p className="text-[11px] uppercase tracking-widest text-purple-300 font-bold mb-3">
                            Plan recomendado para ti
                        </p>
                        <div className="flex items-baseline justify-center gap-2 mb-2">
                            <span className="text-4xl font-black">{plan.price}</span>
                            <span className="text-sm text-gray-400">/mes</span>
                        </div>
                        <p className="text-[13px] text-gray-300 mb-1">
                            Plan <strong className="text-purple-200">{plan.name}</strong> — {plan.desc}.
                        </p>
                        <p className="text-[11px] text-gray-500 mb-6">
                            Sin permanencia. Cancela cuando quieras. Empieza gratis y sube cuando lo necesites.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href="/templates"
                                className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-sm shadow-lg shadow-purple-500/30 hover:scale-[1.03] transition-transform"
                            >
                                Empezar gratis
                            </Link>
                            <Link
                                href="/pricing"
                                className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-semibold text-sm hover:bg-white/[0.10] transition-colors"
                            >
                                Comparar planes
                            </Link>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-500 text-center mt-6">
                        ¿Prefieres verlo con tu caso concreto? Escríbenos a{" "}
                        <a href="mailto:hola@artegenia.com" className="text-purple-300 hover:text-purple-200 underline">
                            hola@artegenia.com
                        </a>{" "}
                        y montamos una demo.
                    </p>
                </div>
            </div>

            {/* Tracking + JSON-LD para SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        name: `ArteGenIA para ${slug.replace("para-", "").replace(/-/g, " ")}`,
                        description: heroSubtitle,
                        offers: {
                            "@type": "Offer",
                            price: plan.price.replace("€", "").replace(",", "."),
                            priceCurrency: "EUR",
                        },
                    }),
                }}
            />
        </div>
    );
}

/** Componente icon helper para features rápidas — expuesto para las páginas hijas */
export const SEGMENT_ICONS = { Check, Clock, TrendingUp, Zap };
