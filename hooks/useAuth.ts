"use client";
import { useEffect, useState } from "react";
import { supabase, type Profile } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

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
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
        setProfile(data);
        setLoading(false);
    };

    const signInWithGoogle = () =>
        supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });

    const signInWithEmail = (email: string, password: string) =>
        supabase.auth.signInWithPassword({ email, password });

    const signUpWithEmail = (email: string, password: string, name: string) =>
        supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });

    const signOut = () => supabase.auth.signOut();

    return { user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut };
}
