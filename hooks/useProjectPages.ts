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

  /** Serializa el canvas preservando width/height/background + custom
   *  properties. CRITICO: width/height NO se leen de canvas.getWidth()
   *  porque eso devuelve el CSS width del canvas (que es el del wrapper
   *  tras fitToView, no las dims logicas del flyer). Hay que pasarlas
   *  como parametro explicito. */
  const serializeCanvasFull = useCallback(
    (canvas: Canvas, logicalWidth: number, logicalHeight: number) => {
      // Lista de propiedades custom que el editor anade a objetos Fabric.
      const customProps = [
        "data", "name", "customType",
        "magicLayerId", "magicLayerInfo", "magicLabel",
        "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY",
        "selectable", "evented", "perPixelTargetFind",
        "crossOrigin", "src", "filters",
        "originalSrc", "extractedFrom",
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json = (canvas.toJSON as any)(customProps);
      json.width = logicalWidth;
      json.height = logicalHeight;
      json.background = canvas.backgroundColor ?? "#ffffff";
      return json;
    },
    [],
  );

  /** Z.25 — captura un thumbnail JPEG inline para mostrar en el
   *  PagesSheet. Muy chico (max 200px en el lado mas largo) para no
   *  inflar el state. Quality 0.6 es suficiente para una miniatura. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const captureThumbnail = useCallback((canvas: any): string | undefined => {
    try {
      const w = canvas.getWidth();
      const h = canvas.getHeight();
      if (!w || !h) return undefined;
      const maxSide = 200;
      const scale = maxSide / Math.max(w, h);
      return canvas.toDataURL({ format: "jpeg", quality: 0.6, multiplier: scale });
    } catch {
      return undefined;
    }
  }, []);

  /** Cambia a otra página. Serializa el canvas actual antes de cargar la
   *  nueva, así no se pierde el trabajo. Recibe las dimensiones LOGICAS
   *  del flyer activo (NO leer de canvas.getWidth() que es CSS). */
  const switchTo = useCallback(
    (index: number, canvas: Canvas | null, logicalWidth?: number, logicalHeight?: number) => {
      if (index < 0 || index >= pages.length) return;
      if (index === activeIndex) return;
      const active = pages[activeIndex];
      const w = logicalWidth ?? active?.width ?? 1080;
      const h = logicalHeight ?? active?.height ?? 1350;
      // Serializar la activa preservando width/height/background + thumbnail
      if (canvas) {
        const fabricJson = serializeCanvasFull(canvas, w, h);
        const thumbnail = captureThumbnail(canvas);
        setPages((prev) =>
          prev.map((p, i) => (i === activeIndex ? { ...p, fabric: fabricJson, thumbnail, width: w, height: h } : p)),
        );
      }
      pendingFabricRef.current = pages[index]?.fabric ?? null;
      setActiveIndex(index);
    },
    [activeIndex, pages, serializeCanvasFull, captureThumbnail],
  );

  /** Añade una página vacía. Recibe dimensiones LOGICAS del flyer
   *  (canvasSize del componente padre) — NO canvas.getWidth() porque
   *  ese es el CSS width tras fitToView (= tamaño wrapper, no flyer). */
  const addPage = useCallback(
    (canvas: Canvas | null, logicalWidth?: number, logicalHeight?: number, name?: string) => {
      // Lazy init: la primera vez en modo template nuevo
      if (pages.length === 0 && canvas) {
        const w = logicalWidth ?? 1080;
        const h = logicalHeight ?? 1350;
        const initialFabric = serializeCanvasFull(canvas, w, h);
        const initialThumbnail = captureThumbnail(canvas);
        const initialPage: PageData = {
          name: "Página 1",
          fabric: initialFabric,
          thumbnail: initialThumbnail,
          width: w,
          height: h,
        };
        const newPage = newEmptyPage(w, h, name || "Página 2");
        setPages([initialPage, newPage]);
        pendingFabricRef.current = newPage.fabric;
        setActiveIndex(1);
        setInitialized(true);
        return;
      }
      const active = pages[activeIndex];
      const w = logicalWidth ?? active?.width ?? 1080;
      const h = logicalHeight ?? active?.height ?? 1350;
      const newPage = newEmptyPage(w, h, name || `Página ${pages.length + 1}`);
      if (canvas) {
        const fabricJson = serializeCanvasFull(canvas, w, h);
        const thumbnail = captureThumbnail(canvas);
        setPages((prev) => {
          const updated = prev.map((p, i) =>
            i === activeIndex ? { ...p, fabric: fabricJson, thumbnail, width: w, height: h } : p,
          );
          return [...updated, newPage];
        });
      } else {
        setPages((prev) => [...prev, newPage]);
      }
      pendingFabricRef.current = newPage.fabric;
      setActiveIndex(pages.length);
    },
    [activeIndex, pages, serializeCanvasFull, captureThumbnail],
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

  /** Z.25 — Actualiza el thumbnail de la pagina activa SIN cambiar de pagina.
   *  Tambien hace lazy-init si pages esta vacio.
   *  Recibe dimensiones LOGICAS del flyer (no canvas.getWidth/Height). */
  const refreshActiveThumbnail = useCallback(
    (canvas: Canvas | null, logicalWidth?: number, logicalHeight?: number) => {
      if (!canvas) return;
      const thumbnail = captureThumbnail(canvas);
      if (!thumbnail) return;
      if (pages.length === 0) {
        const w = logicalWidth ?? 1080;
        const h = logicalHeight ?? 1350;
        const fabric = serializeCanvasFull(canvas, w, h);
        setPages([{
          name: "Página 1",
          fabric,
          thumbnail,
          width: w,
          height: h,
        }]);
        setActiveIndex(0);
        setInitialized(true);
        return;
      }
      setPages((prev) => prev.map((p, i) => (i === activeIndex ? { ...p, thumbnail } : p)));
    },
    [activeIndex, pages.length, captureThumbnail, serializeCanvasFull],
  );

  /** Devuelve el JSON listo para guardar en Supabase. Llamar antes de
   *  cada save con el canvas activo para capturar las ediciones. */
  const serializeForSave = useCallback(
    (canvas: Canvas | null, logicalWidth?: number, logicalHeight?: number): ProjectPages => {
      let finalPages = pages;
      if (canvas) {
        const active = pages[activeIndex];
        const w = logicalWidth ?? active?.width ?? 1080;
        const h = logicalHeight ?? active?.height ?? 1350;
        const fabricJson = serializeCanvasFull(canvas, w, h);
        finalPages = pages.map((p, i) => (i === activeIndex ? { ...p, fabric: fabricJson, width: w, height: h } : p));
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
    refreshActiveThumbnail,
    serializeForSave,
    consumePendingFabric,
  };
}
