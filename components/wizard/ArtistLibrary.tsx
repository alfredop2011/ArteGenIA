"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { compressImageWithMeta } from "@/lib/imageCompression";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ArtistRole = "main" | "secondary" | "guest" | "dj" | "group" | "logo";
export type ArtistType = "artist" | "logo";

export type ArtistEntry = {
  id: string;
  type: ArtistType;
  name: string;
  role: ArtistRole;
  imageSrc: string;
  uploadedByUser: boolean;
  removeBackground: boolean;
  order: number;
  /** Si proviene de un colaborador registrado en BD, su id. Si es subida puntual, null. */
  collaboratorId?: string | null;
};

type Category = "all" | "artist" | "dj" | "group" | "logo";

type LibraryItem = {
  id: string;
  type: ArtistType;
  category: Category;
  name: string;
  imageSrc: string;
  /** true si es un colaborador registrado en BD (mostramos badge CRM) */
  isCollaborator?: boolean;
  /** id de la fila en BD (para vincular ArtistEntry y referenciarlo luego) */
  collaboratorId?: string;
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

const ROLE_LABELS: Record<ArtistRole, string> = {
  main:      "Principal",
  secondary: "Principal 2",
  guest:     "Invitado",
  dj:        "DJ",
  group:     "Grupo",
  logo:      "Logo",
};

const ROLE_COLORS: Record<ArtistRole, string> = {
  main:      "bg-purple-500/20 text-purple-300 border-purple-500/40",
  secondary: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  guest:     "bg-amber-500/20 text-amber-300 border-amber-500/40",
  dj:        "bg-blue-500/20 text-blue-300 border-blue-500/40",
  group:     "bg-green-500/20 text-green-300 border-green-500/40",
  logo:      "bg-gray-500/20 text-gray-300 border-gray-500/40",
};

function defaultRole(type: ArtistType): ArtistRole {
  return type === "logo" ? "logo" : "secondary";
}

// ─── COMPACT CHAT CARD ────────────────────────────────────────────────────────

export function ArtistLibraryCard({
  selected,
  onOpen,
}: {
  selected: ArtistEntry[];
  onOpen: () => void;
}) {
  const MAX_SHOWN = 4;
  const shown = selected.slice(0, MAX_SHOWN);
  const extra = selected.length - MAX_SHOWN;

  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-purple-500/30 transition-all group w-full text-left"
    >
      <div className="flex items-center shrink-0">
        {selected.length === 0 ? (
          <div className="w-8 h-8 rounded-full bg-white/8 border border-dashed border-white/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
            </svg>
          </div>
        ) : (
          <div className="flex -space-x-2">
            {shown.map(a => (
              <div key={a.id} className="w-8 h-8 rounded-full border-2 border-[#111118] overflow-hidden bg-white/10 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.imageSrc} alt={a.name} className="w-full h-full object-cover"/>
              </div>
            ))}
            {extra > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-[#111118] bg-purple-600/80 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                +{extra}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white">Artistas y logos</p>
        {selected.length > 0 ? (
          <p className="text-[10px] text-gray-500 truncate">{selected.map(a => a.name).join(", ")}</p>
        ) : (
          <p className="text-[10px] text-gray-600">Añadir artistas, DJs, logos…</p>
        )}
      </div>

      <svg className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  );
}

// ─── ARTIST LIBRARY MODAL ────────────────────────────────────────────────────

export function ArtistLibraryModal({
  initialSelected,
  onConfirm,
  onClose,
}: {
  initialSelected: ArtistEntry[];
  onConfirm: (entries: ArtistEntry[]) => void;
  onClose: () => void;
}) {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [selected, setSelected] = useState<ArtistEntry[]>(initialSelected);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingCollabs, setLoadingCollabs] = useState(true);
  const [saveCollabTarget, setSaveCollabTarget] = useState<ArtistEntry | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const artistFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef   = useRef<HTMLInputElement>(null);

  // ── Cargar colaboradores registrados al montar ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/collaborators");
        if (!res.ok) return; // si no esta autenticado, dejamos library vacia
        const data = await res.json();
        if (cancelled) return;
        const items: LibraryItem[] = (data.collaborators ?? []).map((c: {
          id: string;
          kind: "person" | "brand";
          artist_name: string;
          role: string | null;
          photo_url: string | null;
        }) => ({
          id: `collab-${c.id}`,
          type: c.kind === "brand" ? "logo" : "artist" as ArtistType,
          category: c.kind === "brand" ? "logo" : "artist" as Category,
          name: c.artist_name,
          imageSrc: c.photo_url ?? "",
          isCollaborator: true,
          collaboratorId: c.id,
        }));
        setLibrary(items);
      } catch {
        // silencioso: si falla, library queda vacia
      } finally {
        if (!cancelled) setLoadingCollabs(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = library.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || item.category === category;
    return matchSearch && matchCat;
  });

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(async (file: File, type: ArtistType) => {
    // Validacion temprana (defensa con el limite reducido)
    if (file.size > 5 * 1024 * 1024) {
      console.warn("[ArtistLibrary] Archivo > 5MB, ignorado");
      return;
    }
    setUploading(true);
    try {
      // Comprimir en cliente antes de convertir a dataURL.
      // El helper ahora detecta si la imagen RESULTANTE tiene transparencia
      // (PNG con canal alpha). Si la tiene, marcamos el entry para SALTAR
      // remove-bg downstream (no estropear una imagen que ya viene sin fondo).
      const { file: compressed, hasTransparency: alreadyTransparent } = await compressImageWithMeta(file, {
        mode: type === "logo" ? "brand" : "person",
      });

      const src = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target?.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(compressed);
      });

      const raw = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const name = raw.charAt(0).toUpperCase() + raw.slice(1);

      const libItem: LibraryItem = {
        id: uid(), type,
        category: type === "logo" ? "logo" : "artist",
        name, imageSrc: src,
      };
      setLibrary(prev => [libItem, ...prev]);

      const entry: ArtistEntry = {
        id: libItem.id, type, name,
        role: selected.length === 0 && type === "artist" ? "main" : defaultRole(type),
        imageSrc: src, uploadedByUser: true,
        // Si la imagen YA es transparente (PNG sin fondo subido por el usuario)
        // NO pedimos remove-bg downstream. En logos siempre se respeta el fondo.
        removeBackground: type === "artist" && !alreadyTransparent,
        order: selected.length + 1,
      };
      setSelected(prev => [...prev, entry]);
    } finally {
      setUploading(false);
    }
  }, [selected.length]);

  // ── Toggle item ─────────────────────────────────────────────────────────────

  const toggleItem = useCallback((item: LibraryItem) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === item.id);
      if (exists) return prev.filter(s => s.id !== item.id);
      const entry: ArtistEntry = {
        id: item.id, type: item.type, name: item.name,
        role: prev.length === 0 && item.type === "artist" ? "main" : defaultRole(item.type),
        imageSrc: item.imageSrc, uploadedByUser: !item.isCollaborator,
        removeBackground: item.type === "artist",
        order: prev.length + 1,
        collaboratorId: item.collaboratorId ?? null,
      };
      return [...prev, entry];
    });
  }, []);

  const removeSelected = useCallback((id: string) => {
    setSelected(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
  }, []);

  const updateRole = useCallback((id: string, role: ArtistRole) => {
    setSelected(prev => prev.map(s => s.id === id ? { ...s, role } : s));
  }, []);

  // ── Drag reorder ────────────────────────────────────────────────────────────

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDrop      = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
    setSelected(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
    setDragIdx(null); setDragOverIdx(null);
  };

  // ── Escape ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const CATEGORIES: Array<{ id: Category; label: string }> = [
    { id: "all",    label: "Todos" },
    { id: "artist", label: "Artistas" },
    { id: "dj",     label: "DJs" },
    { id: "group",  label: "Grupos" },
    { id: "logo",   label: "Logos" },
  ];

  const ROLES: ArtistRole[] = ["main", "secondary", "guest", "dj", "group", "logo"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose}/>

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0f0f1a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white">Biblioteca de artistas</h2>
            <p className="text-sm text-gray-500 mt-1">Selecciona artistas y logos para personalizar tu flyer</p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-all mt-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-4 shrink-0">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar artista, DJ, grupo o logo..."
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition-all"/>
          </div>
        </div>

        {/* Category filters + view toggle */}
        <div className="px-6 pb-4 flex items-center gap-2 shrink-0">
          <div className="flex gap-2 flex-1 min-w-0 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  category === cat.id
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-transparent text-gray-400 border-white/10 hover:text-white hover:border-white/20"
                }`}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 p-0.5 bg-white/[0.04] border border-white/[0.08] rounded-full shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              title="Vista detallada"
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === "grid" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Vista compacta"
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === "list" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 border-t border-white/[0.06]">

          {/* Left: grid + upload */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Upload buttons */}
            <div className="px-4 pt-4 pb-3 flex gap-2 shrink-0">
              <input type="file" accept="image/*" multiple ref={artistFileRef} className="hidden"
                onChange={e => { Array.from(e.target.files ?? []).forEach(f => handleUpload(f, "artist")); e.target.value = ""; }}/>
              <input type="file" accept="image/*" multiple ref={logoFileRef} className="hidden"
                onChange={e => { Array.from(e.target.files ?? []).forEach(f => handleUpload(f, "logo")); e.target.value = ""; }}/>

              <button onClick={() => artistFileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/15 border border-purple-500/25 text-purple-300 text-xs font-medium hover:bg-purple-600/25 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Subir artista
              </button>
              <button onClick={() => logoFileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-medium hover:text-white hover:bg-white/10 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Subir logo
              </button>
              {uploading && <span className="text-[10px] text-gray-500 self-center ml-1">Procesando…</span>}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {loadingCollabs ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"/>
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-40 gap-3 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-purple-500/30 transition-all"
                  onClick={() => artistFileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")).forEach(f => handleUpload(f, "artist")); }}>
                  <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  <p className="text-xs text-gray-600 text-center">
                    {search
                      ? `Sin resultados para "${search}"`
                      : library.length === 0
                        ? "Sin colaboradores aún. Sube uno puntual o ve a /colaboradores para invitar"
                        : "Sin coincidencias en esta categoría"}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-3 gap-3">
                  {filtered.map(item => {
                    const isSelected = selected.some(s => s.id === item.id);
                    return (
                      <button key={item.id} onClick={() => toggleItem(item)}
                        className={`group relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all text-center ${
                          isSelected
                            ? "border-purple-500 shadow-lg shadow-purple-500/20"
                            : "border-transparent hover:border-white/20"
                        }`}>
                        {/* Image */}
                        <div className="relative aspect-square w-full overflow-hidden bg-white/5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageSrc} alt={item.name} className="w-full h-full object-cover"/>
                          {/* Badge CRM (colaborador registrado) */}
                          {item.isCollaborator && !isSelected && (
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-emerald-500/85 text-white text-[9px] font-bold tracking-wide shadow-sm">
                              CRM
                            </div>
                          )}
                          {/* Checkmark */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg>
                            </div>
                          )}
                          {/* Dark overlay on hover */}
                          {!isSelected && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"/>}
                        </div>
                        {/* Name */}
                        <div className="bg-[#111118] px-2 py-2">
                          <p className="text-xs text-white font-medium truncate">{item.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                // ── Vista lista compacta ────────────────────────────────────
                <div className="flex flex-col gap-1">
                  {filtered.map(item => {
                    const isSelected = selected.some(s => s.id === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item)}
                        className={`group flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left ${
                          isSelected
                            ? "bg-purple-500/10 border-purple-500/50"
                            : "bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/10"
                        }`}
                      >
                        {/* Checkbox indicator */}
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "bg-purple-500 border-purple-500"
                            : "border-white/30 group-hover:border-white/50"
                        }`}>
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7"/></svg>
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div className={`w-10 h-10 overflow-hidden bg-white/5 shrink-0 ${item.type === "logo" ? "rounded-md bg-white p-0.5" : "rounded-full"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.imageSrc} alt={item.name} className="w-full h-full object-cover"/>
                        </div>

                        {/* Name + badge */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <p className="text-xs text-white font-medium truncate">{item.name}</p>
                          {item.isCollaborator && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] font-bold tracking-wide">
                              CRM
                            </span>
                          )}
                        </div>

                        {/* Type chip */}
                        <span className="text-[9px] text-gray-500 uppercase tracking-wide shrink-0">
                          {item.type === "logo" ? "Logo" : "Artista"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: selected panel */}
          <div className="w-72 flex flex-col border-l border-white/[0.06] shrink-0">
            <div className="px-4 pt-4 pb-3 shrink-0">
              <p className="text-sm font-bold text-white">
                Seleccionados
                {selected.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 text-xs">{selected.length}</span>
                )}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {selected.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">Selecciona artistas<br/>o logos de la biblioteca</p>
                </div>
              ) : (
                <>
                  {selected.map((entry, idx) => (
                    <div key={entry.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={e => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      className={`rounded-2xl border transition-all ${
                        dragOverIdx === idx && dragIdx !== idx
                          ? "border-purple-500/60 bg-purple-500/10"
                          : "border-white/8 bg-white/[0.03]"
                      }`}>
                      <div className="flex items-center gap-2.5 p-2.5">
                        {/* Drag handle */}
                        <svg className="w-3 h-5 text-gray-700 cursor-grab shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/>
                          <circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                        </svg>
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={entry.imageSrc} alt={entry.name} className="w-full h-full object-cover"/>
                        </div>
                        {/* Name + role */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium truncate">{entry.name}</p>
                          <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full border font-medium mt-0.5 ${ROLE_COLORS[entry.role]}`}>
                            {ROLE_LABELS[entry.role]}
                          </span>
                        </div>
                        {/* Remove */}
                        <button onClick={() => removeSelected(entry.id)}
                          className="w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-600 flex items-center justify-center transition-all shrink-0">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>

                      {/* Role selector + remove bg toggle */}
                      <div className="px-2.5 pb-2.5 space-y-2">
                        <select value={entry.role}
                          onChange={e => updateRole(entry.id, e.target.value as ArtistRole)}
                          className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3 py-1.5 text-[11px] text-gray-400 outline-none focus:border-purple-500/40">
                          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                        <button
                          onClick={() => setSelected(prev => prev.map(s => s.id === entry.id ? { ...s, removeBackground: !s.removeBackground } : s))}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${entry.removeBackground ? "bg-purple-500/15 border-purple-500/30 text-purple-300" : "bg-white/[0.03] border-white/8 text-gray-500"}`}>
                          <span>{entry.removeBackground ? "✂️ Quitar fondo" : "🖼️ Mantener fondo"}</span>
                          <div className={`w-7 h-4 rounded-full relative transition-all ${entry.removeBackground ? "bg-purple-500" : "bg-white/10"}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${entry.removeBackground ? "left-3.5" : "left-0.5"}`}/>
                          </div>
                        </button>
                        {/* Guardar como colaborador (solo si es subida puntual de usuario) */}
                        {entry.uploadedByUser && !entry.collaboratorId && (
                          <button
                            onClick={() => setSaveCollabTarget(entry)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold hover:bg-emerald-500/20 transition-all">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z"/>
                            </svg>
                            Guardar como colaborador
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Drag hint */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <svg className="w-3.5 h-3.5 text-gray-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    <div>
                      <p className="text-[10px] text-gray-600 font-medium">Puedes arrastrar para reordenar</p>
                      <p className="text-[9px] text-gray-700">El orden define cómo aparecerán en tu flyer.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06] shrink-0">
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-2xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="flex items-center gap-2 px-8 py-2.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-purple-600 to-orange-400 text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Agregar seleccionados
          </button>
        </div>
      </div>

      {/* Sub-modal: guardar como colaborador */}
      {saveCollabTarget && (
        <SaveCollabModal
          entry={saveCollabTarget}
          onClose={() => setSaveCollabTarget(null)}
          onSaved={(newCollabId) => {
            // Marcar el entry como vinculado y refrescar la library
            setSelected(prev => prev.map(s =>
              s.id === saveCollabTarget.id
                ? { ...s, collaboratorId: newCollabId, uploadedByUser: false }
                : s
            ));
            // Añadir a library para que aparezca con badge CRM
            setLibrary(prev => [
              {
                id: `collab-${newCollabId}`,
                type: saveCollabTarget.type,
                category: saveCollabTarget.type === "logo" ? "logo" : "artist" as Category,
                name: saveCollabTarget.name,
                imageSrc: saveCollabTarget.imageSrc,
                isCollaborator: true,
                collaboratorId: newCollabId,
              },
              ...prev.filter(l => l.id !== saveCollabTarget.id), // quita el item viejo si estaba
            ]);
            setSaveCollabTarget(null);
          }}
        />
      )}
    </div>
  );
}

// ─── SAVE AS COLLABORATOR SUB-MODAL ──────────────────────────────────────────

function SaveCollabModal({
  entry,
  onClose,
  onSaved,
}: {
  entry: ArtistEntry;
  onClose: () => void;
  onSaved: (newCollabId: string) => void;
}) {
  const isBrand = entry.type === "logo";
  const [name, setName] = useState(entry.name);
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persona: en lugar de guardar, generamos link de invitación con consentimiento RGPD
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInvite = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/collaborator-invites", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar enlace");
      setInviteToken(data.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  }, []);

  // Marca: guardado directo via API
  const saveBrand = async () => {
    if (!name.trim()) return setError("Falta el nombre");
    setSaving(true);
    setError(null);
    try {
      // Convertir dataURL a Blob para FormData
      const response = await fetch(entry.imageSrc);
      const blob = await response.blob();
      const ext = blob.type.split("/")[1] || "png";

      const fd = new FormData();
      fd.append("kind", "brand");
      fd.append("artist_name", name.trim());
      if (role.trim()) fd.append("role", role.trim());
      fd.append("photo", new File([blob], `${name.trim()}.${ext}`, { type: blob.type }));

      const res = await fetch("/api/collaborators/manual", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      onSaved(data.collaboratorId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const inviteUrl = inviteToken && typeof window !== "undefined"
    ? `${window.location.origin}/upload/${inviteToken}`
    : "";

  const copy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappUrl = inviteUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `Hola! Te comparto un enlace para que registres tus datos como colaborador:\n\n${inviteUrl}\n\nCaduca en 7 días.`
      )}`
    : "";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-3xl p-6 relative"
        style={{
          background: "rgba(15,15,25,0.98)",
          border: "1px solid rgba(168,85,247,0.30)",
          boxShadow: "0 0 60px rgba(168,85,247,0.15)",
        }}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <h2 className="text-xl font-black text-white mb-1">
          {isBrand ? "Guardar marca" : "Invitar para registrar"}
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          {isBrand
            ? "La marca se guardará en tu lista de colaboradores."
            : "Por RGPD, las personas deben firmar su consentimiento. Genera un link y mándaselo."}
        </p>

        {/* Preview imagen */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className={`w-14 h-14 overflow-hidden shrink-0 ${isBrand ? "rounded-xl bg-white p-1" : "rounded-full"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={entry.imageSrc} alt={entry.name} className="w-full h-full object-cover"/>
          </div>
          <p className="text-sm text-white font-medium truncate">{entry.name}</p>
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        {/* ── Flujo MARCA ─────────────────────────────────────────────── */}
        {isBrand && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1.5">Nombre de la marca</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-purple-500/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-1.5">
                Rol <span className="text-gray-600 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="Ej: Patrocinador oficial"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
              />
            </div>
            <button
              onClick={saveBrand}
              disabled={saving || !name.trim()}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)" }}
            >
              {saving ? "Guardando…" : "Guardar marca"}
            </button>
          </div>
        )}

        {/* ── Flujo PERSONA ────────────────────────────────────────────── */}
        {!isBrand && !inviteToken && (
          <button
            onClick={generateInvite}
            disabled={generating}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}
          >
            {generating ? "Generando enlace…" : "Generar enlace para registrar"}
          </button>
        )}

        {!isBrand && inviteToken && (
          <div className="space-y-3">
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
              <p className="text-[10px] text-gray-500 mb-1">Enlace único · caduca en 7 días</p>
              <p className="text-xs text-white font-mono break-all">{inviteUrl}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copy}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 transition-all"
              >
                {copied
                  ? <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7"/></svg> Copiado</>
                  : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copiar</>}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: "#25D366" }}
              >
                WhatsApp
              </a>
            </div>
            <p className="text-[10px] text-gray-600 text-center">
              Cuando esta persona complete el formulario aparecerá en tu lista de colaboradores
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WIDGET (card + modal combinados) ─────────────────────────────────────────

export function ArtistLibraryWidget({
  value,
  onChange,
}: {
  value: ArtistEntry[];
  onChange: (entries: ArtistEntry[]) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ArtistLibraryCard selected={value} onOpen={() => setOpen(true)}/>
      {open && (
        <ArtistLibraryModal
          initialSelected={value}
          onConfirm={entries => { onChange(entries); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
