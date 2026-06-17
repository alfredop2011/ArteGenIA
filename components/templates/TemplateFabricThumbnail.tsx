"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { StaticCanvas } from "fabric";
// NOTA: este componente se importa siempre vía next/dynamic (chunk lazy), así
// que importar el catálogo pesado data/templates.ts aquí NO entra en el
// first-load JS de las páginas de listado — se carga junto al thumbnail.
import { templates, getVariant, type TemplateLayer } from "@/data/templates";
import type { TemplateMeta } from "@/data/templatesMeta";
import { getVariantMeta } from "@/data/templatesMeta";
import type { FormatId } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";

type TemplateFabricThumbnailProps = {
    /** Metadata de la plantilla (sin layers). Las plantillas publicadas pueden
     *  traer layers embebidas; las estáticas se resuelven por id (ver abajo). */
    template: TemplateMeta;
    formatId?: FormatId;
    className?: string;
};

/**
 * Resuelve las layers a renderizar:
 *  - Si la variante ya trae layers (plantillas publicadas desde Supabase) → esas.
 *  - Si no (catálogo estático = solo metadata) → busca la plantilla completa por
 *    id en data/templates.ts y saca las layers de la variante correspondiente.
 */
function resolveLayers(template: TemplateMeta, format: FormatId): TemplateLayer[] {
    const metaVariant = template.variants.find((v) => v.format === format);
    if (metaVariant?.layers?.length) return metaVariant.layers;
    const full = templates.find((t) => t.id === template.id);
    if (!full) return [];
    return getVariant(full, format).layers;
}

/**
 * Miniatura WYSIWYG: mismo modelo de capas que el editor (Fabric), escalado al hueco de la tarjeta.
 * Si no se pasa formatId, usa la primera variante de la plantilla.
 */
export default function TemplateFabricThumbnail({ template, formatId, className = "" }: TemplateFabricThumbnailProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const [scale, setScale] = useState(0.2);

    const variant = getVariantMeta(template, formatId);

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
            await applyTemplateLayers(canvas, resolveLayers(template, variant.format));
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
