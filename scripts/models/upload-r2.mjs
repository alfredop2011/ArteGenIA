// Sube los modelos curados a R2 bajo models/generated/<vertical>/<id>.png
//
// ⚠️ SOLO ESCRIBE. Nunca borra: este bucket está compartido con peligroficial.
// Idempotente — re-subir sobrescribe la misma key, no duplica.

import { S3Client, PutObjectCommand } from "/Users/developdanger/PhpstormProjects/artegenia/node_modules/@aws-sdk/client-s3/dist-cjs/index.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = "/Users/developdanger/PhpstormProjects/artegenia";
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

// Descartados en la curación manual
const DESCARTES = new Set([
  "musico-medio-hana", // BiRefNet borró el teclado → teclea en el aire
]);

const { BATCH } = await import(resolve("./batch-lote.mjs"));
const subir = BATCH.filter((m) => !DESCARTES.has(m.id));

const subidas = [];
for (const m of subir) {
  const file = resolve("./lote", `${m.id}.png`);
  if (!existsSync(file)) { console.log(`✗ ${m.id} — no existe el fichero`); continue; }
  const body = readFileSync(file);
  const key = `models/generated/${m.r2}/${m.id}.png`;
  await s3.send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: "image/png",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  const url = `${env.R2_PUBLIC_URL}/${key}`;
  subidas.push({ id: m.id, vertical: m.vertical, r2: m.r2, key, url, kb: Math.round(body.length / 1024) });
  console.log(`↑ ${key.padEnd(52)} ${String(Math.round(body.length / 1024)).padStart(4)}KB`);
}

console.log(`\n${subidas.length} subidas · ${DESCARTES.size} descartadas`);

// Verificación real: descargar una de vuelta desde la URL pública
const test = subidas[0];
const res = await fetch(test.url);
console.log(`\nVerificación → GET ${test.url}`);
console.log(`  ${res.status} ${res.headers.get("content-type")} ${res.headers.get("content-length")}b`);

const { writeFileSync } = await import("node:fs");
writeFileSync(resolve("./subidas.json"), JSON.stringify(subidas, null, 2));
console.log(`\nÍndice → subidas.json`);
