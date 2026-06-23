"use client";

/**
 * RequestPhotoModal — Modal "Solicitar foto" invocado desde la toolbar
 * de imagen del editor.
 *
 * Genera un invite CONTEXTUAL (con project_id + target_layer_id), de modo
 * que cuando el colaborador suba la foto en /upload/[token], el backend
 * la inserte automáticamente en el layer concreto del proyecto.
 *
 * Comparte el visual del InviteModal de ColaboradoresTab pero adapta:
 *  - Title: "Pedir foto al colaborador"
 *  - Subtítulo: explica que la foto se colocará automáticamente
 *  - Mensaje WhatsApp pre-relleno: "Te paso el link para que subas tu foto…"
 */

import { useEffect, useState } from "react";
import { Loader2, Copy, Check, MessageCircle, X } from "lucide-react";

type Props = {
  projectId: string;
  targetLayerId: string;
  projectName?: string | null;
  onClose: () => void;
};

export default function RequestPhotoModal({
  projectId,
  targetLayerId,
  projectName,
  onClose,
}: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/collaborator-invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            target_layer_id: targetLayerId,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "No se pudo crear el link");
        setToken(data.token);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, targetLayerId]);

  const url = token && typeof window !== "undefined"
    ? `${window.location.origin}/upload/${token}`
    : "";

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard puede fallar en algunos contextos */ }
  };

  const flyerLabel = projectName ? `del flyer "${projectName}"` : "del flyer";
  const whatsappText = encodeURIComponent(
    `¡Hola! Necesito tu foto para el diseño ${flyerLabel}. Súbela en este link (se coloca sola en su sitio): ${url}`,
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{
          background: "rgba(15,15,25,0.98)",
          border: "1px solid rgba(168,85,247,0.30)",
          boxShadow: "0 0 40px rgba(168,85,247,0.20), 0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-black mb-1 text-white">Pedir foto al colaborador</h2>
        <p className="text-xs text-gray-400 mb-5 leading-relaxed">
          Comparte este link. Cuando el colaborador suba su foto, se colocará
          automáticamente en esta capa del flyer.
        </p>

        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 py-2">{error}</p>
        )}

        {token && (
          <>
            <div
              className="rounded-xl p-3 mb-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <p className="text-[10px] text-gray-500 mb-1">
                Enlace único · caduca en 7 días · auto-coloca la foto
              </p>
              <p className="text-xs font-mono break-all text-white">{url}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copy}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all text-white"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-400" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copiar
                  </>
                )}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: "#25D366" }}
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
            </div>

            <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
              Te avisaremos por email cuando el colaborador suba la foto. La
              foto también queda guardada en{" "}
              <span className="text-purple-300 font-bold">Colaboradores</span>{" "}
              para reusarla en otros flyers.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
