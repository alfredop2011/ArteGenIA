import { describe, it, expect } from "vitest";
import { inferUseCases, matchesUseCase } from "./useCases";
import type { Template } from "@/data/templates";

// Helper para crear un Template mock con lo minimo necesario
function mkTemplate(overrides: Partial<Template>): Template {
  return {
    id: 999,
    title: "Test",
    category: "Otros",
    image: "",
    premium: false,
    audience: [],
    variants: [],
    ...overrides,
  };
}

describe("inferUseCases", () => {
  it("siempre añade 'promote' (default base)", () => {
    const t = mkTemplate({ title: "Random", category: "Otros" });
    expect(inferUseCases(t)).toContain("promote");
  });

  it("respeta override manual si esta declarado", () => {
    const t = mkTemplate({
      title: "Workshop Bachata",  // por título inferiría attractStudents
      category: "Clases",
      useCases: ["promote"],       // override explicito → solo este
    });
    expect(inferUseCases(t)).toEqual(["promote"]);
  });

  it("categoria Concierto → sellTickets + announceArtist", () => {
    const t = mkTemplate({ title: "Concierto Rock", category: "Concierto" });
    const cases = inferUseCases(t);
    expect(cases).toContain("sellTickets");
    expect(cases).toContain("announceArtist");
  });

  it("categoria Fiesta → sellTickets + announceArtist", () => {
    const cases = inferUseCases(mkTemplate({ title: "Neon Night", category: "Fiesta" }));
    expect(cases).toContain("sellTickets");
    expect(cases).toContain("announceArtist");
  });

  it("categoria Clases → attractStudents", () => {
    const cases = inferUseCases(mkTemplate({ title: "Bachata Mayores", category: "Clases" }));
    expect(cases).toContain("attractStudents");
  });

  it("titulo con 'workshop' → attractStudents (aunque categoria no sea Clases)", () => {
    const t = mkTemplate({ title: "Kizomba Workshop", category: "Otros" });
    expect(inferUseCases(t)).toContain("attractStudents");
  });

  it.each([
    "Lanzamiento del album",
    "Nuevo curso",
    "Inscripciones abiertas",
    "Apertura de temporada",
    "Estreno mundial",
    "Primera clase abierta",
  ])("titulo con palabra de lanzamiento → launch: %s", (title) => {
    const t = mkTemplate({ title, category: "Otros" });
    expect(inferUseCases(t)).toContain("launch");
  });

  it("titulo con ' con ' (anuncia artista) → announceArtist", () => {
    const t = mkTemplate({ title: "Baile Mayores con Paco", category: "Clases" });
    const cases = inferUseCases(t);
    expect(cases).toContain("announceArtist");
    expect(cases).toContain("attractStudents"); // por Clases
  });

  it("no duplica casos (set internamente)", () => {
    const t = mkTemplate({
      title: "Concierto con DJ",  // 'con' añade announceArtist
      category: "Concierto",      // categoria tambien añade announceArtist
    });
    const cases = inferUseCases(t);
    const announceCount = cases.filter(c => c === "announceArtist").length;
    expect(announceCount).toBe(1);
  });

  it("plantilla generica solo promociona", () => {
    const t = mkTemplate({ title: "Postal Banda", category: "Otros" });
    expect(inferUseCases(t)).toEqual(["promote"]);
  });
});

describe("matchesUseCase", () => {
  const t = mkTemplate({ title: "Concierto", category: "Concierto" });

  it("'all' siempre matchea", () => {
    expect(matchesUseCase(t, "all")).toBe(true);
  });

  it("matchea use case real del template", () => {
    expect(matchesUseCase(t, "sellTickets")).toBe(true);
    expect(matchesUseCase(t, "promote")).toBe(true);
  });

  it("no matchea use case que no aplica", () => {
    expect(matchesUseCase(t, "attractStudents")).toBe(false);
  });
});
