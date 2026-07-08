/**
 * Aplica marca de agua "ArteGenIA" en la esquina inferior derecha de una
 * imagen exportada. SOLO para usuarios free — Pro/Enterprise descargan limpio.
 *
 * Implementacion: se carga el dataURL en un canvas 2D nuevo (no Fabric), se
 * dibuja la imagen original al 100% y encima el watermark. NO toca el canvas
 * Fabric del editor (evita problemas de undo/redo, selection, z-index).
 *
 * Diseno del watermark:
 *  - Pill semitransparente negro con borde sutil purpura
 *  - Texto "ArteGenIA" en blanco + "artegenia.vercel.app" mas pequeno
 *  - Margen 24px del borde
 *  - Tamano de fuente ESCALA con el ancho de la imagen para que se vea bien
 *    tanto en thumbnails (320px) como en stories full HD (1080px) o impresion
 */

export type WatermarkOptions = {
  /** Si false, devuelve la imagen sin tocar. Util para condicional inline. */
  apply?: boolean;
  /** Posicion del watermark. Default: bottom-right. */
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  /** Override de opacidad (0-1). Default 0.85 */
  opacity?: number;
};

export async function applyWatermark(
  dataUrl: string,
  opts: WatermarkOptions = {},
): Promise<string> {
  if (opts.apply === false) return dataUrl;

  const position = opts.position ?? "bottom-right";
  const opacity = opts.opacity ?? 0.85;

  // Cargar la imagen original
  const img = await loadImage(dataUrl);
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  // Canvas 2D nuevo (separado del Fabric canvas)
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  // 1. Dibujar imagen original
  ctx.drawImage(img, 0, 0, W, H);

  // 2. Calcular tamanos en funcion del ancho de la imagen.
  //    Base: imagen de 1080px → fuente principal 22px. Escala lineal.
  const baseW = 1080;
  const scale = Math.max(0.6, Math.min(2, W / baseW));
  const fontMain = Math.round(22 * scale);
  const fontSub = Math.round(11 * scale);
  const paddingX = Math.round(16 * scale);
  const paddingY = Math.round(10 * scale);
  const margin = Math.round(24 * scale);
  const radius = Math.round(14 * scale);
  const logoSize = Math.round(26 * scale);

  // 3. Medir texto para calcular ancho del pill
  ctx.font = `900 ${fontMain}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  const mainText = "ArteGenIA";
  const mainWidth = ctx.measureText(mainText).width;

  ctx.font = `500 ${fontSub}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  const subText = "artegenia.vercel.app";
  const subWidth = ctx.measureText(subText).width;

  const textWidth = Math.max(mainWidth, subWidth);
  const pillW = logoSize + Math.round(10 * scale) + textWidth + paddingX * 2;
  const pillH = Math.max(logoSize, fontMain + fontSub + Math.round(4 * scale)) + paddingY * 2;

  // 4. Posicionar el pill
  let x: number;
  if (position === "bottom-left") x = margin;
  else if (position === "bottom-center") x = (W - pillW) / 2;
  else x = W - pillW - margin; // bottom-right default
  const y = H - pillH - margin;

  // 5. Pill background (negro semitransparente con borde purpura)
  ctx.globalAlpha = opacity;

  // Sombra suave detras del pill
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = Math.round(12 * scale);
  ctx.shadowOffsetY = Math.round(4 * scale);

  ctx.fillStyle = "rgba(15,15,25,0.92)";
  roundRect(ctx, x, y, pillW, pillH, radius);
  ctx.fill();

  // Reset sombra para que no afecte borde y texto
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Borde sutil purpura/dorado para que destaque
  ctx.strokeStyle = "rgba(168,85,247,0.4)";
  ctx.lineWidth = Math.max(1, Math.round(1.2 * scale));
  roundRect(ctx, x, y, pillW, pillH, radius);
  ctx.stroke();

  // 6. Logo cuadradito "AG" (gradiente amarillo→naranja como en la UI)
  const logoX = x + paddingX;
  const logoY = y + (pillH - logoSize) / 2;
  const grad = ctx.createLinearGradient(logoX, logoY, logoX + logoSize, logoY + logoSize);
  grad.addColorStop(0, "#facc15"); // yellow-400
  grad.addColorStop(1, "#f97316"); // orange-500
  ctx.fillStyle = grad;
  roundRect(ctx, logoX, logoY, logoSize, logoSize, Math.round(6 * scale));
  ctx.fill();

  // Texto "AG" dentro del logo
  ctx.fillStyle = "#000000";
  ctx.font = `900 ${Math.round(logoSize * 0.5)}px -apple-system, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText("AG", logoX + logoSize / 2, logoY + logoSize / 2 + Math.round(1 * scale));

  // 7. Texto principal "ArteGenIA"
  const textX = logoX + logoSize + Math.round(10 * scale);
  const textY = y + pillH / 2;

  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${fontMain}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(mainText, textX, textY - Math.round(2 * scale));

  // 8. Texto secundario (URL)
  ctx.fillStyle = "rgba(168,85,247,0.95)";
  ctx.font = `500 ${fontSub}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(subText, textX, textY + fontSub + Math.round(2 * scale));

  // Reset alpha
  ctx.globalAlpha = 1;

  return canvas.toDataURL("image/png");
}

// ─── helpers ──────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Path para un rectangulo con esquinas redondeadas. */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Feature flag: marca de agua DESACTIVADA en MVP/beta.
 *
 * Razon: sin plan Pro integrado todavia, la marca solo aporta friccion al
 * usuario nuevo (descarga su primer flyer y se va) sin generar conversion.
 *
 * REACTIVAR a `true` cuando:
 *  1. LemonSqueezy / Stripe este integrado en produccion
 *  2. Exista un boton "Hazte Pro" visible al lado del download para que la
 *     marca tenga un upsell claro
 *  3. La UI muestre "(con marca de agua)" en el boton de descarga para que
 *     el usuario sepa de antemano lo que va a recibir
 */
// Historial de la decisión:
//  - V8.2: activado (incentivo para validar interés en Pro).
//  - Fase T.12: desactivado para todos ("sin watermark, siempre" vs Canva)
//    — en ese momento las descargas COSTABAN créditos, ese era el gate.
//  - P0.T1 (jul 2026): REACTIVADO para Free. Las descargas pasaron a ser
//    gratis e ilimitadas en todos los planes, así que el watermark vuelve
//    a ser la palanca principal de upgrade: Free descarga con marca sutil,
//    Pro/Enterprise descargan limpio. Decisión de negocio explícita (B2).
const WATERMARK_ENABLED = true;

/**
 * Helper booleano: ¿este perfil debe llevar watermark al descargar?
 * Acepta null/undefined (= no logueado, free por defecto).
 */
export function shouldWatermark(plan?: string | null): boolean {
  if (!WATERMARK_ENABLED) return false;
  return plan !== "pro" && plan !== "enterprise";
}
