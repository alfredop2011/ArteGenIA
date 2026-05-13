"use client";

import { useEffect, useState, useCallback } from "react";
import type { Canvas, FabricObject } from "fabric";
import {
  Eye, EyeOff, Lock, Unlock, ChevronUp, ChevronDown, Trash2,
  Image as ImageIcon, Type, Square, Layers as LayersIcon
} from "lucide-react";

type Props = {
  canvas: Canvas | null;
  /** ID o nombre del objeto actualmente seleccionado en el canvas */
  selectedKey: string | null;
  /** Trigger externo para re-listar capas (incrementa un contador) */
  refreshTick: number;
  onSelect?: (obj: FabricObject) => void;
};

type LayerRow = {
  obj: FabricObject;
  key: string;        // id || name || idx
  displayName: string;
  kind: "image" | "text" | "shape" | "other";
  visible: boolean;
  locked: boolean;
};

// Ojo: Fabric tipa los custom props como any en runtime. Aquí extraemos
// con casts mínimos para mantener TS razonable.
function readMeta(o: FabricObject): { id?: string; name?: string } {
  const a = o as unknown as { id?: string; name?: string };
  return { id: a.id, name: a.name };
}

function kindOf(o: FabricObject): LayerRow["kind"] {
  const t = (o as unknown as { type?: string }).type ?? "";
  if (t === "image") return "image";
  if (t === "textbox" || t === "text" || t === "i-text") return "text";
  if (t === "rect" || t === "circle" || t === "ellipse" || t === "polygon" || t === "path") return "shape";
  return "other";
}

function iconFor(kind: LayerRow["kind"]) {
  const cls = "w-3.5 h-3.5";
  if (kind === "image") return <ImageIcon className={cls} />;
  if (kind === "text") return <Type className={cls} />;
  if (kind === "shape") return <Square className={cls} />;
  return <LayersIcon className={cls} />;
}

export default function LayersPanel({ canvas, selectedKey, refreshTick, onSelect }: Props) {
  const [rows, setRows] = useState<LayerRow[]>([]);

  const refresh = useCallback(() => {
    if (!canvas) { setRows([]); return; }
    const objects = canvas.getObjects();
    // Mostrar de arriba a abajo (z-index más alto primero)
    const list: LayerRow[] = objects
      .slice()
      .reverse()
      .map((obj, i) => {
        const { id, name } = readMeta(obj);
        const key = id ?? name ?? `obj-${i}`;
        const displayName = name ?? id ?? `Capa ${objects.length - i}`;
        return {
          obj,
          key,
          displayName,
          kind: kindOf(obj),
          visible: obj.visible !== false,
          locked: !!(obj.lockMovementX && obj.lockMovementY),
        };
      });
    setRows(list);
  }, [canvas]);

  useEffect(() => { refresh(); }, [refresh, refreshTick]);

  const handleSelect = (row: LayerRow) => {
    if (!canvas) return;
    canvas.setActiveObject(row.obj);
    canvas.requestRenderAll();
    onSelect?.(row.obj);
  };

  const toggleVisible = (row: LayerRow, e: React.MouseEvent) => {
    e.stopPropagation();
    row.obj.visible = !row.visible;
    canvas?.requestRenderAll();
    refresh();
  };

  const toggleLock = (row: LayerRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !row.locked;
    row.obj.lockMovementX = next;
    row.obj.lockMovementY = next;
    row.obj.lockScalingX = next;
    row.obj.lockScalingY = next;
    row.obj.lockRotation = next;
    row.obj.selectable = !next;
    row.obj.evented = !next;
    if (canvas?.getActiveObject() === row.obj && next) {
      canvas.discardActiveObject();
    }
    canvas?.requestRenderAll();
    refresh();
  };

  const moveUp = (row: LayerRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;
    // Fabric v6: el método correcto es canvas.bringObjectForward(obj)
    // Lo invocamos con .call(canvas, ...) para preservar el `this`.
    const cc = canvas as unknown as {
      bringObjectForward?: (o: FabricObject) => void;
      bringForward?: (o: FabricObject) => void;
    };
    const fn = cc.bringObjectForward ?? cc.bringForward;
    if (fn) fn.call(canvas, row.obj);
    canvas.requestRenderAll();
    refresh();
  };

  const moveDown = (row: LayerRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;
    const cc = canvas as unknown as {
      sendObjectBackwards?: (o: FabricObject) => void;
      sendBackwards?: (o: FabricObject) => void;
    };
    const fn = cc.sendObjectBackwards ?? cc.sendBackwards;
    if (fn) fn.call(canvas, row.obj);
    canvas.requestRenderAll();
    refresh();
  };

  const remove = (row: LayerRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canvas) return;
    canvas.remove(row.obj);
    canvas.requestRenderAll();
    refresh();
  };

  if (!canvas) {
    return (
      <div className="text-xs text-gray-500 p-3">Esperando editor…</div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-xs text-gray-500 p-3">Sin capas todavía.</div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] uppercase tracking-wider text-gray-500">
        <LayersIcon className="w-3 h-3" />
        Capas
      </div>

      {rows.map(row => {
        const selected = row.key === selectedKey;
        return (
          <div
            key={row.key}
            role="button"
            tabIndex={0}
            onClick={() => handleSelect(row)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(row); } }}
            className={[
              "group flex items-center gap-2 px-2 py-1.5 rounded-md text-left cursor-pointer select-none",
              "border border-transparent transition-colors",
              selected
                ? "bg-purple-500/15 border-purple-500/40"
                : "hover:bg-white/5",
              !row.visible && "opacity-50",
            ].filter(Boolean).join(" ")}
          >
            <span className={selected ? "text-purple-300" : "text-gray-400"}>
              {iconFor(row.kind)}
            </span>

            <span className={[
              "flex-1 text-xs truncate",
              selected ? "text-white font-medium" : "text-gray-300",
            ].join(" ")}>
              {row.displayName}
            </span>

            <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => moveUp(row, e)}
                className="p-1 rounded hover:bg-white/10"
                title="Subir"
              >
                <ChevronUp className="w-3 h-3 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={(e) => moveDown(row, e)}
                className="p-1 rounded hover:bg-white/10"
                title="Bajar"
              >
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={(e) => toggleLock(row, e)}
                className="p-1 rounded hover:bg-white/10"
                title={row.locked ? "Desbloquear" : "Bloquear"}
              >
                {row.locked
                  ? <Lock className="w-3 h-3 text-amber-400" />
                  : <Unlock className="w-3 h-3 text-gray-400" />
                }
              </button>
              <button
                type="button"
                onClick={(e) => remove(row, e)}
                className="p-1 rounded hover:bg-red-500/20"
                title="Borrar"
              >
                <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400" />
              </button>
            </span>

            <button
              type="button"
              onClick={(e) => toggleVisible(row, e)}
              className="p-1 rounded hover:bg-white/10"
              title={row.visible ? "Ocultar" : "Mostrar"}
            >
              {row.visible
                ? <Eye className="w-3.5 h-3.5 text-gray-400" />
                : <EyeOff className="w-3.5 h-3.5 text-gray-500" />
              }
            </button>
          </div>
        );
      })}
    </div>
  );
}
