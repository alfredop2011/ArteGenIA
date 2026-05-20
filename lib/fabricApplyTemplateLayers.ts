import { Circle, FabricImage, Rect, Textbox, type Canvas, type StaticCanvas } from "fabric";
import type { TemplateLayer } from "@/data/templates";

/** Añade todas las capas de una plantilla al lienzo, incluyendo imágenes async */
export async function applyTemplateLayers(
    canvas: Canvas | StaticCanvas,
    layers: TemplateLayer[] | undefined,
    scale = 1,
): Promise<void> {
    if (!layers) return;

    for (const layer of layers) {
        // ── SHAPE ──────────────────────────────────────────────────────────
        if (layer.type === "shape") {
            const common = {
                left: (layer.x ?? 0) * scale,
                top: (layer.y ?? 0) * scale,
                fill: layer.fill,
                opacity: layer.opacity ?? 1,
                selectable: layer.selectable ?? true,
                evented: layer.selectable ?? true,
                originX: layer.originX ?? "left",
                originY: layer.originY ?? "top",
                angle: layer.angle ?? 0,
                stroke: layer.stroke,
                strokeWidth: (layer.strokeWidth ?? 0) * scale,
                strokeDashArray: layer.strokeDashArray,
            };
            if (layer.shape === "rect") {
                canvas.add(new Rect({
                    ...common,
                    width: layer.width * scale,
                    height: layer.height * scale,
                    rx: (layer.radius ?? 0) * scale,
                    ry: (layer.radius ?? 0) * scale,
                }));
            }
            if (layer.shape === "circle") {
                canvas.add(new Circle({
                    ...common,
                    radius: (layer.width / 2) * scale,
                }));
            }
        }

        // ── SHAPE PATTERN (bucles generativos: rayas, puntos, etc.) ──────
        if (layer.type === "shape-pattern") {
            for (let i = 0; i < layer.count; i++) {
                const dx = (layer.offsetX ?? 0) * i;
                const dy = (layer.offsetY ?? 0) * i;
                canvas.add(new Rect({
                    left: (layer.x + dx) * scale,
                    top: (layer.y + dy) * scale,
                    width: layer.width * scale,
                    height: layer.height * scale,
                    fill: layer.fill,
                    opacity: layer.opacity ?? 1,
                    angle: layer.angle ?? 0,
                    selectable: false,
                    evented: false,
                    originX: "left",
                    originY: "top",
                    strokeWidth: 0,
                }));
            }
        }

        // ── TEXT ───────────────────────────────────────────────────────────
        if (layer.type === "text") {
            canvas.add(new Textbox(layer.text, {
                left: layer.x * scale,
                top: layer.y * scale,
                width: layer.width * scale,
                fontSize: layer.fontSize * scale,
                fontFamily: layer.fontFamily,
                fill: layer.color === "transparent" ? "" : layer.color,
                fontWeight: layer.fontWeight ?? "normal",
                textAlign: layer.textAlign ?? "left",
                originX: layer.originX ?? "left",
                originY: layer.originY ?? "top",
                angle: layer.angle ?? 0,
                charSpacing: layer.charSpacing ?? 0,
                lineHeight: layer.lineHeight ?? 1.16,
                underline: layer.underline ?? false,
                stroke: layer.stroke,
                strokeWidth: (layer.strokeWidth ?? 0) * scale,
                splitByGrapheme: false,
                editable: true,
            }));
        }

        // ── IMAGE ──────────────────────────────────────────────────────────
        if (layer.type === "image") {
            try {
                const img = await FabricImage.fromURL(layer.src, { crossOrigin: "anonymous" });
                const isBg = layer.id === "bg-photo" || layer.id === "artist-photo";
                if (isBg) {
                    const cw = canvas.width ?? 430;
                    const imgW = img.width ?? cw;
                    const scaleToFill = cw / imgW;
                    img.set({
                        left: cw / 2,
                        top: 0,
                        originX: "center",
                        originY: "top",
                        scaleX: scaleToFill,
                        scaleY: scaleToFill,
                        opacity: layer.opacity ?? 1,
                        angle: layer.angle ?? 0,
                        selectable: true,
                        evented: true,
                    });
                } else {
                    img.set({
                        left: (layer.x ?? 0) * scale,
                        top: (layer.y ?? 0) * scale,
                        scaleX: (layer.scaleX ?? 1) * scale,
                        scaleY: (layer.scaleY ?? 1) * scale,
                        opacity: layer.opacity ?? 1,
                        angle: layer.angle ?? 0,
                        originX: layer.originX ?? "left",
                        originY: layer.originY ?? "top",
                    });
                    if (layer.cropWidth && layer.cropHeight) {
                        img.set({
                            cropX: layer.cropX ?? 0,
                            cropY: layer.cropY ?? 0,
                            width: layer.cropWidth,
                            height: layer.cropHeight,
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
