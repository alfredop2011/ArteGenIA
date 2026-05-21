"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { Canvas as FabricCanvas } from "fabric";

/**
 * Hook para Undo/Redo en un canvas Fabric.js
 *
 * Estrategia:
 *  - Guarda snapshots con canvas.toJSON() EXCLUYENDO las imágenes en base64
 *    (las propiedades src/imageSrc se mantienen, solo no se serializa el dataURL inline).
 *  - Snapshot tras CADA cambio significativo (object:modified, added, removed, text:changed).
 *  - Tamaño máximo: 30 snapshots (FIFO).
 *  - Atajos de teclado Cmd/Ctrl+Z (undo) y Cmd/Ctrl+Shift+Z (redo) activos a nivel window.
 *  - Bandera interna `isRestoring` para que las restauraciones via loadFromJSON no creen
 *    nuevos snapshots en bucle.
 */

const MAX_HISTORY = 30;

// Props extra que queremos preservar en cada Fabric object al serializar
const SERIALIZED_PROPS = ["customId", "selectable", "evented"];

type Snapshot = string; // JSON serializado

export function useUndoRedo(canvasRef: React.RefObject<FabricCanvas | null>) {
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const isRestoring = useRef(false);
  const initialized = useRef(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 1); // > 1 porque el 1º es el estado inicial
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const serialize = useCallback((): Snapshot | null => {
    const c = canvasRef.current;
    if (!c) return null;
    try {
      // En Fabric 7, toJSON() no acepta args; usamos toObject(propertiesToInclude)
      // y le añadimos el discriminador "version" para que loadFromJSON lo acepte.
      const obj = c.toObject(SERIALIZED_PROPS);
      return JSON.stringify(obj);
    } catch (err) {
      console.error("[undo-redo] serialize failed:", err);
      return null;
    }
  }, [canvasRef]);

  const restoreFrom = useCallback(async (snap: Snapshot) => {
    const c = canvasRef.current;
    if (!c) return;
    isRestoring.current = true;
    try {
      const json = JSON.parse(snap);
      await c.loadFromJSON(json);
      c.renderAll();
    } catch (err) {
      console.error("[undo-redo] restore failed:", err);
    } finally {
      // Pequeño delay para que los eventos sincronos de loadFromJSON no nos cuenten
      setTimeout(() => { isRestoring.current = false; }, 50);
    }
  }, [canvasRef]);

  /** Llamar cuando el canvas ya tiene su estado inicial cargado */
  const captureInitial = useCallback(() => {
    if (initialized.current) return;
    const snap = serialize();
    if (snap) {
      undoStack.current = [snap];
      redoStack.current = [];
      initialized.current = true;
      updateFlags();
    }
  }, [serialize, updateFlags]);

  /** Llamar tras cada cambio significativo */
  const pushSnapshot = useCallback(() => {
    if (isRestoring.current) return;
    if (!initialized.current) return;
    const snap = serialize();
    if (!snap) return;
    const last = undoStack.current[undoStack.current.length - 1];
    if (last === snap) return; // no-op si nada cambió
    undoStack.current.push(snap);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    redoStack.current = []; // nuevo cambio invalida el redo
    updateFlags();
  }, [serialize, updateFlags]);

  /**
   * Variante con debounce para eventos que disparan muy rápido (text:changed).
   * Agrupa todos los cambios en una ventana de 500ms en un solo snapshot.
   */
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pushSnapshotDebounced = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      pushSnapshot();
      debounceTimer.current = null;
    }, 500);
  }, [pushSnapshot]);

  const undo = useCallback(async () => {
    if (undoStack.current.length <= 1) return;
    const current = undoStack.current.pop();
    if (current) redoStack.current.push(current);
    const prev = undoStack.current[undoStack.current.length - 1];
    if (prev) await restoreFrom(prev);
    updateFlags();
  }, [restoreFrom, updateFlags]);

  const redo = useCallback(async () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(next);
    await restoreFrom(next);
    updateFlags();
  }, [restoreFrom, updateFlags]);

  const reset = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    initialized.current = false;
    updateFlags();
  }, [updateFlags]);

  // ─── Atajos de teclado Cmd/Ctrl+Z y Cmd/Ctrl+Shift+Z ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      // Si el foco está en un input/textarea/contenteditable, dejar paso al deshacer nativo
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === "y" || e.key === "Y") {
        // Windows-style Ctrl+Y para redo
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  return {
    captureInitial,
    pushSnapshot,
    pushSnapshotDebounced,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}
