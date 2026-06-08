"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type Props = {
    onClose: () => void;
    /** Override del titulo por defecto (ej. "Descarga tu diseño") */
    title?: string;
    /** Override del subtitulo por defecto (ej. "Inicia sesion para descargar tu diseño. Es gratis.") */
    subtitle?: string;
    /** Callback que se dispara tras login exitoso, ANTES de cerrar el modal.
     *  Util para reintentar una accion (descarga, guardado) que disparo el modal. */
    onAuthSuccess?: () => void;
};

export default function AuthModal({ onClose, title, subtitle, onAuthSuccess }: Props) {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

    const handleSubmit = async () => {
        setError(""); setSuccess(""); setLoading(true);
        try {
            if (mode === "login") {
                const { error } = await signInWithEmail(email, password);
                if (error) throw error;
                // Login OK: ejecutar callback (descarga, guardado, etc.) y cerrar
                onAuthSuccess?.();
                onClose();
            } else {
                const { error } = await signUpWithEmail(email, password, name);
                if (error) throw error;
                setSuccess("¡Cuenta creada! Revisa tu email para confirmar.");
            }
        } catch (e: any) {
            setError(e.message || "Error al autenticar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="w-full max-w-md mx-4 rounded-3xl p-8"
                style={{ background: "rgba(15,15,25,0.95)", border: "1px solid rgba(168,85,247,0.35)", boxShadow: "0 0 60px rgba(168,85,247,0.2)" }}>

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-white">
                            {title ?? (mode === "login" ? "Iniciar sesión" : "Crear cuenta")}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {subtitle ?? (mode === "login" ? "Bienvenido de vuelta" : "Empieza gratis con 20 créditos")}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">×</button>
                </div>

                <button onClick={() => signInWithGoogle()}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all mb-4">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuar con Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-gray-600 text-xs">o con email</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="space-y-3">
                    {mode === "register" && (
                        <input type="text" placeholder="Tu nombre" value={name} onChange={e => setName(e.target.value)}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-purple-500 transition-colors" />
                    )}
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-purple-500 transition-colors" />
                    <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none focus:border-purple-500 transition-colors" />
                </div>

                {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
                {success && <p className="text-green-400 text-xs mt-3">{success}</p>}

                <button onClick={handleSubmit} disabled={loading}
                    className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                    {loading ? "Cargando..." : mode === "login" ? "Iniciar sesión" : "Crear cuenta gratis"}
                </button>

                <p className="text-center text-gray-500 text-xs mt-4">
                    {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                    <button onClick={() => setMode(mode === "login" ? "register" : "login")}
                        className="text-purple-400 hover:text-purple-300 font-semibold">
                        {mode === "login" ? "Regístrate gratis" : "Inicia sesión"}
                    </button>
                </p>
            </div>
        </div>
    );
}
