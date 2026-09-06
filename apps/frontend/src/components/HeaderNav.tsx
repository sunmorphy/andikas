"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import { Locale, i18n } from "@/i18n-config";

import en from "@/dictionaries/en.json";
import id from "@/dictionaries/id.json";
import de from "@/dictionaries/de.json";
import ja from "@/dictionaries/ja.json";
import nl from "@/dictionaries/nl.json";

const navDictionaries: Record<Locale, { home: string; works: string; writings: string; projects?: string }> = {
  en: en.nav,
  id: id.nav,
  de: de.nav,
  ja: ja.nav,
  nl: nl.nav,
};

interface Props {
  lang: Locale;
  dict?: {
    home?: string;
    works?: string;
    projects?: string;
    writings?: string;
  };
}

export function HeaderNav({ lang: initialLang, dict: initialDict }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isProjects = pathname?.includes("/projects");

  const queryLang = searchParams?.get("lang") as Locale | null;
  const activeLang: Locale =
    queryLang && (i18n.locales as readonly string[]).includes(queryLang)
      ? queryLang
      : initialLang || i18n.defaultLocale;

  const currentDict = navDictionaries[activeLang] || initialDict || navDictionaries.en;

  const homeHref = `/${activeLang === "en" ? "" : `?lang=${activeLang}`}`;
  const worksHref = `/projects${activeLang === "en" ? "" : `?lang=${activeLang}`}`;

  return (
    <nav className="flex items-center gap-6 text-xs font-bold lowercase tracking-tight text-ink select-none">
      <Link
        href={homeHref}
        className={`hover:text-brand-900 transition-colors ${
          !isProjects ? "text-brand-900" : ""
        }`}
      >
        {(currentDict?.home || "home").toLowerCase()}
      </Link>
      <Link
        href={worksHref}
        className={`hover:text-brand-900 transition-colors ${
          isProjects ? "text-brand-900" : ""
        }`}
      >
        {(currentDict?.works || "works").toLowerCase()}
      </Link>
      <LanguageSwitcher currentLang={activeLang} />
    </nav>
  );
}
