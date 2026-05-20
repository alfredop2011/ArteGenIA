"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type MotionValue } from "framer-motion";
import {
    Square,
    Smartphone,
    RectangleVertical,
    ImageIcon,
    Check,
    type LucideIcon,
} from "lucide-react";

type FormatId = "square" | "story" | "portrait" | "fb-cover";

export type FormatDestinationPickerProps = {
    selectedFormat: FormatId;
    onFormatChange: (id: FormatId) => void;
    counts: Record<FormatId, number>;
};

type Accent = "pinkOrange" | "violetBlue" | "purpleMagenta" | "blueCyan";

type FormatOption = {
    id: FormatId;
    title: string;
    description: string;
    icon: LucideIcon;
    accent: Accent;
};

const FORMAT_OPTIONS: FormatOption[] = [
    { id: "square",   title: "Post de Instagram",     description: "Cuadrado, para feed",        icon: Square,            accent: "pinkOrange" },
    { id: "story",    title: "Historia de Instagram", description: "Pantalla completa, Stories", icon: Smartphone,        accent: "violetBlue" },
    { id: "portrait", title: "Post vertical",         description: "Para Instagram y TikTok",    icon: RectangleVertical, accent: "purpleMagenta" },
    { id: "fb-cover", title: "Portada de Facebook",   description: "Cabecera de perfil/página",  icon: ImageIcon,         accent: "blueCyan" },
];

const ACCENT_GRADIENT: Record<Accent, string> = {
    pinkOrange:    "linear-gradient(135deg, #ec4899 0%, #f97316 100%)",
    violetBlue:    "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
    purpleMagenta: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
    blueCyan:      "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
};

const ACCENT_GLOW: Record<Accent, string> = {
    pinkOrange:    "rgba(236,72,153,0.45)",
    violetBlue:    "rgba(139,92,246,0.45)",
    purpleMagenta: "rgba(168,85,247,0.45)",
    blueCyan:      "rgba(59,130,246,0.45)",
};

/* ──────────────────────────────────────────────────────────────────────
 *  Card compacta estilo Apple Vision Pro
 *  - Glass material con backdrop-blur fuerte
 *  - Lift sutil en hover (-4px) con sombra elevada
 *  - Spotlight radial que sigue al cursor
 *  - Si seleccionada: halo respirando + glow del accent
 * ────────────────────────────────────────────────────────────────── */

type CardProps = {
    option: FormatOption;
    isSelected: boolean;
    isDisabled: boolean;
    count: number;
    onClick: () => void;
    reduceMotion: boolean;
};

function GlassCard({ option, isSelected, isDisabled, count, onClick, reduceMotion }: CardProps) {
    const Icon = option.icon;
    const cardRef = useRef<HTMLButtonElement>(null);

    // Spotlight: posición del cursor dentro de la card en %
    const mouseX = useMotionValue(50);
    const mouseY = useMotionValue(50);
    const spotlightOpacity = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isDisabled) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseEnter = () => {
        if (!isDisabled) spotlightOpacity.set(1);
    };

    const handleMouseLeave = () => {
        spotlightOpacity.set(0);
    };

    return (
        <motion.button
            ref={cardRef}
            type="button"
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            disabled={isDisabled}
            aria-pressed={isSelected}
            aria-disabled={isDisabled}
            whileHover={!isDisabled && !reduceMotion ? { y: -4 } : undefined}
            whileTap={!isDisabled && !reduceMotion ? { y: -1, scale: 0.985 } : undefined}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className={[
                "group relative flex items-center gap-3 w-full overflow-hidden rounded-2xl px-3.5 py-3 text-left",
                "border border-white/[0.10]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070711]",
                isDisabled ? "cursor-not-allowed opacity-50" : "hover:border-white/[0.18]",
                isSelected ? "border-white/[0.22]" : "",
            ].join(" ")}
            style={{
                // Glass material — fondo translúcido + blur ya viene de backdrop
                background: isSelected
                    ? `linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))`
                    : `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
                backdropFilter: "blur(20px) saturate(140%)",
                WebkitBackdropFilter: "blur(20px) saturate(140%)",
                boxShadow: isSelected
                    ? `0 8px 32px ${ACCENT_GLOW[option.accent]}, 0 0 0 1px rgba(255,255,255,0.10) inset`
                    : "0 4px 16px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}
        >
            {/* SPOTLIGHT — zona iluminada que sigue al cursor */}
            {!reduceMotion && !isDisabled && (
                <Spotlight mouseX={mouseX} mouseY={mouseY} opacity={spotlightOpacity} accent={option.accent} />
            )}

            {/* HALO RESPIRANDO — solo si seleccionada */}
            {isSelected && !reduceMotion && (
                <motion.div
                    className="pointer-events-none absolute -inset-px rounded-2xl"
                    aria-hidden
                    animate={{ opacity: [0.4, 0.75, 0.4] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        background: `radial-gradient(circle at 30% 30%, ${ACCENT_GLOW[option.accent]}, transparent 60%)`,
                    }}
                />
            )}

            {/* Borde luminoso superior (highlight Apple-style) */}
            <div
                className="pointer-events-none absolute inset-x-3 top-px h-px"
                style={{
                    background: isSelected
                        ? `linear-gradient(90deg, transparent, ${ACCENT_GLOW[option.accent]}, transparent)`
                        : "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                }}
            />

            {/* ICONO con gradiente del accent (más pequeño) */}
            <div
                className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                    background: isSelected
                        ? ACCENT_GRADIENT[option.accent]
                        : "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
                    boxShadow: isSelected
                        ? `0 4px 16px ${ACCENT_GLOW[option.accent]}, inset 0 1px 0 rgba(255,255,255,0.25)`
                        : "inset 0 1px 0 rgba(255,255,255,0.10)",
                }}
            >
                <Icon
                    size={18}
                    strokeWidth={2}
                    className={`relative ${isSelected ? "text-white" : isDisabled ? "text-gray-600" : "text-white/90"}`}
                />
            </div>

            {/* TEXTO */}
            <div className="relative flex-1 min-w-0">
                <h3 className={`text-[13px] font-semibold leading-tight truncate ${isDisabled ? "text-gray-500" : "text-white"}`}>
                    {option.title}
                </h3>
                <p className={`text-[11px] mt-0.5 leading-tight truncate ${isDisabled ? "text-gray-700" : "text-gray-400"}`}>
                    {option.description}
                </p>
                <p
                    className={`text-[10px] mt-1 font-medium truncate ${
                        isDisabled
                            ? "text-gray-700"
                            : isSelected
                                ? "text-white/80"
                                : "text-purple-300/70"
                    }`}
                >
                    {count === 0
                        ? "Próximamente"
                        : count === 1
                            ? "1 plantilla"
                            : `${count} plantillas`}
                </p>
            </div>

            {/* CHECK seleccionado */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="relative w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{
                        background: ACCENT_GRADIENT[option.accent],
                        boxShadow: `0 2px 8px ${ACCENT_GLOW[option.accent]}`,
                    }}
                    aria-hidden
                >
                    <Check size={11} strokeWidth={3.2} className="text-white" />
                </motion.div>
            )}
        </motion.button>
    );
}

/* Spotlight: usa MotionValues directos en CSS para máxima performance */
function Spotlight({
    mouseX,
    mouseY,
    opacity,
    accent,
}: {
    mouseX: MotionValue<number>;
    mouseY: MotionValue<number>;
    opacity: MotionValue<number>;
    accent: Accent;
}) {
    const smoothOpacity = useSpring(opacity, { stiffness: 300, damping: 30 });
    const background = useTransform([mouseX, mouseY], ([mx, my]) =>
        `radial-gradient(180px circle at ${mx}% ${my}%, ${ACCENT_GLOW[accent]}, transparent 60%)`
    );

    return (
        <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ background, opacity: smoothOpacity }}
            aria-hidden
        />
    );
}

/* ──────────────────────────────────────────────────────────────────────
 *  Componente principal
 * ────────────────────────────────────────────────────────────────── */

export default function FormatDestinationPicker({
    selectedFormat,
    onFormatChange,
    counts,
}: FormatDestinationPickerProps) {
    const reduceMotionPref = useReducedMotion();
    const reduceMotion = reduceMotionPref ?? false;

    const [particles, setParticles] = useState<Array<{ x: number; y: number; size: number; delay: number }>>([]);
    useEffect(() => {
        setParticles(Array.from({ length: 5 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 1.5 + Math.random() * 2,
            delay: Math.random() * 4,
        })));
    }, []);

    return (
        <section
            aria-label="Selector de formato"
            className="relative mb-6 overflow-hidden rounded-3xl border p-5"
            style={{
                borderColor: "rgba(255,255,255,0.07)",
                background:
                    "radial-gradient(circle at 20% 0%, rgba(139, 92, 246, 0.14), transparent 38%), linear-gradient(180deg, rgba(17,17,29,0.92), rgba(9,9,17,0.92))",
            }}
        >
            {/* Orbs decorativos sutiles */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-20 -right-12 w-56 h-56 rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(168,85,247,0.14), transparent 70%)",
                    filter: "blur(40px)",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full"
                style={{
                    background: "radial-gradient(circle, rgba(236,72,153,0.08), transparent 70%)",
                    filter: "blur(50px)",
                }}
            />

            {!reduceMotion && (
                <div aria-hidden className="pointer-events-none absolute inset-0">
                    {particles.map((p, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-white/40"
                            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
                            animate={{ y: [0, -8, 0], opacity: [0.2, 0.6, 0.2] }}
                            transition={{ duration: 4 + p.delay, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
                        />
                    ))}
                </div>
            )}

            {/* Header */}
            <div className="relative mb-4 flex flex-col gap-0.5">
                <h2 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-purple-300/90">
                    ¿Para dónde lo quieres?
                </h2>
                <p className="text-xs text-gray-400">
                    Elige el formato ideal para tu diseño
                </p>
            </div>

            {/* Grid compacto */}
            <div className="relative grid gap-2.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {FORMAT_OPTIONS.map((opt) => {
                    const count = counts[opt.id] ?? 0;
                    const isDisabled = count === 0;
                    const isSelected = selectedFormat === opt.id && !isDisabled;
                    return (
                        <GlassCard
                            key={opt.id}
                            option={opt}
                            isSelected={isSelected}
                            isDisabled={isDisabled}
                            count={count}
                            onClick={() => !isDisabled && onFormatChange(opt.id)}
                            reduceMotion={reduceMotion}
                        />
                    );
                })}
            </div>
        </section>
    );
}
