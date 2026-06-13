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
        const nextParam = nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : "";
        return supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback${nextParam}` },
        });
    };

    const signInWithEmail = (email: string, password: string) =>
        supabase.auth.signInWithPassword({ email, password });

    const signUpWithEmail = (email: string, password: string, name: string) =>
        supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });

    const signOut = () => supabase.auth.signOut();

    return { user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, refreshProfile };
}
