import Link from "next/link";
import EditorRouter from "@/components/editor/EditorRouter";
import GeneratedEditor from "@/components/editor/GeneratedEditor";
import GeneratedEditorWrapper from "@/components/editor/GeneratedEditorWrapper";
import { templates } from "@/data/templates";
import { isValidFormatId, type FormatId } from "@/data/formats";

type EditorPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ format?: string }>;
};

// UUID v4 pattern, used by Supabase for projects.id
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditorPage({ params, searchParams }: EditorPageProps) {
    const { id } = await params;
    const sp = await searchParams;

    // Modo "generated" — flyer generado desde el wizard, lee localStorage
    // (TODO: mobile editor para este modo en proximas sesiones)
    if (id === "generated") return <GeneratedEditorWrapper />;

    // Modo "proyecto guardado" — id es un UUID de Supabase
    // (TODO: mobile editor para proyectos guardados en proximas sesiones)
    if (UUID_RE.test(id)) {
        return <GeneratedEditor projectId={id} />;
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

    // Resolver formato pedido o el primero disponible
    const requestedFormat = sp.format;
    const formatId: FormatId | undefined =
        requestedFormat && isValidFormatId(requestedFormat)
            ? (requestedFormat as FormatId)
            : undefined;

    // EditorRouter elige MobileEditor (< 768px) o GeneratedEditor (desktop)
    return <EditorRouter templateId={templateId} formatId={formatId} />;
}
