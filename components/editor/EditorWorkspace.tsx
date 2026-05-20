"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, Textbox, FabricObject, FabricImage } from "fabric";
import type { Template } from "@/data/templates";
import { getVariant } from "@/data/templates";
import type { FormatId } from "@/data/formats";
import { applyTemplateLayers } from "@/lib/fabricApplyTemplateLayers";
import { useEditorStorage } from "@/hooks/useEditorStorage";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";

type EditorWorkspaceProps = { template: Template; formatId?: FormatId };
type SelectedTextState = { text: string; color: string; fontFamily: string; fontSize: number };

const FONTS = ["Arial","Bebas Neue","Anton","Montserrat","Playfair Display","Great Vibes","Oswald","Georgia"];
const IDENTITY: [number,number,number,number,number,number] = [1,0,0,1,0,0];

export default function EditorWorkspace({ template, formatId }: EditorWorkspaceProps) {
    const variant = getVariant(template, formatId);
    const canvasElRef = useRef<HTMLCanvasElement | null>(null);
    const canvasScrollRef = useRef<HTMLDivElement | null>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const replaceInputRef = useRef<HTMLInputElement | null>(null);
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);

    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [saveFlash, setSaveFlash] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [removingBg, setRemovingBg] = useState(false);
    const [selectedText, setSelectedText] = useState<SelectedTextState>({
        text: "", color: "#ffffff", fontFamily: "Arial", fontSize: 32,
    });

    const { saveDesign, loadDesign, hasSavedDesign } = useEditorStorage();
    const { saveProject } = useProjects();
    const { user } = useAuth();
    const [projectId, setProjectId] = useState<string | null>(null);

    const saveHistory = useCallback(() => {
        const c = fabricRef.current;
        if (!c) return;
        const json = JSON.stringify(c.toJSON());
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;
    }, []);

    const undo = useCallback(() => {
        const c = fabricRef.current;
        if (!c || historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        c.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => c.renderAll());
    }, []);

    const redo = useCallback(() => {
        const c = fabricRef.current;
        if (!c || historyIndexRef.current >= historyRef.current.length - 1) return;
        historyIndexRef.current++;
        c.loadFromJSON(JSON.parse(historyRef.current[historyIndexRef.current])).then(() => c.renderAll());
    }, []);

    useEffect(() => {
        const el = canvasElRef.current;
        if (!el) return;
        let cancelled = false;

        const canvas = new Canvas(el, {
            width: variant.width,
            height: variant.height,
            backgroundColor: "#080812",
            preserveObjectStacking: true,
            enableRetinaScaling: false,
        });
        fabricRef.current = canvas;
        setIsMounted(true);
        canvas.setViewportTransform(IDENTITY);

        const saved = loadDesign(template.id);
        if (saved) {
            canvas.loadFromJSON(saved.fabricJson).then(() => {
                if (cancelled || canvas.disposed) return;
                canvas.setViewportTransform(IDENTITY);
                canvas.renderAll();
                canvas.calcOffset();
                setSavedAt(saved.savedAt);
                saveHistory();
            });
        } else {
            applyTemplateLayers(canvas, variant.layers).then(() => {
                if (cancelled || canvas.disposed) return;
                canvas.calcOffset();
                saveHistory();
            });
        }

        const onSelect = () => {
            const active = canvas.getActiveObject();
            if (!active) {
                setSelectedObject(null);
                setSelectedText({ text: "", color: "#ffffff", fontFamily: "Arial", fontSize: 32 });
                return;
            }
            setSelectedObject(active);
            if (active.type === "textbox") {
                const tb = active as Textbox;
                setSelectedText({
                    text: tb.text ?? "",
                    color: String(tb.fill ?? "#ffffff"),
                    fontFamily: tb.fontFamily ?? "Arial",
                    fontSize: typeof tb.fontSize === "number" ? Math.round(tb.fontSize) : 32,
                });
            }
        };
        canvas.on("selection:created", onSelect);
        canvas.on("selection:updated", onSelect);
        canvas.on("selection:cleared", onSelect);
        canvas.on("object:modified", saveHistory);
        canvas.on("object:added", saveHistory);
        canvas.on("object:removed", saveHistory);

        const onKey = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
            if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); undo(); return; }
            if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo(); return; }
            if (e.key === "Delete" || e.key === "Backspace") {
                const active = canvas.getActiveObject();
                if (active) { canvas.remove(active); canvas.discardActiveObject(); canvas.renderAll(); setSelectedObject(null); }
            }
        };
        window.addEventListener("keydown", onKey);

        const scrollEl = canvasScrollRef.current;
        const onScroll = () => { if (!canvas.disposed) canvas.calcOffset(); };
        scrollEl?.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            cancelled = true;
            setSelectedObject(null);
            window.removeEventListener("keydown", onKey);
            scrollEl?.removeEventListener("scroll", onScroll);
            fabricRef.current = null;
            void canvas.dispose();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [template.id]);

    const handleSave = useCallback(async () => {
        const c = fabricRef.current; if (!c) return;
        // Guardar en localStorage siempre
        const ok = saveDesign(template.id, template.title, c.toJSON());
        if (ok) {
            setSavedAt(new Date().toISOString());
            setSaveFlash(true);
            setTimeout(() => setSaveFlash(false), 1500);
        }
        // Guardar en Supabase si está autenticado
        if (user) {
            const id = await saveProject(
                projectId,
                template.title,
                template.id,
                c.toJSON(),
                "flyer",
                variant.width,
                variant.height,
            );
            if (id && !projectId) setProjectId(id);
        }
    }, [saveDesign, saveProject, template, user, projectId]);

    const updateText = useCallback((v: string) => {
        const c = fabricRef.current; if (!c || !selectedObject) return;
        (selectedObject as Textbox).set("text", v); setSelectedText(p => ({ ...p, text: v })); c.renderAll();
    }, [selectedObject]);

    const updateColor = useCallback((v: string) => {
        const c = fabricRef.current; if (!c || !selectedObject) return;
        (selectedObject as Textbox).set("fill", v); setSelectedText(p => ({ ...p, color: v })); c.renderAll();
    }, [selectedObject]);

    const updateFont = useCallback((v: string) => {
        const c = fabricRef.current; if (!c || !selectedObject) return;
        (selectedObject as Textbox).set("fontFamily", v); setSelectedText(p => ({ ...p, fontFamily: v })); c.renderAll();
    }, [selectedObject]);

    const updateFontSize = useCallback((v: number) => {
        const c = fabricRef.current; if (!c || !selectedObject) return;
        const size = Math.max(8, Math.min(400, v));
        (selectedObject as Textbox).set("fontSize", size);
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

    const [bgEditMode, setBgEditMode] = useState(false);

    const toggleBgEditMode = useCallback(() => {
        const c = fabricRef.current; if (!c) return;
        // Buscar la imagen de fondo (primer objeto imagen en el canvas)
        const objects = c.getObjects();
        const bgImg = objects.find(o => o.type === "image");
        if (!bgImg) return;

        if (!bgEditMode) {
            // Activar modo edición fondo: subir al frente y seleccionar
            c.bringObjectToFront(bgImg);
            c.setActiveObject(bgImg);
            c.renderAll();
            setSelectedObject(bgImg);
            setBgEditMode(true);
        } else {
            // Desactivar: mandar al fondo
            c.sendObjectToBack(bgImg);
            c.discardActiveObject();
            c.renderAll();
            setSelectedObject(null);
            setBgEditMode(false);
        }
    }, [bgEditMode]);

    const addText = useCallback(() => {
        const c = fabricRef.current; if (!c) return;
        const t = new Textbox("Nuevo texto", {
            left: 40, top: 40, width: Math.min(350, variant.width - 80),
            fontSize: 32, fontFamily: "Arial", fill: "#ffffff", fontWeight: "bold", textAlign: "center",
        });
        c.add(t); c.setActiveObject(t); c.renderAll();
        setSelectedObject(t); setSelectedText({ text: "Nuevo texto", color: "#ffffff", fontFamily: "Arial", fontSize: 32 });
    }, [variant.width]);

    const addImageToCanvas = useCallback(async (file: File, replacing?: FabricObject) => {
        const c = fabricRef.current; if (!c) return;
        const dataUrl = await new Promise<string>(res => { const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.readAsDataURL(file); });
        const img = await FabricImage.fromURL(dataUrl);
        const maxW = c.width! * 0.7, maxH = c.height! * 0.7;
        const s = Math.min(maxW / (img.width ?? maxW), maxH / (img.height ?? maxH), 1);
        if (replacing) {
            img.set({ left: replacing.left, top: replacing.top, scaleX: s, scaleY: s });
            c.remove(replacing);
        } else {
            img.set({ left: (c.width! - (img.width ?? 0) * s) / 2, top: (c.height! - (img.height ?? 0) * s) / 2, scaleX: s, scaleY: s });
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
            tmp.width = imgEl.naturalWidth || imgEl.width || 800;
            tmp.height = imgEl.naturalHeight || imgEl.height || 800;
            const ctx = tmp.getContext("2d"); if (!ctx) throw new Error("no ctx");
            ctx.drawImage(imgEl, 0, 0, tmp.width, tmp.height);
            const res = await fetch("/api/remove-bg", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: tmp.toDataURL("image/png") }) });
            const data = await res.json();
            if (!res.ok || !data.result) throw new Error(data.error);
            const old = selectedObject;
            const newImg = await FabricImage.fromURL(data.result);
            newImg.set({ left: old.left, top: old.top, scaleX: old.scaleX, scaleY: old.scaleY, angle: old.angle });
            c.remove(old); c.add(newImg); c.setActiveObject(newImg); c.renderAll(); setSelectedObject(newImg);
        } catch (e) { console.error(e); alert("Error al quitar el fondo."); }
        finally { setRemovingBg(false); }
    }, [selectedObject]);

    const exportPng = useCallback(() => {
        const c = fabricRef.current; if (!c) return;
        const url = c.toDataURL({ format: "png", quality: 1, multiplier: 1 });
        const a = document.createElement("a"); a.href = url; a.download = `${template.title.replace(/\s+/g, "_")}.png`; a.click();
    }, [template]);

    const isText = selectedObject?.type === "textbox";
    const isImage = selectedObject?.type === "image";
    const isObject = !!selectedObject;

    return (
        <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) addImageToCanvas(f); e.target.value = ""; }} className="hidden" />
            <input ref={replaceInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f && selectedObject) addImageToCanvas(f, selectedObject); e.target.value = ""; }} className="hidden" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/10 gap-4">
                <div className="flex items-center gap-3">
                    <a href="/templates" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white transition-colors">
                        ← Plantillas
                    </a>
                    <span className="text-sm font-bold text-white">{template.title}</span>
                    {savedAt && <span className="text-xs text-gray-500">Guardado {new Date(savedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>}
                    {isMounted && hasSavedDesign(template.id) && !savedAt && <span className="text-xs text-yellow-500">Diseño guardado disponible</span>}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={undo} title="Deshacer (⌘Z)" className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">↩</button>
                    <button onClick={redo} title="Rehacer (⌘Y)" className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">↪</button>
                    <button onClick={handleSave} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${saveFlash ? "bg-green-600 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"}`}>
                        {saveFlash ? "✓ Guardado" : "💾 Guardar"}
                    </button>
                    <button onClick={exportPng} className="px-4 py-2 rounded-xl bg-yellow-400 text-black text-sm font-black hover:bg-yellow-300">↓ PNG</button>
                </div>
            </div>

            <section className="grid min-h-[calc(100vh-120px)] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[280px_1fr_320px]">

                {/* Left panel */}
                <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h2 className="text-lg font-bold mb-5">Herramientas</h2>
                    <div className="space-y-3">
                        <button onClick={addText} className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">✏️ Añadir texto</button>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">🖼️ Subir imagen</button>
                    </div>
                    {isObject && (
                        <div className="mt-6 pt-5 border-t border-white/10">
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Capa seleccionada</h3>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <button onClick={bringForward} className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15">↑ Adelante</button>
                                    <button onClick={sendBackward} className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15">↓ Atrás</button>
                                </div>
                                <button onClick={deleteSelected} className="w-full rounded-xl bg-red-900/40 border border-red-800/50 px-4 py-2 text-sm text-red-400 hover:bg-red-900/60">🗑️ Eliminar capa</button>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Canvas */}
                <div className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-white/10 bg-[#0b0c14] p-6">
                    <div className="mx-auto mb-4 w-full max-w-[520px] shrink-0">
                        <p className="text-sm text-purple-300">Editando plantilla</p>
                        <h1 className="text-2xl font-bold">{template.title}</h1>
                        <p className="text-sm text-gray-400">{template.category}</p>
                    </div>
                    <div ref={canvasScrollRef} className="min-h-0 w-full flex-1 overflow-auto overscroll-contain flex justify-center items-start">
                        <div className="relative mx-auto w-fit shrink-0 rounded-2xl border border-white/10 bg-black p-4 shadow-2xl">
                            <canvas ref={canvasElRef} />
                        </div>
                    </div>
                </div>

                {/* Right panel */}
                <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h2 className="text-lg font-bold mb-5">Propiedades</h2>
                    {!selectedObject && <p className="text-sm text-gray-400">Selecciona un elemento del flyer para editarlo.</p>}
                    {isText && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">Texto</label>
                                <textarea value={selectedText.text} onChange={e => updateText(e.target.value)} className="min-h-24 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none resize-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">Fuente</label>
                                <select value={selectedText.fontFamily} onChange={e => updateFont(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none">
                                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">Tamaño: <span className="text-white font-semibold">{selectedText.fontSize}px</span></label>
                                <div className="flex items-center gap-2">
                                    <input type="range" min={8} max={300} value={selectedText.fontSize} onChange={e => updateFontSize(Number(e.target.value))} className="flex-1 accent-purple-500" />
                                    <input type="number" min={8} max={400} value={selectedText.fontSize} onChange={e => updateFontSize(Number(e.target.value))} className="w-16 rounded-xl border border-white/10 bg-black/40 px-2 py-1 text-sm text-white outline-none text-center" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">Color</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={selectedText.color} onChange={e => updateColor(e.target.value)} className="h-11 w-16 rounded-xl border border-white/10 bg-black/40 cursor-pointer" />
                                    <span className="text-sm text-gray-400 font-mono">{selectedText.color}</span>
                                </div>
                            </div>
                            <button onClick={handleSave} className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold hover:bg-purple-500">💾 Guardar cambios</button>
                        </div>
                    )}
                    {isImage && (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-400 mb-4">Mueve, escala y rota la imagen en el canvas.</p>
                            <button onClick={() => replaceInputRef.current?.click()} className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/15">🔄 Reemplazar imagen</button>
                            <button onClick={handleRemoveBg} disabled={removingBg} className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all ${removingBg ? "bg-white/5 text-gray-500 cursor-not-allowed" : "bg-emerald-900/40 border border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/60"}`}>
                                {removingBg ? "⏳ Quitando fondo..." : "✂️ Quitar fondo"}
                            </button>
                            <button onClick={deleteSelected} className="w-full rounded-xl bg-red-900/40 border border-red-800/50 px-4 py-3 text-sm text-red-400 hover:bg-red-900/60">🗑️ Eliminar imagen</button>
                        </div>
                    )}
                    {isObject && !isText && !isImage && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-400">Forma seleccionada.</p>
                            <button onClick={deleteSelected} className="w-full rounded-xl bg-red-900/40 border border-red-800/50 px-4 py-3 text-sm text-red-400 hover:bg-red-900/60">🗑️ Eliminar forma</button>
                        </div>
                    )}
                </aside>
            </section>
        </>
    );
}
