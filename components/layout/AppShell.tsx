"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Zap, Bell, Crown, Image as ImageIcon, History, LogOut, Plus, LayoutGrid, FolderOpen, Menu, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import { isAdmin } from "@/lib/admin";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, profile, loading, signOut } = useAuth();
    const [showAuth, setShowAuth] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const navLinks = [
        { href: "/create", label: "Crear" },
        { href: "/templates", label: "Plantillas" },
        { href: "/projects", label: "Mis flyers" },
        { href: "/colaboradores", label: "Colaboradores" },
        { href: "/history", label: "Historial" },
        ...(isAdmin(user?.email) ? [{ href: "/admin/templates", label: "Admin" }] : []),
    ];

    // Bottom nav mobile: 4 iconos principales + boton Mas
    const mobileBottomNav = [
        { href: "/create", label: "Crear", icon: Plus },
        { href: "/templates", label: "Plantillas", icon: LayoutGrid },
        { href: "/projects", label: "Flyers", icon: FolderOpen },
        { href: "/colaboradores", label: "Equipo", icon: Users },
    ];

    const initials = profile?.name
        ? profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() ?? "A";

    return (
        <div className="min-h-screen bg-[#0e0e14] text-white flex flex-col">
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0e0e14]/95 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 sm:px-6 h-14">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-black text-xs">
                            AG
                        </div>
                        <span className="font-bold text-base tracking-tight">
                            Arte <span className="text-yellow-400">Gen</span>
                        </span>
                    </Link>

                    {/* Nav central - SOLO DESKTOP (md+) */}
                    <nav className="hidden md:flex items-center gap-1">
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
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {loading ? (
                            <div className="w-20 h-6 bg-white/5 rounded-full animate-pulse" />
                        ) : user ? (
                            <>
                                {/* Créditos - compacto en mobile */}
                                <div className="flex items-center gap-1.5 sm:gap-2 border border-white/10 rounded-full px-2 sm:px-3 py-1 text-xs text-gray-300">
                                    <Zap size={14} strokeWidth={2.2} className="text-yellow-400 fill-yellow-400" />
                                    <span className="hidden sm:inline">Créditos</span>
                                    <span className="font-bold text-white">
                                        {profile?.credits ?? 0}<span className="hidden sm:inline">/{profile?.plan === "pro" ? "∞" : "20"}</span>
                                    </span>
                                </div>

                                {/* Notificaciones - SOLO desktop */}
                                <button aria-label="Notificaciones" className="hidden sm:flex w-8 h-8 rounded-full border border-white/10 items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-colors">
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
                                                {isAdmin(user?.email) && (
                                                    <Link href="/admin/templates" onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                                        <Crown size={15} strokeWidth={1.8} />
                                                        Admin
                                                    </Link>
                                                )}
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
                                    className="hidden sm:block px-4 py-1.5 rounded-xl text-sm text-gray-300 hover:text-white transition-colors">
                                    Iniciar sesión
                                </button>
                                <button onClick={() => setShowAuth(true)}
                                    className="px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-black transition-all hover:scale-105"
                                    style={{ background: "linear-gradient(135deg,#facc15,#f59e0b)" }}>
                                    <span className="sm:hidden">Entrar</span>
                                    <span className="hidden sm:inline">Regístrate gratis</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Contenido - padding bottom para que no tape la bottom nav */}
            <main className="flex-1 pb-20 md:pb-0">
                {children}
            </main>

            {/* Bottom Navigation Bar - SOLO MOBILE */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e14]/95 backdrop-blur-md border-t border-white/[0.06] safe-area-bottom">
                <div className="flex items-center justify-around h-16 px-2">
                    {mobileBottomNav.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        const Icon = item.icon;
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                                    isActive ? "text-yellow-400" : "text-gray-400 active:text-white"
                                }`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                    {/* Boton "Mas" - abre menu lateral con links extra */}
                    <button
                        onClick={() => setShowMobileMenu(true)}
                        className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-gray-400 active:text-white">
                        <Menu size={22} strokeWidth={2} />
                        <span className="text-[10px] font-medium">Más</span>
                    </button>
                </div>
            </nav>

            {/* Drawer "Mas" - SOLO MOBILE */}
            {showMobileMenu && (
                <>
                    <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowMobileMenu(false)} />
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f1a] rounded-t-3xl border-t border-white/10 shadow-2xl pb-8 animate-slide-up">
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
                        <div className="px-4 space-y-1">
                            <Link href="/history" onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-300 active:bg-white/10">
                                <History size={20} strokeWidth={1.8} />
                                Historial
                            </Link>
                            {isAdmin(user?.email) && (
                                <Link href="/admin/templates" onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-300 active:bg-white/10">
                                    <Crown size={20} strokeWidth={1.8} />
                                    Admin
                                </Link>
                            )}
                            {user && (
                                <button
                                    onClick={() => { signOut(); setShowMobileMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-red-400 active:bg-red-500/10">
                                    <LogOut size={20} strokeWidth={1.8} />
                                    Cerrar sesión
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
