"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  type MotionValue,
} from "framer-motion";
import { FLYERS_SHOWCASE } from "@/data/flyerShowcase";

/**
 * Carrusel 3D de flyers reales del catálogo, gobernado por el scroll.
 *
 * Diferencias con el componente original del que sale:
 *
 *  1. Es una SECCIÓN, no la página. El original usaba un espaciador de
 *     50.000px + `fixed inset-0`, lo que se lleva por delante el resto del
 *     home. Aquí el espaciador es proporcional al número de flyers y lo fijo
 *     es un `sticky` dentro de la propia sección, así que el hero, el
 *     buscador y la rejilla siguen funcionando.
 *  2. Sin bucle infinito. El original duplicaba la lista para poder dar
 *     vueltas; con scroll acotado no hace falta y ahorra la mitad de las
 *     imágenes.
 *  3. Los flyers son <img> de R2 (ver scripts/flyer-thumbs.mjs), no canvas
 *     de Fabric: esto es la home y no puede pagar 12 renders de Fabric.
 *  4. Respeta prefers-reduced-motion con una rejilla estática.
 */

// Cuánto scroll cuesta cada flyer. Súbelo para que vaya más lento (y la
// sección se haga más larga). Con 12 flyers esto son ~2 pantallas extra de
// scroll en el home: es el precio del efecto, y va justo después del hero
// para que quien solo quiere buscar plantillas lo cruce pronto.
const VH_POR_FLYER = { movil: 12, escritorio: 16 };

// Altura de la barra de navegación (header sticky de 56px). La escena se
// coloca DEBAJO para que el menú del sitio siga visible y clicable mientras
// se surfea, y para que el rótulo no quede tapado por él.
const CABECERA = 56;

// El "paso" entre tarjetas define la diagonal por la que se surfea. Los pasos
// van a 0,8× el ancho de la tarjeta: es lo que da el solape del original.
// `origen` = perspective-origin. En escritorio va arriba a la izquierda (como
// el original) porque hay sitio de sobra; en movil los flyers se marchaban a
// la esquina inferior derecha y media pantalla quedaba vacia, asi que el punto
// de fuga se centra.
const GEOMETRIA = {
  movil:       { ancho: 200, alto: 250, x: 160, y: -56, z: -192, perspectiva: 1200, origen: "50% 40%" },
  escritorio:  { ancho: 340, alto: 425, x: 272, y: -95, z: -326, perspectiva: 2000, origen: "10% 10%" },
};

// Alto de la barra de navegacion inferior de movil (nav fixed de 65px). El CTA
// tiene que quedar por encima o no se puede pulsar.
const NAV_MOVIL = 65;

/** true mientras el usuario tenga activado "reducir movimiento" en su sistema. */
function useMenosMovimiento() {
  const [reducido, setReducido] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducido(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reducido;
}

/** Ancho de pantalla → preset de geometría. */
function useEsMovil() {
  const [esMovil, setEsMovil] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setEsMovil(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return esMovil;
}

export default function FlyerSurfer() {
  const flyers = FLYERS_SHOWCASE;
  const seccionRef = useRef<HTMLElement>(null);
  const esMovil = useEsMovil();
  const menosMovimiento = useMenosMovimiento();

  const geo = esMovil ? GEOMETRIA.movil : GEOMETRIA.escritorio;
  const vhPorFlyer = esMovil ? VH_POR_FLYER.movil : VH_POR_FLYER.escritorio;

  // Progreso 0→1 mientras la sección atraviesa el viewport.
  const { scrollYProgress } = useScroll({
    target: seccionRef,
    offset: ["start start", "end end"],
  });
  const progreso = useSpring(scrollYProgress, { mass: 0.1, stiffness: 100, damping: 20 });

  // La pista retrocede lo justo para que el ÚLTIMO flyer acabe en el centro.
  const ultimo = Math.max(flyers.length - 1, 1);
  const x = useTransform(progreso, [0, 1], [0, -ultimo * geo.x]);
  const y = useTransform(progreso, [0, 1], [0, -ultimo * geo.y]);
  const z = useTransform(progreso, [0, 1], [0, -ultimo * geo.z]);

  // Ratón para el efecto imán. Arranca fuera de pantalla para que ninguna
  // tarjeta nazca escalada. En táctil nunca se mueve → todas a escala 1.
  const ratonX = useMotionValue(-10000);
  const ratonY = useMotionValue(-10000);

  // Con "reducir movimiento" no hay 3D ni scroll secuestrado: rejilla y fuera.
  if (menosMovimiento) {
    return (
      <section className="px-5 py-16">
        <Cabecera total={flyers.length} />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {flyers.slice(0, 8).map((f) => (
            <Link key={f.id} href={`/editor/${f.id}?format=portrait`} className="block rounded-xl overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.src} alt={f.titulo} loading="lazy" className="w-full h-auto" />
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={seccionRef}
      className="relative"
      style={{ height: `${100 + flyers.length * vhPorFlyer}vh` }}
    >
      <div
        className="sticky overflow-hidden bg-[#07070d]"
        style={{ top: CABECERA, height: `calc(100vh - ${CABECERA}px)` }}
        onMouseMove={(e) => { ratonX.set(e.clientX); ratonY.set(e.clientY); }}
        onMouseLeave={() => { ratonX.set(-10000); ratonY.set(-10000); }}
      >
        {/* Rótulo. mix-blend-difference para que se lea sobre cualquier flyer. */}
        <div className="absolute top-6 left-5 sm:top-8 sm:left-[4vw] z-30 pointer-events-none mix-blend-difference max-w-[90vw]">
          <Cabecera total={flyers.length} />
        </div>

        {/* Abajo a la IZQUIERDA en escritorio: alineado con el rótulo y lejos
            tanto del flyer central como de la burbuja de chat, que vive en la
            esquina inferior derecha. En movil, centrado (donde llega el pulgar). */}
        <div
          className="absolute left-0 right-0 sm:right-auto sm:left-[4vw] z-30 flex flex-col items-center sm:items-start gap-2 px-5 sm:px-0"
          style={{ bottom: esMovil ? NAV_MOVIL + 16 : 24 }}
        >
          <Link
            href="/templates"
            className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white font-bold text-[14px] shadow-xl shadow-purple-500/40"
          >
            Ver las {flyers.length > 12 ? flyers.length : "80"} plantillas
          </Link>
          <span className="font-mono text-[10px] tracking-widest uppercase text-white/50">
            desliza para surfear
          </span>
        </div>

        {/* Escena 3D */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: `${geo.perspectiva}px`, perspectiveOrigin: geo.origen }}
        >
          <motion.div className="relative w-0 h-0" style={{ x, y, z, transformStyle: "preserve-3d" }}>
            {flyers.map((f, i) => (
              <Tarjeta
                key={f.id}
                flyer={f}
                i={i}
                geo={geo}
                ratonX={ratonX}
                ratonY={ratonY}
                progreso={progreso}
                prioritaria={i < 3}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Cabecera({ total }: { total: number }) {
  return (
    <>
      <h2 className="font-black text-[clamp(1.9rem,6vw,4.5rem)] leading-[0.92] tracking-tighter text-white">
        PLANTILLAS DE FLYER
      </h2>
      <h2 className="font-black text-[clamp(1.9rem,6vw,4.5rem)] leading-[0.92] tracking-tighter text-white">
        PARA TU EVENTO
        <span className="text-[0.3em] align-top relative top-[0.7em] ml-2 font-mono tabular-nums">
          ({String(total).padStart(2, "0")})
        </span>
      </h2>
      {/* Qué es la herramienta: el rótulo de arriba dice QUÉ hay, esta línea
          dice QUÉ ES esto. Sin ella el bloque es una galería sin contexto. */}
      <p className="mt-3 max-w-md text-[13px] sm:text-[15px] leading-snug text-white/70">
        Editor con IA para fiestas, clases de baile y conciertos. Cambia
        textos, fotos y colores — y lo descargas listo para Instagram.
      </p>
    </>
  );
}

function Tarjeta({
  flyer, i, geo, ratonX, ratonY, progreso, prioritaria,
}: {
  flyer: { id: number; titulo: string; src: string };
  i: number;
  geo: (typeof GEOMETRIA)["escritorio"];
  ratonX: MotionValue<number>;
  ratonY: MotionValue<number>;
  progreso: MotionValue<number>;
  prioritaria: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  // Distancia del ratón al centro de la tarjeta. Depende también del
  // progreso del scroll porque al moverse la pista cambia dónde está cada una.
  const distancia = useTransform([ratonX, ratonY, progreso], ([mx, my]) => {
    const el = ref.current;
    if (!el) return 9999;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return Math.hypot(Number(mx) - cx, Number(my) - cy);
  });

  const escalaObjetivo = useTransform(distancia, [0, 400], [1.35, 1]);
  const escala = useSpring(escalaObjetivo, { mass: 0.5, stiffness: 300, damping: 20 });

  const transform = useTransform(escala, (s) =>
    `translate3d(${i * geo.x}px, ${i * geo.y}px, ${i * geo.z}px) rotateY(-50deg) scale(${Number(s)})`,
  );

  return (
    <motion.a
      ref={ref}
      href={`/editor/${flyer.id}?format=portrait`}
      aria-label={`Abrir la plantilla ${flyer.titulo} en el editor`}
      className="absolute block overflow-hidden rounded-lg bg-neutral-900 shadow-2xl group"
      style={{ width: geo.ancho, height: geo.alto, transform, transformStyle: "preserve-3d" }}
    >
      <span className="absolute -top-5 -left-3 z-10 font-mono text-[10px] text-white/50">
        {String(i + 1).padStart(2, "0")}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flyer.src}
        alt={flyer.titulo}
        loading={prioritaria ? "eager" : "lazy"}
        draggable={false}
        className="w-full h-full object-cover brightness-[0.8] group-hover:brightness-100 transition-[filter] duration-300"
      />
      <span className="absolute inset-0 bg-gradient-to-tr from-black/25 to-transparent pointer-events-none" />
    </motion.a>
  );
}
