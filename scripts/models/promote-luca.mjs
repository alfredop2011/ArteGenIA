// Promociona luca-a como el nuevo bail-cuerpo-luca.
//
// Sube con key NUEVA (-v2) en vez de sobrescribir: R2 sirve con
// CacheControl immutable, así que reusar la key puede dejar la versión mala
// cacheada en el CDN. El id del catálogo no cambia — solo el src.
import { S3Client, PutObjectCommand } from "/Users/developdanger/PhpstormProjects/artegenia/node_modules/@aws-sdk/client-s3/dist-cjs/index.js";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const env = Object.fromEntries(
  readFileSync("/Users/developdanger/PhpstormProjects/artegenia/.env.local", "utf8")
    .split("\n").map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/)).filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^["']|["']$/g, "")]),
);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

// El candidato elegido pasa a ser el fichero local canónico
copyFileSync(resolve("luca/luca-a.png"), resolve("lote/bail-cuerpo-luca.png"));

const KEY = "models/generated/dance/bail-cuerpo-luca-v2.png";
const body = readFileSync(resolve("lote/bail-cuerpo-luca.png"));
await s3.send(new PutObjectCommand({
  Bucket: env.R2_BUCKET_NAME, Key: KEY, Body: body,
  ContentType: "image/png", CacheControl: "public, max-age=31536000, immutable",
}));
console.log(`↑ ${KEY}  ${Math.round(body.length / 1024)}KB`);

// Apuntar el índice a la key nueva (el .png viejo se queda huérfano en R2:
// no lo borro, el bucket es compartido)
const idx = JSON.parse(readFileSync(resolve("subidas.json"), "utf8"));
const row = idx.find((r) => r.id === "bail-cuerpo-luca");
row.key = KEY;
row.url = `${env.R2_PUBLIC_URL}/${KEY}`;
writeFileSync(resolve("subidas.json"), JSON.stringify(idx, null, 2));

const res = await fetch(row.url);
console.log(`Verificación → ${res.status} ${res.headers.get("content-type")} ${res.headers.get("content-length")}b`);
