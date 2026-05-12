"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, Rect, Textbox, Circle, FabricImage } from "fabric";
import type { Template } from "@/data/templates";

interface TemplatePreviewProps {
    template: Template;
}

const CACHE_PREFIX = "artegenia_preview_v4_";

export default function TemplatePreview({ template }: TemplatePreviewProps) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        // Intentar caché
        try {
            const cached = localStorage.getItem(`${CACHE_PREFIX}${template.id}`);
            if (cached) {
                setPreviewUrl(cached);
                setLoading(false);
                return;
            }
        } catch {}

        if (!canvasRef.current) return;

        const W = template.width;   // 430
        const H = template.height;  // 540

        const canvas = new Canvas(canvasRef.current, {
            width: W,
            height: H,
            backgroundColor: "#080812",
            preserveObjectStacking: true,
            renderOnAddRemove: false,
            enableRetinaScaling: false,
        });

        const renderAndExport = () => {
            try {
                canvas.renderAll();
                const dataUrl = canvas.toDataURL({
                    format: "jpeg",
                    quality: 0.85,
                    multiplier: 1,
                });
                try {
                    localStorage.setItem(`${CACHE_PREFIX}${template.id}`, dataUrl);
                } catch {}
                setPreviewUrl(dataUrl);
            } catch (e) {
                console.warn("Preview render error:", e);
            } finally {
                setLoading(false);
                try { canvas.dispose(); } catch {}
            }
        };

        const loadLayers = async () => {
            for (const layer of template.layers) {
                if (layer.type === "shape") {
                    if (layer.shape === "rect") {
                        canvas.add(new Rect({
                            left: layer.x, top: layer.y,
                            width: layer.width, height: layer.height,
                            fill: layer.fill, opacity: layer.opacity ?? 1,
                            rx: layer.radius ?? 0, ry: layer.radius ?? 0,
                            selectable: false, evented: false,
                        }));
                    }
                    if (layer.shape === "circle") {
                        canvas.add(new Circle({
                            left: layer.x, top: layer.y,
                            radius: layer.width / 2,
                            fill: layer.fill, opacity: layer.opacity ?? 1,
                            selectable: false, evented: false,
                        }));
                    }
                }
                if (layer.type === "text") {
                    canvas.add(new Textbox(layer.text, {
                        left: layer.x, top: layer.y,
                        width: layer.width,
                        fontSize: layer.fontSize,
                        fontFamily: layer.fontFamily,
                        fill: layer.color,
                        fontWeight: layer.fontWeight ?? "normal",
                        textAlign: layer.textAlign ?? "left",
                        selectable: false, evented: false,
                    }));
                }
                if (layer.type === "image") {
                    try {
                        const img = await FabricImage.fromURL(layer.src, { crossOrigin: "anonymous" });
                        img.set({
                            left: layer.x, top: layer.y,
                            scaleX: layer.scaleX ?? 1,
                            scaleY: layer.scaleY ?? 1,
                            opacity: layer.opacity ?? 1,
                            selectable: false, evented: false,
                        });
                        if (layer.cropWidth && layer.cropHeight) {
                            img.set({
                                cropX: layer.cropX ?? 0,
                                cropY: layer.cropY ?? 0,
                                width: layer.cropWidth,
                                height: layer.cropHeight,
                            });
                        }
                        canvas.add(img);
                    } catch (e) {
                        console.warn("Error loading image:", e);
                    }
                }
            }
            setTimeout(renderAndExport, 600);
        };

        loadLayers();

        return () => {
            try { canvas.dispose(); } catch {}
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const W = template.width;
    const H = template.height;

    return (
        <div
            ref={wrapperRef}
            className="relative w-full overflow-hidden bg-[#0d0d18]"
            style={{ aspectRatio: `${W} / ${H}` }}
        >
            {/* Canvas visible pero escalado con CSS transform para caber en el contenedor */}
            {!previewUrl && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: `${W}px`,
                        height: `${H}px`,
                        transformOrigin: "top left",
                        transform: `scale(var(--preview-scale, 1))`,
                    }}
                    ref={(el) => {
                        if (el && wrapperRef.current) {
                            const containerW = wrapperRef.current.clientWidth;
                            const scale = containerW / W;
                            el.style.setProperty("--preview-scale", String(scale));
                            el.style.transform = `scale(${scale})`;
                        }
                    }}
                >
                    <canvas ref={canvasRef} />
                </div>
            )}

            {/* Preview final */}
            {previewUrl && (
                <img
                    src={previewUrl}
                    alt={template.title}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "fill",
                    }}
                />
            )}

            {/* Skeleton */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0d0d18]">
                    <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <span className="text-xs text-gray-700">Generando...</span>
                </div>
            )}
        </div>
    );
}
