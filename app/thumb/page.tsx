import { Suspense } from "react";
import { notFound } from "next/navigation";
import ThumbRenderer from "./ThumbRenderer";

/**
 * Ruta INTERNA de build, no forma parte del producto.
 *
 * Renderiza UNA plantilla a tamaño nativo (1080×1350) sin ninguna interfaz
 * alrededor, para que `scripts/flyer-thumbs.mjs` la capture con Playwright y
 * suba el PNG a R2. Usa exactamente el mismo `applyTemplateLayers` que el
 * editor, así que el PNG es idéntico a lo que ve el usuario.
 *
 * Devuelve 404 en producción: nadie debe poder llegar aquí desde la web.
 *
 * Uso: /thumb?id=59&format=square
 */
export default function ThumbPage() {
  if (process.env.NODE_ENV === "production") notFound();
  // Suspense obligatorio: ThumbRenderer usa useSearchParams().
  return (
    <Suspense fallback={null}>
      <ThumbRenderer />
    </Suspense>
  );
}
