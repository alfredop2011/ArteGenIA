"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Zap, Bell, Crown, Image as ImageIcon, History, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, profile, loading, signOut } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const navLinks = [
        { href: "/create", label: "Crear" },
        { href: "/templates", label: "Plantillas" },
        { href: "/projects", label: "Mis flyers" },
        { href: "/colaboradores", label: "Colaboradores" },
        { href: "/history", label: "Historial" },
    ];

    const initials = profile?.name
        ? profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() ?? "A";

    return (
        <div className="min-h-screen bg-[#0e0e14] text-white flex flex-col">
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

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
                                <Link key={link.href} href={link.href}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        isActive
                                            ? "text-yellow-400 border-b-2 border-yellow-400 rounded-none"
                                            : "text-gray-400 hover:text-white"
                                    }`}>
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Derecha */}
                    <div className="flex items-center gap-3 shrink-0">
                        {loading ? (
                            <div className="w-20 h-6 bg-white/5 rounded-full animate-pulse" />
                        ) : user ? (
                            <>
                                {/* Créditos reales */}
                                <div className="flex items-center gap-2 border border-white/10 rounded-full px-3 py-1 text-xs text-gray-300">
                                    <Zap size={14} strokeWidth={2.2} className="text-yellow-400 fill-yellow-400" />
                                    <span>Créditos</span>
                                    <span className="font-bold text-white">
                                        {profile?.credits ?? 0} / {profile?.plan === "pro" ? "∞" : "20"}
                                    </span>
                                </div>

                                {/* Notificaciones */}
                                <button aria-label="Notificaciones" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-colors">
                                    <Bell size={15} strokeWidth={1.8} />
                                </button>

                                {/* Avatar + menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold hover:scale-110 transition-transform">
                                        {initials}
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 top-10 w-52 rounded-2xl border border-white/10 bg-[#0f0f1a] shadow-2xl overflow-hidden z-50">
                                            <div className="px-4 py-3 border-b border-white/[0.06]">
                                                <p className="text-white text-sm font-semibold truncate">{profile?.name ?? user.email}</p>
                                                <p className="text-gray-500 text-xs truncate">{user.email}</p>
                                                <span className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${profile?.plan === "pro" ? "bg-yellow-400/20 text-yellow-400" : "bg-white/5 text-gray-400"}`}>
                                                    {profile?.plan === "pro" ? (
                                                        <>
                                                            <Crown size={11} strokeWidth={2.2} className="fill-yellow-400" />
                                                            PRO
                                                        </>
                                                    ) : "Free"}
                                                </span>
                                            </div>
                                            <div className="p-2">
                                                <Link href="/projects" onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                                    <ImageIcon size={15} strokeWidth={1.8} />
                                                    Mis flyers
                                                </Link>
                                                <Link href="/history" onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                                    <History size={15} strokeWidth={1.8} />
                                                    Historial
                                                </Link>
                                                <button
                                                    onClick={() => { signOut(); setShowUserMenu(false); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                                    <LogOut size={15} strokeWidth={1.8} />
                                                    Cerrar sesión
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* Not logged in */
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowAuth(true)}
                                    className="px-4 py-1.5 rounded-xl text-sm text-gray-300 hover:text-white transition-colors">
                                    Iniciar sesión
                                </button>
                                <button onClick={() => setShowAuth(true)}
                                    className="px-4 py-1.5 rounded-xl text-sm font-semibold text-black transition-all hover:scale-105"
                                    style={{ background: "linear-gradient(135deg,#facc15,#f59e0b)" }}>
                                    Regístrate gratis
                                </button>
                            </div>
                        )}
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
