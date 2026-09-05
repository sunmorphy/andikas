"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import { Locale } from "@/i18n-config";

interface Props {
  lang: Locale;
  dict?: {
    home?: string;
    works?: string;
    projects?: string;
  };
}

export function HeaderNav({ lang, dict }: Props) {
  const pathname = usePathname();
  const isProjects = pathname?.includes("/projects");

  return (
    <nav className="flex items-center gap-6 text-xs font-bold lowercase tracking-tight text-ink select-none">
      <Link
        href={`/${lang}`}
        className={`hover:text-brand-900 transition-colors ${
          !isProjects ? "text-brand-900" : ""
        }`}
      >
        {(dict?.home || "home").toLowerCase()}
      </Link>
      <Link
        href={`/${lang}/projects`}
        className={`hover:text-brand-900 transition-colors ${
          isProjects ? "text-brand-900" : ""
        }`}
      >
        {(dict?.works || "works").toLowerCase()}
      </Link>
      <LanguageSwitcher currentLang={lang} />
    </nav>
  );
}
