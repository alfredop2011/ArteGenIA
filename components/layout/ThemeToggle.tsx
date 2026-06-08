"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useLocale } from "@/hooks/useLocale";

/**
 * Boton circular sol/luna en el header. Cambia tema dark <-> light al
 * pulsar. La transicion visual la maneja CSS porque cambia variables
 * que muchos componentes consumen.
 *
 * aria-label y title via useLocale() — soporta es/en/fr/pt.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? t("a11y.themeToggle.toLight") : t("a11y.themeToggle.toDark")}
      title={isDark ? t("a11y.themeToggle.titleLight") : t("a11y.themeToggle.titleDark")}
      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
      style={{
        background: "var(--home-card-bg)",
        border: "1px solid var(--home-card-border)",
        color: "var(--home-text)",
      }}
    >
      {isDark ? (
        <Sun size={16} strokeWidth={2} className="text-amber-300" />
      ) : (
        <Moon size={16} strokeWidth={2} className="text-indigo-600" />
      )}
    </button>
  );
}
