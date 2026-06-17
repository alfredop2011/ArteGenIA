import type { LucideIcon } from "lucide-react";
import { Square, Smartphone, RectangleVertical, Printer, ImageIcon, FileImage } from "lucide-react";

export type FormatId = "square" | "portrait" | "story" | "print" | "fb-cover" | "flyer-legacy";

export type FormatDef = {
    id: FormatId;
    name: string;
    /** Subtítulo corto para mostrar bajo el nombre (sin medidas en píxeles). */
    subtitle: string;
    /** Texto pequeño con la medida y uso. Aparece solo donde tiene sentido. */
    description: string;
    width: number;
    height: number;
    icon: LucideIcon;
    /** Si es false, no aparece como opción en pickers públicos. */
    public: boolean;
};

export const FORMATS: Record<FormatId, FormatDef> = {
    "square":       { id: "square",       name: "Post de Instagram",     subtitle: "Cuadrado, para feed",         description: "1080 × 1080 px", width: 1080, height: 1080, icon: Square,            public: true },
    "portrait":     { id: "portrait",     name: "Post vertical",         subtitle: "Para Instagram y TikTok",     description: "1080 × 1350 px", width: 1080, height: 1350, icon: RectangleVertical, public: true },
    "story":        { id: "story",        name: "Historia de Instagram", subtitle: "Pantalla completa, Stories",  description: "1080 × 1920 px", width: 1080, height: 1920, icon: Smartphone,        public: true },
    "print":        { id: "print",        name: "Imprimible",            subtitle: "Para imprimir en papel",      description: "1240 × 1748 px", width: 1240, height: 1748, icon: Printer,           public: true },
    "fb-cover":     { id: "fb-cover",     name: "Portada de Facebook",   subtitle: "Cabecera de perfil/página",   description: "1920 × 1005 px", width: 1920, height: 1005, icon: ImageIcon,         public: true },
    "flyer-legacy": { id: "flyer-legacy", name: "Flyer clásico",         subtitle: "Formato antiguo",              description: "430 × 540 px",   width: 430,  height: 540,  icon: FileImage,         public: false },
};

export const FORMAT_IDS: FormatId[] = ["square", "portrait", "story", "print", "fb-cover", "flyer-legacy"];

/** Formatos que se muestran en pickers públicos, en el orden recomendado. */
export const PUBLIC_FORMATS: FormatId[] = ["square", "story", "portrait", "fb-cover", "print"];

export function getFormat(id: FormatId): FormatDef {
    return FORMATS[id];
}

export function isValidFormatId(id: string): id is FormatId {
    return id in FORMATS;
}

/**
 * Detecta el formato semantico desde unas dimensiones (w x h).
 * Necesario en el editor para mostrar "Post de Instagram" en lugar
 * de solo "1080 × 1080 px". Si las dimensiones no coinciden con
 * ningun formato conocido, devuelve null y el editor solo muestra
 * los pixeles.
 */
export function getFormatByDimensions(w: number, h: number): FormatDef | null {
    for (const fmt of Object.values(FORMATS)) {
        if (fmt.width === w && fmt.height === h) return fmt;
    }
    return null;
}
