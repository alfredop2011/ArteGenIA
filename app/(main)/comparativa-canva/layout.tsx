import type { Metadata } from "next";

/**
 * Metadata SEO — página estratégica para captar búsquedas tipo
 * "ArteGenIA vs Canva", "alternativa Canva para DJs", "flyer DJ Canva".
 */
export const metadata: Metadata = {
    title: "ArteGenIA vs Canva: ¿cuál elegir para flyers de eventos? | ArteGenIA",
    description:
        "Comparativa honesta entre ArteGenIA y Canva para hacer flyers de eventos, DJ, discotecas y bodas. Precio, features, casos de uso reales. Elige la herramienta correcta para tu perfil.",
    keywords: [
        "artegenia vs canva",
        "alternativa canva flyers",
        "canva para djs",
        "hacer flyer discoteca",
        "app flyers djs",
        "canva vs ia flyers",
    ],
    openGraph: {
        title: "ArteGenIA vs Canva para flyers de eventos y DJ",
        description:
            "Comparativa honesta: cuándo pagar Canva, cuándo ArteGenIA, cuándo ambos. Análisis por casos de uso.",
        type: "article",
    },
    alternates: {
        canonical: "https://artegenia.com/comparativa-canva",
    },
};

export default function ComparativaCanvaLayout({ children }: { children: React.ReactNode }) {
    return children;
}
