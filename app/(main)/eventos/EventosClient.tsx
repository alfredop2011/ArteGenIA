"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import type { TranslationKey } from "@/lib/translations";
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
  Drama,
  Users,
  Sparkles,
  Navigation,
  Loader2,
  Maximize2,
  Crosshair,
  SlidersHorizontal,
  Send,
  MessageCircle,
  Mic,
  Wand2,
} from "lucide-react";

// Usuario del bot de Telegram (sin @). Configurable por env para no hardcodear.
// Ej: NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=ArtegeniaBot
const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";

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

// `labelKey` = clave i18n (se resuelve con t(...) en el render). El icono y el
// gradiente no cambian con el idioma.
const CATEGORIES: Record<Category, { labelKey: TranslationKey; icon: typeof Music; grad: string }> = {
  fiesta: { labelKey: "eventos.cat.fiesta", icon: PartyPopper, grad: CATEGORY_GRAD.fiesta },
  conciertos: { labelKey: "eventos.cat.conciertos", icon: Music, grad: CATEGORY_GRAD.conciertos },
  festival: { labelKey: "eventos.cat.festival", icon: Tent, grad: CATEGORY_GRAD.festival },
  clases: { labelKey: "eventos.cat.clases", icon: Footprints, grad: CATEGORY_GRAD.clases },
  club: { labelKey: "eventos.cat.club", icon: Disc3, grad: CATEGORY_GRAD.club },
  corporativo: { labelKey: "eventos.cat.corporativo", icon: Briefcase, grad: CATEGORY_GRAD.corporativo },
  social: { labelKey: "eventos.cat.social", icon: Users, grad: CATEGORY_GRAD.social },
  teatro: { labelKey: "eventos.cat.teatro", icon: Drama, grad: CATEGORY_GRAD.teatro },
};

const AUDIENCES: { id: Audience; labelKey: TranslationKey }[] = [
  { id: "academias", labelKey: "eventos.aud.academias" },
  { id: "productoras", labelKey: "eventos.aud.productoras" },
  { id: "freelance", labelKey: "eventos.aud.freelance" },
  { id: "instituciones", labelKey: "eventos.aud.instituciones" },
  { id: "agencias", labelKey: "eventos.aud.agencias" },
  { id: "colegios", labelKey: "eventos.aud.colegios" },
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
    { id: "valencia", label: "Valencia", available: true },
    { id: "sevilla", label: "Sevilla", available: true },
    { id: "malaga", label: "Málaga", available: true },
    { id: "bilbao", label: "Bilbao", available: true },
    { id: "zaragoza", label: "Zaragoza", available: true },
    { id: "granada", label: "Granada", available: true },
  ],
};

// Nombres "bonitos" para las ciudades con tildes; el resto se title-casan.
const CITY_LABELS: Record<string, string> = {
  madrid: "Madrid", barcelona: "Barcelona", valencia: "Valencia", sevilla: "Sevilla",
  malaga: "Málaga", bilbao: "Bilbao", zaragoza: "Zaragoza", granada: "Granada",
};
const titleCaseCity = (s: string) => s.split(" ").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
const cityLabelFor = (id: string) => CITY_LABELS[id] ?? titleCaseCity(id);

// Foto de fondo del hero por ciudad (skyline nocturno). Vacío por ahora; para
// activarla, sube la imagen a R2 (CORS ya configurado) y pon aquí su URL:
//   madrid: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/hero/madrid.jpg`, …
// Si una ciudad no tiene foto, el hero usa solo el degradado oscuro + glows.
const CITY_HERO: Record<string, string> = {};

// Coordenadas para "Cerca de mí" (detección por GPS → ciudad más cercana).
const CITY_COORDS: Record<string, { country: string; lat: number; lng: number }> = {
  madrid: { country: "es", lat: 40.4168, lng: -3.7038 },
  barcelona: { country: "es", lat: 41.3874, lng: 2.1686 },
  valencia: { country: "es", lat: 39.4699, lng: -0.3763 },
  sevilla: { country: "es", lat: 37.3891, lng: -5.9845 },
  malaga: { country: "es", lat: 36.7213, lng: -4.4214 },
  bilbao: { country: "es", lat: 43.263, lng: -2.935 },
  zaragoza: { country: "es", lat: 41.6488, lng: -0.8891 },
  granada: { country: "es", lat: 37.1773, lng: -3.5986 },
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

// Fecha de HOY real (local), formato YYYY-MM-DD. Antes estaba fija a una fecha
// del mock, lo que rompía los filtros Hoy/Mañana/Finde/Semana/Mes y la etiqueta
// "Hoy" de las cabeceras (buscaban un día que ya había pasado).
const TODAY = new Date().toLocaleDateString("en-CA");
const FAV_KEY = "ag_eventos_fav";

// ─── Helpers de fecha ─────────────────────────────────────────────────────

// Etiqueta BCP-47 por locale para formatear fechas con Intl (meses/días en el
// idioma activo, sin mantener arrays a mano).
const LOCALE_TAG: Record<string, string> = { es: "es-ES", en: "en-GB", fr: "fr-FR", pt: "pt-PT" };
const tag = (locale: string) => LOCALE_TAG[locale] ?? "es-ES";

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function fmtLong(iso: string, locale = "es") {
  const d = parse(iso);
  // Muestra el año solo si NO es el año en curso (evita "15 mayo" ambiguo).
  const y = d.getFullYear() !== parse(TODAY).getFullYear() ? ` ${d.getFullYear()}` : "";
  const month = new Intl.DateTimeFormat(tag(locale), { month: "long" }).format(d);
  return `${d.getDate()} ${month}${y}`;
}
// Cabecera del calendario: "junio 2026" / "June 2026" según idioma.
function monthYear(month: number, year: number, locale = "es") {
  return new Intl.DateTimeFormat(tag(locale), { month: "long", year: "numeric" }).format(new Date(year, month, 1));
}
// Iniciales de los días, empezando en lunes, en el idioma activo (L M X J V S D).
function weekdayInitials(locale: string) {
  const fmt = new Intl.DateTimeFormat(tag(locale), { weekday: "narrow" });
  return [1, 2, 3, 4, 5, 6, 7].map((day) => fmt.format(new Date(2024, 0, day)).toUpperCase());
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

const DATE_FILTERS: { id: DateFilter; labelKey: TranslationKey }[] = [
  { id: "todos", labelKey: "eventos.date.todos" },
  { id: "hoy", labelKey: "eventos.date.hoy" },
  { id: "manana", labelKey: "eventos.date.manana" },
  { id: "finde", labelKey: "eventos.date.finde" },
  { id: "semana", labelKey: "eventos.date.semana" },
  { id: "mes", labelKey: "eventos.date.mes" },
  { id: "rango", labelKey: "eventos.date.rango" },
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
  const { t, locale } = useLocale();
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const organizerLabel = user ? t("eventos.organizer.publish") : t("eventos.organizer.uploadFree");
  // Si hay sesión, directo al panel; si no, abrimos el modal de login y, tras
  // autenticarse, volvemos a /organizador (nextUrl para el flujo OAuth).
  const goOrganizer = () => {
    setShowPublish(false);
    if (user) router.push("/organizador");
    else setShowAuth(true);
  };

  // "Cerca de mí": pide ubicación al navegador y elige la ciudad DISPONIBLE
  // (con eventos) más cercana. Solo se activa si el usuario lo pulsa.
  const detectLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo({ status: "error", msg: t("eventos.geo.unsupported") });
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
          setGeo({ status: "done", msg: t("eventos.geo.showing").replace("{place}", best.label) });
        } else {
          setGeo({ status: "error", msg: t("eventos.geo.noneNearby") });
        }
      },
      () => setGeo({ status: "error", msg: t("eventos.geo.failed") }),
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
  // Por defecto mostramos Conciertos + Bailes sociales (el foco de la escena).
  const [activeCats, setActiveCats] = useState<Set<Category>>(new Set<Category>(["conciertos", "social"]));
  const [activeAuds, setActiveAuds] = useState<Set<Audience>>(new Set());
  const [moreFilters, setMoreFilters] = useState(false); // panel "Más filtros"
  const [onlyFree, setOnlyFree] = useState(false);
  const [view, setView] = useState<"lista" | "calendario">("lista");
  // Índice de mes ABSOLUTO (año*12 + mes) para el calendario; arranca en el mes actual.
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); });
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [showFavs, setShowFavs] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotIdx, setRotIdx] = useState(0); // índice del "ticker" de ciudades del hero

  const countryLabel = COUNTRIES.find((c) => c.id === country)?.label ?? "España";
  // El label "Todas las ciudades" es chrome de UI (se traduce); los nombres de
  // ciudades son nombres propios y se dejan tal cual.
  const cityLabelOf = (c: { id: string; label: string }) => (c.id === "todas" ? t("eventos.city.todas") : c.label);
  // Lista de ciudades DINÁMICA: sale de los eventos reales del país (con su
  // número), así nunca ofrecemos ciudades vacías ni escondemos ciudades que sí
  // tienen eventos (antes era una lista fija de 8 y se quedaban fuera, p.ej.
  // Lloret de Mar). "Todas" siempre primera.
  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) if (e.country === country) counts.set(e.city, (counts.get(e.city) ?? 0) + 1);
    const list = [...counts.entries()]
      .map(([id, count]) => ({ id, label: cityLabelFor(id), available: true, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    const total = list.reduce((s, c) => s + c.count, 0);
    return [{ id: "todas", label: "Todas las ciudades", available: true, count: total }, ...list];
  }, [events, country]);
  const cityLabel = cityLabelOf(cities.find((c) => c.id === city) ?? { id: "todas", label: "" });
  // placeLabel = etiqueta "estable" para contador/compartir (país si es "todas").
  const placeLabel = city === "todas" ? countryLabel : cityLabel;

  // Palabra animada del título: si hay ciudad concreta, fija; si es "todas",
  // rota entre las ciudades del país seleccionado (cambia cada 2 s, ver effect).
  const rotCities = ROTATING_CITIES[country] ?? [countryLabel];
  const heroWord = city === "todas" ? rotCities[rotIdx % rotCities.length] ?? countryLabel : cityLabel;
  const cityHero = CITY_HERO[city] || "";

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
        title: `${t("eventos.topbar.brand")} · ${placeLabel}`,
        text: `${t("eventos.hero.titleDesktop")}${placeLabel}`.trim(),
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
        const hay = `${e.title} ${e.venue} ${e.neighborhood} ${t(CATEGORIES[e.category].labelKey)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }, [events, query, dateFilter, range, activeCats, activeAuds, onlyFree, country, city, showFavs, favs, t]);

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
          {t("eventos.topbar.brand")}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={sharePage}
            aria-label={t("eventos.topbar.shareAria")}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium sm:px-3"
            style={{ background: "var(--home-card-bg)", color: "var(--home-text-muted)" }}
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">{copied ? t("eventos.topbar.shareCopied") : t("eventos.topbar.share")}</span>
          </button>
          {/* Organizadores: acción CLARA pero secundaria. Si ya hay sesión,
              va directo al panel; si no, abre el login con retorno a /organizador.
              En móvil acortamos el texto para que no se parta en dos líneas. */}
          <button
            onClick={() => setShowPublish(true)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ border: "1px solid var(--ag-brand-border)", color: "var(--ag-brand)" }}
          >
            <Sparkles size={14} />
            <span className="sm:hidden">{user ? t("eventos.topbar.publishShort") : t("eventos.topbar.uploadShort")}</span>
            <span className="hidden sm:inline">{organizerLabel}</span>
          </button>
        </div>
      </div>

      {/* ── HERO (oscuro, estilo "noche" premium) ────────────── */}
      {/* Fondo oscuro fijo (no depende del tema) + glows neón. Si la ciudad
          tiene foto (CITY_HERO), se pinta detrás con máscara oscura. */}
      <section className="relative isolate overflow-hidden">
        {/* base oscura */}
        <div className="absolute inset-0 -z-30" style={{ background: "linear-gradient(180deg,#0b0b13 0%,#120a1f 55%,#0b0b13 100%)" }} />
        {/* foto de la ciudad (si existe), desvanecida arriba-derecha */}
        {cityHero && (
          <div
            className="absolute inset-y-0 right-0 -z-20 w-full sm:w-3/5"
            style={{
              backgroundImage: `linear-gradient(90deg,#0b0b13 0%,rgba(11,11,19,.65) 35%,rgba(11,11,19,.15) 100%), url('${cityHero}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              maskImage: "linear-gradient(180deg,#000 0%,#000 60%,transparent 100%)",
              WebkitMaskImage: "linear-gradient(180deg,#000 0%,#000 60%,transparent 100%)",
            }}
          />
        )}
        {/* glows neón */}
        <div className="absolute -left-24 top-0 -z-10 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle,#7E2BFF,transparent 70%)" }} />
        <div className="absolute right-0 top-10 -z-10 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle,#FF1EA8,transparent 70%)" }} />
        <div className="mx-auto max-w-6xl px-4 pt-5 pb-4 sm:pt-10 sm:pb-8">
          {/* initial=false: render directo a su estado final. Antes usaba una
              animación de entrada (opacity 0→1) que en SSR/hidratación se podía
              quedar atascada en opacity:0 y dejaba el hero (título, país/ciudad,
              buscador) INVISIBLE. El contenido crítico nunca debe depender de
              que una animación termine. */}
          <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="text-left sm:text-center">
            <span
              className="mb-3 hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex"
              style={{ background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" }}
            >
              <Sparkles size={13} /> {t("eventos.hero.badge")}
            </span>
            <h1 className="mx-auto max-w-3xl text-2xl font-bold tracking-tight text-white sm:text-5xl">
              <span className="sm:hidden">{t("eventos.hero.titleMobile")}</span>
              <span className="hidden sm:inline">{t("eventos.hero.titleDesktop")}</span>
              <span className="relative inline-flex items-baseline" style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
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
              <span className="hidden sm:inline">?</span>
            </h1>
            <p className="mx-auto mt-1.5 max-w-xl text-sm sm:mt-3 sm:text-lg" style={{ color: "rgba(255,255,255,.72)" }}>
              {t("eventos.hero.subtitle")}
            </p>
          </motion.div>

          {/* País + ciudad + buscador — initial=false para que SIEMPRE se vean
              (mismo motivo que arriba: la animación de entrada podía dejarlos
              invisibles). */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            /* z-30 + relative: el menú de país/ciudad debe quedar POR ENCIMA de
               la barra de filtros sticky (z-10), si no se abría detrás. */
            className="relative z-30 mx-auto mt-4 flex max-w-3xl flex-col gap-2 sm:mt-7 sm:flex-row"
          >
            {/* País + ciudad: solo escritorio (en móvil basta el buscador + ◎) */}
            <div className="hidden gap-2 sm:flex">
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
                  right={!c.available ? t("eventos.country.soon") : undefined}
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
                  onClick={() => {
                    setCity(c.id);
                    setCityOpen(false);
                  }}
                  right={String(c.count)}
                >
                  {cityLabelOf(c)}
                </DropdownItem>
              ))}
            </Dropdown>

            </div>
            {/* Búsqueda libre + botón de ubicación (◎) */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,.5)" }} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("eventos.search.placeholder")}
                className="h-12 w-full rounded-xl pl-11 pr-20 text-sm text-white outline-none placeholder:text-white/50"
                style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)", backdropFilter: "blur(8px)" }}
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-11 top-1/2 -translate-y-1/2" style={{ color: "var(--home-text-soft)" }}>
                  <X size={16} />
                </button>
              )}
              <button
                onClick={detectLocation}
                disabled={geo.status === "locating"}
                title={t("eventos.search.nearMe")}
                aria-label={t("eventos.search.nearMe")}
                className="absolute right-3 top-1/2 -translate-y-1/2 disabled:opacity-60"
                style={{ color: "var(--ag-brand)" }}
              >
                {geo.status === "locating" ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
              </button>
            </div>
          </motion.div>
          {geo.status === "error" ? (
            <div className="mx-auto mt-2 max-w-sm text-center">
              <p className="text-xs" style={{ color: "var(--ag-warning)" }}>{t("eventos.geo.errorPrompt").replace("{msg}", geo.msg ?? "")}</p>
              <CityAutocomplete
                cities={cities}
                onPick={(id) => {
                  const lbl = cities.find((c) => c.id === id)?.label ?? "";
                  setCity(id);
                  setGeo({ status: "done", msg: t("eventos.geo.showing").replace("{place}", lbl) });
                }}
              />
            </div>
          ) : geo.msg ? (
            <p className="mx-auto mt-2 max-w-3xl text-center text-xs" style={{ color: "var(--home-text-soft)" }}>{geo.msg}</p>
          ) : null}
        </div>
      </section>

      {/* ── BARRA DE FILTROS (sticky) ───────────────────────────── */}
      <div className="sticky top-0 z-10 backdrop-blur" style={{ background: "var(--header-bg)", borderBottom: "1px solid var(--header-border)" }}>
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Chips rápidos: se ajustan en varias líneas para que SIEMPRE se
                vean todos (antes "Cerca de mí" y "Más filtros" se recortaban). */}
            <div className="flex flex-wrap items-center gap-2">
              {(["hoy", "finde"] as DateFilter[]).map((id) => {
                const f = DATE_FILTERS.find((x) => x.id === id)!;
                const on = dateFilter === id;
                return (
                  <button
                    key={id}
                    onClick={() => setDateFilter(on ? "todos" : id)}
                    className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
                    style={on ? { background: "var(--ag-brand)", color: "#fff" } : { background: "var(--home-card-bg)", color: "var(--home-text-muted)" }}
                  >
                    {t(f.labelKey)}
                  </button>
                );
              })}
              <button
                onClick={() => setOnlyFree((v) => !v)}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={onlyFree ? { background: "var(--ag-success-bg)", color: "var(--ag-success)", border: "1px solid var(--ag-success-border)" } : { background: "var(--home-card-bg)", color: "var(--home-text-muted)" }}
              >
                <Ticket size={13} /> {t("eventos.filters.free")}
              </button>
              {(["conciertos", "teatro", "social"] as Category[]).map((c) => {
                const Cat = CATEGORIES[c];
                const on = activeCats.has(c);
                return (
                  <button
                    key={c}
                    onClick={() => toggleCat(c)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                    style={on ? { background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" } : { background: "var(--home-card-bg)", color: "var(--home-text-muted)" }}
                  >
                    <Cat.icon size={13} /> {t(Cat.labelKey)}
                  </button>
                );
              })}
              <button
                onClick={detectLocation}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{ background: "var(--home-card-bg)", color: "var(--ag-brand)" }}
              >
                <Navigation size={13} /> {t("eventos.filters.nearMe")}
              </button>
              <button
                onClick={() => setMoreFilters((o) => !o)}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={moreFilters || activeAuds.size > 0 || showFavs ? { background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" } : { background: "var(--home-card-bg)", color: "var(--home-text-muted)" }}
              >
                <SlidersHorizontal size={13} /> {t("eventos.filters.more")}
                <ChevronDown size={12} className={`transition-transform ${moreFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
            <div className="flex shrink-0 rounded-full p-0.5" style={{ background: "var(--home-card-bg)" }}>
              {([
                { id: "lista", icon: LayoutGrid, label: t("eventos.view.lista") },
                { id: "calendario", icon: CalendarIcon, label: t("eventos.view.calendario") },
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

          {/* ── MÁS FILTROS (plegable): fechas, categorías, audiencia ── */}
          <AnimatePresence>
            {moreFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: "var(--home-divider)" }}>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--home-text-soft)" }}>{t("eventos.filters.whenLabel")}</p>
                    <div className="flex flex-wrap gap-2">
                      {DATE_FILTERS.map((f) => (
                        <button key={f.id} onClick={() => setDateFilter(f.id)} className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
                          style={dateFilter === f.id ? { background: "var(--ag-brand)", color: "#fff" } : { background: "var(--home-card-bg)", color: "var(--home-text-muted)" }}>
                          {t(f.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--home-text-soft)" }}>{t("eventos.filters.categoryLabel")}</p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(CATEGORIES) as Category[]).map((c) => {
                        const Cat = CATEGORIES[c];
                        const on = activeCats.has(c);
                        return (
                          <button key={c} onClick={() => toggleCat(c)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                            style={on ? { background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" } : { background: "transparent", color: "var(--home-text-muted)", border: "1px solid var(--home-card-border)" }}>
                            <Cat.icon size={13} /> {t(Cat.labelKey)}
                          </button>
                        );
                      })}
                      <button onClick={() => setShowFavs((f) => !f)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                        style={showFavs ? { background: "var(--ag-danger-bg)", color: "var(--ag-danger)", border: "1px solid var(--ag-danger-border)" } : { background: "transparent", color: "var(--home-text-muted)", border: "1px solid var(--home-card-border)" }}>
                        <Heart size={13} fill={showFavs ? "currentColor" : "none"} /> {t("eventos.filters.saved")} {favs.size > 0 && `(${favs.size})`}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--home-text-soft)" }}>{t("eventos.filters.audienceLabel")}</p>
                    <div className="flex flex-wrap gap-2">
                      {AUDIENCES.map((a) => {
                        const on = activeAuds.has(a.id);
                        return (
                          <button key={a.id} onClick={() => toggleAud(a.id)} className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                            style={on ? { background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" } : { background: "transparent", color: "var(--home-text-muted)", border: "1px solid var(--home-card-border)" }}>
                            {t(a.labelKey)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  <span>{t("eventos.range.from")}</span>
                  <input
                    type="date"
                    value={range.from}
                    onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                    className="rounded-lg px-2 py-1.5"
                    style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)", color: "var(--home-text)" }}
                  />
                  <span>{t("eventos.range.to")}</span>
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

        </div>
      </div>

      {/* ── CONTENIDO ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-4 text-sm" style={{ color: "var(--home-text-soft)" }}>
          {filtered.length} {filtered.length === 1 ? t("eventos.count.one") : t("eventos.count.many")} {t("eventos.count.in")} {placeLabel}
          {usingMock && (
            <span
              className="ml-2 rounded-full px-2 py-0.5 text-[11px]"
              style={{ background: "var(--ag-warning-bg)", color: "var(--ag-warning)" }}
            >
              {t("eventos.count.mockBadge")}
            </span>
          )}
        </p>

        {filtered.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : view === "lista" ? (
          <ListView
            grouped={grouped}
            favs={favs}
            onFav={toggleFav}
            onSelect={setSelected}
            onBuy={trackClick}
            onSeeDay={(d) => { setRange({ from: d, to: d }); setDateFilter("rango"); }}
          />
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
            <h3 className="text-base font-semibold">{user ? t("eventos.band.titleHas") : t("eventos.band.titleOrg")}</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--home-text-muted)" }}>
              {user ? t("eventos.band.descHas") : t("eventos.band.descOrg")}
            </p>
          </div>
          <button
            onClick={() => setShowPublish(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--ag-brand)" }}
          >
            <Sparkles size={15} /> {user ? t("eventos.band.ctaHas") : t("eventos.band.ctaOrg")}
          </button>
        </div>
      </section>

      {/* Modal: ¿cómo quieres publicar? (web / Telegram / WhatsApp / voz) */}
      <AnimatePresence>
        {showPublish && (
          <PublishOptionsModal
            user={!!user}
            onClose={() => setShowPublish(false)}
            onWeb={goOrganizer}
          />
        )}
      </AnimatePresence>

      {/* Login de organizador (mismo patrón que el resto de la app) */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          title={t("eventos.auth.title")}
          subtitle={t("eventos.auth.subtitle")}
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
                { title: selected.title, text: `${selected.title} · ${fmtLong(selected.date, locale)} en ${selected.venue}`, url: eventUrl(selected.id) },
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

// ─── Autocompletado de ciudad (fallback si falla el GPS) ───────────────────

function CityAutocomplete({
  cities,
  onPick,
}: {
  cities: { id: string; label: string; available: boolean }[];
  onPick: (id: string) => void;
}) {
  const { t } = useLocale();
  const [q, setQ] = useState("");
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const matches = cities.filter((c) => c.id !== "todas" && c.available && norm(c.label).includes(norm(q.trim()))).slice(0, 6);
  return (
    <div className="relative mt-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("eventos.cityauto.placeholder")}
        autoFocus
        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
        style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)", color: "var(--home-text)" }}
      />
      {q.trim() && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl text-left shadow-lg" style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
          {matches.length > 0 ? (
            matches.map((c) => (
              <button key={c.id} onClick={() => onPick(c.id)} className="block w-full px-3 py-2 text-left text-sm hover:bg-ag-card" style={{ color: "var(--home-text)" }}>
                {c.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs" style={{ color: "var(--home-text-soft)" }}>{t("eventos.cityauto.empty")}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal: cómo publicar un evento (vías rápidas) ─────────────────────────

function PublishOptionsModal({
  user,
  onClose,
  onWeb,
}: {
  user: boolean;
  onClose: () => void;
  onWeb: () => void;
}) {
  const { t } = useLocale();
  const telegramUrl = TELEGRAM_BOT ? `https://t.me/${TELEGRAM_BOT}` : "";
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,.55)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl"
        style={{ background: "var(--home-bg)", border: "1px solid var(--home-card-border)" }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 pb-2">
          <div>
            <h3 className="text-lg font-bold" style={{ color: "var(--home-text)" }}>
              {user ? t("eventos.publish.titleHas") : t("eventos.publish.titleOrg")}
            </h3>
            <p className="mt-0.5 text-sm" style={{ color: "var(--home-text-soft)" }}>
              {t("eventos.publish.subtitle")}
            </p>
          </div>
          <button onClick={onClose} aria-label={t("eventos.publish.close")} className="rounded-full p-1.5" style={{ color: "var(--home-text-soft)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2.5 p-5 pt-3">
          {/* 1) Web — asistente */}
          <button
            onClick={onWeb}
            className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-colors"
            style={{ background: "var(--home-card-bg)", border: "1px solid var(--ag-brand-border)" }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "var(--ag-brand)" }}>
              <Wand2 size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-semibold" style={{ color: "var(--home-text)" }}>
                {t("eventos.publish.web.title")}
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: "var(--ag-brand)" }}>{t("eventos.publish.web.fast")}</span>
              </span>
              <span className="block text-xs" style={{ color: "var(--home-text-soft)" }}>
                {user ? t("eventos.publish.web.descHas") : t("eventos.publish.web.descOrg")}
              </span>
            </span>
            <ChevronRight size={18} style={{ color: "var(--home-text-soft)" }} />
          </button>

          {/* 2) Telegram — bot, sin cuenta */}
          {telegramUrl ? (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-colors"
              style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "#229ED9" }}>
                <Send size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold" style={{ color: "var(--home-text)" }}>
                  {t("eventos.publish.telegram.title")}
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--home-bg-soft)", color: "var(--home-text-soft)" }}>{t("eventos.publish.telegram.noAccount")}</span>
                </span>
                <span className="block text-xs" style={{ color: "var(--home-text-soft)" }}>
                  {t("eventos.publish.telegram.desc")}
                </span>
              </span>
              <ExternalLink size={16} style={{ color: "var(--home-text-soft)" }} />
            </a>
          ) : (
            <SoonRow icon={<Send size={18} />} color="#229ED9" title={t("eventos.publish.telegram.title")} desc={t("eventos.publish.telegram.soonDesc")} />
          )}

          {/* 3) WhatsApp — próximamente */}
          <SoonRow icon={<MessageCircle size={18} />} color="#25D366" title={t("eventos.publish.whatsapp.title")} desc={t("eventos.publish.whatsapp.desc")} />

          {/* 4) Voz / audio — próximamente */}
          <SoonRow icon={<Mic size={18} />} color="#7E2BFF" title={t("eventos.publish.voice.title")} desc={t("eventos.publish.voice.desc")} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function SoonRow({ icon, color, title, desc }: { icon: ReactNode; color: string; title: string; desc: string }) {
  const { t } = useLocale();
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl p-3.5 text-left opacity-55" style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: color }}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-semibold" style={{ color: "var(--home-text)" }}>
          {title}
          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--home-bg-soft)", color: "var(--home-text-soft)" }}>{t("eventos.publish.soonBadge")}</span>
        </span>
        <span className="block text-xs" style={{ color: "var(--home-text-soft)" }}>{desc}</span>
      </span>
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
        className="flex h-12 w-full items-center justify-between gap-2 rounded-xl px-4 text-sm font-medium text-white sm:w-auto sm:min-w-[160px]"
        style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.14)", backdropFilter: "blur(8px)" }}
      >
        <span className="flex items-center gap-2 truncate">{icon}<span className="truncate">{label}</span></span>
        <ChevronDown size={15} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "rgba(255,255,255,.6)" }} />
      </button>
      {/* div plano (sin animación de opacidad): una animación de entrada de
          framer se quedaba atascada a media opacidad y el menú salía
          semitransparente. El menú crítico debe verse al 100% siempre. */}
      {open && (
        <div
          className="absolute z-40 mt-2 max-h-72 w-full min-w-[220px] overflow-y-auto rounded-xl shadow-lg"
          style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}
        >
          {children}
        </div>
      )}
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
  onBuy,
  onSeeDay,
}: {
  grouped: [string, EventItem[]][];
  favs: Set<string>;
  onFav: (id: string) => void;
  onSelect: (e: EventItem) => void;
  onBuy: (id: string) => void;
  onSeeDay: (date: string) => void;
}) {
  const { t, locale } = useLocale();
  return (
    <div className="space-y-8">
      {grouped.map(([date, items]) => (
        <div key={date}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold capitalize">
              <CalendarIcon size={15} style={{ color: "var(--ag-brand)" }} />
              {date === TODAY ? t("eventos.list.today") : ""}
              {fmtLong(date, locale)}
            </h3>
            {items.length > 3 && (
              <button onClick={() => onSeeDay(date)} className="flex items-center gap-0.5 text-xs font-medium" style={{ color: "var(--ag-brand)" }}>
                {t("eventos.list.seeAll")} <ChevronRight size={13} />
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => (
              <EventCard key={e.id} event={e} isFav={favs.has(e.id)} onFav={() => onFav(e.id)} onClick={() => onSelect(e)} onBuy={() => onBuy(e.id)} />
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
  onBuy,
}: {
  event: EventItem;
  isFav: boolean;
  onFav: () => void;
  onClick: () => void;
  onBuy: () => void;
}) {
  const { t } = useLocale();
  const Cat = CATEGORIES[event.category];
  const canBuy = (event.hasSale ?? !!event.url) && !!event.url;
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl"
      style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}
    >
      {/* Imagen */}
      <button onClick={onClick} className="relative block h-44 w-full" style={{ background: event.image }} aria-label={event.title}>
        {event.cancelled && <CancelledSeal />}
        {/* Sin flyer: placeholder diseñado (icono grande) en vez de gradiente vacío. */}
        {!event.flyerUrl && !event.cancelled && (
          <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white">
            <Cat.icon size={42} strokeWidth={1.5} className="opacity-90 drop-shadow" />
            <span className="text-[11px] font-semibold uppercase tracking-widest opacity-80">{t(Cat.labelKey)}</span>
          </span>
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
          <Cat.icon size={11} /> {t(Cat.labelKey)}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-900">
          {event.price == null ? t("eventos.card.consult") : event.price === 0 ? t("eventos.card.free") : `${event.priceInfo ? t("eventos.card.priceFrom") : ""}${event.price} €`}
        </span>
      </button>
      {/* Guardar (no dispara el click de la card) */}
      <button
        onClick={onFav}
        aria-label={isFav ? t("eventos.card.removeFav") : t("eventos.card.addFav")}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-transform hover:scale-110"
      >
        <Heart size={16} fill={isFav ? "#f87171" : "none"} stroke={isFav ? "#f87171" : "currentColor"} />
      </button>
      {/* Cuerpo */}
      <div className="flex flex-1 flex-col p-4">
        <button onClick={onClick} className="text-left">
          <h4 className="line-clamp-2 text-base font-bold leading-snug">{event.title}</h4>
          <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--home-text-muted)" }}>
            <p className="flex items-center gap-1.5"><Clock size={12} /> {event.time}</p>
            <p className="flex items-center gap-1.5"><MapPin size={12} /> {event.venue}{event.neighborhood ? ` · ${event.neighborhood}` : ""}</p>
          </div>
        </button>
        {/* CTA */}
        <div className="mt-3">
          {event.cancelled ? (
            <div className="rounded-xl py-2.5 text-center text-sm font-semibold" style={{ background: "var(--ag-danger-bg)", color: "var(--ag-danger)" }}>
              {t("eventos.card.cancelled")}
            </div>
          ) : canBuy ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onBuy}
              className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: "var(--ag-brand)" }}
            >
              <Ticket size={15} /> {t("eventos.card.tickets")}
            </a>
          ) : (
            <button
              onClick={onClick}
              className="flex w-full items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-semibold"
              style={{ border: "1px solid var(--ag-brand-border)", color: "var(--ag-brand)" }}
            >
              {t("eventos.card.seeEvent")} <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>
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
  const { t, locale } = useLocale();
  // `month` es un índice ABSOLUTO (año*12 + mes 0-11) para que el calendario
  // distinga años: antes comparaba solo el mes y un evento de junio de 2027 se
  // colaba en junio de 2026.
  const year = Math.floor(month / 12);
  const mIdx = ((month % 12) + 12) % 12; // mes 0-11
  const firstDay = (new Date(year, mIdx, 1).getDay() + 6) % 7; // 0 = lunes
  const daysInMonth = new Date(year, mIdx + 1, 0).getDate();

  const byDay = useMemo(() => {
    const map = new Map<number, EventItem[]>();
    for (const e of events) {
      const d = parse(e.date);
      if (d.getFullYear() !== year || d.getMonth() !== mIdx) continue;
      const day = d.getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return map;
  }, [events, year, mIdx]);

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const td = parse(TODAY);
  const todayDay = td.getFullYear() === year && td.getMonth() === mIdx ? td.getDate() : -1;
  const todayAbs = td.getFullYear() * 12 + td.getMonth();

  // Leyenda: categorías presentes en el mes (lo estándar es colorear por tipo).
  const legendCats = useMemo(() => {
    const set = new Set<Category>();
    for (const e of events) {
      const d = parse(e.date);
      if (d.getFullYear() === year && d.getMonth() === mIdx) set.add(e.category);
    }
    return (Object.keys(CATEGORIES) as Category[]).filter((c) => set.has(c));
  }, [events, year, mIdx]);

  return (
    <div className="rounded-2xl p-3 sm:p-5" style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => onMonth(month - 1)} disabled={month <= todayAbs} className="rounded-lg p-2 hover:bg-ag-card disabled:opacity-30">
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-base font-semibold capitalize">{monthYear(mIdx, year, locale)}</h3>
        <button onClick={() => onMonth(month + 1)} disabled={month >= todayAbs + 24} className="rounded-lg p-2 hover:bg-ag-card disabled:opacity-30">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Leyenda de colores por categoría (arriba, como referencia rápida) */}
      {legendCats.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {legendCats.map((c) => {
            const Cat = CATEGORIES[c];
            return (
              <span key={c} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--home-text-muted)" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: Cat.grad }} />
                {t(Cat.labelKey)}
              </span>
            );
          })}
        </div>
      )}

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium" style={{ color: "var(--home-text-soft)" }}>
        {weekdayInitials(locale).map((d, i) => <div key={i}>{d}</div>)}
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
              <div className="flex items-center justify-between">
                {/* Hoy: número en círculo relleno (énfasis). Resto: número normal. */}
                {isToday ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "var(--ag-brand)" }}>{day}</span>
                ) : (
                  <span className="text-[11px] font-semibold" style={{ color: "var(--home-text-muted)" }}>{day}</span>
                )}
                {/* Insignia con el nº de eventos del día */}
                {dayEvents.length > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold" style={{ background: "var(--ag-brand-bg)", color: "var(--ag-brand)" }}>
                    {dayEvents.length}
                  </span>
                )}
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onSelect(e)}
                    className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] font-medium text-white"
                    style={{ background: CATEGORIES[e.category].grad }}
                    title={e.title}
                  >
                    <span className="truncate">{e.time} {e.title}</span>
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <span className="block px-1 text-[10px]" style={{ color: "var(--home-text-soft)" }}>{t("eventos.cal.more").replace("{n}", String(dayEvents.length - 2))}</span>
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
  const { t, locale } = useLocale();
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
            <Cat.icon size={13} /> {t(Cat.labelKey)}
          </span>
          {event.flyerUrl && (
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              <Maximize2 size={12} /> {t("eventos.modal.seeFlyer")}
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-xl font-bold">{event.title}</h3>
          <div className="mt-3 space-y-2 text-sm" style={{ color: "var(--home-text-muted)" }}>
            <p className="flex items-center gap-2"><CalendarIcon size={15} style={{ color: "var(--ag-brand)" }} /> <span className="capitalize">{fmtLong(event.date, locale)}</span></p>
            <p className="flex items-center gap-2"><Clock size={15} style={{ color: "var(--ag-brand)" }} /> {event.time} {t("eventos.modal.timeSuffix")}</p>
            <p className="flex items-center gap-2"><MapPin size={15} style={{ color: "var(--ag-brand)" }} /> {event.venue}{event.neighborhood ? ` · ${event.neighborhood}` : ""}</p>
            <p className="flex items-center gap-2"><Ticket size={15} style={{ color: "var(--ag-brand)" }} /> {event.priceInfo ? event.priceInfo : event.price == null ? t("eventos.modal.priceTbc") : event.price === 0 ? t("eventos.modal.priceFree") : `${event.price} €`}</p>
          </div>

          {/* Acciones secundarias: guardar + compartir */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={onFav}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium"
              style={isFav ? { background: "var(--ag-danger-bg)", color: "var(--ag-danger)" } : { background: "var(--home-card-bg)", color: "var(--home-text)" }}
            >
              <Heart size={15} fill={isFav ? "currentColor" : "none"} /> {isFav ? t("eventos.modal.saved") : t("eventos.modal.save")}
            </button>
            <button
              onClick={onShare}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: "var(--home-card-bg)", color: "var(--home-text)" }}
            >
              <Share2 size={15} /> {copied ? t("eventos.modal.copied") : t("eventos.modal.share")}
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
              {t("eventos.modal.buyOnline")} <ExternalLink size={15} />
            </a>
          ) : event.price === 0 ? (
            <div className="mt-2 rounded-xl py-3 text-center text-sm font-medium" style={{ background: "var(--ag-success-bg)", color: "var(--ag-success)" }}>
              {t("eventos.modal.freeEntry")}
            </div>
          ) : (
            <div className="mt-2 rounded-xl py-3 text-center text-sm font-medium" style={{ background: "var(--ag-info-bg)", color: "var(--ag-info)" }}>
              {event.price == null ? t("eventos.modal.consultOrganizer") : t("eventos.modal.boxOffice")}
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
  const { t } = useLocale();
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
        aria-label={t("eventos.lightbox.close")}
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
  const { t } = useLocale();
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <span
        className={`-rotate-12 rounded-md border-2 font-extrabold uppercase tracking-widest ${big ? "px-5 py-2 text-2xl" : "px-3 py-1 text-sm"}`}
        style={{ color: "#fff", borderColor: "#fff", background: "rgba(220,38,38,0.85)" }}
      >
        {t("eventos.seal.cancelled")}
      </span>
    </div>
  );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center" style={{ background: "var(--home-bg-soft)", border: "1px dashed var(--home-card-border)" }}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--ag-brand-bg)" }}>
        <Search size={24} style={{ color: "var(--ag-brand)" }} />
      </div>
      <h3 className="text-lg font-semibold">{t("eventos.empty.title")}</h3>
      <p className="mt-1 max-w-xs text-sm" style={{ color: "var(--home-text-muted)" }}>{t("eventos.empty.body")}</p>
      <button onClick={onReset} className="mt-4 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--ag-brand)" }}>
        {t("eventos.empty.reset")}
      </button>
    </div>
  );
}
