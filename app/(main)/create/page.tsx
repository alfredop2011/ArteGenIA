"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles, Check, Zap, ImagePlus,
  Calendar, Clock, MapPin, Euro, X,
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

// ─── EJEMPLOS QUE SE ESCRIBEN SOLOS EN EL PLACEHOLDER ─────────────────────────

const EXAMPLES = [
  "Crea un flyer para un concierto con 2 artistas…",
  "Diseña un cartel para una fiesta este sábado…",
  "Haz un flyer con neón morado y dorado…",
  "Festival con 10 artistas y entrada premium…",
];

// ─── CHIPS QUE SE AÑADEN AL PROMPT ────────────────────────────────────────────

const CHIPS = ["Fiesta este sábado", "Concierto en directo", "Festival al aire libre", "Clase abierta"];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function CreatePage() {
  const router = useRouter();
  // userText = lo que el usuario escribe (sin el sufijo de campos)
  // prompt = derivado: userText + ", " + suffix(fields)
  const [userText, setUserText] = useState("");
  const [artistsAndLogos, setArtistsAndLogos] = useState<ArtistEntry[]>([]);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── Campos estructurados ──────────────────────────────────────────────

  // Fecha: input date simple
  const [date, setDate] = useState("");

  // Hora: toggle fija / rango
  type TimeMode = "none" | "fixed" | "range";
  const [timeMode, setTimeMode] = useState<TimeMode>("none");
  const [timeFixed, setTimeFixed] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");

  // Lugar: sala + ciudad (dos inputs en el mismo popover)
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");

  // Precio: puede ser "free" o lista de precios con etiqueta+monto
  type PriceItem = { id: string; label: string; amount: string };
  type PriceMode = "none" | "free" | "paid";
  const [priceMode, setPriceMode] = useState<PriceMode>("none");
  const [prices, setPrices] = useState<PriceItem[]>([]);

  // Tipo unificado para iterar chips
  type ChipId = "date" | "time" | "place" | "price";
  const [openPopover, setOpenPopover] = useState<ChipId | null>(null);

  // ─── Helpers ──────────────────────────────────────────────────────────

  const formatDateValue = (value: string): string => {
    if (!value) return "";
    try {
      const d = new Date(value);
      return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(".", "");
    } catch {
      return value;
    }
  };

  // === HORA ===
  const timeChipLabel = useCallback((): string => {
    if (timeMode === "fixed" && timeFixed.trim()) return timeFixed.trim();
    if (timeMode === "range") {
      const f = timeFrom.trim();
      const t = timeTo.trim();
      if (f && t) return `${f} — ${t}`;
      if (f) return `Desde ${f}`;
      if (t) return `Hasta ${t}`;
    }
    return "";
  }, [timeMode, timeFixed, timeFrom, timeTo]);

  const timeAsText = timeChipLabel; // mismo formato en chip y en prompt

  const clearTime = useCallback(() => {
    setTimeMode("none");
    setTimeFixed("");
    setTimeFrom("");
    setTimeTo("");
  }, []);

  const selectTimeFixed = useCallback(() => {
    setTimeMode("fixed");
    setTimeFrom("");
    setTimeTo("");
  }, []);

  const selectTimeRange = useCallback(() => {
    setTimeMode("range");
    setTimeFixed("");
  }, []);

  // === LUGAR ===
  const placeChipLabel = useCallback((): string => {
    const v = venue.trim();
    const c = city.trim();
    if (v && c) return `${v} · ${c}`;
    if (v) return v;
    if (c) return c;
    return "";
  }, [venue, city]);

  const placeAsText = useCallback((): string => {
    const v = venue.trim();
    const c = city.trim();
    if (v && c) return `en ${v}, ${c}`;
    if (v) return `en ${v}`;
    if (c) return `en ${c}`;
    return "";
  }, [venue, city]);

  const clearPlace = useCallback(() => {
    setVenue("");
    setCity("");
  }, []);

  // Texto que muestra el chip de precio (compacto)
  const priceChipLabel = useCallback((): string => {
    if (priceMode === "free") return "Entrada libre";
    if (priceMode === "paid" && prices.length > 0) {
      const filled = prices.filter(p => p.label.trim() || p.amount.trim());
      if (filled.length === 0) return "";
      const first = filled[0];
      const firstStr = [first.label, first.amount].filter(Boolean).join(" ").trim();
      if (filled.length === 1) return firstStr;
      return `${firstStr} +${filled.length - 1} más`;
    }
    return "";
  }, [priceMode, prices]);

  // Texto que va al prompt (todos los precios concatenados)
  const priceAsText = useCallback((): string => {
    if (priceMode === "free") return "Entrada libre";
    if (priceMode === "paid" && prices.length > 0) {
      return prices
        .filter(p => p.label.trim() || p.amount.trim())
        .map(p => [p.label, p.amount].filter(Boolean).join(" ").trim())
        .filter(Boolean)
        .join(", ");
    }
    return "";
  }, [priceMode, prices]);

  // Sufijo derivado de TODOS los campos
  const fieldsAsText = useCallback((): string => {
    const parts: string[] = [];
    if (date)                  parts.push(formatDateValue(date));
    const t = timeAsText();
    if (t)                     parts.push(t);
    const p = placeAsText();
    if (p)                     parts.push(p);
    const priceText = priceAsText();
    if (priceText)             parts.push(priceText);
    return parts.join(", ");
  }, [date, timeAsText, placeAsText, priceAsText]);

  // El prompt completo (derivado, sin estado propio)
  const suffix = fieldsAsText();
  const prompt = suffix
    ? (userText.trim() ? `${userText.trim()}, ${suffix}` : suffix)
    : userText;

  // Cuando el usuario edita el textarea, intentamos detectar si la edición
  // está en la parte del sufijo o en la parte de userText
  const handleTextareaChange = useCallback((newValue: string) => {
    if (!suffix) {
      setUserText(newValue);
      return;
    }
    const expectedSuffix = `, ${suffix}`;
    if (newValue.endsWith(expectedSuffix)) {
      setUserText(newValue.slice(0, newValue.length - expectedSuffix.length));
    } else if (newValue.endsWith(suffix)) {
      setUserText(newValue.slice(0, newValue.length - suffix.length).replace(/[,\s]+$/, ""));
    } else {
      // El usuario rompió el sufijo: limpiamos todos los campos
      setUserText(newValue);
      setDate("");
      clearTime();
      clearPlace();
      setPriceMode("none");
      setPrices([]);
    }
  }, [suffix, clearTime, clearPlace]);

  // ─── Price helpers ────────────────────────────────────────────────────
  const addPriceRow = useCallback(() => {
    setPrices(prev => [...prev, { id: Math.random().toString(36).slice(2, 8), label: "", amount: "" }]);
  }, []);

  const updatePriceRow = useCallback((id: string, key: "label" | "amount", value: string) => {
    setPrices(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
  }, []);

  const removePriceRow = useCallback((id: string) => {
    setPrices(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearPrice = useCallback(() => {
    setPriceMode("none");
    setPrices([]);
  }, []);

  const selectFreeMode = useCallback(() => {
    setPriceMode("free");
    setPrices([]);
  }, []);

  const selectPaidMode = useCallback(() => {
    setPriceMode("paid");
    setPrices(prev => prev.length === 0 ? [{ id: Math.random().toString(36).slice(2, 8), label: "", amount: "" }] : prev);
  }, []);

  // ─── Animación typing del placeholder ───────────────────────────────────
  const [animatedText, setAnimatedText] = useState("");
  const [exIdx, setExIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");
  const charIdx = useRef(0);

  useEffect(() => {
    if (prompt) return; // pausar animación cuando el usuario escribe
    const current = EXAMPLES[exIdx];
    let t: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (charIdx.current < current.length) {
        t = setTimeout(() => {
          setAnimatedText(current.slice(0, charIdx.current + 1));
          charIdx.current++;
        }, 40);
      } else {
        t = setTimeout(() => setPhase("pause"), 2000);
      }
    } else if (phase === "pause") {
      t = setTimeout(() => setPhase("erasing"), 400);
    } else {
      if (charIdx.current > 0) {
        t = setTimeout(() => {
          charIdx.current--;
          setAnimatedText(current.slice(0, charIdx.current));
        }, 18);
      } else {
        setExIdx(i => (i + 1) % EXAMPLES.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(t);
  }, [animatedText, phase, exIdx, prompt]);

  // ─── Auto-resize del textarea ──────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [prompt]);

  // ─── Añadir chip al prompt (comportamiento conservado de /create) ───────
  const appendChip = useCallback((text: string) => {
    setUserText(prev => prev ? `${prev}, ${text}` : text);
    textareaRef.current?.focus();
  }, []);

  // ─── GENERATE (lógica completa de /create, intacta) ─────────────────────

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
        eventName:   extracted.eventName,
        eventDate:   [extracted.date, extracted.time].filter(Boolean).join(" · "),
        eventVenue:  [extracted.venue, extracted.city].filter(Boolean).join(", "),
        eventPrice:  extracted.price || (extracted.isFree ? "Entrada libre" : ""),
        eventType:   extracted.eventType,
        artistPhotoUrl: processedArtists[0]?.photoUrl ?? null,
        artists:        processedArtists,
        logos:          processedLogos,
        artistCount:    processedArtists.length || 1,
        bgUrl:    bgData.url,
        bgWidth:  bgData.width,
        bgHeight: bgData.height,
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

  // ─── RENDER: GENERATING (intacto de /create) ─────────────────────────────

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
            <div className="absolute inset-0 flex items-center justify-center text-purple-400">
              <Sparkles size={22} strokeWidth={1.8} className="animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white mb-2">Creando tu flyer</h2>
          <p className="text-sm text-gray-500 mb-8">{genStep}</p>

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

  // ─── RENDER: CREATE — diseño HeroChat estilo home ──────────────────────────

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#0e0e14] text-white flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-5xl mx-auto">

        {/* Título estilo home */}
        <div className="text-center mb-8">
          <h1 className="font-black tracking-tight mb-2"
              style={{ fontSize: "clamp(1.9rem, 3.2vw, 3rem)" }}>
            Diseña flyers que{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">
              impactan
            </span>
          </h1>
          <p className="text-gray-400 text-sm">
            Describe tu evento y la <span className="text-purple-400 font-semibold">IA</span> genera el flyer perfecto.
          </p>
        </div>

        {/* === HERO CHAT (idéntico visualmente al home) === */}
        <div className="rounded-3xl overflow-hidden mb-6"
          style={{
            background: "rgba(17,17,31,0.80)",
            border: "1px solid rgba(168,85,247,0.50)",
            boxShadow: "0 0 60px rgba(168,85,247,0.30), 0 0 120px rgba(168,85,247,0.10), 0 20px 60px rgba(0,0,0,0.4)",
            backdropFilter: "blur(20px)",
          }}>

          {/* Input row */}
          <div className="relative px-5 pt-3 pb-2">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => handleTextareaChange(e.target.value)}
              rows={1}
              className="w-full bg-transparent text-white text-base outline-none resize-none leading-relaxed"
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  handleGenerate();
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
            />
            {!prompt && (
              <div className="absolute top-3 left-5 text-gray-500 text-base pointer-events-none select-none">
                {animatedText}<span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse align-middle" />
              </div>
            )}
          </div>

          {/* Chips (se AÑADEN al prompt, no sustituyen) */}
          <div className="px-5 pb-2 flex flex-wrap gap-1.5">
            {CHIPS.map(c => (
              <button key={c} onClick={() => appendChip(c)}
                className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-gray-400 hover:text-white transition-all">
                {c}
              </button>
            ))}
          </div>

          {/* Campos estructurados: Fecha, Hora, Lugar, Precio (con popover) */}
          <div className="border-t border-white/[0.06] px-5 py-2 flex items-center gap-2 overflow-visible relative flex-wrap">

            {/* === Chip 1: Fecha === */}
            <div className="relative">
              {(() => {
                const isOpen = openPopover === "date";
                const hasValue = !!date;
                const displayValue = formatDateValue(date);
                return (
                  <>
                    <button
                      onClick={() => setOpenPopover(isOpen ? null : "date")}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                        hasValue
                          ? "border-purple-500/40 bg-purple-500/15 text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20"
                      }`}
                    >
                      <Calendar size={12} strokeWidth={1.8} />
                      {hasValue ? displayValue : "Fecha"}
                      {hasValue && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); setDate(""); }}
                          className="ml-0.5 text-purple-300 hover:text-white"
                        >
                          <X size={11} strokeWidth={2.2} />
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenPopover(null)} />
                        <div
                          className="absolute top-full left-0 mt-1.5 z-50 min-w-[220px] p-2 rounded-xl border border-white/10 shadow-2xl"
                          style={{
                            background: "rgba(20,20,32,0.98)",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.2)",
                          }}
                        >
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpenPopover(null); } }}
                            autoFocus
                            className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40"
                          />
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            {/* === Chip 2: Hora (toggle Fija / Rango) === */}
            <div className="relative">
              {(() => {
                const isOpen = openPopover === "time";
                const chipText = timeChipLabel();
                const hasValue = !!chipText;
                return (
                  <>
                    <button
                      onClick={() => setOpenPopover(isOpen ? null : "time")}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                        hasValue
                          ? "border-purple-500/40 bg-purple-500/15 text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20"
                      }`}
                    >
                      <Clock size={12} strokeWidth={1.8} />
                      {hasValue ? chipText : "Hora"}
                      {hasValue && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); clearTime(); }}
                          className="ml-0.5 text-purple-300 hover:text-white"
                        >
                          <X size={11} strokeWidth={2.2} />
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenPopover(null)} />
                        <div
                          className="absolute top-full left-0 mt-1.5 z-50 w-[300px] p-3 rounded-xl border border-white/10 shadow-2xl"
                          style={{
                            background: "rgba(20,20,32,0.98)",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.2)",
                          }}
                        >
                          {/* Toggle: Hora fija / Rango horario */}
                          <div className="flex gap-1 p-0.5 mb-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                            <button
                              onClick={selectTimeFixed}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                timeMode === "fixed"
                                  ? "bg-purple-500 text-white"
                                  : "text-gray-400 hover:text-white"
                              }`}
                            >
                              Hora fija
                            </button>
                            <button
                              onClick={selectTimeRange}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                timeMode === "range"
                                  ? "bg-purple-500 text-white"
                                  : "text-gray-400 hover:text-white"
                              }`}
                            >
                              Rango horario
                            </button>
                          </div>

                          {timeMode === "fixed" && (
                            <input
                              type="text"
                              value={timeFixed}
                              onChange={(e) => setTimeFixed(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpenPopover(null); } }}
                              placeholder="Ej: 22:00"
                              autoFocus
                              className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40"
                            />
                          )}

                          {timeMode === "range" && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Desde</label>
                                <input
                                  type="text"
                                  value={timeFrom}
                                  onChange={(e) => setTimeFrom(e.target.value)}
                                  placeholder="22:00"
                                  autoFocus
                                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/40"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Hasta</label>
                                <input
                                  type="text"
                                  value={timeTo}
                                  onChange={(e) => setTimeTo(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpenPopover(null); } }}
                                  placeholder="06:00"
                                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/40"
                                />
                              </div>
                            </div>
                          )}

                          {timeMode === "none" && (
                            <p className="text-xs text-gray-500 text-center py-2">Elige una opción</p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            {/* === Chip 3: Lugar (Sala + Ciudad) === */}
            <div className="relative">
              {(() => {
                const isOpen = openPopover === "place";
                const chipText = placeChipLabel();
                const hasValue = !!chipText;
                return (
                  <>
                    <button
                      onClick={() => setOpenPopover(isOpen ? null : "place")}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                        hasValue
                          ? "border-purple-500/40 bg-purple-500/15 text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20"
                      }`}
                    >
                      <MapPin size={12} strokeWidth={1.8} />
                      {hasValue ? chipText : "Lugar"}
                      {hasValue && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); clearPlace(); }}
                          className="ml-0.5 text-purple-300 hover:text-white"
                        >
                          <X size={11} strokeWidth={2.2} />
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenPopover(null)} />
                        <div
                          className="absolute top-full left-0 mt-1.5 z-50 w-[300px] p-3 rounded-xl border border-white/10 shadow-2xl"
                          style={{
                            background: "rgba(20,20,32,0.98)",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.2)",
                          }}
                        >
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Sala</label>
                              <input
                                type="text"
                                value={venue}
                                onChange={(e) => setVenue(e.target.value)}
                                placeholder="Ej: Sala Apolo"
                                autoFocus
                                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/40"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 uppercase tracking-wide mb-1">Ciudad</label>
                              <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpenPopover(null); } }}
                                placeholder="Ej: Madrid"
                                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/40"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            {/* === Chip especial: Precio === */}
            <div className="relative">
              {(() => {
                const isOpen = openPopover === "price";
                const chipText = priceChipLabel();
                const hasValue = !!chipText;
                return (
                  <>
                    <button
                      onClick={() => setOpenPopover(isOpen ? null : "price")}
                      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                        hasValue
                          ? "border-purple-500/40 bg-purple-500/15 text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20"
                      }`}
                    >
                      <Euro size={12} strokeWidth={1.8} />
                      {hasValue ? chipText : "Precio"}
                      {hasValue && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); clearPrice(); }}
                          className="ml-0.5 text-purple-300 hover:text-white"
                        >
                          <X size={11} strokeWidth={2.2} />
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenPopover(null)} />
                        <div
                          className="absolute top-full left-0 mt-1.5 z-50 w-[340px] p-3 rounded-xl border border-white/10 shadow-2xl"
                          style={{
                            background: "rgba(20,20,32,0.98)",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.2)",
                          }}
                        >
                          {/* Toggle: Entrada libre / Con precio */}
                          <div className="flex gap-1 p-0.5 mb-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                            <button
                              onClick={selectFreeMode}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                priceMode === "free"
                                  ? "bg-purple-500 text-white"
                                  : "text-gray-400 hover:text-white"
                              }`}
                            >
                              Entrada libre
                            </button>
                            <button
                              onClick={selectPaidMode}
                              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                priceMode === "paid"
                                  ? "bg-purple-500 text-white"
                                  : "text-gray-400 hover:text-white"
                              }`}
                            >
                              Con precio
                            </button>
                          </div>

                          {/* Lista de precios (solo si paid) */}
                          {priceMode === "paid" && (
                            <div className="space-y-2">
                              {prices.map((p, idx) => (
                                <div key={p.id} className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={p.label}
                                    onChange={(e) => updatePriceRow(p.id, "label", e.target.value)}
                                    placeholder="Etiqueta"
                                    autoFocus={idx === prices.length - 1 && !p.label && !p.amount}
                                    className="flex-1 min-w-0 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/40"
                                  />
                                  <input
                                    type="text"
                                    value={p.amount}
                                    onChange={(e) => updatePriceRow(p.id, "amount", e.target.value)}
                                    placeholder="8€"
                                    className="w-20 bg-white/[0.04] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/40"
                                  />
                                  <button
                                    onClick={() => removePriceRow(p.id)}
                                    className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                    title="Eliminar precio"
                                  >
                                    <X size={13} strokeWidth={2} />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={addPriceRow}
                                className="w-full text-xs py-1.5 rounded-lg border border-dashed border-white/15 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/40 transition-all"
                              >
                                + Añadir precio
                              </button>
                            </div>
                          )}

                          {priceMode === "free" && (
                            <p className="text-xs text-gray-500 text-center py-2">
                              El flyer indicará que la entrada es libre
                            </p>
                          )}

                          {priceMode === "none" && (
                            <p className="text-xs text-gray-500 text-center py-2">
                              Elige una opción
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Artistas y logos — DENTRO del mismo container, sección inferior */}
          <div className="border-t border-white/[0.06] px-5 py-4">
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-400 mb-2.5">
              <ImagePlus size={13} strokeWidth={1.8} />
              Artistas y logos <span className="text-gray-600">(opcional)</span>
            </div>
            <ArtistLibraryCard
              selected={artistsAndLogos}
              onOpen={() => setLibraryModalOpen(true)}
            />
          </div>

          {/* Botón Generar — última sección, alineado a la derecha */}
          <div className="border-t border-white/[0.06] px-5 py-3 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                prompt.trim()
                  ? "text-white hover:scale-105"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              }`}
              style={prompt.trim() ? {
                background: "linear-gradient(135deg, #7c3aed, #c026d3, #d97706)",
                boxShadow: "0 0 25px rgba(168,85,247,0.55), 0 4px 15px rgba(0,0,0,0.3)"
              } : {}}>
              <Sparkles size={15} strokeWidth={2} />
              Generar flyer
            </button>
          </div>
        </div>

        {/* Footer info debajo del container */}
        <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-gray-600">
          <Zap size={11} strokeWidth={2} className="text-yellow-500/60" />
          El fondo se genera sin texto · Todo es editable después
        </div>
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
