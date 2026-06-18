import type { Metadata } from "next";

/**
 * SEO afilado para /quitar-fondo (UX#8).
 *
 * Posicionamiento: este es el PRODUCTO DE ENTRADA según la estrategia
 * (mayor intención de compra en Google que "crear flyer"). Por eso
 * meta + JSON-LD agresivos:
 *  - title con keyword exacta "quitar fondo gratis"
 *  - description que destaca: gratis, sin marca de agua, sin registro
 *    para preview, IA, español
 *  - canonical correcto (evita duplicate content si llega tráfico
 *    desde landings de categoría)
 *  - OG image custom (TODO: generar uno antes/después específico)
 *
 * El JSON-LD (WebApplication + FAQ) lo añadimos en page.tsx vía
 * <script type="application/ld+json"> porque Next.js prefiere que
 * structured data esté cerca del contenido al que se refiere.
 */
export const metadata: Metadata = {
  title: "Quitar fondo de imagen gratis con IA · ArteGenIA",
  description:
    "Quita el fondo de tus fotos en 5 segundos con IA. Gratis, sin marca de agua, sin instalar nada. Resultado PNG transparente listo para flyers, redes sociales o imprenta. En español.",
  keywords: [
    "quitar fondo gratis",
    "quitar fondo imagen",
    "quitar fondo con IA",
    "fondo transparente PNG",
    "eliminar fondo foto",
    "recortar persona imagen",
    "remove background español",
  ],
  alternates: {
    canonical: "https://artegenia.com/quitar-fondo",
  },
  openGraph: {
    title: "Quitar fondo de imagen gratis con IA · ArteGenIA",
    description:
      "5 segundos. PNG transparente. Sin marca de agua. La IA hace el trabajo, tú descargas el resultado.",
    url: "https://artegenia.com/quitar-fondo",
    siteName: "ArteGenIA",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quitar fondo de imagen gratis con IA",
    description:
      "5 segundos. PNG transparente. Sin marca de agua. Hecho con IA para flyers, redes y eventos.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function QuitarFondoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
