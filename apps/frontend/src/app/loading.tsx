"use client";

import { useSyncExternalStore } from "react";
import { i18n, Locale } from "@/i18n-config";
import en from "@/dictionaries/en.json";
import id from "@/dictionaries/id.json";
import de from "@/dictionaries/de.json";
import ja from "@/dictionaries/ja.json";
import nl from "@/dictionaries/nl.json";

const dictionaries: Record<Locale, typeof en> = { en, id, de, ja, nl };

function getClientLocale(): Locale {
  if (typeof window === "undefined") return i18n.defaultLocale;
  const params = new URLSearchParams(window.location.search);
  const lang = params.get("lang");
  if (lang && (i18n.locales as readonly string[]).includes(lang)) {
    return lang as Locale;
  }
  const match = document.cookie.match(/(^|;)\s*NEXT_LOCALE=([^;]+)/);
  const val = match ? match[2] : null;
  if (val && (i18n.locales as readonly string[]).includes(val)) {
    return val as Locale;
  }
  return i18n.defaultLocale;
}

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getSnapshot(): Locale {
  return getClientLocale();
}

function getServerSnapshot(): Locale {
  return i18n.defaultLocale;
}

export default function Loading() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const loadingText = dictionaries[locale]?.common?.loading || dictionaries.en.common.loading;

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex items-center justify-center select-none">
      <div className="flex items-center gap-2 text-base md:text-xl font-bold tracking-tight text-ink lowercase">
        <span>{loadingText.toLowerCase()}</span>
        <span className="text-brand-900 animate-pulse">/</span>
      </div>
    </div>
  );
}
