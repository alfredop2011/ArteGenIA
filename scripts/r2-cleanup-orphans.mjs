// scripts/r2-cleanup-orphans.mjs — Garbage collection de huérfanos en R2.
//
// Por qué existe: archivos R2 quedaron huérfanos antes de Z.8.2 (DELETE
// asset solo borraba DB, no R2). Este script los detecta y opcionalmente
// los borra. Reusable para cualquier huérfano futuro generado por bugs
// que dejen archivos sin referencia.
//
// SEGURIDAD — varias salvaguardas para NO borrar archivos en uso:
//   1. Default DRY-RUN: solo lista, no borra. Hay que pasar --apply.
//   2. Solo considera archivos con LastModified > 30 días — los recientes
//      pueden estar siendo subidos/usados por sesiones activas.
//   3. Escanea TODAS las tablas que referencian R2:
//        - user_assets.storage_key (mis recursos)
//        - collaborators.photo_url
//        - projects.thumbnail_url
//        - projects.fabric_json (regex sobre el JSON entero — los flyers
//          tienen URLs R2 embebidas como src de imágenes Fabric)
//   4. Logs de qué se va a borrar antes (en --apply pide CONFIRM=yes env)
//
// Uso:
//   npm run r2:cleanup                # dry-run, solo reporta
//   CONFIRM=yes npm run r2:cleanup:apply  # borra de verdad
//
// Requiere R2_* + SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL
// en .env.local.

import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl || !supabaseUrl || !serviceKey) {
  console.error("✖ Faltan env vars. Necesitas:");
  console.error("  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL");
  console.error("  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const minAgeDays = Number(process.env.MIN_AGE_DAYS ?? "30");
const minAgeMs = minAgeDays * 24 * 60 * 60 * 1000;
const cutoffDate = new Date(Date.now() - minAgeMs);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// ─── 1. Listar TODOS los objects de R2 (paginado) ────────────────────
async function listAllR2() {
  console.log("→ Listando objetos R2…");
  const all = [];
  let continuationToken;
  let pageNum = 0;
  do {
    pageNum++;
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) {
        all.push({
          key: obj.Key,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified ?? new Date(0),
        });
      }
    }
    process.stdout.write(`  página ${pageNum}: ${all.length} acumulados\r`);
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  console.log(`\n  Total: ${all.length} objetos en R2`);
  return all;
}

// ─── 2. Construir set de keys "vivas" (referenciadas en DB) ──────────
async function getLiveKeys() {
  console.log("→ Escaneando DB para keys vivas…");
  const live = new Set();

  // Extrae la "key" de una URL R2 pública (ej. "flyers/artist/123.png")
  function extractKey(url) {
    if (typeof url !== "string") return null;
    if (url.startsWith(publicUrl + "/")) {
      return url.slice(publicUrl.length + 1).split("?")[0];
    }
    // También aceptar URL pub-XXX.r2.dev si publicUrl difiere
    const m = url.match(/r2\.dev\/(.+?)(?:\?|$)/);
    if (m) return m[1];
    return null;
  }

  // 2a. user_assets.storage_key
  const { data: assets } = await supabase
    .from("user_assets")
    .select("storage_key,url");
  for (const a of assets ?? []) {
    if (a.storage_key) live.add(a.storage_key);
    const k = extractKey(a.url);
    if (k) live.add(k);
  }
  console.log(`  user_assets: ${assets?.length ?? 0} rows`);

  // 2b. collaborators.photo_url
  const { data: collabs } = await supabase
    .from("collaborators")
    .select("photo_url");
  for (const c of collabs ?? []) {
    const k = extractKey(c.photo_url);
    if (k) live.add(k);
  }
  console.log(`  collaborators: ${collabs?.length ?? 0} rows`);

  // 2c. projects: thumbnail_url + fabric_json (escaneo regex)
  const { data: projects } = await supabase
    .from("projects")
    .select("thumbnail_url,fabric_json");
  for (const p of projects ?? []) {
    const k = extractKey(p.thumbnail_url);
    if (k) live.add(k);
    // fabric_json puede tener URLs R2 embebidas en image src, backgrounds, etc.
    if (p.fabric_json) {
      const jsonStr = typeof p.fabric_json === "string"
        ? p.fabric_json
        : JSON.stringify(p.fabric_json);
      const matches = jsonStr.matchAll(/r2\.dev\/([^"'?\s]+)/g);
      for (const m of matches) live.add(m[1]);
    }
  }
  console.log(`  projects: ${projects?.length ?? 0} rows`);

  // 2d. templates_draft.thumbnail_url (puede no existir)
  try {
    const { data: drafts } = await supabase
      .from("templates_draft")
      .select("thumbnail_url");
    for (const d of drafts ?? []) {
      const k = extractKey(d.thumbnail_url);
      if (k) live.add(k);
    }
    console.log(`  templates_draft: ${drafts?.length ?? 0} rows`);
  } catch {
    console.log("  templates_draft: (skip, tabla no existe)");
  }

  console.log(`  TOTAL keys vivas: ${live.size}`);
  return live;
}

// ─── 3. Detectar huérfanos ────────────────────────────────────────────
function findOrphans(allR2, liveKeys) {
  const orphans = [];
  for (const obj of allR2) {
    if (liveKeys.has(obj.key)) continue;            // referenciado
    if (obj.lastModified >= cutoffDate) continue;   // reciente, skip por seguridad
    orphans.push(obj);
  }
  return orphans;
}

// ─── 4. Borrar (en --apply) ──────────────────────────────────────────
async function deleteOrphans(orphans) {
  // R2 DeleteObjects acepta max 1000 keys por batch
  let deleted = 0;
  for (let i = 0; i < orphans.length; i += 1000) {
    const batch = orphans.slice(i, i + 1000);
    const res = await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map(o => ({ Key: o.key })) },
      }),
    );
    deleted += res.Deleted?.length ?? 0;
    if (res.Errors?.length) {
      console.warn(`  ⚠ ${res.Errors.length} errores en batch ${i / 1000 + 1}:`);
      for (const err of res.Errors) {
        console.warn(`    ${err.Key}: ${err.Message}`);
      }
    }
    console.log(`  Borrados ${deleted}/${orphans.length}…`);
  }
  return deleted;
}

// ─── MAIN ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`Bucket: ${bucket}`);
  console.log(`Modo: ${apply ? "APPLY (borra de verdad)" : "DRY-RUN (solo lista)"}`);
  console.log(`Cutoff: archivos modificados antes de ${cutoffDate.toISOString()} (>${minAgeDays} días)`);
  console.log("");

  const [allR2, liveKeys] = await Promise.all([listAllR2(), getLiveKeys()]);
  console.log("");

  const orphans = findOrphans(allR2, liveKeys);
  const totalSize = orphans.reduce((sum, o) => sum + o.size, 0);
  const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

  console.log(`→ Huérfanos detectados: ${orphans.length} archivos, ${sizeMB} MB`);
  console.log("");

  if (orphans.length === 0) {
    console.log("✔ Nada que limpiar.");
    return;
  }

  // Mostrar sample de los primeros 20
  console.log("Sample (primeros 20):");
  for (const o of orphans.slice(0, 20)) {
    const ageDays = Math.floor((Date.now() - o.lastModified.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`  ${o.key}  ·  ${(o.size / 1024).toFixed(1)} KB  ·  ${ageDays}d`);
  }
  if (orphans.length > 20) {
    console.log(`  … y ${orphans.length - 20} más`);
  }
  console.log("");

  if (!apply) {
    console.log("ℹ Dry-run. Para borrar de verdad:");
    console.log("    CONFIRM=yes npm run r2:cleanup:apply");
    return;
  }

  if (process.env.CONFIRM !== "yes") {
    console.error("✖ --apply requiere CONFIRM=yes en env para evitar borrados accidentales");
    process.exit(1);
  }

  console.log("→ Borrando…");
  const deleted = await deleteOrphans(orphans);
  console.log("");
  console.log(`✔ ${deleted} archivos borrados (~${sizeMB} MB liberados)`);
}

main().catch(err => {
  console.error("✖ Error:", err);
  process.exit(1);
});
