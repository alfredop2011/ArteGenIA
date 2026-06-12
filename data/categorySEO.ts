/**
 * Configuración SEO para landings por categoría.
 *
 * Cada categoría tiene su slug, título H1, descripción larga, keywords
 * y FAQ schema. Las páginas /flyers/[slug] usan esto para generar:
 * - <title> + <meta description>
 * - OG tags + Twitter Card
 * - H1 + intro larga
 * - FAQ schema.org JSON-LD
 *
 * "rawNames" lista las strings exactas del campo `category` en data/templates.ts
 * que mapean a este slug (algunas tienen variantes "Concierto" / "Conciertos").
 */

export type CategorySEO = {
  slug: string;
  rawNames: string[];
  emoji: string;
  h1: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  faq: Array<{ q: string; a: string }>;
};

export const CATEGORY_SEO: CategorySEO[] = [
  {
    slug: "conciertos",
    rawNames: ["Concierto", "Conciertos"],
    emoji: "🎸",
    h1: "Flyers para conciertos profesionales en minutos",
    intro: "Diseña carteles para conciertos, recitales y festivales de música usando plantillas profesionales optimizadas para Instagram, WhatsApp e imprenta. Edita el nombre del artista, fecha, sala y precio en segundos — sin software de diseño.",
    metaTitle: "Flyers para conciertos gratis · Plantillas profesionales · ArteGenIA",
    metaDescription: "Crea flyers para conciertos online gratis. Plantillas profesionales para músicos, salas y promotores. Edita en el móvil, descarga PNG/PDF/SVG y comparte en redes sociales en 2 minutos.",
    keywords: [
      "flyer concierto", "cartel concierto", "afiche concierto",
      "plantilla flyer música", "diseño flyer conciertos",
      "flyer músico", "promoción concierto redes sociales",
    ],
    faq: [
      {
        q: "¿Puedo hacer un flyer para concierto gratis?",
        a: "Sí. ArteGenIA es gratis para crear, editar y descargar flyers en PNG y JPG. No requiere tarjeta de crédito.",
      },
      {
        q: "¿Qué medidas tiene el flyer para concierto?",
        a: "Cada plantilla tiene varias variantes: Post Instagram (1080×1080), Story (1080×1920), Portrait (1080×1350) y formato imprenta (1240×1748). Exporta el que necesites.",
      },
      {
        q: "¿Puedo usar fotos de mis artistas?",
        a: "Sí. Sube tus propias fotos, recórtalas, quita el fondo con IA en un toque y reposiciónalas dentro del flyer.",
      },
      {
        q: "¿Sirve para imprimir el cartel?",
        a: "Sí. Exporta en PDF con tamaño real en milímetros, listo para llevar a imprenta.",
      },
    ],
  },
  {
    slug: "clases-de-baile",
    rawNames: ["Clases"],
    emoji: "💃",
    h1: "Flyers para clases de baile y academias",
    intro: "Plantillas pensadas para academias de salsa, bachata, kizomba, tango y otras disciplinas. Comunica horarios, profesores y precios con un diseño profesional que destaca en Instagram y WhatsApp.",
    metaTitle: "Flyers para clases de baile · Plantillas para academias · ArteGenIA",
    metaDescription: "Diseña flyers para clases de salsa, bachata, kizomba y más. Plantillas profesionales para academias y escuelas de baile. Edita profesores, fechas y horarios en minutos.",
    keywords: [
      "flyer clases baile", "cartel academia danza", "flyer escuela baile",
      "plantilla flyer salsa", "flyer bachata", "flyer kizomba",
      "promoción clases danza", "flyer profesor baile",
    ],
    faq: [
      {
        q: "¿Hay plantillas específicas para salsa o bachata?",
        a: "Sí. Tenemos plantillas con la energía y tipografía adecuadas para cada estilo de baile: bachata, salsa, kizomba, tango.",
      },
      {
        q: "¿Puedo poner las fotos de los profesores?",
        a: "Sí. Sube las fotos, quita el fondo con IA en un toque y colócalas en el lugar reservado.",
      },
      {
        q: "¿Soporta varios horarios y bloques?",
        a: "Sí. Las plantillas incluyen campos para fecha, hora, duración, número de bloques y precio early bird.",
      },
    ],
  },
  {
    slug: "fiestas",
    rawNames: ["Fiesta"],
    emoji: "🎉",
    h1: "Flyers para fiestas y eventos privados",
    intro: "Crea invitaciones digitales para fiestas, despedidas, reuniones temáticas y eventos privados. Diseño dinámico, edición rápida y exportación al instante para enviar por WhatsApp.",
    metaTitle: "Flyers para fiestas · Invitaciones digitales · ArteGenIA",
    metaDescription: "Crea invitaciones para fiestas online gratis. Plantillas profesionales con estilos vibrantes. Comparte por WhatsApp en segundos.",
    keywords: [
      "flyer fiesta", "invitación fiesta digital", "cartel fiesta",
      "plantilla invitación", "diseño flyer cumpleaños",
      "flyer despedida soltero", "promoción fiesta redes",
    ],
    faq: [
      {
        q: "¿Las fiestas privadas requieren plantilla distinta?",
        a: "Tenemos plantillas para cumpleaños, despedidas, halloween, fiestas temáticas y eventos sociales en general.",
      },
      {
        q: "¿Puedo añadir un código QR para confirmar asistencia?",
        a: "Pronto. Por ahora puedes poner el link directo o teléfono.",
      },
      {
        q: "¿Cómo lo envío por WhatsApp?",
        a: "Tras descargar, el editor abre un modal de compartir con WhatsApp directo. También puedes copiar el link al flyer público.",
      },
    ],
  },
  {
    slug: "festivales",
    rawNames: ["Festival"],
    emoji: "🎪",
    h1: "Flyers para festivales y eventos masivos",
    intro: "Promociona festivales de música, gastronomía o cultura con plantillas pensadas para varios artistas, sponsors y line-ups complejos. Exporta en alta para imprenta y redes.",
    metaTitle: "Flyers para festivales · Plantillas line-up artistas · ArteGenIA",
    metaDescription: "Diseña flyers para festivales con line-up de artistas, sponsors y ubicación. Plantillas optimizadas para Instagram y carteles imprenta.",
    keywords: [
      "flyer festival", "cartel festival música", "line up festival",
      "plantilla flyer festival", "diseño festival gastronómico",
      "festival cultural flyer", "promoción festival redes",
    ],
    faq: [
      {
        q: "¿Cuántos artistas puedo poner en el line-up?",
        a: "Depende de la plantilla. Tenemos opciones para 2, 4, 8 y 12+ artistas con jerarquía visual ajustable.",
      },
      {
        q: "¿Puedo añadir sponsors?",
        a: "Sí. Sube los logos como imágenes y colócalos en la zona inferior del flyer.",
      },
    ],
  },
  {
    slug: "discotecas",
    rawNames: ["Club / Discoteca"],
    emoji: "🪩",
    h1: "Flyers para discotecas y clubs nocturnos",
    intro: "Plantillas con estética nocturna, neón y club para promocionar noches temáticas, DJ sets y residencias. Diseño hecho para destacar en historias de Instagram.",
    metaTitle: "Flyers para discotecas y clubs · DJ sets · ArteGenIA",
    metaDescription: "Crea flyers para discotecas, clubs y DJ sets. Plantillas con estética nocturna y neón. Edita en el móvil y comparte en Instagram en segundos.",
    keywords: [
      "flyer discoteca", "flyer club nocturno", "flyer DJ set",
      "plantilla noche club", "diseño flyer disco",
      "promoción discoteca", "flyer residencia DJ",
    ],
    faq: [
      {
        q: "¿Hay plantillas con efecto neón?",
        a: "Sí. El sub-tool Estilos incluye sombras y glow para texto. Y el Remix IA genera variantes neón al instante.",
      },
      {
        q: "¿Puedo poner varias noches del mes?",
        a: "Sí. Tenemos plantillas tipo calendario con grid de noches y diferentes DJs.",
      },
    ],
  },
  {
    slug: "corporativos",
    rawNames: ["Corporativo"],
    emoji: "🏢",
    h1: "Flyers corporativos y eventos de empresa",
    intro: "Plantillas sobrias para conferencias, lanzamientos, jornadas profesionales y comunicación interna. Estilo elegante y editable en minutos sin perder profesionalidad.",
    metaTitle: "Flyers corporativos · Eventos de empresa · ArteGenIA",
    metaDescription: "Diseña flyers corporativos para conferencias, lanzamientos y eventos de empresa. Plantillas elegantes y editables sin software de diseño.",
    keywords: [
      "flyer corporativo", "flyer empresa", "cartel conferencia",
      "plantilla flyer corporativo", "diseño evento corporativo",
      "flyer lanzamiento producto", "flyer jornada profesional",
    ],
    faq: [
      {
        q: "¿Las plantillas se ven profesionales?",
        a: "Sí. Las plantillas corporate usan paletas sobrias, tipografías serias y maquetación limpia.",
      },
      {
        q: "¿Puedo poner el logo de mi empresa?",
        a: "Sí. Subes el logo como imagen, lo escalas y lo posicionas donde quieras.",
      },
    ],
  },
  {
    slug: "galas",
    rawNames: ["Gala"],
    emoji: "🎩",
    h1: "Flyers para galas y eventos premium",
    intro: "Diseña invitaciones para galas benéficas, premios, cenas de empresa y eventos premium. Estilo elegante con dorados, tipografías serif y maquetación sobria.",
    metaTitle: "Flyers para galas · Invitaciones premium · ArteGenIA",
    metaDescription: "Crea invitaciones para galas benéficas, premios y eventos premium. Plantillas elegantes con estilo dorado y tipografía serif.",
    keywords: [
      "flyer gala", "invitación gala", "flyer premios",
      "plantilla invitación premium", "diseño gala benéfica",
      "flyer cena empresa", "invitación elegante",
    ],
    faq: [
      {
        q: "¿Tienen estilo elegante con dorados?",
        a: "Sí. Las plantillas Gala usan paletas joya (dorado, esmeralda, vino) con tipografías serif como Playfair y Cormorant.",
      },
      {
        q: "¿Puedo añadir dress code?",
        a: "Sí. Las plantillas Gala incluyen campos para dress code, RSVP, hora y sala.",
      },
    ],
  },
];

/** Busca por slug con O(N) sobre 7 categorias — no merece map. */
export function getCategorySEO(slug: string): CategorySEO | undefined {
  return CATEGORY_SEO.find(c => c.slug === slug);
}

/** Lista de slugs para generateStaticParams. */
export function getAllCategorySlugs(): string[] {
  return CATEGORY_SEO.map(c => c.slug);
}
