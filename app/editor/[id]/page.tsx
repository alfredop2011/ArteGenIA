import Link from "next/link";
import EditorRouter from "@/components/editor/EditorRouter";
import GeneratedEditor from "@/components/editor/GeneratedEditor";
import GeneratedEditorWrapper from "@/components/editor/GeneratedEditorWrapper";
import PublishedTemplateLoader from "@/components/editor/PublishedTemplateLoader";
import { templates } from "@/data/templates";
import { isValidFormatId, type FormatId } from "@/data/formats";
import { getTemplateOverride } from "@/lib/templateOverrides";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/admin";

// SIN CACHE. Cuando un admin edita y guarda oficial una plantilla, la
// siguiente carga del editor DEBE leer el override fresco. Con cache de
// Next.js el server component servía la versión anterior y el usuario
// veía en el editor un diseño distinto al que acababa de guardar.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type EditorPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ format?: string; mode?: string }>;
};

// UUID v4 pattern, used by Supabase for projects.id
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Pattern para drafts admin: draft-{uuid}
const DRAFT_RE = /^draft-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
// Pattern para plantillas publicadas: published-{uuid}
const PUBLISHED_RE = /^published-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export default async function EditorPage({ params, searchParams }: EditorPageProps) {
    const { id } = await params;
    const sp = await searchParams;

    // Resolver formato pedido o el primero disponible
    const requestedFormat = sp.format;
    const formatId: FormatId | undefined =
        requestedFormat && isValidFormatId(requestedFormat)
            ? (requestedFormat as FormatId)
            : undefined;

    // Modo "draft-{uuid}" — borrador admin de plantilla
    // Sesion 4 creador: usa GeneratedEditor con prop draftId (no TemplateCreatorWrapper)
    const draftMatch = id.match(DRAFT_RE);
    if (draftMatch) {
        return <GeneratedEditor draftId={draftMatch[1]} formatId={formatId} />;
    }

    // Modo "published-{uuid}" — plantilla publicada (loader que la inyecta en localStorage)
    const publishedMatch = id.match(PUBLISHED_RE);
    if (publishedMatch) {
        return <PublishedTemplateLoader publishedId={publishedMatch[1]} formatId={formatId} />;
    }

    // Modo "generated" — flyer generado desde el wizard, lee localStorage
    if (id === "generated") return <GeneratedEditorWrapper />;

    // Modo "proyecto guardado" — id es un UUID de Supabase.
    // EditorRouter elige mobile V3 o desktop segun viewport.
    if (UUID_RE.test(id)) {
        return <EditorRouter projectId={id} formatId={formatId} />;
    }

    // Modo plantilla — id numérico, busca en data/templates.ts
    const templateId = Number(id);
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
        return (
            <section className="mx-auto max-w-7xl px-6 py-8">
                <h1 className="text-3xl font-bold">Plantilla no encontrada</h1>
                <p className="mt-2 text-gray-400">La plantilla que intentas editar no existe.</p>
                <Link href="/templates" className="mt-6 inline-block rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-500">
                    Volver a plantillas
                </Link>
            </section>
        );
    }

    // Override guardado por admin desde el editor visual — reemplaza variants
    // del catálogo estático. Se aplica sin recompilar.
    const [override, adminUser] = await Promise.all([
        getTemplateOverride(templateId),
        (async () => {
            const supabase = await createSupabaseServerClient();
            const { data: { user } } = await supabase.auth.getUser();
            return user && isAdmin(user.email) ? true : false;
        })(),
    ]);

    // EditorRouter elige MobileEditorV3 (< 768px) o GeneratedEditor (desktop)
    return (
        <EditorRouter
            templateId={templateId}
            formatId={formatId}
            overrideVariants={override?.variants}
            isAdminUser={adminUser}
            hasOverride={override !== null}
        />
    );
}
