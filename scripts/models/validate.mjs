// Control automático de calidad del lote. Detecta los fallos SILENCIOSOS que
// la API no reporta:
//   VACIA  → el recorte no tiene píxeles (safety checker de Flux → frame negro,
//            o BiRefNet no encontró sujeto)
//   NEGRA  → el raw es un frame casi negro (safety checker)
//   CHICA  → el sujeto ocupa muy poco del lienzo (encuadre fallido)
// No juzga manos: eso requiere ojo humano.
import sharp from "/Users/developdanger/PhpstormProjects/artegenia/node_modules/sharp/lib/index.js";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

const dir = process.argv[2] ?? "./lote";

const bbox = async (file) => {
  const img = sharp(resolve(file));
  const { width: W, height: H } = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let minY = H, maxY = -1, minX = W, maxX = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = ch === 4 ? data[(y * W + x) * ch + 3] : 255;
      if (a > 16) {
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
      }
    }
  }
  return { W, H, alto: maxY < 0 ? 0 : ((maxY - minY) / H) * 100, ancho: maxX < 0 ? 0 : ((maxX - minX) / W) * 100 };
};

const brillo = async (file) => (await sharp(resolve(file)).stats()).channels
  .slice(0, 3).reduce((s, c) => s + c.mean, 0) / 3;

const files = readdirSync(dir).filter((f) => f.endsWith(".png") && !f.includes("_raw"));
const malas = [];
for (const f of files.sort()) {
  const id = f.replace(".png", "");
  const b = await bbox(resolve(dir, f));
  const lum = await brillo(resolve(dir, `${id}_raw.png`));
  let estado = "ok";
  if (b.alto === 0) estado = "VACIA";
  else if (lum < 8) estado = "NEGRA";
  else if (b.alto < 55) estado = "CHICA";
  if (estado !== "ok") malas.push({ id, estado, alto: b.alto.toFixed(0), lum: lum.toFixed(1) });
  console.log(
    `${estado === "ok" ? "  " : "→ "}${id.padEnd(26)} ${estado.padEnd(6)} ` +
    `alto ${b.alto.toFixed(0).padStart(3)}%  ancho ${b.ancho.toFixed(0).padStart(3)}%  lum ${lum.toFixed(1).padStart(5)}`,
  );
}
console.log(`\n${files.length - malas.length}/${files.length} pasan el control automático`);
if (malas.length) console.log("A REGENERAR:", malas.map((m) => `${m.id} (${m.estado})`).join(", "));
