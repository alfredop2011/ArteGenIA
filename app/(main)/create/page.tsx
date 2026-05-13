"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [artistPhoto, setArtistPhoto] = useState<string | null>(null);
  const [artistFileName, setArtistFileName] = useState<string | null>(null);
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArtistFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setArtistPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
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
            <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <span>📸</span> Foto del artista
              <span className="text-xs text-gray-600 font-normal">(opcional — se eliminará el fondo automáticamente)</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {artistPhoto ? (
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-500/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artistPhoto} alt="Artista" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{artistFileName}</p>
                  <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Foto cargada · el fondo se eliminará con IA
                  </p>
                  <button
                    onClick={() => { setArtistPhoto(null); setArtistFileName(null); }}
                    className="text-xs text-gray-500 hover:text-red-400 mt-1 transition-colors"
                  >
                    Quitar foto
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 group-hover:bg-purple-500/10 flex items-center justify-center text-2xl transition-all">
                  📸
                </div>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  Sube una foto del artista o DJ
                </p>
                <p className="text-xs text-gray-600">JPG, PNG · máx. 10MB</p>
              </button>
            )}
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
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]">

          {/* Panel izquierdo — proceso */}
          <div className="w-full lg:w-72 bg-[#111127] border-r border-white/[0.06] p-6 flex flex-col gap-5">
            <div>
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-4">Proceso de IA</p>

              {/* Prompt resumido */}
              <div className="bg-[#0d0d1a] border border-purple-500/20 rounded-xl p-3 mb-5 text-xs text-gray-300 leading-relaxed">
                <span className="text-yellow-400">"</span>
                {(eventName || prompt).slice(0, 80)}{(eventName || prompt).length > 80 ? "..." : ""}
                <span className="text-yellow-400">"</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedStyle && <span className="bg-purple-500/15 text-purple-300 rounded-full px-2 py-0.5">{STYLE_OPTIONS.find(s=>s.id===selectedStyle)?.label}</span>}
                  {selectedFormat && <span className="bg-blue-500/15 text-blue-300 rounded-full px-2 py-0.5">{FORMAT_OPTIONS.find(f=>f.id===selectedFormat)?.label}</span>}
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-1">
                {AI_PROCESS_STEPS.map((step, i) => {
                  const stepNum = i + 1;
                  const isDone = stepNum < currentStep;
                  const isActive = stepNum === currentStep;
                  const isWait = stepNum > currentStep;
                  return (
                    <div key={step.id} className="flex items-start gap-3 py-2 relative">
                      {/* Conector */}
                      {i < AI_PROCESS_STEPS.length - 1 && (
                        <div className="absolute left-[11px] top-8 w-0.5 h-5 bg-white/8" />
                      )}
                      {/* Icono */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all duration-500 ${
                        isDone ? "bg-green-500 text-black" :
                        isActive ? "border-2 border-purple-400 text-purple-400" :
                        "border-2 border-white/10 text-white/20"
                      }`}>
                        {isDone ? "✓" : isActive ? (
                          <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        ) : stepNum}
                      </div>
                      {/* Texto */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold transition-colors ${isDone ? "text-green-400" : isActive ? "text-white" : "text-white/20"}`}>
                          {step.label}
                        </p>
                        <p className={`text-[10px] transition-colors ${isDone ? "text-green-400/60" : isActive ? "text-purple-300" : "text-white/15"}`}>
                          {step.sub}
                        </p>
                        {isActive && (
                          <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-100"
                              style={{ width: `${stepProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asistente IA */}
            <div className="mt-auto bg-[#1a1a35] rounded-xl p-3">
              <p className="text-[11px] text-purple-200 leading-relaxed">
                {currentStep <= 2 && "Analizando tu prompt y extrayendo los datos del evento..."}
                {currentStep === 3 && "Creando el ambiente visual perfecto para tu estilo seleccionado..."}
                {currentStep === 4 && "Procesando la foto del artista y eliminando el fondo con IA..."}
                {currentStep === 5 && "Componiendo las capas de texto con nombre, lugar y precio..."}
                {currentStep === 6 && "¡Casi listo! Preparando 3 variaciones del diseño para que elijas..."}
              </p>
              {/* Waveform */}
              <div className="flex items-center gap-0.5 mt-2 h-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-0.5 bg-purple-500 rounded-full"
                    style={{
                      animation: `waveBar 1s ease-in-out ${i * 0.1}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Panel central — canvas en construcción */}
          <div className="flex-1 bg-[#0a0a18] flex flex-col items-center justify-center p-8 gap-6">
            <div className="text-center mb-2">
              <h2 className="text-2xl font-black text-white">Tu flyer se está diseñando ✨</h2>
              <p className="text-gray-400 text-sm mt-1">La IA está trabajando en tu diseño</p>
            </div>

            {/* Canvas simulado construyéndose */}
            <div className="relative" style={{ width: 220, height: 310 }}>
              {/* Fondo del flyer */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden border border-white/10"
                style={{ background: `linear-gradient(160deg, ${palette.colors[2]}, ${palette.colors[1]} 60%, ${palette.colors[0]}22)` }}
              >
                {/* Capa fondo — aparece en step 3 */}
                <div
                  className="absolute inset-0 transition-opacity duration-1000"
                  style={{
                    opacity: currentStep >= 3 ? 1 : 0,
                    background: `radial-gradient(ellipse at 50% 80%, ${palette.colors[1]}80 0%, transparent 70%)`,
                  }}
                />

                {/* Foto artista — aparece en step 4 */}
                {artistPhoto && (
                  <div
                    className="absolute inset-0 transition-opacity duration-1000"
                    style={{ opacity: currentStep >= 4 ? 1 : 0 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={artistPhoto} alt="" className="w-full h-full object-cover object-top" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${palette.colors[2]}ee 0%, transparent 50%)` }} />
                  </div>
                )}

                {/* Textos — aparecen en step 5 */}
                <div
                  className="absolute inset-0 flex flex-col justify-end p-4 transition-opacity duration-1000"
                  style={{ opacity: currentStep >= 5 ? 1 : 0 }}
                >
                  {eventName && (
                    <div className="text-2xl font-black leading-tight mb-1" style={{ color: palette.colors[0], fontFamily: "Impact, sans-serif" }}>
                      {eventName.toUpperCase().slice(0, 20)}
                    </div>
                  )}
                  {eventDate && <div className="text-[10px] font-bold text-white/80 mb-1">{eventDate}</div>}
                  {eventVenue && <div className="text-[10px] text-white/60">{eventVenue}</div>}
                  {eventPrice && (
                    <div className="mt-2 inline-block text-[10px] font-black px-2 py-0.5 rounded-md" style={{ background: palette.colors[0], color: palette.colors[2] }}>
                      {eventPrice}
                    </div>
                  )}
                </div>

                {/* Overlay de progreso */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl transition-opacity duration-500"
                  style={{ opacity: currentStep < 5 ? 1 : 0, pointerEvents: "none" }}
                >
                  {/* Ring */}
                  <div className="relative w-20 h-20 mb-2">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="#ffffff15" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="34" fill="none" stroke="#a78bfa" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={213.6}
                        strokeDashoffset={213.6 - (213.6 * ((currentStep - 1 + stepProgress / 100) / AI_PROCESS_STEPS.length))}
                        style={{ transition: "stroke-dashoffset 0.2s" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-black text-lg">
                        {Math.round(((currentStep - 1 + stepProgress / 100) / AI_PROCESS_STEPS.length) * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-purple-300 tracking-widest uppercase">Diseñando</p>
                </div>
              </div>
            </div>

            {/* Barra de acciones top */}
            <div className="flex gap-2 flex-wrap justify-center">
              {["✂️ Quitar fondo", "T Texto editable", "⧉ Capas", "↓ Exportar PNG"].map((btn, i) => (
                <div key={i} className={`px-3 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 ${i === 3 ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-400" : "bg-white/[0.04]"}`}>
                  {btn}
                </div>
              ))}
            </div>
          </div>

          {/* Panel derecho — variaciones y ajustes */}
          <div className="w-full lg:w-72 bg-[#111127] border-l border-white/[0.06] p-6 flex flex-col gap-5">
            <div>
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-4">Variaciones (3)</p>
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className={`h-16 rounded-xl border overflow-hidden transition-all duration-700 ${
                      currentStep >= 6
                        ? i === 1 ? "border-yellow-400 border-2" : "border-white/10"
                        : "border-white/5"
                    }`}
                    style={{
                      background: i === 0
                        ? `linear-gradient(135deg, ${palette.colors[1]}, ${palette.colors[0]}30)`
                        : i === 1
                        ? `linear-gradient(135deg, ${palette.colors[2]}, ${palette.colors[0]}40)`
                        : `linear-gradient(135deg, #0f172a, #3b82f640)`,
                      opacity: currentStep >= 6 ? 1 : 0.15,
                      transition: "opacity 0.8s, border-color 0.5s",
                    }}
                  >
                    {currentStep >= 6 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[10px] font-black" style={{ color: palette.colors[0], fontFamily: "Impact,sans-serif", opacity: 0.9 }}>
                          {eventName?.slice(0,12).toUpperCase() || "EVENTO"}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  className="w-full border border-dashed border-white/10 rounded-xl py-2 text-[10px] text-gray-600 hover:border-purple-500/30 hover:text-purple-400 transition-all"
                  disabled={currentStep < 6}
                >
                  + Generar más variaciones
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-3">Ajustes del diseño</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-gray-500 mb-1.5">Paleta seleccionada</p>
                  <div className="flex gap-1.5">
                    {palette.colors.map((c, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-white/10" style={{ background: c }} />
                    ))}
                    <span className="text-[10px] text-gray-400 ml-1 self-center">{palette.label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1.5">Estilo</p>
                  <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.emoji} {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.label}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1.5">Formato</p>
                  <span className="text-xs text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                    {FORMAT_OPTIONS.find(f => f.id === selectedFormat)?.icon} {FORMAT_OPTIONS.find(f => f.id === selectedFormat)?.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Capas en construcción */}
            <div>
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-3">Capas generadas</p>
              <div className="space-y-1">
                {[
                  { label: "Fondo y atmósfera",  step: 3, icon: "🎨" },
                  { label: "Foto del artista",   step: 4, icon: "👤" },
                  { label: "Nombre del evento",  step: 5, icon: "🎤" },
                  { label: "Lugar y dirección",  step: 5, icon: "📍" },
                  { label: "Fecha y precio",     step: 5, icon: "🎟️" },
                ].map(layer => (
                  <div
                    key={layer.label}
                    className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-[11px] transition-all duration-500 ${
                      currentStep >= layer.step
                        ? "text-white bg-white/5"
                        : "text-white/20"
                    }`}
                  >
                    <span>{layer.icon}</span>
                    <span className="flex-1">{layer.label}</span>
                    {currentStep >= layer.step && (
                      <span className="text-green-400 text-[10px]">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
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
