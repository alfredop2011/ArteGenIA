"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, GraduationCap, Clapperboard, Palette, Landmark, Megaphone,
  School, HelpCircle, X as XIcon, Lock, Loader2, Crown, UserMinus,
  TrendingUp, MailQuestion,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/lib/admin";
import type { OrganizerType } from "@/lib/supabase";

/**
 * /admin/usuarios — Dashboard de usuarios para el admin.
 *
 * Muestra:
 *  - 4 KPIs en cards: total · respondidos · pendientes · % conversión
 *  - Bar chart horizontal con distribución por organizer_type
 *  - Tabla de últimos 50 usuarios con su tipo y plan
 *
 * Permisos: solo admin. Si no, redirect al home.
 * Datos: GET /api/admin/users (que usa service_role en server).
 */

type ApiResponse = {
  stats: {
    total: number;
    answered: number;
    pending: number;
    answeredRate: number;
    distribution: Record<string, number>;
    planDistribution: Record<string, number>;
  };
  recent: Array<{
    id: string;
    email: string;
    name: string | null;
    plan: "free" | "pro" | "enterprise";
    organizer_type: OrganizerType | null;
    organizer_type_answered_at: string | null;
    created_at: string;
  }>;
};

// Metadatos visuales por tipo de organizador. Sincronizado con
// components/onboarding/OrganizerTypeModal.tsx para coherencia visual.
const ORGANIZER_META: Record<
  OrganizerType,
  { label: string; icon: typeof Users; accent: string }
> = {
  academia:    { label: "Academia / Escuela",  icon: GraduationCap, accent: "#a855f7" },
  productora:  { label: "Productora",          icon: Clapperboard,  accent: "#ec4899" },
  freelance:   { label: "Freelance / Artista", icon: Palette,       accent: "#facc15" },
  institucion: { label: "Institución",         icon: Landmark,      accent: "#22d3ee" },
  agencia:     { label: "Agencia",             icon: Megaphone,     accent: "#fb923c" },
  colegio:     { label: "Colegio / Educación", icon: School,        accent: "#84cc16" },
  otro:        { label: "Otro",                icon: HelpCircle,    accent: "#9ca3af" },
  skipped:     { label: "No respondió",        icon: XIcon,         accent: "#6b7280" },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gating: solo admin
  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin(user?.email)) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  // Cargar datos
  useEffect(() => {
    if (authLoading || !isAdmin(user?.email)) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/users");
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Error");
        setData(body as ApiResponse);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading]);

  if (authLoading || !isAdmin(user?.email)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center"
           style={{ background: "var(--home-bg)" }}>
        <div className="text-center" style={{ color: "var(--home-text-muted)" }}>
          <Lock size={32} strokeWidth={1.5} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Verificando acceso…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--home-bg)", color: "var(--home-text)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-black" style={{ color: "var(--home-text)" }}>
                Usuarios
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide"
                    style={{ background: "var(--ag-danger-bg)", border: "1px solid var(--ag-danger-border)", color: "var(--ag-danger)" }}>
                ADMIN
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--home-text-muted)" }}>
              Distribución de organizadores y lista de usuarios recientes
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--ag-brand)" }} />
          </div>
        )}

        {error && (
          <div className="rounded-xl p-4 text-sm"
               style={{ background: "var(--ag-danger-bg)", border: "1px solid var(--ag-danger-border)", color: "var(--ag-danger)" }}>
            Error: {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* KPIs — 4 cards en grid 2x2 mobile / 4 columnas desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:mb-8">
              <KpiCard
                label="Usuarios totales"
                value={data.stats.total}
                icon={Users}
                accent="var(--ag-brand)"
              />
              <KpiCard
                label="Respondieron"
                value={data.stats.answered}
                icon={TrendingUp}
                accent="var(--ag-success)"
              />
              <KpiCard
                label="Sin responder"
                value={data.stats.pending}
                icon={MailQuestion}
                accent="var(--ag-warning)"
              />
              <KpiCard
                label="Tasa respuesta"
                value={`${data.stats.answeredRate}%`}
                icon={UserMinus}
                accent="var(--ag-info)"
              />
            </div>

            {/* DISTRIBUTION CHART — bar horizontal */}
            <section className="rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8"
                     style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
              <h2 className="text-base sm:text-lg font-black mb-4">Distribución por tipo de organizador</h2>
              <DistributionChart distribution={data.stats.distribution} total={data.stats.answered} />
            </section>

            {/* PLAN DISTRIBUTION mini */}
            <section className="rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8"
                     style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
              <h2 className="text-base sm:text-lg font-black mb-4 flex items-center gap-2">
                <Crown size={18} strokeWidth={2.2} style={{ color: "var(--ag-warning)" }} fill="currentColor" />
                Distribución por plan
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <PlanStat label="Free" value={data.stats.planDistribution["free"] ?? 0} color="var(--home-text-soft)" />
                <PlanStat label="Pro" value={data.stats.planDistribution["pro"] ?? 0} color="var(--ag-brand)" />
                <PlanStat label="Enterprise" value={data.stats.planDistribution["enterprise"] ?? 0} color="var(--ag-warning)" />
              </div>
            </section>

            {/* RECENT USERS TABLE */}
            <section className="rounded-2xl overflow-hidden"
                     style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
              <div className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: "var(--home-divider)" }}>
                <h2 className="text-base sm:text-lg font-black">Últimos usuarios registrados</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--home-text-soft)" }}>
                  Mostrando los {Math.min(50, data.recent.length)} mas recientes
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider"
                        style={{ color: "var(--home-text-soft)" }}>
                      <th className="py-2.5 px-4 font-semibold">Email</th>
                      <th className="py-2.5 px-4 font-semibold hidden sm:table-cell">Nombre</th>
                      <th className="py-2.5 px-4 font-semibold">Tipo</th>
                      <th className="py-2.5 px-4 font-semibold hidden md:table-cell">Plan</th>
                      <th className="py-2.5 px-4 font-semibold hidden lg:table-cell">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map(u => (
                      <UserRow key={u.id} user={u} />
                    ))}
                  </tbody>
                </table>
              </div>

              {data.recent.length === 0 && (
                <div className="py-10 text-center text-sm" style={{ color: "var(--home-text-muted)" }}>
                  No hay usuarios todavía
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </div>
  );
}

// ─── SUB-COMPONENTES ─────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, accent,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  accent: string;
}) {
  return (
    <div className="rounded-xl p-3 sm:p-4"
         style={{ background: "var(--home-bg-soft)", border: "1px solid var(--home-card-border)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
             style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}>
          <Icon size={14} strokeWidth={2} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--home-text-soft)" }}>
          {label}
        </span>
      </div>
      <p className="text-2xl sm:text-3xl font-black" style={{ color: "var(--home-text)" }}>
        {value}
      </p>
    </div>
  );
}

function DistributionChart({ distribution, total }: { distribution: Record<string, number>; total: number }) {
  // Ordenamos descendente por count. Si no hay nada, mensaje.
  const entries = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: "var(--home-text-muted)" }}>
        Aún no hay usuarios que hayan respondido al modal.
        <br />
        Cuando empiecen, aquí verás la distribución.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map(([type, count]) => {
        const meta = ORGANIZER_META[type as OrganizerType];
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const Icon = meta?.icon ?? HelpCircle;
        const label = meta?.label ?? type;
        const accent = meta?.accent ?? "#9ca3af";

        return (
          <div key={type}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `${accent}1a`, border: `1px solid ${accent}55`, color: accent }}>
                  <Icon size={13} strokeWidth={2} />
                </div>
                <span className="text-sm font-bold truncate" style={{ color: "var(--home-text)" }}>
                  {label}
                </span>
              </div>
              <div className="shrink-0 flex items-center gap-2 text-xs">
                <span className="font-bold" style={{ color: "var(--home-text)" }}>{count}</span>
                <span style={{ color: "var(--home-text-soft)" }}>·</span>
                <span className="font-semibold" style={{ color: accent }}>{pct}%</span>
              </div>
            </div>
            {/* Barra */}
            <div className="h-2 rounded-full overflow-hidden"
                 style={{ background: "var(--home-card-bg)" }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${pct}%`, background: accent }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlanStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-3 text-center"
         style={{ background: "var(--home-card-bg)", border: "1px solid var(--home-card-border)" }}>
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--home-text-soft)" }}>
        {label}
      </p>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
    </div>
  );
}

function UserRow({ user }: { user: ApiResponse["recent"][number] }) {
  const meta = user.organizer_type ? ORGANIZER_META[user.organizer_type] : null;
  const Icon = meta?.icon;
  const accent = meta?.accent ?? "var(--home-text-soft)";

  const date = new Date(user.created_at).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <tr className="border-t transition-colors hover:bg-[var(--home-card-bg)]"
        style={{ borderColor: "var(--home-divider)" }}>
      <td className="py-3 px-4 text-xs">
        <span className="font-mono truncate block max-w-[160px] sm:max-w-none" style={{ color: "var(--home-text)" }}>
          {user.email}
        </span>
      </td>
      <td className="py-3 px-4 text-xs hidden sm:table-cell" style={{ color: "var(--home-text-muted)" }}>
        {user.name ?? "—"}
      </td>
      <td className="py-3 px-4">
        {meta && Icon ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap"
                style={{ background: `${accent}1a`, border: `1px solid ${accent}55`, color: accent }}>
            <Icon size={11} strokeWidth={2.5} />
            {meta.label}
          </span>
        ) : (
          <span className="text-[11px] italic" style={{ color: "var(--home-text-soft)" }}>
            sin responder
          </span>
        )}
      </td>
      <td className="py-3 px-4 hidden md:table-cell">
        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md`}
              style={user.plan === "pro"
                ? { background: "var(--ag-brand-bg)", color: "var(--ag-brand)" }
                : user.plan === "enterprise"
                ? { background: "var(--ag-warning-bg)", color: "var(--ag-warning)" }
                : { background: "var(--home-card-bg)", color: "var(--home-text-soft)" }
              }>
          {user.plan}
        </span>
      </td>
      <td className="py-3 px-4 hidden lg:table-cell text-xs" style={{ color: "var(--home-text-soft)" }}>
        {date}
      </td>
    </tr>
  );
}
