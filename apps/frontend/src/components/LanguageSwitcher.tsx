"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Translate } from "iconoir-react";
import { Button } from "./ui/Button";
import { Locale } from "@/i18n-config";
import { cn } from "@/lib/utils";

const languageNames: Record<Locale, string> = {
    en: "English",
    id: "Bahasa Indonesia",
    de: "Deutsch",
    ja: "日本語",
    nl: "Nederlands"
};

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

        // pathname starts with `/${currentLang}` 
        // Example: /en/projects -> /id/projects
        const segments = pathname.split('/');
        segments[1] = locale; // Assuming the first path segment is always the locale due to middleware
        const newPath = segments.join('/');

        router.push(newPath);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="icon"
                size="icon"
                aria-label="Toggle language"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(isOpen && "bg-neutral-200")}
            >
                <Translate className="w-4 h-4" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-neutral-200 rounded-none shadow-none z-50 overflow-hidden py-2">
                    {/* Reverting to a simple absolute list for reliable clicking */}
                    <div className="flex flex-col">
                        {(Object.keys(languageNames) as Locale[]).map((locale) => (
                            <button
                                key={locale}
                                onClick={() => switchLanguage(locale)}
                                className={cn(
                                    "w-full text-left px-5 py-3 text-sm hover:bg-neutral-100 transition-colors",
                                    currentLang === locale ? "font-bold text-neutral-900 bg-neutral-50" : "text-neutral-600"
                                )}
                            >
                                {languageNames[locale]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Standard Dropdown visible always if we remove hidden logic, but wait, the Button toggles isOpen state above. Let's make it visible on mobile and desktop via `isOpen`. I'll remove `hidden md:block group-hover:block` -> these were just from previous styling thoughts. */}
        </div>
    );
}
