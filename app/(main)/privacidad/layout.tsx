import type { Metadata } from "next";

// Metadata estatico para SEO. La pagina es Client Component (necesita
// useLocale), por eso movemos los meta al layout que SI es Server Component.
// title/description se quedan en ES porque es la version oficial; los bots
// crawlean igual el contenido ES debajo del banner para otros locales.
export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Cómo recogemos y tratamos tus datos personales en ArteGenIA.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
