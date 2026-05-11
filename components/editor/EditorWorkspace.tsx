"use client";

import { useEffect, useRef, useState } from "react";
import {
    Canvas,
    Rect,
    Textbox,
    Circle,
    FabricObject,
    FabricImage,
} from "fabric";
import type { Template } from "@/data/templates";

type EditorWorkspaceProps = {
    template: Template;
};

type SelectedTextState = {
    text: string;
    color: string;
    fontFamily: string;
};

export default function EditorWorkspace({ template }: EditorWorkspaceProps) {
    const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
    const fabricCanvasRef = useRef<Canvas | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [selectedObject, setSelectedObject] = useState<FabricObject | null>(
        null
    );

    const [selectedText, setSelectedText] = useState<SelectedTextState>({
        text: "",
        color: "#ffffff",
        fontFamily: "Arial",
    });

    useEffect(() => {
        if (!canvasElementRef.current) return;

        const canvas = new Canvas(canvasElementRef.current, {
            width: template.width,
            height: template.height,
            backgroundColor: "#080812",
            preserveObjectStacking: true,
        });

        fabricCanvasRef.current = canvas;

        template.layers.forEach((layer) => {
            if (layer.type === "shape") {
                if (layer.shape === "rect") {
                    const rect = new Rect({
                        left: layer.x,
                        top: layer.y,
                        width: layer.width,
                        height: layer.height,
                        fill: layer.fill,
                        opacity: layer.opacity ?? 1,
                        rx: layer.radius ?? 0,
                        ry: layer.radius ?? 0,
                        selectable: layer.selectable ?? true,
                    });

                    canvas.add(rect);
                }

                if (layer.shape === "circle") {
                    const circle = new Circle({
                        left: layer.x,
                        top: layer.y,
                        radius: layer.width / 2,
                        fill: layer.fill,
                        opacity: layer.opacity ?? 1,
                        selectable: layer.selectable ?? true,
                    });

                    canvas.add(circle);
                }
            }

            if (layer.type === "text") {
                const text = new Textbox(layer.text, {
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    fontSize: layer.fontSize,
                    fontFamily: layer.fontFamily,
                    fill: layer.color,
                    fontWeight: layer.fontWeight ?? "normal",
                    textAlign: layer.textAlign ?? "left",
                });

                canvas.add(text);
            }
        });

        const handleSelection = () => {
            const activeObject = canvas.getActiveObject();

            if (!activeObject) {
                setSelectedObject(null);
                setSelectedText({
                    text: "",
                    color: "#ffffff",
                    fontFamily: "Arial",
                });
                return;
            }

            setSelectedObject(activeObject);

            if (activeObject.type === "textbox") {
                const textbox = activeObject as Textbox;

                setSelectedText({
                    text: textbox.text ?? "",
                    color: String(textbox.fill ?? "#ffffff"),
                    fontFamily: textbox.fontFamily ?? "Arial",
                });
            }
        };

        canvas.on("selection:created", handleSelection);
        canvas.on("selection:updated", handleSelection);
        canvas.on("selection:cleared", handleSelection);

        canvas.renderAll();

        return () => {
            canvas.dispose();
        };
    }, [template]);

    const updateSelectedText = (value: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject || selectedObject.type !== "textbox") return;

        const textbox = selectedObject as Textbox;
        textbox.set("text", value);

        setSelectedText((current) => ({
            ...current,
            text: value,
        }));

        canvas.renderAll();
    };

    const updateSelectedColor = (value: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject || selectedObject.type !== "textbox") return;

        const textbox = selectedObject as Textbox;
        textbox.set("fill", value);

        setSelectedText((current) => ({
            ...current,
            color: value,
        }));

        canvas.renderAll();
    };

    const updateSelectedFont = (value: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !selectedObject || selectedObject.type !== "textbox") return;

        const textbox = selectedObject as Textbox;
        textbox.set("fontFamily", value);

        setSelectedText((current) => ({
            ...current,
            fontFamily: value,
        }));

        canvas.renderAll();
    };

    const addText = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const text = new Textbox("Nuevo texto", {
            left: 80,
            top: 80,
            width: 270,
            fontSize: 32,
            fontFamily: "Arial",
            fill: "#ffffff",
            fontWeight: "bold",
            textAlign: "center",
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();

        setSelectedObject(text);
        setSelectedText({
            text: "Nuevo texto",
            color: "#ffffff",
            fontFamily: "Arial",
        });
    };

    const openImagePicker = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        const canvas = fabricCanvasRef.current;

        if (!file || !canvas) return;

        const imageUrl = URL.createObjectURL(file);
        const image = await FabricImage.fromURL(imageUrl);

        image.set({
            left: 80,
            top: 90,
            scaleX: 0.35,
            scaleY: 0.35,
            cornerStyle: "circle",
            transparentCorners: false,
        });

        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.renderAll();

        event.target.value = "";
    };

    const saveDesign = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const json = canvas.toJSON();

        console.log("Diseño guardado:", json);

        alert("Diseño preparado para guardar. Revisa la consola.");
    };
    const exportPng = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const dataUrl = canvas.toDataURL({
            format: "png",
            quality: 1,
            multiplier: 3,
        });

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "artegenia-flyer.png";
        link.click();
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />

            <section className="grid min-h-[calc(100vh-73px)] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[280px_1fr_320px]">
                <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h2 className="text-lg font-bold">Herramientas</h2>

                    <div className="mt-5 space-y-3">
                        <button
                            onClick={addText}
                            className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15"
                        >
                            Texto
                        </button>

                        <button
                            onClick={openImagePicker}
                            className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15"
                        >
                            Subir artista
                        </button>

                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">
                            Quitar fondo
                        </button>

                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">
                            Cambiar fondo
                        </button>

                        <button className="w-full rounded-xl bg-white/10 px-4 py-3 text-left text-sm hover:bg-white/15">
                            Añadir logo
                        </button>
                    </div>
                </aside>

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

                            <button
                                onClick={exportPng}
                                className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-black hover:bg-yellow-300"
                            >
                                Exportar PNG
                            </button>
                        </div>
                    </div>
                </div>

                <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <h2 className="text-lg font-bold">Propiedades</h2>

                    {!selectedObject && (
                        <p className="mt-5 text-sm text-gray-400">
                            Selecciona un texto del flyer para editarlo.
                        </p>
                    )}

                    {selectedObject?.type === "textbox" && (
                        <div className="mt-5 space-y-4">
                            <div>
                                <label className="mb-1 block text-xs text-gray-400">
                                    Texto
                                </label>
                                <textarea
                                    value={selectedText.text}
                                    onChange={(event) => updateSelectedText(event.target.value)}
                                    className="min-h-24 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs text-gray-400">
                                    Fuente
                                </label>
                                <select
                                    value={selectedText.fontFamily}
                                    onChange={(event) => updateSelectedFont(event.target.value)}
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                                >
                                    <option>Arial</option>
                                    <option>Bebas Neue</option>
                                    <option>Anton</option>
                                    <option>Montserrat</option>
                                    <option>Playfair Display</option>
                                    <option>Great Vibes</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs text-gray-400">
                                    Color
                                </label>
                                <input
                                    type="color"
                                    value={selectedText.color}
                                    onChange={(event) => updateSelectedColor(event.target.value)}
                                    className="h-11 w-full rounded-xl border border-white/10 bg-black/40"
                                />
                            </div>
                            <button
                                onClick={saveDesign}
                                className="w-full rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold hover:bg-purple-500"
                            >
                                Guardar cambios
                            </button>
                        </div>
                    )}

                    {selectedObject && selectedObject.type !== "textbox" && (
                        <p className="mt-5 text-sm text-gray-400">
                            Has seleccionado una imagen o forma. Más adelante añadiremos
                            opciones para cambiar tamaño, posición y quitar fondo.
                        </p>
                    )}
                </aside>
            </section>
        </>
    );
}