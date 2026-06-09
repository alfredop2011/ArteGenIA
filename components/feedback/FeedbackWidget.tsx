"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X, Send, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Widget flotante para enviar feedback. Boton "💬" en la esquina inferior
 * derecha (encima del bottom nav en mobile). Al click → modal con textarea
 * + email opcional + envio.
 *
 * No requiere login. Si esta logueado, el endpoint coge el email
 * automaticamente.
 *
 * Cooldown: tras envio exitoso se oculta el widget 60s (anti spam UI).
 * Persistencia en localStorage para sobrevivir recargas.
 */

const COOLDOWN_KEY = "artegenia-feedback-cooldown-until";
const COOLDOWN_MS = 60_000;

// Rutas donde NO mostramos el widget (editores tienen su UI llena)
const HIDDEN_PATHS = [
  "/editor",
  "/upload",
  "/auth",
];

export default function FeedbackWidget() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ocultar en rutas tecnicas
  const isHidden = HIDDEN_PATHS.some(p => pathname?.startsWith(p));
  if (isHidden) return null;

  // Cooldown post-envio
  const cooldownUntil = typeof window !== "undefined"
    ? Number(localStorage.getItem(COOLDOWN_KEY) || 0)
    : 0;
  const inCooldown = Date.now() < cooldownUntil;
  if (inCooldown && !open) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      setError("Escribe un mensaje");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || undefined,
          page: pathname,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setSentOk(true);
      // Activar cooldown
      try {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_MS));
      } catch { /* ignore */ }
      // Cerrar modal tras 2s
      setTimeout(() => {
        setOpen(false);
        setMessage("");
        setEmail("");
        setSentOk(false);
      }, 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Boton flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Enviar feedback"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg,#7c3aed,#a855f7)",
            boxShadow: "0 4px 20px rgba(168,85,247,0.45)",
            color: "#fff",
          }}
        >
          <MessageCircle size={20} strokeWidth={2.2} />
        </button>
      )}

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6"
          onClick={(e) => e.target === e.currentTarget && !sending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl p-5 sm:p-6 relative"
            style={{
              background: "var(--home-bg-soft)",
              border: "1px solid var(--ag-brand-border)",
              boxShadow: "0 0 60px var(--ag-brand-bg)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-black" style={{ color: "var(--home-text)" }}>
                  Cuéntanos 💬
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--home-text-muted)" }}>
                  Sugerencias, bugs, ideas — lo que sea
                </p>
              </div>
              <button
                onClick={() => !sending && setOpen(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity"
                style={{ color: "var(--home-text-soft)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Success state */}
            {sentOk ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                     style={{ background: "var(--ag-success-bg)", border: "1px solid var(--ag-success-border)", color: "var(--ag-success)" }}>
                  <Check size={22} strokeWidth={2.5} />
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: "var(--home-text)" }}>
                  ¡Gracias por tu feedback!
                </p>
                <p className="text-xs" style={{ color: "var(--home-text-muted)" }}>
                  Lo leemos todo, te leemos pronto.
                </p>
              </div>
            ) : (
              <>
                {/* Form */}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="¿Qué te gustaría decirnos?"
                  rows={4}
                  disabled={sending}
                  maxLength={5000}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus:border-purple-500/50 resize-none disabled:opacity-50"
                  style={{
                    background: "var(--home-card-bg)",
                    border: "1px solid var(--home-card-border)",
                    color: "var(--home-text)",
                  }}
                />

                {/* Email solo si no esta logueado */}
                {!user && (
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Tu email (opcional, para responderte)"
                    disabled={sending}
                    className="w-full mt-2 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors focus:border-purple-500/50 disabled:opacity-50"
                    style={{
                      background: "var(--home-card-bg)",
                      border: "1px solid var(--home-card-border)",
                      color: "var(--home-text)",
                    }}
                  />
                )}

                {error && (
                  <p className="text-xs mt-2" style={{ color: "var(--ag-danger)" }}>
                    {error}
                  </p>
                )}

                {/* Footer info + boton */}
                <div className="flex items-center justify-between mt-4 gap-3">
                  <span className="text-[10px]" style={{ color: "var(--home-text-soft)" }}>
                    {user ? `Como ${user.email}` : "Anónimo si no pones email"}
                  </span>
                  <button
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}
                  >
                    {sending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} strokeWidth={2.4} />
                    )}
                    {sending ? "Enviando…" : "Enviar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
