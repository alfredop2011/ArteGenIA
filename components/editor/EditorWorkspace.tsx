"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
    Canvas,
    Rect,
    Textbox,
    Circle,
    FabricObject,
    FabricImage,
} from "fabric";
import type { Template } from "@/data/templates";
import { useEditorStorage } from "@/hooks/useEditorStorage";

type EditorWorkspaceProps = { template: Template };
type SelectedTextState = { text: string; color: string; fontFamily: string; fontSize: number };

const FONTS = ["Arial","Bebas Neue","Anton","Montserrat","Playfair Display","Great Vibes","Oswald","Georgia"];

export default function EditorWorkspace({ template }: EditorWorkspaceProps) {
    const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const replaceInputRef = useRef<HTMLInputElement | null>(null);
    const initializedRef = useRef(false);

    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [saveFlash, setSaveFlash] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedText, setSelectedText] = useState<SelectedTextState>({
        text: "", color: "#ffffff", fontFamily: "Arial", fontSize: 32,
    });

    const { saveDesign, loadDesign, hasSavedDesign } = useEditorStorage();

    useEffect(() => {
        if (!canvasElementRef.current) return;
        if (initializedRef.current) return;
        initializedRef.current = true;
        setIsMounted(true);

        const canvas = new Canvas(canvasElementRef.current, {
            width: template.width,
            height: template.height,
            backgroundColor: "#080812",
            preserveObjectStacking: true,
        });
        fabricCanvasRef.current = canvas;

        const saved = loadDesign(template.id);
        if (saved) {
            canvas.loadFromJSON(saved.fabricJson).then(() => {
                canvas.renderAll();
                setSavedAt(saved.savedAt);
            });
        } else {
            template.layers.forEach((layer) => {
                if (layer.type === "shape") {
                    if (layer.shape === "rect") {
                        canvas.add(new Rect({
                            left: layer.x, top: layer.y,
                            width: layer.width, height: layer.height,
                            fill: layer.fill, opacity: layer.opacity ?? 1,
                            rx: layer.radius ?? 0, ry: layer.radius ?? 0,
                            selectable: layer.selectable ?? true,
                        }));
                    }
                    if (layer.shape === "circle") {
                        canvas.add(new Circle({
                            left: layer.x, top: layer.y,
                            radius: layer.width / 2,
                            fill: layer.fill, opacity: layer.opacity ?? 1,
                            selectable: layer.selectable ?? true,
                        }));
                    }
                }
                if (layer.type === "text") {
                    canvas.add(new Textbox(layer.text, {
                        left: layer.x, top: layer.y, width: layer.width,
                        fontSize: layer.fontSize, fontFamily: layer.fontFamily,
                        fill: layer.color, fontWeight: layer.fontWeight ?? "normal",
                        textAlign: layer.textAlign ?? "left",
                    }));
                }
            });
            canvas.renderAll();
        }

        const handleSelection = () => {
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
                    fontSize: typeof tb.fontSize === "number" ? tb.fontSize : 32,
                });
            }
        };

        canvas.on("selection:created", handleSelection);
        canvas.on("selection:updated", handleSelection);
        canvas.on("selection:cleared", handleSelection);

        const handleKeyDown = (e: KeyboardEvent) => {
            const tag = (e.target as HTMLElement).tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
            if (e.key === "Delete" || e.key === "Backspace") {
                const active = canvas.getActiveObject();
                if (active) {
                    canvas.remove(active);
                    canvas.discardActiveObject();
                    canvas.renderAll();
                    setSelectedObject(null);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSave = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const ok = saveDesign(template.id, template.title, canvas.toJSON());
        if (ok) {
            setSavedAt(new Date().toISOString());
            setSaveFlash(true);
            setTimeout(() => setSaveFlash(false), 1500);
        }
    }, [saveDesign, template]);

    const updateSelectedText = useCallback((value: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject || selectedObject.type !== "textbox") return;
        (selectedObject as Textbox).set("text", value);
        setSelectedText((c) => ({ ...c, text: value }));
        canvas.renderAll();
    }, [selectedObject]);

    const updateSelectedColor = useCallback((value: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject || selectedObject.type !== "textbox") return;
        (selectedObject as Textbox).set("fill", value);
        setSelectedText((c) => ({ ...c, color: value }));
        canvas.renderAll();
    }, [selectedObject]);

    const updateSelectedFont = useCallback((value: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject || selectedObject.type !== "textbox") return;
        (selectedObject as Textbox).set("fontFamily", value);
        setSelectedText((c) => ({ ...c, fontFamily: value }));
        canvas.renderAll();
    }, [selectedObject]);

    const updateFontSize = useCallback((value: number) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject || selectedObject.type !== "textbox") return;
        const size = Math.max(8, Math.min(200, value));
        (selectedObject as Textbox).set("fontSize", size);
        setSelectedText((c) => ({ ...c, fontSize: size }));
        canvas.renderAll();
    }, [selectedObject]);

    const deleteSelected = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject) return;
        canvas.remove(selectedObject);
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelectedObject(null);
    }, [selectedObject]);

    const bringForward = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject) return;
        canvas.bringObjectForward(selectedObject);
        canvas.renderAll();
    }, [selectedObject]);

    const sendBackward = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject) return;
        canvas.sendObjectBackwards(selectedObject);
        canvas.renderAll();
    }, [selectedObject]);

    const addText = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const text = new Textbox("Nuevo texto", {
            left: 80, top: 80, width: 270,
            fontSize: 32, fontFamily: "Arial",
            fill: "#ffffff", fontWeight: "bold", textAlign: "center",
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
        setSelectedObject(text);
        setSelectedText({ text: "Nuevo texto", color: "#ffffff", fontFamily: "Arial", fontSize: 32 });
    }, []);

    const openImagePicker = useCallback(() => fileInputRef.current?.click(), []);
    const openReplacePicker = useCallback(() => replaceInputRef.current?.click(), []);

    const addImageToCanvas = useCallback(async (file: File) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const imageUrl = URL.createObjectURL(file);
        const image = await FabricImage.fromURL(imageUrl);
        const maxW = canvas.width! * 0.6;
        const maxH = canvas.height! * 0.6;
        const scale = Math.min(maxW / (image.width ?? maxW), maxH / (image.height ?? maxH), 1);
        image.set({
            left: (canvas.width! - (image.width ?? 0) * scale) / 2,
            top: (canvas.height! - (image.height ?? 0) * scale) / 2,
            scaleX: scale, scaleY: scale,
            cornerStyle: "circle", transparentCorners: false,
        });
        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.renderAll();
        setSelectedObject(image);
    }, []);

    const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await addImageToCanvas(file);
        event.target.value = "";
    }, [addImageToCanvas]);

    const handleReplaceImage = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const canvas = fabricCanvasRef.current;
        if (!file || !canvas || !selectedObject) return;

        // Guardar posición y tamaño del objeto actual
        const oldLeft = selectedObject.left ?? 0;
        const oldTop = selectedObject.top ?? 0;
        const oldScaleX = selectedObject.scaleX ?? 1;
        const oldScaleY = selectedObject.scaleY ?? 1;
        const oldAngle = selectedObject.angle ?? 0;

        // Eliminar imagen anterior
        canvas.remove(selectedObject);

        // Cargar nueva imagen en la misma posición
        const imageUrl = URL.createObjectURL(file);
        const image = await FabricImage.fromURL(imageUrl);
        image.set({
            left: oldLeft,
            top: oldTop,
            scaleX: oldScaleX,
            scaleY: oldScaleY,
            angle: oldAngle,
            cornerStyle: "circle",
            transparentCorners: false,
        });
        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.renderAll();
        setSelectedObject(image);
        event.target.value = "";
    }, [selectedObject]);

    const exportPng = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL({ format: "png", quality: 1, multiplier: 3 });
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${template.title.replace(/\s+/g, "_")}.png`;
        link.click();
    }, [template.title]);

    const isText = selectedObject?.type === "textbox";
    const isImage = selectedObject?.type === "image";
    const isObject = !!selectedObject;

    return (
        <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <input ref={replaceInputRef} type="file" accept="image/*" onChange={handleReplaceImage} className="hidden" />

            {/* Barra superior */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-white/10 gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{template.title}</span>
                    {savedAt && (
                        <span className="text-xs text-gray-500">
                            Guardado {new Date(savedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                    {isMounted && hasSavedDesign(template.id) && !savedAt && (
                        <span className="text-xs text-yellow-500">Diseño guardado disponible</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleSave}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${saveFlash ? "bg-green-600 text-white" : "bg-purple-600 hover:bg-purple-500 text-white"}`}>
                        {saveFlash ? "✓ Guardado" : "💾 Guardar"}
                    </button>
                    <button onClick={exportPng}
                        className="px-4 py-2 rounded-xl bg-yellow-400 text-black text-sm font-black hover:bg-yellow-300">
                        ↓ PNG
                    </button>
                </div>
            </div>

            <section className="grid min-h-[calc(100vh-120px)] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[280px_1fr_320px]">

                {/* Panel izquierdo */}
                <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h2 className="text-lg font-bold mb-5">Herramientas</h2>
                    <div className="space-y-3">
                        <button onClick={addText} className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">✏️ Añadir texto</button>
                        <button onClick={openImagePicker} className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">🖼️ Subir artista</button>
                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm opacity-50 cursor-not-allowed">✂️ Quitar fondo (próximo)</button>
                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm opacity-50 cursor-not-allowed">🎨 Cambiar fondo (próximo)</button>
                    </div>

                    {isObject && (
                        <div className="mt-6 pt-5 border-t border-white/10">
                            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">Capa seleccionada</h3>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <button onClick={bringForward} className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15">↑ Adelante</button>
                                    <button onClick={sendBackward} className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15">↓ Atrás</button>
                                </div>
                                <button onClick={deleteSelected} className="w-full rounded-xl bg-red-900/40 border border-red-800/50 px-4 py-2 text-sm text-red-400 hover:bg-red-900/60">
                                    🗑️ Eliminar capa
                                </button>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Canvas */}
                <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#0b0c14] p-6">
                    <div className="w-full max-w-[520px]">
                        <div className="mb-4">
                            <p className="text-sm text-purple-300">Editando plantilla</p>
                            <h1 className="text-2xl font-bold">{template.title}</h1>
                            <p className="text-sm text-gray-400">{template.category}</p>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className="rounded-2xl border border-white/10 bg-black p-4 shadow-2xl">
                                <canvas ref={canvasElementRef} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel derecho */}
                <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h2 className="text-lg font-bold mb-5">Propiedades</h2>

                    {!selectedObject && (
                        <p className="text-sm text-gray-400">Selecciona un elemento del flyer para editarlo.</p>
                    )}

                    {/* Propiedades de texto */}
                    {isText && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">Texto</label>
                                <textarea value={selectedText.text} onChange={(e) => updateSelectedText(e.target.value)}
                                    className="min-h-24 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none resize-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">Fuente</label>
                                <select value={selectedText.fontFamily} onChange={(e) => updateSelectedFont(e.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none">
                                    {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">
                                    Tamaño: <span className="text-white font-semibold">{selectedText.fontSize}px</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input type="range" min={8} max={120} value={selectedText.fontSize}
                                        onChange={(e) => updateFontSize(Number(e.target.value))}
                                        className="flex-1 accent-purple-500" />
                                    <input type="number" min={8} max={200} value={selectedText.fontSize}
                                        onChange={(e) => updateFontSize(Number(e.target.value))}
                                        className="w-16 rounded-xl border border-white/10 bg-black/40 px-2 py-1 text-sm text-white outline-none text-center" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">Color</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={selectedText.color} onChange={(e) => updateSelectedColor(e.target.value)}
                                        className="h-11 w-16 rounded-xl border border-white/10 bg-black/40 cursor-pointer" />
                                    <span className="text-sm text-gray-400 font-mono">{selectedText.color}</span>
                                </div>
                            </div>
                            <button onClick={handleSave} className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold hover:bg-purple-500">
                                💾 Guardar cambios
                            </button>
                        </div>
                    )}

                    {/* Propiedades de imagen */}
                    {isImage && (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-400 mb-4">Imagen seleccionada. Puedes moverla, escalarla y rotarla directamente en el canvas.</p>

                            <button onClick={openReplacePicker}
                                className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white hover:bg-white/15 transition-colors">
                                🔄 Reemplazar imagen
                            </button>

                            <button onClick={deleteSelected}
                                className="w-full rounded-xl bg-red-900/40 border border-red-800/50 px-4 py-3 text-sm text-red-400 hover:bg-red-900/60 transition-colors">
                                🗑️ Eliminar imagen
                            </button>

                            <div className="pt-3 border-t border-white/10">
                                <button
                                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                                    disabled>
                                    ✂️ Quitar fondo (próximo)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Forma seleccionada */}
                    {isObject && !isText && !isImage && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-400">Forma seleccionada.</p>
                            <button onClick={deleteSelected}
                                className="w-full rounded-xl bg-red-900/40 border border-red-800/50 px-4 py-3 text-sm text-red-400 hover:bg-red-900/60">
                                🗑️ Eliminar forma
                            </button>
                        </div>
                    )}
                </aside>
            </section>
        </>
    );
}
