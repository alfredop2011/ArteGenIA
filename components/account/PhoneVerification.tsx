"use client";

/**
 * PhoneVerification — UI flow OTP para verificar el teléfono del user.
 *
 * 3 estados internos:
 *   - 'idle': muestra el teléfono actual (si hay) o input vacío.
 *     Botón "Enviar código por WhatsApp" arranca el flow.
 *
 *   - 'sent': se mandó el OTP. Input de 6 dígitos + botón "Verificar".
 *     Countdown de 60s antes de poder reenviar.
 *
 *   - 'verified': badge ✓ + botón "Cambiar teléfono" para volver a idle.
 *
 * Errores comunes manejados:
 *   - 429 cooldown: muestra "espera Xs"
 *   - 503 WhatsApp no configurado: muestra "WhatsApp aún no está activo"
 *   - 401 código incorrecto: muestra "código incorrecto" (sin revelar intentos)
 *   - 404 sin código activo: vuelve a idle
 */

import { useEffect, useRef, useState } from "react";
import { Phone, Loader2, CheckCircle2, Send, AlertCircle } from "lucide-react";

type Stage = "idle" | "sent" | "verified";

type Props = {
    initialPhone: string | null;
    initialVerifiedAt: string | null;
    /** Se llama tras verificar OK para que el padre refresque su estado */
    onVerified: (phone: string) => void;
};

export default function PhoneVerification({ initialPhone, initialVerifiedAt, onVerified }: Props) {
    const [stage, setStage] = useState<Stage>(initialVerifiedAt ? "verified" : "idle");
    const [phone, setPhone] = useState(initialPhone ?? "");
    const [code, setCode] = useState("");
    const [verifiedPhone, setVerifiedPhone] = useState(initialVerifiedAt ? initialPhone : null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0); // segundos hasta poder reenviar
    const codeInputRef = useRef<HTMLInputElement | null>(null);

    // Tick del countdown — cuando llega a 0 se puede reenviar
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    // Autofocus en el input de código cuando entramos en 'sent'
    useEffect(() => {
        if (stage === "sent") {
            const timer = setTimeout(() => codeInputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [stage]);

    const sendOtp = async () => {
        setError(null);
        setInfo(null);
        if (phone.trim().length < 8) {
            setError("Introduce un teléfono válido (ej. +34 666 12 34 56)");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/account/phone/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: phone.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error ?? "No se pudo enviar el código");
            }
            setStage("sent");
            setCode("");
            setCooldown(60);
            setInfo(`Te mandamos un código a ${data.phone_e164}. Caduca en 10 min.`);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    const verify = async () => {
        setError(null);
        if (code.replace(/\D/g, "").length !== 6) {
            setError("El código tiene 6 dígitos");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/account/phone/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 404) {
                    setStage("idle");
                    setError("El código expiró. Pide uno nuevo.");
                    return;
                }
                throw new Error(data.error ?? "Código incorrecto");
            }
            setVerifiedPhone(data.phone);
            setPhone(data.phone);
            setStage("verified");
            setInfo(null);
            onVerified(data.phone);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    const changeNumber = () => {
        setStage("idle");
        setCode("");
        setError(null);
        setInfo(null);
        setVerifiedPhone(null);
    };

    return (
        <div className="block mb-4">
            <span className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1.5">
                <Phone size={12} /> Teléfono <span className="text-gray-600 font-normal">(para notificaciones WhatsApp)</span>
            </span>

            {stage === "verified" && verifiedPhone && (
                <div
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.30)" }}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span className="text-sm text-white font-mono truncate">{verifiedPhone}</span>
                        <span className="text-[10px] text-emerald-400 shrink-0">VERIFICADO</span>
                    </div>
                    <button
                        type="button"
                        onClick={changeNumber}
                        className="text-[11px] text-gray-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/[0.05] shrink-0"
                    >
                        Cambiar
                    </button>
                </div>
            )}

            {stage === "idle" && (
                <div className="flex gap-2">
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+34 611 11 11 11"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-white focus:border-purple-500/50 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => void sendOtp()}
                        disabled={loading || phone.trim().length < 8}
                        className="px-4 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                        style={{ background: "linear-gradient(135deg,#25d366,#128c7e)" }}
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        <span className="hidden sm:inline">Enviar código</span>
                    </button>
                </div>
            )}

            {stage === "sent" && (
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        <input
                            ref={codeInputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="\d{6}"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="123456"
                            className="flex-1 px-3 py-2.5 rounded-xl text-base font-mono tracking-[0.5em] text-center bg-white/5 border border-white/10 text-white focus:border-emerald-500/50 focus:outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => void verify()}
                            disabled={loading || code.length !== 6}
                            className="px-4 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                            style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            <span className="hidden sm:inline">Verificar</span>
                        </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                        <button
                            type="button"
                            onClick={changeNumber}
                            className="text-gray-400 hover:text-white"
                        >
                            ← Cambiar número
                        </button>
                        <button
                            type="button"
                            onClick={() => void sendOtp()}
                            disabled={cooldown > 0 || loading}
                            className="text-emerald-400 hover:text-emerald-300 disabled:text-gray-600 disabled:cursor-not-allowed"
                        >
                            {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
                        </button>
                    </div>
                </div>
            )}

            {info && (
                <p className="text-[10px] text-emerald-400/90 mt-1.5">{info}</p>
            )}
            {error && (
                <p className="text-[10px] text-amber-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle size={10} /> {error}
                </p>
            )}
        </div>
    );
}
