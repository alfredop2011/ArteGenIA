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

      // Si el draft reemplaza una published anterior (tag "replaces:{uuid}"),
      // borramos la published vieja antes de insertar la nueva.
      const replacesTag = (draft.internal_tags ?? []).find(t => t.startsWith("replaces:"));
      const replacesPublishedId = replacesTag ? replacesTag.slice("replaces:".length) : null;

      // Filtrar el tag de internal antes de copiar a published (no contamina)
      const cleanTags = (draft.internal_tags ?? []).filter(t => !t.startsWith("replaces:"));

      // Insert en templates_published (mismo schema + draft_id + published_by)
      const { data, error } = await supabase.from("templates_published").insert({
        draft_id: draft.id,
        title: draft.title,
        category: draft.category,
        audience: draft.audience,
        internal_tags: cleanTags,
        premium: draft.premium,
        variants: draft.variants,
        thumbnail_url: draft.thumbnail_url,
        published_by: user.id,
      }).select("id").single();
      if (error) throw error;

      // Si reemplaza una published anterior, borrarla AHORA (despues del insert exitoso)
      if (replacesPublishedId) {
        const { error: delErr } = await supabase.from("templates_published")
          .delete()
          .eq("id", replacesPublishedId);
        if (delErr) {
          console.warn("[publishDraft] No se pudo borrar published anterior:", delErr.message);
          // No fallamos toda la operacion - la nueva ya esta publicada
        }
      }

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

  /**
   * Crea un nuevo draft copiando los datos de una published existente.
   * Anade tag "replaces:{publishedId}" en internal_tags para que cuando
   * el nuevo draft se publique, se borre la published vieja (asi parece
   * una "edicion" en lugar de duplicar).
   *
   * Devuelve el id del draft nuevo o null si falla.
   */
  const createDraftFromPublished = useCallback(async (publishedId: string): Promise<string | null> => {
    setLoading(true); setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      // Cargar la published origen
      const { data: pubData, error: pubErr } = await supabase
        .from("templates_published")
        .select("*")
        .eq("id", publishedId)
        .single();
      if (pubErr || !pubData) throw new Error(pubErr?.message || "Published no encontrada");
      const pub = pubData as TemplatePublished;

      // Crear draft nuevo copia de los datos + tag replaces
      const { data, error } = await supabase.from("templates_draft").insert({
        title: pub.title,
        category: pub.category,
        audience: pub.audience,
        internal_tags: [...(pub.internal_tags ?? []).filter(t => !t.startsWith("replaces:")), `replaces:${publishedId}`],
        premium: pub.premium,
        variants: pub.variants,
        thumbnail_url: pub.thumbnail_url,
        status: "draft",
        created_by: user.id,
      }).select("id").single();
      if (error) throw error;

      return data.id as string;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    } finally { setLoading(false); }
  }, []);

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
    // editar published existente (sesion 3 creador)
    createDraftFromPublished,
  };
}
