"use client";

import { useState } from "react";
import {
  GraduationCap, Clapperboard, Palette, Landmark, Megaphone, School,
  HelpCircle, X, Sparkles,
} from "lucide-react";
import { supabase, type OrganizerType } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

/**
 * Modal de onboarding: pregunta al usuario qué tipo de organizador es.
 *
 * Se muestra UNA vez tras el primer login (cuando profile.organizer_type
 * es null). Si el user pulsa "X" (skip), guardamos "skipped" y no se
 * vuelve a preguntar. La respuesta se persiste en profiles.organizer_type.
 *
 * Sin valor para el user — el valor es 100% para nosotros (analytics).
 * Por eso es opcional y no agresivo: tarjetas grandes con iconos, una
 * frase honesta diciendo para qué lo usamos.
 */

type OptionDef = {
  id: OrganizerType;
  label: string;
  desc: string;
  icon: typeof GraduationCap;
  accent: string;
};

const OPTIONS: OptionDef[] = [
  { id: "academia",     label: "Academia / Escuela", desc: "Clases, workshops, talleres",        icon: GraduationCap, accent: "#a855f7" },
  { id: "productora",   label: "Productora",          desc: "Eventos, conciertos, fiestas",      icon: Clapperboard,  accent: "#ec4899" },
  { id: "freelance",    label: "Freelance / Artista", desc: "DJ, fotógrafo, diseñador autónomo", icon: Palette,       accent: "#facc15" },
  { id: "institucion",  label: "Institución",         desc: "Centro cultural, ayuntamiento",     icon: Landmark,      accent: "#22d3ee" },
  { id: "agencia",      label: "Agencia",             desc: "Marketing, comunicación, RRPP",     icon: Megaphone,     accent: "#fb923c" },
  { id: "colegio",      label: "Colegio / Educación", desc: "Centro escolar, instituto",         icon: School,        accent: "#84cc16" },
  { id: "otro",         label: "Otro",                desc: "No encaja en lo anterior",          icon: HelpCircle,    accent: "#9ca3af" },
];

type Props = {
  onClose: (selected: OrganizerType | null) => void;
};

export default function OrganizerTypeModal({ onClose }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Persiste la respuesta en Supabase y cierra. Si falla, mostramos error
   *  pero NO bloqueamos — el user puede cerrar manualmente. */
  const handleSelect = async (type: OrganizerType) => {
    if (!user) {
      onClose(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: e } = await supabase
        .from("profiles")
        .update({
          organizer_type: type,
          organizer_type_answered_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (e) throw e;
      onClose(type);
    } catch (err) {
      console.warn("[organizer-modal] no se pudo guardar:", err);
      setError("No se pudo guardar. Cierra e intenta más tarde.");
    } finally {
      setSaving(false);
    }
  };

  /** Skip = guardar "skipped" para no preguntar de nuevo. */
  const handleSkip = () => handleSelect("skipped");

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && handleSkip()}
    >
      <div
        className="w-full max-w-2xl rounded-3xl p-5 sm:p-7 relative max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--home-bg-soft)",
          border: "1px solid var(--ag-brand-border)",
          boxShadow: "0 0 60px var(--ag-brand-bg)",
        }}
      >
        {/* Botón cerrar (skip) */}
        <button
          onClick={handleSkip}
          aria-label="Cerrar"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
          style={{ color: "var(--home-text-soft)" }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
               style={{ background: "var(--ag-brand-bg)", border: "1px solid var(--ag-brand-border)" }}>
            <Sparkles size={11} strokeWidth={2.5} style={{ color: "var(--ag-brand)" }} />
            <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--ag-brand)" }}>
              Un favor rápido
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-1.5" style={{ color: "var(--home-text)" }}>
            ¿Qué tipo de organizador eres?
          </h2>
          <p className="text-xs sm:text-sm max-w-md mx-auto" style={{ color: "var(--home-text-muted)" }}>
            Nos ayudas a entender quién usa el producto para mejorarlo.
            <br className="hidden sm:block" />
            Es opcional y solo lo preguntamos una vez.
          </p>
        </div>

        {/* Grid de opciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          {OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={saving}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "var(--home-card-bg)",
                  border: "1px solid var(--home-card-border)",
                }}
              >
                <div
                  className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: `${opt.accent}1a`, // alpha 10%
                    border: `1px solid ${opt.accent}55`,
                    color: opt.accent,
                  }}
                >
                  <Icon size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--home-text)" }}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: "var(--home-text-soft)" }}>
                    {opt.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-center" style={{ color: "var(--ag-danger)" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSkip}
          className="block mx-auto mt-3 text-xs hover:opacity-70 transition-opacity"
          style={{ color: "var(--home-text-soft)" }}
        >
          Prefiero no responder
        </button>
      </div>
    </div>
  );
}
