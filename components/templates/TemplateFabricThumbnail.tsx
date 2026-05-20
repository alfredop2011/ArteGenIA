"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StaticCanvas } from "fabric";
import type { Template } from "@/data/templates";
import { getVariant } from "@/data/templates";
import type { FormatId } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";

type TemplateFabricThumbnailProps = {
    template: Template;
    formatId?: FormatId;
    className?: string;
};

/**
 * Miniatura WYSIWYG: mismo modelo de capas que el editor (Fabric), escalado al hueco de la tarjeta.
 * Si no se pasa formatId, usa la primera variante de la plantilla.
 */
export default function TemplateFabricThumbnail({ template, formatId, className = "" }: TemplateFabricThumbnailProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const [scale, setScale] = useState(0.2);

    const variant = getVariant(template, formatId);

    useLayoutEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const measure = () => {
            const cr = node.getBoundingClientRect();
            // Sin padding: que la plantilla ocupe el máximo posible dentro del card
            // manteniendo el aspect ratio (igual que object-fit: contain)
            const sx = cr.width / variant.width;
            const sy = cr.height / variant.height;
            const s = Math.min(sx, sy);
            setScale(Number.isFinite(s) && s > 0 ? s : 0.15);
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(node);
        return () => ro.disconnect();
    }, [variant.width, variant.height]);

    useEffect(() => {
        const el = canvasElRef.current;
        if (!el) return;

        const canvas = new StaticCanvas(el, {
            width: variant.width,
            height: variant.height,
            backgroundColor: "#080812",
            renderOnAddRemove: true,
            enableRetinaScaling: false,
            imageSmoothingEnabled: true,
        });

        const render = async () => {
            await applyTemplateLayers(canvas, variant.layers);
            canvas.renderAll();
        };

        void render();

        return () => {
            void canvas.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- capas definidas por template.id+formatId en datos estáticos
    }, [template.id, variant.format, variant.width, variant.height]);

    return (
        <div
            ref={containerRef}
            className={`relative flex items-center justify-center overflow-hidden bg-[#0a0a12] ${className}`}
            aria-hidden
        >
            <div
                className="relative shrink-0 pointer-events-none"
                style={{
                    width: variant.width,
                    height: variant.height,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                }}
            >
                <canvas ref={canvasElRef} className="block max-w-none" />
            </div>
        </div>
    );
}
