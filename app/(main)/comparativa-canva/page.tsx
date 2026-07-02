"use client";

import Link from "next/link";
import { Check, X, Sparkles, Users, MessageCircle, PartyPopper, GraduationCap, Music } from "lucide-react";

/**
 * /comparativa-canva — comparativa honesta ArteGenIA vs Canva.
 *
 * Filosofía: NO atacamos a Canva. Es una herramienta enorme y buena.
 * Explicamos con transparencia CUÁNDO conviene uno u otro (o ambos).
 * El user objetivo se identifica solo con su perfil.
 *
 * SEO: keywords "artegenia vs canva", "alternativa canva flyers",
 * "canva para djs". H1 con la comparación explícita, secciones bien
 * separadas (tabla + casos de uso + FAQ) para snippets ricos de Google.
 */

interface FeatureRow {
    feature: string;
    us: string | boolean;
    them: string | boolean;
    /** Nota opcional aclaratoria (mostrada como tooltip textual) */
    note?: string;
}

const FEATURES: FeatureRow[] = [
    { feature: "Editor de imágenes / flyers", us: true, them: true },
    { feature: "Plantillas de flyer", us: "40+ (vertical DJ/eventos)", them: "Miles (genéricas)" },
    { feature: "Documentos, presentaciones, vídeos", us: false, them: true, note: "Canva es horizontal" },
    { feature: "IA que genera el flyer ENTERO (fondo + textos)", us: true, them: false, note: "Canva AI edita texto/imagen, no crea el flyer completo" },
    { feature: "Text presets por objetivo (JTBD)", us: "45 combos curados", them: "Genéricos" },
    { feature: "Quitar fondo IA", us: true, them: true },
    { feature: "Recibir foto de colaborador por WhatsApp", us: true, them: false, note: "Único en el mercado" },
    { feature: "Publicar con @menciones automáticas", us: true, them: false },
    { feature: "Compartir directo por Telegram / WhatsApp", us: true, them: false },
    { feature: "Colaboradores externos (upload por link)", us: true, them: false, note: "Canva permite editar juntos, no upload por WA" },
    { feature: "Integración con calendario de eventos (Peligro Oficial)", us: true, them: false },
    { feature: "Créditos con rollover (cap 50)", us: true, them: false, note: "Canva es suscripción sin créditos" },
    { feature: "Sin watermark en todos los planes", us: true, them: "Solo Pro" },
    { feature: "Precio Pro / mes (mensual)", us: "9,99€", them: "12,99€" },
    { feature: "Comunidad global", us: false, them: true },
    { feature: "Idioma español nativo (soporte)", us: true, them: "ES parcial" },
];

interface UseCase {
    icon: typeof Users;
    title: string;
    who: string;
    winner: "us" | "them" | "both";
    reason: string;
}

const USE_CASES: UseCase[] = [
    {
        icon: Music,
        title: "Manager de sala hace 2-3 flyers por semana",
        who: "Sala pequeña / mediana",
        winner: "us",
        reason: "Reduces el tiempo por flyer de 30-45 min a 5 min con IA. El vertical especializado te da textos y combos que Canva no tiene.",
    },
    {
        icon: PartyPopper,
        title: "DJ móvil para bodas y eventos privados",
        who: "40-60 eventos/año, cada uno con flyer distinto",
        winner: "us",
        reason: "Text presets 'Boda', 'Save the date' y 'Baby shower' + generar flyer entero con IA en 5 min por cliente.",
    },
    {
        icon: Sparkles,
        title: "DJ residente que hace 1 flyer semanal",
        who: "Su noche fija en sala local",
        winner: "us",
        reason: "9,99€/mes por evitar 30 min a la semana en Canva. Matemática fácil (100 min/mes ahorrados por menos que un menú).",
    },
    {
        icon: GraduationCap,
        title: "Academia de baile capta alumnos",
        who: "Clases, workshops, ciclos",
        winner: "us",
        reason: "Presets 'Matrícula abierta', 'Clase prueba gratis' orientados al objetivo. Canva no habla el idioma de tu vertical.",
    },
    {
        icon: Users,
        title: "Freelance de diseño (varias industrias)",
        who: "Cliente A pide un flyer, cliente B una presentación, cliente C un vídeo",
        winner: "them",
        reason: "Canva cubre todo el trabajo horizontal. Si tu día es 20% flyers, 80% otros formatos, Canva compensa.",
    },
    {
        icon: MessageCircle,
        title: "Equipo grande con diseñador propio",
        who: "Agencia o empresa con brand book + diseñador profesional",
        winner: "them",
        reason: "El diseñador va a preferir Photoshop / Figma / Canva Enterprise. Los DJs sin equipo son otro caso — para ellos ArteGenIA gana.",
    },
    {
        icon: Sparkles,
        title: "Perfil híbrido: hace flyers + documentos",
        who: "Necesita ambos tipos de contenido regularmente",
        winner: "both",
        reason: "9,99€ (ArteGenIA) + 12,99€ (Canva Pro) = 22,98€/mes. Si te ahorra 5h al mes, el ROI es evidente.",
    },
];

export default function ComparativaCanvaPage() {
    return (
        <div className="min-h-screen bg-[#0e0e14] text-white">
            {/* Hero */}
            <div className="border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 bg-white/[0.04] border border-white/[0.08]">
                        <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-widest">
                            Comparativa honesta
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 text-balance">
                        ArteGenIA vs Canva:{" "}
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                            ¿cuál elegir
                        </span>{" "}
                        para flyers de eventos?
                    </h1>
                    <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        Canva es enorme y para lo que sirve, funciona. ArteGenIA es vertical y especializada en DJs, salas y eventos.
                        Te enseñamos honestamente <strong className="text-white">cuándo conviene uno, cuándo el otro, cuándo los dos</strong>.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                        <Link
                            href="/templates"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:scale-[1.03] transition-transform"
                        >
                            Probar ArteGenIA gratis
                        </Link>
                        <Link
                            href="/pricing"
                            className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-semibold text-sm hover:bg-white/[0.10] transition-colors"
                        >
                            Ver precios
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabla comparativa */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                <h2 className="text-2xl md:text-3xl font-black mb-2 text-center">
                    Comparativa feature por feature
                </h2>
                <p className="text-sm text-gray-400 text-center mb-8">
                    Sin marketing, solo hechos verificables al día de hoy.
                </p>

                <div className="rounded-2xl border border-white/[0.06] bg-[#13131f] overflow-hidden">
                    <div className="grid grid-cols-[1.5fr_1fr_1fr] px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                        <div className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">Feature</div>
                        <div className="text-[11px] text-purple-300 font-bold text-center">ArteGenIA</div>
                        <div className="text-[11px] text-gray-400 font-bold text-center">Canva</div>
                    </div>
                    {FEATURES.map((row, i) => (
                        <div
                            key={i}
                            className="grid grid-cols-[1.5fr_1fr_1fr] px-4 py-3 border-b border-white/[0.04] last:border-0 items-center hover:bg-white/[0.02] transition-colors">
                            <div>
                                <div className="text-[13px] text-gray-200 leading-snug">{row.feature}</div>
                                {row.note && (
                                    <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">{row.note}</div>
                                )}
                            </div>
                            <div className="text-center">
                                {typeof row.us === "boolean"
                                    ? row.us
                                        ? <Check className="w-4 h-4 text-emerald-400 mx-auto" strokeWidth={2.5} />
                                        : <X className="w-4 h-4 text-gray-600 mx-auto" strokeWidth={2.5} />
                                    : <span className="text-[12px] text-emerald-300 font-semibold">{row.us}</span>}
                            </div>
                            <div className="text-center">
                                {typeof row.them === "boolean"
                                    ? row.them
                                        ? <Check className="w-4 h-4 text-gray-400 mx-auto" strokeWidth={2.5} />
                                        : <X className="w-4 h-4 text-gray-600 mx-auto" strokeWidth={2.5} />
                                    : <span className="text-[12px] text-gray-300">{row.them}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-[10px] text-gray-600 text-center mt-3">
                    Datos verificados a 2 jul 2026. Canva puede lanzar features que empaten alguna diferencia — comprueba en su web si es crítico para ti.
                </p>
            </div>

            {/* Casos de uso */}
            <div className="border-t border-white/[0.06] bg-[#0b0b12]">
                <div className="max-w-5xl mx-auto px-6 py-12">
                    <h2 className="text-2xl md:text-3xl font-black mb-2 text-center">
                        ¿Cuál elegir según tu perfil?
                    </h2>
                    <p className="text-sm text-gray-400 text-center mb-10">
                        7 casos reales. Sin retorcerte el brazo — te decimos honestamente cuándo Canva es mejor.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {USE_CASES.map((uc, i) => {
                            const Icon = uc.icon;
                            const winnerBadge = uc.winner === "us"
                                ? { text: "Gana ArteGenIA", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" }
                                : uc.winner === "them"
                                    ? { text: "Gana Canva", cls: "bg-blue-500/15 text-blue-300 border-blue-500/30" }
                                    : { text: "Ganas usando LOS DOS", cls: "bg-purple-500/15 text-purple-300 border-purple-500/30" };
                            return (
                                <div key={i} className="rounded-2xl border border-white/[0.06] bg-[#13131f] p-5">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                                            <Icon className="w-5 h-5 text-purple-300" strokeWidth={2.2} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[15px] font-bold leading-snug mb-0.5">{uc.title}</h3>
                                            <p className="text-[11px] text-gray-500">{uc.who}</p>
                                        </div>
                                    </div>
                                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border mb-3 ${winnerBadge.cls}`}>
                                        {winnerBadge.text}
                                    </div>
                                    <p className="text-[12px] text-gray-300 leading-relaxed">{uc.reason}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bloque "el que necesita ambos" — coste real */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/[0.06] to-transparent p-6 md:p-8">
                    <h2 className="text-xl md:text-2xl font-black mb-3">
                        ¿Y si necesito los dos?
                    </h2>
                    <p className="text-sm text-gray-300 leading-relaxed mb-5">
                        Muchos usuarios acaban usando <strong>ambas herramientas</strong> por razones distintas:
                        Canva para presentaciones, docs, vídeo — ArteGenIA para flyers de eventos rápidos.
                        Coste combinado:
                    </p>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="rounded-xl bg-black/30 border border-white/[0.06] p-4 text-center">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">ArteGenIA Pro</div>
                            <div className="text-xl font-black text-emerald-300">9,99€</div>
                            <div className="text-[10px] text-gray-500 mt-1">/ mes</div>
                        </div>
                        <div className="rounded-xl bg-black/30 border border-white/[0.06] p-4 text-center">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Canva Pro</div>
                            <div className="text-xl font-black text-gray-300">12,99€</div>
                            <div className="text-[10px] text-gray-500 mt-1">/ mes</div>
                        </div>
                        <div className="rounded-xl bg-purple-500/10 border border-purple-500/30 p-4 text-center">
                            <div className="text-[10px] text-purple-300 uppercase tracking-widest mb-1">Total</div>
                            <div className="text-xl font-black text-white">22,98€</div>
                            <div className="text-[10px] text-purple-300 mt-1">/ mes</div>
                        </div>
                    </div>
                    <p className="text-[12px] text-gray-400 leading-relaxed">
                        Si ArteGenIA te ahorra <strong className="text-white">5 horas al mes</strong> haciendo flyers (típico en Sala/Club o DJ móvil),
                        estamos hablando de <strong className="text-emerald-300">4,6€ por hora ahorrada</strong>. Menos que un café.
                    </p>
                </div>
            </div>

            {/* FAQ */}
            <div className="border-t border-white/[0.06] bg-[#0b0b12]">
                <div className="max-w-3xl mx-auto px-6 py-12">
                    <h2 className="text-2xl md:text-3xl font-black mb-8 text-center">
                        Preguntas frecuentes
                    </h2>
                    <div className="space-y-3">
                        {[
                            {
                                q: "¿ArteGenIA quiere reemplazar a Canva?",
                                a: "No. Somos vertical especializado en flyers de eventos, DJ, salas, academias. Canva es horizontal (docs, vídeo, web, todo). Elegimos ser mejores en un nicho concreto en lugar de mediocres en todo.",
                            },
                            {
                                q: "¿Por qué sois más baratos que Canva?",
                                a: "Ellos tienen 12 años de infraestructura, 4.000+ empleados, oficinas en 5 continentes. Nosotros somos un equipo pequeño con precios ajustados a la fase actual. Cuando escalemos, no vamos a subirte el precio a los primeros clientes.",
                            },
                            {
                                q: "¿Puedo importar mis diseños de Canva?",
                                a: "Puedes exportar tu diseño de Canva como PNG/JPG y subirlo a ArteGenIA como imagen. Editar sobre él directamente (importar SVG con capas) todavía no está disponible.",
                            },
                            {
                                q: "¿Tenéis app móvil?",
                                a: "Sí. Todo funciona en web tanto en móvil como escritorio. No hay que instalar nada. Canva tiene app nativa pero muchos users la usan también desde web.",
                            },
                            {
                                q: "Mi cliente/socio ya paga Canva. ¿Merece la pena añadir ArteGenIA?",
                                a: "Depende del volumen de flyers. Si hacéis 1-2 flyers/mes, seguid con Canva. Si son 4+ al mes o tenéis colaboradores externos que suben fotos, ArteGenIA te ahorra tiempo real.",
                            },
                        ].map((item, i) => (
                            <details key={i} className="rounded-xl border border-white/[0.06] bg-[#13131f] p-4 group">
                                <summary className="cursor-pointer text-[14px] font-bold text-white flex items-center justify-between">
                                    {item.q}
                                    <span className="text-purple-300 group-open:rotate-180 transition-transform">▾</span>
                                </summary>
                                <p className="text-[13px] text-gray-300 leading-relaxed mt-3">{item.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA final */}
            <div className="border-t border-white/[0.06]">
                <div className="max-w-3xl mx-auto px-6 py-16 text-center">
                    <h2 className="text-2xl md:text-3xl font-black mb-4">
                        Pruébalo tú mismo antes de decidir
                    </h2>
                    <p className="text-sm text-gray-400 mb-6 max-w-xl mx-auto">
                        Registro gratis, sin tarjeta. 10 créditos para probar Quitar fondo, IA generativa, plantillas y publicación.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/templates"
                            className="px-6 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-black text-sm shadow-lg shadow-purple-500/30 hover:scale-[1.03] transition-transform"
                        >
                            Empezar gratis
                        </Link>
                        <Link
                            href="/ayuda"
                            className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.12] text-gray-200 font-semibold text-sm hover:bg-white/[0.10] transition-colors"
                        >
                            Preguntas frecuentes
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
