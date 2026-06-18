// ⚠️  AUTO-GENERADO por scripts/gen-templates-meta.mjs — NO editar a mano.
// Regenerar tras cambiar data/templates.ts:  node scripts/gen-templates-meta.mjs
//
// Metadata LIGERA del catálogo (sin `layers`). La importan las páginas de
// listado para no arrastrar las ~383 KB de layers al first-load JS. Las layers
// completas viven en data/templates.ts (solo editor + thumbnail lazy).

import type { FormatId } from "./formats";
import type { AudienceId, InternalTag, TemplateLayer, UseCase } from "./templates";

export type TemplateVariantMeta = {
  format: FormatId;
  width: number;
  height: number;
  /** Solo presente en plantillas publicadas (Supabase). Las estáticas resuelven
   *  layers por id desde data/templates.ts dentro del thumbnail. */
  layers?: TemplateLayer[];
};

export type TemplateMeta = {
  id: number;
  title: string;
  category: string;
  image: string;
  premium: boolean;
  audience: AudienceId[];
  internalTags?: InternalTag[];
  useCases?: UseCase[];
  variants: TemplateVariantMeta[];
};

/** Igual que getVariant() pero sobre metadata. Devuelve la variante pedida o la
 *  primera disponible. */
export function getVariantMeta(template: TemplateMeta, formatId?: FormatId): TemplateVariantMeta {
  if (formatId) {
    const v = template.variants.find((x) => x.format === formatId);
    if (v) return v;
  }
  return template.variants[0];
}

export const templatesMeta: TemplateMeta[] = [
  {
    "id": 1,
    "title": "Don Filosofín Live",
    "category": "Concierto",
    "image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800",
    "premium": true,
    "audience": [
      "productoras",
      "freelance"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 2,
    "title": "Evento Premium",
    "category": "Gala",
    "image": "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
    "premium": false,
    "audience": [
      "productoras",
      "instituciones",
      "agencias"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 3,
    "title": "Bachata Nights",
    "category": "Fiesta",
    "image": "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 4,
    "title": "Vibra Fest",
    "category": "Festival",
    "image": "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=800",
    "premium": true,
    "audience": [
      "productoras",
      "agencias"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 5,
    "title": "Clases de Baile — Neón",
    "category": "Clases",
    "image": "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?q=80&w=800",
    "premium": false,
    "audience": [
      "academias"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 6,
    "title": "Dance Class — Workshop",
    "category": "Clases",
    "image": "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800",
    "premium": true,
    "audience": [
      "academias",
      "colegios"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 7,
    "title": "Neon Night",
    "category": "Club / Discoteca",
    "image": "https://images.unsplash.com/photo-1571266028243-d220c6a82b8d?q=80&w=800",
    "premium": true,
    "audience": [
      "productoras",
      "freelance"
    ],
    "variants": [
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 8,
    "title": "Latin Heat",
    "category": "Fiesta",
    "image": "https://images.unsplash.com/photo-1545959570-a94084071b5d?q=80&w=800",
    "premium": true,
    "audience": [
      "productoras",
      "academias"
    ],
    "variants": [
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 9,
    "title": "Festival Pop",
    "category": "Festival",
    "image": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800",
    "premium": true,
    "audience": [
      "productoras",
      "agencias"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 10,
    "title": "Black Tie",
    "category": "Corporativo",
    "image": "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?q=80&w=800",
    "premium": true,
    "audience": [
      "instituciones",
      "agencias"
    ],
    "variants": [
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 11,
    "title": "Street Wave",
    "category": "Fiesta",
    "image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800",
    "premium": true,
    "audience": [
      "productoras",
      "freelance"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 15,
    "title": "Crossover 5 Artistas Demo",
    "category": "Fiesta",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 16,
    "title": "Concierto Rock",
    "category": "Conciertos",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(10).png",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 17,
    "title": "Concierto Urban",
    "category": "Conciertos",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 18,
    "title": "Concierto Premium",
    "category": "Conciertos",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(14).png",
    "premium": true,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 19,
    "title": "Festival Multi-Banda",
    "category": "Conciertos",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(3).png",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 20,
    "title": "Gira Nacional",
    "category": "Conciertos",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(8).png",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 21,
    "title": "Concierto Único",
    "category": "Conciertos",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(7).png",
    "premium": true,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 22,
    "title": "Noche Latina",
    "category": "Fiesta",
    "image": "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?q=80&w=600",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 23,
    "title": "Neon Night",
    "category": "Fiesta",
    "image": "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 24,
    "title": "Festival Summer",
    "category": "Fiesta",
    "image": "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 25,
    "title": "Noche en Vivo",
    "category": "Fiesta",
    "image": "https://images.unsplash.com/photo-1545959570-a94084071b5d?q=80&w=600",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 26,
    "title": "Concierto Acústico",
    "category": "Conciertos",
    "image": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=600",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 27,
    "title": "Clase Abierta",
    "category": "Clases",
    "image": "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=600",
    "premium": false,
    "audience": [
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 28,
    "title": "Gran Gala",
    "category": "Fiesta",
    "image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600",
    "premium": true,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      }
    ]
  },
  {
    "id": 29,
    "title": "Cartel Vintage",
    "category": "Conciertos",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(10).png",
    "premium": true,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 30,
    "title": "Vinyl Cover",
    "category": "Club / Discoteca",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
    "premium": false,
    "audience": [
      "productoras"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 31,
    "title": "Cartelera 5",
    "category": "Fiesta",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
    "premium": false,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 32,
    "title": "Postal Banda",
    "category": "Conciertos",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(7).png",
    "premium": true,
    "audience": [
      "productoras",
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 33,
    "title": "Solista Editorial",
    "category": "Gala",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(14).png",
    "premium": true,
    "audience": [
      "productoras",
      "agencias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 34,
    "title": "Ruido Fest",
    "category": "Festival",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(3).png",
    "premium": false,
    "audience": [
      "productoras"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 35,
    "title": "Workshop Bachata Sensual",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png",
    "premium": true,
    "audience": [
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 36,
    "title": "Clases Semanales",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-jean.png",
    "premium": false,
    "audience": [
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 37,
    "title": "Taller Flamenco",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profe-baileAnamaria.png",
    "premium": true,
    "audience": [
      "academias",
      "instituciones"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 38,
    "title": "Ciclo 3 Maestros",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
    "premium": true,
    "audience": [
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 39,
    "title": "Bachata Principiantes",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/05_valentina_damian_pareja.png",
    "premium": false,
    "audience": [
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 40,
    "title": "Intensivo Fin de Semana",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/06_isabela_alejandro_pareja.png",
    "premium": true,
    "audience": [
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 41,
    "title": "Tango Argentino",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png",
    "premium": true,
    "audience": [
      "academias",
      "instituciones"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 42,
    "title": "Salsa Cubana",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/02_damian_reyes_perfil.png",
    "premium": false,
    "audience": [
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 43,
    "title": "Urban Hip-Hop",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/04_malik_santos_perfil.png",
    "premium": false,
    "audience": [
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 44,
    "title": "Kizomba Workshop",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Kizomba-Joa%CC%83o%20y%20Catarina.png",
    "premium": true,
    "audience": [
      "academias"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 45,
    "title": "Urbano Latino con Elena",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Elena-grupales.png",
    "premium": true,
    "audience": [
      "academias",
      "instituciones"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 46,
    "title": "Urbano Latino con Marco",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Profesores_Baile_Urbano_Latino_Marco_grupales.png",
    "premium": true,
    "audience": [
      "academias",
      "instituciones"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 47,
    "title": "Baile Mayores con Martha",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores%20-Martha-grupo.png",
    "premium": false,
    "audience": [
      "academias",
      "instituciones"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 48,
    "title": "Baile Mayores con Paco",
    "category": "Clases",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/profe%20maduro%20o%20bailarines%20mayores-grupales-Paco.png",
    "premium": false,
    "audience": [
      "academias",
      "instituciones"
    ],
    "internalTags": [
      "beta"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "fb-cover",
        "width": 1920,
        "height": 1005
      }
    ]
  },
  {
    "id": 49,
    "title": "DJ Urban Night",
    "category": "Club / Discoteca",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
    "premium": false,
    "audience": [
      "productoras",
      "freelance"
    ],
    "internalTags": [
      "beta"
    ],
    "useCases": [
      "promote",
      "sellTickets",
      "announceArtist"
    ],
    "variants": [
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      },
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 50,
    "title": "DJ Electronic Pulse",
    "category": "Club / Discoteca",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
    "premium": false,
    "audience": [
      "productoras",
      "freelance"
    ],
    "internalTags": [
      "beta"
    ],
    "useCases": [
      "promote",
      "sellTickets",
      "announceArtist"
    ],
    "variants": [
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      }
    ]
  },
  {
    "id": 51,
    "title": "DJ Reggaeton Night",
    "category": "Club / Discoteca",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png",
    "premium": false,
    "audience": [
      "productoras",
      "freelance"
    ],
    "internalTags": [
      "beta"
    ],
    "useCases": [
      "promote",
      "sellTickets",
      "announceArtist"
    ],
    "variants": [
      {
        "format": "story",
        "width": 1080,
        "height": 1920
      },
      {
        "format": "square",
        "width": 1080,
        "height": 1080
      }
    ]
  },
  {
    "id": 52,
    "title": "DJ Techno Dark",
    "category": "Club / Discoteca",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
    "premium": false,
    "audience": [
      "productoras",
      "freelance"
    ],
    "internalTags": [
      "complete"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 53,
    "title": "DJ Day Pool",
    "category": "Club / Discoteca",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
    "premium": false,
    "audience": [
      "productoras",
      "freelance"
    ],
    "internalTags": [
      "complete"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  },
  {
    "id": 54,
    "title": "DJ Festival Multi",
    "category": "Festival",
    "image": "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
    "premium": false,
    "audience": [
      "productoras"
    ],
    "internalTags": [
      "complete"
    ],
    "variants": [
      {
        "format": "portrait",
        "width": 1080,
        "height": 1350
      }
    ]
  }
];
