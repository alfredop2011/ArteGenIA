import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import PostHogProvider from "@/components/analytics/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dominio canonico para resolver URLs absolutas (og:image, sitemap, etc.).
// Cuando se compre dominio propio, cambiar aqui o setear NEXT_PUBLIC_SITE_URL en Vercel.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://artegenia.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Title template: paginas hijas pueden sobreescribir; sino se usa el default.
  // Ej: una pagina con title="Plantillas" mostrara "Plantillas · ArteGenIA"
  title: {
    default: "ArteGenIA — Crea flyers profesionales con IA en minutos",
    template: "%s · ArteGenIA",
  },
  description:
    "Diseña flyers para eventos, conciertos, talleres y clases de baile usando plantillas profesionales e IA. Recorta personas, elimina fondos y descarga en alta calidad. Gratis.",
  keywords: [
    "generador de flyers",
    "crear flyers online",
    "flyers para eventos",
    "diseño con IA",
    "plantillas flyer",
    "flyers para conciertos",
    "flyers clases de baile",
    "recortar personas IA",
    "eliminar fondo foto",
  ],
  authors: [{ name: "ArteGenIA" }],
  creator: "ArteGenIA",
  publisher: "ArteGenIA",
  applicationName: "ArteGenIA",
  // OpenGraph: como se ve cuando compartes el link en WhatsApp/FB/LinkedIn.
  // La imagen se genera dinamicamente desde app/opengraph-image.tsx — Next 16
  // la detecta automaticamente, no hace falta listarla aqui.
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: SITE_URL,
    siteName: "ArteGenIA",
    title: "ArteGenIA — Crea flyers profesionales con IA en minutos",
    description:
      "Diseña flyers para eventos, conciertos, talleres y clases de baile con plantillas profesionales e IA. Gratis.",
  },
  // Twitter card: como se ve cuando compartes en X/Twitter
  twitter: {
    card: "summary_large_image",
    title: "ArteGenIA — Crea flyers profesionales con IA",
    description: "Diseña flyers profesionales en minutos con plantillas e IA. Gratis.",
  },
  // Robots: permitir indexacion completa (queremos SEO)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

// Fix critico mobile: sin este export iOS Safari renderiza la pagina a
// 980px y la escala, causando scroll horizontal y elementos minusculos.
// Tambien previene zoom-in al enfocar inputs en iOS.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0010",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Montserrat:wght@400;500;600;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Cormorant+Garamond:wght@300;400;500;700&family=Great+Vibes&family=Oswald:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col"
            style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
        {/* PostHog wrap todo el arbol. Suspense porque usa useSearchParams
            (Next 16 lo requiere para componentes que leen search params). */}
        <Suspense fallback={null}>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
