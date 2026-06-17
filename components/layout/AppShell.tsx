"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Bell, Crown, Image as ImageIcon, History, LogOut, Plus, LayoutGrid, FolderOpen, Menu, Users, CreditCard, Wand2 } from "lucide-react";
import { CreditsBadge } from "@/components/credits/CreditsBadge";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import { isAdmin } from "@/lib/admin";
import Footer from "@/components/layout/Footer";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";
import { useLocale } from "@/hooks/useLocale";
import OrganizerTypeModal from "@/components/onboarding/OrganizerTypeModal";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";
import WelcomeChecklist from "@/components/onboarding/WelcomeChecklist";
import { ToastProvider } from "@/lib/toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, profile, loading, signOut } = useAuth();
    const { t } = useLocale();
    const [showAuth, setShowAuth] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // ─── ONBOARDING: modal de tipo de organizador ───────────────────────
    // Se muestra automaticamente cuando hay user logueado y NUNCA respondio
    // (organizer_type === null). Tras responder o cerrar, el campo deja
    // de ser null y el modal no vuelve a aparecer.
    //
    // Lo ocultamos en rutas tecnicas (editor, upload) donde el modal
    // interrumpiria un flujo activo. Solo aparece en paginas de "consumo".
    //
    // `organizerAnswered` evita re-abrir el modal mientras el profile
    // todavia tiene null (entre cerrar y refresh del profile).
    const [showOrganizerModal, setShowOrganizerModal] = useState(false);
    const [organizerAnswered, setOrganizerAnswered] = useState(false);
    const isTechnicalRoute = pathname.startsWith("/editor") || pathname.startsWith("/upload");
    useEffect(() => {
        if (organizerAnswered) return;
        if (showOrganizerModal) return;
        if (loading || !user || !profile) return;
        if (profile.organizer_type !== null) return;
        if (isTechnicalRoute) return;
        // Pequeno delay para no abrir el modal al instante de login —
        // que el user vea brevemente la pagina antes.
        const id = setTimeout(() => setShowOrganizerModal(true), 800);
        return () => clearTimeout(id);
    }, [loading, user, profile, isTechnicalRoute, organizerAnswered, showOrganizerModal]);

    // Nav links — labels via t() para idiomatizar. href intacto.
    // Fase V.9 — Capas Mágicas VISIBLE para todos como teaser "Próximamente"
    // (genera expectativa de marketing). Solo admin puede usarla; no-admin
    // ve landing teaser. Cuando esté ready: quitar el badge + el gate del
    // backend + el teaser de la página. Buscar "Fase V.9" en código.
    const userIsAdmin = isAdmin(user?.email);
    // Z.15: "Mis flyers" + "Mis creaciones" se fusionaron en "Mis recursos".
    // Z.15.1: "Colaboradores" también se movió a tab dentro de /mis-recursos
    // para liberar espacio en el nav. Los hrefs viejos siguen via redirect.
    const navLinks = [
        { href: "/create", label: t("nav.create") },
        { href: "/quitar-fondo", label: "Quitar fondo" },
        { href: "/capas-magicas", label: "Capas Mágicas", badge: userIsAdmin ? undefined : "Próximamente" },
        { href: "/templates", label: t("nav.templates") },
        { href: "/mis-recursos", label: "Mis recursos" },
        { href: "/pricing", label: t("nav.pricing") },
        ...(userIsAdmin ? [{ href: "/admin/templates", label: t("nav.admin") }] : []),
    ];

    // Bottom nav mobile: 4 iconos principales + boton Mas. Labels cortos
    // (nav.flyersShort / nav.teamShort) porque el espacio en mobile es justo.
    // Z.15.1: bottom nav mobile — quitamos Colaboradores (ahora dentro de
    // Mis recursos como tab). Añadimos Quitar fondo que era el siguiente
    // candidato más útil (feature destacada accesible a todos).
    const mobileBottomNav = [
        { href: "/create", label: t("nav.create"), icon: Plus },
        { href: "/templates", label: t("nav.templates"), icon: LayoutGrid },
        { href: "/mis-recursos", label: "Recursos", icon: FolderOpen },
        { href: "/quitar-fondo", label: "Sin fondo", icon: Wand2 },
    ];

    const initials = profile?.name
        ? profile.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : user?.email?.[0]?.toUpperCase() ?? "A";

    return (
        <ToastProvider>
        <div className="min-h-screen flex flex-col"
             style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
            {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

            {/* Modal onboarding: pregunta tipo de organizador la primera vez */}
            {showOrganizerModal && (
                <OrganizerTypeModal onClose={() => {
                    setShowOrganizerModal(false);
                    setOrganizerAnswered(true); // evita re-abrir hasta que profile refresque
                }} />
            )}

            {/* Widget flotante de feedback. Se oculta automaticamente en
                rutas tecnicas (/editor, /upload, /auth). */}
            <FeedbackWidget />

            {/* Z.22 — Onboarding checklist para usuarios nuevos (sin proyectos
                aún). Floating bottom-right, dismissable. Solo aparece donde
                NO sea ruta técnica (no en /editor donde estorbaría). */}
            {!isTechnicalRoute && <WelcomeChecklist />}

            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md border-b"
                    style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}>
                <div className="flex items-center justify-between px-4 sm:px-6 h-14">

                    {/* Logo — isotipo real (PNG generado en public/brand/exports/) */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <img
                            src="/brand/exports/icon-180.png"
                            alt="ArteGenIA"
                            className="w-8 h-8 object-contain"
                            width={32}
                            height={32}
                        />
                        <span className="font-bold text-base tracking-tight">
                            Arte<span className="bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">GenIA</span>
                        </span>
                    </Link>

                    {/* Nav central - SOLO DESKTOP (md+) */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link key={link.href} href={link.href}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                                        isActive
                                            ? "text-ag-active border-b-2 border-ag-active rounded-none"
                                            : "text-ag-muted hover:text-ag-primary"
                                    }`}>
                                    {link.label}
                                    {link.badge && (
                                        <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300">
                                            {link.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Derecha */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {/* Idioma + Theme — siempre visibles, antes del auth.
                            Ocultos en mobile super-pequeno solo si no caben. */}
                        <LocaleSwitcher />
                        <ThemeToggle />

                        {loading ? (
                            <div className="w-20 h-6 bg-white/5 rounded-full animate-pulse" />
                        ) : user ? (
                            <>
                                {/* Créditos — Fase Z.1 nuevo sistema unificado.
                                    Lee balance de user_credits via /api/credits.
                                    El campo legacy profile.credits queda intacto pero
                                    sin usar (deprecado, pendiente borrar en Z.x). */}
                                <CreditsBadge plan={profile?.plan} />

                                {/* Notificaciones - SOLO desktop */}
                                <button aria-label={t("nav.notifications")} className="hidden sm:flex w-8 h-8 rounded-full border border-ag items-center justify-center text-ag-muted hover:text-ag-primary transition-colors">
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
                                        <div className="absolute right-0 top-10 w-52 rounded-2xl border shadow-2xl overflow-hidden z-50"
                                             style={{ background: "var(--home-bg-soft)", borderColor: "var(--home-card-border)" }}>
                                            <div className="px-4 py-3 border-b border-ag">
                                                <p className="text-ag-primary text-sm font-semibold truncate">{profile?.name ?? user.email}</p>
                                                <p className="text-ag-soft text-xs truncate">{user.email}</p>
                                                {/* Badge del plan: distingue 3 estados (free / pro / enterprise).
                                                    Antes solo distinguía pro vs el resto → enterprise mostraba "Free". */}
                                                <span className={`inline-flex items-center gap-1 mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    profile?.plan === "enterprise"
                                                        ? "bg-amber-500/15 text-amber-700"
                                                        : profile?.plan === "pro"
                                                            ? "bg-purple-500/15 text-purple-700"
                                                            : "text-ag-muted"
                                                }`}
                                                style={profile?.plan === "free" || !profile?.plan ? { background: "var(--home-card-bg)" } : undefined}>
                                                    {profile?.plan === "enterprise" ? (
                                                        <>
                                                            <Crown size={11} strokeWidth={2.2} />
                                                            Enterprise
                                                        </>
                                                    ) : profile?.plan === "pro" ? (
                                                        <>
                                                            <Crown size={11} strokeWidth={2.2} />
                                                            {t("nav.plan.pro")}
                                                        </>
                                                    ) : t("nav.plan.free")}
                                                </span>
                                            </div>
                                            <div className="p-2">
                                                <Link href="/mis-recursos" onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-ag-muted hover:bg-ag-card hover:text-ag-primary transition-colors">
                                                    <ImageIcon size={15} strokeWidth={1.8} />
                                                    Mis recursos
                                                </Link>
                                                <Link href="/history" onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-ag-muted hover:bg-ag-card hover:text-ag-primary transition-colors">
                                                    <History size={15} strokeWidth={1.8} />
                                                    {t("nav.history")}
                                                </Link>
                                                {isAdmin(user?.email) && (
                                                    <Link href="/admin/templates" onClick={() => setShowUserMenu(false)}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-ag-muted hover:bg-ag-card hover:text-ag-primary transition-colors">
                                                        <Crown size={15} strokeWidth={1.8} />
                                                        {t("nav.admin")}
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => { signOut(); setShowUserMenu(false); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-500/10 transition-colors">
                                                    <LogOut size={15} strokeWidth={1.8} />
                                                    {t("nav.signOut")}
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
                                    className="hidden sm:block px-4 py-1.5 rounded-xl text-sm text-ag-muted hover:text-ag-primary transition-colors">
                                    {t("nav.signIn")}
                                </button>
                                <button onClick={() => setShowAuth(true)}
                                    className="px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all hover:scale-105"
                                    style={{ background: "linear-gradient(135deg, #7E2BFF 0%, #c026d3 50%, #FF1EA8 100%)" }}>
                                    <span className="sm:hidden">{t("nav.signUpShort")}</span>
                                    <span className="hidden sm:inline">{t("nav.signUp")}</span>
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

            {/* Footer con links legales (privacidad, terminos, cookies) */}
            <Footer />

            {/* Bottom Navigation Bar - SOLO MOBILE */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t safe-area-bottom"
                 style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}>
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
                        <span className="text-[10px] font-medium">{t("nav.more")}</span>
                    </button>
                </div>
            </nav>

            {/* Drawer "Mas" - SOLO MOBILE */}
            {showMobileMenu && (
                <>
                    <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowMobileMenu(false)} />
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t shadow-2xl pb-8 animate-slide-up"
                         style={{ background: "var(--home-bg-soft)", borderColor: "var(--home-card-border)" }}>
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
                        <div className="px-4 space-y-1">
                            {/* Quitar fondo: feature destacada, accesible a todos */}
                            <Link href="/quitar-fondo" onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-emerald-300 active:bg-emerald-500/10">
                                <Wand2 size={20} strokeWidth={1.8} />
                                Quitar fondo
                            </Link>
                            {/* Capas Mágicas: visible para todos. Si no admin,
                                badge "Próximamente". La página propia muestra
                                teaser landing si no admin. */}
                            <Link href="/capas-magicas" onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-purple-300 active:bg-purple-500/10">
                                <Wand2 size={20} strokeWidth={1.8} />
                                <span className="flex-1">Capas Mágicas</span>
                                {!userIsAdmin && (
                                    <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-purple-300">
                                        Próximamente
                                    </span>
                                )}
                            </Link>
                            <Link href="/pricing" onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-300 active:bg-white/10">
                                <CreditCard size={20} strokeWidth={1.8} />
                                {t("nav.pricing")}
                            </Link>
                            <Link href="/history" onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-300 active:bg-white/10">
                                <History size={20} strokeWidth={1.8} />
                                {t("nav.history")}
                            </Link>
                            {isAdmin(user?.email) && (
                                <Link href="/admin/templates" onClick={() => setShowMobileMenu(false)}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-gray-300 active:bg-white/10">
                                    <Crown size={20} strokeWidth={1.8} />
                                    {t("nav.admin")}
                                </Link>
                            )}
                            {user && (
                                <button
                                    onClick={() => { signOut(); setShowMobileMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-red-400 active:bg-red-500/10">
                                    <LogOut size={20} strokeWidth={1.8} />
                                    {t("nav.signOut")}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
        </ToastProvider>
    );
}
