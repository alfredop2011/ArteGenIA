// scripts/r2-cors-apply.mjs — Aplica la política CORS al bucket R2.
//
// Por qué existe: la política CORS del bucket R2 se ha perdido más de una
// vez (re-deploy del bucket o cambios en Cloudflare). Sin CORS, el editor
// falla al cargar imágenes de modelos, masks, y "Mis recursos" da
// "Origin not allowed by Access-Control-Allow-Origin".
//
// Política canónica vive en este archivo (CORS_POLICY) — es la SINGLE
// SOURCE OF TRUTH. Si la cambias aquí + ejecutas el script, queda aplicada.
//
// Uso:
//   npm run r2:cors            # aplica
//   npm run r2:cors -- --check # solo lee y compara, no escribe
//
// Requiere R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
// R2_BUCKET_NAME en .env.local (las mismas de lib/r2.ts). npm cargará el
// archivo via --env-file gracias al script en package.json.

import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from "@aws-sdk/client-s3";

// ─── POLÍTICA CANÓNICA ─────────────────────────────────────────────────
// Coincide con la documentada en CLAUDE.md. Si añades dominios (preview
// custom, etc.) edita AQUÍ y re-ejecuta.
const CORS_POLICY = [
  {
    AllowedOrigins: [
      "http://localhost:3000",
      "https://artegenia.com",
      "https://www.artegenia.com",
      "https://artegenia.vercel.app",
      "https://*.vercel.app",
    ],
    AllowedMethods: ["GET", "HEAD"],
    AllowedHeaders: ["*"],
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  },
];

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error("✖ Faltan env vars R2. Define en .env.local:");
  console.error("  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME");
  console.error("");
  console.error("Tip: este script las carga con `node --env-file=.env.local`.");
  console.error("     Usa `npm run r2:cors` que ya lo configura.");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function readCurrent() {
  try {
    const res = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
    return res.CORSRules ?? null;
  } catch (err) {
    const code = err?.Code ?? err?.name;
    if (code === "NoSuchCORSConfiguration") return null;
    throw err;
  }
}

async function apply() {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: CORS_POLICY },
    }),
  );
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  console.log(`Bucket: ${bucket}  (account ${accountId.slice(0, 8)}…)`);
  console.log("Política canónica:");
  console.log(JSON.stringify(CORS_POLICY, null, 2));
  console.log("");

  console.log("→ Leyendo CORS actual del bucket…");
  const current = await readCurrent();
  if (!current) {
    console.log("  (sin política)");
  } else {
    console.log("  Actual:");
    console.log(JSON.stringify(current, null, 2));
  }
  console.log("");

  if (checkOnly) {
    const equal = JSON.stringify(current) === JSON.stringify(CORS_POLICY);
    console.log(equal ? "✔ Coincide con la política canónica" : "✖ NO coincide");
    process.exit(equal ? 0 : 2);
  }

  console.log("→ Aplicando política canónica…");
  await apply();
  console.log("✔ Aplicada");
  console.log("");
  console.log("Espera ~1 min a que Cloudflare propague.");
  console.log("Luego hard refresh (Cmd+Shift+R) y verifica en DevTools Network");
  console.log("que las imágenes de R2 cargan sin errores CORS.");
}

main().catch((err) => {
  console.error("✖ Error:", err);
  process.exit(1);
});
