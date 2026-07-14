"use client";

import React, { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";

/**
 * Fila de avatares superpuestos con tooltip animado al pasar el ratón.
 * Adaptado de 21st.dev ("Animated Tooltip"):
 *  - usa <img> normal (el proyecto NO tiene config de next/image → los
 *    avatares vienen de R2 y se pintan con <img>, igual que las cards).
 *  - sin dependencia de `cn` (no existe en el repo).
 *  - `image` acepta null → dibuja un círculo con la inicial.
 * Nota: el tooltip es hover (ratón). En móvil (táctil) se ve la tira de
 * avatares, pero el tooltip solo aparece en escritorio.
 */
export type TooltipItem = {
  id: string;
  name: string;
  designation: string;
  image: string | null;
};

export function AnimatedTooltip({
  items,
  className = "",
}: {
  items: TooltipItem[];
  className?: string;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);
  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const halfWidth = event.currentTarget.offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  const initial = (name: string) => (name.trim()[0] || "?").toUpperCase();

  return (
    <div className={`flex items-center ${className}`}>
      {items.map((item) => (
        <div
          className="-mr-4 relative group"
          key={item.id}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredId === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 260, damping: 10 },
                }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                style={{ translateX, rotate, whiteSpace: "nowrap" }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-center rounded-lg bg-[#0a0a14] px-4 py-2 shadow-xl border border-white/10"
              >
                <div className="absolute inset-x-10 z-30 w-[20%] -bottom-px bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent h-px" />
                <div className="absolute left-10 w-[40%] z-30 -bottom-px bg-gradient-to-r from-transparent via-purple-500 to-transparent h-px" />
                <div className="font-bold text-white relative z-30 text-sm">
                  {item.name}
                </div>
                {item.designation && (
                  <div className="text-gray-400 text-xs">{item.designation}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              onMouseMove={handleMouseMove}
              src={item.image}
              alt={item.name}
              className="object-cover object-top rounded-full h-12 w-12 border-2 border-[#0a0a14] group-hover:scale-105 group-hover:z-30 relative transition duration-500"
            />
          ) : (
            <div
              onMouseMove={handleMouseMove}
              className="rounded-full h-12 w-12 border-2 border-[#0a0a14] bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 group-hover:z-30 relative transition duration-500"
            >
              {initial(item.name)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
