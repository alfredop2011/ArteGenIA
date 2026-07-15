// ¿Qué plantillas repiten la MISMA foto de persona dentro del mismo flyer?
// Eso no es "los modelos se parecen": es el mismo tío dos veces, y se ve.
import { templates } from "./data/templates";

const esPersona = (src: string) => /\/models\//.test(src) || /Filosofin/.test(src);
const nombre = (src: string) => decodeURIComponent(src.split("/").pop() ?? src);

type Fila = { id: number; title: string; capas: number; unicas: number; peor: string; veces: number };
const filas: Fila[] = [];

for (const t of templates) {
  const v = t.variants[0];
  if (!v) continue;
  const fotos = v.layers
    .filter((l): l is typeof l & { src: string } => l.type === "image" && typeof (l as { src?: string }).src === "string")
    .map((l) => l.src)
    .filter(esPersona);
  if (fotos.length < 2) continue;

  const cuenta = new Map<string, number>();
  for (const f of fotos) cuenta.set(f, (cuenta.get(f) ?? 0) + 1);
  const [peorSrc, veces] = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0];
  if (veces < 2) continue;
  filas.push({ id: t.id, title: t.title, capas: fotos.length, unicas: cuenta.size, peor: nombre(peorSrc), veces });
}

filas.sort((a, b) => b.veces - a.veces || b.capas - a.capas);

console.log("PLANTILLAS QUE REPITEN CARA DENTRO DEL MISMO FLYER\n");
console.log("  #   personas  caras   peor caso");
for (const f of filas) {
  console.log(
    `  ${String(f.id).padStart(3)}  ${String(f.capas).padStart(5)}     ${String(f.unicas).padStart(3)}    ` +
    `${f.peor.slice(0, 34).padEnd(34)} ×${f.veces}   ${f.title.slice(0, 30)}`,
  );
}
console.log(`\n${filas.length} plantillas de ${templates.length} repiten al menos una cara consigo misma.`);
const graves = filas.filter((f) => f.veces >= 3);
console.log(`${graves.length} muestran la misma cara 3+ veces: ${graves.map((g) => "#" + g.id).join(", ")}`);
