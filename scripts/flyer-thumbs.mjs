// Genera los PNG de los flyers que salen en el carrusel 3D del home y los
// sube a R2 bajo flyers/showcase/<id>.png. Emite data/flyerShowcase.ts.
//
// Por qué existe: las miniaturas de plantilla se dibujan con Fabric EN EL
// NAVEGADOR. Meter 24 canvas de Fabric en el home destrozaría el LCP de la
// página que más visitas recibe, así que se renderizan UNA vez aquí y el
// componente sirve <img> normales, cacheados por R2.
//
// ⚠️ SOLO ESCRIBE en R2. Nunca borra: el bucket está compartido con
// peligroficial. Re-ejecutar sobrescribe las mismas keys, no duplica.
//
// Requiere el servidor de desarrollo levantado en localhost:3000 (la ruta
// /thumb devuelve 404 en producción a propósito).
//
//   npx playwright install chromium     # una vez
//   node scripts/flyer-thumbs.mjs

import { S3Client, PutObjectCommand } from "/Users/developdanger/PhpstormProjects/artegenia/node_modules/@aws-sdk/client-s3/dist-cjs/index.js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

// playwright-core y sharp son CommonJS: import nombrado no funciona.
const require = createRequire("/Users/developdanger/PhpstormProjects/artegenia/package.json");
const { chromium } = require("playwright-core");
const sharp = require("sharp");

const ROOT = "/Users/developdanger/PhpstormProjects/artegenia";
const BASE = process.env.THUMB_BASE ?? "http://localhost:3000";

// Selección manual: variada en categoría y composición para que el carrusel
// no parezca 12 veces el mismo flyer. Orden = orden en que aparecen.
const FLYERS = [
  { id: 83, titulo: "Mega Oferta 2x1" },
  { id: 61, titulo: "DJ Lineup 8" },
  { id: 81, titulo: "Reggaeton Old School" },
  { id: 58, titulo: "DJ Vinyl Vintage" },
  { id: 66, titulo: "Festival Kizomba" },
  { id: 76, titulo: "Reparto Line-up" },
  { id: 60, titulo: "DJ Lineup 6" },
  { id: 71, titulo: "Intensivo Timba" },
  { id: 78, titulo: "Reggaeton Perreo" },
  { id: 59, titulo: "DJ Lineup 4" },
  { id: 73, titulo: "Reparto en Pareja" },
  { id: 82, titulo: "Noche de Baile" },
];

const env = Object.fromEntries(
  readFileSync(resolve(ROOT, ".env.local"), "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^["']|["']$/g, "")]),
);

const need = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"];
const falta = need.filter((k) => !env[k]);
if (falta.length) throw new Error(`Faltan en .env.local: ${falta.join(", ")}`);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 1500 } });

const ok = [];
const fallos = [];

for (const f of FLYERS) {
  const url = `${BASE}/thumb?id=${f.id}&format=portrait`;
  try {
    await pagina.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // El renderer marca el <body> cuando ha acabado de cargar TODAS las
    // imágenes de R2. Sin esta espera se capturan flyers a medio dibujar.
    await pagina.waitForSelector('body[data-thumb-state="ready"]', { timeout: 45000 });

    const png = await pagina.locator("#thumb-canvas").screenshot({ type: "png" });

    // 720px de ancho: las tarjetas miden 300px CSS y escalan hasta 1.5× con
    // el iman -> 450px, con margen para retina. WebP y no PNG: en flyers con
    // foto el PNG salia a ~115 KB de media (1,4 MB los 12) y esto va en la
    // home. WebP q82 es ~4x menos sin diferencia visible a este tamaño.
    const optimizado = await sharp(png).resize({ width: 720 }).webp({ quality: 82 }).toBuffer();

    const key = `flyers/showcase/${f.id}.webp`;
    await s3.send(new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: optimizado,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    const kb = Math.round(optimizado.length / 1024);
    console.log(`✓ #${f.id} ${f.titulo.padEnd(24)} ${String(kb).padStart(4)} KB → ${key}`);
    ok.push({ ...f, key });
  } catch (e) {
    console.log(`✗ #${f.id} ${f.titulo} — ${e.message.split("\n")[0]}`);
    fallos.push(f);
  }
}

await navegador.close();

if (!ok.length) throw new Error("No se generó ninguna miniatura — ¿está levantado el dev server?");

// Fuera del template literal: una regex escapada dentro de él rompe el parser.
const publicBase = env.R2_PUBLIC_URL.endsWith("/")
  ? env.R2_PUBLIC_URL.slice(0, -1)
  : env.R2_PUBLIC_URL;

const ts = `// AUTOGENERADO por scripts/flyer-thumbs.mjs — no editar a mano.
// Los PNG viven en R2; regenerar con:  node scripts/flyer-thumbs.mjs
export type FlyerShowcase = { id: number; titulo: string; src: string };

export const FLYERS_SHOWCASE: FlyerShowcase[] = [
${ok.map((f) => `  { id: ${f.id}, titulo: ${JSON.stringify(f.titulo)}, src: "${publicBase}/${f.key}" },`).join("\n")}
];
`;
writeFileSync(resolve(ROOT, "data/flyerShowcase.ts"), ts);

console.log(`\n${ok.length}/${FLYERS.length} miniaturas subidas.`);
if (fallos.length) console.log(`Fallaron: ${fallos.map((f) => "#" + f.id).join(", ")}`);
console.log("data/flyerShowcase.ts actualizado.");
