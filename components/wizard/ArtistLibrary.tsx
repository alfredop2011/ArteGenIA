"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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
};

type Category = "all" | "artist" | "dj" | "group" | "logo";

type LibraryItem = {
  id: string;
  type: ArtistType;
  category: Category;
  name: string;
  imageSrc: string;
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

  const artistFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef   = useRef<HTMLInputElement>(null);

  const filtered = library.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || item.category === category;
    return matchSearch && matchCat;
  });

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleUpload = useCallback((file: File, type: ArtistType) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      const src = ev.target?.result as string;
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
        removeBackground: type === "artist",
        order: selected.length + 1,
      };
      setSelected(prev => [...prev, entry]);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }, [selected.length]);

  // ── Toggle item ─────────────────────────────────────────────────────────────

  const toggleItem = useCallback((item: LibraryItem) => {
    setSelected(prev => {
      const exists = prev.find(s => s.id === item.id);
      if (exists) return prev.filter(s => s.id !== item.id);
      const entry: ArtistEntry = {
        id: item.id, type: item.type, name: item.name,
        role: prev.length === 0 && item.type === "artist" ? "main" : defaultRole(item.type),
        imageSrc: item.imageSrc, uploadedByUser: false,
        removeBackground: item.type === "artist",
        order: prev.length + 1,
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

        {/* Category filters */}
        <div className="px-6 pb-4 flex gap-2 shrink-0">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                category === cat.id
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-transparent text-gray-400 border-white/10 hover:text-white hover:border-white/20"
              }`}>
              {cat.label}
            </button>
          ))}
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
              {filtered.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center h-40 gap-3 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-purple-500/30 transition-all"
                  onClick={() => artistFileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")).forEach(f => handleUpload(f, "artist")); }}>
                  <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  <p className="text-xs text-gray-600 text-center">{search ? `Sin resultados para "${search}"` : "Sube tu primer artista o logo"}</p>
                </div>
              ) : (
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

                      {/* Role selector */}
                      <div className="px-2.5 pb-2.5">
                        <select value={entry.role}
                          onChange={e => updateRole(entry.id, e.target.value as ArtistRole)}
                          className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3 py-1.5 text-[11px] text-gray-400 outline-none focus:border-purple-500/40">
                          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
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
