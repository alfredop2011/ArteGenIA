import { Circle, FabricImage, type FabricObject, Rect, Shadow, Textbox, type Canvas, type StaticCanvas } from "fabric";
import type { TemplateLayer } from "@/data/templates";

/** Wrapper: añade el objeto al canvas asignando customId desde layer.id
 *  para identificarlo despues (usado por MobileEditorV2 y GeneratedEditor
 *  para mapear bloques editables → objetos Fabric concretos). */
function addWithId(canvas: Canvas | StaticCanvas, obj: FabricObject, id?: string) {
    if (id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any).customId = id;
    }
    canvas.add(obj);
    return obj;
}

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
            // NOTA: ignoramos layer.selectable === false. El usuario quiere
            // poder seleccionar TODOS los objetos (incluso fondos y decoraciones)
            // para reposicionarlos / modificarlos. Si rompe la plantilla por
            // error, undo (Cmd+Z) restaura. La proteccion original venia de
            // marcar fondos como no-selectable, pero limitaba demasiado.
            const common = {
                left: (layer.x ?? 0) * scale,
                top: (layer.y ?? 0) * scale,
                fill: layer.fill,
                opacity: layer.opacity ?? 1,
                selectable: true,
                evented: true,
                originX: layer.originX ?? "left",
                originY: layer.originY ?? "top",
                angle: layer.angle ?? 0,
                stroke: layer.stroke,
                strokeWidth: (layer.strokeWidth ?? 0) * scale,
                strokeDashArray: layer.strokeDashArray,
            };
            if (layer.shape === "rect") {
                addWithId(canvas, new Rect({
                    ...common,
                    width: layer.width * scale,
                    height: layer.height * scale,
                    rx: (layer.radius ?? 0) * scale,
                    ry: (layer.radius ?? 0) * scale,
                }), layer.id);
            }
            if (layer.shape === "circle") {
                addWithId(canvas, new Circle({
                    ...common,
                    radius: (layer.width / 2) * scale,
                }), layer.id);
            }
        }

        // ── SHAPE PATTERN (bucles generativos: rayas, puntos, etc.) ──────
        // Tambien selectable=true (decision de usuario: todo manipulable).
        if (layer.type === "shape-pattern") {
            for (let i = 0; i < layer.count; i++) {
                const dx = (layer.offsetX ?? 0) * i;
                const dy = (layer.offsetY ?? 0) * i;
                addWithId(canvas, new Rect({
                    left: (layer.x + dx) * scale,
                    top: (layer.y + dy) * scale,
                    width: layer.width * scale,
                    height: layer.height * scale,
                    fill: layer.fill,
                    opacity: layer.opacity ?? 1,
                    angle: layer.angle ?? 0,
                    selectable: true,
                    evented: true,
                    originX: "left",
                    originY: "top",
                    strokeWidth: 0,
                }), `${layer.id ?? "pat"}-${i}`);
            }
        }

        // ── TEXT ───────────────────────────────────────────────────────────
        if (layer.type === "text") {
            addWithId(canvas, new Textbox(layer.text, {
                left: layer.x * scale,
                top: layer.y * scale,
                width: layer.width * scale,
                fontSize: layer.fontSize * scale,
                fontFamily: layer.fontFamily,
                fill: layer.color === "transparent" ? "" : layer.color,
                fontWeight: layer.fontWeight ?? "normal",
                fontStyle: layer.fontStyle ?? "normal",
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
                // selectable/evented explicitos: Fabric tiene default true, pero
                // forzarlo evita roturas si alguna actualizacion de la libreria
                // cambia el comportamiento por defecto.
                selectable: true,
                evented: true,
            }), layer.id);
        }

        // ── IMAGE ──────────────────────────────────────────────────────────
        if (layer.type === "image") {
            try {
                // Cache buster para imágenes R2: si el navegador cacheó la
                // respuesta SIN headers CORS (antes de configurar CORS en R2),
                // un query param distinto fuerza al browser a re-pedir la
                // imagen al server, esta vez con los headers correctos.
                // Solo aplicamos al dominio R2 — no rompemos URLs externas.
                const isR2 = layer.src.includes("r2.dev") || layer.src.includes("r2.cloudflarestorage");
                const srcWithBuster = isR2 && !layer.src.includes("?")
                    ? `${layer.src}?v=${layer.id ?? "cors"}`
                    : layer.src;
                const img = await FabricImage.fromURL(srcWithBuster, { crossOrigin: "anonymous" });
                const isBg = layer.id === "bg-photo" || layer.id === "artist-photo";
                // bg-magic (Capas Mágicas): la imagen viene con las dimensiones
                // del canvas natural (canvas se creó desde sharp metadata).
                // En el sistema fabric con zoom: las coords son "naturales"
                // (1080×1350) y el zoom 0.5 hace el render visual a 540×675.
                // Para que la imagen LLENE el canvas natural, scaleX debe
                // ser tal que img.width * scaleX = canvas.width_natural.
                // Si la imagen ya es del mismo tamaño que el canvas (1080×1350
                // == 1080×1350), scaleX = 1. NO multiplicar por scale otra vez.
                const isBgMagic = layer.id === "bg-magic";
                if (isBgMagic) {
                    const canvasNaturalW = canvas.width ? canvas.width / scale : (img.width ?? 1080);
                    const canvasNaturalH = canvas.height ? canvas.height / scale : (img.height ?? 1350);
                    const imgW = img.width ?? canvasNaturalW;
                    const imgH = img.height ?? canvasNaturalH;
                    const fitScale = Math.max(canvasNaturalW / imgW, canvasNaturalH / imgH);
                    // Debug temporal: para diagnosticar bg-magic renderizándose
                    // a 1/4 del canvas cuando dims matchean. Si fitScale != 1
                    // significa que canvas.width o img.width no son lo esperado.
                    console.log("[bg-magic] DEBUG render:", {
                        canvasWidth: canvas.width,
                        canvasHeight: canvas.height,
                        scale,
                        canvasNaturalW,
                        canvasNaturalH,
                        imgW,
                        imgH,
                        fitScale,
                        src: layer.src.substring(0, 80),
                    });
                    img.set({
                        left: 0,
                        top: 0,
                        originX: "left",
                        originY: "top",
                        scaleX: fitScale,
                        scaleY: fitScale,
                        opacity: layer.opacity ?? 1,
                        angle: layer.angle ?? 0,
                        selectable: true,
                        evented: true,
                    });
                } else if (isBg) {
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
                        // selectable/evented explicitos por la misma razon que en text:
                        // forzar defaults en caso de cambios futuros en Fabric.
                        selectable: true,
                        evented: true,
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
                // Aplicar sombra/glow si la capa la define (útil para artistas recortados)
                if (layer.shadow) {
                    img.set("shadow", new Shadow({
                        color: layer.shadow.color,
                        blur: layer.shadow.blur,
                        offsetX: layer.shadow.offsetX ?? 0,
                        offsetY: layer.shadow.offsetY ?? 0,
                    }));
                }
                addWithId(canvas, img, layer.id);
            } catch (e) {
                // Logging detallado: si bg-magic falla, queremos ver el src
                // exacto + error en console para diagnosticar (CORS, 404, etc).
                console.error(`[applyTemplateLayers] image FAIL — id=${layer.id} src=${layer.src}`, e);
            }
        }
    }
    canvas.renderAll();
}
