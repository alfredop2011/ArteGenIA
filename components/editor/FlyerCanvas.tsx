"use client";

import { useEffect, useRef } from "react";
import { Canvas, Textbox, Rect } from "fabric";

type FlyerCanvasProps = {
    title: string;
    category: string;
};

export default function FlyerCanvas({ title, category }: FlyerCanvasProps) {
    const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);

    useEffect(() => {
        if (!canvasElementRef.current) return;

        const canvas = new Canvas(canvasElementRef.current, {
            width: 430,
            height: 540,
            backgroundColor: "#080812",
            preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        const bg = new Rect({
            left: 0,
            top: 0,
            width: 430,
            height: 540,
            fill: "#080812",
            selectable: false,
        });

        const glow = new Rect({
            left: 40,
            top: 40,
            width: 350,
            height: 460,
            fill: "rgba(124, 45, 255, 0.18)",
            rx: 40,
            ry: 40,
            selectable: false,
        });

        const titleText = new Textbox(title.toUpperCase(), {
            left: 35,
            top: 190,
            width: 360,
            fontSize: 42,
            fill: "#facc15",
            fontFamily: "Arial",
            fontWeight: "bold",
            textAlign: "center",
        });

        const categoryText = new Textbox(category, {
            left: 55,
            top: 270,
            width: 320,
            fontSize: 24,
            fill: "#ffffff",
            fontFamily: "Arial",
            textAlign: "center",
        });

        const dateText = new Textbox("SÁBADO 21 JUNIO", {
            left: 70,
            top: 340,
            width: 290,
            fontSize: 22,
            fill: "#ffffff",
            fontFamily: "Arial",
            fontWeight: "bold",
            textAlign: "center",
        });

        const priceText = new Textbox("ENTRADA ANTICIPADA 25€", {
            left: 55,
            top: 440,
            width: 320,
            fontSize: 18,
            fill: "#111111",
            fontFamily: "Arial",
            fontWeight: "bold",
            textAlign: "center",
            backgroundColor: "#facc15",
        });

        canvas.add(bg);
        canvas.add(glow);
        canvas.add(titleText);
        canvas.add(categoryText);
        canvas.add(dateText);
        canvas.add(priceText);

        canvas.renderAll();

        return () => {
            canvas.dispose();
        };
    }, [title, category]);

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