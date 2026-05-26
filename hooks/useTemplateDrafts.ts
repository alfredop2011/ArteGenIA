"use client";
import { useState, useCallback } from "react";
import { supabase, type TemplateDraft, type TemplatePublished } from "@/lib/supabase";

/**
 * Hook para gestionar plantillas en modo admin (creador):
 *   - listDrafts(): lista mis borradores
 *   - saveDraft(): crea o actualiza un borrador
 *   - deleteDraft(): elimina borrador
 *   - publishDraft(): mueve borrador a templates_published
 *   - listPublished(): lista plantillas publicadas (publico)
 *
 * Las verificaciones de admin se hacen a nivel pagina (lib/admin.ts).
 * RLS de Supabase ya restringe lectura/escritura a auth.uid().
 */
export function useTemplateDrafts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── DRAFTS ─────────────────────────────────────────────────────────────
  const listDrafts = useCallback(async (): Promise<TemplateDraft[]> => {
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("templates_draft")
        .select("*")
        .eq("created_by", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TemplateDraft[];
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return [];
    } finally { setLoading(false); }
  }, []);

  const getDraft = useCallback(async (id: string): Promise<TemplateDraft | null> => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase
        .from("templates_draft")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as TemplateDraft;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    } finally { setLoading(false); }
  }, []);

  const saveDraft = useCallback(async (
    draftId: string | null,
    payload: Partial<Omit<TemplateDraft, "id" | "created_by" | "created_at" | "updated_at">>,
  ): Promise<string | null> => {
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      if (draftId) {
        const { error } = await supabase.from("templates_draft")
          .update(payload)
          .eq("id", draftId)
          .eq("created_by", user.id);
        if (error) throw error;
        return draftId;
      } else {
        const { data, error } = await supabase.from("templates_draft")
          .insert({ ...payload, created_by: user.id })
          .select("id")
          .single();
        if (error) throw error;
        return data.id as string;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    } finally { setLoading(false); }
  }, []);

  const deleteDraft = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.from("templates_draft").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return false;
    } finally { setLoading(false); }
  }, []);

  // ─── PUBLISH ────────────────────────────────────────────────────────────
  const publishDraft = useCallback(async (draftId: string): Promise<string | null> => {
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Cargar el draft
      const draft = await getDraft(draftId);
      if (!draft) throw new Error("Borrador no encontrado");

      // Insert en templates_published (mismo schema + draft_id + published_by)
      const { data, error } = await supabase.from("templates_published").insert({
        draft_id: draft.id,
        title: draft.title,
        category: draft.category,
        audience: draft.audience,
        internal_tags: draft.internal_tags,
        premium: draft.premium,
        variants: draft.variants,
        thumbnail_url: draft.thumbnail_url,
        published_by: user.id,
      }).select("id").single();
      if (error) throw error;

      // Marcar draft como archived (queda en historial)
      await supabase.from("templates_draft")
        .update({ status: "archived" })
        .eq("id", draftId);

      return data.id as string;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    } finally { setLoading(false); }
  }, [getDraft]);

  // ─── PUBLISHED (lectura publica) ────────────────────────────────────────
  const listPublished = useCallback(async (): Promise<TemplatePublished[]> => {
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase
        .from("templates_published")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TemplatePublished[];
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return [];
    } finally { setLoading(false); }
  }, []);

  const unpublish = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.from("templates_published").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return false;
    } finally { setLoading(false); }
  }, []);

  return {
    loading, error,
    // drafts
    listDrafts, getDraft, saveDraft, deleteDraft,
    // publish
    publishDraft, listPublished, unpublish,
  };
}
