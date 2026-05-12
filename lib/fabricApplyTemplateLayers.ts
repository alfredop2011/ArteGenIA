import { Circle, Rect, Textbox, type Canvas, type StaticCanvas } from "fabric";
import type { TemplateLayer } from "@/data/templates";

/** Añade formas y textos de una plantilla al lienzo (editor o vista previa). */
export function applyTemplateLayers(canvas: Canvas | StaticCanvas, layers: TemplateLayer[]): void {
    layers.forEach((layer) => {
        if (layer.type === "shape") {
            if (layer.shape === "rect") {
                canvas.add(
                    new Rect({
                        left: layer.x,
                        top: layer.y,
                        width: layer.width,
                        height: layer.height,
                        fill: layer.fill,
                        opacity: layer.opacity ?? 1,
                        rx: layer.radius ?? 0,
                        ry: layer.radius ?? 0,
                        selectable: layer.selectable ?? true,
                    }),
                );
            }
            if (layer.shape === "circle") {
                canvas.add(
                    new Circle({
                        left: layer.x,
                        top: layer.y,
                        radius: layer.width / 2,
                        fill: layer.fill,
                        opacity: layer.opacity ?? 1,
                        selectable: layer.selectable ?? true,
                    }),
                );
            }
        }
        if (layer.type === "text") {
            canvas.add(
                new Textbox(layer.text, {
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    fontSize: layer.fontSize,
                    fontFamily: layer.fontFamily,
                    fill: layer.color,
                    fontWeight: layer.fontWeight ?? "normal",
                    textAlign: layer.textAlign ?? "left",
                }),
            );
        }
    });
}
