"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Translate } from "iconoir-react";
import { Locale, i18n } from "@/i18n-config";
import { cn } from "@/lib/utils";

const languageNames: Record<Locale, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  de: "Deutsch",
  ja: "日本語",
  nl: "Nederlands",
};

function setLocaleCookie(locale: Locale) {
  if (typeof document !== "undefined") {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

export default function LanguageSwitcher({ currentLang }: { currentLang: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLanguage = (locale: Locale) => {
    setIsOpen(false);
    if (currentLang === locale) return;

    setLocaleCookie(locale);

    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (locale === i18n.defaultLocale) {
      params.delete("lang");
    } else {
      params.set("lang", locale);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    router.push(`${pathname}${query}`);
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Toggle language"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 w-8 inline-flex items-center justify-center text-ink hover:text-brand-900 transition-colors cursor-pointer",
          isOpen && "bg-neutral-200"
        )}
      >
        <Translate className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-neutral-300 rounded-none shadow-lg z-50 overflow-hidden py-2">
          <div className="flex flex-col">
            {(Object.keys(languageNames) as Locale[]).map((locale) => (
              <button
                key={locale}
                onClick={() => switchLanguage(locale)}
                className={cn(
                  "w-full text-left px-5 py-2.5 text-xs lowercase hover:bg-neutral-200 transition-colors cursor-pointer",
                  currentLang === locale
                    ? "font-bold text-brand-900 bg-neutral-100"
                    : "text-ink"
                )}
              >
                {languageNames[locale].toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
