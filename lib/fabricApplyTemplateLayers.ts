import { Circle, FabricImage, Rect, Textbox, type Canvas, type StaticCanvas } from "fabric";
import type { TemplateLayer } from "@/data/templates";

/** Añade todas las capas de una plantilla al lienzo, incluyendo imágenes async */
export async function applyTemplateLayers(
    canvas: Canvas | StaticCanvas,
    layers: TemplateLayer[],
    scale = 1,
): Promise<void> {
    for (const layer of layers) {
        if (layer.type === "shape") {
            if (layer.shape === "rect") {
                canvas.add(new Rect({
                    left: (layer.x ?? 0) * scale, top: (layer.y ?? 0) * scale,
                    width: layer.width * scale, height: layer.height * scale,
                    fill: layer.fill, opacity: layer.opacity ?? 1,
                    rx: (layer.radius ?? 0) * scale, ry: (layer.radius ?? 0) * scale,
                    selectable: layer.selectable ?? true,
                    originX: "left", originY: "top",
                    strokeWidth: 0,
                }));
            }
            if (layer.shape === "circle") {
                canvas.add(new Circle({
                    left: (layer.x ?? 0) * scale, top: (layer.y ?? 0) * scale,
                    radius: (layer.width / 2) * scale,
                    fill: layer.fill, opacity: layer.opacity ?? 1,
                    selectable: layer.selectable ?? true,
                    originX: "left", originY: "top",
                    strokeWidth: 0,
                }));
            }
        }
        if (layer.type === "text") {
            canvas.add(new Textbox(layer.text, {
                left: layer.x * scale,
                top: layer.y * scale,
                width: layer.width * scale,
                fontSize: layer.fontSize * scale,
                fontFamily: layer.fontFamily,
                fill: layer.color,
                fontWeight: layer.fontWeight ?? "normal",
                textAlign: layer.textAlign ?? "left",
                originX: "left",
                originY: "top",
                splitByGrapheme: false,
                editable: true,
            }));
        }
        if (layer.type === "image") {
            try {
                const img = await FabricImage.fromURL(layer.src, { crossOrigin: "anonymous" });
                const isBg = layer.id === "bg-photo" || layer.id === "artist-photo";
                if (isBg) {
                    const cw = canvas.width ?? 430;
                    const ch = canvas.height ?? 540;
                    const imgW = img.width ?? cw;
                    // Escalar para que el ancho llene el canvas
                    const scaleToFill = cw / imgW;
                    // Centrar horizontalmente, alinear arriba para mostrar la cara
                    img.set({
                        left: cw / 2,
                        top: 0,
                        originX: "center",
                        originY: "top",
                        scaleX: scaleToFill,
                        scaleY: scaleToFill,
                        opacity: layer.opacity ?? 1,
                        selectable: true,
                        evented: true,
                    });
                } else {
                    img.set({
                        left: (layer.x ?? 0) * scale, top: (layer.y ?? 0) * scale,
                        scaleX: (layer.scaleX ?? 1) * scale,
                        scaleY: (layer.scaleY ?? 1) * scale,
                        opacity: layer.opacity ?? 1,
                    });
                    if (layer.cropWidth && layer.cropHeight) {
                        img.set({
                            cropX: layer.cropX ?? 0, cropY: layer.cropY ?? 0,
                            width: layer.cropWidth, height: layer.cropHeight,
                        });
                    }
                }
                canvas.add(img);
            } catch (e) {
                console.warn("Error cargando imagen:", e);
            }
        }
    }
    canvas.renderAll();
}
