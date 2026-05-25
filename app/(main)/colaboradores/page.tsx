"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, Tag, Search, Plus, MoreVertical, Trash2, Pencil, RotateCw,
  X, Copy, Check, Loader2, MessageCircle, ShieldCheck, ArrowUpDown,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────

type Collaborator = {
  id: string;
  kind: "person" | "brand";
  artist_name: string;
  role: string | null;
  phone: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

type SortMode = "recent" | "alpha";

// ─── Page ────────────────────────────────────────────────────────────────

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"person" | "brand">("person");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("recent");

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Collaborator | null>(null);
  const [reinviteTarget, setReinviteTarget] = useState<Collaborator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collaborator | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/collaborators");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar");
      setCollaborators(data.collaborators);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  // Filtrado y ordenación
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return collaborators
      .filter(c => c.kind === activeTab)
      .filter(c => {
        if (!q) return true;
        return (
          c.artist_name.toLowerCase().includes(q)
          || (c.role?.toLowerCase().includes(q) ?? false)
          || (c.phone?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        if (sort === "alpha") return a.artist_name.localeCompare(b.artist_name);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [collaborators, activeTab, query, sort]);

  const counts = useMemo(() => ({
    person: collaborators.filter(c => c.kind === "person").length,
    brand: collaborators.filter(c => c.kind === "brand").length,
  }), [collaborators]);

  return (
    <div className="min-h-screen px-3 sm:px-6 py-4 sm:py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-5 sm:mb-8 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">Colaboradores</h1>
          <p className="text-xs sm:text-sm text-gray-400">Personas y marcas que aparecen en tus flyers</p>
        </div>
        <button
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] w-full sm:w-auto"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #c026d3)",
            boxShadow: "0 0 25px rgba(168,85,247,0.40)",
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Invitar colaborador
        </button>
      </div>

      {/* Tabs - en mobile ocupan todo el ancho */}
      <div className="flex items-center gap-1 mb-4 sm:mb-5 p-1 bg-white/[0.03] border border-white/5 rounded-xl w-full sm:w-fit">
        <TabButton active={activeTab === "person"} onClick={() => setActiveTab("person")}>
          <Users size={14} strokeWidth={2} />
          Personas <span className="text-gray-500 font-normal">· {counts.person}</span>
        </TabButton>
        <TabButton active={activeTab === "brand"} onClick={() => setActiveTab("brand")}>
          <Tag size={14} strokeWidth={2} />
          Marcas <span className="text-gray-500 font-normal">· {counts.brand}</span>
        </TabButton>
      </div>

      {/* Toolbar: buscador + sort */}
      <div className="flex gap-2 mb-4 sm:mb-5 flex-wrap">
        <div className="flex-1 min-w-0 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={`Buscar ${activeTab === "person" ? "personas" : "marcas"}…`}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
          />
        </div>
        <button
          onClick={() => setSort(s => s === "recent" ? "alpha" : "recent")}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors shrink-0"
        >
          <ArrowUpDown size={13} strokeWidth={2} />
          <span className="hidden xs:inline">{sort === "recent" ? "Más recientes" : "Alfabético"}</span>
          <span className="xs:hidden">{sort === "recent" ? "Recientes" : "A-Z"}</span>
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          kind={activeTab}
          hasQuery={!!query.trim()}
          onInvite={() => setInviteModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <CollaboratorCard
              key={c.id}
              collab={c}
              onEdit={() => setEditTarget(c)}
              onReinvite={() => setReinviteTarget(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {inviteModalOpen && (
        <InviteModal onClose={() => setInviteModalOpen(false)} />
      )}
      {editTarget && (
        <EditModal
          collab={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); load(); }}
        />
      )}
      {reinviteTarget && (
        <ReinviteModal
          collab={reinviteTarget}
          onClose={() => setReinviteTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          collab={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? "bg-purple-600/25 text-purple-100 shadow-sm"
          : "text-gray-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({
  kind,
  hasQuery,
  onInvite,
}: {
  kind: "person" | "brand";
  hasQuery: boolean;
  onInvite: () => void;
}) {
  if (hasQuery) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">No hay resultados para tu búsqueda</p>
      </div>
    );
  }
  return (
    <div className="text-center py-16">
      <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
        kind === "brand"
          ? "bg-amber-500/15 border border-amber-500/30 text-amber-300"
          : "bg-purple-500/15 border border-purple-500/30 text-purple-300"
      }`}>
        {kind === "brand" ? <Tag size={22} /> : <Users size={22} />}
      </div>
      <h3 className="text-base font-bold text-white mb-1">
        Sin {kind === "brand" ? "marcas" : "personas"} todavía
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        {kind === "brand"
          ? "Invita patrocinadores o empresas colaboradoras"
          : "Invita a artistas, profes o ponentes a registrarse"}
      </p>
      <button
        onClick={onInvite}
        className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg, #7c3aed, #c026d3)" }}
      >
        Invitar colaborador
      </button>
    </div>
  );
}

function CollaboratorCard({
  collab,
  onEdit,
  onReinvite,
  onDelete,
}: {
  collab: Collaborator;
  onEdit: () => void;
  onReinvite: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isBrand = collab.kind === "brand";

  return (
    <div
      className="relative rounded-2xl p-4 transition-all hover:bg-white/[0.05]"
      style={{
        background: "rgba(15,15,25,0.6)",
        border: isBrand
          ? "1px solid rgba(217,119,6,0.20)"
          : "1px solid rgba(168,85,247,0.20)",
      }}
    >
      <div className="flex items-start gap-3">
        {collab.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={collab.photo_url}
            alt={collab.artist_name}
            className={`w-14 h-14 object-cover shrink-0 ${isBrand ? "rounded-xl bg-white p-1" : "rounded-full"}`}
          />
        ) : (
          <div className={`w-14 h-14 flex items-center justify-center text-gray-600 shrink-0 ${isBrand ? "rounded-xl bg-amber-500/15" : "rounded-full bg-purple-500/15"}`}>
            {isBrand ? <Tag size={20} /> : <Users size={20} />}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-white truncate">{collab.artist_name}</h3>
          {collab.role && (
            <p className="text-[11px] text-gray-400 truncate">{collab.role}</p>
          )}
          {collab.phone && (
            <p className="text-[11px] text-gray-600 truncate">{collab.phone}</p>
          )}
        </div>

        {/* Menú */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-44 rounded-xl shadow-2xl overflow-hidden z-20"
                style={{ background: "rgba(20,20,30,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Pencil size={12} />
                  Editar {isBrand ? "marca" : "rol"}
                </button>
                {!isBrand && (
                  <button
                    onClick={() => { setMenuOpen(false); onReinvite(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <RotateCw size={12} />
                    Pedir actualización
                  </button>
                )}
                <div className="h-px bg-white/5" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={12} />
                  Eliminar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modales ─────────────────────────────────────────────────────────────

function ModalShell({
  onClose,
  children,
  width = "max-w-md",
}: {
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full ${width} rounded-3xl p-6 relative`}
        style={{
          background: "rgba(15,15,25,0.98)",
          border: "1px solid rgba(168,85,247,0.30)",
          boxShadow: "0 0 60px rgba(168,85,247,0.15)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/collaborator-invites", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al generar invitación");
        setToken(data.token);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const url = token ? `${window.location.origin}/upload/${token}` : "";

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hola! Te comparto un enlace para que registres tus datos como colaborador en el próximo evento:\n\n${url}\n\nCaduca en 7 días.`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-xl font-black text-white mb-1">Invitar colaborador</h2>
      <p className="text-xs text-gray-500 mb-5">
        Comparte este link. El colaborador decidirá si es persona o marca al abrirlo.
      </p>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {token && (
        <>
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 mb-4">
            <p className="text-[10px] text-gray-500 mb-1">Enlace único · caduca en 7 días</p>
            <p className="text-xs text-white font-mono break-all">{url}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 transition-all"
            >
              {copied ? <><Check size={14} className="text-emerald-400" /> Copiado</> : <><Copy size={14} /> Copiar</>}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: "#25D366" }}
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          </div>
        </>
      )}
    </ModalShell>
  );
}

function EditModal({
  collab,
  onClose,
  onSaved,
}: {
  collab: Collaborator;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isBrand = collab.kind === "brand";
  const [name, setName] = useState(collab.artist_name);
  const [role, setRole] = useState(collab.role ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, string | null> = { role: role.trim() || null };
      if (isBrand) body.artist_name = name.trim();
      const res = await fetch(`/api/collaborators/${collab.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-xl font-black text-white mb-1">
        Editar {isBrand ? "marca" : "rol"}
      </h2>
      <p className="text-xs text-gray-500 mb-5">
        {isBrand
          ? "Puedes editar el nombre y rol de la marca."
          : "Solo puedes editar el rol (etiqueta interna). Para cambiar nombre/teléfono/foto, usa 'Pedir actualización'."}
      </p>

      <div className="space-y-4">
        {isBrand && (
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-purple-500/40 transition-colors"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2">
            Rol <span className="text-gray-600 font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder={isBrand ? "Ej: Patrocinador oficial" : "Ej: DJ, Profesor"}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/40 transition-colors"
          />
        </div>

        {!isBrand && (
          <div className="flex gap-2 items-start p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <ShieldCheck size={14} className="text-purple-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Por RGPD no puedes modificar nombre, teléfono ni foto de una persona sin su consentimiento. Usa &quot;Pedir actualización&quot; en el menú para mandarle un nuevo link.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #c026d3)",
            boxShadow: "0 0 25px rgba(168,85,247,0.30)",
          }}
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </ModalShell>
  );
}

function ReinviteModal({
  collab,
  onClose,
}: {
  collab: Collaborator;
  onClose: () => void;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/collaborators/${collab.id}/reinvite`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al generar enlace");
        setToken(data.token);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, [collab.id]);

  const url = token ? `${window.location.origin}/upload/${token}` : "";

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hola ${collab.artist_name}, ¿podrías actualizar tus datos? Aquí tienes el enlace (caduca en 7 días):\n\n${url}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <ModalShell onClose={onClose}>
      <h2 className="text-xl font-black text-white mb-1">Pedir actualización</h2>
      <p className="text-xs text-gray-500 mb-5">
        Comparte este link con <span className="text-white">{collab.artist_name}</span> para que actualice sus datos.
      </p>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {token && (
        <>
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 mb-4">
            <p className="text-[10px] text-gray-500 mb-1">Enlace único · caduca en 7 días</p>
            <p className="text-xs text-white font-mono break-all">{url}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copy}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 transition-all"
            >
              {copied ? <><Check size={14} className="text-emerald-400" /> Copiado</> : <><Copy size={14} /> Copiar</>}
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: "#25D366" }}
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          </div>
        </>
      )}
    </ModalShell>
  );
}

function DeleteModal({
  collab,
  onClose,
  onDeleted,
}: {
  collab: Collaborator;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/collaborators/${collab.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto mb-4">
        <Trash2 size={20} />
      </div>
      <h2 className="text-lg font-black text-white text-center mb-1">
        ¿Eliminar a {collab.artist_name}?
      </h2>
      <p className="text-xs text-gray-500 text-center mb-5">
        Esta acción es permanente. La foto y todos sus datos se eliminarán definitivamente.
      </p>

      {error && <p className="text-xs text-red-400 text-center mb-3">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onClose}
          className="py-2.5 rounded-xl text-xs font-bold text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={doDelete}
          disabled={deleting}
          className="py-2.5 rounded-xl text-xs font-bold text-white bg-red-500/80 hover:bg-red-500 transition-colors disabled:opacity-40"
        >
          {deleting ? "Eliminando…" : "Eliminar"}
        </button>
      </div>
    </ModalShell>
  );
}
