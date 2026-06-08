"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search, Copy, Check, X, ChevronDown, AlertTriangle,
  ChevronLeft, ChevronRight, ArrowDownWideNarrow, ArrowUpWideNarrow,
} from "lucide-react";

// Tamano de pagina del listado admin. Pensado para evitar listas muy largas
// (catalogo crece y queremos algo navegable).
const PAGE_SIZE = 12;
import {
  templates,
  INTERNAL_TAGS,
  INTERNAL_TAG_LABELS,
  INTERNAL_TAG_COLORS,
  type InternalTag,
  type Template,
} from "@/data/templates";
import { useLocale } from "@/hooks/useLocale";

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
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<InternalTag | "all" | "untagged">("all");
  const [edits, setEdits] = useState<Record<number, InternalTag[]>>({});
  const [diffOpen, setDiffOpen] = useState(false);
  // Orden por id. Por defecto "desc" = nuevas primero (las ultimas creadas
  // aparecen arriba). El admin puede cambiarlo con el toggle de la toolbar.
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  // Pagina actual del paginador.
  const [page, setPage] = useState(1);

  // Tags efectivos de una plantilla (estado local si fue editada, sino original)
  const effectiveTags = (t: Template): InternalTag[] => {
    return edits[t.id] ?? t.internalTags ?? [];
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = templates.filter(t => {
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
    // Ordenar por id segun sortOrder. desc = mas nueva primero.
    return [...list].sort((a, b) => sortOrder === "desc" ? b.id - a.id : a.id - b.id);
    // effectiveTags lee de `edits` que ya está como dependencia, no es necesario añadirla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tagFilter, edits, sortOrder]);

  // Paginacion: porciones de PAGE_SIZE elementos. Cuando cambian los filtros
  // u orden, volvemos a la primera pagina para evitar quedar fuera de rango.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Reset de pagina si cambian busqueda, tag, orden, edicion (puede afectar al
  // conteo via "untagged"), o si la pagina actual queda fuera de rango.
  useEffect(() => {
    setPage(1);
  }, [query, tagFilter, sortOrder]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

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
            <h1 className="text-3xl font-black text-white">{t("admin.tpl.title")}</h1>
            <span className="px-2 py-0.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold tracking-wide">
              {t("admin.tpl.internal")}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {t("admin.tpl.subtitle").replace("{n}", String(templates.length))}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Link al CREADOR de plantillas nuevo (sesion 1 creador admin) */}
          <a
            href="/admin/templates/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-purple-200 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 transition-all"
          >
            {t("admin.tpl.newTemplate")}
          </a>
          {pendingChanges.length > 0 && (
            <>
              <button
                onClick={discardChanges}
                className="px-3 py-2 rounded-xl text-xs font-bold text-gray-300 bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 transition-colors"
              >
                {t("admin.tpl.discard")}
              </button>
              <button
                onClick={() => setDiffOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #c026d3)",
                  boxShadow: "0 0 25px rgba(168,85,247,0.30)",
                }}
              >
                {t("admin.tpl.viewChanges")} <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{pendingChanges.length}</span>
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
            placeholder={t("admin.tpl.search.placeholder")}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
          />
        </div>
        {/* Toggle orden por id (defecto: nuevas primero) */}
        <button
          onClick={() => setSortOrder(o => o === "desc" ? "asc" : "desc")}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
          title={sortOrder === "desc" ? t("admin.tpl.sort.newFirst") : t("admin.tpl.sort.oldFirst")}
        >
          {sortOrder === "desc"
            ? <ArrowDownWideNarrow size={14} className="text-purple-300" />
            : <ArrowUpWideNarrow size={14} className="text-purple-300" />}
          <span className="hidden sm:inline">
            {sortOrder === "desc" ? t("admin.tpl.sort.newFirst") : t("admin.tpl.sort.oldFirst")}
          </span>
        </button>
      </div>

      {/* Tag filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        <FilterChip
          active={tagFilter === "all"}
          onClick={() => setTagFilter("all")}
        >
          {t("admin.tpl.filter.all")} <span className="opacity-60">· {counts.all}</span>
        </FilterChip>
        <FilterChip
          active={tagFilter === "untagged"}
          onClick={() => setTagFilter("untagged")}
        >
          {t("admin.tpl.filter.untagged")} <span className="opacity-60">· {counts.untagged ?? 0}</span>
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

      {/* Lista paginada */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          {t("admin.tpl.empty")}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map(t => (
              <TemplateRow
                key={t.id}
                template={t}
                effectiveTags={effectiveTags(t)}
                dirty={edits[t.id] !== undefined}
                onToggleTag={(tag) => toggleTag(t.id, tag)}
              />
            ))}
          </div>
          {/* Paginador (solo si hay mas de una pagina) */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          )}
        </>
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

/**
 * Paginador. Muestra "page X de Y", flechas anterior/siguiente, y unos
 * cuantos numeros de pagina (siempre 1 y N, y una ventana alrededor de la
 * actual). Botones inactivos quedan deshabilitados, no ocultos.
 */
function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (next: number) => void;
}) {
  const { t } = useLocale();
  // Calculamos las "ventanas" de paginas a mostrar. Asi no llenamos la
  // barra de numeros cuando hay muchas paginas.
  const pages: (number | "...")[] = [];
  const window = 1; // paginas a cada lado de la actual
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-4 border-t border-white/[0.05]">
      {/* Texto rango */}
      <p className="text-[11px] text-gray-500">
        {t("admin.tpl.pagination.showing")} <span className="text-gray-300 font-semibold">{from}–{to}</span> {t("admin.tpl.pagination.of")}{" "}
        <span className="text-gray-300 font-semibold">{total}</span>
      </p>

      {/* Controles */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={t("admin.tpl.pagination.prev")}
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1.5 text-gray-600 text-xs select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-[32px] px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                p === page
                  ? "bg-purple-500/25 border border-purple-500/50 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.06] border border-transparent"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label={t("admin.tpl.pagination.next")}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

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
  const { t } = useLocale();
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
                {t("admin.tpl.modified")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-[11px] text-gray-500">{template.category}</p>
            <p className="text-[10px] text-gray-700">{template.variants.length} {t("admin.tpl.variants")}</p>
            {template.premium && (
              <span className="text-[10px] text-amber-400">{t("admin.tpl.premium")}</span>
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
            {t("admin.tpl.internalTags")}
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
  const { t } = useLocale();
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
              {(changes.length === 1 ? t("admin.tpl.diff.title.one") : t("admin.tpl.diff.title.many")).replace("{n}", String(changes.length))}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("admin.tpl.diff.subtitle")}
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
                  <span className="text-gray-700 italic">{t("admin.tpl.diff.noTags")}</span>
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
            {t("admin.tpl.diff.warning")}
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
              <><Check size={16} strokeWidth={2.5} /> {t("admin.tpl.diff.copied")}</>
            ) : (
              <><Copy size={16} /> {t("admin.tpl.diff.copy")}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
