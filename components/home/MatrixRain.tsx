"use client";
import { useEffect, useRef } from "react";

const CHARS = "ARTEGENIA✦⚡♪★◆▲•".split("");
const COLORS = ["#facc15", "#f59e0b", "#a855f7", "#c084fc", "#facc15", "#a855f7"];

export default function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize();
        window.addEventListener("resize", resize);
        const cols = Math.floor(canvas.width / 22);
        const drops = Array(cols).fill(1).map(() => Math.random() * -80);
        const draw = () => {
            ctx.fillStyle = "rgba(7,7,15,0.055)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            drops.forEach((y, i) => {
                ctx.fillStyle = COLORS[i % COLORS.length];
                ctx.globalAlpha = 0.28;
                ctx.font = "13px monospace";
                ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], i * 22 + 4, y * 22);
                ctx.globalAlpha = 1;
                if (y * 22 > canvas.height && Math.random() > 0.972) drops[i] = 0;
                else drops[i]++;
            });
        };
        const id = setInterval(draw, 58);
        return () => { clearInterval(id); window.removeEventListener("resize", resize); };
    }, []);
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,7,15,0.65) 0%, rgba(60,20,100,0.1) 50%, rgba(7,7,15,0.7) 100%)" }} />
        </div>
    );
}
