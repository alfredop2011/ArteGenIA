"use client";

// ════════════════════════════════════════════════════════════════════════════
//  POST-DOWNLOAD MODAL
//
//  Aparece tras una descarga exitosa. Cambio el flow "descarga → fin" al
//  "descarga → siguiente accion" para extender el momento de exito:
//
//   - Compartir (Web Share API si disponible — mobile / PWA)
//   - Copiar imagen al portapapeles (Clipboard API)
//   - Volver al editor
//   - Sugerencia: crear version Story 9:16 si el flyer no es story
//
//  La logica detras es psicologia de momentum: el usuario acaba de completar
//  con exito, esta en peak satisfaction. Aprovechar ese momento para sembrar
//  el "compartir" (viralidad) o el "siguiente flyer" (retencion) tiene 10x
//  mas conversion que pedirselo en otro momento.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { X, Share2, Copy, Check, Smartphone, ArrowRight } from "lucide-react";

type PostDownloadModalProps = {
  /** DataURL (data:image/...;base64,...) de la imagen descargada para
   *  reusarla en compartir/copiar sin pedir el archivo otra vez. */
  imageDataUrl: string;
  /** Formato del archivo descargado (png|jpg). */
  format: "png" | "jpg";
  /** FormatId actual del editor (portrait/square/story/etc) — usado para
   *  decidir si mostrar "Crear version Story". */
  currentFormatId?: string;
  /** Sugerencia opcional al hacer click en "Crear version Story". */
  onCreateStoryVersion?: () => void;
  onClose: () => void;
};

export default function PostDownloadModal({
  imageDataUrl,
  format,
  currentFormatId,
  onCreateStoryVersion,
  onClose,
}: PostDownloadModalProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  // ESC cierra
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Web Share API solo disponible en HTTPS + mobile (mayormente). En desktop
  // Safari y Chrome 89+ tambien — chequeamos en runtime.
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  /** Convierte el dataURL a File para Web Share API. */
  const dataUrlToFile = (): File | null => {
    try {
      const [meta, b64] = imageDataUrl.split(",");
      const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
      const binStr = atob(b64);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
      const ext = format === "jpg" ? "jpg" : "png";
      return new File([bytes], `artegenia-flyer.${ext}`, { type: mime });
    } catch (e) {
      console.error("[PostDownloadModal] dataUrlToFile failed:", e);
      return null;
    }
  };

  const handleShare = async () => {
    if (!canShare) return;
    setSharing(true);
    try {
      const file = dataUrlToFile();
      if (!file) throw new Error("Cannot convert image");
      // Algunos browsers requieren canShare({files}) check antes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (nav.canShare && !nav.canShare({ files: [file] })) {
        // Fallback: share text + link sin la imagen
        await navigator.share({ title: "Mi flyer · ArteGenIA", text: "Hecho con ArteGenIA" });
      } else {
        await navigator.share({ title: "Mi flyer", text: "Hecho con ArteGenIA", files: [file] });
      }
    } catch (e) {
      // Usuario cancelo (AbortError) → silent fail; otro error → log
      if ((e as Error).name !== "AbortError") {
        console.error("[PostDownloadModal] share failed:", e);
      }
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    try {
      // Convertir dataURL a Blob para ClipboardItem
      const res = await fetch(imageDataUrl);
      const blob = await res.blob();
      // ClipboardItem solo soporta png en la mayoria de browsers — si es jpg
      // y falla, descargamos solo el texto como fallback (no ideal pero no rompe).
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("[PostDownloadModal] copy failed:", e);
      // No es critico — el usuario ya tiene el archivo descargado
    }
  };

  const isAlreadyStory = currentFormatId === "story";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-3xl overflow-hidden ag-glass border border-emerald-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Check size={14} strokeWidth={2.8} className="text-emerald-300" />
            </div>
            <h2 className="text-base font-black text-white">Tu flyer está listo</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Preview de la imagen descargada */}
        <div className="p-5 pb-3">
          <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.06] aspect-square flex items-center justify-center mx-auto"
               style={{ maxWidth: 280 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="Flyer descargado" className="max-w-full max-h-full object-contain" />
          </div>
          <p className="text-[11px] text-gray-500 text-center mt-2">
            Descargado como {format.toUpperCase()} · Revísalo en tu carpeta de descargas
          </p>
        </div>

        {/* Acciones primarias */}
        <div className="px-5 pb-5 space-y-2">
          {canShare && (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold transition-all disabled:opacity-60"
            >
              <Share2 size={16} strokeWidth={2.2} />
              {sharing ? "Compartiendo..." : "Compartir"}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white font-semibold transition-all"
          >
            {copied ? (
              <>
                <Check size={16} strokeWidth={2.4} className="text-emerald-300" />
                <span className="text-emerald-200">Copiado al portapapeles</span>
              </>
            ) : (
              <>
                <Copy size={16} strokeWidth={2} />
                Copiar imagen
              </>
            )}
          </button>

          {/* Sugerencia: version Story (9:16) si el actual no lo es */}
          {!isAlreadyStory && onCreateStoryVersion && (
            <button
              onClick={() => { onCreateStoryVersion(); onClose(); }}
              className="w-full flex items-center justify-between gap-2 py-2.5 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 font-semibold transition-all"
            >
              <span className="flex items-center gap-2">
                <Smartphone size={14} strokeWidth={2.2} />
                Crear versión Story (9:16)
              </span>
              <ArrowRight size={14} strokeWidth={2.2} className="opacity-60" />
            </button>
          )}
        </div>

        {/* Footer: volver al editor */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-white/[0.02]">
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-400 hover:text-white transition-colors py-1"
          >
            Seguir editando
          </button>
        </div>
      </div>
    </div>
  );
}
