"use client";

import { useRef, useState, type ReactNode } from "react";
import { UploadCloud, Loader2, CheckCircle2, ExternalLink, Copy, Sparkles, CalendarPlus } from "lucide-react";

/**
 * /subir — Página PÚBLICA (sin cuenta) para subir un evento a la agenda.
 * El admin comparte este link con organizadores amigos: suben el flyer (la IA
 * lee fecha/lugar/precio), revisan y publican. Si hay EVENT_SUBMIT_KEY, el link
 * debe llevar ?k=<clave>.
 */

export const dynamic = "force-dynamic";

const CATS: { id: string; label: string }[] = [
  { id: "social", label: "Baile social" },
  { id: "clases", label: "Clases de baile" },
  { id: "conciertos", label: "Concierto" },
  { id: "teatro", label: "Teatro" },
  { id: "fiesta", label: "Fiesta" },
  { id: "festival", label: "Festival" },
  { id: "club", label: "Club / Discoteca" },
  { id: "corporativo", label: "Corporativo" },
];

const CITIES = ["madrid", "barcelona", "valencia", "sevilla", "malaga", "bilbao", "zaragoza", "granada"];

type Form = {
  title: string;
  event_date: string;
  event_time: string;
  city: string;
  venue: string;
  category: string;
  price: string; // "" = consultar, "0" = gratis
  price_info: string;
  ticket_url: string;
  description: string;
  submitter_name: string;
  submitter_email: string;
};

const EMPTY: Form = {
  title: "", event_date: "", event_time: "20:00", city: "madrid", venue: "", category: "social",
  price: "", price_info: "", ticket_url: "", description: "", submitter_name: "", submitter_email: "",
};

export default function SubirEventoPage() {
  // Clave del link (?k=) leída del propio enlace; init perezoso (no en effect).
  const [k] = useState(() => (typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("k") || ""));
  const [form, setForm] = useState<Form>(EMPTY);
  const [image, setImage] = useState<{ url: string; key: string } | null>(null);
  const [reading, setReading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ publicUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const qs = k ? `?k=${encodeURIComponent(k)}` : "";

  async function onFile(file: File) {
    setError("");
    setReading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/eventos/public-extract${qs}`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No pude leer el flyer.");
        return;
      }
      setImage({ url: json.url, key: json.key });
      const d = json.data;
      if (d) {
        set({
          title: d.title || "",
          event_date: d.event_date || "",
          event_time: d.event_time || "20:00",
          city: CITIES.includes((d.city || "").toLowerCase()) ? d.city.toLowerCase() : "madrid",
          venue: d.venue || "",
          category: CATS.some((c) => c.id === d.category) ? d.category : "social",
          price: d.price == null ? "" : String(d.price),
          price_info: d.price_info || "",
          ticket_url: d.ticket_url || "",
          description: d.description || "",
        });
      }
    } catch {
      setError("Fallo de red leyendo el flyer.");
    } finally {
      setReading(false);
    }
  }

  async function submit() {
    setError("");
    if (!form.title.trim()) return setError("Pon el nombre del evento.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.event_date)) return setError("Pon la fecha del evento.");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/eventos/public-submit${qs}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, image_url: image?.url, image_key: image?.key }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo publicar.");
        return;
      }
      setDone({ publicUrl: json.publicUrl });
    } catch {
      setError("Fallo de red al publicar.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm(EMPTY);
    setImage(null);
    setDone(null);
    setError("");
  }

  // ── Pantalla de éxito ──────────────────────────────────────────────
  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 size={56} className="mx-auto" style={{ color: "var(--ag-success, #16a34a)" }} />
        <h1 className="mt-4 text-2xl font-bold">¡Publicado! 🎉</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--home-text-muted)" }}>
          Tu evento ya está en la agenda. Míralo y compártelo:
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <a href={done.publicUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: "var(--ag-brand)" }}>
            <ExternalLink size={16} /> Ver mi evento
          </a>
          <button onClick={() => { navigator.clipboard?.writeText(done.publicUrl); setCopied(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            style={{ border: "1px solid var(--home-card-border)", color: "var(--home-text)" }}>
            <Copy size={16} /> {copied ? "¡Enlace copiado!" : "Copiar enlace"}
          </button>
          <button onClick={reset} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            style={{ color: "var(--ag-brand)" }}>
            <CalendarPlus size={16} /> Subir otro evento
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario ─────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: "var(--ag-brand)" }}>
          <Sparkles size={18} />
        </span>
        <h1 className="text-xl font-bold">Sube tu evento</h1>
      </div>
      <p className="mt-1.5 text-sm" style={{ color: "var(--home-text-muted)" }}>
        Sin cuenta. Sube el flyer y lo leo solo (fecha, lugar, precio). Revisa y publica. Gratis.
      </p>

      {/* Dropzone del flyer */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={reading}
        className="mt-5 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors"
        style={{ borderColor: "var(--ag-brand-border)", background: "var(--home-bg-soft)" }}
      >
        {reading ? (
          <><Loader2 size={28} className="animate-spin" style={{ color: "var(--ag-brand)" }} /><span className="text-sm font-medium">Leyendo el flyer…</span></>
        ) : image ? (
          <>
            <img src={image.url} alt="flyer" className="max-h-44 rounded-lg object-contain" />
            <span className="text-xs" style={{ color: "var(--home-text-muted)" }}>Toca para cambiar el flyer</span>
          </>
        ) : (
          <>
            <UploadCloud size={32} style={{ color: "var(--ag-brand)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--ag-brand)" }}>Sube el flyer</span>
            <span className="text-xs" style={{ color: "var(--home-text-muted)" }}>PNG, JPG o WebP · o rellena los datos a mano abajo</span>
          </>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

      {/* Campos */}
      <div className="mt-5 space-y-3">
        <Field label="Nombre del evento *"><input className={inp} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ej. Noche de bachata" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha *"><input type="date" className={inp} value={form.event_date} onChange={(e) => set({ event_date: e.target.value })} /></Field>
          <Field label="Hora"><input type="time" className={inp} value={form.event_time} onChange={(e) => set({ event_time: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo"><select className={inp} value={form.category} onChange={(e) => set({ category: e.target.value })}>{CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
          <Field label="Ciudad"><select className={inp} value={form.city} onChange={(e) => set({ city: e.target.value })}>{CITIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}</select></Field>
        </div>
        <Field label="Lugar / sala"><input className={inp} value={form.venue} onChange={(e) => set({ venue: e.target.value })} placeholder="Nombre del local" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio (€)" hint="vacío = consultar · 0 = gratis"><input type="number" min={0} className={inp} value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="Consultar" /></Field>
          <Field label="Link de entradas"><input className={inp} value={form.ticket_url} onChange={(e) => set({ ticket_url: e.target.value })} placeholder="https://…" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tu nombre"><input className={inp} value={form.submitter_name} onChange={(e) => set({ submitter_name: e.target.value })} placeholder="Quién lo organiza" /></Field>
          <Field label="Tu email" hint="opcional, para avisarte"><input type="email" className={inp} value={form.submitter_email} onChange={(e) => set({ submitter_email: e.target.value })} placeholder="tu@email.com" /></Field>
        </div>
      </div>

      {error && <p className="mt-3 text-sm" style={{ color: "var(--ag-danger, #dc2626)" }}>{error}</p>}

      <button onClick={submit} disabled={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60" style={{ background: "var(--ag-brand)" }}>
        {submitting ? <><Loader2 size={16} className="animate-spin" /> Publicando…</> : <>Publicar en la agenda</>}
      </button>
      <p className="mt-3 text-center text-xs" style={{ color: "var(--home-text-soft)" }}>
        Al publicar aceptas que el evento aparezca en la agenda pública de ArteGenIA.
      </p>
    </div>
  );
}

const inp = "w-full rounded-xl px-3 py-2 text-sm outline-none bg-[var(--home-bg-soft)] border border-[var(--home-card-border)] text-[var(--home-text)]";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium" style={{ color: "var(--home-text-muted)" }}>
        {label}{hint && <span className="font-normal" style={{ color: "var(--home-text-soft)" }}> · {hint}</span>}
      </span>
      {children}
    </label>
  );
}
