"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, User, Building2, CalendarDays, Lightbulb, type LucideIcon } from "lucide-react";

const EXAMPLES = [
    "Crea un flyer para noche de salsa con 2 artistas…",
    "Diseña un cartel para bachata romántica este sábado…",
    "Haz un flyer urbano con neón morado y dorado…",
    "Festival latino con 10 artistas y entrada premium…",
];
const CHIPS = ["Noche de salsa en discoteca", "Concierto de reggaetón", "Festival de música urbana", "Evento de bachata"];
const QUICK: { icon: LucideIcon; label: string }[] = [
    { icon: User,         label: "2 artistas" },
    { icon: Building2,    label: "Discoteca" },
    { icon: CalendarDays, label: "Viernes por la noche" },
    { icon: Lightbulb,    label: "Ideas aleatorias" },
];

export default function HeroChat() {
    const [text, setText] = useState("");
    const [prompt, setPrompt] = useState("");
    const [generating, setGenerating] = useState(false);
    const [exIdx, setExIdx] = useState(0);
    const [phase, setPhase] = useState<"typing"|"pause"|"erasing">("typing");
    const charIdx = useRef(0);

    useEffect(() => {
        const current = EXAMPLES[exIdx];
        let t: ReturnType<typeof setTimeout>;
        if (phase === "typing") {
            if (charIdx.current < current.length) {
                t = setTimeout(() => { setText(current.slice(0, charIdx.current + 1)); charIdx.current++; }, 40);
            } else { t = setTimeout(() => setPhase("pause"), 2000); }
        } else if (phase === "pause") {
            t = setTimeout(() => setPhase("erasing"), 400);
        } else {
            if (charIdx.current > 0) {
                t = setTimeout(() => { charIdx.current--; setText(current.slice(0, charIdx.current)); }, 18);
            } else { setExIdx(i => (i + 1) % EXAMPLES.length); setPhase("typing"); }
        }
        return () => clearTimeout(t);
    }, [text, phase, exIdx]);

    const generate = async (val?: string) => {
        const v = val || prompt;
        if (!v.trim()) return;
        setGenerating(true);
        await new Promise(r => setTimeout(r, 1500));
        setGenerating(false);
        window.location.href = "/templates";
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <div className="rounded-3xl overflow-hidden"
                style={{
                    background: "rgba(17,17,31,0.80)",
                    border: "1px solid rgba(168,85,247,0.50)",
                    boxShadow: "0 0 60px rgba(168,85,247,0.30), 0 0 120px rgba(168,85,247,0.10), 0 20px 60px rgba(0,0,0,0.4)",
                    backdropFilter: "blur(20px)",
                }}>
                {/* Input row */}
                <div className="relative px-5 pt-3 pb-2">
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        rows={1}
                        className="w-full bg-transparent text-white text-base outline-none resize-none pr-40"
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
                    />
                    {!prompt && (
                        <div className="absolute top-3 left-5 text-gray-500 text-base pointer-events-none select-none pr-40">
                            {text}<span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse align-middle" />
                        </div>
                    )}
                    <button onClick={() => generate()} disabled={generating || !prompt.trim()}
                        className={`absolute right-4 top-2.5 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${prompt.trim() && !generating ? "text-white hover:scale-105" : "bg-white/5 text-gray-600 cursor-not-allowed"}`}
                        style={prompt.trim() && !generating ? {
                            background: "linear-gradient(135deg, #7c3aed, #c026d3, #d97706)",
                            boxShadow: "0 0 25px rgba(168,85,247,0.55), 0 4px 15px rgba(0,0,0,0.3)"
                        } : {}}>
                        {generating
                            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generando...</>
                            : <><Sparkles size={15} strokeWidth={2} />Generar flyer</>}
                    </button>
                </div>

                {/* Chips */}
                <div className="px-5 pb-2 flex flex-wrap gap-1.5">
                    {CHIPS.map(c => (
                        <button key={c} onClick={() => { setPrompt(c); generate(c); }}
                            className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-gray-400 hover:text-white transition-all">
                            {c}
                        </button>
                    ))}
                </div>

                {/* Quick options */}
                <div className="border-t border-white/[0.06] px-5 py-2 flex items-center gap-6 overflow-x-auto">
                    {QUICK.map(q => {
                        const Icon = q.icon;
                        return (
                            <button key={q.label} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 whitespace-nowrap transition-colors">
                                <Icon size={13} strokeWidth={1.8} />
                                {q.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
