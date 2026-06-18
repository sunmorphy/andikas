"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "iconoir-react";
import { i18n, Locale } from "@/i18n-config";

import en from "@/dictionaries/en.json";
import id from "@/dictionaries/id.json";
import de from "@/dictionaries/de.json";
import ja from "@/dictionaries/ja.json";
import nl from "@/dictionaries/nl.json";

const dictionaries = { en, id, de, ja, nl };

export default function NotFound() {
    const params = useParams();
    const rawLang = params?.lang;
    const lang: Locale =
        typeof rawLang === "string" && (i18n.locales as readonly string[]).includes(rawLang)
            ? (rawLang as Locale)
            : i18n.defaultLocale;

    const dict = dictionaries[lang].notFound;

    return (
        <section className="container mx-auto px-6 min-h-[70vh] flex flex-col items-center justify-center text-center py-32">
            <div className="relative mb-8 select-none">
                <span className="text-[160px] md:text-[220px] font-black tracking-tighter leading-none text-stroke-outlined text-neutral-900 block">
                    404
                </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight mb-4 text-neutral-900">
                {dict.heading}
            </h1>
            <p className="text-neutral-500 text-lg mb-12 max-w-md leading-relaxed">
                {dict.description}
            </p>

            <Link
                href={`/${lang}`}
                className="group inline-flex items-center gap-2 bg-brand-900 text-neutral-50 text-xs font-bold uppercase tracking-wider rounded-none px-6 py-4 hover:bg-neutral-900 transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                {dict.goHome}
            </Link>
        </section>
    );
}
