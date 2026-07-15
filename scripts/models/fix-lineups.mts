// Arregla #59/#60/#61: anuncian 4/6/8 DJs pero solo tienen 3 caras — Dj-1 sale
// 3 veces en el mismo flyer de la #61. Asigna una cara ÚNICA a cada hueco.
//
// No mueve el diseño: calcula dónde queda hoy la PERSONA (alto, centro, base)
// contando el padding transparente del PNG viejo, y coloca la nueva ahí mismo
// con placeModel(). Los PNG nuevos son 1024×1280 vs 447×558 los viejos, así que
// copiar la escala tal cual haría gigantes.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { placeModel, genModel } from "../../data/generatedModels";

const TPL = new URL("../../data/templates.ts", import.meta.url).pathname;
const R2 = "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/";

// Caras únicas por hueco. Respeta el género que sugiere cada nombre inventado.
const ASIGNACION: Record<number, Record<string, string>> = {
  59: { "dj-1-img": "dj-medio-marcus", "dj-2-img": "dj-medio-yuna", "dj-3-img": "dj-medio-diego", "dj-4-img": "dj-medio-amara" },
  60: { "dj-1-img": "dj-medio-elena", "dj-2-img": "dj-medio-sven", "dj-3-img": "dj-medio-kira",
        "dj-4-img": "dj-medio-farid", "dj-5-img": "dj-medio-lars", "dj-6-img": "dj-medio-yuna" },
  61: { "dj-neo-img": "dj-medio-marcus", "dj-luna-img": "dj-medio-yuna", "dj-nala-img": "dj-medio-amara",
        "dj-vega-img": "dj-medio-sven", "dj-tony-img": "dj-medio-farid", "dj-rex-img": "dj-medio-lars",
        "dj-kairo-img": "dj-medio-diego", "dj-maia-img": "dj-medio-elena" },
};

// bbox del contenido de los PNG viejos — hace falta para saber dónde está hoy
// la persona dentro de su lienzo
const bboxCache = new Map<string, { w: number; h: number; box: { x: number; y: number; w: number; h: number } }>();
const bboxDe = async (url: string) => {
  if (bboxCache.has(url)) return bboxCache.get(url)!;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const img = sharp(buf);
  const { width: W = 0, height: H = 0 } = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * ch + (ch - 1)] > 16) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const r = { w: W, h: H, box: { x: minX / W, y: minY / H, w: (maxX - minX) / W, h: (maxY - minY) / H } };
  bboxCache.set(url, r);
  return r;
};

let src = readFileSync(TPL, "utf8");
const num = (s: string, k: string) => Number(new RegExp(`${k}: (-?[\\d.]+)`).exec(s)?.[1] ?? NaN);

for (const [idStr, mapa] of Object.entries(ASIGNACION)) {
  const tid = Number(idStr);
  // acotar a la sección de esta plantilla (los ids dj-N-img se repiten entre ellas)
  const ini = src.indexOf(`id: ${tid},`);
  const sigId = [59, 60, 61, 62].find((n) => n > tid)!;
  let fin = src.indexOf(`id: ${sigId},`, ini);
  if (fin < 0) fin = src.length;
  let seccion = src.slice(ini, fin);

  for (const [capaId, modeloId] of Object.entries(mapa)) {
    const re = new RegExp(`\\{ id: "${capaId}", type: "image",[^}]*\\}`);
    const m = re.exec(seccion);
    if (!m) { console.log(`✗ #${tid} ${capaId} no encontrada`); continue; }
    const viejo = m[0];

    const urlVieja = /src: "([^"]*)"/.exec(viejo)![1];
    const o = await bboxDe(urlVieja);
    const x = num(viejo, "x"), y = num(viejo, "y"), sc = num(viejo, "scaleX");
    const originX = /originX: "center"/.test(viejo) ? "center" : "left";

    // Dónde está HOY la persona en el lienzo del flyer
    const altoPersona = o.h * o.box.h * sc;
    const topPersona = y + o.box.y * o.h * sc;
    const basePersona = topPersona + altoPersona;
    const centroImg = originX === "center" ? x : x + (o.w * sc) / 2;
    const centroPersona = centroImg + ((o.box.x + o.box.w / 2) - 0.5) * o.w * sc;

    // Colocar la nueva EXACTAMENTE ahí
    const p = placeModel(modeloId, { height: altoPersona, centerX: centroPersona, bottomY: basePersona });
    const nuevo =
      `{ id: "${capaId}", type: "image", src: "${p.src}", ` +
      `x: ${Math.round(p.x * 10) / 10}, y: ${Math.round(p.y * 10) / 10}, ` +
      `scaleX: ${Math.round(p.scaleX * 1e4) / 1e4}, scaleY: ${Math.round(p.scaleY * 1e4) / 1e4} }`;

    seccion = seccion.replace(viejo, nuevo);
    console.log(
      `#${tid} ${capaId.padEnd(13)} ${urlVieja.split("/").pop()!.padEnd(10)} → ${genModel(modeloId).label.padEnd(38)} ` +
      `alto ${altoPersona.toFixed(0)}px`,
    );
  }
  src = src.slice(0, ini) + seccion + src.slice(fin);
}

// El thumbnail del catálogo de las 3 apuntaba a Dj-1.png
for (const tid of [59, 60, 61]) {
  const ini = src.indexOf(`id: ${tid},`);
  const fin = src.indexOf("variants:", ini);
  const cab = src.slice(ini, fin);
  const nuevoThumb = `${R2}models/generated/dj/dj-medio-marcus.png`;
  src = src.slice(0, ini) + cab.replace(/image: "[^"]*"/, `image: "${nuevoThumb}"`) + src.slice(fin);
}

writeFileSync(TPL, src);
console.log("\ndata/templates.ts reescrito");
