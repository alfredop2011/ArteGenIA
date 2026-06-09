import type { Metadata } from "next";

// noindex porque la pagina aun es preview admin-only. Cuando se libere
// al publico, quitar el robots.
export const metadata: Metadata = {
  title: "Planes y precios",
  description: "Planes ArteGenIA: Gratis, Pro y Business. Elige el perfecto para ti.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PlanesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
