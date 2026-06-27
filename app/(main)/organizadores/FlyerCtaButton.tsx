"use client";

import { goToFlyerApp } from "@/lib/flyerHandoff";

/**
 * CTA "Crea tu flyer" de la landing de organizadores. Isla cliente: usa el
 * handoff SSO (goToFlyerApp) para llegar al editor de ArteGenIA logueado si ya
 * hay sesión. href como fallback sin JS.
 */
export default function FlyerCtaButton({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <a
      href="https://artegenia.com/templates"
      onClick={goToFlyerApp("/templates")}
      rel="noopener noreferrer"
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
