"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, Rect, Textbox, Circle, FabricImage } from "fabric";
import type { Template } from "@/data/templates";

interface TemplatePreviewProps {
    template: Template;
}

const CACHE_PREFIX = "artegenia_preview_v2_";

export default function TemplatePreview({ template }: TemplatePreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        try {
            const cached = localStorage.getItem(`${CACHE_PREFIX}${template.id}`);
            if (cached) {
                setPreviewUrl(cached);
                setLoading(false);
                return;
            }
        } catch {}

        if (!canvasRef.current) return;

        const canvas = new Canvas(canvasRef.current, {
            width: 430,
            height: 540,
            backgroundColor: "#080812",
            preserveObjectStacking: true,
            renderOnAddRemove: false,
        });

        const renderAndExport = () => {
            try {
                canvas.renderAll();
                const dataUrl = canvas.toDataURL({ format: "jpeg", quality: 0.85, multiplier: 0.5 });
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
                        canvas.add(img);
                    } catch (e) {
                        console.warn("Error cargando imagen en preview:", e);
                    }
                }
            }
            setTimeout(renderAndExport, 500);
        };

        loadLayers();

        return () => {
            try { canvas.dispose(); } catch {}
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            className="relative w-full overflow-hidden bg-[#0d0d18]"
            style={{ aspectRatio: "430 / 540" }}
        >
            {!previewUrl && (
                <canvas
                    ref={canvasRef}
                    style={{ position: "absolute", top: -9999, left: -9999, width: 430, height: 540 }}
                />
            )}

            {previewUrl && (
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            )}

            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d0d18]">
                    <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <span className="text-xs text-gray-600">Generando...</span>
                </div>
            )}
        </div>
    );
}
