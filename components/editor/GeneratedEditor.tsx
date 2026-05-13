"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, Textbox, FabricObject, FabricImage, Rect } from "fabric";
import { useRouter } from "next/navigation";

type GeneratedData = {
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventPrice: string;
  artistPhoto: string | null;
  palette: { colors: string[]; label: string };
  style: string;
  format: string;
};

type Props = { data: GeneratedData };

const FONTS = ["Impact", "Arial Black", "Anton", "Bebas Neue", "Montserrat", "Playfair Display", "Oswald", "Georgia", "Arial"];

// Dimensiones del canvas según formato
const FORMAT_SIZES: Record<string, { w: number; h: number }> = {
  instagram: { w: 430, h: 538 },
  historia:  { w: 430, h: 763 },
  cuadrado:  { w: 430, h: 430 },
  evento:    { w: 763, h: 430 },
};

type SelectedText = { text: string; color: string; fontFamily: string; fontSize: number };

export default function GeneratedEditor({ data }: Props) {
  const router = useRouter();
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const scaleRef = useRef(1);

  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [selectedText, setSelectedText] = useState<SelectedText>({ text: "", color: "#ffffff", fontFamily: "Impact", fontSize: 40 });
  const [bgEditMode, setBgEditMode] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);

  const { colors, label: palLabel } = data.palette;
  const [c0, c1, c2] = colors; // acento, medio, fondo

  const fmt = data.format?.toLowerCase() ?? "instagram";
  const fmtKey = Object.keys(FORMAT_SIZES).find(k => fmt.includes(k)) ?? "instagram";
  const { w: TW, h: TH } = FORMAT_SIZES[fmtKey];

  // Medir contenedor y calcular canvas size
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const measure = () => {
      const aw = node.clientWidth;
      const ah = node.clientHeight;
      if (aw <= 0 || ah <= 0) return;
      const scale = Math.min(aw / TW, ah / TH, 1);
      scaleRef.current = scale;
      setCanvasSize({ w: Math.round(TW * scale), h: Math.round(TH * scale) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    return () => ro.disconnect();
  }, [TW, TH]);

  // Inicializar Fabric y construir capas desde los datos generados
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el || !canvasSize) return;
    let cancelled = false;

    const s = scaleRef.current;
    const canvas = new Canvas(el, {
      width: canvasSize.w,
      height: canvasSize.h,
      backgroundColor: c2,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const build = async () => {
      // CAPA 1: Fondo con gradiente (rect)
      const bg = new Rect({
        left: 0, top: 0,
        width: canvasSize.w, height: canvasSize.h,
        fill: c2,
        selectable: false, evented: false,
        id: "bg-rect",
      });
      canvas.add(bg);

      // Gradiente radial simulado con rect semitransparente
      const glow = new Rect({
        left: 0, top: canvasSize.h * 0.35,
        width: canvasSize.w, height: canvasSize.h * 0.65,
        fill: c1,
        opacity: 0.45,
        selectable: false, evented: false,
        id: "bg-glow",
      });
      canvas.add(glow);

      // CAPA 2: Foto del artista
      if (data.artistPhoto) {
        try {
          const img = await FabricImage.fromURL(data.artistPhoto, { crossOrigin: "anonymous" });
          const scaleToFill = Math.max(canvasSize.w / (img.width ?? 1), (canvasSize.h * 0.65) / (img.height ?? 1));
          img.set({
            left: canvasSize.w / 2,
            top: 0,
            originX: "center",
            originY: "top",
            scaleX: scaleToFill,
            scaleY: scaleToFill,
            selectable: false,
            evented: false,
            id: "artist-photo",
          });
          canvas.add(img);

          // Degradado encima de la foto
          const fade = new Rect({
            left: 0, top: canvasSize.h * 0.3,
            width: canvasSize.w, height: canvasSize.h * 0.7,
            fill: c2,
            opacity: 0.8,
            selectable: false, evented: false,
            id: "photo-fade",
          });
          canvas.add(fade);
        } catch (e) {
          console.warn("Error cargando foto artista:", e);
        }
      }

      if (cancelled) return;

      // CAPA 3: Nombre del evento
      if (data.eventName) {
        const nameText = new Textbox(data.eventName.toUpperCase(), {
          left: 16 * s, top: canvasSize.h * 0.6,
          width: canvasSize.w - 32 * s,
          fontSize: 52 * s,
          fontFamily: "Impact",
          fontWeight: "bold",
          fill: c0,
          textAlign: "left",
          editable: true,
          id: "event-name",
        });
        canvas.add(nameText);
      }

      // CAPA 4: Fecha
      if (data.eventDate) {
        const dateText = new Textbox(data.eventDate.toUpperCase(), {
          left: 16 * s, top: canvasSize.h * 0.6 + 58 * s,
          width: canvasSize.w - 32 * s,
          fontSize: 13 * s,
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: "#ffffff",
          opacity: 0.75,
          textAlign: "left",
          editable: true,
          id: "event-date",
        });
        canvas.add(dateText);
      }

      // CAPA 5: Lugar
      if (data.eventVenue) {
        const venueText = new Textbox(`📍 ${data.eventVenue}`, {
          left: 16 * s, top: canvasSize.h * 0.6 + 76 * s,
          width: canvasSize.w - 32 * s,
          fontSize: 12 * s,
          fontFamily: "Arial",
          fill: "#ffffff",
          opacity: 0.6,
          textAlign: "left",
          editable: true,
          id: "event-venue",
        });
        canvas.add(venueText);
      }

      // CAPA 6: Precio (badge)
      if (data.eventPrice) {
        const priceBg = new Rect({
          left: 16 * s, top: canvasSize.h - 48 * s,
          width: 110 * s, height: 30 * s,
          fill: c0,
          rx: 6 * s, ry: 6 * s,
          id: "price-bg",
        });
        canvas.add(priceBg);

        const priceText = new Textbox(`🎟️ ${data.eventPrice}`, {
          left: 16 * s, top: canvasSize.h - 46 * s,
          width: 110 * s,
          fontSize: 11 * s,
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: c2,
          textAlign: "center",
          editable: true,
          id: "event-price",
        });
        canvas.add(priceText);
      }

      // URL watermark
      const urlText = new Textbox("artegenia.com", {
        left: 0, top: canvasSize.h - 20 * s,
        width: canvasSize.w,
        fontSize: 9 * s,
        fontFamily: "Arial",
        fill: "#ffffff",
        opacity: 0.2,
        textAlign: "center",
        selectable: false, evented: false,
        id: "watermark",
      });
      canvas.add(urlText);

      canvas.renderAll();
    };

    build();

    // Eventos de selección
    const onSelect = () => {
      const active = canvas.getActiveObject();
      if (!active) { setSelectedObject(null); return; }
      setSelectedObject(active);
      if (active.type === "textbox") {
        const tb = active as Textbox;
        const s = scaleRef.current;
        setSelectedText({
          text: tb.text ?? "",
          color: String(tb.fill ?? "#ffffff"),
          fontFamily: tb.fontFamily ?? "Impact",
          fontSize: Math.round((typeof tb.fontSize === "number" ? tb.fontSize : 40) / s),
        });
      }
    };
    canvas.on("selection:created", onSelect);
    canvas.on("selection:updated", onSelect);
    canvas.on("selection:cleared", () => { setSelectedObject(null); });

    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = canvas.getActiveObject();
        if (active) { canvas.remove(active); canvas.discardActiveObject(); canvas.renderAll(); setSelectedObject(null); }
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", onKey);
      fabricRef.current = null;
      void canvas.dispose();
    };
  }, [canvasSize, c0, c1, c2, data]);

  const updateText = useCallback((v: string) => {
    const c = fabricRef.current; if (!c || !selectedObject) return;
    (selectedObject as Textbox).set("text", v);
    setSelectedText(p => ({ ...p, text: v })); c.renderAll();
  }, [selectedObject]);

  const updateColor = useCallback((v: string) => {
    const c = fabricRef.current; if (!c || !selectedObject) return;
    (selectedObject as Textbox).set("fill", v);
    setSelectedText(p => ({ ...p, color: v })); c.renderAll();
  }, [selectedObject]);

  const updateFont = useCallback((v: string) => {
    const c = fabricRef.current; if (!c || !selectedObject) return;
    (selectedObject as Textbox).set("fontFamily", v);
    setSelectedText(p => ({ ...p, fontFamily: v })); c.renderAll();
  }, [selectedObject]);

  const updateFontSize = useCallback((v: number) => {
    const c = fabricRef.current; if (!c || !selectedObject) return;
    const s = scaleRef.current;
    const size = Math.max(6, Math.min(200, v));
    (selectedObject as Textbox).set("fontSize", size * s);
    setSelectedText(p => ({ ...p, fontSize: size })); c.renderAll();
  }, [selectedObject]);

  const deleteSelected = useCallback(() => {
    const c = fabricRef.current; if (!c || !selectedObject) return;
    c.remove(selectedObject); c.discardActiveObject(); c.renderAll(); setSelectedObject(null);
  }, [selectedObject]);

  const bringForward = useCallback(() => {
    const c = fabricRef.current; if (!c || !selectedObject) return;
    c.bringObjectForward(selectedObject); c.renderAll();
  }, [selectedObject]);

  const sendBackward = useCallback(() => {
    const c = fabricRef.current; if (!c || !selectedObject) return;
    c.sendObjectBackwards(selectedObject); c.renderAll();
  }, [selectedObject]);

  const addText = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const s = scaleRef.current;
    const t = new Textbox("Nuevo texto", {
      left: 20 * s, top: 100 * s, width: (TW - 40) * s,
      fontSize: 32 * s, fontFamily: "Impact", fill: c0, fontWeight: "bold", textAlign: "center",
    });
    c.add(t); c.setActiveObject(t); c.renderAll();
    setSelectedObject(t);
    setSelectedText({ text: "Nuevo texto", color: c0, fontFamily: "Impact", fontSize: 32 });
  }, [c0, TW]);

  const toggleBgEditMode = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const objects = c.getObjects();
    const bgImg = objects.find(o => (o as FabricObject & { id?: string }).id === "artist-photo");
    if (!bgImg) return;
    if (!bgEditMode) {
      bgImg.set({ selectable: true, evented: true });
      c.bringObjectToFront(bgImg);
      c.setActiveObject(bgImg);
      c.renderAll();
      setSelectedObject(bgImg);
      setBgEditMode(true);
    } else {
      bgImg.set({ selectable: false, evented: false });
      c.sendObjectToBack(bgImg);
      // mantener bg-rect al fondo
      const bgRect = objects.find(o => (o as FabricObject & { id?: string }).id === "bg-rect");
      if (bgRect) c.sendObjectToBack(bgRect);
      c.discardActiveObject();
      c.renderAll();
      setSelectedObject(null);
      setBgEditMode(false);
    }
  }, [bgEditMode]);

  const addImage = useCallback(async (file: File, replacing?: FabricObject) => {
    const c = fabricRef.current; if (!c) return;
    const dataUrl = await new Promise<string>(res => {
      const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.readAsDataURL(file);
    });
    const img = await FabricImage.fromURL(dataUrl);
    const maxW = c.width! * 0.7, maxH = c.height! * 0.7;
    const scale = Math.min(maxW / (img.width ?? maxW), maxH / (img.height ?? maxH), 1);
    if (replacing) {
      img.set({ left: replacing.left, top: replacing.top, scaleX: scale, scaleY: scale });
      c.remove(replacing);
    } else {
      img.set({ left: (c.width! - (img.width ?? 0) * scale) / 2, top: (c.height! - (img.height ?? 0) * scale) / 2, scaleX: scale, scaleY: scale });
    }
    c.add(img); c.setActiveObject(img); c.renderAll(); setSelectedObject(img);
  }, []);

  const handleRemoveBg = useCallback(async () => {
    const c = fabricRef.current;
    if (!c || !selectedObject || selectedObject.type !== "image") return;
    setRemovingBg(true);
    try {
      const imgEl = (selectedObject as FabricImage).getElement() as HTMLImageElement;
      const tmp = document.createElement("canvas");
      tmp.width = imgEl.naturalWidth || 800; tmp.height = imgEl.naturalHeight || 800;
      tmp.getContext("2d")?.drawImage(imgEl, 0, 0, tmp.width, tmp.height);
      const res = await fetch("/api/remove-bg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: tmp.toDataURL("image/png") }) });
      const dataRes = await res.json();
      if (!res.ok || !dataRes.result) throw new Error(dataRes.error);
      const old = selectedObject;
      const newImg = await FabricImage.fromURL(dataRes.result);
      newImg.set({ left: old.left, top: old.top, scaleX: old.scaleX, scaleY: old.scaleY });
      c.remove(old); c.add(newImg); c.setActiveObject(newImg); c.renderAll(); setSelectedObject(newImg);
    } catch { alert("Error al quitar el fondo."); }
    finally { setRemovingBg(false); }
  }, [selectedObject]);

  const exportPng = useCallback(() => {
    const c = fabricRef.current; if (!c) return;
    const s = scaleRef.current;
    const url = c.toDataURL({ format: "png", quality: 1, multiplier: s > 0 ? 1 / s : 1 });
    const a = document.createElement("a"); a.href = url; a.download = `${data.eventName || "flyer"}.png`; a.click();
  }, [data.eventName]);

  const handleSave = useCallback(() => {
    setSaveFlash(true); setTimeout(() => setSaveFlash(false), 1500);
  }, []);

  const isText = selectedObject?.type === "textbox";
  const isImage = selectedObject?.type === "image";

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#0e0e14]">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = ""; }} className="hidden" />
      <input ref={replaceInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f && selectedObject) addImage(f, selectedObject); e.target.value = ""; }} className="hidden" />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#111127] border-b border-white/[0.06] gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/create")} className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-1.5">
            ← Volver
          </button>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-sm font-bold text-white">{data.eventName || "Flyer generado"}</span>
          <div className="flex gap-1">
            {colors.map((c, i) => <div key={i} className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ background: c }} />)}
          </div>
          <span className="text-xs text-gray-600">{palLabel} · {data.style}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${saveFlash ? "bg-green-600 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"}`}>
            {saveFlash ? "✓ Guardado" : "💾 Guardar"}
          </button>
          <button onClick={exportPng} className="px-4 py-1.5 rounded-xl bg-yellow-400 text-black text-sm font-black hover:bg-yellow-300 transition-all">
            ↓ PNG
          </button>
        </div>
      </div>

      {/* Cuerpo principal */}
      <div className="flex flex-1 min-h-0">

        {/* Panel izquierdo */}
        <aside className="w-56 shrink-0 bg-[#111127] border-r border-white/[0.06] p-4 flex flex-col gap-3 overflow-y-auto">
          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Herramientas</p>
          <button onClick={addText} className="w-full rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 text-left text-sm hover:bg-white/10 transition-colors">
            ✏️ Añadir texto
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 text-left text-sm hover:bg-white/10 transition-colors">
            🖼️ Subir imagen
          </button>
          <button
            onClick={toggleBgEditMode}
            className={`w-full rounded-xl px-3 py-2.5 text-left text-sm border transition-all ${bgEditMode ? "bg-orange-500/20 border-orange-500/40 text-orange-300" : "bg-white/5 border-white/8 hover:bg-white/10"}`}
          >
            {bgEditMode ? "🔒 Fijar foto (listo)" : "🎨 Mover foto artista"}
          </button>

          {selectedObject && (
            <div className="mt-2 pt-3 border-t border-white/8">
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Capa activa</p>
              <div className="flex gap-1.5">
                <button onClick={bringForward} className="flex-1 rounded-lg bg-white/5 border border-white/8 py-1.5 text-xs hover:bg-white/10">↑ Adelante</button>
                <button onClick={sendBackward} className="flex-1 rounded-lg bg-white/5 border border-white/8 py-1.5 text-xs hover:bg-white/10">↓ Atrás</button>
              </div>
              <button onClick={deleteSelected} className="w-full mt-1.5 rounded-lg bg-red-900/30 border border-red-800/40 py-2 text-xs text-red-400 hover:bg-red-900/50 transition-colors">
                🗑️ Eliminar capa
              </button>
            </div>
          )}

          {/* Paleta de colores del evento */}
          <div className="mt-auto pt-3 border-t border-white/8">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Paleta del diseño</p>
            <div className="flex gap-2">
              {colors.map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer hover:scale-110 transition-transform" style={{ background: c }}
                    onClick={() => { if (selectedObject?.type === "textbox") updateColor(c); }} />
                  <span className="text-[8px] text-gray-700 font-mono">{c}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-gray-700 mt-1">Clic para aplicar al texto seleccionado</p>
          </div>
        </aside>

        {/* Canvas central */}
        <div className="flex-1 bg-[#0a0a18] flex flex-col items-center justify-center p-6 overflow-hidden">
          <div ref={containerRef} className="w-full flex-1 flex items-center justify-center min-h-0">
            {canvasSize ? (
              <div className="rounded-xl shadow-2xl overflow-hidden flex-shrink-0 ring-1 ring-white/10"
                style={{ width: canvasSize.w, height: canvasSize.h }}>
                <canvas ref={canvasElRef} className="block" />
              </div>
            ) : (
              <div className="w-16 h-16 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <p className="text-xs text-gray-700 mt-3">Haz clic en cualquier elemento para editarlo · Doble clic para editar texto</p>
        </div>

        {/* Panel derecho — propiedades */}
        <aside className="w-64 shrink-0 bg-[#111127] border-l border-white/[0.06] p-4 flex flex-col gap-4 overflow-y-auto">
          <p className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">Propiedades</p>

          {!selectedObject && (
            <p className="text-sm text-gray-500 leading-relaxed">
              Selecciona un elemento del flyer para editar sus propiedades.
            </p>
          )}

          {isText && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Texto</label>
                <textarea
                  value={selectedText.text}
                  onChange={e => updateText(e.target.value)}
                  className="w-full min-h-[72px] bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none focus:border-purple-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Fuente</label>
                <select
                  value={selectedText.fontFamily}
                  onChange={e => updateFont(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-purple-500/40"
                >
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Tamaño: <span className="text-white">{selectedText.fontSize}px</span>
                </label>
                <div className="flex gap-2 items-center">
                  <input type="range" min={8} max={150} value={selectedText.fontSize}
                    onChange={e => updateFontSize(Number(e.target.value))}
                    className="flex-1 accent-purple-500" />
                  <input type="number" min={8} max={200} value={selectedText.fontSize}
                    onChange={e => updateFontSize(Number(e.target.value))}
                    className="w-14 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none text-center" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 block">Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={selectedText.color} onChange={e => updateColor(e.target.value)}
                    className="h-10 w-14 rounded-xl border border-white/10 bg-black/30 cursor-pointer" />
                  <span className="text-sm text-gray-400 font-mono">{selectedText.color}</span>
                </div>
              </div>
            </div>
          )}

          {isImage && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-500">Imagen seleccionada. Mueve, escala y rota en el canvas.</p>
              <button onClick={() => replaceInputRef.current?.click()}
                className="w-full rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 text-sm hover:bg-white/10 transition-colors">
                🔄 Reemplazar imagen
              </button>
              <button onClick={handleRemoveBg} disabled={removingBg}
                className={`w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${removingBg ? "bg-white/5 text-gray-500 cursor-not-allowed" : "bg-emerald-900/30 border border-emerald-700/40 text-emerald-400 hover:bg-emerald-900/50"}`}>
                {removingBg ? "⏳ Procesando..." : "✂️ Quitar fondo"}
              </button>
              <button onClick={deleteSelected}
                className="w-full rounded-xl bg-red-900/30 border border-red-800/40 px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/50 transition-colors">
                🗑️ Eliminar imagen
              </button>
            </div>
          )}

          {/* Info del evento */}
          <div className="mt-auto pt-3 border-t border-white/8 flex flex-col gap-1.5">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Info del evento</p>
            {data.eventName  && <p className="text-xs text-gray-400">🎤 {data.eventName}</p>}
            {data.eventDate  && <p className="text-xs text-gray-400">📅 {data.eventDate}</p>}
            {data.eventVenue && <p className="text-xs text-gray-400">📍 {data.eventVenue}</p>}
            {data.eventPrice && <p className="text-xs text-gray-400">🎟️ {data.eventPrice}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
