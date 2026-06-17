"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type TemplatePublished } from "@/lib/supabase";
import type { Template, TemplateVariant, AudienceId } from "@/data/templates";
import type { FormatId } from "@/data/formats";
import GeneratedEditor from "@/components/editor/GeneratedEditor";
import { useToast } from "@/lib/toast";

/**
 * PublishedTemplateLoader
 *
 * Carga una plantilla publicada de Supabase y la pasa como prop al GeneratedEditor.
 * El editor la trata exactamente como una plantilla normal de data/templates.ts.
 */
type Props = {
  publishedId: string;
  formatId?: FormatId;
};

export default function PublishedTemplateLoader({ publishedId, formatId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("templates_published")
          .select("*")
          .eq("id", publishedId)
          .single();
        if (cancelled) return;
        if (error || !data) {
          toast.error("Plantilla no encontrada.");
          router.push("/templates");
          return;
        }
        const pub = data as TemplatePublished;
        const variants = (pub.variants as TemplateVariant[]) ?? [];
        if (variants.length === 0) {
          toast.error("La plantilla no tiene variantes.");
          router.push("/templates");
          return;
        }

        // Construir un Template object compatible con data/templates.ts
        const tpl: Template = {
          id: -1, // id negativo placeholder, no se usa para nada visible
          title: pub.title,
          category: pub.category,
          image: pub.thumbnail_url ?? "",
          premium: pub.premium,
          audience: pub.audience as AudienceId[],
          internalTags: ["beta"],
          variants,
        };
        setTemplate(tpl);
      } catch (e) {
        console.error("[published-loader]", e);
        if (!cancelled) {
          toast.error("Error cargando la plantilla.");
          router.push("/templates");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [publishedId, router]);

  if (loading || !template) {
    return (
      <div className="fixed inset-0 bg-[#070711] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-sm text-gray-400">Cargando plantilla…</p>
        </div>
      </div>
    );
  }

  // Pasamos el template directo al editor mediante el prop publishedTemplate
  return <GeneratedEditor publishedTemplate={template} formatId={formatId} />;
}
