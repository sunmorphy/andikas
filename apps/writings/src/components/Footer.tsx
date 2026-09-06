"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Locale, i18n } from "@/i18n-config";
import { siteConfig } from "@/lib/siteConfig";

import en from "@/dictionaries/en.json";
import id from "@/dictionaries/id.json";
import de from "@/dictionaries/de.json";
import ja from "@/dictionaries/ja.json";
import nl from "@/dictionaries/nl.json";

const footerDicts: Record<Locale, { rights: string }> = {
  en: en.footer,
  id: id.footer,
  de: de.footer,
  ja: ja.footer,
  nl: nl.footer,
};

function FooterContent({
  lang: initialLang,
  dict: initialDict,
}: {
  lang: Locale;
  dict?: { rights?: string };
}) {
  const searchParams = useSearchParams();
  const queryLang = searchParams?.get("lang") as Locale | null;
  const activeLang: Locale =
    queryLang && (i18n.locales as readonly string[]).includes(queryLang)
      ? queryLang
      : initialLang || i18n.defaultLocale;

  const currentYear = new Date().getFullYear();
  const currentDict = footerDicts[activeLang] || initialDict || footerDicts.en;
  const rightsText = currentDict?.rights || "andikas. all rights reserved.";
  const homeHref = `/${activeLang === "en" ? "" : `?lang=${activeLang}`}`;

  return (
    <footer className="w-full mt-32 pb-12 pt-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-ink lowercase select-none">
        <Link
          href={homeHref}
          className="hover:text-brand-900 transition-colors underline underline-offset-4 decoration-1"
        >
          {siteConfig.domain}
        </Link>
        <span>© {currentYear} {rightsText.toLowerCase()}</span>
      </div>
    </footer>
  );
}

export default function Footer({
  lang,
  dict,
}: {
  lang: Locale;
  dict?: { rights?: string };
}) {
  return (
    <Suspense fallback={null}>
      <FooterContent lang={lang} dict={dict} />
    </Suspense>
  );
}
