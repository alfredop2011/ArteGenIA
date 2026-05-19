"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArtistLibraryCard, ArtistLibraryModal } from "@/components/wizard/ArtistLibrary";
import type { ArtistEntry } from "@/components/wizard/ArtistLibrary";

// ─── QUICK CHIPS ──────────────────────────────────────────────────────────────

const QUICK_CHIPS = [
  { label: "🎤 Concierto", text: "Concierto" },
  { label: "🪩 Fiesta",    text: "Fiesta" },
  { label: "🎪 Festival",  text: "Festival" },
  { label: "❤️ Bachata",   text: "Bachata" },
  { label: "🪘 Timba",     text: "Timba" },
  { label: "💃 Salsa",     text: "Salsa" },
  { label: "🔥 Reggaeton", text: "Reggaeton" },
  { label: "☕ Brunch",    text: "Brunch" },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [artistsAndLogos, setArtistsAndLogos] = useState<ArtistEntry[]>([]);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState("");
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
      // Step 1: Extract event data
      setGenStep("Analizando tu evento...");
      let extracted = {
        eventName: prompt.slice(0, 60),
        eventType: "event",
        date: "", time: "", venue: "", city: "",
        price: "", isFree: true,
        mainArtist: artistsAndLogos.find(a => a.role === "main")?.name ?? "",
        flyerType: (artistsAndLogos.filter(a => a.type === "artist").length > 0 ? "with_photo" : "no_photo") as "with_photo" | "no_photo",
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
              flyerType: artistsAndLogos.length > 0 ? "with_photo" : null,
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
            eventName:  ed.eventName  ?? prompt.slice(0, 60),
            eventType:  ed.eventType  ?? "event",
            date:       ed.date       ?? "",
            time:       ed.time       ?? "",
            venue:      ed.venue      ?? "",
            city:       ed.city       ?? "",
            price:      ed.price      ?? "",
            isFree:     ed.isFree     ?? true,
            mainArtist: ed.mainArtist ?? artistsAndLogos.find(a => a.role === "main")?.name ?? "",
            flyerType:  artistsAndLogos.filter(a => a.type === "artist").length > 0 ? "with_photo" : "no_photo",
          };
        }
      } catch (e) { console.warn("Extract error:", e); }

      // Step 2: Generate background
      setGenStep("Generando fondo premium...");
      const bgRes = await fetch("/api/generate-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backgroundDescription: prompt,
          eventType: extracted.eventType,
          format: "instagram",
        }),
      });
      if (!bgRes.ok) throw new Error(`generate-bg ${bgRes.status}`);
      const bgData = await bgRes.json() as { url: string; width: number; height: number };

      // Step 3: Remove background from artist photos
      setGenStep("Procesando artistas...");
      const processedArtists: Array<{ name: string; photoUrl: string; role: string }> = [];

      const artistsWithPhoto = artistsAndLogos.filter(a => a.type === "artist" && a.imageSrc);
      for (const artist of artistsWithPhoto) {
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
          processedArtists.push({ name: artist.name, photoUrl: d?.url ?? artist.imageSrc, role: artist.role });
        } catch {
          processedArtists.push({ name: artist.name, photoUrl: artist.imageSrc, role: artist.role });
        }
      }

      // Also include logos (no remove-bg)
      const logos = artistsAndLogos.filter(a => a.type === "logo" && a.imageSrc);
      const processedLogos = logos.map(l => ({ name: l.name, photoUrl: l.imageSrc, role: "logo" }));

      // Step 4: Save and go to preview
      setGenStep("Componiendo preview...");
      const mainArtist = processedArtists.find(a => a.role === "main") ?? processedArtists[0];

      localStorage.setItem("artegenia_generated", JSON.stringify({
        eventName:      extracted.eventName,
        eventDate:      [extracted.date, extracted.time].filter(Boolean).join(" · "),
        eventVenue:     [extracted.venue, extracted.city].filter(Boolean).join(", "),
        eventPrice:     extracted.price || (extracted.isFree ? "Entrada libre" : ""),
        eventType:      extracted.eventType,
        artistPhotoUrl: mainArtist?.photoUrl ?? null,
        artists:        processedArtists,
        logos:          processedLogos,
        artistCount:    processedArtists.length || 1,
        bgUrl:          bgData.url,
        bgWidth:        bgData.width,
        bgHeight:       bgData.height,
        format:         "instagram",
        mode:           extracted.flyerType,
        originalPrompt: prompt,
        generatedAt:    new Date().toISOString(),
      }));

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
    const steps = [
      "Analizando tu evento...",
      "Generando fondo premium...",
      "Procesando artistas...",
      "Componiendo preview...",
    ];
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#0a0a18] flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-6 relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff15" strokeWidth="4"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="#a855f7" strokeWidth="4"
                strokeLinecap="round" strokeDasharray={163} strokeDashoffset={40}
                style={{ transition: "stroke-dashoffset 1s" }}/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Creando tu flyer</h2>
          <p className="text-sm text-purple-400 mb-8">{genStep}</p>
          <div className="space-y-3 text-left">
            {steps.map((s, i) => {
              const currentIdx = steps.indexOf(genStep);
              const isDone = i < currentIdx;
              const isActive = i === currentIdx;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all ${isDone ? "bg-green-500 text-black" : isActive ? "border-2 border-purple-400" : "border-2 border-white/10"}`}>
                    {isDone ? "✓" : isActive ? <div className="w-2.5 h-2.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"/> : ""}
                  </div>
                  <span className={`text-xs transition-colors ${isDone ? "text-green-400" : isActive ? "text-white" : "text-white/20"}`}>
                    {s.replace("...", "")}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-xs text-gray-700">El fondo se genera sin texto — el texto se añade como capa editable</p>
        </div>
      </div>
    );
  }

  // ─── RENDER: CREATE ───────────────────────────────────────────────────────

  const artistCount = artistsAndLogos.filter(a => a.type === "artist").length;
  const logoCount   = artistsAndLogos.filter(a => a.type === "logo").length;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0e0e14] text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">
            Crea tu flyer <span className="text-yellow-400">⚡</span>
          </h1>
          <p className="text-gray-500 text-sm">Describe tu evento, sube las fotos y genera.</p>
        </div>

        {/* Main card */}
        <div className="bg-[#111118] border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 mb-4">

          {/* Textarea */}
          <div className="p-5 pb-3">
            <div className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-3">✦ Describe tu evento</div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              placeholder={'Ej: "Concierto de Don Filosofín, viernes 21 junio, Sala Apolo Barcelona, 25€"\n\nO simplemente: "Fiesta de salsa el sábado en Madrid"'}
              rows={4}
              className="w-full bg-transparent text-white placeholder-gray-600 text-sm leading-relaxed outline-none resize-none"
            />
          </div>

          {/* Quick chips */}
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            {QUICK_CHIPS.map(chip => (
              <button key={chip.text} onClick={() => appendChip(chip.text)}
                className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 transition-all">
                {chip.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]"/>

          {/* Artist Library section */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-white">Artistas y logos</p>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {artistsAndLogos.length === 0
                    ? "Opcional — sube fotos de artistas o logos"
                    : `${artistCount > 0 ? `${artistCount} artista${artistCount > 1 ? "s" : ""}` : ""}${artistCount > 0 && logoCount > 0 ? " · " : ""}${logoCount > 0 ? `${logoCount} logo${logoCount > 1 ? "s" : ""}` : ""}`
                  }
                </p>
              </div>
              {artistsAndLogos.length > 0 && (
                <button onClick={() => setLibraryModalOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all">
                  Editar
                </button>
              )}
            </div>

            {/* ArtistLibraryCard — opens modal on click */}
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
          <span className="text-xl">⚡</span>
          Generar flyer
          {prompt.trim() && <span className="text-xs font-normal opacity-60 ml-1">Cmd+Enter</span>}
        </button>

        <p className="text-center text-[11px] text-gray-700 mt-4">
          El fondo se genera sin texto · Todo es editable después
        </p>
      </div>

      {/* ArtistLibrary Modal */}
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
