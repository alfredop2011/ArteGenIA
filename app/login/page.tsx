import { redirect } from "next/navigation";

/**
 * Redirect de rescate — la auth en ArteGenIA vive en el AuthModal
 * (abre desde el botón "Entrar" del header), NO en una ruta dedicada.
 * Pero muchos usuarios escriben /login a mano o los buscadores pueden
 * indexar links legacy. Redirigimos a home con ?auth=login para que
 * el layout abra el modal automáticamente.
 */
export default function LoginRedirect() {
    redirect("/?auth=login");
}
