import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // siempre fresh, no cachear OG estaticos

/**
 * /flyer/[id] — Página pública del flyer compartido.
 *
 * Muestra el flyer + CTA "Crea el tuyo en ArteGenIA".
 * Las redes sociales (FB, Twitter, WhatsApp, LinkedIn) leen los OG tags
 * para mostrar preview con imagen + título cuando el link se pega.
 *
 * Acceso: ID es UUID v4 random (no enumerable). Cualquiera con el link
 * puede ver. RLS permite SELECT a anon (policy "Public read shared_flyers").
 */

type SharedFlyer = {
  id: string;
  user_id: string | null;
  r2_url: string;
  title: string;
  description: string | null;
  view_count: number;
  created_at: string;
};

async function fetchSharedFlyer(id: string): Promise<SharedFlyer | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  // Cliente sin auth (lectura publica)
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("shared_flyers")
    .select("id, user_id, r2_url, title, description, view_count, created_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  // Incrementar view_count asincrono (no esperamos)
  void supabase.rpc("increment_shared_flyer_view", { flyer_id: id });

  return data as SharedFlyer;
}

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Genera meta tags OpenGraph + Twitter Card para preview en redes. */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const flyer = await fetchSharedFlyer(id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://artegenia.vercel.app";

  if (!flyer) {
    return {
      title: "Flyer no encontrado · ArteGenIA",
      description: "Este flyer no existe o ya no está disponible.",
    };
  }

  const title = `${flyer.title} · ArteGenIA`;
  const description = flyer.description || `Flyer creado con ArteGenIA. Diseña el tuyo gratis en minutos.`;
  const pageUrl = `${baseUrl}/flyer/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "ArteGenIA",
      images: [{ url: flyer.r2_url, width: 1080, height: 1350, alt: flyer.title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [flyer.r2_url],
    },
    alternates: { canonical: pageUrl },
  };
}

export default async function FlyerPage({ params }: PageProps) {
  const { id } = await params;
  const flyer = await fetchSharedFlyer(id);
  if (!flyer) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a14] via-[#13131f] to-[#1c1c2a] text-white flex flex-col">
      {/* HEADER simple con logo */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-black shadow-md shadow-purple-500/30">
            AG
          </div>
          <span className="font-black text-[15px] tracking-tight">ArteGenIA</span>
        </Link>
        <Link
          href="/templates"
          className="text-[12px] font-bold text-purple-300 active:text-purple-200"
        >
          Crear el mío →
        </Link>
      </header>

      {/* MAIN — flyer centrado + CTA debajo */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <div className="w-full max-w-md">
          <h1 className="text-[24px] font-black leading-tight mb-1">{flyer.title}</h1>
          <p className="text-[12px] text-gray-400 mb-4">
            Compartido vía ArteGenIA
          </p>

          {/* Imagen del flyer */}
          <div className="rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/40 bg-[#111]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flyer.r2_url}
              alt={flyer.title}
              className="w-full h-auto block"
            />
          </div>
        </div>

        {/* CTA principal — viral loop */}
        <div className="w-full max-w-md p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border border-purple-500/30 text-center">
          <h2 className="text-[18px] font-black mb-1">
            Crea el tuyo en 2 minutos
          </h2>
          <p className="text-[12px] text-gray-300 leading-relaxed mb-3">
            Plantillas profesionales · IA que rellena el contenido · Exporta PNG/PDF/SVG
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white font-bold text-[14px] active:scale-[0.97] shadow-lg shadow-purple-500/30"
          >
            Empezar gratis →
          </Link>
          <p className="text-[10px] text-gray-500 mt-3">
            Sin tarjeta · 4 idiomas · Funciona en móvil
          </p>
        </div>

        {/* Botón compartir */}
        <div className="text-center">
          <a
            href={flyer.r2_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[12px] text-gray-400 active:text-white"
          >
            ↓ Descargar imagen
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-4 border-t border-white/[0.06] text-center">
        <p className="text-[10px] text-gray-500">
          © ArteGenIA — <Link href="/" className="underline">artegenia.vercel.app</Link>
        </p>
      </footer>
    </main>
  );
}
