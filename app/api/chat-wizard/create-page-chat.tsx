"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { EventData, ChatMessage, WizardResponse } from "@/app/api/chat-wizard/route";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MessageType = "text" | "photo_choice" | "photo_upload";

type UIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: MessageType;
  isLoading?: boolean;
  photoDataUrl?: string;
};

type ArtistSlot = {
  id: string;
  name: string;
  photoDataUrl: string | null;
  fileName: string | null;
};

type AppPhase = "chat" | "style" | "generating";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STYLE_OPTIONS = [
  { id: "urbano",   label: "Urbano",   emoji: "🏙️" },
  { id: "elegante", label: "Elegante", emoji: "✨" },
  { id: "neon",     label: "Neón",     emoji: "💜" },
  { id: "festival", label: "Festival", emoji: "🎪" },
  { id: "minima",   label: "Minimal",  emoji: "◻️" },
  { id: "retro",    label: "Retro",    emoji: "🎞️" },
];

const COLOR_PALETTES = [
  { id: "dorado", colors: ["#f5c518", "#7c3aed", "#0d0d1a"], label: "Dorado & Morado" },
  { id: "neon",   colors: ["#00f5ff", "#ff00aa", "#0a0a1a"], label: "Neón" },
  { id: "rojo",   colors: ["#ef4444", "#111827", "#f9fafb"], label: "Rojo & Negro" },
  { id: "verde",  colors: ["#22c55e", "#064e3b", "#f0fdf4"], label: "Verde Naturaleza" },
  { id: "rosa",   colors: ["#ec4899", "#be185d", "#fdf2f8"], label: "Rosa Vibrante" },
  { id: "azul",   colors: ["#3b82f6", "#1e3a5f", "#eff6ff"], label: "Azul Profundo" },
];

const FORMAT_OPTIONS = [
  { id: "instagram", label: "Instagram", size: "1080×1350", icon: "📱" },
  { id: "historia",  label: "Historia",  size: "1080×1920", icon: "⬆️" },
  { id: "cuadrado",  label: "Cuadrado",  size: "1080×1080", icon: "⬜" },
  { id: "evento",    label: "Evento",    size: "1920×1080", icon: "🖥️" },
];

const AI_STEPS = [
  { id: 1, label: "Analizando evento",      sub: "Procesando la información" },
  { id: 2, label: "Eligiendo estilo",       sub: "Seleccionando paleta y tipografías" },
  { id: 3, label: "Generando fondo",        sub: "Creando atmósfera visual con IA" },
  { id: 4, label: "Procesando artistas",    sub: "Eliminando fondos de las fotos" },
  { id: 5, label: "Componiendo capas",      sub: "Nombre, lugar, precio, fecha" },
  { id: 6, label: "Preparando variaciones", sub: "3 versiones del diseño" },
];

const EMPTY_EVENT: EventData = {
  eventName: null, eventType: null, date: null, time: null,
  venue: null, city: null, price: null, artists: [],
  flyerType: null, visualStyle: null, extraNotes: null,
  readyToGenerate: false, artistCount: 1, needsPhotoUpload: false,
};

function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function DataPill({ icon, value }: { icon: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5 text-xs">
      <span className="shrink-0">{icon}</span>
      <span className="text-white font-medium leading-snug">{value}</span>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-purple-400 inline-block"
          style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
      ))}
    </div>
  );
}

// Photo choice card that appears in the chat stream
function PhotoChoiceCard({
  onChoice,
}: {
  onChoice: (choice: "upload" | "ai" | "none") => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-3 gap-2 max-w-xs">
      {[
        { id: "upload" as const, icon: "📸", label: "Subir foto",      sub: "del artista" },
        { id: "ai"     as const, icon: "✨", label: "IA genera",       sub: "visual" },
        { id: "none"   as const, icon: "🚫", label: "Sin foto",        sub: "solo diseño" },
      ].map(opt => (
        <button key={opt.id} onClick={() => onChoice(opt.id)}
          className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl border border-white/10 bg-white/[0.04] hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-center">
          <span className="text-2xl">{opt.icon}</span>
          <span className="text-xs font-semibold text-white">{opt.label}</span>
          <span className="text-[10px] text-gray-500">{opt.sub}</span>
        </button>
      ))}
    </div>
  );
}

// Photo upload card that appears in the chat stream
function PhotoUploadCard({
  slot,
  onUpload,
  onRemove,
  onConfirm,
}: {
  slot: ArtistSlot;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onConfirm: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onUpload(file);
  };

  return (
    <div className="mt-2 max-w-xs space-y-2">
      <input type="file" accept="image/*" ref={fileRef}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }}
        className="hidden" />

      {slot.photoDataUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-purple-500/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slot.photoDataUrl} alt="Artist" className="w-full h-40 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <button onClick={() => fileRef.current?.click()}
              className="text-[10px] bg-white/90 text-black px-2 py-1 rounded-full font-semibold hover:bg-white transition-all">
              Cambiar
            </button>
            <button onClick={onRemove}
              className="text-[10px] bg-red-500/90 text-white px-2 py-1 rounded-full font-semibold hover:bg-red-500 transition-all">
              Quitar
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-[11px] text-white truncate">{slot.fileName}</p>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
            isDragging ? "border-purple-400 bg-purple-500/10" : "border-white/15 hover:border-purple-500/40 bg-white/[0.02]"
          }`}>
          <span className="text-3xl">📸</span>
          <p className="text-xs text-gray-400">Arrastra o haz clic para subir</p>
          <p className="text-[10px] text-gray-600">JPG, PNG, WEBP</p>
        </div>
      )}

      {slot.photoDataUrl && (
        <button onClick={onConfirm}
          className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all">
          Continuar con esta foto →
        </button>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CreatePage() {
  const router = useRouter();

  // Chat
  const [messages, setMessages] = useState<UIMessage[]>([{
    id: uid(), role: "assistant", type: "text",
    content: "¡Hola! Soy tu asistente para crear flyers profesionales.\n\nCuéntame sobre tu evento — puedes escribir algo como:\n\"Concierto de rock este viernes en Madrid\" o \"Festival de salsa el sábado con 3 artistas\".",
  }]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // Event data (local cache — only sent to AI when needed)
  const [eventData, setEventData] = useState<EventData>(EMPTY_EVENT);
  const [ctaLabel, setCtaLabel] = useState<"continue" | "generate" | "confirm">("continue");

  // Recent context for AI (last 4 msg pairs only — cost optimization)
  const [recentContext, setRecentContext] = useState<ChatMessage[]>([]);

  // Photo upload
  const [artistSlot, setArtistSlot] = useState<ArtistSlot>({
    id: "artist-0", name: "", photoDataUrl: null, fileName: null,
  });
  const [photoChoiceShown, setPhotoChoiceShown] = useState(false);
  const [photoUploadShown, setPhotoUploadShown] = useState(false);

  // Phase
  const [phase, setPhase] = useState<AppPhase>("chat");

  // Style
  const [selectedStyle, setSelectedStyle] = useState("urbano");
  const [selectedPalette, setSelectedPalette] = useState("dorado");
  const [selectedFormat, setSelectedFormat] = useState("instagram");

  // Generating
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── SEND MESSAGE ─────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isThinking) return;

    const trimmed = userText.trim();
    const userMsg: UIMessage = { id: uid(), role: "user", type: "text", content: trimmed };
    const loadingMsg: UIMessage = { id: uid(), role: "assistant", type: "text", content: "", isLoading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsThinking(true);

    // Build recent context window (last 4 pairs = 8 messages)
    const newContext: ChatMessage[] = [
      ...recentContext,
      { role: "user", content: trimmed },
    ].slice(-8);

    try {
      const res = await fetch("/api/chat-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latestUserMessage: trimmed,
          currentEventData: eventData,
          recentContext: recentContext.slice(-4),
        }),
      });

      const data: WizardResponse = await res.json();

      const assistantMsg: UIMessage = {
        id: uid(), role: "assistant", type: "text",
        content: data.message,
      };

      setMessages(prev => {
        const withoutLoading = prev.slice(0, -1);
        const updated = [...withoutLoading, assistantMsg];

        // If AI wants photo upload, add the choice card
        if (data.showPhotoUpload && !photoChoiceShown) {
          updated.push({
            id: uid(), role: "assistant", type: "photo_choice", content: "",
          });
        }
        return updated;
      });

      if (data.showPhotoUpload && !photoChoiceShown) {
        setPhotoChoiceShown(true);
      }

      setRecentContext([
        ...newContext,
        { role: "assistant", content: data.message },
      ].slice(-8));

      setEventData(data.eventData);
      setCtaLabel(data.ctaLabel);

    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { id: uid(), role: "assistant", type: "text", content: "Ups, algo salió mal. Inténtalo de nuevo." },
      ]);
    } finally {
      setIsThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isThinking, recentContext, eventData, photoChoiceShown]);

  // ─── PHOTO CHOICE HANDLER ──────────────────────────────────────────────────

  const handlePhotoChoice = useCallback((choice: "upload" | "ai" | "none") => {
    // Remove the choice card from messages
    setMessages(prev => prev.filter(m => m.type !== "photo_choice"));

    if (choice === "upload") {
      const userMsg: UIMessage = { id: uid(), role: "user", type: "text", content: "Quiero subir la foto del artista." };
      const uploadCard: UIMessage = { id: uid(), role: "assistant", type: "photo_upload", content: "" };
      setMessages(prev => [...prev, userMsg, uploadCard]);
      setPhotoUploadShown(true);
      setEventData(prev => ({ ...prev, flyerType: "with_photo", needsPhotoUpload: true }));
    } else if (choice === "ai") {
      const userMsg: UIMessage = { id: uid(), role: "user", type: "text", content: "Prefiero que la IA genere el visual." };
      setMessages(prev => [...prev, userMsg]);
      setEventData(prev => ({ ...prev, flyerType: "no_photo", needsPhotoUpload: false }));
      sendMessage("Prefiero que la IA genere el visual, sin foto del artista.");
    } else {
      const userMsg: UIMessage = { id: uid(), role: "user", type: "text", content: "Sin foto, solo el diseño." };
      setMessages(prev => [...prev, userMsg]);
      setEventData(prev => ({ ...prev, flyerType: "no_photo", needsPhotoUpload: false }));
      sendMessage("Sin foto, continuemos con el diseño.");
    }
  }, [sendMessage]);

  // ─── PHOTO UPLOAD HANDLER ─────────────────────────────────────────────────

  const handlePhotoUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = ev => {
      setArtistSlot(prev => ({
        ...prev,
        photoDataUrl: ev.target?.result as string,
        fileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePhotoConfirm = useCallback(() => {
    // Remove upload card, add confirmation message
    setMessages(prev => prev.filter(m => m.type !== "photo_upload"));
    const confirmMsg: UIMessage = {
      id: uid(), role: "user", type: "text",
      content: `Foto del artista subida: ${artistSlot.fileName}`,
    };
    setMessages(prev => [...prev, confirmMsg]);
    setPhotoUploadShown(false);
    // Continue conversation
    sendMessage("Ya subí la foto del artista. Continuemos.");
  }, [artistSlot.fileName, sendMessage]);

  // ─── CTA HANDLER ──────────────────────────────────────────────────────────

  const handleCTA = useCallback(() => {
    if (ctaLabel === "generate") {
      setPhase("style");
    } else if (ctaLabel === "confirm") {
      sendMessage("Sí, todo correcto. Generar el flyer.");
    } else {
      inputRef.current?.focus();
    }
  }, [ctaLabel, sendMessage]);

  // ─── GENERATION ───────────────────────────────────────────────────────────

  const animateStep = useCallback((step: number, duration: number) =>
    new Promise<void>(res => {
      setCurrentStep(step);
      setStepProgress(0);
      const start = Date.now();
      const tick = () => {
        const pct = Math.min((Date.now() - start) / duration * 100, 100);
        setStepProgress(pct);
        if (pct < 100) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    }), []);

  const animateWhileFetching = useCallback(<T,>(step: number, promise: Promise<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      setCurrentStep(step);
      setStepProgress(0);
      const start = Date.now();
      let done = false;
      const tick = () => {
        if (done) return;
        const pct = 90 * (1 - Math.exp(-(Date.now() - start) / 4000));
        setStepProgress(pct);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      promise.then(
        v => { done = true; setStepProgress(100); setTimeout(() => resolve(v), 200); },
        e => { done = true; reject(e); }
      );
    }), []);

  const handleGenerate = useCallback(async () => {
    setPhase("generating");
    try {
      await animateStep(1, 600);
      await animateStep(2, 500);

      const paletteObj = COLOR_PALETTES.find(p => p.id === selectedPalette) ?? COLOR_PALETTES[0];
      const promptText = [
        eventData.eventName, eventData.eventType,
        eventData.date, eventData.city, eventData.venue,
      ].filter(Boolean).join(", ");

      const bgResult = await animateWhileFetching(3,
        fetch("/api/generate-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptText,
            style: selectedStyle,
            palette: { id: paletteObj.id, name: paletteObj.label, colors: paletteObj.colors },
            format: selectedFormat,
          }),
        }).then(async r => {
          if (!r.ok) throw new Error(`generate-bg ${r.status}`);
          return r.json() as Promise<{ url: string; width: number; height: number }>;
        })
      );

      let artistUrl: string | null = null;
      if (artistSlot.photoDataUrl && eventData.flyerType === "with_photo") {
        const [meta, b64] = artistSlot.photoDataUrl.split(",");
        const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
        const bin = atob(b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const blob = new Blob([u8], { type: mime });
        const fd = new FormData();
        fd.append("image_file", blob, artistSlot.fileName ?? "artist.png");

        const result = await animateWhileFetching(4,
          fetch("/api/remove-bg", { method: "POST", body: fd })
            .then(async r => {
              if (!r.ok) throw new Error(`remove-bg ${r.status}`);
              return r.json() as Promise<{ url: string }>;
            })
        );
        artistUrl = result.url;
      } else {
        await animateStep(4, 400);
      }

      await animateStep(5, 700);
      await animateStep(6, 600);

      try {
        localStorage.setItem("artegenia_generated", JSON.stringify({
          eventName: eventData.eventName ?? "",
          eventDate: [eventData.date, eventData.time].filter(Boolean).join(" · "),
          eventVenue: [eventData.venue, eventData.city].filter(Boolean).join(", "),
          eventPrice: eventData.price ?? "",
          artistPhotoUrl: artistUrl,
          artists: [{ name: artistSlot.name || (eventData.artists[0] ?? ""), photoUrl: artistUrl }],
          artistCount: eventData.artistCount,
          bgUrl: bgResult.url,
          bgWidth: bgResult.width,
          bgHeight: bgResult.height,
          prompt: promptText,
          palette: paletteObj,
          style: selectedStyle,
          format: selectedFormat,
          mode: eventData.flyerType ?? "no_photo",
          generatedAt: new Date().toISOString(),
        }));
      } catch (e) { console.warn("localStorage:", e); }

      setTimeout(() => router.push("/editor-new"), 400);
    } catch (err) {
      console.error("Error generando:", err);
      alert(`Error: ${err instanceof Error ? err.message : "desconocido"}`);
      setPhase("style");
    }
  }, [eventData, artistSlot, selectedStyle, selectedPalette, selectedFormat, animateStep, animateWhileFetching, router]);

  // ─── RENDER: GENERATING ───────────────────────────────────────────────────

  if (phase === "generating") {
    const palette = COLOR_PALETTES.find(p => p.id === selectedPalette)!;
    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
        <div className="w-full lg:w-72 bg-[#111127] border-r border-white/[0.06] p-6 flex flex-col gap-4">
          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Proceso de IA</p>
          <div className="space-y-1">
            {AI_STEPS.map((step, i) => {
              const n = i + 1;
              const isDone = n < currentStep;
              const isActive = n === currentStep;
              return (
                <div key={step.id} className="flex items-start gap-3 py-2 relative">
                  {i < AI_STEPS.length - 1 && <div className="absolute left-[11px] top-8 w-0.5 h-5 bg-white/8" />}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all ${
                    isDone ? "bg-green-500 text-black" : isActive ? "border-2 border-purple-400" : "border-2 border-white/10 text-white/20"
                  }`}>
                    {isDone ? "✓" : isActive
                      ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      : n}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${isDone ? "text-green-400" : isActive ? "text-white" : "text-white/20"}`}>{step.label}</p>
                    <p className={`text-[10px] ${isActive ? "text-purple-300" : isDone ? "text-green-400/60" : "text-white/15"}`}>{step.sub}</p>
                    {isActive && (
                      <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all duration-100" style={{ width: `${stepProgress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 bg-[#0a0a18] flex flex-col items-center justify-center p-8 gap-6">
          <h2 className="text-2xl font-black text-white">Tu flyer se está diseñando ✨</h2>
          <div className="relative" style={{ width: 200, height: 280 }}>
            <div className="absolute -inset-2 rounded-3xl"
              style={{ background: `linear-gradient(135deg, ${palette.colors[0]}30, ${palette.colors[1]}30)`, filter: "blur(12px)" }} />
            <div className="relative w-full h-full rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3"
              style={{ background: `linear-gradient(160deg, ${palette.colors[2]}, ${palette.colors[1]} 60%, ${palette.colors[0]}22)` }}>
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff15" strokeWidth="4" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke={palette.colors[0]} strokeWidth="4"
                    strokeLinecap="round" strokeDasharray={163}
                    strokeDashoffset={163 - 163 * ((currentStep - 1 + stepProgress / 100) / AI_STEPS.length)}
                    style={{ transition: "stroke-dashoffset 0.2s" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-sm">
                    {Math.round(((currentStep - 1 + stepProgress / 100) / AI_STEPS.length) * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-[10px] tracking-widest uppercase" style={{ color: palette.colors[0] }}>Diseñando</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: STYLE ────────────────────────────────────────────────────────

  if (phase === "style") {
    const palette = COLOR_PALETTES.find(p => p.id === selectedPalette)!;
    return (
      <div className="min-h-screen bg-[#0e0e14] text-white flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <button onClick={() => setPhase("chat")} className="text-gray-500 hover:text-white text-sm mb-8 transition-colors">← Volver al chat</button>
          <h2 className="text-2xl font-black mb-2">Estilo del flyer</h2>
          <p className="text-gray-400 text-sm mb-6">Elige el look visual — luego se genera</p>

          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-300 mb-3">🎨 Estilo visual</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {STYLE_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setSelectedStyle(opt.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedStyle === opt.id ? "border-purple-500 bg-purple-500/15 text-purple-300" : "border-white/8 bg-white/[0.03] text-gray-400 hover:border-white/15"
                  }`}>
                  <span className="text-xl">{opt.emoji}</span>{opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-300 mb-3">🌈 Paleta de colores</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COLOR_PALETTES.map(pal => (
                <button key={pal.id} onClick={() => setSelectedPalette(pal.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    selectedPalette === pal.id ? "border-purple-500 bg-purple-500/10" : "border-white/8 bg-white/[0.03] hover:border-white/15"
                  }`}>
                  <div className="flex gap-1">
                    {pal.colors.map((c, i) => <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />)}
                  </div>
                  <span className={`text-xs font-medium ${selectedPalette === pal.id ? "text-purple-300" : "text-gray-400"}`}>{pal.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-7">
            <p className="text-sm font-semibold text-gray-300 mb-3">📐 Formato</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FORMAT_OPTIONS.map(fmt => (
                <button key={fmt.id} onClick={() => setSelectedFormat(fmt.id)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all ${
                    selectedFormat === fmt.id ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400" : "border-white/8 bg-white/[0.03] text-gray-400 hover:border-white/15"
                  }`}>
                  <span className="text-xl">{fmt.icon}</span>
                  <span className="text-xs font-semibold">{fmt.label}</span>
                  <span className="text-[10px] opacity-60">{fmt.size}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 mb-5 space-y-1.5 text-sm text-gray-400">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Resumen del evento</p>
            {eventData.eventName  && <p>🎤 {eventData.eventName}</p>}
            {(eventData.date || eventData.time) && <p>📅 {[eventData.date, eventData.time].filter(Boolean).join(" · ")}</p>}
            {(eventData.venue || eventData.city) && <p>📍 {[eventData.venue, eventData.city].filter(Boolean).join(", ")}</p>}
            {eventData.price && <p>🎟️ {eventData.price}</p>}
            {artistSlot.photoDataUrl && <p>📸 Foto del artista lista</p>}
            <p>🎨 {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label} · {palette.label}</p>
          </div>

          <button onClick={handleGenerate}
            className="w-full py-4 rounded-2xl text-base font-black bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-400/20 transition-all flex items-center justify-center gap-3">
            <span className="text-xl">⚡</span> Generar flyer con IA
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER: CHAT ─────────────────────────────────────────────────────────

  const hasData = !!(eventData.eventName || eventData.date || eventData.venue || eventData.city);

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#0e0e14] text-white overflow-hidden">

      {/* CHAT PANEL */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map(msg => {
            if (msg.type === "photo_choice") {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mr-2 mt-0.5 self-start">AG</div>
                  <div className="max-w-[80%]">
                    <PhotoChoiceCard onChoice={handlePhotoChoice} />
                  </div>
                </div>
              );
            }

            if (msg.type === "photo_upload") {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mr-2 mt-1 self-start">AG</div>
                  <div className="max-w-[80%]">
                    <p className="text-sm text-gray-200 mb-2">Sube la foto del artista aquí:</p>
                    <PhotoUploadCard
                      slot={artistSlot}
                      onUpload={handlePhotoUpload}
                      onRemove={() => setArtistSlot(prev => ({ ...prev, photoDataUrl: null, fileName: null }))}
                      onConfirm={handlePhotoConfirm}
                    />
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mr-2 mt-0.5 self-start">AG</div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-tr-sm"
                    : "bg-white/[0.06] text-gray-100 rounded-tl-sm border border-white/[0.08]"
                }`}>
                  {msg.isLoading ? <TypingDots /> : <span className="whitespace-pre-wrap">{msg.content}</span>}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-white/[0.06] bg-[#0e0e14] p-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Escribe tu mensaje..."
              rows={1}
              disabled={isThinking || photoUploadShown}
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 resize-none transition-all disabled:opacity-40"
              style={{ minHeight: 48, maxHeight: 120 }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isThinking || photoUploadShown}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                input.trim() && !isThinking && !photoUploadShown
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
            >
              {isThinking
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              }
            </button>
          </div>

          {/* CTA — only shown when AI says confirm or generate */}
          {(ctaLabel === "confirm" || ctaLabel === "generate") && !photoUploadShown && (
            <button onClick={handleCTA}
              className="mt-3 w-full py-3 rounded-xl text-sm font-black bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:scale-[1.01] hover:shadow-lg hover:shadow-yellow-400/20 transition-all flex items-center justify-center gap-2">
              <span>⚡</span>
              {ctaLabel === "confirm" ? "Confirmar y continuar" : "Elegir estilo y generar"}
            </button>
          )}
        </div>
      </div>

      {/* SIDE PANEL */}
      <aside className={`hidden lg:flex w-64 shrink-0 border-l border-white/[0.06] bg-[#0c0c12] flex-col transition-opacity duration-300 ${hasData ? "opacity-100" : "opacity-40"}`}>
        <div className="p-4 border-b border-white/[0.06]">
          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Datos del evento</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {!hasData && (
            <p className="text-xs text-gray-600 leading-relaxed">Los datos aparecerán aquí mientras chateas.</p>
          )}
          {eventData.eventName  && <DataPill icon="🎤" value={eventData.eventName} />}
          {eventData.eventType  && <DataPill icon="🎭" value={eventData.eventType} />}
          {eventData.date       && <DataPill icon="📅" value={eventData.date} />}
          {eventData.time       && <DataPill icon="🕘" value={eventData.time} />}
          {eventData.venue      && <DataPill icon="📍" value={eventData.venue} />}
          {eventData.city       && <DataPill icon="🏙️" value={eventData.city} />}
          {eventData.price      && <DataPill icon="🎟️" value={eventData.price} />}
          {eventData.artists.length > 0 && <DataPill icon="👤" value={eventData.artists.join(", ")} />}
          {eventData.flyerType  && <DataPill icon="🖼️" value={
            eventData.flyerType === "with_photo" ? "Con foto artista" :
            eventData.flyerType === "no_photo"   ? "Sin foto" : "Solo logos"
          } />}
          {eventData.visualStyle && <DataPill icon="🎨" value={eventData.visualStyle} />}
          {artistSlot.photoDataUrl && (
            <div className="mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artistSlot.photoDataUrl} alt="Artista" className="w-full rounded-xl object-cover h-28 border border-white/10" />
              <p className="text-[10px] text-green-400 mt-1">✓ Foto lista</p>
            </div>
          )}

          {hasData && (
            <div className="mt-3 pt-3 border-t border-white/8 space-y-1.5">
              <p className="text-[10px] text-gray-600 mb-1">Campos completados</p>
              {[
                { label: "Nombre",     done: !!eventData.eventName },
                { label: "Fecha",      done: !!(eventData.date || eventData.time) },
                { label: "Lugar",      done: !!(eventData.venue || eventData.city) },
                { label: "Precio",     done: !!eventData.price },
                { label: "Tipo flyer", done: !!eventData.flyerType },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${f.done ? "bg-green-500 border-green-500" : "border-white/20"}`}>
                    {f.done && <span className="text-[7px] text-black font-black">✓</span>}
                  </div>
                  <span className={`text-[11px] ${f.done ? "text-green-400" : "text-gray-600"}`}>{f.label}</span>
                </div>
              ))}
            </div>
          )}
          {eventData.readyToGenerate && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs text-green-400 font-semibold">✓ Listo para generar</p>
            </div>
          )}
        </div>

        {/* Quick chips */}
        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-[10px] text-gray-600 mb-2">Sugerencias rápidas</p>
          <div className="flex flex-wrap gap-1.5">
            {["Entrada libre", "Con foto artista", "Sin foto", "Solo logos", "Estilo neon", "Estilo elegante"].map(chip => (
              <button key={chip} onClick={() => sendMessage(chip)}
                disabled={isThinking}
                className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30 transition-all disabled:opacity-30">
                {chip}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
