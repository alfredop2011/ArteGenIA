"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async (userId: string) => {
        const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
        setProfile(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else { setProfile(null); setLoading(false); }
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    /** Re-lee el profile actual desde Supabase. Útil después de eventos
     *  externos que cambian el plan (webhook Stripe post-pago, upgrades
     *  manuales, etc.) — sin esto la UI sigue mostrando el plan cacheado
     *  en memoria hasta que el user cierre sesión. */
    const refreshProfile = useCallback(async () => {
        if (!user?.id) return;
        await fetchProfile(user.id);
    }, [user?.id, fetchProfile]);

    /** Inicia OAuth Google.
     *  @param nextUrl opcional — ruta absoluta o relativa a la que volver
     *    tras el callback. Se pasa como `?next=` al endpoint /auth/callback,
     *    que ya lo respeta. Útil para devolver al usuario a la página que
     *    estaba (ej. /pricing?autostart=enterprise) en vez de a la home. */
    const signInWithGoogle = (nextUrl?: string) => {
        // El `next` va en COOKIE, no en el redirect_to: así la URL de redirección
        // es LIMPIA (`/auth/callback`) y casa con la lista de Supabase del dominio
        // actual sin depender de comodines con query string (que fallaba y caía a
        // la Site URL = artegenia). El callback lee la cookie y la borra.
        if (typeof document !== "undefined" && nextUrl) {
            document.cookie = `pa_next=${encodeURIComponent(nextUrl)}; path=/; max-age=600; samesite=lax`;
        }
        return supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    };

    const signInWithEmail = (email: string, password: string) =>
        supabase.auth.signInWithPassword({ email, password });

    const signUpWithEmail = (email: string, password: string, name: string) =>
        supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
                // El email de confirmación vuelve al DOMINIO ACTUAL (peligroficial
                // o artegenia), no a la Site URL fija. Requiere que la URL esté en
                // los Redirect URLs de Supabase.
                emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
            },
        });

    const signOut = () => supabase.auth.signOut();

    return { user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, refreshProfile };
}
