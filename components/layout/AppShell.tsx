import Link from "next/link";

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <main className="min-h-screen bg-[#070711] text-white">
            <header className="border-b border-white/10 bg-black/40">
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link href="/" className="text-xl font-black">
                        ArteGenIA
                    </Link>

                    <div className="flex items-center gap-4 text-sm text-gray-300">
                        <Link href="/create" className="hover:text-white">
                            Crear IA
                        </Link>
                        <Link href="/templates" className="hover:text-white">
                            Plantillas
                        </Link>
                        <Link href="/projects" className="hover:text-white">
                            Mis flyers
                        </Link>
                        <Link href="/history" className="hover:text-white">
                            Historial
                        </Link>
                    </div>
                </nav>
            </header>

            {children}
        </main>
    );
}