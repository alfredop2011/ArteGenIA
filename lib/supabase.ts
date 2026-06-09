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
    credits: number;
    created_at: string;
    organizer_type: OrganizerType | null;
    organizer_type_answered_at: string | null;
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
