/**
 * Surya OCR via Replicate — PoC para Capas Mágicas (Fase V.8).
 *
 * Lo USAMOS solo para refinar las coordenadas bbox de los textos que Sonnet
 * 4.6 ya detectó. Sonnet hace OCR + clasificación semántica + color + fuente;
 * Surya solo aporta bboxes pixel-perfect (mejor que los aproximados de Sonnet).
 *
 * Trade-offs vs Sonnet-only:
 *   - Pro: bboxes ajustados al texto real, no aproximación visual de Sonnet.
 *   - Pro: $0.0026/uso adicional (insignificante vs $0.036 Sonnet).
 *   - Contra: +12s latencia (Surya tarda en GPU T4 de Replicate). Si esto
 *     hace 504 timeouts otra vez, ajustar maxDuration o desactivar.
 *   - Contra: bbox por LÍNEA (Surya no separa palabras dentro de una línea).
 *
 * Activación: env var OCR_PROVIDER="surya". Default sin var = sonnet-only.
 * Requiere también REPLICATE_API_TOKEN configurado en Vercel.
 */

export type SuryaTextLine = {
  /** Texto OCR de la línea (utf-8) */
  text: string;
  /** Bbox en píxeles absolutos: [x_min, y_min, x_max, y_max] */
  bbox: [number, number, number, number];
  /** Polígono opcional (puntos en orden) — útil si el texto está en ángulo */
  polygon?: Array<[number, number]>;
  /** Confianza 0..1 si Surya la reporta */
  confidence?: number;
};

const REPLICATE_MODEL = "cudanexus/ocr-surya";
const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 30; // 30s max (Surya típico ~12s)

/** Llama a Replicate, espera el resultado y devuelve las líneas de texto.
 *  Si REPLICATE_API_TOKEN no está configurado, lanza error (el caller decide). */
export async function detectTextLinesWithSurya(
  imageUrl: string,
  langs: string = "es,en",
): Promise<SuryaTextLine[]> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN no configurado");
  }

  // 1. Crear predicción
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait", // Espera sincrónica si tarda poco (algunos modelos)
    },
    body: JSON.stringify({
      version: REPLICATE_MODEL,
      input: { image: imageUrl, langs },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => "");
    throw new Error(`Replicate create failed ${createRes.status}: ${errText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prediction = (await createRes.json()) as any;

  // 2. Si no terminó con Prefer:wait, polleamos
  let attempts = 0;
  while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < MAX_POLL_ATTEMPTS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!pollRes.ok) {
      throw new Error(`Replicate poll failed ${pollRes.status}`);
    }
    prediction = await pollRes.json();
    attempts++;
  }

  if (prediction.status === "failed") {
    throw new Error(`Surya failed: ${prediction.error ?? "unknown"}`);
  }
  if (prediction.status !== "succeeded") {
    throw new Error(`Surya timeout after ${attempts}s`);
  }

  // 3. Parsear output. El shape exacto depende del despliegue del modelo.
  //    cudanexus/ocr-surya devuelve { text_lines: [{ text, bbox, polygon, confidence }] }
  //    o variantes — probamos varios shapes para robustez.
  const output = prediction.output;
  const rawLines = extractTextLines(output);
  return rawLines.map((l) => ({
    text: String(l.text ?? "").trim(),
    bbox: normalizeBbox(l.bbox ?? l.box ?? [0, 0, 0, 0]),
    polygon: Array.isArray(l.polygon) ? l.polygon : undefined,
    confidence: typeof l.confidence === "number" ? l.confidence : undefined,
  })).filter((l) => l.text.length > 0 && l.bbox[2] > l.bbox[0] && l.bbox[3] > l.bbox[1]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextLines(output: any): any[] {
  if (!output) return [];
  if (Array.isArray(output)) {
    // Podría ser array directo de líneas
    if (output.length > 0 && typeof output[0] === "object" && "text" in output[0]) {
      return output;
    }
    // O array de páginas, cada una con text_lines
    if (output.length > 0 && Array.isArray(output[0]?.text_lines)) {
      return output.flatMap((p) => p.text_lines ?? []);
    }
  }
  if (Array.isArray(output.text_lines)) return output.text_lines;
  if (Array.isArray(output.lines)) return output.lines;
  // Fallback: rebuscar
  for (const key of Object.keys(output)) {
    if (Array.isArray(output[key]) && output[key][0]?.text) {
      return output[key];
    }
  }
  return [];
}

function normalizeBbox(b: unknown): [number, number, number, number] {
  if (Array.isArray(b) && b.length === 4 && b.every((n) => typeof n === "number")) {
    return [b[0] as number, b[1] as number, b[2] as number, b[3] as number];
  }
  return [0, 0, 0, 0];
}

/** Distancia de Levenshtein normalizada 0..1 (0 = idénticas, 1 = totalmente distintas). */
function levenshteinNorm(a: string, b: string): number {
  const A = a.toLowerCase().trim();
  const B = b.toLowerCase().trim();
  if (A === B) return 0;
  if (!A.length || !B.length) return 1;
  const m = A.length, n = B.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n] / Math.max(m, n);
}

/** Para cada layer de Sonnet, busca la línea de Surya con texto más parecido.
 *  Si la similitud supera el threshold (0.7 = 70% match mínimo), devuelve
 *  el bbox de Surya. Si no, mantiene el bbox de Sonnet (mejor que nada).
 *
 *  Esto permite que Sonnet detecte "ENTRADA LIBRE" pero ajustamos sus coords
 *  a las que devuelve Surya (típicamente 5-15px más precisas). */
export function refineSonnetBboxesWithSurya(
  sonnetLayers: Array<{ content: string; x: number; y: number; w: number; h: number }>,
  suryaLines: SuryaTextLine[],
  imgW: number,
  imgH: number,
): Array<{ x: number; y: number; w: number; h: number; refined: boolean }> {
  return sonnetLayers.map((layer) => {
    let bestMatch: SuryaTextLine | null = null;
    let bestScore = 1; // queremos minimizar distancia
    for (const line of suryaLines) {
      const dist = levenshteinNorm(layer.content, line.text);
      if (dist < bestScore) {
        bestScore = dist;
        bestMatch = line;
      }
    }
    // 0.3 distancia = 70% similar — suficiente para considerar match.
    if (bestMatch && bestScore <= 0.3) {
      const [x1, y1, x2, y2] = bestMatch.bbox;
      // Convertir píxeles absolutos a porcentajes 0..100 (formato interno)
      return {
        x: (x1 / imgW) * 100,
        y: (y1 / imgH) * 100,
        w: ((x2 - x1) / imgW) * 100,
        h: ((y2 - y1) / imgH) * 100,
        refined: true,
      };
    }
    // Sin match: mantener bbox original de Sonnet
    return { x: layer.x, y: layer.y, w: layer.w, h: layer.h, refined: false };
  });
}
