"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StaticCanvas } from "fabric";
import { templates, getVariant } from "@/data/templates";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import type { FormatId } from "@/data/formats";

/**
 * Pinta una plantilla a tamaño nativo y avisa cuando ha terminado.
 *
 * El aviso es lo importante: `applyTemplateLayers` carga imágenes de R2 de
 * forma asíncrona, así que capturar sin esperar da flyers a medio dibujar.
 * Al acabar marca `data-thumb-state="ready"` en el <body> y Playwright espera
 * a ese atributo. Si algo peta, marca "error" para que el script lo cuente
 * como fallo en vez de subir un PNG en blanco.
 */
export default function ThumbRenderer() {
  const params = useSearchParams();
  const id = Number(params.get("id"));
  const format = (params.get("format") ?? "square") as FormatId;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const marcar = (estado: string) => {
      document.body.dataset.thumbState = estado;
    };
    marcar("loading");

    const full = templates.find((t) => t.id === id);
    if (!full) { marcar("error"); return; }

    const variant = getVariant(full, format);
    setSize({ w: variant.width, h: variant.height });

    const el = canvasRef.current;
    if (!el) { marcar("error"); return; }

    const canvas = new StaticCanvas(el, {
      width: variant.width,
      height: variant.height,
      backgroundColor: "#080812",
      renderOnAddRemove: true,
      enableRetinaScaling: false,
      imageSmoothingEnabled: true,
    });

    (async () => {
      try {
        await applyTemplateLayers(canvas, variant.layers);
        canvas.renderAll();
        // Un frame extra: renderAll() encola el pintado real en el canvas.
        requestAnimationFrame(() => requestAnimationFrame(() => marcar("ready")));
      } catch {
        marcar("error");
      }
    })();

    return () => { void canvas.dispose(); };
  }, [id, format]);

  return (
    <div style={{ margin: 0, background: "#080812" }}>
      <canvas
        ref={canvasRef}
        id="thumb-canvas"
        width={size?.w ?? 1080}
        height={size?.h ?? 1350}
        style={{ display: "block" }}
      />
    </div>
  );
}
