// Generador de modelos por VERTICAL. Cada vertical clona el encuadre de las
// fotos que ya hay en R2 (medido con measure.mjs), porque los slots del
// catálogo (data/danceModels.ts) asumen ese encuadre.
//
//   uso: node gen.mjs <outdir> <batchfile.mjs>
//
// El batch exporta: [{ id, vertical, desc }]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = "/Users/developdanger/PhpstormProjects/artegenia";
const [outArg, batchArg] = process.argv.slice(2);
const OUT = resolve(outArg);
mkdirSync(OUT, { recursive: true });

const env = readFileSync(resolve(ROOT, ".env.local"), "utf8");
const FAL_KEY = env.match(/^FAL_KEY=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!FAL_KEY) throw new Error("FAL_KEY no encontrada en .env.local");

const BASE = "soft dramatic studio lighting, subtle rim light, plain seamless light grey studio background, "
  + "high-end commercial editorial photography, sharp focus, photorealistic, ultra detailed natural skin";

// ─── VERTICALES ──────────────────────────────────────────────────────
// framing  → clona el encuadre de la referencia R2 correspondiente
// size     → proporción de la referencia medida
const MANOS = "hands well formed and anatomically correct with exactly five fingers each, "
  + "fingers clearly separated and never fused or extra";

export const VERTICALES = {
  // ✅ VALIDADO (8/8 limpias): sin manos en cuadro → Flux no puede fallar
  cara: {
    ref: "damian/nia — busto cerrado 1254×1254",
    size: { width: 1280, height: 1280 },
    framing: "tight close-up beauty headshot portrait, head and shoulders only, "
      + "cropped just below the collarbone, the face fills a large portion of the frame, "
      + "head near the top edge, centered, direct eye contact, hands not visible",
  },
  // ⚠️ manos visibles — en la sonda salieron blandas pero pasables
  medio: {
    ref: "Profe-jean — medio cuerpo 447×558",
    size: { width: 1024, height: 1280 },
    // "facing the camera" es obligatorio: sin ello Flux devuelve gente de espaldas.
    framing: "half body shot cropped at the hips, the person faces the camera with the face "
      + `clearly visible, full figure centered with headroom, ${MANOS}`,
  },
  // ⚠️ SIN VALIDAR — manos + pies en cuadro
  cuerpo: {
    ref: "nuevo — cuerpo entero vertical",
    size: { width: 896, height: 1344 },
    framing: "full body shot, the entire figure visible from the top of the head to the feet "
      + "with margin above and below, the person faces the camera with the face clearly visible, "
      + `wearing shoes that are fully visible and correctly shaped, centered, ${MANOS}`,
  },
  // ⚠️ SIN VALIDAR — 2 personas
  pareja: {
    ref: "nuevo — pareja cuerpo entero",
    size: { width: 1152, height: 1344 },
    framing: "full body shot of exactly two people together, both entire figures visible from head to feet, "
      + `both faces distinct, sharp and clearly visible, the two centered as one group, ${MANOS}`,
  },
};

const fal = async (model, input) => {
  const r = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Key ${FAL_KEY}` },
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(`${model} → ${r.status}: ${(await r.text()).slice(0, 160)}`);
  return r.json();
};

const one = async (m, i) => {
  const v = VERTICALES[m.vertical];
  if (!v) throw new Error(`vertical desconocido: ${m.vertical}`);
  const t0 = Date.now();
  try {
    const gen = await fal("fal-ai/flux/dev", {
      prompt: `${v.framing}. Subject: ${m.desc}. ${BASE}.`,
      image_size: v.size,
      num_inference_steps: 34,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: true,
      seed: 2000 + i * 7,
    });
    const rawUrl = gen.images?.[0]?.url;
    if (!rawUrl) throw new Error("flux no devolvió imagen");

    const cut = await fal("fal-ai/birefnet/v2", {
      image_url: rawUrl,
      model: "General Use (Light)",
      output_format: "png",
      output_mask: false,
    });
    const cutUrl = cut.image?.url ?? cut.output_image?.url;
    if (!cutUrl) throw new Error("birefnet no devolvió imagen");

    for (const [url, name] of [[rawUrl, `${m.id}_raw.png`], [cutUrl, `${m.id}.png`]]) {
      writeFileSync(resolve(OUT, name), Buffer.from(await (await fetch(url)).arrayBuffer()));
    }
    console.log(`✓ ${m.vertical.padEnd(12)} ${m.id.padEnd(22)} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    return { ...m, ok: true };
  } catch (e) {
    console.log(`✗ ${m.vertical.padEnd(12)} ${m.id.padEnd(22)} ${e.message}`);
    return { ...m, ok: false, error: e.message };
  }
};

const { BATCH } = await import(resolve(batchArg));
const res = await Promise.all(BATCH.map(one));
const ok = res.filter((r) => r.ok).length;
console.log(`\n${ok}/${BATCH.length} → ${OUT}`);
