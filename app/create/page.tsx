import AppShell from "@/components/layout/AppShell";

export default function CreatePage() {
    return (
        <AppShell>
            <section className="mx-auto max-w-7xl px-6 py-8">
                <h1 className="text-3xl font-bold">Crear con IA</h1>
                <p className="mt-2 text-gray-400">
                    Aquí se generarán flyers con inteligencia artificial.
                </p>
            </section>
        </AppShell>
    );
}