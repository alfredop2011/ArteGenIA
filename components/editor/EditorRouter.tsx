"use client";

import { useEffect, useState } from "react";
import GeneratedEditor from "@/components/editor/GeneratedEditor";
import MobileEditorV3 from "@/components/editor/MobileEditorV3";
import type { FormatId } from "@/data/formats";

/**
 * EditorRouter: decide MobileEditor (< 768px) vs GeneratedEditor (desktop).
 *
 * No reusa logica del desktop. MobileEditor es un componente nuevo separado
 * pensado mobile-first (touch, paneles deslizables, bottom toolbar).
 *
 * Mientras detecta el viewport (1er render SSR), muestra splash para evitar
 * flickering entre ambos editores.
 */
type Props = {
  templateId?: number;
  projectId?: string;
  formatId?: FormatId;
};

export default function EditorRouter(props: Props) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Splash mientras detectamos viewport
  if (isMobile === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#070711]">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  // Mobile V3 acepta tanto templateId (plantilla nueva) como projectId (proyecto guardado).
  if (isMobile && (props.templateId || props.projectId)) {
    return <MobileEditorV3 {...props}/>;
  }

  return <GeneratedEditor {...props}/>;
}
