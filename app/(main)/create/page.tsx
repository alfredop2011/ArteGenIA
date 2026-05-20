"use client";

import { useState, useRef, useCallback } from "react";
import {
  Mic2, Sparkle, Tent, Footprints,
  Sparkles, Check, Zap, ImagePlus, type LucideIcon,
} from "lucide-react";
import { ArtistLibraryCard, ArtistLibraryModal } from "@/components/wizard/ArtistLibrary";
import type { ArtistEntry } from "@/components/wizard/ArtistLibrary";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────



type ExtractedData = {
  eventName: string;
  eventType: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  price: string;
  isFree: boolean;
  mainArtist: string;
  flyerType: "with_photo" | "no_photo";
};

// ─── QUICK CHIPS ──────────────────────────────────────────────────────────────

const QUICK_CHIPS: { icon: LucideIcon; label: string; text: string }[] = [
  { icon: Mic2,        label: "Concierto", text: "Concierto" },
  { icon: Sparkle,     label: "Fiesta",    text: "Fiesta" },
  { icon: Tent,        label: "Festival",  text: "Festival" },
  { icon: Footprints,  label: "Clases",    text: "Clases" },
];

function uid() { return Math.random().toString(36).slice(2, 8); }

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [artistsAndLogos, setArtistsAndLogos] = useState<ArtistEntry[]>([]);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const appendChip = useCallback((text: string) => {
    setPrompt(prev => prev ? `${prev}, ${text}` : text);
    textareaRef.current?.focus();
  }, []);

  // ─── GENERATE ─────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      // Step 1: Extract event data from prompt using AI
      setGenStep("Analizando tu evento...");
      let extracted: ExtractedData = {
        eventName: prompt.slice(0, 60),
        eventType: "event",
        date: "", time: "", venue: "", city: "",
        price: "", isFree: true,
        mainArtist: artistsAndLogos[0]?.name ?? "",
        flyerType: artistsAndLogos.filter(a=>a.type==="artist").length > 0 ? "with_photo" : "no_photo",
      };

      try {
        const extractRes = await fetch("/api/chat-wizard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latestUserMessage: prompt,
            currentEventData: {
              eventName: null, eventType: null, date: null, time: null,
              venue: null, city: null, isFree: null, price: null,
              mainArtist: null, additionalArtists: [], artists: [], artistCount: 1,
              flyerType: artistsAndLogos.filter(a=>a.type==="artist").length > 0 ? "with_photo" : null,
              backgroundDescription: null, format: null,
              extraNotes: null, readyToGenerate: false, needsPhotoUpload: false, missingFields: [],
            },
            recentContext: [],
          }),
        });
        if (extractRes.ok) {
          const d = await extractRes.json();
          const ed = d.eventData;
          extracted = {
            eventName: ed.eventName ?? prompt.slice(0, 60),
            eventType: ed.eventType ?? "event",
            date: ed.date ?? "",
            time: ed.time ?? "",
            venue: ed.venue ?? "",
            city: ed.city ?? "",
            price: ed.price ?? "",
            isFree: ed.isFree ?? true,
            mainArtist: ed.mainArtist ?? artistsAndLogos[0]?.name ?? "",
            flyerType: artistsAndLogos.filter(a=>a.type==="artist").length > 0 ? "with_photo" : "no_photo",
          };
        }
      } catch (e) { console.warn("Extract error:", e); }

      // Step 2: Generate background
      setGenStep("Generando fondo premium...");
      const bgRes = await fetch("/api/generate-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // CRITICAL: never send event name as background description
          // Only send event TYPE/ATMOSPHERE — the name goes as text layer, not in the image
          backgroundDescription: extracted.eventType ?? prompt.split(",")[0].trim(),

          eventType: extracted.eventType,
          format: "instagram",
        }),
      });
      if (!bgRes.ok) throw new Error(`generate-bg ${bgRes.status}`);
      const bgData = await bgRes.json() as { url: string; width: number; height: number };

      // Step 3: Remove background from artist photos
      setGenStep("Procesando artistas...");
      const processedArtists: Array<{ name: string; photoUrl: string }> = [];
      // Logos — keep as-is (no remove-bg), use base64 directly
      const logosData = artistsAndLogos.filter(a => a.type === "logo" && a.imageSrc);
      // Compress logos to avoid localStorage quota
      const processedLogos = logosData.map(l => {
        try {
          const canvas = document.createElement("canvas");
          const img = new window.Image();
          img.src = l.imageSrc;
          canvas.width = 200;
          canvas.height = 200 * (img.naturalHeight || 1) / (img.naturalWidth || 1);
          const ctx2 = canvas.getContext("2d");
          if (ctx2) ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
          return { name: l.name, photoUrl: canvas.toDataURL("image/jpeg", 0.5) };
        } catch {
          return { name: l.name, photoUrl: l.imageSrc.slice(0, 50000) };
        }
      });

      for (const artist of artistsAndLogos.filter(a => a.type === "artist" && a.imageSrc)) {
        try {
          const [meta, b64] = artist.imageSrc.split(",");
          const mime = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
          const bin = atob(b64);
          const u8 = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
          const fd = new FormData();
          fd.append("image_file", new Blob([u8], { type: mime }), artist.name + ".png");
          const r = await fetch("/api/remove-bg", { method: "POST", body: fd });
          const d = r.ok ? await r.json() as { url: string } : null;
          processedArtists.push({ name: artist.name, photoUrl: d?.url ?? artist.imageSrc });
        } catch {
          processedArtists.push({ name: artist.name, photoUrl: artist.imageSrc.substring(0, 100000) });
        }
      }

      // Step 4: Save to localStorage and go to preview
      setGenStep("Componiendo preview...");
      const generatedData = {
        // Event info
        eventName:   extracted.eventName,
        eventDate:   [extracted.date, extracted.time].filter(Boolean).join(" · "),
        eventVenue:  [extracted.venue, extracted.city].filter(Boolean).join(", "),
        eventPrice:  extracted.price || (extracted.isFree ? "Entrada libre" : ""),
        eventType:   extracted.eventType,
        // Artists
        artistPhotoUrl: processedArtists[0]?.photoUrl ?? null,
        artists:        processedArtists,
        logos:          processedLogos,
        artistCount:    processedArtists.length || 1,
        // Background
        bgUrl:    bgData.url,
        bgWidth:  bgData.width,
        bgHeight: bgData.height,
        // Meta
        format:      "instagram",
        mode:        extracted.flyerType,
        originalPrompt: prompt,
        generatedAt: new Date().toISOString(),
      };

      localStorage.setItem("artegenia_generated", JSON.stringify(generatedData));
      router.push("/preview");
    } catch (err) {
      console.error("Error:", err);
      alert(`Error: ${err instanceof Error ? err.message : "desconocido"}`);
      setIsGenerating(false);
      setGenStep("");
    }
  }, [prompt, artistsAndLogos, router]);

  // ─── RENDER: GENERATING ───────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#0a0a18] flex flex-col items-center justify-center p-8 gap-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff15" strokeWidth="4"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="#a855f7" strokeWidth="4"
                strokeLinecap="round" strokeDasharray={163} strokeDashoffset={40}
                style={{ transition: "stroke-dashoffset 1s" }}/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-purple-400"><Sparkles size={22} strokeWidth={1.8} className="animate-pulse" /></div>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Creando tu flyer</h2>
          <p className="text-sm text-gray-500 mb-8">{genStep}</p>

          {/* Steps */}
          <div className="space-y-3 text-left">
            {[
              { label: "Analizando evento", done: genStep !== "Analizando tu evento..." },
              { label: "Generando fondo premium", done: !["Analizando tu evento...", "Generando fondo premium..."].includes(genStep) },
              { label: "Procesando artistas",     done: genStep === "Componiendo preview..." },
              { label: "Componiendo preview",     done: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  s.done ? "bg-green-500 text-black" : genStep.includes(s.label.split(" ")[0]) ? "border-2 border-purple-400" : "border-2 border-white/10"
                }`}>
                  {s.done ? <Check size={11} strokeWidth={3} /> : genStep.includes(s.label.split(" ")[0]) ?
                    <div className="w-2.5 h-2.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/> : ""}
                </div>
                <span className={`text-xs ${s.done ? "text-green-400" : genStep.includes(s.label.split(" ")[0]) ? "text-white" : "text-white/20"}`}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-xs text-gray-600">El fondo se genera sin texto — el texto se añade como capa editable</div>
        </div>
      </div>
    );
  }

  // ─── RENDER: CREATE ───────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0e0e14] text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 inline-flex items-center gap-2">
            Crea tu flyer
            <Zap size={28} strokeWidth={2.2} className="text-yellow-400 fill-yellow-400" />
          </h1>
          <p className="text-gray-500 text-sm">Describe tu evento y sube la foto del artista. Listo.</p>
        </div>

        {/* Main input card */}
        <div className="bg-[#111118] border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 mb-4">

          {/* Text area */}
          <div className="p-5 pb-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-3">
              <Sparkles size={11} strokeWidth={2} />
              Describe tu evento
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              placeholder={'Ej: "Concierto de Don Filosofín, viernes 21 junio, Sala Apolo Barcelona, 25€"\n\nO simplemente: "Festival de música el sábado en Madrid"'}
              rows={4}
              className="w-full bg-transparent text-white placeholder-gray-600 text-sm leading-relaxed outline-none resize-none"
            />
          </div>

          {/* Quick chips */}
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {QUICK_CHIPS.map(chip => {
              const Icon = chip.icon;
              return (
                <button key={chip.text} onClick={() => appendChip(chip.text)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all">
                  <Icon size={13} strokeWidth={1.8} />
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]"/>

          {/* Artist Library */}
          <div className="p-5">
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 mb-3">
              <ImagePlus size={13} strokeWidth={1.8} />
              Artistas y logos <span className="text-gray-700">(opcional)</span>
            </div>
            <ArtistLibraryCard
              selected={artistsAndLogos}
              onOpen={() => setLibraryModalOpen(true)}
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          className={`w-full py-4 rounded-2xl text-base font-black transition-all flex items-center justify-center gap-3 ${
            prompt.trim()
              ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-400/20"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          }`}>
          <Zap size={20} strokeWidth={2.4} className={prompt.trim() ? "fill-black" : ""} />
          Generar flyer
          {prompt.trim() && <span className="text-xs font-normal opacity-60 ml-1">Cmd+Enter</span>}
        </button>

        {/* Footer note */}
        <p className="text-center text-[11px] text-gray-700 mt-4">
          El fondo se genera sin texto · Todo es editable después
        </p>
      </div>

      {libraryModalOpen && (
        <ArtistLibraryModal
          initialSelected={artistsAndLogos}
          onConfirm={entries => {
            setArtistsAndLogos(entries);
            setLibraryModalOpen(false);
          }}
          onClose={() => setLibraryModalOpen(false)}
        />
      )}
    </div>
  );
}
