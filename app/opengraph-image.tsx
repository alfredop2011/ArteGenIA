import { ImageResponse } from "next/og";

/**
 * Open Graph image generada dinamicamente en el edge.
 *
 * Esto es lo que se ve cuando alguien comparte artegenia.vercel.app en
 * WhatsApp / X / LinkedIn / iMessage / Slack / Discord. Sin esto, la
 * preview queda vacia o con un screenshot generico.
 *
 * Spec: 1200x630 (estandar Open Graph, ratio 1.91:1)
 * Tambien se usa como Twitter "summary_large_image" porque Next deriva
 * twitter:image desde og:image por defecto.
 *
 * Restricciones de ImageResponse: solo flexbox (no grid), CSS subset.
 * Doc: node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md
 */

export const alt = "ArteGenIA — Crea flyers profesionales con IA en minutos";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#05050b",
          backgroundImage:
            "radial-gradient(circle at 30% 50%, rgba(168,85,247,0.25) 0%, transparent 60%), radial-gradient(circle at 80% 30%, rgba(250,204,21,0.15) 0%, transparent 50%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Logo + marca arriba */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #facc15 0%, #f97316 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#000",
              fontSize: "32px",
              fontWeight: 900,
              letterSpacing: "-1px",
            }}
          >
            AG
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            ArteGenIA
          </div>
        </div>

        {/* Titulo principal */}
        <div
          style={{
            color: "#ffffff",
            fontSize: "80px",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-2px",
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            maxWidth: "1000px",
          }}
        >
          Diseña flyers que{" "}
          <span
            style={{
              background:
                "linear-gradient(90deg, #c084fc 0%, #f472b6 50%, #facc15 100%)",
              backgroundClip: "text",
              color: "transparent",
              marginLeft: "16px",
            }}
          >
            impactan
          </span>
        </div>

        {/* Subtitulo */}
        <div
          style={{
            color: "#a1a1aa",
            fontSize: "32px",
            fontWeight: 500,
            lineHeight: 1.3,
            maxWidth: "900px",
          }}
        >
          Plantillas profesionales · IA para recortar personas · Descarga gratis
        </div>

        {/* Pill bottom con URL */}
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "80px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 24px",
            borderRadius: "999px",
            backgroundColor: "rgba(168, 85, 247, 0.15)",
            border: "2px solid rgba(168, 85, 247, 0.4)",
            color: "#e9d5ff",
            fontSize: "22px",
            fontWeight: 600,
          }}
        >
          artegenia.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
