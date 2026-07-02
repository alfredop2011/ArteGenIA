import type { Metadata } from "next";
import { PartyPopper, Heart, Zap, Sparkles, Clock, TrendingUp } from "lucide-react";
import { SegmentLanding } from "@/components/segment/SegmentLanding";

export const metadata: Metadata = {
    title: "Flyers para bodas y eventos privados — DJ móvil | ArteGenIA",
    description:
        "Herramienta con IA para DJs móviles que hacen bodas, cumpleaños y eventos privados. Cada cliente su flyer personalizado en 5 minutos. Cobra el flyer como añadido al servicio.",
    keywords: ["flyer boda dj", "invitacion boda dj", "flyer dj movil", "flyer evento privado", "app flyer dj bodas"],
    alternates: { canonical: "https://artegenia.com/para-djs-boda" },
};

export default function ParaDjsBodaPage() {
    return (
        <SegmentLanding
            slug="para-djs-boda"
            heroIcon={PartyPopper}
            heroH1="Flyers profesionales para tus bodas y eventos privados"
            heroSubtitle="Eres DJ móvil y cada cliente pide un flyer distinto con su fecha, nombre y lugar. Con ArteGenIA lo haces en 5 min y puedes cobrarlo como añadido al servicio — 30-60€ de margen extra por evento."
            pains={[
                { text: "Haces 40-60 eventos privados al año y cada uno con un flyer distinto — te comen horas en Canva mediocre." },
                { text: "Cuando externalizas al diseñador cuesta 30-50€ por flyer, se te va el margen y hay que esperar respuesta." },
                { text: "Tus clientes quieren VER el flyer antes de reservar. Si tardas 3 días en enviarlo, se van a otro DJ." },
                { text: "Los flyers de Canva se ven genéricos — no destacan tu marca ni la personalidad de la boda del cliente." },
            ]}
            solutions={[
                { icon: Heart, title: "Presets Boda, Baby Shower, Comunión", body: "Combos de texto elegantes específicos para eventos privados. Playfair italic + tipografía profesional." },
                { icon: Zap, title: "Genera flyer completo en 5 min", body: "Escribes nombre novios, fecha, iglesia, salón — sale un flyer bonito. Personalización rápida por cliente." },
                { icon: Sparkles, title: "Cambia colores y estilo al gusto", body: "Cada boda tiene su paleta. Cambias los colores del preset en 1 click sin tocar el diseño." },
                { icon: Clock, title: "Envía al cliente en 24h", body: "En vez de esperar 2-3 días al diseñador, envías la propuesta el mismo día. Cierra reservas más rápido." },
                { icon: TrendingUp, title: "Cobra el flyer como añadido", body: "Los novios pagan 30-60€ por un flyer decente para invitar. Tu coste real: 5 min y 2 créditos." },
                { icon: PartyPopper, title: "Guarda tus mejores diseños", body: "Los flyers de bodas anteriores quedan en Mis Recursos. Duplícalos y adapta para el próximo cliente." },
            ]}
            highlightMetric={{
                value: "+2.400€/año",
                label: "extra si cobras 40€ x 60 bodas al año por el flyer añadido al servicio DJ",
            }}
            testimonial={{
                quote: "Los novios flipan cuando les mando el flyer el mismo día que me contactan. Me cierran la boda antes de mirar a otros DJs.",
                author: "DJ móvil freelance",
                role: "Beta private · Barcelona",
            }}
            recommendedPlan="enterprise"
        />
    );
}
