import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Profile = {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    plan: "free" | "pro" | "enterprise";
    credits: number;
    created_at: string;
};

export type Project = {
    id: string;
    user_id: string;
    title: string;
    template_id: number | null;
    fabric_json: object | null;
    thumbnail_url: string | null;
    format: string;
    width: number;
    height: number;
    created_at: string;
    updated_at: string;
};
