/**
 * Clave de "serie" para agrupar ocurrencias del mismo evento recurrente
 * (ej. "Eco Tumbao" cada jueves). Normaliza el título quitando tildes,
 * números (fechas/ediciones) y signos, para que distintas noches de la misma
 * serie compartan clave. Pura, sin dependencias → usable en cliente y servidor.
 *
 * Ej: "Eco Tumbao #3" / "ECO TUMBAO" -> "eco tumbao"
 *     "Yoruba Lab 3"                 -> "yoruba lab"
 */
export function seriesKeyFromTitle(title: string): string {
  return (title || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // tildes (combining diacritics)
    .replace(/[0-9]/g, " ") // números (ediciones/fechas)
    .replace(/[^a-z\s]/g, " ") // signos
    .replace(/\s+/g, " ")
    .trim();
}
