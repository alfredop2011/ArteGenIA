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

    /**
     * Duplica un proyecto del usuario. Copia template_id, fabric_json, formato
     * y tamano. Mantiene el thumbnail viejo (se sobrescribe al primer save).
     * El nuevo titulo es "[Original] (copia)" para identificar la version.
     *
     * Driver #1 de creacion N+1 — organizador hace "Bachata Octubre" y
     * reutiliza para "Bachata Noviembre" cambiando solo fecha y artista.
     *
     * Retorna el nuevo project ID o null si fallo.
     */
    const duplicateProject = useCallback(async (projectId: string): Promise<string | null> => {
        setLoading(true); setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");

            // 1. Leer el proyecto original (RLS valida ownership via user_id)
            const { data: original, error: readErr } = await supabase
                .from("projects")
                .select("title, template_id, fabric_json, format, width, height, thumbnail_url")
                .eq("id", projectId).eq("user_id", user.id).single();
            if (readErr || !original) throw readErr ?? new Error("Proyecto no encontrado");

            // 2. Insertar copia. El usuario puede renombrar tras abrir editor.
            const { data: created, error: insertErr } = await supabase
                .from("projects")
                .insert({
                    user_id: user.id,
                    title: `${original.title} (copia)`,
                    template_id: original.template_id,
                    fabric_json: original.fabric_json,
                    format: original.format,
                    width: original.width,
                    height: original.height,
                    thumbnail_url: original.thumbnail_url,
                })
                .select("id").single();
            if (insertErr) throw insertErr;
            return created.id;
        } catch (e: any) { setError(e.message); return null; }
        finally { setLoading(false); }
    }, []);

    return { saveProject, loadProjects, deleteProject, duplicateProject, loading, error };
}
