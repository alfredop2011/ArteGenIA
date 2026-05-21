import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdmin } from "@/lib/admin";

/**
 * Layout de las páginas /admin/*.
 *
 * Verifica en SERVIDOR que el usuario está logueado y su email está en la
 * lista de admins (lib/admin.ts). Si no, redirige a la home con un parámetro
 * que la home puede ignorar silenciosamente.
 *
 * Esto bloquea acceso renderizado; el guard NO es lo bastante fuerte para
 * APIs (cada endpoint admin debe verificar isAdmin por su cuenta), pero
 * sirve para que ningún visitante "vea" la página por error.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    redirect("/?denied=admin");
  }

  return <>{children}</>;
}
