"use client";

import { useEffect, useState } from "react";

/**
 * Palabra que va cambiando ("tu academia", "tu productora"…) manteniendo el
 * degradado de marca. El cambio es un cross-fade vertical corto.
 *
 * Vivía dentro de app/(main)/page.tsx; se saca aquí porque ahora la usan dos
 * sitios: el h1 del hero y el rótulo del carrusel 3D (FlyerSurfer).
 *
 * El ancho se autoajusta. Donde se use, conviene que sea el último elemento
 * de su línea o que tenga línea propia — si no, cada cambio de palabra
 * desplaza lo que venga detrás.
 */
export default function RotatingHighlight({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (words.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      // Tras el fade-out (300ms) elegir una palabra DISTINTA al azar y fade-in.
      setTimeout(() => {
        setIdx(prev => {
          let next = prev;
          while (next === prev) next = Math.floor(Math.random() * words.length);
          return next;
        });
        setVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span
      className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent inline-block transition-all duration-300 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(0.25em)",
      }}
    >
      {words[idx] ?? ""}
    </span>
  );
}
