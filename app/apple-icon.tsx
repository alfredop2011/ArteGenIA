import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — 180x180. Cuando un usuario anade el sitio a la pantalla
// de inicio en iPhone/iPad, se ve este icono. Importante para feel premium.
//
// Paleta v2: morado -> rosa -> naranja (alineada con nuevo logo final).
// La letra "A" representa el isotipo simplificado del logo principal.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7E2BFF 0%, #c026d3 40%, #FF1EA8 70%, #FF8A00 100%)",
          borderRadius: 40,
          fontFamily: "system-ui",
          fontSize: 110,
          fontWeight: 900,
          color: "white",
          letterSpacing: "-0.05em",
          textShadow: "0 4px 16px rgba(11,7,23,0.45)",
        }}
      >
        A
      </div>
    ),
    size,
  );
}
