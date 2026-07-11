import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Tipo de organizador — recogido vía modal post-registro para analytics.
// Coincide con el enum SQL `organizer_type` de la migration 2026_06_09.
export type OrganizerType =
    | "academia"
    | "productora"
    | "freelance"
    | "institucion"
    | "agencia"
    | "colegio"
    | "otro"
    | "skipped";

export type Profile = {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    plan: "free" | "pro" | "enterprise";
    created_at: string;
    organizer_type: OrganizerType | null;
    organizer_type_answered_at: string | null;
    // Presente solo si el user tiene una suscripción real en Stripe (lo
    // persiste el webhook en checkout.session.completed). Null en planes de
    // cortesía / grants manuales → no hay portal de facturación que abrir.
    stripe_customer_id: string | null;
};

export type Project = {
    id: string;
    user_id: string;
    title: string;
    template_id: number | null;
    fabric_json: object | null;
    thumbnail_url: string | null;
    format: string;
    width: number;
    height: number;
    created_at: string;
    updated_at: string;
};

/** Categorías de eventos — alineadas con la taxonomía del producto. */
export type EventCategory = "fiesta" | "conciertos" | "festival" | "clases" | "club" | "corporativo" | "social" | "teatro";

/** Audiencias ("Para quién es") — coincide con el enum organizer_type. */
export type EventAudience = "academias" | "productoras" | "freelance" | "instituciones" | "agencias" | "colegios";

/**
 * Evento de la agenda cultural pública (/eventos) y del panel /organizador.
 * Migration 2026_06_18_events.sql.
 */
export type EventRow = {
    id: string;
    organizer_id: string | null; // null = enviado por bot, sin reclamar
    submitter_channel: string | null;
    submitter_ref: string | null;
    submitter_name: string | null; // nombre del remitente (bot)
    submitter_email: string | null; // contacto para avisar si falta algún dato
    series_key: string | null; // agrupa ocurrencias de una serie recurrente
    claim_token: string | null;
    title: string;
    description: string | null;
    event_date: string; // ISO yyyy-mm-dd
    event_time: string; // HH:mm
    country: string;
    city: string;
    venue: string;
    neighborhood: string | null;
    category: EventCategory;
    audience: EventAudience[];
    price: number | null; // null = precio no indicado ("Consultar"). Si hay tarifas = precio "desde"
    price_info: string | null; // detalle de tarifas múltiples ("Anticipada 12€ · Taquilla 15€")
    has_online_sale: boolean;
    ticket_url: string | null;
    image_url: string | null;
    image_key: string | null;
    source: "organizer" | "auto";
    status: "draft" | "published" | "cancelled";
    view_count: number;
    click_count: number;
    rsvp_count: number;
    created_at: string;
    updated_at: string;
};

/**
 * Borrador de plantilla creado desde /admin/templates/new.
 * El admin edita el borrador y luego lo publica (lo mueve a templates_published).
 */
export type TemplateDraft = {
    id: string;
    title: string;
    category: string;
    audience: string[];
    internal_tags: string[];
    premium: boolean;
    status: "draft" | "ready" | "archived";
    /** Estructura de Variants serializada (formato + dimensiones + capas) */
    variants: unknown[];
    thumbnail_url: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
};

/**
 * Plantilla publicada por admin. El catalogo /templates lee de aqui
 * MEZCLADO con las plantillas de data/templates.ts.
 */
export type TemplatePublished = {
    id: string;
    draft_id: string | null;
    title: string;
    category: string;
    audience: string[];
    internal_tags: string[];
    premium: boolean;
    variants: unknown[];
    thumbnail_url: string | null;
    published_by: string;
    published_at: string;
    updated_at: string;
};
