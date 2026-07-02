import type { Metadata } from "next";
import { GraduationCap, Sparkles, Users, Zap, Clock, TrendingUp } from "lucide-react";
import { SegmentLanding } from "@/components/segment/SegmentLanding";

export const metadata: Metadata = {
    title: "Flyers para academias de baile, música y cursos | ArteGenIA",
    description:
        "Herramienta con IA para academias que necesitan captar alumnos. Flyers de matrícula abierta, clases prueba gratis, workshops, masterclass. En 5 minutos, sin diseñador.",
    keywords: ["flyer academia baile", "flyer matricula abierta", "flyer cursos", "flyer workshop", "flyer clases baile"],
    alternates: { canonical: "https://artegenia.com/para-academias" },
};

export default function ParaAcademiasPage() {
    return (
        <SegmentLanding
            slug="para-academias"
            heroIcon={GraduationCap}
            heroH1="Capta alumnos con flyers profesionales en 5 minutos"
            heroSubtitle="Tienes una academia de baile, música, idiomas o formación y necesitas comunicar constantemente: matrícula abierta, workshop, masterclass, clase prueba. ArteGenIA lo hace fácil."
            pains={[
                { text: "El curso empieza en 3 semanas y aún no habéis publicado el flyer de matrícula porque toca esperar al diseñador." },
                { text: "Cada mes hay que hacer flyer nuevo (matrícula, workshop invitado, promoción) y no llegáis a hacerlos bien." },
                { text: "Los flyers de Canva se ven genéricos — no reflejan la calidad y el nivel de vuestros profesores." },
                { text: "Cuando organizáis masterclass con profesor invitado, coordinar su foto es un caos por WhatsApp." },
            ]}
            solutions={[
                { icon: Sparkles, title: "Presets 'Captar alumnos' curados", body: "Matrícula abierta, Prueba gratis, Nuevo curso, Academia, Masterclass — todos redactados para el objetivo educativo." },
                { icon: Zap, title: "Genera flyer completo con IA", body: "Escribes 'workshop salsa cubana con [profe] sábado 15' y sale un flyer bonito. Solo ajustas lo que quieras." },
                { icon: Users, title: "Profesor invitado sube foto", body: "Al masterclass con artista externo, le mandas link, sube su foto, entra directa al flyer. Sin agobios." },
                { icon: GraduationCap, title: "Plantillas por disciplina", body: "Baile, música, idiomas, arte marcial, yoga... cada una tiene estilos visuales apropiados al público objetivo." },
                { icon: Clock, title: "Publica cuando lo necesitas", body: "Sin depender del diseñador. El flyer del workshop del próximo sábado lo tienes esta tarde publicando." },
                { icon: TrendingUp, title: "Reutiliza para el próximo curso", body: "Duplicas el flyer del curso anterior, cambias las fechas y publicas. En 3 min tienes la nueva convocatoria." },
            ]}
            highlightMetric={{
                value: "3× más publicaciones",
                label: "al mes. Más presencia en Instagram = más alumnos consultando matrícula.",
            }}
            testimonial={{
                quote: "Publicábamos 4 flyers al mes. Ahora publicamos 12 y las consultas de matrícula subieron un 40%. Cambió el juego.",
                author: "Directora de academia de baile",
                role: "Beta private · Valencia",
            }}
            recommendedPlan="pro"
        />
    );
}
