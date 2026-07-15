// ═══════════════════════════════════════════════════════════════════
// CATÁLOGO DE MODELOS GENERADOS — 49 personas, generadas con Flux y
// recortadas con BiRefNet. Viven en R2 bajo models/generated/.
//
// AUTOGENERADO por scripts/models/build-catalog.mjs — no editar a mano.
//
// El campo `box` es el bbox REAL del contenido no transparente, en fracción
// 0..1 del lienzo. Es imprescindible: cada PNG tiene distinto padding, así que
// escalar por el alto del lienzo NO alinea a las personas entre sí. Con `box`,
// placeModel() puede colocar N personas a la misma altura real — que es lo que
// permite componer un "grupo de 8" a partir de 8 recortes individuales en vez
// de generar una foto de grupo (Flux no sabe hacer grupos: ignora el número de
// personas y rompe manos e instrumentos).
// ═══════════════════════════════════════════════════════════════════

export type ModelVertical = "dance" | "dj" | "profes" | "cantantes" | "musicos" | "parejas" | "retratos";

/** Encuadre de la foto original. Determina qué papel puede jugar en el flyer. */
export type ModelCrop =
  | "cara"    // busto cerrado — la cara llena el cuadro
  | "medio"   // medio cuerpo, cortado a la cadera
  | "cuerpo"  // cuerpo entero, de la cabeza a los pies
  | "pareja"; // dos personas, cuerpo entero

export type GenModel = {
  id: string;
  vertical: ModelVertical;
  crop: ModelCrop;
  /** Tamaño nativo del PNG. */
  w: number;
  h: number;
  /** Bbox del contenido visible, en fracción 0..1 del lienzo. */
  box: { x: number; y: number; w: number; h: number };
  /** Ruta relativa dentro del bucket R2. */
  src: string;
  label: string;
};

const R2_BASE = "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/";

export const GEN_MODELS: GenModel[] = [
  // ── dance (12) ──
  { id: "bail-cara-alba", vertical: "dance", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.051, y: 0, w: 0.948, h: 0.999 },
    src: "models/generated/dance/bail-cara-alba.png", label: "Española 26 · barbilla alta" },
  { id: "bail-cara-tobias", vertical: "dance", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.173, y: 0, w: 0.827, h: 0.999 },
    src: "models/generated/dance/bail-cara-tobias.png", label: "Negro 31 · rastas, perfil" },
  { id: "bail-cara-yuki", vertical: "dance", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.103, y: 0, w: 0.896, h: 0.999 },
    src: "models/generated/dance/bail-cara-yuki.png", label: "Asiática 23 · bob, mirada fría" },
  { id: "bail-cara-mateo", vertical: "dance", crop: "cara", w: 1280, h: 1280,
    box: { x: 0, y: 0.027, w: 0.999, h: 0.973 },
    src: "models/generated/dance/bail-cara-mateo.png", label: "Latino 27 · sonrisa abierta" },
  { id: "bail-medio-fatou", vertical: "dance", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.154, y: 0.012, w: 0.764, h: 0.988 },
    src: "models/generated/dance/bail-medio-fatou.png", label: "Africana 30 · trenzas, brazos cruzados" },
  { id: "bail-medio-viktor", vertical: "dance", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.083, y: 0.023, w: 0.83, h: 0.976 },
    src: "models/generated/dance/bail-medio-viktor.png", label: "Blanco 34 · brazos cruzados" },
  { id: "bail-medio-priya", vertical: "dance", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.139, y: 0.05, w: 0.681, h: 0.949 },
    src: "models/generated/dance/bail-medio-priya.png", label: "India 28 · mano en cadera" },
  { id: "bail-medio-hugo", vertical: "dance", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.115, y: 0.02, w: 0.754, h: 0.98 },
    src: "models/generated/dance/bail-medio-hugo.png", label: "Latino 44 · manos en cadera" },
  { id: "bail-cuerpo-noa", vertical: "dance", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.142, y: 0.039, w: 0.769, h: 0.939 },
    src: "models/generated/dance/bail-cuerpo-noa.png", label: "Mediterránea 25 · en movimiento" },
  { id: "bail-cuerpo-daniel", vertical: "dance", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.049, y: 0.09, w: 0.891, h: 0.863 },
    src: "models/generated/dance/bail-cuerpo-daniel.png", label: "Asiático 29 · freeze" },
  { id: "bail-cuerpo-camila", vertical: "dance", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.113, y: 0.054, w: 0.634, h: 0.923 },
    src: "models/generated/dance/bail-cuerpo-camila.png", label: "Afrolatina 32 · salsa, tacones" },
  { id: "bail-cuerpo-luca", vertical: "dance", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.336, y: 0.06, w: 0.388, h: 0.933 },
    src: "models/generated/dance/bail-cuerpo-luca-v2.png", label: "Italiano 24 · línea extendida" },
  // ── dj (14) ──
  { id: "dj-cara-nina", vertical: "dj", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.054, y: 0.027, w: 0.908, h: 0.973 },
    src: "models/generated/dj/dj-cara-nina.png", label: "Blanca 27 · rubia platino" },
  { id: "dj-cara-omar", vertical: "dj", crop: "cara", w: 1280, h: 1280,
    box: { x: 0, y: 0.02, w: 0.999, h: 0.98 },
    src: "models/generated/dj/dj-cara-omar.png", label: "Árabe 33 · gorra atrás" },
  { id: "dj-cara-keiko", vertical: "dj", crop: "cara", w: 1280, h: 1280,
    box: { x: 0, y: 0.004, w: 0.999, h: 0.995 },
    src: "models/generated/dj/dj-cara-keiko.png", label: "Asiática 25 · pelo rosa" },
  { id: "dj-medio-marcus", vertical: "dj", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.119, y: 0.05, w: 0.788, h: 0.949 },
    src: "models/generated/dj/dj-medio-marcus.png", label: "Negro 38 · hoodie, brazos cruzados" },
  { id: "dj-medio-elena", vertical: "dj", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.193, y: 0.042, w: 0.613, h: 0.957 },
    src: "models/generated/dj/dj-medio-elena.png", label: "Latina 29 · señalando arriba" },
  { id: "dj-medio-lars", vertical: "dj", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.102, y: 0.049, w: 0.811, h: 0.95 },
    src: "models/generated/dj/dj-medio-lars.png", label: "Blanco 45 · gafas, manos cadera" },
  { id: "dj-cuerpo-zara", vertical: "dj", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.214, y: 0.012, w: 0.566, h: 0.969 },
    src: "models/generated/dj/dj-cuerpo-zara.png", label: "Mestiza 26 · techwear" },
  { id: "dj-cuerpo-tariq", vertical: "dj", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.086, y: 0.019, w: 0.643, h: 0.941 },
    src: "models/generated/dj/dj-cuerpo-tariq.png", label: "Negro 31 · cortavientos" },
  { id: "dj-medio-yuna", vertical: "dj", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.146, y: 0.042, w: 0.711, h: 0.957 },
    src: "models/generated/dj/dj-medio-yuna.png", label: "dj-medio-yuna" },
  { id: "dj-medio-diego", vertical: "dj", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.122, y: 0.051, w: 0.755, h: 0.948 },
    src: "models/generated/dj/dj-medio-diego.png", label: "dj-medio-diego" },
  { id: "dj-medio-amara", vertical: "dj", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.023, y: 0.032, w: 0.903, h: 0.967 },
    src: "models/generated/dj/dj-medio-amara.png", label: "dj-medio-amara" },
  { id: "dj-medio-sven", vertical: "dj", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.149, y: 0.027, w: 0.675, h: 0.972 },
    src: "models/generated/dj/dj-medio-sven.png", label: "dj-medio-sven" },
  { id: "dj-medio-farid", vertical: "dj", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.088, y: 0.082, w: 0.84, h: 0.917 },
    src: "models/generated/dj/dj-medio-farid.png", label: "dj-medio-farid" },
  { id: "dj-medio-kira", vertical: "dj", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.129, y: 0.008, w: 0.763, h: 0.991 },
    src: "models/generated/dj/dj-medio-kira.png", label: "dj-medio-kira" },
  // ── profes (6) ──
  { id: "profe-medio-rosa", vertical: "profes", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.111, y: 0.021, w: 0.862, h: 0.978 },
    src: "models/generated/profes/profe-medio-rosa.png", label: "Latina 41 · mano en cadera" },
  { id: "profe-medio-jean", vertical: "profes", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.044, y: 0.065, w: 0.85, h: 0.934 },
    src: "models/generated/profes/profe-medio-jean.png", label: "Negro 36 · explicando" },
  { id: "profe-medio-inma", vertical: "profes", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.127, y: 0.027, w: 0.717, h: 0.972 },
    src: "models/generated/profes/profe-medio-inma.png", label: "Española 52 · canas plateadas" },
  { id: "profe-cuerpo-carlos", vertical: "profes", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.224, y: 0.052, w: 0.641, h: 0.913 },
    src: "models/generated/profes/profe-cuerpo-carlos.png", label: "Latino 48 · paso de salsa" },
  { id: "profe-cuerpo-aisha", vertical: "profes", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.244, y: 0.08, w: 0.41, h: 0.902 },
    src: "models/generated/profes/profe-cuerpo-aisha.png", label: "Negra 35 · trenzas, postura" },
  { id: "profe-cuerpo-pablo", vertical: "profes", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.309, y: 0.021, w: 0.396, h: 0.961 },
    src: "models/generated/profes/profe-cuerpo-pablo.png", label: "Español 29 · de pie" },
  // ── cantantes (6) ──
  { id: "cant-medio-lucia", vertical: "cantantes", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.215, y: 0.074, w: 0.577, h: 0.925 },
    src: "models/generated/cantantes/cant-medio-lucia.png", label: "Latina 27 · micro, ojos cerrados" },
  { id: "cant-medio-andre", vertical: "cantantes", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.087, y: 0.139, w: 0.78, h: 0.86 },
    src: "models/generated/cantantes/cant-medio-andre.png", label: "Negro 36 · micro, mano alzada" },
  { id: "cant-medio-siri", vertical: "cantantes", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.101, y: 0.049, w: 0.814, h: 0.95 },
    src: "models/generated/cantantes/cant-medio-siri.png", label: "Nórdica 31 · micro, cuero" },
  { id: "cant-cuerpo-rocio", vertical: "cantantes", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.237, y: 0.072, w: 0.58, h: 0.908 },
    src: "models/generated/cantantes/cant-cuerpo-rocio.png", label: "Española 30 · vestido rojo" },
  { id: "cant-cuerpo-kwame", vertical: "cantantes", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.289, y: 0.039, w: 0.445, h: 0.952 },
    src: "models/generated/cantantes/cant-cuerpo-kwame.png", label: "Negro 34 · traje estampado" },
  { id: "cant-cuerpo-mina", vertical: "cantantes", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.294, y: 0.109, w: 0.411, h: 0.877 },
    src: "models/generated/cantantes/cant-cuerpo-mina.png", label: "Asiática 24 · metalizado" },
  // ── musicos (3) ──
  { id: "musico-medio-gabriel", vertical: "musicos", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.036, y: 0.014, w: 0.916, h: 0.985 },
    src: "models/generated/musicos/musico-medio-gabriel.png", label: "Latino 40 · guitarra" },
  { id: "musico-medio-sofia", vertical: "musicos", crop: "medio", w: 1024, h: 1280,
    box: { x: 0.2, y: 0.018, w: 0.66, h: 0.981 },
    src: "models/generated/musicos/musico-medio-sofia.png", label: "Blanca 33 · violín" },
  { id: "musico-cuerpo-teo", vertical: "musicos", crop: "cuerpo", w: 896, h: 1344,
    box: { x: 0.267, y: 0.037, w: 0.473, h: 0.945 },
    src: "models/generated/musicos/musico-cuerpo-teo.png", label: "Negro 28 · saxo" },
  // ── parejas (6) ──
  { id: "pareja-baile-salsa", vertical: "parejas", crop: "pareja", w: 1152, h: 1344,
    box: { x: 0.314, y: 0.057, w: 0.424, h: 0.92 },
    src: "models/generated/parejas/pareja-baile-salsa.png", label: "Salsa · latino + latina" },
  { id: "pareja-baile-bachata", vertical: "parejas", crop: "pareja", w: 1152, h: 1344,
    box: { x: 0.203, y: 0.065, w: 0.656, h: 0.935 },
    src: "models/generated/parejas/pareja-baile-bachata.png", label: "Bachata · negra + blanco" },
  { id: "pareja-baile-urbano", vertical: "parejas", crop: "pareja", w: 1152, h: 1344,
    box: { x: 0.097, y: 0.022, w: 0.813, h: 0.975 },
    src: "models/generated/parejas/pareja-baile-urbano.png", label: "Urbano · 2 mujeres" },
  { id: "pareja-musica-acustica", vertical: "parejas", crop: "pareja", w: 1152, h: 1344,
    box: { x: 0.161, y: 0.094, w: 0.673, h: 0.866 },
    src: "models/generated/parejas/pareja-musica-acustica.png", label: "Canto + guitarra" },
  { id: "pareja-musica-electrica", vertical: "parejas", crop: "pareja", w: 1152, h: 1344,
    box: { x: 0.177, y: 0.108, w: 0.637, h: 0.856 },
    src: "models/generated/parejas/pareja-musica-electrica.png", label: "Canto + eléctrica" },
  { id: "pareja-musica-latina", vertical: "parejas", crop: "pareja", w: 1152, h: 1344,
    box: { x: 0.12, y: 0.096, w: 0.879, h: 0.903 },
    src: "models/generated/parejas/pareja-musica-latina.png", label: "Canto + guitarra" },
  // ── retratos (8) ──
  { id: "sofia-morales", vertical: "retratos", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.083, y: 0, w: 0.808, h: 0.999 },
    src: "models/generated/retratos/sofia-morales.png", label: "Latina 32 · elegante" },
  { id: "erik-lindqvist", vertical: "retratos", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.006, y: 0.015, w: 0.993, h: 0.984 },
    src: "models/generated/retratos/erik-lindqvist.png", label: "Nórdico 42 · bomber" },
  { id: "mei-tanaka", vertical: "retratos", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.09, y: 0, w: 0.718, h: 0.999 },
    src: "models/generated/retratos/mei-tanaka.png", label: "Asiática 24 · hoodie" },
  { id: "roberto-salas", vertical: "retratos", crop: "cara", w: 1280, h: 1280,
    box: { x: 0, y: 0.009, w: 0.999, h: 0.99 },
    src: "models/generated/retratos/roberto-salas.png", label: "Canas 55 · americana" },
  { id: "hanna-kovacs", vertical: "retratos", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.048, y: 0, w: 0.888, h: 0.999 },
    src: "models/generated/retratos/hanna-kovacs.png", label: "Pelirroja 29 · dorado" },
  { id: "karim-haddad", vertical: "retratos", crop: "cara", w: 1280, h: 1280,
    box: { x: 0, y: 0, w: 0.999, h: 0.999 },
    src: "models/generated/retratos/karim-haddad.png", label: "Árabe 35 · cuello alto" },
  { id: "yolanda-cruz", vertical: "retratos", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.059, y: 0.006, w: 0.899, h: 0.993 },
    src: "models/generated/retratos/yolanda-cruz.png", label: "Afrocaribeña 45 · tropical" },
  { id: "kenji-park", vertical: "retratos", crop: "cara", w: 1280, h: 1280,
    box: { x: 0.02, y: 0.019, w: 0.964, h: 0.98 },
    src: "models/generated/retratos/kenji-park.png", label: "Asiático 23 · gorra" },
];

const BY_ID = new Map(GEN_MODELS.map((m) => [m.id, m]));

export function genModel(id: string): GenModel {
  const m = BY_ID.get(id);
  if (!m) throw new Error(`genModel(): "${id}" no existe en GEN_MODELS`);
  return m;
}

/** Todos los modelos de un vertical, opcionalmente filtrados por encuadre. */
export function modelsBy(vertical: ModelVertical, crop?: ModelCrop): GenModel[] {
  return GEN_MODELS.filter((m) => m.vertical === vertical && (!crop || m.crop === crop));
}

export type PlaceOpts = {
  /** Alto deseado de la PERSONA en px de lienzo (no del PNG). */
  height: number;
  /** X del centro de la persona en el lienzo. */
  centerX: number;
  /** Y donde deben quedar los pies / el borde inferior de la persona. */
  bottomY: number;
};

/**
 * Devuelve los campos de un layer type:"image" para que la PERSONA quede con la
 * altura pedida, centrada en centerX y con su base en bottomY.
 *
 * Compensa el padding transparente usando `box`, así que N modelos distintos
 * colocados con el mismo `height` salen todos a la misma altura real. Eso es lo
 * que hace posible una fila de 8 artistas alineados.
 *
 * Devuelve x/y — la convención de TemplateLayer, no left/top de Fabric — para
 * poder volcarlo directo en una capa. Asume los originX/originY por defecto
 * ("left"/"top"), así que NO pongas originX:"center" encima: x/y ya vienen
 * calculados contando el padding.
 *
 *   { id: "dj1", type: "image", ...placeModel("dj-cara-nina", { height: 420, centerX: 200, bottomY: 900 }) }
 */
export function placeModel(id: string, { height, centerX, bottomY }: PlaceOpts) {
  const m = genModel(id);
  // alto real de la persona en px del PNG
  const personH = m.h * m.box.h;
  const scale = height / personH;
  const personW = m.w * m.box.w;
  return {
    src: `${R2_BASE}${m.src}`,
    x: centerX - (m.box.x * m.w + personW / 2) * scale,
    y: bottomY - (m.box.y * m.h + personH) * scale,
    scaleX: scale,
    scaleY: scale,
  };
}

export type LineupOpts = {
  /** Alto de las personas, igual para todas. */
  height: number;
  /** Y de los pies. */
  y: number;
  /** Margen izquierdo y derecho de la fila. */
  from: number;
  to: number;
  /**
   * Solape máximo permitido entre vecinos, en fracción del ancho de la persona
   * (0 = sin solape, 0.25 = un cuarto). Si no caben ni con ese solape, se
   * reduce la altura de todos por igual hasta que entren.
   */
  maxOverlap?: number;
};

/**
 * Reparte N modelos en una fila alineada — el patrón "grupo de 8" compuesto a
 * partir de recortes individuales, en vez de generar una foto de grupo.
 *
 * Reparte por el ANCHO REAL de cada persona, no por centros equidistantes: una
 * bailarina con los brazos abiertos ocupa el triple que alguien de pie, así que
 * repartir a pasos iguales la solapa con su vecina y la saca del lienzo.
 *
 * Si la fila no cabe, baja la altura de todos por igual — nunca deforma ni
 * recorta a nadie, y nunca se sale de [from, to].
 *
 * LIMITACIÓN conocida: centra por el bbox, y en poses asimétricas (un brazo
 * extendido, una falda volando) el centro del bbox NO es el centro del cuerpo,
 * así que el torso queda descentrado en su hueco y el reparto se ve irregular.
 * Se nota en la #82. Para filas limpias, tira de poses compactas y simétricas
 * (de pie, brazos cruzados) y deja las dinámicas para protagonista suelto.
 *
 *   lineup(["a","b","c"], { height: 380, y: 900, from: 60, to: 1020 })
 */
export function lineup(ids: string[], { height, y, from, to, maxOverlap = 0.12 }: LineupOpts) {
  const disponible = to - from;
  const anchoDe = (id: string, h: number) => {
    const m = genModel(id);
    return m.w * m.box.w * (h / (m.h * m.box.h));
  };

  // ¿Cabe a la altura pedida, admitiendo el solape máximo? Si no, encogemos.
  let h = height;
  const totalA = (hh: number) => ids.reduce((s, id) => s + anchoDe(id, hh), 0);
  const minTotal = (hh: number) =>
    totalA(hh) * (1 - maxOverlap) + anchoDe(ids[ids.length - 1], hh) * maxOverlap;
  if (minTotal(h) > disponible) h = height * (disponible / minTotal(height));

  const anchos = ids.map((id) => anchoDe(id, h));
  const total = anchos.reduce((s, w) => s + w, 0);
  // hueco entre vecinos; negativo = solape (permitido y a menudo deseable)
  const hueco = ids.length > 1 ? (disponible - total) / (ids.length - 1) : 0;

  let cursor = from;
  return ids.map((id, i) => {
    const centerX = cursor + anchos[i] / 2;
    cursor += anchos[i] + hueco;
    return { id, ...placeModel(id, { height: h, centerX, bottomY: y }) };
  });
}
