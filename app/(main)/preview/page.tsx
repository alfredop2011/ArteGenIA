"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type GeneratedData = {
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventPrice: string;
  eventType: string;
  artistPhotoUrl: string | null;
  artists: Array<{ name: string; photoUrl: string }>;
  artistCount: number;
  bgUrl: string;
  bgWidth: number;
  bgHeight: number;
  format: string;
  mode: string;
  originalPrompt: string;
  generatedAt: string;
};

// ─── BG STYLE PRESETS ────────────────────────────────────────────────────────

const BG_STYLES = [
  {
    id: "club",
    label: "Club oscuro",
    sub: "Focos, humo, morado",
    prompt: "dark nightclub interior, dramatic purple spotlight beams through atmospheric smoke haze, premium club atmosphere",
    preview: "linear-gradient(160deg,#0a0018,#2d0060,#1a0030)",
  },
  {
    id: "tropical",
    label: "Noche tropical",
    sub: "Palmeras, dorado, selva",
    prompt: "tropical outdoor night event, golden warm lights filtering through palm leaves, lush jungle atmosphere, luxury tropical venue",
    preview: "linear-gradient(160deg,#0a1a00,#1a4010,#0d2808)",
  },
  {
    id: "neon",
    label: "Neón urbano",
    sub: "Cyan, magenta, oscuro",
    prompt: "cyberpunk urban nightlife background, electric cyan and magenta neon light streaks, dark city atmosphere, modern club aesthetic",
    preview: "linear-gradient(160deg,#050508,#001a1a,#0a0018)",
  },
  {
    id: "gold",
    label: "Lujo dorado",
    sub: "Oro, negro, premium",
    prompt: "luxury black tie event, golden warm spotlights, opulent black and gold atmosphere, premium gala venue, crystal chandelier bokeh",
    preview: "linear-gradient(160deg,#0a0800,#2a1a00,#1a0f00)",
  },
  {
    id: "festival",
    label: "Festival",
    sub: "Rayos de luz, colores",
    prompt: "outdoor music festival stage, massive colorful light beams cutting through dark sky, pyrotechnic sparks, vibrant festival energy",
    preview: "linear-gradient(160deg,#050010,#0a001a,#000510)",
  },
  {
    id: "latin",
    label: "Latin night",
    sub: "Rojo, ámbar, caliente",
    prompt: "elegant Latin ballroom night, warm amber and red stage lighting, rich warm tones, salsa bachata club atmosphere",
    preview: "linear-gradient(160deg,#1a0500,#3d1000,#200800)",
  },
];

// ─── TEXT POSITIONS ───────────────────────────────────────────────────────────

const TEXT_POSITIONS = [
  { id: "top",    label: "Arriba",  icon: "⬆" },
  { id: "center", label: "Centro",  icon: "↔" },
  { id: "bottom", label: "Abajo",   icon: "⬇" },
];

const TEXT_COLORS = ["#ffffff", "#f5c518", "#00ffaa", "#ff6b6b", "#c084fc", "#60a5fa"];

const FONTS = [
  { id: "Montserrat", label: "Modern" },
  { id: "Bebas Neue", label: "Impact" },
  { id: "Playfair Display", label: "Elegant" },
  { id: "Oswald", label: "Bold" },
];

// ─── LAYOUT VARIANTS ─────────────────────────────────────────────────────────

const LAYOUTS = [
  { id: "hero",   label: "Héroe centro",  icon: "👤" },
  { id: "left",   label: "Artista izq.",  icon: "◀" },
  { id: "duo",    label: "Dos artistas",  icon: "👥" },
  { id: "lineup", label: "Lineup",        icon: "👥👥" },
];

function uid() { return Math.random().toString(36).slice(2, 8); }

// ─── CANVAS PREVIEW COMPONENT ─────────────────────────────────────────────────

function FlyerCanvas({
  data,
  textPosition,
  textColor,
  fontFamily,
  layout,
  bgOverride,
}: {
  data: GeneratedData;
  textPosition: string;
  textColor: string;
  fontFamily: string;
  layout: string;
  bgOverride: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.bgUrl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080, H = 1350;
    canvas.width = W;
    canvas.height = H;

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.onload = () => {
      // Draw background (cover fit)
      const scaleX = W / bgImg.width;
      const scaleY = H / bgImg.height;
      const scale = Math.max(scaleX, scaleY);
      const sw = bgImg.width * scale;
      const sh = bgImg.height * scale;
      ctx.drawImage(bgImg, (W - sw) / 2, (H - sh) / 2, sw, sh);

      // Draw artist if available
      const artistUrl = data.artistPhotoUrl ?? data.artists?.[0]?.photoUrl;
      if (artistUrl) {
        const aImg = new Image();
        aImg.crossOrigin = "anonymous";
        aImg.onload = () => {
          const artistH = H * 0.58;
          const artistScale = artistH / aImg.height;
          const artistW = aImg.width * artistScale;

          let artistX = (W - artistW) / 2;
          if (layout === "left")  artistX = 40;
          if (layout === "right") artistX = W - artistW - 40;

          ctx.drawImage(aImg, artistX, H * 0.22, artistW, artistH);
          drawText();
          setRendered(true);
        };
        aImg.onerror = () => { drawText(); setRendered(true); };
        aImg.src = artistUrl;
      } else {
        drawText();
        setRendered(true);
      }
    };
    bgImg.onerror = () => setRendered(true);
    bgImg.src = bgOverride ?? data.bgUrl;

    function drawText() {
      if (!ctx) return;

      const margin = 80;
      const titleSize = 96;
      const infoSize = 36;

      // Calculate text Y based on position
      let titleY = margin + titleSize;
      let infoY  = H * 0.78;

      if (textPosition === "bottom") {
        titleY = H * 0.62;
        infoY  = H - margin - 120;
      } else if (textPosition === "center") {
        titleY = H * 0.38;
        infoY  = H * 0.55;
      }

      // Title
      if (data.eventName) {
        ctx.font = `900 ${titleSize}px ${fontFamily}, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 20;
        ctx.fillText(data.eventName.toUpperCase(), W / 2, titleY);
        ctx.shadowBlur = 0;
      }

      // Info
      ctx.font = `600 ${infoSize}px ${fontFamily}, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.85;

      if (data.eventDate) {
        ctx.fillText(data.eventDate.toUpperCase(), W / 2, infoY);
        infoY += infoSize + 16;
      }
      if (data.eventVenue) {
        ctx.fillText(data.eventVenue.toUpperCase(), W / 2, infoY);
        infoY += infoSize + 16;
      }
      if (data.eventPrice) {
        ctx.font = `800 ${infoSize}px ${fontFamily}, sans-serif`;
        ctx.fillStyle = "#f5c518";
        ctx.fillText(data.eventPrice.toUpperCase(), W / 2, infoY);
      }

      ctx.globalAlpha = 1;
    }
  }, [data, textPosition, textColor, fontFamily, layout, bgOverride]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain rounded-xl"
      style={{ display: rendered ? "block" : "none" }}
    />
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function PreviewPage() {
  const router = useRouter();
  const [data, setData] = useState<GeneratedData | null>(null);
  const [activePanel, setActivePanel] = useState<"bg" | "text" | "layout" | null>(null);

  // Text settings
  const [textPosition, setTextPosition] = useState("top");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Montserrat");

  // Layout
  const [layout, setLayout] = useState("hero");

  // BG regeneration
  const [selectedBgStyle, setSelectedBgStyle] = useState<string | null>(null);
  const [customBgPrompt, setCustomBgPrompt] = useState("");
  const [bgOverride, setBgOverride] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("artegenia_generated");
      if (raw) setData(JSON.parse(raw));
      else router.push("/create");
    } catch { router.push("/create"); }
  }, [router]);

  // ─── REGENERATE BG ──────────────────────────────────────────────────────────

  const handleRegenerateBg = useCallback(async () => {
    if (!data) return;
    setIsRegenerating(true);
    try {
      const style = BG_STYLES.find(s => s.id === selectedBgStyle);
      const prompt = customBgPrompt.trim() || style?.prompt || data.originalPrompt;

      const res = await fetch("/api/generate-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backgroundDescription: prompt,
          eventType: data.eventType ?? "",
          format: data.format ?? "instagram",
        }),
      });
      if (!res.ok) throw new Error(`generate-bg ${res.status}`);
      const d = await res.json() as { url: string };
      setBgOverride(d.url);

      // Update localStorage
      const updated = { ...data, bgUrl: d.url };
      localStorage.setItem("artegenia_generated", JSON.stringify(updated));
      setData(updated);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : "desconocido"}`);
    } finally {
      setIsRegenerating(false);
    }
  }, [data, selectedBgStyle, customBgPrompt]);

  // ─── GO TO EDITOR ──────────────────────────────────────────────────────────

  const handleOpenEditor = useCallback(() => {
    if (!data) return;
    // Save current settings to localStorage for editor
    const updated = {
      ...data,
      bgUrl: bgOverride ?? data.bgUrl,
      textPosition,
      textColor,
      fontFamily,
      layout,
    };
    localStorage.setItem("artegenia_generated", JSON.stringify(updated));
    router.push("/editor-new");
  }, [data, bgOverride, textPosition, textColor, fontFamily, layout, router]);

  // ─── DOWNLOAD ─────────────────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "artegenia-flyer.png";
    link.href = canvas.toDataURL("image/png", 0.95);
    link.click();
  }, []);

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-56px)] bg-[#0a0a18] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#0e0e14] text-white overflow-hidden">

      {/* LEFT — Canvas preview */}
      <div className="flex-1 flex flex-col bg-[#0a0a14] overflow-hidden">
        {/* Top bar */}
        <div className="h-11 bg-[#111118] border-b border-white/[0.07] flex items-center justify-between px-4 shrink-0">
          <button onClick={() => router.push("/create")} className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Volver
          </button>
          <span className="text-xs text-gray-500">Preview</span>
          <div className="flex gap-2">
            <button onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white transition-all">
              ⬇ PNG
            </button>
            <button onClick={handleOpenEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all">
              ✏️ Editar capas
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div className="relative" style={{ maxHeight: "calc(100vh - 160px)", aspectRatio: "1080/1350" }}>
            <FlyerCanvas
              data={data}
              textPosition={textPosition}
              textColor={textColor}
              fontFamily={fontFamily}
              layout={layout}
              bgOverride={bgOverride}
            />
          </div>
        </div>
      </div>

      {/* RIGHT — Controls */}
      <div className="w-72 bg-[#111118] border-l border-white/[0.07] flex flex-col shrink-0 overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-bold text-white">{data.eventName || "Tu flyer"}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Ajusta antes de editar o descargar</p>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── SECTION: Fondo ── */}
          <div className="border-b border-white/[0.06]">
            <button
              onClick={() => setActivePanel(activePanel === "bg" ? null : "bg")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-all">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🎨</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Fondo</p>
                  <p className="text-[10px] text-gray-500">Regenerar imagen de fondo</p>
                </div>
              </div>
              <span className={`text-gray-600 transition-transform ${activePanel === "bg" ? "rotate-180" : ""}`}>▾</span>
            </button>

            {activePanel === "bg" && (
              <div className="px-3 pb-4 space-y-3">
                {/* Style grid */}
                <div className="grid grid-cols-3 gap-2">
                  {BG_STYLES.map(style => (
                    <button key={style.id}
                      onClick={() => setSelectedBgStyle(style.id === selectedBgStyle ? null : style.id)}
                      className={`rounded-lg overflow-hidden border-2 transition-all ${selectedBgStyle === style.id ? "border-purple-500" : "border-transparent"}`}>
                      <div className="h-14 relative">
                        <div className="absolute inset-0" style={{ background: style.preview }}/>
                        {selectedBgStyle === style.id && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[9px] text-white">✓</div>
                        )}
                      </div>
                      <div className="bg-[#0e0e14] px-1.5 py-1">
                        <p className="text-[9px] font-medium text-white leading-tight">{style.label}</p>
                        <p className="text-[8px] text-gray-600 leading-tight">{style.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom prompt */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-1.5">O describe con tus palabras:</p>
                  <textarea
                    value={customBgPrompt}
                    onChange={e => setCustomBgPrompt(e.target.value)}
                    placeholder='Ej: "Fondo oscuro con luces rojas y humo..."'
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>

                <button
                  onClick={handleRegenerateBg}
                  disabled={isRegenerating || (!selectedBgStyle && !customBgPrompt.trim())}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    !isRegenerating && (selectedBgStyle || customBgPrompt.trim())
                      ? "bg-purple-600 hover:bg-purple-500 text-white"
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  }`}>
                  {isRegenerating
                    ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generando...</>
                    : "↺ Regenerar solo el fondo"
                  }
                </button>
              </div>
            )}
          </div>

          {/* ── SECTION: Texto ── */}
          <div className="border-b border-white/[0.06]">
            <button
              onClick={() => setActivePanel(activePanel === "text" ? null : "text")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-all">
              <div className="flex items-center gap-2.5">
                <span className="text-base">✏️</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Texto</p>
                  <p className="text-[10px] text-gray-500">Posición, color y fuente</p>
                </div>
              </div>
              <span className={`text-gray-600 transition-transform ${activePanel === "text" ? "rotate-180" : ""}`}>▾</span>
            </button>

            {activePanel === "text" && (
              <div className="px-3 pb-4 space-y-3">
                {/* Position */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-2">Posición del texto</p>
                  <div className="flex gap-2">
                    {TEXT_POSITIONS.map(pos => (
                      <button key={pos.id} onClick={() => setTextPosition(pos.id)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${textPosition === pos.id ? "bg-purple-600 text-white" : "bg-white/5 text-gray-400 hover:text-white"}`}>
                        {pos.icon} {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-2">Color del texto</p>
                  <div className="flex gap-2 flex-wrap">
                    {TEXT_COLORS.map(color => (
                      <button key={color} onClick={() => setTextColor(color)}
                        className={`w-7 h-7 rounded-lg border-2 transition-all ${textColor === color ? "border-white scale-110" : "border-transparent"}`}
                        style={{ background: color }}/>
                    ))}
                  </div>
                </div>

                {/* Font */}
                <div>
                  <p className="text-[10px] text-gray-500 mb-2">Fuente</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FONTS.map(font => (
                      <button key={font.id} onClick={() => setFontFamily(font.id)}
                        className={`py-2 px-3 rounded-lg text-xs transition-all text-left ${fontFamily === font.id ? "bg-purple-600/20 border border-purple-500/40 text-purple-300" : "bg-white/5 border border-white/8 text-gray-400 hover:text-white"}`}
                        style={{ fontFamily: font.id }}>
                        {font.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION: Composición ── */}
          <div className="border-b border-white/[0.06]">
            <button
              onClick={() => setActivePanel(activePanel === "layout" ? null : "layout")}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-all">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📐</span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Composición</p>
                  <p className="text-[10px] text-gray-500">Posición del artista</p>
                </div>
              </div>
              <span className={`text-gray-600 transition-transform ${activePanel === "layout" ? "rotate-180" : ""}`}>▾</span>
            </button>

            {activePanel === "layout" && (
              <div className="px-3 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUTS.map(l => (
                    <button key={l.id} onClick={() => setLayout(l.id)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-medium transition-all ${layout === l.id ? "bg-purple-600/20 border border-purple-500/40 text-purple-300" : "bg-white/5 border border-white/8 text-gray-400 hover:text-white"}`}>
                      {l.icon} {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Event summary */}
          <div className="p-4 space-y-2">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">Datos del evento</p>
            {data.eventName  && <div className="flex gap-2 text-xs"><span className="text-gray-600">🎤</span><span className="text-gray-300">{data.eventName}</span></div>}
            {data.eventDate  && <div className="flex gap-2 text-xs"><span className="text-gray-600">📅</span><span className="text-gray-300">{data.eventDate}</span></div>}
            {data.eventVenue && <div className="flex gap-2 text-xs"><span className="text-gray-600">📍</span><span className="text-gray-300">{data.eventVenue}</span></div>}
            {data.eventPrice && <div className="flex gap-2 text-xs"><span className="text-gray-600">🎟️</span><span className="text-gray-300">{data.eventPrice}</span></div>}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          <button onClick={handleOpenEditor}
            className="w-full py-3 rounded-xl text-sm font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
            ✏️ Abrir editor completo
          </button>
          <button onClick={handleDownload}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-gray-300 transition-all">
            ⬇ Descargar PNG directo
          </button>
        </div>
      </div>
    </div>
  );
}
