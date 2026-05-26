"use client";

import { useState, useMemo } from "react";
import {
  Search, Copy, Check, X, ChevronDown, AlertTriangle,
} from "lucide-react";
import {
  templates,
  INTERNAL_TAGS,
  INTERNAL_TAG_LABELS,
  INTERNAL_TAG_COLORS,
  type InternalTag,
  type Template,
} from "@/data/templates";

/**
 * /admin/templates
 *
 * Página de mantenimiento del catálogo. Permite ver todas las plantillas
 * y editar sus tags internos VISUALMENTE. Los cambios no se persisten
 * automáticamente: se acumulan en estado local y la página genera un
 * fragmento de TypeScript que tienes que pegar manualmente en
 * data/templates.ts y commitear.
 *
 * Ventajas de este enfoque mixto:
 *  - La verdad sigue viviendo en git (revisable, versionable, deployable)
 *  - La edición es ergonómica (no abrir IDE para cada cambio)
 *  - No requiere tabla nueva en Supabase ni endpoints de update
 */

type PendingChange = {
  templateId: number;
  templateTitle: string;
  before: InternalTag[];
  after: InternalTag[];
};

export default function AdminTemplatesPage() {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<InternalTag | "all" | "untagged">("all");
  const [edits, setEdits] = useState<Record<number, InternalTag[]>>({});
  const [diffOpen, setDiffOpen] = useState(false);

  // Tags efectivos de una plantilla (estado local si fue editada, sino original)
  const effectiveTags = (t: Template): InternalTag[] => {
    return edits[t.id] ?? t.internalTags ?? [];
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter(t => {
      // Búsqueda
      if (q) {
        const hay =
          t.title.toLowerCase().includes(q)
          || t.category.toLowerCase().includes(q)
          || String(t.id).includes(q);
        if (!hay) return false;
      }
      // Filtro por tag
      const tags = effectiveTags(t);
      if (tagFilter === "all") return true;
      if (tagFilter === "untagged") return tags.length === 0;
      return tags.includes(tagFilter);
    });
    // effectiveTags lee de `edits` que ya está como dependencia, no es necesario añadirla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tagFilter, edits]);

  const pendingChanges: PendingChange[] = useMemo(() => {
    return Object.entries(edits)
      .map(([id, after]) => {
        const numId = Number(id);
        const t = templates.find(x => x.id === numId);
        if (!t) return null;
        const before = t.internalTags ?? [];
        const sortedBefore = [...before].sort();
        const sortedAfter = [...after].sort();
        if (JSON.stringify(sortedBefore) === JSON.stringify(sortedAfter)) return null;
        return { templateId: numId, templateTitle: t.title, before, after };
      })
      .filter((x): x is PendingChange => x !== null);
  }, [edits]);

  const toggleTag = (templateId: number, tag: InternalTag) => {
    setEdits(prev => {
      const tpl = templates.find(t => t.id === templateId);
      if (!tpl) return prev;
      const current = prev[templateId] ?? tpl.internalTags ?? [];
      const has = current.includes(tag);
      const next = has ? current.filter(x => x !== tag) : [...current, tag];
      return { ...prev, [templateId]: next };
    });
  };

  const discardChanges = () => {
    setEdits({});
    setDiffOpen(false);
  };

  // Conteo por tag
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: templates.length, untagged: 0 };
    for (const t of templates) {
      const tags = effectiveTags(t);
      if (tags.length === 0) c.untagged += 1;
      for (const tag of tags) c[tag] = (c[tag] ?? 0) + 1;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits]);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-black text-white">Admin · Plantillas</h1>
            <span className="px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold tracking-wide">
              INTERNO
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {templates.length} plantillas en el catálogo · Tags solo visibles aquí
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Link al CREADOR de plantillas nuevo (sesion 1 creador admin) */}
          <a
            href="/admin/templates/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-purple-200 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 transition-all"
          >
            ✦ Crear nueva plantilla
          </a>
          {pendingChanges.length > 0 && (
            <>
              <button
                onClick={discardChanges}
                className="px-3 py-2 rounded-xl text-xs font-bold text-gray-300 bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={() => setDiffOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #c026d3)",
                  boxShadow: "0 0 25px rgba(168,85,247,0.30)",
                }}
              >
                Ver cambios <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{pendingChanges.length}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por título, categoría o id…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Tag filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <FilterChip
          active={tagFilter === "all"}
          onClick={() => setTagFilter("all")}
        >
          Todas <span className="opacity-60">· {counts.all}</span>
        </FilterChip>
        <FilterChip
          active={tagFilter === "untagged"}
          onClick={() => setTagFilter("untagged")}
        >
          Sin tag <span className="opacity-60">· {counts.untagged ?? 0}</span>
        </FilterChip>
        {INTERNAL_TAGS.map(tag => (
          <FilterChip
            key={tag}
            active={tagFilter === tag}
            onClick={() => setTagFilter(tag)}
            colorClass={INTERNAL_TAG_COLORS[tag]}
          >
            {INTERNAL_TAG_LABELS[tag]} <span className="opacity-60">· {counts[tag] ?? 0}</span>
          </FilterChip>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          Sin resultados con esos filtros
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <TemplateRow
              key={t.id}
              template={t}
              effectiveTags={effectiveTags(t)}
              dirty={edits[t.id] !== undefined}
              onToggleTag={(tag) => toggleTag(t.id, tag)}
            />
          ))}
        </div>
      )}

      {/* Modal con diff TypeScript */}
      {diffOpen && (
        <DiffModal
          changes={pendingChanges}
          onClose={() => setDiffOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  children,
  colorClass,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
        active
          ? colorClass ?? "bg-purple-500/25 border-purple-500/50 text-white"
          : "bg-white/[0.03] border-white/10 text-gray-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function TemplateRow({
  template,
  effectiveTags,
  dirty,
  onToggleTag,
}: {
  template: Template;
  effectiveTags: InternalTag[];
  dirty: boolean;
  onToggleTag: (tag: InternalTag) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        dirty
          ? "bg-purple-500/[0.06] border-purple-500/40"
          : "bg-white/[0.02] border-white/[0.06]"
      }`}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={template.image} alt={template.title} className="w-full h-full object-cover"/>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 font-mono">#{template.id}</span>
            <p className="text-sm font-bold text-white truncate">{template.title}</p>
            {dirty && (
              <span className="px-1.5 py-0.5 rounded-md bg-purple-500/30 text-purple-200 text-[9px] font-bold tracking-wide">
                MODIFICADA
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-[11px] text-gray-500">{template.category}</p>
            <p className="text-[10px] text-gray-700">{template.variants.length} variante(s)</p>
            {template.premium && (
              <span className="text-[10px] text-amber-400">Premium</span>
            )}
          </div>

          {/* Tags actuales */}
          {effectiveTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {effectiveTags.map(tag => (
                <span
                  key={tag}
                  className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold tracking-wide ${INTERNAL_TAG_COLORS[tag]}`}
                >
                  {INTERNAL_TAG_LABELS[tag]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expand */}
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Editor de tags expandible */}
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
            Tags internos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {INTERNAL_TAGS.map(tag => {
              const active = effectiveTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={`px-2 py-1 rounded-md border text-[10px] font-bold transition-all ${
                    active
                      ? INTERNAL_TAG_COLORS[tag]
                      : "bg-white/[0.03] border-white/10 text-gray-500 hover:text-white hover:border-white/20"
                  }`}
                >
                  {active && <Check size={9} strokeWidth={3} className="inline mr-0.5" />}
                  {INTERNAL_TAG_LABELS[tag]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DiffModal({
  changes,
  onClose,
}: {
  changes: PendingChange[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  // Genera fragmentos TS pegables
  const fragments = changes.map(c => {
    const after = c.after.length === 0 ? "[]" : `[${c.after.map(t => `"${t}"`).join(", ")}]`;
    return {
      templateId: c.templateId,
      title: c.templateTitle,
      tsLine: `internalTags: ${after},`,
    };
  });

  const fullSnippet = fragments
    .map(f => `// Plantilla #${f.templateId}: ${f.title}\n${f.tsLine}`)
    .join("\n\n");

  const copy = async () => {
    await navigator.clipboard.writeText(fullSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-3xl"
        style={{
          background: "rgba(15,15,25,0.98)",
          border: "1px solid rgba(168,85,247,0.30)",
          boxShadow: "0 0 60px rgba(168,85,247,0.15)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.05] shrink-0">
          <div>
            <h2 className="text-lg font-black text-white">
              {changes.length} cambio{changes.length === 1 ? "" : "s"} pendiente{changes.length === 1 ? "" : "s"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Copia este fragmento y pégalo en <span className="text-purple-300 font-mono">data/templates.ts</span> dentro de cada plantilla
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen visual de cambios */}
        <div className="px-5 py-4 border-b border-white/[0.05] max-h-48 overflow-y-auto shrink-0">
          {changes.map(c => (
            <div key={c.templateId} className="flex items-start gap-3 py-2 text-xs">
              <span className="font-mono text-gray-600 shrink-0 w-12">#{c.templateId}</span>
              <span className="text-white shrink-0 max-w-[160px] truncate">{c.templateTitle}</span>
              <span className="text-gray-500">→</span>
              <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                {c.after.length === 0 ? (
                  <span className="text-gray-700 italic">(sin tags)</span>
                ) : (
                  c.after.map(tag => (
                    <span
                      key={tag}
                      className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold tracking-wide ${INTERNAL_TAG_COLORS[tag]}`}
                    >
                      {INTERNAL_TAG_LABELS[tag]}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Aviso */}
        <div className="px-5 py-3 flex gap-2 items-start bg-amber-500/[0.06] border-b border-amber-500/20 shrink-0">
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Estos cambios NO se guardan automáticamente. Tienes que pegarlos en{" "}
            <span className="font-mono text-amber-100">data/templates.ts</span>{" "}
            y hacer commit. Si refrescas esta página, los perderás.
          </p>
        </div>

        {/* Código */}
        <div className="flex-1 min-h-0 p-5 overflow-y-auto">
          <pre className="bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] text-green-300 font-mono overflow-x-auto whitespace-pre">
{fullSnippet}
          </pre>
        </div>

        {/* Footer con botón copiar */}
        <div className="p-4 border-t border-white/[0.05] shrink-0">
          <button
            onClick={copy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01]"
            style={{
              background: copied
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #7c3aed, #c026d3)",
            }}
          >
            {copied ? (
              <><Check size={16} strokeWidth={2.5} /> Copiado al portapapeles</>
            ) : (
              <><Copy size={16} /> Copiar fragmento TypeScript</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
