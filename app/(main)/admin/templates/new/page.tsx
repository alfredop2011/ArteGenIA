"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Edit3, Trash2, ImageOff, Loader2, CheckCircle2, Clock,
  Archive as ArchiveIcon, ArrowLeft,
} from "lucide-react";
import { useTemplateDrafts } from "@/hooks/useTemplateDrafts";
import { useLocale } from "@/hooks/useLocale";
import type { TemplateDraft, TemplatePublished } from "@/lib/supabase";

/**
 * /admin/templates/new
 *
 * Lista los borradores (templates_draft) del admin + plantillas publicadas
 * (templates_published). Boton "Nueva plantilla" abre el editor en modo
 * creator (?mode=template-creator).
 *
 * Toda la persistencia esta en Supabase (useTemplateDrafts).
 */
export default function AdminTemplateCreatorPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { loading, listDrafts, listPublished, deleteDraft, unpublish, saveDraft, createDraftFromPublished } = useTemplateDrafts();
  const [drafts, setDrafts] = useState<TemplateDraft[]>([]);
  const [published, setPublished] = useState<TemplatePublished[]>([]);
  const [tab, setTab] = useState<"drafts" | "published">("drafts");
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    const [d, p] = await Promise.all([listDrafts(), listPublished()]);
    setDrafts(d);
    setPublished(p);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleCreateNew = async () => {
    setCreating(true);
    // Crea un draft vacio con plantilla base 1080x1350 fondo negro
    const baseVariant = {
      format: "story",
      width: 1080,
      height: 1350,
      layers: [
        {
          id: "bg",
          type: "shape",
          shape: "rect",
          x: 0, y: 0,
          width: 1080,
          height: 1350,
          fill: "#0a0a0f",
          selectable: false,
        },
        {
          id: "title",
          type: "text",
          text: t("admin.new.firstTemplate.title"),
          x: 540, y: 600,
          width: 900,
          fontSize: 80,
          fontFamily: "Anton",
          color: "#ffffff",
          fontWeight: "700",
          textAlign: "center",
          originX: "center",
          originY: "center",
        },
      ],
    };
    const id = await saveDraft(null, {
      title: t("admin.new.firstTemplate.untitled"),
      category: t("admin.new.firstTemplate.cat"),
      audience: [],
      internal_tags: ["wip"],
      premium: false,
      status: "draft",
      variants: [baseVariant],
    });
    setCreating(false);
    if (id) {
      // Redirige al editor en modo creator
      router.push(`/editor/draft-${id}?mode=template-creator`);
    }
  };

  const handleDelete = async (d: TemplateDraft) => {
    if (!confirm(t("admin.new.confirm.delete").replace("{title}", d.title))) return;
    const ok = await deleteDraft(d.id);
    if (ok) setDrafts(prev => prev.filter(x => x.id !== d.id));
  };

  const handleUnpublish = async (p: TemplatePublished) => {
    if (!confirm(t("admin.new.confirm.unpublish").replace("{title}", p.title))) return;
    const ok = await unpublish(p.id);
    if (ok) setPublished(prev => prev.filter(x => x.id !== p.id));
  };

  // Editar una published: crear un draft copia con tag "replaces:{publishedId}"
  // y abrir el editor. Cuando se republique, borrara la published vieja.
  const handleEditPublished = async (p: TemplatePublished) => {
    const newDraftId = await createDraftFromPublished(p.id);
    if (newDraftId) {
      router.push(`/editor/draft-${newDraftId}?mode=template-creator`);
    } else {
      alert(t("admin.new.error.editPublished"));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
      {/* HEADER */}
      <div className="border-b" style={{ background: "var(--home-bg-soft)", borderColor: "var(--home-card-border)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/admin/templates" className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5">
            <ArrowLeft size={18} strokeWidth={2}/>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black truncate">{t("admin.new.title")}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {t("admin.new.subtitle")}
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16} strokeWidth={2.5}/>}
            <span className="hidden sm:inline">{creating ? t("admin.new.creating") : t("admin.new.create")}</span>
            <span className="sm:hidden">{t("admin.new.createShort")}</span>
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("drafts")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              tab === "drafts"
                ? "bg-purple-600/30 text-purple-200"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Edit3 size={14} strokeWidth={2}/>
            {t("admin.new.tab.drafts")} ({drafts.length})
          </button>
          <button
            onClick={() => setTab("published")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              tab === "published"
                ? "bg-purple-600/30 text-purple-200"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <CheckCircle2 size={14} strokeWidth={2}/>
            {t("admin.new.tab.published")} ({published.length})
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {loading && drafts.length === 0 && published.length === 0 && (
          <div className="text-center py-16">
            <Loader2 size={32} className="animate-spin mx-auto text-purple-400"/>
          </div>
        )}

        {tab === "drafts" && (
          <>
            {drafts.length === 0 && !loading && (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Edit3 size={36} strokeWidth={1.6}/>
                </div>
                <h3 className="text-xl font-bold mb-2">{t("admin.new.drafts.empty.title")}</h3>
                <p className="text-gray-400 mb-6">{t("admin.new.drafts.empty.body")}</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {drafts.map(d => (
                <DraftCard key={d.id} draft={d} onDelete={() => handleDelete(d)}/>
              ))}
            </div>
          </>
        )}

        {tab === "published" && (
          <>
            {published.length === 0 && !loading && (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 size={36} strokeWidth={1.6}/>
                </div>
                <h3 className="text-xl font-bold mb-2">{t("admin.new.published.empty.title")}</h3>
                <p className="text-gray-400 mb-6">{t("admin.new.published.empty.body")}</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {published.map(p => (
                <PublishedCard key={p.id} pub={p} onUnpublish={() => handleUnpublish(p)} onEdit={() => handleEditPublished(p)}/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Cards ──────────────────────────────────────────────────────────────
function DraftCard({ draft, onDelete }: { draft: TemplateDraft; onDelete: () => void }) {
  const { t } = useLocale();
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <Link href={`/editor/draft-${draft.id}?mode=template-creator`} className="block">
        <div className="aspect-[3/4] bg-gradient-to-br from-purple-900/40 to-pink-900/20 flex items-center justify-center overflow-hidden">
          {draft.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.thumbnail_url} alt={draft.title} className="w-full h-full object-cover"/>
          ) : (
            <ImageOff size={32} strokeWidth={1.4} className="text-purple-300/40"/>
          )}
        </div>
        <div className="p-2 sm:p-3">
          <h3 className="font-bold text-xs sm:text-sm truncate" style={{ color: "var(--home-text)" }}>{draft.title}</h3>
          <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 flex items-center gap-1.5">
            {draft.status === "draft" && (<><Clock size={10} strokeWidth={2}/> {t("admin.new.draft.status.draft")}</>)}
            {draft.status === "ready" && (<><CheckCircle2 size={10} strokeWidth={2}/> {t("admin.new.draft.status.ready")}</>)}
            {draft.status === "archived" && (<><ArchiveIcon size={10} strokeWidth={2}/> {t("admin.new.draft.status.archived")}</>)}
            <span className="opacity-50">· {draft.category}</span>
          </p>
        </div>
      </Link>
      <button
        onClick={onDelete}
        aria-label={t("admin.new.card.delete")}
        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 backdrop-blur text-red-400 active:bg-red-900/80 active:text-red-300 hover:bg-red-900/80 hover:text-red-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0"
      >
        <Trash2 size={14} strokeWidth={1.8}/>
      </button>
    </div>
  );
}

function PublishedCard({ pub, onUnpublish, onEdit }: { pub: TemplatePublished; onUnpublish: () => void; onEdit: () => void }) {
  const { t } = useLocale();
  return (
    <div className="group relative rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] overflow-hidden">
      <button
        onClick={onEdit}
        className="block w-full text-left active:bg-white/[0.02]"
        aria-label={t("admin.new.card.edit")}
      >
        <div className="aspect-[3/4] bg-gradient-to-br from-emerald-900/30 to-purple-900/20 flex items-center justify-center overflow-hidden">
          {pub.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pub.thumbnail_url} alt={pub.title} className="w-full h-full object-cover"/>
          ) : (
            <CheckCircle2 size={32} strokeWidth={1.4} className="text-emerald-300/40"/>
          )}
        </div>
        <div className="p-2 sm:p-3">
          <h3 className="font-bold text-xs sm:text-sm truncate" style={{ color: "var(--home-text)" }}>{pub.title}</h3>
          <p className="text-emerald-300/70 text-[10px] sm:text-xs mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 size={10} strokeWidth={2}/>
            {t("admin.new.published.status")}
            <span className="opacity-50">· {pub.category}</span>
          </p>
        </div>
      </button>
      {/* Overlay edit (visible siempre en mobile, hover en desktop) */}
      <div className="absolute inset-x-0 bottom-0 p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold pointer-events-auto"
        >
          <Edit3 size={12} strokeWidth={2.5}/>
          {t("admin.new.card.edit")}
        </button>
      </div>
      <button
        onClick={onUnpublish}
        aria-label={t("admin.new.card.unpublish")}
        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 backdrop-blur text-amber-400 active:bg-amber-900/80 active:text-amber-300 hover:bg-amber-900/80 hover:text-amber-300 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity"
      >
        <ArchiveIcon size={14} strokeWidth={1.8}/>
      </button>
    </div>
  );
}
