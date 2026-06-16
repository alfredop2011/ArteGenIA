// scripts/brand-export.mjs — Genera todos los tamanos del logo desde las
// fuentes en public/brand/source/.
//
// Por que existe: tenemos 3 PNGs fuente (horizontal, app-icon, icon solo)
// generados con ChatGPT. La app necesita los mismos en muchos tamanos
// (favicon, OG image, foto perfil IG, app icon iOS, etc.). Este script
// los genera de una vez con sharp.
//
// Uso:
//   npm run brand:export
//
// Si quieres regenerar tras cambiar el logo, simplemente reemplaza los
// PNGs en public/brand/source/ con los mismos nombres y vuelve a correr.

import sharp from "sharp";
import { mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE = join(ROOT, "public/brand/source");
const EXPORTS = join(ROOT, "public/brand/exports");

const TARGETS = [
  // Desde el icono solo (fondo transparente)
  { source: "logo-icon.png",       out: "icon-32.png",   size: 32 },
  { source: "logo-icon.png",       out: "icon-180.png",  size: 180 },
  { source: "logo-icon.png",       out: "icon-512.png",  size: 512 },
  { source: "logo-icon.png",       out: "icon-1024.png", size: 1024 },

  // Desde el app icon (con fondo gradiente — mejor para foto perfil)
  { source: "logo-app-icon.png",   out: "ig-profile.png",   size: 1080 },
  { source: "logo-app-icon.png",   out: "apple-touch.png",  size: 180 },

  // Desde el horizontal (con texto) — para OG y banners
  { source: "logo-horizontal.png", out: "og-default.png", width: 1200, height: 630, fit: "contain", background: "#0B0717" },
  { source: "logo-horizontal.png", out: "banner-wide.png", width: 1500, height: 500, fit: "contain", background: "#0B0717" },
];

function check(file) {
  const path = join(SOURCE, file);
  if (!existsSync(path)) {
    console.error(`✖ Falta el archivo fuente: ${path}`);
    console.error(`  Anadelo y reintenta. Ver public/brand/source/README.md`);
    return false;
  }
  const sizeKB = (statSync(path).size / 1024).toFixed(0);
  console.log(`✔ ${file}  (${sizeKB} KB)`);
  return true;
}

async function exportTarget(t) {
  const input = join(SOURCE, t.source);
  const output = join(EXPORTS, t.out);

  let pipeline = sharp(input);

  if (t.size) {
    pipeline = pipeline.resize(t.size, t.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
  } else if (t.width && t.height) {
    pipeline = pipeline.resize(t.width, t.height, {
      fit: t.fit || "contain",
      background: t.background ? hexToRgba(t.background) : { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  await pipeline.png({ quality: 95, compressionLevel: 9 }).toFile(output);
  const sizeKB = (statSync(output).size / 1024).toFixed(0);
  console.log(`  -> ${t.out}  (${sizeKB} KB)`);
}

function hexToRgba(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    alpha: 1,
  };
}

async function main() {
  console.log("Brand export — generando tamanos derivados");
  console.log(`Source: ${SOURCE}`);
  console.log(`Output: ${EXPORTS}`);
  console.log("");

  console.log("Verificando fuentes:");
  const required = ["logo-horizontal.png", "logo-app-icon.png", "logo-icon.png"];
  const allOk = required.every(check);
  if (!allOk) process.exit(1);
  console.log("");

  mkdirSync(EXPORTS, { recursive: true });

  console.log("Generando exports:");
  for (const t of TARGETS) {
    await exportTarget(t);
  }
  console.log("");
  console.log(`✔ ${TARGETS.length} archivos exportados a public/brand/exports/`);
  console.log("");
  console.log("Tip: para que Next.js sirva el favicon automaticamente,");
  console.log("copia exports/icon-32.png a app/icon.png:");
  console.log("  cp public/brand/exports/icon-32.png app/icon.png");
}

main().catch((err) => {
  console.error("✖ Error:", err);
  process.exit(1);
});
