import { redirect } from "next/navigation";

/**
 * /colaboradores — Z.15.1. Redirige al tab "Colaboradores" dentro de
 * /mis-recursos. La gestión vive ahora junto a Flyers e Imágenes para
 * tener un solo hub de assets/contactos del usuario.
 *
 * Redirect 308 mantiene bookmarks/links externos funcionando.
 */
export default function ColaboradoresRedirect() {
    redirect("/mis-recursos?tab=colaboradores");
}
