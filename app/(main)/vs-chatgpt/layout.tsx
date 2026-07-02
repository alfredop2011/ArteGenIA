import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Flyers únicos vs ChatGPT — identidad visual propia para DJ y salas | ArteGenIA",
    description:
        "Todos los flyers hechos con ChatGPT están empezando a parecerse. ArteGenIA es lo contrario: identidad visual que se mantiene semana a semana y hace que TU noche destaque de la competencia.",
    keywords: [
        "flyer chatgpt",
        "alternativa chatgpt flyer",
        "flyer con ia sin copiar",
        "identidad visual dj",
        "flyer marca propia",
        "chatgpt vs artegenia",
    ],
    openGraph: {
        title: "Flyers únicos vs ChatGPT — ArteGenIA",
        description:
            "Todos usan la misma IA. Todos acaban con el mismo flyer. Aquí no.",
        type: "article",
    },
    alternates: {
        canonical: "https://artegenia.com/vs-chatgpt",
    },
};

export default function VsChatGptLayout({ children }: { children: React.ReactNode }) {
    return children;
}
