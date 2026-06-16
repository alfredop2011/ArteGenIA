// scripts/db-backup.mjs — Backup manual del DB Supabase con pg_dump.
//
// Por qué existe: Supabase Free no permite descargar backups automaticos
// desde dashboard. Este script hace un snapshot completo (schema + datos)
// usando pg_dump y lo guarda en ~/artegenia-backups/.
//
// Uso:
//   npm run db:backup              # snapshot nuevo + lista rotacion
//   npm run db:backup -- --list    # solo lista backups existentes
//
// Requiere:
//   - pg_dump instalado (brew install libpq && brew link --force libpq)
//   - DATABASE_URL en .env.local (connection string Supabase direct)
//
// Rotacion: borra automaticamente backups locales > 30 dias.
//
// Cuando migrar a algo mas robusto:
//   - Supabase Pro ($25/mes) -> PITR automatico, no necesitas este script
//   - GitHub Actions cron diario que ejecuta esto + sube a R2 bucket privado

import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BACKUP_DIR = join(homedir(), "artegenia-backups");
const RETENTION_DAYS = 30;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("✖ Falta env var DATABASE_URL");
  console.error("");
  console.error("Anadela a .env.local con la connection string de Supabase:");
  console.error('  DATABASE_URL="postgresql://postgres.XXX:[PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:5432/postgres"');
  console.error("");
  console.error("Como obtenerla:");
  console.error("  Supabase Dashboard -> Settings -> Database -> Connection string");
  console.error("  Modo: Direct connection (NO Transaction pooler)");
  console.error("  Sustituye [YOUR-PASSWORD] por tu password real");
  process.exit(1);
}

// Verifica que pg_dump existe
try {
  execSync("pg_dump --version", { stdio: "pipe" });
} catch {
  console.error("✖ pg_dump no esta instalado");
  console.error("");
  console.error("Instala con Homebrew:");
  console.error("  brew install libpq");
  console.error("  brew link --force libpq");
  process.exit(1);
}

function listBackups() {
  try {
    const files = readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("backup-") && f.endsWith(".sql"))
      .map((f) => {
        const path = join(BACKUP_DIR, f);
        const stats = statSync(path);
        return { name: f, path, size: stats.size, mtime: stats.mtime };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    return files;
  } catch {
    return [];
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function rotateOldBackups() {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const backups = listBackups();
  const old = backups.filter((b) => b.mtime.getTime() < cutoff);
  for (const b of old) {
    unlinkSync(b.path);
    console.log(`  ✖ Borrado (>${RETENTION_DAYS}d): ${b.name}`);
  }
  return old.length;
}

function makeBackup() {
  mkdirSync(BACKUP_DIR, { recursive: true });

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  const filename = `backup-${timestamp}.sql`;
  const path = join(BACKUP_DIR, filename);

  console.log(`→ pg_dump -> ${path}`);
  console.log("  (puede tardar 30s-2min segun tamano del DB)");

  const start = Date.now();
  execSync(
    `pg_dump "${databaseUrl}" --no-owner --no-acl --clean --if-exists -f "${path}"`,
    { stdio: "inherit" },
  );
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const stats = statSync(path);
  console.log(`✔ Backup completo en ${elapsed}s (${formatSize(stats.size)})`);
  console.log("");

  return path;
}

function main() {
  const listOnly = process.argv.includes("--list");

  console.log(`Backup dir: ${BACKUP_DIR}`);
  console.log("");

  if (listOnly) {
    const backups = listBackups();
    if (backups.length === 0) {
      console.log("(sin backups)");
      return;
    }
    console.log(`${backups.length} backups encontrados:`);
    console.log("");
    for (const b of backups) {
      const age = Math.floor((Date.now() - b.mtime.getTime()) / (24 * 60 * 60 * 1000));
      console.log(`  ${b.name}  ${formatSize(b.size).padStart(10)}  ${age}d`);
    }
    return;
  }

  makeBackup();

  console.log("→ Rotacion (borrar backups > 30 dias)");
  const deleted = rotateOldBackups();
  if (deleted === 0) console.log("  (nada que borrar)");
  console.log("");

  console.log("Backups actuales:");
  const backups = listBackups();
  for (const b of backups.slice(0, 5)) {
    const age = Math.floor((Date.now() - b.mtime.getTime()) / (24 * 60 * 60 * 1000));
    console.log(`  ${b.name}  ${formatSize(b.size).padStart(10)}  ${age}d`);
  }
  if (backups.length > 5) console.log(`  ... y ${backups.length - 5} mas`);
  console.log("");
  console.log("Tip: copia el ultimo .sql a Drive/Dropbox para tener red de seguridad off-Mac.");
  console.log("Restaurar: psql \"$DATABASE_URL\" < backup-XXX.sql");
}

main();
