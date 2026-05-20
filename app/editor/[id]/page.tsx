import Link from "next/link";
import GeneratedEditor from "@/components/editor/GeneratedEditor";
import GeneratedEditorWrapper from "@/components/editor/GeneratedEditorWrapper";
import { templates } from "@/data/templates";

type EditorPageProps = { params: Promise<{ id: string }> };

// UUID v4 pattern, used by Supabase for projects.id
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditorPage({ params }: EditorPageProps) {
    const { id } = await params;

    // Modo "generated" — flyer generado desde el wizard, lee localStorage
    if (id === "generated") return <GeneratedEditorWrapper />;

    // Modo "proyecto guardado" — id es un UUID de Supabase
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

    // Pasamos solo el id al Client Component — el editor resuelve la plantilla por sí mismo
    return <GeneratedEditor templateId={templateId} />;
}
