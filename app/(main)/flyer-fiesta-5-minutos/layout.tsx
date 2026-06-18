import type { Metadata } from "next";

/**
 * Metadata + JSON-LD para la landing SEO de "flyer de fiesta en 5 min".
 *
 * 2 schemas Schema.org críticos para rich results:
 *  - HowTo: Google muestra carrusel "5 pasos" en SERP
 *  - FAQPage: Google muestra preguntas acordeón en SERP
 *
 * Sin estos, la página rankea bien pero no destaca visualmente. Con
 * ellos, ocupa 4-5x más espacio en la búsqueda → mucho más CTR.
 */

export const metadata: Metadata = {
  title: "Cómo hacer un flyer de fiesta en 5 minutos · Gratis con IA",
  description: "Guía paso a paso para crear un flyer profesional de fiesta o evento en 5 minutos. Sin Photoshop, sin diseñador. Plantillas DJ, IA en español, descarga sin marca de agua incluso en gratis.",
  keywords: [
    "cómo hacer un flyer de fiesta",
    "crear flyer fiesta gratis",
    "flyer DJ rápido",
    "flyer fiesta 5 minutos",
    "diseñar flyer evento",
    "plantillas flyer DJ",
    "flyer discoteca gratis",
  ],
  openGraph: {
    title: "Cómo hacer un flyer de fiesta en 5 minutos (gratis, con IA)",
    description: "Guía paso a paso. Plantillas DJ, IA en español, sin marca de agua. Cero diseño previo.",
    type: "article",
    locale: "es_ES",
    images: [{
      url: "https://artegenia.com/og-flyer-fiesta-5min.png",
      width: 1200,
      height: 630,
      alt: "Cómo hacer un flyer de fiesta en 5 minutos con ArteGenIA",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cómo hacer un flyer de fiesta en 5 minutos (gratis, con IA)",
    description: "Sin Photoshop, sin diseñador. Plantillas DJ + IA en español.",
  },
  alternates: {
    canonical: "https://artegenia.com/flyer-fiesta-5-minutos",
  },
};

const HOW_TO_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Cómo hacer un flyer de fiesta en 5 minutos",
  "description": "Guía completa para crear un flyer profesional de fiesta o evento usando ArteGenIA, sin necesidad de Photoshop ni diseñador.",
  "totalTime": "PT5M",
  "estimatedCost": { "@type": "MonetaryAmount", "currency": "EUR", "value": "0" },
  "supply": [
    { "@type": "HowToSupply", "name": "Foto del DJ, artista o evento" },
    { "@type": "HowToSupply", "name": "Datos del evento: fecha, sala, hora, precio" },
  ],
  "tool": [
    { "@type": "HowToTool", "name": "ArteGenIA (cuenta gratis)" },
    { "@type": "HowToTool", "name": "Smartphone o ordenador" },
  ],
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Elige una plantilla DJ o evento",
      "text": "Selecciona entre 48+ plantillas pensadas para fiestas, DJ sets, workshops y conciertos. Categorías: Bachata, Tecno, Reggaeton, Hip-Hop, Salsa, Kizomba.",
      "url": "https://artegenia.com/templates",
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Sube tu foto (DJ, artista, lugar)",
      "text": "Drag & drop desde tu galería o cámara. La IA detecta automáticamente al sujeto principal.",
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Quita el fondo con IA",
      "text": "Un click y la IA elimina el fondo de tu foto con bordes precisos en pelo, telas y siluetas. Sin Photoshop.",
      "url": "https://artegenia.com/quitar-fondo",
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Cambia el texto: fecha, sala, hora, precio",
      "text": "Toca el texto y escribe el nuevo. Tipografías de cartel ya elegidas — las plantillas mantienen la jerarquía visual automáticamente.",
    },
    {
      "@type": "HowToStep",
      "position": 5,
      "name": "Descarga y publica en Instagram",
      "text": "Exporta en PNG (feed), JPG (WhatsApp), PDF (imprenta) o SVG (vectorial). Sin marca de agua, incluso en plan gratis.",
    },
  ],
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿De verdad es gratis hacer un flyer de fiesta con ArteGenIA?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí. El plan free incluye 10 créditos al mes (≈5 fotos con IA) y descargas ilimitadas en PNG/JPG. Sin tarjeta, sin trial trampa.",
      },
    },
    {
      "@type": "Question",
      "name": "¿Lleva marca de agua el flyer descargado?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Ningún plan, ni el gratis, lleva marca de agua. Es nuestra diferenciación frente a Canva: Sin watermark, siempre.",
      },
    },
    {
      "@type": "Question",
      "name": "¿Funciona el editor en el móvil?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí. Editor optimizado para iPhone y Android. Puedes diseñar el flyer y publicarlo en Instagram sin salir del teléfono.",
      },
    },
    {
      "@type": "Question",
      "name": "¿Puedo descargar el flyer en PDF para imprenta?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sí, con plan Pro (9,99€/mes). PDF a tamaño real en milímetros, calidad profesional sin pérdida. También exportas SVG vectorial editable.",
      },
    },
    {
      "@type": "Question",
      "name": "¿Tengo que saber de diseño para usarlo?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Las plantillas tienen jerarquía visual y tipografías profesionales ya elegidas. Solo cambias texto y fotos. La IA hace el trabajo pesado.",
      },
    },
    {
      "@type": "Question",
      "name": "¿Cuánto tardo realmente la primera vez que hago un flyer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Si es tu primer flyer: 5-8 minutos incluyendo crear cuenta. A partir del segundo: 2-3 minutos por flyer.",
      },
    },
  ],
};

export default function FlyerFiestaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(HOW_TO_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      {children}
    </>
  );
}
