"use client";

import { useCallback, useRef, useState } from "react";
import type { Canvas } from "fabric";
import {
  extractPages,
  newEmptyPage,
  duplicatePage,
  serializePages,
  type PageData,
  type ProjectPages,
} from "@/lib/projectPages";

/**
 * Hook que abstrae la lógica multi-página para el editor.
 *
 * Encapsula:
 *  - State de la lista de páginas + índice activa
 *  - Hidratación desde fabric_json legacy o nuevo
 *  - Switch entre páginas (serializa la activa antes de cargar la nueva)
 *  - Add/duplicate/delete con guarantías (mínimo 1 página)
 *  - Serialización para persistir en Supabase
 *
 * El consumidor (MobileEditorV3, GeneratedEditor) solo necesita pasarle
 * el Fabric Canvas y reaccionar a `currentPageFabric` para cargar los
 * objects cuando cambia.
 */
export function useProjectPages() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Guardamos el fabric a cargar después de cambiar de página — el
  // useEffect del editor reacciona a este ref para hacer canvas.loadFromJSON.
  // Es un ref (no state) porque el editor lo lee SOLO al cambiar el índice,
  // no en cada render.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingFabricRef = useRef<any>(null);

  /** Hidrata desde un fabric_json (legacy o nuevo). Llamar UNA vez al
   *  cargar el proyecto desde Supabase. */
  const hydrate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fabricJson: any, fallbackWidth = 1080, fallbackHeight = 1350) => {
      const state = extractPages(fabricJson, fallbackWidth, fallbackHeight);
      setPages(state.pages);
      setActiveIndex(state.activeIndex);
      pendingFabricRef.current = state.pages[state.activeIndex]?.fabric ?? null;
      setInitialized(true);
    },
    [],
  );

  /** Serializa el canvas preservando width/height/background — toJSON()
   *  por defecto SOLO incluye objects, asi que al volver a esa pagina
   *  se perdian las dimensiones y el fondo. Z.25 fix multipagina. */
  const serializeCanvasFull = useCallback((canvas: Canvas) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = canvas.toJSON() as any;
    json.width = canvas.getWidth();
    json.height = canvas.getHeight();
    // backgroundColor puede ser string o pattern; tomar tal cual o blanco
    json.background = canvas.backgroundColor ?? "#ffffff";
    return json;
  }, []);

  /** Cambia a otra página. Serializa el canvas actual antes de cargar la
   *  nueva, así no se pierde el trabajo. */
  const switchTo = useCallback(
    (index: number, canvas: Canvas | null) => {
      if (index < 0 || index >= pages.length) return;
      if (index === activeIndex) return;
      // Serializar la activa preservando width/height/background
      if (canvas) {
        const fabricJson = serializeCanvasFull(canvas);
        setPages((prev) =>
          prev.map((p, i) => (i === activeIndex ? { ...p, fabric: fabricJson } : p)),
        );
      }
      // Preparar la nueva para que el editor la cargue en su useEffect
      pendingFabricRef.current = pages[index]?.fabric ?? null;
      setActiveIndex(index);
    },
    [activeIndex, pages, serializeCanvasFull],
  );

  /** Añade una página vacía al final con las dimensiones de la activa. */
  const addPage = useCallback(
    (canvas: Canvas | null, name?: string) => {
      const active = pages[activeIndex];
      const width = active?.width || 1080;
      const height = active?.height || 1350;
      const newPage = newEmptyPage(
        width,
        height,
        name || `Página ${pages.length + 1}`,
      );
      // Serializar la activa antes de cambiar — usar serializeCanvasFull
      // para preservar dimensiones y background.
      if (canvas) {
        const fabricJson = serializeCanvasFull(canvas);
        setPages((prev) => {
          const updated = prev.map((p, i) =>
            i === activeIndex ? { ...p, fabric: fabricJson } : p,
          );
          return [...updated, newPage];
        });
      } else {
        setPages((prev) => [...prev, newPage]);
      }
      pendingFabricRef.current = newPage.fabric;
      setActiveIndex(pages.length); // será el nuevo último índice
    },
    [activeIndex, pages, serializeCanvasFull],
  );

  /** Duplica la página dada (o la activa si no se especifica). */
  const duplicate = useCallback(
    (index: number = activeIndex, canvas: Canvas | null) => {
      const source = pages[index];
      if (!source) return;
      // Si duplicamos la activa, primero serializar el canvas para
      // capturar las ediciones no guardadas
      let sourceWithLatest = source;
      if (index === activeIndex && canvas) {
        sourceWithLatest = { ...source, fabric: canvas.toJSON() };
      }
      const copy = duplicatePage(
        sourceWithLatest,
        pages.map((p) => p.name),
      );
      // Insertar después de la fuente
      setPages((prev) => {
        const next = [...prev];
        if (index === activeIndex && canvas) {
          next[index] = sourceWithLatest;
        }
        next.splice(index + 1, 0, copy);
        return next;
      });
      pendingFabricRef.current = copy.fabric;
      setActiveIndex(index + 1);
    },
    [activeIndex, pages],
  );

  /** Borra una página. Si solo queda 1, no hace nada. */
  const remove = useCallback(
    (index: number, canvas: Canvas | null) => {
      if (pages.length <= 1) return;
      const willBeActive = index < activeIndex ? activeIndex - 1 : Math.min(activeIndex, pages.length - 2);
      setPages((prev) => prev.filter((_, i) => i !== index));
      // Si la página borrada es la activa, cargar la nueva activa
      if (index === activeIndex) {
        const newPages = pages.filter((_, i) => i !== index);
        pendingFabricRef.current = newPages[willBeActive]?.fabric ?? null;
      } else if (canvas) {
        // Si no, mantener el canvas actual (serializar para no perder cambios)
        const fabricJson = canvas.toJSON();
        setPages((prev) => prev.map((p, i) => (i === activeIndex ? { ...p, fabric: fabricJson } : p)));
      }
      setActiveIndex(willBeActive);
    },
    [activeIndex, pages],
  );

  /** Renombra una página. */
  const rename = useCallback((index: number, name: string) => {
    setPages((prev) => prev.map((p, i) => (i === index ? { ...p, name: name.trim() || p.name } : p)));
  }, []);

  /** Devuelve el JSON listo para guardar en Supabase. Llamar antes de
   *  cada save con el canvas activo para capturar las ediciones. */
  const serializeForSave = useCallback(
    (canvas: Canvas | null): ProjectPages => {
      let finalPages = pages;
      if (canvas) {
        const fabricJson = serializeCanvasFull(canvas);
        finalPages = pages.map((p, i) => (i === activeIndex ? { ...p, fabric: fabricJson } : p));
      }
      return serializePages({ pages: finalPages, activeIndex });
    },
    [pages, activeIndex, serializeCanvasFull],
  );

  /** Consumido por el useEffect del editor: lee y limpia el "pending fabric"
   *  para hacer canvas.loadFromJSON. Devuelve null si no hay pendiente. */
  const consumePendingFabric = useCallback(() => {
    const pending = pendingFabricRef.current;
    pendingFabricRef.current = null;
    return pending;
  }, []);

  return {
    pages,
    activeIndex,
    initialized,
    activePage: pages[activeIndex] ?? null,
    pageCount: pages.length,
    hydrate,
    switchTo,
    addPage,
    duplicate,
    remove,
    rename,
    serializeForSave,
    consumePendingFabric,
  };
}
