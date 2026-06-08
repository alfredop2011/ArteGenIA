"use client";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";

/**
 * Footer minimo con links legales obligatorios.
 * Se renderiza dentro de AppShell para todas las paginas del grupo (main).
 * El editor (/editor/[id]) NO lo muestra porque va fuera de (main).
 *
 * Labels via useLocale() — soporta es/en/fr/pt.
 */
export default function Footer() {
  const { t } = useLocale();
  const year = 2026;

  return (
    <footer className="border-t mt-8"
            style={{ background: "var(--home-bg-soft)", borderColor: "var(--home-divider)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Marca + tag beta */}
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--home-text-soft)" }}>
            <div className="w-5 h-5 rounded bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-black text-[9px]">
              AG
            </div>
            <span>ArteGenIA</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-bold tracking-wider">
              {t("footer.beta")}
            </span>
            <span>·</span>
            <span>© {year}</span>
          </div>

          {/* Links legales */}
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            <Link
              href="/privacidad"
              className="transition-colors hover:opacity-80"
              style={{ color: "var(--home-text-muted)" }}
            >
              {t("footer.privacy")}
            </Link>
            <span style={{ color: "var(--home-text-soft)" }}>·</span>
            <Link
              href="/terminos"
              className="transition-colors hover:opacity-80"
              style={{ color: "var(--home-text-muted)" }}
            >
              {t("footer.terms")}
            </Link>
            <span style={{ color: "var(--home-text-soft)" }}>·</span>
            <Link
              href="/cookies"
              className="transition-colors hover:opacity-80"
              style={{ color: "var(--home-text-muted)" }}
            >
              {t("footer.cookies")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
