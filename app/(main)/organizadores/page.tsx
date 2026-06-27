import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Palette, BadgeEuro, ArrowRight, Sparkles, Check, Upload, Share2 } from "lucide-react";
import FlyerCtaButton from "./FlyerCtaButton";

/**
 * /organizadores — Landing de captación para organizadores y academias.
 * Destino del outreach del admin ("publica gratis + flyer en 2 min").
 * Dos acciones: publicar el evento (/subir) y crear el flyer (editor ArteGenIA
 * vía handoff SSO). Si el enlace lleva ?k=<clave>, se reenvía a /subir.
 */

export const metadata: Metadata = {
  title: "Publica tu evento gratis + flyer en 2 minutos | Peligro Oficial",
  description:
    "Pon tu evento en la agenda cultural de Madrid y crea el flyer con IA en 2 minutos. Gratis, sin comisiones, sin diseñador.",
  openGraph: {
    title: "Publica tu evento gratis + flyer en 2 minutos",
    description:
      "Agenda cultural de Madrid. Más público y flyer profesional con IA. Gratis, sin comisiones.",
    images: [
      "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/flyers/eventos/1782314912937-culccqjh.jpg",
    ],
  },
};

const R2 = "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/flyers/eventos";
const SAMPLES = [
  { src: `${R2}/1781793119485-exxu4b52.jpg`, r: "-7deg", z: 1, mt: "mt-6" },
  { src: `${R2}/1782314912937-culccqjh.jpg`, r: "0deg", z: 3, mt: "mt-0" },
  { src: `${R2}/1781803375023-2f89q50d.jpg`, r: "7deg", z: 1, mt: "mt-6" },
];

const BENEFITS = [
  {
    Icon: Megaphone,
    title: "Más público, sin esfuerzo",
    body: "Apareces ante gente que ya está buscando planes en Madrid. Tu evento con página propia, lista para compartir en redes.",
  },
  {
    Icon: Palette,
    title: "Flyer profesional en 2 min",
    body: "Plantillas + IA + tus fotos. Quita fondos y monta el diseño sin diseñador ni Photoshop. Listo para Instagram al instante.",
  },
  {
    Icon: BadgeEuro,
    title: "Gratis y sin comisiones",
    body: "Publicar no cuesta nada. No tocamos tus entradas ni tu dinero: la venta sigue siendo 100 % tuya.",
  },
];

const STEPS = [
  {
    Icon: Upload,
    title: "Sube tu evento",
    body: "Sube el flyer y la IA lee fecha, lugar y precio. Revisas y publicas en un minuto.",
  },
  {
    Icon: Sparkles,
    title: "Crea o mejora el flyer",
    body: "Diséñalo con ArteGenIA: plantillas e IA. Si ya lo tienes, súbelo tal cual.",
  },
  {
    Icon: Share2,
    title: "Comparte y llena",
    body: "Comparte el enlace de tu evento en tus redes. Aparece en la agenda y suma alcance.",
  },
];

export default async function OrganizadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ k?: string | string[] }>;
}) {
  const sp = await searchParams;
  const k = typeof sp?.k === "string" ? sp.k : "";
  const subirHref = k ? `/subir?k=${encodeURIComponent(k)}` : "/subir";

  const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.03]";
  const secondaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-bold transition hover:scale-[1.03]";

  return (
    <main className="min-h-screen" style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 75% at 82% -5%, rgba(168,85,247,.20), transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-12 sm:pt-20 sm:pb-16 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-10">
          <div className="text-center lg:text-left">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
              style={{ background: "rgba(168,85,247,.14)", color: "var(--ag-brand)" }}
            >
              <Sparkles size={12} /> Para organizadores · Gratis
            </span>
            <h1 className="mt-4 text-3xl font-black leading-[1.06] sm:text-5xl">
              Llena tu sala.{" "}
              <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                Publica gratis
              </span>{" "}
              y crea tu flyer en 2 minutos.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg lg:mx-0" style={{ color: "var(--home-text-muted)" }}>
              Pon tu evento en la agenda cultural de Madrid y diséñalo como un profesional con IA.
              Sin comisiones, sin diseñador, sin Photoshop.
            </p>
            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <Link href={subirHref} className={primaryBtn} style={{ background: "var(--ag-brand)" }}>
                Publica tu evento gratis <ArrowRight size={16} />
              </Link>
              <FlyerCtaButton
                className={secondaryBtn}
                style={{ borderColor: "var(--home-card-border)", color: "var(--home-text)" }}
              >
                <Sparkles size={16} /> Crea tu flyer
              </FlyerCtaButton>
            </div>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs lg:justify-start" style={{ color: "var(--home-text-muted)" }}>
              {["Gratis para siempre", "Sin tarjeta", "Tu evento online en 2 min"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-500" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Collage de flyers de muestra */}
          <div className="mt-10 flex items-center justify-center gap-0 lg:mt-0">
            {SAMPLES.map((f, i) => (
              <div
                key={i}
                className={`${f.mt} h-52 w-[140px] shrink-0 rounded-2xl bg-cover bg-center shadow-2xl sm:h-64 sm:w-[176px]`}
                style={{
                  backgroundImage: `url('${f.src}')`,
                  transform: `rotate(${f.r}) translateX(${i === 0 ? "14px" : i === 2 ? "-14px" : "0"})`,
                  zIndex: f.z,
                  border: "3px solid var(--home-bg-soft)",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── BENEFICIOS ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {BENEFITS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl p-6"
              style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}
            >
              <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: "rgba(168,85,247,.12)", color: "var(--ag-brand)" }}
              >
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--home-text-muted)" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-12 sm:pb-16">
        <h2 className="text-center text-2xl font-black sm:text-3xl">Cómo funciona</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm" style={{ color: "var(--home-text-muted)" }}>
          De cero a evento publicado con flyer profesional, en una sentada.
        </p>
        <div className="mt-9 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {STEPS.map(({ Icon, title, body }, i) => (
            <div
              key={title}
              className="relative rounded-2xl p-6"
              style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}
            >
              <span className="absolute right-5 top-5 text-4xl font-black opacity-10">{i + 1}</span>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: "var(--ag-brand)" }}>
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--home-text-muted)" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-24">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-10 sm:py-16"
          style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}
        >
          <h2 className="text-2xl font-black text-white sm:text-4xl">¿Listo para llenar tu próximo evento?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/80 sm:text-base">
            Publica gratis en la agenda y crea tu flyer en 2 minutos. Sin comisiones.
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href={subirHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-purple-700 shadow-lg transition hover:scale-[1.03]"
            >
              Publica tu evento gratis <ArrowRight size={16} />
            </Link>
            <FlyerCtaButton className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
              <Sparkles size={16} /> Crea tu flyer
            </FlyerCtaButton>
          </div>
        </div>
      </section>
    </main>
  );
}
