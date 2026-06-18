"use client";

/**
 * Card de evento con efecto tilt 3D al hover/touch.
 *
 * Usa CSS transforms 3D + rAF para tracking suave. Sin Three.js — performant
 * en mobile. El tilt se calcula a partir de la posición del cursor relativa
 * al centro de la card.
 */

import { useRef, useCallback } from "react";
import type { MockEvent } from "@/data/mock-events";
import { Calendar, MapPin, Ticket } from "lucide-react";

interface Props {
  event: MockEvent;
}

const GENRE_COLORS: Record<MockEvent["genre"], { bg: string; text: string; glow: string }> = {
  techno:    { bg: "rgba(168,85,247,0.18)", text: "#c4b5fd", glow: "rgba(168,85,247,0.6)" },
  house:     { bg: "rgba(34,211,238,0.18)", text: "#67e8f9", glow: "rgba(34,211,238,0.6)" },
  reggaeton: { bg: "rgba(236,72,153,0.20)", text: "#f9a8d4", glow: "rgba(236,72,153,0.6)" },
  bachata:   { bg: "rgba(251,113,133,0.18)", text: "#fda4af", glow: "rgba(251,113,133,0.6)" },
  salsa:     { bg: "rgba(251,146,60,0.18)", text: "#fdba74", glow: "rgba(251,146,60,0.6)" },
  kizomba:   { bg: "rgba(217,70,239,0.18)", text: "#f0abfc", glow: "rgba(217,70,239,0.6)" },
  "hip-hop": { bg: "rgba(250,204,21,0.18)", text: "#fde047", glow: "rgba(250,204,21,0.6)" },
  open:      { bg: "rgba(59,130,246,0.18)", text: "#93c5fd", glow: "rgba(59,130,246,0.6)" },
};

const CITY_LABELS: Record<MockEvent["city"], string> = {
  madrid: "Madrid",
  barcelona: "Barcelona",
  valencia: "Valencia",
  sevilla: "Sevilla",
};

function formatDate(iso: string): { day: string; month: string; weekday: string; time: string } {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleDateString("es-ES", { month: "short" }).toUpperCase().replace(".", "");
  const weekday = d.toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase().replace(".", "");
  const time = d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return { day, month, weekday, time };
}

export default function EventCard3D({ event }: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const colors = GENRE_COLORS[event.genre];
  const date = formatDate(event.startsAt);

  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 a 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotY = x * 12;   // grados
      const rotX = -y * 12;
      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03, 1.03, 1)`;
      card.style.transition = "transform 80ms ease-out";
    });
  }, []);

  const handleLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    card.style.transition = "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)";
  }, []);

  return (
    <article
      ref={cardRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="relative rounded-2xl overflow-hidden cursor-pointer will-change-transform group"
      style={{
        background: "linear-gradient(140deg, #1a1a28 0%, #0f0f1a 100%)",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)`,
        transformStyle: "preserve-3d",
      }}
    >
      {/* Glow ambient según género */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${colors.glow} 0%, transparent 60%)`,
        }}
      />

      {/* FECHA badge esquina sup. izq */}
      <div
        className="absolute top-3 left-3 z-10 px-3 py-2 rounded-xl backdrop-blur-md"
        style={{ background: "rgba(0,0,0,0.6)", boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        <div className="text-[9px] uppercase tracking-widest font-bold opacity-70 leading-tight">{date.weekday}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-[28px] font-black leading-none" style={{ fontFamily: "Anton, Impact, sans-serif" }}>
            {date.day}
          </span>
          <span className="text-[11px] font-bold opacity-80">{date.month}</span>
        </div>
        <div className="text-[10px] opacity-60 mt-0.5">{date.time}h</div>
      </div>

      {/* GÉNERO chip esquina sup. derecha */}
      <div
        className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
        style={{
          background: colors.bg,
          color: colors.text,
          boxShadow: `0 0 0 1px ${colors.glow}`,
        }}
      >
        {event.genre}
      </div>

      {/* FLYER imagen — aspect 3:4 portrait */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#0a0a12]">
        <img
          src={event.flyerUrl}
          alt={event.title}
          loading="lazy"
          crossOrigin="anonymous"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          style={{ background: "#0a0a12" }}
        />
        {/* Overlay gradient bottom para legibilidad */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2/5 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(15,15,26,1) 0%, transparent 100%)" }}
        />
      </div>

      {/* INFO bloque inferior */}
      <div className="p-4 pt-3 relative">
        <h3 className="text-[15px] font-black text-white leading-tight line-clamp-2 mb-1">
          {event.title}
        </h3>
        <p className="text-[11.5px] text-gray-400 mb-3">por <span className="text-gray-200 font-semibold">{event.organizerName}</span></p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-[11.5px] text-gray-400">
            <MapPin size={13} strokeWidth={2} className="shrink-0" />
            <span className="truncate">
              <span className="text-gray-200">{event.venue}</span>
              <span className="opacity-60"> · {CITY_LABELS[event.city]}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-gray-400">
            <Ticket size={13} strokeWidth={2} className="shrink-0" />
            <span>
              {event.price === 0 ? (
                <span className="text-emerald-400 font-bold">GRATIS</span>
              ) : (
                <><span className="text-white font-bold">{event.price}€</span> <span className="opacity-60">entrada</span></>
              )}
            </span>
          </div>
        </div>

        {event.ticketsUrl && (
          <a
            href={event.ticketsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11.5px] font-bold transition-colors"
            style={{
              background: colors.bg,
              color: colors.text,
              boxShadow: `0 0 0 1px ${colors.glow}`,
            }}
          >
            <Calendar size={12} strokeWidth={2.5} />
            Reservar / Tickets
          </a>
        )}
      </div>
    </article>
  );
}
