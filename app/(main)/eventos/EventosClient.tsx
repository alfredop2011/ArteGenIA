"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/auth/AuthModal";
import { type Category, type Audience, type EventItem, CATEGORY_GRAD } from "./eventData";
import {
  Search,
  MapPin,
  Globe,
  Calendar as CalendarIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Ticket,
  X,
  Heart,
  Share2,
  ExternalLink,
  Music,
  PartyPopper,
  Tent,
  Footprints,
  Disc3,
  Briefcase,
  Users,
  Sparkles,
  Navigation,
  Loader2,
  Maximize2,
} from "lucide-react";

/**
 * /eventos — Agenda cultural PÚBLICA. Página de referencia para que cualquiera
 * consulte, de forma recurrente, qué eventos hay en su país / ciudad / fechas.
 *
 * Prioridad de diseño (público primero):
 *   1. Consultar eventos sin login.
 *   2. Buscar por país, ciudad, ubicación o texto libre.
 *   3. Filtrar por fecha: hoy, mañana, finde, semana, mes o rango personalizado.
 *   4. Ver detalle (dónde, cuándo, cómo asistir) + guardar + compartir + reservar.
 *
 * Organizadores = acceso SECUNDARIO ("Publicar mi evento") que lleva al login;
 * nunca domina la experiencia pública.
 *
 * Datos de ejemplo (mock) en junio 2026. Sustituir EVENTS por la fuente real
 * (API/Supabase) cuando exista. Favoritos persisten en localStorage.
 */

// ─── Tipos y datos ──────────────────────────────────────────────────────────
// (Category, Audience, EventItem y CATEGORY_GRAD viven en ./eventData para
//  poder reusarlos desde el Server Component que carga los eventos en SSR.)

const CATEGORIES: Record<Category, { label: string; icon: typeof Music; grad: string }> = {
  fiesta: { label: "Fiesta", icon: PartyPopper, grad: CATEGORY_GRAD.fiesta },
  conciertos: { label: "Conciertos", icon: Music, grad: CATEGORY_GRAD.conciertos },
  festival: { label: "Festival", icon: Tent, grad: CATEGORY_GRAD.festival },
  clases: { label: "Clases de baile", icon: Footprints, grad: CATEGORY_GRAD.clases },
  club: { label: "Club / Discoteca", icon: Disc3, grad: CATEGORY_GRAD.club },
  corporativo: { label: "Corporativo", icon: Briefcase, grad: CATEGORY_GRAD.corporativo },
};

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "academias", label: "Academias" },
  { id: "productoras", label: "Productoras" },
  { id: "freelance", label: "Freelance" },
  { id: "instituciones", label: "Instituciones" },
  { id: "agencias", label: "Agencias" },
  { id: "colegios", label: "Colegios" },
];

const COUNTRIES = [
  { id: "es", label: "España", flag: "🇪🇸", available: true },
  { id: "mx", label: "México", flag: "🇲🇽", available: false },
  { id: "ar", label: "Argentina", flag: "🇦🇷", available: false },
  { id: "co", label: "Colombia", flag: "🇨🇴", available: false },
];

const CITIES_BY_COUNTRY: Record<string, { id: string; label: string; available: boolean }[]> = {
  es: [
    { id: "todas", label: "Todas las ciudades", available: true },
    { id: "madrid", label: "Madrid", available: true },
    { id: "barcelona", label: "Barcelona", available: true },
    { id: "valencia", label: "Valencia", available: false },
    { id: "sevilla", label: "Sevilla", available: false },
  ],
};

// Coordenadas para "Cerca de mí" (detección por GPS → ciudad más cercana).
const CITY_COORDS: Record<string, { country: string; lat: number; lng: number }> = {
  madrid: { country: "es", lat: 40.4168, lng: -3.7038 },
  barcelona: { country: "es", lat: 41.3874, lng: 2.1686 },
  valencia: { country: "es", lat: 39.4699, lng: -0.3763 },
  sevilla: { country: "es", lat: 37.3891, lng: -5.9845 },
};

// Ciudades para el "ticker" del hero cuando el filtro está a nivel país
// (Todas las ciudades). En España = capitales de provincia; en el resto,
// principales ciudades. Cuando se elige una ciudad concreta, el título se fija.
const ROTATING_CITIES: Record<string, string[]> = {
  es: [
    "Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga",
    "Murcia", "Palma", "Bilbao", "Alicante", "Granada", "Córdoba",
    "Valladolid", "Vigo", "Gijón", "A Coruña", "Santander", "Pamplona",
    "San Sebastián", "Toledo", "Salamanca", "Burgos", "Cádiz", "Tarragona",
    "León", "Almería", "Logroño", "Badajoz", "Ourense", "Albacete",
  ],
  mx: [
    "Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Tijuana",
    "León", "Querétaro", "Mérida", "Cancún", "Oaxaca",
  ],
  ar: [
    "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata",
    "Mar del Plata", "Salta", "San Miguel de Tucumán",
  ],
  co: [
    "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena",
    "Bucaramanga", "Santa Marta",
  ],
};

// Eventos de ejemplo (fallback mock) — junio 2026. Se usan mientras no haya
// datos reales en la tabla `events` (antes de correr la migración / sin filas).
const MOCK_EVENTS: EventItem[] = [
  // ── Madrid ──
  { id: "e1", title: "Noche de Salsa & Timba en vivo", date: "2026-06-18", time: "21:30", venue: "Sala Pirandello", neighborhood: "Centro", country: "es", city: "madrid", category: "conciertos", audience: ["productoras"], price: 12, url: "https://example.com/entradas", hasSale: true, image: CATEGORIES.conciertos.grad },
  { id: "e2", title: "Clase abierta de Bachata", date: "2026-06-18", time: "19:00", venue: "Orishas Dance", neighborhood: "Tetuán", country: "es", city: "madrid", category: "clases", audience: ["academias"], price: 0, image: CATEGORIES.clases.grad },
  { id: "e3", title: "Fiesta Rooftop al atardecer", date: "2026-06-19", time: "19:30", venue: "Azotea Círculo", neighborhood: "Centro", country: "es", city: "madrid", category: "fiesta", audience: ["productoras"], price: 18, url: "https://example.com/entradas", hasSale: true, image: CATEGORIES.fiesta.grad },
  { id: "e4", title: "Indie Fest Madrid — Día 1", date: "2026-06-19", time: "19:00", venue: "Sala La Riviera", neighborhood: "Arganzuela", country: "es", city: "madrid", category: "festival", audience: ["productoras", "agencias"], price: 35, url: "https://example.com/entradas", hasSale: true, image: CATEGORIES.festival.grad },
  { id: "e5", title: "Masterclass Mujeres Timberas", date: "2026-06-20", time: "10:00", venue: "XTRMDANCE", neighborhood: "Carabanchel", country: "es", city: "madrid", category: "clases", audience: ["academias", "freelance"], price: 40, url: "https://example.com/entradas", hasSale: true, image: CATEGORIES.clases.grad },
  { id: "e6", title: "Noche Latina — Club", date: "2026-06-20", time: "23:30", venue: "Sala THÖ", neighborhood: "Centro", country: "es", city: "madrid", category: "club", audience: ["productoras"], price: 15, url: "https://example.com/entradas", hasSale: true, image: CATEGORIES.club.grad },
  { id: "e7", title: "Evento de empresa — Networking", date: "2026-06-22", time: "18:00", venue: "Impact Hub", neighborhood: "Barrio de las Letras", country: "es", city: "madrid", category: "corporativo", audience: ["agencias", "instituciones"], price: 0, image: CATEGORIES.corporativo.grad },
  { id: "e8", title: "Concierto sinfónico de verano", date: "2026-06-23", time: "20:00", venue: "Auditorio Nacional", neighborhood: "Chamartín", country: "es", city: "madrid", category: "conciertos", audience: ["instituciones"], price: 32, url: "https://example.com/entradas", hasSale: true, image: CATEGORIES.conciertos.grad },
  { id: "e9", title: "Festival Electrónica Open Air", date: "2026-06-26", time: "23:00", venue: "Fabrik", neighborhood: "Humanes", country: "es", city: "madrid", category: "festival", audience: ["productoras"], price: 45, url: "https://example.com/entradas", hasSale: true, image: CATEGORIES.festival.grad },
  { id: "e10", title: "Fiesta fin de curso", date: "2026-06-27", time: "18:00", venue: "Pacha Madrid", neighborhood: "Chueca", country: "es", city: "madrid", category: "fiesta", audience: ["colegios"], price: 10, image: CATEGORIES.fiesta.grad },
  // Cancelado (ejemplo del sello) — mantiene fecha/hora pero marcado.
  { id: "e11", title: "Tardeo Timbero", date: "2026-06-24", time: "18:00", venue: "Calipso", neighborhood: "Centro", country: "es", city: "madrid", category: "club", audience: ["productoras"], price: 8, cancelled: true, image: CATEGORIES.club.grad },
  // ── Barcelona ──
  { id: "b1", title: "Concierto en el Palau de la Música", date: "2026-06-19", time: "20:00", venue: "Palau de la Música", neighborhood: "Ciutat Vella", country: "es", city: "barcelona", category: "conciertos", audience: ["instituciones"], price: 30, url: "https://example.com/entradas", hasSale: true, image: CATEGORIES.conciertos.grad },
  { id: "b2", title: "Taller de Son Cubano", date: "2026-06-20", time: "11:00", venue: "Escola de Ball", neighborhood: "Eixample", country: "es", city: "barcelona", category: "clases", audience: ["academias"], price: 24, url: "https://example.com/entradas", hasSale: true, image: CATEGORIES.clases.grad },
  { id: "b3", title: "Beach Party Barceloneta", date: "2026-06-21", time: "18:00", venue: "Chiringuito Mar Bella", neighborhood: "Barceloneta", country: "es", city: "barcelona", category: "fiesta", audience: ["productoras"], price: 0, image: CATEGORIES.fiesta.grad },
  // Cancelado
  { id: "b4", title: "Festival Rumba del Raval", date: "2026-06-28", time: "19:30", venue: "Plaça del Raval", neighborhood: "El Raval", country: "es", city: "barcelona", category: "festival", audience: ["instituciones"], price: 0, cancelled: true, image: CATEGORIES.festival.grad },
];

const TODAY = "2026-06-18"; // referencia fija (mock) = currentDate del proyecto
const FAV_KEY = "ag_eventos_fav";

// ─── Helpers de fecha ─────────────────────────────────────────────────────

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmtLong(iso: string) {
  const d = parse(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
function addDays(iso: string, n: number) {
  const d = parse(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function startOfWeek(iso: string) {
  const d = parse(iso);
  const day = (d.getDay() + 6) % 7; // 0 = lunes
  return addDays(iso, -day);
}

type DateFilter = "todos" | "hoy" | "manana" | "finde" | "semana" | "mes" | "rango";

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "hoy", label: "Hoy" },
  { id: "manana", label: "Mañana" },
  { id: "finde", label: "Este finde" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mes" },
  { id: "rango", label: "Rango" },
];

function matchesDate(iso: string, filter: DateFilter, range: { from: string; to: string }): boolean {
  if (filter === "todos") return true;
  if (filter === "hoy") return iso === TODAY;
  if (filter === "manana") return iso === addDays(TODAY, 1);
  if (filter === "semana") {
    const start = startOfWeek(TODAY);
    return iso >= start && iso <= addDays(start, 6);
  }
  if (filter === "finde") {
    const start = startOfWeek(TODAY);
    return iso === addDays(start, 5) || iso === addDays(start, 6);
  }
  if (filter === "mes") {
    const d = parse(iso);
    const t = parse(TODAY);
    return d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  }
  if (filter === "rango") {
    if (range.from && iso < range.from) return false;
    if (range.to && iso > range.to) return false;
    return true;
  }
  return true;
}

// ─── Compartir (Web Share API + fallback clipboard) ────────────────────────

async function shareContent(data: { title: string; text?: string; url: string }, onCopied: () => void) {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return;
    } catch {
      return; // usuario canceló
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    onCopied();
  } catch {
    /* sin permisos de portapapeles */
  }
}

// ─── Página ─────────────────────────────────────────────────────────────────

export default function EventosClient({ initialEvents }: { initialEvents: EventItem[] }) {
  // Si ya hay sesión iniciada (flyer/organizador), saltamos el login y le
  // llevamos directo a crear/publicar. Si no, le mandamos al login y volvemos
  // a /create tras autenticarse.
  const { user } = useAuth();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const organizerLabel = user ? "Publicar evento" : "Sube tu evento gratis";
  // Si hay sesión, directo al panel; si no, abrimos el modal de login y, tras
  // autenticarse, volvemos a /organizador (nextUrl para el flujo OAuth).
  const goOrganizer = () => (user ? router.push("/organizador") : setShowAuth(true));

  // "Cerca de mí": pide ubicación al navegador y elige la ciudad DISPONIBLE
  // (con eventos) más cercana. Solo se activa si el usuario lo pulsa.
  const detectLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo({ status: "error", msg: "Tu navegador no permite ubicación" });
      return;
    }
    setGeo({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // Ciudades disponibles (con eventos), de todos los países.
        const available = Object.entries(CITIES_BY_COUNTRY).flatMap(([ct, list]) =>
          list.filter((c) => c.available && c.id !== "todas" && CITY_COORDS[c.id]).map((c) => ({ id: c.id, label: c.label, country: ct }))
        );
        let best: { id: string; label: string; country: string } | null = null;
        let bestD = Infinity;
        for (const c of available) {
          const co = CITY_COORDS[c.id];
          const d = (co.lat - latitude) ** 2 + (co.lng - longitude) ** 2;
          if (d < bestD) { bestD = d; best = c; }
        }
        if (best) {
          setCountry(best.country);
          setCity(best.id);
          setGeo({ status: "done", msg: `Mostrando ${best.label}` });
        } else {
          setGeo({ status: "error", msg: "Aún no hay eventos cerca de ti" });
        }
      },
      () => setGeo({ status: "error", msg: "No pudimos obtener tu ubicación" }),
      { timeout: 8000 }
    );
  };

  // Eventos: vienen del servidor (SSR). Si no hay datos reales, mock de muestra.
  const events = initialEvents.length > 0 ? initialEvents : MOCK_EVENTS;
  const usingMock = initialEvents.length === 0;

  const [country, setCountry] = useState("es");
  const [city, setCity] = useState("todas");
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [geo, setGeo] = useState<{ status: "idle" | "locating" | "done" | "error"; msg?: string }>({ status: "idle" });
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("todos");
  const [range, setRange] = useState({ from: "", to: "" });
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set());
  const [activeAuds, setActiveAuds] = useState<Set<Audience>>(new Set());
  const [audOpen, setAudOpen] = useState(false); // panel "Para quién es"
  const [onlyFree, setOnlyFree] = useState(false);
  const [view, setView] = useState<"lista" | "calendario">("lista");
  const [calMonth, setCalMonth] = useState(5); // junio (0-indexed)
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [showFavs, setShowFavs] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotIdx, setRotIdx] = useState(0); // índice del "ticker" de ciudades del hero

  const countryLabel = COUNTRIES.find((c) => c.id === country)?.label ?? "España";
  const cities = CITIES_BY_COUNTRY[country] ?? [{ id: "todas", label: "Todas las ciudades", available: true }];
  const cityLabel = cities.find((c) => c.id === city)?.label ?? "Todas las ciudades";
  // placeLabel = etiqueta "estable" para contador/compartir (país si es "todas").
  const placeLabel = city === "todas" ? countryLabel : cityLabel;

  // Palabra animada del título: si hay ciudad concreta, fija; si es "todas",
  // rota entre las ciudades del país seleccionado (cambia cada 2 s, ver effect).
  const rotCities = ROTATING_CITIES[country] ?? [countryLabel];
  const heroWord = city === "todas" ? rotCities[rotIdx % rotCities.length] ?? countryLabel : cityLabel;

  // Favoritos: cargar / persistir en localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      // Cargar desde localStorage tras montar evita mismatch de hidratación.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setFavs(new Set(JSON.parse(raw)));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
    } catch {}
  }, [favs]);

  // Ticker del hero: rota la ciudad cada 2 s mientras el filtro esté a nivel
  // país ("todas"). Al elegir país o ciudad concreta, reinicia. Respeta
  // prefers-reduced-motion (no rota si el usuario pidió menos movimiento).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRotIdx(0);
    if (city !== "todas") return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setRotIdx((i) => i + 1), 2000);
    return () => clearInterval(id);
  }, [city, country]);

  // Deep-link: abrir evento si la URL trae ?evento=ID (para enlaces compartidos).
  useEffect(() => {
    try {
      const id = new URLSearchParams(window.location.search).get("evento");
      if (id) {
        const ev = events.find((e) => e.id === id);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (ev) setSelected(ev);
      }
    } catch {}
  }, [events]);

  // Feedback "copiado" transitorio.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  // ── Analítica: vistas (abrir detalle) y clicks (comprar) ──
  // Solo para eventos reales (id UUID); los mock no se cuentan.
  const viewedRef = useRef<Set<string>>(new Set());
  const isRealId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id);
  useEffect(() => {
    const id = selected?.id;
    if (!id || !isRealId(id) || viewedRef.current.has(id)) return;
    viewedRef.current.add(id);
    void supabase.rpc("increment_event_view", { p_id: id });
  }, [selected]);
  const trackClick = (id: string) => {
    if (isRealId(id)) void supabase.rpc("increment_event_click", { p_id: id });
  };

  const toggleCat = (c: Category) =>
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const toggleAud = (a: Audience) =>
    setActiveAuds((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });

  const toggleFav = (id: string) =>
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const eventUrl = (id: string) =>
    typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?evento=${id}` : "";

  const sharePage = () =>
    shareContent(
      {
        title: `Agenda de eventos en ${placeLabel}`,
        text: `Mira qué eventos hay en ${placeLabel}`,
        url: typeof window !== "undefined" ? window.location.href : "",
      },
      () => setCopied(true)
    );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (e.country !== country) return false;
      if (city !== "todas" && e.city !== city) return false;
      if (showFavs && !favs.has(e.id)) return false;
      if (!matchesDate(e.date, dateFilter, range)) return false;
      if (activeCats.size > 0 && !activeCats.has(e.category)) return false;
      if (activeAuds.size > 0 && !e.audience.some((a) => activeAuds.has(a))) return false;
      if (onlyFree && e.price !== 0) return false;
      if (q) {
        const hay = `${e.title} ${e.venue} ${e.neighborhood} ${CATEGORIES[e.category].label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }, [events, query, dateFilter, range, activeCats, activeAuds, onlyFree, country, city, showFavs, favs]);

  const grouped = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    for (const e of filtered) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const resetFilters = () => {
    setQuery("");
    setDateFilter("todos");
    setRange({ from: "", to: "" });
    setActiveCats(new Set());
    setActiveAuds(new Set());
    setOnlyFree(false);
    setShowFavs(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
      {/* ── BARRA SUPERIOR: marca pública + acciones secundarias ─────────── */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-5">
        <span className="flex items-center gap-2 text-sm font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: "var(--ag-brand)" }}>
            <CalendarIcon size={16} />
          </span>
          Agenda
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={sharePage}
            aria-label="Compartir la agenda"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium sm:px-3"
            style={{ background: "var(--home-card-bg)", color: "var(--home-text-muted)" }}
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">{copied ? "¡Enlace copiado!" : "Compartir"}</span>
          </button>
          {/* Organizadores: acción CLARA pero secundaria. Si ya hay sesión,
              va directo al panel; si no, abre el login con retorno a /organizador.
              En móvil acortamos el texto para que no se parta en dos líneas. */}
          <button
            onClick={goOrganizer}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ border: "1px solid var(--ag-brand-border)", color: "var(--ag-brand)" }}
          >
            <Sparkles size={14} />
            <span className="sm:hidden">{user ? "Publicar" : "Sube tu evento"}</span>
            <span className="hidden sm:inline">{organizerLabel}</span>
          </button>
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{ background: "radial-gradient(60% 80% at 50% 0%, var(--ag-brand-bg), transparent 70%)" }}
        />
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-8 sm:pt-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" }}
            >
              <Sparkles size={13} /> Agenda cultural pública
            </span>
            <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
              ¿Qué planes hay en{" "}
              <span className="relative inline-flex items-baseline" style={{ color: "var(--ag-brand)" }}>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={heroWord}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="inline-block"
                  >
                    {heroWord}
                  </motion.span>
                </AnimatePresence>
              </span>
              ?
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base sm:text-lg" style={{ color: "var(--home-text-muted)" }}>
              Conciertos, exposiciones, teatro y mucho más. Consulta qué hay hoy, esta semana o las fechas que quieras. Sin registro.
            </p>
          </motion.div>

          {/* País + ciudad + buscador */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-7 flex max-w-3xl flex-col gap-2 sm:flex-row"
          >
            {/* País */}
            <Dropdown
              open={countryOpen}
              setOpen={setCountryOpen}
              icon={<Globe size={16} style={{ color: "var(--ag-brand)" }} />}
              label={countryLabel}
            >
              {COUNTRIES.map((c) => (
                <DropdownItem
                  key={c.id}
                  active={c.id === country}
                  disabled={!c.available}
                  onClick={() => {
                    setCountry(c.id);
                    setCity("todas");
                    setCountryOpen(false);
                  }}
                  right={!c.available ? "pronto" : undefined}
                >
                  {c.flag} {c.label}
                </DropdownItem>
              ))}
            </Dropdown>

            {/* Ciudad */}
            <Dropdown
              open={cityOpen}
              setOpen={setCityOpen}
              icon={<MapPin size={16} style={{ color: "var(--ag-brand)" }} />}
              label={cityLabel}
            >
              {cities.map((c) => (
                <DropdownItem
                  key={c.id}
                  active={c.id === city}
                  disabled={!c.available}
                  onClick={() => {
                    if (!c.available) return;
                    setCity(c.id);
                    setCityOpen(false);
                  }}
                  right={!c.available ? "pronto" : undefined}
                >
                  {c.label}
                </DropdownItem>
              ))}
            </Dropdown>

            {/* Búsqueda libre */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--home-text-soft)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca por nombre, sala o barrio…"
                className="h-12 w-full rounded-xl pl-11 pr-10 text-sm outline-none"
                style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)", color: "var(--home-text)" }}
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--home-text-soft)" }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </motion.div>

          {/* Cerca de mí — detección de ubicación opcional */}
          <div className="mx-auto mt-3 flex max-w-3xl items-center justify-center gap-2 text-xs">
            <button
              onClick={detectLocation}
              disabled={geo.status === "locating"}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors disabled:opacity-60"
              style={{ background: "var(--home-card-bg)", color: "var(--ag-brand)" }}
            >
              {geo.status === "locating" ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
              {geo.status === "locating" ? "Buscando tu zona…" : "Cerca de mí"}
            </button>
            {geo.msg && (
              <span style={{ color: geo.status === "error" ? "var(--ag-warning)" : "var(--home-text-soft)" }}>{geo.msg}</span>
            )}
          </div>
        </div>
      </section>

      {/* ── BARRA DE FILTROS (sticky) ───────────────────────────── */}
      <div className="sticky top-0 z-10 backdrop-blur" style={{ background: "var(--header-bg)", borderBottom: "1px solid var(--header-border)" }}>
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {DATE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDateFilter(f.id)}
                  className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
                  style={dateFilter === f.id ? { background: "var(--ag-brand)", color: "#fff" } : { background: "var(--home-card-bg)", color: "var(--home-text-muted)" }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 rounded-full p-0.5" style={{ background: "var(--home-card-bg)" }}>
              {([
                { id: "lista", icon: LayoutGrid, label: "Lista" },
                { id: "calendario", icon: CalendarIcon, label: "Calendario" },
              ] as const).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={view === v.id ? { background: "var(--home-bg-soft)", color: "var(--ag-brand)" } : { color: "var(--home-text-soft)" }}
                  aria-label={v.label}
                >
                  <v.icon size={14} />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rango personalizado de fechas */}
          <AnimatePresence>
            {dateFilter === "rango" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--home-text-muted)" }}>
                  <span>Desde</span>
                  <input
                    type="date"
                    value={range.from}
                    onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                    className="rounded-lg px-2 py-1.5"
                    style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)", color: "var(--home-text)" }}
                  />
                  <span>hasta</span>
                  <input
                    type="date"
                    value={range.to}
                    onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                    className="rounded-lg px-2 py-1.5"
                    style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)", color: "var(--home-text)" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categorías + gratis + guardados */}
          <div className="mt-2.5 flex flex-wrap gap-2">
            {(Object.keys(CATEGORIES) as Category[]).map((c) => {
              const Cat = CATEGORIES[c];
              const on = activeCats.has(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                  style={on ? { background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" } : { background: "transparent", color: "var(--home-text-muted)", border: "1px solid var(--home-card-border)" }}
                >
                  <Cat.icon size={13} />
                  {Cat.label}
                </button>
              );
            })}
            <button
              onClick={() => setOnlyFree((f) => !f)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
              style={onlyFree ? { background: "var(--ag-success-bg)", color: "var(--ag-success)", border: "1px solid var(--ag-success-border)" } : { background: "transparent", color: "var(--home-text-muted)", border: "1px solid var(--home-card-border)" }}
            >
              <Ticket size={13} /> Gratis
            </button>
            <button
              onClick={() => setShowFavs((f) => !f)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
              style={showFavs ? { background: "var(--ag-danger-bg)", color: "var(--ag-danger)", border: "1px solid var(--ag-danger-border)" } : { background: "transparent", color: "var(--home-text-muted)", border: "1px solid var(--home-card-border)" }}
            >
              <Heart size={13} fill={showFavs ? "currentColor" : "none"} /> Guardados {favs.size > 0 && `(${favs.size})`}
            </button>
            {/* "Para quién es" — filtro de audiencia (secundario, plegable). */}
            <button
              onClick={() => setAudOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
              style={activeAuds.size > 0 || audOpen ? { background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" } : { background: "transparent", color: "var(--home-text-muted)", border: "1px solid var(--home-card-border)" }}
            >
              <Users size={13} /> Para quién es {activeAuds.size > 0 && `(${activeAuds.size})`}
              <ChevronDown size={12} className={`transition-transform ${audOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Pills de audiencia (plegable) */}
          <AnimatePresence>
            {audOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {AUDIENCES.map((a) => {
                    const on = activeAuds.has(a.id);
                    return (
                      <button
                        key={a.id}
                        onClick={() => toggleAud(a.id)}
                        className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                        style={on ? { background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" } : { background: "transparent", color: "var(--home-text-muted)", border: "1px solid var(--home-card-border)" }}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── CONTENIDO ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-4 text-sm" style={{ color: "var(--home-text-soft)" }}>
          {filtered.length} {filtered.length === 1 ? "evento" : "eventos"} en {placeLabel}
          {usingMock && (
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-[11px]"
              style={{ background: "var(--ag-warning-bg)", color: "var(--ag-warning)" }}
            >
              ejemplos de muestra
            </span>
          )}
        </p>

        {filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : view === "lista" ? (
          <ListView grouped={grouped} favs={favs} onFav={toggleFav} onSelect={setSelected} />
        ) : (
          <CalendarView events={filtered} month={calMonth} onMonth={setCalMonth} onSelect={setSelected} />
        )}
      </section>

      {/* ── BANDA ORGANIZADORES (secundaria, al pie) ─────────────── */}
      <section className="mx-auto mt-6 max-w-6xl px-4 pb-12">
        <div
          className="flex flex-col items-center justify-between gap-4 rounded-2xl p-6 text-center sm:flex-row sm:text-left"
          style={{ background: "var(--home-feature-bg)", border: "1px solid var(--home-feature-border)" }}
        >
          <div>
            <h3 className="text-base font-semibold">{user ? "¿Tienes un nuevo evento?" : "¿Organizas eventos?"}</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--home-text-muted)" }}>
              {user
                ? "Publícalo en la agenda y crea su flyer en minutos con tu cuenta."
                : "Publica tu evento en la agenda y crea su flyer en minutos. Gratis para empezar."}
            </p>
          </div>
          <button
            onClick={goOrganizer}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--ag-brand)" }}
          >
            <Sparkles size={15} /> {user ? "Publicar evento" : "Sube tu evento gratis"}
          </button>
        </div>
      </section>

      {/* Login de organizador (mismo patrón que el resto de la app) */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          title="Publica tu evento"
          subtitle="Crea tu cuenta de organizador. Es gratis para empezar."
          nextUrl="/organizador"
          onAuthSuccess={() => router.push("/organizador")}
        />
      )}

      {/* ── MODAL DETALLE ──────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <EventModal
            event={selected}
            isFav={favs.has(selected.id)}
            onFav={() => toggleFav(selected.id)}
            onShare={() =>
              shareContent(
                { title: selected.title, text: `${selected.title} · ${fmtLong(selected.date)} en ${selected.venue}`, url: eventUrl(selected.id) },
                () => setCopied(true)
              )
            }
            copied={copied}
            onBuy={() => trackClick(selected.id)}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dropdown reutilizable (país / ciudad) ─────────────────────────────────

function Dropdown({
  open,
  setOpen,
  icon,
  label,
  children,
}: {
  open: boolean;
  setOpen: (v: boolean | ((o: boolean) => boolean)) => void;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-12 w-full items-center justify-between gap-2 rounded-xl px-4 text-sm font-medium sm:w-auto sm:min-w-[160px]"
        style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}
      >
        <span className="flex items-center gap-2 truncate">{icon}<span className="truncate">{label}</span></span>
        <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--home-text-soft)" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-20 mt-2 w-full min-w-[200px] overflow-hidden rounded-xl shadow-lg"
            style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DropdownItem({
  active,
  disabled,
  onClick,
  right,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-ag-card disabled:opacity-50"
      style={{ color: active ? "var(--ag-brand)" : "var(--home-text)" }}
    >
      <span>{children}</span>
      {right && <span className="text-[10px]" style={{ color: "var(--home-text-soft)" }}>{right}</span>}
    </button>
  );
}

// ─── Vista lista ──────────────────────────────────────────────────────────

function ListView({
  grouped,
  favs,
  onFav,
  onSelect,
}: {
  grouped: [string, EventItem[]][];
  favs: Set<string>;
  onFav: (id: string) => void;
  onSelect: (e: EventItem) => void;
}) {
  return (
    <div className="space-y-8">
      {grouped.map(([date, items]) => (
        <div key={date}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold capitalize">
            <CalendarIcon size={15} style={{ color: "var(--ag-brand)" }} />
            {date === TODAY ? "Hoy · " : ""}
            {fmtLong(date)}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <EventCard key={e.id} event={e} isFav={favs.has(e.id)} onFav={() => onFav(e.id)} onClick={() => onSelect(e)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventCard({
  event,
  isFav,
  onFav,
  onClick,
}: {
  event: EventItem;
  isFav: boolean;
  onFav: () => void;
  onClick: () => void;
}) {
  const Cat = CATEGORIES[event.category];
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl"
      style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}
    >
      <button onClick={onClick} className="block w-full text-left">
        <div className="relative h-32 w-full" style={{ background: event.image }}>
          {event.cancelled && <CancelledSeal />}
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
            <Cat.icon size={11} /> {Cat.label}
          </span>
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-900">
            {event.price == null
              ? "Consultar"
              : event.price === 0
              ? "Gratis"
              : `${event.priceInfo ? "desde " : ""}${event.price} €`}
          </span>
        </div>
      </button>
      {/* Botón guardar (no debe disparar el click de la card) */}
      <button
        onClick={onFav}
        aria-label={isFav ? "Quitar de guardados" : "Guardar evento"}
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition-transform hover:scale-110"
      >
        <Heart size={15} fill={isFav ? "#f87171" : "none"} stroke={isFav ? "#f87171" : "currentColor"} />
      </button>
      <button onClick={onClick} className="block w-full p-4 text-left">
        <h4 className="line-clamp-1 font-semibold">{event.title}</h4>
        <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--home-text-muted)" }}>
          <p className="flex items-center gap-1.5"><Clock size={12} /> {event.time}</p>
          <p className="flex items-center gap-1.5"><MapPin size={12} /> {event.venue} · {event.neighborhood}</p>
        </div>
      </button>
    </motion.div>
  );
}

// ─── Vista calendario ─────────────────────────────────────────────────────

function CalendarView({
  events,
  month,
  onMonth,
  onSelect,
}: {
  events: EventItem[];
  month: number;
  onMonth: (m: number) => void;
  onSelect: (e: EventItem) => void;
}) {
  const year = 2026;
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = useMemo(() => {
    const map = new Map<number, EventItem[]>();
    for (const e of events) {
      const d = parse(e.date);
      if (d.getMonth() !== month) continue;
      const day = d.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return map;
  }, [events, month]);

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayDay = parse(TODAY).getMonth() === month ? parse(TODAY).getDate() : -1;

  return (
    <div className="rounded-2xl p-3 sm:p-5" style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => onMonth(Math.max(0, month - 1))} disabled={month <= 0} className="rounded-lg p-2 hover:bg-ag-card disabled:opacity-30">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-base font-semibold capitalize">{MONTHS[month]} {year}</h3>
        <button onClick={() => onMonth(Math.min(11, month + 1))} disabled={month >= 11} className="rounded-lg p-2 hover:bg-ag-card disabled:opacity-30">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium" style={{ color: "var(--home-text-soft)" }}>
        {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const dayEvents = byDay.get(day) ?? [];
          const isToday = day === todayDay;
          return (
            <div
              key={day}
              className="min-h-[68px] rounded-lg p-1.5 sm:min-h-[96px]"
              style={{
                background: dayEvents.length ? "var(--ag-brand-bg)" : "var(--home-card-bg)",
                border: isToday ? "1.5px solid var(--ag-brand)" : "1px solid transparent",
              }}
            >
              <span className="text-[11px] font-semibold" style={{ color: isToday ? "var(--ag-brand)" : "var(--home-text-muted)" }}>{day}</span>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onSelect(e)}
                    className="block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white"
                    style={{ background: CATEGORIES[e.category].grad }}
                    title={e.title}
                  >
                    {e.time} {e.title}
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <span className="block px-1 text-[10px]" style={{ color: "var(--home-text-soft)" }}>+{dayEvents.length - 2} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal detalle ──────────────────────────────────────────────────────────

function EventModal({
  event,
  isFav,
  onFav,
  onShare,
  copied,
  onBuy,
  onClose,
}: {
  event: EventItem;
  isFav: boolean;
  onFav: () => void;
  onShare: () => void;
  copied: boolean;
  onBuy: () => void;
  onClose: () => void;
}) {
  const Cat = CATEGORIES[event.category];
  const [showFlyer, setShowFlyer] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{ background: "var(--home-bg-soft)", color: "var(--home-text)" }}
      >
        <div
          className={`relative h-40 ${event.flyerUrl ? "cursor-zoom-in" : ""}`}
          style={{ background: event.image }}
          onClick={() => event.flyerUrl && setShowFlyer(true)}
        >
          {event.cancelled && <CancelledSeal big />}
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute right-3 top-3 rounded-full bg-black/30 p-2 text-white backdrop-blur">
            <X size={16} />
          </button>
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
            <Cat.icon size={13} /> {Cat.label}
          </span>
          {event.flyerUrl && (
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              <Maximize2 size={12} /> Ver flyer
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-xl font-bold">{event.title}</h3>
          <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--home-text-muted)" }}>
            <p className="flex items-center gap-2"><CalendarIcon size={15} style={{ color: "var(--ag-brand)" }} /> <span className="capitalize">{fmtLong(event.date)}</span></p>
            <p className="flex items-center gap-2"><Clock size={15} style={{ color: "var(--ag-brand)" }} /> {event.time} h</p>
            <p className="flex items-center gap-2"><MapPin size={15} style={{ color: "var(--ag-brand)" }} /> {event.venue} · {event.neighborhood}</p>
            <p className="flex items-center gap-2"><Ticket size={15} style={{ color: "var(--ag-brand)" }} /> {event.priceInfo ? event.priceInfo : event.price == null ? "Precio por confirmar" : event.price === 0 ? "Entrada gratuita" : `${event.price} €`}</p>
          </div>

          {/* Acciones secundarias: guardar + compartir */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={onFav}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium"
              style={isFav ? { background: "var(--ag-danger-bg)", color: "var(--ag-danger)" } : { background: "var(--home-card-bg)", color: "var(--home-text)" }}
            >
              <Heart size={15} fill={isFav ? "currentColor" : "none"} /> {isFav ? "Guardado" : "Guardar"}
            </button>
            <button
              onClick={onShare}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: "var(--home-card-bg)", color: "var(--home-text)" }}
            >
              <Share2 size={15} /> {copied ? "¡Copiado!" : "Compartir"}
            </button>
          </div>

          {/* Acción principal: cómo asistir. Si el organizador marcó venta
              online y dejó link, redirige a su página del evento / pago. */}
          {(event.hasSale ?? !!event.url) && event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onBuy}
              className="mt-2 flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white"
              style={{ background: "var(--ag-brand)" }}
            >
              Comprar entradas online <ExternalLink size={15} />
            </a>
          ) : event.price === 0 ? (
            <div className="mt-2 rounded-xl py-3 text-center text-sm font-medium" style={{ background: "var(--ag-success-bg)", color: "var(--ag-success)" }}>
              Entrada libre — no necesitas reservar
            </div>
          ) : (
            <div className="mt-2 rounded-xl py-3 text-center text-sm font-medium" style={{ background: "var(--ag-info-bg)", color: "var(--ag-info)" }}>
              {event.price == null ? "Consulta el precio con el organizador" : "Entradas en taquilla"}
            </div>
          )}
        </div>
      </motion.div>

      {/* Visor de flyer a tamaño completo (escritorio y móvil) */}
      <AnimatePresence>
        {showFlyer && event.flyerUrl && (
          <FlyerLightbox url={event.flyerUrl} alt={event.title} onClose={() => setShowFlyer(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Visor de flyer a pantalla completa ──────────────────────────────────────

function FlyerLightbox({ url, alt, onClose }: { url: string; alt: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white backdrop-blur"
        aria-label="Cerrar"
      >
        <X size={20} />
      </button>
      <motion.img
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        src={url}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
      />
    </motion.div>
  );
}

// ─── Sello CANCELADO ────────────────────────────────────────────────────────

function CancelledSeal({ big }: { big?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <span
        className={`-rotate-12 rounded-md border-2 font-extrabold uppercase tracking-widest ${big ? "px-5 py-2 text-2xl" : "px-3 py-1 text-sm"}`}
        style={{ color: "#fff", borderColor: "#fff", background: "rgba(220,38,38,0.85)" }}
      >
        Cancelado
      </span>
    </div>
  );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center" style={{ background: "var(--home-bg-soft)", border: "1px dashed var(--home-card-border)" }}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--ag-brand-bg)" }}>
        <Search size={24} style={{ color: "var(--ag-brand)" }} />
      </div>
      <h3 className="text-lg font-semibold">No hay eventos con esos filtros</h3>
      <p className="mt-1 max-w-xs text-sm" style={{ color: "var(--home-text-muted)" }}>Prueba a cambiar la ciudad, las fechas o quita algún filtro.</p>
      <button onClick={onReset} className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--ag-brand)" }}>
        Limpiar filtros
      </button>
    </div>
  );
}
