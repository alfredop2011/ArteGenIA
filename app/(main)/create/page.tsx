"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { EventData, ChatMessage, WizardResponse, QuickReply, InlineCard } from "@/app/api/chat-wizard/route";
import { ArtistLibraryCard, ArtistLibraryModal } from "@/components/wizard/ArtistLibrary";
import type { ArtistEntry } from "@/components/wizard/ArtistLibrary";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MessageType = "text" | "artist_library";
type UIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: MessageType;
  isLoading?: boolean;
  quickReplies?: QuickReply[];
  inlineCard?: InlineCard;
};
type AppPhase = "chat" | "generating";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FORMAT_OPTIONS = [
  { id: "instagram", label: "Instagram",  size: "1080×1350", icon: "📱" },
  { id: "historia",  label: "Historia",   size: "1080×1920", icon: "⬆️" },
  { id: "cuadrado",  label: "Cuadrado",   size: "1080×1080", icon: "⬜" },
  { id: "evento",    label: "Evento",     size: "1920×1080", icon: "🖥️" },
];

const FLYER_TYPE_OPTIONS = [
  { id: "with_photo",  label: "Con foto artista", emoji: "📸", sub: "Foto real recortada" },
  { id: "no_photo",    label: "Sin foto",          emoji: "🎨", sub: "Solo fondo IA" },
  { id: "logos_only",  label: "Solo logos",         emoji: "🏷️", sub: "Sin personas" },
];

const GEN_STEPS = [
  { id: 1, label: "Analizando evento",   sub: "Preparando assets" },
  { id: 2, label: "Generando fondo",     sub: "Solo atmósfera — sin texto" },
  { id: 3, label: "Procesando artistas", sub: "Eliminando fondos" },
  { id: 4, label: "Capas de texto",      sub: "Título, fecha, lugar, precio…" },
  { id: 5, label: "Variantes",           sub: "Composiciones de artistas" },
  { id: 6, label: "Abriendo editor",     sub: "Todo listo" },
];

const EMPTY_EVENT: EventData = {
  eventName: null, eventType: null, date: null, time: null,
  venue: null, city: null, isFree: null, price: null,
  mainArtist: null, additionalArtists: [], artists: [], artistCount: 1,
  flyerType: null, backgroundDescription: null, format: null,
  extraNotes: null, readyToGenerate: false, needsPhotoUpload: false, missingFields: [],
};

function uid() { return Math.random().toString(36).slice(2, 10); }

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
          style={{ animation: `dotBounce 1s ease-in-out ${i * 0.15}s infinite` }} />
      ))}
    </div>
  );
}

// ─── INLINE CARDS ────────────────────────────────────────────────────────────

function QuickRepliesBar({ replies, onSelect, used }: {
  replies: QuickReply[]; onSelect: (v: string) => void; used: boolean;
}) {
  if (used) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2 pl-9">
      {replies.map(r => (
        <button key={r.value} onClick={() => onSelect(r.value)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-xs text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/50 transition-all font-medium">
          {r.emoji && <span>{r.emoji}</span>}{r.label}
        </button>
      ))}
    </div>
  );
}

function FlyerTypeCard({ onSelect, used }: { onSelect: (v: string, label: string) => void; used: boolean }) {
  if (used) return null;
  return (
    <div className="mt-2 pl-9 grid grid-cols-3 gap-2 max-w-sm">
      {FLYER_TYPE_OPTIONS.map(opt => (
        <button key={opt.id} onClick={() => onSelect(opt.id, opt.label)}
          className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border border-white/10 bg-white/[0.04] hover:border-purple-500/40 hover:bg-purple-500/10 transition-all text-center">
          <span className="text-2xl">{opt.emoji}</span>
          <span className="text-xs font-semibold text-white leading-tight">{opt.label}</span>
          <span className="text-[10px] text-gray-500">{opt.sub}</span>
        </button>
      ))}
    </div>
  );
}

function FormatCard({ onSelect, used }: { onSelect: (v: string, label: string) => void; used: boolean }) {
  if (used) return null;
  return (
    <div className="mt-2 pl-9 grid grid-cols-2 gap-2 max-w-xs">
      {FORMAT_OPTIONS.map(fmt => (
        <button key={fmt.id} onClick={() => onSelect(fmt.id, fmt.label)}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:border-purple-500/40 hover:bg-purple-500/10 transition-all text-left">
          <span className="text-xl shrink-0">{fmt.icon}</span>
          <div>
            <p className="text-xs font-semibold text-white">{fmt.label}</p>
            <p className="text-[10px] text-gray-500">{fmt.size}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function PriceCard({ onSelect, used }: { onSelect: (v: string) => void; used: boolean }) {
  if (used) return null;
  return (
    <div className="mt-2 pl-9 flex gap-2">
      <button onClick={() => onSelect("Es gratuito, entrada libre")}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-green-500/30 bg-green-500/10 text-xs text-green-300 hover:bg-green-500/20 transition-all font-medium">
        🎁 Entrada libre
      </button>
      <button onClick={() => onSelect("Tiene precio de entrada")}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-xs text-yellow-300 hover:bg-yellow-500/20 transition-all font-medium">
        🎟️ Con precio
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function CreatePage() {
  const router = useRouter();

  const [messages, setMessages] = useState<UIMessage[]>([{
    id: uid(), role: "assistant", type: "text",
    content: "¡Hola! Soy tu asistente para crear flyers profesionales.\n\nCuéntame sobre tu evento — nombre, tipo, fecha y lugar para empezar.",
  }]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());

  const [eventData, setEventData] = useState<EventData>(EMPTY_EVENT);
  const [ctaLabel, setCtaLabel] = useState<"continue" | "confirm" | "generate">("continue");
  const [recentContext, setRecentContext] = useState<ChatMessage[]>([]);

  const [artistsAndLogos, setArtistsAndLogos] = useState<ArtistEntry[]>([]);
  const [libraryShown, setLibraryShown] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [artistsConfirmed, setArtistsConfirmed] = useState(false);

  const [phase, setPhase] = useState<AppPhase>("chat");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [genStatus, setGenStatus] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── SEND MESSAGE ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isThinking) return;
    const trimmed = userText.trim();

    setMessages(prev => [
      ...prev,
      { id: uid(), role: "user", type: "text", content: trimmed },
      { id: uid(), role: "assistant", type: "text", content: "", isLoading: true },
    ]);
    setInput("");
    setIsThinking(true);

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
      const assistantId = uid();

      setMessages(prev => {
        const updated = [...prev.slice(0, -1), {
          id: assistantId,
          role: "assistant" as const,
          type: "text" as const,
          content: data.message,
          quickReplies: data.quickReplies,
          inlineCard: data.inlineCard,
        }];
        if (data.showPhotoUpload && !libraryShown) {
          updated.push({ id: uid(), role: "assistant", type: "artist_library", content: "" });
        }
        return updated;
      });

      if (data.showPhotoUpload && !libraryShown) setLibraryShown(true);

      setRecentContext(prev =>
        [...prev, { role: "user" as const, content: trimmed }, { role: "assistant" as const, content: data.message }].slice(-8)
      );
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
  }, [isThinking, recentContext, eventData, libraryShown]);

  const handleCardSelect = useCallback((msgId: string, value: string) => {
    setUsedCards(prev => new Set([...prev, msgId]));
    sendMessage(value);
  }, [sendMessage]);

  // ─── ARTIST LIBRARY ──────────────────────────────────────────────────────────

  const handleArtistLibraryConfirm = useCallback((entries: ArtistEntry[]) => {
    setArtistsAndLogos(entries);
    setLibraryModalOpen(false);
    if (!artistsConfirmed) {
      setArtistsConfirmed(true);
      const parts: string[] = [];
      const main = entries.find(e => e.role === "main");
      if (main) parts.push(`artista principal: ${main.name}`);
      const extras = entries.filter(e => e.type === "artist" && e.role !== "main");
      if (extras.length) parts.push(`${extras.length} artista${extras.length > 1 ? "s" : ""} adicional${extras.length > 1 ? "es" : ""}`);
      const logos = entries.filter(e => e.type === "logo");
      if (logos.length) parts.push(`${logos.length} logo${logos.length > 1 ? "s" : ""}`);
      const txt = entries.length === 0
        ? "Continúo sin fotos de artistas."
        : `Añadí ${entries.length} elemento${entries.length > 1 ? "s" : ""}: ${parts.join(", ")}.`;
      setMessages(prev => [...prev, { id: uid(), role: "user", type: "text", content: txt }]);
      sendMessage(txt);
    }
  }, [artistsConfirmed, sendMessage]);

  // ─── CTA ─────────────────────────────────────────────────────────────────────

  const handleCTA = useCallback(() => {
    if (ctaLabel === "generate") {
      // Trigger generation directly from chat — no separate page
      handleGenerate();
    } else if (ctaLabel === "confirm") {
      sendMessage("Sí, todo correcto. Generamos el flyer.");
    } else {
      inputRef.current?.focus();
    }
  }, [ctaLabel, sendMessage]); // eslint-disable-line

  // ─── GENERATION ──────────────────────────────────────────────────────────────

  const animateStep = useCallback((step: number, label: string, duration: number) =>
    new Promise<void>(res => {
      setCurrentStep(step); setGenStatus(label); setStepProgress(0);
      const start = Date.now();
      const tick = () => {
        const pct = Math.min((Date.now() - start) / duration * 100, 100);
        setStepProgress(pct);
        pct < 100 ? requestAnimationFrame(tick) : res();
      };
      requestAnimationFrame(tick);
    }), []);

  const animateWhileFetching = useCallback(<T,>(step: number, label: string, promise: Promise<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      setCurrentStep(step); setGenStatus(label); setStepProgress(0);
      const start = Date.now(); let done = false;
      const tick = () => {
        if (done) return;
        setStepProgress(90 * (1 - Math.exp(-(Date.now() - start) / 5000)));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      promise
        .then(v => { done = true; setStepProgress(100); setTimeout(() => resolve(v), 300); })
        .catch(e => { done = true; reject(e); });
    }), []);

  const handleGenerate = useCallback(async () => {
    setPhase("generating");
    try {
      await animateStep(1, "Preparando…", 800);

      // Use backgroundDescription from chat as the image prompt
      // CRITICAL: never include event name/date/venue/price in bg prompt
      const bgPrompt = eventData.backgroundDescription ?? eventData.eventType ?? "event atmosphere";
      const format = eventData.format ?? "instagram";

      const bgResult = await animateWhileFetching(2, "Generando fondo sin texto…",
        fetch("/api/generate-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            backgroundDescription: bgPrompt,
            eventType: eventData.eventType ?? "",
            format,
          }),
        }).then(async r => {
          if (!r.ok) throw new Error(`generate-bg ${r.status}`);
          return r.json() as Promise<{ url: string; width: number; height: number }>;
        })
      );

      const artistsWithPhoto = artistsAndLogos.filter(a => a.type === "artist" && a.imageSrc);
      let artistUrls: Array<{ id: string; name: string; isMain: boolean; url: string }> = [];

      if (artistsWithPhoto.length > 0) {
        const promises = artistsWithPhoto.map(async artist => {
          try {
            const [meta, b64] = artist.imageSrc.split(",");
            const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
            const bin = atob(b64);
            const u8 = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            const fd = new FormData();
            fd.append("image_file", new Blob([u8], { type: mime }), `${artist.name}.png`);
            const r = await fetch("/api/remove-bg", { method: "POST", body: fd });
            const d = r.ok ? await r.json() as { url: string } : null;
            return { id: artist.id, name: artist.name, isMain: artist.role === "main", url: d?.url ?? artist.imageSrc };
          } catch {
            return { id: artist.id, name: artist.name, isMain: artist.role === "main", url: artist.imageSrc };
          }
        });
        artistUrls = await animateWhileFetching(3, "Procesando artistas…", Promise.all(promises));
      } else {
        await animateStep(3, "Sin fotos de artistas…", 400);
      }

      await animateStep(4, "Creando capas de texto…", 600);
      await animateStep(5, "Preparando variantes…", 400);
      await animateStep(6, "Abriendo editor…", 300);

      try {
        localStorage.setItem("artegenia_generated", JSON.stringify({
          eventName:      eventData.eventName ?? "",
          eventDate:      [eventData.date, eventData.time].filter(Boolean).join(" · "),
          eventVenue:     [eventData.venue, eventData.city].filter(Boolean).join(", "),
          eventPrice:     eventData.price ?? "",
          artistPhotoUrl: artistUrls[0]?.url ?? null,
          artists:        artistUrls.map(a => ({ name: a.name, photoUrl: a.url })),
          artistCount:    artistUrls.length || 1,
          bgUrl:          bgResult.url,
          bgWidth:        bgResult.width,
          bgHeight:       bgResult.height,
          format,
          mode:           eventData.flyerType ?? "no_photo",
          generatedAt:    new Date().toISOString(),
        }));
      } catch (e) { console.warn("localStorage:", e); }

      setTimeout(() => router.push("/editor-new"), 400);
    } catch (err) {
      console.error("Error generando:", err);
      alert(`Error: ${err instanceof Error ? err.message : "desconocido"}`);
      setPhase("chat");
    }
  }, [eventData, artistsAndLogos, animateStep, animateWhileFetching, router]);

  // Wire handleCTA to handleGenerate properly
  const handleCTAFull = useCallback(() => {
    if (ctaLabel === "generate") handleGenerate();
    else if (ctaLabel === "confirm") sendMessage("Sí, todo correcto. Generamos el flyer.");
    else inputRef.current?.focus();
  }, [ctaLabel, handleGenerate, sendMessage]);

  // ─── RENDER: GENERATING ──────────────────────────────────────────────────────

  if (phase === "generating") {
    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
        <div className="w-full lg:w-72 bg-[#111127] border-r border-white/[0.06] p-6 flex flex-col gap-4">
          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Generando flyer</p>
          <div className="space-y-1">
            {GEN_STEPS.map((step, i) => {
              const n = i + 1; const isDone = n < currentStep; const isActive = n === currentStep;
              return (
                <div key={step.id} className="flex items-start gap-3 py-2 relative">
                  {i < GEN_STEPS.length - 1 && <div className="absolute left-[11px] top-8 w-0.5 h-5 bg-white/8" />}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all ${isDone ? "bg-green-500 text-black" : isActive ? "border-2 border-purple-400" : "border-2 border-white/10 text-white/20"}`}>
                    {isDone ? "✓" : isActive ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> : n}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${isDone ? "text-green-400" : isActive ? "text-white" : "text-white/20"}`}>{step.label}</p>
                    <p className={`text-[10px] ${isActive ? "text-purple-300" : isDone ? "text-green-400/60" : "text-white/15"}`}>{step.sub}</p>
                    {isActive && <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full transition-all duration-100" style={{ width: `${stepProgress}%` }} /></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 bg-[#0a0a18] flex flex-col items-center justify-center p-8 gap-6">
          <h2 className="text-2xl font-black text-white">Creando tu flyer ✨</h2>
          <p className="text-sm text-gray-500">{genStatus}</p>
          <div className="w-16 h-16 relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff15" strokeWidth="4" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="#a855f7" strokeWidth="4"
                strokeLinecap="round" strokeDasharray={163}
                strokeDashoffset={163 - 163 * ((currentStep - 1 + stepProgress / 100) / GEN_STEPS.length)}
                style={{ transition: "stroke-dashoffset 0.3s" }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-black text-sm">
                {Math.round(((currentStep - 1 + stepProgress / 100) / GEN_STEPS.length) * 100)}%
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-600 text-center max-w-xs">El fondo se genera sin texto — las letras se añaden como capas editables</p>
        </div>
      </div>
    );
  }

  // ─── RENDER: CHAT ─────────────────────────────────────────────────────────────

  const hasData = !!(eventData.eventName || eventData.date || eventData.venue || eventData.city);
  const inputBlocked = isThinking || (libraryShown && !artistsConfirmed);

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#0e0e14] text-white overflow-hidden">

      {/* CHAT PANEL */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map(msg => {

            if (msg.type === "artist_library") {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mr-2 mt-1 self-start">AG</div>
                  <div className="max-w-[85%]">
                    <ArtistLibraryCard selected={artistsAndLogos} onOpen={() => setLibraryModalOpen(true)} />
                    {!artistsConfirmed && (
                      <button onClick={() => handleArtistLibraryConfirm(artistsAndLogos)}
                        className="mt-2 w-full max-w-xs py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all">
                        Continuar →
                      </button>
                    )}
                    {artistsConfirmed && artistsAndLogos.length > 0 && (
                      <p className="mt-1.5 text-[11px] text-green-400">✓ {artistsAndLogos.length} elemento{artistsAndLogos.length > 1 ? "s" : ""} añadido{artistsAndLogos.length > 1 ? "s" : ""}</p>
                    )}
                  </div>
                </div>
              );
            }

            const isUsed = usedCards.has(msg.id);

            return (
              <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} w-full`}>
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

                {/* Inline cards — only for assistant messages */}
                {msg.role === "assistant" && !msg.isLoading && (
                  <>
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <QuickRepliesBar replies={msg.quickReplies} onSelect={v => handleCardSelect(msg.id, v)} used={isUsed} />
                    )}
                    {msg.inlineCard?.type === "flyer_type_selector" && (
                      <FlyerTypeCard onSelect={(v, label) => handleCardSelect(msg.id, label)} used={isUsed} />
                    )}
                    {msg.inlineCard?.type === "format_selector" && (
                      <FormatCard onSelect={(v, label) => handleCardSelect(msg.id, `Formato ${label}`) } used={isUsed} />
                    )}
                    {msg.inlineCard?.type === "price_selector" && (
                      <PriceCard onSelect={v => handleCardSelect(msg.id, v)} used={isUsed} />
                    )}
                  </>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/[0.06] bg-[#0e0e14] p-4">
          <div className="flex gap-3 items-end">
            <textarea ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder={inputBlocked && libraryShown && !artistsConfirmed
                ? "Abre la card y añade artistas, luego pulsa Continuar..."
                : "Escribe tu mensaje o selecciona una opción..."}
              rows={1} disabled={inputBlocked}
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 resize-none transition-all disabled:opacity-40"
              style={{ minHeight: 48, maxHeight: 120 }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button onClick={() => sendMessage(input)} disabled={!input.trim() || inputBlocked}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                input.trim() && !inputBlocked ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}>
              {isThinking
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              }
            </button>
          </div>

          {(ctaLabel === "confirm" || ctaLabel === "generate") && !inputBlocked && (
            <button onClick={handleCTAFull}
              className="mt-3 w-full py-3 rounded-xl text-sm font-black bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:scale-[1.01] hover:shadow-lg hover:shadow-yellow-400/20 transition-all flex items-center justify-center gap-2">
              <span>⚡</span>
              {ctaLabel === "confirm" ? "Confirmar y generar flyer" : "Generar flyer ⚡"}
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
          {!hasData && <p className="text-xs text-gray-600 leading-relaxed">Los datos aparecerán aquí mientras chateas.</p>}
          {eventData.eventName  && <DataPill icon="🎤" value={eventData.eventName} />}
          {eventData.eventType  && <DataPill icon="🎭" value={eventData.eventType} />}
          {eventData.date       && <DataPill icon="📅" value={eventData.date} />}
          {eventData.time       && <DataPill icon="🕘" value={eventData.time} />}
          {eventData.venue      && <DataPill icon="📍" value={eventData.venue} />}
          {eventData.city       && <DataPill icon="🏙️" value={eventData.city} />}
          {eventData.isFree !== null && (
            <DataPill icon="🎟️" value={eventData.isFree ? "Entrada libre" : (eventData.price ?? "Precio pendiente")} />
          )}
          {eventData.mainArtist && <DataPill icon="👑" value={eventData.mainArtist} />}
          {(eventData.additionalArtists?.length ?? 0) > 0 && (
            <DataPill icon="🎵" value={eventData.additionalArtists.join(", ")} />
          )}
          {eventData.flyerType && (
            <DataPill icon="🖼️" value={
              eventData.flyerType === "with_photo" ? "Con foto artista" :
              eventData.flyerType === "no_photo" ? "Sin foto" : "Solo logos"
            } />
          )}
          {eventData.backgroundDescription && (
            <DataPill icon="🎨" value={eventData.backgroundDescription.slice(0, 40) + (eventData.backgroundDescription.length > 40 ? "…" : "")} />
          )}
          {eventData.format && (
            <DataPill icon="📐" value={FORMAT_OPTIONS.find(f => f.id === eventData.format)?.label ?? eventData.format} />
          )}

          {artistsAndLogos.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] text-gray-500 font-medium">Artistas y logos</p>
              {artistsAndLogos.map(a => (
                <div key={a.id} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.imageSrc} alt={a.name} className="w-7 h-7 rounded-lg object-cover border border-white/10" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-white font-medium truncate">{a.name}</p>
                    <p className="text-[9px] text-gray-500">{a.role === "main" ? "👑 Principal" : a.type === "logo" ? "🏷️ Logo" : "● Secundario"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasData && (
            <div className="mt-3 pt-3 border-t border-white/8 space-y-1.5">
              <p className="text-[10px] text-gray-600 mb-1">Campos completados</p>
              {[
                { label: "Nombre",      done: !!eventData.eventName },
                { label: "Fecha",       done: !!(eventData.date || eventData.time) },
                { label: "Lugar",       done: !!(eventData.venue || eventData.city) },
                { label: "Precio",      done: eventData.isFree !== null },
                { label: "Artista",     done: !!eventData.mainArtist },
                { label: "Tipo flyer",  done: !!eventData.flyerType },
                { label: "Fondo",       done: !!eventData.backgroundDescription },
                { label: "Fotos",       done: artistsAndLogos.length > 0 || eventData.flyerType === "no_photo" },
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

        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-[10px] text-gray-600 mb-2">Sugerencias rápidas</p>
          <div className="flex flex-wrap gap-1.5">
            {["Entrada libre", "Con foto artista", "Sin foto", "Solo logos", "Más artistas"].map(chip => (
              <button key={chip} onClick={() => sendMessage(chip)} disabled={isThinking}
                className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30 transition-all disabled:opacity-30">
                {chip}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {libraryModalOpen && (
        <ArtistLibraryModal
          initialSelected={artistsAndLogos}
          onConfirm={handleArtistLibraryConfirm}
          onClose={() => setLibraryModalOpen(false)}
        />
      )}

      <style>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
