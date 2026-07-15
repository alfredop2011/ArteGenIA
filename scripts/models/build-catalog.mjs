// Mide el bbox real del contenido de los 49 modelos y genera data/generatedModels.ts
//
// Por qué medir: cada PNG tiene una cantidad distinta de padding transparente.
// Sin el bbox real, colocar 8 personas "a la misma altura" es imposible —
// escalar por el alto del LIENZO no alinea a las PERSONAS.
import sharp from "/Users/developdanger/PhpstormProjects/artegenia/node_modules/sharp/lib/index.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const bbox = async (file) => {
  const img = sharp(resolve(file));
  const { width: W, height: H } = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  // Centro de masa horizontal: el bbox se lo lleva un brazo extendido, pero el
  // centroide sigue al torso, que es donde el ojo ve "a la persona".
  let sumaX = 0, pesos = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = data[(y * W + x) * ch + (ch - 1)];
      if (a > 16) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        sumaX += x * a; pesos += a;
      }
    }
  }
  const r = (v) => Math.round(v * 1000) / 1000;
  return {
    W, H,
    box: { x: r(minX / W), y: r(minY / H), w: r((maxX - minX) / W), h: r((maxY - minY) / H) },
    cx: r(pesos ? sumaX / pesos / W : 0.5),
  };
};

const LABEL = JSON.parse(readFileSync(resolve("labels.json"), "utf8"));
const subidas = [
  ...JSON.parse(readFileSync(resolve("subidas.json"), "utf8")).map((s) => ({ ...s, dir: "lote" })),
  ...JSON.parse(readFileSync(resolve("subidas-piloto.json"), "utf8")).map((s) => ({ ...s, dir: "out2" })),
];

const rows = [];
for (const s of subidas) {
  const f = resolve(s.dir, `${s.id}.png`);
  if (!existsSync(f)) { console.log(`✗ ${s.id}`); continue; }
  const { W, H, box, cx } = await bbox(f);
  rows.push({ id: s.id, key: s.key, vertical: s.r2, crop: s.vertical, W, H, box, cx, label: LABEL[s.id] ?? s.id });
  console.log(`${s.id.padEnd(26)} ${String(W).padStart(4)}x${String(H).padEnd(4)} box ${JSON.stringify(box)}`);
}

const byV = (v) => rows.filter((r) => r.vertical === v);
const fmt = (r) =>
  `  { id: "${r.id}", vertical: "${r.vertical}", crop: "${r.crop}", w: ${r.W}, h: ${r.H},\n` +
  `    box: { x: ${r.box.x}, y: ${r.box.y}, w: ${r.box.w}, h: ${r.box.h} }, cx: ${r.cx},\n` +
  `    src: "${r.key}", label: "${r.label}" },`;

const ts = `// ═══════════════════════════════════════════════════════════════════
// CATÁLOGO DE MODELOS GENERADOS — 49 personas, generadas con Flux y
// recortadas con BiRefNet. Viven en R2 bajo models/generated/.
//
// AUTOGENERADO por scripts/models/build-catalog.mjs — no editar a mano.
//
// El campo \`box\` es el bbox REAL del contenido no transparente, en fracción
// 0..1 del lienzo. Es imprescindible: cada PNG tiene distinto padding, así que
// escalar por el alto del lienzo NO alinea a las personas entre sí. Con \`box\`,
// placeModel() puede colocar N personas a la misma altura real — que es lo que
// permite componer un "grupo de 8" a partir de 8 recortes individuales en vez
// de generar una foto de grupo (Flux no sabe hacer grupos: ignora el número de
// personas y rompe manos e instrumentos).
// ═══════════════════════════════════════════════════════════════════

export type ModelVertical = "dance" | "dj" | "profes" | "cantantes" | "musicos" | "parejas" | "retratos";

/** Encuadre de la foto original. Determina qué papel puede jugar en el flyer. */
export type ModelCrop =
  | "cara"    // busto cerrado — la cara llena el cuadro
  | "medio"   // medio cuerpo, cortado a la cadera
  | "cuerpo"  // cuerpo entero, de la cabeza a los pies
  | "pareja"; // dos personas, cuerpo entero

export type GenModel = {
  id: string;
  vertical: ModelVertical;
  crop: ModelCrop;
  /** Tamaño nativo del PNG. */
  w: number;
  h: number;
  /** Bbox del contenido visible, en fracción 0..1 del lienzo. */
  box: { x: number; y: number; w: number; h: number };
  /**
   * Centro de masa horizontal (0..1). Difiere del centro del bbox en poses
   * asimétricas: un brazo extendido ensancha el bbox pero apenas mueve el
   * centroide, que sigue al torso — que es lo que el ojo lee como "la persona".
   */
  cx: number;
  /** Ruta relativa dentro del bucket R2. */
  src: string;
  label: string;
};

const R2_BASE = "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/";

export const GEN_MODELS: GenModel[] = [
${["dance", "dj", "profes", "cantantes", "musicos", "parejas", "retratos"]
  .map((v) => `  // ── ${v} (${byV(v).length}) ──\n${byV(v).map(fmt).join("\n")}`)
  .join("\n")}
];

const BY_ID = new Map(GEN_MODELS.map((m) => [m.id, m]));

export function genModel(id: string): GenModel {
  const m = BY_ID.get(id);
  if (!m) throw new Error(\`genModel(): "\${id}" no existe en GEN_MODELS\`);
  return m;
}

/** Todos los modelos de un vertical, opcionalmente filtrados por encuadre. */
export function modelsBy(vertical: ModelVertical, crop?: ModelCrop): GenModel[] {
  return GEN_MODELS.filter((m) => m.vertical === vertical && (!crop || m.crop === crop));
}

export type PlaceOpts = {
  /** Alto deseado de la PERSONA en px de lienzo (no del PNG). */
  height: number;
  /** X del centro de la persona en el lienzo. */
  centerX: number;
  /** Y donde deben quedar los pies / el borde inferior de la persona. */
  bottomY: number;
};

/**
 * Devuelve los campos de un layer type:"image" para que la PERSONA quede con la
 * altura pedida, centrada en centerX y con su base en bottomY.
 *
 * Compensa el padding transparente usando \`box\`, así que N modelos distintos
 * colocados con el mismo \`height\` salen todos a la misma altura real. Eso es lo
 * que hace posible una fila de 8 artistas alineados.
 *
 * Devuelve x/y — la convención de TemplateLayer, no left/top de Fabric — para
 * poder volcarlo directo en una capa. Asume los originX/originY por defecto
 * ("left"/"top"), así que NO pongas originX:"center" encima: x/y ya vienen
 * calculados contando el padding.
 *
 *   { id: "dj1", type: "image", ...placeModel("dj-cara-nina", { height: 420, centerX: 200, bottomY: 900 }) }
 */
export function placeModel(id: string, { height, centerX, bottomY }: PlaceOpts) {
  const m = genModel(id);
  // alto real de la persona en px del PNG
  const personH = m.h * m.box.h;
  const scale = height / personH;
  const personW = m.w * m.box.w;
  return {
    src: \`\${R2_BASE}\${m.src}\`,
    x: centerX - (m.box.x * m.w + personW / 2) * scale,
    y: bottomY - (m.box.y * m.h + personH) * scale,
    scaleX: scale,
    scaleY: scale,
  };
}

export type LineupOpts = {
  /** Alto de las personas, igual para todas. */
  height: number;
  /** Y de los pies. */
  y: number;
  /** Margen izquierdo y derecho de la fila. */
  from: number;
  to: number;
  /**
   * Solape máximo permitido entre vecinos, en fracción del ancho de la persona
   * (0 = sin solape, 0.25 = un cuarto). Si no caben ni con ese solape, se
   * reduce la altura de todos por igual hasta que entren.
   */
  maxOverlap?: number;
};

/**
 * Reparte N modelos en una fila alineada — el patrón "grupo de 8" compuesto a
 * partir de recortes individuales, en vez de generar una foto de grupo.
 *
 * Reparte por el ANCHO REAL de cada persona, no por centros equidistantes: una
 * bailarina con los brazos abiertos ocupa el triple que alguien de pie, así que
 * repartir a pasos iguales la solapa con su vecina y la saca del lienzo.
 *
 * Si la fila no cabe, baja la altura de todos por igual — nunca deforma ni
 * recorta a nadie, y nunca se sale de [from, to].
 *
 * Ancla cada persona por su CENTRO DE MASA, no por el centro de su bbox: con
 * un brazo extendido el bbox se descuadra y el torso quedaba descentrado en su
 * hueco, dejando huecos muertos en la fila.
 *
 *   lineup(["a","b","c"], { height: 380, y: 900, from: 60, to: 1020 })
 */
export function lineup(ids: string[], { height, y, from, to, maxOverlap = 0.12 }: LineupOpts) {
  const disponible = to - from;
  const anchoDe = (id: string, h: number) => {
    const m = genModel(id);
    return m.w * m.box.w * (h / (m.h * m.box.h));
  };

  // ¿Cabe a la altura pedida, admitiendo el solape máximo? Si no, encogemos.
  let h = height;
  const totalA = (hh: number) => ids.reduce((s, id) => s + anchoDe(id, hh), 0);
  const minTotal = (hh: number) =>
    totalA(hh) * (1 - maxOverlap) + anchoDe(ids[ids.length - 1], hh) * maxOverlap;
  if (minTotal(h) > disponible) h = height * (disponible / minTotal(height));

  const anchos = ids.map((id) => anchoDe(id, h));
  const total = anchos.reduce((s, w) => s + w, 0);
  // hueco entre vecinos; negativo = solape (permitido y a menudo deseable)
  const hueco = ids.length > 1 ? (disponible - total) / (ids.length - 1) : 0;

  let cursor = from;
  return ids.map((id, i) => {
    const m = genModel(id);
    const medio = cursor + anchos[i] / 2;
    cursor += anchos[i] + hueco;
    // placeModel centra el BBOX; aquí queremos el TORSO en medio del hueco, así
    // que compensamos la diferencia entre centro de bbox y centro de masa.
    const escala = h / (m.h * m.box.h);
    const ajuste = (m.box.x + m.box.w / 2 - m.cx) * m.w * escala;
    return { id, ...placeModel(id, { height: h, centerX: medio + ajuste, bottomY: y }) };
  });
}
`;

writeFileSync(resolve("/Users/developdanger/PhpstormProjects/artegenia/data/generatedModels.ts"), ts);
console.log(`\n${rows.length} modelos → data/generatedModels.ts`);
