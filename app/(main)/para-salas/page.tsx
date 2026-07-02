import type { Metadata } from "next";
import { Music, Zap, Users, Clock, Sparkles, MessageCircle } from "lucide-react";
import { SegmentLanding } from "@/components/segment/SegmentLanding";

export const metadata: Metadata = {
    title: "Flyers para discotecas y salas de club en 5 minutos | ArteGenIA",
    description:
        "Herramienta con IA pensada para managers de sala que hacen 2-3 flyers a la semana. Plantillas por categoría, presets por objetivo y publicación directa a Instagram.",
    keywords: ["flyer discoteca", "flyer sala club", "app flyers para clubs", "diseño flyer discoteca", "flyer sala musica"],
    alternates: { canonical: "https://artegenia.com/para-salas" },
};

export default function ParaSalasPage() {
    return (
        <SegmentLanding
            slug="para-salas"
            heroIcon={Music}
            heroH1="Flyers para tu sala en 5 minutos con IA"
            heroSubtitle="Gestionas el marketing de una sala pequeña o mediana y hacéis 2-3 eventos por semana. Cada flyer te lleva 30-45 min en Canva. Con ArteGenIA baja a 5 min y no necesitas diseñador."
            pains={[
                { text: "Cada semana tienes que sacar 2-3 flyers y no llegas — al final publicas rápido y quedan mediocres." },
                { text: "Contrataste diseñador freelance pero cuesta 30-50€ por flyer y hay que esperar 24-48h de vuelta." },
                { text: "Canva Pro cuesta 12,99€/mes pero tienes que empezar cada flyer desde cero, sin combos pensados para clubs." },
                { text: "El community manager que va a cubrir vacaciones no sabe diseñar y no puedes delegarle el marketing." },
            ]}
            solutions={[
                { icon: Sparkles, title: "45 combos de texto profesionales", body: "Encabezados, DJ Featured, Free Entry, Save the Date, VIP Access... Todos orientados a los objetivos que tú tienes." },
                { icon: Zap, title: "Generar flyer entero con IA", body: "Escribes 'noche latina reggaeton con DJ X sábado 12' y sale un flyer completo con fondo IA. En 5 min." },
                { icon: Users, title: "Recibe fotos por WhatsApp", body: "Cada DJ invitado sube su foto por un link. Entra directo al slot del flyer. Sin persecución por chat." },
                { icon: Clock, title: "Delegable en asistente", body: "El flujo es tan simple que el community manager de vacaciones puede seguirlo sin conocimientos de diseño." },
                { icon: MessageCircle, title: "Publica con @menciones auto", body: "Al publicar en Instagram, el caption incluye las menciones de los DJs sin que las tengas que escribir." },
                { icon: Music, title: "Plantillas por música", body: "Reggaeton, techno, house, salsa, jazz... cada estilo tiene plantillas visualmente coherentes." },
            ]}
            highlightMetric={{
                value: "5 min",
                label: "por flyer, en lugar de 30-45 min en Canva o 24h de un diseñador freelance",
            }}
            testimonial={{
                quote: "Cada semana me llevaba 2 horas hacer los flyers de la sala. Ahora lo hago en 15 minutos y me sobra tiempo para pensar el line-up.",
                author: "Manager de sala",
                role: "Beta private · Madrid",
            }}
            recommendedPlan="enterprise"
        />
    );
}
