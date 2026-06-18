/**
 * Eventos hardcoded para validar el diseño visual de /eventos antes de
 * conectar el backend real (tabla `events` + RLS + API).
 *
 * En la próxima fase estos datos vienen de Supabase via fetch en el
 * server component de la página.
 */

export type EventGenre = "techno" | "bachata" | "salsa" | "reggaeton" | "hip-hop" | "kizomba" | "house" | "open";
export type EventCity = "madrid" | "barcelona" | "valencia" | "sevilla";

export interface MockEvent {
  id: string;
  title: string;
  organizerName: string;       // Nombre del DJ/promotora/academia
  startsAt: string;             // ISO datetime
  endsAt?: string;
  venue: string;                // Nombre del local
  address: string;              // Dirección completa
  city: EventCity;
  genre: EventGenre;
  price: number;                // EUR, 0 = gratis
  flyerUrl: string;             // URL imagen flyer/cartel
  ticketsUrl?: string;
}

// Próximos 30 días — fechas relativas al 2026-06-18
export const MOCK_EVENTS: MockEvent[] = [
  {
    id: "evt-1",
    title: "DJ Shadow · Night Transmission",
    organizerName: "DJ Shadow",
    startsAt: "2026-06-21T23:00:00+02:00",
    endsAt: "2026-06-22T06:00:00+02:00",
    venue: "Sala Apolo",
    address: "Carrer Nou de la Rambla, 113",
    city: "barcelona",
    genre: "techno",
    price: 18,
    flyerUrl: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-1.png",
    ticketsUrl: "https://www.sala-apolo.com",
  },
  {
    id: "evt-2",
    title: "Workshop Bachata Sensual con Lucía & Mateo",
    organizerName: "Sala Tropical",
    startsAt: "2026-06-22T18:00:00+02:00",
    endsAt: "2026-06-22T20:00:00+02:00",
    venue: "Sala Tropical",
    address: "C/ Libertad 8",
    city: "madrid",
    genre: "bachata",
    price: 45,
    flyerUrl: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/07_lucia_mateo_pareja.png",
    ticketsUrl: "mailto:bachata@saltatropical.es",
  },
  {
    id: "evt-3",
    title: "Noche Latina · Reggaeton & Bachata",
    organizerName: "Mojito BCN",
    startsAt: "2026-06-25T22:00:00+02:00",
    endsAt: "2026-06-26T05:00:00+02:00",
    venue: "Mojito Club",
    address: "Carrer Rosselló, 217",
    city: "barcelona",
    genre: "reggaeton",
    price: 15,
    flyerUrl: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Cantantes/Cantante-%20(10).png",
  },
  {
    id: "evt-4",
    title: "Underground Hip-Hop · Cypher Night",
    organizerName: "DJ Jooz",
    startsAt: "2026-06-27T22:00:00+02:00",
    endsAt: "2026-06-28T03:00:00+02:00",
    venue: "Sala Villanos",
    address: "C/ Bernardino Obregón 18",
    city: "madrid",
    genre: "hip-hop",
    price: 12,
    flyerUrl: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Musica/Grupos-musica/Grupos-%20(3).png",
  },
  {
    id: "evt-5",
    title: "Kizomba Workshop · João & Catarina",
    organizerName: "Studio Kiz",
    startsAt: "2026-07-05T16:00:00+02:00",
    endsAt: "2026-07-05T20:00:00+02:00",
    venue: "Studio Kiz",
    address: "C/ Mira el Río Alta 17",
    city: "madrid",
    genre: "kizomba",
    price: 70,
    flyerUrl: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/Kizomba-Joa%CC%83o%20y%20Catarina.png",
  },
  {
    id: "evt-6",
    title: "Open Air · House Sunset",
    organizerName: "DJ Maven",
    startsAt: "2026-07-12T18:00:00+02:00",
    endsAt: "2026-07-13T02:00:00+02:00",
    venue: "Azotea Rooftop",
    address: "C/ del Pez 27",
    city: "barcelona",
    genre: "house",
    price: 20,
    flyerUrl: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-2.png",
  },
  {
    id: "evt-7",
    title: "Salsa Cubana · Noche en La Habana",
    organizerName: "Estudio del Sol",
    startsAt: "2026-07-18T22:30:00+02:00",
    venue: "Estudio del Sol",
    address: "C/ Tenerife 5",
    city: "madrid",
    genre: "salsa",
    price: 10,
    flyerUrl: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dance/03_nia_batista_perfil.png",
  },
  {
    id: "evt-8",
    title: "DJ Reggaeton Night · Perreo intenso",
    organizerName: "Sala Totem",
    startsAt: "2026-07-25T00:00:00+02:00",
    endsAt: "2026-07-25T06:00:00+02:00",
    venue: "Sala Totem",
    address: "C/ Magallanes 1",
    city: "madrid",
    genre: "reggaeton",
    price: 15,
    flyerUrl: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/Dj/Dj-3.png",
  },
];

export const CITIES: { id: EventCity | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "madrid", label: "Madrid" },
  { id: "barcelona", label: "Barcelona" },
  { id: "valencia", label: "Valencia" },
  { id: "sevilla", label: "Sevilla" },
];

export const GENRES: { id: EventGenre | "all"; label: string; emoji: string }[] = [
  { id: "all", label: "Todos", emoji: "🎵" },
  { id: "techno", label: "Tecno", emoji: "🎛️" },
  { id: "house", label: "House", emoji: "🏠" },
  { id: "reggaeton", label: "Reggaeton", emoji: "🔥" },
  { id: "bachata", label: "Bachata", emoji: "💃" },
  { id: "salsa", label: "Salsa", emoji: "🌶️" },
  { id: "kizomba", label: "Kizomba", emoji: "🤝" },
  { id: "hip-hop", label: "Hip-Hop", emoji: "🎤" },
];
