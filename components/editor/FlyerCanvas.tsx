"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "fabric";
import type { TemplateLayer } from "@/data/templates";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";

type FlyerCanvasProps = {
    width: number;
    height: number;
    layers: TemplateLayer[];
};

export default function FlyerCanvas({ width, height, layers }: FlyerCanvasProps) {
    const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);

    useEffect(() => {
        const el = canvasElementRef.current;
        if (!el) return;

        const canvas = new Canvas(el, {
            width,
            height,
            backgroundColor: "#080812",
            preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        applyTemplateLayers(canvas, layers);
        canvas.renderAll();

        return () => {
            fabricCanvasRef.current = null;
            void canvas.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `layers` suele ser un array nuevo cada render
    }, [width, height]);

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