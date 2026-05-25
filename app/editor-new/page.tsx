"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GeneratedEditor from "@/components/editor/GeneratedEditor";
import MobileEditorWarning from "@/components/editor/MobileEditorWarning";

type GeneratedData = {
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventPrice: string;
  artistPhotoUrl: string | null;
  bgUrl?: string;
  bgWidth?: number;
  bgHeight?: number;
  palette: { colors: string[]; label: string };
  style: string;
  format: string;
  generatedAt: string;
};

export default function EditorNewPage() {
  const router = useRouter();
  const [data, setData] = useState<GeneratedData | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("artegenia_generated");
      if (raw) {
        setData(JSON.parse(raw));
      } else {
        router.replace("/create");
      }
    } catch {
      router.replace("/create");
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0a0a18] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;
  return <MobileEditorWarning><GeneratedEditor /></MobileEditorWarning>;
}
