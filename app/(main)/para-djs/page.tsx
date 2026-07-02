import type { Metadata } from "next";
import { Sparkles, Music, Share2, Zap, Clock, Users } from "lucide-react";
import { SegmentLanding } from "@/components/segment/SegmentLanding";

export const metadata: Metadata = {
    title: "Flyers para DJs residentes en 5 minutos | ArteGenIA",
    description:
        "Herramienta con IA para DJs residentes que hacen su flyer semanal. Deja Canva atrás y publica tu próxima noche en 5 min, no 45.",
    keywords: ["flyer dj residente", "flyer semanal dj", "app flyer dj", "flyer sala dj residente", "flyer noche dj"],
    alternates: { canonical: "https://artegenia.com/para-djs" },
};

export default function ParaDjsPage() {
    return (
        <SegmentLanding
            slug="para-djs"
            heroIcon={Sparkles}
            heroH1="Tu flyer semanal como DJ residente, listo en 5 minutos"
            heroSubtitle="Pinchas cada semana en la misma sala y toca hacer flyer. La sala no lo hace, así que lo haces tú. En Canva son 30-45 min cada vez. Con ArteGenIA son 5 min y queda mejor."
            pains={[
                { text: "Cada semana la misma historia: sacar el flyer del jueves/sábado y tarda una hora entre Canva, Instagram y WhatsApp." },
                { text: "La sala no invierte en marketing profesional, así que el flyer es responsabilidad tuya — y define tu marca personal." },
                { text: "Los flyers de Canva se parecen todos entre sí — no destacas de otros DJs residentes en salas similares." },
                { text: "Cuando invitas a otro DJ como featured, coordinar la foto por WhatsApp es un caos." },
            ]}
            solutions={[
                { icon: Zap, title: "Genera flyer entero con IA", body: "Escribes 'Jueves house session con [nombre]' y sale un flyer completo con fondo IA. Solo ajustas lo que quieras." },
                { icon: Music, title: "45 combos de texto para DJs", body: "TONIGHT, DJ Featured, VIP Access, Lineup, Free Entry... Combinaciones profesionales orientadas a lo que necesitas." },
                { icon: Users, title: "DJ invitado sube su foto", body: "Le mandas un link, sube su foto, entra directa al slot del flyer. Sin persecución por chat." },
                { icon: Share2, title: "Publica con menciones auto", body: "Al publicar en Instagram, el caption incluye @tuSala @djInvitado sin que las tengas que escribir." },
                { icon: Clock, title: "Guarda tu 'plantilla base'", body: "Cada semana duplicas el flyer del jueves anterior y solo cambias la fecha. En 2 min tienes el próximo." },
                { icon: Sparkles, title: "Personaliza tu marca", body: "Colores, tipografía, tu logo. Tu flyer se ve distinto al del DJ residente de la sala de al lado." },
            ]}
            highlightMetric={{
                value: "40 min",
                label: "recuperados cada semana. Casi 30 horas al año que puedes dedicar a pinchar mejor.",
            }}
            testimonial={{
                quote: "Antes tardaba 45 min cada jueves para sacar el flyer. Ahora en 5 min está listo y tengo tiempo para preparar el set.",
                author: "DJ residente",
                role: "Beta private · Madrid",
            }}
            recommendedPlan="pro"
        />
    );
}
