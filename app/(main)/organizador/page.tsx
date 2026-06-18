"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  CalendarDays,
  MapPin,
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  Ticket,
  Ban,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase, type EventRow, type EventCategory, type EventAudience } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";
import { seriesKeyFromTitle } from "@/lib/eventSeries";
import AuthModal from "@/components/auth/AuthModal";

/**
 * /organizador — Panel del organizador (auth-gated).
 *
 * Es el destino de "Publicar mi evento" desde la agenda pública /eventos.
 * Aquí el organizador autenticado:
 *   - Ve sus eventos (borradores + publicados).
 *   - Crea / edita / borra eventos.
 *   - Publica o despublica (controla la visibilidad pública).
 *   - Crea el flyer del evento en /create si no tiene imagen.
 *
 * Todo va contra la tabla `events` con RLS (cada quien solo toca lo suyo).
 */

const CATEGORIES: { id: EventCategory; label: string }[] = [
  { id: "fiesta", label: "Fiesta" },
  { id: "conciertos", label: "Conciertos" },
  { id: "festival", label: "Festival" },
  { id: "clases", label: "Clases de baile" },
  { id: "club", label: "Club / Discoteca" },
  { id: "corporativo", label: "Corporativo" },
  { id: "social", label: "Bailes sociales" },
];

const AUDIENCES: { id: EventAudience; label: string }[] = [
  { id: "academias", label: "Academias" },
  { id: "productoras", label: "Productoras" },
  { id: "freelance", label: "Freelance" },
  { id: "instituciones", label: "Instituciones" },
  { id: "agencias", label: "Agencias" },
  { id: "colegios", label: "Colegios" },
];

const CITIES = [
  { id: "madrid", label: "Madrid" },
  { id: "barcelona", label: "Barcelona" },
  { id: "valencia", label: "Valencia" },
  { id: "sevilla", label: "Sevilla" },
];

type FormState = {
  title: string;
  event_date: string;
  event_time: string;
  city: string;
  venue: string;
  neighborhood: string;
  category: EventCategory;
  audience: EventAudience[];
  price: string;
  price_info: string;
  has_online_sale: boolean;
  ticket_url: string;
  image_url: string;
  image_key: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  event_date: "",
  event_time: "20:00",
  city: "madrid",
  venue: "",
  neighborhood: "",
  category: "fiesta",
  audience: [],
  price: "",
  price_info: "",
  has_online_sale: false,
  ticket_url: "",
  image_url: "",
  image_key: "",
  description: "",
};

export default function OrganizadorPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventRow | "new" | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const admin = isAdmin(user?.email);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Admin ve TODOS los eventos (incluidos los del bot sin dueño) para poder
    // gestionarlos; el resto solo los suyos.
    let q = supabase.from("events").select("*").order("event_date", { ascending: true });
    if (!isAdmin(user.email)) q = q.eq("organizer_id", user.id);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setEvents((data as EventRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) load();
  }, [user, load]);

  // ?claim=<token>: eventos enviados por bot sin cuenta. Si hay sesión, los
  // reclama; si no, abre el login (al volver, este efecto reintenta).
  useEffect(() => {
    const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("claim") : null;
    if (!token) return;
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!authLoading) setShowAuth(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/events/claim", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (res.ok && json.claimed > 0) {
          setClaimMsg(`✅ Has reclamado ${json.claimed} ${json.claimed === 1 ? "evento" : "eventos"} enviados por el bot.`);
          load();
        }
      } catch {}
      window.history.replaceState({}, "", "/organizador");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const setStatus = async (ev: EventRow, next: EventRow["status"]) => {
    setEvents((list) => list.map((e) => (e.id === ev.id ? { ...e, status: next } : e)));
    const { error } = await supabase.from("events").update({ status: next }).eq("id", ev.id);
    if (error) {
      setError(error.message);
      load(); // revertir al estado real
    }
  };

  // Ojo: publica/despublica (draft ↔ published). Desde cancelado, reactiva.
  const togglePublish = (ev: EventRow) => setStatus(ev, ev.status === "published" ? "draft" : "published");
  // Cancela / reactiva — el evento cancelado sigue visible con sello CANCELADO.
  const toggleCancel = (ev: EventRow) => setStatus(ev, ev.status === "cancelled" ? "published" : "cancelled");

  const remove = async (ev: EventRow) => {
    if (!confirm(`¿Borrar "${ev.title}"? Esta acción no se puede deshacer.`)) return;
    setEvents((list) => list.filter((e) => e.id !== ev.id));
    const { error } = await supabase.from("events").delete().eq("id", ev.id);
    if (error) {
      setError(error.message);
      load();
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);
  // Publicados se parten en Próximos (futuros) y Vencidos (ya pasaron).
  const upcoming = useMemo(() => events.filter((e) => e.status === "published" && e.event_date >= todayIso), [events, todayIso]);
  const past = useMemo(() => events.filter((e) => e.status === "published" && e.event_date < todayIso), [events, todayIso]);
  const drafts = useMemo(() => events.filter((e) => e.status === "draft"), [events]);
  const cancelled = useMemo(() => events.filter((e) => e.status === "cancelled"), [events]);

  // Conteo por serie: cuántas fechas tiene cada serie (para agrupar/etiquetar).
  const seriesCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events) if (e.series_key) m.set(e.series_key, (m.get(e.series_key) ?? 0) + 1);
    return m;
  }, [events]);
  const seriesCountOf = (e: EventRow) => (e.series_key ? seriesCounts.get(e.series_key) ?? 1 : 1);

  // claim token presente → tras login, volver a /organizador?claim=… (OAuth).
  const claimToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("claim") : null;
  const authNext = claimToken ? `/organizador?claim=${claimToken}` : "/organizador";

  // ── Gate de sesión ──
  if (!authLoading && !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center" style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" }}>
          <Lock size={28} strokeWidth={1.8} />
        </div>
        <h2 className="mb-2 text-2xl font-black">{claimToken ? "Inicia sesión para reclamar tus eventos" : "Inicia sesión para publicar eventos"}</h2>
        <p className="mb-6 max-w-md" style={{ color: "var(--home-text-muted)" }}>
          {claimToken
            ? "Los flyers que enviaste por el bot ya están publicados. Abre tu cuenta para gestionarlos."
            : "Crea tu cuenta de organizador para añadir eventos a la agenda y diseñar sus flyers."}
        </p>
        <button onClick={() => setShowAuth(true)} className="rounded-xl px-6 py-3 font-bold text-white" style={{ background: "var(--ag-brand)" }}>
          Iniciar sesión
        </button>
        <Link href="/eventos" className="mt-3 text-sm underline" style={{ color: "var(--home-text-soft)" }}>
          ← Volver a la agenda
        </Link>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            title={claimToken ? "Reclama tus eventos" : "Publica tu evento"}
            subtitle="Crea tu cuenta de organizador. Es gratis para empezar."
            nextUrl={authNext}
          />
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/eventos" className="text-xs underline" style={{ color: "var(--home-text-soft)" }}>
              ← Agenda pública
            </Link>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-black sm:text-3xl">
              {admin ? "Todos los eventos" : "Mis eventos"}
              {admin && (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase" style={{ background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" }}>
                  Admin
                </span>
              )}
            </h1>
            <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
              {admin ? "Gestiona cualquier evento (incluidos los del bot sin dueño)." : "Publica eventos en la agenda y diseña sus flyers."}
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--ag-brand)" }}
          >
            <Plus size={16} /> Nuevo evento
          </button>
        </div>

        {claimMsg && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--ag-success-bg)", color: "var(--ag-success)", border: "1px solid var(--ag-success-border)" }}>
            {claimMsg}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: "var(--ag-danger-bg)", color: "var(--ag-danger)", border: "1px solid var(--ag-danger-border)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-16 text-sm" style={{ color: "var(--home-text-soft)" }}>
            <Loader2 size={16} className="animate-spin" /> Cargando tus eventos…
          </div>
        ) : events.length === 0 ? (
          <EmptyState onCreate={() => setEditing("new")} />
        ) : (
          <div className="space-y-8">
            {drafts.length > 0 && (
              <Section title="Borradores" hint="Solo tú los ves. Publícalos para que aparezcan en la agenda.">
                {drafts.map((e) => (
                  <EventRowCard key={e.id} ev={e} onEdit={() => setEditing(e)} onDelete={() => remove(e)} onToggle={() => togglePublish(e)} onCancel={() => toggleCancel(e)} seriesCount={seriesCountOf(e)} />
                ))}
              </Section>
            )}
            <Section title={`Próximos (${upcoming.length})`} hint="Publicados y aún por celebrarse — visibles en la agenda.">
              {upcoming.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--home-text-soft)" }}>No tienes eventos próximos. Pulsa “Nuevo evento” o envía un flyer al bot.</p>
              ) : (
                upcoming.map((e) => (
                  <EventRowCard key={e.id} ev={e} onEdit={() => setEditing(e)} onDelete={() => remove(e)} onToggle={() => togglePublish(e)} onCancel={() => toggleCancel(e)} seriesCount={seriesCountOf(e)} />
                ))
              )}
            </Section>
            {past.length > 0 && (
              <Section title={`Vencidos (${past.length})`} hint="Ya pasaron. No aparecen en la agenda pública.">
                {past.map((e) => (
                  <EventRowCard key={e.id} ev={e} onEdit={() => setEditing(e)} onDelete={() => remove(e)} onToggle={() => togglePublish(e)} onCancel={() => toggleCancel(e)} seriesCount={seriesCountOf(e)} />
                ))}
              </Section>
            )}
            {cancelled.length > 0 && (
              <Section title={`Cancelados (${cancelled.length})`} hint="Siguen visibles en la agenda con el sello CANCELADO. Puedes reactivarlos.">
                {cancelled.map((e) => (
                  <EventRowCard key={e.id} ev={e} onEdit={() => setEditing(e)} onDelete={() => remove(e)} onToggle={() => togglePublish(e)} onCancel={() => toggleCancel(e)} seriesCount={seriesCountOf(e)} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && user && (
          <EventForm
            initial={editing === "new" ? null : editing}
            userId={user.id}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── Sección ─────────────────────────────────────────────────────────────

function Section({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mb-3 text-xs" style={{ color: "var(--home-text-soft)" }}>{hint}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ─── Fila de evento ─────────────────────────────────────────────────────

function EventRowCard({
  ev,
  onEdit,
  onDelete,
  onToggle,
  onCancel,
  seriesCount = 1,
}: {
  ev: EventRow;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onCancel: () => void;
  seriesCount?: number;
}) {
  const isPub = ev.status === "published";
  const isCancelled = ev.status === "cancelled";
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
      <div
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
        style={{ background: ev.image_url ? `url('${ev.image_url}') center/cover no-repeat` : "var(--ag-brand-bg)" }}
      >
        {isCancelled && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold uppercase text-white" style={{ background: "rgba(220,38,38,0.75)" }}>Cancel.</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${isCancelled ? "line-through opacity-70" : ""}`}>{ev.title}</p>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: "var(--home-text-muted)" }}>
          <span className="flex items-center gap-1"><CalendarDays size={12} /> {ev.event_date} · {ev.event_time}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {ev.venue}</span>
          <span>{ev.price == null ? "Consultar" : ev.price === 0 ? "Gratis" : `${ev.price} €`}</span>
          {seriesCount > 1 && (
            <span style={{ color: "var(--ag-brand)" }}>🔁 serie · {seriesCount} fechas</span>
          )}
          {ev.source !== "organizer" && (
            <span style={{ color: "var(--ag-brand)" }}>📩 {ev.submitter_name || "anónimo"}{ev.submitter_email ? ` · ${ev.submitter_email}` : ""} · {ev.source}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!isCancelled && (
          <button onClick={onToggle} title={isPub ? "Despublicar" : "Publicar"} className="rounded-lg p-2 hover:bg-ag-card" style={{ color: isPub ? "var(--ag-success)" : "var(--home-text-soft)" }}>
            {isPub ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}
        <button onClick={onCancel} title={isCancelled ? "Reactivar evento" : "Marcar cancelado"} className="rounded-lg p-2 hover:bg-ag-card" style={{ color: isCancelled ? "var(--ag-success)" : "var(--ag-warning)" }}>
          {isCancelled ? <RotateCcw size={16} /> : <Ban size={16} />}
        </button>
        <button onClick={onEdit} title="Editar" className="rounded-lg p-2 hover:bg-ag-card" style={{ color: "var(--home-text-muted)" }}>
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} title="Borrar" className="rounded-lg p-2 hover:bg-ag-card" style={{ color: "var(--ag-danger)" }}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Formulario crear / editar ─────────────────────────────────────────────

function EventForm({
  initial,
  userId,
  onClose,
  onSaved,
}: {
  initial: EventRow | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          title: initial.title,
          event_date: initial.event_date,
          event_time: (initial.event_time || "20:00").slice(0, 5),
          city: initial.city,
          venue: initial.venue,
          neighborhood: initial.neighborhood ?? "",
          category: initial.category,
          audience: initial.audience ?? [],
          price: initial.price == null ? "" : String(initial.price),
          price_info: initial.price_info ?? "",
          has_online_sale: initial.has_online_sale ?? false,
          ticket_url: initial.ticket_url ?? "",
          image_url: initial.image_url ?? "",
          image_key: initial.image_key ?? "",
          description: initial.description ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const toggleAudience = (a: EventAudience) =>
    setForm((f) => ({
      ...f,
      audience: f.audience.includes(a) ? f.audience.filter((x) => x !== a) : [...f.audience, a],
    }));

  // Sube el flyer a R2 y, en paralelo, lo lee con visión para autocompletar
  // los campos vacíos ("sube el flyer y se rellena solo"). El autofill no pisa
  // lo que el usuario ya haya escrito.
  const onPickFlyer = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const up = new FormData();
      up.append("file", file);
      const ex = new FormData();
      ex.append("file", file);
      const [uploadRes, extractRes] = await Promise.all([
        fetch("/api/events/upload-flyer", { method: "POST", body: up }),
        fetch("/api/events/from-flyer", { method: "POST", body: ex }),
      ]);
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || "No se pudo subir el flyer");

      const d = extractRes.ok ? (await extractRes.json()).data : null;
      setForm((f) => ({
        ...f,
        image_url: uploadJson.url,
        image_key: uploadJson.key,
        // Autofill solo de campos aún vacíos / por defecto.
        title: f.title || (d?.title ?? ""),
        event_date: f.event_date || (d?.event_date ?? ""),
        event_time: d?.event_time && f.event_time === "20:00" ? d.event_time : f.event_time,
        city: d?.city && f.city === "madrid" ? d.city : f.city,
        venue: f.venue || (d?.venue ?? ""),
        neighborhood: f.neighborhood || (d?.neighborhood ?? ""),
        category: d?.category && f.category === "fiesta" ? d.category : f.category,
        price: f.price === "" && d?.price != null ? String(d.price) : f.price,
        price_info: f.price_info || (d?.price_info ?? ""),
        has_online_sale: f.has_online_sale || Boolean(d?.has_online_sale),
        ticket_url: f.ticket_url || (d?.ticket_url ?? ""),
        description: f.description || (d?.description ?? ""),
      }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al subir el flyer");
    } finally {
      setUploading(false);
    }
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title.trim() || !form.event_date || !form.venue.trim()) {
      setErr("Rellena al menos título, fecha y lugar.");
      return;
    }
    setSaving(true);
    setErr(null);
    const payload = {
      organizer_id: userId,
      title: form.title.trim(),
      series_key: seriesKeyFromTitle(form.title),
      description: form.description.trim() || null,
      event_date: form.event_date,
      event_time: form.event_time || "20:00",
      country: "es",
      city: form.city,
      venue: form.venue.trim(),
      neighborhood: form.neighborhood.trim() || null,
      category: form.category,
      audience: form.audience,
      // vacío = precio no indicado (null → "Consultar"); 0 = gratis.
      price: form.price.trim() === "" ? null : Number(form.price) || 0,
      price_info: form.price_info.trim() || null,
      has_online_sale: form.has_online_sale,
      // Solo guardamos el link de compra si marcó venta online.
      ticket_url: form.has_online_sale ? form.ticket_url.trim() || null : null,
      image_url: form.image_url.trim() || null,
      image_key: form.image_key.trim() || null,
      status,
    };
    const res = initial
      ? await supabase.from("events").update(payload).eq("id", initial.id)
      : await supabase.from("events").insert(payload);
    setSaving(false);
    if (res.error) setErr(res.error.message);
    else onSaved();
  };

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
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl"
        style={{ background: "var(--home-bg-soft)", color: "var(--home-text)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{initial ? "Editar evento" : "Nuevo evento"}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-ag-card"><X size={18} /></button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--ag-danger-bg)", color: "var(--ag-danger)" }}>{err}</div>
        )}

        <div className="space-y-3">
          <Field label="Título *">
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="ag-input" placeholder="Ej. Concierto de verano" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha *">
              <input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className="ag-input" />
            </Field>
            <Field label="Hora">
              <input type="time" value={form.event_time} onChange={(e) => set("event_time", e.target.value)} className="ag-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad">
              <select value={form.city} onChange={(e) => set("city", e.target.value)} className="ag-input">
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Categoría">
              <select value={form.category} onChange={(e) => set("category", e.target.value as EventCategory)} className="ag-input">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Para quién es (opcional)">
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((a) => {
                const on = form.audience.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAudience(a.id)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                    style={on ? { background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" } : { background: "transparent", color: "var(--home-text-muted)", border: "1px solid var(--home-card-border)" }}
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Lugar / sala *">
              <input value={form.venue} onChange={(e) => set("venue", e.target.value)} className="ag-input" placeholder="Ej. Sala La Riviera" />
            </Field>
            <Field label="Barrio / zona">
              <input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} className="ag-input" placeholder="Ej. Centro" />
            </Field>
          </div>

          {/* Flyer del evento: se sube a R2 y se refleja en la agenda. */}
          <Field label="Flyer del evento">
            <div className="flex items-center gap-3">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                style={{
                  background: form.image_url ? `url('${form.image_url}') center/cover no-repeat` : "var(--home-bg)",
                  border: "1px solid var(--home-card-border)",
                }}
              >
                {!form.image_url && <ImageIcon size={22} style={{ color: "var(--home-text-soft)" }} />}
              </div>
              <div className="flex-1 space-y-2">
                <label
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold"
                  style={{ border: "1px solid var(--ag-brand-border)", color: "var(--ag-brand)" }}
                >
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  {uploading ? "Subiendo…" : form.image_url ? "Cambiar flyer" : "Subir flyer"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => onPickFlyer(e.target.files?.[0])}
                  />
                </label>
                <Link
                  href="/templates"
                  target="_blank"
                  className="flex items-center justify-center gap-1 text-xs font-medium"
                  style={{ color: "var(--home-text-muted)" }}
                >
                  <Sparkles size={12} /> ¿No tienes flyer? Créalo aquí <ExternalLink size={10} />
                </Link>
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio (€) — vacío = consultar · 0 = gratis">
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className="ag-input" placeholder="desde…" />
            </Field>
            <Field label="Tarifas (si hay varias)">
              <input value={form.price_info} onChange={(e) => set("price_info", e.target.value)} className="ag-input" placeholder="Anticipada 12€ · Taquilla 15€" />
            </Field>
          </div>

          {/* Venta online: si está activa, pedimos la página del evento / pago
              y la agenda muestra el botón "Comprar entradas online". */}
          <div className="rounded-xl p-3" style={{ background: "var(--home-bg)", border: "1px solid var(--home-card-border)" }}>
            <button
              type="button"
              onClick={() => set("has_online_sale", !form.has_online_sale)}
              className="flex w-full items-center justify-between"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Ticket size={15} style={{ color: "var(--ag-brand)" }} /> ¿Venta de entradas online?
              </span>
              <span
                className="relative h-6 w-11 rounded-full transition-colors"
                style={{ background: form.has_online_sale ? "var(--ag-brand)" : "var(--home-card-border)" }}
              >
                <span
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                  style={{ transform: form.has_online_sale ? "translateX(22px)" : "translateX(2px)" }}
                />
              </span>
            </button>
            {form.has_online_sale && (
              <input
                value={form.ticket_url}
                onChange={(e) => set("ticket_url", e.target.value)}
                className="ag-input mt-3"
                placeholder="https://… página del evento o pago"
              />
            )}
          </div>

          <Field label="Descripción">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="ag-input resize-none" placeholder="Detalles del evento…" />
          </Field>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            disabled={saving}
            onClick={() => save("draft")}
            className="flex-1 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--home-card-bg)", color: "var(--home-text)" }}
          >
            Guardar borrador
          </button>
          <button
            disabled={saving}
            onClick={() => save("published")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--ag-brand)" }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} Publicar
          </button>
        </div>
      </motion.div>

      {/* estilos de inputs (locales a este modal) */}
      <style jsx global>{`
        .ag-input {
          width: 100%;
          border-radius: 0.6rem;
          padding: 0.55rem 0.7rem;
          font-size: 0.875rem;
          background: var(--home-bg);
          border: 1px solid var(--home-card-border);
          color: var(--home-text);
          outline: none;
        }
        .ag-input:focus {
          border-color: var(--ag-brand);
        }
      `}</style>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium" style={{ color: "var(--home-text-muted)" }}>{label}</span>
      {children}
    </label>
  );
}

// ─── Estado vacío ─────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center" style={{ background: "var(--home-bg-soft)", border: "1px dashed var(--home-card-border)" }}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--ag-brand-bg)" }}>
        <CalendarDays size={24} style={{ color: "var(--ag-brand)" }} />
      </div>
      <h3 className="text-lg font-semibold">Aún no tienes eventos</h3>
      <p className="mt-1 max-w-xs text-sm" style={{ color: "var(--home-text-muted)" }}>
        Crea tu primer evento y publícalo en la agenda pública en menos de un minuto.
      </p>
      <button onClick={onCreate} className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--ag-brand)" }}>
        <Plus size={16} /> Crear evento
      </button>
    </div>
  );
}
