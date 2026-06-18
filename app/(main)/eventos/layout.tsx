import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eventos · Fiestas, talleres y conciertos | ArteGenIA",
  description: "Calendario en vivo de eventos: fiestas DJ, workshops de baile, conciertos y festivales en Madrid, Barcelona y LATAM. Curados por organizadores reales.",
  keywords: ["eventos", "fiestas", "DJ", "workshops baile", "conciertos", "Madrid", "Barcelona", "calendario"],
  openGraph: {
    title: "Eventos que no te pierdes · ArteGenIA",
    description: "Calendario de fiestas, talleres y conciertos. Madrid · Barcelona · LATAM.",
    type: "website",
    images: [{ url: "https://artegenia.com/og-eventos.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventos que no te pierdes · ArteGenIA",
    description: "Calendario en vivo de eventos curados por organizadores reales.",
  },
  alternates: {
    canonical: "https://artegenia.com/eventos",
  },
};

export default function EventosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
