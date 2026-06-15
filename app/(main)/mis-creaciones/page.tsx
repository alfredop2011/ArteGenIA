import { redirect } from "next/navigation";

/**
 * /mis-creaciones — Fase Z.15. Redirige a /mis-recursos?tab=imagenes.
 *
 * La página antigua se fusionó con /projects en el hub unificado
 * /mis-recursos. Mantenemos este redirect para no romper el toast de
 * "Guardado en Mis creaciones" que pueda quedar en alguna build cacheada,
 * ni references desde el editor.
 */
export default function MisCreacionesRedirect() {
    redirect("/mis-recursos?tab=imagenes");
}
