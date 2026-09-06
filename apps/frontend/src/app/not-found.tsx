"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
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

export default function NotFound() {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const notFoundDict = dictionaries[locale]?.notFound || dictionaries.en.notFound;
  const homeHref = locale === "en" ? "/" : `/?lang=${locale}`;
  const rawHeading = notFoundDict.heading || "page not found";
  const cleanHeading = rawHeading.replace(/[.。]+$/, "");

  return (
    <section className="w-full max-w-7xl mx-auto px-6 md:px-12 min-h-[70vh] flex flex-col items-center justify-center text-center select-none py-24">
      {/* Big Swiss 404 with vermillion slash */}
      <div className="mb-4">
        <span className="text-[90px] sm:text-[130px] md:text-[180px] font-bold tracking-tighter text-ink leading-none">
          404 <span className="text-brand-900 font-bold">/</span>
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter text-ink lowercase mb-3">
        {cleanHeading.toLowerCase()}
      </h1>

      {/* Description */}
      <p className="text-xs md:text-sm text-ink-muted lowercase max-w-md leading-relaxed mb-10 font-normal">
        {notFoundDict.description?.toLowerCase()}
      </p>

      {/* Back to Home Link in Swiss style */}
      <Link
        href={homeHref}
        className="text-sm md:text-base font-medium text-ink lowercase underline underline-offset-4 decoration-1 hover:text-brand-900 hover:decoration-brand-900 transition-colors"
      >
        ← {notFoundDict.goHome?.toLowerCase()}
      </Link>
    </section>
  );
}
