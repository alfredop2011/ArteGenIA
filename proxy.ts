import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// "Modo agenda" (peligrooficial.com): la HOME (/) muestra la agenda cultural
// sin que aparezca "/eventos" en la URL (rewrite, no redirect). Detección por
// HOST (fiable en edge) + env de respaldo (APP_MODE / NEXT_PUBLIC_APP_MODE).
// Next 16: convención "proxy" (sustituye al antiguo "middleware").
function isAgendaHost(req: NextRequest): boolean {
  const host = (req.headers.get("host") || req.nextUrl.hostname || "").toLowerCase();
  // Cubre cualquier variante del dominio (peligroficial / peligrooficial / www).
  if (host.includes("peligro")) return true;
  if (process.env.NEXT_PUBLIC_APP_MODE === "agenda") return true;
  if (process.env.APP_MODE === "agenda") return true;
  return false;
}

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/" && isAgendaHost(req)) {
    const url = req.nextUrl.clone();
    url.pathname = "/eventos";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
