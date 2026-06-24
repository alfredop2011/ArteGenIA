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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocale } from "@/hooks/useLocale";
import type { TranslationKey } from "@/lib/translations";
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

const CATEGORIES: { id: EventCategory; labelKey: TranslationKey }[] = [
  { id: "fiesta", labelKey: "org.cat.fiesta" },
  { id: "conciertos", labelKey: "org.cat.conciertos" },
  { id: "festival", labelKey: "org.cat.festival" },
  { id: "clases", labelKey: "org.cat.clases" },
  { id: "club", labelKey: "org.cat.club" },
  { id: "corporativo", labelKey: "org.cat.corporativo" },
  { id: "social", labelKey: "org.cat.social" },
  { id: "teatro", labelKey: "org.cat.teatro" },
];

const AUDIENCES: { id: EventAudience; labelKey: TranslationKey }[] = [
  { id: "academias", labelKey: "org.aud.academias" },
  { id: "productoras", labelKey: "org.aud.productoras" },
  { id: "freelance", labelKey: "org.aud.freelance" },
  { id: "instituciones", labelKey: "org.aud.instituciones" },
  { id: "agencias", labelKey: "org.aud.agencias" },
  { id: "colegios", labelKey: "org.aud.colegios" },
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
  const { t } = useLocale();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventRow | "new" | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);
  const [upPage, setUpPage] = useState(1); // paginación de "Próximos"

  const admin = isAdmin(user?.email);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    // try/finally: si la query LANZA (red/RLS) el spinner NO debe quedarse
    // colgado para siempre — siempre resolvemos `loading`.
    try {
      // Admin ve TODOS los eventos (incluidos los del bot sin dueño) para poder
      // gestionarlos; el resto solo los suyos.
      let q = supabase.from("events").select("*").order("event_date", { ascending: true });
      if (!isAdmin(user.email)) q = q.eq("organizer_id", user.id);
      const { data, error } = await q;
      if (error) setError(error.message);
      else setEvents((data as EventRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los eventos.");
    } finally {
      setLoading(false);
    }
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
          setClaimMsg(
            t("org.claim.success")
              .replace("{n}", String(json.claimed))
              .replace("{events}", json.claimed === 1 ? t("eventos.count.one") : t("eventos.count.many"))
          );
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
    if (!confirm(t("org.delete.confirm").replace("{title}", ev.title))) return;
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
  // Paginación de "Próximos" (la lista que más crece).
  const UP_PER = 20;
  const upTotal = Math.max(1, Math.ceil(upcoming.length / UP_PER));
  const upCur = Math.min(upPage, upTotal);
  const upcomingPage = upcoming.slice((upCur - 1) * UP_PER, upCur * UP_PER);

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
        <h2 className="mb-2 text-2xl font-black">{claimToken ? t("org.gate.titleClaim") : t("org.gate.titlePublish")}</h2>
        <p className="mb-6 max-w-md" style={{ color: "var(--home-text-muted)" }}>
          {claimToken ? t("org.gate.bodyClaim") : t("org.gate.bodyPublish")}
        </p>
        <button onClick={() => setShowAuth(true)} className="rounded-xl px-6 py-3 font-bold text-white" style={{ background: "var(--ag-brand)" }}>
          {t("org.gate.signIn")}
        </button>
        <Link href="/eventos" className="mt-3 text-sm underline" style={{ color: "var(--home-text-soft)" }}>
          {t("org.gate.back")}
        </Link>
        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            title={claimToken ? t("org.gate.authClaim") : t("org.gate.authPublish")}
            subtitle={t("org.auth.subtitle")}
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
              {t("org.header.backLink")}
            </Link>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-black sm:text-3xl">
              {admin ? t("org.header.titleAdmin") : t("org.header.titleMine")}
              {admin && (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold uppercase" style={{ background: "var(--ag-brand-bg)", color: "var(--ag-brand)", border: "1px solid var(--ag-brand-border)" }}>
                  {t("org.header.adminBadge")}
                </span>
              )}
            </h1>
            <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
              {admin ? t("org.header.descAdmin") : t("org.header.descMine")}
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "var(--ag-brand)" }}
          >
            <Plus size={16} /> {t("org.header.newEvent")}
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
            <Loader2 size={16} className="animate-spin" /> {t("org.loading")}
          </div>
        ) : events.length === 0 ? (
          <EmptyState onCreate={() => setEditing("new")} />
        ) : (
          <div className="space-y-8">
            {drafts.length > 0 && (
              <Section title={t("org.section.drafts")} hint={t("org.section.draftsHint")}>
                {drafts.map((e) => (
                  <EventRowCard key={e.id} ev={e} onEdit={() => setEditing(e)} onDelete={() => remove(e)} onToggle={() => togglePublish(e)} onCancel={() => toggleCancel(e)} seriesCount={seriesCountOf(e)} />
                ))}
              </Section>
            )}
            <Section title={t("org.section.upcoming").replace("{n}", String(upcoming.length))} hint={t("org.section.upcomingHint")}>
              {upcoming.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--home-text-soft)" }}>{t("org.section.upcomingEmpty")}</p>
              ) : (
                <>
                  {upcomingPage.map((e) => (
                    <EventRowCard key={e.id} ev={e} onEdit={() => setEditing(e)} onDelete={() => remove(e)} onToggle={() => togglePublish(e)} onCancel={() => toggleCancel(e)} seriesCount={seriesCountOf(e)} />
                  ))}
                  {upTotal > 1 && (
                    <div className="mt-2 flex items-center justify-center gap-3 pt-2">
                      <button onClick={() => setUpPage(Math.max(1, upCur - 1))} disabled={upCur <= 1} className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30" style={{ background: "var(--home-card-bg)", color: "var(--ag-brand)" }} aria-label="Anterior"><ChevronLeft size={18} /></button>
                      <span className="text-sm font-medium" style={{ color: "var(--home-text-soft)" }}>{upCur} / {upTotal}</span>
                      <button onClick={() => setUpPage(Math.min(upTotal, upCur + 1))} disabled={upCur >= upTotal} className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-30" style={{ background: "var(--home-card-bg)", color: "var(--ag-brand)" }} aria-label="Siguiente"><ChevronRight size={18} /></button>
                    </div>
                  )}
                </>
              )}
            </Section>
            {past.length > 0 && (
              <Section title={t("org.section.past").replace("{n}", String(past.length))} hint={t("org.section.pastHint")}>
                {past.map((e) => (
                  <EventRowCard key={e.id} ev={e} onEdit={() => setEditing(e)} onDelete={() => remove(e)} onToggle={() => togglePublish(e)} onCancel={() => toggleCancel(e)} seriesCount={seriesCountOf(e)} />
                ))}
              </Section>
            )}
            {cancelled.length > 0 && (
              <Section title={t("org.section.cancelled").replace("{n}", String(cancelled.length))} hint={t("org.section.cancelledHint")}>
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
  const { t } = useLocale();
  const isPub = ev.status === "published";
  const isCancelled = ev.status === "cancelled";
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
      <div
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"
        style={{ background: ev.image_url ? `url('${ev.image_url}') center/cover no-repeat` : "var(--ag-brand-bg)" }}
      >
        {isCancelled && <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold uppercase text-white" style={{ background: "rgba(220,38,38,0.75)" }}>{t("org.row.cancelShort")}</span>}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${isCancelled ? "line-through opacity-70" : ""}`}>{ev.title}</p>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: "var(--home-text-muted)" }}>
          <span className="flex items-center gap-1"><CalendarDays size={12} /> {ev.event_date} · {ev.event_time}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {ev.venue}</span>
          <span>{ev.price == null ? t("org.row.consult") : ev.price === 0 ? t("org.row.free") : `${ev.price} €`}</span>
          {seriesCount > 1 && (
            <span style={{ color: "var(--ag-brand)" }}>{t("org.row.series").replace("{n}", String(seriesCount))}</span>
          )}
          {ev.source !== "organizer" && (
            <span style={{ color: "var(--ag-brand)" }}>📩 {ev.submitter_name || t("org.row.anon")}{ev.submitter_email ? ` · ${ev.submitter_email}` : ""} · {ev.source}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!isCancelled && (
          <button onClick={onToggle} title={isPub ? t("org.row.unpublish") : t("org.row.publish")} className="rounded-lg p-2 hover:bg-ag-card" style={{ color: isPub ? "var(--ag-success)" : "var(--home-text-soft)" }}>
            {isPub ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        )}
        <button onClick={onCancel} title={isCancelled ? t("org.row.reactivate") : t("org.row.markCancelled")} className="rounded-lg p-2 hover:bg-ag-card" style={{ color: isCancelled ? "var(--ag-success)" : "var(--ag-warning)" }}>
          {isCancelled ? <RotateCcw size={16} /> : <Ban size={16} />}
        </button>
        <button onClick={onEdit} title={t("org.row.edit")} className="rounded-lg p-2 hover:bg-ag-card" style={{ color: "var(--home-text-muted)" }}>
          <Pencil size={16} />
        </button>
        <button onClick={onDelete} title={t("org.row.delete")} className="rounded-lg p-2 hover:bg-ag-card" style={{ color: "var(--ag-danger)" }}>
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
  const { t } = useLocale();
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
      if (!uploadRes.ok) throw new Error(uploadJson.error || t("org.form.errUpload"));

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
      setErr(e instanceof Error ? e.message : t("org.form.errUploadGeneric"));
    } finally {
      setUploading(false);
    }
  };

  const save = async (status: "draft" | "published") => {
    if (!form.title.trim() || !form.event_date || !form.venue.trim()) {
      setErr(t("org.form.errRequired"));
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
          <h3 className="text-lg font-bold">{initial ? t("org.form.titleEdit") : t("org.form.titleNew")}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-ag-card"><X size={18} /></button>
        </div>

        {err && (
          <div className="mb-3 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--ag-danger-bg)", color: "var(--ag-danger)" }}>{err}</div>
        )}

        <div className="space-y-3">
          <Field label={t("org.form.labelTitle")}>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="ag-input" placeholder={t("org.form.phTitle")} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("org.form.labelDate")}>
              <input type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} className="ag-input" />
            </Field>
            <Field label={t("org.form.labelTime")}>
              <input type="time" value={form.event_time} onChange={(e) => set("event_time", e.target.value)} className="ag-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("org.form.labelCity")}>
              <select value={form.city} onChange={(e) => set("city", e.target.value)} className="ag-input">
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </Field>
            <Field label={t("org.form.labelCategory")}>
              <select value={form.category} onChange={(e) => set("category", e.target.value as EventCategory)} className="ag-input">
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{t(c.labelKey)}</option>)}
              </select>
            </Field>
          </div>

          <Field label={t("org.form.labelAudience")}>
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
                    {t(a.labelKey)}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("org.form.labelVenue")}>
              <input value={form.venue} onChange={(e) => set("venue", e.target.value)} className="ag-input" placeholder={t("org.form.phVenue")} />
            </Field>
            <Field label={t("org.form.labelNeighborhood")}>
              <input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} className="ag-input" placeholder={t("org.form.phNeighborhood")} />
            </Field>
          </div>

          {/* Flyer del evento: se sube a R2 y se refleja en la agenda. */}
          <Field label={t("org.form.labelFlyer")}>
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
                  {uploading ? t("org.form.uploading") : form.image_url ? t("org.form.changeFlyer") : t("org.form.uploadFlyer")}
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
                  <Sparkles size={12} /> {t("org.form.noFlyer")} <ExternalLink size={10} />
                </Link>
              </div>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("org.form.labelPrice")}>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className="ag-input" placeholder={t("org.form.phPrice")} />
            </Field>
            <Field label={t("org.form.labelPriceInfo")}>
              <input value={form.price_info} onChange={(e) => set("price_info", e.target.value)} className="ag-input" placeholder={t("org.form.phPriceInfo")} />
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
                <Ticket size={15} style={{ color: "var(--ag-brand)" }} /> {t("org.form.onlineSale")}
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
                placeholder={t("org.form.phTicketUrl")}
              />
            )}
          </div>

          <Field label={t("org.form.labelDescription")}>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="ag-input resize-none" placeholder={t("org.form.phDescription")} />
          </Field>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            disabled={saving}
            onClick={() => save("draft")}
            className="flex-1 rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--home-card-bg)", color: "var(--home-text)" }}
          >
            {t("org.form.saveDraft")}
          </button>
          <button
            disabled={saving}
            onClick={() => save("published")}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--ag-brand)" }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Eye size={15} />} {t("org.form.publish")}
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
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl py-16 text-center" style={{ background: "var(--home-bg-soft)", border: "1px dashed var(--home-card-border)" }}>
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--ag-brand-bg)" }}>
        <CalendarDays size={24} style={{ color: "var(--ag-brand)" }} />
      </div>
      <h3 className="text-lg font-semibold">{t("org.empty.title")}</h3>
      <p className="mt-1 max-w-xs text-sm" style={{ color: "var(--home-text-muted)" }}>
        {t("org.empty.body")}
      </p>
      <button onClick={onCreate} className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--ag-brand)" }}>
        <Plus size={16} /> {t("org.empty.create")}
      </button>
    </div>
  );
}
