// scripts/resize-template-fonts.mjs — Bulk resize fontSize en templates.ts
//
// Ronda 2 (refinada): tras la primera pasada (11/13/14 → 21/31/40), algunos
// tamaños quedaron demasiado grandes y el 12 se quedó sin tocar. Reglas:
//
//   fontSize 12 + ≤2 palabras  →  25
//   fontSize 12 + >2 palabras  →  21
//   fontSize 31 + ≤2 palabras  →  27
//   fontSize 31 + >2 palabras  →  25
//   fontSize 40 + ≤2 palabras  →  35
//   fontSize 40 + >2 palabras  →  30
//   fontSize 50 (cualquiera)   →  45
//
// El umbral cambia de >3 a >2 palabras en esta ronda (más estricto).
//
// Tokens separados por espacios cuentan como palabras (incluyendo "·" y "—"
// porque ocupan espacio visual igual).
//
// Uso:
//   node scripts/resize-template-fonts.mjs            # dry-run, solo lista
//   node scripts/resize-template-fonts.mjs --apply    # escribe templates.ts

import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../data/templates.ts", import.meta.url);
const APPLY = process.argv.includes("--apply");

// Cada entrada: { many: tamañoSiTextoLargo, few: tamañoSiTextoCorto, threshold: nPalabras }
// Si no hay threshold, se aplica `few` siempre (caso del 50).
const RULES = {
  12: { many: 21, few: 25, threshold: 2 },
  31: { many: 25, few: 27, threshold: 2 },
  40: { many: 30, few: 35, threshold: 2 },
  50: { many: 45, few: 45, threshold: 0 }, // sin distinción
};

const src = await readFile(FILE, "utf8");
const lines = src.split("\n");

let changes = 0;
const summary = {};
for (const k of Object.keys(RULES)) summary[k] = { many: 0, few: 0 };
const samples = [];

const out = lines.map((line) => {
  for (const sizeStr of Object.keys(RULES)) {
    const size = Number(sizeStr);
    const fontSizeRe = new RegExp(`fontSize:\\s*${size}\\s*,`);
    if (!fontSizeRe.test(line)) continue;

    const textMatch = line.match(/text:\s*"((?:\\.|[^"\\])*)"/);
    if (!textMatch) continue;

    const text = textMatch[1];
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const rule = RULES[size];
    const isMany = rule.threshold > 0 && wordCount > rule.threshold;
    const newSize = isMany ? rule.many : rule.few;

    summary[size][isMany ? "many" : "few"] += 1;
    changes += 1;
    if (samples.length < 15) {
      samples.push({ from: size, to: newSize, words: wordCount, text: text.slice(0, 60) });
    }

    return line.replace(fontSizeRe, `fontSize: ${newSize},`);
  }
  return line;
});

console.log(`\n=== Bulk resize fontSize (ronda 2) — ${APPLY ? "APPLY" : "DRY-RUN"} ===\n`);
console.log("Cambios por tamaño origen:");
for (const [size, counts] of Object.entries(summary)) {
  const total = counts.many + counts.few;
  const rule = RULES[size];
  if (rule.threshold > 0) {
    console.log(`  ${size} → ${rule.few} (≤${rule.threshold} palabras): ${counts.few}`);
    console.log(`  ${size} → ${rule.many} (>${rule.threshold} palabras): ${counts.many}`);
  } else {
    console.log(`  ${size} → ${rule.few} (sin condición): ${counts.few}`);
  }
  console.log(`  Total ${size}: ${total}`);
}
console.log(`\nTotal cambios: ${changes}\n`);

console.log("Muestra (primeros 15):");
for (const s of samples) {
  console.log(`  ${s.from} → ${s.to}  (${s.words} palabras)  "${s.text}"`);
}

if (APPLY) {
  await writeFile(FILE, out.join("\n"), "utf8");
  console.log(`\n✓ Escrito en data/templates.ts (${changes} líneas modificadas)`);
} else {
  console.log(`\n--- DRY-RUN: no se escribió. Re-ejecuta con --apply para persistir.`);
}
