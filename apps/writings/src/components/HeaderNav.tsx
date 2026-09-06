"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import { Locale, i18n } from "@/i18n-config";

import en from "@/dictionaries/en.json";
import id from "@/dictionaries/id.json";
import de from "@/dictionaries/de.json";
import ja from "@/dictionaries/ja.json";
import nl from "@/dictionaries/nl.json";

const navDictionaries: Record<Locale, { home: string; works: string; writings: string }> = {
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
    writings?: string;
  };
}

export function HeaderNav({ lang: initialLang, dict: initialDict }: Props) {
  const searchParams = useSearchParams();

  const queryLang = searchParams?.get("lang") as Locale | null;
  const activeLang: Locale =
    queryLang && (i18n.locales as readonly string[]).includes(queryLang)
      ? queryLang
      : initialLang || i18n.defaultLocale;

  const currentDict = navDictionaries[activeLang] || initialDict || navDictionaries.en;

  const writingsHref = `/${activeLang === "en" ? "" : `?lang=${activeLang}`}`;

  return (
    <nav className="flex items-center gap-6 text-xs font-bold lowercase tracking-tight text-ink select-none">
      <Link href={writingsHref} className="text-brand-900 hover:text-brand-900 transition-colors">
        {(currentDict?.writings || "writings").toLowerCase()}
      </Link>
      <LanguageSwitcher currentLang={activeLang} />
    </nav>
  );
}

export default HeaderNav;
