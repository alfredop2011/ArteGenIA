"use client";

/**
 * WelcomeChecklist — onboarding visible para usuarios nuevos (Z.22).
 *
 * Aparece floating bottom-right en /home para usuarios:
 *   - Autenticados
 *   - Sin proyectos creados (lo detectamos via /api/projects/count)
 *   - Que no han dismisseado el checklist antes (localStorage)
 *
 * Muestra 4 items con icono + título + descripción + CTA. Click en item
 * lleva a la feature. El user lo puede cerrar con X — no vuelve a aparecer.
 *
 * Auto-oculta cuando el user crea su primer proyecto (la condición de
 * "sin proyectos" deja de ser true).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { Sparkles, Wand2, FolderOpen, Image as ImageIcon, X, ChevronRight } from "lucide-react";

const DISMISS_KEY = "ag_welcome_dismissed_v1";

type ChecklistItem = {
  id: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  color: string;
};

const ITEMS: ChecklistItem[] = [
  {
    id: "remove-bg",
    icon: <Wand2 size={18} strokeWidth={2}/>,
    title: "Quita el fondo a una foto",
    desc: "Sube cualquier imagen, te la devolvemos sin fondo en 5s. Gratis tu 1ª.",
    href: "/quitar-fondo",
    color: "emerald",
  },
  {
    id: "create-flyer",
    icon: <Sparkles size={18} strokeWidth={2}/>,
    title: "Crea tu primer flyer",
    desc: "Elige una plantilla, cambia textos y fotos en 2 minutos.",
    href: "/templates",
    color: "purple",
  },
  {
    id: "my-resources",
    icon: <FolderOpen size={18} strokeWidth={2}/>,
    title: "Guarda tus recursos",
    desc: "Logos, fotos sin fondo, colaboradores — todo reusable en otros flyers.",
    href: "/mis-recursos",
    color: "fuchsia",
  },
  {
    id: "ai-generate",
    icon: <ImageIcon size={18} strokeWidth={2}/>,
    title: "Genera un fondo con IA",
    desc: "Describe lo que necesitas, la IA lo crea. Reemplaza el fondo en 1 click.",
    href: "/create",
    color: "blue",
  },
];

export default function WelcomeChecklist() {
  const { user, loading } = useAuth();
  const { loadProjects } = useProjects();
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [hasProjects, setHasProjects] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Leer flag de dismiss al mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  // Comprobar si el user tiene proyectos. Si tiene, no mostramos el checklist
  // (asumimos que ya conoce la app). Reusa useProjects hook (Supabase client).
  useEffect(() => {
    if (loading || !user) {
      setHasProjects(null);
      return;
    }
    let cancelled = false;
    void loadProjects()
      .then(projects => {
        if (cancelled) return;
        setHasProjects(Array.isArray(projects) && projects.length > 0);
      })
      .catch(() => { if (!cancelled) setHasProjects(false); });
    return () => { cancelled = true; };
  }, [loading, user, loadProjects]);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
    setDismissed(true);
  };

  // Condiciones para mostrar
  if (loading || !user) return null;
  if (dismissed) return null;
  if (hasProjects !== false) return null; // null=loading, true=skip

  // Estado contraído: solo botón flotante
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-br from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold text-[12.5px] shadow-2xl shadow-purple-500/40 flex items-center gap-2 transition-all hover:scale-105"
      >
        <Sparkles size={16} strokeWidth={2.5}/>
        Empezar aquí
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] sm:w-[380px] max-h-[80vh] overflow-y-auto rounded-2xl border border-white/[0.08] shadow-2xl backdrop-blur-xl"
         style={{ background: "rgba(20, 18, 32, 0.96)" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
            <Sparkles size={14} strokeWidth={2.2}/>
          </div>
          <div>
            <p className="text-white text-[13px] font-bold">¡Bienvenido a ArteGenIA!</p>
            <p className="text-gray-400 text-[10.5px]">Empieza con estos pasos</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(false)}
            className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors text-xs"
            aria-label="Minimizar"
            title="Minimizar"
          >
            —
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors"
            aria-label="Cerrar checklist"
            title="No mostrar más"
          >
            <X size={14}/>
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="p-2">
        {ITEMS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors"
          >
            <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${colorClasses(item.color)}`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12.5px] font-bold leading-tight">{item.title}</p>
              <p className="text-gray-400 text-[10.5px] mt-0.5 leading-snug">{item.desc}</p>
            </div>
            <ChevronRight size={14} strokeWidth={2} className="shrink-0 text-gray-600 group-hover:text-white transition-colors mt-1"/>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.06] text-center">
        <button
          onClick={handleDismiss}
          className="text-[10.5px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          Ya conozco la app, ocultar
        </button>
      </div>
    </div>
  );
}

function colorClasses(color: string): string {
  switch (color) {
    case "emerald":
      return "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 group-hover:bg-emerald-500/25";
    case "purple":
      return "bg-purple-500/15 border border-purple-500/30 text-purple-300 group-hover:bg-purple-500/25";
    case "fuchsia":
      return "bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-300 group-hover:bg-fuchsia-500/25";
    case "blue":
      return "bg-blue-500/15 border border-blue-500/30 text-blue-300 group-hover:bg-blue-500/25";
    default:
      return "bg-white/[0.05] border border-white/[0.10] text-gray-300";
  }
}
