"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Fetch al mount del map { [templateId]: newImageUrl } con las thumbnails
 * override-eadas por admin desde el editor visual.
 *
 * Uso:
 *   const { resolveImage } = useTemplateOverrideImages();
 *   <img src={resolveImage(template.id, template.image)} .../>
 *
 * Failure-mode: si el endpoint falla, resolveImage devuelve fallback (original).
 */
export function useTemplateOverrideImages() {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/templates/overrides-images", { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        if (alive && j?.images && typeof j.images === "object") {
          setMap(j.images as Record<string, string>);
        }
      } catch {
        // silencioso — si falla usamos las imagenes originales
      }
    })();
    return () => { alive = false; };
  }, []);

  const resolveImage = useCallback(
    (templateId: number, fallback: string): string => {
      return map[String(templateId)] ?? fallback;
    },
    [map],
  );

  return { resolveImage, overrideImages: map };
}
