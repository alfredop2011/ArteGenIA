/**
 * Lista de emails con acceso a las páginas /admin/*.
 *
 * Las páginas admin verifican el email del usuario logueado contra esta lista.
 * No es un sistema de roles completo; es suficiente para herramientas internas.
 *
 * Para añadir más admins, añade su email aquí y haz commit.
 */
export const ADMIN_EMAILS = new Set<string>([
  "alfredop2011@gmail.com",
]);

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.has(email.toLowerCase());
}
