import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — 180×180. Cuando un usuario añade el sitio a la pantalla
// de inicio en iPhone/iPad, se ve este icono. Importante para feel premium.
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
          background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f59e0b 100%)",
          borderRadius: 40,
          fontFamily: "system-ui",
          fontSize: 88,
          fontWeight: 900,
          color: "white",
          letterSpacing: "-0.05em",
          textShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        AG
      </div>
    ),
    size,
  );
}
