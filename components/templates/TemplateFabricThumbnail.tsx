"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StaticCanvas } from "fabric";
import type { Template } from "@/data/templates";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";

type TemplateFabricThumbnailProps = {
    template: Template;
    className?: string;
};

/**
 * Miniatura WYSIWYG: mismo modelo de capas que el editor (Fabric), escalado al hueco de la tarjeta.
 * Soporta plantillas declarativas (layers) y plantillas builder (función imperativa).
 */
export default function TemplateFabricThumbnail({ template, className = "" }: TemplateFabricThumbnailProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const [scale, setScale] = useState(0.2);

    useLayoutEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const measure = () => {
            const cr = node.getBoundingClientRect();
            const pad = 10;
            const sx = (cr.width - pad) / template.width;
            const sy = (cr.height - pad) / template.height;
            const s = Math.min(sx, sy, 1);
            setScale(Number.isFinite(s) && s > 0 ? Math.max(0.06, s) : 0.15);
        };

        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(node);
        return () => ro.disconnect();
    }, [template.width, template.height]);

    useEffect(() => {
        const el = canvasElRef.current;
        if (!el) return;

        const canvas = new StaticCanvas(el, {
            width: template.width,
            height: template.height,
            backgroundColor: "#080812",
            renderOnAddRemove: true,
            enableRetinaScaling: false,
            imageSmoothingEnabled: true,
        });

        const render = async () => {
            await applyTemplateLayers(canvas, template.layers);
            canvas.renderAll();
        };

        void render();

        return () => {
            void canvas.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- capas definidas por template.id en datos estáticos
    }, [template.id, template.width, template.height]);

    return (
        <div
            ref={containerRef}
            className={`relative flex items-center justify-center overflow-hidden bg-[#0a0a12] ${className}`}
            aria-hidden
        >
            <div
                className="relative shrink-0 pointer-events-none"
                style={{
                    width: template.width,
                    height: template.height,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                }}
            >
                <canvas ref={canvasElRef} className="block max-w-none" />
            </div>
        </div>
    );
}
