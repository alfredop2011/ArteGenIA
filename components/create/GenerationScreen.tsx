"use client";

import { useEffect, useRef, useState } from "react";

const LAYERS = [
  { label: "Fondo y atmósfera",  icon: "🎨", step: 2 },
  { label: "Foto del artista",   icon: "👤", step: 3 },
  { label: "Nombre del evento",  icon: "🎤", step: 4 },
  { label: "Lugar y dirección",  icon: "📍", step: 4 },
  { label: "Precio y fecha",     icon: "🎟️", step: 4 },
];

const STEPS = [
  { label: "Analizando prompt",      sub: "Extrayendo datos del evento",        duration: 900  },
  { label: "Eligiendo estilo",       sub: "Paleta y tipografías perfectas",     duration: 800  },
  { label: "Generando fondo",        sub: "Creando atmósfera visual",           duration: 1400 },
  { label: "Procesando artista",     sub: "Eliminando fondo con IA",            duration: 2000 },
  { label: "Componiendo capas",      sub: "Nombre, lugar, precio, fecha",       duration: 1500 },
  { label: "Preparando variaciones", sub: "3 versiones del diseño",             duration: 1100 },
];

const AI_MSGS = [
  "Leyendo tu prompt y extrayendo la información clave del evento...",
  "Seleccionando la combinación perfecta de colores y tipografías...",
  "Generando el fondo con la atmósfera visual ideal para tu estilo...",
  "Procesando la foto del artista y eliminando el fondo con IA...",
  "Componiendo todas las capas: nombre, fecha, lugar y precio...",
  "¡Casi listo! Creando 3 variaciones del diseño para que elijas...",
];

type Props = {
  palette: { colors: string[]; label: string };
  style: string;
  format: string;
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventPrice: string;
  artistPhoto: string | null;
  onDone: () => void;
};

export default function GenerationScreen({ palette, style, format, eventName, eventDate, eventVenue, eventPrice, artistPhoto, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepPct, setStepPct] = useState(0);
  const [layerOps, setLayerOps] = useState([0, 0, 0, 0, 0]);
  const [scanY, setScanY] = useState(0);
  const [done, setDone] = useState(false);
  const stepRef = useRef(0);
  const cancelledRef = useRef(false);
  const W = 220, H = 310;
  const [c0, c1, c2] = palette.colors;

  // Partículas canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string };
    let pts: Particle[] = [];
    let frame = 0;
    let raf: number;
    const colors = [c0, c1, "#ffffff", "#a78bfa", "#f472b6"];
    const loop = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      if (stepRef.current >= 0 && stepRef.current < 6 && frame % 4 === 0) {
        pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 1.8 - 0.3, life: 1, color: colors[Math.floor(Math.random() * colors.length)] });
      }
      pts = pts.filter(p => p.life > 0.02);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life -= 0.018;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.life * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.life * 200).toString(16).padStart(2, "0");
        ctx.fill();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [c0, c1]);

  // Scan line
  useEffect(() => {
    let y = 0; let active = true;
    const tick = () => { if (!active) return; setScanY(y); y = (y + 2.5) % (H + 10); setTimeout(tick, 14); };
    tick();
    return () => { active = false; };
  }, []);

  // Secuencia pasos
  useEffect(() => {
    cancelledRef.current = false;
    const runStep = async (idx: number) => {
      if (idx >= STEPS.length || cancelledRef.current) {
        setDone(true);
        try { localStorage.setItem("artegenia_generated", JSON.stringify({ eventName, eventDate, eventVenue, eventPrice, artistPhoto, palette, style, format, generatedAt: new Date().toISOString() })); } catch(e) { console.warn(e); }
        setTimeout(onDone, 1000);
        return;
      }
      stepRef.current = idx;
      setCurrentStep(idx);
      setStepPct(0);
      const { duration } = STEPS[idx];
      const start = Date.now();
      await new Promise<void>(res => {
        const tick = () => {
          if (cancelledRef.current) { res(); return; }
          const pct = Math.min((Date.now() - start) / duration * 100, 100);
          setStepPct(pct);
          setLayerOps(prev => {
            const n = [...prev];
            if (idx === 2 && pct > 30) n[0] = Math.min(1, (pct - 30) / 45);
            if (idx === 3 && pct > 25) n[1] = Math.min(1, (pct - 25) / 55);
            if (idx === 4 && pct > 15) n[2] = Math.min(1, (pct - 15) / 40);
            if (idx === 4 && pct > 42) n[3] = Math.min(1, (pct - 42) / 38);
            if (idx === 4 && pct > 65) n[4] = Math.min(1, (pct - 65) / 28);
            return n;
          });
          if (pct < 100) requestAnimationFrame(tick); else res();
        };
        requestAnimationFrame(tick);
      });
      if (!cancelledRef.current) runStep(idx + 1);
    };
    runStep(0);
    return () => { cancelledRef.current = true; };
  }, [onDone]);

  const totalPct = Math.min(100, Math.round(((currentStep + stepPct / 100) / STEPS.length) * 100));

  return (
    <div className="flex min-h-[calc(100vh-56px)]">

      {/* IZQUIERDA */}
      <div className="w-64 shrink-0 bg-[#111127] border-r border-white/[0.06] flex flex-col p-5 gap-4">
        <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Proceso de IA</p>

        <div className="bg-[#0d0d1a] border border-purple-500/20 rounded-xl p-3 text-xs text-gray-300 leading-relaxed">
          <span className="text-yellow-400">"</span>{(eventName || "Tu evento").slice(0, 60)}<span className="text-yellow-400">"</span>
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="bg-purple-500/15 text-purple-300 rounded-full px-2 py-0.5 text-[10px]">{style}</span>
            <span className="bg-blue-500/15 text-blue-300 rounded-full px-2 py-0.5 text-[10px]">{format}</span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5">
          {STEPS.map((s, i) => {
            const isDone = i < currentStep, isActive = i === currentStep;
            return (
              <div key={i} className="flex items-start gap-2.5 py-2 relative">
                {i < STEPS.length - 1 && <div className="absolute left-[9px] top-7 w-px h-4 bg-white/10" />}
                <div className={`w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5 transition-all duration-400 ${isDone ? "bg-green-500 text-black" : isActive ? "border-2 border-purple-400" : "border border-white/15 text-white/20"}`}>
                  {isDone ? "✓" : isActive ? <div className="w-2.5 h-2.5 border-[1.5px] border-purple-400 border-t-transparent rounded-full animate-spin" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-semibold transition-colors ${isDone ? "text-green-400" : isActive ? "text-white" : "text-white/20"}`}>{s.label}</p>
                  <p className={`text-[10px] mt-0.5 transition-colors ${isDone ? "text-green-400/50" : isActive ? "text-purple-300" : "text-white/10"}`}>{s.sub}</p>
                  {isActive && (
                    <div className="mt-1.5 h-0.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: `${stepPct}%`, transition: "width 0.1s" }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto bg-[#1a1a35] rounded-xl p-3">
          <p className="text-[11px] text-purple-200 leading-relaxed min-h-[44px]">{AI_MSGS[Math.min(currentStep, 5)]}</p>
          <div className="flex items-center gap-0.5 mt-2 h-3">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="w-0.5 bg-purple-500 rounded-full" style={{ animation: `waveBarG 1s ease-in-out ${i * 0.09}s infinite` }} />
            ))}
          </div>
        </div>
      </div>

      {/* CENTRO */}
      <div className="flex-1 bg-[#0a0a18] flex flex-col items-center justify-center gap-5 p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 55%, ${c1}15 0%, transparent 65%)` }} />

        <div className="text-center z-10">
          <h2 className="text-2xl font-black">Tu flyer se está diseñando ✨</h2>
          <p className="text-gray-400 text-sm mt-1">La IA está trabajando en tu diseño</p>
        </div>

        {/* FLYER */}
        <div className="relative z-10" style={{ width: W, height: H }}>
          {/* Glow exterior */}
          <div className="absolute -inset-2 rounded-3xl pointer-events-none" style={{ background: `linear-gradient(135deg, ${c0}30, ${c1}30)`, filter: "blur(12px)", opacity: totalPct / 100 }} />

          <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10" style={{ background: c2 }}>

            {/* CAPA 1: Fondo */}
            <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: layerOps[0] }}>
              <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${c2}, ${c1} 55%, ${c0}15)` }} />
              <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 85%, ${c1}90 0%, transparent 65%)` }} />
              <div className="absolute inset-0" style={{ background: `repeating-linear-gradient(0deg, transparent, transparent 38px, ${c0}05 38px, ${c0}05 39px)` }} />
            </div>

            {/* CAPA 2: Artista */}
            {artistPhoto ? (
              <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: layerOps[1] }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={artistPhoto} alt="" className="w-full h-[62%] object-cover object-top" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${c2} 30%, transparent 65%)` }} />
              </div>
            ) : (
              <div className="absolute inset-x-0 top-0 h-[62%] flex items-center justify-center transition-opacity duration-1000" style={{ opacity: layerOps[1], background: `linear-gradient(180deg, ${c1}30, transparent)` }}>
                <div className="text-7xl opacity-10">👤</div>
              </div>
            )}

            {/* CAPA 3: Nombre */}
            <div className="absolute left-3 right-3 transition-all duration-700" style={{ bottom: 84, opacity: layerOps[2], transform: `translateY(${(1 - layerOps[2]) * 14}px)` }}>
              <div className="text-[22px] font-black leading-tight" style={{ color: c0, fontFamily: "Impact, Arial Black, sans-serif", textShadow: `0 0 24px ${c0}70` }}>
                {(eventName || "NOMBRE EVENTO").toUpperCase().slice(0, 20)}
              </div>
            </div>

            {/* CAPA 4: Lugar */}
            <div className="absolute left-3 right-3 transition-all duration-700" style={{ bottom: 48, opacity: layerOps[3], transform: `translateY(${(1 - layerOps[3]) * 10}px)` }}>
              <div className="text-[9px] font-semibold text-white/70 uppercase tracking-wider">📍 {eventVenue || "Lugar del evento"}</div>
              {eventDate && <div className="text-[9px] text-white/40 mt-0.5">📅 {eventDate}</div>}
            </div>

            {/* CAPA 5: Precio */}
            <div className="absolute left-3 right-3 transition-all duration-700" style={{ bottom: 10, opacity: layerOps[4], transform: `translateY(${(1 - layerOps[4]) * 8}px)` }}>
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-black px-2 py-1 rounded-md" style={{ background: c0, color: c2 }}>
                  🎟️ {eventPrice || "ENTRADA"}
                </div>
                <div className="text-[8px] text-white/20 tracking-wider">artegenia.com</div>
              </div>
            </div>

            {/* Scan line */}
            {!done && (
              <div className="absolute left-0 right-0 pointer-events-none" style={{ top: scanY, height: 2, background: `linear-gradient(90deg, transparent, ${c0}80, ${c1}80, transparent)`, filter: "blur(1px)", opacity: 0.5 }} />
            )}

            {/* Canvas partículas */}
            <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 pointer-events-none mix-blend-screen" />

            {/* Overlay % inicial */}
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl transition-opacity duration-700" style={{ opacity: layerOps[0] > 0.4 ? 0 : 1, background: "rgba(0,0,0,0.78)", pointerEvents: "none" }}>
              <div className="relative w-20 h-20 mb-2">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#ffffff12" strokeWidth="5" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={c0} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={201} strokeDashoffset={201 - 201 * totalPct / 100} style={{ transition: "stroke-dashoffset 0.25s" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-lg">{totalPct}%</span>
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: c0 }}>Diseñando</p>
            </div>

            {done && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-green-500 text-black font-black text-sm px-5 py-2 rounded-full shadow-xl" style={{ animation: "popIn 0.4s ease-out" }}>✓ ¡Listo!</div>
              </div>
            )}
          </div>
        </div>

        {/* Barra progreso */}
        <div className="w-full max-w-[260px] z-10">
          <div className="flex justify-between text-xs text-gray-600 mb-1.5">
            <span>Progreso</span>
            <span style={{ color: c0 }} className="font-semibold">{totalPct}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${totalPct}%`, background: `linear-gradient(90deg, ${c1}, ${c0})`, transition: "width 0.25s" }} />
          </div>
        </div>

        {/* Botones desactivados */}
        <div className="flex gap-2 z-10 flex-wrap justify-center">
          {["✂️ Quitar fondo", "T Texto editable", "⧉ Capas inteligentes"].map((btn, i) => (
            <div key={i} className="px-3 py-1.5 rounded-lg text-xs border border-white/8 text-white/20 bg-white/[0.02]">{btn}</div>
          ))}
          <div className={`px-4 py-1.5 rounded-lg text-xs border font-semibold transition-all ${done ? "border-yellow-400/50 text-yellow-400 bg-yellow-400/10 cursor-pointer hover:bg-yellow-400/20" : "border-white/8 text-white/20 bg-white/[0.02]"}`}>
            ↓ Exportar PNG
          </div>
        </div>
      </div>

      {/* DERECHA */}
      <div className="w-64 shrink-0 bg-[#111127] border-l border-white/[0.06] flex flex-col p-5 gap-5">

        <div>
          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-3">Variaciones (3)</p>
          <div className="flex flex-col gap-2">
            {[
              { bg: `linear-gradient(135deg, ${c1}, ${c0}30)`, sel: true },
              { bg: `linear-gradient(135deg, ${c2} 20%, ${c0}35)`, sel: false },
              { bg: `linear-gradient(135deg, #0f172a, #6366f140)`, sel: false },
            ].map((v, i) => (
              <div key={i} className="h-14 rounded-xl border overflow-hidden transition-all duration-700 cursor-pointer hover:scale-[1.02]"
                style={{ background: v.bg, borderColor: v.sel && currentStep >= 5 ? c0 : "rgba(255,255,255,0.08)", borderWidth: v.sel && currentStep >= 5 ? 2 : 1, opacity: currentStep >= 5 ? 1 : 0.12, transition: "opacity 0.8s, transform 0.2s" }}>
                {currentStep >= 5 && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[10px] font-black opacity-80" style={{ color: c0, fontFamily: "Impact,sans-serif" }}>
                      {(eventName || "EVENTO").slice(0, 10).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <button disabled={currentStep < 5} className="w-full border border-dashed border-white/10 rounded-xl py-2 text-[10px] text-gray-600 hover:border-purple-500/30 hover:text-purple-400 transition-all disabled:cursor-not-allowed">
              + Generar más variaciones
            </button>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-3">Capas generadas</p>
          <div className="flex flex-col gap-0.5">
            {LAYERS.map((layer, i) => {
              const active = layerOps[i] > 0.15;
              const loading = !active && currentStep >= layer.step - 1;
              return (
                <div key={i} className={`flex items-center gap-2 py-2 px-2.5 rounded-lg text-[11px] transition-all duration-500 ${active ? "bg-white/[0.04] text-white" : "text-white/20"}`}>
                  <span className={`text-sm ${active ? "" : "grayscale opacity-30"}`}>{layer.icon}</span>
                  <span className="flex-1">{layer.label}</span>
                  {active && <div className="w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-black text-black shrink-0">✓</div>}
                  {loading && <div className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold mb-3">Ajustes del diseño</p>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-[10px] text-gray-600 mb-1.5">Paleta</p>
              <div className="flex gap-1.5 items-center">
                {palette.colors.map((c, i) => <div key={i} className="w-5 h-5 rounded-full border border-white/10" style={{ background: c }} />)}
                <span className="text-[10px] text-gray-500 ml-1">{palette.label}</span>
              </div>
            </div>
            <div><p className="text-[10px] text-gray-600 mb-1.5">Estilo</p><span className="text-[11px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">{style}</span></div>
            <div><p className="text-[10px] text-gray-600 mb-1.5">Formato</p><span className="text-[11px] text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-full">{format}</span></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes waveBarG { 0%,100%{height:3px} 50%{height:13px} }
        @keyframes popIn { 0%{transform:scale(0.5);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
