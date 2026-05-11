"use client";

import { useEffect, useRef } from "react";
import { Canvas, Rect, Textbox, Circle } from "fabric";
import type { TemplateLayer } from "@/data/templates";

type FlyerCanvasProps = {
    width: number;
    height: number;
    layers: TemplateLayer[];
};

export default function FlyerCanvas({ width, height, layers }: FlyerCanvasProps) {
    const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);

    useEffect(() => {
        if (!canvasElementRef.current) return;

        const canvas = new Canvas(canvasElementRef.current, {
            width,
            height,
            backgroundColor: "#080812",
            preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        layers.forEach((layer) => {
            if (layer.type === "shape") {
                if (layer.shape === "rect") {
                    const rect = new Rect({
                        left: layer.x,
                        top: layer.y,
                        width: layer.width,
                        height: layer.height,
                        fill: layer.fill,
                        opacity: layer.opacity ?? 1,
                        rx: layer.radius ?? 0,
                        ry: layer.radius ?? 0,
                        selectable: layer.selectable ?? true,
                    });

                    canvas.add(rect);
                }

                if (layer.shape === "circle") {
                    const circle = new Circle({
                        left: layer.x,
                        top: layer.y,
                        radius: layer.width / 2,
                        fill: layer.fill,
                        opacity: layer.opacity ?? 1,
                        selectable: layer.selectable ?? true,
                    });

                    canvas.add(circle);
                }
            }

            if (layer.type === "text") {
                const text = new Textbox(layer.text, {
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    fontSize: layer.fontSize,
                    fontFamily: layer.fontFamily,
                    fill: layer.color,
                    fontWeight: layer.fontWeight ?? "normal",
                    textAlign: layer.textAlign ?? "left",
                });

                canvas.add(text);
            }
        });

        canvas.renderAll();

        return () => {
            canvas.dispose();
        };
    }, [width, height, layers]);

    const exportPng = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL({
            format: "png",
            quality: 1,
            multiplier: 3,
        });

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "artegenia-flyer.png";
        link.click();
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-black p-4 shadow-2xl">
                <canvas ref={canvasElementRef} />
            </div>

            <button
                onClick={exportPng}
                className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-black hover:bg-yellow-300"
            >
                Exportar PNG
            </button>
        </div>
    );
}