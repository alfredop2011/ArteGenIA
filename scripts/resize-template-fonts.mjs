// scripts/resize-template-fonts.mjs — Bulk resize fontSize en templates.ts
//
// Decision del usuario (Z+1): los tamaños pequeños (11/13/14) eran ilegibles
// en mobile. Subir según reglas:
//
//   fontSize 11 + ≤3 palabras  →  21
//   fontSize 11 + >3 palabras  →  15
//   fontSize 13 + ≤3 palabras  →  31
//   fontSize 13 + >3 palabras  →  25
//   fontSize 14 + ≤3 palabras  →  40
//   fontSize 14 + >3 palabras  →  33
//
// Las palabras se cuentan por tokens separados por espacios (incluyendo "·",
// "—" y similares — cada token ocupa espacio visual igual).
//
// Uso:
//   node scripts/resize-template-fonts.mjs            # dry-run, solo lista
//   node scripts/resize-template-fonts.mjs --apply    # escribe templates.ts

import { readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../data/templates.ts", import.meta.url);
const APPLY = process.argv.includes("--apply");

const RULES = {
  11: { many: 15, few: 21 },
  13: { many: 25, few: 31 },
  14: { many: 33, few: 40 },
};

const src = await readFile(FILE, "utf8");
const lines = src.split("\n");

let changes = 0;
const summary = { 11: { many: 0, few: 0 }, 13: { many: 0, few: 0 }, 14: { many: 0, few: 0 } };
const samples = [];

const out = lines.map((line) => {
  // Match en cualquier orden de props: fontSize: N + text: "..."
  for (const sizeStr of Object.keys(RULES)) {
    const size = Number(sizeStr);
    const fontSizeRe = new RegExp(`fontSize:\\s*${size}\\s*,`);
    if (!fontSizeRe.test(line)) continue;

    const textMatch = line.match(/text:\s*"((?:\\.|[^"\\])*)"/);
    if (!textMatch) continue;

    const text = textMatch[1];
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const newSize = wordCount > 3 ? RULES[size].many : RULES[size].few;

    summary[size][wordCount > 3 ? "many" : "few"] += 1;
    changes += 1;
    if (samples.length < 12) {
      samples.push({ from: size, to: newSize, words: wordCount, text: text.slice(0, 60) });
    }

    return line.replace(fontSizeRe, `fontSize: ${newSize},`);
  }
  return line;
});

console.log(`\n=== Bulk resize fontSize — ${APPLY ? "APPLY" : "DRY-RUN"} ===\n`);
console.log("Cambios por tamaño origen:");
for (const [size, counts] of Object.entries(summary)) {
  const total = counts.many + counts.few;
  console.log(`  ${size} → ${RULES[size].few} (≤3 palabras): ${counts.few}`);
  console.log(`  ${size} → ${RULES[size].many} (>3 palabras): ${counts.many}`);
  console.log(`  Total ${size}: ${total}`);
}
console.log(`\nTotal cambios: ${changes}\n`);

console.log("Muestra (primeros 12):");
for (const s of samples) {
  console.log(`  ${s.from} → ${s.to}  (${s.words} palabras)  "${s.text}"`);
}

if (APPLY) {
  await writeFile(FILE, out.join("\n"), "utf8");
  console.log(`\n✓ Escrito en data/templates.ts (${changes} líneas modificadas)`);
} else {
  console.log(`\n--- DRY-RUN: no se escribió. Re-ejecuta con --apply para persistir.`);
}
