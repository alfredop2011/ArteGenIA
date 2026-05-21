import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components y Route Handlers.
 * Lee y escribe el verifier PKCE en cookies (no en localStorage del navegador),
 * que es lo que necesita `@supabase/ssr`.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Si esta función es llamada desde un Server Component,
            // el set puede fallar. Lo ignoramos porque típicamente el
            // middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  );
}
