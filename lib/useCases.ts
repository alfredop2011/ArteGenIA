import type { Template, UseCase } from "@/data/templates";

/**
 * Infiere los casos de uso de una plantilla a partir de su categoria y
 * titulo. Util para el filtro "¿Para qué lo necesitas?" sin tener que
 * tag-ear manualmente las 48 plantillas existentes.
 *
 * Reglas de inferencia:
 *  - TODAS las plantillas sirven al menos para "promote" (anunciar/promocionar)
 *  - Categorias con boletos (conciertos, fiestas, festivales, club) →
 *      añaden "sellTickets" + "announceArtist"
 *  - Categoria Clases o titulo con "workshop"/"bootcamp"/"clase"/"taller" →
 *      añaden "attractStudents"
 *  - Titulo con palabras de apertura ("lanza", "nuevo", "estreno",
 *      "apertura", "primera", "inscripciones") → añaden "launch"
 *
 * Si la plantilla declara `useCases` explicito en data/templates.ts, ese
 * override gana y no se aplica la inferencia.
 */
export function inferUseCases(t: Template): UseCase[] {
  // Override manual gana sobre la inferencia
  if (t.useCases && t.useCases.length > 0) return t.useCases;

  const cat = t.category.toLowerCase();
  const title = t.title.toLowerCase();
  const cases = new Set<UseCase>();

  // Regla base: todas promocionan
  cases.add("promote");

  // Eventos pagados → entradas + artista
  const isPaidEvent =
    cat.includes("concierto") ||
    cat.includes("fiesta") ||
    cat.includes("festival") ||
    cat.includes("club") ||
    cat.includes("discoteca") ||
    cat.includes("gala");
  if (isPaidEvent) {
    cases.add("sellTickets");
    cases.add("announceArtist");
  }

  // Formacion (clases/workshops/talleres) → alumnos
  const isEducation =
    cat.includes("clase") ||
    title.includes("workshop") ||
    title.includes("bootcamp") ||
    title.includes("clase") ||
    title.includes("taller") ||
    title.includes("intensivo") ||
    title.includes("curso") ||
    title.includes("academia");
  if (isEducation) {
    cases.add("attractStudents");
  }

  // Lanzamientos/aperturas
  const isLaunch =
    title.includes("lanza") ||
    title.includes("nuevo") ||
    title.includes("nueva") ||
    title.includes("estreno") ||
    title.includes("apertura") ||
    title.includes("primera") ||
    title.includes("inscripciones") ||
    title.includes("opening");
  if (isLaunch) {
    cases.add("launch");
  }

  // Plantillas con artista nombrado en titulo (ej "con Paco", "con Elena")
  // sirven especialmente para anunciar artista
  if (title.includes(" con ")) {
    cases.add("announceArtist");
  }

  return Array.from(cases);
}

/** Helper: ¿esta plantilla matchea el use case seleccionado? */
export function matchesUseCase(t: Template, useCase: UseCase | "all"): boolean {
  if (useCase === "all") return true;
  return inferUseCases(t).includes(useCase);
}
