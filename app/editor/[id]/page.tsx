import Link from "next/link";
import EditorWorkspace from "@/components/editor/EditorWorkspace";
import GeneratedEditorWrapper from "@/components/editor/GeneratedEditorWrapper";
import { templates } from "@/data/templates";

type EditorPageProps = { params: Promise<{ id: string }> };

export default async function EditorPage({ params }: EditorPageProps) {
    const { id } = await params;
    if (id === "generated") return <GeneratedEditorWrapper />;
    const template = templates.find((item) => item.id === Number(id));
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
    return <EditorWorkspace template={template} />;
}
