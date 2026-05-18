"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { EventData, ChatMessage, WizardResponse } from "@/app/api/chat-wizard/route";
import { ArtistLibraryCard, ArtistLibraryModal } from "@/components/wizard/ArtistLibrary";
import type { ArtistEntry } from "@/components/wizard/ArtistLibrary";

type MessageType = "text" | "artist_library";
type UIMessage = { id: string; role: "user" | "assistant"; content: string; type?: MessageType; isLoading?: boolean; };
type AppPhase = "chat" | "style" | "generating";

const STYLE_OPTIONS = [
  { id: "urbano", label: "Urbano", emoji: "🏙️" },
  { id: "elegante", label: "Elegante", emoji: "✨" },
  { id: "neon", label: "Neón", emoji: "💜" },
  { id: "festival", label: "Festival", emoji: "🎪" },
  { id: "minima", label: "Minimal", emoji: "◻️" },
  { id: "retro", label: "Retro", emoji: "🎞️" },
];
const COLOR_PALETTES = [
  { id: "dorado", colors: ["#f5c518", "#7c3aed", "#0d0d1a"], label: "Dorado & Morado" },
  { id: "neon", colors: ["#00f5ff", "#ff00aa", "#0a0a1a"], label: "Neón" },
  { id: "rojo", colors: ["#ef4444", "#111827", "#f9fafb"], label: "Rojo & Negro" },
  { id: "verde", colors: ["#22c55e", "#064e3b", "#f0fdf4"], label: "Verde Naturaleza" },
  { id: "rosa", colors: ["#ec4899", "#be185d", "#fdf2f8"], label: "Rosa Vibrante" },
  { id: "azul", colors: ["#3b82f6", "#1e3a5f", "#eff6ff"], label: "Azul Profundo" },
];
const FORMAT_OPTIONS = [
  { id: "instagram", label: "Instagram", size: "1080×1350", icon: "📱" },
  { id: "historia", label: "Historia", size: "1080×1920", icon: "⬆️" },
  { id: "cuadrado", label: "Cuadrado", size: "1080×1080", icon: "⬜" },
  { id: "evento", label: "Evento", size: "1920×1080", icon: "🖥️" },
];
const GEN_STEPS = [
  { id: 1, label: "Analizando evento", sub: "Preparando assets" },
  { id: 2, label: "Generando fondo", sub: "Solo atmósfera — sin texto" },
  { id: 3, label: "Procesando artistas", sub: "Eliminando fondos" },
  { id: 4, label: "Capas de texto", sub: "Título, fecha, lugar, precio…" },
  { id: 5, label: "Variantes", sub: "Composiciones de artistas" },
  { id: 6, label: "Abriendo editor", sub: "Todo listo" },
];
const EMPTY_EVENT: EventData = {
  eventName: null, eventType: null, date: null, time: null,
  venue: null, city: null, isFree: null, price: null,
  mainArtist: null, additionalArtists: [], artists: [], artistCount: 1,
  flyerType: null, visualStyle: null, mood: null, extraNotes: null,
  readyToGenerate: false, needsPhotoUpload: false, missingFields: [],
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
      {[0,1,2].map(i => (
        <span key={i} className="w-2 h-2 rounded-full bg-purple-400 inline-block"
          style={{ animation: `dotBounce 1s ease-in-out ${i*0.15}s infinite` }} />
      ))}
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<UIMessage[]>([{
    id: uid(), role: "assistant", type: "text",
    content: "¡Hola! Soy tu asistente para crear flyers.\n\nCuéntame sobre tu evento — nombre, tipo, fecha y lugar para empezar.",
  }]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [eventData, setEventData] = useState<EventData>(EMPTY_EVENT);
  const [ctaLabel, setCtaLabel] = useState<"continue"|"confirm"|"generate">("continue");
  const [recentContext, setRecentContext] = useState<ChatMessage[]>([]);
  const [artistsAndLogos, setArtistsAndLogos] = useState<ArtistEntry[]>([]);
  const [libraryShown, setLibraryShown] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [artistsConfirmed, setArtistsConfirmed] = useState(false);
  const [phase, setPhase] = useState<AppPhase>("chat");
  const [selectedStyle, setSelectedStyle] = useState("urbano");
  const [selectedPalette, setSelectedPalette] = useState("dorado");
  const [selectedFormat, setSelectedFormat] = useState("instagram");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [genStatus, setGenStatus] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isThinking) return;
    const trimmed = userText.trim();
    const userMsg: UIMessage = { id: uid(), role: "user", type: "text", content: trimmed };
    const loadingMsg: UIMessage = { id: uid(), role: "assistant", type: "text", content: "", isLoading: true };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setInput("");
    setIsThinking(true);
    try {
      const res = await fetch("/api/chat-wizard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latestUserMessage: trimmed, currentEventData: eventData, recentContext: recentContext.slice(-4) }),
      });
      const data: WizardResponse = await res.json();
      const assistantMsg: UIMessage = { id: uid(), role: "assistant", type: "text", content: data.message };
      setMessages(prev => {
        const updated = [...prev.slice(0, -1), assistantMsg];
        if (data.showPhotoUpload && !libraryShown) {
          updated.push({ id: uid(), role: "assistant", type: "artist_library", content: "" });
        }
        return updated;
      });
      if (data.showPhotoUpload && !libraryShown) setLibraryShown(true);
      setRecentContext(prev => [...prev, { role: "user" as const, content: trimmed }, { role: "assistant" as const, content: data.message }].slice(-8));
      setEventData(data.eventData);
      setCtaLabel(data.ctaLabel);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { id: uid(), role: "assistant", type: "text", content: "Ups, algo salió mal." }]);
    } finally {
      setIsThinking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isThinking, recentContext, eventData, libraryShown]);

  const handleArtistLibraryConfirm = useCallback((entries: ArtistEntry[]) => {
    setArtistsAndLogos(entries);
    setLibraryModalOpen(false);
    if (!artistsConfirmed) {
      setArtistsConfirmed(true);
      const parts: string[] = [];
      const main = entries.find(e => e.role === "main");
      if (main) parts.push(`artista principal: ${main.name}`);
      const extra = entries.filter(e => e.type === "artist" && e.role !== "main");
      if (extra.length) parts.push(`${extra.length} artista${extra.length>1?"s":""} adicional${extra.length>1?"es":""}`);
      const logos = entries.filter(e => e.type === "logo");
      if (logos.length) parts.push(`${logos.length} logo${logos.length>1?"s":""}`);
      const txt = entries.length === 0 ? "Continúo sin fotos." : `Añadí ${entries.length} elemento${entries.length>1?"s":""}: ${parts.join(", ")}.`;
      setMessages(prev => [...prev, { id: uid(), role: "user", type: "text", content: txt }]);
      sendMessage(txt);
    }
  }, [artistsConfirmed, sendMessage]);

  const handleCTA = useCallback(() => {
    if (ctaLabel === "generate") setPhase("style");
    else if (ctaLabel === "confirm") sendMessage("Sí, todo correcto. Generamos el flyer.");
    else inputRef.current?.focus();
  }, [ctaLabel, sendMessage]);

  const animateStep = useCallback((step: number, label: string, dur: number) =>
    new Promise<void>(res => {
      setCurrentStep(step); setGenStatus(label); setStepProgress(0);
      const t = Date.now();
      const tick = () => { const p = Math.min((Date.now()-t)/dur*100,100); setStepProgress(p); p<100?requestAnimationFrame(tick):res(); };
      requestAnimationFrame(tick);
    }), []);

  const animateWhileFetching = useCallback(<T,>(step: number, label: string, promise: Promise<T>): Promise<T> =>
    new Promise((resolve, reject) => {
      setCurrentStep(step); setGenStatus(label); setStepProgress(0);
      const t = Date.now(); let done = false;
      const tick = () => { if(done)return; setStepProgress(90*(1-Math.exp(-(Date.now()-t)/5000))); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      promise.then(v=>{done=true;setStepProgress(100);setTimeout(()=>resolve(v),300);}).catch(e=>{done=true;reject(e);});
    }), []);

  const handleGenerate = useCallback(async () => {
    setPhase("generating");
    try {
      await animateStep(1, "Preparando…", 800);
      const paletteObj = COLOR_PALETTES.find(p=>p.id===selectedPalette) ?? COLOR_PALETTES[0];
      const bgResult = await animateWhileFetching(2, "Generando fondo sin texto…",
        fetch("/api/generate-bg", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: eventData.eventType ?? "", style: selectedStyle, palette: { id: paletteObj.id, name: paletteObj.label, colors: paletteObj.colors }, format: selectedFormat }),
        }).then(async r => { if(!r.ok) throw new Error(`generate-bg ${r.status}`); return r.json() as Promise<{url:string;width:number;height:number}>; })
      );
      const artistsWithPhoto = artistsAndLogos.filter(a => a.type === "artist" && a.imageSrc);
      let artistUrls: Array<{id:string;name:string;isMain:boolean;url:string}> = [];
      if (artistsWithPhoto.length > 0) {
        const promises = artistsWithPhoto.map(async artist => {
          try {
            const [meta, b64] = artist.imageSrc.split(",");
            const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
            const bin = atob(b64); const u8 = new Uint8Array(bin.length);
            for (let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i);
            const fd = new FormData();
            fd.append("image_file", new Blob([u8],{type:mime}), `${artist.name}.png`);
            const r = await fetch("/api/remove-bg", { method: "POST", body: fd });
            const d = r.ok ? await r.json() as {url:string} : null;
            return { id: artist.id, name: artist.name, isMain: artist.role === "main", url: d?.url ?? artist.imageSrc };
          } catch { return { id: artist.id, name: artist.name, isMain: artist.role==="main", url: artist.imageSrc }; }
        });
        artistUrls = await animateWhileFetching(3, "Procesando artistas…", Promise.all(promises));
      } else { await animateStep(3, "Sin fotos…", 400); }
      await animateStep(4, "Creando capas de texto…", 600);
      await animateStep(5, "Preparando variantes…", 400);
      await animateStep(6, "Abriendo editor…", 300);
      try {
        localStorage.setItem("artegenia_generated", JSON.stringify({
          eventName: eventData.eventName ?? "",
          eventDate: [eventData.date, eventData.time].filter(Boolean).join(" · "),
          eventVenue: [eventData.venue, eventData.city].filter(Boolean).join(", "),
          eventPrice: eventData.price ?? "",
          artistPhotoUrl: artistUrls[0]?.url ?? null,
          artists: artistUrls.map(a => ({ name: a.name, photoUrl: a.url })),
          artistCount: artistUrls.length || 1,
          bgUrl: bgResult.url, bgWidth: bgResult.width, bgHeight: bgResult.height,
          prompt: (eventData.eventType ?? "event") + " " + selectedStyle,
          palette: paletteObj, style: selectedStyle, format: selectedFormat,
          mode: eventData.flyerType ?? "no_photo", generatedAt: new Date().toISOString(),
        }));
      } catch(e) { console.warn("localStorage:", e); }
      setTimeout(() => router.push("/editor-new"), 400);
    } catch(err) {
      console.error("Error generando:", err);
      alert(`Error: ${err instanceof Error ? err.message : "desconocido"}`);
      setPhase("style");
    }
  }, [eventData, artistsAndLogos, selectedStyle, selectedPalette, selectedFormat, animateStep, animateWhileFetching, router]);

  if (phase === "generating") {
    const palette = COLOR_PALETTES.find(p=>p.id===selectedPalette)!;
    const pct = Math.round(((currentStep-1+stepProgress/100)/GEN_STEPS.length)*100);
    return (
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">
        <div className="w-full lg:w-72 bg-[#111127] border-r border-white/[0.06] p-6 flex flex-col gap-4">
          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Generando flyer</p>
          <div className="space-y-1">
            {GEN_STEPS.map((step,i) => {
              const n=i+1; const isDone=n<currentStep; const isActive=n===currentStep;
              return (
                <div key={step.id} className="flex items-start gap-3 py-2 relative">
                  {i<GEN_STEPS.length-1 && <div className="absolute left-[11px] top-8 w-0.5 h-5 bg-white/8" />}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all ${isDone?"bg-green-500 text-black":isActive?"border-2 border-purple-400":"border-2 border-white/10 text-white/20"}`}>
                    {isDone?"✓":isActive?<div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/>:n}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-semibold ${isDone?"text-green-400":isActive?"text-white":"text-white/20"}`}>{step.label}</p>
                    <p className={`text-[10px] ${isActive?"text-purple-300":isDone?"text-green-400/60":"text-white/15"}`}>{step.sub}</p>
                    {isActive&&<div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full transition-all duration-100" style={{width:`${stepProgress}%`}}/></div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 bg-[#0a0a18] flex flex-col items-center justify-center p-8 gap-6">
          <h2 className="text-2xl font-black text-white">Creando tu flyer ✨</h2>
          <p className="text-sm text-gray-500">{genStatus}</p>
          <div className="relative" style={{width:200,height:280}}>
            <div className="absolute -inset-2 rounded-3xl" style={{background:`linear-gradient(135deg,${palette.colors[0]}30,${palette.colors[1]}30)`,filter:"blur(12px)"}}/>
            <div className="relative w-full h-full rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3" style={{background:`linear-gradient(160deg,${palette.colors[2]},${palette.colors[1]} 60%,${palette.colors[0]}22)`}}>
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff15" strokeWidth="4"/>
                  <circle cx="32" cy="32" r="26" fill="none" stroke={palette.colors[0]} strokeWidth="4" strokeLinecap="round" strokeDasharray={163} strokeDashoffset={163-163*(pct/100)} style={{transition:"stroke-dashoffset 0.3s"}}/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className="text-white font-black text-sm">{pct}%</span></div>
              </div>
              <p className="text-[10px] tracking-widest uppercase" style={{color:palette.colors[0]}}>Procesando</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "style") {
    const palette = COLOR_PALETTES.find(p=>p.id===selectedPalette)!;
    return (
      <div className="min-h-screen bg-[#0e0e14] text-white flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <button onClick={()=>setPhase("chat")} className="text-gray-500 hover:text-white text-sm mb-8 transition-colors">← Volver al chat</button>
          <h2 className="text-2xl font-black mb-1">Estilo del flyer</h2>
          <p className="text-gray-400 text-sm mb-6">El fondo se genera sin texto — las letras son capas editables</p>
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-300 mb-3">🎨 Estilo visual</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {STYLE_OPTIONS.map(opt=>(
                <button key={opt.id} onClick={()=>setSelectedStyle(opt.id)} className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${selectedStyle===opt.id?"border-purple-500 bg-purple-500/15 text-purple-300":"border-white/8 bg-white/[0.03] text-gray-400 hover:border-white/15"}`}>
                  <span className="text-xl">{opt.emoji}</span>{opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-300 mb-3">🌈 Paleta de colores</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COLOR_PALETTES.map(pal=>(
                <button key={pal.id} onClick={()=>setSelectedPalette(pal.id)} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${selectedPalette===pal.id?"border-purple-500 bg-purple-500/10":"border-white/8 bg-white/[0.03] hover:border-white/15"}`}>
                  <div className="flex gap-1">{pal.colors.map((c,i)=><div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{background:c}}/>)}</div>
                  <span className={`text-xs font-medium ${selectedPalette===pal.id?"text-purple-300":"text-gray-400"}`}>{pal.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-7">
            <p className="text-sm font-semibold text-gray-300 mb-3">📐 Formato</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FORMAT_OPTIONS.map(fmt=>(
                <button key={fmt.id} onClick={()=>setSelectedFormat(fmt.id)} className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all ${selectedFormat===fmt.id?"border-yellow-400/50 bg-yellow-400/10 text-yellow-400":"border-white/8 bg-white/[0.03] text-gray-400 hover:border-white/15"}`}>
                  <span className="text-xl">{fmt.icon}</span>
                  <span className="text-xs font-semibold">{fmt.label}</span>
                  <span className="text-[10px] opacity-60">{fmt.size}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 mb-5 space-y-1.5 text-sm text-gray-400">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-2">Resumen</p>
            {eventData.eventName&&<p>🎤 {eventData.eventName}</p>}
            {(eventData.date||eventData.time)&&<p>📅 {[eventData.date,eventData.time].filter(Boolean).join(" · ")}</p>}
            {(eventData.venue||eventData.city)&&<p>📍 {[eventData.venue,eventData.city].filter(Boolean).join(", ")}</p>}
            {eventData.price&&<p>🎟️ {eventData.price}</p>}
            {artistsAndLogos.length>0&&<p>👤 {artistsAndLogos.map(a=>a.name).join(", ")}</p>}
            <p className="pt-1 border-t border-white/8">🎨 {STYLE_OPTIONS.find(s=>s.id===selectedStyle)?.label} · {palette.label} · {FORMAT_OPTIONS.find(f=>f.id===selectedFormat)?.label}</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-5">
            <p className="text-xs text-blue-300">ℹ️ El fondo se genera sin texto. Toda la información del evento se añade como capas editables en el editor.</p>
          </div>
          <button onClick={handleGenerate} className="w-full py-4 rounded-2xl text-base font-black bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-400/20 transition-all flex items-center justify-center gap-3">
            <span className="text-xl">⚡</span> Generar capas del flyer
          </button>
        </div>
      </div>
    );
  }

  const hasData = !!(eventData.eventName||eventData.date||eventData.venue||eventData.city);
  const inputBlocked = isThinking || (libraryShown && !artistsConfirmed);

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#0e0e14] text-white overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.map(msg => {
            if (msg.type === "artist_library") {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mr-2 mt-1 self-start">AG</div>
                  <div className="max-w-[85%]">
                    <ArtistLibraryCard selected={artistsAndLogos} onOpen={()=>setLibraryModalOpen(true)}/>
                    {!artistsConfirmed&&(
                      <button onClick={()=>handleArtistLibraryConfirm(artistsAndLogos)} className="mt-2 w-full max-w-xs py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all">
                        Continuar →
                      </button>
                    )}
                    {artistsConfirmed&&artistsAndLogos.length>0&&(
                      <p className="mt-1.5 text-[11px] text-green-400">✓ {artistsAndLogos.length} elemento{artistsAndLogos.length>1?"s":""} añadido{artistsAndLogos.length>1?"s":""}</p>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
                {msg.role==="assistant"&&(
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-black shrink-0 mr-2 mt-0.5 self-start">AG</div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role==="user"?"bg-purple-600 text-white rounded-tr-sm":"bg-white/[0.06] text-gray-100 rounded-tl-sm border border-white/[0.08]"}`}>
                  {msg.isLoading?<TypingDots/>:<span className="whitespace-pre-wrap">{msg.content}</span>}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef}/>
        </div>
        <div className="border-t border-white/[0.06] bg-[#0e0e14] p-4">
          <div className="flex gap-3 items-end">
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(input);}}}
              placeholder={inputBlocked&&libraryShown&&!artistsConfirmed?"Abre la card y añade artistas, luego pulsa Continuar...":"Escribe tu mensaje..."}
              rows={1} disabled={inputBlocked}
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500/50 resize-none transition-all disabled:opacity-40"
              style={{minHeight:48,maxHeight:120}}
              onInput={e=>{const el=e.target as HTMLTextAreaElement;el.style.height="auto";el.style.height=Math.min(el.scrollHeight,120)+"px";}}
            />
            <button onClick={()=>sendMessage(input)} disabled={!input.trim()||inputBlocked}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${input.trim()&&!inputBlocked?"bg-purple-600 hover:bg-purple-500 text-white":"bg-white/5 text-white/20 cursor-not-allowed"}`}>
              {isThinking?<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>}
            </button>
          </div>
          {(ctaLabel==="confirm"||ctaLabel==="generate")&&!inputBlocked&&(
            <button onClick={handleCTA} className="mt-3 w-full py-3 rounded-xl text-sm font-black bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
              <span>⚡</span>{ctaLabel==="confirm"?"Confirmar y elegir estilo":"Elegir estilo y generar"}
            </button>
          )}
        </div>
      </div>
      <aside className={`hidden lg:flex w-64 shrink-0 border-l border-white/[0.06] bg-[#0c0c12] flex-col transition-opacity duration-300 ${hasData?"opacity-100":"opacity-40"}`}>
        <div className="p-4 border-b border-white/[0.06]"><p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Datos del evento</p></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {!hasData&&<p className="text-xs text-gray-600">Los datos aparecerán aquí mientras chateas.</p>}
          {eventData.eventName&&<DataPill icon="🎤" value={eventData.eventName}/>}
          {eventData.eventType&&<DataPill icon="🎭" value={eventData.eventType}/>}
          {eventData.date&&<DataPill icon="📅" value={eventData.date}/>}
          {eventData.time&&<DataPill icon="🕘" value={eventData.time}/>}
          {eventData.venue&&<DataPill icon="📍" value={eventData.venue}/>}
          {eventData.city&&<DataPill icon="🏙️" value={eventData.city}/>}
          {eventData.isFree!==null&&<DataPill icon="🎟️" value={eventData.isFree?"Entrada libre":(eventData.price??"Precio pendiente")}/>}
          {eventData.mainArtist&&<DataPill icon="👑" value={eventData.mainArtist}/>}
          {(eventData.additionalArtists?.length??0)>0&&<DataPill icon="🎵" value={eventData.additionalArtists?.join(", ")}/>}
          {eventData.flyerType&&<DataPill icon="🖼️" value={eventData.flyerType==="with_photo"?"Con foto artista":eventData.flyerType==="no_photo"?"Sin foto":"Solo logos"}/>}
          {artistsAndLogos.length>0&&(
            <div className="mt-2 space-y-1.5">
              <p className="text-[10px] text-gray-500 font-medium">Artistas y logos</p>
              {artistsAndLogos.map(a=>(
                <div key={a.id} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.imageSrc} alt={a.name} className="w-7 h-7 rounded-lg object-cover border border-white/10"/>
                  <div className="min-w-0">
                    <p className="text-[11px] text-white font-medium truncate">{a.name}</p>
                    <p className="text-[9px] text-gray-500">{a.role==="main"?"👑 Principal":a.type==="logo"?"🏷️ Logo":"● Secundario"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasData&&(
            <div className="mt-3 pt-3 border-t border-white/8 space-y-1.5">
              <p className="text-[10px] text-gray-600 mb-1">Campos completados</p>
              {[
                {label:"Nombre",done:!!eventData.eventName},
                {label:"Fecha",done:!!(eventData.date||eventData.time)},
                {label:"Lugar",done:!!(eventData.venue||eventData.city)},
                {label:"Precio",done:eventData.isFree!==null},
                {label:"Artista",done:!!eventData.mainArtist},
                {label:"Tipo flyer",done:!!eventData.flyerType},
                {label:"Fotos",done:artistsAndLogos.length>0||eventData.flyerType==="no_photo"},
              ].map(f=>(
                <div key={f.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${f.done?"bg-green-500 border-green-500":"border-white/20"}`}>
                    {f.done&&<span className="text-[7px] text-black font-black">✓</span>}
                  </div>
                  <span className={`text-[11px] ${f.done?"text-green-400":"text-gray-600"}`}>{f.label}</span>
                </div>
              ))}
            </div>
          )}
          {eventData.readyToGenerate&&<div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20"><p className="text-xs text-green-400 font-semibold">✓ Listo para generar</p></div>}
        </div>
        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-[10px] text-gray-600 mb-2">Sugerencias rápidas</p>
          <div className="flex flex-wrap gap-1.5">
            {["Entrada libre","Con foto artista","Sin foto","Solo logos","Más artistas","Estilo neon"].map(chip=>(
              <button key={chip} onClick={()=>sendMessage(chip)} disabled={isThinking}
                className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30 transition-all disabled:opacity-30">
                {chip}
              </button>
            ))}
          </div>
        </div>
      </aside>
      {libraryModalOpen&&(
        <ArtistLibraryModal initialSelected={artistsAndLogos} onConfirm={handleArtistLibraryConfirm} onClose={()=>setLibraryModalOpen(false)}/>
      )}
      <style>{`@keyframes dotBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}
