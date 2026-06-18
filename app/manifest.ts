import type { MetadataRoute } from "next";

/**
 * manifest.webmanifest generado por Next 16 file convention (servido en
 * /manifest.webmanifest). Hace la app instalable (PWA) y mejora la ficha en
 * Android/Chrome al añadir a pantalla de inicio.
 *
 * Los iconos referencian las rutas que Next sirve desde app/icon.png (512x512)
 * y app/apple-icon.png (180x180) — no hace falta duplicarlos en /public.
 *
 * theme/background_color = #0a0010 (mismo morado oscuro del viewport en
 * app/layout.tsx). Si cambias el tema, sincroniza ambos sitios.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ArteGenIA — Crea flyers profesionales con IA",
    short_name: "ArteGenIA",
    description:
      "Diseña flyers para eventos, conciertos y clases de baile con plantillas profesionales e IA. Gratis.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0010",
    theme_color: "#0a0010",
    lang: "es",
    categories: ["graphics", "design", "productivity"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
