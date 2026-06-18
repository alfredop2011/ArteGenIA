"use client";

import { CITIES, GENRES, type EventCity, type EventGenre } from "@/data/mock-events";

export type DateFilter = "all" | "today" | "week" | "month";
export type CityFilter = EventCity | "all";
export type GenreFilter = EventGenre | "all";

interface Props {
  date: DateFilter;
  city: CityFilter;
  genre: GenreFilter;
  onDate: (v: DateFilter) => void;
  onCity: (v: CityFilter) => void;
  onGenre: (v: GenreFilter) => void;
  totalCount: number;
}

const DATE_OPTS: { id: DateFilter; label: string }[] = [
  { id: "all", label: "Todas las fechas" },
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
];

export default function EventFilters({ date, city, genre, onDate, onCity, onGenre, totalCount }: Props) {
  return (
    <div className="space-y-4">
      {/* Conteo */}
      <p className="text-[12px] text-gray-400">
        <span className="text-white font-bold">{totalCount}</span> evento{totalCount !== 1 ? "s" : ""} encontrado{totalCount !== 1 ? "s" : ""}
      </p>

      {/* Fecha */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Cuándo</p>
        <div className="flex flex-wrap gap-1.5">
          {DATE_OPTS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onDate(opt.id)}
              className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all ${
                date === opt.id
                  ? "bg-white text-[#0a0a12]"
                  : "bg-white/[0.05] text-gray-300 hover:bg-white/[0.10] border border-white/[0.06]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ciudad */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Ciudad</p>
        <div className="flex flex-wrap gap-1.5">
          {CITIES.map(opt => (
            <button
              key={opt.id}
              onClick={() => onCity(opt.id)}
              className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all ${
                city === opt.id
                  ? "bg-purple-500 text-white"
                  : "bg-white/[0.05] text-gray-300 hover:bg-white/[0.10] border border-white/[0.06]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Género */}
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Género</p>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map(opt => (
            <button
              key={opt.id}
              onClick={() => onGenre(opt.id)}
              className={`px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all inline-flex items-center gap-1.5 ${
                genre === opt.id
                  ? "bg-pink-500 text-white"
                  : "bg-white/[0.05] text-gray-300 hover:bg-white/[0.10] border border-white/[0.06]"
              }`}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
