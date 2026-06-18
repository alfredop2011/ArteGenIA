"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";

type Props = {
    onClose: () => void;
    /** Override del titulo por defecto (ej. "Descarga tu diseño") */
    title?: string;
    /** Override del subtitulo por defecto (ej. "Inicia sesion para descargar tu diseño. Es gratis.") */
    subtitle?: string;
    /** Callback que se dispara tras login exitoso, ANTES de cerrar el modal.
     *  Util para reintentar una accion (descarga, guardado) que disparo el modal. */
    onAuthSuccess?: () => void;
    /** Ruta a la que volver tras OAuth Google (ej. "/pricing?autostart=pro").
     *  Si no se pasa, vuelve a "/". Útil cuando el modal se abre desde una
     *  página específica que necesita conservar contexto post-login. */
    nextUrl?: string;
};

export default function AuthModal({ onClose, title, subtitle, onAuthSuccess, nextUrl }: Props) {
    const { t } = useLocale();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    // GDPR Art. 7: consentimiento explicito, NO premarcado (jurisprudencia
    // Planet49 C-673/17). Si esto cambia a true por defecto, rompe cumplimiento.
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    // Z.24 — Tras signup exitoso, modal queda esperando confirmación con
    // polling. Cuando el user confirma en otro device, el polling detecta
    // la cuenta activa y hace auto-login en este device.
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
    const pollStartRef = useRef<number>(0);

    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

    const handleSubmit = async () => {
        setError(""); setSuccess("");
        // Validacion legal antes de tocar el backend
        if (mode === "register" && !acceptedTerms) {
            setError(t("auth.error.terms"));
            return;
        }
        setLoading(true);
        try {
            if (mode === "login") {
                const { error } = await signInWithEmail(email, password);
                if (error) throw error;
                onAuthSuccess?.();
                onClose();
            } else {
                const { error } = await signUpWithEmail(email, password, name);
                if (error) throw error;
                // Z.24: en vez de mostrar solo success, esperamos confirmación
                setAwaitingConfirmation(true);
                pollStartRef.current = Date.now();
            }
        } catch (e) {
            setError((e instanceof Error && e.message) || t("auth.error.generic"));
        } finally {
            setLoading(false);
        }
    };

    // Z.24 — Polling cada 4s mientras awaitingConfirmation. Timeout 5 min
    // para no hacer polling infinito si el user nunca confirma.
    useEffect(() => {
        if (!awaitingConfirmation) return;
        let cancelled = false;
        const TIMEOUT_MS = 5 * 60 * 1000;

        const tick = async () => {
            if (cancelled) return;
            if (Date.now() - pollStartRef.current > TIMEOUT_MS) {
                if (!cancelled) {
                    setAwaitingConfirmation(false);
                    setError(t("auth.error.confirmationTimeout"));
                }
                return;
            }
            try {
                const { error: signInErr } = await signInWithEmail(email, password);
                if (cancelled) return;
                if (!signInErr) {
                    // ¡Confirmado! Sesión activa, salimos del modal.
                    onAuthSuccess?.();
                    onClose();
                    return;
                }
                // Error esperado mientras espera confirmación: "Email not confirmed"
                // Cualquier otro error (password mal, rate limit) lo mostramos.
                const msg = (signInErr as { message?: string } | null)?.message ?? "";
                const isNotConfirmed =
                    msg.toLowerCase().includes("not confirmed") ||
                    msg.toLowerCase().includes("no confirmado") ||
                    msg.toLowerCase().includes("confirm");
                if (!isNotConfirmed) {
                    setAwaitingConfirmation(false);
                    setError(msg || t("auth.error.generic"));
                    return;
                }
            } catch {
                // Network errors — seguimos polleando, el siguiente tick reintentará
            }
        };

        // Primer tick inmediato + intervalo
        void tick();
        const id = window.setInterval(tick, 4000);
        return () => { cancelled = true; window.clearInterval(id); };
    }, [awaitingConfirmation, email, password, signInWithEmail, onAuthSuccess, onClose, t]);

    const cancelWaiting = () => {
        setAwaitingConfirmation(false);
        setSuccess(t("auth.success.created"));
    };

    // Z.24 — Pantalla de espera tras signup: polling auto-login.
    if (awaitingConfirmation) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={e => e.target === e.currentTarget && onClose()}>
                <div className="w-full max-w-md mx-4 rounded-3xl p-8 text-center"
                    style={{
                        background: "var(--home-bg-soft)",
                        border: "1px solid rgba(168,85,247,0.35)",
                        boxShadow: "0 0 60px rgba(168,85,247,0.2)",
                        color: "var(--home-text)",
                    }}>
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-purple-500/15 border border-purple-500/35 flex items-center justify-center text-purple-300">
                        <svg className="w-7 h-7 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </div>
                    <h2 className="text-xl font-black mb-2">¡Cuenta creada!</h2>
                    <p className="text-sm mb-3" style={{ color: "var(--home-text-muted)" }}>
                        Te enviamos un email a <b>{email}</b>. Confírmalo desde donde sea (móvil, otro ordenador) y aquí entrarás automáticamente.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[11px] mb-6" style={{ color: "var(--home-text-soft)" }}>
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"/>
                        Esperando confirmación…
                    </div>
                    <button
                        onClick={cancelWaiting}
                        className="text-xs underline opacity-70 hover:opacity-100"
                        style={{ color: "var(--home-text-soft)" }}>
                        Cancelar y volver al login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-md mx-4 rounded-3xl p-8"
                style={{
                    background: "var(--home-bg-soft)",
                    border: "1px solid rgba(168,85,247,0.35)",
                    boxShadow: "0 0 60px rgba(168,85,247,0.2)",
                    color: "var(--home-text)",
                }}>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black" style={{ color: "var(--home-text)" }}>
                            {title ?? (mode === "login" ? t("auth.title.login") : t("auth.title.register"))}
                        </h2>
                        <p className="text-sm mt-1" style={{ color: "var(--home-text-muted)" }}>
                            {subtitle ?? (mode === "login" ? t("auth.subtitle.login") : t("auth.subtitle.register"))}
                        </p>
                    </div>
                    <button onClick={onClose} aria-label="Cerrar" className="text-2xl transition-colors hover:opacity-70" style={{ color: "var(--home-text-soft)" }}>×</button>
                </div>

                <button onClick={() => signInWithGoogle(nextUrl)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all mb-4">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {t("auth.google")}
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px" style={{ background: "var(--home-divider)" }} />
                    <span className="text-xs" style={{ color: "var(--home-text-soft)" }}>{t("auth.divider")}</span>
                    <div className="flex-1 h-px" style={{ background: "var(--home-divider)" }} />
                </div>

                {/* Inputs theme-aware: bg + border + texto desde vars para que
                    funcionen igual en light y dark. */}
                <div className="space-y-3">
                    {mode === "register" && (
                        <input type="text" placeholder={t("auth.placeholder.name")} value={name} onChange={e => setName(e.target.value)}
                            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500"
                            style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)", color: "var(--home-text)" }} />
                    )}
                    <input type="email" placeholder={t("auth.placeholder.email")} value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500"
                        style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)", color: "var(--home-text)" }} />
                    <input type="password" placeholder={t("auth.placeholder.password")} value={password} onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors focus:border-purple-500"
                        style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)", color: "var(--home-text)" }} />
                </div>

                {/* Checkbox de aceptacion obligatoria — solo en registro.
                    GDPR / LSSI: consentimiento explicito antes de crear cuenta. */}
                {mode === "register" && (
                    <label className="flex items-start gap-2 mt-4 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={e => setAcceptedTerms(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 accent-purple-500 cursor-pointer shrink-0"
                        />
                        <span className="text-xs text-gray-400 leading-relaxed">
                            {t("auth.terms.iAccept")}{" "}
                            <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                                {t("auth.terms.linkTerms")}
                            </a>
                            {" "}{t("auth.terms.and")}{" "}
                            <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">
                                {t("auth.terms.linkPrivacy")}
                            </a>
                            .
                        </span>
                    </label>
                )}

                {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
                {success && <p className="text-xs mt-3" style={{ color: "var(--ag-success)" }}>{success}</p>}

                <button onClick={handleSubmit} disabled={loading || (mode === "register" && !acceptedTerms)}
                    className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                    {loading
                        ? t("auth.button.loading")
                        : mode === "login"
                        ? t("auth.button.login")
                        : t("auth.button.register")}
                </button>

                {/* En login tambien mostramos los links para acceso facil */}
                {mode === "login" && (
                    <p className="text-center text-[10px] mt-3" style={{ color: "var(--home-text-soft)" }}>
                        {t("auth.terms.byLogin")}{" "}
                        <a href="/terminos" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: "var(--home-text-muted)" }}>{t("auth.terms.linkTerms")}</a>
                        {" "}{t("auth.terms.and")}{" "}
                        <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: "var(--home-text-muted)" }}>{t("auth.terms.linkPrivacy")}</a>
                        .
                    </p>
                )}

                <p className="text-center text-xs mt-4" style={{ color: "var(--home-text-muted)" }}>
                    {mode === "login" ? t("auth.switch.noAccount") : t("auth.switch.hasAccount")}{" "}
                    <button onClick={() => setMode(mode === "login" ? "register" : "login")}
                        className="text-purple-400 hover:text-purple-300 font-semibold">
                        {mode === "login" ? t("auth.switch.registerAction") : t("auth.switch.loginAction")}
                    </button>
                </p>
            </div>
        </div>
    );
}
