"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { trackUpgradeClicked, type UserPlan } from "@/lib/analytics";
import { MONTHLY_GRANT } from "@/lib/credits";

/**
 * Badge de créditos en el header (Fase Z.1).
 * - Muestra balance actual del nuevo sistema unificado.
 * - Plan free: "7 / 10" → user ve cuánto le queda del mensual.
 * - Plan pro/enterprise: "85 / 100" igual.
 * - Tap → /pricing (CTA conversión).
 *
 * Se sincroniza vía useCredits() que polles al focus.
 */
export function CreditsBadge({ plan }: { plan?: string | null }) {
  const { balance, monthlyGrant, loading } = useCredits();

  if (loading) {
    return <div className="w-20 h-6 bg-white/5 rounded-full animate-pulse" />;
  }

  // Fallback durante el primer render del badge si useCredits aún no ha
  // devuelto monthly_grant: usar la constante de lib/credits (single
  // source of truth) en vez de literales stale.
  const grant = monthlyGrant ?? MONTHLY_GRANT[plan ?? "free"] ?? MONTHLY_GRANT.free;
  const current = balance ?? grant;
  const low = current < grant * 0.2; // <20% restante

  const handleClick = () => {
    // Z.9 — track click en badge del header (puede ser conversion o consulta)
    trackUpgradeClicked({
      source: "header_badge",
      current_plan: (plan ?? "free") as UserPlan,
      current_balance: current,
    });
  };

  return (
    <Link
      href="/pricing"
      onClick={handleClick}
      className={`flex items-center gap-1.5 sm:gap-2 border rounded-full px-2 sm:px-3 py-1 text-xs transition-colors ${
        low
          ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
          : "border-ag text-ag-muted hover:bg-ag-card"
      }`}
      title={low ? `Pocos créditos — sube a Pro para más` : `${current} créditos disponibles`}
    >
      <Zap
        size={14}
        strokeWidth={2.2}
        className={low ? "text-amber-500 fill-amber-500" : "text-amber-500 fill-amber-500"}
      />
      <span className="font-bold text-ag-primary">
        {current}
        <span className="hidden sm:inline text-ag-soft font-normal">/{grant}</span>
      </span>
    </Link>
  );
}
