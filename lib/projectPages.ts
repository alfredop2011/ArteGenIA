/**
 * Multi-página por proyecto (Fase W.1)
 *
 * Convención de fabric_json en Supabase:
 *
 *  Formato NUEVO (a partir de Fase W.1):
 *  {
 *    pages: [
 *      { name: "Página 1", fabric: { ... fabric.toJSON ... }, width, height },
 *      { name: "Página 2", fabric: { ... }, width, height },
 *    ],
 *    activeIndex: 0
 *  }
 *
 *  Formato LEGACY (proyectos creados antes):
 *  { version: "6.0.0", objects: [...], width, height, background: ... }
 *
 *  Este módulo abstrae ambos formatos para que el editor trate cualquier
 *  proyecto como multi-página (legacy = 1 sola página). Cero migración
 *  destructiva — los proyectos viejos siguen funcionando, y la primera
 *  vez que el usuario los guarda con el editor nuevo se convierten al
 *  formato multi-página automáticamente.
 */

export type PageData = {
  /** Nombre visible al usuario (ej. "Front", "Back", "Página 1"). */
  name: string;
  /** Fabric.js JSON serializado de los objects de esta página. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabric: any;
  /** Dimensiones de esta página. En Fase W.1 todas las páginas del proyecto
   *  comparten dimensiones; W.2 permitirá distintos formatos por página. */
  width: number;
  height: number;
};

export type ProjectPages = {
  pages: PageData[];
  activeIndex: number;
};

/** Detecta si un fabric_json está en formato nuevo (multi-página) o legacy. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isMultiPageFormat(fabricJson: any): boolean {
  return (
    fabricJson != null &&
    typeof fabricJson === "object" &&
    Array.isArray(fabricJson.pages) &&
    typeof fabricJson.activeIndex === "number"
  );
}

/** Extrae las páginas de un fabric_json sea cual sea su formato.
 *  Devuelve siempre una estructura multi-página (legacy = 1 página).
 *  fallbackWidth/Height se usan SOLO si el formato legacy no incluye
 *  dimensiones (ej. JSON corrupto). */
export function extractPages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fabricJson: any,
  fallbackWidth = 1080,
  fallbackHeight = 1350,
): ProjectPages {
  if (isMultiPageFormat(fabricJson)) {
    return {
      pages: (fabricJson.pages as PageData[]).map((p) => ({
        name: p.name || "Página",
        fabric: p.fabric ?? {},
        width: p.width || fallbackWidth,
        height: p.height || fallbackHeight,
      })),
      activeIndex: Math.max(
        0,
        Math.min(fabricJson.activeIndex, fabricJson.pages.length - 1),
      ),
    };
  }
  // Legacy: el JSON ENTERO es la única página
  return {
    pages: [
      {
        name: "Página 1",
        fabric: fabricJson ?? {},
        width: fabricJson?.width || fallbackWidth,
        height: fabricJson?.height || fallbackHeight,
      },
    ],
    activeIndex: 0,
  };
}

/** Serializa al formato NUEVO listo para persistir en fabric_json.
 *  Asegura que activeIndex sea válido respecto al número de páginas. */
export function serializePages(state: ProjectPages): {
  pages: PageData[];
  activeIndex: number;
} {
  return {
    pages: state.pages.map((p) => ({
      name: p.name || "Página",
      fabric: p.fabric ?? {},
      width: p.width,
      height: p.height,
    })),
    activeIndex: Math.max(
      0,
      Math.min(state.activeIndex, state.pages.length - 1),
    ),
  };
}

/** Crea una página vacía con las dimensiones dadas. Útil para "+ Añadir página". */
export function newEmptyPage(
  width: number,
  height: number,
  name?: string,
): PageData {
  return {
    name: name || "Página",
    fabric: { version: "6.0.0", objects: [], background: "#ffffff", width, height },
    width,
    height,
  };
}

/** Duplica una página, generando un nombre único. */
export function duplicatePage(
  source: PageData,
  existingNames: string[],
): PageData {
  const base = source.name.replace(/\s*\(copia\s*\d*\)$/i, "");
  let candidate = `${base} (copia)`;
  let n = 2;
  while (existingNames.includes(candidate)) {
    candidate = `${base} (copia ${n})`;
    n++;
  }
  return {
    ...source,
    name: candidate,
    // Deep clone del fabric_json para que editar uno no afecte al otro
    fabric: JSON.parse(JSON.stringify(source.fabric ?? {})),
  };
}
