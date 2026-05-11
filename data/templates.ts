export type Template = {
    id: number;
    title: string;
    category: string;
    image: string;
    premium: boolean;
};

export const templates: Template[] = [
    {
        id: 1,
        title: "Noche Magnética",
        category: "Fiesta",
        image:
            "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800",
        premium: true,
    },
    {
        id: 2,
        title: "Urban Party",
        category: "Concierto",
        image:
            "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800",
        premium: false,
    },
    {
        id: 3,
        title: "DJ Neon",
        category: "Discoteca",
        image:
            "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800",
        premium: true,
    },
    {
        id: 4,
        title: "Evento Premium",
        category: "Flyer",
        image:
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800",
        premium: false,
    },
];