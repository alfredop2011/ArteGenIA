"use client";
import { useLocale } from "@/hooks/useLocale";

export default function HistoryPage() {
    const { t } = useLocale();
    return (
        <section className="mx-auto max-w-7xl px-6 py-8">
            <h1 className="text-3xl font-bold">{t("history.title")}</h1>
            <p className="mt-2 text-gray-400">
                {t("history.body")}
            </p>
        </section>
    );
}
