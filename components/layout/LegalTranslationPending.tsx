"use client";
import { Globe, ArrowDown } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";

/**
 * Banner mostrado al inicio de las paginas legales cuando el usuario tiene
 * un locale != "es". Texto legal oficial solo existe en ES (decision MVP:
 * traducir legalmente a 4 idiomas requiere review profesional que no
 * tenemos todavia). Mostramos:
 *  1. Aviso traducido al locale activo
 *  2. CTA visual hacia el texto en ES que aparece debajo
 *  3. Anchor scroll suave hacia #es-version
 *
 * Cuando se contraten traducciones oficiales, este componente se elimina
 * y cada pagina legal pasa a tener bloques completos por locale.
 */

type Props = {
  docType: "privacy" | "terms" | "cookies";
};

export default function LegalTranslationPending({ docType }: Props) {
  const { t } = useLocale();

  const titleKey =
    docType === "privacy" ? "legal.privacy.title"
    : docType === "terms" ? "legal.terms.title"
    : "legal.cookies.title";

  return (
    <div className="not-prose mb-8 rounded-2xl p-5 border"
         style={{ background: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.3)" }}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.35)" }}>
          <Globe size={18} strokeWidth={2} className="text-purple-300" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black text-white mb-1">
            {t("legal.translationPending.title")}
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            {t("legal.translationPending.body")}
          </p>
          <a
            href="#es-version"
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-purple-300 hover:text-purple-200 transition-colors"
          >
            <ArrowDown size={12} strokeWidth={2.5} />
            {t("legal.translationPending.cta")} ({t(titleKey)})
          </a>
        </div>
      </div>
    </div>
  );
}
