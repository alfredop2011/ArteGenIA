"use client";

import Link from "next/link";
import { useState } from "react";
import { HelpCircle, Search, Mail, MessageCircle, ChevronDown, ExternalLink } from "lucide-react";

/**
 * /ayuda — Centro de ayuda con FAQ + contacto.
 *
 * MVP simple: acordeón de preguntas frecuentes organizadas por sección
 * + tarjetas de contacto (email, WhatsApp cuando esté aprobado).
 *
 * No requiere backend — todo hard-coded. Cuando tengamos volumen y
 * dolor real, migramos a un Intercom o similar. Por ahora, prioridad
 * es que el user ENCUENTRE respuestas antes de contactar soporte.
 */

interface FaqItem {
    q: string;
    a: string | React.ReactNode;
}

interface FaqSection {
    id: string;
    title: string;
    emoji: string;
    items: FaqItem[];
}

const FAQ: FaqSection[] = [
    {
        id: "primeros-pasos",
        title: "Primeros pasos",
        emoji: "🚀",
        items: [
            {
                q: "¿Cómo creo mi primer flyer?",
                a: (
                    <>
                        Entra en <Link href="/templates" className="text-purple-400 underline">Plantillas</Link>,
                        elige la que más se parezca a tu evento (DJ, salsa, fiesta, boda...) y click en ella para
                        abrir el editor. Ahí puedes cambiar los textos, la imagen y descargar en 5 minutos.
                    </>
                ),
            },
            {
                q: "¿Necesito saber diseñar?",
                a: "No. Las plantillas ya están diseñadas por profesionales. Tú solo cambias los textos (nombre del evento, fecha, DJ...) y opcionalmente la imagen. El resto lo hace ArteGenIA por ti.",
            },
            {
                q: "¿Puedo usarlo desde el móvil?",
                a: "Sí. El editor funciona igual en móvil que en ordenador. De hecho la mayoría de usuarios crean y publican desde el móvil.",
            },
        ],
    },
    {
        id: "creditos",
        title: "Créditos y planes",
        emoji: "💳",
        items: [
            {
                q: "¿Qué son los créditos?",
                a: "Los créditos se consumen cuando usas funciones que tienen coste real: descargar flyer (1 crédito), quitar fondo (1 crédito), recortar persona (2 créditos), generar con IA (3-5 créditos). Los planes tienen distintas cantidades mensuales.",
            },
            {
                q: "¿Cuántos créditos tengo cada mes?",
                a: (
                    <>
                        <strong>Free</strong>: 10 créditos/mes (para probar)
                        <br />
                        <strong>Pro (9,99€/mes)</strong>: 100 créditos/mes con rollover hasta 50
                        <br />
                        <strong>Enterprise (34,99€/mes)</strong>: 350 créditos/mes con rollover hasta 50
                    </>
                ),
            },
            {
                q: "¿Cuándo se renuevan los créditos?",
                a: "El día 1 de cada mes a las 05:00 (hora España). Los créditos sin usar del mes anterior se pierden si eres Free. Los planes Pro y Enterprise conservan hasta 50 créditos del mes previo.",
            },
            {
                q: "¿Puedo comprar créditos extra sin subir de plan?",
                a: "Todavía no. Estamos añadiendo esa opción. Si necesitas más créditos puntualmente, escríbenos y te ayudamos.",
            },
            {
                q: "¿Puedo cancelar mi plan cuando quiera?",
                a: "Sí. Sin permanencia. Cancelas desde 'Mi cuenta' → 'Gestionar suscripción' y no se renueva el mes siguiente. Los créditos que te quedan siguen activos hasta el final del ciclo.",
            },
        ],
    },
    {
        id: "editor",
        title: "Editor y funciones",
        emoji: "✏️",
        items: [
            {
                q: "¿Cómo cambio el texto de una plantilla?",
                a: "Haz click sobre cualquier texto del flyer y escribe encima. En móvil, tap dos veces y se abre el teclado.",
            },
            {
                q: "¿Puedo usar mis propias fuentes?",
                a: "Sí en plan Pro y Enterprise. En Free tienes acceso a 40+ tipografías profesionales de Google Fonts.",
            },
            {
                q: "¿Cómo quito el fondo de una foto?",
                a: (
                    <>
                        Dos formas: (1) desde <Link href="/quitar-fondo" className="text-purple-400 underline">artegenia.com/quitar-fondo</Link> subes
                        la foto y descargas la versión sin fondo. (2) dentro del editor, seleccionas la imagen y click en "Quitar fondo".
                    </>
                ),
            },
            {
                q: "¿Puedo añadir varios DJs con sus fotos?",
                a: "Sí. Añades a los DJs como 'Colaboradores' con su WhatsApp o Telegram. Les mandas UN link, ellos suben su foto, y la foto entra directa al slot del flyer.",
            },
        ],
    },
    {
        id: "publicar",
        title: "Publicar y compartir",
        emoji: "📢",
        items: [
            {
                q: "¿En qué formatos puedo descargar?",
                a: "PNG (por defecto, mejor calidad), JPG (más ligero, para redes), PDF y SVG vectorial (plan Pro y Enterprise).",
            },
            {
                q: "¿Puedo publicar directamente a Instagram?",
                a: "Sí. En el editor pulsa 'Publicar' y elige la red. Se abre el chat/app con la imagen ya cargada. En Instagram tienes que pegarla manualmente en Feed o Stories (limitación de Instagram, no de ArteGenIA).",
            },
            {
                q: "¿Puedo compartir el flyer con menciones automáticas?",
                a: "Sí. Si añadiste colaboradores con sus @handles de Instagram, al publicar se incluyen las menciones automáticamente en el caption.",
            },
        ],
    },
    {
        id: "problemas",
        title: "Problemas comunes",
        emoji: "🛠️",
        items: [
            {
                q: "No recibo el email de confirmación al registrarme",
                a: "Revisa la carpeta de Spam. Los emails de confirmación llegan desde 'hola@artegenia.com'. Si en 5 minutos no llega, escríbenos y te lo desbloqueamos manualmente.",
            },
            {
                q: "No veo mis flyers guardados",
                a: (
                    <>
                        Están en <Link href="/mis-recursos" className="text-purple-400 underline">Mis recursos</Link> →
                        tab 'Proyectos'. Si no aparecen, comprueba que estás logueado con la misma cuenta con la que los creaste.
                    </>
                ),
            },
            {
                q: "El editor va lento en mi móvil antiguo",
                a: "El editor pide bastante potencia gráfica. Si notas lag, cierra otras pestañas y prueba de nuevo. En móviles de antes de 2020 puede ir menos fluido que en desktop.",
            },
            {
                q: "Se descontaron créditos pero el flyer no se descargó",
                a: "El sistema devuelve créditos automáticamente si la descarga falla. Si no ves el reembolso en tu balance, escríbenos con la fecha y hora aproximada y te ajustamos manualmente.",
            },
        ],
    },
];

export default function AyudaPage() {
    const [openId, setOpenId] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const filterFn = (item: FaqItem): boolean => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const text = typeof item.a === "string" ? item.a : "";
        return item.q.toLowerCase().includes(q) || text.toLowerCase().includes(q);
    };

    return (
        <div className="min-h-screen" style={{ background: "var(--home-bg)" }}>
            {/* Hero */}
            <div className="border-b" style={{ borderColor: "var(--home-card-border)" }}>
                <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                         style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>
                        <HelpCircle className="w-4 h-4 text-purple-400" strokeWidth={2.2} />
                        <span className="text-[11px] font-semibold" style={{ color: "var(--home-text)" }}>
                            Centro de ayuda
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-3" style={{ color: "var(--home-text)" }}>
                        ¿En qué te podemos ayudar?
                    </h1>
                    <p className="text-sm md:text-base mb-6" style={{ color: "var(--home-text-muted)" }}>
                        Encuentra respuestas rápidas a las preguntas más frecuentes.
                        Si no encuentras lo que buscas, escríbenos.
                    </p>

                    {/* Buscador */}
                    <div className="relative max-w-xl mx-auto">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: "var(--home-text-muted)" }} strokeWidth={2.2} />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar en la ayuda..."
                            className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
                            style={{
                                background: "var(--home-card-bg)",
                                border: "1px solid var(--home-card-border)",
                                color: "var(--home-text)",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* FAQ */}
            <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
                {FAQ.map((section) => {
                    const items = section.items.filter(filterFn);
                    if (items.length === 0) return null;
                    return (
                        <section key={section.id}>
                            <h2 className="text-xl font-black mb-4 flex items-center gap-2"
                                style={{ color: "var(--home-text)" }}>
                                <span>{section.emoji}</span>
                                {section.title}
                            </h2>
                            <div className="space-y-2">
                                {items.map((item, i) => {
                                    const id = `${section.id}-${i}`;
                                    const isOpen = openId === id;
                                    return (
                                        <button
                                            key={id}
                                            onClick={() => setOpenId(isOpen ? null : id)}
                                            className="w-full text-left rounded-xl overflow-hidden transition-colors"
                                            style={{
                                                background: "var(--home-card-bg)",
                                                border: `1px solid ${isOpen ? "#a855f7" : "var(--home-card-border)"}`,
                                            }}>
                                            <div className="flex items-center justify-between p-4">
                                                <span className="text-sm font-semibold pr-3" style={{ color: "var(--home-text)" }}>
                                                    {item.q}
                                                </span>
                                                <ChevronDown
                                                    size={18}
                                                    className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                                    style={{ color: "var(--home-text-muted)" }}
                                                />
                                            </div>
                                            {isOpen && (
                                                <div className="px-4 pb-4 text-sm leading-relaxed"
                                                     style={{ color: "var(--home-text-muted)" }}>
                                                    {item.a}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {/* Contacto */}
                <section className="mt-12 pt-8 border-t" style={{ borderColor: "var(--home-card-border)" }}>
                    <h2 className="text-xl font-black mb-4" style={{ color: "var(--home-text)" }}>
                        ¿No encontraste tu respuesta?
                    </h2>
                    <p className="text-sm mb-5" style={{ color: "var(--home-text-muted)" }}>
                        Escríbenos y te respondemos en menos de 24h laborables.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <a
                            href="mailto:hola@artegenia.com?subject=Ayuda ArteGenIA"
                            className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                            style={{
                                background: "var(--home-card-bg)",
                                border: "1px solid var(--home-card-border)",
                            }}>
                            <Mail className="w-5 h-5 text-purple-400" strokeWidth={2.2} />
                            <div className="flex-1">
                                <div className="text-sm font-bold" style={{ color: "var(--home-text)" }}>
                                    Email
                                </div>
                                <div className="text-xs" style={{ color: "var(--home-text-muted)" }}>
                                    hola@artegenia.com
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4" style={{ color: "var(--home-text-muted)" }} />
                        </a>
                        <a
                            href="https://wa.me/34600000000?text=Hola,%20necesito%20ayuda%20con%20ArteGenIA"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.02]"
                            style={{
                                background: "var(--home-card-bg)",
                                border: "1px solid var(--home-card-border)",
                            }}>
                            <MessageCircle className="w-5 h-5 text-emerald-400" strokeWidth={2.2} />
                            <div className="flex-1">
                                <div className="text-sm font-bold" style={{ color: "var(--home-text)" }}>
                                    WhatsApp
                                </div>
                                <div className="text-xs" style={{ color: "var(--home-text-muted)" }}>
                                    Respuesta más rápida
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4" style={{ color: "var(--home-text-muted)" }} />
                        </a>
                    </div>
                </section>

                {/* Enlaces útiles */}
                <section className="mt-8 pt-6 border-t" style={{ borderColor: "var(--home-card-border)" }}>
                    <h2 className="text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: "var(--home-text-muted)" }}>
                        Enlaces útiles
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <Link href="/templates" className="hover:opacity-80" style={{ color: "var(--home-text)" }}>
                            Plantillas
                        </Link>
                        <Link href="/pricing" className="hover:opacity-80" style={{ color: "var(--home-text)" }}>
                            Precios
                        </Link>
                        <Link href="/quitar-fondo" className="hover:opacity-80" style={{ color: "var(--home-text)" }}>
                            Quitar fondo
                        </Link>
                        <Link href="/mis-recursos" className="hover:opacity-80" style={{ color: "var(--home-text)" }}>
                            Mis recursos
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
