"use client";

import { useState, useCallback, useRef, use } from "react";

export default function ArtistUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string; uploaded: boolean; error?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!arr.length) return;
    const newPreviews = arr.map(file => ({ file, url: URL.createObjectURL(file), uploaded: false }));
    setPreviews(prev => [...prev, ...newPreviews]);
    for (const item of newPreviews) {
      try {
        const fd = new FormData();
        fd.append("photo", item.file);
        fd.append("token", token);
        const res = await fetch("/api/artist-upload", { method: "POST", body: fd });
        const data = await res.json();
        setPreviews(prev => prev.map(p => p.url === item.url ? { ...p, uploaded: data.ok, error: data.error } : p));
      } catch {
        setPreviews(prev => prev.map(p => p.url === item.url ? { ...p, error: "Error de conexión" } : p));
      }
    }
  }, [token]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const allUploaded = previews.length > 0 && previews.every(p => p.uploaded);

  return (
    <div className="min-h-screen bg-[#0e0e14] text-white flex flex-col items-center px-4 py-12">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-black text-xs">AG</div>
        <span className="font-bold">Arte <span className="text-yellow-400">Gen</span></span>
      </div>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-sm text-purple-300 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Solicitud de foto para flyer
          </div>
          <h1 className="text-3xl font-black mb-2">Sube tu foto 📸</h1>
          <p className="text-gray-400 text-sm mt-2">Eliminaremos el fondo automáticamente con IA. Mejor con buena iluminación y fondo liso.</p>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer mb-4 ${
            isDragging ? "border-purple-400 bg-purple-500/10" : "border-white/10 bg-white/[0.03] hover:border-purple-500/30 hover:bg-purple-500/5"
          }`}
          style={{ minHeight: previews.length ? 72 : 220 }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => e.target.files && processFiles(e.target.files)} className="hidden" />
          {previews.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all ${isDragging ? "bg-purple-500/20 scale-110" : "bg-white/5"}`}>
                {isDragging ? "⬇️" : "📸"}
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">{isDragging ? "Suelta aquí" : "Arrastra tus fotos aquí"}</p>
                <p className="text-gray-600 text-xs mt-1">o haz clic · JPG, PNG · varias fotos · máx. 15MB</p>
              </div>
              <div className="flex gap-4 text-xs text-gray-600">
                <span>✓ Múltiples fotos</span>
                <span>✓ Alta resolución</span>
                <span>✓ Fondo eliminado con IA</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4">
              <span className="text-xl">{isDragging ? "⬇️" : "➕"}</span>
              <p className="text-sm text-gray-500">Clic o arrastra para añadir más fotos</p>
            </div>
          )}
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {previews.map((p, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                <img src={p.url} alt="" className="w-full h-full object-cover" />
                <div className={`absolute inset-0 flex items-center justify-center ${p.uploaded ? "bg-black/30" : p.error ? "bg-red-900/60" : "bg-black/50"}`}>
                  {p.uploaded && <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-xl font-bold">✓</div>}
                  {p.error && <p className="text-xs text-red-300 text-center px-2">{p.error}</p>}
                  {!p.uploaded && !p.error && <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {allUploaded && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-black text-green-400 mb-1">¡Fotos enviadas!</h2>
            <p className="text-gray-400 text-sm">{previews.length} foto{previews.length > 1 ? "s" : ""} recibida{previews.length > 1 ? "s" : ""}. Ya puedes cerrar esta página.</p>
          </div>
        )}
        <p className="text-center text-xs text-gray-700 mt-6">Enlace exclusivo · Caduca en 7 días</p>
      </div>
    </div>
  );
}
