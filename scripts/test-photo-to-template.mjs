#!/usr/bin/env node
/**
 * Test rápido: ¿Claude Haiku 4.5 con visión detecta bien los bounding boxes
 * de un flyer para implementar "Capas Mágicas"?
 *
 * Uso:
 *   node scripts/test-photo-to-template.mjs <URL_imagen>
 *
 * Carga ANTHROPIC_API_KEY desde .env.local automáticamente.
 *
 * Mide:
 *   - Tiempo total (latencia real)
 *   - Tokens consumidos (coste exacto)
 *   - Cantidad de layers detectados
 *   - Calidad: imprime el JSON para inspección manual
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carga manual de .env.local (sin dependencias)
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("❌ Falta ANTHROPIC_API_KEY en .env.local");
  process.exit(1);
}

const imageUrl = process.argv[2];
if (!imageUrl) {
  console.error("Uso: node scripts/test-photo-to-template.mjs <URL_imagen>");
  process.exit(1);
}

const MODEL = process.env.TEST_MODEL || "claude-haiku-4-5-20251001";

console.log(`📥 Descargando imagen: ${imageUrl.slice(0, 80)}...`);
const imgRes = await fetch(imageUrl);
if (!imgRes.ok) {
  console.error(`❌ No se pudo descargar la imagen: ${imgRes.status}`);
  process.exit(1);
}
const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
const imgBase64 = imgBuffer.toString("base64");
const contentType = imgRes.headers.get("content-type") || "image/jpeg";
const mediaType = contentType.startsWith("image/") ? contentType : "image/jpeg";

console.log(`✅ Imagen descargada: ${(imgBuffer.length / 1024).toFixed(1)} KB`);
console.log(`🤖 Modelo: ${MODEL}`);
console.log(`📤 Enviando a Claude...\n`);

const PROMPT = `Analiza este flyer/poster y detecta TODOS los elementos editables que ves.
Para cada elemento devuelve sus coordenadas EXACTAS de bounding box.

Coordenadas: usa porcentajes 0-100 del ancho/alto de la imagen
(NO píxeles absolutos). x=0 es izquierda, y=0 es arriba.

Tipos de elementos a detectar:
- "text": cualquier texto visible (títulos, fechas, nombres, descripciones, listas).
  Incluye su contenido exacto (OCR), tamaño relativo y color aproximado.
- "image-region": personas, fotos, ilustraciones, logos. Un bbox por elemento visual independiente.
- "shape": rectángulos de color, separadores, marcos decorativos.

Devuelve SOLO el JSON, sin texto extra. Estructura:
{
  "imageWidth": número aproximado del ancho original,
  "imageHeight": número aproximado del alto original,
  "dominantColors": ["#hex1", "#hex2", "#hex3"],
  "layers": [
    {
      "type": "text",
      "content": "texto exacto",
      "x": 12.5, "y": 8.3, "w": 35, "h": 6.2,
      "fontSize": "large|medium|small",
      "color": "#RRGGBB",
      "weight": "bold|regular"
    },
    {
      "type": "image-region",
      "label": "descripción corta (ej. DJ central, grupo de personas)",
      "x": 20, "y": 35, "w": 60, "h": 40
    },
    {
      "type": "shape",
      "color": "#RRGGBB",
      "x": 0, "y": 90, "w": 100, "h": 10
    }
  ]
}

Sé exhaustivo: detecta TODOS los elementos visibles, incluso textos pequeños.`;

const t0 = Date.now();
const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  body: JSON.stringify({
    model: MODEL,
    max_tokens: 8000,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imgBase64 },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  }),
});

const elapsed = ((Date.now() - t0) / 1000).toFixed(2);

if (!apiRes.ok) {
  const errText = await apiRes.text();
  console.error(`❌ Error ${apiRes.status} de Anthropic:\n${errText}`);
  process.exit(1);
}

const data = await apiRes.json();
const text = data.content?.[0]?.text || "";
const inputTokens = data.usage?.input_tokens ?? 0;
const outputTokens = data.usage?.output_tokens ?? 0;

// Pricing oficial Anthropic (per 1M tokens, USD)
const PRICING = {
  "claude-haiku-4-5-20251001": { in: 1.0, out: 5.0 },
  "claude-sonnet-4-6": { in: 3.0, out: 15.0 },
  "claude-opus-4-7": { in: 15.0, out: 75.0 },
};
const price = PRICING[MODEL] || { in: 1.0, out: 5.0 };
const cost = (inputTokens * price.in + outputTokens * price.out) / 1_000_000;

console.log("═══════════════════════════════════════════════════════");
console.log("📊 MÉTRICAS");
console.log("═══════════════════════════════════════════════════════");
console.log(`⏱  Tiempo:        ${elapsed}s`);
console.log(`📥 Input tokens:  ${inputTokens.toLocaleString()}`);
console.log(`📤 Output tokens: ${outputTokens.toLocaleString()}`);
console.log(`💰 Coste:         $${cost.toFixed(4)} USD`);
console.log("═══════════════════════════════════════════════════════\n");

// Intentar parsear el JSON — robusto a wrappers ```json y texto extra.
// Estrategia: buscar el primer "{" y el último "}" matching y extraer todo entre.
let parsed = null;
try {
  let cleaned = text.trim();
  // Quitar wrappers markdown si los hay
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  // Si aún hay texto antes/después del JSON, extraer entre primer "{" y último "}"
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  parsed = JSON.parse(cleaned);
} catch (e) {
  console.warn(`⚠ El output no es JSON válido. Esto es lo que devolvió:\n`);
  console.log(text);
  process.exit(1);
}

console.log("✅ JSON parseado correctamente");
console.log(`📐 Dimensiones reportadas: ${parsed.imageWidth} × ${parsed.imageHeight}`);
console.log(`🎨 Colores dominantes:    ${(parsed.dominantColors || []).join(", ")}`);
console.log(`📑 Total layers detectados: ${parsed.layers?.length ?? 0}\n`);

if (parsed.layers) {
  const byType = parsed.layers.reduce((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1;
    return acc;
  }, {});
  console.log("Desglose por tipo:");
  for (const [t, count] of Object.entries(byType)) {
    console.log(`  ${t.padEnd(15)} ${count}`);
  }
  console.log();
}

console.log("═══════════════════════════════════════════════════════");
console.log("📄 OUTPUT COMPLETO (primeros 5 layers):");
console.log("═══════════════════════════════════════════════════════");
const preview = { ...parsed, layers: (parsed.layers || []).slice(0, 5) };
console.log(JSON.stringify(preview, null, 2));

if ((parsed.layers || []).length > 5) {
  console.log(`\n... y ${parsed.layers.length - 5} layers más (omitidos del preview)`);
}

// Guardar JSON completo a archivo
const outFile = path.join(__dirname, "..", "test-photo-output.json");
fs.writeFileSync(outFile, JSON.stringify(parsed, null, 2));
console.log(`\n💾 JSON completo guardado en: test-photo-output.json`);
