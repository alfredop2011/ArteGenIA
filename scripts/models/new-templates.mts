// Plantilla #82 — "Noche de Baile", lineup de 6 bailarines.
//
// El grupo NO es una foto de grupo: son 6 recortes individuales colocados con
// lineup(), que los alinea por altura real y los reparte por su ancho real.
// Así cada bailarín es una capa suelta que el usuario puede sustituir por la
// foto de su artista de verdad.
import { lineup, genModel } from "../../data/generatedModels";
import { readFileSync, writeFileSync } from "node:fs";

const W = 1080, H = 1350;

const BAILARINES = [
  { id: "bail-cuerpo-camila", nombre: "CAMILA" },
  { id: "profe-cuerpo-pablo", nombre: "PABLO" },
  { id: "bail-cuerpo-noa", nombre: "NOA" },
  { id: "bail-cuerpo-daniel", nombre: "DANIEL" },
  { id: "profe-cuerpo-aisha", nombre: "AISHA" },
  { id: "bail-cuerpo-luca", nombre: "LUCA" },
];

// Los pies a 1150 dejan sitio a la banda de info; lineup baja la altura solo si
// no caben (poses anchas), nunca solapa ni recorta.
const puestos = lineup(BAILARINES.map((b) => b.id), { height: 560, y: 1152, from: 30, to: 1050 });

const capasBailarines = puestos.map((p, i) =>
  `                { id: "bailarin-${i + 1}-img", type: "image", src: "${p.src}", ` +
  `x: ${Math.round(p.x * 10) / 10}, y: ${Math.round(p.y * 10) / 10}, ` +
  `scaleX: ${Math.round(p.scaleX * 1e4) / 1e4}, scaleY: ${Math.round(p.scaleY * 1e4) / 1e4} },`,
).join("\n");

// Nombre centrado bajo cada bailarín, en su X real
const capasNombres = puestos.map((p, i) => {
  const m = genModel(p.id);
  const centro = p.x + (m.box.x * m.w + (m.w * m.box.w) / 2) * p.scaleX;
  return `                { id: "bailarin-${i + 1}-nombre", type: "text", text: "${BAILARINES[i].nombre}", ` +
    `x: ${Math.round(centro - 90)}, y: 1168, width: 180, fontSize: 19, ` +
    `fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },`;
}).join("\n");

console.log("lineup(6) — bailarines colocados:");
for (const [i, p] of puestos.entries()) {
  console.log(`  ${BAILARINES[i].nombre.padEnd(8)} x ${String(Math.round(p.x)).padStart(4)}  scale ${p.scaleX.toFixed(3)}  ${genModel(p.id).label}`);
}

const TPL = `    {
        id: 82,
        title: "Noche de Baile — Lineup 6",
        category: "Clases",
        image: "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/models/generated/dance/bail-cuerpo-camila.png",
        premium: false,
        audience: ["academias", "productoras"],
        internalTags: ["complete"],
        variants: [
            { format: "portrait", width: ${W}, height: ${H}, layers: [
                { id: "bg", type: "shape", shape: "rect", x: 0, y: 0, width: ${W}, height: ${H}, fill: "#0a0a12", selectable: false },
                { id: "bg-glow-c", type: "shape", shape: "circle", x: 540, y: 760, width: 1000, height: 1000, fill: "rgba(168,85,247,0.28)", opacity: 0.9, originX: "center", originY: "center", selectable: false },
                { id: "bg-glow-l", type: "shape", shape: "circle", x: -140, y: 520, width: 520, height: 520, fill: "rgba(236,72,153,0.22)", opacity: 0.85, selectable: false },
                { id: "bg-glow-r", type: "shape", shape: "circle", x: 700, y: 520, width: 520, height: 520, fill: "rgba(236,72,153,0.22)", opacity: 0.85, selectable: false },
                { id: "floor-line", type: "shape", shape: "rect", x: 0, y: 1152, width: ${W}, height: 2, fill: "rgba(236,72,153,0.55)", selectable: false },
                { id: "kicker-line-l", type: "shape", shape: "rect", x: 210, y: 72, width: 130, height: 1, fill: "#a855f7", opacity: 0.7, selectable: false },
                { id: "kicker-line-r", type: "shape", shape: "rect", x: 740, y: 72, width: 130, height: 1, fill: "#a855f7", opacity: 0.7, selectable: false },
                { id: "kicker", type: "text", text: "TEMPORADA 2026", x: 0, y: 58, width: ${W}, fontSize: 18, fontFamily: "Anton, Impact, sans-serif", color: "#a855f7", textAlign: "center", charSpacing: 400 },
                { id: "title-1", type: "text", text: "NOCHE DE", x: 0, y: 104, width: ${W}, fontSize: 104, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 60 },
                { id: "title-2", type: "text", text: "BAILE", x: 0, y: 196, width: ${W}, fontSize: 210, fontFamily: "Anton, Impact, sans-serif", color: "#ec4899", textAlign: "center", charSpacing: 40, stroke: "#4c0519", strokeWidth: 3 },
                { id: "subtitle", type: "text", text: "6 BAILARINES · UN ESCENARIO", x: 0, y: 420, width: ${W}, fontSize: 26, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 120 },
                { id: "styles-bg", type: "shape", shape: "rect", x: 250, y: 470, width: 580, height: 38, fill: "transparent", radius: 4, stroke: "#a855f7", strokeWidth: 1, selectable: false },
                { id: "styles", type: "text", text: "SALSA · BACHATA · URBANO · AFRO", x: 0, y: 481, width: ${W}, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "center", charSpacing: 160 },
${capasBailarines}
${capasNombres}
                { id: "info-band-bg", type: "shape", shape: "rect", x: 40, y: 1200, width: 1000, height: 76, fill: "rgba(15,10,25,0.75)", radius: 8, stroke: "#a855f7", strokeWidth: 2, selectable: false },
                { id: "info-fecha-label", type: "text", text: "SÁBADO", x: 80, y: 1216, width: 220, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#a855f7", textAlign: "left", charSpacing: 80 },
                { id: "info-fecha", type: "text", text: "14 MARZO", x: 80, y: 1240, width: 220, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 40 },
                { id: "info-hora-label", type: "text", text: "PUERTAS", x: 340, y: 1216, width: 220, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#a855f7", textAlign: "left", charSpacing: 80 },
                { id: "info-hora", type: "text", text: "22:00 H", x: 340, y: 1240, width: 220, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 40 },
                { id: "info-sala-label", type: "text", text: "SALA", x: 600, y: 1216, width: 220, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#a855f7", textAlign: "left", charSpacing: 80 },
                { id: "info-sala", type: "text", text: "ESTUDIO 9", x: 600, y: 1240, width: 220, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 40 },
                { id: "info-precio-label", type: "text", text: "ENTRADA", x: 850, y: 1216, width: 200, fontSize: 15, fontFamily: "Anton, Impact, sans-serif", color: "#a855f7", textAlign: "left", charSpacing: 80 },
                { id: "info-precio", type: "text", text: "12 €", x: 850, y: 1240, width: 200, fontSize: 20, fontFamily: "Anton, Impact, sans-serif", color: "#ffffff", textAlign: "left", charSpacing: 40 },
                { id: "handle", type: "text", text: "@TUACADEMIA", x: 0, y: 1300, width: ${W}, fontSize: 14, fontFamily: "Montserrat, sans-serif", color: "rgba(255,255,255,0.5)", fontWeight: "600", textAlign: "center", charSpacing: 200 },
            ] },
        ],
    },
`;

const f = new URL("../../data/templates.ts", import.meta.url).pathname;
let src = readFileSync(f, "utf8");
if (src.includes("id: 82,")) throw new Error("la #82 ya existe — aborto para no duplicar");

// Insertar antes del cierre del array `templates`
const marca = "\n];\n";
const i = src.lastIndexOf(marca);
if (i < 0) throw new Error("no encuentro el cierre del array templates");
src = src.slice(0, i) + "\n" + TPL + src.slice(i + 1);
writeFileSync(f, src);
console.log("\n#82 insertada en data/templates.ts");
