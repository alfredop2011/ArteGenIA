"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const navLinks = [
        { href: "/create", label: "Crear" },
        { href: "/templates", label: "Plantillas" },
        { href: "/projects", label: "Mis flyers" },
        { href: "/history", label: "Historial" },
    ];

    return (
        <div className="min-h-screen bg-[#0e0e14] text-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0e0e14]/95 backdrop-blur-md">
                <div className="flex items-center justify-between px-6 h-14">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-black text-xs">
                            AG
                        </div>
                        <span className="font-bold text-base tracking-tight">
                            Arte <span className="text-yellow-400">Gen</span>
                        </span>
                    </Link>

                    {/* Nav central */}
                    <nav className="flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        isActive
                                            ? "text-yellow-400 border-b-2 border-yellow-400 rounded-none"
                                            : "text-gray-400 hover:text-white"
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Derecha */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Créditos */}
                        <div className="flex items-center gap-2 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300">
                            <span className="text-yellow-400 font-bold">⚡</span>
                            <span>Créditos</span>
                            <span className="font-bold text-white">17 / 20</span>
                        </div>

                        {/* Notificaciones */}
                        <button className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-colors text-sm">
                            🔔
                        </button>

                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold">
                            A
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
