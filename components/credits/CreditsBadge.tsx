"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

/**
 * Badge de créditos en el header (Fase Z.1).
 * - Muestra balance actual del nuevo sistema unificado.
 * - Plan free: "23 / 30" → user ve cuánto le queda del mensual.
 * - Plan pro/enterprise: "215 / 250" igual.
 * - Tap → /pricing (CTA conversión).
 *
 * Se sincroniza vía useCredits() que polles al focus.
 */
export function CreditsBadge({ plan }: { plan?: string | null }) {
  const { balance, monthlyGrant, loading } = useCredits();

  if (loading) {
    return <div className="w-20 h-6 bg-white/5 rounded-full animate-pulse" />;
  }

  const grant = monthlyGrant ?? (plan === "pro" ? 250 : plan === "enterprise" ? 2000 : 30);
  const current = balance ?? grant;
  const low = current < grant * 0.2; // <20% restante

  return (
    <Link
      href="/pricing"
      className={`flex items-center gap-1.5 sm:gap-2 border rounded-full px-2 sm:px-3 py-1 text-xs transition-colors ${
        low
          ? "border-amber-500/40 bg-amber-500/5 text-amber-200 hover:bg-amber-500/10"
          : "border-white/10 text-gray-300 hover:bg-white/[0.04]"
      }`}
      title={low ? `Pocos créditos — sube a Pro para más` : `${current} créditos disponibles`}
    >
      <Zap
        size={14}
        strokeWidth={2.2}
        className={low ? "text-amber-400 fill-amber-400" : "text-yellow-400 fill-yellow-400"}
      />
      <span className="font-bold text-white">
        {current}
        <span className="hidden sm:inline text-gray-400 font-normal">/{grant}</span>
      </span>
    </Link>
  );
}
