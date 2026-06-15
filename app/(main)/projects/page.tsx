import { redirect } from "next/navigation";

/**
 * /projects — Fase Z.15. Redirige a /mis-recursos?tab=flyers.
 *
 * La página antigua se fusionó con /mis-creaciones en el hub unificado
 * /mis-recursos. Mantenemos este redirect para no romper links externos,
 * bookmarks de usuarios, ni referencias internas en código antiguo
 * (templates, editor, dropdown, etc).
 */
export default function ProjectsRedirect() {
    redirect("/mis-recursos?tab=flyers");
}
