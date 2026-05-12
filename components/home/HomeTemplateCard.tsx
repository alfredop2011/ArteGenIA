import Link from "next/link";

export type CardTemplate = {
    id: number;
    name: string;
    category: string;
    date: string;
    venue: string;
    img: string;
    accent: string;
    textStyle: "gold" | "neon" | "fire" | "disco";
};

export default function HomeTemplateCard({ t, isActive }: { t: CardTemplate; isActive: boolean }) {
    const styles: Record<string, { title: string; sub: string }> = {
        gold:  { title: "color:#facc15; text-shadow: 0 0 20px #facc1588", sub: "color:#f59e0b" },
        neon:  { title: "color:#c084fc; text-shadow: 0 0 20px #a855f788", sub: "color:#a855f7" },
        fire:  { title: "color:#fb923c; text-shadow: 0 0 20px #ea580c88", sub: "color:#fbbf24" },
        disco: { title: "color:#22d3ee; text-shadow: 0 0 20px #0891b288", sub: "color:#67e8f9" },
    };
    const s = styles[t.textStyle];

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-2xl group"
            style={{
                border: isActive ? `1px solid ${t.accent}66` : "1px solid rgba(255,255,255,0.08)",
                boxShadow: isActive ? `0 0 50px ${t.accent}44, 0 30px 60px rgba(0,0,0,0.5)` : "0 20px 40px rgba(0,0,0,0.4)",
                transition: "all 0.4s",
            }}>
            {/* Photo */}
            <img src={t.img} alt={t.name} className="w-full h-full object-cover" crossOrigin="anonymous" />

            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.1) 100%)" }} />

            {/* Top label */}
            <div className="absolute top-4 left-0 right-0 text-center">
                <span className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
                    style={{ background: "rgba(0,0,0,0.5)", color: t.accent, border: `1px solid ${t.accent}44` }}>
                    {t.category.toUpperCase()}
                </span>
            </div>

            {/* Content bottom */}
            <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="w-8 h-0.5 mb-2 rounded" style={{ background: t.accent }} />
                <h3 className="font-black text-lg leading-tight mb-1" style={{ color: "#fff", textShadow: `0 0 30px ${t.accent}66` }}>
                    {t.name}
                </h3>
                <p className="text-xs font-bold mb-0.5" style={{ color: t.accent }}>{t.date}</p>
                <p className="text-xs text-gray-400 mb-1">{t.venue}</p>
                <p className="text-xs text-gray-600">ENTRADAS EN ARTEGENIA.COM</p>

                {isActive && (
                    <Link href={`/editor/${t.id}`}
                        className="mt-2 inline-flex items-center gap-2 text-xs font-black px-4 py-1.5 rounded-xl text-black transition-transform hover:scale-105"
                        style={{ background: "linear-gradient(135deg, #facc15, #f59e0b)" }}
                        onClick={e => e.stopPropagation()}>
                        ✦ Usar plantilla
                    </Link>
                )}
            </div>
        </div>
    );
}
