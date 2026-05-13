"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import GenerationScreen from "@/components/create/GenerationScreen";

const PLACEHOLDERS = [
  "Concierto de Don Filosofín el 21 de junio en Barcelona, precio 25€...",
  "Fiesta de cumpleaños de María, sábado 14 julio, Club Neon Madrid...",
  "Festival de salsa con 5 artistas, domingo en Valencia, entrada libre...",
  "DJ Set de Neon Pulse, viernes 28 junio, Sala Apolo Barcelona, 15€...",
  "Gala de flamenco, Teatro Principal Sevilla, 10 agosto, desde 30€...",
];

const STYLE_OPTIONS = [
  { id: "urbano",   label: "Urbano",    emoji: "🏙️" },
  { id: "elegante", label: "Elegante",  emoji: "✨" },
  { id: "neon",     label: "Neón",      emoji: "💜" },
  { id: "festival", label: "Festival",  emoji: "🎪" },
  { id: "minima",   label: "Minimal",   emoji: "◻️" },
  { id: "retro",    label: "Retro",     emoji: "🎞️" },
];

const COLOR_PALETTES = [
  { id: "dorado",   colors: ["#f5c518", "#7c3aed", "#0d0d1a"], label: "Dorado & Morado" },
  { id: "neon",     colors: ["#00f5ff", "#ff00aa", "#0a0a1a"], label: "Neón" },
  { id: "rojo",     colors: ["#ef4444", "#111827", "#f9fafb"], label: "Rojo & Negro" },
  { id: "verde",    colors: ["#22c55e", "#064e3b", "#f0fdf4"], label: "Verde Naturaleza" },
  { id: "rosa",     colors: ["#ec4899", "#be185d", "#fdf2f8"], label: "Rosa Vibrante" },
  { id: "azul",     colors: ["#3b82f6", "#1e3a5f", "#eff6ff"], label: "Azul Profundo" },
];

const FORMAT_OPTIONS = [
  { id: "instagram", label: "Instagram", size: "1080×1350", icon: "📱" },
  { id: "historia",  label: "Historia",  size: "1080×1920", icon: "⬆️" },
  { id: "cuadrado",  label: "Cuadrado",  size: "1080×1080", icon: "⬜" },
  { id: "evento",    label: "Evento",    size: "1920×1080", icon: "🖥️" },
];

const AI_PROCESS_STEPS = [
  { id: 1, label: "Analizando prompt",      sub: "Extrayendo información del evento" },
  { id: 2, label: "Eligiendo estilo",       sub: "Seleccionando paleta y tipografías" },
  { id: 3, label: "Generando fondo",        sub: "Creando atmósfera visual" },
  { id: 4, label: "Procesando artista",     sub: "Eliminando fondo de la foto" },
  { id: 5, label: "Componiendo capas",      sub: "Nombre, lugar, precio, fecha" },
  { id: 6, label: "Preparando variaciones", sub: "3 versiones del diseño" },
];

export default function CreatePage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState("urbano");
  const [selectedPalette, setSelectedPalette] = useState("dorado");
  const [selectedFormat, setSelectedFormat] = useState("instagram");
  const [artistPhotos, setArtistPhotos] = useState<{url: string; name: string}[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadLink, setUploadLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Campos adicionales
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventPrice, setEventPrice] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const addPhotos = (files: FileList | File[]) => {
    Array.from(files).filter(f => f.type.startsWith("image/")).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        setArtistPhotos(prev => [...prev, { url: ev.target?.result as string, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addPhotos(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addPhotos(e.dataTransfer.files);
  };

  const generateUploadLink = async () => {
    setGeneratingLink(true);
    try {
      const name = eventName || "mi-evento";
      const res = await fetch(`/api/artist-upload?project=${encodeURIComponent(name)}&creator=ArteGenIA`);
      const data = await res.json();
      setUploadLink(data.url);
    } catch {
      setUploadLink(`${window.location.origin}/upload/demo-${Date.now().toString(36)}`);
    }
    setGeneratingLink(false);
  };

  const copyLink = () => {
    if (!uploadLink) return;
    navigator.clipboard.writeText(uploadLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !eventName.trim()) return;
    setIsGenerating(true);
    setCurrentStep(1);
    setStepProgress(0);

    for (let step = 1; step <= AI_PROCESS_STEPS.length; step++) {
      setCurrentStep(step);
      const duration = step === 4 ? 2200 : step === 6 ? 1800 : 1200;
      const start = Date.now();
      await new Promise<void>(res => {
        const tick = () => {
          const elapsed = Date.now() - start;
          const pct = Math.min((elapsed / duration) * 100, 100);
          setStepProgress(pct);
          if (pct < 100) requestAnimationFrame(tick);
          else res();
        };
        requestAnimationFrame(tick);
      });
    }

    setTimeout(() => router.push("/templates"), 600);
  };

  const canGenerate = prompt.trim().length > 10 || eventName.trim().length > 2;
  const artistPhoto = artistPhotos[0]?.url ?? null;
  const palette = COLOR_PALETTES.find(p => p.id === selectedPalette)!;

  return (
    <div className="min-h-screen bg-[#0e0e14] text-white">
      {!isGenerating ? (
        /* ─── FORMULARIO ─── */
        <div className="max-w-3xl mx-auto px-4 py-10">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-4">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              IA generativa para flyers profesionales
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3">
              Describe tu <span className="text-yellow-400">evento</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Escribe una frase y la IA diseñará tu flyer en segundos
            </p>
          </div>

          {/* Prompt principal */}
          <div className="relative mb-6">
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] focus-within:border-purple-500/50 focus-within:bg-white/[0.05] transition-all">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                className="w-full bg-transparent px-5 pt-5 pb-16 text-white placeholder-transparent resize-none outline-none text-base leading-relaxed"
                placeholder=" "
              />
              {/* Placeholder animado */}
              {!prompt && (
                <div
                  className="absolute top-5 left-5 right-5 text-gray-500 text-base leading-relaxed pointer-events-none transition-opacity duration-400 select-none"
                  style={{ opacity: placeholderVisible ? 1 : 0 }}
                >
                  {PLACEHOLDERS[placeholderIdx]}
                </div>
              )}
              {/* Barra inferior del textarea */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{prompt.length}/500</span>
                  {prompt.length > 10 && (
                    <span className="text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      Listo para generar
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-gray-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                >
                  {showAdvanced ? "▲" : "▼"} Campos detallados
                </button>
              </div>
            </div>
          </div>

          {/* Campos avanzados (expandibles) */}
          <div
            className="overflow-hidden transition-all duration-500"
            style={{ maxHeight: showAdvanced ? "600px" : "0px", opacity: showAdvanced ? 1 : 0 }}
          >
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "Nombre del evento", value: eventName, set: setEventName, placeholder: "Don Filosofín Live", icon: "🎤", col: "col-span-2" },
                { label: "Fecha", value: eventDate, set: setEventDate, placeholder: "Sábado 21 de junio, 2025", icon: "📅" },
                { label: "Precio / Entrada", value: eventPrice, set: setEventPrice, placeholder: "25€ anticipada", icon: "🎟️" },
                { label: "Lugar / Sala", value: eventVenue, set: setEventVenue, placeholder: "Sala Apolo", icon: "📍" },
                { label: "Dirección", value: eventAddress, set: setEventAddress, placeholder: "Carrer de la Nou de la Rambla 113, Barcelona", icon: "🗺️", col: "col-span-2" },
              ].map(field => (
                <div key={field.label} className={`flex flex-col gap-1.5 ${field.col ?? ""}`}>
                  <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                    <span>{field.icon}</span> {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 focus:bg-white/[0.06] transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Foto del artista */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <span>📸</span> Fotos del artista
                <span className="text-xs text-gray-600 font-normal">(el fondo se elimina con IA)</span>
              </p>
              {artistPhotos.length > 0 && (
                <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                  {artistPhotos.length} foto{artistPhotos.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />

            {/* Zona drag & drop */}
            <div
              onDrop={onDrop}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer mb-3 ${
                isDragging
                  ? "border-purple-400 bg-purple-500/10 scale-[1.01]"
                  : "border-white/10 bg-white/[0.03] hover:border-purple-500/30 hover:bg-purple-500/5"
              }`}
              style={{ minHeight: artistPhotos.length ? 64 : 160 }}
            >
              {artistPhotos.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-all ${isDragging ? "bg-purple-500/20 scale-110" : "bg-white/5"}`}>
                    {isDragging ? "⬇️" : "📸"}
                  </div>
                  <div className="text-center">
                    <p className="text-white/80 text-sm font-medium">{isDragging ? "Suelta las fotos aquí" : "Arrastra las fotos aquí"}</p>
                    <p className="text-gray-600 text-xs mt-1">o haz clic · JPG, PNG · múltiples fotos · máx. 15MB c/u</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <span className="text-xl">{isDragging ? "⬇️" : "➕"}</span>
                  <p className="text-sm text-gray-500">{isDragging ? "Suelta para añadir más" : "Clic o arrastra para añadir más fotos"}</p>
                </div>
              )}
            </div>

            {/* Grid de fotos subidas */}
            {artistPhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {artistPhotos.map((photo, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                      <button
                        onClick={e => { e.stopPropagation(); setArtistPhotos(prev => prev.filter((_, idx) => idx !== i)); }}
                        className="w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-purple-600/80 text-[9px] text-white text-center py-0.5 font-semibold">
                        PRINCIPAL
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Botón de solicitar link al artista */}
            <div className="border border-white/8 rounded-2xl p-4 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🔗</span>
                <p className="text-sm font-semibold text-white">Pedir foto al artista</p>
                <span className="text-[10px] bg-yellow-400/15 text-yellow-400 px-2 py-0.5 rounded-full">Nuevo</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Genera un enlace único y envíaselo. El artista sube su foto y queda aquí automáticamente.
              </p>

              {!uploadLink ? (
                <button
                  onClick={generateUploadLink}
                  disabled={generatingLink}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
                >
                  {generatingLink ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando link...</>
                  ) : (
                    <><span>✨</span> Generar link de solicitud</>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
                    <span className="text-xs text-purple-300 flex-1 truncate font-mono">{uploadLink}</span>
                    <button
                      onClick={copyLink}
                      className={`shrink-0 text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                        linkCopied ? "bg-green-500 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"
                      }`}
                    >
                      {linkCopied ? "✓ Copiado" : "Copiar"}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Hola! Por favor sube tu foto aquí para el flyer: ${uploadLink}`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl bg-green-600/20 border border-green-500/20 text-green-400 text-xs font-semibold text-center hover:bg-green-600/30 transition-all"
                    >
                      📱 WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=Sube tu foto para el flyer&body=Hola! Por favor sube tu foto aquí: ${uploadLink}`}
                      className="flex-1 py-2 rounded-xl bg-blue-600/20 border border-blue-500/20 text-blue-400 text-xs font-semibold text-center hover:bg-blue-600/30 transition-all"
                    >
                      ✉️ Email
                    </a>
                    <button
                      onClick={() => { setUploadLink(null); }}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-xs hover:text-gray-300 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-700 text-center">Caduca en 7 días · Las fotos aparecerán aquí al instante</p>
                </div>
              )}
            </div>
          </div>

          {/* Estilo */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-300 mb-3">🎨 Estilo visual</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedStyle(opt.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                    selectedStyle === opt.id
                      ? "border-purple-500 bg-purple-500/15 text-purple-300"
                      : "border-white/8 bg-white/[0.03] text-gray-400 hover:border-white/15 hover:text-gray-300"
                  }`}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paleta de colores */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-300 mb-3">🌈 Paleta de colores</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COLOR_PALETTES.map(pal => (
                <button
                  key={pal.id}
                  onClick={() => setSelectedPalette(pal.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    selectedPalette === pal.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/8 bg-white/[0.03] hover:border-white/15"
                  }`}
                >
                  <div className="flex gap-1 shrink-0">
                    {pal.colors.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${selectedPalette === pal.id ? "text-purple-300" : "text-gray-400"}`}>
                    {pal.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Formato */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-300 mb-3">📐 Formato</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FORMAT_OPTIONS.map(fmt => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border transition-all ${
                    selectedFormat === fmt.id
                      ? "border-yellow-400/50 bg-yellow-400/8 text-yellow-400"
                      : "border-white/8 bg-white/[0.03] text-gray-400 hover:border-white/15"
                  }`}
                >
                  <span className="text-xl">{fmt.icon}</span>
                  <span className="text-xs font-semibold">{fmt.label}</span>
                  <span className="text-[10px] opacity-60">{fmt.size}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botón generar */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`w-full py-4 rounded-2xl text-base font-black tracking-wide transition-all duration-300 flex items-center justify-center gap-3 ${
              canGenerate
                ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-400/20 active:scale-[0.98]"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            <span className="text-xl">⚡</span>
            Generar flyer con IA
            <span className="text-sm font-normal opacity-70">~5 segundos</span>
          </button>

          {canGenerate && (
            <p className="text-center text-xs text-gray-600 mt-3">
              Se usará 1 crédito · Paleta: {palette.label} · Estilo: {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label}
            </p>
          )}
        </div>

      ) : (
        /* ─── PANTALLA DE GENERACIÓN ─── */
        <GenerationScreen
          palette={palette}
          style={STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label ?? selectedStyle}
          format={FORMAT_OPTIONS.find(f => f.id === selectedFormat)?.label ?? selectedFormat}
          eventName={eventName || prompt}
          eventDate={eventDate}
          eventVenue={eventVenue}
          eventPrice={eventPrice}
          artistPhoto={artistPhoto}
          onDone={() => router.push("/templates")}
        />
      )}

      <style>{`
        @keyframes waveBar {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
      `}</style>
    </div>
  );
}
