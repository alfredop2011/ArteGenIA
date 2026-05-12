import type { TemplateLayer } from "@/data/templates";

/**
 * Escala las capas de una plantilla de su tamaño original
 * al formato elegido por el usuario, manteniendo proporciones.
 */
export function scaleLayersToFormat(
    layers: TemplateLayer[],
    fromW: number,
    fromH: number,
    toW: number,
    toH: number,
): TemplateLayer[] {
    const sx = toW / fromW;
    const sy = toH / fromH;

    return layers.map(layer => {
        if (layer.type === "shape") {
            return {
                ...layer,
                x: Math.round(layer.x * sx),
                y: Math.round(layer.y * sy),
                width: Math.round(layer.width * sx),
                height: Math.round(layer.height * sy),
                radius: layer.radius ? Math.round(layer.radius * Math.min(sx, sy)) : undefined,
            };
        }
        if (layer.type === "text") {
            return {
                ...layer,
                x: Math.round(layer.x * sx),
                y: Math.round(layer.y * sy),
                width: Math.round(layer.width * sx),
                fontSize: Math.round(layer.fontSize * Math.min(sx, sy)),
            };
        }
        if (layer.type === "image") {
            return {
                ...layer,
                x: Math.round((layer.x ?? 0) * sx),
                y: Math.round((layer.y ?? 0) * sy),
                scaleX: (layer.scaleX ?? 1) * sx,
                scaleY: (layer.scaleY ?? 1) * sy,
            };
        }
        return layer;
    });
}
