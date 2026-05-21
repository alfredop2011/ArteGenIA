import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Route handler que recibe el callback OAuth de Supabase/Google.
 *
 * Flujo:
 *   1. Usuario pulsa "Continuar con Google" en el cliente
 *   2. supabase.auth.signInWithOAuth() guarda el code_verifier PKCE en COOKIES
 *      (gracias a createBrowserClient de @supabase/ssr)
 *   3. Redirige a Google → autorización → vuelve a /auth/callback?code=...
 *   4. Aquí, en servidor, leemos el code_verifier de cookies, hacemos el
 *      intercambio, y guardamos la sesión en cookies (también server-side)
 *   5. Redirigimos al usuario a "next" (parámetro opcional) o a "/"
 *
 * Esta es la forma oficial de hacerlo con @supabase/ssr. El intento previo
 * con `exchangeCodeForSession` en cliente fallaba porque el verifier vive
 * en cookies (no en localStorage) cuando usas createBrowserClient.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorParam =
    searchParams.get("error_description") || searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(errorParam)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent("Falta código de autenticación")}`
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/?auth_error=${encodeURIComponent(error.message)}`
    );
  }

  // Sesión creada y guardada en cookies. Redirigimos a la home.
  return NextResponse.redirect(`${origin}${next}`);
}
