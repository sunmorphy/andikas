"use client";

import { useParams } from "next/navigation";
import { i18n, Locale } from "@/i18n-config";
import en from "@/dictionaries/en.json";
import id from "@/dictionaries/id.json";
import de from "@/dictionaries/de.json";
import ja from "@/dictionaries/ja.json";
import nl from "@/dictionaries/nl.json";

const dictionaries = { en, id, de, ja, nl };

export default function Loading() {
  const params = useParams();
  const rawLang = params?.lang;
  const lang: Locale =
    typeof rawLang === "string" && (i18n.locales as readonly string[]).includes(rawLang)
      ? (rawLang as Locale)
      : i18n.defaultLocale;

  const loadingText = dictionaries[lang]?.common?.loading || "loading";

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex items-center justify-center select-none">
      <div className="flex items-center gap-2 text-base md:text-xl font-bold tracking-tight text-ink lowercase">
        <span>{loadingText.toLowerCase()}</span>
        <span className="text-brand-900 animate-pulse">/</span>
      </div>
    </div>
  );
}
