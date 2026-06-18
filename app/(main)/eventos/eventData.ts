// Datos/typos compartidos entre el Server Component (page.tsx) que carga los
// eventos en SSR y el Client Component (EventosClient.tsx) que los pinta.
// SIN "use client": se puede importar desde el servidor (rowToEvent corre en SSR).

import type { EventRow } from "@/lib/supabase";

export type Category = "fiesta" | "conciertos" | "festival" | "clases" | "club" | "corporativo" | "social";
export type Audience = "academias" | "productoras" | "freelance" | "instituciones" | "agencias" | "colegios";

export type EventItem = {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm
  venue: string;
  neighborhood: string;
  country: string;
  city: string;
  category: Category;
  audience: Audience[];
  price: number | null; // null = precio no indicado ("Consultar precio"). Si hay tarifas = "desde"
  priceInfo?: string | null; // detalle de tarifas múltiples
  url?: string;
  hasSale?: boolean;
  cancelled?: boolean;
  image: string; // gradiente CSS o url(...) del flyer (fondo de la card)
  flyerUrl?: string | null; // URL cruda del flyer (para visor a tamaño completo)
};

// Gradiente por categoría (fondo de la card cuando no hay flyer).
export const CATEGORY_GRAD: Record<Category, string> = {
  fiesta: "linear-gradient(135deg,#ec4899,#f97316)",
  conciertos: "linear-gradient(135deg,#7c3aed,#ec4899)",
  festival: "linear-gradient(135deg,#f59e0b,#ef4444)",
  clases: "linear-gradient(135deg,#10b981,#84cc16)",
  club: "linear-gradient(135deg,#6366f1,#0ea5e9)",
  corporativo: "linear-gradient(135deg,#0ea5e9,#22c55e)",
  social: "linear-gradient(135deg,#06b6d4,#8b5cf6)",
};

// Fondo de la card: flyer real si existe, si no gradiente por categoría.
export function bgFor(category: Category, imageUrl?: string | null) {
  return imageUrl ? `url('${imageUrl}') center/cover no-repeat` : CATEGORY_GRAD[category];
}

// Mapea una fila de Supabase (events) al shape que usa la UI.
export function rowToEvent(r: EventRow): EventItem {
  return {
    id: r.id,
    title: r.title,
    date: r.event_date,
    time: (r.event_time || "20:00").slice(0, 5),
    venue: r.venue,
    neighborhood: r.neighborhood ?? "",
    country: r.country,
    city: r.city,
    category: r.category as Category,
    audience: (r.audience ?? []) as Audience[],
    price: r.price == null ? null : Number(r.price),
    priceInfo: r.price_info ?? null,
    url: r.ticket_url ?? undefined,
    hasSale: r.has_online_sale && !!r.ticket_url,
    cancelled: r.status === "cancelled",
    image: bgFor(r.category as Category, r.image_url),
    flyerUrl: r.image_url ?? null,
  };
}
