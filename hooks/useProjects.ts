"use client";
import { useState, useCallback } from "react";
import { supabase, type Project } from "@/lib/supabase";

export function useProjects() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const saveProject = useCallback(async (
        projectId: string | null,
        title: string,
        templateId: number,
        fabricJson: object,
        format: string = "flyer",
        width: number = 430,
        height: number = 540,
        thumbnailUrl: string | null = null,
    ): Promise<string | null> => {
        setLoading(true); setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");
            if (projectId) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const patch: any = { title, fabric_json: fabricJson, updated_at: new Date().toISOString() };
                if (thumbnailUrl) patch.thumbnail_url = thumbnailUrl;
                const { error } = await supabase.from("projects").update(patch)
                    .eq("id", projectId).eq("user_id", user.id);
                if (error) throw error;
                return projectId;
            } else {
                const { data, error } = await supabase.from("projects").insert({
                    user_id: user.id, title, template_id: templateId,
                    fabric_json: fabricJson, format, width, height,
                    thumbnail_url: thumbnailUrl,
                }).select("id").single();
                if (error) throw error;
                return data.id;
            }
        } catch (e: any) { setError(e.message); return null; }
        finally { setLoading(false); }
    }, []);

    const loadProjects = useCallback(async (): Promise<Project[]> => {
        setLoading(true); setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data, error } = await supabase.from("projects").select("*")
                .eq("user_id", user.id).order("updated_at", { ascending: false });
            if (error) throw error;
            return data ?? [];
        } catch (e: any) { setError(e.message); return []; }
        finally { setLoading(false); }
    }, []);

    const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
        setLoading(true); setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");
            const { error } = await supabase.from("projects").delete()
                .eq("id", projectId).eq("user_id", user.id);
            if (error) throw error;
            return true;
        } catch (e: any) { setError(e.message); return false; }
        finally { setLoading(false); }
    }, []);

    return { saveProject, loadProjects, deleteProject, loading, error };
}
