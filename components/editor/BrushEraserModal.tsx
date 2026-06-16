"use client";

/**
 * BrushEraserModal — refinar manualmente el resultado de Quitar fondo o
 * Recortar persona (Fase Z.17).
 *
 * 3 tools:
 *   - Borrar (manual): pincel circular borra alpha al arrastrar. 0 créditos.
 *   - Mágico (IA): click → SAM segmenta el objeto bajo el punto → muestra
 *     SELECCIÓN en azul → user confirma o cancela. 1 crédito por click.
 *     Z.19: flujo "select-then-erase" en vez de borrar inmediato. Permite
 *     ver lo que se va a borrar antes (caso típico: zapatos individuales).
 *   - Restaurar (manual): pinta de vuelta la imagen original sobre zonas borradas.
 *
 * Modal full-screen sobre fondo translúcido. Mismo componente funciona en
 * desktop y mobile — el layout se adapta con flex/breakpoints.
 *
 * Al Guardar, exporta el canvas como PNG transparente y llama onSave con
 * el dataURL. El padre decide qué hacer (típico: reemplazar src de la
 * imagen Fabric activa).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Brush, Sparkles, Check, X, Loader2, Trash2 } from "lucide-react";

type Tool = "erase" | "magic" | "restore";

type Props = {
  open: boolean;
  imageUrl: string;
  /** Coste de 1 click mágico en créditos. Se muestra en la UI. */
  magicCost?: number;
  /** Balance actual de créditos, para deshabilitar mágico si insuficiente. */
  balance?: number | null;
  onCancel: () => void;
  onSave: (resultPngDataUrl: string) => void;
  /** Callback opcional tras un click mágico exitoso para refrescar el badge. */
  onCreditsConsumed?: () => void;
  /** Toast opcional para errores. */
  onError?: (msg: string) => void;
};

export default function BrushEraserModal({
  open, imageUrl, magicCost = 1, balance, onCancel, onSave, onCreditsConsumed, onError,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const [tool, setTool] = useState<Tool>("erase");
  const [brushSize, setBrushSize] = useState(40);
  const [drawing, setDrawing] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Z.19 — selección pendiente del Borrador mágico: SAM devuelve mask,
  // la mostramos como overlay azul translúcido. El user confirma con
  // "Borrar selección" o descarta con "Cancelar selección".
  const [pendingMask, setPendingMask] = useState<{
    img: HTMLImageElement;
    blobUrl: string;
  } | null>(null);

  // Cancelar selección magic: revoca blob URL + limpia state
  const cancelPendingMask = useCallback(() => {
    if (pendingMask) URL.revokeObjectURL(pendingMask.blobUrl);
    setPendingMask(null);
  }, [pendingMask]);

  // Aplicar selección magic: destination-out sobre el canvas principal.
  // Z.19: usa maskToAlphaCanvas porque SAM devuelve mask RGB sin canal alpha,
  // y destination-out usa alpha (no luminancia). Sin esta conversión borraría
  // TODA la imagen (alpha=1 en todos los pixels de la mask).
  const applyPendingMask = useCallback(() => {
    if (!pendingMask) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const alphaCanvas = maskToAlphaCanvas(pendingMask.img, canvas.width, canvas.height);
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(alphaCanvas, 0, 0);
    ctx.restore();
    URL.revokeObjectURL(pendingMask.blobUrl);
    setPendingMask(null);
  }, [pendingMask]);

  // Cargar imagen original al canvas cuando se abre el modal.
  // Z.18: NO incluir onError en deps — su referencia cambia cada render
  // del padre y triggeraria recargar la imagen tras cada magic-erase,
  // borrando el progreso del user. Usamos un ref para acceder a la callback
  // sin invalidar el effect.
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    if (!open || !imageUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      originalImgRef.current = img;
    };
    img.onerror = () => onErrorRef.current?.("No se pudo cargar la imagen");
    img.src = imageUrl;
  }, [open, imageUrl]);

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setDrawing(false);
      setMagicLoading(false);
      setCursorPos(null);
      setTool("erase");
      lastPointRef.current = null;
      if (pendingMask) {
        URL.revokeObjectURL(pendingMask.blobUrl);
        setPendingMask(null);
      }
    }
    // pendingMask intencionalmente fuera de deps — solo limpia al cerrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Render del overlay azul de la selección magic cada vez que cambia.
  // Z.19: usa maskToAlphaCanvas porque SAM devuelve mask como RGB blanco/negro
  // SIN canal alpha. Si usáramos destination-in con la mask directa, el alpha
  // sería 1 en toda la imagen → toda la imagen quedaría azul (no útil).
  useEffect(() => {
    const main = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!main || !overlay) return;
    overlay.width = main.width;
    overlay.height = main.height;
    const octx = overlay.getContext("2d");
    if (!octx) return;
    octx.clearRect(0, 0, overlay.width, overlay.height);
    if (pendingMask) {
      // 1. Convertir mask RGB (blanco=objeto, negro=fondo) → canvas con
      // alpha real (alpha=255 donde objeto, alpha=0 donde fondo)
      const alphaCanvas = maskToAlphaCanvas(pendingMask.img, overlay.width, overlay.height);
      // 2. Dibujar ese canvas (su alpha es correcto)
      octx.drawImage(alphaCanvas, 0, 0);
      // 3. Tintarlo de azul: source-in mantiene el alpha, cambia el color
      octx.globalCompositeOperation = "source-in";
      octx.fillStyle = "rgba(59, 130, 246, 0.55)";
      octx.fillRect(0, 0, overlay.width, overlay.height);
      octx.globalCompositeOperation = "source-over";
    }
  }, [pendingMask]);

  // ─── Coordenadas: convierte clientX/Y a coords del canvas ─────────────
  const getCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // ─── Pintar 1 punto (erase = borra alpha, restore = pinta original) ───
  // Restore usa un canvas temporal con destination-in para garantizar que
  // solo se pinta dentro del círculo (clip() es frágil con transforms).
  const paintAt = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (tool === "erase") {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (tool === "restore") {
      const img = originalImgRef.current;
      if (!img) return;
      // 1. Canvas temporal con la imagen original
      const tmp = document.createElement("canvas");
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      const tctx = tmp.getContext("2d");
      if (!tctx) return;
      tctx.drawImage(img, 0, 0);
      // 2. Recortar a círculo (destination-in deja solo lo que está bajo el círculo)
      tctx.globalCompositeOperation = "destination-in";
      tctx.beginPath();
      tctx.arc(x, y, brushSize, 0, Math.PI * 2);
      tctx.fill();
      // 3. Pegar ese círculo de imagen original sobre el canvas principal
      ctx.drawImage(tmp, 0, 0);
    }
  }, [tool, brushSize]);

  // Línea continua entre 2 puntos (para que arrastrar rápido no deje gaps)
  const paintLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / (brushSize / 4)));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      paintAt(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t);
    }
  }, [brushSize, paintAt]);

  // ─── Magic erase: click → SAM → guarda mask como pendingMask (overlay azul).
  // El user confirma con "Borrar selección" o descarta con "Cancelar".
  const handleMagicClick = useCallback(async (x: number, y: number) => {
    if (balance !== null && balance !== undefined && balance < magicCost) {
      onError?.("Sin créditos suficientes para Borrador mágico");
      return;
    }
    // Si ya hay una selección pendiente, la reemplazamos por la nueva.
    if (pendingMask) {
      URL.revokeObjectURL(pendingMask.blobUrl);
      setPendingMask(null);
    }
    setMagicLoading(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        canvasRef.current?.toBlob(resolve, "image/png");
      });
      if (!blob) throw new Error("No se pudo serializar el canvas");

      const form = new FormData();
      form.append("image_file", new File([blob], "canvas.png", { type: "image/png" }));
      form.append("point_x", String(Math.round(x)));
      form.append("point_y", String(Math.round(y)));
      const res = await fetch("/api/magic-erase", { method: "POST", body: form });

      if (res.status === 402) {
        onError?.("Sin créditos suficientes para Borrador mágico");
        return;
      }
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const fullErr = errJson.detail || errJson.error || `HTTP ${res.status}`;
        console.error("[magic-erase] server error:", fullErr, errJson);
        throw new Error(fullErr);
      }

      // Z.19: mostrar la mask como overlay (no borrar todavía).
      const maskBlob = await res.blob();
      const maskBlobUrl = URL.createObjectURL(maskBlob);
      const mask = new Image();
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          mask.onload = () => resolve();
          mask.onerror = () => reject(new Error("No se pudo decodificar la máscara"));
          mask.src = maskBlobUrl;
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout cargando máscara (15s)")), 15000),
        ),
      ]);
      setPendingMask({ img: mask, blobUrl: maskBlobUrl });
      onCreditsConsumed?.();
    } catch (e) {
      console.error("[magic-erase client]", e);
      onError?.(e instanceof Error ? e.message : "Error en borrador mágico");
    } finally {
      setMagicLoading(false);
    }
  }, [balance, magicCost, onError, onCreditsConsumed, pendingMask]);

  // ─── Pointer handlers ──────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCoords(e.clientX, e.clientY);
    if (!coords) return;
    if (tool === "magic") {
      void handleMagicClick(coords.x, coords.y);
      return;
    }
    setDrawing(true);
    lastPointRef.current = coords;
    paintAt(coords.x, coords.y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCoords(e.clientX, e.clientY);
    if (coords) setCursorPos(coords);
    if (!drawing || !coords || !lastPointRef.current) return;
    paintLine(lastPointRef.current, coords);
    lastPointRef.current = coords;
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(false);
    lastPointRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  const onPointerLeave = () => setCursorPos(null);

  // ─── Save: exporta canvas a PNG transparente ──────────────────────────
  const handleSave = () => {
    const dataUrl = canvasRef.current?.toDataURL("image/png");
    if (dataUrl) onSave(dataUrl);
  };

  if (!open) return null;

  const insufficient = balance !== null && balance !== undefined && balance < magicCost;
  const magicDisabled = magicLoading || insufficient;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
        <div>
          <h2 className="text-white font-bold text-base">Refinar bordes</h2>
          <p className="text-[11px] text-gray-400">
            Borra zonas sobrantes manualmente o con IA
          </p>
        </div>
        <button
          onClick={onCancel}
          className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Cerrar">
          <X size={18}/>
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10 shrink-0 overflow-x-auto">
        <ToolBtn
          icon={<Eraser size={16}/>}
          label="Borrar"
          active={tool === "erase"}
          onClick={() => { cancelPendingMask(); setTool("erase"); }}
        />
        <ToolBtn
          icon={<Sparkles size={16}/>}
          label={`Mágico (${magicCost}cr)`}
          active={tool === "magic"}
          onClick={() => setTool("magic")}
          disabled={insufficient}
          variant="magic"
        />
        <ToolBtn
          icon={<Brush size={16}/>}
          label="Restaurar"
          active={tool === "restore"}
          onClick={() => { cancelPendingMask(); setTool("restore"); }}
        />

        {/* Slider tamaño pincel (solo para erase/restore) */}
        {tool !== "magic" && (
          <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-white/10">
            <span className="text-[11px] text-gray-400">Tamaño</span>
            <input
              type="range"
              min={5}
              max={150}
              value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))}
              className="w-32 accent-purple-500"
            />
            <span className="text-[11px] text-gray-400 w-8 tabular-nums">{brushSize}px</span>
          </div>
        )}

        {/* Balance créditos */}
        {balance !== null && balance !== undefined && (
          <div className="ml-auto text-[11px] text-gray-400 hidden sm:block">
            Tienes <span className="font-bold text-purple-200">{balance}</span> créditos
          </div>
        )}
      </div>

      {/* Slider mobile (debajo de toolbar) */}
      {tool !== "magic" && (
        <div className="sm:hidden px-4 py-2 flex items-center gap-2 border-b border-white/10 shrink-0">
          <span className="text-[11px] text-gray-400">Tamaño</span>
          <input
            type="range"
            min={5}
            max={150}
            value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            className="flex-1 accent-purple-500"
          />
          <span className="text-[11px] text-gray-400 w-10 tabular-nums">{brushSize}px</span>
        </div>
      )}

      {/* Canvas area */}
      <div
        className="flex-1 overflow-hidden relative flex items-center justify-center p-2 sm:p-4"
        style={{
          // Tablero ajedrez para hacer visible la transparencia
          backgroundImage:
            "linear-gradient(45deg, #2a2a3a 25%, transparent 25%), linear-gradient(-45deg, #2a2a3a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a3a 75%), linear-gradient(-45deg, transparent 75%, #2a2a3a 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          backgroundColor: "#1a1a24",
        }}>
        {/* Loading overlay para magic */}
        {magicLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-purple-300" size={36}/>
              <p className="text-white text-sm font-semibold">Borrando con IA…</p>
              <p className="text-gray-400 text-[11px]">SAM-2 está segmentando el objeto</p>
            </div>
          </div>
        )}

        {/* Canvas + overlay selección + cursor preview */}
        <div className="relative" style={{ maxWidth: "100%", maxHeight: "100%" }}>
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            className="max-w-full max-h-[calc(100vh-260px)] object-contain block touch-none"
            style={{
              cursor: tool === "magic" ? "crosshair" : "none",
            }}
          />
          {/* Z.19: overlay canvas mostrando la selección mágica en azul */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none object-contain"
            style={{ display: pendingMask ? "block" : "none" }}
          />
          {/* Cursor preview circular (solo erase/restore, escala al display) */}
          {cursorPos && tool !== "magic" && canvasRef.current && (
            <CursorPreview
              canvas={canvasRef.current}
              canvasX={cursorPos.x}
              canvasY={cursorPos.y}
              brushSize={brushSize}
              color={tool === "erase" ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)"}
            />
          )}
        </div>
      </div>

      {/* Footer con CTAs — cambia según haya o no selección pendiente magic */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-t border-white/10 shrink-0">
        {pendingMask ? (
          // Z.19: selección mágica pendiente → botones contextuales
          <>
            <p className="text-[11px] font-semibold text-blue-300 hidden sm:flex items-center gap-1.5">
              <Sparkles size={12} className="text-blue-300"/>
              Selección lista — ¿la borras o cancelas?
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={cancelPendingMask}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-gray-300 font-bold text-[12.5px]">
                Cancelar selección
              </button>
              <button
                onClick={applyPendingMask}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white font-bold text-[12.5px] flex items-center gap-1.5">
                <Trash2 size={14} strokeWidth={2.5}/>
                Borrar selección
              </button>
            </div>
          </>
        ) : (
          // Estado normal: hint + Cancelar/Aplicar global
          <>
            <p className="text-[10px] text-gray-500 hidden sm:block">
              {tool === "erase" && "Arrastra para borrar las zonas sobrantes"}
              {tool === "magic" && (insufficient ? "Sin créditos suficientes" : "Toca el objeto que quieres borrar — verás la selección en azul antes de borrar")}
              {tool === "restore" && "Arrastra para recuperar zonas borradas por error"}
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={onCancel}
                disabled={magicLoading}
                className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-gray-300 font-bold text-[12.5px] disabled:opacity-50">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={magicLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 text-white font-bold text-[12.5px] flex items-center gap-1.5 disabled:opacity-50">
                <Check size={14} strokeWidth={2.5}/>
                Aplicar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Magic disabled hint */}
      {tool === "magic" && magicDisabled && !magicLoading && (
        <div className="absolute top-[100px] left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] font-bold">
          ⚠ Sin créditos — usa el pincel manual o sube de plan
        </div>
      )}
    </div>
  );
}

// ─── Helpers internos ───────────────────────────────────────────────────

/**
 * Z.19: convierte una mask de SAM (PNG RGB donde blanco = objeto, negro = fondo)
 * en un canvas con CANAL ALPHA correcto (alpha=255 donde objeto, alpha=0 donde
 * fondo). Necesario porque destination-out/destination-in trabajan con alpha,
 * no con luminancia. Sin esta conversión la mask se aplica como "todo opaco" y
 * el composite operation borra/mantiene la imagen entera.
 *
 * También garantiza que la mask se escala a las dimensiones del canvas destino.
 */
function maskToAlphaCanvas(maskImg: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const tmp = document.createElement("canvas");
  tmp.width = w;
  tmp.height = h;
  const tctx = tmp.getContext("2d");
  if (!tctx) return tmp;
  tctx.drawImage(maskImg, 0, 0, w, h);
  const imgData = tctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    // Luminancia promedio. SAM devuelve blanco (255,255,255) para objeto
    // y negro (0,0,0) para fondo. Threshold 128 separa los dos.
    const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
    const isObject = lum > 128;
    // Color blanco fijo (no afecta a destination-out/in que solo usan alpha)
    d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
    d[i + 3] = isObject ? 255 : 0;
  }
  tctx.putImageData(imgData, 0, 0);
  return tmp;
}

function ToolBtn({
  icon, label, active, disabled, onClick, variant,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  variant?: "magic";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? variant === "magic"
            ? "bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-200"
            : "bg-purple-500/20 border border-purple-500/40 text-purple-200"
          : "bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08]"
      }`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

/** Círculo overlay que sigue al cursor mostrando el tamaño del pincel. */
function CursorPreview({
  canvas, canvasX, canvasY, brushSize, color,
}: {
  canvas: HTMLCanvasElement;
  canvasX: number;
  canvasY: number;
  brushSize: number;
  color: string;
}) {
  // Convertir coords de canvas a coords de display (px relativos al div padre)
  const rect = canvas.getBoundingClientRect();
  const parentRect = canvas.parentElement?.getBoundingClientRect();
  if (!parentRect) return null;
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  const displayX = (canvas.offsetLeft) + canvasX * scaleX;
  const displayY = (canvas.offsetTop) + canvasY * scaleY;
  const displaySize = brushSize * scaleX;
  return (
    <div
      className="absolute pointer-events-none rounded-full border-2"
      style={{
        left: displayX - displaySize,
        top: displayY - displaySize,
        width: displaySize * 2,
        height: displaySize * 2,
        borderColor: color,
        backgroundColor: color.replace("0.4", "0.15"),
      }}
    />
  );
}
