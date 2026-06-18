"use client";

/**
 * /eventos — Calendario público de eventos.
 *
 * MVP v1 (esta fase): eventos hardcoded en data/mock-events.ts.
 * Próxima fase: fetch desde Supabase tabla `events` con RLS.
 *
 * Filtros: fecha, ciudad, género.
 * Cards con tilt 3D + glow ambient por género.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { MOCK_EVENTS } from "@/data/mock-events";
import EventCard3D from "@/components/eventos/EventCard3D";
import EventFilters, { type DateFilter, type CityFilter, type GenreFilter } from "@/components/eventos/EventFilters";
import { Sparkles } from "lucide-react";

function isWithinDate(eventIso: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const event = new Date(eventIso);
  const now = new Date();
  const diffMs = event.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (filter === "today") {
    return event.toDateString() === now.toDateString();
  }
  if (filter === "week") return diffDays >= 0 && diffDays <= 7;
  if (filter === "month") return diffDays >= 0 && diffDays <= 30;
  return true;
}

export default function EventosPage() {
  const [date, setDate] = useState<DateFilter>("all");
  const [city, setCity] = useState<CityFilter>("all");
  const [genre, setGenre] = useState<GenreFilter>("all");

  // Filtrar + ordenar por fecha ascendente
  const filtered = useMemo(() => {
    return MOCK_EVENTS
      .filter(e => isWithinDate(e.startsAt, date))
      .filter(e => city === "all" || e.city === city)
      .filter(e => genre === "all" || e.genre === genre)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [date, city, genre]);

  return (
    <main className="min-h-screen" style={{ background: "#0a0a12" }}>
      {/* HERO con glow ambient */}
      <section className="relative overflow-hidden pt-16 pb-12 px-4 sm:px-8">
        {/* Glow blobs decorativos */}
        <div aria-hidden className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(168,85,247,0.25)" }} />
        <div aria-hidden className="absolute -top-20 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(236,72,153,0.20)" }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(168,85,247,0.15)", boxShadow: "0 0 0 1px rgba(168,85,247,0.3)" }}>
            <Sparkles size={12} strokeWidth={2.5} className="text-purple-300" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-200">Calendario en vivo</span>
          </div>
          <h1 className="text-[44px] sm:text-[64px] font-black leading-[0.95] text-white mb-3" style={{ fontFamily: "Anton, Impact, sans-serif", letterSpacing: "-0.02em" }}>
            EVENTOS<br/>
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              QUE NO TE PIERDES
            </span>
          </h1>
          <p className="text-[15px] sm:text-[17px] text-gray-300 max-w-2xl leading-relaxed mb-6">
            Fiestas, talleres, conciertos y workshops curados.
            Madrid · Barcelona · LATAM. Actualizado a diario por organizadores reales.
          </p>

          {/* CTA organizador */}
          <Link
            href="/dashboard/eventos/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[13px] font-bold text-white transition-transform active:scale-95 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              boxShadow: "0 8px 24px rgba(168,85,247,0.4)",
            }}
          >
            <Sparkles size={14} strokeWidth={2.5} />
            ¿Organizas eventos? Publica el tuyo gratis →
          </Link>
        </div>
      </section>

      {/* CONTENIDO con filtros + grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
          {/* Sidebar filtros */}
          <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto pr-2">
            <EventFilters
              date={date}
              city={city}
              genre={genre}
              onDate={setDate}
              onCity={setCity}
              onGenre={setGenre}
              totalCount={filtered.length}
            />
          </aside>

          {/* Grid cards */}
          <div>
            {filtered.length === 0 ? (
              <div className="text-center py-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", boxShadow: "0 0 0 1px rgba(255,255,255,0.04)" }}>
                <div className="text-5xl mb-4 opacity-40">🎭</div>
                <p className="text-gray-400 mb-2">No hay eventos con esos filtros.</p>
                <button
                  onClick={() => { setDate("all"); setCity("all"); setGenre("all"); }}
                  className="text-purple-400 hover:text-purple-300 text-[13px] font-semibold underline underline-offset-4"
                >
                  Quitar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(event => (
                  <EventCard3D key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-16 pt-10 border-t border-white/[0.06] text-center">
          <p className="text-[12px] text-gray-500 mb-2">
            Eventos actualizados por sus propios organizadores · ArteGenIA verifica antes de publicar.
          </p>
          <Link href="/dashboard/eventos/new" className="text-purple-400 hover:text-purple-300 text-[12px] font-semibold">
            Tu evento no está aquí? Súbelo gratis →
          </Link>
        </div>
      </section>
    </main>
  );
}
